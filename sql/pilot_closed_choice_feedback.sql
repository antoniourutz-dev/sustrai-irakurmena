CREATE OR REPLACE FUNCTION smx_private.smx_aditzak_pilot_review_attempt(p_attempt_id uuid)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO ''
AS $function$
DECLARE
  v_user_id uuid := (SELECT auth.uid());
  v_version uuid;
  v_activity uuid;
  v_key jsonb;
  v_item jsonb;
  v_results jsonb := '[]'::jsonb;
  v_count int := 0;
  v_correct int := 0;
  v_incorrect int := 0;
  v_review int := 0;
  v_nonobjective int := 0;
  v_reference text;
  v_explanation text;
  v_response text;
  v_outcome text;
  v_feedback text;
  v_match boolean;
  v_choice_valid boolean;
  v_scoped boolean := false;
  v_has_answers boolean;
  r record;
BEGIN
  IF v_user_id IS NULL OR p_attempt_id IS NULL THEN
    RAISE EXCEPTION 'Saioa hasi behar duzu' USING ERRCODE='42501';
  END IF;

  -- Every request is tied to its real owner, a draft, and the authorized pilot.
  SELECT a.activity_version_id, av.activity_id INTO v_version, v_activity
  FROM public.smx_attempts a
  JOIN public.smx_activity_versions av ON av.id=a.activity_version_id
  WHERE a.id=p_attempt_id AND a.user_id=v_user_id AND av.status='draft'
  FOR UPDATE OF a;
  IF NOT FOUND OR NOT public.smx_aditzak_pilot_access(v_version) THEN
    RAISE EXCEPTION 'Saiakera ez dago erabilgarri' USING ERRCODE='42501';
  END IF;

  SELECT expected_json INTO v_key
  FROM smx_private.answer_keys
  WHERE activity_version_id=v_version;
  IF v_key IS NULL OR v_key->>'status'<>'draft_unverified' THEN
    RAISE EXCEPTION 'Berrikuspenerako gakorik ez' USING ERRCODE='42501';
  END IF;

  -- Conservative rollout: only the five units with item-level editorial audits.
  SELECT EXISTS(
    SELECT 1 FROM public.smx_exercise_activity_links l
    WHERE l.activity_id=v_activity
      AND l.section_code IN ('B2-ADI-07','B2-ADI-08','B2-ADI-09','B2-ADI-10','B2-ADI-11')
  ) INTO v_scoped;

  FOR r IN
    SELECT resp.id AS response_id, i.position, resp.raw_response,
           i.response_kind, i.mechanism_code, i.public_payload
    FROM public.smx_attempt_responses resp
    JOIN public.smx_activity_items i
      ON i.id=resp.item_id AND i.activity_version_id=resp.activity_version_id
    WHERE resp.attempt_id=p_attempt_id AND resp.activity_version_id=v_version
    ORDER BY i.position,resp.attempt_no,resp.submitted_at,resp.id
  LOOP
    v_count:=v_count+1;
    IF v_count>100 THEN
      RAISE EXCEPTION 'Saiakera luzeegia da' USING ERRCODE='22023';
    END IF;

    v_item:=NULL; v_reference:=NULL; v_explanation:=NULL;
    v_response:=NULL; v_outcome:='needs_review'; v_match:=false;
    v_choice_valid:=false; v_has_answers:=false;
    v_feedback:='Zure erantzuna ereduarekin alderatzeko gordeta dago.';

    IF jsonb_typeof(v_key->'items')='array' THEN
      SELECT e.value INTO v_item
      FROM jsonb_array_elements(v_key->'items') e(value)
      WHERE e.value->>'position'=r.position::text LIMIT 1;
    END IF;
    IF v_item IS NOT NULL THEN
      v_explanation:=NULLIF(btrim(v_item->>'explanation_eu'),'');
      v_has_answers := jsonb_typeof(v_item->'accepted_answers')='array'
        AND jsonb_array_length(
          CASE WHEN jsonb_typeof(v_item->'accepted_answers')='array'
               THEN v_item->'accepted_answers' ELSE '[]'::jsonb END
        )>0;
      IF v_has_answers AND r.response_kind IN ('short_text','single_choice') THEN
        v_reference:=v_item->'accepted_answers'->>0;
      END IF;
    END IF;

    IF r.response_kind='single_choice' THEN
      v_response:=r.raw_response->>'option';
      IF jsonb_typeof(r.public_payload->'choices')='array'
         AND v_response IS NOT NULL THEN
        SELECT EXISTS(SELECT 1
          FROM jsonb_array_elements_text(r.public_payload->'choices') c(value)
          WHERE c.value=v_response) INTO v_choice_valid;
      END IF;
    ELSIF r.response_kind='short_text' THEN
      v_response:=r.raw_response->>'text';
    END IF;

    IF (v_scoped OR (r.mechanism_code='E03' AND r.response_kind='single_choice'))
       AND v_has_answers AND v_response IS NOT NULL
       AND length(btrim(v_response)) BETWEEN 1 AND 2000
       AND (r.response_kind='short_text' OR v_choice_valid)
    THEN
      SELECT EXISTS(
        SELECT 1 FROM jsonb_array_elements_text(v_item->'accepted_answers') ans(value)
        WHERE smx_private.smx_normalize_answer(ans.value,r.response_kind='short_text') =
              smx_private.smx_normalize_answer(v_response,r.response_kind='short_text')
      ) INTO v_match;

      IF r.mechanism_code='E03' AND r.response_kind='single_choice'
         AND COALESCE((v_item->>'review_required')::boolean,false)=false THEN
        v_outcome:=CASE WHEN v_match THEN 'correct' ELSE 'incorrect' END;
      ELSIF r.mechanism_code='E02' AND r.response_kind='short_text'
         AND COALESCE((v_item->>'review_required')::boolean,false)=false THEN
        v_outcome:=CASE WHEN v_match THEN 'correct' ELSE 'incorrect' END;
      ELSIF r.mechanism_code IN ('E04','E05','E09')
         AND r.response_kind='short_text' AND v_match THEN
        -- A known matching draft variant may be affirmed, but an unseen variant
        -- can never be declared incorrect by a finite answer list.
        v_outcome:='correct';
      END IF;
    END IF;

    v_feedback:=CASE v_outcome
      WHEN 'correct' THEN 'Zure erantzuna ariketako erreferentzia-eredu batekin bat dator.'
      WHEN 'incorrect' THEN 'Erantzuna ez dator bat ariketa objektibo honetako gakoarekin.'
      ELSE 'Ez da epai automatiko itxirik eman; beste aldaera bat ere izan daiteke zuzena.'
    END;

    IF r.mechanism_code IS NULL OR r.mechanism_code NOT IN ('E02','E03') THEN v_nonobjective:=v_nonobjective+1; END IF;
    IF v_outcome='correct' THEN v_correct:=v_correct+1;
    ELSIF v_outcome='incorrect' THEN v_incorrect:=v_incorrect+1;
    ELSE v_review:=v_review+1;
    END IF;

    v_results:=v_results||jsonb_build_array(jsonb_build_object(
      'response_id',r.response_id,
      'position',r.position,
      'outcome',v_outcome,
      'feedback_eu',v_feedback,
      'details',jsonb_build_object(
        'pilot_unvalidated',true,
        'pilot_reference_answer_eu',v_reference,
        'pilot_accepted_answers_eu',
          CASE WHEN v_reference IS NOT NULL AND v_has_answers
               THEN v_item->'accepted_answers' ELSE '[]'::jsonb END,
        'explanation_eu',v_explanation,
        'requires_academic_validation',true
      )
    ));
  END LOOP;
  IF v_count=0 THEN
    RAISE EXCEPTION 'Ez dago gordetako erantzunik' USING ERRCODE='22023';
  END IF;
  RETURN jsonb_build_object(
    'attempt_id',p_attempt_id,
    'pilot',true,
    'evaluator','draft-reference-v3-closed-choice',
    'results',v_results,
    'summary',jsonb_build_object(
      'answered',v_count,
      'correct',v_correct,
      'incorrect',v_incorrect,
      'needs_review',v_review,
      'fully_objective',v_review=0 AND v_nonobjective=0,
      'official_exam_grade',false
    )
  );
END;
$function$

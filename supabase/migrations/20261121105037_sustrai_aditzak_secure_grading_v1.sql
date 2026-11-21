-- Applied remotely as Supabase migration 20261121105037.
-- Scope: original learner answers, audited private keys, deterministic E02/E03
-- feedback and per-user progress. Do not change editorial approval statuses.

CREATE UNIQUE INDEX IF NOT EXISTS smx_evaluation_runs_response_rule_uq
ON public.smx_evaluation_runs(response_id,evaluator_version);

CREATE OR REPLACE FUNCTION smx_private.grade_attempt_v1(p_attempt_id uuid)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO ''
AS $function$
DECLARE
  v_uid uuid := (SELECT auth.uid());
  v_activity_version uuid;
  v_approved boolean := false;
  v_key jsonb := '{}'::jsonb;
  v_key_validated boolean := false;
  v_rule text;
  v_answer jsonb;
  v_response text;
  v_outcome text;
  v_explanation text;
  v_feedback text;
  v_solution text;
  v_payload jsonb;
  v_results jsonb := '[]'::jsonb;
  v_total int := 0;
  v_correct int := 0;
  v_incorrect int := 0;
  v_review int := 0;
  v_evaluation_id uuid;
  v_existing uuid;
  r record;
BEGIN
  IF p_attempt_id IS NULL OR v_uid IS NULL THEN
    RAISE EXCEPTION 'Saioa hasi behar duzu' USING ERRCODE='42501';
  END IF;

  -- SERIALIZE competing grading requests and reject IDOR.
  SELECT a.activity_version_id,
    (av.status='approved'
     AND av.linguistic_ok AND av.factual_ok AND av.pedagogical_ok AND av.traceability_ok
     AND (av.node_version_id IS NOT NULL
        OR EXISTS(SELECT 1 FROM public.smx_pill_steps ps
                  WHERE ps.activity_version_id=av.id)))
  INTO v_activity_version,v_approved
  FROM public.smx_attempts a
  JOIN public.smx_activity_versions av ON av.id=a.activity_version_id
  WHERE a.id=p_attempt_id AND a.user_id=v_uid
  FOR UPDATE OF a;

  IF NOT FOUND OR NOT v_approved THEN
    RAISE EXCEPTION 'Saiakera ez dago erabilgarri'
      USING ERRCODE='42501';
  END IF;

  SELECT k.expected_json INTO v_key
  FROM smx_private.answer_keys k
  WHERE k.activity_version_id=v_activity_version;
  v_key := COALESCE(v_key,'{}'::jsonb);
  v_key_validated := v_key->>'status'='validated';

  -- A changed verified answer key gets its own result revision.
  v_rule := 'smx-e02e03-v1-'||substr(md5(v_key::text),1,20);

  FOR r IN
    SELECT ar.id AS response_id,ar.raw_response,
           i.position,i.mechanism_code,i.response_kind,i.public_payload
    FROM public.smx_attempt_responses ar
    JOIN public.smx_activity_items i
      ON i.id=ar.item_id AND i.activity_version_id=ar.activity_version_id
    WHERE ar.attempt_id=p_attempt_id AND ar.activity_version_id=v_activity_version
    ORDER BY i.position,ar.attempt_no,ar.submitted_at,ar.id
  LOOP
    v_total := v_total + 1;
    IF v_total > 150 THEN
      RAISE EXCEPTION 'Saiakera luzeegia da' USING ERRCODE='22023';
    END IF;
    v_answer := NULL;
    v_solution := NULL;
    v_explanation := NULL;
    v_response := NULL;

    IF jsonb_typeof(v_key->'items')='array' THEN
      SELECT element INTO v_answer
      FROM jsonb_array_elements(v_key->'items') element
      WHERE element->>'position'=r.position::text LIMIT 1;
    END IF;

    IF r.mechanism_code='E02' AND r.response_kind='short_text' THEN
      v_response := r.raw_response->>'text';
    ELSIF r.mechanism_code='E03' AND r.response_kind='single_choice' THEN
      v_response := r.raw_response->>'option';
    END IF;

    v_outcome := 'needs_review';
    v_feedback := 'Erantzuna gordeta. Jarduera honek berrikuspen akademikoa behar du.';

    IF v_key_validated
       AND r.mechanism_code IN ('E02','E03')
       AND v_answer IS NOT NULL
       AND COALESCE((v_answer->>'review_required')::boolean,false)=false
       AND jsonb_typeof(v_answer->'accepted_answers')='array'
       AND jsonb_array_length(v_answer->'accepted_answers')>0
       AND v_response IS NOT NULL
       AND length(btrim(v_response)) BETWEEN 1 AND 2000
       AND (
          r.mechanism_code='E02'
          OR EXISTS(
             SELECT 1 FROM jsonb_array_elements_text(
                CASE WHEN jsonb_typeof(r.public_payload->'choices')='array'
                THEN r.public_payload->'choices' ELSE '[]'::jsonb END
             ) c WHERE c=v_response
          )
       )
    THEN
      SELECT EXISTS (
        SELECT 1 FROM jsonb_array_elements_text(v_answer->'accepted_answers') acceptable
        WHERE lower(btrim(regexp_replace(acceptable,'[[:space:]]+',' ','g'))) =
              lower(btrim(regexp_replace(v_response,'[[:space:]]+',' ','g')))
      ) INTO v_approved;
      v_outcome := CASE WHEN v_approved THEN 'correct' ELSE 'incorrect' END;
      v_solution := v_answer->'accepted_answers'->>0;
      v_explanation := NULLIF(btrim(v_answer->>'explanation_eu'),'');
      v_feedback := CASE WHEN v_approved
        THEN 'Egiaztatutako erantzunarekin bat dator.'
        ELSE 'Erantzuna ez dator bat ariketa honetarako egiaztatutako gakoarekin.' END;
    END IF;

    v_payload := jsonb_build_object(
      'criterion','gako_egiaztatua',
      'mechanism',r.mechanism_code,
      'explanation_eu',v_explanation,
      'accepted_answer_eu',CASE WHEN v_outcome IN('correct','incorrect') THEN v_solution ELSE NULL END
    );

    SELECT er.id INTO v_existing
    FROM public.smx_evaluation_runs er
    WHERE er.response_id=r.response_id AND er.evaluator_version=v_rule
    LIMIT 1;

    IF v_existing IS NULL THEN
      INSERT INTO public.smx_evaluation_runs
        (response_id,evaluator_kind,evaluator_version,outcome,certainty,
         feedback_eu,feedback_public,supersedes_run_id)
      VALUES
        (r.response_id,'deterministic',v_rule,v_outcome,
         CASE WHEN v_outcome IN ('correct','incorrect') THEN 'high' ELSE 'not_assessed' END,
         v_feedback,v_payload,
         (SELECT er.id FROM public.smx_evaluation_runs er WHERE er.response_id=r.response_id
          ORDER BY er.created_at DESC,er.id DESC LIMIT 1))
      ON CONFLICT (response_id,evaluator_version) DO NOTHING
      RETURNING id INTO v_evaluation_id;
    END IF;

    -- Return persisted verdict only (idempotent retry).
    SELECT er.outcome,er.feedback_eu,er.feedback_public
    INTO v_outcome,v_feedback,v_payload
    FROM public.smx_evaluation_runs er
    WHERE er.response_id=r.response_id AND er.evaluator_version=v_rule;

    IF v_outcome='correct' THEN v_correct:=v_correct+1;
    ELSIF v_outcome='incorrect' THEN v_incorrect:=v_incorrect+1;
    ELSE v_review:=v_review+1;
    END IF;

    v_results := v_results || jsonb_build_array(jsonb_build_object(
      'response_id',r.response_id,
      'position',r.position,
      'outcome',v_outcome,
      'feedback_eu',v_feedback,
      'details',v_payload
    ));
    v_existing:=NULL;
    v_evaluation_id:=NULL;
  END LOOP;

  IF v_total=0 THEN
    RAISE EXCEPTION 'Erantzunik ez dago gordeta' USING ERRCODE='22023';
  END IF;

  RETURN jsonb_build_object(
    'attempt_id',p_attempt_id,
    'evaluator',v_rule,
    'results',v_results,
    'summary',jsonb_build_object(
      'answered',v_total,
      'correct',v_correct,
      'incorrect',v_incorrect,
      'needs_review',v_review,
      'fully_objective',v_review=0,
      'official_exam_grade',false
    )
  );
END;
$function$


CREATE OR REPLACE FUNCTION public.smx_grade_attempt(p_attempt_id uuid)
 RETURNS jsonb
 LANGUAGE sql
 SET search_path TO ''
AS $function$
  SELECT smx_private.grade_attempt_v1(p_attempt_id)
$function$


CREATE OR REPLACE FUNCTION public.smx_my_practice_progress()
 RETURNS TABLE(activity_version_id uuid, attempt_count bigint, latest_attempt_at timestamp with time zone)
 LANGUAGE sql
 STABLE
 SET search_path TO ''
AS $function$
  SELECT a.activity_version_id, count(*)::bigint, max(a.created_at)
  FROM public.smx_attempts a
  WHERE a.user_id=(SELECT auth.uid())
  GROUP BY a.activity_version_id
  ORDER BY max(a.created_at) DESC
  LIMIT 1000
$function$


REVOKE ALL ON FUNCTION smx_private.grade_attempt_v1(uuid) FROM PUBLIC,anon,authenticated;
REVOKE ALL ON FUNCTION public.smx_grade_attempt(uuid) FROM PUBLIC,anon,authenticated;
REVOKE ALL ON FUNCTION public.smx_my_practice_progress() FROM PUBLIC,anon,authenticated;

GRANT USAGE ON SCHEMA smx_private TO authenticated;
GRANT EXECUTE ON FUNCTION smx_private.grade_attempt_v1(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.smx_grade_attempt(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.smx_my_practice_progress() TO authenticated;

COMMENT ON FUNCTION public.smx_grade_attempt(uuid) IS
'RPC: grades owned attempts against verified private answer keys, never drafts; open responses stay needs_review. Results are non-official.';
COMMENT ON FUNCTION public.smx_my_practice_progress() IS
'RLS-respecting simple counts of a student own attempts. Not an official exam score.';

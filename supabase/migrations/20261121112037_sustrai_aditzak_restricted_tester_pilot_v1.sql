-- Supabase migration already deployed as 20261121112037.
-- Preview-only B2 pilot with a separate allowlist and controlled access to draft version 2.
-- Nothing in this file changes academic approval or validated private grading keys.

CREATE TABLE IF NOT EXISTS public.smx_aditzak_pilot_members (
 user_id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
 enabled boolean NOT NULL DEFAULT true,
 member_role text NOT NULL DEFAULT 'tester' CHECK (member_role IN ('tester','reviewer')),
 enrolled_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
 enrolled_at timestamptz NOT NULL DEFAULT now(),
 changed_at timestamptz NOT NULL DEFAULT now()
);
CREATE TABLE IF NOT EXISTS public.smx_aditzak_pilot_releases (
 activity_version_id uuid PRIMARY KEY REFERENCES public.smx_activity_versions(id) ON DELETE RESTRICT,
 active boolean NOT NULL DEFAULT true,
 phase text NOT NULL DEFAULT 'testing' CHECK (phase='testing'),
 released_at timestamptz NOT NULL DEFAULT now(),
 release_note_eu text NOT NULL DEFAULT 'Probalarientzako behin-behineko edukia. Ez dago akademikoki egiaztatuta.'
);
CREATE TABLE IF NOT EXISTS public.smx_aditzak_pilot_findings (
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
 user_id uuid NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE CASCADE,
 activity_version_id uuid NOT NULL REFERENCES public.smx_activity_versions(id) ON DELETE RESTRICT,
 item_id uuid NULL,
 attempt_id uuid NULL REFERENCES public.smx_attempts(id) ON DELETE SET NULL,
 category text NOT NULL CHECK(category IN('arau_akatsa','aldaera_onargarria','erantzun_proposatua','azalpena','zailtasuna','erabilgarritasuna','teknikoa','bestelakoa')),
 priority text NOT NULL DEFAULT 'normal' CHECK(priority IN('low','normal','high','blocking')),
 comment_eu text NOT NULL CHECK(length(btrim(comment_eu)) BETWEEN 5 AND 3000),
 suggested_text text NULL CHECK(suggested_text IS NULL OR length(suggested_text)<=2000),
 status text NOT NULL DEFAULT 'new' CHECK(status IN('new','triaged','accepted','rejected','resolved')),
 created_at timestamptz NOT NULL DEFAULT now(),
 CONSTRAINT smx_aditzak_pilot_findings_item_fk FOREIGN KEY (item_id,activity_version_id)
 REFERENCES public.smx_activity_items(id,activity_version_id) ON DELETE RESTRICT
);

CREATE INDEX IF NOT EXISTS smx_aditzak_pilot_findings_version_idx
 ON public.smx_aditzak_pilot_findings(activity_version_id,created_at DESC);
CREATE INDEX IF NOT EXISTS smx_aditzak_pilot_findings_user_idx
 ON public.smx_aditzak_pilot_findings(user_id,created_at DESC);
CREATE INDEX IF NOT EXISTS smx_aditzak_pilot_findings_attempt_idx
 ON public.smx_aditzak_pilot_findings(attempt_id);
CREATE INDEX IF NOT EXISTS smx_aditzak_pilot_findings_item_version_idx
 ON public.smx_aditzak_pilot_findings(item_id,activity_version_id) WHERE item_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS smx_aditzak_pilot_members_enrolled_by_idx
 ON public.smx_aditzak_pilot_members(enrolled_by) WHERE enrolled_by IS NOT NULL;

ALTER TABLE public.smx_aditzak_pilot_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.smx_aditzak_pilot_releases ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.smx_aditzak_pilot_findings ENABLE ROW LEVEL SECURITY;

REVOKE ALL ON public.smx_aditzak_pilot_members,public.smx_aditzak_pilot_releases,public.smx_aditzak_pilot_findings
 FROM PUBLIC,anon,authenticated;
GRANT SELECT ON public.smx_aditzak_pilot_members,public.smx_aditzak_pilot_releases TO authenticated;
GRANT SELECT,INSERT ON public.smx_aditzak_pilot_findings TO authenticated;
GRANT ALL ON public.smx_aditzak_pilot_members,public.smx_aditzak_pilot_releases,public.smx_aditzak_pilot_findings TO service_role;

CREATE OR REPLACE FUNCTION public.smx_aditzak_pilot_access(p_version uuid)
 RETURNS boolean
 LANGUAGE sql
 STABLE
 SET search_path TO ''
AS $function$
 SELECT (SELECT auth.uid()) IS NOT NULL
  AND EXISTS(
    SELECT 1 FROM public.smx_aditzak_pilot_releases r
    WHERE r.activity_version_id=p_version AND r.active AND r.phase='testing'
  )
  AND (
    (SELECT public.sr_is_admin()) OR
    EXISTS(
     SELECT 1 FROM public.smx_aditzak_pilot_members m
     JOIN public.sr_app_profiles p ON p.user_id=m.user_id
     WHERE m.user_id=(SELECT auth.uid()) AND m.enabled AND p.active
    )
  )
 $function$


CREATE POLICY "smx_aditzak_pilot_activity_read" ON public."smx_activities" FOR SELECT TO authenticated USING ((EXISTS ( SELECT 1
   FROM smx_activity_versions v
  WHERE ((v.activity_id = smx_activities.id) AND smx_aditzak_pilot_access(v.id)))));

CREATE POLICY "smx_aditzak_pilot_item_read" ON public."smx_activity_items" FOR SELECT TO authenticated USING (smx_aditzak_pilot_access(activity_version_id));

CREATE POLICY "smx_aditzak_pilot_version_read" ON public."smx_activity_versions" FOR SELECT TO authenticated USING (smx_aditzak_pilot_access(id));

CREATE POLICY "smx_aditzak_pilot_findings_insert" ON public."smx_aditzak_pilot_findings" FOR INSERT TO authenticated WITH CHECK (((user_id = ( SELECT auth.uid() AS uid)) AND (status = 'new'::text) AND smx_aditzak_pilot_access(activity_version_id) AND ((attempt_id IS NULL) OR (EXISTS ( SELECT 1
   FROM smx_attempts a
  WHERE ((a.id = smx_aditzak_pilot_findings.attempt_id) AND (a.user_id = ( SELECT auth.uid() AS uid)) AND (a.activity_version_id = smx_aditzak_pilot_findings.activity_version_id)))))));

CREATE POLICY "smx_aditzak_pilot_findings_read" ON public."smx_aditzak_pilot_findings" FOR SELECT TO authenticated USING (((user_id = ( SELECT auth.uid() AS uid)) OR ( SELECT sr_is_admin() AS sr_is_admin)));

CREATE POLICY "smx_aditzak_pilot_members_own_or_admin_read" ON public."smx_aditzak_pilot_members" FOR SELECT TO authenticated USING (((user_id = ( SELECT auth.uid() AS uid)) OR ( SELECT sr_is_admin() AS sr_is_admin)));

CREATE POLICY "smx_aditzak_pilot_releases_member_or_admin_read" ON public."smx_aditzak_pilot_releases" FOR SELECT TO authenticated USING ((( SELECT sr_is_admin() AS sr_is_admin) OR (EXISTS ( SELECT 1
   FROM (smx_aditzak_pilot_members m
     JOIN sr_app_profiles p ON ((p.user_id = m.user_id)))
  WHERE ((m.user_id = ( SELECT auth.uid() AS uid)) AND m.enabled AND p.active)))));

CREATE POLICY "smx_aditzak_pilot_attempt_insert" ON public."smx_attempts" FOR INSERT TO authenticated WITH CHECK (((user_id = ( SELECT auth.uid() AS uid)) AND smx_aditzak_pilot_access(activity_version_id) AND (EXISTS ( SELECT 1
   FROM smx_activity_versions v
  WHERE ((v.id = smx_attempts.activity_version_id) AND (v.status = 'draft'::text))))));

CREATE POLICY "smx_aditzak_pilot_catalog_links_read" ON public."smx_exercise_activity_links" FOR SELECT TO authenticated USING ((EXISTS ( SELECT 1
   FROM (smx_aditzak_pilot_releases r
     JOIN smx_activity_versions v ON ((v.id = r.activity_version_id)))
  WHERE ((v.activity_id = smx_exercise_activity_links.activity_id) AND smx_aditzak_pilot_access(r.activity_version_id)))));

CREATE OR REPLACE FUNCTION smx_private.smx_aditzak_pilot_set_tester(p_user_id uuid, p_enabled boolean)
 RETURNS boolean
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO ''
AS $function$
BEGIN
 IF (SELECT auth.uid()) IS NULL OR NOT (SELECT public.sr_is_admin()) THEN
  RAISE EXCEPTION 'Administratzailearen baimena behar da' USING ERRCODE='42501';
 END IF;
 IF p_user_id IS NULL OR p_enabled IS NULL THEN
  RAISE EXCEPTION 'Sarrera baliogabea' USING ERRCODE='22023';
 END IF;
 IF NOT EXISTS(
  SELECT 1 FROM auth.users u JOIN public.sr_app_profiles p ON p.user_id=u.id
  WHERE u.id=p_user_id AND u.email_confirmed_at IS NOT NULL AND p.active
 ) AND p_enabled THEN
  RAISE EXCEPTION 'Erabiltzailea aktibo eta baieztatua izan behar da' USING ERRCODE='22023';
 END IF;
 INSERT INTO public.smx_aditzak_pilot_members(user_id,enabled,member_role,enrolled_by,changed_at)
 VALUES(p_user_id,p_enabled,'tester',(SELECT auth.uid()),now())
 ON CONFLICT(user_id) DO UPDATE
  SET enabled=excluded.enabled, enrolled_by=excluded.enrolled_by, changed_at=now();
 RETURN true;
END
$function$


CREATE OR REPLACE FUNCTION public.smx_aditzak_pilot_set_tester(p_user_id uuid, p_enabled boolean)
 RETURNS boolean
 LANGUAGE sql
 SET search_path TO ''
AS $function$ SELECT smx_private.smx_aditzak_pilot_set_tester(p_user_id,p_enabled) $function$


CREATE OR REPLACE FUNCTION smx_private.smx_aditzak_pilot_review_attempt(p_attempt_id uuid)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO ''
AS $function$
DECLARE
 v_user_id uuid := (SELECT auth.uid());
 v_version uuid;
 v_key jsonb;
 v_item jsonb;
 v_results jsonb:='[]'::jsonb;
 v_count int:=0;
 v_reference text;
 v_explanation text;
 r record;
BEGIN
 IF v_user_id IS NULL OR p_attempt_id IS NULL THEN
  RAISE EXCEPTION 'Saioa hasi behar duzu' USING ERRCODE='42501';
 END IF;
 SELECT a.activity_version_id INTO v_version
 FROM public.smx_attempts a
 JOIN public.smx_activity_versions v ON v.id=a.activity_version_id
 WHERE a.id=p_attempt_id AND a.user_id=v_user_id AND v.status='draft';
 IF NOT FOUND OR NOT public.smx_aditzak_pilot_access(v_version) THEN
  RAISE EXCEPTION 'Saiakera ez dago erabilgarri' USING ERRCODE='42501';
 END IF;
 SELECT k.expected_json INTO v_key FROM smx_private.answer_keys k
 WHERE k.activity_version_id=v_version;
 IF v_key IS NULL OR v_key->>'status'<>'draft_unverified' THEN
  RAISE EXCEPTION 'Berrikuspenerako gakorik ez' USING ERRCODE='42501';
 END IF;
 FOR r IN
  SELECT resp.id AS response_id,i.position,resp.raw_response,i.response_kind
  FROM public.smx_attempt_responses resp
  JOIN public.smx_activity_items i
   ON i.id=resp.item_id AND i.activity_version_id=resp.activity_version_id
  WHERE resp.attempt_id=p_attempt_id AND resp.activity_version_id=v_version
  ORDER BY i.position,resp.attempt_no,resp.submitted_at
 LOOP
  v_count:=v_count+1;
  IF v_count>100 THEN
   RAISE EXCEPTION 'Saiakera luzeegia da' USING ERRCODE='22023';
  END IF;
  v_item:=NULL;v_reference:=NULL;v_explanation:=NULL;
  IF jsonb_typeof(v_key->'items')='array' THEN
   SELECT e.value INTO v_item
   FROM jsonb_array_elements(v_key->'items') e(value)
   WHERE (e.value->>'position')::int=r.position LIMIT 1;
  END IF;
  IF v_item IS NOT NULL THEN
   v_explanation:=NULLIF(btrim(v_item->>'explanation_eu'),'');
   IF r.response_kind IN('short_text','single_choice')
      AND jsonb_typeof(v_item->'accepted_answers')='array'
      AND jsonb_array_length(v_item->'accepted_answers')>0 THEN
    v_reference:=v_item->'accepted_answers'->>0;
   END IF;
  END IF;
  v_results:=v_results||jsonb_build_array(jsonb_build_object(
   'response_id',r.response_id,
   'position',r.position,
   'outcome','needs_review',
   'feedback_eu','Behin-behineko proposamena da; ez da zuzenketa akademiko onartua.',
   'details',jsonb_build_object(
     'pilot_unvalidated',true,
     'pilot_reference_answer_eu',v_reference,
     'explanation_eu',v_explanation
   )
  ));
 END LOOP;
 IF v_count=0 THEN
  RAISE EXCEPTION 'Ez dago gordetako erantzunik' USING ERRCODE='22023';
 END IF;
 RETURN jsonb_build_object(
  'attempt_id',p_attempt_id,'pilot',true,'evaluator','unvalidated-draft-reference-v1',
  'results',v_results,
  'summary',jsonb_build_object(
    'answered',v_count,'correct',0,'incorrect',0,
    'needs_review',v_count,'fully_objective',false,'official_exam_grade',false
  )
 );
END $function$


CREATE OR REPLACE FUNCTION public.smx_aditzak_pilot_review_attempt(p_attempt_id uuid)
 RETURNS jsonb
 LANGUAGE sql
 SET search_path TO ''
AS $function$ SELECT smx_private.smx_aditzak_pilot_review_attempt(p_attempt_id) $function$


REVOKE ALL ON FUNCTION public.smx_aditzak_pilot_access(uuid) FROM PUBLIC,anon,authenticated;
REVOKE ALL ON FUNCTION smx_private.smx_aditzak_pilot_set_tester(uuid,boolean) FROM PUBLIC,anon,authenticated;
REVOKE ALL ON FUNCTION public.smx_aditzak_pilot_set_tester(uuid,boolean) FROM PUBLIC,anon,authenticated;
REVOKE ALL ON FUNCTION smx_private.smx_aditzak_pilot_review_attempt(uuid) FROM PUBLIC,anon,authenticated;
REVOKE ALL ON FUNCTION public.smx_aditzak_pilot_review_attempt(uuid) FROM PUBLIC,anon,authenticated;
GRANT USAGE ON SCHEMA smx_private TO authenticated;
GRANT EXECUTE ON FUNCTION public.smx_aditzak_pilot_access(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION smx_private.smx_aditzak_pilot_set_tester(uuid,boolean) TO authenticated;
GRANT EXECUTE ON FUNCTION public.smx_aditzak_pilot_set_tester(uuid,boolean) TO authenticated;
GRANT EXECUTE ON FUNCTION smx_private.smx_aditzak_pilot_review_attempt(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.smx_aditzak_pilot_review_attempt(uuid) TO authenticated;

INSERT INTO public.smx_aditzak_pilot_releases(activity_version_id,active,release_note_eu)
SELECT v.id,true,'B2 · Indikatiboa lehenaldian · 2. bertsioa. Proba kontrolatua: egiaztatu gabeko gakoak, ez nota.'
FROM public.smx_activity_versions v JOIN public.smx_activities a ON a.id=v.activity_id
WHERE a.code ~ '^DRAFT-ADI-B2-IND-20261121-A0[1-6]$'
 AND v.revision=2 AND v.status='draft'
 AND v.prompt_json->>'editorial_audit_id'='SUSTRAI-AUD-ADI-B2-IND-20261121-01'
ON CONFLICT(activity_version_id) DO NOTHING;

-- Actual tester enrollment requires an admin through smx_aditzak_pilot_set_tester.
-- No default enrollments: do not reuse unrelated pilot cohorts automatically.

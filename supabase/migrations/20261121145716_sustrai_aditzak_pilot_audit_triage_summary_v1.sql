-- This migration is deployed as Supabase 20261121145716.
-- Structured, auditable decisions on tester findings; not an academic approval mechanism.
CREATE TABLE IF NOT EXISTS public.smx_aditzak_pilot_decisions (
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
 finding_id uuid NOT NULL REFERENCES public.smx_aditzak_pilot_findings(id) ON DELETE RESTRICT,
 decided_by uuid NOT NULL REFERENCES auth.users(id) ON DELETE RESTRICT,
 from_status text NOT NULL CHECK(from_status IN('new','triaged','accepted','rejected','resolved')),
 to_status text NOT NULL CHECK(to_status IN('new','triaged','accepted','rejected','resolved')),
 reason_eu text NOT NULL CHECK(length(btrim(reason_eu)) BETWEEN 10 AND 1500),
 created_at timestamptz NOT NULL DEFAULT now(),
 CHECK(from_status<>to_status)
);
CREATE INDEX IF NOT EXISTS smx_aditzak_pilot_decisions_finding_time_idx
 ON public.smx_aditzak_pilot_decisions(finding_id,created_at DESC);
CREATE INDEX IF NOT EXISTS smx_aditzak_pilot_decisions_reviewer_idx
 ON public.smx_aditzak_pilot_decisions(decided_by);
ALTER TABLE public.smx_aditzak_pilot_decisions ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.smx_aditzak_pilot_decisions FROM PUBLIC,anon,authenticated;
GRANT SELECT ON public.smx_aditzak_pilot_decisions TO authenticated;
GRANT ALL ON public.smx_aditzak_pilot_decisions TO service_role;
CREATE POLICY smx_aditzak_pilot_decisions_admin_read
 ON public.smx_aditzak_pilot_decisions FOR SELECT TO authenticated
 USING ((SELECT public.sr_is_admin()));

CREATE OR REPLACE FUNCTION smx_private.smx_aditzak_pilot_triage_v1(p_finding_id uuid, p_next_status text, p_reason_eu text)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO ''
AS $function$
DECLARE
 v_previous text;
 v_admin uuid:=(SELECT auth.uid());
 v_decision uuid;
BEGIN
 IF v_admin IS NULL OR NOT (SELECT public.sr_is_admin()) THEN
  RAISE EXCEPTION 'Administratzailearen baimena behar da' USING ERRCODE='42501';
 END IF;
 IF p_finding_id IS NULL OR p_next_status IS NULL
    OR p_next_status NOT IN ('triaged','accepted','rejected','resolved')
    OR length(btrim(COALESCE(p_reason_eu,''))) NOT BETWEEN 10 AND 1500
 THEN
  RAISE EXCEPTION 'Ebazpen edo arrazoibide baliogabea' USING ERRCODE='22023';
 END IF;
 SELECT f.status INTO v_previous
 FROM public.smx_aditzak_pilot_findings f WHERE f.id=p_finding_id FOR UPDATE;
 IF NOT FOUND THEN
  RAISE EXCEPTION 'Oharra ez da aurkitu' USING ERRCODE='22023';
 END IF;
 IF v_previous=p_next_status THEN
  RAISE EXCEPTION 'Egoera hori indarrean dago jada' USING ERRCODE='22023';
 END IF;
 IF NOT (
  (v_previous='new' AND p_next_status IN ('triaged','accepted','rejected'))
  OR (v_previous='triaged' AND p_next_status IN ('accepted','rejected','resolved'))
  OR (v_previous='accepted' AND p_next_status IN ('triaged','resolved'))
  OR (v_previous='rejected' AND p_next_status='triaged')
  OR (v_previous='resolved' AND p_next_status='triaged')
 ) THEN
  RAISE EXCEPTION 'Egoera-aldaketa ez dago baimenduta' USING ERRCODE='22023';
 END IF;
 UPDATE public.smx_aditzak_pilot_findings
 SET status=p_next_status
 WHERE id=p_finding_id;
 INSERT INTO public.smx_aditzak_pilot_decisions
    (finding_id,decided_by,from_status,to_status,reason_eu)
 VALUES(p_finding_id,v_admin,v_previous,p_next_status,btrim(p_reason_eu))
 RETURNING id INTO v_decision;
 RETURN jsonb_build_object(
  'finding_id',p_finding_id,'previous',v_previous,'status',p_next_status,
  'decision_id',v_decision,'academic_approval',false
 );
END
$function$


CREATE OR REPLACE FUNCTION public.smx_aditzak_pilot_triage(p_finding_id uuid, p_next_status text, p_reason_eu text)
 RETURNS jsonb
 LANGUAGE sql
 SET search_path TO ''
AS $function$
 SELECT smx_private.smx_aditzak_pilot_triage_v1(p_finding_id,p_next_status,p_reason_eu)
$function$


CREATE OR REPLACE FUNCTION smx_private.smx_aditzak_pilot_summary_v1()
 RETURNS jsonb
 LANGUAGE plpgsql
 STABLE SECURITY DEFINER
 SET search_path TO ''
AS $function$
DECLARE v_payload jsonb;
BEGIN
 IF (SELECT auth.uid()) IS NULL OR NOT (SELECT public.sr_is_admin()) THEN
  RAISE EXCEPTION 'Administratzailearen baimena behar da' USING ERRCODE='42501';
 END IF;
 SELECT COALESCE(jsonb_agg(jsonb_build_object(
  'activity_version_id',r.activity_version_id,
  'activity_id',a.id,
  'code',a.code,
  'revision',v.revision,
  'title',v.prompt_json->>'title_eu',
  'item_count',(SELECT count(*) FROM public.smx_activity_items i WHERE i.activity_version_id=r.activity_version_id),
  'attempts',(SELECT count(*) FROM public.smx_attempts att WHERE att.activity_version_id=r.activity_version_id AND att.response_json->>'pilot'='aditzak_beta_v1'),
  'participants',(SELECT count(DISTINCT att.user_id) FROM public.smx_attempts att WHERE att.activity_version_id=r.activity_version_id AND att.response_json->>'pilot'='aditzak_beta_v1'),
  'answers',(SELECT count(*) FROM public.smx_attempt_responses ar JOIN public.smx_attempts att ON att.id=ar.attempt_id WHERE ar.activity_version_id=r.activity_version_id AND att.response_json->>'pilot'='aditzak_beta_v1'),
  'findings',(SELECT count(*) FROM public.smx_aditzak_pilot_findings f WHERE f.activity_version_id=r.activity_version_id),
  'open_findings',(SELECT count(*) FROM public.smx_aditzak_pilot_findings f WHERE f.activity_version_id=r.activity_version_id AND f.status IN('new','triaged')),
  'blocking_findings',(SELECT count(*) FROM public.smx_aditzak_pilot_findings f WHERE f.activity_version_id=r.activity_version_id AND f.priority='blocking' AND f.status NOT IN('rejected','resolved')),
  'academic_status',v.status
 ) ORDER BY a.code),'[]'::jsonb)
 INTO v_payload
 FROM public.smx_aditzak_pilot_releases r
 JOIN public.smx_activity_versions v ON v.id=r.activity_version_id
 JOIN public.smx_activities a ON a.id=v.activity_id
 WHERE r.active AND r.phase='testing';
 RETURN v_payload;
END
$function$


CREATE OR REPLACE FUNCTION public.smx_aditzak_pilot_summary()
 RETURNS jsonb
 LANGUAGE sql
 STABLE
 SET search_path TO ''
AS $function$ SELECT smx_private.smx_aditzak_pilot_summary_v1() $function$


REVOKE ALL ON FUNCTION smx_private.smx_aditzak_pilot_triage_v1(uuid,text,text) FROM PUBLIC,anon,authenticated;
REVOKE ALL ON FUNCTION public.smx_aditzak_pilot_triage(uuid,text,text) FROM PUBLIC,anon,authenticated;
REVOKE ALL ON FUNCTION smx_private.smx_aditzak_pilot_summary_v1() FROM PUBLIC,anon,authenticated;
REVOKE ALL ON FUNCTION public.smx_aditzak_pilot_summary() FROM PUBLIC,anon,authenticated;
GRANT EXECUTE ON FUNCTION smx_private.smx_aditzak_pilot_triage_v1(uuid,text,text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.smx_aditzak_pilot_triage(uuid,text,text) TO authenticated;
GRANT EXECUTE ON FUNCTION smx_private.smx_aditzak_pilot_summary_v1() TO authenticated;
GRANT EXECUTE ON FUNCTION public.smx_aditzak_pilot_summary() TO authenticated;
COMMENT ON FUNCTION public.smx_aditzak_pilot_triage(uuid,text,text)
 IS 'Reasoned admin triage of tester feedback; not academic approval.';
COMMENT ON FUNCTION public.smx_aditzak_pilot_summary()
 IS 'Admin-only aggregated progress of six released activities, no student answers.';

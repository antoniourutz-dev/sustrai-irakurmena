-- Applied remotely: accepted reports remain open until resolved.
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
  'open_findings',(SELECT count(*) FROM public.smx_aditzak_pilot_findings f WHERE f.activity_version_id=r.activity_version_id AND f.status IN('new','triaged','accepted')),
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



-- Public access check is evaluated with the caller's JWT and RLS.
CREATE OR REPLACE FUNCTION public.sr_can_read_exam_slug(p_slug text)
RETURNS boolean LANGUAGE sql STABLE SECURITY INVOKER
SET search_path=pg_catalog,public AS $$
 SELECT EXISTS (
  SELECT 1 FROM public.sr_exams e
  WHERE e.slug=p_slug AND e.publication_status='published'
    AND public.sr_can_access('reading',e.id)
 )
$$;
REVOKE ALL ON FUNCTION public.sr_can_read_exam_slug(text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.sr_can_read_exam_slug(text) TO anon,authenticated,service_role;

ALTER TABLE public.sr_app_reading_results
 ADD COLUMN IF NOT EXISTS client_attempt_key text;
CREATE UNIQUE INDEX IF NOT EXISTS sr_app_results_attempt_unique
 ON public.sr_app_reading_results(user_id,client_attempt_key)
 WHERE client_attempt_key IS NOT NULL;
ALTER TABLE public.sr_app_reading_results
 DROP CONSTRAINT IF EXISTS sr_app_results_key_len;
ALTER TABLE public.sr_app_reading_results ADD CONSTRAINT sr_app_results_key_len
 CHECK(client_attempt_key IS NULL OR length(client_attempt_key) BETWEEN 10 AND 110);

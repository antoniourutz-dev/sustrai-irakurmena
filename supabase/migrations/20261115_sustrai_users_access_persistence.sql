
-- SUSTRAI C1: account-scoped drafts, trusted reading results and per-content permissions.
-- Safe default: published lessons remain visible to guests and members until an admin restricts them.
CREATE TABLE IF NOT EXISTS sustrai_private.sr_app_admins (
  user_id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  assigned_at timestamptz NOT NULL DEFAULT now()
);
REVOKE ALL ON sustrai_private.sr_app_admins FROM PUBLIC, anon, authenticated;

CREATE OR REPLACE FUNCTION public.sr_is_admin()
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER
SET search_path = pg_catalog, public, sustrai_private AS $$
  SELECT EXISTS (
    SELECT 1 FROM sustrai_private.sr_app_admins a
    JOIN auth.users u ON u.id=a.user_id
    WHERE a.user_id = (SELECT auth.uid()) AND u.email_confirmed_at IS NOT NULL
  )
$$;
REVOKE ALL ON FUNCTION public.sr_is_admin() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.sr_is_admin() TO anon, authenticated, service_role;

CREATE TABLE IF NOT EXISTS public.sr_app_profiles (
  user_id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  display_name text NOT NULL DEFAULT '',
  active boolean NOT NULL DEFAULT true,
  joined_at timestamptz NOT NULL DEFAULT now(),
  last_seen_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT sr_app_profile_name_size CHECK(length(display_name)<=120)
);
ALTER TABLE public.sr_app_profiles ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS sr_app_profiles_read ON public.sr_app_profiles;
CREATE POLICY sr_app_profiles_read ON public.sr_app_profiles
  FOR SELECT TO authenticated USING(user_id = (SELECT auth.uid()) OR public.sr_is_admin());
DROP POLICY IF EXISTS sr_app_profiles_admin_update ON public.sr_app_profiles;
CREATE POLICY sr_app_profiles_admin_update ON public.sr_app_profiles
  FOR UPDATE TO authenticated USING(public.sr_is_admin()) WITH CHECK(public.sr_is_admin());
GRANT SELECT, UPDATE ON public.sr_app_profiles TO authenticated;
REVOKE INSERT, DELETE ON public.sr_app_profiles FROM anon, authenticated;

CREATE OR REPLACE FUNCTION public.sr_app_active()
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER
SET search_path = pg_catalog, public AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.sr_app_profiles p
    WHERE p.user_id=(SELECT auth.uid()) AND p.active
  )
$$;
REVOKE ALL ON FUNCTION public.sr_app_active() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.sr_app_active() TO authenticated, service_role;

CREATE OR REPLACE FUNCTION public.sr_register_me()
RETURNS jsonb LANGUAGE plpgsql VOLATILE SECURITY DEFINER
SET search_path=pg_catalog, public AS $$
DECLARE
  v_id uuid := auth.uid();
  v_email text;
  v_row public.sr_app_profiles%ROWTYPE;
BEGIN
  IF v_id IS NULL THEN RAISE EXCEPTION 'login_required'; END IF;
  SELECT email INTO v_email FROM auth.users
    WHERE id=v_id AND email_confirmed_at IS NOT NULL;
  IF v_email IS NULL THEN RAISE EXCEPTION 'email_confirmation_required'; END IF;
  INSERT INTO public.sr_app_profiles (user_id,display_name)
  VALUES (v_id, left(split_part(v_email,'@',1),120))
  ON CONFLICT (user_id) DO UPDATE SET last_seen_at=now();
  SELECT * INTO v_row FROM public.sr_app_profiles WHERE user_id=v_id;
  RETURN jsonb_build_object(
    'id',v_id, 'email',v_email, 'name',v_row.display_name,
    'active',v_row.active, 'admin',public.sr_is_admin()
  );
END $$;
REVOKE ALL ON FUNCTION public.sr_register_me() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.sr_register_me() TO authenticated;

CREATE TABLE IF NOT EXISTS public.sr_app_state (
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  storage_key text NOT NULL,
  value_text text NOT NULL,
  updated_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (user_id,storage_key),
  CONSTRAINT sr_app_state_key_check CHECK(length(storage_key) BETWEEN 4 AND 180 AND storage_key LIKE 'sustrai-%'),
  CONSTRAINT sr_app_state_size_check CHECK(length(value_text)<=250000)
);
CREATE INDEX IF NOT EXISTS sr_app_state_user_date ON public.sr_app_state(user_id,updated_at DESC);
ALTER TABLE public.sr_app_state ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS sr_app_state_select ON public.sr_app_state;
CREATE POLICY sr_app_state_select ON public.sr_app_state FOR SELECT TO authenticated
  USING(user_id=(SELECT auth.uid()) OR public.sr_is_admin());
DROP POLICY IF EXISTS sr_app_state_insert ON public.sr_app_state;
CREATE POLICY sr_app_state_insert ON public.sr_app_state FOR INSERT TO authenticated
  WITH CHECK(user_id=(SELECT auth.uid()) AND public.sr_app_active());
DROP POLICY IF EXISTS sr_app_state_update ON public.sr_app_state;
CREATE POLICY sr_app_state_update ON public.sr_app_state FOR UPDATE TO authenticated
  USING(user_id=(SELECT auth.uid()) AND public.sr_app_active())
  WITH CHECK(user_id=(SELECT auth.uid()) AND public.sr_app_active());
DROP POLICY IF EXISTS sr_app_state_delete ON public.sr_app_state;
CREATE POLICY sr_app_state_delete ON public.sr_app_state FOR DELETE TO authenticated
  USING(user_id=(SELECT auth.uid()) AND public.sr_app_active());
GRANT SELECT, INSERT, UPDATE, DELETE ON public.sr_app_state TO authenticated;

CREATE TABLE IF NOT EXISTS public.sr_app_content_rules (
  kind text NOT NULL CHECK(kind IN ('reading','writing','speaking')),
  resource_id uuid NOT NULL,
  guest_visible boolean NOT NULL DEFAULT true,
  member_visible boolean NOT NULL DEFAULT true,
  updated_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY(kind,resource_id)
);
ALTER TABLE public.sr_app_content_rules ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS sr_app_rules_admin ON public.sr_app_content_rules;
CREATE POLICY sr_app_rules_admin ON public.sr_app_content_rules FOR ALL TO authenticated
 USING(public.sr_is_admin()) WITH CHECK(public.sr_is_admin());
GRANT SELECT, INSERT, UPDATE, DELETE ON public.sr_app_content_rules TO authenticated;

CREATE TABLE IF NOT EXISTS public.sr_app_grants (
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  kind text NOT NULL CHECK(kind IN ('reading','writing','speaking')),
  resource_id uuid NOT NULL,
  allowed boolean NOT NULL,
  updated_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY(user_id,kind,resource_id)
);
CREATE INDEX IF NOT EXISTS sr_app_grants_content ON public.sr_app_grants(kind,resource_id);
ALTER TABLE public.sr_app_grants ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS sr_app_grants_admin ON public.sr_app_grants;
CREATE POLICY sr_app_grants_admin ON public.sr_app_grants FOR ALL TO authenticated
 USING(public.sr_is_admin()) WITH CHECK(public.sr_is_admin());
GRANT SELECT, INSERT, UPDATE, DELETE ON public.sr_app_grants TO authenticated;

CREATE OR REPLACE FUNCTION public.sr_can_access(p_kind text, p_resource_id uuid)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER
SET search_path = pg_catalog, public AS $$
 SELECT CASE
 WHEN public.sr_is_admin() THEN true
 WHEN auth.uid() IS NULL THEN COALESCE(
   (SELECT r.guest_visible FROM public.sr_app_content_rules r
    WHERE r.kind=p_kind AND r.resource_id=p_resource_id),true)
 WHEN NOT public.sr_app_active() THEN false
 ELSE COALESCE(
   (SELECT g.allowed FROM public.sr_app_grants g WHERE g.user_id=auth.uid()
    AND g.kind=p_kind AND g.resource_id=p_resource_id),
   (SELECT r.member_visible FROM public.sr_app_content_rules r
    WHERE r.kind=p_kind AND r.resource_id=p_resource_id),
   true)
 END
$$;
REVOKE ALL ON FUNCTION public.sr_can_access(text,uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.sr_can_access(text,uuid) TO anon,authenticated,service_role;

-- Default visibility remains unchanged, but all reader API paths now honor the same access predicate.
DROP POLICY IF EXISTS sr_exam_read ON public.sr_exams;
CREATE POLICY sr_exam_read ON public.sr_exams FOR SELECT TO anon,authenticated
 USING(publication_status='published' AND public.sr_can_access('reading',id));
DROP POLICY IF EXISTS sr_tasks_read ON public.sr_tasks;
CREATE POLICY sr_tasks_read ON public.sr_tasks FOR SELECT TO anon,authenticated
 USING(publication_status='published' AND EXISTS (
   SELECT 1 FROM public.sr_exams e WHERE e.id=exam_id AND
   e.publication_status='published' AND public.sr_can_access('reading',e.id)));
DROP POLICY IF EXISTS sr_task_versions_read ON public.sr_task_versions;
CREATE POLICY sr_task_versions_read ON public.sr_task_versions FOR SELECT TO anon,authenticated
 USING(publication_status='published' AND review_status='verified' AND EXISTS (
   SELECT 1 FROM public.sr_tasks t JOIN public.sr_exams e ON e.id=t.exam_id
   WHERE t.id=task_id AND t.publication_status='published'
    AND e.publication_status='published' AND public.sr_can_access('reading',e.id)));
DROP POLICY IF EXISTS sr_items_read ON public.sr_items;
CREATE POLICY sr_items_read ON public.sr_items FOR SELECT TO anon,authenticated
 USING(EXISTS (
   SELECT 1 FROM public.sr_task_versions v JOIN public.sr_tasks t ON t.id=v.task_id
   JOIN public.sr_exams e ON e.id=t.exam_id
   WHERE v.id=task_version_id AND v.publication_status='published'
    AND v.review_status='verified' AND t.publication_status='published'
    AND e.publication_status='published' AND public.sr_can_access('reading',e.id)));
DROP POLICY IF EXISTS sr_assets_read ON public.sr_task_assets;
CREATE POLICY sr_assets_read ON public.sr_task_assets FOR SELECT TO anon,authenticated
 USING(access_level='public' AND EXISTS (
   SELECT 1 FROM public.sr_task_versions v JOIN public.sr_tasks t ON t.id=v.task_id
   JOIN public.sr_exams e ON e.id=t.exam_id
   WHERE v.id=task_version_id AND v.publication_status='published'
    AND v.review_status='verified' AND t.publication_status='published'
    AND e.publication_status='published' AND public.sr_can_access('reading',e.id)));
DROP POLICY IF EXISTS sr_writing_prompts_public_read ON public.sr_writing_prompts;
CREATE POLICY sr_writing_prompts_public_read ON public.sr_writing_prompts FOR SELECT TO anon,authenticated
 USING(publication_status='published' AND source_status IN ('verified_excerpt','checked_full')
  AND public.sr_can_access('writing',id));
DROP POLICY IF EXISTS sr_writing_supports_public_read ON public.sr_writing_supports;
CREATE POLICY sr_writing_supports_public_read ON public.sr_writing_supports FOR SELECT TO anon,authenticated
 USING(publication_status='published' AND EXISTS (
  SELECT 1 FROM public.sr_writing_prompts p WHERE p.id=prompt_id
   AND p.publication_status='published'
   AND p.source_status IN ('verified_excerpt','checked_full')
   AND public.sr_can_access('writing',p.id)));
DROP POLICY IF EXISTS sr_speaking_prompts_public_select ON public.sr_speaking_prompts;
CREATE POLICY sr_speaking_prompts_public_select ON public.sr_speaking_prompts FOR SELECT TO anon,authenticated
 USING(publication_status='published' AND review_status='verified'
  AND public.sr_can_access('speaking',id));
DROP POLICY IF EXISTS sr_speaking_supports_public_select ON public.sr_speaking_supports;
CREATE POLICY sr_speaking_supports_public_select ON public.sr_speaking_supports FOR SELECT TO anon,authenticated
 USING(publication_status='published' AND EXISTS (
   SELECT 1 FROM public.sr_speaking_prompts p WHERE p.id=prompt_id
    AND p.publication_status='published' AND p.review_status='verified'
    AND public.sr_can_access('speaking',p.id)));

CREATE TABLE IF NOT EXISTS public.sr_app_reading_results (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  exam_id uuid NOT NULL REFERENCES public.sr_exams(id),
  score numeric NOT NULL CHECK(score>=0),
  max_score numeric NOT NULL CHECK(max_score>0),
  correct integer NOT NULL CHECK(correct>=0),
  total integer NOT NULL CHECK(total>0),
  elapsed_seconds integer NOT NULL DEFAULT 0 CHECK(elapsed_seconds BETWEEN 0 AND 86400),
  response_summary jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS sr_app_results_user_date ON public.sr_app_reading_results(user_id,created_at DESC);
ALTER TABLE public.sr_app_reading_results ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS sr_app_results_select ON public.sr_app_reading_results;
CREATE POLICY sr_app_results_select ON public.sr_app_reading_results FOR SELECT TO authenticated
 USING(user_id=(SELECT auth.uid()) OR public.sr_is_admin());
GRANT SELECT ON public.sr_app_reading_results TO authenticated;
REVOKE INSERT, UPDATE, DELETE ON public.sr_app_reading_results FROM anon,authenticated;

CREATE OR REPLACE FUNCTION public.sr_admin_students()
RETURNS jsonb LANGUAGE sql STABLE SECURITY DEFINER
SET search_path=pg_catalog, public AS $$
 SELECT CASE WHEN NOT public.sr_is_admin() THEN NULL
 ELSE COALESCE((SELECT jsonb_agg(
   jsonb_build_object(
     'id',p.user_id,'email',u.email,'name',p.display_name,
     'active',p.active,'joined',p.joined_at,'lastSeen',p.last_seen_at,
     'savedItems',(SELECT count(*) FROM public.sr_app_state s WHERE s.user_id=p.user_id),
     'readingAttempts',(SELECT count(*) FROM public.sr_app_reading_results r WHERE r.user_id=p.user_id),
     'averageReadingScore',(SELECT round(avg(r.score),2) FROM public.sr_app_reading_results r WHERE r.user_id=p.user_id)
   ) ORDER BY p.last_seen_at DESC)
  FROM public.sr_app_profiles p JOIN auth.users u ON u.id=p.user_id
  WHERE p.user_id NOT IN (SELECT a.user_id FROM sustrai_private.sr_app_admins)), '[]'::jsonb) END
$$;
REVOKE ALL ON FUNCTION public.sr_admin_students() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.sr_admin_students() TO authenticated;

-- Verify existing, email-confirmed administrator: permissions are tied to the immutable Auth UID, never the frontend email.
INSERT INTO sustrai_private.sr_app_admins(user_id)
SELECT id FROM auth.users WHERE lower(email)='lumi@sustrai.app'
 AND email_confirmed_at IS NOT NULL
ON CONFLICT DO NOTHING;
INSERT INTO public.sr_app_profiles(user_id,display_name)
SELECT id,'Lumi' FROM auth.users WHERE lower(email)='lumi@sustrai.app'
 AND email_confirmed_at IS NOT NULL
ON CONFLICT DO NOTHING;

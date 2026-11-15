-- Allow active students to update their own display name (not active flag).
CREATE OR REPLACE FUNCTION public.sr_update_my_name(p_name text)
RETURNS jsonb
LANGUAGE plpgsql
VOLATILE
SECURITY DEFINER
SET search_path = pg_catalog, public
AS $$
DECLARE
  v_id uuid := auth.uid();
  v_name text := left(btrim(COALESCE(p_name, '')), 120);
  v_row public.sr_app_profiles%ROWTYPE;
  v_email text;
BEGIN
  IF v_id IS NULL THEN
    RAISE EXCEPTION 'login_required';
  END IF;
  IF NOT public.sr_app_active() THEN
    RAISE EXCEPTION 'account_inactive';
  END IF;
  IF length(v_name) < 2 THEN
    RAISE EXCEPTION 'name_too_short';
  END IF;
  UPDATE public.sr_app_profiles
     SET display_name = v_name,
         last_seen_at = now()
   WHERE user_id = v_id
   RETURNING * INTO v_row;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'profile_missing';
  END IF;
  SELECT email INTO v_email FROM auth.users WHERE id = v_id;
  RETURN jsonb_build_object(
    'id', v_id,
    'email', v_email,
    'name', v_row.display_name,
    'active', v_row.active,
    'admin', public.sr_is_admin()
  );
END;
$$;

REVOKE ALL ON FUNCTION public.sr_update_my_name(text) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.sr_update_my_name(text) TO authenticated;

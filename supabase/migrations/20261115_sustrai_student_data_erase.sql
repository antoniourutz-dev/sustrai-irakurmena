-- Account-scoped erasure of student work. Never affects other projects in shared Supabase.
CREATE OR REPLACE FUNCTION public.sr_delete_my_work()
RETURNS jsonb LANGUAGE plpgsql VOLATILE SECURITY DEFINER
SET search_path=pg_catalog,public AS $$
DECLARE v_uid uuid:=auth.uid(); deleted_state integer; deleted_results integer;
BEGIN
 IF v_uid IS NULL THEN RAISE EXCEPTION 'login_required'; END IF;
 DELETE FROM public.sr_app_state WHERE user_id=v_uid;
 GET DIAGNOSTICS deleted_state=ROW_COUNT;
 DELETE FROM public.sr_app_reading_results WHERE user_id=v_uid;
 GET DIAGNOSTICS deleted_results=ROW_COUNT;
 RETURN jsonb_build_object('deleted_work_items',deleted_state,'deleted_results',deleted_results);
END $$;
REVOKE ALL ON FUNCTION public.sr_delete_my_work() FROM PUBLIC,anon;
GRANT EXECUTE ON FUNCTION public.sr_delete_my_work() TO authenticated;
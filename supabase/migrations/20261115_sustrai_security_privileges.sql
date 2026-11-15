-- Limit direct execution of internal role check helpers.
-- sr_can_access remains callable by anon intentionally: row policies use it to evaluate guest access.
REVOKE EXECUTE ON FUNCTION public.sr_app_active() FROM anon;
REVOKE EXECUTE ON FUNCTION public.sr_is_admin() FROM anon;
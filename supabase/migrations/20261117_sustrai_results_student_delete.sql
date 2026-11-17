-- HitzBira: a student may delete their own reading results (attempts they no longer want to keep).
-- Only the owner, and only while their account is active; teachers and admins keep read-only access.
DROP POLICY IF EXISTS sr_app_results_delete ON public.sr_app_reading_results;
CREATE POLICY sr_app_results_delete ON public.sr_app_reading_results
  FOR DELETE TO authenticated
  USING (user_id = (SELECT auth.uid()) AND public.sr_app_active());
GRANT DELETE ON public.sr_app_reading_results TO authenticated;

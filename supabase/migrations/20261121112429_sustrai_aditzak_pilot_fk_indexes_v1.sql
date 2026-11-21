-- Follow-up applied remotely (20261121112429). Safe to rerun.
CREATE INDEX IF NOT EXISTS smx_aditzak_pilot_findings_item_version_idx
  ON public.smx_aditzak_pilot_findings(item_id,activity_version_id)
  WHERE item_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS smx_aditzak_pilot_members_enrolled_by_idx
  ON public.smx_aditzak_pilot_members(enrolled_by)
  WHERE enrolled_by IS NOT NULL;

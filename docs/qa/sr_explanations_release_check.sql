-- SUSTRAI MAX · irakurmen-azalpenen QA kontsulta (2026-11-17)
-- ONLY run through a privileged Supabase SQL console, never via anon APIs.
-- SELECT-only. A clean result is an empty set of rows.
-- This checks structural source fidelity, not independent academic approval.

with checked as (
 select e.slug, t.position as task_position, i.item_no, r.revision, r.review_status,
  array_remove(array[
   case when r.accepted_options_snapshot is distinct from k.accepted_options
     then 'ANSWER_SNAPSHOT_MISMATCH' end,
   case when strpos(v.passage_text,r.source_excerpt_eu)=0
     then 'SOURCE_EXCERPT_NOT_IN_CURRENT_PASSAGE' end,
   case when r.source_version_hash is distinct from 'md5:'||md5(v.passage_text)
     then 'VERSION_HASH_MISMATCH' end,
   case when jsonb_array_length(r.distractor_reasons) <>
     jsonb_array_length(i.options)-cardinality(k.accepted_options)
     then 'DISTRACTOR_COUNT_MISMATCH' end,
   case when (select count(distinct x->>'option')
              from jsonb_array_elements(r.distractor_reasons)x)
            <> jsonb_array_length(r.distractor_reasons)
     then 'DUPLICATE_DISTRACTOR' end,
   case when exists(select 1 from jsonb_array_elements(r.distractor_reasons)x
                    where x->>'option'=any(k.accepted_options))
     then 'CORRECT_OPTION_CLASSIFIED_AS_DISTRACTOR' end,
   case when exists(select 1 from jsonb_array_elements(r.distractor_reasons)x
                    where not exists(
                     select 1 from jsonb_array_elements(i.options)y
                     where y->>'key'=x->>'option'))
     then 'UNKNOWN_DISTRACTOR_LETTER' end,
   case when length(btrim(r.correct_reason_eu))<90
     then 'SHORT_REASON' end,
   case when length(btrim(r.reading_strategy_eu))<75
     then 'SHORT_STRATEGY' end,
   case when length(btrim(r.transfer_task_eu))<45
     then 'SHORT_TRANSFER_TASK' end,
   case when r.official_reference is distinct from k.official_reference
     then 'OFFICIAL_REFERENCE_MISMATCH' end,
   case when (r.review_status='draft' and r.published_at is not null)
       or (r.review_status in ('provisional','approved') and r.published_at is null)
     then 'INCONSISTENT_PUBLICATION_STATUS' end
  ], null)::text[] as issues
 from public.sr_exams e
 join public.sr_tasks t on t.exam_id=e.id
 join public.sr_task_versions v on v.task_id=t.id and v.version=t.current_version
 join public.sr_items i on i.task_version_id=v.id
 join sustrai_private.sr_answer_keys k on k.item_id=i.id
 join sustrai_private.sr_item_explanation_reviews r on r.item_id=i.id
 where e.slug like 'ivap-%' and r.review_status in ('draft','provisional','approved')
)
select slug,task_position,item_no,revision,review_status,issues
from checked
where cardinality(issues)>0
order by slug,task_position,item_no,revision;

-- Additional manual gates (not inferable from SQL):
-- 1. Look at original PDF pages to catch page-heading contamination or column-order defects.
-- 2. Verify the correct choice in the original institution's official answer key.
-- 3. Independently review semantic overstatements ('beti', 'behar besteko') and acceptable variants.
-- 4. Do not publish as academically approved without an independent human specialist.
-- 5. E2E browser-check that answered practice items reveal support and simulations do not.

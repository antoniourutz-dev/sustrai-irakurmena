-- SUSTRAI MAX · IVAP C1 2013/1 A eredua
-- Read-only academic and integrity release check.
-- Source identity: 3HE-IR-ID-01LAB-A
-- Official PDF: https://www.ivap.euskadi.eus/contenidos/informacion/azterketaren_ereduak_3he/eu_def/adjuntos/3HE-IR-ID-01LAB_A.pdf
-- Expected: 34 authored records; 32 provisional + published; 2 academic holds.
-- The official answer key is never modified by this script.

WITH last_review AS(
 SELECT DISTINCT ON (i.id) i.id AS item_id,t.position,t.task_type,i.item_no,
 i.options,ak.accepted_options,ak.official_reference,
 r.revision,r.review_status,r.published_at,r.accepted_options_snapshot,
 r.correct_reason_eu,r.source_excerpt_eu,r.evidence_location_eu,r.distractor_reasons,
 r.reading_strategy_eu,r.transfer_task_eu,r.source_version_hash,r.review_notes,v.passage_text
 FROM public.sr_exams e
 JOIN public.sr_tasks t ON t.exam_id=e.id AND t.publication_status='published'
 JOIN public.sr_task_versions v ON v.task_id=t.id AND v.version=t.current_version
 JOIN public.sr_items i ON i.task_version_id=v.id
 JOIN sustrai_private.sr_answer_keys ak ON ak.item_id=i.id
 JOIN sustrai_private.sr_item_explanation_reviews r ON r.item_id=i.id
 WHERE e.slug='ivap-2013-1' AND e.publication_status='published'
 ORDER BY i.id,r.revision DESC
), checks AS(
 SELECT position,item_no,review_status,
  (
   accepted_options=accepted_options_snapshot
   AND position(source_excerpt_eu IN passage_text)>0
   AND length(source_excerpt_eu)>=55
   AND source_version_hash='md5:'||md5(passage_text)
   AND jsonb_array_length(distractor_reasons)=jsonb_array_length(options)-1
   AND (SELECT COUNT(DISTINCT x->>'option') FROM jsonb_array_elements(distractor_reasons)x)
       =jsonb_array_length(options)-1
   AND (SELECT COALESCE(BOOL_AND(
       x->>'option'<>ALL(accepted_options)
       AND EXISTS(SELECT 1 FROM jsonb_array_elements(options)o WHERE o->>'key'=x->>'option')
       AND length(trim(x->>'reason_eu'))>=50
      ),false) FROM jsonb_array_elements(distractor_reasons)x)
   AND length(correct_reason_eu)>=160
   AND length(reading_strategy_eu)>=70
   AND length(transfer_task_eu)>=55
   AND length(evidence_location_eu)>=30
   AND official_reference='https://drive.google.com/file/d/1HXsOSeWWbr_-Txe8oP-MO5MhqWP0Cems/view'
   AND review_notes ILIKE '%giza auditoria%'
   AND (
    (position=1 AND task_type='mcq' AND item_no BETWEEN 1 AND 9 AND jsonb_array_length(options)=3)
    OR(position=2 AND task_type='fill' AND item_no BETWEEN 1 AND 18 AND jsonb_array_length(options)=4)
    OR(position=3 AND task_type='fragments' AND item_no BETWEEN 1 AND 7 AND jsonb_array_length(options)=8)
   )
   AND CASE WHEN position=1 AND item_no IN (6,7) THEN
    review_status='draft' AND published_at IS NULL AND review_notes ILIKE '%FROGA_ESKASA%'
    ELSE review_status='provisional' AND published_at IS NOT NULL
      AND review_notes NOT ILIKE '%FROGA_ESKASA%' END
  ) AS valid
 FROM last_review
)
SELECT position,item_no,review_status,'RELEASE_GATE_FAILURE' AS fault
FROM checks WHERE NOT valid ORDER BY position,item_no;
-- Expect: 0 rows.

SELECT t.position,t.title_eu,count(i.id) questions,
 count(i.id) FILTER(WHERE r.review_status='provisional' AND r.published_at IS NOT NULL) provisional,
 count(i.id) FILTER(WHERE r.review_status='draft' AND r.published_at IS NULL) held,
 sum(jsonb_array_length(r.distractor_reasons)) total_distractors
FROM public.sr_exams e
JOIN public.sr_tasks t ON t.exam_id=e.id
JOIN public.sr_task_versions v ON v.task_id=t.id AND v.version=t.current_version
JOIN public.sr_items i ON i.task_version_id=v.id
JOIN LATERAL (
 SELECT review_status,published_at,distractor_reasons
 FROM sustrai_private.sr_item_explanation_reviews r
 WHERE r.item_id=i.id ORDER BY r.revision DESC LIMIT 1
)r ON true
WHERE e.slug='ivap-2013-1'
GROUP BY t.position,t.title_eu ORDER BY t.position;
-- Expected positions: 9/7/2 + 18/18/0 + 7/7/0 = 34/32/2.

SELECT count(*) AS visible_explanations
FROM public.sr_explain_after_grade_v2('ivap-2013-1');
-- Expected: 32; server-only path after grading; drafts must be excluded.

SELECT
 has_function_privilege('anon','public.sr_explain_after_grade_v2(text)','EXECUTE') AS anon_exec,
 has_function_privilege('authenticated','public.sr_explain_after_grade_v2(text)','EXECUTE') AS auth_exec,
 has_function_privilege('service_role','public.sr_explain_after_grade_v2(text)','EXECUTE') AS server_exec;
-- Expected: false, false, true.

-- Real browser E2E, keyboard/mobile accessibility, and independent academic
-- review are separate tasks and are NOT asserted by these SQL checks.

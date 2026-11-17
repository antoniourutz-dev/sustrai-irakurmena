-- SUSTRAI MAX · IVAP C1 2012/2 · IRAKURMENA
-- Read-only release QA, latest explanation revision per item
-- Expected: 25/25 valid, 24 provisional, 1 held (exercise 1, question 5).
-- Source: https://www.ivap.euskadi.eus/contenidos/informacion/azterketaren_ereduak_3he/es_def/adjuntos/2012_2_3HE_ID.pdf
WITH latest AS(
 SELECT DISTINCT ON(i.id)
 i.id item_id,t.position,t.task_type,i.item_no,i.options,ak.accepted_options,ak.official_reference,
 r.revision,r.review_status,r.published_at,r.accepted_options_snapshot,
 r.correct_reason_eu,r.source_excerpt_eu,r.evidence_location_eu,r.distractor_reasons,
 r.reading_strategy_eu,r.transfer_task_eu,r.source_version_hash,r.review_notes,v.passage_text
 FROM public.sr_exams e
 JOIN public.sr_tasks t ON t.exam_id=e.id AND t.publication_status='published'
 JOIN public.sr_task_versions v ON v.task_id=t.id AND v.version=t.current_version
 JOIN public.sr_items i ON i.task_version_id=v.id
 JOIN sustrai_private.sr_answer_keys ak ON ak.item_id=i.id
 JOIN sustrai_private.sr_item_explanation_reviews r ON r.item_id=i.id
 WHERE e.slug='ivap-2012-2' AND e.publication_status='published'
 ORDER BY i.id,r.revision DESC
), checks AS(
 SELECT *,
  (
  accepted_options=accepted_options_snapshot
  AND position(source_excerpt_eu IN passage_text)>0
  AND source_version_hash='md5:'||md5(passage_text)
  AND jsonb_array_length(distractor_reasons)=jsonb_array_length(options)-1
  AND (SELECT count(DISTINCT d->>'option') FROM jsonb_array_elements(distractor_reasons)d)=jsonb_array_length(options)-1
  AND (SELECT coalesce(bool_and(
       d->>'option'<>ALL(accepted_options)
       AND EXISTS(SELECT 1 FROM jsonb_array_elements(options)o WHERE o->>'key'=d->>'option')
       AND length(trim(d->>'reason_eu'))>=90
     ),false) FROM jsonb_array_elements(distractor_reasons)d)
  AND length(correct_reason_eu)>=180
  AND length(reading_strategy_eu)>=90
  AND length(transfer_task_eu)>=65
  AND review_notes ILIKE '%giza auditoria%'
  AND official_reference='https://drive.google.com/file/d/1ToC4qVGcyj1TubqH-4lvBkAuqiSoArnU/view'
  AND CASE
    WHEN position=1 THEN task_type='fragments' AND revision=2 AND item_no BETWEEN 1 AND 9 AND jsonb_array_length(options)=10
    WHEN position=2 THEN task_type='mcq' AND revision=1 AND item_no BETWEEN 1 AND 9 AND jsonb_array_length(options)=3
    WHEN position=3 THEN task_type='fragments' AND revision=2 AND item_no BETWEEN 1 AND 7 AND jsonb_array_length(options)=8
    ELSE false END
  AND CASE WHEN position=1 AND item_no=5 THEN
      review_status='draft' AND published_at IS NULL AND review_notes LIKE '%FROGA_ESKASA%'
      ELSE review_status='provisional' AND published_at IS NOT NULL END
  AND (SELECT coalesce(bool_and(o->>'text' NOT LIKE '%Idatzi dagokion letra%'),true)
       FROM jsonb_array_elements(options)o)
  ) AS passed
 FROM latest
)
SELECT position,item_no,revision,review_status,
       'RELEASE_GATE_FAILURE' as fault
FROM checks WHERE NOT passed
ORDER BY position,item_no;
-- Expected: ZERO rows.

-- Additional observable metrics
SELECT t.position,t.title_eu,count(DISTINCT i.id) items,
 count(DISTINCT i.id) FILTER(WHERE r.review_status='provisional' AND r.published_at IS NOT NULL) provisional,
 count(DISTINCT i.id) FILTER(WHERE r.review_status='draft' AND r.published_at IS NULL) draft
FROM public.sr_exams e JOIN public.sr_tasks t ON t.exam_id=e.id
JOIN public.sr_task_versions v ON v.task_id=t.id AND v.version=t.current_version
JOIN public.sr_items i ON i.task_version_id=v.id
JOIN LATERAL (
 SELECT review_status,published_at FROM sustrai_private.sr_item_explanation_reviews r
 WHERE r.item_id=i.id ORDER BY r.revision DESC LIMIT 1
) r ON true
WHERE e.slug='ivap-2012-2'
GROUP BY t.position,t.title_eu ORDER BY t.position;
-- Expected: 9/8/1, 9/9/0, 7/7/0

SELECT count(*) AS visible_after_grade
FROM public.sr_explain_after_grade_v2('ivap-2012-2');
-- Expected: 24 (server-only RPC; must not leak before grading)

SELECT
 has_function_privilege('anon','public.sr_explain_after_grade_v2(text)','EXECUTE') AS anon_can_execute,
 has_function_privilege('authenticated','public.sr_explain_after_grade_v2(text)','EXECUTE') AS auth_can_execute,
 has_function_privilege('service_role','public.sr_explain_after_grade_v2(text)','EXECUTE') AS server_can_execute;
-- Expected: false, false, true

-- SUSTRAI MAX · IVAP C1 2013/2 · A eredua
-- Kontrol automatizatu errepikagarria (READ ONLY)
-- Iturri ofiziala: https://www.ivap.euskadi.eus/contenidos/informacion/azterketaren_ereduak_3he/es_def/adjuntos/3HE-IR-ID-04LAB_A.pdf
-- Gakoa PDFko azken orrialdean egiaztatu da; SQL honek ez du erantzun ofizialik aldatzen.
-- Itxarondako emaitza: 25 azalpen-fitxa; 23 provisional; 2 draft (1:7 eta 3:20).
-- Barneko QA ez da giza auditoria akademiko independentea.

WITH current_reviews AS(
 SELECT DISTINCT ON(i.id)
 i.id AS item_id,t.position,t.task_type,i.item_no,i.options,
 ak.accepted_options, r.revision,r.review_status,r.published_at,
 r.accepted_options_snapshot,r.correct_reason_eu,r.source_excerpt_eu,r.evidence_location_eu,
 r.distractor_reasons,r.reading_strategy_eu,r.transfer_task_eu,
 r.official_reference,r.source_version_hash,r.review_notes,v.passage_text
 FROM public.sr_exams e
 JOIN public.sr_tasks t ON t.exam_id=e.id AND t.publication_status='published'
 JOIN public.sr_task_versions v ON v.task_id=t.id AND v.version=t.current_version
 JOIN public.sr_items i ON i.task_version_id=v.id
 JOIN sustrai_private.sr_answer_keys ak ON ak.item_id=i.id
 JOIN sustrai_private.sr_item_explanation_reviews r ON r.item_id=i.id
 WHERE e.slug='ivap-2013-2' AND e.publication_status='published'
 ORDER BY i.id,r.revision DESC
),checks AS (
 SELECT position,item_no,review_status,
 (
 accepted_options=accepted_options_snapshot
 AND position(source_excerpt_eu IN passage_text)>0
 AND length(source_excerpt_eu)>=70
 AND source_version_hash='md5:'||md5(passage_text)
 AND jsonb_array_length(distractor_reasons)=jsonb_array_length(options)-1
 AND (SELECT count(DISTINCT d->>'option') FROM jsonb_array_elements(distractor_reasons)d)
   =jsonb_array_length(options)-1
 AND (SELECT COALESCE(BOOL_AND(
     d->>'option' <> ALL(accepted_options)
     AND EXISTS(SELECT 1 FROM jsonb_array_elements(options)o WHERE o->>'key'=d->>'option')
     AND length(trim(d->>'reason_eu'))>=80
     ),false) FROM jsonb_array_elements(distractor_reasons)d)
 AND length(correct_reason_eu)>=185
 AND length(reading_strategy_eu)>=70
 AND length(transfer_task_eu)>=60
 AND length(evidence_location_eu)>=40
 AND review_notes ILIKE '%giza auditoria%'
 AND official_reference='https://drive.google.com/file/d/11c0QSdA0hk_wwXaY5yLo_rFZPQsoVubd/view'
 AND position('3HE-IR-ID-04LAB-A' IN passage_text)=0
 AND position('3HE-IR-ID-' IN source_excerpt_eu)=0
 AND (
   length(source_excerpt_eu)-length(replace(source_excerpt_eu,'«',''))
   = length(source_excerpt_eu)-length(replace(source_excerpt_eu,'»',''))
 )
 AND (CASE
   WHEN position=1 AND item_no=7 OR position=3 AND item_no=20
   THEN review_status='draft' AND published_at IS NULL AND review_notes LIKE '%FROGA_ESKASA%'
   ELSE review_status='provisional' AND published_at IS NOT NULL AND review_notes NOT LIKE '%FROGA_ESKASA%'
 END)
 AND (CASE
   WHEN position=1 THEN task_type='mcq' AND item_no BETWEEN 1 AND 9 AND jsonb_array_length(options)=3
   WHEN position=2 THEN task_type='fragments' AND item_no BETWEEN 10 AND 16 AND jsonb_array_length(options)=8
   WHEN position=3 THEN task_type='fragments' AND item_no BETWEEN 17 AND 25 AND jsonb_array_length(options)=10
   ELSE false END)
 ) AS passed
 FROM current_reviews
)
SELECT position,item_no,review_status,'RELEASE_GATE_FAILURE' AS issue
FROM checks WHERE NOT passed ORDER BY position,item_no;
-- Esperotakoa: 0 errenkada.

SELECT t.position,t.title_eu,count(i.id) questions,
count(i.id) FILTER(WHERE r.review_status='provisional' AND r.published_at IS NOT NULL) published,
count(i.id) FILTER(WHERE r.review_status='draft' AND r.published_at IS NULL) held,
sum(jsonb_array_length(r.distractor_reasons)) total_distractors,
sum(jsonb_array_length(r.distractor_reasons)) FILTER(WHERE r.review_status='provisional') published_distractors
FROM public.sr_exams e
JOIN public.sr_tasks t ON t.exam_id=e.id
JOIN public.sr_task_versions v ON v.task_id=t.id AND v.version=t.current_version
JOIN public.sr_items i ON i.task_version_id=v.id
JOIN LATERAL (
 SELECT review_status,published_at,distractor_reasons
 FROM sustrai_private.sr_item_explanation_reviews r
 WHERE r.item_id=i.id ORDER BY r.revision DESC LIMIT 1
) r ON true
WHERE e.slug='ivap-2013-2'
GROUP BY t.position,t.title_eu ORDER BY t.position;
-- Esperotakoa: (9,8,1,18,16); (7,7,0,49,49); (9,8,1,81,72).

SELECT count(*) AS visible_after_grading
FROM public.sr_explain_after_grade_v2('ivap-2013-2');
-- Esperotakoa: 23.

SELECT
has_function_privilege('anon','public.sr_explain_after_grade_v2(text)','EXECUTE') AS anon_exec,
has_function_privilege('authenticated','public.sr_explain_after_grade_v2(text)','EXECUTE') AS auth_exec,
has_function_privilege('service_role','public.sr_explain_after_grade_v2(text)','EXECUTE') AS server_exec;
-- Esperotakoa: false, false, true.

SELECT t.position,
 v.content->'pdf_transcription_cleanup_2026_11_17' AS correction_provenance,
(position('3HE-IR-ID-04LAB-A' IN v.passage_text)=0) AS page_header_removed
FROM public.sr_exams e JOIN public.sr_tasks t ON t.exam_id=e.id
JOIN public.sr_task_versions v ON v.task_id=t.id AND v.version=t.current_version
WHERE e.slug='ivap-2013-2' ORDER BY t.position;
-- Esperotakoa: 3 zuzenketa dokumentatu; 3 true.

-- Giza zuzentzaile independentea, benetako nabigatzaileko proba eta
-- erabilerraztasun/a11y-proba ez dira SQL honen bidez ebaluatzen.

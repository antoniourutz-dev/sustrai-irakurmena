-- SUSTRAI MAX · IVAP C1 2015/1 · A eredua · 3HE-IR-ID-12LAB_A
-- 2026-11-18 · READ ONLY
-- Official PDF: https://www.ivap.euskadi.eus/contenidos/informacion/azterketaren_ereduak_3he/es_def/adjuntos/3HE-IR-ID-12LAB_A.pdf
-- Drive source: https://drive.google.com/file/d/1kFMREIwNdPtPHey9XYAHhIBMGC3XeM9I/view
-- Expected: 34 records; 32 provisional published; #7 and #29 held as drafts.
-- These are SUSTRAI explanations, NOT official IVAP explanations or approved human reviews.

WITH official(item_no,answer) AS(VALUES
(1,'B'),(2,'C'),(3,'D'),(4,'A'),(5,'C'),(6,'B'),(7,'D'),(8,'A'),(9,'A'),
(10,'D'),(11,'C'),(12,'C'),(13,'D'),(14,'A'),(15,'B'),(16,'A'),(17,'B'),(18,'C'),
(19,'B'),(20,'A'),(21,'C'),(22,'A'),(23,'B'),(24,'B'),(25,'C'),(26,'A'),(27,'B'),
(28,'E'),(29,'D'),(30,'B'),(31,'G'),(32,'H'),(33,'F'),(34,'A')
),latest AS(
 SELECT DISTINCT ON (i.id)
 i.id item_id,t.position,t.task_type,i.item_no,i.options,ak.accepted_options,
 r.revision,r.accepted_options_snapshot,r.review_status,r.published_at,
 r.correct_reason_eu,r.source_excerpt_eu,r.evidence_location_eu,
 r.distractor_reasons,r.reading_strategy_eu,r.transfer_task_eu,
 r.official_reference,r.source_version_hash,r.review_notes,v.passage_text,official.answer
 FROM public.sr_exams e
 JOIN public.sr_tasks t ON t.exam_id=e.id AND t.publication_status='published'
 JOIN public.sr_task_versions v ON v.task_id=t.id AND v.version=t.current_version
 JOIN public.sr_items i ON i.task_version_id=v.id
 JOIN sustrai_private.sr_answer_keys ak ON ak.item_id=i.id
 JOIN sustrai_private.sr_item_explanation_reviews r ON r.item_id=i.id
 JOIN official ON official.item_no=i.item_no
 WHERE e.slug='ivap-2015-1' AND e.publication_status='published'
 ORDER BY i.id,r.revision DESC
), checks AS(
 SELECT position,item_no,review_status,
 (
 accepted_options=ARRAY[answer]::text[]
 AND accepted_options=accepted_options_snapshot
 AND POSITION(source_excerpt_eu IN passage_text)>0
 AND LENGTH(source_excerpt_eu)>=65
 AND source_version_hash='md5:'||md5(passage_text)
 AND jsonb_array_length(distractor_reasons)=jsonb_array_length(options)-1
 AND (SELECT COUNT(DISTINCT d->>'option') FROM jsonb_array_elements(distractor_reasons)d)=jsonb_array_length(options)-1
 AND (SELECT COUNT(DISTINCT o->>'key') FROM jsonb_array_elements(options)o)=jsonb_array_length(options)
 AND (SELECT COALESCE(bool_and(
    d->>'option'<>ALL(accepted_options)
    AND EXISTS(SELECT 1 FROM jsonb_array_elements(options)o WHERE o->>'key'=d->>'option')
    AND LENGTH(TRIM(d->>'reason_eu'))>=75),false)
    FROM jsonb_array_elements(distractor_reasons)d)
 AND LENGTH(correct_reason_eu)>=180
 AND LENGTH(reading_strategy_eu)>=65
 AND LENGTH(transfer_task_eu)>=55
 AND LENGTH(evidence_location_eu)>=35
 AND official_reference='https://drive.google.com/file/d/1kFMREIwNdPtPHey9XYAHhIBMGC3XeM9I/view'
 AND review_notes ILIKE '%giza auditoria%'
 AND LENGTH(source_excerpt_eu)-LENGTH(REPLACE(source_excerpt_eu,'«',''))
   =LENGTH(source_excerpt_eu)-LENGTH(REPLACE(source_excerpt_eu,'»',''))
 AND CASE WHEN item_no IN(7,29) THEN
   review_status='draft' AND published_at IS NULL AND review_notes LIKE '%FROGA_ESKASA%'
 ELSE
   review_status='provisional' AND published_at IS NOT NULL AND review_notes NOT LIKE '%FROGA_ESKASA%'
 END
 AND CASE WHEN position=1 THEN
   task_type='fill' AND item_no BETWEEN 1 AND 18 AND jsonb_array_length(options)=4
 WHEN position=2 THEN
   task_type='mcq' AND item_no BETWEEN 19 AND 23 AND jsonb_array_length(options)=3
 WHEN position=3 THEN
   task_type='mcq' AND item_no BETWEEN 24 AND 27 AND jsonb_array_length(options)=3
 WHEN position=4 THEN
   task_type='fragments' AND item_no BETWEEN 28 AND 34 AND jsonb_array_length(options)=8
 ELSE false END
 AND POSITION('‘Testamentu egiten duen batek bere herederoei bezala…’' IN passage_text)=0
 AND POSITION('Egokitua.9 TELEBISTA ASKATU' IN passage_text)=0
 AND POSITION('Egokitua. TXIKIAGOAK' IN passage_text)=0
 AND POSITION('SEXU BIDEZKO GAIXOTASUNAK: HEMENTXE, ORAINDIK Sexu bidezko' IN passage_text)=0
 ) passed,
 jsonb_array_length(distractor_reasons) distractors
 FROM latest
)
SELECT position,item_no,review_status,'RELEASE_GATE_FAILURE' issue
FROM checks WHERE NOT passed ORDER BY position,item_no;
-- EXPECTED: 0 rows.

WITH latest AS(
 SELECT DISTINCT ON(i.id) t.position,i.item_no,r.review_status,r.published_at,r.distractor_reasons
 FROM public.sr_exams e JOIN public.sr_tasks t ON t.exam_id=e.id
 JOIN public.sr_task_versions v ON v.task_id=t.id AND v.version=t.current_version
 JOIN public.sr_items i ON i.task_version_id=v.id
 JOIN sustrai_private.sr_item_explanation_reviews r ON r.item_id=i.id
 WHERE e.slug='ivap-2015-1'
 ORDER BY i.id,r.revision DESC
)
SELECT position,COUNT(*) questions,
COUNT(*) FILTER(WHERE review_status='provisional' AND published_at IS NOT NULL) provisional,
COUNT(*) FILTER(WHERE review_status='draft' AND published_at IS NULL) held,
SUM(jsonb_array_length(distractor_reasons)) distractors,
SUM(jsonb_array_length(distractor_reasons)) FILTER(WHERE review_status='provisional') published_distractors
FROM latest GROUP BY position ORDER BY position;
-- EXPECTED: (18,17,1,54,51); (5,5,0,10,10); (4,4,0,8,8); (7,6,1,49,42).

SELECT COUNT(*) after_grade FROM public.sr_explain_after_grade_v2('ivap-2015-1');
-- EXPECTED: 32. Draft explanations never returned.

SELECT
has_function_privilege('anon','public.sr_explain_after_grade_v2(text)','EXECUTE') anon_exec,
has_function_privilege('authenticated','public.sr_explain_after_grade_v2(text)','EXECUTE') authenticated_exec,
has_function_privilege('service_role','public.sr_explain_after_grade_v2(text)','EXECUTE') service_exec;
-- EXPECTED: false, false, true.

SELECT t.position,v.content->'pdf_transcription_cleanup_2026_11_18' provenance,
LEFT(v.passage_text,30) beginning,
v.content->'pdf_transcription_cleanup_2026_11_18'->>'old_md5' IS NOT NULL as source_hash_preserved
FROM public.sr_exams e JOIN public.sr_tasks t ON t.exam_id=e.id
JOIN public.sr_task_versions v ON v.task_id=t.id AND v.version=t.current_version
WHERE e.slug='ivap-2015-1' ORDER BY t.position;
-- EXPECTED: 4 documented nonsemantic fixes; original PDF intact.

SELECT 229 AS historical_1997_cases,143 AS historical_2013_cases,
ROUND(((229.0-143.0)/229.0)*100,1) AS mathematically_calculated_decrease_pct,
60 AS decrease_pct_claimed_in_2014_article;
-- EXPECTED: 37.6 vs 60. The discrepancy is explicitly FROGA_ESKASA in item 29.

-- HUMAN AUDIT, browser E2E, simulation-mode leakage, keyboard/mobile accessibility,
-- and student transfer piloting have not been completed by this SQL.

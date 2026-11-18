-- SUSTRAI MAX · IVAP C1 2014/2 · A eredua (3HE-IR-ID-09LAB_A)
-- 2026-11-18 · Read-only academic QA; no official answer modifications.
-- Official PDF: https://www.ivap.euskadi.eus/contenidos/informacion/azterketaren_ereduak_3he/eu_def/adjuntos/3HE-IR-2014_2.pdf
-- Expected: 34 full explanation records; 32 provisional published; items 6 and 22 on hold.
-- Each record includes excerpt, correct reason, every distractor reason, strategy and transfer.
-- Note: automatic checks are NOT independent human academic audit.

WITH expected(item_no,official_key) AS(
 VALUES (1,'D'),(2,'C'),(3,'D'),(4,'D'),(5,'A'),(6,'B'),
 (7,'C'),(8,'B'),(9,'A'),(10,'D'),(11,'B'),(12,'C'),
 (13,'C'),(14,'B'),(15,'A'),(16,'A'),(17,'D'),(18,'C'),
 (19,'A'),(20,'C'),(21,'A'),(22,'B'),(23,'B'),(24,'B'),(25,'C'),(26,'A'),
 (27,'G'),(28,'I'),(29,'A'),(30,'F'),(31,'E'),(32,'H'),(33,'D'),(34,'C')
),latest AS(
 SELECT DISTINCT ON(i.id)
 i.id item_id,t.position,t.task_type,i.item_no,i.options,ak.accepted_options,
 r.revision,r.accepted_options_snapshot,r.review_status,r.published_at,
 r.correct_reason_eu,r.source_excerpt_eu,r.evidence_location_eu,
 r.distractor_reasons,r.reading_strategy_eu,r.transfer_task_eu,
 r.official_reference,r.source_version_hash,r.review_notes,v.passage_text,
 expected.official_key
 FROM public.sr_exams e
 JOIN public.sr_tasks t ON t.exam_id=e.id AND t.publication_status='published'
 JOIN public.sr_task_versions v ON v.task_id=t.id AND v.version=t.current_version
 JOIN public.sr_items i ON i.task_version_id=v.id
 JOIN sustrai_private.sr_answer_keys ak ON ak.item_id=i.id
 JOIN sustrai_private.sr_item_explanation_reviews r ON r.item_id=i.id
 JOIN expected ON expected.item_no=i.item_no
 WHERE e.slug='ivap-2014-2' AND e.publication_status='published'
 ORDER BY i.id,r.revision DESC
),checks AS(
 SELECT position,item_no,review_status,
 (
 accepted_options=ARRAY[official_key]::text[]
 AND accepted_options=accepted_options_snapshot
 AND POSITION(source_excerpt_eu IN passage_text)>0
 AND LENGTH(source_excerpt_eu)>=65
 AND source_version_hash='md5:'||md5(passage_text)
 AND jsonb_array_length(distractor_reasons)=jsonb_array_length(options)-1
 AND (SELECT count(DISTINCT x->>'option') FROM jsonb_array_elements(distractor_reasons)x)
    =jsonb_array_length(options)-1
 AND (SELECT count(DISTINCT x->>'key') FROM jsonb_array_elements(options)x)
    =jsonb_array_length(options)
 AND (SELECT COALESCE(bool_and(
    x->>'option'<>ALL(accepted_options)
    AND EXISTS(SELECT 1 FROM jsonb_array_elements(options)o WHERE o->>'key'=x->>'option')
    AND LENGTH(TRIM(x->>'reason_eu'))>=85
    ),false) FROM jsonb_array_elements(distractor_reasons)x)
 AND LENGTH(correct_reason_eu)>=185
 AND LENGTH(reading_strategy_eu)>=75
 AND LENGTH(transfer_task_eu)>=60
 AND LENGTH(evidence_location_eu)>=30
 AND official_reference='https://drive.google.com/file/d/1l-YAvKkB6CRtGRE1Mr-yqomCC0F9jHDN/view'
 AND review_notes ILIKE '%giza auditoria%'
 AND LENGTH(source_excerpt_eu)-LENGTH(REPLACE(source_excerpt_eu,'«',''))
   =LENGTH(source_excerpt_eu)-LENGTH(REPLACE(source_excerpt_eu,'»',''))
 AND POSITION('ESI: ERAKUNDE SANITARIO INTEGRATUEN SORRERA' IN passage_text)=0
 AND POSITION('ZIENTZIA FIKZIOA. GIZAKION KEZKAK TEKNOLOGIAREN AURREAN' IN passage_text)=0
 AND POSITION('KONTZILIAZIOA EDO LAN-PRODUKTIBITATEA HELBURU?' IN passage_text)=0
 AND CASE WHEN item_no IN(6,22) THEN
    review_status='draft' AND published_at IS NULL AND review_notes LIKE '%FROGA_ESKASA%'
    ELSE review_status='provisional' AND published_at IS NOT NULL
      AND review_notes NOT LIKE '%FROGA_ESKASA%' END
 AND CASE WHEN position=1 THEN
    task_type='fill' AND item_no BETWEEN 1 AND 18 AND jsonb_array_length(options)=4
    WHEN position=2 THEN
    task_type='mcq' AND item_no BETWEEN 19 AND 26 AND jsonb_array_length(options)=3
    WHEN position=3 THEN
    task_type='fragments' AND item_no BETWEEN 27 AND 34 AND jsonb_array_length(options)=9
    ELSE false END
 ) AS passed,
 jsonb_array_length(distractor_reasons) AS distractors
 FROM latest
)
SELECT position,item_no,review_status,'RELEASE_GATE_FAILURE' fault
FROM checks WHERE NOT passed ORDER BY position,item_no;
-- EXPECTED: 0 rows.

-- Full coverage and per-exercise item-count check:
SELECT t.position,t.title_eu,COUNT(i.id) items,
 COUNT(i.id) FILTER(WHERE r.review_status='provisional' AND r.published_at IS NOT NULL) provisional,
 COUNT(i.id) FILTER(WHERE r.review_status='draft' AND r.published_at IS NULL) draft,
 SUM(jsonb_array_length(r.distractor_reasons)) explained_distractors,
 SUM(jsonb_array_length(r.distractor_reasons)) FILTER(WHERE r.review_status='provisional') published_distractors
FROM public.sr_exams e
JOIN public.sr_tasks t ON t.exam_id=e.id
JOIN public.sr_task_versions v ON v.task_id=t.id AND v.version=t.current_version
JOIN public.sr_items i ON i.task_version_id=v.id
JOIN LATERAL (
 SELECT review_status,published_at,distractor_reasons
 FROM sustrai_private.sr_item_explanation_reviews r
 WHERE r.item_id=i.id ORDER BY r.revision DESC LIMIT 1
)r ON true
WHERE e.slug='ivap-2014-2'
GROUP BY t.position,t.title_eu ORDER BY t.position;
-- EXPECTED: (18,17,1,54,51); (8,7,1,16,14); (8,8,0,64,64).

SELECT COUNT(*) AS visible_after_grading
FROM public.sr_explain_after_grade_v2('ivap-2014-2');
-- EXPECTED: 32; never expose held drafts.

SELECT
 has_function_privilege('anon','public.sr_explain_after_grade_v2(text)','EXECUTE') anon_exec,
 has_function_privilege('authenticated','public.sr_explain_after_grade_v2(text)','EXECUTE') authenticated_exec,
 has_function_privilege('service_role','public.sr_explain_after_grade_v2(text)','EXECUTE') server_exec;
-- EXPECTED: false, false, true.

SELECT t.position,
 v.content->'pdf_transcription_cleanup_2026_11_18' AS cleanup_provenance,
 CASE WHEN t.position=2 THEN LEFT(v.passage_text,18) END AS sci_fi_start
FROM public.sr_exams e JOIN public.sr_tasks t ON t.exam_id=e.id
JOIN public.sr_task_versions v ON v.task_id=t.id AND v.version=t.current_version
WHERE e.slug='ivap-2014-2' ORDER BY t.position;
-- EXPECTED: 3 documented fixes, source title removed in each, and Zientzia-fikzioak start.

-- Excluded from this check: human expert approval, real browser E2E tests,
-- keyboard/mobile accessibility testing, and learner transfer piloting.

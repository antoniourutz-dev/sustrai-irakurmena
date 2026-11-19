-- SUSTRAI MAX · IVAP C1 · 2017-11-04 · A eredua · 3HE-IR-ID-17LAB_A
-- 2026-11-19 · Errepikagarria · IRAKURKETA SOILIK (no writes)
-- PDF: https://drive.google.com/file/d/1zFdRzMSYRb9tuQO0y9czi5fuAOtFAUXZ/view
-- 4 ariketa / 34 item / 32 argitaratu provisional / 2 draft (25,27).
-- Gako ofizialak PDFaren erantzunen orrialdetik egiaztatuta eta aldaezin.
-- 110 distraktore prestatuta = 54+12+8+36; 106 argitaratutakoenak.
-- Giza auditoria, nabigatzaileko E2E eta ikasle-pilotua EZ dira egin.

WITH official(item_no,answer) AS(VALUES (1,'B'),(2,'C'),(3,'A'),(4,'D'),(5,'B'),(6,'D'),(7,'C'),(8,'A'),(9,'B'),(10,'D'),(11,'D'),(12,'C'),(13,'C'),(14,'B'),(15,'A'),(16,'A'),(17,'C'),(18,'B'),(19,'A'),(20,'C'),(21,'B'),(22,'C'),(23,'A'),(24,'B'),(25,'B'),(26,'C'),(27,'A'),(28,'B'),(29,'E'),(30,'C'),(31,'F'),(32,'A'),(33,'G'),(34,'B')),
latest AS(
 SELECT DISTINCT ON(i.id)
 i.id item_id,t.position,t.task_type,i.item_no,i.options,ak.accepted_options,
 r.revision,r.accepted_options_snapshot,r.review_status,r.published_at,
 r.correct_reason_eu,r.source_excerpt_eu,r.evidence_location_eu,r.distractor_reasons,
 r.reading_strategy_eu,r.transfer_task_eu,r.official_reference,r.source_version_hash,
 r.review_notes,v.passage_text,official.answer
 FROM public.sr_exams e
 JOIN public.sr_tasks t ON t.exam_id=e.id AND t.publication_status='published'
 JOIN public.sr_task_versions v ON v.task_id=t.id AND v.version=t.current_version
 JOIN public.sr_items i ON i.task_version_id=v.id
 JOIN sustrai_private.sr_answer_keys ak ON ak.item_id=i.id
 JOIN sustrai_private.sr_item_explanation_reviews r ON r.item_id=i.id
 JOIN official ON official.item_no=i.item_no
 WHERE e.slug='ivap-2017-11-04' AND e.publication_status='published'
 ORDER BY i.id,r.revision DESC
),checks AS(
 SELECT position,item_no,review_status,
 (accepted_options=ARRAY[answer]::text[] AND accepted_options=accepted_options_snapshot
 AND POSITION(source_excerpt_eu IN passage_text)>0 AND length(source_excerpt_eu)>=65
 AND source_version_hash='md5:'||md5(passage_text)
 AND jsonb_array_length(distractor_reasons)=jsonb_array_length(options)-1
 AND (SELECT COUNT(DISTINCT d->>'option') FROM jsonb_array_elements(distractor_reasons)d)=jsonb_array_length(options)-1
 AND (SELECT COUNT(DISTINCT o->>'key') FROM jsonb_array_elements(options)o)=jsonb_array_length(options)
 AND (SELECT COALESCE(bool_and(d->>'option'<>ALL(accepted_options)
   AND EXISTS(SELECT 1 FROM jsonb_array_elements(options)o WHERE o->>'key'=d->>'option')
   AND length(trim(d->>'reason_eu'))>=CASE WHEN position=4 THEN 125 WHEN position IN(2,3) THEN 65 ELSE 60 END),false)
   FROM jsonb_array_elements(distractor_reasons)d)
 AND length(correct_reason_eu)>=185 AND length(reading_strategy_eu)>=65
 AND length(transfer_task_eu)>=55 AND length(evidence_location_eu)>=30
 AND official_reference='https://drive.google.com/file/d/1zFdRzMSYRb9tuQO0y9czi5fuAOtFAUXZ/view'
 AND review_notes ILIKE '%giza auditoria%'
 AND length(source_excerpt_eu)-length(replace(source_excerpt_eu,'«',''))=
   length(source_excerpt_eu)-length(replace(source_excerpt_eu,'»',''))
 AND (CASE WHEN item_no IN(25,27)
   THEN review_status='draft' AND published_at IS NULL AND review_notes LIKE '%FROGA_ESKASA%'
   ELSE review_status='provisional' AND published_at IS NOT NULL
      AND review_notes NOT LIKE '%FROGA_ESKASA%' END)
 AND (CASE WHEN position=1 THEN task_type='fill' AND item_no BETWEEN 1 AND 18 AND jsonb_array_length(options)=4
   WHEN position=2 THEN task_type='mcq' AND item_no BETWEEN 19 AND 24 AND jsonb_array_length(options)=3
   WHEN position=3 THEN task_type='mcq' AND item_no BETWEEN 25 AND 28 AND jsonb_array_length(options)=3
   WHEN position=4 THEN task_type='fragments' AND item_no BETWEEN 29 AND 34 AND jsonb_array_length(options)=7
   ELSE false END)
 ) passed,jsonb_array_length(distractor_reasons) distractors
 FROM latest
)
SELECT position,item_no,review_status,'QA_GATE_FAILURE' fault
FROM checks WHERE NOT passed ORDER BY position,item_no;
-- EXPECTED: 0 rows.

WITH latest AS(
 SELECT DISTINCT ON (i.id) t.position,i.id,r.review_status,r.published_at,r.distractor_reasons
 FROM public.sr_exams e JOIN public.sr_tasks t ON t.exam_id=e.id
 JOIN public.sr_task_versions v ON v.task_id=t.id AND v.version=t.current_version
 JOIN public.sr_items i ON i.task_version_id=v.id
 JOIN sustrai_private.sr_item_explanation_reviews r ON r.item_id=i.id
 WHERE e.slug='ivap-2017-11-04' ORDER BY i.id,r.revision DESC
)
SELECT position,COUNT(*) items,
COUNT(*) FILTER(WHERE review_status='provisional' AND published_at IS NOT NULL) provisional,
COUNT(*) FILTER(WHERE review_status='draft' AND published_at IS NULL) held,
SUM(jsonb_array_length(distractor_reasons)) distractors_all,
SUM(jsonb_array_length(distractor_reasons)) FILTER(WHERE review_status='provisional') distractors_published
FROM latest GROUP BY position ORDER BY position;
-- EXPECTED:
-- (1,18,18,0,54,54)
-- (2,6,6,0,12,12)
-- (3,4,2,2,8,4)
-- (4,6,6,0,36,36)

SELECT count(*) visible_after_grade FROM public.sr_explain_after_grade_v2('ivap-2017-11-04');
-- EXPECTED: 32, drafts #25/#27 absent.

SELECT
 has_function_privilege('anon','public.sr_explain_after_grade_v2(text)','EXECUTE') anon_exec,
 has_function_privilege('authenticated','public.sr_explain_after_grade_v2(text)','EXECUTE') authenticated_exec,
 has_function_privilege('service_role','public.sr_explain_after_grade_v2(text)','EXECUTE') service_exec;
-- EXPECTED: false,false,true; not an app-level security E2E test.

SELECT e.slug,t.position,t.title_eu,v.version,v.review_status,
LEFT(v.passage_text,85) passage_opening
FROM public.sr_exams e JOIN public.sr_tasks t ON t.exam_id=e.id
JOIN public.sr_task_versions v ON v.task_id=t.id AND v.version=t.current_version
WHERE e.slug='ivap-2017-11-04' ORDER BY t.position;
-- EXPECTED: 4 source passages, no silent transcription edits.

-- Ez da giza auditoria independentea egin. Ez da APTO/approved epaia.

-- SUSTRAI MAX · IVAP C1 irakurmena · 2019-10-26 · A eredua · 3HE-IR-ID-09io_A
-- 2026-11-21 · IRAKURKETA SOILIK; ez du datu-bankua aldatzen.
-- Jatorrizko PDFa: https://drive.google.com/file/d/1-3ottbmcKhkJFxwyiavNBg46ae3kUXAq/view
-- Espero: 34 item (18+8+8), 32 provisional / 2 draft (#2, #25), 134 distraktore,
-- horietatik 129 argitaratutako fitxei dagozkie. E ez, H da 3. ariketako soberako zatia.
-- Azalpen pedagogikoak SUSTRAIrenak dira, ez IVAPen azalpen ofizialak.
-- Giza auditoria, browser E2E eta ikasle-pilotua EGIN GABE.

WITH official(item_no,answer) AS (VALUES (1,'B'),(2,'D'),(3,'C'),(4,'A'),(5,'D'),(6,'D'),(7,'A'),(8,'C'),(9,'B'),(10,'A'),(11,'B'),(12,'D'),(13,'B'),(14,'C'),(15,'A'),(16,'D'),(17,'C'),(18,'A'),(19,'B'),(20,'C'),(21,'A'),(22,'C'),(23,'C'),(24,'A'),(25,'A'),(26,'B'),(27,'E'),(28,'G'),(29,'A'),(30,'F'),(31,'D'),(32,'I'),(33,'C'),(34,'B')),
latest AS (
 SELECT DISTINCT ON(i.id) i.id item_id,t.position,t.task_type,i.item_no,i.options,
 ak.accepted_options,r.revision,r.accepted_options_snapshot,r.review_status,r.published_at,
 r.correct_reason_eu,r.source_excerpt_eu,r.evidence_location_eu,r.distractor_reasons,
 r.reading_strategy_eu,r.transfer_task_eu,r.official_reference,r.source_version_hash,
 r.review_notes,v.passage_text,official.answer
 FROM public.sr_exams e JOIN public.sr_tasks t ON t.exam_id=e.id AND t.publication_status='published'
 JOIN public.sr_task_versions v ON v.task_id=t.id AND v.version=t.current_version
 JOIN public.sr_items i ON i.task_version_id=v.id
 JOIN sustrai_private.sr_answer_keys ak ON ak.item_id=i.id
 JOIN sustrai_private.sr_item_explanation_reviews r ON r.item_id=i.id
 JOIN official ON official.item_no=i.item_no
 WHERE e.slug='ivap-2019-10-26' AND e.publication_status='published'
 ORDER BY i.id,r.revision DESC
), checks AS(
 SELECT position,item_no,review_status,
 (accepted_options=ARRAY[answer]::text[]
 AND accepted_options=accepted_options_snapshot
 AND POSITION(source_excerpt_eu IN passage_text)>0 AND LENGTH(source_excerpt_eu)>=65
 AND source_version_hash='md5:'||md5(passage_text)
 AND jsonb_array_length(distractor_reasons)=jsonb_array_length(options)-1
 AND (SELECT COUNT(DISTINCT d->>'option') FROM jsonb_array_elements(distractor_reasons)d)=jsonb_array_length(options)-1
 AND (SELECT COUNT(DISTINCT o->>'key') FROM jsonb_array_elements(options)o)=jsonb_array_length(options)
 AND (SELECT COALESCE(bool_and(
    d->>'option'<>ALL(accepted_options)
    AND EXISTS(SELECT 1 FROM jsonb_array_elements(options)o WHERE o->>'key'=d->>'option')
    AND LENGTH(TRIM(d->>'reason_eu'))>=CASE WHEN position=3 THEN 130 ELSE 65 END
    ),false) FROM jsonb_array_elements(distractor_reasons)d)
 AND LENGTH(correct_reason_eu)>=185
 AND LENGTH(reading_strategy_eu)>=65 AND LENGTH(transfer_task_eu)>=55
 AND LENGTH(evidence_location_eu)>=30
 AND review_notes ILIKE '%giza auditoria%'
 AND official_reference='https://drive.google.com/file/d/1-3ottbmcKhkJFxwyiavNBg46ae3kUXAq/view'
 AND LENGTH(source_excerpt_eu)-LENGTH(REPLACE(source_excerpt_eu,'«',''))=
     LENGTH(source_excerpt_eu)-LENGTH(REPLACE(source_excerpt_eu,'»',''))
 AND LENGTH(source_excerpt_eu)-LENGTH(REPLACE(source_excerpt_eu,'“',''))=
     LENGTH(source_excerpt_eu)-LENGTH(REPLACE(source_excerpt_eu,'”',''))
 AND CASE WHEN item_no IN(2,25) THEN review_status='draft' AND published_at IS NULL
   AND review_notes LIKE '%FROGA_ESKASA%'
   ELSE review_status='provisional' AND published_at IS NOT NULL
   AND review_notes NOT LIKE '%FROGA_ESKASA%' END
 AND CASE WHEN position=1 THEN task_type='fill' AND item_no BETWEEN 1 AND 18
   AND jsonb_array_length(options)=4
   WHEN position=2 THEN task_type='mcq' AND item_no BETWEEN 19 AND 26
   AND jsonb_array_length(options)=3
   WHEN position=3 THEN task_type='fragments' AND item_no BETWEEN 27 AND 34
   AND jsonb_array_length(options)=9 ELSE false END
 AND CASE WHEN position=3 THEN passage_text NOT LIKE '%Eta gaur EMAKUMEEN BOTO-ESKUBIDEAK%'
   AND passage_text LIKE '%Eta gaur egun ere%' ELSE true END
 ) passed,jsonb_array_length(distractor_reasons) wrong_count FROM latest
)
SELECT position,item_no,review_status,'QA_GATE_FAILURE' issue
FROM checks WHERE NOT passed ORDER BY position,item_no;
-- EXPECTED: zero rows. Independently run the aggregate checks below to ensure count 34.

WITH official(item_no,answer) AS (VALUES (1,'B'),(2,'D'),(3,'C'),(4,'A'),(5,'D'),(6,'D'),(7,'A'),(8,'C'),(9,'B'),(10,'A'),(11,'B'),(12,'D'),(13,'B'),(14,'C'),(15,'A'),(16,'D'),(17,'C'),(18,'A'),(19,'B'),(20,'C'),(21,'A'),(22,'C'),(23,'C'),(24,'A'),(25,'A'),(26,'B'),(27,'E'),(28,'G'),(29,'A'),(30,'F'),(31,'D'),(32,'I'),(33,'C'),(34,'B'))
SELECT COUNT(*) item_count, COUNT(DISTINCT i.item_no) unique_item_nos,
COUNT(*) FILTER(WHERE r.review_status='provisional' AND r.published_at IS NOT NULL) provisional,
COUNT(*) FILTER(WHERE r.review_status='draft' AND r.published_at IS NULL) held,
SUM(jsonb_array_length(r.distractor_reasons)) distractor_reasons,
SUM(jsonb_array_length(r.distractor_reasons)) FILTER(WHERE r.review_status='provisional') published_distractors,
BOOL_AND(ak.accepted_options=ARRAY[official.answer]::text[]) official_keys_match
FROM public.sr_exams e JOIN public.sr_tasks t ON t.exam_id=e.id
JOIN public.sr_task_versions v ON v.task_id=t.id AND v.version=t.current_version
JOIN public.sr_items i ON i.task_version_id=v.id
JOIN sustrai_private.sr_answer_keys ak ON ak.item_id=i.id
JOIN sustrai_private.sr_item_explanation_reviews r ON r.item_id=i.id AND r.revision=1
JOIN official ON official.item_no=i.item_no
WHERE e.slug='ivap-2019-10-26';
-- EXPECTED: 34,34,32,2,134,129,true.

SELECT COUNT(*) visible_after_grade FROM public.sr_explain_after_grade_v2('ivap-2019-10-26');
-- EXPECTED: 32, with #2 and #25 absent.

SELECT has_function_privilege('anon','public.sr_explain_after_grade_v2(text)','EXECUTE') anon_exec,
has_function_privilege('authenticated','public.sr_explain_after_grade_v2(text)','EXECUTE') authenticated_exec,
has_function_privilege('service_role','public.sr_explain_after_grade_v2(text)','EXECUTE') service_exec;
-- EXPECTED: false,false,true; not an application E2E authentication proof.

SELECT t.position,v.content->'pdf_transcription_cleanup_2026_11_21' cleanup,
LEFT(v.passage_text,95) opening
FROM public.sr_exams e JOIN public.sr_tasks t ON t.exam_id=e.id
JOIN public.sr_task_versions v ON v.task_id=t.id AND v.version=t.current_version
WHERE e.slug='ivap-2019-10-26' ORDER BY t.position;
-- EXPECTED: cleanup metadata only on task 3, with previous MD5.

-- QA automatizatuak ez du egiaztatzen azalpenen zuzentasun semantiko independentea.
-- 32 provisional != approved; giza auditoria, browser E2E eta ikasleen pilotua falta dira.

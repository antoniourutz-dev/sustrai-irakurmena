-- SUSTRAI MAX · IVAP 2018-05-05 · C1 Irakurmena · A eredua
-- PDF kodea: 3HE-IR-ID-05io_A · 2026-11-19 · READ ONLY
-- Jatorrizko PDF: https://drive.google.com/file/d/162Xm8o_dtM1j-QKgtxcpvli0cK2Tc8iJ/view
-- Espero: 34 item (18+8+8), 32 provisional argitaratuta, 20/21 draft argitaratu gabe.
-- 134 distraktore prest, 130 argitaratutakoenak. Gako ofizialak aldatu gabe.
-- Giza auditoria independentea, browser E2E eta ikasle-pilotua EGIN GABE.

WITH official(item_no,answer) AS (VALUES (1,'B'),(2,'C'),(3,'A'),(4,'D'),(5,'C'),(6,'C'),(7,'A'),(8,'A'),(9,'C'),(10,'B'),(11,'D'),(12,'A'),(13,'B'),(14,'C'),(15,'D'),(16,'B'),(17,'A'),(18,'B'),(19,'B'),(20,'C'),(21,'C'),(22,'B'),(23,'A'),(24,'A'),(25,'C'),(26,'B'),(27,'F'),(28,'D'),(29,'G'),(30,'A'),(31,'I'),(32,'E'),(33,'H'),(34,'B')),
latest AS (
 SELECT DISTINCT ON (i.id)
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
 WHERE e.slug='ivap-2018-05-05' AND e.publication_status='published'
 ORDER BY i.id,r.revision DESC
),checks AS(
SELECT position,item_no,review_status,
(accepted_options=ARRAY[answer]::text[]
AND accepted_options=accepted_options_snapshot
AND POSITION(source_excerpt_eu IN passage_text)>0
AND LENGTH(source_excerpt_eu)>=65
AND source_version_hash='md5:'||md5(passage_text)
AND jsonb_array_length(distractor_reasons)=jsonb_array_length(options)-1
AND (SELECT COUNT(DISTINCT d->>'option') FROM jsonb_array_elements(distractor_reasons)d)=jsonb_array_length(options)-1
AND (SELECT COUNT(DISTINCT o->>'key') FROM jsonb_array_elements(options)o)=jsonb_array_length(options)
AND (SELECT COALESCE(bool_and(d->>'option'<>ALL(accepted_options)
 AND EXISTS(SELECT 1 FROM jsonb_array_elements(options)o WHERE o->>'key'=d->>'option')
 AND LENGTH(trim(d->>'reason_eu'))>=CASE WHEN position=3 THEN 130 WHEN position=2 THEN 65 ELSE 60 END),false)
 FROM jsonb_array_elements(distractor_reasons)d)
AND LENGTH(correct_reason_eu)>=190
AND LENGTH(reading_strategy_eu)>=65
AND LENGTH(transfer_task_eu)>=55
AND LENGTH(evidence_location_eu)>=30
AND review_notes ILIKE '%giza auditoria%'
AND official_reference='https://drive.google.com/file/d/162Xm8o_dtM1j-QKgtxcpvli0cK2Tc8iJ/view'
AND LENGTH(source_excerpt_eu)-LENGTH(replace(source_excerpt_eu,'«',''))=
 LENGTH(source_excerpt_eu)-LENGTH(replace(source_excerpt_eu,'»',''))
AND LENGTH(source_excerpt_eu)-LENGTH(replace(source_excerpt_eu,'“',''))=
 LENGTH(source_excerpt_eu)-LENGTH(replace(source_excerpt_eu,'”',''))
AND CASE WHEN item_no IN(20,21) THEN review_status='draft' AND published_at IS NULL
 AND review_notes LIKE '%FROGA_ESKASA%' ELSE review_status='provisional'
 AND published_at IS NOT NULL AND review_notes NOT LIKE '%FROGA_ESKASA%' END
AND CASE WHEN position=1 THEN task_type='fill' AND item_no BETWEEN 1 AND 18 AND jsonb_array_length(options)=4
 WHEN position=2 THEN task_type='mcq' AND item_no BETWEEN 19 AND 26 AND jsonb_array_length(options)=3
 WHEN position=3 THEN task_type='fragments' AND item_no BETWEEN 27 AND 34 AND jsonb_array_length(options)=9
 ELSE false END
AND CASE WHEN position=3 THEN passage_text NOT LIKE '%Agustin Arrieta ARRAKASTA EHUko%'
 AND passage_text LIKE '%Agustin Arrieta EHUko filosofoaren%' ELSE true END
) AS passed
FROM latest)
SELECT position,item_no,review_status,'QA_GATE_FAILURE' fault FROM checks WHERE NOT passed ORDER BY position,item_no;
-- ESPERO: 0 errenkada.

WITH latest AS(
 SELECT DISTINCT ON (i.id) t.position,i.id,r.review_status,r.published_at,r.distractor_reasons
 FROM public.sr_exams e JOIN public.sr_tasks t ON t.exam_id=e.id
 JOIN public.sr_task_versions v ON v.task_id=t.id AND v.version=t.current_version
 JOIN public.sr_items i ON i.task_version_id=v.id
 JOIN sustrai_private.sr_item_explanation_reviews r ON r.item_id=i.id
 WHERE e.slug='ivap-2018-05-05' ORDER BY i.id,r.revision DESC
)
SELECT position,COUNT(*) items,
 COUNT(*) FILTER(WHERE review_status='provisional' AND published_at IS NOT NULL) provisional,
 COUNT(*) FILTER(WHERE review_status='draft' AND published_at IS NULL) held,
 SUM(jsonb_array_length(distractor_reasons)) distractors_all,
 SUM(jsonb_array_length(distractor_reasons)) FILTER(WHERE review_status='provisional') distractors_published
FROM latest GROUP BY position ORDER BY position;
-- ESPERO: (18,18,0,54,54), (8,6,2,16,12), (8,8,0,64,64).

SELECT COUNT(*) visible_after_grade FROM public.sr_explain_after_grade_v2('ivap-2018-05-05');
-- ESPERO: 32. 20. eta 21. galderetako zirriborroak ez dira itzultzen.

SELECT has_function_privilege('anon','public.sr_explain_after_grade_v2(text)','EXECUTE') anon_exec,
has_function_privilege('authenticated','public.sr_explain_after_grade_v2(text)','EXECUTE') authenticated_exec,
has_function_privilege('service_role','public.sr_explain_after_grade_v2(text)','EXECUTE') service_exec;
-- ESPERO: false, false, true.

SELECT t.position,v.content->'pdf_transcription_cleanup_2026_11_19' provenance,
LEFT(v.passage_text,80) passage_start
FROM public.sr_exams e JOIN public.sr_tasks t ON t.exam_id=e.id
JOIN public.sr_task_versions v ON v.task_id=t.id AND v.version=t.current_version
WHERE e.slug='ivap-2018-05-05' ORDER BY t.position;
-- ESPERO: 3. irakurgaiko ezabapen ez-semantikoaren aztarna bakarrik.

-- QA automatizatuak ez du giza auditoriarik, benetako UI proba edo
-- ikaslearen ikaskuntza-eraginkortasuna egiaztatzen. Ez da APTO/approved.

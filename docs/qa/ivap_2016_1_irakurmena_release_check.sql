-- SUSTRAI MAX · IVAP C1 2016/1 · A eredua · 3HE-IR-ID-22LAB_A
-- 2026-11-18 · QA errepikagarria; IR AKURKETA SOILIK (NO WRITES).
-- IVAPen PDFaren Drive kopia: https://drive.google.com/file/d/1O4xMqAKD_Xr0S_qfpbJDz5rRca9fr7Sh/view
-- Itxaropena: 34 azalpen-fitxa, 31 provisional argitaratu, 3 draft (7,22,24).
-- 134 distraktore arrazoituta: 54+16+64; argitaratutako 127: 51+12+64.
-- Ez da giza auditoria akademiko independentea, benetako browser E2E edo ikasleen pilotua.

WITH official(item_no,answer) AS(
VALUES (1,'C'),(2,'B'),(3,'D'),(4,'B'),(5,'A'),(6,'D'),
(7,'A'),(8,'C'),(9,'B'),(10,'A'),(11,'C'),(12,'D'),
(13,'B'),(14,'C'),(15,'A'),(16,'C'),(17,'D'),(18,'D'),
(19,'C'),(20,'B'),(21,'B'),(22,'A'),(23,'A'),(24,'B'),
(25,'C'),(26,'A'),(27,'C'),(28,'A'),(29,'H'),(30,'B'),
(31,'I'),(32,'E'),(33,'G'),(34,'D')
),latest AS(
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
 WHERE e.slug='ivap-2016-1' AND e.publication_status='published'
 ORDER BY i.id,r.revision DESC
),checks AS(
 SELECT position,item_no,review_status,
 (
 accepted_options=ARRAY[answer]::text[]
 AND accepted_options=accepted_options_snapshot
 AND POSITION(source_excerpt_eu IN passage_text)>0
 AND length(source_excerpt_eu)>=65
 AND source_version_hash='md5:'||md5(passage_text)
 AND jsonb_array_length(distractor_reasons)=jsonb_array_length(options)-1
 AND (SELECT count(DISTINCT d->>'option')
 FROM jsonb_array_elements(distractor_reasons)d)=jsonb_array_length(options)-1
 AND (SELECT count(DISTINCT o->>'key')
 FROM jsonb_array_elements(options)o)=jsonb_array_length(options)
 AND (SELECT coalesce(bool_and(
 d->>'option'<>ALL(accepted_options)
 AND EXISTS(SELECT 1 FROM jsonb_array_elements(options)o WHERE o->>'key'=d->>'option')
 AND length(trim(d->>'reason_eu'))>=
 CASE WHEN position=3 THEN 140 WHEN position=2 THEN 85 ELSE 65 END
 ),false) FROM jsonb_array_elements(distractor_reasons)d)
 AND length(correct_reason_eu)>=180
 AND length(reading_strategy_eu)>=65
 AND length(transfer_task_eu)>=55
 AND length(evidence_location_eu)>=30
 AND official_reference='https://drive.google.com/file/d/1O4xMqAKD_Xr0S_qfpbJDz5rRca9fr7Sh/view'
 AND review_notes ILIKE '%giza auditoria%'
 AND length(source_excerpt_eu)-length(replace(source_excerpt_eu,'«',''))
 =length(source_excerpt_eu)-length(replace(source_excerpt_eu,'»',''))
 AND CASE WHEN item_no IN(7,22,24) THEN
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
 AND CASE WHEN position=1 THEN
 passage_text LIKE 'Bizkaiko Golkoan buien%' AND passage_text NOT LIKE '%Egokitua. .'
 WHEN position=2 THEN
 passage_text LIKE 'Azken urteotan%' AND passage_text NOT LIKE '%INFEKZIOEN GLOBALIZAZIOA Baina dena%'
 WHEN position=3 THEN passage_text NOT LIKE '%JOHN MICHELL, IZAR ILUNAK {{32}}%'
 ELSE false END
 ) AS passed,jsonb_array_length(distractor_reasons) AS distractors
 FROM latest
)
SELECT position,item_no,review_status,'QA_GATE_FAILURE' error
FROM checks WHERE NOT passed ORDER BY position,item_no;
-- ESPERO: 0 errenkada.

WITH latest AS(
 SELECT DISTINCT ON(i.id) t.position,i.id,r.review_status,r.published_at,r.distractor_reasons
 FROM public.sr_exams e JOIN public.sr_tasks t ON t.exam_id=e.id
 JOIN public.sr_task_versions v ON v.task_id=t.id AND v.version=t.current_version
 JOIN public.sr_items i ON i.task_version_id=v.id
 JOIN sustrai_private.sr_item_explanation_reviews r ON r.item_id=i.id
 WHERE e.slug='ivap-2016-1'
 ORDER BY i.id,r.revision DESC
)
SELECT position,COUNT(*) items,
COUNT(*) FILTER(WHERE review_status='provisional' AND published_at IS NOT NULL) provisional,
COUNT(*) FILTER(WHERE review_status='draft' AND published_at IS NULL) draft,
SUM(jsonb_array_length(distractor_reasons)) all_distractors,
SUM(jsonb_array_length(distractor_reasons))
 FILTER(WHERE review_status='provisional') published_distractors
FROM latest GROUP BY position ORDER BY position;
-- ESPERO:
-- 1: 18 / 17 / 1 / 54 / 51
-- 2:  8 /  6 / 2 / 16 / 12
-- 3:  8 /  8 / 0 / 64 / 64

SELECT count(*) after_grade FROM public.sr_explain_after_grade_v2('ivap-2016-1');
-- ESPERO: 31; zirriborroko 7,22,24 itemak ez.

SELECT
has_function_privilege('anon','public.sr_explain_after_grade_v2(text)','EXECUTE') anon_exec,
has_function_privilege('authenticated','public.sr_explain_after_grade_v2(text)','EXECUTE') authenticated_exec,
has_function_privilege('service_role','public.sr_explain_after_grade_v2(text)','EXECUTE') service_exec;
-- ESPERO: false, false, true.

SELECT t.position,v.content->'pdf_transcription_cleanup_2026_11_18' provenance,
LEFT(v.passage_text,100) passage_start
FROM public.sr_exams e JOIN public.sr_tasks t ON t.exam_id=e.id
JOIN public.sr_task_versions v ON v.task_id=t.id AND v.version=t.current_version
WHERE e.slug='ivap-2016-1' ORDER BY t.position;
-- ESPERO: 3 irakurgai, jatorrizko MD5, PDF lotura, konponketaren arrazoia.

-- Giza auditoria akademiko independentea eta benetako browser E2E
-- (simulazioa, mobil/teklatu irisgarritasuna, ikasle-pilotajea) EGIN GABE.

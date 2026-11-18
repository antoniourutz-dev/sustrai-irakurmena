-- SUSTRAI MAX · IVAP C1 2014/1 A eredua · IRAKURMENA
-- 2026-11-18 · Kontrol errepikagarria, IRAKURKETA SOILIK
-- Jatorrizko IVAP PDF: https://www.ivap.euskadi.eus/contenidos/informacion/azterketaren_ereduak_3he/es_def/adjuntos/3HE-IR-2014_1.pdf
-- Dokumentu-kodea: 3HE-IR-ID-03LAB_A
-- Espero den egoera: 34 fitxa, 33 behin-behineko argitaratuak, 27. itema draft (FROGA_ESKASA).
-- Gako ofizialeko erantzunak ez dira aldatzen; giza auditoria independentea egiteke.

WITH expected(item_no,answer) AS (
 VALUES (1,'B'),(2,'C'),(3,'A'),(4,'A'),(5,'D'),(6,'C'),
 (7,'D'),(8,'D'),(9,'B'),(10,'C'),(11,'A'),(12,'C'),
 (13,'B'),(14,'D'),(15,'B'),(16,'A'),(17,'C'),(18,'D'),
 (19,'C'),(20,'B'),(21,'B'),(22,'A'),(23,'C'),(24,'A'),
 (25,'B'),(26,'C'),(27,'A'),(28,'D'),(29,'H'),(30,'F'),
 (31,'B'),(32,'E'),(33,'G'),(34,'A')
), latest AS(
 SELECT DISTINCT ON(i.id)
 t.position,t.task_type,i.item_no,i.options,ak.accepted_options,
 r.revision,r.accepted_options_snapshot,r.review_status,r.published_at,
 r.correct_reason_eu,r.source_excerpt_eu,r.evidence_location_eu,
 r.distractor_reasons,r.reading_strategy_eu,r.transfer_task_eu,
 r.official_reference,r.source_version_hash,r.review_notes,v.passage_text,
 expected.answer
 FROM public.sr_exams e
 JOIN public.sr_tasks t ON t.exam_id=e.id AND t.publication_status='published'
 JOIN public.sr_task_versions v ON v.task_id=t.id AND v.version=t.current_version
 JOIN public.sr_items i ON i.task_version_id=v.id
 JOIN sustrai_private.sr_answer_keys ak ON ak.item_id=i.id
 JOIN sustrai_private.sr_item_explanation_reviews r ON r.item_id=i.id
 JOIN expected ON expected.item_no=i.item_no
 WHERE e.slug='ivap-2014-1' AND e.publication_status='published'
 ORDER BY i.id,r.revision DESC
), checks AS(
 SELECT position,item_no,review_status,
 (
 accepted_options=ARRAY[answer]::text[]
 AND accepted_options=accepted_options_snapshot
 AND position(source_excerpt_eu IN passage_text)>0
 AND length(source_excerpt_eu)>=65
 AND source_version_hash='md5:'||md5(passage_text)
 AND jsonb_array_length(distractor_reasons)=jsonb_array_length(options)-1
 AND (SELECT count(DISTINCT d->>'option') FROM jsonb_array_elements(distractor_reasons)d)
   =jsonb_array_length(options)-1
 AND (SELECT count(DISTINCT o->>'key') FROM jsonb_array_elements(options)o)
   =jsonb_array_length(options)
 AND (SELECT coalesce(bool_and(
   d->>'option'<>ALL(accepted_options)
   AND EXISTS(SELECT 1 FROM jsonb_array_elements(options)o WHERE o->>'key'=d->>'option')
   AND length(trim(d->>'reason_eu'))>=75
 ),false) FROM jsonb_array_elements(distractor_reasons)d)
 AND length(correct_reason_eu)>=185
 AND length(reading_strategy_eu)>=75
 AND length(transfer_task_eu)>=60
 AND length(evidence_location_eu)>=30
 AND official_reference='https://www.ivap.euskadi.eus/contenidos/informacion/azterketaren_ereduak_3he/es_def/adjuntos/3HE-IR-2014_1.pdf'
 AND review_notes ILIKE '%giza auditoria%'
 AND length(source_excerpt_eu)-length(replace(source_excerpt_eu,'«',''))
    = length(source_excerpt_eu)-length(replace(source_excerpt_eu,'»',''))
 AND source_excerpt_eu NOT ILIKE '%3HE-IR-ID%'
 AND CASE WHEN item_no=27 THEN review_status='draft' AND published_at IS NULL
   AND review_notes LIKE '%FROGA_ESKASA%'
   ELSE review_status='provisional' AND published_at IS NOT NULL
   AND review_notes NOT LIKE '%FROGA_ESKASA%' END
 AND CASE
   WHEN position=1 THEN task_type='fill' AND item_no BETWEEN 1 AND 18 AND jsonb_array_length(options)=4
   WHEN position=2 THEN task_type='mcq' AND item_no BETWEEN 19 AND 27 AND jsonb_array_length(options)=3
   WHEN position=3 THEN task_type='fragments' AND item_no BETWEEN 28 AND 34 AND jsonb_array_length(options)=8
   ELSE false END
 ) AS passed,
 jsonb_array_length(distractor_reasons) AS distractor_count
 FROM latest
)
SELECT position,item_no,review_status,'RELEASE_GATE_FAILURE' AS fault
FROM checks WHERE NOT passed ORDER BY position,item_no;
-- Esperotakoa: 0 errenkada.

WITH latest AS(
 SELECT DISTINCT ON (i.id)
 i.id, t.position,r.review_status,r.published_at,r.distractor_reasons
 FROM public.sr_exams e JOIN public.sr_tasks t ON t.exam_id=e.id
 JOIN public.sr_task_versions v ON v.task_id=t.id AND v.version=t.current_version
 JOIN public.sr_items i ON i.task_version_id=v.id
 JOIN sustrai_private.sr_item_explanation_reviews r ON r.item_id=i.id
 WHERE e.slug='ivap-2014-1'
 ORDER BY i.id,r.revision DESC
)
SELECT position,count(*) AS items,
 count(*) FILTER(WHERE review_status='provisional' AND published_at IS NOT NULL) AS provisional,
 count(*) FILTER(WHERE review_status='draft' AND published_at IS NULL) AS held,
 sum(jsonb_array_length(distractor_reasons)) AS distractors,
 sum(jsonb_array_length(distractor_reasons)) FILTER(WHERE review_status='provisional') AS published_distractors
FROM latest GROUP BY position ORDER BY position;
-- Esperotakoa: (18,18,0,54,54); (9,8,1,18,16); (7,7,0,49,49).

SELECT count(*) AS visible_after_grading
FROM public.sr_explain_after_grade_v2('ivap-2014-1');
-- Esperotakoa: 33. Ez argitaratu saioaren kalifikazioa baino lehen.

SELECT
 has_function_privilege('anon','public.sr_explain_after_grade_v2(text)','EXECUTE') AS anon_exec,
 has_function_privilege('authenticated','public.sr_explain_after_grade_v2(text)','EXECUTE') AS auth_exec,
 has_function_privilege('service_role','public.sr_explain_after_grade_v2(text)','EXECUTE') AS service_exec;
-- Esperotakoa: false, false, true.

SELECT t.position,v.content->'transcription_correction_2026_11_18' AS source_fix,
LEFT(v.passage_text,30) AS passage_beginning
FROM public.sr_exams e JOIN public.sr_tasks t ON t.exam_id=e.id
JOIN public.sr_task_versions v ON v.task_id=t.id AND v.version=t.current_version
WHERE e.slug='ivap-2014-1' AND t.position=2;
-- Esperotakoa: "Steria Mummert ..." eta argi dokumentatutako zuzenketa.

-- OHARRA: SQLren proba automatikoak ez dira giza auditoria,
-- ikasleen transferentzia-pilotu, a11y edo E2E nabigatzaile-proba.

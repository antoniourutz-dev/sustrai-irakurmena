-- SUSTRAI MAX · IRAKURMENA · IVAP 2015/2 · A eredua · 3HE-IR-ID-16LAB_A
-- 2026-11-18 · QA errepikagarria · IRAKURKETA SOILIK (no writes).
-- Iturria: https://drive.google.com/file/d/1aTF6k9AGy2kMSfrM54OWALrYWc2h4Osy/view
-- Gako ofiziala PDFaren 13. orrialdeko irudian berrikusi da.
-- Itxaropena: 34 item, 31 provisional published, 3 draft (6,15,34), 134 distraktore aztertuta.
-- Azalpenak SUSTRAIrenak dira, ez IVAPen argibide ofizialak edo independenteki APTO.

WITH official(item_no,answer) AS(VALUES
 (1,'C'),(2,'A'),(3,'D'),(4,'B'),(5,'B'),(6,'D'),
 (7,'B'),(8,'D'),(9,'B'),(10,'C'),(11,'D'),(12,'B'),
 (13,'C'),(14,'D'),(15,'A'),(16,'C'),(17,'A'),(18,'C'),
 (19,'A'),(20,'B'),(21,'B'),(22,'C'),(23,'A'),(24,'A'),
 (25,'B'),(26,'C'),(27,'D'),(28,'A'),(29,'G'),(30,'I'),
 (31,'C'),(32,'F'),(33,'E'),(34,'B')
),latest AS(
 SELECT DISTINCT ON (i.id)
 i.id item_id,t.position,t.task_type,i.item_no,i.options,ak.accepted_options,
 r.revision,r.accepted_options_snapshot,r.review_status,r.published_at,
 r.correct_reason_eu,r.source_excerpt_eu,r.evidence_location_eu,
 r.distractor_reasons,r.reading_strategy_eu,r.transfer_task_eu,
 r.official_reference,r.source_version_hash,r.review_notes,v.passage_text,
 official.answer
 FROM public.sr_exams e
 JOIN public.sr_tasks t ON t.exam_id=e.id AND t.publication_status='published'
 JOIN public.sr_task_versions v ON v.task_id=t.id AND v.version=t.current_version
 JOIN public.sr_items i ON i.task_version_id=v.id
 JOIN sustrai_private.sr_answer_keys ak ON ak.item_id=i.id
 JOIN sustrai_private.sr_item_explanation_reviews r ON r.item_id=i.id
 JOIN official ON official.item_no=i.item_no
 WHERE e.slug='ivap-2015-2' AND e.publication_status='published'
 ORDER BY i.id,r.revision DESC
),checks AS(
 SELECT position,item_no,review_status,
 (
 accepted_options=ARRAY[answer]::text[]
 AND accepted_options=accepted_options_snapshot
 AND POSITION(source_excerpt_eu IN passage_text)>0
 AND LENGTH(source_excerpt_eu)>=65
 AND source_version_hash='md5:'||md5(passage_text)
 AND jsonb_array_length(distractor_reasons)=jsonb_array_length(options)-1
 AND (SELECT count(DISTINCT d->>'option') FROM jsonb_array_elements(distractor_reasons)d)
     =jsonb_array_length(options)-1
 AND (SELECT count(DISTINCT o->>'key') FROM jsonb_array_elements(options)o)
     =jsonb_array_length(options)
 AND (SELECT COALESCE(bool_and(
     d->>'option'<>ALL(accepted_options)
     AND EXISTS(SELECT 1 FROM jsonb_array_elements(options)o WHERE o->>'key'=d->>'option')
     AND length(trim(d->>'reason_eu'))>=CASE WHEN position=3 THEN 130 ELSE 75 END
 ),false) FROM jsonb_array_elements(distractor_reasons)d)
 AND length(correct_reason_eu)>=180
 AND length(reading_strategy_eu)>=65
 AND length(transfer_task_eu)>=55
 AND length(evidence_location_eu)>=30
 AND official_reference='https://drive.google.com/file/d/1aTF6k9AGy2kMSfrM54OWALrYWc2h4Osy/view'
 AND review_notes ILIKE '%giza auditoria%'
 AND length(source_excerpt_eu)-length(replace(source_excerpt_eu,'«',''))
     =length(source_excerpt_eu)-length(replace(source_excerpt_eu,'»',''))
 AND (CASE WHEN item_no IN (6,15,34)
     THEN review_status='draft' AND published_at IS NULL
       AND review_notes LIKE '%FROGA_ESKASA%'
     ELSE review_status='provisional' AND published_at IS NOT NULL
       AND review_notes NOT LIKE '%FROGA_ESKASA%' END)
 AND (CASE WHEN position=1
     THEN task_type='fill' AND item_no BETWEEN 1 AND 18 AND jsonb_array_length(options)=4
     WHEN position=2
     THEN task_type='mcq' AND item_no BETWEEN 19 AND 26 AND jsonb_array_length(options)=3
     WHEN position=3
     THEN task_type='fragments' AND item_no BETWEEN 27 AND 34 AND jsonb_array_length(options)=9
     ELSE false END)
 AND (CASE WHEN position=1 THEN passage_text NOT LIKE '%Egokitua. EUSKARAZKO AZPITITULUAK%'
     WHEN position=2 THEN passage_text LIKE 'Urriaren 17a%'
       AND passage_text NOT LIKE '%ARARTEKOA, POBREZIA ERAUZTEKO NAZIOARTEKO EGUNEAN%'
     WHEN position=3 THEN passage_text LIKE 'Xibartek, balaenopteridae multzoan%'
       AND passage_text NOT LIKE '%XIBARTA BALEAK Xibartek%'
     ELSE false END)
 ) AS passed,
 jsonb_array_length(distractor_reasons) AS distractor_count
 FROM latest
)
SELECT position,item_no,review_status,'QA_RELEASE_GATE_FAILURE' fault
FROM checks WHERE NOT passed ORDER BY position,item_no;
-- EXPECTED: 0 errenkada.

-- Per ariketa: 18 + 8 + 8 = 34.
WITH latest AS(
 SELECT DISTINCT ON(i.id) t.position,i.id,r.review_status,r.published_at,r.distractor_reasons
 FROM public.sr_exams e JOIN public.sr_tasks t ON t.exam_id=e.id
 JOIN public.sr_task_versions v ON v.task_id=t.id AND v.version=t.current_version
 JOIN public.sr_items i ON i.task_version_id=v.id
 JOIN sustrai_private.sr_item_explanation_reviews r ON r.item_id=i.id
 WHERE e.slug='ivap-2015-2' ORDER BY i.id,r.revision DESC
)
SELECT position,COUNT(*) questions,
COUNT(*) FILTER(WHERE review_status='provisional' AND published_at IS NOT NULL) provisional,
COUNT(*) FILTER(WHERE review_status='draft' AND published_at IS NULL) held,
SUM(jsonb_array_length(distractor_reasons)) distractors_all,
SUM(jsonb_array_length(distractor_reasons)) FILTER(WHERE review_status='provisional') distractors_published
FROM latest GROUP BY position ORDER BY position;
-- EXPECTED (position, questions, provisional, held, all, published):
-- (1,18,16,2,54,48), (2,8,8,0,16,16), (3,8,7,1,64,56).

SELECT COUNT(*) AS after_grade
FROM public.sr_explain_after_grade_v2('ivap-2015-2');
-- EXPECTED: 31. #6/#15/#34 zirriborroak ez dira itzultzen.

SELECT
 has_function_privilege('anon','public.sr_explain_after_grade_v2(text)','EXECUTE') anon_exec,
 has_function_privilege('authenticated','public.sr_explain_after_grade_v2(text)','EXECUTE') authenticated_exec,
 has_function_privilege('service_role','public.sr_explain_after_grade_v2(text)','EXECUTE') service_exec;
-- EXPECTED: false, false, true. Ez da E2E segurtasun-proba.

SELECT t.position,v.content->'pdf_transcription_cleanup_2026_11_18' AS provenance,
LEFT(v.passage_text,95) first_passage_chars
FROM public.sr_exams e JOIN public.sr_tasks t ON t.exam_id=e.id
JOIN public.sr_task_versions v ON v.task_id=t.id AND v.version=t.current_version
WHERE e.slug='ivap-2015-2' ORDER BY t.position;
-- EXPECTED: 3 documented source-text repairs; original hash and official source.

-- Scientific-source caution: printed «106 biteko informazioa» ≠ 10^6 by default.
-- 106 bits = 13.25 bytes; its comparison with the Iliad needs source audit.
SELECT 106.0/8 AS bytes_for_106_bits;
-- EXPECTED: 13.25. Do not rewrite official historical PDF or key.

-- Giza auditoria akademiko independentea, nabigatzaileko E2E, mugikorreko/teklatuko
-- irisgarritasuna eta ikasleen transferentzia-pilotua EZ dira egin hemen.

-- SUSTRAI MAX · IVAP C1 irakurmena · 2019-05-04 · A eredua · 3HE-IR-ID-02mm02io_A
-- 2026-11-21 · IRAKURKETA SOILIK, datu-bankua EZ du aldatzen.
-- IVAPen jatorrizko PDFa: https://www.ivap.euskadi.eus/contenidos/informacion/azterketaren_ereduak_3he/eu_def/adjuntos/3HE-IR-ID-02mm02io_A.pdf
-- SUSTRAIren iturri-kopia: https://drive.google.com/file/d/1VjZS5XoJKJ5YPNivr6K3ezHR1oOG3cAg/view
-- 34 item (18+8+8), 31 provisional, 3 draft (4,19,26), 134 distraktore (127 argitaratuak).
-- SUSTRAIren azalpen pedagogikoak dira; EZ dira IVAPen azalpen ofizialak.
-- Giza auditoria independentea, benetako browser E2E eta ikasleen transferentzia-pilotua egin gabe.

WITH official(item_no,answer) AS(VALUES (1,'C'),(2,'B'),(3,'D'),(4,'B'),(5,'A'),(6,'D'),(7,'A'),(8,'C'),(9,'D'),(10,'C'),(11,'B'),(12,'B'),(13,'A'),(14,'A'),(15,'D'),(16,'C'),(17,'B'),(18,'A'),(19,'C'),(20,'B'),(21,'A'),(22,'A'),(23,'B'),(24,'A'),(25,'C'),(26,'C'),(27,'H'),(28,'D'),(29,'I'),(30,'F'),(31,'A'),(32,'C'),(33,'B'),(34,'G')),
latest AS(
 SELECT DISTINCT ON(i.id)
 i.id item_id,t.position,t.task_type,i.item_no,i.options,ak.accepted_options,
 r.revision,r.accepted_options_snapshot,r.review_status,r.published_at,
 r.correct_reason_eu,r.source_excerpt_eu,r.evidence_location_eu,r.distractor_reasons,
 r.reading_strategy_eu,r.transfer_task_eu,r.official_reference,r.source_version_hash,
 r.review_notes,v.passage_text,official.answer
 FROM public.sr_exams e JOIN public.sr_tasks t ON t.exam_id=e.id AND t.publication_status='published'
 JOIN public.sr_task_versions v ON v.task_id=t.id AND v.version=t.current_version
 JOIN public.sr_items i ON i.task_version_id=v.id
 JOIN sustrai_private.sr_answer_keys ak ON ak.item_id=i.id
 JOIN sustrai_private.sr_item_explanation_reviews r ON r.item_id=i.id
 JOIN official ON official.item_no=i.item_no
 WHERE e.slug='ivap-2019-05-04' AND e.publication_status='published'
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
 AND (SELECT COALESCE(bool_and(
 d->>'option'<>ALL(accepted_options)
 AND EXISTS(SELECT 1 FROM jsonb_array_elements(options)o WHERE o->>'key'=d->>'option')
 AND LENGTH(TRIM(d->>'reason_eu'))>=CASE WHEN position=3 THEN 130 ELSE 65 END),false)
 FROM jsonb_array_elements(distractor_reasons)d)
 AND LENGTH(correct_reason_eu)>=190
 AND LENGTH(reading_strategy_eu)>=65
 AND LENGTH(transfer_task_eu)>=55
 AND LENGTH(evidence_location_eu)>=30
 AND review_notes ILIKE '%giza auditoria%'
 AND official_reference='https://drive.google.com/file/d/1VjZS5XoJKJ5YPNivr6K3ezHR1oOG3cAg/view'
 AND LENGTH(source_excerpt_eu)-LENGTH(REPLACE(source_excerpt_eu,'«',''))=
     LENGTH(source_excerpt_eu)-LENGTH(REPLACE(source_excerpt_eu,'»',''))
 AND LENGTH(source_excerpt_eu)-LENGTH(REPLACE(source_excerpt_eu,'“',''))=
     LENGTH(source_excerpt_eu)-LENGTH(REPLACE(source_excerpt_eu,'”',''))
 AND CASE WHEN item_no IN(4,19,26)
 THEN review_status='draft' AND published_at IS NULL AND review_notes LIKE '%FROGA_ESKASA%'
 ELSE review_status='provisional' AND published_at IS NOT NULL
 AND review_notes NOT LIKE '%FROGA_ESKASA%' END
 AND CASE WHEN position=1 THEN task_type='fill' AND item_no BETWEEN 1 AND 18 AND jsonb_array_length(options)=4
 WHEN position=2 THEN task_type='mcq' AND item_no BETWEEN 19 AND 26 AND jsonb_array_length(options)=3
 WHEN position=3 THEN task_type='fragments' AND item_no BETWEEN 27 AND 34 AND jsonb_array_length(options)=9
 ELSE false END
 AND CASE WHEN position=3 THEN
 passage_text NOT LIKE '%HOTZA ETXEETAN Energia-pobretasunaren%'
 AND passage_text LIKE '%Energia-pobretasunaren aurkako euskal estrategiaren%'
 ELSE true END) passed,jsonb_array_length(distractor_reasons) wrong_count
 FROM latest
)
SELECT position,item_no,review_status,'QA_GATE_FAILURE' error
FROM checks WHERE NOT passed ORDER BY position,item_no;
-- EXPECTED: 0 rows. Does not prove independent semantic correctness.

WITH latest AS(
 SELECT DISTINCT ON(i.id) t.position,i.id,r.review_status,r.published_at,r.distractor_reasons
 FROM public.sr_exams e JOIN public.sr_tasks t ON t.exam_id=e.id
 JOIN public.sr_task_versions v ON v.task_id=t.id AND v.version=t.current_version
 JOIN public.sr_items i ON i.task_version_id=v.id
 JOIN sustrai_private.sr_item_explanation_reviews r ON r.item_id=i.id
 WHERE e.slug='ivap-2019-05-04' ORDER BY i.id,r.revision DESC
)
SELECT position,COUNT(*) questions,
 COUNT(*) FILTER(WHERE review_status='provisional' AND published_at IS NOT NULL) provisional,
 COUNT(*) FILTER(WHERE review_status='draft' AND published_at IS NULL) held,
 SUM(jsonb_array_length(distractor_reasons)) all_distractors,
 SUM(jsonb_array_length(distractor_reasons)) FILTER(WHERE review_status='provisional') published_distractors
FROM latest GROUP BY position ORDER BY position;
-- EXPECTED: (18,17,1,54,51), (8,6,2,16,12), (8,8,0,64,64).

SELECT COUNT(*) after_grade_visible FROM public.sr_explain_after_grade_v2('ivap-2019-05-04');
-- EXPECTED: 31. 4,19,26 are hidden.

SELECT has_function_privilege('anon','public.sr_explain_after_grade_v2(text)','EXECUTE') anon_exec,
has_function_privilege('authenticated','public.sr_explain_after_grade_v2(text)','EXECUTE') authenticated_exec,
has_function_privilege('service_role','public.sr_explain_after_grade_v2(text)','EXECUTE') service_exec;
-- EXPECTED: false,false,true.

SELECT t.position,v.content->'pdf_transcription_cleanup_2026_11_21' cleanup,LEFT(v.passage_text,75) text_start
FROM public.sr_exams e JOIN public.sr_tasks t ON t.exam_id=e.id
JOIN public.sr_task_versions v ON v.task_id=t.id AND v.version=t.current_version
WHERE e.slug='ivap-2019-05-04' ORDER BY t.position;
-- EXPECTED: only third task has page-header transcription cleanup with prior MD5.

-- 31 provisional != approved. No APTO academic judgment without independent human validation.

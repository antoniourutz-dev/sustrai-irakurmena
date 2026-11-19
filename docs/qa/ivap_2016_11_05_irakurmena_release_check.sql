-- SUSTRAI MAX · IVAP C1 2016-11-05 · A eredua · 3HE-IR-ID-06LAB_A
-- Egiaztapen-data: 2026-11-19. READ-ONLY QA.
-- PDF originala: https://drive.google.com/file/d/1qL521r9yNmUVqTes5a-h5dS0z8n_MBXq/view
-- PDFko gako inprimatua: 34 item. Gakoak eta aukerak datu-bankuan aldatu gabe.
-- Espero: 34 azalpen landu, 32 provisional argitaratu, 14 eta 22 draft ezkutuan.
-- Egindako azalpenak SUSTRAIrenak dira, ez IVAPen azalpen ofizialak;
-- giza auditoria independentea, UI E2E eta ikasleen pilotua ez dira egin.

WITH official(item_no,answer) AS(VALUES
(1,'A'),(2,'C'),(3,'D'),(4,'A'),(5,'C'),(6,'D'),
(7,'B'),(8,'B'),(9,'B'),(10,'C'),(11,'D'),(12,'A'),
(13,'D'),(14,'B'),(15,'B'),(16,'C'),(17,'D'),(18,'A'),
(19,'C'),(20,'B'),(21,'A'),(22,'C'),(23,'A'),(24,'C'),
(25,'A'),(26,'B'),(27,'B'),
(28,'F'),(29,'H'),(30,'A'),(31,'E'),(32,'G'),(33,'D'),(34,'C')
),latest AS(
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
 WHERE e.slug='ivap-2016-11-05' AND e.publication_status='published'
 ORDER BY i.id,r.revision DESC
),checks AS(
 SELECT position,item_no,review_status,
 (
 accepted_options=ARRAY[answer]::text[]
 AND accepted_options=accepted_options_snapshot
 AND POSITION(source_excerpt_eu IN passage_text)>0 AND length(source_excerpt_eu)>=65
 AND source_version_hash='md5:'||md5(passage_text)
 AND jsonb_array_length(distractor_reasons)=jsonb_array_length(options)-1
 AND (SELECT count(DISTINCT d->>'option') FROM jsonb_array_elements(distractor_reasons)d)
   =jsonb_array_length(options)-1
 AND (SELECT count(DISTINCT o->>'key') FROM jsonb_array_elements(options)o)
   =jsonb_array_length(options)
 AND (SELECT coalesce(bool_and(
 d->>'option'<>ALL(accepted_options)
 AND EXISTS(SELECT 1 FROM jsonb_array_elements(options)o WHERE o->>'key'=d->>'option')
 AND length(trim(d->>'reason_eu'))>=CASE WHEN position=3 THEN 135 WHEN position=2 THEN 75 ELSE 60 END
 ),false) FROM jsonb_array_elements(distractor_reasons)d)
 AND length(correct_reason_eu)>=185
 AND length(reading_strategy_eu)>=65
 AND length(transfer_task_eu)>=55
 AND length(evidence_location_eu)>=30
 AND official_reference='https://drive.google.com/file/d/1qL521r9yNmUVqTes5a-h5dS0z8n_MBXq/view'
 AND review_notes ILIKE '%giza auditoria%'
 AND length(source_excerpt_eu)-length(replace(source_excerpt_eu,'«',''))
   =length(source_excerpt_eu)-length(replace(source_excerpt_eu,'»',''))
 AND (CASE WHEN item_no IN(14,22)
     THEN review_status='draft' AND published_at IS NULL AND review_notes LIKE '%FROGA_ESKASA%'
     ELSE review_status='provisional' AND published_at IS NOT NULL AND review_notes NOT LIKE '%FROGA_ESKASA%'
     END)
 AND (CASE WHEN position=1 THEN task_type='fill' AND item_no BETWEEN 1 AND 18 AND jsonb_array_length(options)=4
     WHEN position=2 THEN task_type='mcq' AND item_no BETWEEN 19 AND 27 AND jsonb_array_length(options)=3
     WHEN position=3 THEN task_type='fragments' AND item_no BETWEEN 28 AND 34 AND jsonb_array_length(options)=8
     ELSE false END)
 AND POSITION('BESOKO UME FILOSOFIKOA: Zer dago haurtxo baten buruaren barruan? buruaren teoria' IN passage_text)=0
 AND POSITION('ENPRESEN #sarekohizkuntzak Demagun' IN passage_text)=0
 ) passed,
 jsonb_array_length(distractor_reasons) as distractor_count
 FROM latest
)
SELECT position,item_no,review_status,'RELEASE_GATE_FAILURE' fault
FROM checks WHERE NOT passed ORDER BY position,item_no;
-- EXPECTED: no rows (0 QA failures).

WITH latest AS(
 SELECT DISTINCT ON(i.id) t.position,i.id,r.review_status,r.published_at,r.distractor_reasons
 FROM public.sr_exams e JOIN public.sr_tasks t ON t.exam_id=e.id
 JOIN public.sr_task_versions v ON v.task_id=t.id AND v.version=t.current_version
 JOIN public.sr_items i ON i.task_version_id=v.id
 JOIN sustrai_private.sr_item_explanation_reviews r ON r.item_id=i.id
 WHERE e.slug='ivap-2016-11-05' ORDER BY i.id,r.revision DESC
)
SELECT position,COUNT(*) questions,
COUNT(*) FILTER(WHERE review_status='provisional' AND published_at IS NOT NULL) provisional,
COUNT(*) FILTER(WHERE review_status='draft' AND published_at IS NULL) held,
SUM(jsonb_array_length(distractor_reasons)) all_distractors,
SUM(jsonb_array_length(distractor_reasons)) FILTER(WHERE review_status='provisional') published_distractors
FROM latest GROUP BY position ORDER BY position;
-- EXPECTED: (18,17,1,54,51); (9,8,1,18,16); (7,7,0,49,49).

SELECT COUNT(*) visible_after_grade FROM public.sr_explain_after_grade_v2('ivap-2016-11-05');
-- EXPECTED: 32, drafts 14/22 absent.

SELECT has_function_privilege('anon','public.sr_explain_after_grade_v2(text)','EXECUTE') anon_exec,
has_function_privilege('authenticated','public.sr_explain_after_grade_v2(text)','EXECUTE') auth_exec,
has_function_privilege('service_role','public.sr_explain_after_grade_v2(text)','EXECUTE') service_exec;
-- EXPECTED: false,false,true.

SELECT t.position, v.content->'pdf_transcription_cleanup_2026_11_19' as trace,
LEFT(v.passage_text,75) as excerpt_start
FROM public.sr_exams e JOIN public.sr_tasks t ON t.exam_id=e.id
JOIN public.sr_task_versions v ON v.task_id=t.id AND v.version=t.current_version
WHERE e.slug='ivap-2016-11-05' ORDER BY t.position;
-- EXPECTED: trace for position 2 and 3 only; original md5 retained.

-- Giza auditoria independentea, benetako nabigatzaileko simulazio-E2E,
-- irisgarritasun-probak eta ikasleen transferentzia-pilotua egiteke daude.

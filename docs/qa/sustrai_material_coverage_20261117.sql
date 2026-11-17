-- SUSTRAI MAX · Inventario de cobertura académica, 2026-11-17
-- SQL de SOLO LECTURA. Material cargado != material explicado != auditoría humana superada.
-- El ámbito es el catálogo publicado en Supabase. No afirma cobertura de todos los exámenes
-- que hayan existido ni de todo el currículo C1/B2/C2.

WITH reading_exam AS (
 SELECT e.id,e.slug,count(DISTINCT i.id) items,
 count(DISTINCT i.id) FILTER(WHERE er.review_status IN ('provisional','approved') AND er.published_at IS NOT NULL) explained,
 count(DISTINCT i.id) FILTER(WHERE er.review_status='approved' AND er.published_at IS NOT NULL) approved
 FROM public.sr_exams e
 JOIN public.sr_tasks t ON t.exam_id=e.id AND t.publication_status='published'
 JOIN public.sr_task_versions v ON v.task_id=t.id AND v.version=t.current_version
 JOIN public.sr_items i ON i.task_version_id=v.id
 LEFT JOIN sustrai_private.sr_item_explanation_reviews er ON er.item_id=i.id
 WHERE e.publication_status='published'
 GROUP BY e.id,e.slug
), writing AS (
 SELECT p.id,p.slug,count(DISTINCT s.support_kind) FILTER(WHERE s.publication_status='published') support_kinds
 FROM public.sr_writing_prompts p
 LEFT JOIN public.sr_writing_supports s ON s.prompt_id=p.id
 WHERE p.publication_status='published'
 GROUP BY p.id,p.slug
), speaking AS (
 SELECT p.id,p.exercise_type,p.slug,count(DISTINCT s.support_type) FILTER(WHERE s.publication_status='published') support_kinds
 FROM public.sr_speaking_prompts p
 LEFT JOIN public.sr_speaking_supports s ON s.prompt_id=p.id
 WHERE p.publication_status='published'
 GROUP BY p.id,p.slug,p.exercise_type
)
SELECT 'irakurmena' area,
(SELECT count(*) FROM reading_exam)::integer AS tasks_or_exams,
(SELECT sum(items) FROM reading_exam)::integer AS questions,
(SELECT sum(explained) FROM reading_exam)::integer AS explanation_items,
(SELECT sum(approved) FROM reading_exam)::integer AS independently_approved_records,
NULL::integer AS full_support_tasks
UNION ALL
SELECT 'idazmena', (SELECT count(*) FROM writing),NULL,NULL,NULL,
(SELECT count(*) FROM writing WHERE support_kinds>=3)
UNION ALL
SELECT 'ahozkoa',(SELECT count(*) FROM speaking),NULL,NULL,NULL,
(SELECT count(*) FROM speaking WHERE (exercise_type='monologue' AND support_kinds>=3) OR (exercise_type='interaction' AND support_kinds>=4));

-- Trabajos pendientes de idazmena
SELECT p.slug,p.title_eu,p.genre,p.exam_reference,p.source_url,
coalesce(count(DISTINCT s.support_kind) FILTER(WHERE s.publication_status='published'),0) AS support_kinds
FROM public.sr_writing_prompts p LEFT JOIN public.sr_writing_supports s ON s.prompt_id=p.id
WHERE p.publication_status='published'
GROUP BY p.id HAVING coalesce(count(DISTINCT s.support_kind) FILTER(WHERE s.publication_status='published'),0)<3
ORDER BY p.exam_reference,p.slug;

-- Prioridad: los exámenes publicados con más preguntas todavía sin explicación
WITH raw AS(
SELECT e.slug,e.title,count(DISTINCT i.id) AS items,
count(DISTINCT i.id) FILTER(WHERE er.review_status IN ('provisional','approved') AND er.published_at IS NOT NULL) AS explained
FROM public.sr_exams e JOIN public.sr_tasks t ON t.exam_id=e.id
JOIN public.sr_task_versions v ON v.task_id=t.id AND v.version=t.current_version
JOIN public.sr_items i ON i.task_version_id=v.id
LEFT JOIN sustrai_private.sr_item_explanation_reviews er ON er.item_id=i.id
WHERE e.publication_status='published' AND t.publication_status='published'
GROUP BY e.id)
SELECT slug,title,items,explained,items-explained AS missing_explanations
FROM raw WHERE items>explained ORDER BY missing_explanations DESC,slug;

-- Ninguna cifra constituye evaluación independiente de la naturalidad del euskera,
-- prueba E2E en navegador ni evidencia de progreso del alumno.

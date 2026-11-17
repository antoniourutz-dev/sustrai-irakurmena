-- SUSTRAI MAX · IVAP C1 2022-11-05 Idazmena · QA automatizatua
-- Read-only. Returns PASS for all 3 rows when data structures match the release contract.
-- DOES NOT constitute independent human language review or E2E browser testing.
WITH expected(support_kind,expected_count) AS (
  VALUES ('planning'::text,9),('lexicon'::text,12),('structures'::text,11)
), supports AS(
  SELECT s.*,p.slug,p.genre,p.min_words,p.recommended_minutes,p.source_url,p.source_status,p.publication_status AS prompt_status
  FROM public.sr_writing_prompts p
  JOIN public.sr_writing_supports s ON s.prompt_id=p.id
  WHERE p.slug='ivap-2022-11-05-idazmena' AND s.version=1
), checks AS(
  SELECT e.support_kind,e.expected_count,s.version,s.publication_status AS support_status,
    CASE WHEN s.id IS NULL THEN 0 ELSE jsonb_array_length(s.items) END AS found_count,
    (s.id IS NOT NULL AND s.support_kind=e.support_kind AND s.version=1
      AND s.publication_status='published' AND NOT s.is_official
      AND s.source_note LIKE '%behin-behineko%'
      AND s.source_note LIKE '%giza auditoria akademiko independentea egiteke%'
      AND s.source_note LIKE '%ez da azterketako testu ofiziala%') AS release_label_ok,
    (s.genre='iritzi_artikulua' AND s.min_words=180 AND s.recommended_minutes=50
      AND s.source_status='verified_excerpt' AND s.prompt_status='published'
      AND s.source_url='https://drive.google.com/file/d/14dtIaIkEP6qWSFpLY4iDjaYWAbcd9c-2/view') AS original_task_ok,
    CASE WHEN s.id IS NULL THEN false ELSE (
      SELECT bool_and(CASE s.support_kind
      WHEN 'planning' THEN
        (item->>'step') ~ '^[1-9][0-9]?$' AND length(btrim(item->>'instruction'))>=90
      WHEN 'lexicon' THEN
        length(btrim(item->>'expression'))>=5 AND length(btrim(item->>'example'))>=45
          AND length(btrim(item->>'nuance_eu'))>=50
      WHEN 'structures' THEN
        length(btrim(item->>'function_eu'))>=10 AND length(btrim(item->>'example'))>=55
          AND length(btrim(item->>'usage_note_eu'))>=60
      ELSE false END)
      FROM jsonb_array_elements(s.items) item
    ) END AS fields_ok,
    CASE WHEN s.id IS NULL THEN false ELSE (
      SELECT count(DISTINCT CASE s.support_kind
        WHEN 'planning' THEN item->>'step'
        WHEN 'lexicon' THEN item->>'expression'
        ELSE item->>'function_eu' END)
             =jsonb_array_length(s.items)
      FROM jsonb_array_elements(s.items) item
    ) END AS distinct_labels_ok
  FROM expected e LEFT JOIN supports s ON s.support_kind=e.support_kind
)
SELECT support_kind,expected_count,found_count,
CASE WHEN expected_count=found_count
  AND release_label_ok AND original_task_ok AND fields_ok AND distinct_labels_ok
  THEN 'PASS' ELSE 'FAIL' END AS quality_gate,
release_label_ok,original_task_ok,fields_ok,distinct_labels_ok
FROM checks ORDER BY support_kind;

-- Additional gates requiring real users or human experts:
-- 1. Teacher independently checks Basque naturalness and legitimate alternatives.
-- 2. Open practice mode and verify source_note renders as provisional.
-- 3. Open simulation mode and verify no help sections appear.
-- 4. Mobile accessibility / screenreader / keyboard focus tests.
-- 5. Compare learner's independent before/after drafts without inventing exam marks.

-- SUSTRAI (sr_*) only: index foreign keys that had no covering index.
create index if not exists sr_app_reading_results_exam_id_idx on public.sr_app_reading_results (exam_id);
create index if not exists sr_attempt_responses_item_id_idx on public.sr_attempt_responses (item_id);
create index if not exists sr_evaluations_task_version_id_idx on public.sr_evaluations (task_version_id);
create index if not exists sr_speaking_prompts_organism_id_idx on public.sr_speaking_prompts (organism_id);
create index if not exists sr_speaking_submissions_task_version_id_idx on public.sr_speaking_submissions (task_version_id);
create index if not exists sr_task_assets_task_version_id_idx on public.sr_task_assets (task_version_id);
create index if not exists sr_user_marks_item_id_idx on public.sr_user_marks (item_id);
create index if not exists sr_user_marks_task_version_id_idx on public.sr_user_marks (task_version_id);
create index if not exists sr_writing_prompts_organism_id_idx on public.sr_writing_prompts (organism_id);
create index if not exists sr_writing_submissions_task_version_id_idx on public.sr_writing_submissions (task_version_id);

-- Enforce one-time workflow events at database level to prevent race-condition duplicates.

WITH dedupe AS (
  SELECT
    id,
    ROW_NUMBER() OVER (
      PARTITION BY draft_run_id, event_type
      ORDER BY created_at ASC, id ASC
    ) AS rn
  FROM public.draft_audit_events
  WHERE event_type IN (
    'exported_for_external_legal',
    'external_legal_signed_off',
    'review_approved',
    'legal_review_approved',
    'final_sign_off',
    'legal_final_sign_off'
  )
)
DELETE FROM public.draft_audit_events dae
USING dedupe d
WHERE dae.id = d.id
  AND d.rn > 1;

CREATE UNIQUE INDEX ux_draft_audit_one_time_events
  ON public.draft_audit_events (draft_run_id, event_type)
  WHERE event_type IN (
    'exported_for_external_legal',
    'external_legal_signed_off',
    'review_approved',
    'legal_review_approved',
    'final_sign_off',
    'legal_final_sign_off'
  );

# MCA Training Pipeline

## 1) What is now auto-captured
- Every MCA draft generation stores a training case in `mca_training_cases`.
- Every MCA recheck stores flagged issues in `mca_training_issues` (when `trainingCaseId` is available).
- Coverage metrics are available in `mca_training_coverage_v`.

## 2) Bootstrap 250 calibration cases
Use this only to stress-test pipeline and UI; these are synthetic.

```bash
SUPABASE_URL=... \
SUPABASE_SERVICE_ROLE_KEY=... \
MCA_TRAIN_USER_ID=... \
MCA_BOOTSTRAP_CASES=250 \
npm run mca:bootstrap
```

## 3) Real-case ingestion target
- Replace synthetic calibration rows with real CA-reviewed notice + draft pairs.
- Include actual notice text extract, corrected draft, and adjudication outcome labels.
- Track per-case issue resolution and hearing outcome in feedback.

## 4) Recommended minimum for production-grade MCA quality
- 250+ real reviewed cases across notice classes.
- 1,000+ issue labels in `mca_training_issues`.
- Outcome labels for at least 100 disposed matters.

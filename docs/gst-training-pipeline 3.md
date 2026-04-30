# GST Training Pipeline

## 1) What is now auto-captured
- Every GST draft generation stores a training case in `gst_training_cases`.
- Every GST recheck stores flagged issues in `gst_training_issues` (when `trainingCaseId` is available).
- Coverage metrics are available in `gst_training_coverage_v`.

## 2) Bootstrap 250 calibration cases
Use this only to stress-test pipeline and class coverage; these are synthetic.

```bash
SUPABASE_URL=... \
SUPABASE_SERVICE_ROLE_KEY=... \
GST_TRAIN_USER_ID=... \
GST_BOOTSTRAP_CASES=250 \
npm run gst:bootstrap
```

## 3) Real-case ingestion target
- Replace synthetic calibration rows with real CA-reviewed notice + draft pairs.
- Include actual notice extract, corrected draft, and final adjudication outcomes.
- Track issue resolution and hearing outcomes in feedback rows.

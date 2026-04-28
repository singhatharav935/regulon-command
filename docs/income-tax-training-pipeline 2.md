# Income-tax Training Pipeline

## 1) What is now auto-captured
- Every Income-tax draft generation stores a training case in `income_tax_training_cases`.
- Every Income-tax recheck stores flagged issues in `income_tax_training_issues` (when `trainingCaseId` is available).
- Coverage metrics are available in `income_tax_training_coverage_v`.

## 2) Bootstrap 250 calibration cases
Use this only to stress-test pipeline and class coverage; these are synthetic.

```bash
SUPABASE_URL=... \
SUPABASE_SERVICE_ROLE_KEY=... \
INCOME_TAX_TRAIN_USER_ID=... \
INCOME_TAX_BOOTSTRAP_CASES=250 \
npm run income-tax:bootstrap
```

## 3) Real-case ingestion target
- Replace synthetic calibration rows with real CA-reviewed notice + draft pairs.
- Include actual notice extract, corrected draft, and final adjudication outcomes.
- Track issue resolution and hearing outcomes in feedback rows.

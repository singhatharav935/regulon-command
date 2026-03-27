# AI Launch Readiness

This document tracks the AI-specific controls required before REGULON can be launched as a production-grade compliance drafting platform.

## Software Controls Implemented

### Model routing and resilience

- Primary model is configured through `OPENAI_MODEL`.
- Fallback model is configurable through `OPENAI_FALLBACK_MODEL`.
- Edge function retry routing applies bounded retries on `429` and `5xx` responses.
- Response metadata records:
  - model used
  - whether fallback was used
  - attempt count
  - model router version

### Prompt and QA traceability

- Draft responses now carry:
  - `promptPolicyVersion`
  - `qaPolicyVersion`
  - router version metadata
- Frontend draft review surfaces prompt/QA policy versions in the AI governance panel.
- Draft versions and audit events preserve a time-based history of AI output evolution and human review.

### Human review gating

- Final sign-off is blocked when:
  - filing score is below 75
  - missing filing items exist
  - low-confidence / low-fit citations remain
  - authority consistency check fails
- Human review remains mandatory before final filing output.

### Authority and hallucination control

- QA payload includes:
  - citation review
  - authority consistency check
  - missing-for-filing blockers
  - explainability anchors
- Sign-off UI surfaces these controls so a reviewer can stop unsafe output before filing.

## Operational Controls Still Required

### Billing and quota management

- Keep OpenAI billing active with a dedicated production project.
- Maintain monthly quota buffers sized for peak filing cycles.
- Configure alerting for:
  - 50% monthly burn
  - 75% monthly burn
  - 90% monthly burn
  - hard-spend threshold approach
- Separate dev/staging/prod API usage where possible.

### Rate-limit operations

- Monitor:
  - request volume by authority
  - 429 rate by model
  - fallback model activation frequency
  - retry amplification
- Add dashboard alerts if fallback usage spikes or if 429 rates exceed threshold.

### Red-team and legal-risk validation

- Run adversarial tests for:
  - fabricated sections/rules/citations
  - wrong authority framing
  - over-assertive prayer language
  - unsupported factual assumptions
  - placeholder leakage
  - cross-authority template contamination
  - contract clause hallucination
- Store test corpus and expected outcomes as a reusable release gate.

## Release Gate

AI launch is blocked unless all of the below are true:

- Production OpenAI billing is active and monitored.
- Fallback model is configured and tested.
- 429 retry behavior is verified in staging.
- Prompt/QA versions are visible in output metadata.
- Human review gate cannot be bypassed in production.
- Authority/citation blockers prevent final sign-off.
- Red-team legal-risk suite passes for all authorities.

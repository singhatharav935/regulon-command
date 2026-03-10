# Final Readiness Gate (Pre-Launch / Pre-YC)

Use this as the mandatory sign-off checklist before declaring the product "fully ready."

## P0: Must Be Complete

- [ ] **1) Real Accuracy Layer (not UI-only)**
  - [ ] Every draft section is grounded to applicable law/rule references.
  - [ ] Confidence scoring is shown per key section/claim.
  - [ ] Mandatory CA/Lawyer review gate is enforced before final output.

- [ ] **2) Evidence Cross-Check Engine**
  - [ ] Draft claims are auto-checked against uploaded notice/PDF fields.
  - [ ] Hard flags exist for date mismatch, section mismatch, amount mismatch.
  - [ ] Missing annexures/mandatory evidence are auto-detected.

- [ ] **3) Production Audit + Liability Controls**
  - [ ] Immutable audit trail (who changed what, when).
  - [ ] Approval chain captured (drafter -> reviewer -> final approver).
  - [ ] "AI assist only" legal disclaimer is present in workflow and exports.

- [ ] **4) Outcome Tracking Dashboard**
  - [ ] First-pass acceptance rate tracked.
  - [ ] Correction/rework rate tracked.
  - [ ] Time-to-final-draft tracked.
  - [ ] Accuracy quality segmented by notice class (MCA/GST/etc.).

- [ ] **5) Knowledge / Version Governance**
  - [ ] Rulebook updates are versioned with effective dates.
  - [ ] Generated draft stores the knowledge version used.
  - [ ] Re-generation can be compared across knowledge versions.

- [ ] **6) Real Customer Readiness**
  - [ ] RBAC is complete for CA firm roles and client isolation.
  - [ ] SLA and workload visibility are operational.
  - [ ] Billing/invoicing and support escalation workflows are in place.
  - [ ] Filing-season incident handling runbook exists.

## Final Sign-Off

- [ ] Product owner sign-off
- [ ] Compliance lead sign-off
- [ ] CA/Law reviewer sign-off
- [ ] Engineering release sign-off

When all P0 items are checked, product can be marked as "Final Ready."

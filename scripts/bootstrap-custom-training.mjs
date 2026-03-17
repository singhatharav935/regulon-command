#!/usr/bin/env node
import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const userId = process.env.CUSTOM_TRAIN_USER_ID;
const totalCases = Number(process.env.CUSTOM_BOOTSTRAP_CASES || "250");

if (!supabaseUrl || !serviceRoleKey || !userId) {
  console.error("Missing env. Required: SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, CUSTOM_TRAIN_USER_ID");
  process.exit(1);
}

const supabase = createClient(supabaseUrl, serviceRoleKey, {
  auth: { persistSession: false, autoRefreshToken: false },
});

const noticeClasses = [
  "regulatory-scn-reply",
  "adjudication-order-appeal",
  "license-registration-compliance",
  "late-filing-delay-condonation",
  "tax-demand-computation",
  "penalty-interest-mitigation",
  "refund-rejection-recovery",
  "show-cause-natural-justice",
  "investigation-summons-response",
  "inspection-audit-objection",
  "classification-valuation-dispute",
  "input-credit-deduction-dispute",
  "procedural-noncompliance",
  "documentation-evidence-deficiency",
  "jurisdiction-limitation-objection",
  "rectification-revision",
  "appeal-stay-interim-relief",
  "cross-border-forex-trade",
  "industry-specific-compliance",
  "custom-general",
];

const buildCase = (index) => {
  const noticeClass = noticeClasses[index % noticeClasses.length];
  const month = String((index % 12) + 1).padStart(2, "0");
  const day = String((index % 28) + 1).padStart(2, "0");
  return {
    user_id: userId,
    notice_class: noticeClass,
    notice_reference: `BOOT/CSTM/2026/${String(index + 1).padStart(4, "0")}`,
    notice_date: `2026-${month}-${day}`,
    notice_snapshot:
      `Bootstrap synthetic Custom Regulatory notice summary (${noticeClass}). ` +
      `Ref BOOT/CSTM/2026/${String(index + 1).padStart(4, "0")} alleging procedural/substantive compliance gaps. ` +
      `This record is for pipeline calibration only and must be superseded by real CA-reviewed cases.`,
    generated_draft:
      `Synthetic Custom training draft for ${noticeClass}. Includes allegation-wise rebuttal matrix, ` +
      `provision-wise legal framing, chronology table, computation challenge, and calibrated prayer for testing ingestion and quality gates.`,
    status: "captured",
    filing_score: 68 + (index % 28),
    risk_band: index % 3 === 0 ? "low" : index % 3 === 1 ? "medium" : "high",
    outcome_label: "pending",
    qa_payload: {
      source: "bootstrap_synthetic",
      class: noticeClass,
      synthetic: true,
    },
    metadata: {
      source: "bootstrap_synthetic",
      version: "1",
      requires_real_case_replacement: true,
    },
  };
};

const run = async () => {
  console.log(`Creating ${totalCases} Custom bootstrap cases for user ${userId}...`);
  const rows = Array.from({ length: totalCases }, (_, i) => buildCase(i));

  const chunkSize = 100;
  let inserted = 0;
  for (let i = 0; i < rows.length; i += chunkSize) {
    const chunk = rows.slice(i, i + chunkSize);
    const { error } = await supabase.from("custom_training_cases").insert(chunk);
    if (error) {
      console.error(`Insert failed at chunk ${i / chunkSize + 1}:`, error.message);
      process.exit(1);
    }
    inserted += chunk.length;
    console.log(`Inserted ${inserted}/${totalCases}`);
  }
  console.log("Bootstrap done.");
  console.log("Important: these are synthetic calibration cases, not real adjudication outcomes.");
};

run().catch((error) => {
  console.error(error);
  process.exit(1);
});

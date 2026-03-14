#!/usr/bin/env node
import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const userId = process.env.SEBI_TRAIN_USER_ID;
const totalCases = Number(process.env.SEBI_BOOTSTRAP_CASES || "250");

if (!supabaseUrl || !serviceRoleKey || !userId) {
  console.error("Missing env. Required: SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, SEBI_TRAIN_USER_ID");
  process.exit(1);
}

const supabase = createClient(supabaseUrl, serviceRoleKey, {
  auth: { persistSession: false, autoRefreshToken: false },
});

const noticeClasses = [
  "lodr-30-disclosure-delay",
  "lodr-33-financial-results-delay",
  "pit-violation",
  "sast-disclosure",
  "ia-research-analyst-compliance",
  "aif-pms-compliance",
  "icdr-takeover-issue",
  "mutual-fund-distributor-compliance",
  "sebi-general",
];

const buildCase = (index) => {
  const noticeClass = noticeClasses[index % noticeClasses.length];
  const month = String((index % 12) + 1).padStart(2, "0");
  const day = String((index % 28) + 1).padStart(2, "0");
  return {
    user_id: userId,
    notice_class: noticeClass,
    notice_reference: `BOOT/SEBI/2026/${String(index + 1).padStart(4, "0")}`,
    notice_date: `2026-${month}-${day}`,
    notice_snapshot:
      `Bootstrap synthetic SEBI notice summary (${noticeClass}). ` +
      `Ref BOOT/SEBI/2026/${String(index + 1).padStart(4, "0")} alleging disclosure/governance non-compliance and potential monetary implication. ` +
      `This record is for pipeline calibration only and must be superseded by real CA-reviewed cases.`,
    generated_draft:
      `Synthetic SEBI training draft for ${noticeClass}. Includes allegation-wise rebuttal matrix, ` +
      `regulation mapping, chronology table, evidence mapping, and calibrated prayer for testing ingestion and quality gates.`,
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
  console.log(`Creating ${totalCases} SEBI bootstrap cases for user ${userId}...`);
  const rows = Array.from({ length: totalCases }, (_, i) => buildCase(i));

  const chunkSize = 100;
  let inserted = 0;
  for (let i = 0; i < rows.length; i += chunkSize) {
    const chunk = rows.slice(i, i + chunkSize);
    const { error } = await supabase.from("sebi_training_cases").insert(chunk);
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

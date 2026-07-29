/**
 * FIXED ASSET & DUAL DEPRECIATION ENGINE — PHASE 9
 * ==================================================
 * Pure TypeScript. Zero external dependencies.
 *
 * Covers:
 *  §1  Types & Interfaces
 *  §2  Companies Act 2013 — Schedule II Useful Life Table (SLM & WDV)
 *  §3  Income Tax Act 1961 — Section 32 Block of Assets & WDV Rates
 *  §4  Dual Depreciation Runner (CA + IT Act side-by-side)
 *  §5  Disposal / Sale Engine (Profit / Loss on sale, auto-journal)
 *  §6  CWIP (Capital Work-in-Progress) Tracker & Capitalization
 *  §7  Deferred Tax Engine (AS-22 / Ind AS 12 — Timing Differences)
 *  §8  Auto Journal Entry Builder
 *  §9  Asset Portfolio Aggregator & Summary
 */

// ─────────────────────────────────────────────────────────────────────────────
// §1  TYPES & INTERFACES
// ─────────────────────────────────────────────────────────────────────────────

export type AssetCategory =
  | "BUILDING_FACTORY"
  | "BUILDING_OFFICE"
  | "PLANT_MACHINERY_GENERAL"
  | "PLANT_MACHINERY_HEAVY"
  | "COMPUTERS_SERVERS"
  | "COMPUTERS_LAPTOPS"
  | "FURNITURE_FIXTURES"
  | "OFFICE_EQUIPMENT"
  | "VEHICLE_CAR"
  | "VEHICLE_COMMERCIAL"
  | "INTANGIBLE_SOFTWARE"
  | "INTANGIBLE_PATENTS"
  | "ELECTRICAL_INSTALLATIONS"
  | "LABORATORY_EQUIPMENT";

export type DepreciationMethod = "SLM" | "WDV";
export type AssetStatus = "ACTIVE" | "FULLY_DEPRECIATED" | "DISPOSED" | "CWIP" | "WRITTEN_OFF";
export type ITBlock = "BLOCK_1" | "BLOCK_2" | "BLOCK_3" | "BLOCK_4" | "BLOCK_5" | "BLOCK_6" | "BLOCK_7" | "BLOCK_8" | "BLOCK_9";

export interface FixedAsset {
  id: string;
  asset_tag: string;                // e.g. FA-2025-001
  name: string;
  description?: string;
  category: AssetCategory;
  it_block: ITBlock;
  location: string;
  department: string;
  purchase_date: string;            // ISO YYYY-MM-DD
  capitalization_date: string;      // Date from which dep starts
  gross_block: number;              // Original cost (including all incidental costs)
  opening_accumulated_dep: number;  // Accumulated dep as of last year end
  opening_net_block: number;        // gross_block - opening_accumulated_dep
  financial_year: string;           // e.g. "2025-26"
  ca_method: DepreciationMethod;    // Schedule II method used
  ca_useful_life_years: number;     // Companies Act prescribed useful life
  ca_wdv_rate?: number;             // WDV rate if CA method = WDV
  ca_residual_value_pct: number;    // CA residual value % (typically 5%)
  it_wdv_rate: number;              // IT Act Section 32 WDV rate %
  supplier_name?: string;
  invoice_number?: string;
  invoice_date?: string;
  is_imported: boolean;
  serial_number?: string;
  asset_life_months_elapsed: number; // Months since capitalization at FY start
  status: AssetStatus;
  disposal_date?: string;
  disposal_proceeds?: number;
  cwip_reference?: string;
  notes?: string;
}

export interface DepreciationResult {
  asset_id: string;
  asset_tag: string;
  asset_name: string;
  category: AssetCategory;
  financial_year: string;
  gross_block: number;
  opening_accumulated_dep: number;
  opening_net_block: number;
  // Companies Act (CA)
  ca_method: DepreciationMethod;
  ca_depreciation_fy: number;
  ca_accumulated_dep_closing: number;
  ca_net_block_closing: number;
  ca_effective_rate: number;
  // Income Tax Act (IT)
  it_wdv_rate: number;
  it_depreciation_fy: number;
  it_wdv_closing: number;
  // Timing Difference
  timing_difference: number;        // CA dep - IT dep (positive = CA > IT = DTL)
  cumulative_timing_diff: number;
  deferred_tax_rate: number;
  deferred_tax_impact: number;
  // Journal reference
  journal_id: string;
}

export interface AssetBlock {
  block: ITBlock;
  description: string;
  wdv_rate_pct: number;
  opening_wdv: number;
  additions_fy: number;
  disposals_fy: number;             // Sale proceeds or written down value at disposal
  depreciation_fy: number;
  closing_wdv: number;
  assets: string[];                 // Asset IDs in this block
}

export interface DisposalRecord {
  id: string;
  asset_id: string;
  asset_tag: string;
  asset_name: string;
  disposal_date: string;
  disposal_type: "SALE" | "SCRAP" | "WRITE_OFF" | "EXCHANGE";
  original_cost: number;
  accumulated_dep_at_disposal: number;
  net_block_at_disposal: number;
  sale_proceeds: number;
  profit_or_loss: number;           // Positive = Profit, Negative = Loss
  buyer_name?: string;
  short_term_capital_gain?: number; // STCG for IT Act (asset held < 3 years)
  it_block_impact: number;          // Reduction in block WDV
  journal_entry: AssetJournalEntry;
}

export interface CWIPRecord {
  id: string;
  project_name: string;
  project_code: string;
  category: AssetCategory;
  department: string;
  start_date: string;
  expected_completion_date: string;
  actual_completion_date?: string;
  total_cost_incurred: number;
  cost_breakdown: { description: string; amount: number; date: string }[];
  status: "IN_PROGRESS" | "COMPLETED" | "ABANDONED";
  capitalized_as?: string;          // Asset ID after capitalization
  notes?: string;
}

export interface DeferredTaxRecord {
  asset_id: string;
  asset_name: string;
  financial_year: string;
  ca_depreciation: number;
  it_depreciation: number;
  timing_difference: number;        // CA - IT (positive = CA > IT = DTL)
  cumulative_timing_difference: number;
  deferred_tax_rate: number;
  deferred_tax_liability: number;   // Positive = DTL, Negative = DTA
  movement: number;                 // Change from prior year
  nature: "DTA" | "DTL" | "NIL";
}

export interface AssetJournalEntry {
  id: string;
  date: string;
  event_type: "PURCHASE" | "DEPRECIATION_CA" | "DEPRECIATION_IT" | "DISPOSAL" | "CWIP_TRANSFER" | "IMPAIRMENT";
  description: string;
  lines: { account_code: string; account_name: string; type: "DEBIT" | "CREDIT"; amount: number }[];
  total_debit: number;
  total_credit: number;
  is_balanced: boolean;
}

export interface AssetPortfolioSummary {
  total_assets: number;
  total_gross_block: number;
  total_accumulated_dep: number;
  total_net_block: number;
  total_cwip: number;
  total_ca_depreciation_fy: number;
  total_it_depreciation_fy: number;
  total_deferred_tax_liability: number;
  fully_depreciated_count: number;
  active_count: number;
  disposed_count: number;
  by_category: Record<string, { gross: number; net: number; dep_fy: number; count: number }>;
}

// ─────────────────────────────────────────────────────────────────────────────
// §2  COMPANIES ACT 2013 — SCHEDULE II USEFUL LIFE TABLE
// ─────────────────────────────────────────────────────────────────────────────

export interface ScheduleIIEntry {
  useful_life_years: number;
  residual_value_pct: number;       // Default 5%
  slm_rate: number;                 // (1 - residual%) / useful_life
  wdv_rate: number;                 // 1 - (residual%)^(1/useful_life)
  description: string;
  it_block: ITBlock;
}

export const SCHEDULE_II: Record<AssetCategory, ScheduleIIEntry> = {
  BUILDING_FACTORY: {
    useful_life_years: 30, residual_value_pct: 5,
    slm_rate: 0.95 / 30, wdv_rate: 1 - Math.pow(0.05, 1 / 30),
    description: "Factory Buildings (RCC / Steel Frame)", it_block: "BLOCK_1",
  },
  BUILDING_OFFICE: {
    useful_life_years: 60, residual_value_pct: 5,
    slm_rate: 0.95 / 60, wdv_rate: 1 - Math.pow(0.05, 1 / 60),
    description: "Office / Commercial Buildings", it_block: "BLOCK_1",
  },
  PLANT_MACHINERY_GENERAL: {
    useful_life_years: 15, residual_value_pct: 5,
    slm_rate: 0.95 / 15, wdv_rate: 1 - Math.pow(0.05, 1 / 15),
    description: "Plant & Machinery — General (not specifically covered)", it_block: "BLOCK_4",
  },
  PLANT_MACHINERY_HEAVY: {
    useful_life_years: 20, residual_value_pct: 5,
    slm_rate: 0.95 / 20, wdv_rate: 1 - Math.pow(0.05, 1 / 20),
    description: "Heavy Industrial Plant & Machinery", it_block: "BLOCK_4",
  },
  COMPUTERS_SERVERS: {
    useful_life_years: 3, residual_value_pct: 5,
    slm_rate: 0.95 / 3, wdv_rate: 1 - Math.pow(0.05, 1 / 3),
    description: "Servers, Networking Equipment & Data Processing Machinery", it_block: "BLOCK_5",
  },
  COMPUTERS_LAPTOPS: {
    useful_life_years: 3, residual_value_pct: 5,
    slm_rate: 0.95 / 3, wdv_rate: 1 - Math.pow(0.05, 1 / 3),
    description: "Computers, Laptops, Peripherals & Printers", it_block: "BLOCK_5",
  },
  FURNITURE_FIXTURES: {
    useful_life_years: 10, residual_value_pct: 5,
    slm_rate: 0.95 / 10, wdv_rate: 1 - Math.pow(0.05, 1 / 10),
    description: "Furniture & Fixtures", it_block: "BLOCK_3",
  },
  OFFICE_EQUIPMENT: {
    useful_life_years: 5, residual_value_pct: 5,
    slm_rate: 0.95 / 5, wdv_rate: 1 - Math.pow(0.05, 1 / 5),
    description: "Office Equipment (Typewriters, Calculators, etc.)", it_block: "BLOCK_4",
  },
  VEHICLE_CAR: {
    useful_life_years: 8, residual_value_pct: 5,
    slm_rate: 0.95 / 8, wdv_rate: 1 - Math.pow(0.05, 1 / 8),
    description: "Motor Cars (not used as taxis)", it_block: "BLOCK_8",
  },
  VEHICLE_COMMERCIAL: {
    useful_life_years: 8, residual_value_pct: 5,
    slm_rate: 0.95 / 8, wdv_rate: 1 - Math.pow(0.05, 1 / 8),
    description: "Motor Lorries, Buses, Taxis", it_block: "BLOCK_7",
  },
  INTANGIBLE_SOFTWARE: {
    useful_life_years: 3, residual_value_pct: 0,
    slm_rate: 1 / 3, wdv_rate: 1 - Math.pow(0, 1 / 3),
    description: "Computer Software (as per IT Act)", it_block: "BLOCK_5",
  },
  INTANGIBLE_PATENTS: {
    useful_life_years: 10, residual_value_pct: 0,
    slm_rate: 0.1, wdv_rate: 0.25,
    description: "Patents, Trademarks, Copyrights, Licenses", it_block: "BLOCK_9",
  },
  ELECTRICAL_INSTALLATIONS: {
    useful_life_years: 10, residual_value_pct: 5,
    slm_rate: 0.95 / 10, wdv_rate: 1 - Math.pow(0.05, 1 / 10),
    description: "Electrical Installations & Fittings", it_block: "BLOCK_4",
  },
  LABORATORY_EQUIPMENT: {
    useful_life_years: 10, residual_value_pct: 5,
    slm_rate: 0.95 / 10, wdv_rate: 1 - Math.pow(0.05, 1 / 10),
    description: "Laboratory Equipment", it_block: "BLOCK_4",
  },
};

// ─────────────────────────────────────────────────────────────────────────────
// §3  INCOME TAX ACT 1961 — SECTION 32 BLOCK OF ASSETS
// ─────────────────────────────────────────────────────────────────────────────

export const IT_ACT_BLOCKS: Record<ITBlock, { description: string; wdv_rate: number; examples: string }> = {
  BLOCK_1: { description: "Buildings (RCC/permanent) — 5% WDV",        wdv_rate: 5,  examples: "Factory buildings, office buildings, godowns" },
  BLOCK_2: { description: "Buildings (Temporary) — 40% WDV",           wdv_rate: 40, examples: "Wooden/mud structures, temporary structures" },
  BLOCK_3: { description: "Furniture & Fittings — 10% WDV",            wdv_rate: 10, examples: "Office furniture, cupboards, air conditioners" },
  BLOCK_4: { description: "Plant & Machinery — 15% WDV",               wdv_rate: 15, examples: "General P&M, office equipment, electrical fittings" },
  BLOCK_5: { description: "Computers & Software — 40% WDV",            wdv_rate: 40, examples: "Computers, laptops, servers, software" },
  BLOCK_6: { description: "Plant & Machinery (Energy/Pollution) — 40%", wdv_rate: 40, examples: "Solar panels, wind mills, pollution control equipment" },
  BLOCK_7: { description: "Commercial Vehicles — 30% WDV",             wdv_rate: 30, examples: "Lorries, buses, taxis, trucks" },
  BLOCK_8: { description: "Motor Cars — 15% WDV",                      wdv_rate: 15, examples: "Cars, jeeps (not used as taxis)" },
  BLOCK_9: { description: "Intangible Assets — 25% WDV",               wdv_rate: 25, examples: "Know-how, patents, copyrights, trademarks, franchises" },
};

// ─────────────────────────────────────────────────────────────────────────────
// §4  DUAL DEPRECIATION RUNNER
// ─────────────────────────────────────────────────────────────────────────────

const CORPORATE_TAX_RATE = 0.25; // 25% + surcharge ~26% effective, simplified to 25.17%

function computeCADepreciation(asset: FixedAsset): number {
  const sch = SCHEDULE_II[asset.category];
  const depreciableAmount = asset.gross_block * (1 - sch.residual_value_pct / 100);
  const maxAccumulated = depreciableAmount;
  const remaining = maxAccumulated - asset.opening_accumulated_dep;
  if (remaining <= 0) return 0;

  let dep: number;
  if (asset.ca_method === "SLM") {
    dep = depreciableAmount * sch.slm_rate;
  } else {
    dep = asset.opening_net_block * sch.wdv_rate;
  }

  // Pro-rate if asset added mid-year (months remaining / 12)
  const monthsInFY = 12;
  const monthsPurchasedBeforeFY = asset.asset_life_months_elapsed;
  let proration = 1;
  if (monthsPurchasedBeforeFY === 0) {
    // Purchased this FY — pro-rate from purchase month
    proration = 0.5; // Default half-year convention for new assets in FY
  }

  return Math.min(dep * proration, remaining);
}

function computeITDepreciation(asset: FixedAsset): number {
  const rate = asset.it_wdv_rate / 100;
  const base = asset.opening_net_block; // IT uses opening WDV = opening net block
  let dep = base * rate;

  // 50% rule: if asset acquired in 2nd half of FY (after Oct 3), only 50% dep allowed
  if (asset.asset_life_months_elapsed === 0) {
    dep = dep * 0.5;
  }

  return dep;
}

export function runDualDepreciation(asset: FixedAsset, financialYear: string): DepreciationResult {
  const ca_dep = computeCADepreciation(asset);
  const it_dep = computeITDepreciation(asset);
  const timing_diff = ca_dep - it_dep;
  const deferred_tax_impact = timing_diff * CORPORATE_TAX_RATE;

  const result: DepreciationResult = {
    asset_id: asset.id,
    asset_tag: asset.asset_tag,
    asset_name: asset.name,
    category: asset.category,
    financial_year: financialYear,
    gross_block: asset.gross_block,
    opening_accumulated_dep: asset.opening_accumulated_dep,
    opening_net_block: asset.opening_net_block,
    ca_method: asset.ca_method,
    ca_depreciation_fy: Math.round(ca_dep),
    ca_accumulated_dep_closing: Math.round(asset.opening_accumulated_dep + ca_dep),
    ca_net_block_closing: Math.round(asset.gross_block - (asset.opening_accumulated_dep + ca_dep)),
    ca_effective_rate: asset.opening_net_block > 0 ? (ca_dep / asset.opening_net_block) * 100 : 0,
    it_wdv_rate: asset.it_wdv_rate,
    it_depreciation_fy: Math.round(it_dep),
    it_wdv_closing: Math.round(asset.opening_net_block - it_dep),
    timing_difference: Math.round(timing_diff),
    cumulative_timing_diff: 0, // Set by aggregator
    deferred_tax_rate: CORPORATE_TAX_RATE * 100,
    deferred_tax_impact: Math.round(deferred_tax_impact),
    journal_id: `DEP-JE-${asset.id}-${financialYear.replace("-", "")}`,
  };

  return result;
}

export function runPortfolioDepreciation(assets: FixedAsset[], financialYear: string): DepreciationResult[] {
  return assets
    .filter(a => a.status === "ACTIVE")
    .map(a => runDualDepreciation(a, financialYear));
}

// ─────────────────────────────────────────────────────────────────────────────
// §5  DISPOSAL / SALE ENGINE
// ─────────────────────────────────────────────────────────────────────────────

export function computeDisposal(
  asset: FixedAsset,
  disposalDate: string,
  saleProceeds: number,
  disposalType: DisposalRecord["disposal_type"],
  buyerName?: string,
): DisposalRecord {
  const accDepAtDisposal = asset.opening_accumulated_dep;
  const netBlockAtDisposal = asset.gross_block - accDepAtDisposal;
  const profitOrLoss = saleProceeds - netBlockAtDisposal;
  const itBlockImpact = Math.min(saleProceeds, netBlockAtDisposal);

  const je = buildDisposalJournal(asset, disposalDate, saleProceeds, netBlockAtDisposal, accDepAtDisposal, profitOrLoss);

  return {
    id: `DISP-${asset.id}`,
    asset_id: asset.id,
    asset_tag: asset.asset_tag,
    asset_name: asset.name,
    disposal_date: disposalDate,
    disposal_type: disposalType,
    original_cost: asset.gross_block,
    accumulated_dep_at_disposal: accDepAtDisposal,
    net_block_at_disposal: netBlockAtDisposal,
    sale_proceeds: saleProceeds,
    profit_or_loss: profitOrLoss,
    buyer_name: buyerName,
    it_block_impact: itBlockImpact,
    journal_entry: je,
  };
}

function buildDisposalJournal(
  asset: FixedAsset,
  date: string,
  proceeds: number,
  netBlock: number,
  accDep: number,
  pnl: number,
): AssetJournalEntry {
  const lines: AssetJournalEntry["lines"] = [
    { account_code: "1001", account_name: "Bank / Receivable (Sale Proceeds)", type: "DEBIT",  amount: proceeds },
    { account_code: "1901", account_name: "Accumulated Depreciation A/C",      type: "DEBIT",  amount: accDep },
    { account_code: "1900", account_name: `Fixed Asset — ${asset.name} (Gross)`, type: "CREDIT", amount: asset.gross_block },
  ];

  if (pnl > 0) {
    lines.push({ account_code: "7010", account_name: "Profit on Sale of Fixed Asset", type: "CREDIT", amount: pnl });
  } else if (pnl < 0) {
    lines.push({ account_code: "7011", account_name: "Loss on Sale of Fixed Asset",   type: "DEBIT",  amount: Math.abs(pnl) });
  }

  const total_debit  = lines.filter(l => l.type === "DEBIT").reduce((s, l) => s + l.amount, 0);
  const total_credit = lines.filter(l => l.type === "CREDIT").reduce((s, l) => s + l.amount, 0);

  return {
    id: `DISP-JE-${asset.id}`,
    date,
    event_type: "DISPOSAL",
    description: `Disposal of ${asset.name} (${asset.asset_tag}) — ${asset.status === "DISPOSED" ? "Sale" : "Write-off"}`,
    lines,
    total_debit,
    total_credit,
    is_balanced: Math.abs(total_debit - total_credit) < 1,
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// §6  CWIP TRACKER & CAPITALIZATION
// ─────────────────────────────────────────────────────────────────────────────

export function capitalizeCWIP(cwip: CWIPRecord, assetTag: string): AssetJournalEntry {
  const je: AssetJournalEntry = {
    id: `CWIP-JE-${cwip.id}`,
    date: cwip.actual_completion_date || new Date().toISOString().slice(0, 10),
    event_type: "CWIP_TRANSFER",
    description: `Capitalization of CWIP: ${cwip.project_name} → ${assetTag}`,
    lines: [
      { account_code: "1900", account_name: "Fixed Asset — Gross Block",      type: "DEBIT",  amount: cwip.total_cost_incurred },
      { account_code: "1950", account_name: "Capital Work-in-Progress (CWIP)", type: "CREDIT", amount: cwip.total_cost_incurred },
    ],
    total_debit: cwip.total_cost_incurred,
    total_credit: cwip.total_cost_incurred,
    is_balanced: true,
  };
  return je;
}

// ─────────────────────────────────────────────────────────────────────────────
// §7  DEFERRED TAX ENGINE (AS-22 / IND AS 12)
// ─────────────────────────────────────────────────────────────────────────────

export function computeDeferredTax(results: DepreciationResult[], taxRate: number = 25): DeferredTaxRecord[] {
  return results.map(r => {
    const timing = r.timing_difference;
    const dtl = timing * (taxRate / 100);
    return {
      asset_id: r.asset_id,
      asset_name: r.asset_name,
      financial_year: r.financial_year,
      ca_depreciation: r.ca_depreciation_fy,
      it_depreciation: r.it_depreciation_fy,
      timing_difference: timing,
      cumulative_timing_difference: timing, // Will be updated by consumer with prior years
      deferred_tax_rate: taxRate,
      deferred_tax_liability: dtl,
      movement: dtl,
      nature: timing > 0 ? "DTL" : timing < 0 ? "DTA" : "NIL",
    };
  });
}

export function computeBlockOfAssets(assets: FixedAsset[], depResults: DepreciationResult[]): AssetBlock[] {
  const blockMap = new Map<ITBlock, AssetBlock>();

  for (const [block, info] of Object.entries(IT_ACT_BLOCKS) as [ITBlock, typeof IT_ACT_BLOCKS[ITBlock]][]) {
    const blockAssets = assets.filter(a => a.it_block === block);
    if (blockAssets.length === 0) continue;

    const opening_wdv = blockAssets.reduce((s, a) => s + a.opening_net_block, 0);
    const additions = blockAssets.filter(a => a.asset_life_months_elapsed === 0).reduce((s, a) => s + a.gross_block, 0);
    const blockDep = depResults.filter(d => blockAssets.some(a => a.id === d.asset_id)).reduce((s, d) => s + d.it_depreciation_fy, 0);

    blockMap.set(block, {
      block,
      description: info.description,
      wdv_rate_pct: info.wdv_rate,
      opening_wdv,
      additions_fy: additions,
      disposals_fy: 0,
      depreciation_fy: blockDep,
      closing_wdv: Math.max(0, opening_wdv + additions - blockDep),
      assets: blockAssets.map(a => a.id),
    });
  }

  return Array.from(blockMap.values());
}

// ─────────────────────────────────────────────────────────────────────────────
// §8  AUTO JOURNAL ENTRY BUILDER
// ─────────────────────────────────────────────────────────────────────────────

export function buildDepreciationJournal(
  results: DepreciationResult[],
  date: string,
  financialYear: string,
): AssetJournalEntry {
  const totalCADep = results.reduce((s, r) => s + r.ca_depreciation_fy, 0);

  const depByCategory: Record<string, number> = {};
  for (const r of results) {
    depByCategory[r.category] = (depByCategory[r.category] || 0) + r.ca_depreciation_fy;
  }

  const lines: AssetJournalEntry["lines"] = [
    { account_code: "6001", account_name: "Depreciation Expense (P&L)", type: "DEBIT",  amount: totalCADep },
    { account_code: "1901", account_name: "Accumulated Depreciation (Balance Sheet)",  type: "CREDIT", amount: totalCADep },
  ];

  return {
    id: `DEP-JE-${financialYear.replace("-", "")}-CONSOLIDATED`,
    date,
    event_type: "DEPRECIATION_CA",
    description: `Annual Depreciation Run — Companies Act (Schedule II) — FY ${financialYear}`,
    lines,
    total_debit: totalCADep,
    total_credit: totalCADep,
    is_balanced: true,
  };
}

export function buildAssetPurchaseJournal(asset: FixedAsset): AssetJournalEntry {
  return {
    id: `PURCH-JE-${asset.id}`,
    date: asset.capitalization_date,
    event_type: "PURCHASE",
    description: `Capitalization: ${asset.name} (${asset.asset_tag}) purchased from ${asset.supplier_name || "Supplier"}`,
    lines: [
      { account_code: "1900", account_name: `Fixed Asset — ${SCHEDULE_II[asset.category].description}`, type: "DEBIT",  amount: asset.gross_block },
      { account_code: "2001", account_name: "Creditors / Bank (Asset Purchase)",                        type: "CREDIT", amount: asset.gross_block },
    ],
    total_debit: asset.gross_block,
    total_credit: asset.gross_block,
    is_balanced: true,
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// §9  ASSET PORTFOLIO AGGREGATOR
// ─────────────────────────────────────────────────────────────────────────────

export function aggregatePortfolio(assets: FixedAsset[], depResults: DepreciationResult[], cwip: CWIPRecord[]): AssetPortfolioSummary {
  const activeAssets = assets.filter(a => a.status === "ACTIVE");
  const totalGrossBlock = assets.filter(a => a.status !== "DISPOSED").reduce((s, a) => s + a.gross_block, 0);
  const totalAccDep = assets.filter(a => a.status !== "DISPOSED").reduce((s, a) => s + a.opening_accumulated_dep, 0);
  const totalCADep = depResults.reduce((s, r) => s + r.ca_depreciation_fy, 0);
  const totalITDep = depResults.reduce((s, r) => s + r.it_depreciation_fy, 0);
  const totalDTL = depResults.reduce((s, r) => s + r.deferred_tax_impact, 0);
  const totalCWIP = cwip.filter(c => c.status === "IN_PROGRESS").reduce((s, c) => s + c.total_cost_incurred, 0);

  const byCategory: AssetPortfolioSummary["by_category"] = {};
  for (const asset of activeAssets) {
    const dep = depResults.find(d => d.asset_id === asset.id);
    if (!byCategory[asset.category]) byCategory[asset.category] = { gross: 0, net: 0, dep_fy: 0, count: 0 };
    byCategory[asset.category].gross += asset.gross_block;
    byCategory[asset.category].net += asset.opening_net_block;
    byCategory[asset.category].dep_fy += dep?.ca_depreciation_fy || 0;
    byCategory[asset.category].count += 1;
  }

  return {
    total_assets: assets.length,
    total_gross_block: totalGrossBlock,
    total_accumulated_dep: totalAccDep,
    total_net_block: totalGrossBlock - totalAccDep,
    total_cwip: totalCWIP,
    total_ca_depreciation_fy: totalCADep,
    total_it_depreciation_fy: totalITDep,
    total_deferred_tax_liability: totalDTL,
    fully_depreciated_count: assets.filter(a => a.status === "FULLY_DEPRECIATED").length,
    active_count: activeAssets.length,
    disposed_count: assets.filter(a => a.status === "DISPOSED").length,
    by_category: byCategory,
  };
}

/**
 * DEMO DATA — FIXED ASSETS & DUAL DEPRECIATION (PHASE 9)
 * ========================================================
 * 22 assets across all categories, CWIP records, disposals,
 * dual depreciation runs, deferred tax workings
 */

import {
  runPortfolioDepreciation, computeDisposal, computeDeferredTax,
  computeBlockOfAssets, aggregatePortfolio, buildDepreciationJournal,
  buildAssetPurchaseJournal, capitalizeCWIP,
  type FixedAsset, type CWIPRecord, type DisposalRecord,
  type DepreciationResult, type DeferredTaxRecord, type AssetBlock,
  type AssetJournalEntry,
} from "@/lib/accounting/fixed-asset-engine";

// ─────────────────────────────────────────────────────────────────────────────
// SECTION 1: FIXED ASSET REGISTER — 22 ASSETS
// ─────────────────────────────────────────────────────────────────────────────

export const DEMO_FIXED_ASSETS: FixedAsset[] = [
  // ─── BUILDINGS ──────────────────────────────────────────────────────────
  {
    id: "FA-001", asset_tag: "FA-2021-001",
    name: "Head Office Building — Hitech City", description: "6-storey RCC commercial office building",
    category: "BUILDING_OFFICE", it_block: "BLOCK_1",
    location: "Hitech City, Hyderabad", department: "Administration",
    purchase_date: "2021-04-01", capitalization_date: "2021-04-01",
    gross_block: 45000000, opening_accumulated_dep: 2812500,
    opening_net_block: 42187500, financial_year: "2025-26",
    ca_method: "SLM", ca_useful_life_years: 60, ca_residual_value_pct: 5,
    it_wdv_rate: 5, supplier_name: "Prestige Constructions Ltd",
    invoice_number: "PRES-2021-HO", invoice_date: "2021-03-30",
    is_imported: false, asset_life_months_elapsed: 48, status: "ACTIVE",
  },
  {
    id: "FA-002", asset_tag: "FA-2022-001",
    name: "Hyderabad Warehouse — Patancheru",
    category: "BUILDING_FACTORY", it_block: "BLOCK_1",
    location: "Patancheru Industrial Area, Hyderabad", department: "Operations",
    purchase_date: "2022-07-01", capitalization_date: "2022-07-01",
    gross_block: 18000000, opening_accumulated_dep: 855000,
    opening_net_block: 17145000, financial_year: "2025-26",
    ca_method: "SLM", ca_useful_life_years: 30, ca_residual_value_pct: 5,
    it_wdv_rate: 5, supplier_name: "Sri Constructions Pvt Ltd",
    invoice_number: "SCP-2022-WH", invoice_date: "2022-06-28",
    is_imported: false, asset_life_months_elapsed: 36, status: "ACTIVE",
  },

  // ─── PLANT & MACHINERY ─────────────────────────────────────────────────
  {
    id: "FA-003", asset_tag: "FA-2020-001",
    name: "CNC Machining Center — Mazak VTC800",
    category: "PLANT_MACHINERY_GENERAL", it_block: "BLOCK_4",
    location: "Patancheru Warehouse", department: "Manufacturing",
    purchase_date: "2020-04-01", capitalization_date: "2020-04-01",
    gross_block: 8500000, opening_accumulated_dep: 2146667,
    opening_net_block: 6353333, financial_year: "2025-26",
    ca_method: "SLM", ca_useful_life_years: 15, ca_residual_value_pct: 5,
    it_wdv_rate: 15, supplier_name: "Mazak India Pvt Ltd",
    invoice_number: "MAZAK-2020-001", invoice_date: "2020-03-28",
    is_imported: false, asset_life_months_elapsed: 60, status: "ACTIVE",
  },
  {
    id: "FA-004", asset_tag: "FA-2023-001",
    name: "Industrial Air Compressor — Atlas Copco GA110",
    category: "PLANT_MACHINERY_GENERAL", it_block: "BLOCK_4",
    location: "Patancheru Warehouse", department: "Manufacturing",
    purchase_date: "2023-06-15", capitalization_date: "2023-07-01",
    gross_block: 1200000, opening_accumulated_dep: 152000,
    opening_net_block: 1048000, financial_year: "2025-26",
    ca_method: "SLM", ca_useful_life_years: 15, ca_residual_value_pct: 5,
    it_wdv_rate: 15, supplier_name: "Atlas Copco India Ltd",
    invoice_number: "ATCO-2023-GH110", invoice_date: "2023-06-14",
    is_imported: false, asset_life_months_elapsed: 24, status: "ACTIVE",
  },
  {
    id: "FA-005", asset_tag: "FA-2024-001",
    name: "Solar Power Plant — 100 kWp Rooftop",
    category: "PLANT_MACHINERY_GENERAL", it_block: "BLOCK_6",
    location: "Head Office Terrace", department: "Facilities",
    purchase_date: "2024-10-01", capitalization_date: "2024-10-01",
    gross_block: 5500000, opening_accumulated_dep: 0,
    opening_net_block: 5500000, financial_year: "2025-26",
    ca_method: "SLM", ca_useful_life_years: 15, ca_residual_value_pct: 5,
    it_wdv_rate: 40, supplier_name: "Tata Power Solar Systems",
    invoice_number: "TPSS-2024-SPP", invoice_date: "2024-09-25",
    is_imported: false, asset_life_months_elapsed: 6, status: "ACTIVE",
  },

  // ─── COMPUTERS & SERVERS ───────────────────────────────────────────────
  {
    id: "FA-006", asset_tag: "FA-2024-002",
    name: "Dell PowerEdge R750 Server Cluster (x4)",
    category: "COMPUTERS_SERVERS", it_block: "BLOCK_5",
    location: "Server Room — 3rd Floor, Head Office", department: "IT",
    purchase_date: "2024-04-01", capitalization_date: "2024-04-01",
    gross_block: 2800000, opening_accumulated_dep: 0,
    opening_net_block: 2800000, financial_year: "2025-26",
    ca_method: "SLM", ca_useful_life_years: 3, ca_residual_value_pct: 5,
    it_wdv_rate: 40, supplier_name: "Dell Technologies India Pvt Ltd",
    invoice_number: "DELL-2024-SVR", invoice_date: "2024-03-28",
    is_imported: false, asset_life_months_elapsed: 12, status: "ACTIVE",
  },
  {
    id: "FA-007", asset_tag: "FA-2023-002",
    name: "Apple MacBook Pro (x25 units)",
    category: "COMPUTERS_LAPTOPS", it_block: "BLOCK_5",
    location: "Across Offices", department: "IT",
    purchase_date: "2023-04-01", capitalization_date: "2023-04-01",
    gross_block: 1875000, opening_accumulated_dep: 593750,
    opening_net_block: 1281250, financial_year: "2025-26",
    ca_method: "SLM", ca_useful_life_years: 3, ca_residual_value_pct: 5,
    it_wdv_rate: 40, supplier_name: "Maple India (Apple Reseller)",
    invoice_number: "AAPL-2023-BULK", invoice_date: "2023-03-30",
    is_imported: false, asset_life_months_elapsed: 24, status: "ACTIVE",
  },
  {
    id: "FA-008", asset_tag: "FA-2022-002",
    name: "Enterprise ERP Software License (SAP B1)",
    category: "INTANGIBLE_SOFTWARE", it_block: "BLOCK_5",
    location: "All Locations", department: "IT",
    purchase_date: "2022-10-01", capitalization_date: "2022-10-01",
    gross_block: 950000, opening_accumulated_dep: 634450,
    opening_net_block: 315550, financial_year: "2025-26",
    ca_method: "SLM", ca_useful_life_years: 3, ca_residual_value_pct: 0,
    it_wdv_rate: 40, supplier_name: "SAP India Pvt Ltd",
    invoice_number: "SAP-2022-B1LIC", invoice_date: "2022-09-28",
    is_imported: false, asset_life_months_elapsed: 30, status: "ACTIVE",
  },
  {
    id: "FA-009", asset_tag: "FA-2025-001",
    name: "HP EliteDesk Desktops (x15 units) — FY25 Addition",
    category: "COMPUTERS_LAPTOPS", it_block: "BLOCK_5",
    location: "Sales Office", department: "Sales",
    purchase_date: "2025-04-15", capitalization_date: "2025-05-01",
    gross_block: 750000, opening_accumulated_dep: 0,
    opening_net_block: 750000, financial_year: "2025-26",
    ca_method: "SLM", ca_useful_life_years: 3, ca_residual_value_pct: 5,
    it_wdv_rate: 40, supplier_name: "HP India Sales Pvt Ltd",
    invoice_number: "HP-2025-DESK15", invoice_date: "2025-04-14",
    is_imported: false, asset_life_months_elapsed: 0, status: "ACTIVE",
  },

  // ─── FURNITURE & FIXTURES ───────────────────────────────────────────────
  {
    id: "FA-010", asset_tag: "FA-2021-002",
    name: "Office Furniture Package — Head Office (Modular Workstations x80)",
    category: "FURNITURE_FIXTURES", it_block: "BLOCK_3",
    location: "Head Office", department: "Administration",
    purchase_date: "2021-06-01", capitalization_date: "2021-06-01",
    gross_block: 3200000, opening_accumulated_dep: 1216000,
    opening_net_block: 1984000, financial_year: "2025-26",
    ca_method: "SLM", ca_useful_life_years: 10, ca_residual_value_pct: 5,
    it_wdv_rate: 10, supplier_name: "Godrej Interio Ltd",
    invoice_number: "GI-2021-WS80", invoice_date: "2021-05-28",
    is_imported: false, asset_life_months_elapsed: 48, status: "ACTIVE",
  },
  {
    id: "FA-011", asset_tag: "FA-2023-003",
    name: "CCTV Surveillance System (64 Cameras)",
    category: "ELECTRICAL_INSTALLATIONS", it_block: "BLOCK_4",
    location: "Head Office + Warehouse", department: "Security",
    purchase_date: "2023-08-01", capitalization_date: "2023-08-01",
    gross_block: 480000, opening_accumulated_dep: 68400,
    opening_net_block: 411600, financial_year: "2025-26",
    ca_method: "SLM", ca_useful_life_years: 10, ca_residual_value_pct: 5,
    it_wdv_rate: 15, supplier_name: "CP Plus India",
    invoice_number: "CPP-2023-CCTV", invoice_date: "2023-07-30",
    is_imported: false, asset_life_months_elapsed: 24, status: "ACTIVE",
  },

  // ─── OFFICE EQUIPMENT ──────────────────────────────────────────────────
  {
    id: "FA-012", asset_tag: "FA-2023-004",
    name: "Ricoh Multifunction Printer (x8 units)",
    category: "OFFICE_EQUIPMENT", it_block: "BLOCK_4",
    location: "Head Office & Sales Branch", department: "Administration",
    purchase_date: "2023-05-01", capitalization_date: "2023-05-01",
    gross_block: 320000, opening_accumulated_dep: 96000,
    opening_net_block: 224000, financial_year: "2025-26",
    ca_method: "SLM", ca_useful_life_years: 5, ca_residual_value_pct: 5,
    it_wdv_rate: 15, supplier_name: "Ricoh India Ltd",
    invoice_number: "RICOH-2023-MFP8", invoice_date: "2023-04-28",
    is_imported: false, asset_life_months_elapsed: 24, status: "ACTIVE",
  },

  // ─── VEHICLES ──────────────────────────────────────────────────────────
  {
    id: "FA-013", asset_tag: "FA-2022-003",
    name: "Toyota Fortuner — Company Car (MD)",
    category: "VEHICLE_CAR", it_block: "BLOCK_8",
    location: "Head Office", department: "Senior Management",
    purchase_date: "2022-04-01", capitalization_date: "2022-04-01",
    gross_block: 3800000, opening_accumulated_dep: 1425000,
    opening_net_block: 2375000, financial_year: "2025-26",
    ca_method: "SLM", ca_useful_life_years: 8, ca_residual_value_pct: 5,
    it_wdv_rate: 15, supplier_name: "Navnit Toyota, Hyderabad",
    invoice_number: "TOY-2022-FORT", invoice_date: "2022-03-29",
    is_imported: false, serial_number: "TS09EM4521", asset_life_months_elapsed: 36, status: "ACTIVE",
  },
  {
    id: "FA-014", asset_tag: "FA-2023-005",
    name: "Tata Ace (Commercial Delivery Van x3)",
    category: "VEHICLE_COMMERCIAL", it_block: "BLOCK_7",
    location: "Warehouse — Patancheru", department: "Logistics",
    purchase_date: "2023-04-01", capitalization_date: "2023-04-01",
    gross_block: 1950000, opening_accumulated_dep: 487500,
    opening_net_block: 1462500, financial_year: "2025-26",
    ca_method: "SLM", ca_useful_life_years: 8, ca_residual_value_pct: 5,
    it_wdv_rate: 30, supplier_name: "Tata Motors (Authorized Dealer), Hyderabad",
    invoice_number: "TATA-2023-ACE3", invoice_date: "2023-03-28",
    is_imported: false, asset_life_months_elapsed: 24, status: "ACTIVE",
  },
  {
    id: "FA-015", asset_tag: "FA-2021-003",
    name: "Mahindra XUV500 — Field Sales Vehicle",
    category: "VEHICLE_CAR", it_block: "BLOCK_8",
    location: "Sales Team — Rotating", department: "Sales",
    purchase_date: "2021-04-01", capitalization_date: "2021-04-01",
    gross_block: 1800000, opening_accumulated_dep: 855000,
    opening_net_block: 945000, financial_year: "2025-26",
    ca_method: "SLM", ca_useful_life_years: 8, ca_residual_value_pct: 5,
    it_wdv_rate: 15, supplier_name: "Mahindra & Mahindra, Hyderabad",
    invoice_number: "MM-2021-XUV", invoice_date: "2021-03-30",
    is_imported: false, serial_number: "TS09EP6789", asset_life_months_elapsed: 48, status: "ACTIVE",
  },

  // ─── LABORATORY / TESTING EQUIPMENT ────────────────────────────────────
  {
    id: "FA-016", asset_tag: "FA-2022-004",
    name: "Spectrophotometer — Shimadzu UV-1900",
    category: "LABORATORY_EQUIPMENT", it_block: "BLOCK_4",
    location: "R&D Lab — 2nd Floor", department: "R&D",
    purchase_date: "2022-09-01", capitalization_date: "2022-09-01",
    gross_block: 680000, opening_accumulated_dep: 97667,
    opening_net_block: 582333, financial_year: "2025-26",
    ca_method: "SLM", ca_useful_life_years: 10, ca_residual_value_pct: 5,
    it_wdv_rate: 15, supplier_name: "Shimadzu Analytical (India) Pvt Ltd",
    invoice_number: "SHIM-2022-UV19", invoice_date: "2022-08-28",
    is_imported: true, asset_life_months_elapsed: 30, status: "ACTIVE",
  },

  // ─── INTANGIBLES ───────────────────────────────────────────────────────
  {
    id: "FA-017", asset_tag: "FA-2020-002",
    name: "Brand Trademark — SANNIDH (Registered)",
    category: "INTANGIBLE_PATENTS", it_block: "BLOCK_9",
    location: "Corporate — All India", department: "Legal",
    purchase_date: "2020-01-01", capitalization_date: "2020-01-01",
    gross_block: 500000, opening_accumulated_dep: 250000,
    opening_net_block: 250000, financial_year: "2025-26",
    ca_method: "SLM", ca_useful_life_years: 10, ca_residual_value_pct: 0,
    it_wdv_rate: 25, supplier_name: "Internal (Trademark Registration Cost)",
    is_imported: false, asset_life_months_elapsed: 60, status: "ACTIVE",
  },

  // ─── FULLY DEPRECIATED ─────────────────────────────────────────────────
  {
    id: "FA-018", asset_tag: "FA-2019-001",
    name: "Old Server Rack — Dell PowerEdge R430 (x2)",
    category: "COMPUTERS_SERVERS", it_block: "BLOCK_5",
    location: "Server Room", department: "IT",
    purchase_date: "2019-04-01", capitalization_date: "2019-04-01",
    gross_block: 380000, opening_accumulated_dep: 361000,
    opening_net_block: 19000, financial_year: "2025-26",
    ca_method: "SLM", ca_useful_life_years: 3, ca_residual_value_pct: 5,
    it_wdv_rate: 40, supplier_name: "Dell Technologies India Pvt Ltd",
    invoice_number: "DELL-2019-R430",
    is_imported: false, asset_life_months_elapsed: 72, status: "FULLY_DEPRECIATED",
  },

  // ─── DISPOSED ─────────────────────────────────────────────────────────
  {
    id: "FA-019", asset_tag: "FA-2018-001",
    name: "Old Hyundai i20 — Sales Vehicle (Disposed)",
    category: "VEHICLE_CAR", it_block: "BLOCK_8",
    location: "Disposed", department: "Sales",
    purchase_date: "2018-04-01", capitalization_date: "2018-04-01",
    gross_block: 750000, opening_accumulated_dep: 712500,
    opening_net_block: 37500, financial_year: "2025-26",
    ca_method: "SLM", ca_useful_life_years: 8, ca_residual_value_pct: 5,
    it_wdv_rate: 15, is_imported: false, asset_life_months_elapsed: 72,
    status: "DISPOSED", disposal_date: "2025-07-01", disposal_proceeds: 125000,
  },

  // ─── NEW ADDITIONS FY 2025-26 ─────────────────────────────────────────
  {
    id: "FA-020", asset_tag: "FA-2025-002",
    name: "Air Handling Unit (AHU) — 40 TR Central AC",
    category: "ELECTRICAL_INSTALLATIONS", it_block: "BLOCK_4",
    location: "Head Office — All Floors", department: "Facilities",
    purchase_date: "2025-06-01", capitalization_date: "2025-06-01",
    gross_block: 1800000, opening_accumulated_dep: 0,
    opening_net_block: 1800000, financial_year: "2025-26",
    ca_method: "SLM", ca_useful_life_years: 10, ca_residual_value_pct: 5,
    it_wdv_rate: 15, supplier_name: "Voltas Ltd",
    invoice_number: "VOLT-2025-AHU40", invoice_date: "2025-05-28",
    is_imported: false, asset_life_months_elapsed: 0, status: "ACTIVE",
  },
  {
    id: "FA-021", asset_tag: "FA-2025-003",
    name: "Hydraulic Press — 100 Ton (FY25 Addition)",
    category: "PLANT_MACHINERY_HEAVY", it_block: "BLOCK_4",
    location: "Patancheru Warehouse", department: "Manufacturing",
    purchase_date: "2025-07-01", capitalization_date: "2025-07-01",
    gross_block: 3200000, opening_accumulated_dep: 0,
    opening_net_block: 3200000, financial_year: "2025-26",
    ca_method: "SLM", ca_useful_life_years: 20, ca_residual_value_pct: 5,
    it_wdv_rate: 15, supplier_name: "Rajkot Hydraulics Pvt Ltd",
    invoice_number: "RHP-2025-HP100", invoice_date: "2025-06-28",
    is_imported: false, asset_life_months_elapsed: 0, status: "ACTIVE",
  },
  {
    id: "FA-022", asset_tag: "FA-2024-003",
    name: "Goods Lift — Hydraulic Platform (1.5 Ton)",
    category: "PLANT_MACHINERY_GENERAL", it_block: "BLOCK_4",
    location: "Head Office — Basement to 6F", department: "Facilities",
    purchase_date: "2024-04-01", capitalization_date: "2024-04-01",
    gross_block: 850000, opening_accumulated_dep: 0,
    opening_net_block: 850000, financial_year: "2025-26",
    ca_method: "SLM", ca_useful_life_years: 15, ca_residual_value_pct: 5,
    it_wdv_rate: 15, supplier_name: "Otis Elevator Company India",
    invoice_number: "OTIS-2024-LIFT", invoice_date: "2024-03-28",
    is_imported: false, asset_life_months_elapsed: 12, status: "ACTIVE",
  },
];

// ─────────────────────────────────────────────────────────────────────────────
// SECTION 2: CWIP RECORDS
// ─────────────────────────────────────────────────────────────────────────────

export const DEMO_CWIP_RECORDS: CWIPRecord[] = [
  {
    id: "CWIP-001",
    project_name: "Pune Branch Office — Fit-out & Interior",
    project_code: "PROJ-PUNE-2025",
    category: "BUILDING_OFFICE",
    department: "Administration",
    start_date: "2025-04-01",
    expected_completion_date: "2025-09-30",
    total_cost_incurred: 4200000,
    cost_breakdown: [
      { description: "Civil Work — RCC Slab & Walls",    amount: 1800000, date: "2025-04-30" },
      { description: "Electrical Wiring & Panel",         amount: 650000,  date: "2025-05-31" },
      { description: "Plumbing & Sanitation",             amount: 320000,  date: "2025-06-30" },
      { description: "False Ceiling & Flooring",          amount: 780000,  date: "2025-07-31" },
      { description: "Fire Fighting System",              amount: 450000,  date: "2025-08-15" },
    ],
    status: "IN_PROGRESS",
    notes: "Delayed by 30 days due to monsoon. Expected completion: Oct 2025.",
  },
  {
    id: "CWIP-002",
    project_name: "R&D Lab Expansion — Phase 2 Equipment",
    project_code: "PROJ-RD-2025",
    category: "LABORATORY_EQUIPMENT",
    department: "R&D",
    start_date: "2025-05-01",
    expected_completion_date: "2025-08-31",
    actual_completion_date: "2025-08-25",
    total_cost_incurred: 2800000,
    cost_breakdown: [
      { description: "HPLC Equipment — Waters Corp",       amount: 1800000, date: "2025-05-15" },
      { description: "Fume Hood & Exhaust System",         amount: 420000,  date: "2025-06-01" },
      { description: "Lab Refrigerators (x4)",             amount: 380000,  date: "2025-06-15" },
      { description: "Installation & Commissioning",       amount: 200000,  date: "2025-08-25" },
    ],
    status: "COMPLETED",
    capitalized_as: "FA-2025-RDLAB",
  },
  {
    id: "CWIP-003",
    project_name: "ERP System Upgrade — Phase 3 (Cloud Migration)",
    project_code: "PROJ-ERP-2025",
    category: "INTANGIBLE_SOFTWARE",
    department: "IT",
    start_date: "2025-06-01",
    expected_completion_date: "2025-12-31",
    total_cost_incurred: 1500000,
    cost_breakdown: [
      { description: "Consulting Fees — TCS",              amount: 800000,  date: "2025-06-30" },
      { description: "Cloud Infrastructure Setup (AWS)",   amount: 450000,  date: "2025-07-31" },
      { description: "Data Migration & Testing",           amount: 250000,  date: "2025-08-31" },
    ],
    status: "IN_PROGRESS",
  },
];

// ─────────────────────────────────────────────────────────────────────────────
// SECTION 3: DISPOSAL RECORDS
// ─────────────────────────────────────────────────────────────────────────────

const disposedAsset = DEMO_FIXED_ASSETS.find(a => a.id === "FA-019")!;

export const DEMO_DISPOSAL_RECORDS: DisposalRecord[] = [
  computeDisposal(
    disposedAsset,
    "2025-07-01",
    125000,
    "SALE",
    "Sathyam Auto Exchange, Hyderabad",
  ),
];

// ─────────────────────────────────────────────────────────────────────────────
// SECTION 4: DUAL DEPRECIATION RUN — FY 2025-26
// ─────────────────────────────────────────────────────────────────────────────

export const DEMO_DEPRECIATION_RESULTS: DepreciationResult[] = runPortfolioDepreciation(
  DEMO_FIXED_ASSETS,
  "2025-26",
);

// ─────────────────────────────────────────────────────────────────────────────
// SECTION 5: DEFERRED TAX REGISTER
// ─────────────────────────────────────────────────────────────────────────────

export const DEMO_DEFERRED_TAX_RECORDS: DeferredTaxRecord[] = computeDeferredTax(
  DEMO_DEPRECIATION_RESULTS,
  25,
);

// ─────────────────────────────────────────────────────────────────────────────
// SECTION 6: BLOCK OF ASSETS (IT ACT)
// ─────────────────────────────────────────────────────────────────────────────

export const DEMO_ASSET_BLOCKS: AssetBlock[] = computeBlockOfAssets(
  DEMO_FIXED_ASSETS.filter(a => a.status === "ACTIVE"),
  DEMO_DEPRECIATION_RESULTS,
);

// ─────────────────────────────────────────────────────────────────────────────
// SECTION 7: AUTO JOURNAL ENTRIES
// ─────────────────────────────────────────────────────────────────────────────

export const DEMO_DEP_JOURNAL: AssetJournalEntry = buildDepreciationJournal(
  DEMO_DEPRECIATION_RESULTS,
  "2026-03-31",
  "2025-26",
);

export const DEMO_PURCHASE_JOURNALS: AssetJournalEntry[] = DEMO_FIXED_ASSETS
  .filter(a => a.asset_life_months_elapsed === 0 && a.status === "ACTIVE")
  .map(buildAssetPurchaseJournal);

export const DEMO_CWIP_JOURNALS: AssetJournalEntry[] = DEMO_CWIP_RECORDS
  .filter(c => c.status === "COMPLETED")
  .map(c => capitalizeCWIP(c, c.capitalized_as || "FA-NEW"));

// ─────────────────────────────────────────────────────────────────────────────
// SECTION 8: PORTFOLIO SUMMARY
// ─────────────────────────────────────────────────────────────────────────────

export const DEMO_ASSET_PORTFOLIO_SUMMARY = aggregatePortfolio(
  DEMO_FIXED_ASSETS,
  DEMO_DEPRECIATION_RESULTS,
  DEMO_CWIP_RECORDS,
);

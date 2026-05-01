/**
 * Advanced Calculators API Routes — Sannidh
 * A. Tax Regime Optimizer
 * B. Capital Gains Broker Sync (STCG/LTCG + CII)
 * C. Advance Tax Radar (Predictive 234B/C)
 * D. Deferred Tax & Dual-Book Depreciation
 *
 * Mounted at: /api/v1/ca/calculators/
 * Does NOT modify any existing route files.
 */

import express from 'express';
import pkg from 'pg';

const { Pool } = pkg;
const router = express.Router();

const pool = new Pool({
  connectionString: process.env.DATABASE_URL || 'postgresql://localhost:5432/sannidh_production',
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
});

// ─── CII TABLE (FY 2001-02 = 100 base, IT Dept official) ───────────────────
const CII_TABLE = {
  '2001-02': 100, '2002-03': 105, '2003-04': 109, '2004-05': 113,
  '2005-06': 117, '2006-07': 122, '2007-08': 129, '2008-09': 137,
  '2009-10': 148, '2010-11': 167, '2011-12': 184, '2012-13': 200,
  '2013-14': 220, '2014-15': 240, '2015-16': 254, '2016-17': 264,
  '2017-18': 272, '2018-19': 280, '2019-20': 289, '2020-21': 301,
  '2021-22': 317, '2022-23': 331, '2023-24': 348, '2024-25': 363,
};

// ─── OLD REGIME SLABS (Individual < 60 yrs) ────────────────────────────────
function calcOldRegimeTax(taxableIncome) {
  let tax = 0;
  if (taxableIncome <= 250000) tax = 0;
  else if (taxableIncome <= 500000) tax = (taxableIncome - 250000) * 0.05;
  else if (taxableIncome <= 1000000) tax = 12500 + (taxableIncome - 500000) * 0.20;
  else tax = 112500 + (taxableIncome - 1000000) * 0.30;
  // Rebate u/s 87A
  if (taxableIncome <= 500000) tax = 0;
  const surcharge = taxableIncome > 5000000 ? tax * 0.10 : 0;
  const cess = (tax + surcharge) * 0.04;
  return Math.round(tax + surcharge + cess);
}

// ─── NEW REGIME SLABS (FY 2024-25 onwards) ─────────────────────────────────
function calcNewRegimeTax(taxableIncome) {
  // Standard deduction of ₹75,000 already applied by caller
  let tax = 0;
  if (taxableIncome <= 300000) tax = 0;
  else if (taxableIncome <= 700000) tax = (taxableIncome - 300000) * 0.05;
  else if (taxableIncome <= 1000000) tax = 20000 + (taxableIncome - 700000) * 0.10;
  else if (taxableIncome <= 1200000) tax = 50000 + (taxableIncome - 1000000) * 0.15;
  else if (taxableIncome <= 1500000) tax = 80000 + (taxableIncome - 1200000) * 0.20;
  else tax = 140000 + (taxableIncome - 1500000) * 0.30;
  // Rebate u/s 87A — new regime: up to ₹7L
  if (taxableIncome <= 700000) tax = 0;
  const surcharge = taxableIncome > 5000000 ? tax * 0.10 : 0;
  const cess = (tax + surcharge) * 0.04;
  return Math.round(tax + surcharge + cess);
}

// ══════════════════════════════════════════════════════════════════════════════
// A. TAX REGIME OPTIMIZER
// POST /api/v1/ca/calculators/regime-optimizer
// ══════════════════════════════════════════════════════════════════════════════
router.post('/regime-optimizer', async (req, res) => {
  try {
    const {
      client_id,
      gross_salary = 0,
      hra_exemption = 0,
      sec_80c = 0,           // max 150000
      sec_80d = 0,           // max 25000/50000
      sec_80ccd_1b = 0,      // NPS — max 50000
      home_loan_interest = 0,// max 200000
      other_deductions = 0,
      professional_tax = 0,  // max 2400
    } = req.body;

    // ── OLD REGIME ──
    const standardDeductionOld = 50000;
    const totalDeductions = Math.min(sec_80c, 150000)
      + Math.min(sec_80d, 50000)
      + Math.min(sec_80ccd_1b, 50000)
      + Math.min(home_loan_interest, 200000)
      + other_deductions
      + Math.min(professional_tax, 2400);

    const taxableOld = Math.max(0,
      gross_salary - hra_exemption - standardDeductionOld - totalDeductions
    );
    const taxOld = calcOldRegimeTax(taxableOld);

    // ── NEW REGIME ──
    const standardDeductionNew = 75000;
    const taxableNew = Math.max(0, gross_salary - standardDeductionNew);
    const taxNew = calcNewRegimeTax(taxableNew);

    const saving = taxOld - taxNew; // positive = New Regime saves money
    const recommended = saving >= 0 ? 'new' : 'old';

    const result = {
      old_regime: {
        gross_salary,
        hra_exemption,
        standard_deduction: standardDeductionOld,
        total_deductions: totalDeductions,
        taxable_income: taxableOld,
        tax_liability: taxOld,
      },
      new_regime: {
        gross_salary,
        standard_deduction: standardDeductionNew,
        taxable_income: taxableNew,
        tax_liability: taxNew,
      },
      comparison: {
        saving: Math.abs(saving),
        saving_regime: recommended,
        recommended,
        recommendation_text: saving >= 0
          ? `You save ₹${Math.abs(saving).toLocaleString('en-IN')} by choosing the New Regime.`
          : `You save ₹${Math.abs(saving).toLocaleString('en-IN')} by staying in the Old Regime (deductions outweigh new slabs).`,
      },
      calculated_at: new Date().toISOString(),
    };

    // Persist session (non-blocking)
    pool.query(
      `INSERT INTO ca_calculator_sessions (client_id, calculator_type, input_data, result_data, created_at)
       VALUES ($1, 'regime_optimizer', $2, $3, NOW())
       ON CONFLICT DO NOTHING`,
      [client_id || null, JSON.stringify(req.body), JSON.stringify(result)]
    ).catch(() => {}); // table may not exist yet — silent fail

    res.json({ success: true, data: result });
  } catch (err) {
    console.error('regime-optimizer error:', err);
    res.status(500).json({ success: false, error: err.message });
  }
});


// ══════════════════════════════════════════════════════════════════════════════
// B. CAPITAL GAINS BROKER SYNC (STCG / LTCG + CII + Grandfathering)
// POST /api/v1/ca/calculators/capital-gains
// Body: { client_id, trades: [{ isin, name, buy_date, buy_price, sell_date, sell_price, quantity, fmv_jan31_2018? }] }
// ══════════════════════════════════════════════════════════════════════════════
router.post('/capital-gains', async (req, res) => {
  try {
    const { client_id, trades = [], assessment_year = '2024-25' } = req.body;

    if (!trades.length) {
      return res.status(400).json({ success: false, error: 'No trades provided.' });
    }

    const getFY = (dateStr) => {
      const d = new Date(dateStr);
      const yr = d.getFullYear();
      const mo = d.getMonth() + 1; // 1-based
      return mo >= 4 ? `${yr}-${String(yr + 1).slice(-2)}` : `${yr - 1}-${String(yr).slice(-2)}`;
    };

    let totalSTCG = 0;
    let totalLTCG = 0;
    const breakdown = [];

    for (const trade of trades) {
      const {
        name, buy_date, buy_price, sell_date, sell_price,
        quantity = 1, fmv_jan31_2018 = null, asset_type = 'equity'
      } = trade;

      const buyDt = new Date(buy_date);
      const sellDt = new Date(sell_date);
      const holdingDays = Math.floor((sellDt - buyDt) / (1000 * 60 * 60 * 24));
      // Equity: LTCG if > 12 months; Debt: > 24 months; Gold: > 36 months
      const ltcgThreshold = asset_type === 'equity' ? 365
        : asset_type === 'debt' ? 730 : 1095;
      const isLTCG = holdingDays > ltcgThreshold;

      const saleValue = sell_price * quantity;
      let costOfAcquisition = buy_price * quantity;

      // Grandfathering: Equity LTCG — cost = max(actual cost, FMV Jan 31 2018) but capped at sale price
      if (isLTCG && asset_type === 'equity' && fmv_jan31_2018) {
        const fmvTotal = fmv_jan31_2018 * quantity;
        const grandFatheredCost = Math.min(Math.max(costOfAcquisition, fmvTotal), saleValue);
        costOfAcquisition = grandFatheredCost;
      }

      // CII Indexation (for non-equity LTCG assets)
      let indexedCost = costOfAcquisition;
      if (isLTCG && asset_type !== 'equity') {
        const buyFY = getFY(buy_date);
        const sellFY = getFY(sell_date);
        const ciiBuy = CII_TABLE[buyFY] || 100;
        const ciiSell = CII_TABLE[sellFY] || CII_TABLE['2024-25'];
        indexedCost = costOfAcquisition * (ciiSell / ciiBuy);
      }

      const gain = saleValue - indexedCost;
      if (isLTCG) totalLTCG += gain;
      else totalSTCG += gain;

      breakdown.push({
        name,
        buy_date,
        sell_date,
        quantity,
        buy_price,
        sell_price,
        holding_days: holdingDays,
        type: isLTCG ? 'LTCG' : 'STCG',
        cost_of_acquisition: Math.round(costOfAcquisition),
        indexed_cost: Math.round(indexedCost),
        gain: Math.round(gain),
        asset_type,
      });
    }

    // Tax computation
    const ltcgExemption = 100000; // ₹1L exempt under Sec 112A
    const taxableLTCG = Math.max(0, totalLTCG - ltcgExemption);
    const ltcgTax = Math.round(taxableLTCG * 0.10 * 1.04); // 10% + 4% cess
    const stcgTax = Math.round(Math.max(0, totalSTCG) * 0.15 * 1.04); // 15% + 4% cess

    const result = {
      summary: {
        total_stcg: Math.round(totalSTCG),
        total_ltcg: Math.round(totalLTCG),
        ltcg_exemption: ltcgExemption,
        taxable_ltcg: Math.round(taxableLTCG),
        stcg_tax: stcgTax,
        ltcg_tax: ltcgTax,
        total_capital_gains_tax: stcgTax + ltcgTax,
        assessment_year,
      },
      breakdown,
      calculated_at: new Date().toISOString(),
    };

    pool.query(
      `INSERT INTO ca_calculator_sessions (client_id, calculator_type, input_data, result_data, created_at)
       VALUES ($1, 'capital_gains', $2, $3, NOW()) ON CONFLICT DO NOTHING`,
      [client_id || null, JSON.stringify({ trades_count: trades.length }), JSON.stringify(result.summary)]
    ).catch(() => {});

    res.json({ success: true, data: result });
  } catch (err) {
    console.error('capital-gains error:', err);
    res.status(500).json({ success: false, error: err.message });
  }
});


// ══════════════════════════════════════════════════════════════════════════════
// C. ADVANCE TAX RADAR (Predictive — Sec 234B/C Interest)
// POST /api/v1/ca/calculators/advance-tax
// ══════════════════════════════════════════════════════════════════════════════
router.post('/advance-tax', async (req, res) => {
  try {
    const {
      client_id,
      ytd_profit,           // Year-to-date net profit
      months_elapsed,       // Months of current FY elapsed (1–12)
      tds_deducted = 0,     // TDS already deducted by payers
      advance_paid = 0,     // Advance tax already paid this year
      regime = 'new',       // 'old' | 'new'
      other_income = 0,
    } = req.body;

    if (!ytd_profit || !months_elapsed) {
      return res.status(400).json({ success: false, error: 'ytd_profit and months_elapsed are required.' });
    }

    // Project full-year income
    const projectedAnnualProfit = (ytd_profit / months_elapsed) * 12 + other_income;

    // Calculate full-year tax
    const grossTax = regime === 'old'
      ? calcOldRegimeTax(projectedAnnualProfit)
      : calcNewRegimeTax(projectedAnnualProfit);

    const netTaxAfterTDS = Math.max(0, grossTax - tds_deducted);

    // Installment schedule (% of net tax)
    const installments = [
      { due: 'June 15',   pct: 0.15, label: '1st Installment' },
      { due: 'Sept 15',   pct: 0.45, label: '2nd Installment' },
      { due: 'Dec 15',    pct: 0.75, label: '3rd Installment' },
      { due: 'Mar 15',    pct: 1.00, label: '4th Installment' },
    ];

    const schedule = installments.map((inst, idx) => {
      const cumRequired = Math.round(netTaxAfterTDS * inst.pct);
      const paidSoFar = advance_paid; // simplified — actual implementation tracks per-installment
      const due = Math.max(0, cumRequired - paidSoFar);
      // 234C interest: 1% per month on shortfall
      const interestRisk234C = due > 0 ? Math.round(due * 0.01) : 0;
      return {
        installment: inst.label,
        due_date: inst.due,
        cumulative_required: cumRequired,
        amount_due_now: due,
        interest_risk_234c: interestRisk234C,
      };
    });

    // 234B: if total advance < 90% of tax
    const required90pct = Math.round(netTaxAfterTDS * 0.90);
    const shortfall234B = Math.max(0, required90pct - advance_paid);
    const interest234B = Math.round(shortfall234B * 0.01); // 1% per month (simplified)

    const result = {
      projection: {
        ytd_profit,
        months_elapsed,
        projected_annual_profit: Math.round(projectedAnnualProfit),
        gross_tax_liability: grossTax,
        tds_deducted,
        net_tax_after_tds: netTaxAfterTDS,
        advance_paid,
        balance_payable: Math.max(0, netTaxAfterTDS - advance_paid),
      },
      installment_schedule: schedule,
      interest_risk: {
        sec_234b_shortfall: shortfall234B,
        sec_234b_interest_per_month: interest234B,
        message: shortfall234B > 0
          ? `Risk: ₹${interest234B.toLocaleString('en-IN')}/month interest u/s 234B if not paid by March 31.`
          : 'No 234B risk — advance tax on track.',
      },
      calculated_at: new Date().toISOString(),
    };

    pool.query(
      `INSERT INTO ca_calculator_sessions (client_id, calculator_type, input_data, result_data, created_at)
       VALUES ($1, 'advance_tax_radar', $2, $3, NOW()) ON CONFLICT DO NOTHING`,
      [client_id || null, JSON.stringify({ ytd_profit, months_elapsed }), JSON.stringify(result.projection)]
    ).catch(() => {});

    res.json({ success: true, data: result });
  } catch (err) {
    console.error('advance-tax error:', err);
    res.status(500).json({ success: false, error: err.message });
  }
});


// ══════════════════════════════════════════════════════════════════════════════
// D. DEFERRED TAX & DUAL-BOOK DEPRECIATION
// POST /api/v1/ca/calculators/deferred-tax
// Body: { client_id, tax_rate, assets: [{ name, cost, purchase_date, asset_class }] }
// ══════════════════════════════════════════════════════════════════════════════

// Companies Act Schedule II — WDV rates (approx)
const COMPANIES_ACT_RATES = {
  'buildings_factory': 0.1,
  'buildings_other': 0.05,
  'plant_machinery': 0.1526,
  'computers': 0.3167,
  'furniture': 0.0621,
  'vehicles': 0.1186,
  'intangibles': 0.25,
  'default': 0.10,
};

// IT Act Appendix I — WDV rates (Section 32)
const IT_ACT_RATES = {
  'buildings_factory': 0.10,
  'buildings_other': 0.05,
  'plant_machinery': 0.15,
  'computers': 0.40,
  'furniture': 0.10,
  'vehicles': 0.15,
  'intangibles': 0.25,
  'default': 0.15,
};

router.post('/deferred-tax', async (req, res) => {
  try {
    const { client_id, assets = [], tax_rate = 0.2592 } = req.body; // 25.92% = 25% + SC + Cess

    if (!assets.length) {
      return res.status(400).json({ success: false, error: 'No assets provided.' });
    }

    const assetSchedule = assets.map((asset) => {
      const { name, cost, asset_class = 'default' } = asset;

      const compRate = COMPANIES_ACT_RATES[asset_class] || COMPANIES_ACT_RATES['default'];
      const itRate = IT_ACT_RATES[asset_class] || IT_ACT_RATES['default'];

      const depnCompaniesAct = Math.round(cost * compRate);
      const depnITAct = Math.round(cost * itRate);

      const timingDifference = depnITAct - depnCompaniesAct; // positive = IT > Books → DTL
      const deferredTaxImpact = Math.round(timingDifference * tax_rate);

      return {
        name,
        gross_block: cost,
        asset_class,
        companies_act: {
          rate_pct: (compRate * 100).toFixed(2),
          depreciation: depnCompaniesAct,
          wdv_after: cost - depnCompaniesAct,
        },
        it_act: {
          rate_pct: (itRate * 100).toFixed(2),
          depreciation: depnITAct,
          wdv_after: cost - depnITAct,
        },
        timing_difference: timingDifference,
        deferred_tax_impact: deferredTaxImpact,
        type: deferredTaxImpact >= 0 ? 'DTL' : 'DTA', // Deferred Tax Liability / Asset
      };
    });

    const totalTimingDiff = assetSchedule.reduce((s, a) => s + a.timing_difference, 0);
    const totalDeferredTax = assetSchedule.reduce((s, a) => s + a.deferred_tax_impact, 0);

    const result = {
      summary: {
        total_assets: assets.length,
        total_gross_block: assets.reduce((s, a) => s + a.cost, 0),
        total_companies_act_depn: assetSchedule.reduce((s, a) => s + a.companies_act.depreciation, 0),
        total_it_act_depn: assetSchedule.reduce((s, a) => s + a.it_act.depreciation, 0),
        net_timing_difference: totalTimingDiff,
        tax_rate_applied: tax_rate,
        total_deferred_tax: totalDeferredTax,
        balance_sheet_entry: totalDeferredTax >= 0
          ? `Deferred Tax Liability (DTL): ₹${Math.abs(totalDeferredTax).toLocaleString('en-IN')}`
          : `Deferred Tax Asset (DTA): ₹${Math.abs(totalDeferredTax).toLocaleString('en-IN')}`,
      },
      asset_schedule: assetSchedule,
      calculated_at: new Date().toISOString(),
    };

    pool.query(
      `INSERT INTO ca_calculator_sessions (client_id, calculator_type, input_data, result_data, created_at)
       VALUES ($1, 'deferred_tax', $2, $3, NOW()) ON CONFLICT DO NOTHING`,
      [client_id || null, JSON.stringify({ assets_count: assets.length }), JSON.stringify(result.summary)]
    ).catch(() => {});

    res.json({ success: true, data: result });
  } catch (err) {
    console.error('deferred-tax error:', err);
    res.status(500).json({ success: false, error: err.message });
  }
});

export default router;

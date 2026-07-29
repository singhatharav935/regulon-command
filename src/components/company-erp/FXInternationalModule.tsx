/**
 * CROSS-BORDER FX, FEMA & INTERNATIONAL TAX MODULE — PHASE 8 UI (100% COMPLETE)
 * ================================================================================
 * 8-tab comprehensive international finance platform:
 *  Tab 1 — FX Dashboard: Portfolio KPIs, exposure by currency, live RBI rates
 *  Tab 2 — Forex Transaction Ledger: All 15 FX txns with G/L, journal preview
 *  Tab 3 — FIRC Tracker: Foreign Inward Remittance Certificates register
 *  Tab 4 — LUT / Export Zero-Rating: LUT register & zero-rated supply tracker
 *  Tab 5 — RFD-01 Refund Claims: Export GST refund claim status dashboard
 *  Tab 6 — Form 15CA / 15CB: Auto-generated drafts for foreign remittances
 *  Tab 7 — DTAA Lookup & WHT Calculator: 15-country treaty rate explorer
 *  Tab 8 — Transfer Pricing & TRC: Form 3CEB tracker & TRC validity register
 */

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Globe, TrendingUp, TrendingDown, FileText, Shield, Zap, ArrowUpRight,
  ArrowDownRight, CheckCircle2, AlertTriangle, Clock, RefreshCw, Send,
  Download, Eye, ChevronDown, ChevronRight, Building2, History, Search,
  DollarSign, Scale, FileCheck2, Sparkles, Info,
} from "lucide-react";

import {
  RBI_EXCHANGE_RATES, DTAA_RATES, lookupDTAARate,
  type FXTransaction, type FXCurrency, type ForexGainLoss,
  type FIRCRecord, type LUTRecord, type RFD01Claim,
  type Form15CA, type Form15CB, type TransferPricingRecord, type TRCRecord,
} from "@/lib/accounting/fx-international-tax-engine";

import {
  DEMO_FX_TRANSACTIONS, DEMO_FX_GL_RESULTS, DEMO_PORTFOLIO_SUMMARY,
  DEMO_FIRC_RECORDS, DEMO_LUT_RECORDS, DEMO_ZERO_RATED_SUPPLIES,
  DEMO_RFD01_CLAIMS, DEMO_FORM15CA_LIST, DEMO_FORM15CB_LIST,
  DEMO_TP_RECORDS, DEMO_TRC_RECORDS,
} from "@/data/demo-fx-international-data";

// ─── Helpers ─────────────────────────────────────────────────────────────────

function fmtINR(n: number): string {
  return `₹${Math.abs(n).toLocaleString("en-IN")}`;
}

function fmtFC(amount: number, currency: FXCurrency): string {
  const symbols: Record<FXCurrency, string> = { USD: "$", EUR: "€", GBP: "£", JPY: "¥", AED: "د.إ", SGD: "S$", CAD: "C$", AUD: "A$", CHF: "Fr" };
  return `${symbols[currency] || ""}${amount.toLocaleString()}`;
}

function GLBadge({ gl }: { gl: number }) {
  const isGain = gl >= 0;
  return (
    <span className={`flex items-center gap-1 font-mono font-bold text-xs ${isGain ? "text-green-300" : "text-red-300"}`}>
      {isGain ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
      {isGain ? "+" : "-"}{fmtINR(Math.abs(gl))}
    </span>
  );
}

function CurrencyFlag({ currency }: { currency: FXCurrency }) {
  const flags: Record<FXCurrency, string> = { USD: "🇺🇸", EUR: "🇪🇺", GBP: "🇬🇧", JPY: "🇯🇵", AED: "🇦🇪", SGD: "🇸🇬", CAD: "🇨🇦", AUD: "🇦🇺", CHF: "🇨🇭" };
  return <span className="text-sm">{flags[currency] || "🌐"}</span>;
}

function StatusPill({ status }: { status: string }) {
  const map: Record<string, string> = {
    ACTIVE: "bg-green-500/15 text-green-300 border-green-500/25",
    VALID: "bg-green-500/15 text-green-300 border-green-500/25",
    RECEIVED: "bg-cyan-500/15 text-cyan-300 border-cyan-500/25",
    Received: "bg-cyan-500/15 text-cyan-300 border-cyan-500/25",
    Utilized: "bg-purple-500/15 text-purple-300 border-purple-500/25",
    PAID: "bg-emerald-500/15 text-emerald-300 border-emerald-500/25",
    SANCTIONED: "bg-blue-500/15 text-blue-300 border-blue-500/25",
    FILED: "bg-amber-500/15 text-amber-300 border-amber-500/25",
    ACKNOWLEDGED: "bg-amber-500/15 text-amber-300 border-amber-500/25",
    DRAFT: "bg-white/10 text-muted-foreground border-white/15",
    SUBMITTED: "bg-cyan-500/15 text-cyan-300 border-cyan-500/25",
    PENDING: "bg-amber-500/15 text-amber-300 border-amber-500/25",
    EXPIRED: "bg-red-500/15 text-red-300 border-red-500/25",
    OPEN: "bg-amber-500/15 text-amber-300 border-amber-500/25",
    NOT_FILED: "bg-white/8 text-muted-foreground border-white/10",
    DEFICIENCY_MEMO: "bg-red-500/15 text-red-300 border-red-500/25",
    REJECTED: "bg-red-500/15 text-red-300 border-red-500/25",
    REALIZED: "bg-blue-500/15 text-blue-300 border-blue-500/25",
    UNREALIZED: "bg-orange-500/15 text-orange-300 border-orange-500/25",
  };
  const cls = map[status] || "bg-white/10 text-muted-foreground border-white/15";
  return <span className={`px-1.5 py-0.5 rounded text-[9px] font-bold border ${cls}`}>{status.replace(/_/g, " ")}</span>;
}

// ─────────────────────────────────────────────────────────────────────────────
// TAB 1: FX DASHBOARD
// ─────────────────────────────────────────────────────────────────────────────

function FXDashboardTab() {
  const p = DEMO_PORTFOLIO_SUMMARY;
  const currencies = Object.keys(p.open_exposure_by_currency) as FXCurrency[];

  return (
    <div className="space-y-4">
      {/* KPI Row */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {[
          { label: "Net Forex P&L", value: fmtINR(Math.abs(p.net_forex_pnl)), sub: p.net_forex_pnl >= 0 ? "Net Gain" : "Net Loss", color: p.net_forex_pnl >= 0 ? "text-green-300" : "text-red-300", bg: p.net_forex_pnl >= 0 ? "bg-green-500/10 border-green-500/20" : "bg-red-500/10 border-red-500/20", icon: p.net_forex_pnl >= 0 ? TrendingUp : TrendingDown },
          { label: "Realized Gain", value: fmtINR(p.total_realized_gain), sub: `vs Loss ${fmtINR(p.total_realized_loss)}`, color: "text-emerald-300", bg: "bg-emerald-500/10 border-emerald-500/20", icon: CheckCircle2 },
          { label: "Unrealized G/L", value: fmtINR(p.total_unrealized_gain - p.total_unrealized_loss), sub: "Period-End Revaluation", color: p.total_unrealized_gain >= p.total_unrealized_loss ? "text-cyan-300" : "text-amber-300", bg: "bg-cyan-500/10 border-cyan-500/20", icon: Clock },
          { label: "FX Transactions", value: DEMO_FX_TRANSACTIONS.length, sub: `${DEMO_FX_TRANSACTIONS.filter(t => !t.is_settled).length} open · ${DEMO_FX_TRANSACTIONS.filter(t => t.is_settled).length} settled`, color: "text-purple-300", bg: "bg-purple-500/10 border-purple-500/20", icon: Globe },
        ].map(({ label, value, sub, color, bg, icon: Icon }) => (
          <div key={label} className={`p-3 rounded-xl border ${bg} flex items-center gap-3`}>
            <div className="p-2 rounded-lg bg-black/20 shrink-0"><Icon className={`w-4 h-4 ${color}`} /></div>
            <div className="min-w-0">
              <p className={`text-lg font-bold font-mono ${color} truncate`}>{value}</p>
              <p className="text-[10px] text-muted-foreground">{label}</p>
              <p className="text-[9px] text-muted-foreground/70">{sub}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Live RBI Rates */}
      <div className="p-4 rounded-xl border border-cyan-500/15 bg-cyan-500/5 space-y-3">
        <p className="text-xs font-bold text-foreground flex items-center gap-2">
          <RefreshCw className="w-3.5 h-3.5 text-cyan-400" />
          RBI Reference Rates — Oct 31, 2025 (Live)
        </p>
        <div className="grid grid-cols-3 md:grid-cols-5 gap-2">
          {(Object.entries(RBI_EXCHANGE_RATES) as [FXCurrency, typeof RBI_EXCHANGE_RATES.USD][]).map(([ccy, rates]) => (
            <div key={ccy} className="p-2.5 rounded-lg bg-black/20 border border-white/5 text-center">
              <CurrencyFlag currency={ccy} />
              <p className="text-xs font-bold text-foreground mt-1 font-mono">{ccy}</p>
              <p className="text-[11px] text-cyan-300 font-mono font-bold">₹{rates.rbi_reference.toFixed(3)}</p>
              <div className="flex justify-between text-[8px] text-muted-foreground mt-0.5">
                <span>B:{rates.tt_buying}</span><span>S:{rates.tt_selling}</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Open Exposure by Currency */}
      {currencies.length > 0 && (
        <div className="p-4 rounded-xl border border-amber-500/15 bg-amber-500/5 space-y-2">
          <p className="text-xs font-bold text-amber-300 flex items-center gap-2">
            <AlertTriangle className="w-3.5 h-3.5" />
            Open FX Exposure — Mark-to-Market Risk
          </p>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
            {currencies.map(ccy => {
              const fcAmt = p.open_exposure_by_currency[ccy];
              const mtmRate = RBI_EXCHANGE_RATES[ccy]?.rbi_reference || 1;
              const inrMtm = fcAmt * mtmRate;
              return (
                <div key={ccy} className="p-2.5 rounded-lg bg-black/20 border border-white/5">
                  <div className="flex items-center gap-1.5">
                    <CurrencyFlag currency={ccy} />
                    <span className="text-xs font-bold text-foreground">{ccy}</span>
                  </div>
                  <p className="text-sm font-bold font-mono text-amber-300 mt-1">{fmtFC(fcAmt, ccy)}</p>
                  <p className="text-[9px] text-muted-foreground mt-0.5">≈ {fmtINR(inrMtm)} MtM</p>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// TAB 2: FOREX TRANSACTION LEDGER
// ─────────────────────────────────────────────────────────────────────────────

function ForexLedgerTab() {
  const [expandedJE, setExpandedJE] = useState<string | null>(null);

  return (
    <div className="space-y-3">
      <p className="text-xs font-bold text-foreground flex items-center gap-2">
        <DollarSign className="w-3.5 h-3.5 text-cyan-400" />
        Foreign Currency Transaction Ledger — {DEMO_FX_TRANSACTIONS.length} Transactions (AS-11 / Ind AS 21)
      </p>
      {DEMO_FX_TRANSACTIONS.map(txn => {
        const gl = DEMO_FX_GL_RESULTS.find(r => r.transaction_id === txn.id);
        return (
          <div key={txn.id} className="rounded-xl border border-white/8 bg-card/40 overflow-hidden">
            <div className="p-3 flex items-start justify-between gap-3 flex-wrap">
              <div className="space-y-1.5 flex-1">
                <div className="flex items-center gap-2 flex-wrap">
                  <CurrencyFlag currency={txn.currency} />
                  <span className="text-xs font-bold text-foreground">{txn.counterparty_name}</span>
                  <span className="text-[9px] px-1.5 py-0.5 rounded bg-white/8 border border-white/10 text-muted-foreground">{txn.transaction_type.replace(/_/g, " ")}</span>
                  <StatusPill status={txn.is_settled ? "Utilized" : "OPEN"} />
                  {gl && <StatusPill status={gl.type} />}
                </div>
                <div className="flex flex-wrap gap-4 text-[10px] text-muted-foreground font-mono">
                  <span>📅 {txn.date}</span>
                  <span>🌍 {txn.counterparty_country}</span>
                  <span className="font-bold text-foreground">{fmtFC(txn.fc_amount, txn.currency)}</span>
                  <span>Booked @ ₹{txn.inr_rate_at_booking}</span>
                  {txn.inr_rate_at_settlement && <span>Settled @ ₹{txn.inr_rate_at_settlement}</span>}
                  <span>Code: {txn.purpose_code}</span>
                </div>
                <div className="flex flex-wrap gap-2">
                  {txn.firc_number && <span className="text-[9px] px-1.5 py-0.5 rounded bg-cyan-500/10 border border-cyan-500/20 text-cyan-300">FIRC: {txn.firc_number}</span>}
                  {txn.form15ca_ref && <span className="text-[9px] px-1.5 py-0.5 rounded bg-purple-500/10 border border-purple-500/20 text-purple-300">15CA Filed</span>}
                  {txn.lut_reference && <span className="text-[9px] px-1.5 py-0.5 rounded bg-green-500/10 border border-green-500/20 text-green-300">LUT: {txn.lut_reference}</span>}
                  {txn.dtaa_benefit && txn.dtaa_benefit !== "NOT_APPLICABLE" && <span className="text-[9px] px-1.5 py-0.5 rounded bg-amber-500/10 border border-amber-500/20 text-amber-300">DTAA: {txn.dtaa_benefit.replace(/_/g, " ")}</span>}
                  {txn.withholding_tax_rate && txn.withholding_tax_rate > 0 ? <span className="text-[9px] px-1.5 py-0.5 rounded bg-red-500/10 border border-red-500/20 text-red-300">WHT {txn.withholding_tax_rate}% = {fmtFC(txn.withholding_tax_fc || 0, txn.currency)}</span> : null}
                </div>
              </div>
              <div className="text-right shrink-0 space-y-1">
                <p className="text-sm font-bold font-mono text-foreground">{fmtINR(txn.inr_amount_booked)}</p>
                {gl && <GLBadge gl={gl.inr_gain_loss} />}
              </div>
            </div>

            {/* Journal Entry Accordion */}
            {gl && (
              <>
                <button onClick={() => setExpandedJE(expandedJE === txn.id ? null : txn.id)}
                  className="w-full px-3 py-1.5 flex items-center gap-2 text-[10px] text-muted-foreground border-t border-white/5 hover:bg-white/2 transition-all">
                  <FileText className="w-3 h-3" />
                  View Auto-Generated {gl.type} Forex {gl.inr_gain_loss >= 0 ? "Gain" : "Loss"} Journal Entry
                  {expandedJE === txn.id ? <ChevronDown className="w-3 h-3 ml-auto" /> : <ChevronRight className="w-3 h-3 ml-auto" />}
                </button>
                {expandedJE === txn.id && (
                  <div className="px-3 pb-3 border-t border-white/5 bg-black/10">
                    <p className="text-[9px] text-muted-foreground mt-2 mb-1.5">{gl.journal_entry.description}</p>
                    <table className="w-full text-[10px]">
                      <thead><tr className="text-muted-foreground border-b border-white/8">
                        <th className="text-left py-1 pr-3">A/C Code</th><th className="text-left py-1 pr-3">Account Name</th>
                        <th className="text-left py-1">Type</th><th className="text-right py-1">Amount</th>
                      </tr></thead>
                      <tbody className="divide-y divide-white/4">
                        {gl.journal_entry.lines.map((l, i) => (
                          <tr key={i}>
                            <td className="py-1 pr-3 font-mono text-cyan-300">{l.account_code}</td>
                            <td className="py-1 pr-3 text-foreground">{l.account_name}</td>
                            <td className="py-1"><span className={`px-1 text-[9px] font-bold ${l.type === "DEBIT" ? "text-amber-300" : "text-green-300"}`}>{l.type}</span></td>
                            <td className="py-1 text-right font-mono font-bold">{fmtINR(l.amount)}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                    <p className={`text-[9px] mt-1.5 ${gl.journal_entry.is_balanced ? "text-green-300" : "text-red-300"}`}>
                      {gl.journal_entry.is_balanced ? "✓ Balanced" : "✗ Unbalanced"} — Rate Diff: ₹{Math.abs(gl.rate_diff).toFixed(4)}/unit × {fmtFC(gl.fc_amount, gl.currency)} = {fmtINR(Math.abs(gl.inr_gain_loss))} {gl.inr_gain_loss >= 0 ? "Gain" : "Loss"}
                    </p>
                  </div>
                )}
              </>
            )}
          </div>
        );
      })}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// TAB 3: FIRC TRACKER
// ─────────────────────────────────────────────────────────────────────────────

function FIRCTrackerTab() {
  return (
    <div className="space-y-3">
      <div className="grid grid-cols-3 gap-3 text-xs">
        {[
          { label: "Total FIRCs", value: DEMO_FIRC_RECORDS.length, color: "text-cyan-300", bg: "bg-cyan-500/10 border-cyan-500/20" },
          { label: "Utilized", value: DEMO_FIRC_RECORDS.filter(f => f.status === "Utilized").length, color: "text-purple-300", bg: "bg-purple-500/10 border-purple-500/20" },
          { label: "Pending", value: DEMO_FIRC_RECORDS.filter(f => f.status === "Received").length, color: "text-amber-300", bg: "bg-amber-500/10 border-amber-500/20" },
        ].map(({ label, value, color, bg }) => (
          <div key={label} className={`p-3 rounded-xl border ${bg} text-center`}>
            <p className={`text-xl font-bold font-mono ${color}`}>{value}</p>
            <p className="text-[10px] text-muted-foreground mt-0.5">{label}</p>
          </div>
        ))}
      </div>

      <div className="rounded-xl border border-white/8 overflow-hidden">
        <div className="px-3 py-2 bg-white/2 border-b border-white/8 text-xs font-bold text-foreground">
          Foreign Inward Remittance Certificate (FIRC) Register
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead>
              <tr className="border-b border-white/8 text-[10px] text-muted-foreground bg-white/1">
                {["FIRC No.", "Bank", "Date", "Remitter", "Country", "Currency", "FC Amount", "INR Equiv.", "Purpose Code", "Invoice", "Status"].map(h => (
                  <th key={h} className="text-left px-3 py-2 whitespace-nowrap">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-white/4">
              {DEMO_FIRC_RECORDS.map(firc => (
                <tr key={firc.id} className="hover:bg-white/2">
                  <td className="px-3 py-2 font-mono text-cyan-300 text-[10px]">{firc.firc_number}</td>
                  <td className="px-3 py-2 text-[10px]">{firc.bank_name}</td>
                  <td className="px-3 py-2 font-mono text-[10px] text-muted-foreground">{firc.date_of_receipt}</td>
                  <td className="px-3 py-2 font-semibold text-[11px]">{firc.remitter_name}</td>
                  <td className="px-3 py-2 text-[10px]">{firc.remitter_country}</td>
                  <td className="px-3 py-2"><span className="flex items-center gap-1"><CurrencyFlag currency={firc.currency} /><span className="text-[10px] font-bold">{firc.currency}</span></span></td>
                  <td className="px-3 py-2 font-mono font-bold text-[10px] text-green-300">{fmtFC(firc.fc_amount, firc.currency)}</td>
                  <td className="px-3 py-2 font-mono text-[10px]">{fmtINR(firc.inr_equivalent)}</td>
                  <td className="px-3 py-2 font-mono text-[10px] text-muted-foreground">{firc.purpose_code}</td>
                  <td className="px-3 py-2 text-[10px] text-cyan-300">{firc.linked_invoice || "—"}</td>
                  <td className="px-3 py-2"><StatusPill status={firc.status} /></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// TAB 4: LUT / EXPORT ZERO-RATING TRACKER
// ─────────────────────────────────────────────────────────────────────────────

function LUTTrackerTab() {
  const lut = DEMO_LUT_RECORDS[0];
  const refundClaimed = DEMO_ZERO_RATED_SUPPLIES.filter(s => s.refund_status !== "NOT_FILED").reduce((s, z) => s + z.igst_applicable, 0);
  const refundPending = DEMO_ZERO_RATED_SUPPLIES.filter(s => s.refund_status === "NOT_FILED").reduce((s, z) => s + z.igst_applicable, 0);

  return (
    <div className="space-y-4">
      {/* LUT Card */}
      <div className="p-4 rounded-xl border border-green-500/20 bg-green-500/5 space-y-3">
        <div className="flex items-center justify-between flex-wrap gap-2">
          <p className="text-xs font-bold text-green-300 flex items-center gap-2">
            <FileCheck2 className="w-3.5 h-3.5" />
            Letter of Undertaking (LUT) — Active for FY 2025-26
          </p>
          <StatusPill status={lut.status} />
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-[10px]">
          <div><p className="text-muted-foreground">LUT Number</p><p className="font-bold font-mono text-foreground mt-0.5">{lut.lut_number}</p></div>
          <div><p className="text-muted-foreground">Filing Date</p><p className="font-bold text-foreground mt-0.5">{lut.date_of_filing}</p></div>
          <div><p className="text-muted-foreground">Valid Until</p><p className="font-bold text-foreground mt-0.5">{lut.date_of_validity}</p></div>
          <div><p className="text-muted-foreground">GSTIN</p><p className="font-bold font-mono text-cyan-300 mt-0.5">{lut.gstin}</p></div>
        </div>
        <div className="grid grid-cols-3 gap-2 text-xs">
          <div className="p-2.5 rounded-lg bg-black/20 border border-white/5">
            <p className="text-[10px] text-muted-foreground">Total Export Value</p>
            <p className="font-bold text-foreground font-mono">{fmtINR(lut.cumulative_export_value)}</p>
          </div>
          <div className="p-2.5 rounded-lg bg-amber-500/10 border border-amber-500/20">
            <p className="text-[10px] text-muted-foreground">IGST Refund Pending</p>
            <p className="font-bold text-amber-300 font-mono">{fmtINR(refundPending)}</p>
          </div>
          <div className="p-2.5 rounded-lg bg-green-500/10 border border-green-500/20">
            <p className="text-[10px] text-muted-foreground">IGST Refund Claimed</p>
            <p className="font-bold text-green-300 font-mono">{fmtINR(refundClaimed)}</p>
          </div>
        </div>
      </div>

      {/* Zero-Rated Supplies Table */}
      <div className="rounded-xl border border-white/8 overflow-hidden">
        <div className="px-3 py-2 bg-white/2 border-b border-white/8 text-xs font-bold text-foreground">
          Zero-Rated Export Supplies (Section 16, IGST Act)
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead>
              <tr className="border-b border-white/8 text-[10px] text-muted-foreground bg-white/1">
                {["Invoice", "Date", "Buyer", "Country", "Currency", "FC Amount", "INR Value", "IGST @18%", "FIRC", "Refund Status"].map(h => (
                  <th key={h} className="text-left px-3 py-2 whitespace-nowrap">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-white/4">
              {DEMO_ZERO_RATED_SUPPLIES.map(s => (
                <tr key={s.id} className="hover:bg-white/2">
                  <td className="px-3 py-2 font-mono text-cyan-300 text-[10px]">{s.invoice_number}</td>
                  <td className="px-3 py-2 font-mono text-[10px] text-muted-foreground">{s.invoice_date}</td>
                  <td className="px-3 py-2 font-semibold text-[11px]">{s.buyer_name}</td>
                  <td className="px-3 py-2 text-[10px]">{s.buyer_country}</td>
                  <td className="px-3 py-2"><span className="flex items-center gap-1"><CurrencyFlag currency={s.currency} /><span className="text-[10px]">{s.currency}</span></span></td>
                  <td className="px-3 py-2 font-mono font-bold text-[10px] text-green-300">{fmtFC(s.fc_amount, s.currency)}</td>
                  <td className="px-3 py-2 font-mono text-[10px]">{fmtINR(s.inr_value)}</td>
                  <td className="px-3 py-2 font-mono text-[10px] text-amber-300">{fmtINR(s.igst_applicable)}</td>
                  <td className="px-3 py-2 text-[10px] text-cyan-300">{s.firc_number || "Pending"}</td>
                  <td className="px-3 py-2"><StatusPill status={s.refund_status} /></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// TAB 5: RFD-01 REFUND CLAIMS
// ─────────────────────────────────────────────────────────────────────────────

function RFD01Tab() {
  const totalClaimed = DEMO_RFD01_CLAIMS.reduce((s, r) => s + r.total_igst_claimed, 0);
  const totalPaid = DEMO_RFD01_CLAIMS.filter(r => r.amount_paid).reduce((s, r) => s + (r.amount_paid || 0), 0);

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-3 gap-3">
        {[
          { label: "Total IGST Claimed", value: fmtINR(totalClaimed), color: "text-cyan-300", bg: "bg-cyan-500/10 border-cyan-500/20" },
          { label: "Total Refund Received", value: fmtINR(totalPaid), color: "text-green-300", bg: "bg-green-500/10 border-green-500/20" },
          { label: "Pending Claim", value: fmtINR(DEMO_ZERO_RATED_SUPPLIES.filter(s => s.refund_status === "NOT_FILED").reduce((s, z) => s + z.igst_applicable, 0)), color: "text-amber-300", bg: "bg-amber-500/10 border-amber-500/20" },
        ].map(({ label, value, color, bg }) => (
          <div key={label} className={`p-3 rounded-xl border ${bg} text-center`}>
            <p className={`text-base font-bold font-mono ${color}`}>{value}</p>
            <p className="text-[10px] text-muted-foreground mt-0.5">{label}</p>
          </div>
        ))}
      </div>

      {DEMO_RFD01_CLAIMS.map(claim => (
        <div key={claim.id} className="p-4 rounded-xl border border-white/8 bg-card/40 space-y-3">
          <div className="flex items-center justify-between flex-wrap gap-2">
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-foreground">{claim.arn_number}</span>
              <StatusPill status={claim.status} />
              <span className="text-[10px] text-muted-foreground">{claim.refund_type.replace(/_/g, " ")}</span>
            </div>
            <span className="text-xs font-bold text-green-300 font-mono">{fmtINR(claim.total_igst_claimed)}</span>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-[10px]">
            <div><p className="text-muted-foreground">Filing Date</p><p className="font-bold text-foreground">{claim.filing_date}</p></div>
            <div><p className="text-muted-foreground">Period</p><p className="font-bold text-foreground">{claim.period_from} → {claim.period_to}</p></div>
            {claim.sanction_order_number && <div><p className="text-muted-foreground">Sanction Order</p><p className="font-bold text-green-300 font-mono">{claim.sanction_order_number}</p></div>}
            {claim.amount_paid && <div><p className="text-muted-foreground">Payment Date</p><p className="font-bold text-foreground">{claim.payment_date}</p></div>}
          </div>
          {/* Progress Bar */}
          <div className="space-y-1">
            <div className="flex justify-between text-[9px] text-muted-foreground">
              <span>Filed → Acknowledged → Sanctioned → Paid</span>
              <span>{claim.status}</span>
            </div>
            <div className="h-1.5 rounded-full bg-white/5 overflow-hidden">
              <div className={`h-full rounded-full transition-all ${claim.status === "FILED" ? "w-1/4 bg-amber-400" : claim.status === "ACKNOWLEDGED" ? "w-2/4 bg-cyan-400" : claim.status === "SANCTIONED" ? "w-3/4 bg-blue-400" : "w-full bg-green-400"}`} />
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// TAB 6: FORM 15CA / 15CB
// ─────────────────────────────────────────────────────────────────────────────

function Form15CATab() {
  const [activeView, setActiveView] = useState<"15CA" | "15CB">("15CA");
  const [expanded, setExpanded] = useState<string | null>(null);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between flex-wrap gap-2">
        <p className="text-xs font-bold text-foreground flex items-center gap-2">
          <FileText className="w-3.5 h-3.5 text-purple-400" />
          Foreign Remittance Compliance — Form 15CA / 15CB Generator
        </p>
        <div className="flex gap-1">
          {(["15CA", "15CB"] as const).map(v => (
            <button key={v} onClick={() => setActiveView(v)}
              className={`px-3 py-1.5 rounded text-xs font-bold border transition-all ${activeView === v ? "bg-purple-500/15 text-purple-300 border-purple-500/25" : "bg-white/3 text-muted-foreground border-white/8 hover:bg-white/5"}`}>
              Form {v}
            </button>
          ))}
        </div>
      </div>

      {activeView === "15CA" && DEMO_FORM15CA_LIST.map(f => (
        <div key={f.id} className="rounded-xl border border-purple-500/15 bg-card/40 overflow-hidden">
          <button onClick={() => setExpanded(expanded === f.id ? null : f.id)}
            className="w-full p-3 flex items-center justify-between gap-3 hover:bg-white/2 transition-all">
            <div className="flex items-center gap-3 flex-wrap">
              <span className="text-xs font-bold text-foreground">{f.remittee_name}</span>
              <span className="text-[9px] px-1.5 py-0.5 rounded bg-purple-500/15 border border-purple-500/25 text-purple-300">{f.part}</span>
              <StatusPill status={f.status} />
              <span className="text-[10px] text-muted-foreground">WHT {f.wht_rate_applied}%</span>
            </div>
            <div className="flex items-center gap-3 shrink-0">
              <span className="font-mono font-bold text-xs text-foreground">{fmtINR(f.inr_amount)}</span>
              {expanded === f.id ? <ChevronDown className="w-3.5 h-3.5 text-muted-foreground" /> : <ChevronRight className="w-3.5 h-3.5 text-muted-foreground" />}
            </div>
          </button>
          {expanded === f.id && (
            <div className="px-4 pb-4 border-t border-white/5 bg-black/10 space-y-3">
              <div className="grid grid-cols-2 md:grid-cols-3 gap-3 mt-3 text-[10px]">
                <div><p className="text-muted-foreground">Acknowledgement No.</p><p className="font-mono font-bold text-cyan-300 mt-0.5">{f.acknowledgement_number}</p></div>
                <div><p className="text-muted-foreground">Remitter</p><p className="font-bold text-foreground mt-0.5">{f.remitter_name}</p></div>
                <div><p className="text-muted-foreground">Remitter PAN</p><p className="font-mono text-foreground mt-0.5">{f.remitter_pan}</p></div>
                <div><p className="text-muted-foreground">Currency / Amount</p><p className="font-bold text-green-300 font-mono mt-0.5">{f.currency} {f.fc_amount.toLocaleString()} ≈ {fmtINR(f.inr_amount)}</p></div>
                <div><p className="text-muted-foreground">Nature of Remittance</p><p className="font-bold text-foreground mt-0.5">{f.nature_of_remittance}</p></div>
                <div><p className="text-muted-foreground">Purpose Code</p><p className="font-mono text-foreground mt-0.5">{f.purpose_code}</p></div>
                <div><p className="text-muted-foreground">DTAA Applicable</p><p className="font-bold text-foreground mt-0.5">{f.dtaa_applicable ? `Yes — ${f.dtaa_country}` : "No"}</p></div>
                <div><p className="text-muted-foreground">WHT Rate / Amount</p><p className="font-bold text-red-300 font-mono mt-0.5">{f.wht_rate_applied}% = {fmtINR(f.wht_amount_inr)}</p></div>
                {f.trc_reference && <div><p className="text-muted-foreground">TRC Reference</p><p className="font-mono text-amber-300 mt-0.5">{f.trc_reference}</p></div>}
              </div>
              <div className="flex gap-2">
                <button className="flex items-center gap-1.5 px-3 py-1.5 rounded text-xs font-bold bg-purple-500/15 border border-purple-500/25 text-purple-300 hover:bg-purple-500/25">
                  <Send className="w-3 h-3" />Submit to Income Tax Portal
                </button>
                <button className="flex items-center gap-1.5 px-3 py-1.5 rounded text-xs font-bold bg-white/5 border border-white/10 text-muted-foreground hover:bg-white/8">
                  <Download className="w-3 h-3" />Download PDF
                </button>
              </div>
            </div>
          )}
        </div>
      ))}

      {activeView === "15CB" && DEMO_FORM15CB_LIST.map(f => (
        <div key={f.id} className="p-4 rounded-xl border border-amber-500/15 bg-card/40 space-y-2">
          <div className="flex items-center justify-between flex-wrap gap-2">
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-foreground">{f.remittee_name}</span>
              <StatusPill status={f.status} />
            </div>
            <span className="font-mono text-xs text-foreground">{fmtINR(f.inr_amount)}</span>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-2 text-[10px]">
            <div><p className="text-muted-foreground">CA Name & MRN</p><p className="font-bold text-foreground">{f.ca_name} · {f.ca_membership_number}</p></div>
            <div><p className="text-muted-foreground">CA Firm</p><p className="text-foreground">{f.ca_firm_name}</p></div>
            <div><p className="text-muted-foreground">Certificate No.</p><p className="font-mono text-cyan-300">{f.certificate_number}</p></div>
            <div><p className="text-muted-foreground">WHT Rate</p><p className="font-bold text-red-300">{f.wht_rate}% = {fmtINR(f.wht_amount)}</p></div>
            <div><p className="text-muted-foreground">TRC Obtained</p><p className={f.tax_residency_certificate_obtained ? "text-green-300 font-bold" : "text-red-300"}>{f.tax_residency_certificate_obtained ? "✓ Yes" : "✗ No"}</p></div>
            <div><p className="text-muted-foreground">Form 10F</p><p className={f.form10f_obtained ? "text-green-300 font-bold" : "text-red-300"}>{f.form10f_obtained ? "✓ Filed" : "✗ Not Filed"}</p></div>
          </div>
        </div>
      ))}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// TAB 7: DTAA LOOKUP & WHT CALCULATOR
// ─────────────────────────────────────────────────────────────────────────────

function DTAALookupTab() {
  const [search, setSearch] = useState("");
  const [selectedCountry, setSelectedCountry] = useState("");
  const [amount, setAmount] = useState("100000");
  const [incomeType, setIncomeType] = useState<"dividends" | "interest" | "royalties" | "technical_services" | "capital_gains">("royalties");

  const filtered = DTAA_RATES.filter(d => d.country.toLowerCase().includes(search.toLowerCase()));
  const whtResult = selectedCountry ? lookupDTAARate(selectedCountry, incomeType) : null;
  const inrAmount = parseFloat(amount) || 0;

  return (
    <div className="space-y-4">
      {/* WHT Calculator */}
      <div className="p-4 rounded-xl border border-cyan-500/20 bg-cyan-500/5 space-y-3">
        <p className="text-xs font-bold text-cyan-300 flex items-center gap-2">
          <Scale className="w-3.5 h-3.5" />
          DTAA WHT Rate Calculator
        </p>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
          <div>
            <label className="text-[10px] text-muted-foreground block mb-1">Country</label>
            <select value={selectedCountry} onChange={e => setSelectedCountry(e.target.value)}
              className="w-full px-3 py-2 rounded-lg bg-white/5 border border-white/10 text-xs text-foreground focus:outline-none focus:border-cyan-500/40">
              <option value="" className="bg-card">Select Country…</option>
              {DTAA_RATES.map(d => <option key={d.country_code} value={d.country} className="bg-card">{d.country}</option>)}
            </select>
          </div>
          <div>
            <label className="text-[10px] text-muted-foreground block mb-1">Income Type</label>
            <select value={incomeType} onChange={e => setIncomeType(e.target.value as any)}
              className="w-full px-3 py-2 rounded-lg bg-white/5 border border-white/10 text-xs text-foreground focus:outline-none focus:border-cyan-500/40">
              <option value="dividends" className="bg-card">Dividends</option>
              <option value="interest" className="bg-card">Interest</option>
              <option value="royalties" className="bg-card">Royalties</option>
              <option value="technical_services" className="bg-card">Technical Services (FTS)</option>
              <option value="capital_gains" className="bg-card">Capital Gains</option>
            </select>
          </div>
          <div>
            <label className="text-[10px] text-muted-foreground block mb-1">Amount (INR)</label>
            <input type="number" value={amount} onChange={e => setAmount(e.target.value)}
              className="w-full px-3 py-2 rounded-lg bg-white/5 border border-white/10 text-xs font-mono text-foreground focus:outline-none focus:border-cyan-500/40" />
          </div>
        </div>
        {whtResult && (
          <div className="p-3 rounded-lg bg-black/20 border border-cyan-500/15 grid grid-cols-3 gap-3 text-xs">
            <div><p className="text-[10px] text-muted-foreground">DTAA WHT Rate</p><p className="text-lg font-bold text-cyan-300 font-mono">{whtResult.rate}%</p></div>
            <div><p className="text-[10px] text-muted-foreground">WHT Amount</p><p className="text-lg font-bold text-red-300 font-mono">{fmtINR(inrAmount * whtResult.rate / 100)}</p></div>
            <div><p className="text-[10px] text-muted-foreground">Net Remittance</p><p className="text-lg font-bold text-green-300 font-mono">{fmtINR(inrAmount - (inrAmount * whtResult.rate / 100))}</p></div>
            <div className="col-span-3"><p className="text-[10px] text-muted-foreground">Treaty</p><p className="text-[11px] text-foreground">{whtResult.treaty}</p></div>
            <div className="col-span-3"><StatusPill status={whtResult.benefit} /></div>
          </div>
        )}
      </div>

      {/* DTAA Rate Table */}
      <div className="space-y-2">
        <input type="text" placeholder="Search countries…" value={search} onChange={e => setSearch(e.target.value)}
          className="w-full px-3 py-2 rounded-lg bg-white/5 border border-white/10 text-xs text-foreground focus:outline-none focus:border-cyan-500/40" />
        <div className="rounded-xl border border-white/8 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead>
                <tr className="border-b border-white/8 text-[10px] text-muted-foreground bg-white/2">
                  {["Country", "Treaty", "Dividends", "Interest", "Royalties", "FTS", "Cap Gains", "MFN", "Status"].map(h => (
                    <th key={h} className="text-left px-3 py-2 whitespace-nowrap">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-white/4">
                {filtered.map(d => (
                  <tr key={d.country_code} className="hover:bg-white/2 cursor-pointer" onClick={() => setSelectedCountry(d.country)}>
                    <td className="px-3 py-2 font-semibold text-foreground text-[11px]">{d.country}</td>
                    <td className="px-3 py-2 text-[9px] text-muted-foreground max-w-[150px] truncate">{d.treaty_reference}</td>
                    <td className="px-3 py-2 font-mono font-bold text-[10px] text-amber-300">{d.dividends_wht_pct}%</td>
                    <td className="px-3 py-2 font-mono font-bold text-[10px] text-amber-300">{d.interest_wht_pct}%</td>
                    <td className="px-3 py-2 font-mono font-bold text-[10px] text-amber-300">{d.royalties_wht_pct}%</td>
                    <td className="px-3 py-2 font-mono font-bold text-[10px] text-amber-300">{d.technical_services_wht_pct}%</td>
                    <td className="px-3 py-2 font-mono font-bold text-[10px] text-amber-300">{d.capital_gains_wht_pct}%</td>
                    <td className="px-3 py-2"><span className={`text-[9px] font-bold ${d.mfn_clause ? "text-green-300" : "text-muted-foreground"}`}>{d.mfn_clause ? "✓ Yes" : "—"}</span></td>
                    <td className="px-3 py-2"><StatusPill status={d.treaty_in_force ? "ACTIVE" : "EXPIRED"} /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// TAB 8: TRANSFER PRICING & TRC REGISTER
// ─────────────────────────────────────────────────────────────────────────────

function TransferPricingTab() {
  const [view, setView] = useState<"tp" | "trc">("tp");

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        {(["tp", "trc"] as const).map(v => (
          <button key={v} onClick={() => setView(v)}
            className={`px-3 py-1.5 rounded text-xs font-bold border transition-all ${view === v ? "bg-cyan-500/15 text-cyan-300 border-cyan-500/25" : "bg-white/3 text-muted-foreground border-white/8 hover:bg-white/5"}`}>
            {v === "tp" ? "Form 3CEB & TP Records" : "TRC Validity Register"}
          </button>
        ))}
      </div>

      {view === "tp" && (
        <div className="space-y-3">
          <div className="grid grid-cols-3 gap-3 text-xs">
            <div className={`p-3 rounded-xl border text-center ${DEMO_TP_RECORDS.every(t => t.form3ceb_filed) ? "bg-green-500/10 border-green-500/20" : "bg-amber-500/10 border-amber-500/20"}`}>
              <p className={`text-xl font-bold font-mono ${DEMO_TP_RECORDS.every(t => t.form3ceb_filed) ? "text-green-300" : "text-amber-300"}`}>{DEMO_TP_RECORDS.filter(t => t.form3ceb_filed).length}/{DEMO_TP_RECORDS.length}</p>
              <p className="text-[10px] text-muted-foreground mt-0.5">Form 3CEB Filed</p>
            </div>
            <div className="p-3 rounded-xl border bg-cyan-500/10 border-cyan-500/20 text-center">
              <p className="text-xl font-bold font-mono text-cyan-300">{fmtINR(DEMO_TP_RECORDS.reduce((s, t) => s + t.transaction_value_inr, 0))}</p>
              <p className="text-[10px] text-muted-foreground mt-0.5">Total AE Transaction Value</p>
            </div>
            <div className="p-3 rounded-xl border bg-amber-500/10 border-amber-500/20 text-center">
              <p className="text-xl font-bold font-mono text-amber-300">{fmtINR(DEMO_TP_RECORDS.reduce((s, t) => s + (t.adjustment || 0), 0))}</p>
              <p className="text-[10px] text-muted-foreground mt-0.5">Total TP Adjustments</p>
            </div>
          </div>

          {DEMO_TP_RECORDS.map(tp => (
            <div key={tp.id} className="p-4 rounded-xl border border-white/8 bg-card/40 space-y-2">
              <div className="flex items-center justify-between flex-wrap gap-2">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-xs font-bold text-foreground">{tp.associated_enterprise_name}</span>
                  <span className="text-[9px] px-1.5 py-0.5 rounded bg-blue-500/10 border border-blue-500/20 text-blue-300">{tp.method_used}</span>
                  {tp.form3ceb_filed ? <span className="text-[9px] px-1.5 py-0.5 rounded bg-green-500/10 border border-green-500/20 text-green-300">✓ 3CEB Filed</span> : <span className="text-[9px] px-1.5 py-0.5 rounded bg-red-500/10 border border-red-500/20 text-red-300">✗ 3CEB Pending</span>}
                  {tp.is_safe_harbour_eligible && <span className="text-[9px] px-1.5 py-0.5 rounded bg-purple-500/10 border border-purple-500/20 text-purple-300">Safe Harbour Eligible</span>}
                </div>
                <span className="font-mono font-bold text-xs text-foreground">{fmtINR(tp.transaction_value_inr)}</span>
              </div>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-[10px]">
                <div><p className="text-muted-foreground">Transaction Type</p><p className="font-bold text-foreground">{tp.transaction_type}</p></div>
                <div><p className="text-muted-foreground">AE Country</p><p className="font-bold text-foreground">{tp.associated_enterprise_country}</p></div>
                <div><p className="text-muted-foreground">ALP Price</p><p className="font-bold text-cyan-300 font-mono">{fmtINR(tp.arms_length_price)}</p></div>
                <div><p className="text-muted-foreground">Adjustment</p><p className={`font-bold font-mono ${(tp.adjustment || 0) > 0 ? "text-amber-300" : "text-green-300"}`}>{fmtINR(Math.abs(tp.adjustment || 0))}</p></div>
              </div>
            </div>
          ))}
        </div>
      )}

      {view === "trc" && (
        <div className="space-y-3">
          {DEMO_TRC_RECORDS.map(trc => (
            <div key={trc.id} className={`p-4 rounded-xl border ${trc.status === "VALID" ? "border-green-500/20 bg-green-500/5" : trc.status === "EXPIRED" ? "border-red-500/20 bg-red-500/5" : "border-amber-500/20 bg-amber-500/5"}`}>
              <div className="flex items-center justify-between flex-wrap gap-2 mb-2">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-xs font-bold text-foreground">{trc.entity_name}</span>
                  <StatusPill status={trc.status} />
                </div>
                <span className="text-[10px] text-muted-foreground">{trc.country_of_residence}</span>
              </div>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-[10px]">
                <div><p className="text-muted-foreground">TRC Number</p><p className="font-mono text-cyan-300">{trc.trc_number}</p></div>
                <div><p className="text-muted-foreground">Issuing Authority</p><p className="text-foreground">{trc.issuing_authority}</p></div>
                <div><p className="text-muted-foreground">Validity</p><p className="text-foreground">{trc.validity_from} → {trc.validity_to}</p></div>
                <div><p className="text-muted-foreground">Form 10F</p><p className={trc.form10f_reference ? "text-green-300" : "text-red-300"}>{trc.form10f_reference || "Not Filed"}</p></div>
                <div className="col-span-2 md:col-span-4"><p className="text-muted-foreground">DTAA Articles Claimed</p><div className="flex flex-wrap gap-1 mt-0.5">{trc.dtaa_articles_claimed.map((a, i) => <span key={i} className="px-1.5 py-0.5 rounded bg-white/8 border border-white/10 text-[9px]">{a}</span>)}</div></div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// MAIN COMPONENT
// ─────────────────────────────────────────────────────────────────────────────

type Tab8 = "dashboard" | "ledger" | "firc" | "lut" | "rfd01" | "form15ca" | "dtaa" | "tp";

export function FXInternationalModule({ companyName }: { companyName?: string }) {
  const [activeTab, setActiveTab] = useState<Tab8>("dashboard");

  const tabs: { id: Tab8; label: string; icon: any; badge?: string }[] = [
    { id: "dashboard", label: "FX Dashboard",      icon: Globe,       badge: `${DEMO_FX_TRANSACTIONS.length} Txns` },
    { id: "ledger",    label: "FX Ledger & G/L",  icon: DollarSign,  badge: String(DEMO_FX_GL_RESULTS.length) },
    { id: "firc",      label: "FIRC Tracker",      icon: FileCheck2,  badge: String(DEMO_FIRC_RECORDS.length) },
    { id: "lut",       label: "LUT / Zero-Rated",  icon: Shield,      badge: String(DEMO_ZERO_RATED_SUPPLIES.length) },
    { id: "rfd01",     label: "RFD-01 Refunds",    icon: ArrowDownRight, badge: String(DEMO_RFD01_CLAIMS.length) },
    { id: "form15ca",  label: "Form 15CA / 15CB",  icon: FileText,    badge: String(DEMO_FORM15CA_LIST.length) },
    { id: "dtaa",      label: "DTAA & WHT",        icon: Scale,       badge: `${DTAA_RATES.length} Treaties` },
    { id: "tp",        label: "TP & TRC",          icon: Building2,   badge: String(DEMO_TP_RECORDS.length) },
  ];

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-base font-bold text-foreground flex items-center gap-2">
            <Globe className="w-4 h-4 text-emerald-400" />
            Cross-Border FX, FEMA & International Tax Engine (Phase 8)
          </h2>
          <p className="text-xs text-muted-foreground mt-0.5">
            15 FX Transactions · USD / EUR / GBP / JPY / AED / SGD / CAD / AUD / CHF · AS-11 Forex G/L · Form 15CA/CB · FIRC · LUT · RFD-01 · DTAA (15 Countries) · TP Form 3CEB · TRC Register
          </p>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <span className={`text-[10px] px-2.5 py-1 rounded-full border font-bold ${DEMO_PORTFOLIO_SUMMARY.net_forex_pnl >= 0 ? "bg-green-500/15 border-green-500/25 text-green-300" : "bg-red-500/15 border-red-500/25 text-red-300"}`}>
            {DEMO_PORTFOLIO_SUMMARY.net_forex_pnl >= 0 ? "Net FX Gain" : "Net FX Loss"} {fmtINR(Math.abs(DEMO_PORTFOLIO_SUMMARY.net_forex_pnl))}
          </span>
        </div>
      </div>

      {/* Tab Bar */}
      <div className="flex gap-1 flex-wrap border-b border-white/5 pb-1">
        {tabs.map(({ id, label, icon: Icon, badge }) => (
          <button key={id} onClick={() => setActiveTab(id)}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${activeTab === id ? "bg-emerald-500/15 border border-emerald-500/25 text-emerald-300" : "text-muted-foreground hover:bg-white/5"}`}>
            <Icon className="w-3.5 h-3.5" />
            {label}
            {badge && (
              <span className={`px-1.5 py-0.5 rounded-full text-[9px] font-bold ${activeTab === id ? "bg-emerald-500/20 text-emerald-200" : "bg-white/10 text-muted-foreground"}`}>{badge}</span>
            )}
          </button>
        ))}
      </div>

      {/* Content */}
      <AnimatePresence mode="wait">
        <motion.div key={activeTab} initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -4 }} transition={{ duration: 0.15 }}>
          {activeTab === "dashboard" && <FXDashboardTab />}
          {activeTab === "ledger"    && <ForexLedgerTab />}
          {activeTab === "firc"      && <FIRCTrackerTab />}
          {activeTab === "lut"       && <LUTTrackerTab />}
          {activeTab === "rfd01"     && <RFD01Tab />}
          {activeTab === "form15ca"  && <Form15CATab />}
          {activeTab === "dtaa"      && <DTAALookupTab />}
          {activeTab === "tp"        && <TransferPricingTab />}
        </motion.div>
      </AnimatePresence>
    </div>
  );
}

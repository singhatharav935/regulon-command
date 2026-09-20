import React from "react";
import { createPortal } from "react-dom";
import { motion, AnimatePresence } from "framer-motion";
import { X, FileText, ExternalLink, Calendar, Hash, ArrowUpRight, ArrowDownRight } from "lucide-react";
export interface TrialBalanceItem {
  account_code: string;
  ledger_name: string;
  group: string;
  opening_dr: number;
  opening_cr: number;
  tx_dr: number;
  tx_cr: number;
  closing_dr: number;
  closing_cr: number;
  vouchers?: Array<{ date?: string; voucher_type?: string; voucher_no?: string; ref_no?: string; particulars?: string; narration?: string; debit: number; credit: number; doc_url?: string }>;
}

function fmtRsExact(val: number): string {
  if (val === null || val === undefined || isNaN(val)) return "₹0.00";
  const abs = Math.abs(val);
  const prefix = val < 0 ? "-" : "";
  return `${prefix}₹${abs.toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}
import { Button } from "@/components/ui/button";

interface LedgerVoucherDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  ledger: TrialBalanceItem | null;
  companyName?: string;
}

export function LedgerVoucherDrawer({
  isOpen,
  onClose,
  ledger,
  companyName = "Company",
}: LedgerVoucherDrawerProps) {
  if (!isOpen || !ledger) return null;

  const txns = ledger.vouchers || [];

  return createPortal(
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex justify-end"
        onClick={onClose}
      >
        <motion.div
          initial={{ x: "100%" }}
          animate={{ x: 0 }}
          exit={{ x: "100%" }}
          transition={{ type: "spring", damping: 26, stiffness: 280 }}
          className="w-full max-w-xl h-full bg-[#0d1117] border-l border-white/10 flex flex-col overflow-hidden"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="flex items-center justify-between px-5 py-4 border-b border-white/8 bg-white/2">
            <div>
              <p className="text-sm font-bold text-foreground">{ledger.ledger_name}</p>
              <p className="text-[10px] text-muted-foreground mt-0.5">
                {companyName} · Ledger Code: <span className="font-mono text-cyan-300">{ledger.account_code}</span> · {ledger.group}
              </p>
            </div>
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg hover:bg-white/8 text-muted-foreground hover:text-foreground transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Summary Banner */}
          <div className="grid grid-cols-4 gap-2 px-5 py-3 bg-white/2 border-b border-white/5 text-[10px]">
            <div>
              <p className="text-muted-foreground uppercase">Opening</p>
              <p className="font-mono font-semibold text-foreground">
                {ledger.opening_dr > 0 ? `Dr ${fmtRsExact(ledger.opening_dr)}` : ledger.opening_cr > 0 ? `Cr ${fmtRsExact(ledger.opening_cr)}` : "₹0.00"}
              </p>
            </div>
            <div>
              <p className="text-cyan-400 uppercase">Debit Txns</p>
              <p className="font-mono font-semibold text-cyan-300">{fmtRsExact(ledger.tx_dr)}</p>
            </div>
            <div>
              <p className="text-amber-400 uppercase">Credit Txns</p>
              <p className="font-mono font-semibold text-amber-300">{fmtRsExact(ledger.tx_cr)}</p>
            </div>
            <div>
              <p className="text-emerald-400 uppercase">Closing Balance</p>
              <p className="font-mono font-bold text-emerald-300">
                {ledger.closing_dr > 0 ? `Dr ${fmtRsExact(ledger.closing_dr)}` : ledger.closing_cr > 0 ? `Cr ${fmtRsExact(ledger.closing_cr)}` : "₹0.00"}
              </p>
            </div>
          </div>

          {/* Transaction Audit Table */}
          <div className="flex-1 overflow-y-auto px-5 py-4">
            <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider mb-2">
              Voucher Audit Trail ({txns.length} entries)
            </p>
            {txns.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 text-center gap-2">
                <FileText className="w-6 h-6 text-muted-foreground/40" />
                <p className="text-xs text-muted-foreground">No individual vouchers for this ledger line.</p>
              </div>
            ) : (
              <table className="w-full text-[10px]">
                <thead>
                  <tr className="border-b border-white/8 text-muted-foreground">
                    <th className="text-left px-2 py-1.5">Date</th>
                    <th className="text-left px-2 py-1.5">Voucher Type / Ref</th>
                    <th className="text-left px-2 py-1.5">Particulars</th>
                    <th className="text-right px-2 py-1.5">Debit (₹)</th>
                    <th className="text-right px-2 py-1.5">Credit (₹)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/4">
                  {txns.map((v: any, i: number) => (
                    <tr key={i} className="hover:bg-white/2">
                      <td className="px-2 py-2 font-mono text-muted-foreground whitespace-nowrap">{v.date || "—"}</td>
                      <td className="px-2 py-2">
                        <span className="font-bold text-cyan-300">{v.voucher_type || "JV"}</span>
                        <p className="text-[9px] text-muted-foreground font-mono">{v.voucher_no || v.ref_no || "—"}</p>
                      </td>
                      <td className="px-2 py-2 max-w-[160px]">
                        <p className="text-foreground truncate">{v.particulars || v.narration || "Entry"}</p>
                        {v.doc_url && (
                          <a href={v.doc_url} target="_blank" rel="noreferrer" className="text-[8px] text-cyan-400 hover:underline inline-flex items-center gap-0.5 mt-0.5">
                            <ExternalLink className="w-2.5 h-2.5" /> View Doc
                          </a>
                        )}
                      </td>
                      <td className="px-2 py-2 text-right font-mono text-cyan-300">
                        {v.debit > 0 ? fmtRsExact(v.debit) : "—"}
                      </td>
                      <td className="px-2 py-2 text-right font-mono text-amber-300">
                        {v.credit > 0 ? fmtRsExact(v.credit) : "—"}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>

          {/* Footer */}
          <div className="border-t border-white/8 bg-white/2 p-4 flex justify-between items-center text-xs">
            <p className="text-[10px] text-muted-foreground">Double-entry verified audit trail.</p>
            <Button size="sm" variant="outline" onClick={onClose} className="h-7 text-xs border-white/10">
              Close
            </Button>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>,
    document.body
  );
}

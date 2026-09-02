import { createPortal } from "react-dom";
import { motion, AnimatePresence } from "framer-motion";
import { X, FileText, ExternalLink } from "lucide-react";
export interface PnLNoteDetail {
  note_number: number;
  note_title: string;
  total_cy: number;
  total_py: number;
  breakup?: Array<{ description: string; current_year: number; previous_year: number }>;
}

function fmtPnLAmount(val: number): string {
  if (val === null || val === undefined || isNaN(val)) return "₹0.00";
  const abs = Math.abs(val);
  const prefix = val < 0 ? "-" : "";
  return `${prefix}₹${abs.toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}
import { Button } from "@/components/ui/button";

interface PnLNoteDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  note: PnLNoteDetail | null;
  companyName?: string;
}

export function PnLNoteDrawer({
  isOpen,
  onClose,
  note,
  companyName = "Company",
}: PnLNoteDrawerProps) {
  if (!isOpen || !note) return null;

  const breakups = note.breakup || [];

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
              <p className="text-sm font-bold text-foreground">
                Note {note.note_number}: {note.note_title}
              </p>
              <p className="text-[10px] text-muted-foreground mt-0.5">
                {companyName} · Schedule III Statement of Profit & Loss Note
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
          <div className="grid grid-cols-2 gap-4 px-5 py-3 bg-white/2 border-b border-white/5 text-[10px]">
            <div>
              <p className="text-muted-foreground uppercase">Current FY Amount</p>
              <p className="font-mono font-bold text-cyan-300 text-sm">{fmtPnLAmount(note.total_cy)}</p>
            </div>
            <div>
              <p className="text-muted-foreground uppercase">Previous FY Amount</p>
              <p className="font-mono font-semibold text-muted-foreground text-sm">{fmtPnLAmount(note.total_py)}</p>
            </div>
          </div>

          {/* Note Breakup Table */}
          <div className="flex-1 overflow-y-auto px-5 py-4">
            <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider mb-2">
              Note Line Item Details
            </p>
            {breakups.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 text-center gap-2">
                <FileText className="w-6 h-6 text-muted-foreground/40" />
                <p className="text-xs text-muted-foreground">No breakup details for this note.</p>
              </div>
            ) : (
              <table className="w-full text-xs">
                <thead>
                  <tr className="border-b border-white/8 text-[10px] text-muted-foreground">
                    <th className="text-left px-2 py-1.5">Particulars / Account</th>
                    <th className="text-right px-2 py-1.5">Current FY (₹)</th>
                    <th className="text-right px-2 py-1.5">Previous FY (₹)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/4">
                  {breakups.map((b: any, i: number) => (
                    <tr key={i} className="hover:bg-white/2 text-[11px]">
                      <td className="px-2 py-2 font-medium text-foreground">{b.description}</td>
                      <td className="px-2 py-2 text-right font-mono text-cyan-300">{fmtPnLAmount(b.current_year)}</td>
                      <td className="px-2 py-2 text-right font-mono text-muted-foreground">{fmtPnLAmount(b.previous_year)}</td>
                    </tr>
                  ))}
                </tbody>
                <tfoot>
                  <tr className="bg-white/4 border-t border-white/10 font-bold text-xs">
                    <td className="px-2 py-2 font-sans text-foreground">TOTAL NOTE AMOUNT</td>
                    <td className="px-2 py-2 text-right font-mono text-cyan-300">{fmtPnLAmount(note.total_cy)}</td>
                    <td className="px-2 py-2 text-right font-mono text-muted-foreground">{fmtPnLAmount(note.total_py)}</td>
                  </tr>
                </tfoot>
              </table>
            )}
          </div>

          {/* Footer */}
          <div className="border-t border-white/8 bg-white/2 p-4 flex justify-between items-center text-xs">
            <p className="text-[10px] text-muted-foreground">Schedule III Part II Compliant Note Inspection.</p>
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

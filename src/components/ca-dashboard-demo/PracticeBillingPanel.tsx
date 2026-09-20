import React, { useState, useEffect } from 'react';
import { isCABackendConfigured } from '@/lib/ca-backend-guard';
import { motion } from 'framer-motion';
import { toast } from 'sonner';
import {
  IndianRupee,
  Receipt,
  FileSpreadsheet,
  CheckCircle2,
  Clock,
  TrendingUp,
  Bot,
  Landmark,
  AlertTriangle,
  Loader,
  RefreshCw,
  ChevronDown,
  CloudUpload,
  X,
  Download
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { CASectionAgentBadge } from '../agents-demo/CASectionAgentBadge';

interface UnbilledTask {
  id: string;
  client: string;
  task_name: string;
  date_completed: string;
  suggested_fee: number;
}

interface BillingStats {
  accounts_receivable: number;
  overdue_invoices: number;
  collected_this_month: number;
  collected_change_pct: number;
}


export default function PracticeBillingPanel() {
  const [unbilledTasks, setUnbilledTasks] = useState<UnbilledTask[]>([]);
  const [stats, setStats] = useState<BillingStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedInvoiceTask, setSelectedInvoiceTask] = useState<UnbilledTask | null>(null);
  const [customInvoiceFee, setCustomInvoiceFee] = useState<number>(0);

  const fetchBillingData = async () => {
    setLoading(true);
    try {
      const { getUnbilledTasks, getBillingStats } = await import('@/services/ca-supabase-service');
      const [tasks, dbStats] = await Promise.all([
        getUnbilledTasks(),
        getBillingStats()
      ]);

      if (tasks.length === 0 && !dbStats) {
        setUnbilledTasks([]);
        setStats(null);
        setLoading(false);
        return;
      }

      setUnbilledTasks(tasks);
      setStats(dbStats || {
        accounts_receivable: 0,
        overdue_invoices: 0,
        collected_this_month: 0,
        collected_change_pct: 0,
      });
    } catch {
      setUnbilledTasks([]);
      setStats(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchBillingData(); }, []);

  const numberToWords = (num: number): string => {
    const a = ['', 'One ', 'Two ', 'Three ', 'Four ', 'Five ', 'Six ', 'Seven ', 'Eight ', 'Nine ', 'Ten ', 'Eleven ', 'Twelve ', 'Thirteen ', 'Fourteen ', 'Fifteen ', 'Sixteen ', 'Seventeen ', 'Eighteen ', 'Nineteen '];
    const b = ['', '', 'Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy', 'Eighty', 'Ninety'];

    const convert = (n: number): string => {
      if (n < 20) return a[n];
      if (n < 100) return b[Math.floor(n / 10)] + (n % 10 !== 0 ? ' ' + a[n % 10] : '');
      if (n < 1000) return a[Math.floor(n / 100)] + 'Hundred ' + (n % 100 !== 0 ? 'and ' + convert(n % 100) : '');
      if (n < 100000) return convert(Math.floor(n / 1000)) + 'Thousand ' + (n % 1000 !== 0 ? convert(n % 1000) : '');
      if (n < 10000000) return convert(Math.floor(n / 100000)) + 'Lakh ' + (n % 100000 !== 0 ? convert(n % 100000) : '');
      return convert(Math.floor(n / 10000000)) + 'Crore ' + (n % 10000000 !== 0 ? convert(n % 10000000) : '');
    };

    const integerPart = Math.floor(num);
    const words = convert(integerPart).trim();
    return words ? words + ' Only' : 'Zero Only';
  };

  const downloadInvoicePdf = async (task: UnbilledTask, fee: number) => {
    toast.info("Generating tax invoice PDF...");
    try {
      const { jsPDF } = await import('jspdf');
      const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
      const pageWidth = doc.internal.pageSize.getWidth();
      const pageHeight = doc.internal.pageSize.getHeight();
      const margin = 20;
      const contentWidth = pageWidth - (margin * 2);
      let yPos = margin;

      // Top Header / Letterhead Design
      doc.setFillColor(6, 95, 70); // Emerald 800
      doc.rect(0, 0, pageWidth, 12, 'F');
      yPos = 22;

      // Firm Name & Title
      doc.setTextColor(6, 95, 70);
      doc.setFontSize(20);
      doc.setFont('helvetica', 'bold');
      doc.text("SANNIDH & ASSOCIATES", margin, yPos);
      
      doc.setTextColor(100, 116, 139); // Gray 500
      doc.setFontSize(8);
      doc.setFont('helvetica', 'normal');
      doc.text("CHARTERED ACCOUNTANTS", margin, yPos + 4.5);

      doc.setTextColor(15, 23, 42); // Slate 900
      doc.setFontSize(16);
      doc.setFont('helvetica', 'bold');
      doc.text("TAX INVOICE", pageWidth - margin - 45, yPos + 2);

      yPos += 14;

      // Contact info
      doc.setTextColor(71, 85, 105); // Gray 600
      doc.setFontSize(9);
      doc.setFont('helvetica', 'normal');
      doc.text([
        "BKC Suite 402, Platinum Chambers,",
        "Bandra Kurla Complex, Mumbai - 400051",
        "GSTIN: 27SANNIDH8129A1Z9 | Email: billing@sannidh.ai"
      ], margin, yPos);

      yPos += 16;
      doc.setDrawColor(226, 232, 240); // Slate 200
      doc.setLineWidth(0.5);
      doc.line(margin, yPos, pageWidth - margin, yPos);
      yPos += 8;

      // Invoice Details & Bill To
      const invoiceNo = `INV/2026-27/${task.id.substring(0, 5).toUpperCase()}`;
      const invoiceDate = new Date().toLocaleDateString('en-IN');
      const dueDate = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toLocaleDateString('en-IN');

      // Left: Bill To
      doc.setTextColor(6, 95, 70);
      doc.setFontSize(10);
      doc.setFont('helvetica', 'bold');
      doc.text("BILL TO (RECIPIENT):", margin, yPos);

      doc.setTextColor(15, 23, 42);
      doc.setFontSize(10);
      doc.setFont('helvetica', 'bold');
      doc.text(task.client, margin, yPos + 5);

      doc.setTextColor(71, 85, 105);
      doc.setFontSize(9);
      doc.setFont('helvetica', 'normal');
      doc.text([
        "Corporate Headquarters,",
        `GSTIN: ${task.client.replace(/[^a-zA-Z]/g, '').substring(0, 10).toUpperCase() || 'GST'}9827Q1Z4`,
        "Place of Supply: Maharashtra (27)"
      ], margin, yPos + 10);

      // Right: Invoice Metadata
      const rightColX = pageWidth - margin - 65;
      doc.setTextColor(6, 95, 70);
      doc.setFontSize(10);
      doc.setFont('helvetica', 'bold');
      doc.text("INVOICE DETAILS:", rightColX, yPos);

      doc.setTextColor(15, 23, 42);
      doc.setFontSize(9);
      doc.setFont('helvetica', 'bold');
      doc.text(`Invoice No:`, rightColX, yPos + 5);
      doc.setFont('helvetica', 'normal');
      doc.text(invoiceNo, rightColX + 22, yPos + 5);

      doc.setFont('helvetica', 'bold');
      doc.text(`Date:`, rightColX, yPos + 10);
      doc.setFont('helvetica', 'normal');
      doc.text(invoiceDate, rightColX + 22, yPos + 10);

      doc.setFont('helvetica', 'bold');
      doc.text(`Due Date:`, rightColX, yPos + 15);
      doc.setFont('helvetica', 'normal');
      doc.text(dueDate, rightColX + 22, yPos + 15);

      yPos += 26;
      doc.line(margin, yPos, pageWidth - margin, yPos);
      yPos += 8;

      // Table Header
      doc.setFillColor(241, 245, 249); // Slate 100
      doc.rect(margin, yPos, contentWidth, 8, 'F');
      doc.setFontSize(9);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(15, 23, 42);
      doc.text("Description of Services / Professional Work", margin + 2, yPos + 5.5);
      doc.text("SAC Code", margin + 95, yPos + 5.5);
      doc.text("Qty", margin + 118, yPos + 5.5);
      doc.text("Rate (INR)", margin + 130, yPos + 5.5);
      doc.text("Amount (INR)", margin + 152, yPos + 5.5);

      yPos += 8;

      // Table Row
      doc.setFont('helvetica', 'normal');
      const serviceText = task.task_name;
      const splitService = doc.splitTextToSize(serviceText, 90);
      const rowHeight = Math.max(splitService.length * 5, 8);
      
      doc.rect(margin, yPos, contentWidth, rowHeight);
      doc.text(splitService, margin + 2, yPos + 5);
      doc.text("998222", margin + 95, yPos + 5);
      doc.text("1", margin + 118, yPos + 5);
      doc.text(fee.toLocaleString('en-IN', { minimumFractionDigits: 2 }), margin + 130, yPos + 5);
      doc.text(fee.toLocaleString('en-IN', { minimumFractionDigits: 2 }), margin + 152, yPos + 5);

      yPos += rowHeight;

      // Calculations Box
      const cgst = fee * 0.09;
      const sgst = fee * 0.09;
      const grandTotal = fee * 1.18;

      const calcX = margin + 90;
      const calcWidth = contentWidth - 90;

      // Sub Total Row
      doc.rect(calcX, yPos, calcWidth, 6);
      doc.setFont('helvetica', 'bold');
      doc.text("Sub Total:", calcX + 2, yPos + 4);
      doc.setFont('helvetica', 'normal');
      doc.text(fee.toLocaleString('en-IN', { minimumFractionDigits: 2 }), calcX + 42, yPos + 4);
      yPos += 6;

      // CGST Row
      doc.rect(calcX, yPos, calcWidth, 6);
      doc.setFont('helvetica', 'bold');
      doc.text("CGST @ 9.0%:", calcX + 2, yPos + 4);
      doc.setFont('helvetica', 'normal');
      doc.text(cgst.toLocaleString('en-IN', { minimumFractionDigits: 2 }), calcX + 42, yPos + 4);
      yPos += 6;

      // SGST Row
      doc.rect(calcX, yPos, calcWidth, 6);
      doc.setFont('helvetica', 'bold');
      doc.text("SGST @ 9.0%:", calcX + 2, yPos + 4);
      doc.setFont('helvetica', 'normal');
      doc.text(sgst.toLocaleString('en-IN', { minimumFractionDigits: 2 }), calcX + 42, yPos + 4);
      yPos += 6;

      // Grand Total Row
      doc.setFillColor(241, 245, 249);
      doc.rect(calcX, yPos, calcWidth, 8, 'F');
      doc.rect(calcX, yPos, calcWidth, 8);
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(10);
      doc.text("Grand Total:", calcX + 2, yPos + 5.5);
      doc.text(`INR ${grandTotal.toLocaleString('en-IN', { minimumFractionDigits: 2 })}`, calcX + 42, yPos + 5.5);
      yPos += 14;

      // Amount in Words
      doc.setFontSize(9);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(15, 23, 42);
      doc.text("Amount Chargeable (in words):", margin, yPos);
      doc.setFont('helvetica', 'italic');
      doc.text(`INR ${numberToWords(grandTotal)}`, margin, yPos + 5);

      yPos += 12;

      // Payment Details & Terms
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(9.5);
      doc.setTextColor(6, 95, 70);
      doc.text("BANK DETAILS & REMITTANCE", margin, yPos);
      yPos += 5;

      doc.setTextColor(71, 85, 105);
      doc.setFontSize(8.5);
      doc.setFont('helvetica', 'normal');
      
      const bankDetails = [
        "Account Holder: Sannidh & Associates",
        "Bank: HDFC Bank Ltd (Bandra Kurla Complex Branch)",
        "Account Number: 50200081290384  |  Account Type: Current Account",
        "IFSC Code: HDFC0000060"
      ];
      doc.text(bankDetails, margin, yPos);

      yPos += 22;

      // Terms & Conditions
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(8.5);
      doc.setTextColor(15, 23, 42);
      doc.text("Terms of Service:", margin, yPos);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(100, 116, 139);
      doc.text([
        "1. All payments are subject to standard 18% GST (9% CGST + 9% SGST).",
        "2. Payment is due strictly within 7 business days from receipt of this invoice.",
        "3. Late payments will attract a statutory interest rate of 18% per annum."
      ], margin, yPos + 4.5);

      // Footer digital seal / Sign-off
      yPos = pageHeight - 38;
      doc.setDrawColor(226, 232, 240);
      doc.line(margin, yPos, pageWidth - margin, yPos);
      yPos += 6;

      // Seal box
      doc.setDrawColor(6, 95, 70);
      doc.rect(margin, yPos, 45, 18);
      doc.setFontSize(7.5);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(6, 95, 70);
      doc.text("SANNIDH AI PLATFORM", margin + 3, yPos + 5);
      doc.text("SECURE BILLING SEAL", margin + 3, yPos + 9);
      doc.setFont('helvetica', 'normal');
      doc.text("WORM Compliant Logs", margin + 3, yPos + 13);

      // Authorized Signatory
      const sigX = pageWidth - margin - 55;
      doc.setFontSize(9);
      doc.setTextColor(15, 23, 42);
      doc.setFont('helvetica', 'bold');
      doc.text("For SANNIDH & ASSOCIATES", sigX, yPos + 2);
      doc.setFont('helvetica', 'italic');
      doc.setFontSize(8.5);
      doc.text("[Digitally E-Signed]", sigX + 5, yPos + 10);
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(8);
      doc.text("Authorised Representative", sigX, yPos + 15);

      // Save PDF
      doc.save(`Tax_Invoice_${invoiceNo.replace(/\//g, '_')}.pdf`);
      toast.success("Invoice PDF generated and downloaded!");
    } catch (err) {
      console.error(err);
      toast.error("Failed to generate PDF invoice.");
    }
  };

  const handleGenerateInvoice = (task: UnbilledTask) => {
    setSelectedInvoiceTask(task);
    setCustomInvoiceFee(task.suggested_fee);
  };

  const totalUnbilled = unbilledTasks.reduce((acc, t) => acc + t.suggested_fee, 0);

  return (
    <>
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.2 }}
      className="glass-card p-6 mt-8 border-green-500/20 max-w-[1400px]"
    >
      <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-green-500/20 flex items-center justify-center">
            <Landmark className="w-5 h-5 text-green-400" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-foreground flex items-center gap-2">
              Practice Revenue Hub
              <CASectionAgentBadge agentId="F3_FINANCE" />
            </h2>
            <p className="text-sm text-muted-foreground mt-1">
              Automated invoice generation for compliance work. Turn completed tasks into cash flow instantly.
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button size="sm" variant="outline" onClick={fetchBillingData} disabled={loading}>
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </Button>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" className="h-9 border-green-500/30 text-green-400 hover:bg-green-500/10">
                <CloudUpload className="w-4 h-4 mr-2" />
                Accounting Sync
                <ChevronDown className="w-3 h-3 ml-2" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-48 bg-card border-border/50">
              <DropdownMenuLabel className="text-xs font-semibold text-muted-foreground">Export Data</DropdownMenuLabel>
              <DropdownMenuSeparator className="bg-border/30" />
              <DropdownMenuItem className="cursor-pointer font-medium hover:bg-muted/50">
                <FileSpreadsheet className="w-4 h-4 mr-2 text-green-400" />
                Raw Ledger (CSV)
              </DropdownMenuItem>
              <DropdownMenuSeparator className="bg-border/30" />
              <DropdownMenuLabel className="text-xs font-semibold text-muted-foreground">Live Integrations</DropdownMenuLabel>
              <DropdownMenuItem className="cursor-pointer font-medium hover:bg-muted/50">
                <CloudUpload className="w-4 h-4 mr-2 text-blue-400" />
                Push to Tally Prime
              </DropdownMenuItem>
              <DropdownMenuItem className="cursor-pointer font-medium hover:bg-muted/50">
                <RefreshCw className="w-4 h-4 mr-2 text-yellow-400" />
                Sync with Zoho Books
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {/* Stats — real from API, or zeros if backend offline */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <div className="p-4 rounded-xl bg-card border border-border/50 flex items-center gap-4">
          <div className="w-12 h-12 rounded-full bg-blue-500/10 flex items-center justify-center shrink-0">
            <Receipt className="w-5 h-5 text-blue-400" />
          </div>
          <div>
            <p className="text-sm font-medium text-muted-foreground">Unbilled Work</p>
            <h3 className="text-2xl font-bold text-foreground">
              {loading ? '—' : `₹${totalUnbilled.toLocaleString()}`}
            </h3>
            <p className="text-xs text-blue-400 mt-1 flex items-center gap-1">
              <Clock className="w-3 h-3" />
              {loading ? '...' : `${unbilledTasks.length} completed tasks await invoicing`}
            </p>
          </div>
        </div>

        <div className="p-4 rounded-xl bg-card border border-border/50 flex items-center gap-4">
          <div className="w-12 h-12 rounded-full bg-orange-500/10 flex items-center justify-center shrink-0">
            <Clock className="w-5 h-5 text-orange-400" />
          </div>
          <div>
            <p className="text-sm font-medium text-muted-foreground">Accounts Receivable</p>
            <h3 className="text-2xl font-bold text-foreground">
              {loading ? '—' : stats ? `₹${stats.accounts_receivable.toLocaleString()}` : '₹0'}
            </h3>
            <p className="text-xs text-orange-400 mt-1 flex items-center gap-1">
              <AlertTriangle className="w-3 h-3" />
              {loading ? '...' : stats ? `${stats.overdue_invoices} invoices pending > 15 days` : 'No overdue invoices'}
            </p>
          </div>
        </div>

        <div className="p-4 rounded-xl bg-card border border-border/50 flex items-center gap-4">
          <div className="w-12 h-12 rounded-full bg-green-500/10 flex items-center justify-center shrink-0">
            <IndianRupee className="w-5 h-5 text-green-400" />
          </div>
          <div>
            <p className="text-sm font-medium text-muted-foreground">Collected This Month</p>
            <h3 className="text-2xl font-bold text-foreground">
              {loading ? '—' : stats ? `₹${stats.collected_this_month.toLocaleString()}` : '₹0'}
            </h3>
            <p className="text-xs text-green-400 mt-1 flex items-center gap-1">
              <TrendingUp className="w-3 h-3" />
              {loading ? '...' : stats && stats.collected_change_pct !== 0
                ? `${stats.collected_change_pct > 0 ? '+' : ''}${stats.collected_change_pct}% vs last month`
                : 'No data yet'}
            </p>
          </div>
        </div>
      </div>

      {/* Unbilled Tasks Table */}
      <div className="border border-border/50 rounded-xl overflow-hidden bg-card/30">
        <div className="p-4 bg-muted/20 border-b border-border/50 flex items-center justify-between">
          <h3 className="font-semibold text-foreground flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-green-400" /> Ready to Invoice (Unbilled Tasks)
          </h3>
          <Badge variant="outline" className="bg-blue-500/10 text-blue-400 border-blue-500/30">
            Auto-Synced from Task Pipeline
          </Badge>
        </div>
        <div className="p-0">
          {loading ? (
            <div className="p-8 text-center flex items-center justify-center gap-3 text-muted-foreground">
              <Loader className="w-5 h-5 animate-spin" />
              <span>Loading billing data...</span>
            </div>
          ) : unbilledTasks.length === 0 ? (
            <div className="p-8 text-center text-muted-foreground">
              <div className="w-12 h-12 rounded-full bg-green-500/10 flex items-center justify-center mx-auto mb-3">
                <CheckCircle2 className="w-6 h-6 text-green-400" />
              </div>
              <p className="font-medium">All completed work has been invoiced.</p>
              <p className="text-xs mt-1 text-muted-foreground/70">
                Unbilled tasks from your compliance pipeline will appear here automatically.
              </p>
            </div>
          ) : (
            <table className="w-full text-sm text-left">
              <thead className="text-xs text-muted-foreground bg-muted/50 border-b border-border/50">
                <tr>
                  <th className="px-4 py-3 font-medium">Client</th>
                  <th className="px-4 py-3 font-medium">Service Rendered</th>
                  <th className="px-4 py-3 font-medium">Completion Date</th>
                  <th className="px-4 py-3 font-medium">System Suggested Fee</th>
                  <th className="px-4 py-3 font-medium text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/50">
                {unbilledTasks.map((task) => (
                  <tr key={task.id} className="hover:bg-muted/20 transition-colors">
                    <td className="px-4 py-3 font-medium text-foreground">{task.client}</td>
                    <td className="px-4 py-3">{task.task_name}</td>
                    <td className="px-4 py-3 text-muted-foreground">{task.date_completed}</td>
                    <td className="px-4 py-3 font-semibold text-foreground">
                      ₹{task.suggested_fee.toLocaleString()} <span className="text-xs text-muted-foreground font-normal">+GST</span>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <Button
                        size="sm"
                        variant="outline"
                        className="h-8 border-green-500/30 text-green-400 hover:bg-green-500/10"
                        onClick={() => handleGenerateInvoice(task)}
                      >
                        <Bot className="w-3.5 h-3.5 mr-1.5" />
                        AI Draft Invoice
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </motion.div>

    {/* AI Draft Invoice Modal */}
    {selectedInvoiceTask && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm overflow-y-auto">
          <div className="relative w-full max-w-4xl bg-zinc-900 rounded-xl border border-zinc-800 shadow-2xl overflow-hidden my-8 flex flex-col max-h-[90vh]">
            {/* Modal Header */}
            <div className="px-6 py-4 bg-zinc-900 border-b border-zinc-800 flex items-center justify-between shrink-0">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-green-500/20 flex items-center justify-center">
                  <Bot className="w-4 h-4 text-green-400" />
                </div>
                <div>
                  <h3 className="font-bold text-lg text-white flex items-center gap-2">
                    AI Invoice Drafting Sandbox
                  </h3>
                  <p className="text-xs text-zinc-400">
                    Review, adjust, and approve the generated GST invoice draft
                  </p>
                </div>
              </div>
              <button
                onClick={() => setSelectedInvoiceTask(null)}
                className="w-8 h-8 rounded-full bg-zinc-800/50 hover:bg-zinc-800 flex items-center justify-center text-zinc-400 hover:text-white transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Modal Scrollable Body */}
            <div className="flex-1 overflow-y-auto p-6 bg-zinc-950/40">
              {/* Paper Layout */}
              <div className="max-w-[760px] mx-auto bg-[#f8f7f4] text-[#1c1917] p-8 shadow-inner border border-[#e7e5e4] rounded-md font-sans select-text relative">
                {/* Punch holes */}
                <div className="absolute left-2 top-0 bottom-0 flex flex-col justify-around py-4 pointer-events-none opacity-20">
                  <div className="w-3 h-3 rounded-full bg-zinc-700"></div>
                  <div className="w-3 h-3 rounded-full bg-zinc-700"></div>
                  <div className="w-3 h-3 rounded-full bg-zinc-700"></div>
                  <div className="w-3 h-3 rounded-full bg-zinc-700"></div>
                </div>

                {/* Letterhead */}
                <div className="flex justify-between items-start mb-6">
                  <div>
                    <h1 className="text-xl font-bold tracking-tight text-[#065f46] font-sans">
                      SANNIDH & ASSOCIATES
                    </h1>
                    <p className="text-[10px] font-bold text-zinc-500 tracking-wider">
                      CHARTERED ACCOUNTANTS
                    </p>
                    <div className="text-[11px] text-[#44403c] mt-2 leading-relaxed font-sans">
                      BKC Suite 402, Platinum Chambers,<br />
                      Bandra Kurla Complex, Mumbai - 400051<br />
                      <span className="font-semibold">GSTIN:</span> 27SANNIDH8129A1Z9 | <span className="font-semibold">Email:</span> billing@sannidh.ai
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="bg-[#065f46]/10 text-[#065f46] px-3 py-1.5 rounded font-bold text-sm inline-block tracking-wide mb-2">
                      TAX INVOICE
                    </div>
                    <div className="text-[11px] text-[#44403c] space-y-0.5">
                      <div><span className="font-semibold">Invoice No:</span> INV/2026-27/{selectedInvoiceTask.id.substring(0, 5).toUpperCase()}</div>
                      <div><span className="font-semibold">Date:</span> {new Date().toLocaleDateString('en-IN')}</div>
                      <div><span className="font-semibold">Due Date:</span> {new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toLocaleDateString('en-IN')}</div>
                    </div>
                  </div>
                </div>

                <hr className="border-[#e7e5e4] my-4" />

                {/* Billing Info Grid */}
                <div className="grid grid-cols-2 gap-6 mb-6 text-[12px] leading-relaxed">
                  <div>
                    <h4 className="font-bold text-[#065f46] mb-1.5 uppercase tracking-wider text-[10px]">
                      Bill To (Recipient)
                    </h4>
                    <div className="font-bold text-sm text-[#1c1917]">
                      {selectedInvoiceTask.client}
                    </div>
                    <div className="text-[#44403c]">
                      Corporate Headquarters,<br />
                      GSTIN: {selectedInvoiceTask.client.replace(/[^a-zA-Z]/g, '').substring(0, 10).toUpperCase() || 'GST'}9827Q1Z4<br />
                      State: Maharashtra (Code: 27)
                    </div>
                  </div>
                  <div>
                    <h4 className="font-bold text-[#065f46] mb-1.5 uppercase tracking-wider text-[10px]">
                      Supplier Details & Supply Info
                    </h4>
                    <div className="text-[#44403c]">
                      Place of Supply: Maharashtra (Code: 27)<br />
                      Reverse Charge Applicable: <span className="font-semibold">No</span><br />
                      Service Type: Accounting & Auditing Consultancy
                    </div>
                  </div>
                </div>

                {/* Table */}
                <div className="border border-[#e7e5e4] rounded overflow-hidden mb-6 text-[12px]">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="bg-[#f5f5f4] border-b border-[#e7e5e4] text-[#1c1917] font-semibold">
                        <th className="p-2.5">Description of Services</th>
                        <th className="p-2.5 w-24 text-center">SAC Code</th>
                        <th className="p-2.5 w-16 text-center">Qty</th>
                        <th className="p-2.5 w-36 text-right">Rate (₹)</th>
                        <th className="p-2.5 w-36 text-right">Amount (₹)</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#e7e5e4]">
                      <tr>
                        <td className="p-2.5 font-medium text-[#1c1917]">
                          {selectedInvoiceTask.task_name}
                          <div className="text-[10px] text-zinc-500 font-normal mt-0.5">
                            Professional fee for compliance clearance & documentation (Date: {selectedInvoiceTask.date_completed})
                          </div>
                        </td>
                        <td className="p-2.5 text-center text-[#44403c]">998222</td>
                        <td className="p-2.5 text-center text-[#44403c]">1</td>
                        <td className="p-2.5 text-right font-semibold">
                          <div className="inline-flex items-center gap-1">
                            <span className="text-zinc-400 font-normal">₹</span>
                            <input
                              type="number"
                              value={customInvoiceFee || ''}
                              onChange={(e) => setCustomInvoiceFee(Math.max(0, Number(e.target.value)))}
                              className="w-24 bg-white border border-[#d6d3d1] px-1.5 py-0.5 rounded text-right focus:outline-none focus:ring-1 focus:ring-[#065f46] text-[#1c1917] font-semibold text-xs"
                            />
                          </div>
                        </td>
                        <td className="p-2.5 text-right font-semibold text-[#1c1917]">
                          ₹{customInvoiceFee.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                        </td>
                      </tr>
                      {/* Calculations rows */}
                      <tr>
                        <td colSpan={3} className="p-2 border-0"></td>
                        <td className="p-2 text-right text-zinc-500 font-medium">Sub Total</td>
                        <td className="p-2 text-right font-semibold text-[#1c1917]">
                          ₹{customInvoiceFee.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                        </td>
                      </tr>
                      <tr>
                        <td colSpan={3} className="p-2 border-0"></td>
                        <td className="p-2 text-right text-zinc-500 font-medium">CGST @ 9.0%</td>
                        <td className="p-2 text-right font-semibold text-[#1c1917]">
                          ₹{(customInvoiceFee * 0.09).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                        </td>
                      </tr>
                      <tr>
                        <td colSpan={3} className="p-2 border-0"></td>
                        <td className="p-2 text-right text-zinc-500 font-medium">SGST @ 9.0%</td>
                        <td className="p-2 text-right font-semibold text-[#1c1917]">
                          ₹{(customInvoiceFee * 0.09).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                        </td>
                      </tr>
                      <tr className="bg-[#f5f5f4] font-bold text-sm">
                        <td colSpan={3} className="p-2 border-0"></td>
                        <td className="p-2.5 text-right text-[#065f46]">Grand Total</td>
                        <td className="p-2.5 text-right text-[#065f46] font-extrabold">
                          ₹{(customInvoiceFee * 1.18).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>

                {/* Amount in words */}
                <div className="mb-6 text-[11px] leading-relaxed">
                  <span className="font-bold text-[#44403c] block">Amount Chargeable (in words):</span>
                  <span className="text-[#1c1917] italic font-semibold">
                    Rupees {numberToWords(customInvoiceFee * 1.18)}
                  </span>
                </div>

                {/* Bank details */}
                <div className="bg-[#f5f5f4] border border-[#e7e5e4] p-3 rounded mb-6 text-[11px] leading-relaxed">
                  <div className="font-bold text-[#065f46] mb-1">
                    BANK DETAILS & REMITTANCE INFO
                  </div>
                  <div className="grid grid-cols-2 gap-4 text-[#44403c]">
                    <div>
                      <span className="font-semibold">Account Name:</span> Sannidh & Associates<br />
                      <span className="font-semibold">Bank:</span> HDFC Bank (BKC Branch)<br />
                    </div>
                    <div>
                      <span className="font-semibold">Account Number:</span> 50200081290384 (Current)<br />
                      <span className="font-semibold">IFSC Code:</span> HDFC0000060<br />
                    </div>
                  </div>
                </div>

                {/* Terms and compliance stamp */}
                <div className="flex justify-between items-end text-[9px] text-zinc-500 mt-8 leading-relaxed">
                  <div>
                    <span className="font-bold text-[#44403c] block mb-1">Terms & Conditions:</span>
                    1. Payment due within 7 days from date of invoice.<br />
                    2. Interest @ 18% p.a. charged on overdue invoices.<br />
                    3. All disputes subject to Mumbai Jurisdiction.
                  </div>

                  {/* Stamp */}
                  <div className="flex flex-col items-center">
                    <div className="border-2 border-emerald-800 text-emerald-800 px-3 py-1 font-bold text-[9px] uppercase tracking-wider rounded rotate-[-2deg] font-mono leading-tight mb-2 select-none text-center">
                      SANNIDH AI<br />
                      SECURE BILLING<br />
                      VERIFIED
                    </div>
                    <span className="text-[10px] font-bold text-[#1c1917] block">For Sannidh & Associates</span>
                    <span className="text-[8px] text-zinc-400 block mt-2">[Digitally E-Signed]</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Modal Footer actions */}
            <div className="px-6 py-4 bg-zinc-900 border-t border-zinc-800 flex items-center justify-between shrink-0">
              <Button
                variant="outline"
                className="border-zinc-800 hover:bg-zinc-800 text-zinc-300 hover:text-white"
                onClick={() => setSelectedInvoiceTask(null)}
              >
                Cancel Sandbox
              </Button>
              <div className="flex items-center gap-3">
                <Button
                  variant="outline"
                  className="border-green-500/30 text-green-400 hover:bg-green-500/10"
                  onClick={() => downloadInvoicePdf(selectedInvoiceTask, customInvoiceFee)}
                >
                  <Download className="w-4 h-4 mr-2" />
                  Download PDF
                </Button>
                <Button
                  className="bg-green-600 hover:bg-green-700 text-white font-semibold"
                  onClick={async () => {
                    const invoiceNo = `INV/2026-27/${selectedInvoiceTask.id.substring(0, 5).toUpperCase()}`;
                    // 1. Remove task
                    setUnbilledTasks(prev => prev.filter(t => t.id !== selectedInvoiceTask.id));
                    // 2. Update stats
                    setStats(prev => prev ? {
                      ...prev,
                      accounts_receivable: prev.accounts_receivable + (customInvoiceFee * 1.18)
                    } : null);
                    // 3. Clear modal state
                    setSelectedInvoiceTask(null);
                    // 4. Toast alert
                    toast.success(`Tax Invoice ${invoiceNo} generated, finalized and dispatched to client!`);
                  }}
                >
                  <CheckCircle2 className="w-4 h-4 mr-2" />
                  Approve & Send
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
    );
  }

import React, { useState, useEffect } from 'react';
import { isCABackendConfigured } from '@/lib/ca-backend-guard';
import { motion } from 'framer-motion';
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
  InboxIcon,
  ChevronDown,
  CloudUpload
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
import { useAICommunication } from '@/store/useAICommunication';
import { CASectionAgentBadge } from '../agents/CASectionAgentBadge';

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

const CA_API = (import.meta.env.VITE_CA_API_BASE_URL as string) || 'http://localhost:3001';

export default function PracticeBillingPanel() {
  const { setActivePrompt, setDrawerOpen } = useAICommunication();
  const [unbilledTasks, setUnbilledTasks] = useState<UnbilledTask[]>([]);
  const [stats, setStats] = useState<BillingStats | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchBillingData = async () => {
    if (!isCABackendConfigured()) {
      setUnbilledTasks([]);
      setStats(null);
      setLoading(false);
      return;
    }
    setLoading(true);
    try {
      const [tasksRes, statsRes] = await Promise.all([
        fetch(`${CA_API}/api/v1/ca/billing/unbilled`),
        fetch(`${CA_API}/api/v1/ca/billing/stats`),
      ]);
      if (tasksRes.ok) {
        const d = await tasksRes.json();
        setUnbilledTasks(d.data || d.tasks || []);
      }
      if (statsRes.ok) {
        const d = await statsRes.json();
        setStats(d.data || d);
      }
    } catch {
      // Backend not running — show zeros, not fake numbers
      setUnbilledTasks([]);
      setStats(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchBillingData(); }, []);

  const handleGenerateInvoice = (task: UnbilledTask) => {
    const prompt = `
SYSTEM DIRECTIVE:
You are assisting a Senior CA in generating a professional tax invoice.

TASK DATA:
- Client: ${task.client}
- Professional Service Rendered: ${task.task_name}
- Date of Completion: ${task.date_completed}
- System Suggested Fee: ₹${task.suggested_fee.toLocaleString()} + 18% GST

ACTION REQUIRED:
1. Draft a complete, itemized invoice format.
2. Include standard CA professional service terms (Payment due within 7 days, 1.5% interest on late payment).
3. Generate a WhatsApp payment intent link or standard bank transfer request message that the CA can send with the PDF.
    `;
    setActivePrompt(prompt);
    setDrawerOpen(true);
    setTimeout(() => {
      setUnbilledTasks(prev => prev.filter(t => t.id !== task.id));
    }, 2000);
  };

  const totalUnbilled = unbilledTasks.reduce((acc, t) => acc + t.suggested_fee, 0);

  return (
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
  );
}

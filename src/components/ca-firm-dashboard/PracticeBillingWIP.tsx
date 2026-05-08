import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { FileText, DollarSign, Clock, Plus, X, AlertCircle, CheckCircle2, Loader2, Building2 } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useFirmInvoices, useCreateInvoice, useUpdateInvoiceStatus, useFirmClients } from "@/hooks/personas/useCAFirmData";
import { toast } from "sonner";

interface PracticeBillingWIPProps {
  firmId: string;
}

const statusStyles: Record<string, string> = {
  draft: "bg-slate-500/20 text-slate-400 border-slate-500/30",
  sent: "bg-blue-500/20 text-blue-400 border-blue-500/30",
  paid: "bg-emerald-500/20 text-emerald-400 border-emerald-500/30",
  overdue: "bg-rose-500/20 text-rose-400 border-rose-500/30",
};

const billingTypes = [
  { value: "fixed_fee", label: "Fixed Fee" },
  { value: "time_material", label: "Time & Material" },
  { value: "retainer", label: "Retainer" },
  { value: "milestone", label: "Milestone" },
];

export default function PracticeBillingWIP({ firmId }: PracticeBillingWIPProps) {
  const { data: invoices, isLoading } = useFirmInvoices(firmId);
  const { data: clients } = useFirmClients(firmId);
  const createInvoice = useCreateInvoice();
  const updateStatus = useUpdateInvoiceStatus();

  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({
    client_id: "",
    amount: "",
    date: new Date().toISOString().split("T")[0],
    due_date: "",
    billing_type: "fixed_fee",
    description: "",
    status: "draft",
  });

  // Computed totals
  const paid = (invoices || []).filter(i => i.status === "paid").reduce((s, i) => s + (i.amount || 0), 0);
  const unpaid = (invoices || []).filter(i => i.status !== "paid").reduce((s, i) => s + (i.amount || 0), 0);
  const overdue = (invoices || []).filter(i => i.status === "overdue").reduce((s, i) => s + (i.amount || 0), 0);

  const handleCreate = async () => {
    if (!form.client_id || !form.amount) {
      toast.error("Please select a client and enter the amount.");
      return;
    }
    try {
      await createInvoice.mutateAsync({
        firm_id: firmId,
        client_id: form.client_id,
        amount: parseFloat(form.amount),
        date: form.date,
        status: form.status,
      });
      toast.success("Invoice created successfully!");
      setShowForm(false);
      setForm({ client_id: "", amount: "", date: new Date().toISOString().split("T")[0], due_date: "", billing_type: "fixed_fee", description: "", status: "draft" });
    } catch (err: any) {
      toast.error("Failed to create invoice: " + err.message);
    }
  };

  const handleMarkPaid = async (invoiceId: string) => {
    try {
      await updateStatus.mutateAsync({ id: invoiceId, status: "paid", firmId });
      toast.success("Invoice marked as paid!");
    } catch (err: any) {
      toast.error("Failed to update: " + err.message);
    }
  };

  const handleMarkOverdue = async (invoiceId: string) => {
    try {
      await updateStatus.mutateAsync({ id: invoiceId, status: "overdue", firmId });
      toast.warning("Invoice marked as overdue.");
    } catch (err: any) {
      toast.error("Failed to update: " + err.message);
    }
  };

  const getClientName = (clientId: string) => {
    return (clients || []).find(c => c.id === clientId)?.company_name || "Unknown Client";
  };

  const summaryCards = [
    { label: "Total Collected", value: `₹${(paid / 100000).toFixed(2)}L`, icon: DollarSign, color: "text-emerald-400", bg: "bg-emerald-500/10" },
    { label: "Outstanding WIP", value: `₹${(unpaid / 100000).toFixed(2)}L`, icon: Clock, color: "text-amber-400", bg: "bg-amber-500/10" },
    { label: "Overdue Amount", value: `₹${(overdue / 100000).toFixed(2)}L`, icon: AlertCircle, color: "text-rose-400", bg: "bg-rose-500/10" },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-white">Practice Billing & WIP</h2>
          <p className="text-sm text-slate-400 mt-1">Track Work-in-Progress, generate invoices, and manage receivables.</p>
        </div>
        <Button onClick={() => setShowForm(true)} className="bg-emerald-600 hover:bg-emerald-700 text-white">
          <Plus className="w-4 h-4 mr-2" />
          New Invoice
        </Button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {summaryCards.map((card, i) => {
          const Icon = card.icon;
          return (
            <motion.div key={i} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.1 }}>
              <Card className="bg-slate-800/50 border-gray-700/50">
                <CardContent className="p-4 flex items-center gap-4">
                  <div className={`p-3 ${card.bg} rounded-lg`}>
                    <Icon className={`w-6 h-6 ${card.color}`} />
                  </div>
                  <div>
                    <p className="text-sm text-slate-400">{card.label}</p>
                    <p className="text-2xl font-bold text-white">
                      {isLoading ? <span className="inline-block w-16 h-6 bg-slate-700/50 rounded animate-pulse" /> : card.value}
                    </p>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          );
        })}
      </div>

      {/* New Invoice Form */}
      <AnimatePresence>
        {showForm && (
          <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}>
            <Card className="bg-slate-800/80 border-emerald-500/30">
              <CardContent className="p-6">
                <div className="flex justify-between items-center mb-4">
                  <h3 className="font-semibold text-white">Create New Invoice</h3>
                  <Button variant="ghost" size="icon" onClick={() => setShowForm(false)} className="text-slate-400">
                    <X className="w-4 h-4" />
                  </Button>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <Label className="text-slate-300">Client *</Label>
                    <Select value={form.client_id} onValueChange={v => setForm(f => ({ ...f, client_id: v }))}>
                      <SelectTrigger className="bg-slate-900/50 border-slate-700 text-white">
                        <SelectValue placeholder="Select client..." />
                      </SelectTrigger>
                      <SelectContent className="bg-slate-800 border-slate-700 text-white">
                        {(clients || []).map(c => (
                          <SelectItem key={c.id} value={c.id}>{c.company_name}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-1">
                    <Label className="text-slate-300">Amount (₹) *</Label>
                    <Input
                      type="number"
                      placeholder="e.g. 25000"
                      value={form.amount}
                      onChange={e => setForm(f => ({ ...f, amount: e.target.value }))}
                      className="bg-slate-900/50 border-slate-700 text-white"
                    />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-slate-300">Billing Type</Label>
                    <Select value={form.billing_type} onValueChange={v => setForm(f => ({ ...f, billing_type: v }))}>
                      <SelectTrigger className="bg-slate-900/50 border-slate-700 text-white">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent className="bg-slate-800 border-slate-700 text-white">
                        {billingTypes.map(bt => (
                          <SelectItem key={bt.value} value={bt.value}>{bt.label}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-1">
                    <Label className="text-slate-300">Invoice Date</Label>
                    <Input
                      type="date"
                      value={form.date}
                      onChange={e => setForm(f => ({ ...f, date: e.target.value }))}
                      className="bg-slate-900/50 border-slate-700 text-white"
                    />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-slate-300">Initial Status</Label>
                    <Select value={form.status} onValueChange={v => setForm(f => ({ ...f, status: v }))}>
                      <SelectTrigger className="bg-slate-900/50 border-slate-700 text-white">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent className="bg-slate-800 border-slate-700 text-white">
                        <SelectItem value="draft">Draft</SelectItem>
                        <SelectItem value="sent">Sent</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="flex gap-3 mt-5">
                  <Button onClick={handleCreate} disabled={createInvoice.isPending} className="bg-emerald-600 hover:bg-emerald-700 text-white">
                    {createInvoice.isPending ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <CheckCircle2 className="w-4 h-4 mr-2" />}
                    {createInvoice.isPending ? "Creating..." : "Create Invoice"}
                  </Button>
                  <Button variant="outline" onClick={() => setShowForm(false)} className="border-slate-700 text-slate-300">Cancel</Button>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Invoice List */}
      {isLoading ? (
        <div className="space-y-2">
          {[1, 2, 3].map(i => (
            <div key={i} className="h-16 bg-slate-800/50 rounded-xl animate-pulse" />
          ))}
        </div>
      ) : (invoices || []).length === 0 ? (
        <Card className="bg-slate-800/30 border-dashed border-slate-700/50">
          <CardContent className="p-10 text-center">
            <FileText className="w-10 h-10 text-slate-500 mx-auto mb-3" />
            <p className="text-slate-300 font-medium">No invoices yet</p>
            <p className="text-slate-500 text-sm mt-1">Create your first invoice using the button above.</p>
          </CardContent>
        </Card>
      ) : (
        <div className="bg-slate-800/50 border border-gray-700/50 rounded-xl overflow-hidden">
          <div className="grid grid-cols-12 gap-4 px-5 py-3 border-b border-gray-700/50 text-xs font-semibold text-slate-400 bg-slate-800/80">
            <div className="col-span-4">Client</div>
            <div className="col-span-2 text-right">Amount</div>
            <div className="col-span-2">Date</div>
            <div className="col-span-2">Status</div>
            <div className="col-span-2 text-right">Actions</div>
          </div>
          <div className="divide-y divide-gray-700/30">
            {(invoices || []).map((inv, i) => (
              <motion.div
                key={inv.id}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: i * 0.04 }}
                className="grid grid-cols-12 gap-4 px-5 py-4 items-center hover:bg-slate-700/20 transition-colors"
              >
                <div className="col-span-4 flex items-center gap-2">
                  <Building2 className="w-4 h-4 text-slate-500 shrink-0" />
                  <span className="font-medium text-white text-sm truncate">{getClientName(inv.client_id)}</span>
                </div>
                <div className="col-span-2 text-right font-semibold text-white">
                  ₹{(inv.amount || 0).toLocaleString("en-IN")}
                </div>
                <div className="col-span-2 text-sm text-slate-400">
                  {inv.date ? new Date(inv.date).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" }) : "—"}
                </div>
                <div className="col-span-2">
                  <Badge className={`border text-[11px] ${statusStyles[inv.status] || statusStyles.draft}`}>
                    {(inv.status || "draft").toUpperCase()}
                  </Badge>
                </div>
                <div className="col-span-2 flex justify-end gap-1">
                  {inv.status !== "paid" && (
                    <Button
                      size="sm"
                      variant="outline"
                      disabled={updateStatus.isPending}
                      onClick={() => handleMarkPaid(inv.id)}
                      className="text-xs h-7 border-emerald-700/50 text-emerald-400 hover:bg-emerald-500/10"
                    >
                      Paid
                    </Button>
                  )}
                  {inv.status === "sent" && (
                    <Button
                      size="sm"
                      variant="ghost"
                      disabled={updateStatus.isPending}
                      onClick={() => handleMarkOverdue(inv.id)}
                      className="text-xs h-7 text-rose-400 hover:bg-rose-500/10"
                    >
                      Overdue
                    </Button>
                  )}
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

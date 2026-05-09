import { useState } from "react";
import { motion } from "framer-motion";
import {
  FileText, Plus, Search, CheckCircle, Clock, XCircle, AlertCircle, Edit2,
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import type { LawyerContract } from "@/hooks/useInhouseLawyerData";
import { useAddContract } from "@/hooks/useInhouseLawyerData";

const STATUS_CONFIG = {
  draft:       { label: "Draft",       cls: "bg-slate-500/20 text-slate-400 border-slate-500/30",   icon: Edit2 },
  negotiation: { label: "Negotiation", cls: "bg-amber-500/20 text-amber-400 border-amber-500/30",   icon: Clock },
  active:      { label: "Active",      cls: "bg-green-500/20 text-green-400 border-green-500/30",   icon: CheckCircle },
  expired:     { label: "Expired",     cls: "bg-red-500/20 text-red-400 border-red-500/30",         icon: XCircle },
  archived:    { label: "Archived",    cls: "bg-gray-500/20 text-gray-400 border-gray-500/30",      icon: FileText },
};

const RISK_CONFIG = {
  low:    "bg-green-500/20 text-green-400 border-green-500/30",
  medium: "bg-amber-500/20 text-amber-400 border-amber-500/30",
  high:   "bg-red-500/20 text-red-400 border-red-500/30",
};

function daysUntilExpiry(dateStr: string): number {
  return Math.ceil((new Date(dateStr).getTime() - Date.now()) / 86400000);
}

interface LawyerContractManagementProps {
  contracts: LawyerContract[];
  companyId: string;
  userId: string;
}

export default function LawyerContractManagement({
  contracts, companyId, userId,
}: LawyerContractManagementProps) {
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [showAddModal, setShowAddModal] = useState(false);
  const [form, setForm] = useState({
    title: "", vendor_name: "", contract_type: "service_agreement",
    contract_value: "", currency: "INR", start_date: "", end_date: "",
    status: "draft" as LawyerContract["status"],
    risk_level: "medium" as LawyerContract["risk_level"],
    key_terms: "",
  });
  const { toast } = useToast();
  const addContract = useAddContract();

  const filtered = contracts.filter(c => {
    const matchSearch = c.title.toLowerCase().includes(search.toLowerCase()) ||
                        c.vendor_name.toLowerCase().includes(search.toLowerCase());
    const matchStatus = !statusFilter || c.status === statusFilter;
    return matchSearch && matchStatus;
  });

  const handleAdd = async () => {
    if (!form.title || !form.vendor_name || !form.start_date) {
      toast({ title: "Missing fields", description: "Title, vendor, and start date are required.", variant: "destructive" });
      return;
    }
    try {
      await addContract.mutateAsync({
        company_id: companyId,
        created_by: userId,
        title: form.title,
        vendor_name: form.vendor_name,
        contract_type: form.contract_type,
        contract_value: form.contract_value ? parseFloat(form.contract_value) : null,
        currency: form.currency,
        start_date: form.start_date,
        end_date: form.end_date,
        status: form.status,
        risk_level: form.risk_level,
        key_terms: form.key_terms || null,
      });
      toast({ title: "✅ Contract Added", description: `${form.title} has been saved.` });
      setShowAddModal(false);
      setForm({ title: "", vendor_name: "", contract_type: "service_agreement", contract_value: "", currency: "INR", start_date: "", end_date: "", status: "draft", risk_level: "medium", key_terms: "" });
    } catch (e: any) {
      toast({ title: "Error", description: e.message, variant: "destructive" });
    }
  };

  return (
    <div className="space-y-4">
      {/* Toolbar */}
      <div className="flex gap-3 flex-wrap">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
          <Input
            placeholder="Search contracts or counterparty…"
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="pl-9 bg-slate-800/60 border-slate-700 text-white placeholder:text-slate-500"
          />
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-[160px] bg-slate-800/60 border-slate-700 text-slate-300">
            <SelectValue placeholder="All statuses" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="">All Statuses</SelectItem>
            <SelectItem value="draft">Draft</SelectItem>
            <SelectItem value="negotiation">Negotiation</SelectItem>
            <SelectItem value="active">Active</SelectItem>
            <SelectItem value="expired">Expired</SelectItem>
            <SelectItem value="archived">Archived</SelectItem>
          </SelectContent>
        </Select>
        <Button
          onClick={() => setShowAddModal(true)}
          className="bg-indigo-500 hover:bg-indigo-600 text-white"
        >
          <Plus className="w-4 h-4 mr-2" />
          New Contract
        </Button>
      </div>

      {/* Contract Cards */}
      {filtered.length === 0 ? (
        <div className="flex flex-col items-center py-16 text-center">
          <FileText className="w-10 h-10 text-slate-600 mb-3" />
          <p className="text-slate-400 text-sm">No contracts found</p>
          <p className="text-slate-500 text-xs mt-1">Add a new contract to get started</p>
        </div>
      ) : (
        <div className="grid gap-3">
          {filtered.map((c, i) => {
            const statusCfg = STATUS_CONFIG[c.status];
            const StatusIcon = statusCfg.icon;
            const days = c.end_date ? daysUntilExpiry(c.end_date) : null;
            const isExpiringSoon = days !== null && days > 0 && days <= 30;
            return (
              <motion.div
                key={c.id}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.04 }}
              >
                <Card className="border-0 hover:border hover:border-indigo-500/20 transition-all duration-200"
                  style={{ background: "#0D1425" }}>
                  <CardContent className="p-5">
                    <div className="flex items-start justify-between gap-3 mb-3">
                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <h3 className="text-white font-semibold text-sm truncate">{c.title}</h3>
                          {isExpiringSoon && (
                            <AlertCircle className="w-3.5 h-3.5 text-red-400 shrink-0" />
                          )}
                        </div>
                        <p className="text-slate-400 text-xs mt-0.5">{c.vendor_name} · {c.contract_type.replace(/_/g, " ")}</p>
                      </div>
                      <div className="flex gap-2 shrink-0">
                        {c.risk_level && (
                          <Badge className={`${RISK_CONFIG[c.risk_level]} border text-xs`}>
                            {c.risk_level} risk
                          </Badge>
                        )}
                        <Badge className={`${statusCfg.cls} border text-xs flex items-center gap-1`}>
                          <StatusIcon className="w-3 h-3" />
                          {statusCfg.label}
                        </Badge>
                      </div>
                    </div>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-xs mb-3">
                      <div>
                        <p className="text-slate-500 mb-0.5">Value</p>
                        <p className="text-slate-200">
                          {c.contract_value
                            ? `${c.currency} ${c.contract_value.toLocaleString("en-IN")}`
                            : "N/A"}
                        </p>
                      </div>
                      <div>
                        <p className="text-slate-500 mb-0.5">Start</p>
                        <p className="text-slate-200">{new Date(c.start_date).toLocaleDateString("en-IN")}</p>
                      </div>
                      <div>
                        <p className="text-slate-500 mb-0.5">Expiry</p>
                        <p className={`${isExpiringSoon ? "text-red-400 font-medium" : "text-slate-200"}`}>
                          {c.end_date ? new Date(c.end_date).toLocaleDateString("en-IN") : "—"}
                          {isExpiringSoon && ` (${days}d)`}
                        </p>
                      </div>
                      <div>
                        <p className="text-slate-500 mb-0.5">Type</p>
                        <p className="text-slate-200 capitalize">{c.contract_type.replace(/_/g, " ")}</p>
                      </div>
                    </div>
                    {c.key_terms && (
                      <p className="text-slate-400 text-xs bg-slate-800/40 rounded p-2 border border-slate-700/30 line-clamp-2">
                        {c.key_terms}
                      </p>
                    )}
                  </CardContent>
                </Card>
              </motion.div>
            );
          })}
        </div>
      )}

      {/* Add Contract Modal */}
      <Dialog open={showAddModal} onOpenChange={setShowAddModal}>
        <DialogContent className="bg-[#0A0F1C] border border-indigo-500/20 text-white max-w-lg">
          <DialogHeader>
            <DialogTitle className="text-white">Add New Contract</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 mt-2">
            <div className="grid grid-cols-2 gap-3">
              <div className="col-span-2">
                <Label className="text-slate-300 text-xs mb-1 block">Contract Title *</Label>
                <Input value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))}
                  className="bg-slate-800 border-slate-700 text-white" placeholder="e.g. Master Service Agreement" />
              </div>
              <div>
                <Label className="text-slate-300 text-xs mb-1 block">Counterparty / Vendor *</Label>
                <Input value={form.vendor_name} onChange={e => setForm(f => ({ ...f, vendor_name: e.target.value }))}
                  className="bg-slate-800 border-slate-700 text-white" placeholder="Company name" />
              </div>
              <div>
                <Label className="text-slate-300 text-xs mb-1 block">Contract Type</Label>
                <Select value={form.contract_type} onValueChange={v => setForm(f => ({ ...f, contract_type: v }))}>
                  <SelectTrigger className="bg-slate-800 border-slate-700 text-slate-300">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="service_agreement">Service Agreement</SelectItem>
                    <SelectItem value="nda">NDA</SelectItem>
                    <SelectItem value="employment">Employment</SelectItem>
                    <SelectItem value="vendor">Vendor Contract</SelectItem>
                    <SelectItem value="lease">Lease</SelectItem>
                    <SelectItem value="other">Other</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label className="text-slate-300 text-xs mb-1 block">Value (INR)</Label>
                <Input value={form.contract_value} onChange={e => setForm(f => ({ ...f, contract_value: e.target.value }))}
                  type="number" className="bg-slate-800 border-slate-700 text-white" placeholder="0" />
              </div>
              <div>
                <Label className="text-slate-300 text-xs mb-1 block">Risk Level</Label>
                <Select value={form.risk_level || "medium"} onValueChange={v => setForm(f => ({ ...f, risk_level: v as any }))}>
                  <SelectTrigger className="bg-slate-800 border-slate-700 text-slate-300">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="low">Low</SelectItem>
                    <SelectItem value="medium">Medium</SelectItem>
                    <SelectItem value="high">High</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label className="text-slate-300 text-xs mb-1 block">Start Date *</Label>
                <Input value={form.start_date} onChange={e => setForm(f => ({ ...f, start_date: e.target.value }))}
                  type="date" className="bg-slate-800 border-slate-700 text-white" />
              </div>
              <div>
                <Label className="text-slate-300 text-xs mb-1 block">End / Expiry Date</Label>
                <Input value={form.end_date} onChange={e => setForm(f => ({ ...f, end_date: e.target.value }))}
                  type="date" className="bg-slate-800 border-slate-700 text-white" />
              </div>
              <div className="col-span-2">
                <Label className="text-slate-300 text-xs mb-1 block">Key Terms / Notes</Label>
                <Textarea value={form.key_terms} onChange={e => setForm(f => ({ ...f, key_terms: e.target.value }))}
                  className="bg-slate-800 border-slate-700 text-white resize-none" rows={3}
                  placeholder="Key clauses, obligations, or risk notes…" />
              </div>
            </div>
            <div className="flex gap-3 justify-end pt-2">
              <Button variant="outline" className="border-slate-700 text-slate-300" onClick={() => setShowAddModal(false)}>
                Cancel
              </Button>
              <Button className="bg-indigo-500 hover:bg-indigo-600" onClick={handleAdd} disabled={addContract.isPending}>
                {addContract.isPending ? "Saving…" : "Add Contract"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

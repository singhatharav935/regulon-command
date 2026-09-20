import { useState } from "react";
import { motion } from "framer-motion";
import {
  Scale, Plus, Search, Clock, CheckCircle, XCircle, Calendar, Gavel,
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import type { LawyerCase } from "@/hooks/useInhouseLawyerData";
import { useAddCase } from "@/hooks/useInhouseLawyerData";

const STATUS_CONFIG = {
  ongoing:   { label: "Ongoing",   cls: "bg-blue-500/20 text-blue-400 border-blue-500/30",     icon: Clock },
  settled:   { label: "Settled",   cls: "bg-green-500/20 text-green-400 border-green-500/30",  icon: CheckCircle },
  completed: { label: "Completed", cls: "bg-purple-500/20 text-purple-400 border-purple-500/30", icon: CheckCircle },
  dismissed: { label: "Dismissed", cls: "bg-slate-500/20 text-slate-400 border-slate-500/30",  icon: XCircle },
};

interface LawyerLitigationTrackerProps {
  cases: LawyerCase[];
  companyId: string;
  userId: string;
}

export default function LawyerLitigationTracker({ cases, companyId, userId }: LawyerLitigationTrackerProps) {
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("all");
  const [showAdd, setShowAdd] = useState(false);
  const [form, setForm] = useState({
    case_title: "", case_number: "", case_type: "civil",
    court_name: "", status: "ongoing" as LawyerCase["status"],
    next_hearing: "", assigned_lawyer: "", filing_date: "",
  });
  const { toast } = useToast();
  const addCase = useAddCase();

  const filtered = cases.filter(c => {
    const matchSearch = c.case_title.toLowerCase().includes(search.toLowerCase()) ||
                        c.case_number.toLowerCase().includes(search.toLowerCase());
    const matchStatus = filter === "all" || !filter || c.status === filter;
    return matchSearch && matchStatus;
  });

  const upcoming = cases
    .filter(c => c.status === "ongoing" && c.next_hearing)
    .sort((a, b) => new Date(a.next_hearing!).getTime() - new Date(b.next_hearing!).getTime())
    .slice(0, 4);

  const handleAdd = async () => {
    if (!form.case_title || !form.case_number) {
      toast({ title: "Missing fields", description: "Title and case number required.", variant: "destructive" });
      return;
    }
    try {
      await addCase.mutateAsync({
        company_id: companyId,
        created_by: userId,
        case_title: form.case_title,
        case_number: form.case_number,
        case_type: form.case_type,
        court_name: form.court_name || null,
        status: form.status,
        next_hearing: form.next_hearing || null,
        assigned_lawyer: form.assigned_lawyer || null,
        filing_date: form.filing_date || null,
      });
      toast({ title: "✅ Case Added", description: `${form.case_title} has been tracked.` });
      setShowAdd(false);
    } catch (e: any) {
      toast({ title: "Error", description: e.message, variant: "destructive" });
    }
  };

  return (
    <div className="space-y-4">
      {/* Upcoming Hearings Widget */}
      {upcoming.length > 0 && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {upcoming.map((c, i) => {
            const days = Math.ceil((new Date(c.next_hearing!).getTime() - Date.now()) / 86400000);
            return (
              <motion.div key={c.id} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}>
                <Card className="border-0" style={{ background: "#0D1425" }}>
                  <CardContent className="p-4">
                    <div className="flex items-center gap-2 mb-2">
                      <Calendar className="w-3.5 h-3.5 text-indigo-400" />
                      <span className={`text-xs font-bold ${days <= 3 ? "text-red-400" : days <= 7 ? "text-amber-400" : "text-indigo-400"}`}>
                        {days === 0 ? "Today" : `${days}d`}
                      </span>
                    </div>
                    <p className="text-white text-xs font-semibold truncate">{c.case_title}</p>
                    <p className="text-slate-500 text-xs mt-0.5">{c.court_name || "Court TBD"}</p>
                    <p className="text-slate-400 text-xs mt-1">
                      {new Date(c.next_hearing!).toLocaleDateString("en-IN", { day: "numeric", month: "short" })}
                    </p>
                  </CardContent>
                </Card>
              </motion.div>
            );
          })}
        </div>
      )}

      {/* Toolbar */}
      <div className="flex gap-3 flex-wrap">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
          <Input
            placeholder="Search cases…"
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="pl-9 bg-slate-800/60 border-slate-700 text-white placeholder:text-slate-500"
          />
        </div>
        <Select value={filter} onValueChange={setFilter}>
          <SelectTrigger className="w-[150px] bg-slate-800/60 border-slate-700 text-slate-300">
            <SelectValue placeholder="All statuses" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Statuses</SelectItem>
            <SelectItem value="ongoing">Ongoing</SelectItem>
            <SelectItem value="settled">Settled</SelectItem>
            <SelectItem value="completed">Completed</SelectItem>
            <SelectItem value="dismissed">Dismissed</SelectItem>
          </SelectContent>
        </Select>
        <Button onClick={() => setShowAdd(true)} className="bg-indigo-500 hover:bg-indigo-600 text-white">
          <Plus className="w-4 h-4 mr-2" />
          New Case
        </Button>
      </div>

      {/* Case List */}
      {filtered.length === 0 ? (
        <div className="flex flex-col items-center py-16 text-center">
          <Scale className="w-10 h-10 text-slate-600 mb-3" />
          <p className="text-slate-400 text-sm">No cases found</p>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map((c, i) => {
            const statusCfg = STATUS_CONFIG[c.status];
            const StatusIcon = statusCfg.icon;
            const days = c.next_hearing
              ? Math.ceil((new Date(c.next_hearing).getTime() - Date.now()) / 86400000)
              : null;
            return (
              <motion.div key={c.id} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.04 }}>
                <Card className="border-0 hover:border hover:border-indigo-500/20 transition-all" style={{ background: "#0D1425" }}>
                  <CardContent className="p-5">
                    <div className="flex items-start justify-between gap-3 mb-3">
                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <Gavel className="w-3.5 h-3.5 text-indigo-400 shrink-0" />
                          <h3 className="text-white font-semibold text-sm truncate">{c.case_title}</h3>
                        </div>
                        <p className="text-slate-400 text-xs mt-0.5">
                          #{c.case_number} · {c.court_name || "Court TBD"} · {c.case_type.toUpperCase()}
                        </p>
                      </div>
                      <Badge className={`${statusCfg.cls} border text-xs flex items-center gap-1 shrink-0`}>
                        <StatusIcon className="w-3 h-3" />
                        {statusCfg.label}
                      </Badge>
                    </div>
                    <div className="grid grid-cols-3 gap-3 text-xs">
                      <div>
                        <p className="text-slate-500 mb-0.5">Assigned</p>
                        <p className="text-slate-200">{c.assigned_lawyer || "Unassigned"}</p>
                      </div>
                      <div>
                        <p className="text-slate-500 mb-0.5">Filed</p>
                        <p className="text-slate-200">
                          {c.filing_date ? new Date(c.filing_date).toLocaleDateString("en-IN") : "—"}
                        </p>
                      </div>
                      <div>
                        <p className="text-slate-500 mb-0.5">Next Hearing</p>
                        <p className={`${days !== null && days <= 7 ? "text-red-400 font-medium" : "text-slate-200"}`}>
                          {c.next_hearing
                            ? `${new Date(c.next_hearing).toLocaleDateString("en-IN")}${days !== null ? ` (${days}d)` : ""}`
                            : "TBD"}
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            );
          })}
        </div>
      )}

      {/* Add Case Modal */}
      <Dialog open={showAdd} onOpenChange={setShowAdd}>
        <DialogContent className="bg-[#0A0F1C] border border-indigo-500/20 text-white max-w-md">
          <DialogHeader>
            <DialogTitle className="text-white">Add New Case</DialogTitle>
          </DialogHeader>
          <div className="space-y-3 mt-2">
            <div>
              <Label className="text-slate-300 text-xs mb-1 block">Case Title *</Label>
              <Input value={form.case_title} onChange={e => setForm(f => ({ ...f, case_title: e.target.value }))}
                className="bg-slate-800 border-slate-700 text-white" />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label className="text-slate-300 text-xs mb-1 block">Case Number *</Label>
                <Input value={form.case_number} onChange={e => setForm(f => ({ ...f, case_number: e.target.value }))}
                  className="bg-slate-800 border-slate-700 text-white" placeholder="e.g. CS/123/2026" />
              </div>
              <div>
                <Label className="text-slate-300 text-xs mb-1 block">Type</Label>
                <Select value={form.case_type} onValueChange={v => setForm(f => ({ ...f, case_type: v }))}>
                  <SelectTrigger className="bg-slate-800 border-slate-700 text-slate-300"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="civil">Civil</SelectItem>
                    <SelectItem value="criminal">Criminal</SelectItem>
                    <SelectItem value="tax">Tax</SelectItem>
                    <SelectItem value="arbitration">Arbitration</SelectItem>
                    <SelectItem value="labour">Labour</SelectItem>
                    <SelectItem value="ipr">IPR</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label className="text-slate-300 text-xs mb-1 block">Court Name</Label>
                <Input value={form.court_name} onChange={e => setForm(f => ({ ...f, court_name: e.target.value }))}
                  className="bg-slate-800 border-slate-700 text-white" />
              </div>
              <div>
                <Label className="text-slate-300 text-xs mb-1 block">Assigned Lawyer</Label>
                <Input value={form.assigned_lawyer} onChange={e => setForm(f => ({ ...f, assigned_lawyer: e.target.value }))}
                  className="bg-slate-800 border-slate-700 text-white" />
              </div>
              <div>
                <Label className="text-slate-300 text-xs mb-1 block">Filing Date</Label>
                <Input value={form.filing_date} onChange={e => setForm(f => ({ ...f, filing_date: e.target.value }))}
                  type="date" className="bg-slate-800 border-slate-700 text-white" />
              </div>
              <div>
                <Label className="text-slate-300 text-xs mb-1 block">Next Hearing</Label>
                <Input value={form.next_hearing} onChange={e => setForm(f => ({ ...f, next_hearing: e.target.value }))}
                  type="date" className="bg-slate-800 border-slate-700 text-white" />
              </div>
            </div>
            <div className="flex gap-3 justify-end pt-2">
              <Button variant="outline" className="border-slate-700 text-slate-300" onClick={() => setShowAdd(false)}>Cancel</Button>
              <Button className="bg-indigo-500 hover:bg-indigo-600" onClick={handleAdd} disabled={addCase.isPending}>
                {addCase.isPending ? "Saving…" : "Add Case"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

import { useState } from "react";
import { motion } from "framer-motion";
import {
  ShieldAlert, Plus, TrendingUp, CheckCircle, AlertCircle, Eye,
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useQueryClient } from "@tanstack/react-query";
import type { LawyerRisk } from "@/hooks/useInhouseLawyerData";

const PROB_IMPACT = {
  low:    { cls: "bg-green-500/20 text-green-400 border-green-500/30",   score: 1 },
  medium: { cls: "bg-amber-500/20 text-amber-400 border-amber-500/30",   score: 2 },
  high:   { cls: "bg-red-500/20 text-red-400 border-red-500/30",         score: 3 },
};

const STATUS_CFG = {
  identified: { label: "Identified", cls: "bg-orange-500/20 text-orange-400 border-orange-500/30", icon: AlertCircle },
  mitigating: { label: "Mitigating", cls: "bg-blue-500/20 text-blue-400 border-blue-500/30",       icon: TrendingUp },
  monitored:  { label: "Monitored",  cls: "bg-indigo-500/20 text-indigo-400 border-indigo-500/30", icon: Eye },
  resolved:   { label: "Resolved",   cls: "bg-green-500/20 text-green-400 border-green-500/30",   icon: CheckCircle },
};

interface LawyerRiskRegistryProps {
  risks: LawyerRisk[];
  companyId: string;
  userId: string;
}

export default function LawyerRiskRegistry({ risks, companyId, userId }: LawyerRiskRegistryProps) {
  const [showAdd, setShowAdd] = useState(false);
  const [form, setForm] = useState({
    risk_title: "", risk_category: "contract", risk_description: "",
    probability: "medium" as LawyerRisk["probability"],
    impact: "medium" as LawyerRisk["impact"],
    status: "identified" as LawyerRisk["status"],
    mitigation_plan: "", mitigation_owner: "",
  });
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const resolveRisk = async (id: string) => {
    const { error } = await supabase.from("legal_risks").update({ status: "resolved" }).eq("id", id);
    if (error) toast({ title: "Error", description: error.message, variant: "destructive" });
    else {
      toast({ title: "✅ Risk Resolved" });
      queryClient.invalidateQueries({ queryKey: ["lawyer-risks", companyId] });
    }
  };

  const handleAdd = async () => {
    if (!form.risk_title) {
      toast({ title: "Missing title", variant: "destructive" });
      return;
    }
    const { error } = await supabase.from("legal_risks").insert([{
      company_id: companyId,
      risk_title: form.risk_title,
      risk_category: form.risk_category,
      risk_description: form.risk_description || null,
      probability: form.probability,
      impact: form.impact,
      status: form.status,
      mitigation_plan: form.mitigation_plan || null,
      mitigation_owner: form.mitigation_owner || null,
    }]);
    if (error) toast({ title: "Error", description: error.message, variant: "destructive" });
    else {
      toast({ title: "✅ Risk Added", description: `${form.risk_title} tracked.` });
      queryClient.invalidateQueries({ queryKey: ["lawyer-risks", companyId] });
      setShowAdd(false);
      setForm({ risk_title: "", risk_category: "contract", risk_description: "", probability: "medium", impact: "medium", status: "identified", mitigation_plan: "", mitigation_owner: "" });
    }
  };

  // Sort by risk score desc
  const sorted = [...risks].sort((a, b) => {
    const scoreA = PROB_IMPACT[a.probability].score * PROB_IMPACT[a.impact].score;
    const scoreB = PROB_IMPACT[b.probability].score * PROB_IMPACT[b.impact].score;
    return scoreB - scoreA;
  });

  const activeRisks = sorted.filter(r => r.status !== "resolved");
  const resolvedRisks = sorted.filter(r => r.status === "resolved");

  const renderRisk = (r: LawyerRisk, i: number) => {
    const statusCfg = STATUS_CFG[r.status];
    const StatusIcon = statusCfg.icon;
    const score = PROB_IMPACT[r.probability].score * PROB_IMPACT[r.impact].score;
    const scoreColor = score >= 6 ? "text-red-400" : score >= 3 ? "text-amber-400" : "text-green-400";

    return (
      <motion.div key={r.id} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.04 }}>
        <Card className="border-0 hover:border hover:border-indigo-500/20 transition-all" style={{ background: "#0D1425" }}>
          <CardContent className="p-5">
            <div className="flex items-start justify-between gap-3 mb-3">
              <div className="min-w-0">
                <h3 className="text-white font-semibold text-sm">{r.risk_title}</h3>
                <p className="text-slate-400 text-xs mt-0.5 capitalize">{r.risk_category.replace(/_/g, " ")}</p>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <div className="text-right">
                  <p className={`text-2xl font-bold ${scoreColor}`}>{score}</p>
                  <p className="text-slate-500 text-[10px]">/ 9</p>
                </div>
                <Badge className={`${statusCfg.cls} border text-xs flex items-center gap-1`}>
                  <StatusIcon className="w-3 h-3" />
                  {statusCfg.label}
                </Badge>
              </div>
            </div>

            {r.risk_description && (
              <p className="text-slate-300 text-xs mb-3 leading-relaxed line-clamp-2">{r.risk_description}</p>
            )}

            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-3">
              <div>
                <p className="text-slate-500 text-xs mb-1">Probability</p>
                <Badge className={`${PROB_IMPACT[r.probability].cls} border text-xs capitalize`}>
                  {r.probability}
                </Badge>
              </div>
              <div>
                <p className="text-slate-500 text-xs mb-1">Impact</p>
                <Badge className={`${PROB_IMPACT[r.impact].cls} border text-xs capitalize`}>
                  {r.impact}
                </Badge>
              </div>
              <div>
                <p className="text-slate-500 text-xs mb-1">Owner</p>
                <p className="text-slate-200 text-xs">{r.mitigation_owner || "Unassigned"}</p>
              </div>
              <div>
                <p className="text-slate-500 text-xs mb-1">Risk Score</p>
                <p className={`${scoreColor} text-xs font-bold`}>
                  {score >= 6 ? "Critical" : score >= 3 ? "Moderate" : "Low"}
                </p>
              </div>
            </div>

            {r.mitigation_plan && (
              <div className="bg-slate-800/40 rounded p-3 mb-3 border border-slate-700/30">
                <p className="text-slate-500 text-xs font-semibold mb-1">Mitigation Plan</p>
                <p className="text-slate-300 text-xs">{r.mitigation_plan}</p>
              </div>
            )}

            {r.status !== "resolved" && (
              <Button size="sm"
                className="bg-green-500/20 hover:bg-green-500/30 text-green-400 border border-green-500/30 text-xs"
                onClick={() => resolveRisk(r.id)}
              >
                <CheckCircle className="w-3 h-3 mr-1" />
                Mark Resolved
              </Button>
            )}
          </CardContent>
        </Card>
      </motion.div>
    );
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <Button onClick={() => setShowAdd(true)} className="bg-indigo-500 hover:bg-indigo-600 text-white">
          <Plus className="w-4 h-4 mr-2" />
          Add Risk
        </Button>
      </div>

      {risks.length === 0 ? (
        <div className="flex flex-col items-center py-16 text-center">
          <ShieldAlert className="w-10 h-10 text-slate-600 mb-3" />
          <p className="text-slate-400 text-sm">No risks identified</p>
          <p className="text-slate-500 text-xs mt-1">Track and manage your company's legal risk exposure</p>
        </div>
      ) : (
        <>
          {activeRisks.length > 0 && (
            <div className="space-y-3">{activeRisks.map((r, i) => renderRisk(r, i))}</div>
          )}
          {resolvedRisks.length > 0 && (
            <div>
              <p className="text-slate-500 text-xs font-semibold uppercase tracking-wider mb-3 flex items-center gap-2">
                <CheckCircle className="w-3.5 h-3.5 text-green-400" />
                Resolved ({resolvedRisks.length})
              </p>
              <div className="space-y-3 opacity-60">{resolvedRisks.map((r, i) => renderRisk(r, i))}</div>
            </div>
          )}
        </>
      )}

      <Dialog open={showAdd} onOpenChange={setShowAdd}>
        <DialogContent className="bg-[#0A0F1C] border border-indigo-500/20 text-white max-w-md">
          <DialogHeader>
            <DialogTitle className="text-white">Add Legal Risk</DialogTitle>
          </DialogHeader>
          <div className="space-y-3 mt-2">
            <div>
              <Label className="text-slate-300 text-xs mb-1 block">Risk Title *</Label>
              <Input value={form.risk_title} onChange={e => setForm(f => ({ ...f, risk_title: e.target.value }))}
                className="bg-slate-800 border-slate-700 text-white" />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label className="text-slate-300 text-xs mb-1 block">Category</Label>
                <Select value={form.risk_category} onValueChange={v => setForm(f => ({ ...f, risk_category: v }))}>
                  <SelectTrigger className="bg-slate-800 border-slate-700 text-slate-300"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="contract">Contract</SelectItem>
                    <SelectItem value="regulatory">Regulatory</SelectItem>
                    <SelectItem value="litigation">Litigation</SelectItem>
                    <SelectItem value="ip">Intellectual Property</SelectItem>
                    <SelectItem value="employment">Employment</SelectItem>
                    <SelectItem value="data_privacy">Data Privacy</SelectItem>
                    <SelectItem value="tax">Tax</SelectItem>
                    <SelectItem value="other">Other</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label className="text-slate-300 text-xs mb-1 block">Probability</Label>
                <Select value={form.probability} onValueChange={v => setForm(f => ({ ...f, probability: v as any }))}>
                  <SelectTrigger className="bg-slate-800 border-slate-700 text-slate-300"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="low">Low</SelectItem>
                    <SelectItem value="medium">Medium</SelectItem>
                    <SelectItem value="high">High</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label className="text-slate-300 text-xs mb-1 block">Impact</Label>
                <Select value={form.impact} onValueChange={v => setForm(f => ({ ...f, impact: v as any }))}>
                  <SelectTrigger className="bg-slate-800 border-slate-700 text-slate-300"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="low">Low</SelectItem>
                    <SelectItem value="medium">Medium</SelectItem>
                    <SelectItem value="high">High</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label className="text-slate-300 text-xs mb-1 block">Mitigation Owner</Label>
                <Input value={form.mitigation_owner} onChange={e => setForm(f => ({ ...f, mitigation_owner: e.target.value }))}
                  className="bg-slate-800 border-slate-700 text-white" placeholder="Name / team" />
              </div>
            </div>
            <div>
              <Label className="text-slate-300 text-xs mb-1 block">Description</Label>
              <Textarea value={form.risk_description} onChange={e => setForm(f => ({ ...f, risk_description: e.target.value }))}
                className="bg-slate-800 border-slate-700 text-white resize-none" rows={2} />
            </div>
            <div>
              <Label className="text-slate-300 text-xs mb-1 block">Mitigation Plan</Label>
              <Textarea value={form.mitigation_plan} onChange={e => setForm(f => ({ ...f, mitigation_plan: e.target.value }))}
                className="bg-slate-800 border-slate-700 text-white resize-none" rows={2}
                placeholder="Steps to mitigate or resolve this risk…" />
            </div>
            <div className="flex gap-3 justify-end pt-2">
              <Button variant="outline" className="border-slate-700 text-slate-300" onClick={() => setShowAdd(false)}>Cancel</Button>
              <Button className="bg-indigo-500 hover:bg-indigo-600" onClick={handleAdd}>Add Risk</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

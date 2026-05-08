import { useState } from "react";
import { motion } from "framer-motion";
import { CheckCircle2, AlertTriangle, Shield, BookOpen, Star, RefreshCcw, Edit2, Save, X } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { toast } from "sonner";

interface ICAIQualityControlProps {
  firmId: string;
}

// This module manages local firm compliance data (ICAI Peer Review, CPE)
// Data is persisted in localStorage under the firm's key since ICAI portal
// does not have a public API — it is managed manually by the firm partner.

const STORAGE_KEY = (firmId: string) => `icai_qc_${firmId}`;

interface PeerReviewData {
  certificate_number: string;
  last_review: string;
  next_review: string;
  status: "active" | "expired" | "pending";
}

interface CPEEntry {
  id: string;
  partner: string;
  hours: number;
  required: number;
  last_updated: string;
}

interface SQC1Policy {
  label: string;
  status: "compliant" | "review_needed" | "non_compliant";
  notes: string;
}

const defaultPeerReview: PeerReviewData = {
  certificate_number: "",
  last_review: "",
  next_review: "",
  status: "pending",
};

const defaultSQC1: SQC1Policy[] = [
  { label: "Leadership Responsibilities for Quality on Audits", status: "compliant", notes: "" },
  { label: "Ethical Requirements", status: "compliant", notes: "" },
  { label: "Acceptance & Continuance of Client Relationships", status: "review_needed", notes: "" },
  { label: "Human Resources (Competency & Training)", status: "compliant", notes: "" },
  { label: "Engagement Performance", status: "compliant", notes: "" },
  { label: "Monitoring & Remediation", status: "review_needed", notes: "" },
];

export default function ICAIQualityControl({ firmId }: ICAIQualityControlProps) {
  const storageKey = STORAGE_KEY(firmId);

  const loadData = () => {
    try {
      const saved = localStorage.getItem(storageKey);
      if (saved) return JSON.parse(saved);
    } catch {}
    return {
      peerReview: defaultPeerReview,
      cpeEntries: [] as CPEEntry[],
      sqc1Policies: defaultSQC1,
    };
  };

  const [data, setData] = useState(loadData());
  const [editingPR, setEditingPR] = useState(false);
  const [editPR, setEditPR] = useState<PeerReviewData>(data.peerReview);
  const [addingCPE, setAddingCPE] = useState(false);
  const [newCPE, setNewCPE] = useState({ partner: "", hours: "", required: "20" });

  const saveData = (newData: typeof data) => {
    setData(newData);
    localStorage.setItem(storageKey, JSON.stringify(newData));
  };

  const savePeerReview = () => {
    const updated = { ...data, peerReview: editPR };
    saveData(updated);
    setEditingPR(false);
    toast.success("Peer Review details saved!");
  };

  const addCPEEntry = () => {
    if (!newCPE.partner || !newCPE.hours) {
      toast.error("Partner name and hours are required.");
      return;
    }
    const entry: CPEEntry = {
      id: Date.now().toString(),
      partner: newCPE.partner,
      hours: parseFloat(newCPE.hours),
      required: parseInt(newCPE.required),
      last_updated: new Date().toISOString(),
    };
    const updated = { ...data, cpeEntries: [...data.cpeEntries, entry] };
    saveData(updated);
    setNewCPE({ partner: "", hours: "", required: "20" });
    setAddingCPE(false);
    toast.success("CPE record saved!");
  };

  const updateCPEHours = (id: string, hours: number) => {
    const updated = {
      ...data,
      cpeEntries: data.cpeEntries.map((e: CPEEntry) =>
        e.id === id ? { ...e, hours, last_updated: new Date().toISOString() } : e
      ),
    };
    saveData(updated);
    toast.success("CPE hours updated.");
  };

  const removeCPEEntry = (id: string) => {
    const updated = { ...data, cpeEntries: data.cpeEntries.filter((e: CPEEntry) => e.id !== id) };
    saveData(updated);
  };

  const toggleSQCStatus = (index: number) => {
    const statuses: SQC1Policy["status"][] = ["compliant", "review_needed", "non_compliant"];
    const current = data.sqc1Policies[index].status;
    const next = statuses[(statuses.indexOf(current) + 1) % statuses.length];
    const updated = {
      ...data,
      sqc1Policies: data.sqc1Policies.map((p: SQC1Policy, i: number) =>
        i === index ? { ...p, status: next } : p
      ),
    };
    saveData(updated);
    toast.info(`Policy updated to: ${next.replace("_", " ")}`);
  };

  const statusColors: Record<string, string> = {
    compliant: "bg-emerald-500/20 text-emerald-400 border-emerald-500/30",
    review_needed: "bg-amber-500/20 text-amber-400 border-amber-500/30",
    non_compliant: "bg-rose-500/20 text-rose-400 border-rose-500/30",
  };

  const prStatusColor: Record<string, string> = {
    active: "bg-emerald-500/20 text-emerald-400 border-emerald-500/30",
    expired: "bg-rose-500/20 text-rose-400 border-rose-500/30",
    pending: "bg-slate-500/20 text-slate-400 border-slate-500/30",
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-white">ICAI Quality Control (SQC 1)</h2>
          <p className="text-sm text-slate-400 mt-1">Manage Peer Review status, SQC 1 compliance, and CPE hours for your firm.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Peer Review Card */}
        <Card className="bg-slate-800/50 border-gray-700/50">
          <CardContent className="p-6">
            <div className="flex justify-between items-start mb-4">
              <div className="flex items-center gap-3">
                <div className="p-2.5 bg-indigo-500/10 rounded-lg border border-indigo-500/20">
                  <Star className="w-5 h-5 text-indigo-400" />
                </div>
                <div>
                  <h3 className="font-semibold text-white">ICAI Peer Review</h3>
                  <p className="text-xs text-slate-400">Certificate Status</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Badge className={`border text-[10px] ${prStatusColor[data.peerReview.status]}`}>
                  {data.peerReview.status.toUpperCase()}
                </Badge>
                <Button variant="ghost" size="icon" onClick={() => { setEditPR(data.peerReview); setEditingPR(!editingPR); }} className="text-slate-400 hover:text-white h-7 w-7">
                  <Edit2 className="w-3.5 h-3.5" />
                </Button>
              </div>
            </div>

            {editingPR ? (
              <div className="space-y-3">
                <div className="space-y-1">
                  <Label className="text-slate-300 text-xs">Certificate Number</Label>
                  <Input value={editPR.certificate_number} onChange={e => setEditPR(p => ({ ...p, certificate_number: e.target.value }))} placeholder="PR/2024/XXXXX" className="bg-slate-900/50 border-slate-700 text-white font-mono h-8 text-sm" />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <Label className="text-slate-300 text-xs">Last Review Date</Label>
                    <Input type="date" value={editPR.last_review} onChange={e => setEditPR(p => ({ ...p, last_review: e.target.value }))} className="bg-slate-900/50 border-slate-700 text-white h-8 text-sm" />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-slate-300 text-xs">Next Review Due</Label>
                    <Input type="date" value={editPR.next_review} onChange={e => setEditPR(p => ({ ...p, next_review: e.target.value }))} className="bg-slate-900/50 border-slate-700 text-white h-8 text-sm" />
                  </div>
                </div>
                <div className="flex gap-2 mt-2">
                  <Button size="sm" onClick={savePeerReview} className="bg-indigo-600 hover:bg-indigo-700 text-white h-7 text-xs">
                    <Save className="w-3 h-3 mr-1" /> Save
                  </Button>
                  <Button size="sm" variant="ghost" onClick={() => setEditingPR(false)} className="text-slate-400 h-7 text-xs">Cancel</Button>
                </div>
              </div>
            ) : (
              <div className="space-y-3">
                <div>
                  <p className="text-xs text-slate-400 mb-1">Certificate Number</p>
                  <p className="font-mono text-white text-sm bg-slate-900/50 p-2 rounded border border-slate-700/50">
                    {data.peerReview.certificate_number || <span className="text-slate-500 font-sans">Not entered yet — click ✏️ to edit</span>}
                  </p>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <p className="text-xs text-slate-400 mb-1">Last Review</p>
                    <p className="text-sm text-white">{data.peerReview.last_review ? new Date(data.peerReview.last_review).toLocaleDateString("en-IN") : "—"}</p>
                  </div>
                  <div>
                    <p className="text-xs text-slate-400 mb-1">Next Due</p>
                    <p className="text-sm text-amber-400">{data.peerReview.next_review ? new Date(data.peerReview.next_review).toLocaleDateString("en-IN") : "—"}</p>
                  </div>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* CPE Tracking */}
        <Card className="bg-slate-800/50 border-gray-700/50">
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="p-2.5 bg-cyan-500/10 rounded-lg border border-cyan-500/20">
                  <BookOpen className="w-5 h-5 text-cyan-400" />
                </div>
                <div>
                  <h3 className="font-semibold text-white">CPE Hours Tracking</h3>
                  <p className="text-xs text-slate-400">Continuing Professional Education</p>
                </div>
              </div>
              <Button size="sm" variant="outline" onClick={() => setAddingCPE(!addingCPE)} className="border-slate-700 text-slate-300 h-7 text-xs">
                <Plus className="w-3 h-3 mr-1" /> Add
              </Button>
            </div>

            {addingCPE && (
              <div className="bg-slate-900/50 rounded-lg p-3 mb-3 space-y-2 border border-slate-700/50">
                <Input placeholder="Partner / Member Name" value={newCPE.partner} onChange={e => setNewCPE(p => ({ ...p, partner: e.target.value }))} className="bg-slate-800 border-slate-700 text-white h-8 text-sm" />
                <div className="grid grid-cols-2 gap-2">
                  <Input type="number" placeholder="Completed Hours" value={newCPE.hours} onChange={e => setNewCPE(p => ({ ...p, hours: e.target.value }))} className="bg-slate-800 border-slate-700 text-white h-8 text-sm" />
                  <Input type="number" placeholder="Required Hours" value={newCPE.required} onChange={e => setNewCPE(p => ({ ...p, required: e.target.value }))} className="bg-slate-800 border-slate-700 text-white h-8 text-sm" />
                </div>
                <div className="flex gap-2">
                  <Button size="sm" onClick={addCPEEntry} className="bg-cyan-600 hover:bg-cyan-700 text-white h-7 text-xs flex-1">Save</Button>
                  <Button size="sm" variant="ghost" onClick={() => setAddingCPE(false)} className="text-slate-400 h-7 text-xs">Cancel</Button>
                </div>
              </div>
            )}

            {data.cpeEntries.length === 0 ? (
              <p className="text-sm text-slate-500 text-center py-4">No CPE records yet. Click 'Add' to track partner hours.</p>
            ) : (
              <div className="space-y-3 max-h-48 overflow-y-auto pr-1">
                {data.cpeEntries.map((cpe: CPEEntry) => (
                  <div key={cpe.id} className="space-y-1.5">
                    <div className="flex justify-between items-center text-sm">
                      <span className="text-white font-medium">{cpe.partner}</span>
                      <div className="flex items-center gap-2">
                        <span className={cpe.hours >= cpe.required ? "text-emerald-400" : "text-amber-400"}>
                          {cpe.hours} / {cpe.required} hrs
                        </span>
                        <button onClick={() => removeCPEEntry(cpe.id)} className="text-slate-600 hover:text-rose-400">
                          <X className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                    <Progress
                      value={Math.min(100, (cpe.hours / cpe.required) * 100)}
                      className="h-1.5 bg-slate-700"
                    />
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* SQC 1 Policies — Full Width */}
        <Card className="md:col-span-2 bg-slate-800/50 border-gray-700/50">
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold text-white flex items-center gap-2">
                <Shield className="w-4 h-4 text-slate-400" />
                SQC 1 Policy Adherence
              </h3>
              <p className="text-xs text-slate-500">Click any row to toggle status</p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {data.sqc1Policies.map((policy: SQC1Policy, i: number) => (
                <motion.button
                  key={i}
                  onClick={() => toggleSQCStatus(i)}
                  className="flex items-start gap-3 p-3 bg-slate-900/50 rounded-lg border border-slate-700/50 hover:border-slate-600 text-left transition-all w-full"
                  whileHover={{ scale: 1.01 }}
                  whileTap={{ scale: 0.99 }}
                >
                  {policy.status === "compliant" ? (
                    <CheckCircle2 className="w-5 h-5 text-emerald-400 mt-0.5 shrink-0" />
                  ) : (
                    <AlertTriangle className={`w-5 h-5 ${policy.status === 'non_compliant' ? 'text-rose-400' : 'text-amber-400'} mt-0.5 shrink-0`} />
                  )}
                  <div>
                    <p className="text-sm font-medium text-white leading-snug">{policy.label}</p>
                    <Badge className={`border text-[9px] mt-1 ${statusColors[policy.status]}`}>
                      {policy.status.replace("_", " ").toUpperCase()}
                    </Badge>
                  </div>
                </motion.button>
              ))}
            </div>
            <div className="flex justify-end mt-4">
              <Button
                variant="outline"
                size="sm"
                className="border-slate-700 text-slate-300 text-xs"
                onClick={() => {
                  toast.success("SQC 1 status saved to local storage.");
                }}
              >
                <Save className="w-3 h-3 mr-1.5" />
                Save Compliance Status
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

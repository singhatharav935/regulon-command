import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Users, Plus, X, Briefcase, Activity, Loader2, CheckCircle2, AlertTriangle } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useFirmMembers, useAddFirmMember, useFirmClients, useCAAssignments, useAssignCA, useUnassignCA } from "@/hooks/personas/useCAFirmData";
import { toast } from "sonner";

interface TeamResourceAllocationProps {
  firmId: string;
}

const roleColors: Record<string, string> = {
  partner: "bg-amber-500/20 text-amber-400 border-amber-500/30",
  manager: "bg-blue-500/20 text-blue-400 border-blue-500/30",
  article: "bg-slate-500/20 text-slate-400 border-slate-500/30",
  senior_ca: "bg-violet-500/20 text-violet-400 border-violet-500/30",
};

export default function TeamResourceAllocation({ firmId }: TeamResourceAllocationProps) {
  const { data: members, isLoading: membersLoading } = useFirmMembers(firmId);
  const { data: clients, isLoading: clientsLoading } = useFirmClients(firmId);
  const { data: assignments } = useCAAssignments(firmId);
  const addMember = useAddFirmMember();
  const assignCA = useAssignCA();
  const unassignCA = useUnassignCA();

  const [showAddForm, setShowAddForm] = useState(false);
  const [showAssignModal, setShowAssignModal] = useState<string | null>(null); // memberId
  const [selectedClientId, setSelectedClientId] = useState("");
  const [form, setForm] = useState({ name: "", email: "", role: "manager", specialization: "" });

  const handleAddMember = async () => {
    if (!form.name || !form.email || !form.role) {
      toast.error("Please fill in name, email and role.");
      return;
    }
    try {
      await addMember.mutateAsync({
        firm_id: firmId,
        name: form.name,
        email: form.email,
        role: form.role,
        specialization: form.specialization,
        status: "active",
      });
      toast.success(`${form.name} added to your firm!`);
      setForm({ name: "", email: "", role: "manager", specialization: "" });
      setShowAddForm(false);
    } catch (err: any) {
      toast.error("Failed to add member: " + err.message);
    }
  };

  const handleAssign = async () => {
    if (!showAssignModal || !selectedClientId) {
      toast.error("Please select a client to assign.");
      return;
    }
    // Check if already assigned
    const alreadyAssigned = (assignments || []).some(
      a => a.ca_id === showAssignModal && a.client_id === selectedClientId
    );
    if (alreadyAssigned) {
      toast.warning("This member is already assigned to that client.");
      return;
    }
    try {
      await assignCA.mutateAsync({
        ca_id: showAssignModal,
        client_id: selectedClientId,
        assigned_date: new Date().toISOString().split("T")[0],
        status: "active",
      });
      toast.success("Client assigned successfully!");
      setShowAssignModal(null);
      setSelectedClientId("");
    } catch (err: any) {
      toast.error("Assignment failed: " + err.message);
    }
  };

  const handleUnassign = async (assignmentId: string) => {
    try {
      await unassignCA.mutateAsync(assignmentId);
      toast.success("Assignment removed.");
    } catch (err: any) {
      toast.error("Failed to remove assignment: " + err.message);
    }
  };

  const getMemberAssignments = (memberId: string) =>
    (assignments || []).filter(a => a.ca_id === memberId);

  const getClientName = (clientId: string) => {
    const c = (clients || []).find(cl => cl.id === clientId);
    return c?.company_name || "Unknown Client";
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-white">Team & Resource Allocation</h2>
          <p className="text-sm text-slate-400 mt-1">Manage team members and assign clients to CAs.</p>
        </div>
        <Button
          onClick={() => setShowAddForm(true)}
          className="bg-indigo-600 hover:bg-indigo-700 text-white"
        >
          <Plus className="w-4 h-4 mr-2" />
          Add Team Member
        </Button>
      </div>

      {/* Add Member Form */}
      <AnimatePresence>
        {showAddForm && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
          >
            <Card className="bg-slate-800/80 border-indigo-500/30">
              <CardContent className="p-6">
                <div className="flex justify-between items-center mb-4">
                  <h3 className="font-semibold text-white">New Team Member</h3>
                  <Button variant="ghost" size="icon" onClick={() => setShowAddForm(false)} className="text-slate-400">
                    <X className="w-4 h-4" />
                  </Button>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <Label className="text-slate-300">Full Name *</Label>
                    <Input
                      placeholder="e.g. CA Rajesh Kumar"
                      value={form.name}
                      onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                      className="bg-slate-900/50 border-slate-700 text-white"
                    />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-slate-300">Email *</Label>
                    <Input
                      placeholder="rajesh@yourfirm.com"
                      type="email"
                      value={form.email}
                      onChange={e => setForm(f => ({ ...f, email: e.target.value }))}
                      className="bg-slate-900/50 border-slate-700 text-white"
                    />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-slate-300">Role *</Label>
                    <Select value={form.role} onValueChange={v => setForm(f => ({ ...f, role: v }))}>
                      <SelectTrigger className="bg-slate-900/50 border-slate-700 text-white">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent className="bg-slate-800 border-slate-700 text-white">
                        <SelectItem value="partner">Partner</SelectItem>
                        <SelectItem value="senior_ca">Senior CA</SelectItem>
                        <SelectItem value="manager">Manager</SelectItem>
                        <SelectItem value="article">Article Assistant</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-1">
                    <Label className="text-slate-300">Specialization</Label>
                    <Input
                      placeholder="e.g. GST, Income Tax, Audit"
                      value={form.specialization}
                      onChange={e => setForm(f => ({ ...f, specialization: e.target.value }))}
                      className="bg-slate-900/50 border-slate-700 text-white"
                    />
                  </div>
                </div>
                <div className="flex gap-3 mt-5">
                  <Button
                    onClick={handleAddMember}
                    disabled={addMember.isPending}
                    className="bg-indigo-600 hover:bg-indigo-700 text-white"
                  >
                    {addMember.isPending ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <CheckCircle2 className="w-4 h-4 mr-2" />}
                    {addMember.isPending ? "Adding..." : "Add Member"}
                  </Button>
                  <Button variant="outline" onClick={() => setShowAddForm(false)} className="border-slate-700 text-slate-300">
                    Cancel
                  </Button>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Assign Modal */}
      <AnimatePresence>
        {showAssignModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm"
            onClick={() => setShowAssignModal(null)}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              onClick={e => e.stopPropagation()}
              className="bg-slate-800 border border-slate-700 rounded-2xl p-6 w-full max-w-md shadow-2xl"
            >
              <h3 className="text-lg font-semibold text-white mb-1">Assign Client</h3>
              <p className="text-sm text-slate-400 mb-4">
                Select a client to assign to this team member.
              </p>
              {clientsLoading ? (
                <div className="text-slate-400 text-sm flex items-center gap-2">
                  <Loader2 className="w-4 h-4 animate-spin" /> Loading clients...
                </div>
              ) : (clients || []).length === 0 ? (
                <p className="text-slate-500 text-sm">No clients found. Add clients first.</p>
              ) : (
                <Select value={selectedClientId} onValueChange={setSelectedClientId}>
                  <SelectTrigger className="bg-slate-900/50 border-slate-700 text-white">
                    <SelectValue placeholder="Select a client..." />
                  </SelectTrigger>
                  <SelectContent className="bg-slate-800 border-slate-700 text-white">
                    {(clients || []).map(c => (
                      <SelectItem key={c.id} value={c.id}>{c.company_name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
              <div className="flex gap-3 mt-5">
                <Button
                  onClick={handleAssign}
                  disabled={assignCA.isPending || !selectedClientId}
                  className="bg-indigo-600 hover:bg-indigo-700 text-white flex-1"
                >
                  {assignCA.isPending ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : null}
                  Assign
                </Button>
                <Button variant="outline" onClick={() => setShowAssignModal(null)} className="border-slate-700 text-slate-300">
                  Cancel
                </Button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Team List */}
      {membersLoading ? (
        <div className="space-y-3">
          {[1, 2, 3].map(i => (
            <Card key={i} className="bg-slate-800/50 border-gray-700/50">
              <CardContent className="p-4">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-full bg-slate-700 animate-pulse" />
                  <div className="space-y-2 flex-1">
                    <div className="h-4 w-32 bg-slate-700 rounded animate-pulse" />
                    <div className="h-3 w-24 bg-slate-700/60 rounded animate-pulse" />
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (members || []).length === 0 ? (
        <Card className="bg-slate-800/30 border-dashed border-slate-700/50">
          <CardContent className="p-10 text-center">
            <Users className="w-10 h-10 text-slate-500 mx-auto mb-3" />
            <p className="text-slate-300 font-medium">No team members yet</p>
            <p className="text-slate-500 text-sm mt-1">Add your Partners, Managers, and Article Assistants to get started.</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {(members || []).map((member, i) => {
            const memberAssignments = getMemberAssignments(member.id);
            return (
              <motion.div
                key={member.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.07 }}
              >
                <Card className="bg-slate-800/50 border-gray-700/50 hover:border-gray-600 transition-all">
                  <CardContent className="p-4">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                      <div className="flex items-center gap-3">
                        <div className="w-11 h-11 rounded-full bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center font-bold text-indigo-400 text-sm shrink-0">
                          {member.name.split(" ").map((n: string) => n[0]).join("").slice(0, 2).toUpperCase()}
                        </div>
                        <div>
                          <h3 className="font-semibold text-white">{member.name}</h3>
                          <div className="flex items-center gap-2 mt-0.5">
                            <Badge className={`${roleColors[member.role] || roleColors.manager} border text-[10px] px-1.5 py-0`}>
                              {member.role?.replace("_", " ").toUpperCase()}
                            </Badge>
                            {member.specialization && (
                              <span className="text-xs text-slate-400">{member.specialization}</span>
                            )}
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 flex-wrap">
                        {/* Show assigned clients */}
                        {memberAssignments.map(a => (
                          <div key={a.id} className="flex items-center gap-1 bg-slate-900/50 border border-slate-700/50 rounded-full px-2.5 py-1 text-xs text-slate-300">
                            {getClientName(a.client_id)}
                            <button
                              onClick={() => handleUnassign(a.id)}
                              className="ml-1 text-slate-500 hover:text-rose-400 transition-colors"
                            >
                              <X className="w-3 h-3" />
                            </button>
                          </div>
                        ))}
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => setShowAssignModal(member.id)}
                          className="border-slate-700 text-slate-300 hover:text-white hover:border-indigo-500/50 text-xs h-7"
                        >
                          <Briefcase className="w-3 h-3 mr-1" />
                          Assign Client
                        </Button>
                      </div>
                    </div>

                    {/* Workload indicator */}
                    {memberAssignments.length > 0 && (
                      <div className="mt-3 pt-3 border-t border-slate-700/30">
                        <div className="flex justify-between text-xs mb-1">
                          <span className="text-slate-500">Assigned Clients</span>
                          <span className={`font-medium ${memberAssignments.length > 8 ? 'text-rose-400' : memberAssignments.length > 4 ? 'text-amber-400' : 'text-emerald-400'}`}>
                            {memberAssignments.length} {memberAssignments.length === 1 ? 'client' : 'clients'}
                          </span>
                        </div>
                        <div className="h-1.5 w-full bg-slate-700 rounded-full overflow-hidden">
                          <div
                            className={`h-full rounded-full ${memberAssignments.length > 8 ? 'bg-rose-500' : memberAssignments.length > 4 ? 'bg-amber-500' : 'bg-emerald-500'}`}
                            style={{ width: `${Math.min(100, (memberAssignments.length / 10) * 100)}%` }}
                          />
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </motion.div>
            );
          })}
        </div>
      )}
    </div>
  );
}

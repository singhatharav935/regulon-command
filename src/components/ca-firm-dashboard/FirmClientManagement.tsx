import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Building2, Plus, X, Loader2, CheckCircle2, Phone, Mail, Search } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useFirmClients, useAddFirmClient } from "@/hooks/personas/useCAFirmData";
import { toast } from "sonner";

interface FirmClientManagementProps {
  firmId: string;
}

const statusStyles: Record<string, string> = {
  active: "bg-emerald-500/20 text-emerald-400 border-emerald-500/30",
  inactive: "bg-slate-500/20 text-slate-400 border-slate-500/30",
  pending: "bg-amber-500/20 text-amber-400 border-amber-500/30",
};

export default function FirmClientManagement({ firmId }: FirmClientManagementProps) {
  const { data: clients, isLoading } = useFirmClients(firmId);
  const addClient = useAddFirmClient();

  const [showForm, setShowForm] = useState(false);
  const [search, setSearch] = useState("");
  const [form, setForm] = useState({
    company_name: "",
    contact_person: "",
    email: "",
    phone: "",
    gstin: "",
    pan: "",
    industry: "",
    status: "active",
  });

  const handleAddClient = async () => {
    if (!form.company_name || !form.email) {
      toast.error("Company name and email are required.");
      return;
    }
    try {
      await addClient.mutateAsync({
        firm_id: firmId,
        company_name: form.company_name,
        contact_person: form.contact_person,
        email: form.email,
        status: form.status,
      });
      toast.success(`${form.company_name} added as a client!`);
      setForm({ company_name: "", contact_person: "", email: "", phone: "", gstin: "", pan: "", industry: "", status: "active" });
      setShowForm(false);
    } catch (err: any) {
      toast.error("Failed to add client: " + err.message);
    }
  };

  const filtered = (clients || []).filter(c =>
    !search ||
    c.company_name?.toLowerCase().includes(search.toLowerCase()) ||
    c.email?.toLowerCase().includes(search.toLowerCase()) ||
    c.contact_person?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-white">Client Management</h2>
          <p className="text-sm text-slate-400 mt-1">Add, view and manage all clients of your CA firm.</p>
        </div>
        <Button onClick={() => setShowForm(true)} className="bg-blue-600 hover:bg-blue-700 text-white">
          <Plus className="w-4 h-4 mr-2" />
          Add Client
        </Button>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
        <Input
          placeholder="Search by company name, email, or contact..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          className="pl-9 bg-slate-800/50 border-gray-700/50 text-white"
        />
      </div>

      {/* Add Client Form */}
      <AnimatePresence>
        {showForm && (
          <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}>
            <Card className="bg-slate-800/80 border-blue-500/30">
              <CardContent className="p-6">
                <div className="flex justify-between items-center mb-4">
                  <h3 className="font-semibold text-white">New Client</h3>
                  <Button variant="ghost" size="icon" onClick={() => setShowForm(false)} className="text-slate-400">
                    <X className="w-4 h-4" />
                  </Button>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <Label className="text-slate-300">Company / Client Name *</Label>
                    <Input placeholder="e.g. Acme Technologies Pvt Ltd" value={form.company_name} onChange={e => setForm(f => ({ ...f, company_name: e.target.value }))} className="bg-slate-900/50 border-slate-700 text-white" />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-slate-300">Contact Person</Label>
                    <Input placeholder="e.g. Mr. Suresh Mehta" value={form.contact_person} onChange={e => setForm(f => ({ ...f, contact_person: e.target.value }))} className="bg-slate-900/50 border-slate-700 text-white" />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-slate-300">Email *</Label>
                    <Input type="email" placeholder="contact@company.com" value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))} className="bg-slate-900/50 border-slate-700 text-white" />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-slate-300">Phone</Label>
                    <Input placeholder="+91 98765 43210" value={form.phone} onChange={e => setForm(f => ({ ...f, phone: e.target.value }))} className="bg-slate-900/50 border-slate-700 text-white" />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-slate-300">GSTIN</Label>
                    <Input placeholder="27AABCU9603R1ZX" value={form.gstin} onChange={e => setForm(f => ({ ...f, gstin: e.target.value.toUpperCase() }))} className="bg-slate-900/50 border-slate-700 text-white font-mono" />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-slate-300">PAN</Label>
                    <Input placeholder="AABCU9603R" value={form.pan} onChange={e => setForm(f => ({ ...f, pan: e.target.value.toUpperCase() }))} className="bg-slate-900/50 border-slate-700 text-white font-mono" />
                  </div>
                  <div className="space-y-1 md:col-span-2">
                    <Label className="text-slate-300">Industry / Sector</Label>
                    <Input placeholder="e.g. IT Services, Manufacturing, Retail" value={form.industry} onChange={e => setForm(f => ({ ...f, industry: e.target.value }))} className="bg-slate-900/50 border-slate-700 text-white" />
                  </div>
                </div>
                <div className="flex gap-3 mt-5">
                  <Button onClick={handleAddClient} disabled={addClient.isPending} className="bg-blue-600 hover:bg-blue-700 text-white">
                    {addClient.isPending ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <CheckCircle2 className="w-4 h-4 mr-2" />}
                    {addClient.isPending ? "Saving..." : "Add Client"}
                  </Button>
                  <Button variant="outline" onClick={() => setShowForm(false)} className="border-slate-700 text-slate-300">Cancel</Button>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Stats Row */}
      {!isLoading && (clients || []).length > 0 && (
        <div className="flex gap-4 text-sm text-slate-400">
          <span>Total: <strong className="text-white">{(clients || []).length}</strong></span>
          <span>·</span>
          <span>Active: <strong className="text-emerald-400">{(clients || []).filter(c => c.status === 'active').length}</strong></span>
          <span>·</span>
          <span>Pending: <strong className="text-amber-400">{(clients || []).filter(c => c.status === 'pending').length}</strong></span>
        </div>
      )}

      {/* Client List */}
      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {[1, 2, 3, 4].map(i => (
            <div key={i} className="h-28 bg-slate-800/50 rounded-xl animate-pulse" />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <Card className="bg-slate-800/30 border-dashed border-slate-700/50">
          <CardContent className="p-10 text-center">
            <Building2 className="w-10 h-10 text-slate-500 mx-auto mb-3" />
            <p className="text-slate-300 font-medium">
              {search ? "No clients match your search" : "No clients added yet"}
            </p>
            <p className="text-slate-500 text-sm mt-1">
              {search ? "Try a different search term." : "Add your first client to get started."}
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {filtered.map((client, i) => (
            <motion.div
              key={client.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05 }}
            >
              <Card className="bg-slate-800/50 border-gray-700/50 hover:border-gray-600 hover:bg-slate-800 transition-all">
                <CardContent className="p-4">
                  <div className="flex justify-between items-start mb-3">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-lg bg-blue-500/10 border border-blue-500/20 flex items-center justify-center font-bold text-blue-400 text-sm shrink-0">
                        {client.company_name?.[0]?.toUpperCase() || "?"}
                      </div>
                      <div>
                        <h3 className="font-semibold text-white text-sm leading-tight">{client.company_name}</h3>
                        {client.contact_person && (
                          <p className="text-xs text-slate-400 mt-0.5">{client.contact_person}</p>
                        )}
                      </div>
                    </div>
                    <Badge className={`border text-[10px] ${statusStyles[client.status] || statusStyles.active}`}>
                      {(client.status || "active").toUpperCase()}
                    </Badge>
                  </div>
                  <div className="space-y-1">
                    {client.email && (
                      <div className="flex items-center gap-2 text-xs text-slate-400">
                        <Mail className="w-3 h-3 text-slate-500" />
                        {client.email}
                      </div>
                    )}
                    <div className="text-xs text-slate-500">
                      Added: {client.created_at ? new Date(client.created_at).toLocaleDateString("en-IN") : "—"}
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
}

import { createPortal } from "react-dom";
import { motion, AnimatePresence } from "framer-motion";
import { useEffect, useState } from "react";
import { Building2, AlertTriangle, Clock, CheckCircle2, Plus, X, ChevronRight, Input as LucideInput, Shield, Send, Loader } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

const riskColors: Record<string, string> = {
  Low: "bg-green-500/20 text-green-400 border-green-500/30",
  Medium: "bg-yellow-500/20 text-yellow-400 border-yellow-500/30",
  High: "bg-red-500/20 text-red-400 border-red-500/30",
};

const statusColors: Record<string, string> = {
  "Waiting for CA": "text-yellow-400",
  "Waiting for Client": "text-orange-400",
  "Filed": "text-blue-400",
  "Verified": "text-green-400",
};

interface ClientPortfolioSectionProps {
  isRealDashboard?: boolean;
  apiEndpoint?: string;
  governmentApiEnabled?: boolean;
}

const ClientPortfolioSection = ({ 
  isRealDashboard = false, 
  apiEndpoint, 
  governmentApiEnabled = false 
}: ClientPortfolioSectionProps) => {
  const [clients, setClients] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [showOnboardModal, setShowOnboardModal] = useState(false);
  const [isOnboarding, setIsOnboarding] = useState(false);
  const [onboardForm, setOnboardForm] = useState({
    gstin: '',
    pan: '',
    cin: '',
    client_name: '',
    client_email: '',
    client_phone: ''
  });

  const handleOnboardClient = async () => {
    setIsOnboarding(true);
    try {
      const response = await fetch('http://localhost:3001/api/v1/ca/client/onboard-communication', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('auth_token') || 'test-token'}`
        },
        body: JSON.stringify(onboardForm)
      });
      
      const data = await response.json();
      
      if (response.ok) {
        toast.success("Consent Request Sent Securely", {
          description: `Live tracking: Link sent via WhatsApp (${data.provider || 'Twilio Sandbox'}) & Email to ${onboardForm.client_name || "the client"}.`
        });
        if (isRealDashboard && apiEndpoint) {
          loadRealClientData(); // Refresh table
        }
        setShowOnboardModal(false);
        setOnboardForm({ gstin: '', pan: '', cin: '', client_name: '', client_email: '', client_phone: '' });
      } else {
        toast.error("Failed to send consent request", { description: data.error || "Unknown server error" });
      }
    } catch (error) {
      toast.error("API Gateway Disconnected", { description: "Cannot reach Sannidh Backend Server on Port 3001." });
    } finally {
      setIsOnboarding(false);
    }
  };

  useEffect(() => {
    if (isRealDashboard && apiEndpoint) {
      loadRealClientData();
    }
  }, [isRealDashboard, apiEndpoint]);

  const loadRealClientData = async () => {
    setIsLoading(true);
    try {
      const response = await fetch(apiEndpoint!);
      if (response.ok) {
        const result = await response.json();
        const data = result.data || result; // Handle wrapped response
        if (data.clients || Array.isArray(data)) {
          setClients(data.clients || data);
        } else {
          setClients([]);
        }
      } else {
        setClients([]);
      }
    } catch (error) {
      setClients([]);
    } finally {
      setIsLoading(false);
    }
  };
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.1 }}
      className="glass-card p-6 mb-8"
    >
      <div className="mb-4 flex items-start justify-between">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <h2 className="text-xl font-semibold text-foreground">Client Portfolio</h2>
            {isRealDashboard && (
              <div className="flex items-center gap-2 text-xs">
                <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
                <span className="text-green-400">Real Data</span>
                {governmentApiEnabled && (
                  <Badge variant="outline" className="text-xs">Gov API Active</Badge>
                )}
              </div>
            )}
            {!isRealDashboard && (
              <Badge className="bg-purple-500/20 text-purple-400 border-purple-500/50 text-xs">
                Consent-Based
              </Badge>
            )}
          </div>
          <p className="text-sm text-muted-foreground mt-1 max-w-2xl">
            {isRealDashboard 
              ? "Live client portfolio with real-time government API integration and compliance tracking."
              : "These companies are currently under your professional responsibility. Any unresolved item below directly affects the client's compliance standing."
            }
          </p>
        </div>
        <Button 
          className="bg-gradient-to-r from-cyan-600 to-purple-600 hover:from-cyan-700 hover:to-purple-700 flex-shrink-0 ml-4"
          onClick={() => setShowOnboardModal(true)}
        >
          <Plus className="w-4 h-4 mr-1" />
          Add Client
        </Button>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center py-12">
          <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
        </div>
      ) : (
        <div className="rounded-xl border border-border/50 overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="bg-muted/30 hover:bg-muted/30">
              <TableHead className="text-muted-foreground font-semibold">Company</TableHead>
              <TableHead className="text-muted-foreground font-semibold">Industry</TableHead>
              <TableHead className="text-muted-foreground font-semibold">Health</TableHead>
              <TableHead className="text-muted-foreground font-semibold">Risk</TableHead>
              <TableHead className="text-muted-foreground font-semibold">Gaps</TableHead>
              <TableHead className="text-muted-foreground font-semibold">Next Deadline</TableHead>
              <TableHead className="text-muted-foreground font-semibold">Status</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {clients.map((client) => (
              <TableRow 
                key={client.name}
                className="hover:bg-muted/20 transition-colors cursor-pointer"
              >
                <TableCell className="font-medium text-foreground">
                  <div className="flex items-center gap-2">
                    <Building2 className="w-4 h-4 text-primary" />
                    {client.name}
                  </div>
                </TableCell>
                <TableCell className="text-muted-foreground">
                  {client.industry} · {client.jurisdiction}
                </TableCell>
                <TableCell>
                  <div className="flex items-center gap-2">
                    <div className="w-12 h-2 bg-muted rounded-full overflow-hidden">
                      <div 
                        className="h-full bg-primary rounded-full"
                        style={{ width: `${client.health}%` }}
                      />
                    </div>
                    <span className="text-sm text-foreground">{client.health}%</span>
                  </div>
                </TableCell>
                <TableCell>
                  <Badge className={`${riskColors[client.risk]} border`}>
                    {client.risk}
                  </Badge>
                </TableCell>
                <TableCell>
                  <span className="text-foreground font-medium">{client.gaps}</span>
                </TableCell>
                <TableCell className="text-muted-foreground">
                  <div className="flex items-center gap-1">
                    <Clock className="w-3 h-3" />
                    {client.deadline}
                  </div>
                </TableCell>
                <TableCell className={statusColors[client.status]}>
                  {client.status}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
        </div>
      )}

      {/* Onboard Client Modal */}
      {typeof document !== 'undefined' && createPortal(
        <AnimatePresence>
          {showOnboardModal && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/80 backdrop-blur-sm z-[99999] flex items-center justify-center p-4"
              onClick={() => setShowOnboardModal(false)}
            >
              <motion.div
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.9, opacity: 0 }}
                className="bg-card border border-border rounded-2xl p-6 w-full max-w-lg max-h-[90vh] overflow-y-auto custom-scrollbar"
                onClick={(e) => e.stopPropagation()}
              >
                <div className="flex items-center justify-between mb-6">
                  <div>
                    <h3 className="text-xl font-bold">Onboard New Client</h3>
                    <p className="text-sm text-muted-foreground">Consent-based secure data retrieval</p>
                  </div>
                  <Button 
                    variant="ghost" 
                    size="icon"
                    onClick={() => setShowOnboardModal(false)}
                  >
                    <X className="w-5 h-5" />
                  </Button>
                </div>

                {/* Workflow Steps */}
                <div className="flex items-center gap-2 mb-6 text-xs">
                  <div className="flex items-center gap-1 text-cyan-400">
                    <div className="w-6 h-6 rounded-full bg-cyan-500/20 flex items-center justify-center">1</div>
                    <span>Enter Details</span>
                  </div>
                  <ChevronRight className="w-4 h-4 text-muted-foreground" />
                  <div className="flex items-center gap-1 text-muted-foreground">
                    <div className="w-6 h-6 rounded-full bg-muted/20 flex items-center justify-center">2</div>
                    <span>Client Consent</span>
                  </div>
                  <ChevronRight className="w-4 h-4 text-muted-foreground" />
                  <div className="flex items-center gap-1 text-muted-foreground">
                    <div className="w-6 h-6 rounded-full bg-muted/20 flex items-center justify-center">3</div>
                    <span>Data Fetch</span>
                  </div>
                  <ChevronRight className="w-4 h-4 text-muted-foreground" />
                  <div className="flex items-center gap-1 text-muted-foreground">
                    <div className="w-6 h-6 rounded-full bg-muted/20 flex items-center justify-center">4</div>
                    <span>Health Score</span>
                  </div>
                </div>

                <div className="space-y-4">
                  {/* Identifiers */}
                  <div className="p-4 rounded-lg bg-cyan-500/5 border border-cyan-500/20">
                    <h4 className="text-sm font-semibold text-cyan-400 mb-3">Company Identifiers (at least one)</h4>
                    <div className="grid grid-cols-1 gap-3">
                      <div>
                        <label className="text-xs text-muted-foreground mb-1 block">GSTIN</label>
                        <Input
                          placeholder="e.g., 27AABCA1234C1ZS"
                          value={onboardForm.gstin}
                          onChange={(e) => setOnboardForm(prev => ({ ...prev, gstin: e.target.value.toUpperCase() }))}
                          className="bg-card border-border/50"
                        />
                      </div>
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <label className="text-xs text-muted-foreground mb-1 block">PAN</label>
                          <Input
                            placeholder="e.g., AABCA1234C"
                            value={onboardForm.pan}
                            onChange={(e) => setOnboardForm(prev => ({ ...prev, pan: e.target.value.toUpperCase() }))}
                            className="bg-card border-border/50"
                          />
                        </div>
                        <div>
                          <label className="text-xs text-muted-foreground mb-1 block">CIN</label>
                          <Input
                            placeholder="e.g., U74999KA2020PTC..."
                            value={onboardForm.cin}
                            onChange={(e) => setOnboardForm(prev => ({ ...prev, cin: e.target.value.toUpperCase() }))}
                            className="bg-card border-border/50"
                          />
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Client Info */}
                  <div className="p-4 rounded-lg bg-purple-500/5 border border-purple-500/20">
                    <h4 className="text-sm font-semibold text-purple-400 mb-3">Client Contact (for consent notification)</h4>
                    <div className="space-y-3">
                      <div>
                        <label className="text-xs text-muted-foreground mb-1 block">Company Name *</label>
                        <Input
                          placeholder="e.g., Acme Technologies Pvt. Ltd."
                          value={onboardForm.client_name}
                          onChange={(e) => setOnboardForm(prev => ({ ...prev, client_name: e.target.value }))}
                          className="bg-card border-border/50"
                        />
                      </div>
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <label className="text-xs text-muted-foreground mb-1 block">Email</label>
                          <Input
                            placeholder="finance@company.com"
                            type="email"
                            value={onboardForm.client_email}
                            onChange={(e) => setOnboardForm(prev => ({ ...prev, client_email: e.target.value }))}
                            className="bg-card border-border/50"
                          />
                        </div>
                        <div>
                          <label className="text-xs text-muted-foreground mb-1 block">Phone (WhatsApp)</label>
                          <Input
                            placeholder="+91 98765 43210"
                            value={onboardForm.client_phone}
                            onChange={(e) => setOnboardForm(prev => ({ ...prev, client_phone: e.target.value }))}
                            className="bg-card border-border/50"
                          />
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Info Box */}
                  <div className="p-3 rounded-lg bg-blue-500/10 border border-blue-500/20 text-xs text-blue-300">
                    <p className="flex items-start gap-2">
                      <Shield className="w-4 h-4 mt-0.5 flex-shrink-0" />
                      <span>
                        A secure consent link will be sent via WhatsApp & Email. 
                        Data will only be fetched after client authorization.
                      </span>
                    </p>
                  </div>

                  {/* Action Buttons */}
                  <div className="flex gap-3 pt-2">
                    <Button 
                      variant="outline" 
                      className="flex-1"
                      onClick={() => setShowOnboardModal(false)}
                    >
                      Cancel
                    </Button>
                    <Button 
                      className="flex-1 bg-gradient-to-r from-cyan-600 to-purple-600 hover:from-cyan-700 hover:to-purple-700 text-white border-0"
                      onClick={handleOnboardClient}
                      disabled={isOnboarding}
                    >
                      {isOnboarding ? (
                        <>
                          <Loader className="w-4 h-4 mr-2 animate-spin" />
                          Sending...
                        </>
                      ) : (
                        <>
                          <Send className="w-4 h-4 mr-2" />
                          Send Consent Request
                        </>
                      )}
                    </Button>
                  </div>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>,
        document.body
      )}
    </motion.div>
  );
};

export default ClientPortfolioSection;

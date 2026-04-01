import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import RegulonAIAgent from "@/components/ai-agent/RegulonAIAgent";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import {
  Bot,
  Building,
  Clock,
  AlertTriangle,
  TrendingUp,
  FileText,
  Users,
  Check,
  MessageSquare,
  BarChart3,
  Plus,
  Search,
  Download,
  DollarSign,
  CreditCard,
  RefreshCw,
  Loader,
} from "lucide-react";
import { toast } from "sonner";
import useCAMetrics from "@/hooks/useCAMetrics";
import { addCompany as addCompanyAPI } from "@/services/api";

const ExternalCADashboardReal = () => {
  const navigate = useNavigate();
  const { metrics, loading, refetch } = useCAMetrics();

  // Role-based access control
  useEffect(() => {
    const userRole = localStorage.getItem("current_user_role");
    if (userRole !== "external_ca") {
      navigate("/dashboard");
      return;
    }
  }, [navigate]);

  const [stats, setStats] = useState([
    { id: "companies", label: "Assigned Companies", value: "0", icon: Building, color: "text-cyan-400" },
    { id: "tasks", label: "Pending Tasks", value: "0", icon: FileText, color: "text-yellow-400" },
    { id: "due", label: "Due in 7 Days", value: "0", icon: Clock, color: "text-orange-400" },
    { id: "alerts", label: "High-Risk Alerts", value: "0", icon: AlertTriangle, color: "text-red-400" },
    { id: "revenue", label: "Revenue This Month", value: "₹0", icon: DollarSign, color: "text-green-400" },
    { id: "plan", label: "Plan Limit", value: "0/10", icon: CreditCard, color: "text-primary" },
  ]);

  const [companies, setCompanies] = useState<any[]>([]);
  const [newCompanyPan, setNewCompanyPan] = useState("");
  const [isAddingCompany, setIsAddingCompany] = useState(false);
  const [draftText, setDraftText] = useState("");

  // Update stats when metrics change
  useEffect(() => {
    if (metrics) {
      setStats((prevStats) =>
        prevStats.map((stat) => {
          switch (stat.id) {
            case "companies":
              return { ...stat, value: String(metrics.assigned_companies) };
            case "tasks":
              return { ...stat, value: String(metrics.active_tasks) };
            case "due":
              return { ...stat, value: String(metrics.pending_filings_week) };
            case "alerts":
              return { ...stat, value: String(metrics.high_risk_alerts) };
            case "revenue":
              return {
                ...stat,
                value: `₹${(metrics.monthly_revenue / 100000).toFixed(1)}L`,
              };
            case "plan":
              return {
                ...stat,
                value: `${metrics.assigned_companies}/${10}`,
              };
            default:
              return stat;
          }
        })
      );
    }
  }, [metrics]);

  const addCompany = async () => {
    if (!newCompanyPan.trim()) {
      toast.error("Enter valid PAN/CIN");
      return;
    }

    setIsAddingCompany(true);
    try {
      const result = await addCompanyAPI({
        pan: newCompanyPan.toUpperCase(),
        name: newCompanyPan,
        industry: "Not Specified",
      });

      if (result.success) {
        toast.success("Company added. Waiting for owner approval...");
        setNewCompanyPan("");
        // Refetch metrics after adding company
        await refetch();
      } else {
        toast.error(result.error || "Failed to add company");
      }
    } catch (error) {
      console.error("Error adding company:", error);
      toast.error("Failed to add company. Please try again.");
    } finally {
      setIsAddingCompany(false);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      
      <main className="pt-24 pb-16">
        <div className="container mx-auto px-4 max-w-7xl">
          {/* Header */}
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-12"
          >
            <h1 className="text-4xl font-bold text-foreground">External CA Dashboard</h1>
            <p className="text-muted-foreground mt-2">Manage all assigned companies and compliance tasks from one control center.</p>
          </motion.div>

          {/* Control Tower - Metrics */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-16 space-y-6"
          >
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-2xl font-bold text-foreground">Control Tower</h2>
                <p className="text-sm text-muted-foreground mt-1">Real-time metrics and status overview</p>
              </div>
              <Button
                size="sm"
                variant="outline"
                className="gap-2"
                onClick={refetch}
                disabled={loading}
              >
                <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
                {loading ? "Refreshing..." : "Refresh"}
              </Button>
            </div>

            {loading && stats.every((s) => s.value === "0" || s.value === "0/10") ? (
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
                {stats.map((stat) => (
                  <Card key={stat.id} className="glass-card border-border/50 bg-cyan-500/5 border-cyan-500/20">
                    <CardContent className="p-4">
                      <div className="flex items-center gap-3">
                        <div className={`p-2 rounded-lg bg-card/50 ${stat.color}`}>
                          <Loader className="w-5 h-5 animate-spin" />
                        </div>
                        <div>
                          <p className="text-2xl font-bold text-muted-foreground">--</p>
                          <p className="text-xs text-muted-foreground">{stat.label}</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : (
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
                {stats.map((stat, index) => {
                  const Icon = stat.icon;
                  return (
                    <motion.div
                      key={stat.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.05 }}
                    >
                      <Card className="glass-card border-border/50 hover:border-primary/30 transition-colors bg-cyan-500/5 border-cyan-500/20">
                        <CardContent className="p-4">
                          <div className="flex items-center gap-3">
                            <div className={`p-2 rounded-lg bg-card/50 ${stat.color}`}>
                              <Icon className="w-5 h-5" />
                            </div>
                            <div>
                              <p className="text-2xl font-bold text-foreground">{stat.value}</p>
                              <p className="text-xs text-muted-foreground">{stat.label}</p>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    </motion.div>
                  );
                })}
              </div>
            )}
          </motion.div>

          {/* Regulon AI Executive Agent - AUTONOMOUS SYSTEM */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.05 }}
            className="mb-16"
          >
            <RegulonAIAgent />
          </motion.div>

          {/* AI Drafting Engine */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="mb-16 space-y-6"
          >
            <div>
              <h2 className="text-2xl font-bold text-cyan-400 flex items-center mb-4">
                <FileText className="w-6 h-6 mr-2" />
                AI Drafting Engine
              </h2>
              <p className="text-sm text-muted-foreground">Generate legal documents and rebuttals automatically</p>
            </div>
            <Card className="glass-card border-border/50">
              <CardContent className="p-6 space-y-4">
                <div className="space-y-2">
                  <label className="text-sm text-muted-foreground">Upload Notice/Document (PDF)</label>
                  <Input type="file" accept=".pdf" className="bg-card border-border/50" />
                </div>
                <div className="space-y-2">
                  <label className="text-sm text-muted-foreground">AI-Generated Draft</label>
                  <Textarea
                    placeholder="AI will draft legal rebuttal here based on uploaded document..."
                    value={draftText}
                    readOnly
                    className="bg-card border-border/50 text-muted-foreground h-32"
                  />
                </div>
                <Button className="w-full bg-cyan-600 hover:bg-cyan-700">Generate Draft</Button>
              </CardContent>
            </Card>
          </motion.div>

          {/* Client Portfolio */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.15 }}
            className="mb-16 space-y-6"
          >
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-2xl font-bold text-cyan-400 flex items-center mb-1">
                  <Users className="w-6 h-6 mr-2" />
                  Client Portfolio
                </h2>
                <p className="text-sm text-muted-foreground">Manage and monitor all assigned companies</p>
              </div>
              <Button className="bg-cyan-600 hover:bg-cyan-700">
                <Plus className="w-4 h-4 mr-1" />
                Add Company
              </Button>
            </div>
            <Card className="glass-card border-border/50">
              <CardContent className="p-6 space-y-4">
                <div className="flex gap-2 mb-4">
                  <Input
                    placeholder="Enter PAN/CIN..."
                    value={newCompanyPan}
                    onChange={(e) => setNewCompanyPan(e.target.value)}
                    className="bg-card border-border/50"
                    disabled={isAddingCompany}
                  />
                  <Button
                    onClick={addCompany}
                    className="bg-green-600 hover:bg-green-700"
                    disabled={isAddingCompany}
                  >
                    {isAddingCompany ? (
                      <>
                        <Loader className="w-4 h-4 mr-1 animate-spin" />
                        Adding...
                      </>
                    ) : (
                      "Add"
                    )}
                  </Button>
                </div>
                
                {companies.length === 0 ? (
                  <div className="text-center py-12 text-muted-foreground">
                    <Building className="w-16 h-16 mx-auto mb-4 opacity-30" />
                    <p className="text-lg font-medium">No companies added yet</p>
                    <p className="text-sm">Add your first client to get started</p>
                  </div>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow className="border-border/50">
                        <TableHead>Company Name</TableHead>
                        <TableHead>Health Score</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Last Filing</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {companies.map((company, idx) => (
                        <TableRow key={idx} className="border-border/50">
                          <TableCell>{company.name}</TableCell>
                          <TableCell>{company.health}%</TableCell>
                          <TableCell><Badge>{company.status}</Badge></TableCell>
                          <TableCell>{company.lastFiling}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}
              </CardContent>
            </Card>
          </motion.div>

          {/* Task & Filing Management */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="mb-16 space-y-6"
          >
            <div>
              <h2 className="text-2xl font-bold text-cyan-400 flex items-center mb-4">
                <Clock className="w-6 h-6 mr-2" />
                Task & Filing Management
              </h2>
              <p className="text-sm text-muted-foreground">Track and manage compliance filing deadlines</p>
            </div>
            <Card className="glass-card border-border/50">
              <CardContent className="p-6">
                <div className="text-center py-16 text-muted-foreground">
                  <Clock className="w-16 h-16 mx-auto mb-4 opacity-30" />
                  <p className="text-lg font-medium">Data will appear here</p>
                  <p className="text-sm">Once you add companies, tasks will be synced automatically</p>
                </div>
              </CardContent>
            </Card>
          </motion.div>

          {/* Document Tracker */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.25 }}
            className="mb-16 space-y-6"
          >
            <div>
              <h2 className="text-2xl font-bold text-cyan-400 flex items-center mb-4">
                <Search className="w-6 h-6 mr-2" />
                Document Tracker
              </h2>
              <p className="text-sm text-muted-foreground">Track document submission status from clients</p>
            </div>
            <Card className="glass-card border-border/50">
              <CardContent className="p-6">
                <div className="text-center py-16 text-muted-foreground">
                  <Search className="w-16 h-16 mx-auto mb-4 opacity-30" />
                  <p className="text-lg font-medium">Data will appear here</p>
                  <p className="text-sm">Once you add companies, documents will be tracked automatically</p>
                </div>
              </CardContent>
            </Card>
          </motion.div>

          {/* Regulatory News */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="mb-16 space-y-6"
          >
            <div>
              <h2 className="text-2xl font-bold text-cyan-400 flex items-center mb-4">
                <AlertTriangle className="w-6 h-6 mr-2" />
                Regulatory News & Rule Impact
              </h2>
              <p className="text-sm text-muted-foreground">Latest compliance updates and regulatory changes</p>
            </div>
            <Card className="glass-card border-border/50">
              <CardContent className="p-6">
                <div className="text-center py-16 text-muted-foreground">
                  <AlertTriangle className="w-16 h-16 mx-auto mb-4 opacity-30" />
                  <p className="text-lg font-medium">Data will appear here</p>
                  <p className="text-sm">Regulatory news will be populated from government sources</p>
                </div>
              </CardContent>
            </Card>
          </motion.div>

          {/* Compliance Health Log */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.35 }}
            className="mb-16 space-y-6"
          >
            <div>
              <h2 className="text-2xl font-bold text-cyan-400 flex items-center mb-4">
                <TrendingUp className="w-6 h-6 mr-2" />
                Compliance Health Change Log
              </h2>
              <p className="text-sm text-muted-foreground">Historical tracking of compliance score changes</p>
            </div>
            <Card className="glass-card border-border/50">
              <CardContent className="p-6">
                <div className="text-center py-16 text-muted-foreground">
                  <TrendingUp className="w-16 h-16 mx-auto mb-4 opacity-30" />
                  <p className="text-lg font-medium">Data will appear here</p>
                  <p className="text-sm">Health changes will be logged automatically</p>
                </div>
              </CardContent>
            </Card>
          </motion.div>

          {/* Audit Support */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="mb-16 space-y-6"
          >
            <div>
              <h2 className="text-2xl font-bold text-cyan-400 flex items-center mb-4">
                <Check className="w-6 h-6 mr-2" />
                Audit, Inspection & Due Diligence Support
              </h2>
              <p className="text-sm text-muted-foreground">Support for government audits and inspections</p>
            </div>
            <Card className="glass-card border-border/50">
              <CardContent className="p-6">
                <div className="text-center py-16 text-muted-foreground">
                  <Check className="w-16 h-16 mx-auto mb-4 opacity-30" />
                  <p className="text-lg font-medium">Data will appear here</p>
                  <p className="text-sm">Audit records will be populated as they occur</p>
                </div>
              </CardContent>
            </Card>
          </motion.div>

          {/* Communication & Logs */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.45 }}
            className="mb-16 space-y-6"
          >
            <div>
              <h2 className="text-2xl font-bold text-cyan-400 flex items-center mb-4">
                <MessageSquare className="w-6 h-6 mr-2" />
                Communication & Logs
              </h2>
              <p className="text-sm text-muted-foreground">All client communications and system logs</p>
            </div>
            <Card className="glass-card border-border/50">
              <CardContent className="p-6">
                <div className="text-center py-16 text-muted-foreground">
                  <MessageSquare className="w-16 h-16 mx-auto mb-4 opacity-30" />
                  <p className="text-lg font-medium">Data will appear here</p>
                  <p className="text-sm">Communications will be logged automatically</p>
                </div>
              </CardContent>
            </Card>
          </motion.div>

          {/* CA Analytics & Performance */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
            className="mb-16 space-y-6"
          >
            <div>
              <h2 className="text-2xl font-bold text-cyan-400 flex items-center mb-4">
                <BarChart3 className="w-6 h-6 mr-2" />
                CA Analytics & Performance
              </h2>
              <p className="text-sm text-muted-foreground">Your performance metrics and analytics dashboard</p>
            </div>
            <Card className="glass-card border-border/50">
              <CardContent className="p-6">
                <div className="text-center py-16 text-muted-foreground">
                  <BarChart3 className="w-16 h-16 mx-auto mb-4 opacity-30" />
                  <p className="text-lg font-medium">Data will appear here</p>
                  <p className="text-sm">Analytics will be calculated as data is collected</p>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </div>
      </main>
      
      <Footer />
    </div>
  );
};

export default ExternalCADashboardReal;

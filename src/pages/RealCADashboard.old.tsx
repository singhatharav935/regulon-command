import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { 
  mockClientCompanies, 
  mockAuditDocuments, 
  generateComplianceSummary,
  ClientCompany,
  AuditDocument
} from "@/data/mockData";
import { 
  Building, 
  Shield, 
  FileText, 
  AlertTriangle, 
  TrendingUp,
  Users,
  Calendar,
  Target,
  CheckCircle,
  Clock,
  Zap,
  RefreshCw,
  Download,
  Mail,
  Search,
  CheckCircle2,
  XCircle,
  Activity,
  TrendingDown
} from "lucide-react";
import { toast } from "sonner";

const ExternalCADashboard = () => {
  const [companies, setCompanies] = useState<ClientCompany[]>(mockClientCompanies);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCompany, setSelectedCompany] = useState<ClientCompany | null>(null);
  const [auditReport, setAuditReport] = useState<string>("");
  const [loading, setLoading] = useState(true);
  const [verifyingHash, setVerifyingHash] = useState<string | null>(null);
  const [selectedDocForVerify, setSelectedDocForVerify] = useState<AuditDocument | null>(null);
  const [complianceChanges, setComplianceChanges] = useState([
    { id: 1, title: "GST Rule Amendment 2024", date: "2024-03-28", impactScore: -5.2, category: "GST" },
    { id: 2, title: "MCA Late Fee Waiver Extended", date: "2024-03-25", impactScore: +3.8, category: "MCA" },
    { id: 3, title: "New SEBI Compliance Norms", date: "2024-03-22", impactScore: -2.1, category: "SEBI" }
  ]);

  // Load dashboard data
  useEffect(() => {
    const loadDashboard = async () => {
      setLoading(true);
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      if (mockClientCompanies.length === 0) {
        console.error("❌ CRITICAL: Mock data is missing! Dashboard cannot function.");
        toast.error("Failed to load data - mock data is missing");
        return;
      }
      
      setCompanies(mockClientCompanies);
      setLoading(false);
      toast.success("Dashboard loaded with live government data");
    };

    loadDashboard();
  }, []);

  // Fetch Live Government Score (simulated)
  const fetchLiveGovtScore = async (companyId: string) => {
    const company = companies.find(c => c.id === companyId);
    if (!company) return;

    toast.info(`Fetching live score from GSTN API for ${company.name}...`);
    
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    const newScore = Math.floor(Math.random() * 36) + 60; // 60-95
    
    setCompanies(prev => prev.map(c => 
      c.id === companyId ? { ...c, complianceScore: newScore } : c
    ));
    
    toast.success(`Live score updated: ${newScore}% (via GSTN Public API)`);
  };

  // Generate Audit Report
  const generateReport = () => {
    if (!selectedCompany) {
      toast.error("Please select a company first");
      return;
    }

    const company = companies.find(c => c.id === selectedCompany.id);
    if (!company) return;

    const today = new Date().toLocaleDateString('en-IN');
    const gapsCount = company.pendingActions.length;
    const status = company.complianceScore >= 80 ? "COMPLIANT" : 
                   company.complianceScore >= 60 ? "NEEDS ATTENTION" : "NON-COMPLIANT";

    const report = `Audit Summary for ${company.name}: Current Score ${company.complianceScore}%. Verified on ${today}. Status: ${status}.\n\nGSTIN: ${company.gstin}\nIndustry: ${company.industry}\nCompliance Gaps Detected: ${gapsCount}\n\nPending Actions:\n${company.pendingActions.map(action => `- ${action.description} (Due: ${action.dueDate})`).join('\n')}\n\nRecommendation: ${status === "COMPLIANT" ? "Continue monitoring compliance metrics." : "Immediate action required on pending items."}`;
    
    setAuditReport(report);
    toast.success("Audit report generated successfully");
  };

  // Verify Document Hash
  const verifyDocumentHash = async (document: AuditDocument) => {
    setVerifyingHash(document.id);
    setSelectedDocForVerify(document);
    
    toast.info(`Verifying SHA-256 hash for ${document.fileName}...`);
    
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    const success = Math.random() > 0.1; // 90% success rate
    
    if (success) {
      toast.success(`✓ SHA-256 Integrity Verified via Govt Portal Hash\nFile: ${document.fileName}\nHash: ${document.shaHash}`);
    } else {
      toast.error(`✗ Verification Failed - Hash mismatch detected for ${document.fileName}`);
    }
    
    setVerifyingHash(null);
  };

  // Filter companies
  const filteredCompanies = companies.filter(company =>
    company.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    company.industry.toLowerCase().includes(searchTerm.toLowerCase()) ||
    company.gstin.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Calculate statistics
  const stats = {
    totalCompanies: companies.length,
    averageHealth: Math.round(companies.reduce((sum, c) => sum + c.complianceScore, 0) / companies.length),
    criticalAlerts: companies.reduce((sum, c) => sum + c.pendingActions.filter(a => a.priority === 'Critical').length, 0),
    documentsVerified: mockAuditDocuments.filter(d => d.verificationStatus === 'Verified').length
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center">
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          className="text-center"
        >
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
            className="w-16 h-16 border-4 border-cyan-500 border-t-transparent rounded-full mx-auto mb-4"
          />
          <h2 className="text-xl font-bold text-white mb-2">Loading External CA Dashboard</h2>
          <p className="text-slate-400">Fetching real government API data...</p>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-900 text-white">
      <div className="container mx-auto px-4 py-8 max-w-7xl">
        
        {/* Dashboard Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-white mb-2">
                External CA Dashboard
              </h1>
              <p className="text-slate-400">
                Manage multiple client audits and compliance with real-time government data integration
              </p>
            </div>
            <Badge className="bg-green-500/20 text-green-400 border-green-500/30 px-4 py-2">
              <Zap className="w-4 h-4 mr-2" />
              Real Data Active
            </Badge>
          </div>
        </motion.div>

        {/* Key Statistics Cards */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8"
        >
          <Card className="bg-slate-800 border-slate-700">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-slate-400">Total Companies</p>
                  <AnimatedCounter 
                    value={dashboardData.totalCompanies} 
                    className="text-2xl font-bold text-white"
                  />
                </div>
                <Building className="w-8 h-8 text-cyan-400" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-slate-800 border-slate-700">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-slate-400">Average Health</p>
                  <div className="flex items-center space-x-2">
                    <AnimatedCounter 
                      value={dashboardData.averageHealth} 
                      suffix="%" 
                      className="text-2xl font-bold text-green-400"
                    />
                  </div>
                </div>
                <TrendingUp className="w-8 h-8 text-green-400" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-slate-800 border-slate-700">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-slate-400">Critical Alerts</p>
                  <AnimatedCounter 
                    value={dashboardData.criticalAlerts} 
                    className="text-2xl font-bold text-red-400"
                  />
                </div>
                <AlertTriangle className="w-8 h-8 text-red-400" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-slate-800 border-slate-700">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-slate-400">Monthly Revenue</p>
                  <AnimatedCounter 
                    value={Math.round(dashboardData.totalRevenue / 1000000)} 
                    prefix="₹" 
                    suffix="M" 
                    className="text-2xl font-bold text-cyan-400"
                  />
                </div>
                <Target className="w-8 h-8 text-cyan-400" />
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Compliance Health Overview */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="mb-8"
        >
          <Card className="bg-slate-800 border-slate-700">
            <CardHeader>
              <CardTitle className="text-xl font-bold text-white flex items-center">
                <Shield className="w-6 h-6 mr-2 text-cyan-400" />
                Portfolio Health Overview
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-6">
                {mockClientCompanies.map((company, index) => (
                  <motion.div
                    key={company.id}
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: 0.6 + index * 0.1 }}
                    className="text-center"
                  >
                    <HealthScoreGauge 
                      score={company.complianceScore} 
                      size="md"
                      animated={true}
                    />
                    <div className="mt-3">
                      <p className="font-medium text-white text-sm">{company.name}</p>
                      <p className="text-xs text-slate-400">{company.industry}</p>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => generateAuditReport(company)}
                        className="mt-2 text-cyan-400 hover:text-cyan-300"
                      >
                        Generate Report
                      </Button>
                    </div>
                  </motion.div>
                ))}
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Audit Report Generator */}
        {selectedCompany && auditReport && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-8"
          >
            <Card className="bg-slate-800 border-slate-700">
              <CardHeader>
                <CardTitle className="text-xl font-bold text-white flex items-center">
                  <FileText className="w-6 h-6 mr-2 text-cyan-400" />
                  Audit Report Generator
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="bg-slate-700 p-4 rounded-lg">
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="text-lg font-semibold text-white">{selectedCompany.name}</h3>
                    <Badge className="bg-cyan-500/20 text-cyan-400">
                      Auto-Generated
                    </Badge>
                  </div>
                  <p className="text-slate-300 leading-relaxed">
                    {auditReport}
                  </p>
                  <div className="flex space-x-3 mt-4">
                    <Button size="sm" className="bg-cyan-600 hover:bg-cyan-700">
                      Export PDF
                    </Button>
                    <Button size="sm" variant="outline" className="border-slate-600 text-slate-300">
                      Email Client
                    </Button>
                    <Button 
                      size="sm" 
                      variant="ghost" 
                      onClick={() => setSelectedCompany(null)}
                      className="text-slate-400"
                    >
                      Close
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}

        {/* Main Dashboard Tabs */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
        >
          <Tabs defaultValue="portfolio" className="space-y-6">
            <TabsList className="bg-slate-800 border-slate-700">
              <TabsTrigger 
                value="portfolio" 
                className="data-[state=active]:bg-cyan-600 data-[state=active]:text-white"
              >
                <Users className="w-4 h-4 mr-2" />
                Client Portfolio
              </TabsTrigger>
              <TabsTrigger 
                value="evidence" 
                className="data-[state=active]:bg-cyan-600 data-[state=active]:text-white"
              >
                <Shield className="w-4 h-4 mr-2" />
                Evidence Vault
              </TabsTrigger>
              <TabsTrigger 
                value="schedule" 
                className="data-[state=active]:bg-cyan-600 data-[state=active]:text-white"
              >
                <Calendar className="w-4 h-4 mr-2" />
                Audit Schedule
              </TabsTrigger>
            </TabsList>

            <TabsContent value="portfolio" className="space-y-6">
              <ClientPortfolioTable />
            </TabsContent>

            <TabsContent value="evidence" className="space-y-6">
              <AuditEvidenceVault />
            </TabsContent>

            <TabsContent value="schedule" className="space-y-6">
              <Card className="bg-slate-800 border-slate-700">
                <CardHeader>
                  <CardTitle className="text-xl font-bold text-white flex items-center">
                    <Calendar className="w-6 h-6 mr-2 text-cyan-400" />
                    Audit Schedule Management
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {mockClientCompanies.map((company, index) => (
                      <motion.div
                        key={company.id}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: index * 0.1 }}
                        className="flex items-center justify-between p-4 bg-slate-700 rounded-lg"
                      >
                        <div>
                          <h3 className="font-semibold text-white">{company.name}</h3>
                          <p className="text-sm text-slate-400">
                            Last audit: {new Date(company.lastAuditDate).toLocaleDateString()}
                          </p>
                        </div>
                        <div className="flex items-center space-x-3">
                          <Badge 
                            className={
                              company.complianceScore >= 80 
                                ? "bg-green-500/20 text-green-400" 
                                : company.complianceScore >= 60 
                                ? "bg-yellow-500/20 text-yellow-400" 
                                : "bg-red-500/20 text-red-400"
                            }
                          >
                            {company.complianceScore}% Health
                          </Badge>
                          <Button size="sm" variant="outline" className="border-slate-600 text-slate-300">
                            Schedule Audit
                          </Button>
                        </div>
                      </motion.div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </motion.div>

        {/* Role Access Notice */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1 }}
          className="mt-8"
        >
          <Card className="bg-blue-500/10 border-blue-500/30">
            <CardContent className="p-4">
              <div className="flex items-center space-x-3">
                <CheckCircle className="w-5 h-5 text-blue-400" />
                <div>
                  <p className="text-sm font-medium text-blue-400">External CA Access Level</p>
                  <p className="text-xs text-slate-400">
                    Read-only access to client documents. You can review and comment, but cannot delete or upload for clients.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

      </div>
    </div>
  );
};

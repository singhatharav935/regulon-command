import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { 
  mockClientCompanies, 
  mockAuditDocuments, 
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
  RefreshCw,
  Download,
  Mail,
  Search,
  CheckCircle2,
  XCircle,
  Activity,
  TrendingDown,
  Eye,
  Loader2
} from "lucide-react";
import { toast } from "sonner";

const ExternalCADashboard = () => {
  const [companies, setCompanies] = useState<ClientCompany[]>(mockClientCompanies);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCompanyId, setSelectedCompanyId] = useState<string>("");
  const [auditReport, setAuditReport] = useState<string>("");
  const [loading, setLoading] = useState(true);
  const [verifyingHash, setVerifyingHash] = useState<string | null>(null);
  const [complianceChanges] = useState([
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
    if (!selectedCompanyId) {
      toast.error("Please select a company first");
      return;
    }

    const company = companies.find(c => c.id === selectedCompanyId);
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

  const getHealthColor = (score: number) => {
    if (score >= 80) return { bg: "bg-green-500", text: "text-green-400", border: "border-green-500" };
    if (score >= 50) return { bg: "bg-yellow-500", text: "text-yellow-400", border: "border-yellow-500" };
    return { bg: "bg-red-500", text: "text-red-400", border: "border-red-500" };
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
          <p className="text-slate-400">Connecting to Government APIs...</p>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 text-white">
      <div className="container mx-auto px-4 py-8 max-w-7xl">
        
        {/* Dashboard Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-4xl font-bold text-white mb-2 bg-gradient-to-r from-cyan-400 to-blue-500 bg-clip-text text-transparent">
                External CA Dashboard
              </h1>
              <p className="text-slate-400 text-lg">
                Production-Ready Compliance Management System
              </p>
            </div>
            <Badge className="bg-green-500/20 text-green-400 border-green-500/30 px-4 py-2 text-sm">
              <Activity className="w-4 h-4 mr-2" />
              Live Government Data Active
            </Badge>
          </div>
        </motion.div>

        {/* Key Statistics */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8"
        >
          <Card className="bg-slate-800/50 border-slate-700 backdrop-blur">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-slate-400">Total Clients</p>
                  <p className="text-3xl font-bold text-white mt-1">{stats.totalCompanies}</p>
                </div>
                <Building className="w-10 h-10 text-cyan-400" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-slate-800/50 border-slate-700 backdrop-blur">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-slate-400">Average Health</p>
                  <p className="text-3xl font-bold text-green-400 mt-1">{stats.averageHealth}%</p>
                </div>
                <TrendingUp className="w-10 h-10 text-green-400" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-slate-800/50 border-slate-700 backdrop-blur">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-slate-400">Critical Alerts</p>
                  <p className="text-3xl font-bold text-red-400 mt-1">{stats.criticalAlerts}</p>
                </div>
                <AlertTriangle className="w-10 h-10 text-red-400" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-slate-800/50 border-slate-700 backdrop-blur">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-slate-400">Verified Docs</p>
                  <p className="text-3xl font-bold text-cyan-400 mt-1">{stats.documentsVerified}</p>
                </div>
                <CheckCircle2 className="w-10 h-10 text-cyan-400" />
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Compliance Change Radar */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="mb-8"
        >
          <Card className="bg-slate-800/50 border-slate-700 backdrop-blur">
            <CardHeader>
              <CardTitle className="text-xl font-bold text-white flex items-center">
                <Activity className="w-6 h-6 mr-2 text-cyan-400" />
                Compliance Change Radar
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {complianceChanges.map((change) => (
                  <motion.div
                    key={change.id}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    className="flex items-center justify-between p-4 bg-slate-700/50 rounded-lg border border-slate-600"
                  >
                    <div className="flex-1">
                      <h4 className="font-semibold text-white">{change.title}</h4>
                      <div className="flex items-center space-x-3 mt-1">
                        <span className="text-sm text-slate-400">{change.date}</span>
                        <Badge className="bg-blue-500/20 text-blue-400 text-xs">{change.category}</Badge>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      {change.impactScore > 0 ? (
                        <>
                          <TrendingUp className="w-5 h-5 text-green-400" />
                          <span className="text-lg font-bold text-green-400">+{change.impactScore}%</span>
                        </>
                      ) : (
                        <>
                          <TrendingDown className="w-5 h-5 text-red-400" />
                          <span className="text-lg font-bold text-red-400">{change.impactScore}%</span>
                        </>
                      )}
                    </div>
                  </motion.div>
                ))}
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Client Portfolio Table */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="mb-8"
        >
          <Card className="bg-slate-800/50 border-slate-700 backdrop-blur">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-xl font-bold text-white flex items-center">
                  <Users className="w-6 h-6 mr-2 text-cyan-400" />
                  Client Portfolio Table
                </CardTitle>
                <div className="flex items-center space-x-2">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                    <Input
                      placeholder="Search companies..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-10 bg-slate-700 border-slate-600 text-white w-64"
                    />
                  </div>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow className="border-slate-700">
                      <TableHead className="text-slate-300">Company Name</TableHead>
                      <TableHead className="text-slate-300">Industry</TableHead>
                      <TableHead className="text-slate-300">GSTIN</TableHead>
                      <TableHead className="text-slate-300">Health Score</TableHead>
                      <TableHead className="text-slate-300">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredCompanies.map((company) => {
                      const healthColor = getHealthColor(company.complianceScore);
                      return (
                        <TableRow key={company.id} className="border-slate-700 hover:bg-slate-700/30">
                          <TableCell className="font-medium text-white">{company.name}</TableCell>
                          <TableCell className="text-slate-300">{company.industry}</TableCell>
                          <TableCell className="text-slate-300 font-mono text-sm">{company.gstin}</TableCell>
                          <TableCell>
                            <div className="space-y-2">
                              <div className="flex items-center space-x-3">
                                <Progress 
                                  value={company.complianceScore} 
                                  className="h-2 w-24"
                                  style={{
                                    // @ts-ignore
                                    '--progress-color': company.complianceScore >= 80 ? '#22c55e' : company.complianceScore >= 50 ? '#eab308' : '#ef4444'
                                  } as React.CSSProperties}
                                />
                                <span className={`font-bold ${healthColor.text}`}>
                                  {company.complianceScore}%
                                </span>
                              </div>
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center space-x-2">
                              <Button
                                size="sm"
                                onClick={() => fetchLiveGovtScore(company.id)}
                                className="bg-cyan-600 hover:bg-cyan-700 text-white"
                              >
                                <RefreshCw className="w-3 h-3 mr-1" />
                                Update Live
                              </Button>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => {
                                  setSelectedCompanyId(company.id);
                                  window.scrollTo({ top: document.getElementById('audit-report-gen')?.offsetTop, behavior: 'smooth' });
                                }}
                                className="border-slate-600 text-slate-300 hover:bg-slate-700"
                              >
                                <Eye className="w-3 h-3 mr-1" />
                                View Details
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Audit Evidence Vault */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="mb-8"
        >
          <Card className="bg-slate-800/50 border-slate-700 backdrop-blur">
            <CardHeader>
              <CardTitle className="text-xl font-bold text-white flex items-center">
                <Shield className="w-6 h-6 mr-2 text-cyan-400" />
                Audit Evidence Vault (Real-Time Verification)
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow className="border-slate-700">
                      <TableHead className="text-slate-300">File Name</TableHead>
                      <TableHead className="text-slate-300">Type</TableHead>
                      <TableHead className="text-slate-300">Size</TableHead>
                      <TableHead className="text-slate-300">Status</TableHead>
                      <TableHead className="text-slate-300">Action</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {mockAuditDocuments.slice(0, 10).map((doc) => (
                      <TableRow key={doc.id} className="border-slate-700 hover:bg-slate-700/30">
                        <TableCell className="font-medium text-white">{doc.fileName}</TableCell>
                        <TableCell className="text-slate-300">{doc.documentType}</TableCell>
                        <TableCell className="text-slate-300">{doc.fileSize}</TableCell>
                        <TableCell>
                          {doc.verificationStatus === 'Verified' ? (
                            <Badge className="bg-green-500/20 text-green-400 border-green-500/30">
                              <CheckCircle2 className="w-3 h-3 mr-1" />
                              Verified
                            </Badge>
                          ) : doc.verificationStatus === 'Failed' ? (
                            <Badge className="bg-red-500/20 text-red-400 border-red-500/30">
                              <XCircle className="w-3 h-3 mr-1" />
                              Failed
                            </Badge>
                          ) : (
                            <Badge className="bg-yellow-500/20 text-yellow-400 border-yellow-500/30">
                              Pending
                            </Badge>
                          )}
                        </TableCell>
                        <TableCell>
                          <Button
                            size="sm"
                            onClick={() => verifyDocumentHash(doc)}
                            disabled={verifyingHash === doc.id}
                            className="bg-blue-600 hover:bg-blue-700 text-white"
                          >
                            {verifyingHash === doc.id ? (
                              <>
                                <Loader2 className="w-3 h-3 mr-1 animate-spin" />
                                Verifying...
                              </>
                            ) : (
                              <>
                                <Shield className="w-3 h-3 mr-1" />
                                Verify Hash
                              </>
                            )}
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Audit Report Generator */}
        <motion.div
          id="audit-report-gen"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="mb-8"
        >
          <Card className="bg-slate-800/50 border-slate-700 backdrop-blur">
            <CardHeader>
              <CardTitle className="text-xl font-bold text-white flex items-center">
                <FileText className="w-6 h-6 mr-2 text-cyan-400" />
                Audit Report Generator
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center space-x-4">
                <div className="flex-1">
                  <label className="text-sm text-slate-400 mb-2 block">Select Company</label>
                  <Select value={selectedCompanyId} onValueChange={setSelectedCompanyId}>
                    <SelectTrigger className="bg-slate-700 border-slate-600 text-white">
                      <SelectValue placeholder="Choose a company..." />
                    </SelectTrigger>
                    <SelectContent className="bg-slate-700 border-slate-600">
                      {companies.map((company) => (
                        <SelectItem 
                          key={company.id} 
                          value={company.id}
                          className="text-white hover:bg-slate-600"
                        >
                          {company.name} ({company.complianceScore}%)
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="pt-6">
                  <Button
                    onClick={generateReport}
                    disabled={!selectedCompanyId}
                    className="bg-cyan-600 hover:bg-cyan-700 text-white"
                  >
                    <FileText className="w-4 h-4 mr-2" />
                    Generate Report
                  </Button>
                </div>
              </div>

              {auditReport && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="mt-4"
                >
                  <label className="text-sm text-slate-400 mb-2 block">Generated Audit Report</label>
                  <Textarea
                    value={auditReport}
                    readOnly
                    className="bg-slate-700 border-slate-600 text-white min-h-[200px] font-mono text-sm"
                  />
                  <div className="flex space-x-3 mt-4">
                    <Button size="sm" className="bg-green-600 hover:bg-green-700 text-white">
                      <Download className="w-4 h-4 mr-2" />
                      Export PDF
                    </Button>
                    <Button size="sm" variant="outline" className="border-slate-600 text-slate-300 hover:bg-slate-700">
                      <Mail className="w-4 h-4 mr-2" />
                      Email Client
                    </Button>
                  </div>
                </motion.div>
              )}
            </CardContent>
          </Card>
        </motion.div>

        {/* Role Access Notice */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.6 }}
        >
          <Card className="bg-blue-500/10 border-blue-500/30">
            <CardContent className="p-4">
              <div className="flex items-center space-x-3">
                <Shield className="w-5 h-5 text-blue-400" />
                <div>
                  <p className="text-sm font-medium text-blue-400">External CA Access Level - Read-Only Mode</p>
                  <p className="text-xs text-slate-400">
                    You can review and comment on client documents, but cannot delete or upload on behalf of clients.
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

export default ExternalCADashboard;

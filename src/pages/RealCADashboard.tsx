import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ClientPortfolioTable } from "@/components/external-ca/ClientPortfolioTable";
import { AuditEvidenceVault } from "@/components/external-ca/AuditEvidenceVault";
import { HealthScoreGauge, AnimatedCounter } from "@/components/ui/health-score-gauge";
import { 
  mockClientCompanies, 
  mockAuditDocuments, 
  generateComplianceSummary,
  ClientCompany
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
  Zap
} from "lucide-react";
import { toast } from "sonner";

export const ExternalCADashboard = () => {
  const [dashboardData, setDashboardData] = useState({
    totalCompanies: 0,
    averageHealth: 0,
    criticalAlerts: 0,
    pendingAudits: 0,
    documentsVerified: 0,
    totalRevenue: 0
  });
  const [selectedCompany, setSelectedCompany] = useState<ClientCompany | null>(null);
  const [auditReport, setAuditReport] = useState<string>("");
  const [loading, setLoading] = useState(true);

  // Load dashboard statistics
  useEffect(() => {
    const loadDashboardData = async () => {
      setLoading(true);
      
      // Simulate API loading delay
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      // Calculate real statistics from mock data
      const totalCompanies = mockClientCompanies.length;
      const averageHealth = Math.round(
        mockClientCompanies.reduce((sum, company) => sum + company.complianceScore, 0) / totalCompanies
      );
      const criticalAlerts = mockClientCompanies.reduce(
        (sum, company) => sum + company.pendingActions.filter(action => action.priority === 'Critical').length, 0
      );
      const pendingAudits = mockClientCompanies.filter(
        company => company.auditHistory.some(audit => audit.status === 'In Progress')
      ).length;
      const documentsVerified = mockAuditDocuments.filter(doc => doc.verificationStatus === 'Verified').length;
      const totalRevenue = mockClientCompanies.reduce((sum, company) => sum + company.monthlyTurnover, 0);
      
      setDashboardData({
        totalCompanies,
        averageHealth,
        criticalAlerts,
        pendingAudits,
        documentsVerified,
        totalRevenue
      });
      
      setLoading(false);
      toast.success("Dashboard data loaded successfully");
    };

    loadDashboardData();
  }, []);

  // Generate audit report for selected company
  const generateAuditReport = (company: ClientCompany) => {
    setSelectedCompany(company);
    const report = generateComplianceSummary(company);
    setAuditReport(report);
    toast.success(`Audit report generated for ${company.name}`);
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

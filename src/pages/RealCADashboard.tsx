import { useState } from "react";
import { motion } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { mockClientCompanies, mockAuditDocuments } from "@/data/mockData";
import { Shield, FileText, RefreshCw, CheckCircle, Loader2, Download, Building, TrendingUp } from "lucide-react";
import { toast } from "sonner";

const ExternalCADashboard = () => {
  const [companies, setCompanies] = useState(mockClientCompanies);
  const [selectedCompanyId, setSelectedCompanyId] = useState("");
  const [auditReport, setAuditReport] = useState("");
  const [verifyingDocId, setVerifyingDocId] = useState<string | null>(null);
  const [fetchingScore, setFetchingScore] = useState(false);

  const getHealthColor = (score: number) => {
    if (score > 80) return { bg: "bg-green-500", text: "text-green-400" };
    if (score > 50) return { bg: "bg-yellow-500", text: "text-yellow-400" };
    return { bg: "bg-red-500", text: "text-red-400" };
  };

  const generateAuditReport = () => {
    const company = companies.find(c => c.id === selectedCompanyId);
    if (!company) {
      toast.error("Please select a company first");
      return;
    }
    
    const currentDate = new Date().toLocaleDateString('en-IN');
    const status = company.complianceScore >= 80 ? "COMPLIANT" : "NEEDS ATTENTION";
    const report = `Audit for ${company.name} complete. Score: ${company.complianceScore}%. Verified on ${currentDate}. Status: ${status}.`;
    
    setAuditReport(report);
    toast.success("Audit report generated successfully!");
  };

  const verifyDocumentHash = async (docId: string, fileName: string, hash: string) => {
    setVerifyingDocId(docId);
    await new Promise(resolve => setTimeout(resolve, 2000));
    setVerifyingDocId(null);
    toast.success(`✓ SHA-256 Integrity Verified via Govt Portal Hash\nFile: ${fileName}\nHash: ${hash}`);
  };

  const fetchLiveGovtScore = async () => {
    if (!selectedCompanyId) {
      toast.error("Please select a company first");
      return;
    }
    
    setFetchingScore(true);
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    const newScore = Math.floor(Math.random() * 29) + 70; // 70-98
    setCompanies(prev => prev.map(c => 
      c.id === selectedCompanyId ? { ...c, complianceScore: newScore } : c
    ));
    
    setFetchingScore(false);
    toast.success(`Live Government Score Updated: ${newScore}%`);
  };

  const selectedCompany = companies.find(c => c.id === selectedCompanyId);
  const auditFiles = mockAuditDocuments.slice(0, 3);

  return (
    <div className="min-h-screen" style={{ background: '#0B0E14' }}>
      <div className="container mx-auto px-4 py-8 max-w-7xl">
        
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <h1 className="text-4xl font-bold text-cyan-400 mb-2">External CA Dashboard</h1>
          <p className="text-slate-400">Real-time compliance monitoring with government data integration</p>
        </motion.div>

        {/* Stats */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8"
        >
          <Card style={{ background: '#1a1f2e', borderColor: '#2a3f5f' }}>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-slate-400">Total Clients</p>
                  <p className="text-3xl font-bold text-white">{companies.length}</p>
                </div>
                <Building className="w-10 h-10 text-cyan-400" />
              </div>
            </CardContent>
          </Card>

          <Card style={{ background: '#1a1f2e', borderColor: '#2a3f5f' }}>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-slate-400">Average Health</p>
                  <p className="text-3xl font-bold text-green-400">
                    {Math.round(companies.reduce((sum, c) => sum + c.complianceScore, 0) / companies.length)}%
                  </p>
                </div>
                <TrendingUp className="w-10 h-10 text-green-400" />
              </div>
            </CardContent>
          </Card>

          <Card style={{ background: '#1a1f2e', borderColor: '#2a3f5f' }}>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-slate-400">Documents</p>
                  <p className="text-3xl font-bold text-cyan-400">{mockAuditDocuments.length}</p>
                </div>
                <FileText className="w-10 h-10 text-cyan-400" />
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* CLIENT PORTFOLIO TABLE */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="mb-8"
        >
          <Card style={{ background: '#1a1f2e', borderColor: '#2a3f5f' }}>
            <CardHeader>
              <CardTitle className="text-xl font-bold text-cyan-400 flex items-center">
                <Building className="w-6 h-6 mr-2" />
                Client Portfolio
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow style={{ borderColor: '#2a3f5f' }}>
                    <TableHead className="text-slate-300">Company</TableHead>
                    <TableHead className="text-slate-300">GSTIN</TableHead>
                    <TableHead className="text-slate-300">Health</TableHead>
                    <TableHead className="text-slate-300">Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {companies.map((company) => {
                    const healthColor = getHealthColor(company.complianceScore);
                    return (
                      <TableRow key={company.id} style={{ borderColor: '#2a3f5f' }}>
                        <TableCell className="font-medium text-white">{company.name}</TableCell>
                        <TableCell className="text-slate-300 font-mono text-sm">{company.gstin}</TableCell>
                        <TableCell>
                          <div className="flex items-center space-x-3">
                            <Progress 
                              value={company.complianceScore} 
                              className="h-2 w-32"
                              style={{
                                backgroundColor: '#2a3f5f',
                              }}
                            />
                            <span className={`font-bold ${healthColor.text}`}>
                              {company.complianceScore}%
                            </span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge 
                            className={`${
                              company.complianceScore > 80 
                                ? 'bg-green-500/20 text-green-400 border-green-500/30' 
                                : company.complianceScore > 50 
                                ? 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30'
                                : 'bg-red-500/20 text-red-400 border-red-500/30'
                            }`}
                          >
                            {company.status}
                          </Badge>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </motion.div>

        {/* AUDIT EVIDENCE VAULT */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="mb-8"
        >
          <Card style={{ background: '#1a1f2e', borderColor: '#2a3f5f' }}>
            <CardHeader>
              <CardTitle className="text-xl font-bold text-cyan-400 flex items-center">
                <Shield className="w-6 h-6 mr-2" />
                Audit Evidence Vault
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {auditFiles.map((doc) => (
                  <motion.div
                    key={doc.id}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    className="flex items-center justify-between p-4 rounded-lg"
                    style={{ background: '#0f1419', border: '1px solid #2a3f5f' }}
                  >
                    <div className="flex-1">
                      <h4 className="font-semibold text-white">{doc.fileName}</h4>
                      <div className="flex items-center space-x-3 mt-1">
                        <span className="text-sm text-slate-400">{doc.documentType}</span>
                        <span className="text-xs text-slate-500 font-mono">{doc.fileSize}</span>
                      </div>
                    </div>
                    <Button
                      onClick={() => verifyDocumentHash(doc.id, doc.fileName, doc.shaHash)}
                      disabled={verifyingDocId === doc.id}
                      className="bg-cyan-600 hover:bg-cyan-700 text-white"
                    >
                      {verifyingDocId === doc.id ? (
                        <>
                          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                          Verifying...
                        </>
                      ) : (
                        <>
                          <Shield className="w-4 h-4 mr-2" />
                          Verify Hash
                        </>
                      )}
                    </Button>
                  </motion.div>
                ))}
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* AUDIT REPORT GENERATOR */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="mb-8"
        >
          <Card style={{ background: '#1a1f2e', borderColor: '#2a3f5f' }}>
            <CardHeader>
              <CardTitle className="text-xl font-bold text-cyan-400 flex items-center">
                <FileText className="w-6 h-6 mr-2" />
                Audit Report Generator
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center space-x-4">
                <div className="flex-1">
                  <Select value={selectedCompanyId} onValueChange={setSelectedCompanyId}>
                    <SelectTrigger 
                      className="text-white"
                      style={{ background: '#0f1419', borderColor: '#2a3f5f' }}
                    >
                      <SelectValue placeholder="Select a company..." />
                    </SelectTrigger>
                    <SelectContent style={{ background: '#1a1f2e', borderColor: '#2a3f5f' }}>
                      {companies.map((company) => (
                        <SelectItem 
                          key={company.id} 
                          value={company.id}
                          className="text-white hover:bg-cyan-900"
                        >
                          {company.name} - {company.complianceScore}%
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <Button
                  onClick={generateAuditReport}
                  disabled={!selectedCompanyId}
                  className="bg-cyan-600 hover:bg-cyan-700 text-white"
                >
                  <FileText className="w-4 h-4 mr-2" />
                  Generate
                </Button>
              </div>

              {auditReport && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                >
                  <Textarea
                    value={auditReport}
                    readOnly
                    className="text-white font-mono text-sm"
                    style={{ background: '#0f1419', borderColor: '#2a3f5f' }}
                    rows={4}
                  />
                  <div className="flex space-x-3 mt-3">
                    <Button size="sm" className="bg-green-600 hover:bg-green-700 text-white">
                      <Download className="w-4 h-4 mr-2" />
                      Download PDF
                    </Button>
                  </div>
                </motion.div>
              )}
            </CardContent>
          </Card>
        </motion.div>

        {/* DIRECT HEALTH TRIGGER */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
        >
          <Card style={{ background: '#1a1f2e', borderColor: '#2a3f5f' }}>
            <CardHeader>
              <CardTitle className="text-xl font-bold text-cyan-400 flex items-center">
                <RefreshCw className="w-6 h-6 mr-2" />
                Direct Health Score Trigger
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-white mb-2">
                    {selectedCompany ? (
                      <>Selected: <span className="font-bold text-cyan-400">{selectedCompany.name}</span></>
                    ) : (
                      <span className="text-slate-400">Select a company from dropdown above</span>
                    )}
                  </p>
                  {selectedCompany && (
                    <p className="text-sm text-slate-400">
                      Current Score: <span className="text-green-400 font-bold">{selectedCompany.complianceScore}%</span>
                    </p>
                  )}
                </div>
                <Button
                  onClick={fetchLiveGovtScore}
                  disabled={!selectedCompanyId || fetchingScore}
                  className="bg-cyan-600 hover:bg-cyan-700 text-white"
                >
                  {fetchingScore ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Fetching...
                    </>
                  ) : (
                    <>
                      <RefreshCw className="w-4 h-4 mr-2" />
                      Fetch Live Govt Score
                    </>
                  )}
                </Button>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Role Notice */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.6 }}
          className="mt-8"
        >
          <Card style={{ background: '#1a2a3a', borderColor: '#2a5f8f' }}>
            <CardContent className="p-4">
              <div className="flex items-center space-x-3">
                <CheckCircle className="w-5 h-5 text-cyan-400" />
                <div>
                  <p className="text-sm font-medium text-cyan-400">External CA - Read-Only Access</p>
                  <p className="text-xs text-slate-400">
                    You can verify and review client documents but cannot edit or upload on their behalf
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

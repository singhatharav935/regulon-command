import { useState } from "react";
import { motion } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
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
} from "lucide-react";
import { toast } from "sonner";

const ExternalCADashboardReal = () => {
  const [assignedCompanies, setAssignedCompanies] = useState(0);
  const [pendingTasks, setPendingTasks] = useState(0);
  const [duesIn7Days, setDuesIn7Days] = useState(0);
  const [highRiskAlerts, setHighRiskAlerts] = useState(0);
  const [revenueThisMonth, setRevenueThisMonth] = useState(0);
  const [planLimit, setPlanLimit] = useState(0);
  
  const [companies, setCompanies] = useState<any[]>([]);
  const [newCompanyPan, setNewCompanyPan] = useState("");
  const [aiChatInput, setAiChatInput] = useState("");
  const [aiMessages, setAiMessages] = useState<any[]>([]);
  const [draftText, setDraftText] = useState("");

  const addCompany = () => {
    if (!newCompanyPan.trim()) {
      toast.error("Enter valid PAN/CIN");
      return;
    }
    // Simulated backend call to create company with PENDING_APPROVAL status
    toast.info(`Company added. Awaiting owner approval...`);
    setNewCompanyPan("");
    setAssignedCompanies(prev => prev + 1);
  };

  const handleAiQuery = () => {
    if (!aiChatInput.trim()) return;
    
    // Simulated AI response
    const userMsg = { role: "user", content: aiChatInput };
    const aiResponse = {
      role: "assistant",
      content: `[AI Partner Response] Based on your query about "${aiChatInput}", I would need to access the real database. This would execute SQL queries to fetch live data.`,
    };
    
    setAiMessages([...aiMessages, userMsg, aiResponse]);
    setAiChatInput("");
  };

  return (
    <div className="min-h-screen bg-slate-950 text-white p-6">
      <div className="max-w-7xl mx-auto space-y-8">
        
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <h1 className="text-4xl font-bold text-cyan-400 mb-2">External CA Dashboard</h1>
          <p className="text-slate-400">Real-time compliance management with live data integration</p>
        </motion.div>

        {/* STEP 1: Regulon AI Partner */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <Card className="bg-slate-800 border-slate-700">
            <CardHeader>
              <CardTitle className="text-xl text-cyan-400 flex items-center">
                <Bot className="w-6 h-6 mr-2" />
                Regulon AI Partner
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="bg-slate-700 p-4 rounded-lg max-h-64 overflow-y-auto space-y-3 mb-4">
                  {aiMessages.length === 0 ? (
                    <p className="text-slate-400 text-sm">Chat with AI Partner. Ask about pending filings, client status, or request document drafts.</p>
                  ) : (
                    aiMessages.map((msg, idx) => (
                      <div key={idx} className={`p-3 rounded ${msg.role === 'user' ? 'bg-cyan-600/20 ml-8' : 'bg-slate-600/50'}`}>
                        <p className="text-xs text-slate-300 font-semibold mb-1">
                          {msg.role === 'user' ? 'You' : 'AI Partner'}
                        </p>
                        <p className="text-sm">{msg.content}</p>
                      </div>
                    ))
                  )}
                </div>
                <div className="flex gap-2">
                  <Input
                    placeholder="Ask AI: 'Show pending filings', 'Draft email to client', etc..."
                    value={aiChatInput}
                    onChange={(e) => setAiChatInput(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && handleAiQuery()}
                    className="bg-slate-700 border-slate-600 text-white"
                  />
                  <Button onClick={handleAiQuery} className="bg-cyan-600 hover:bg-cyan-700">
                    Send
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* STEP 2: CA Control Tower */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <Card className="bg-slate-800 border-slate-700">
            <CardHeader>
              <CardTitle className="text-xl text-cyan-400 flex items-center">
                <Building className="w-6 h-6 mr-2" />
                CA Control Tower
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-4">
                <div className="bg-slate-700 p-4 rounded-lg">
                  <p className="text-xs text-slate-400 mb-1">Assigned Companies</p>
                  <p className="text-2xl font-bold text-cyan-400">{assignedCompanies}</p>
                </div>
                <div className="bg-slate-700 p-4 rounded-lg">
                  <p className="text-xs text-slate-400 mb-1">Pending Tasks</p>
                  <p className="text-2xl font-bold text-yellow-400">{pendingTasks}</p>
                </div>
                <div className="bg-slate-700 p-4 rounded-lg">
                  <p className="text-xs text-slate-400 mb-1">Dues in 7 Days</p>
                  <p className="text-2xl font-bold text-orange-400">{duesIn7Days}</p>
                </div>
                <div className="bg-slate-700 p-4 rounded-lg">
                  <p className="text-xs text-slate-400 mb-1">High Risk Alerts</p>
                  <p className="text-2xl font-bold text-red-400">{highRiskAlerts}</p>
                </div>
                <div className="bg-slate-700 p-4 rounded-lg">
                  <p className="text-xs text-slate-400 mb-1">Revenue This Month</p>
                  <p className="text-2xl font-bold text-green-400">₹{revenueThisMonth}</p>
                </div>
                <div className="bg-slate-700 p-4 rounded-lg">
                  <p className="text-xs text-slate-400 mb-1">Plan Limit</p>
                  <p className="text-2xl font-bold text-slate-300">{planLimit}%</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* STEP 3: AI Drafting Engine */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
          <Card className="bg-slate-800 border-slate-700">
            <CardHeader>
              <CardTitle className="text-xl text-cyan-400 flex items-center">
                <FileText className="w-6 h-6 mr-2" />
                AI Drafting Engine
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <label className="text-sm text-slate-300">Upload Notice/Document (PDF)</label>
                <Input type="file" accept=".pdf" className="bg-slate-700 border-slate-600" />
              </div>
              <div className="space-y-2">
                <label className="text-sm text-slate-300">AI-Generated Draft</label>
                <Textarea
                  placeholder="AI will draft legal rebuttal here based on uploaded document..."
                  value={draftText}
                  readOnly
                  className="bg-slate-700 border-slate-600 text-slate-300 h-32"
                />
              </div>
              <Button className="w-full bg-cyan-600 hover:bg-cyan-700">Generate Draft</Button>
            </CardContent>
          </Card>
        </motion.div>

        {/* Main Tabs Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
        >
          <Tabs defaultValue="portfolio" className="space-y-4">
            <TabsList className="bg-slate-800 border-slate-700 grid w-full grid-cols-5">
              <TabsTrigger value="portfolio" className="data-[state=active]:bg-cyan-600">STEP 4: Portfolio</TabsTrigger>
              <TabsTrigger value="filing" className="data-[state=active]:bg-cyan-600">STEP 5: Filing</TabsTrigger>
              <TabsTrigger value="tracker" className="data-[state=active]:bg-cyan-600">STEP 6: Tracker</TabsTrigger>
              <TabsTrigger value="rules" className="data-[state=active]:bg-cyan-600">STEP 7: Rules</TabsTrigger>
              <TabsTrigger value="logs" className="data-[state=active]:bg-cyan-600">STEP 8: Logs</TabsTrigger>
            </TabsList>

            {/* STEP 4: Client Portfolio */}
            <TabsContent value="portfolio">
              <Card className="bg-slate-800 border-slate-700">
                <CardHeader className="flex flex-row items-center justify-between">
                  <CardTitle className="text-cyan-400 flex items-center">
                    <Users className="w-5 h-5 mr-2" />
                    Client Portfolio
                  </CardTitle>
                  <Button onClick={() => setAssignedCompanies(prev => prev + 1)} size="sm" className="bg-cyan-600">
                    <Plus className="w-4 h-4 mr-1" />
                    Add Company
                  </Button>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex gap-2 mb-4">
                    <Input
                      placeholder="Enter PAN/CIN..."
                      value={newCompanyPan}
                      onChange={(e) => setNewCompanyPan(e.target.value)}
                      className="bg-slate-700 border-slate-600"
                    />
                    <Button onClick={addCompany} className="bg-green-600 hover:bg-green-700">Add</Button>
                  </div>
                  
                  {companies.length === 0 ? (
                    <div className="text-center py-8 text-slate-400">
                      <Building className="w-12 h-12 mx-auto mb-2 opacity-50" />
                      <p>No companies added yet. Add your first client to get started.</p>
                    </div>
                  ) : (
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Company Name</TableHead>
                          <TableHead>Health Score</TableHead>
                          <TableHead>Status</TableHead>
                          <TableHead>Last Filing</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {companies.map((company, idx) => (
                          <TableRow key={idx}>
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
            </TabsContent>

            {/* STEP 5: Task & Filing Management */}
            <TabsContent value="filing">
              <Card className="bg-slate-800 border-slate-700">
                <CardHeader>
                  <CardTitle className="text-cyan-400 flex items-center">
                    <Clock className="w-5 h-5 mr-2" />
                    Task & Filing Management
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-center py-8 text-slate-400">
                    <Clock className="w-12 h-12 mx-auto mb-2 opacity-50" />
                    <p>Compliance calendar and filing status will appear when companies are added.</p>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* STEP 6: Client Dependency Tracker */}
            <TabsContent value="tracker">
              <Card className="bg-slate-800 border-slate-700">
                <CardHeader>
                  <CardTitle className="text-cyan-400 flex items-center">
                    <Search className="w-5 h-5 mr-2" />
                    Document Dependency Tracker
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-center py-8 text-slate-400">
                    <Search className="w-12 h-12 mx-auto mb-2 opacity-50" />
                    <p>No pending document requests. Request documents from clients here.</p>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* STEP 7: Upcoming Law & Rule Impact */}
            <TabsContent value="rules">
              <Card className="bg-slate-800 border-slate-700">
                <CardHeader>
                  <CardTitle className="text-cyan-400 flex items-center">
                    <AlertTriangle className="w-5 h-5 mr-2" />
                    Upcoming Laws & Regulatory Changes
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-center py-8 text-slate-400">
                    <AlertTriangle className="w-12 h-12 mx-auto mb-2 opacity-50" />
                    <p>Regulatory news filtered by client industries will appear here.</p>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* STEP 8: Compliance Health Change Log */}
            <TabsContent value="logs">
              <Card className="bg-slate-800 border-slate-700">
                <CardHeader>
                  <CardTitle className="text-cyan-400 flex items-center">
                    <TrendingUp className="w-5 h-5 mr-2" />
                    Compliance Health Change Log
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-center py-8 text-slate-400">
                    <TrendingUp className="w-12 h-12 mx-auto mb-2 opacity-50" />
                    <p>Historical compliance health scores will be tracked here.</p>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </motion.div>

        {/* Additional Tabs */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
        >
          <Tabs defaultValue="audit" className="space-y-4">
            <TabsList className="bg-slate-800 border-slate-700 grid w-full grid-cols-3">
              <TabsTrigger value="audit" className="data-[state=active]:bg-cyan-600">STEP 9: Audit</TabsTrigger>
              <TabsTrigger value="comm" className="data-[state=active]:bg-cyan-600">STEP 10: Communication</TabsTrigger>
              <TabsTrigger value="analytics" className="data-[state=active]:bg-cyan-600">STEP 11: Analytics</TabsTrigger>
            </TabsList>

            {/* STEP 9: Audit Support */}
            <TabsContent value="audit">
              <Card className="bg-slate-800 border-slate-700">
                <CardHeader>
                  <CardTitle className="text-cyan-400">Audit, Inspection & Due Diligence Support</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-center py-8 text-slate-400">
                    <FileText className="w-12 h-12 mx-auto mb-2 opacity-50" />
                    <p>Audit management and support documents will appear here.</p>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* STEP 10: Communication */}
            <TabsContent value="comm">
              <Card className="bg-slate-800 border-slate-700">
                <CardHeader>
                  <CardTitle className="text-cyan-400 flex items-center">
                    <MessageSquare className="w-5 h-5 mr-2" />
                    Communication & Logs
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-center py-8 text-slate-400">
                    <MessageSquare className="w-12 h-12 mx-auto mb-2 opacity-50" />
                    <p>CA-Client communication center and activity logs.</p>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* STEP 11: Analytics */}
            <TabsContent value="analytics">
              <Card className="bg-slate-800 border-slate-700">
                <CardHeader>
                  <CardTitle className="text-cyan-400 flex items-center">
                    <BarChart3 className="w-5 h-5 mr-2" />
                    CA Analytics & Performance
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-center py-8 text-slate-400">
                    <BarChart3 className="w-12 h-12 mx-auto mb-2 opacity-50" />
                    <p>Performance metrics and analytics dashboard for CA.</p>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </motion.div>

      </div>
    </div>
  );
};

export default ExternalCADashboardReal;

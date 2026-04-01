import { useState } from "react";
import { motion } from "framer-motion";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import DashboardTypeNav from "@/components/dashboard/DashboardTypeNav";
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
} from "lucide-react";
import { toast } from "sonner";

const ExternalCADashboardReal = () => {
  const [stats] = useState([
    { label: "Assigned Companies", value: "0", icon: Building, color: "text-cyan-400" },
    { label: "Pending Tasks", value: "0", icon: FileText, color: "text-yellow-400" },
    { label: "Due in 7 Days", value: "0", icon: Clock, color: "text-orange-400" },
    { label: "High-Risk Alerts", value: "0", icon: AlertTriangle, color: "text-red-400" },
    { label: "Revenue This Month", value: "₹0", icon: DollarSign, color: "text-green-400" },
    { label: "Plan Limit", value: "0/10", icon: CreditCard, color: "text-primary" },
  ]);

  const [companies, setCompanies] = useState<any[]>([]);
  const [newCompanyPan, setNewCompanyPan] = useState("");
  const [aiChatInput, setAiChatInput] = useState("");
  const [aiMessages, setAiMessages] = useState<any[]>([]);
  const [draftText, setDraftText] = useState("");
  const [activeSection, setActiveSection] = useState("control-tower");

  const addCompany = () => {
    if (!newCompanyPan.trim()) {
      toast.error("Enter valid PAN/CIN");
      return;
    }
    toast.info(`Company added. Awaiting owner approval...`);
    setNewCompanyPan("");
  };

  const handleAiQuery = () => {
    if (!aiChatInput.trim()) return;
    
    const userMsg = { role: "user", content: aiChatInput };
    const aiResponse = {
      role: "assistant",
      content: `Based on your query about "${aiChatInput}", I would analyze your compliance data and provide insights. This AI Partner will connect to real government APIs for live data.`,
    };
    
    setAiMessages([...aiMessages, userMsg, aiResponse]);
    setAiChatInput("");
  };

  const sections = [
    { id: "control-tower", label: "Control Tower", icon: BarChart3 },
    { id: "ai-partner", label: "AI Partner", icon: Bot },
    { id: "drafting-engine", label: "AI Drafting Engine", icon: FileText },
    { id: "client-portfolio", label: "Client Portfolio", icon: Users },
    { id: "task-filing", label: "Task & Filing Management", icon: Clock },
    { id: "document-tracker", label: "Document Tracker", icon: Search },
    { id: "regulatory-news", label: "Regulatory News", icon: AlertTriangle },
    { id: "health-log", label: "Compliance Health Log", icon: TrendingUp },
    { id: "audit-support", label: "Audit Support", icon: Check },
    { id: "communication", label: "Communication & Logs", icon: MessageSquare },
    { id: "analytics", label: "CA Analytics", icon: BarChart3 },
  ];

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      
      <main className="pt-24 pb-16">
        <div className="container mx-auto px-4 max-w-7xl">
          <DashboardTypeNav activeType="ca" />
          
          {/* Demo Banner */}
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-6 p-4 rounded-xl bg-cyan-500/10 border border-cyan-500/20 text-center"
          >
            <p className="text-sm text-cyan-400">
              <strong>External CA Professional Dashboard</strong> — Manage all assigned companies and compliance tasks from one control center.
            </p>
          </motion.div>

          {/* Control Tower - Metrics */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-8"
          >
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="text-2xl font-bold text-foreground">Control Tower</h2>
                <p className="text-sm text-muted-foreground mt-1">
                  Real-time metrics and status overview
                </p>
              </div>
              <Button size="sm" variant="outline" className="gap-2">
                <RefreshCw className="w-4 h-4" />
                Refresh
              </Button>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
              {stats.map((stat, index) => {
                const Icon = stat.icon;
                return (
                  <motion.div
                    key={stat.label}
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
          </motion.div>

          {/* Regulon AI Partner */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="mb-8"
          >
            <Card className="glass-card border-border/50">
              <CardHeader>
                <CardTitle className="text-xl text-cyan-400 flex items-center">
                  <Bot className="w-6 h-6 mr-2" />
                  Regulon AI Partner
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="bg-card/50 p-4 rounded-lg max-h-64 overflow-y-auto space-y-3 mb-4 border border-border/50">
                    {aiMessages.length === 0 ? (
                      <p className="text-muted-foreground text-sm">Chat with AI Partner. Ask about pending filings, client status, or request document drafts.</p>
                    ) : (
                      aiMessages.map((msg, idx) => (
                        <div key={idx} className={`p-3 rounded ${msg.role === 'user' ? 'bg-cyan-600/20 ml-8' : 'bg-slate-600/20'}`}>
                          <p className="text-xs text-muted-foreground font-semibold mb-1">
                            {msg.role === 'user' ? 'You' : 'AI Partner'}
                          </p>
                          <p className="text-sm text-foreground">{msg.content}</p>
                        </div>
                      ))
                    )}
                  </div>
                  <div className="flex gap-2">
                    <Input
                      placeholder="Ask AI: 'Show pending filings', 'Draft email to client'..."
                      value={aiChatInput}
                      onChange={(e) => setAiChatInput(e.target.value)}
                      onKeyPress={(e) => e.key === 'Enter' && handleAiQuery()}
                      className="bg-card border-border/50"
                    />
                    <Button onClick={handleAiQuery} className="bg-cyan-600 hover:bg-cyan-700">
                      Send
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>

          {/* AI Drafting Engine */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.15 }}
            className="mb-8"
          >
            <Card className="glass-card border-border/50">
              <CardHeader>
                <CardTitle className="text-xl text-cyan-400 flex items-center">
                  <FileText className="w-6 h-6 mr-2" />
                  AI Drafting Engine
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
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

          {/* Section Navigation */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="mb-8"
          >
            <div className="flex flex-wrap gap-2 mb-6">
              {sections.slice(3).map((section) => {
                const Icon = section.icon;
                return (
                  <Button
                    key={section.id}
                    onClick={() => setActiveSection(section.id)}
                    variant={activeSection === section.id ? "default" : "outline"}
                    size="sm"
                    className={activeSection === section.id ? "bg-cyan-600 hover:bg-cyan-700" : ""}
                  >
                    <Icon className="w-4 h-4 mr-2" />
                    {section.label}
                  </Button>
                );
              })}
            </div>

            {/* Client Portfolio Section */}
            {activeSection === "client-portfolio" && (
              <Card className="glass-card border-border/50">
                <CardHeader>
                  <CardTitle className="text-cyan-400 flex items-center justify-between">
                    <div className="flex items-center">
                      <Users className="w-5 h-5 mr-2" />
                      Client Portfolio
                    </div>
                    <Button size="sm" className="bg-cyan-600 hover:bg-cyan-700">
                      <Plus className="w-4 h-4 mr-1" />
                      Add Company
                    </Button>
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex gap-2 mb-4">
                    <Input
                      placeholder="Enter PAN/CIN..."
                      value={newCompanyPan}
                      onChange={(e) => setNewCompanyPan(e.target.value)}
                      className="bg-card border-border/50"
                    />
                    <Button onClick={addCompany} className="bg-green-600 hover:bg-green-700">Add</Button>
                  </div>
                  
                  {companies.length === 0 ? (
                    <div className="text-center py-8 text-muted-foreground">
                      <Building className="w-12 h-12 mx-auto mb-2 opacity-50" />
                      <p>No companies added yet. Add your first client to get started.</p>
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
            )}

            {/* Other Sections - Empty States */}
            {(activeSection === "task-filing" || activeSection === "document-tracker" || activeSection === "regulatory-news" || activeSection === "health-log" || activeSection === "audit-support" || activeSection === "communication" || activeSection === "analytics") && (
              <Card className="glass-card border-border/50">
                <CardHeader>
                  <CardTitle className="text-cyan-400">
                    {sections.find(s => s.id === activeSection)?.label}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-center py-12 text-muted-foreground">
                    <Clock className="w-12 h-12 mx-auto mb-2 opacity-50" />
                    <p>Coming soon. This section will populate when you add companies and real data is synced.</p>
                  </div>
                </CardContent>
              </Card>
            )}
          </motion.div>
        </div>
      </main>
      
      <Footer />
    </div>
  );
};

export default ExternalCADashboardReal;

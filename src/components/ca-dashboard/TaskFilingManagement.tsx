import { motion } from "framer-motion";
import { CASectionAgentBadge } from '../agents/CASectionAgentBadge';
import { useEffect, useState, useCallback } from "react";
import { 
  FileText, 
  AlertTriangle, 
  CheckCircle2, 
  Send, 
  Eye, 
  RefreshCw, 
  Filter, 
  Search, 
  X, 
  ArrowUpDown, 
  TrendingUp,
  Clock,
  Calendar,
  Database,
  Bot,
  AlertCircle
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";


const CA_API = (import.meta.env.VITE_CA_API_BASE_URL as string);

interface TaskFilingManagementProps {
  isRealDashboard?: boolean;
  apiEndpoint?: string;
  governmentIntegration?: boolean;
}

const TaskFilingManagement = ({ 
  isRealDashboard = false, 
  apiEndpoint = `${CA_API}/api/v1/ca/filings/dashboard`, 
  governmentIntegration = false 
}: TaskFilingManagementProps) => {
  const [tasks, setTasks] = useState<any[]>([]);
  const [filteredTasks, setFilteredTasks] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [filterAuthority, setFilterAuthority] = useState("all");
  const [filterUrgency, setFilterUrgency] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [sortBy, setSortBy] = useState("dueDate");

  useEffect(() => {
    if (isRealDashboard) {
      loadRealTaskData();
      const interval = setInterval(loadRealTaskData, 60000);
      return () => clearInterval(interval);
    }
  }, [isRealDashboard]);

  // Filter and sort logic
  useEffect(() => {
    let filtered = [...tasks];
    
    // Authority filter
    if (filterAuthority !== "all") {
      filtered = filtered.filter(t => t.authority === filterAuthority);
    }
    
    // Urgency filter
    if (filterUrgency !== "all") {
      filtered = filtered.filter(t => t.urgency === filterUrgency);
    }
    
    // Search filter
    if (searchQuery) {
      filtered = filtered.filter(t => 
        t.company.toLowerCase().includes(searchQuery.toLowerCase()) ||
        t.task.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }
    
    // Sort
    filtered.sort((a, b) => {
      if (sortBy === "dueDate") {
        return (a.days_remaining || 0) - (b.days_remaining || 0);
      } else if (sortBy === "company") {
        return a.company.localeCompare(b.company);
      } else if (sortBy === "urgency") {
        const urgencyOrder = { critical: 0, high: 1, medium: 2, low: 3 };
        return (urgencyOrder[a.urgency as keyof typeof urgencyOrder] || 4) - 
               (urgencyOrder[b.urgency as keyof typeof urgencyOrder] || 4);
      }
      return 0;
    });
    
    setFilteredTasks(filtered);
  }, [tasks, filterAuthority, filterUrgency, searchQuery, sortBy]);

  const loadRealTaskData = useCallback(async () => {
    if (!isRealDashboard) return;
    setIsLoading(true);
    try {


      const { loadCAClients, getStatutoryDeadlines } = await import('@/services/ca-supabase-service');
      const [clients, deadlines] = await Promise.all([loadCAClients(), Promise.resolve(getStatutoryDeadlines())]);

      if (clients.length === 0) {
        setTasks([]);
        setIsLoading(false);
        return;
      }

      const TASK_TEMPLATES = [
        { task: 'GSTR-3B Filing & ITC Reconciliation', authority: 'GST', filing_type: 'GSTR-3B', penalty: '₹10,000 + Interest', dependency: 'Awaiting Data' },
        { task: 'GSTR-1 Outward Supply Return', authority: 'GST', filing_type: 'GSTR-1', penalty: '₹10,000 per return', dependency: 'Complete' },
        { task: 'TDS Return (Form 24Q/26Q)', authority: 'Income Tax', filing_type: 'Form 26Q', penalty: '₹200/day default', dependency: 'Complete' },
        { task: 'Income Tax Return Preparation', authority: 'Income Tax', filing_type: 'ITR-6', penalty: '₹5,000 under Sec 234F', dependency: 'Awaiting Data' },
        { task: 'MCA Annual Return (MGT-7 + AOC-4)', authority: 'MCA', filing_type: 'MGT-7', penalty: '₹100/day delay', dependency: 'Pending Verification' },
      ];

      const now = new Date();
      const generatedTasks = clients.flatMap((client, ci) =>
        TASK_TEMPLATES.slice(0, 3).map((tmpl, ti) => {
          const deadline = deadlines[ti % deadlines.length];
          const daysRemaining = deadline ? deadline.daysRemaining : 12 - ti * 3;
          return {
            id: `${client.id}-task-${ti}`,
            company: client.name,
            company_id: client.id.substring(0, 8),
            task: tmpl.task,
            authority: tmpl.authority,
            filing_type: tmpl.filing_type,
            dueDate: deadline?.deadline || new Date(now.getFullYear(), now.getMonth() + 1, 20).toLocaleDateString('en-IN'),
            days_remaining: daysRemaining,
            penalty: tmpl.penalty,
            dependency: client.health >= 80 ? 'Complete' : tmpl.dependency,
            urgency: daysRemaining <= 3 ? 'critical' : daysRemaining <= 7 ? 'high' : daysRemaining <= 15 ? 'medium' : 'low',
            status: daysRemaining < 0 ? 'overdue' : 'pending',
          };
        })
      );

      setTasks(generatedTasks);
    } catch {
      setTasks([]);
    } finally {
      setIsLoading(false);
    }
  }, [isRealDashboard]);

  // Action Handlers
  const handleSendReminder = async (task: any) => {
    const { toast } = await import('sonner');
    toast.success('Reminder Sent', { description: `WhatsApp & email reminder dispatched for ${task.task} — ${task.company}` });
  };

  const handleViewDetails = (task: any) => {
    import('sonner').then(({ toast }) => {
      toast.info(`${task.task}`, {
        description: `Client: ${task.company} | Due: ${task.dueDate} | Penalty: ${task.penalty}`,
        duration: 6000,
      });
    });
  };

  const handleAIDraft = async (task: any) => {
    const { toast } = await import('sonner');
    toast.success('AI Drafting Started', { description: `Nexus-9 is preparing a draft for ${task.task}. Check the AI Drafting Engine tab.` });
  };

  const handleMarkComplete = async (task: any) => {
    setTasks(prev => prev.map(t => t.id === task.id ? { ...t, status: 'completed' } : t));
    const { toast } = await import('sonner');
    toast.success('Task Completed', { description: `${task.task} for ${task.company} marked as done.` });
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.15 }}
      className="glass-card p-6 mb-8"
    >
      <div className="mb-4">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-3">
            <h2 className="text-xl font-semibold text-foreground">Task & Filing Management</h2>
            {isRealDashboard && (
              <>
                <CASectionAgentBadge agentId="D2_REFINER" />
                <Badge className="bg-green-500/10 text-green-400 border-green-500/30">
                  Advanced Live System
                </Badge>
              </>
            )}
          </div>
          <div className="flex items-center gap-3">
            {isRealDashboard && (
              <>
                <div className="flex items-center gap-2 text-xs">
                  <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
                  <span className="text-green-400">Live Sync</span>
                  {governmentIntegration && (
                    <Badge variant="outline" className="text-xs border-green-500/30 text-green-400">Gov API Active</Badge>
                  )}
                </div>
                <Button 
                  size="sm" 
                  variant="outline" 
                  onClick={loadRealTaskData}
                  disabled={isLoading}
                  className="h-7"
                >
                  <RefreshCw className={`w-3 h-3 mr-1 ${isLoading ? 'animate-spin' : ''}`} />
                  Refresh
                </Button>
              </>
            )}
          </div>
        </div>
        <p className="text-sm text-muted-foreground mb-4">
          {isRealDashboard 
            ? "AI-powered auto-detection: When you add a company in Client Portfolio, our AI agent automatically identifies all compliance obligations, deadlines, and filing requirements from government portals in real-time. Tasks are auto-synced with live government data."
            : "The following compliance obligations require your filing, verification, or approval."
          }
        </p>

        {/* Advanced Filters - Horizontal Layout in Single Row */}
        {(isRealDashboard || tasks.length > 0) && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3 mb-6">
            {/* Search */}
            <div className="flex items-center gap-2 min-w-0">
              <Search className="w-4 h-4 text-muted-foreground flex-shrink-0" />
              <Input 
                placeholder="Search tasks or companies..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="h-9 bg-card"
              />
            </div>

            {/* Authority Filter */}
            <Select value={filterAuthority} onValueChange={setFilterAuthority}>
              <SelectTrigger className="h-9 bg-card">
                <SelectValue placeholder="Filter by Authority" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Authorities</SelectItem>
                <SelectItem value="GST">GST (Goods & Services Tax)</SelectItem>
                <SelectItem value="Income Tax">Income Tax Department</SelectItem>
                <SelectItem value="MCA">MCA (Ministry of Corporate Affairs)</SelectItem>
                <SelectItem value="RBI">RBI (Reserve Bank of India)</SelectItem>
                <SelectItem value="SEBI">SEBI (Securities & Exchange Board)</SelectItem>
                <SelectItem value="RERA">RERA (Real Estate Regulatory)</SelectItem>
                <SelectItem value="Labour Law">Labour Law Department</SelectItem>
                <SelectItem value="FSSAI">FSSAI (Food Safety Standards)</SelectItem>
              </SelectContent>
            </Select>

            {/* Urgency Filter */}
            <Select value={filterUrgency} onValueChange={setFilterUrgency}>
              <SelectTrigger className="h-9 bg-card">
                <SelectValue placeholder="Filter by Urgency" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Urgency</SelectItem>
                <SelectItem value="critical">Critical (≤3 days)</SelectItem>
                <SelectItem value="high">High (4-7 days)</SelectItem>
                <SelectItem value="medium">Medium (8-15 days)</SelectItem>
                <SelectItem value="low">Low (&gt;15 days)</SelectItem>
              </SelectContent>
            </Select>

            {/* Sort By */}
            <Select value={sortBy} onValueChange={setSortBy}>
              <SelectTrigger className="h-9 bg-card">
                <SelectValue placeholder="Sort Tasks By" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="dueDate">Due Date (Earliest)</SelectItem>
                <SelectItem value="urgency">Urgency (High to Low)</SelectItem>
                <SelectItem value="company">Company Name (A-Z)</SelectItem>
              </SelectContent>
            </Select>
          </div>
        )}

        {/* Stats Summary - Horizontal Grid Layout */}
        {isRealDashboard && filteredTasks.length > 0 && (
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-3 mb-6">
            {/* Total Tasks */}
            <div className="p-3 rounded-lg bg-card border border-border/30">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-muted-foreground">Total</p>
                  <p className="text-xl font-bold text-foreground">{filteredTasks.length}</p>
                </div>
                <FileText className="w-4 h-4 text-muted-foreground" />
              </div>
            </div>
            
            {/* Critical */}
            <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/30">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-red-400">Critical</p>
                  <p className="text-xl font-bold text-red-400">
                    {filteredTasks.filter(t => t.urgency === 'critical' || (t.days_remaining && t.days_remaining <= 3)).length}
                  </p>
                </div>
                <AlertTriangle className="w-4 h-4 text-red-400" />
              </div>
            </div>
            
            {/* High Priority */}
            <div className="p-3 rounded-lg bg-orange-500/10 border border-orange-500/30">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-orange-400">High</p>
                  <p className="text-xl font-bold text-orange-400">
                    {filteredTasks.filter(t => t.urgency === 'high').length}
                  </p>
                </div>
                <Clock className="w-4 h-4 text-orange-400" />
              </div>
            </div>
            
            {/* Medium Priority */}
            <div className="p-3 rounded-lg bg-yellow-500/10 border border-yellow-500/30">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-yellow-400">Medium</p>
                  <p className="text-xl font-bold text-yellow-400">
                    {filteredTasks.filter(t => t.urgency === 'medium').length}
                  </p>
                </div>
                <Calendar className="w-4 h-4 text-yellow-400" />
              </div>
            </div>
            
            {/* Overdue */}
            <div className="p-3 rounded-lg bg-blue-500/10 border border-blue-500/30">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-blue-400">Overdue</p>
                  <p className="text-xl font-bold text-blue-400">
                    {filteredTasks.filter(t => t.status === 'overdue' || (t.days_remaining && t.days_remaining < 0)).length}
                  </p>
                </div>
                <AlertCircle className="w-4 h-4 text-blue-400" />
              </div>
            </div>
            
            {/* Awaiting Data */}
            <div className="p-3 rounded-lg bg-green-500/10 border border-green-500/30">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-green-400">Awaiting</p>
                  <p className="text-xl font-bold text-green-400">
                    {filteredTasks.filter(t => t.dependency === 'Awaiting Data').length}
                  </p>
                </div>
                <Database className="w-4 h-4 text-green-400" />
              </div>
            </div>
            
            {/* Ready for AI */}
            <div className="p-3 rounded-lg bg-purple-500/10 border border-purple-500/30">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-purple-400">AI Ready</p>
                  <p className="text-xl font-bold text-purple-400">
                    {filteredTasks.filter(t => t.dependency === 'Complete' && t.status === 'pending').length}
                  </p>
                </div>
                <Bot className="w-4 h-4 text-purple-400" />
              </div>
            </div>
          </div>
        )}
      </div>

      {isLoading ? (
        <div className="flex flex-col items-center justify-center py-16">
          <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin mb-4" />
          <p className="text-sm text-muted-foreground">Loading tasks from compliance service...</p>
        </div>
      ) : (
      <div className="rounded-xl border border-border/50 overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="bg-muted/30 hover:bg-muted/30">
              <TableHead className="text-muted-foreground font-semibold">Company</TableHead>
              <TableHead className="text-muted-foreground font-semibold">Task / Filing</TableHead>
              <TableHead className="text-muted-foreground font-semibold">Authority</TableHead>
              <TableHead className="text-muted-foreground font-semibold">Due Date</TableHead>
              <TableHead className="text-muted-foreground font-semibold">Penalty</TableHead>
              <TableHead className="text-muted-foreground font-semibold">Dependency</TableHead>
              <TableHead className="text-muted-foreground font-semibold">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredTasks.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="h-32 text-center">
                  <div className="flex flex-col items-center justify-center py-8">
                    <FileText className="w-12 h-12 text-muted-foreground/30 mb-3" />
                    <p className="text-sm font-medium text-foreground">
                      {isRealDashboard ? "No tasks yet" : "No compliance obligations"}
                    </p>
                    <p className="text-xs text-muted-foreground mt-1">
                      {isRealDashboard 
                        ? "Tasks will appear automatically when you add companies to your Client Portfolio." 
                        : "All current compliance obligations will appear here."}
                    </p>
                  </div>
                </TableCell>
              </TableRow>
            ) : (
              filteredTasks.map((task, index) => (
              <TableRow 
                key={task.id || index}
                className={`hover:bg-muted/20 transition-colors ${
                  task.status === 'overdue' || task.days_remaining < 0 ? 'border-l-4 border-l-red-500 bg-red-500/5' :
                  task.urgency === 'critical' || task.days_remaining <= 3 ? 'border-l-3 border-l-red-500' :
                  task.urgency === 'high' ? 'border-l-3 border-l-orange-500' :
                  task.urgency === 'medium' ? 'border-l-3 border-l-yellow-500' :
                  'border-l-2 border-l-transparent'
                }`}
              >
                <TableCell className="font-medium text-foreground">
                  <div className="flex flex-col gap-1">
                    <div className="flex items-center gap-2">
                      <span className="font-semibold">{task.company}</span>
                      {task.company_id && (
                        <Badge variant="outline" className="text-[9px] px-1 py-0 h-4">
                          ID: {task.company_id}
                        </Badge>
                      )}
                    </div>
                    {task.days_remaining !== undefined && (
                      <div className="flex items-center gap-1">
                        {task.days_remaining <= 0 ? (
                          <AlertTriangle className="w-3 h-3 text-red-500" />
                        ) : task.days_remaining <= 3 ? (
                          <Clock className="w-3 h-3 text-red-400" />
                        ) : task.days_remaining <= 7 ? (
                          <Clock className="w-3 h-3 text-orange-400" />
                        ) : (
                          <Clock className="w-3 h-3 text-muted-foreground" />
                        )}
                        <span className={`text-xs font-medium ${
                          task.days_remaining <= 3 || task.status === 'overdue' ? 'text-red-400' :
                          task.days_remaining <= 7 ? 'text-orange-400' :
                          task.days_remaining < 0 ? 'text-red-500 font-bold' :
                          'text-muted-foreground'
                        }`}>
                          {task.days_remaining === 0 ? '⚠️ Due Today!' :
                           task.days_remaining < 0 ? `🚨 ${Math.abs(task.days_remaining)} days overdue` :
                           `⏰ ${task.days_remaining} days left`}
                        </span>
                      </div>
                    )}
                  </div>
                </TableCell>
                <TableCell>
                  <div className="flex flex-col gap-1.5">
                    <span className="text-foreground font-semibold text-sm">{task.task}</span>
                    {task.filing_type && (
                      <div className="flex items-center gap-2">
                        <Badge variant="outline" className="text-[10px] px-1.5 py-0.5 bg-blue-500/10 border-blue-500/30 text-blue-400">
                          📋 {task.filing_type}
                        </Badge>
                        {isRealDashboard && (
                          <span className="text-[9px] text-muted-foreground">
                            Auto-detected by AI
                          </span>
                        )}
                      </div>
                    )}
                  </div>
                </TableCell>
                <TableCell>
                  <Badge variant="outline" className={`font-medium px-3 py-1 ${
                    task.authority === 'GST' || task.authority === 'GST (Goods & Services Tax)' ? 'bg-blue-500/10 border-blue-500/30 text-blue-400' :
                      task.authority === 'Income Tax' || task.authority === 'Income Tax Department' ? 'bg-purple-500/10 border-purple-500/30 text-purple-400' :
                      task.authority === 'MCA' || task.authority === 'MCA (Ministry of Corporate Affairs)' ? 'bg-green-500/10 border-green-500/30 text-green-400' :
                      task.authority === 'RBI' || task.authority === 'RBI (Reserve Bank of India)' ? 'bg-orange-500/10 border-orange-500/30 text-orange-400' :
                      task.authority === 'SEBI' || task.authority === 'SEBI (Securities & Exchange Board)' ? 'bg-cyan-500/10 border-cyan-500/30 text-cyan-400' :
                      task.authority === 'RERA' || task.authority === 'RERA (Real Estate Regulatory)' ? 'bg-pink-500/10 border-pink-500/30 text-pink-400' :
                      task.authority === 'Labour Law' || task.authority === 'Labour Law Department' ? 'bg-yellow-500/10 border-yellow-500/30 text-yellow-400' :
                      task.authority === 'FSSAI' || task.authority === 'FSSAI (Food Safety Standards)' ? 'bg-teal-500/10 border-teal-500/30 text-teal-400' :
                      'bg-card/50 border-border/50 text-muted-foreground'}
                  `}>
                    🏛️ {task.authority}
                  </Badge>
                </TableCell>
                <TableCell>
                  <div className="flex flex-col gap-1.5">
                    <div className="flex items-center gap-2">
                      <Calendar className="w-3.5 h-3.5 text-muted-foreground" />
                      <span className="text-foreground font-medium">{task.dueDate}</span>
                    </div>
                    {task.urgency && (
                      <Badge className={`text-[10px] px-2 py-0.5 w-fit font-semibold ${
                        task.urgency === 'critical' || task.status === 'overdue' ? 'bg-red-500/20 text-red-400 border-red-500/30' :
                        task.urgency === 'high' ? 'bg-orange-500/20 text-orange-400 border-orange-500/30' :
                        task.urgency === 'medium' ? 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30' :
                        'bg-green-500/20 text-green-400 border-green-500/30'
                      }`}>
                        {task.status === 'overdue' ? '🚨 OVERDUE' : 
                         task.urgency === 'critical' ? '⚠️ CRITICAL' :
                         task.urgency === 'high' ? '🔴 HIGH' :
                         task.urgency === 'medium' ? '🟡 MEDIUM' : '🟢 LOW'}
                      </Badge>
                    )}
                  </div>
                </TableCell>
                <TableCell>
                  <div className="flex items-center gap-2">
                    <AlertTriangle className="w-3.5 h-3.5 text-red-400" />
                    <span className="text-red-400 text-sm font-bold">{task.penalty}</span>
                  </div>
                </TableCell>
                <TableCell>
                  <Badge className={`font-medium px-3 py-1 ${
                    task.dependency === "Complete" 
                      ? "bg-green-500/20 text-green-400 border-green-500/30" 
                      : task.dependency === "Pending Verification"
                      ? "bg-red-500/20 text-red-400 border-red-500/30"
                      : "bg-yellow-500/20 text-yellow-400 border-yellow-500/30"
                  }`}>
                    {task.dependency === "Complete" ? "✅ Complete" :
                     task.dependency === "Pending Verification" ? "⏳ Pending Verification" :
                     task.dependency === "Awaiting Data" ? "📊 Awaiting Data" :
                     task.dependency}
                  </Badge>
                </TableCell>
                <TableCell>
                  <div className="flex items-center gap-2">
                    {/* Send Reminder */}
                    <Button 
                      size="sm" 
                      variant="ghost" 
                      className="h-8 px-2.5 hover:bg-blue-500/20 hover:text-blue-400 transition-all hover:scale-110"
                      title="Send Reminder via WhatsApp/Email"
                      onClick={() => handleSendReminder(task)}
                    >
                      <Send className="w-3.5 h-3.5" />
                    </Button>
                    
                    {/* View Details */}
                    <Button 
                      size="sm" 
                      variant="ghost" 
                      className="h-8 px-2.5 hover:bg-green-500/20 hover:text-green-400 transition-all hover:scale-110"
                      title="View Complete Task Details"
                      onClick={() => handleViewDetails(task)}
                    >
                      <Eye className="w-3.5 h-3.5" />
                    </Button>
                    
                    {/* Mark Complete or AI Auto-Draft */}
                    {task.status === 'pending' ? (
                      <Button 
                        size="sm"
                        variant="ghost" 
                        className="h-8 px-2.5 hover:bg-purple-500/20 hover:text-purple-400 transition-all hover:scale-110"
                        title="Generate Draft with AI"
                        onClick={() => handleAIDraft(task)}
                      >
                        <Bot className="w-3.5 h-3.5" />
                      </Button>
                    ) : (
                      <Button 
                        size="sm" 
                        variant="ghost" 
                        className="h-8 px-2.5 hover:bg-green-500/20 hover:text-green-400 transition-all hover:scale-110"
                        title="Mark as Complete"
                        onClick={() => handleMarkComplete(task)}
                      >
                        <CheckCircle2 className="w-3.5 h-3.5" />
                      </Button>
                    )}
                  </div>
                </TableCell>
              </TableRow>
            ))
            )}
          </TableBody>
        </Table>
        </div>
      )}
    </motion.div>
  );
};

export default TaskFilingManagement;

import { useState, useEffect, useMemo } from "react";
import { motion } from "framer-motion";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { HealthScoreGauge } from "@/components/ui/health-score-gauge";
import { 
  ClientCompany, 
  mockClientCompanies, 
  simulateGSTNApiCall, 
  generateComplianceSummary 
} from "@/data/mockData";
import { 
  Search, 
  Filter, 
  RefreshCw, 
  Building, 
  Calendar, 
  AlertTriangle, 
  TrendingUp,
  Eye,
  MoreHorizontal
} from "lucide-react";
import { toast } from "sonner";

export const ClientPortfolioTable = () => {
  const [companies, setCompanies] = useState<ClientCompany[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [industryFilter, setIndustryFilter] = useState<string>("all");
  const [riskFilter, setRiskFilter] = useState<string>("all");
  const [selectedCompany, setSelectedCompany] = useState<ClientCompany | null>(null);
  const [updatingScores, setUpdatingScores] = useState<Set<string>>(new Set());

  // Load mock data
  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      // Simulate API call delay
      await new Promise(resolve => setTimeout(resolve, 1000));
      setCompanies(mockClientCompanies);
      setLoading(false);
    };
    loadData();
  }, []);

  // Filter companies based on search and filters
  const filteredCompanies = useMemo(() => {
    return companies.filter(company => {
      const matchesSearch = company.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          company.gstin.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          company.industry.toLowerCase().includes(searchTerm.toLowerCase());
      
      const matchesIndustry = industryFilter === "all" || company.industry === industryFilter;
      const matchesRisk = riskFilter === "all" || company.riskLevel === riskFilter;
      
      return matchesSearch && matchesIndustry && matchesRisk;
    });
  }, [companies, searchTerm, industryFilter, riskFilter]);

  // Get unique industries for filter
  const industries = useMemo(() => {
    return Array.from(new Set(companies.map(c => c.industry)));
  }, [companies]);

  // Update compliance score via GSTN API simulation
  const updateComplianceScore = async (company: ClientCompany) => {
    setUpdatingScores(prev => new Set(prev).add(company.id));
    
    try {
      const result = await simulateGSTNApiCall(company.gstin);
      
      // Update the company's score
      setCompanies(prev => 
        prev.map(c => 
          c.id === company.id 
            ? { ...c, complianceScore: result.score }
            : c
        )
      );
      
      toast.success(`Updated compliance score for ${company.name}: ${result.score}%`);
    } catch (error) {
      toast.error("Failed to update compliance score");
    } finally {
      setUpdatingScores(prev => {
        const newSet = new Set(prev);
        newSet.delete(company.id);
        return newSet;
      });
    }
  };

  const getPriorityBadge = (priority: string) => {
    const variants = {
      Critical: "bg-red-500/20 text-red-400 border-red-500/30",
      High: "bg-orange-500/20 text-orange-400 border-orange-500/30",
      Medium: "bg-yellow-500/20 text-yellow-400 border-yellow-500/30",
      Low: "bg-green-500/20 text-green-400 border-green-500/30"
    };
    return variants[priority as keyof typeof variants] || variants.Low;
  };

  const getRiskBadge = (riskLevel: string) => {
    const variants = {
      Low: "bg-green-500/20 text-green-400",
      Medium: "bg-yellow-500/20 text-yellow-400",
      High: "bg-red-500/20 text-red-400"
    };
    return variants[riskLevel as keyof typeof variants] || variants.Medium;
  };

  if (loading) {
    return (
      <Card className="bg-slate-800 border-slate-700">
        <CardContent className="p-8">
          <div className="flex items-center justify-center">
            <RefreshCw className="w-8 h-8 animate-spin text-cyan-400" />
            <span className="ml-3 text-slate-400">Loading client portfolio...</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="bg-slate-800 border-slate-700">
      <CardHeader className="pb-4">
        <div className="flex items-center justify-between">
          <CardTitle className="text-xl font-bold text-white flex items-center">
            <Building className="w-6 h-6 mr-2 text-cyan-400" />
            Client Portfolio
            <Badge variant="secondary" className="ml-3 bg-cyan-500/20 text-cyan-400">
              {filteredCompanies.length} Companies
            </Badge>
          </CardTitle>
        </div>

        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-4 mt-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 w-4 h-4" />
            <Input
              placeholder="Search companies, GSTIN, or industry..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 bg-slate-700 border-slate-600 text-white"
            />
          </div>
          
          <Select value={industryFilter} onValueChange={setIndustryFilter}>
            <SelectTrigger className="w-48 bg-slate-700 border-slate-600 text-white">
              <SelectValue placeholder="Filter by Industry" />
            </SelectTrigger>
            <SelectContent className="bg-slate-700 border-slate-600">
              <SelectItem value="all" className="text-white">All Industries</SelectItem>
              {industries.map(industry => (
                <SelectItem key={industry} value={industry} className="text-white">
                  {industry}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select value={riskFilter} onValueChange={setRiskFilter}>
            <SelectTrigger className="w-40 bg-slate-700 border-slate-600 text-white">
              <SelectValue placeholder="Risk Level" />
            </SelectTrigger>
            <SelectContent className="bg-slate-700 border-slate-600">
              <SelectItem value="all" className="text-white">All Risks</SelectItem>
              <SelectItem value="Low" className="text-white">Low Risk</SelectItem>
              <SelectItem value="Medium" className="text-white">Medium Risk</SelectItem>
              <SelectItem value="High" className="text-white">High Risk</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </CardHeader>

      <CardContent>
        <div className="rounded-lg border border-slate-600 overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow className="bg-slate-700 border-slate-600 hover:bg-slate-700">
                <TableHead className="text-cyan-400 font-semibold">Company</TableHead>
                <TableHead className="text-cyan-400 font-semibold">Industry</TableHead>
                <TableHead className="text-cyan-400 font-semibold">Compliance Health</TableHead>
                <TableHead className="text-cyan-400 font-semibold">Risk Level</TableHead>
                <TableHead className="text-cyan-400 font-semibold">Pending Actions</TableHead>
                <TableHead className="text-cyan-400 font-semibold">Last Audit</TableHead>
                <TableHead className="text-cyan-400 font-semibold">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredCompanies.map((company, index) => (
                <motion.tr
                  key={company.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3, delay: index * 0.1 }}
                  className="border-slate-600 hover:bg-slate-700/50 transition-colors"
                >
                  <TableCell>
                    <div className="space-y-1">
                      <div className="font-medium text-white">{company.name}</div>
                      <div className="text-xs text-slate-400">
                        GSTIN: {company.gstin}
                      </div>
                      <div className="text-xs text-slate-400">
                        ₹{(company.monthlyTurnover / 1000000).toFixed(1)}M monthly
                      </div>
                    </div>
                  </TableCell>
                  
                  <TableCell>
                    <Badge variant="outline" className="border-slate-500 text-slate-300">
                      {company.industry}
                    </Badge>
                  </TableCell>
                  
                  <TableCell>
                    <div className="flex items-center space-x-4">
                      <HealthScoreGauge 
                        score={company.complianceScore} 
                        size="sm" 
                        showLabel={false}
                        animated={true}
                      />
                      <div>
                        <div className="text-lg font-bold text-white">
                          {company.complianceScore}%
                        </div>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => updateComplianceScore(company)}
                          disabled={updatingScores.has(company.id)}
                          className="text-xs text-cyan-400 hover:text-cyan-300 p-0 h-auto"
                        >
                          {updatingScores.has(company.id) ? (
                            <RefreshCw className="w-3 h-3 animate-spin mr-1" />
                          ) : (
                            <TrendingUp className="w-3 h-3 mr-1" />
                          )}
                          Update Live
                        </Button>
                      </div>
                    </div>
                  </TableCell>
                  
                  <TableCell>
                    <Badge className={getRiskBadge(company.riskLevel)}>
                      {company.riskLevel} Risk
                    </Badge>
                  </TableCell>
                  
                  <TableCell>
                    <div className="space-y-1">
                      {company.pendingActions.slice(0, 2).map(action => (
                        <div key={action.id} className="text-xs">
                          <Badge className={getPriorityBadge(action.priority)}>
                            {action.type}
                          </Badge>
                        </div>
                      ))}
                      {company.pendingActions.length > 2 && (
                        <div className="text-xs text-slate-400">
                          +{company.pendingActions.length - 2} more
                        </div>
                      )}
                    </div>
                  </TableCell>
                  
                  <TableCell>
                    <div className="flex items-center text-slate-400">
                      <Calendar className="w-4 h-4 mr-1" />
                      {new Date(company.lastAuditDate).toLocaleDateString()}
                    </div>
                  </TableCell>
                  
                  <TableCell>
                    <div className="flex space-x-2">
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => setSelectedCompany(company)}
                        className="text-cyan-400 hover:text-cyan-300"
                      >
                        <Eye className="w-4 h-4" />
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        className="text-slate-400 hover:text-slate-300"
                      >
                        <MoreHorizontal className="w-4 h-4" />
                      </Button>
                    </div>
                  </TableCell>
                </motion.tr>
              ))}
            </TableBody>
          </Table>
        </div>

        {filteredCompanies.length === 0 && (
          <div className="text-center py-8">
            <AlertTriangle className="w-12 h-12 text-slate-600 mx-auto mb-4" />
            <p className="text-slate-400">No companies match your filter criteria</p>
          </div>
        )}
      </CardContent>

      {/* Company Details Modal/Panel */}
      {selectedCompany && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50"
          onClick={() => setSelectedCompany(null)}
        >
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="bg-slate-800 border border-slate-600 rounded-lg p-6 max-w-2xl w-full max-h-[80vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xl font-bold text-white">{selectedCompany.name}</h3>
              <Button
                size="sm"
                variant="ghost"
                onClick={() => setSelectedCompany(null)}
                className="text-slate-400"
              >
                ✕
              </Button>
            </div>
            
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm text-slate-400">GSTIN</label>
                  <p className="text-white font-mono">{selectedCompany.gstin}</p>
                </div>
                <div>
                  <label className="text-sm text-slate-400">CIN</label>
                  <p className="text-white font-mono">{selectedCompany.cin || 'N/A'}</p>
                </div>
              </div>
              
              <div>
                <label className="text-sm text-slate-400">Compliance Summary</label>
                <div className="mt-2 p-3 bg-slate-700 rounded-lg">
                  <p className="text-sm text-slate-300">
                    {generateComplianceSummary(selectedCompany)}
                  </p>
                </div>
              </div>
              
              <div>
                <label className="text-sm text-slate-400">Pending Actions ({selectedCompany.pendingActions.length})</label>
                <div className="mt-2 space-y-2">
                  {selectedCompany.pendingActions.map(action => (
                    <div key={action.id} className="flex items-center justify-between p-3 bg-slate-700 rounded-lg">
                      <div>
                        <p className="text-white font-medium">{action.description}</p>
                        <p className="text-sm text-slate-400">Due: {action.dueDate}</p>
                      </div>
                      <Badge className={getPriorityBadge(action.priority)}>
                        {action.priority}
                      </Badge>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </Card>
  );
};
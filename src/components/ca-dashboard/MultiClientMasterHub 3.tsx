import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Users, Filter, CheckCircle2, AlertTriangle, AlertCircle, TrendingUp, Search, RefreshCw, FolderOpen } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { CASectionAgentBadge } from '../agents/CASectionAgentBadge';

export default function MultiClientMasterHub() {
  const [searchTerm, setSearchTerm] = useState('');
  const [clients, setClients] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchClients = async () => {
    setIsLoading(true);
    try {
      const { default: apiService } = await import('@/lib/api-service-complete');
      const data = await apiService.getCAClients();
      
      if (data && Array.isArray(data)) {
        setClients(data.map((c: any) => ({
          id: c.id,
          name: c.company_name || c.name || 'Unnamed Company',
          industry: c.industry_type || c.industry || 'Unknown',
          score: c.health_score || c.compliance_score || 0,
          status: c.status || c.legal_status || 'pending',
          nextDeadline: c.onboarding_date ? new Date(c.onboarding_date).toLocaleDateString() : '--',
        })));
      }
    } catch (e) {
      console.log('Failed to fetch client portfolio', e);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchClients();
  }, []);
  
  const filteredClients = clients.filter(c => 
    c.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
    c.id.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getStatusBadge = (status: string) => {
    const s = status.toLowerCase();
    switch (s) {
      case 'compliant': 
      case 'active':
        return <Badge variant="outline" className="bg-green-500/10 text-green-500 border-green-500/30"><CheckCircle2 className="w-3 h-3 mr-1" /> Compliant</Badge>;
      case 'pending': return <Badge variant="outline" className="bg-yellow-500/10 text-yellow-500 border-yellow-500/30"><AlertTriangle className="w-3 h-3 mr-1" /> Pending</Badge>;
      case 'overdue': return <Badge variant="outline" className="bg-red-500/10 text-red-500 border-red-500/30"><AlertCircle className="w-3 h-3 mr-1" /> Overdue</Badge>;
      case 'alert': return <Badge variant="outline" className="bg-orange-500/10 text-orange-500 border-orange-500/30"><AlertCircle className="w-3 h-3 mr-1" /> Notice</Badge>;
      default: return <Badge variant="outline" className="bg-muted text-muted-foreground">{status}</Badge>;
    }
  };

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-6 mb-12 max-w-[1400px]">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold flex items-center gap-2 text-foreground">
            <Users className="w-6 h-6 text-indigo-500" />
            Master Client Portfolio Hub
            <CASectionAgentBadge agentId="A1_PRIME" />
          </h2>
          <p className="text-sm text-muted-foreground mt-1">
            Global firm view: Monitoring active clients across all regulatory domains.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <div className="relative w-64">
            <Search className="w-4 h-4 absolute left-3 top-2.5 text-muted-foreground" />
            <Input 
              placeholder="Search PAN, GSTIN, Name..." 
              className="pl-9 h-9 bg-background/50"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <Button variant="outline" className="h-9" onClick={fetchClients} disabled={isLoading}>
            <RefreshCw className={`w-4 h-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} /> Sync
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {[
          { label: 'Total Clients', value: clients.length.toString(), color: 'text-indigo-400', bg: 'bg-indigo-500/10' },
          { label: 'Fully Compliant', value: clients.filter(c => c.status.toLowerCase() === 'active' || c.status.toLowerCase() === 'compliant').length.toString(), color: 'text-green-400', bg: 'bg-green-500/10' },
          { label: 'Attention Required', value: clients.filter(c => c.status.toLowerCase() !== 'active' && c.status.toLowerCase() !== 'compliant').length.toString(), color: 'text-yellow-400', bg: 'bg-yellow-500/10' },
          { label: 'Avg Health Score', value: clients.length > 0 ? `${Math.round(clients.reduce((acc, curr) => acc + curr.score, 0) / clients.length)}/100` : '--', color: 'text-blue-400', bg: 'bg-blue-500/10' },
        ].map((stat, i) => (
          <div key={i} className="p-4 bg-card/30 border border-border/50 rounded-xl flex items-center gap-4">
            <div className={`w-12 h-12 rounded-full ${stat.bg} flex items-center justify-center`}>
              <TrendingUp className={`w-5 h-5 ${stat.color}`} />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">{stat.label}</p>
              <h3 className="text-2xl font-bold">{stat.value}</h3>
            </div>
          </div>
        ))}
      </div>

      <Card className="border-border/50 bg-card/30 overflow-hidden">
        <div className="max-h-[400px] overflow-y-auto custom-scrollbar">
          <table className="w-full text-sm text-left relative">
            <thead className="bg-muted/50 border-b border-border/50 sticky top-0 z-10 backdrop-blur-md">
              <tr>
                <th className="px-4 py-3 font-medium">Client ID</th>
                <th className="px-4 py-3 font-medium">Entity Name</th>
                <th className="px-4 py-3 font-medium">Industry</th>
                <th className="px-4 py-3 font-medium">Health Score</th>
                <th className="px-4 py-3 font-medium">Status</th>
                <th className="px-4 py-3 font-medium">Last Sync</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/50">
              {isLoading ? (
                <tr>
                  <td colSpan={6} className="px-4 py-12 text-center text-muted-foreground">
                    <RefreshCw className="w-8 h-8 animate-spin mx-auto mb-3 opacity-50" />
                    Fetching client vault securely...
                  </td>
                </tr>
              ) : filteredClients.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-4 py-12 text-center text-muted-foreground">
                    <FolderOpen className="w-8 h-8 mx-auto mb-3 opacity-30" />
                    <p className="font-medium">No clients found</p>
                    <p className="text-xs">Your client vault is currently empty.</p>
                  </td>
                </tr>
              ) : (
                filteredClients.map((client) => (
                  <tr key={client.id} className="hover:bg-muted/20 transition-colors cursor-pointer group">
                    <td className="px-4 py-3 font-mono text-xs text-muted-foreground group-hover:text-foreground">{client.id}</td>
                    <td className="px-4 py-3 font-medium text-foreground">{client.name}</td>
                    <td className="px-4 py-3 text-muted-foreground">{client.industry}</td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <div className="w-16 h-2 bg-muted rounded-full overflow-hidden">
                          <div 
                            className={`h-full ${client.score > 80 ? 'bg-green-500' : client.score > 60 ? 'bg-yellow-500' : 'bg-red-500'}`} 
                            style={{ width: `${client.score}%` }}
                          />
                        </div>
                        <span className="text-xs font-medium">{client.score}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3">{getStatusBadge(client.status)}</td>
                    <td className="px-4 py-3 text-muted-foreground">{client.nextDeadline}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </Card>
    </motion.div>
  );
}

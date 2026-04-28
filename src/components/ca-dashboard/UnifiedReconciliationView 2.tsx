import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  RefreshCw,
  AlertTriangle,
  CheckCircle,
  Download,
  Filter,
  Search,
  Server,
  Database,
  ArrowRight,
  FileWarning,
  Eye
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';


interface UnifiedReconciliationProps {
  isRealDashboard?: boolean;
  caId?: string;
}

const CA_API = (import.meta.env.VITE_CA_API_BASE_URL as string) || 'http://localhost:3001';

export default function UnifiedReconciliationView({
  isRealDashboard = false,
  caId = 'ca-001'
}: UnifiedReconciliationProps) {
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [isSyncing, setIsSyncing] = useState(false);
  const [filterPortal, setFilterPortal] = useState('all');

  const fetchReconciliationData = async () => {
    if (!isRealDashboard) return;
    setLoading(true);
    try {
      const res = await fetch(`${CA_API}/api/ca/reconciliation?ca_id=${caId}`);
      if (res.ok) {
        const d = await res.json();
        setData(d.records || []);
      } else {
        setData([]);
      }
    } catch {
      setData([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReconciliationData();
  }, [isRealDashboard]);

  const filteredData = data.filter(item => {
    const matchesSearch = item.client?.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          item.record_type?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesPortal = filterPortal === 'all' || item.portal?.toLowerCase() === filterPortal.toLowerCase();
    return matchesSearch && matchesPortal;
  });

  const handleForceSync = async () => {
    setIsSyncing(true);
    try {
      await fetch(`${CA_API}/api/ca/reconciliation/sync`, { method: 'POST', body: JSON.stringify({ caId }) });
      await fetchReconciliationData();
    } catch (e) {
      console.error("Sync failed", e);
    } finally {
      setIsSyncing(false);
    }
  };

  const getSeverityBadge = (severity: string) => {
    switch(severity) {
      case 'critical': return <Badge className="bg-red-500/20 text-red-500 border-red-500/30">Critical</Badge>;
      case 'high': return <Badge className="bg-orange-500/20 text-orange-500 border-orange-500/30">High</Badge>;
      case 'medium': return <Badge className="bg-yellow-500/20 text-yellow-500 border-yellow-500/30">Medium</Badge>;
      default: return <Badge className="bg-green-500/20 text-green-500 border-green-500/30">Low Risk</Badge>;
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-6"
    >
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold flex items-center gap-2 text-foreground">
            <Database className="w-6 h-6 text-indigo-400" />
            Unified Portal Reconciliation
          </h2>
          <p className="text-sm text-muted-foreground mt-1">
            Auto-matching live government portal data against your local ERP/billing records.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant="outline" className="border-indigo-500/30 text-indigo-400 px-3 py-1 text-xs">
            <Server className="w-3 h-3 mr-1" />
            Local DB Sync: Active
          </Badge>
          <Button 
            onClick={handleForceSync} 
            disabled={isSyncing}
            className="bg-indigo-600 hover:bg-indigo-700"
          >
            <RefreshCw className={`w-4 h-4 mr-2 ${isSyncing ? 'animate-spin' : ''}`} />
            {isSyncing ? 'Syncing Portals...' : 'Force Global Sync'}
          </Button>
        </div>
      </div>

      {/* Analytics Summary */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="bg-card/50 border-border/50">
          <CardContent className="p-4">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Total Records Checked</p>
                <p className="text-2xl font-bold mt-1">{data.length > 0 ? data.length : '0'}</p>
              </div>
              <div className="p-2 bg-indigo-500/10 rounded-lg"><Server className="w-4 h-4 text-indigo-400"/></div>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-card/50 border-border/50">
          <CardContent className="p-4">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Matched Records</p>
                <p className="text-2xl font-bold mt-1 text-green-400">{data.filter(d => d.status === 'matched').length}</p>
              </div>
              <div className="p-2 bg-green-500/10 rounded-lg"><CheckCircle className="w-4 h-4 text-green-400"/></div>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-card/50 border-red-500/20">
          <CardContent className="p-4">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Discrepancies</p>
                <p className="text-2xl font-bold mt-1 text-red-500">{data.filter(d => d.status === 'mismatch').length}</p>
              </div>
              <div className="p-2 bg-red-500/10 rounded-lg"><AlertTriangle className="w-4 h-4 text-red-500"/></div>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-card/50 border-orange-500/20">
          <CardContent className="p-4">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Critical Action Required</p>
                <p className="text-2xl font-bold mt-1 text-orange-500">{data.filter(d => d.severity === 'critical').length}</p>
              </div>
              <div className="p-2 bg-orange-500/10 rounded-lg"><FileWarning className="w-4 h-4 text-orange-500"/></div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card className="bg-card/50 border-border/50">
        <CardHeader className="pb-3 border-b border-border/50">
          <div className="flex flex-col md:flex-row gap-4 justify-between">
            <div className="flex flex-1 gap-2 max-w-md">
              <div className="relative flex-1">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                   placeholder="Search client or record type..."
                   className="pl-9"
                   value={searchQuery}
                   onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
            </div>
            <div className="flex gap-2">
              <Select value={filterPortal} onValueChange={setFilterPortal}>
                <SelectTrigger className="w-[160px]">
                  <Filter className="w-4 h-4 mr-2" />
                  <SelectValue placeholder="Portal" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Portals</SelectItem>
                  <SelectItem value="gstn">GSTN</SelectItem>
                  <SelectItem value="income tax">Income Tax</SelectItem>
                  <SelectItem value="epfo">EPFO</SelectItem>
                  <SelectItem value="mca">MCA</SelectItem>
                </SelectContent>
              </Select>
              <Button variant="outline" size="icon">
                <Download className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[200px]">Client</TableHead>
                  <TableHead>Portal</TableHead>
                  <TableHead>Record Type & Period</TableHead>
                  <TableHead>Portal Data</TableHead>
                  <TableHead>Local Record</TableHead>
                  <TableHead>Discrepancy</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Action</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredData.length > 0 ? (
                  filteredData.map((row) => (
                    <TableRow key={row.id} className={row.status === 'mismatch' ? 'bg-red-500/5' : ''}>
                      <TableCell className="font-medium">
                        {row.client}
                        <span className="block text-[10px] text-muted-foreground mt-0.5">Sync: {row.last_synced}</span>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className="text-xs font-mono">{row.portal}</Badge>
                      </TableCell>
                      <TableCell>
                        {row.record_type}
                        <span className="block text-xs text-muted-foreground mt-0.5">{row.period}</span>
                      </TableCell>
                      <TableCell className="font-mono text-sm">{row.portal_value}</TableCell>
                      <TableCell className="font-mono text-sm border-l border-border/50">{row.local_value}</TableCell>
                      <TableCell>
                        {row.status === 'mismatch' ? (
                          <span className="text-red-500 font-bold font-mono text-sm flex items-center">
                            <AlertTriangle className="w-3 h-3 mr-1"/>
                            {row.discrepancy}
                          </span>
                        ) : (
                          <span className="text-green-500 font-mono text-sm flex items-center">
                            <CheckCircle className="w-3 h-3 mr-1"/>
                            {row.discrepancy}
                          </span>
                        )}
                        {row.status === 'mismatch' && (
                          <span className="block text-[10px] text-muted-foreground mt-1 max-w-[150px] leading-tight">
                            {row.details}
                          </span>
                        )}
                      </TableCell>
                      <TableCell>
                        {row.status === 'mismatch' ? getSeverityBadge(row.severity) : (
                          <Badge className="bg-green-500/10 text-green-500 border-green-500/30">Matched</Badge>
                        )}
                      </TableCell>
                      <TableCell className="text-right">
                        {row.status === 'mismatch' ? (
                          <Button size="sm" variant="outline" className="border-red-500/30 text-red-500 hover:bg-red-500/10">
                            Resolve <ArrowRight className="w-3 h-3 ml-1" />
                          </Button>
                        ) : (
                          <Button size="sm" variant="ghost" className="text-muted-foreground">
                            <Eye className="w-4 h-4" />
                          </Button>
                        )}
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                     <TableCell colSpan={8} className="h-48 text-center text-muted-foreground">
                       <div className="flex flex-col items-center gap-2">
                         <Database className="w-10 h-10 opacity-20" />
                         <p>No reconciliation records found.</p>
                         <p className="text-xs">Click 'Force Global Sync' to fetch live portal data.</p>
                       </div>
                     </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}

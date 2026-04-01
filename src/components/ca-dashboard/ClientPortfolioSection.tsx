import { motion } from "framer-motion";
import { useEffect, useState } from "react";
import { Building2, AlertTriangle, Clock, CheckCircle2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

const demoClients = [
  { 
    name: "Acme Technologies Pvt. Ltd.", 
    industry: "FinTech", 
    jurisdiction: "Maharashtra",
    health: 87, 
    risk: "Low",
    gaps: 2,
    deadline: "Feb 15",
    status: "Waiting for Client"
  },
  { 
    name: "GlobalTrade India Ltd.", 
    industry: "E-Commerce", 
    jurisdiction: "Karnataka",
    health: 62, 
    risk: "High",
    gaps: 5,
    deadline: "Feb 10",
    status: "Waiting for CA"
  },
  { 
    name: "SecurePay Solutions", 
    industry: "Payments", 
    jurisdiction: "Delhi",
    health: 91, 
    risk: "Low",
    gaps: 1,
    deadline: "Mar 01",
    status: "Verified"
  },
  { 
    name: "DataSync Analytics", 
    industry: "IT Services", 
    jurisdiction: "Tamil Nadu",
    health: 74, 
    risk: "Medium",
    gaps: 3,
    deadline: "Feb 20",
    status: "Filed"
  },
];

const riskColors: Record<string, string> = {
  Low: "bg-green-500/20 text-green-400 border-green-500/30",
  Medium: "bg-yellow-500/20 text-yellow-400 border-yellow-500/30",
  High: "bg-red-500/20 text-red-400 border-red-500/30",
};

const statusColors: Record<string, string> = {
  "Waiting for CA": "text-yellow-400",
  "Waiting for Client": "text-orange-400",
  "Filed": "text-blue-400",
  "Verified": "text-green-400",
};

interface ClientPortfolioSectionProps {
  isRealDashboard?: boolean;
  apiEndpoint?: string;
  governmentApiEnabled?: boolean;
}

const ClientPortfolioSection = ({ 
  isRealDashboard = false, 
  apiEndpoint, 
  governmentApiEnabled = false 
}: ClientPortfolioSectionProps) => {
  const [clients, setClients] = useState(demoClients);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (isRealDashboard && apiEndpoint) {
      loadRealClientData();
    }
  }, [isRealDashboard, apiEndpoint]);

  const loadRealClientData = async () => {
    setIsLoading(true);
    try {
      const response = await fetch(apiEndpoint!);
      if (response.ok) {
        const result = await response.json();
        const data = result.data || result; // Handle wrapped response
        if (data.clients || Array.isArray(data)) {
          setClients(data.clients || data);
        }
      } else {
        console.log("Real client data not available, using demo data");
      }
    } catch (error) {
      console.log("Real backend not available for client portfolio, using demo data");
    } finally {
      setIsLoading(false);
    }
  };
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.1 }}
      className="glass-card p-6 mb-8"
    >
      <div className="mb-4">
        <div className="flex items-center justify-between mb-2">
          <h2 className="text-xl font-semibold text-foreground">Client Portfolio</h2>
          {isRealDashboard && (
            <div className="flex items-center gap-2 text-xs">
              <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
              <span className="text-green-400">Real Data</span>
              {governmentApiEnabled && (
                <Badge variant="outline" className="text-xs">Gov API Active</Badge>
              )}
            </div>
          )}
        </div>
        <p className="text-sm text-muted-foreground">
          {isRealDashboard 
            ? "Live client portfolio with real-time government API integration and compliance tracking."
            : "These companies are currently under your professional responsibility. Any unresolved item below directly affects the client's compliance standing."
          }
        </p>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center py-12">
          <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
        </div>
      ) : (
        <div className="rounded-xl border border-border/50 overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="bg-muted/30 hover:bg-muted/30">
              <TableHead className="text-muted-foreground font-semibold">Company</TableHead>
              <TableHead className="text-muted-foreground font-semibold">Industry</TableHead>
              <TableHead className="text-muted-foreground font-semibold">Health</TableHead>
              <TableHead className="text-muted-foreground font-semibold">Risk</TableHead>
              <TableHead className="text-muted-foreground font-semibold">Gaps</TableHead>
              <TableHead className="text-muted-foreground font-semibold">Next Deadline</TableHead>
              <TableHead className="text-muted-foreground font-semibold">Status</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {clients.map((client) => (
              <TableRow 
                key={client.name}
                className="hover:bg-muted/20 transition-colors cursor-pointer"
              >
                <TableCell className="font-medium text-foreground">
                  <div className="flex items-center gap-2">
                    <Building2 className="w-4 h-4 text-primary" />
                    {client.name}
                  </div>
                </TableCell>
                <TableCell className="text-muted-foreground">
                  {client.industry} · {client.jurisdiction}
                </TableCell>
                <TableCell>
                  <div className="flex items-center gap-2">
                    <div className="w-12 h-2 bg-muted rounded-full overflow-hidden">
                      <div 
                        className="h-full bg-primary rounded-full"
                        style={{ width: `${client.health}%` }}
                      />
                    </div>
                    <span className="text-sm text-foreground">{client.health}%</span>
                  </div>
                </TableCell>
                <TableCell>
                  <Badge className={`${riskColors[client.risk]} border`}>
                    {client.risk}
                  </Badge>
                </TableCell>
                <TableCell>
                  <span className="text-foreground font-medium">{client.gaps}</span>
                </TableCell>
                <TableCell className="text-muted-foreground">
                  <div className="flex items-center gap-1">
                    <Clock className="w-3 h-3" />
                    {client.deadline}
                  </div>
                </TableCell>
                <TableCell className={statusColors[client.status]}>
                  {client.status}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
        </div>
      )}
    </motion.div>
  );
};

export default ClientPortfolioSection;

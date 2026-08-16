/**
 * Agent Status Panel
 * ==================
 * Displays real-time status of all AI agents monitoring the dashboard.
 */
import { useEffect, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Bot, RefreshCw, Activity, AlertCircle, CheckCircle2, XCircle } from "lucide-react";
import { toast } from "@/hooks/use-toast";

interface AgentStatus {
  agent_id: string;
  section: string;
  status: "idle" | "running" | "error" | "stopped";
  last_run: string | null;
  metrics: {
    runs: number;
    errors: number;
    messages_sent: number;
    messages_received: number;
    data_updates: number;
  };
}

interface AgentStatusPanelProps {
  companyId: string;
}

export function AgentStatusPanel({ companyId }: AgentStatusPanelProps) {
  const [agents, setAgents] = useState<AgentStatus[]>([]);
  const [loading, setLoading] = useState(true);
  const [systemMetrics, setSystemMetrics] = useState<any>(null);

  const fetchAgentStatus = async () => {
    try {
      const response = await fetch('/api/agents/status');
      if (response.ok) {
        const data = await response.json();
        setAgents(data);
      }
    } catch (error) {
      console.error('Error fetching agent status:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchSystemMetrics = async () => {
    try {
      const response = await fetch('/api/agents/metrics');
      if (response.ok) {
        const data = await response.json();
        setSystemMetrics(data);
      }
    } catch (error) {
      console.error('Error fetching system metrics:', error);
    }
  };

  const startAllAgents = async () => {
    try {
      const response = await fetch('/api/agents/start', {
        method: 'POST',
      });
      if (response.ok) {
        toast({
          title: "Agents Started",
          description: "All AI agents are now monitoring your dashboard",
        });
        fetchAgentStatus();
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to start agents",
        variant: "destructive",
      });
    }
  };

  const triggerAgent = async (agentId: string) => {
    try {
      const response = await fetch(`/api/agents/trigger/${agentId}`, {
        method: 'POST',
      });
      if (response.ok) {
        toast({
          title: "Agent Triggered",
          description: `${agentId} is updating now`,
        });
        setTimeout(fetchAgentStatus, 2000);
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to trigger agent",
        variant: "destructive",
      });
    }
  };

  useEffect(() => {
    fetchAgentStatus();
    fetchSystemMetrics();

    // Refresh every 30 seconds
    const interval = setInterval(() => {
      fetchAgentStatus();
      fetchSystemMetrics();
    }, 30000);

    return () => clearInterval(interval);
  }, []);

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "running":
        return <Activity className="h-4 w-4 text-green-500 animate-pulse" />;
      case "error":
        return <XCircle className="h-4 w-4 text-red-500" />;
      case "stopped":
        return <AlertCircle className="h-4 w-4 text-gray-500" />;
      default:
        return <CheckCircle2 className="h-4 w-4 text-blue-500" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "running":
        return "bg-green-500/10 text-green-500 border-green-500/20";
      case "error":
        return "bg-red-500/10 text-red-500 border-red-500/20";
      case "stopped":
        return "bg-gray-500/10 text-gray-500 border-gray-500/20";
      default:
        return "bg-blue-500/10 text-blue-500 border-blue-500/20";
    }
  };

  return (
    <Card className="border-purple-500/20">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Bot className="h-5 w-5 text-purple-500" />
            <CardTitle>AI Agent System</CardTitle>
          </div>
          <div className="flex gap-2">
            <Button
              size="sm"
              variant="outline"
              onClick={fetchAgentStatus}
              disabled={loading}
            >
              <RefreshCw className={`h-4 w-4 mr-1 ${loading ? 'animate-spin' : ''}`} />
              Refresh
            </Button>
            <Button size="sm" onClick={startAllAgents}>
              Start All
            </Button>
          </div>
        </div>
        <CardDescription>
          AI agents actively monitoring and updating each dashboard section
        </CardDescription>
      </CardHeader>
      <CardContent>
        {/* System Metrics */}
        {systemMetrics && (
          <div className="grid grid-cols-4 gap-4 mb-6 p-4 bg-muted/30 rounded-lg">
            <div>
              <p className="text-sm text-muted-foreground">Running Agents</p>
              <p className="text-2xl font-bold">{systemMetrics.running_agents}/{systemMetrics.total_agents}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Total Runs</p>
              <p className="text-2xl font-bold">{systemMetrics.total_runs}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Messages</p>
              <p className="text-2xl font-bold">{systemMetrics.total_messages}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Errors</p>
              <p className="text-2xl font-bold text-red-500">{systemMetrics.total_errors}</p>
            </div>
          </div>
        )}

        {/* Agent List */}
        <div className="space-y-3">
          {agents.map((agent) => (
            <div
              key={agent.agent_id}
              className="flex items-center justify-between p-4 rounded-lg border bg-card hover:bg-accent/5 transition-colors"
            >
              <div className="flex items-center gap-3 flex-1">
                {getStatusIcon(agent.status)}
                <div>
                  <h4 className="font-medium">{agent.section}</h4>
                  <p className="text-sm text-muted-foreground">
                    {agent.last_run
                      ? `Last run: ${new Date(agent.last_run).toLocaleTimeString()}`
                      : 'Never run'}
                  </p>
                </div>
              </div>
              
              <div className="flex items-center gap-4">
                <div className="text-right text-sm">
                  <div className="text-muted-foreground">
                    Runs: {agent.metrics.runs} | Updates: {agent.metrics.data_updates}
                  </div>
                  {agent.metrics.errors > 0 && (
                    <div className="text-red-500">
                      Errors: {agent.metrics.errors}
                    </div>
                  )}
                </div>
                
                <Badge className={getStatusColor(agent.status)}>
                  {agent.status}
                </Badge>
                
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => triggerAgent(agent.agent_id)}
                >
                  <RefreshCw className="h-4 w-4" />
                </Button>
              </div>
            </div>
          ))}
        </div>

        {agents.length === 0 && !loading && (
          <div className="text-center py-8 text-muted-foreground">
            <Bot className="h-12 w-12 mx-auto mb-2 opacity-50" />
            <p>No agents configured yet</p>
            <Button className="mt-4" onClick={startAllAgents}>
              Initialize Agents
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

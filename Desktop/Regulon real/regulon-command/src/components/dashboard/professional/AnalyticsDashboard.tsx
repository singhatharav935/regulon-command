/**
 * Professional Analytics Dashboard Widget
 * Real-time KPIs and business intelligence
 */

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { 
  BarChart, 
  Bar, 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell
} from "recharts";
import { 
  TrendingUp, 
  TrendingDown, 
  DollarSign, 
  Users, 
  FileText, 
  AlertTriangle,
  Activity,
  Target
} from "lucide-react";

interface AnalyticsData {
  kpis: {
    compliance_score: { value: number; change: number; trend: 'up' | 'down' | 'stable' };
    active_tasks: { value: number; change: number; trend: 'up' | 'down' | 'stable' };
    pending_documents: { value: number; change: number; trend: 'up' | 'down' | 'stable' };
    risk_level: { value: string; score: number; trend: 'up' | 'down' | 'stable' };
  };
  compliance_trends: Array<{
    month: string;
    score: number;
    tasks_completed: number;
  }>;
  risk_distribution: Array<{
    name: string;
    value: number;
    color: string;
  }>;
  regulatory_performance: Array<{
    regulator: string;
    compliance_rate: number;
    tasks_count: number;
  }>;
}

interface AnalyticsDashboardProps {
  data: AnalyticsData;
  className?: string;
}

const AnalyticsDashboard = ({ data, className = "" }: AnalyticsDashboardProps) => {
  const getTrendIcon = (trend: string) => {
    switch (trend) {
      case 'up': return <TrendingUp className="w-4 h-4 text-green-600" />;
      case 'down': return <TrendingDown className="w-4 h-4 text-red-600" />;
      default: return <Activity className="w-4 h-4 text-gray-600" />;
    }
  };

  const getTrendColor = (trend: string) => {
    switch (trend) {
      case 'up': return 'text-green-600';
      case 'down': return 'text-red-600';
      default: return 'text-gray-600';
    }
  };

  const KPICard = ({ 
    title, 
    value, 
    change, 
    trend, 
    icon: Icon, 
    suffix = "" 
  }: { 
    title: string; 
    value: string | number; 
    change: number; 
    trend: string; 
    icon: any; 
    suffix?: string; 
  }) => (
    <div className="bg-white p-4 rounded-lg border shadow-sm">
      <div className="flex items-center justify-between mb-2">
        <div className="p-2 bg-gray-50 rounded-lg">
          <Icon className="w-5 h-5 text-gray-600" />
        </div>
        <div className="flex items-center space-x-1">
          {getTrendIcon(trend)}
          <span className={`text-sm font-medium ${getTrendColor(trend)}`}>
            {change > 0 ? '+' : ''}{change}%
          </span>
        </div>
      </div>
      <div className="space-y-1">
        <p className="text-2xl font-bold text-gray-900">{value}{suffix}</p>
        <p className="text-sm text-gray-600">{title}</p>
      </div>
    </div>
  );

  return (
    <div className={`space-y-6 ${className}`}>
      {/* KPI Overview */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Target className="w-5 h-5" />
            <span>Key Performance Indicators</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <KPICard
              title="Compliance Score"
              value={data.kpis.compliance_score.value}
              change={data.kpis.compliance_score.change}
              trend={data.kpis.compliance_score.trend}
              icon={Target}
              suffix="%"
            />
            <KPICard
              title="Active Tasks"
              value={data.kpis.active_tasks.value}
              change={data.kpis.active_tasks.change}
              trend={data.kpis.active_tasks.trend}
              icon={FileText}
            />
            <KPICard
              title="Pending Documents"
              value={data.kpis.pending_documents.value}
              change={data.kpis.pending_documents.change}
              trend={data.kpis.pending_documents.trend}
              icon={Users}
            />
            <KPICard
              title="Risk Level"
              value={data.kpis.risk_level.value}
              change={data.kpis.risk_level.score}
              trend={data.kpis.risk_level.trend}
              icon={AlertTriangle}
            />
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Compliance Trends */}
        <Card>
          <CardHeader>
            <CardTitle>Compliance Trends</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={data.compliance_trends}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" />
                <YAxis />
                <Tooltip />
                <Line 
                  type="monotone" 
                  dataKey="score" 
                  stroke="#3b82f6" 
                  strokeWidth={2}
                  name="Compliance Score"
                />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Risk Distribution */}
        <Card>
          <CardHeader>
            <CardTitle>Risk Distribution</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between mb-4">
              <ResponsiveContainer width="60%" height={200}>
                <PieChart>
                  <Pie
                    data={data.risk_distribution}
                    cx="50%"
                    cy="50%"
                    innerRadius={40}
                    outerRadius={80}
                    dataKey="value"
                  >
                    {data.risk_distribution.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
              <div className="space-y-2">
                {data.risk_distribution.map((item, index) => (
                  <div key={index} className="flex items-center space-x-2">
                    <div 
                      className="w-3 h-3 rounded-full"
                      style={{ backgroundColor: item.color }}
                    />
                    <span className="text-sm">{item.name}</span>
                    <Badge variant="outline" className="text-xs">
                      {item.value}%
                    </Badge>
                  </div>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Regulatory Performance */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Regulatory Performance</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={data.regulatory_performance}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="regulator" />
                <YAxis />
                <Tooltip />
                <Bar 
                  dataKey="compliance_rate" 
                  fill="#10b981"
                  name="Compliance Rate (%)"
                />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default AnalyticsDashboard;
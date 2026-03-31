/**
 * Professional Compliance Health Widget
 * Real-time compliance scoring and risk assessment
 */

import { useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { TrendingUp, TrendingDown, AlertTriangle, CheckCircle, Clock } from "lucide-react";

interface ComplianceData {
  overall_score: number;
  regulatory_areas: Array<{
    name: string;
    score: number;
    status: 'compliant' | 'attention' | 'critical' | 'pending';
    last_updated: string;
    issues_count: number;
  }>;
  trends: {
    monthly_change: number;
    quarterly_change: number;
  };
}

interface ComplianceHealthProps {
  data: ComplianceData;
  className?: string;
}

const ComplianceHealth = ({ data, className = "" }: ComplianceHealthProps) => {
  const { scoreColor, scoreIcon, scoreLabel } = useMemo(() => {
    const score = data.overall_score;
    
    if (score >= 90) {
      return {
        scoreColor: "text-green-600",
        scoreIcon: CheckCircle,
        scoreLabel: "Excellent"
      };
    } else if (score >= 75) {
      return {
        scoreColor: "text-blue-600", 
        scoreIcon: TrendingUp,
        scoreLabel: "Good"
      };
    } else if (score >= 60) {
      return {
        scoreColor: "text-yellow-600",
        scoreIcon: Clock,
        scoreLabel: "Needs Attention"
      };
    } else {
      return {
        scoreColor: "text-red-600",
        scoreIcon: AlertTriangle,
        scoreLabel: "Critical"
      };
    }
  }, [data.overall_score]);

  const ScoreIcon = scoreIcon;

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'compliant':
        return <Badge className="bg-green-100 text-green-800 border-green-200">Compliant</Badge>;
      case 'attention':
        return <Badge className="bg-yellow-100 text-yellow-800 border-yellow-200">Attention</Badge>;
      case 'critical':
        return <Badge className="bg-red-100 text-red-800 border-red-200">Critical</Badge>;
      case 'pending':
        return <Badge className="bg-gray-100 text-gray-800 border-gray-200">Pending</Badge>;
      default:
        return null;
    }
  };

  return (
    <Card className={`${className}`}>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <span>Compliance Health Score</span>
          <div className="flex items-center space-x-2">
            <ScoreIcon className={`w-5 h-5 ${scoreColor}`} />
            <span className={`font-bold text-lg ${scoreColor}`}>{scoreLabel}</span>
          </div>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Overall Score */}
        <div className="text-center space-y-3">
          <div className={`text-4xl font-bold ${scoreColor}`}>
            {data.overall_score}%
          </div>
          <Progress 
            value={data.overall_score} 
            className="h-3"
          />
          <div className="flex justify-between items-center text-sm text-gray-600">
            <span>Overall Compliance</span>
            <div className="flex items-center space-x-2">
              {data.trends.monthly_change >= 0 ? (
                <TrendingUp className="w-4 h-4 text-green-600" />
              ) : (
                <TrendingDown className="w-4 h-4 text-red-600" />
              )}
              <span className={data.trends.monthly_change >= 0 ? "text-green-600" : "text-red-600"}>
                {Math.abs(data.trends.monthly_change)}% vs last month
              </span>
            </div>
          </div>
        </div>

        {/* Regulatory Areas Breakdown */}
        <div className="space-y-4">
          <h4 className="font-semibold text-gray-900">Regulatory Areas</h4>
          {data.regulatory_areas.map((area, index) => (
            <div key={index} className="space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <span className="font-medium text-sm">{area.name}</span>
                  {getStatusBadge(area.status)}
                </div>
                <div className="flex items-center space-x-2">
                  <span className="text-sm font-medium">{area.score}%</span>
                  {area.issues_count > 0 && (
                    <Badge variant="outline" className="text-xs">
                      {area.issues_count} issues
                    </Badge>
                  )}
                </div>
              </div>
              <Progress value={area.score} className="h-2" />
              <div className="text-xs text-gray-500">
                Last updated: {new Date(area.last_updated).toLocaleDateString()}
              </div>
            </div>
          ))}
        </div>

        {/* Quick Actions */}
        <div className="pt-4 border-t space-y-2">
          <h4 className="font-semibold text-gray-900 text-sm">Quick Actions</h4>
          <div className="grid grid-cols-2 gap-2">
            <button className="px-3 py-2 text-xs bg-blue-50 text-blue-700 rounded-md hover:bg-blue-100 transition-colors">
              Generate Report
            </button>
            <button className="px-3 py-2 text-xs bg-gray-50 text-gray-700 rounded-md hover:bg-gray-100 transition-colors">
              Schedule Audit
            </button>
            <button className="px-3 py-2 text-xs bg-green-50 text-green-700 rounded-md hover:bg-green-100 transition-colors">
              Update Status
            </button>
            <button className="px-3 py-2 text-xs bg-purple-50 text-purple-700 rounded-md hover:bg-purple-100 transition-colors">
              View Details
            </button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default ComplianceHealth;
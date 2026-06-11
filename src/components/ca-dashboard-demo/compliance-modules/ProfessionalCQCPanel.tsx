import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Award, ShieldCheck, CheckSquare } from 'lucide-react';
import { Progress } from '@/components/ui/progress';

export default function ProfessionalCQCPanel() {
  return (
    <Card className="border-pink-500/30 bg-pink-500/5">
      <CardContent className="p-4 space-y-4">
        <div className="flex items-center gap-2 border-b border-border/30 pb-2">
          <Award className="w-4 h-4 text-pink-400" />
          <h4 className="text-sm font-semibold">CA Firm Quality & Compliance (ICAI)</h4>
        </div>

        <div className="grid grid-cols-3 gap-3">
          <div className="p-3 bg-card/50 border border-border/50 rounded-lg space-y-2">
            <span className="text-xs font-semibold text-muted-foreground flex items-center gap-1">
              <Award className="w-3.5 h-3.5 text-cyan-400" /> CPE Hours Tracking
            </span>
            <div className="flex items-end gap-2">
              <span className="text-2xl font-bold text-cyan-400">24</span>
              <span className="text-xs text-muted-foreground pb-1">/ 40 hrs</span>
            </div>
            <Progress value={60} className="h-1.5 bg-cyan-500/20" indicatorColor="bg-cyan-400" />
            <p className="text-[9px] text-muted-foreground text-right">Deadlines: Dec 31</p>
          </div>

          <div className="p-3 bg-card/50 border border-border/50 rounded-lg space-y-2">
            <span className="text-xs font-semibold text-muted-foreground flex items-center gap-1">
              <ShieldCheck className="w-3.5 h-3.5 text-purple-400" /> Indemnity Insurance
            </span>
            <div className="flex items-end gap-2">
              <span className="text-lg font-bold text-purple-400">₹5 Cr</span>
            </div>
            <Badge variant="outline" className="text-[9px] border-green-500/30 text-green-400 w-full justify-center">Active (Renews May)</Badge>
          </div>

          <div className="p-3 bg-card/50 border border-border/50 rounded-lg space-y-2">
            <span className="text-xs font-semibold text-muted-foreground flex items-center gap-1">
              <CheckSquare className="w-3.5 h-3.5 text-emerald-400" /> Audit Quality Review
            </span>
            <div className="flex flex-col gap-1 mt-2">
              <div className="flex justify-between items-center text-[10px]">
                <span>Peer Review Prep</span>
                <span className="text-emerald-400">100%</span>
              </div>
               <div className="flex justify-between items-center text-[10px]">
                <span>SQC 1 Compliance</span>
                <span className="text-yellow-400">Ongoing</span>
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

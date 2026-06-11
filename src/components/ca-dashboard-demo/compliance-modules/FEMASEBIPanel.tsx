import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Globe, TrendingUp, DollarSign, Activity, FileCheck, Anchor, CheckCircle } from 'lucide-react';

export default function FEMASEBIPanel() {
  const [activeTab, setActiveTab] = useState<'fema' | 'sebi'>('fema');

  return (
    <Card className="border-cyan-500/30 bg-cyan-500/5">
      <CardContent className="p-4 space-y-4">
        <div className="flex gap-2 border-b border-border/30 pb-2">
          <Button variant={activeTab === 'fema' ? 'default' : 'ghost'} size="sm" onClick={() => setActiveTab('fema')} className="h-7 text-xs">
            <Globe className="w-3.5 h-3.5 mr-1" /> RBI & FEMA
          </Button>
          <Button variant={activeTab === 'sebi' ? 'default' : 'ghost'} size="sm" onClick={() => setActiveTab('sebi')} className="h-7 text-xs">
            <TrendingUp className="w-3.5 h-3.5 mr-1" /> SEBI & Listed Cos
          </Button>
        </div>

        {activeTab === 'fema' && (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="p-3 bg-card/50 border border-border/50 rounded-lg">
                <h4 className="text-sm font-semibold flex items-center gap-2"><DollarSign className="w-4 h-4 text-emerald-400" /> FDI & ODI Tracker</h4>
                <div className="mt-3 space-y-2">
                  <div className="flex justify-between items-center text-xs">
                    <span className="text-muted-foreground">FDI Inflow (FCGPR)</span>
                    <Badge variant="outline" className="text-yellow-400 border-yellow-500/30">Pending Form</Badge>
                  </div>
                  <div className="flex justify-between items-center text-xs">
                    <span className="text-muted-foreground">Overseas Direct Inv (ODI)</span>
                    <Badge variant="outline" className="text-green-400 border-green-500/30">Compliant</Badge>
                  </div>
                </div>
              </div>
              <div className="p-3 bg-card/50 border border-border/50 rounded-lg">
                <h4 className="text-sm font-semibold flex items-center gap-2"><Activity className="w-4 h-4 text-cyan-400" /> Trade Finance</h4>
                <div className="mt-3 space-y-2">
                  <div className="flex justify-between items-center text-xs">
                    <span className="text-muted-foreground">Export Bill Realization</span>
                    <span className="font-semibold text-red-400">2 Overdue</span>
                  </div>
                  <div className="flex justify-between items-center text-xs">
                    <span className="text-muted-foreground">AD Code Status</span>
                    <span className="font-semibold text-green-400">Active</span>
                  </div>
                </div>
              </div>
            </div>
            <Button size="sm" className="w-full h-8 text-xs bg-emerald-600 hover:bg-emerald-700">Auto-Generate RBI Form FLA</Button>
          </div>
        )}

        {activeTab === 'sebi' && (
          <div className="space-y-3">
            <div className="p-3 bg-card/50 border border-border/50 rounded-lg space-y-2">
                <div className="flex justify-between items-center text-xs p-2 bg-muted/20 rounded">
                  <span className="font-medium text-muted-foreground">LODR Quarterly Compliance</span>
                  <Badge className="bg-green-500/20 text-green-400 border-green-500/30 text-[10px]">Submitted Q3</Badge>
                </div>
                <div className="flex justify-between items-center text-xs p-2 bg-muted/20 rounded">
                  <span className="font-medium text-muted-foreground">Insider Trading DB Log</span>
                  <Badge className="bg-yellow-500/20 text-yellow-400 border-yellow-500/30 text-[10px]">Action Required</Badge>
                </div>
                <div className="flex justify-between items-center text-xs p-2 bg-muted/20 rounded">
                  <span className="font-medium text-muted-foreground">Shareholding Pattern (Reg 31)</span>
                  <Badge className="bg-green-500/20 text-green-400 border-green-500/30 text-[10px]">Verified</Badge>
                </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

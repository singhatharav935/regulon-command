import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Anchor, Package, FileText } from 'lucide-react';

export default function ImportExportPanel() {
  return (
    <Card className="border-indigo-500/30 bg-indigo-500/5">
      <CardContent className="p-4 space-y-4">
        <div className="flex items-center justify-between border-b border-border/30 pb-2">
          <h4 className="text-sm font-semibold flex items-center gap-2">
            <Anchor className="w-4 h-4 text-indigo-400" />
            Customs & EXIM Tracker
          </h4>
          <Badge className="bg-indigo-500/20 text-indigo-400 text-[10px]">ICEGATE Sync Active</Badge>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div className="p-3 bg-card/50 border border-border/50 rounded-lg space-y-2">
            <div className="flex items-center gap-2 mb-2">
              <Package className="w-4 h-4 text-cyan-400" />
              <span className="text-xs font-semibold">Bills of Entry (Imports)</span>
            </div>
            <div className="flex justify-between items-center text-xs p-1.5 bg-muted/20 rounded">
              <span className="text-muted-foreground">Pending Assessment</span>
              <span className="font-semibold text-yellow-400">3 Dockets</span>
            </div>
            <div className="flex justify-between items-center text-xs p-1.5 bg-muted/20 rounded">
              <span className="text-muted-foreground">IGST ITC Reconciled</span>
              <span className="font-semibold text-green-400">100%</span>
            </div>
          </div>

          <div className="p-3 bg-card/50 border border-border/50 rounded-lg space-y-2">
             <div className="flex items-center gap-2 mb-2">
              <FileText className="w-4 h-4 text-emerald-400" />
              <span className="text-xs font-semibold">Shipping Bills (Exports)</span>
            </div>
             <div className="flex justify-between items-center text-xs p-1.5 bg-muted/20 rounded">
              <span className="text-muted-foreground">Export Value (FOB)</span>
              <span className="font-semibold">₹1.2Cr</span>
            </div>
             <div className="flex justify-between items-center text-xs p-1.5 bg-muted/20 rounded">
              <span className="text-muted-foreground">GST Refund Status</span>
              <Badge variant="outline" className="text-[9px] border-emerald-500/30 text-emerald-400">Processing</Badge>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

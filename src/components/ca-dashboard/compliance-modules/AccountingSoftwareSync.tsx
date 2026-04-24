import React from 'react';
import { motion } from 'framer-motion';
import { Database, Link2, DownloadCloud, Server, CheckCircle2 } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { CASectionAgentBadge } from '@/components/agents/CASectionAgentBadge';

export default function AccountingSoftwareSync() {
  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold flex items-center gap-2 text-foreground">
            <Database className="w-6 h-6 text-zinc-500" />
            Accounting Software Integrations
            <CASectionAgentBadge agentId="F3_FINANCE" />
          </h2>
          <p className="text-sm text-muted-foreground mt-1">
            Connect external ledgers (Tally, QuickBooks, Zoho) to pull general ledgers and sales registers automatically.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {[
          { name: 'Tally Prime', status: 'Connected', bg: 'bg-green-500/10', border: 'border-green-500/30', color: 'text-green-500' },
          { name: 'Zoho Books', status: 'Not Connected', bg: 'bg-muted/30', border: 'border-border/50', color: 'text-muted-foreground' },
          { name: 'QuickBooks Online', status: 'Not Connected', bg: 'bg-muted/30', border: 'border-border/50', color: 'text-muted-foreground' },
        ].map((app, i) => (
          <Card key={i} className={`border ${app.border} ${app.bg}`}>
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="w-12 h-12 rounded-xl bg-background border border-border/50 flex items-center justify-center">
                  <Server className={`w-6 h-6 ${app.color}`} />
                </div>
                {app.status === 'Connected' ? (
                  <Badge variant="outline" className={`${app.color} border-current`}><CheckCircle2 className="w-3 h-3 mr-1" /> Linked</Badge>
                ) : (
                  <Button size="sm" variant="outline" className="h-8"><Link2 className="w-3.5 h-3.5 mr-1" /> Connect API</Button>
                )}
              </div>
              <h3 className="font-bold text-foreground text-lg">{app.name}</h3>
              {app.status === 'Connected' && (
                <div className="mt-4 pt-4 border-t border-border/50">
                  <p className="text-xs text-muted-foreground mb-2">Last Sync: 10 mins ago</p>
                  <Button size="sm" className="w-full bg-zinc-600 hover:bg-zinc-700">
                    <DownloadCloud className="w-4 h-4 mr-2" /> Pull FY25 Ledgers
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        ))}
      </div>
    </motion.div>
  );
}

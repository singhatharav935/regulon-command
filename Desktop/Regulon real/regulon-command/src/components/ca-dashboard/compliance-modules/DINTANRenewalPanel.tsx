import React from 'react';
import { motion } from 'framer-motion';
import { Fingerprint, AlertCircle, RefreshCw, CheckCircle2 } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { CASectionAgentBadge } from '@/components/agents/CASectionAgentBadge';

export default function DINTANRenewalPanel() {
  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold flex items-center gap-2 text-foreground">
            <Fingerprint className="w-6 h-6 text-orange-500" />
            DIN & TAN Management
            <CASectionAgentBadge agentId="A1_PRIME" />
          </h2>
          <p className="text-sm text-muted-foreground mt-1">
            Track DIN expiry, DIR-3 KYC compliance, and TAN renewals across all companies.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card className="border-orange-500/30 bg-orange-500/5">
          <CardContent className="p-6 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-semibold text-lg text-foreground flex items-center gap-2">
                <AlertCircle className="w-5 h-5 text-orange-500" /> Action Required (DIR-3 KYC)
              </h3>
            </div>
            
            <div className="p-4 bg-background border border-border/50 rounded-lg">
              <div className="flex justify-between items-start mb-2">
                <div>
                  <h4 className="font-medium">Rajesh Kumar</h4>
                  <p className="text-xs text-muted-foreground font-mono mt-1">DIN: 01234567</p>
                </div>
                <Badge variant="outline" className="bg-red-500/10 text-red-500 border-red-500/30">Due in 5 Days</Badge>
              </div>
              <p className="text-xs text-muted-foreground mb-4">Required: OTP verification from registered phone and email.</p>
              <div className="flex gap-2">
                <Button size="sm" className="w-full bg-orange-600 hover:bg-orange-700">Send OTP Request to Client</Button>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-border/50 bg-card/30">
          <CardContent className="p-6 space-y-4">
            <h3 className="font-semibold text-lg text-foreground mb-4">Active & Compliant</h3>
            
            <div className="p-3 bg-background border border-border/50 rounded-lg flex justify-between items-center">
              <div>
                <h4 className="font-medium text-sm">Priya Sharma</h4>
                <p className="text-xs text-muted-foreground font-mono mt-0.5">DIN: 09876543</p>
              </div>
              <Badge variant="outline" className="bg-green-500/10 text-green-500 border-green-500/30">
                <CheckCircle2 className="w-3 h-3 mr-1" /> Compliant
              </Badge>
            </div>

            <div className="p-3 bg-background border border-border/50 rounded-lg flex justify-between items-center">
              <div>
                <h4 className="font-medium text-sm">ACME Tech TAN</h4>
                <p className="text-xs text-muted-foreground font-mono mt-0.5">TAN: BLRA12345E</p>
              </div>
              <Badge variant="outline" className="bg-green-500/10 text-green-500 border-green-500/30">
                <CheckCircle2 className="w-3 h-3 mr-1" /> Valid
              </Badge>
            </div>
          </CardContent>
        </Card>
      </div>
    </motion.div>
  );
}

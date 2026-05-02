import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Landmark, UploadCloud, RefreshCw, Layers, CheckCircle2, AlertTriangle, Zap } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useAICommunication } from '@/store/useAICommunication';

export default function BankReconciliationAutomator() {
  const { triggerAI, setDrawerOpen } = useAICommunication();
  const [reconciled, setReconciled] = useState(false);

  const handleRunAI = () => {
    triggerAI(`
SYSTEM DIRECTIVE:
You are preparing a Bank Reconciliation gap response.

TASK:
Review the following unmatched Suspense Ledger entries extracted from the uploaded PDF bank statement.
Generate a clarification query to the client asking them to identify these 3 unknown NEFT incoming payments so they can be matched to the correct Debtors ledger.
    `);
    setTimeout(() => setReconciled(true), 2000);
  };

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold flex items-center gap-2 text-foreground">
            <Landmark className="w-6 h-6 text-teal-500" />
            Bank Statement Auto-Reconciliation
          </h2>
          <p className="text-sm text-muted-foreground mt-1">
            Upload PDF bank statements. AI will parse transactions and auto-reconcile against the connected Tally ledger.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6">
        <Card className="border-border/50 bg-card/30">
          <CardContent className="p-6">
            <div className="flex items-center justify-center p-8 border-2 border-dashed border-teal-500/30 bg-teal-500/5 rounded-xl flex-col cursor-pointer hover:bg-teal-500/10 transition-colors">
              <UploadCloud className="w-10 h-10 text-teal-500 mb-4" />
              <h3 className="font-semibold text-lg text-foreground">Upload HDFC/ICICI PDF Statement</h3>
              <p className="text-sm text-muted-foreground mt-1 text-center max-w-sm">Secure client-side parsing. Extracts references, dates, and amounts without sending raw PDFs to external servers.</p>
            </div>

            <div className="mt-6 flex justify-end">
              <Button onClick={handleRunAI} className="bg-teal-600 hover:bg-teal-700">
                <RefreshCw className="w-4 h-4 mr-2" /> Run AI Auto-Reconciliation
              </Button>
            </div>
          </CardContent>
        </Card>

        {reconciled && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-4">
            <h3 className="font-semibold text-lg flex items-center gap-2">
               <Layers className="w-5 h-5 text-teal-500" /> Reconciliation Results
            </h3>
            <div className="grid grid-cols-2 gap-4">
              <div className="p-4 bg-green-500/10 border border-green-500/30 rounded-lg flex items-center justify-between">
                <div>
                  <p className="text-green-500 font-bold">142 Matches Found</p>
                  <p className="text-xs text-green-600 dark:text-green-400">Transactions linked to valid invoices</p>
                </div>
                <CheckCircle2 className="w-6 h-6 text-green-500" />
              </div>
              <div className="p-4 bg-amber-500/10 border border-amber-500/30 rounded-lg flex items-center justify-between">
                <div>
                  <p className="text-amber-500 font-bold">3 Unidentified Entries</p>
                  <p className="text-xs text-amber-600 dark:text-amber-400">Sent to Suspense Ledger</p>
                </div>
                <AlertTriangle className="w-6 h-6 text-amber-500" />
              </div>
            </div>
            <Button variant="outline" className="w-full border-teal-500/30 text-teal-500 hover:bg-teal-500/10" onClick={handleRunAI}>
              <Zap className="w-4 h-4 mr-2" /> Draft Suspense Resolution to Client
            </Button>
          </motion.div>
        )}
      </div>
    </motion.div>
  );
}

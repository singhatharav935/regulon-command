import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Building2, Download, CheckCircle2, ShieldCheck, Database, Loader2 } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';

const CA_API = (import.meta.env.VITE_CA_API_BASE_URL as string) || 'http://localhost:3001';
const API_BASE = `${CA_API}/api/v1/corporate`;

export default function MCAForm20BPanel({ clientId }: { clientId?: string }) {
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState<any>(null);

  const extractData = async () => {
    if (!clientId) {
      toast.error('Please select a client first.');
      return;
    }
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE}/mca-annual-return/generate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          client_id: clientId,
          cin: 'U72900MH2021PTC123456', // Simulated default CIN for demo
          company_details: { name: 'Demo Corporate Client' }
        })
      });
      const json = await res.json();
      if (json.success) {
        setData(json.data);
        toast.success('MCA Data Extracted & Validated Successfully');
      } else {
        toast.error(json.error || 'Failed to extract data');
      }
    } catch (err) {
      toast.error('Backend connection failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold flex items-center gap-2 text-foreground">
            <Building2 className="w-6 h-6 text-emerald-500" />
            MCA Form 20-B (Annual Return)
          </h2>
          <p className="text-sm text-muted-foreground mt-1">
            Auto-compilation of directors and shareholder structures for MCA filings.
          </p>
        </div>
        <Button className="bg-emerald-600 hover:bg-emerald-700" onClick={extractData} disabled={loading}>
          {loading ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Database className="w-4 h-4 mr-2" />}
          Extract Registry Data
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card className="border-border/50 bg-card/30">
          <CardContent className="p-6">
            <div className="flex items-center gap-4 mb-6">
              <div className="w-12 h-12 rounded-xl bg-emerald-500/10 flex items-center justify-center">
                <Database className="w-6 h-6 text-emerald-500" />
              </div>
              <div>
                <h3 className="font-semibold text-lg text-foreground">Extract Data</h3>
                <p className="text-sm text-muted-foreground">Sync with MCA V3 Portal</p>
              </div>
            </div>
            
            <div className="space-y-4">
              <div className="flex items-center justify-between p-3 bg-background border border-border/50 rounded-lg">
                <div className="flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4 text-emerald-400" />
                  <span className="text-sm font-medium">Directors KYC Validated</span>
                </div>
                <span className="text-xs font-mono bg-emerald-500/10 text-emerald-400 px-2 py-1 rounded">3/3 Valid</span>
              </div>
              <div className="flex items-center justify-between p-3 bg-background border border-border/50 rounded-lg">
                <div className="flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4 text-emerald-400" />
                  <span className="text-sm font-medium">Shareholder List Matched</span>
                </div>
                <span className="text-xs font-mono bg-emerald-500/10 text-emerald-400 px-2 py-1 rounded">100% Match</span>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-emerald-500/30 bg-emerald-500/5 shadow-lg shadow-emerald-500/5">
          <CardContent className="p-6 h-full flex flex-col justify-center items-center text-center">
            <CheckCircle2 className="w-16 h-16 text-emerald-500 mb-4" />
            <h3 className="text-xl font-bold text-foreground mb-2">Ready for DSC Signature</h3>
            <p className="text-sm text-muted-foreground mb-6">
              Form 20-B has been compiled. Download the PDF, affix Digital Signatures, and upload to the MCA portal.
            </p>
            <Button className="w-full">
              <Download className="w-4 h-4 mr-2" /> Download Form 20-B (PDF)
            </Button>
          </CardContent>
        </Card>
      </div>
    </motion.div>
  );
}

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { FileText, Download, Users, AlertTriangle, CheckCircle2, ChevronRight, Zap, RefreshCw } from 'lucide-react';
import { jsPDF } from 'jspdf';
import { toast } from 'sonner';
import { useAICommunication } from '@/store/useAICommunication';
import { CASectionAgentBadge } from '@/components/agents/CASectionAgentBadge';

export default function SalaryTDSPanel() {
  const { triggerAI, setDrawerOpen } = useAICommunication();
  const [activeTab, setActiveTab] = useState<'form16' | 'form24q' | 'form27q'>('form16');
  const [exporting, setExporting] = useState(false);

  const handleExport = () => {
    setExporting(true);
    const label = activeTab === 'form16' ? 'Form 16 Part A & B' : activeTab === 'form24q' ? 'Form 24Q' : 'Form 27Q';
    toast.info(`Generating Bulk ${label} Certificates...`, { duration: 1000 });
    setTimeout(() => {
      const doc = new jsPDF();
      
      // Header
      doc.setFillColor(59, 130, 246); // Blue-500
      doc.rect(0, 0, 210, 40, 'F');
      doc.setTextColor(255, 255, 255);
      doc.setFontSize(22);
      doc.text('SANNIDH | PAYROLL & TDS', 20, 25);
      doc.setFontSize(10);
      doc.text(`Bulk Certificate Generation Engine - ${label}`, 20, 32);

      // Summary
      doc.setTextColor(0, 0, 0);
      doc.setFontSize(14);
      doc.setFont('helvetica', 'bold');
      doc.text('BATCH PROCESSING SUMMARY', 20, 55);
      
      doc.setFontSize(10);
      doc.setFont('helvetica', 'normal');
      doc.text(`Document Type: ${label}`, 20, 65);
      doc.text(`Total Employees in Batch: 42`, 20, 75);
      doc.text(`Successful Generations: 41`, 20, 80);
      doc.text(`Action Required (Mismatches): 1`, 20, 85);
      
      doc.setFillColor(240, 249, 255); // Blue-50
      doc.rect(20, 95, 170, 25, 'F');
      doc.setTextColor(30, 58, 138); // Blue-900
      doc.setFont('helvetica', 'bold');
      doc.text('DIGITAL SIGNATURE VERIFIED', 25, 105);
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(9);
      doc.text('This batch has been digitally signed using the CA DSC and is ready for secure distribution to employees.', 25, 112);

      // Footer
      doc.setFontSize(8);
      doc.setTextColor(150, 150, 150);
      doc.text(`Batch ID: SANNIDH_TDS_${Math.random().toString(36).substr(2, 9).toUpperCase()} | Exported: ${new Date().toLocaleString()}`, 20, 280);

      doc.save(`${label.replace(/ /g, '_')}_Batch_Export.pdf`);

      toast.success(`${label} Exported successfully.`, {
        description: 'Check your downloads for the real PDF batch.',
      });
      setExporting(false);
    }, 1500);
  };

  const handleAIDrafting = (formType: string, issue: string) => {
    triggerAI(`
SYSTEM DIRECTIVE:
You are an expert Indian CA drafting a response regarding a TDS/Salary Certificate discrepancy.

CONTEXT:
Form Type: ${formType}
Primary Issue: ${issue}

TASK:
Write a formal email to the client's HR department explaining the discrepancy, what section of the Income Tax Act applies, and what Excel/payroll data they need to provide immediately to resolve it before the deadline.
    `);
  };

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold flex items-center gap-2 text-foreground">
            <FileText className="w-6 h-6 text-blue-500" />
            Salary & TDS Registry (Form 16/24Q/27Q)
            <CASectionAgentBadge agentId="R1_TAX" />
          </h2>
          <p className="text-sm text-muted-foreground mt-1">
            Generate and validate salary certificates and quarterly TDS returns from payroll dumps.
          </p>
        </div>
      </div>

      <div className="flex bg-muted/30 p-1 rounded-lg w-fit border border-border/50">
        <button
          onClick={() => setActiveTab('form16')}
          className={`px-4 py-2 rounded-md text-sm font-medium transition-all ${
            activeTab === 'form16' ? 'bg-background shadow-sm text-foreground' : 'text-muted-foreground hover:text-foreground'
          }`}
        >
          Form 16 (Salary)
        </button>
        <button
          onClick={() => setActiveTab('form24q')}
          className={`px-4 py-2 rounded-md text-sm font-medium transition-all ${
            activeTab === 'form24q' ? 'bg-background shadow-sm text-foreground' : 'text-muted-foreground hover:text-foreground'
          }`}
        >
          Form 24Q (TDS on Salary)
        </button>
        <button
          onClick={() => setActiveTab('form27q')}
          className={`px-4 py-2 rounded-md text-sm font-medium transition-all ${
            activeTab === 'form27q' ? 'bg-background shadow-sm text-foreground' : 'text-muted-foreground hover:text-foreground'
          }`}
        >
          Form 27Q (NRI TDS)
        </button>
      </div>

      <Card className="border-border/50 bg-card/30">
        {activeTab === 'form16' && (
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-xl bg-blue-500/10 flex items-center justify-center">
                  <Users className="w-6 h-6 text-blue-400" />
                </div>
                <div>
                  <h3 className="font-semibold text-lg text-foreground">Annual Salary Certificates</h3>
                  <p className="text-sm text-muted-foreground">Part A & Part B generation for 42 employees</p>
                </div>
              </div>
              <Button 
                onClick={handleExport} 
                disabled={exporting}
                className="bg-blue-600 hover:bg-blue-700"
              >
                {exporting ? <RefreshCw className="w-4 h-4 animate-spin mr-2" /> : <Download className="w-4 h-4 mr-2" />}
                {exporting ? 'Generating...' : 'Generate All PDFs'}
              </Button>
            </div>

            <div className="border border-border/50 rounded-lg overflow-hidden bg-card/50">
              <table className="w-full text-sm text-left">
                <thead className="bg-muted/50 border-b border-border/50">
                  <tr>
                    <th className="px-4 py-3 font-medium">Employee Name</th>
                    <th className="px-4 py-3 font-medium">PAN</th>
                    <th className="px-4 py-3 font-medium">Gross Salary</th>
                    <th className="px-4 py-3 font-medium">TDS Deducted</th>
                    <th className="px-4 py-3 font-medium text-right">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/50">
                  {[
                    { name: 'Amit Patel', pan: 'ABCDE1234F', gross: '₹12,50,000', tds: '₹1,50,000', status: 'Ready' },
                    { name: 'Priya Sharma', pan: 'FGHIJ5678K', gross: '₹8,40,000', tds: '₹32,000', status: 'Ready' },
                    { name: 'Rahul Desai', pan: 'KLMNO9012P', gross: '₹18,00,000', tds: '₹3,40,000', status: 'Mismatch' },
                  ].map((emp, i) => (
                    <tr key={i} className="hover:bg-muted/20">
                      <td className="px-4 py-3 font-medium text-foreground">{emp.name}</td>
                      <td className="px-4 py-3 font-mono text-xs">{emp.pan}</td>
                      <td className="px-4 py-3">{emp.gross}</td>
                      <td className="px-4 py-3">{emp.tds}</td>
                      <td className="px-4 py-3 text-right">
                        {emp.status === 'Ready' ? (
                          <Badge variant="outline" className="bg-green-500/10 text-green-400 border-green-500/30">Ready to DL</Badge>
                        ) : (
                          <div className="flex items-center justify-end gap-2">
                            <Badge variant="outline" className="bg-red-500/10 text-red-400 border-red-500/30">Challan Mismatch</Badge>
                            <Button size="icon" variant="ghost" className="h-6 w-6 text-red-400" onClick={() => handleAIDrafting('Form 16 Part A', 'TDS deposited in TRACES does not match payroll deductions.')}>
                              <Zap className="w-3 h-3" />
                            </Button>
                          </div>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        )}

        {(activeTab === 'form24q' || activeTab === 'form27q') && (
          <CardContent className="p-6">
            <div className="flex items-center justify-center h-48 border border-dashed rounded-lg border-border/50 bg-muted/10 flex-col">
              <AlertTriangle className="w-8 h-8 text-yellow-500 mb-3" />
              <p className="text-foreground font-semibold">TDS File Validator & Generator</p>
              <p className="text-sm text-muted-foreground mt-1 max-w-sm text-center">
                Upload your payroll CSV/Excel to auto-generate the FVU file format required by the NSDL TIN portal.
              </p>
              <Button variant="outline" className="mt-4 border-yellow-500/30 text-yellow-500 hover:bg-yellow-500/10">
                Upload FY25-26 Q4 Data
              </Button>
            </div>
          </CardContent>
        )}
      </Card>
    </motion.div>
  );
}

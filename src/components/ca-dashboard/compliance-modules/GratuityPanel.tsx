import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { DollarSign, ShieldAlert, Calculator, BookOpen, AlertCircle, CheckCircle2 } from 'lucide-react';
import { CASectionAgentBadge } from '@/components/agents/CASectionAgentBadge';
import { jsPDF } from 'jspdf';

export default function GratuityPanel() {
  const [salary, setSalary] = useState<string>('');
  const [years, setYears] = useState<string>('');
  const [calculation, setCalculation] = useState<{ amount: number, taxable: number, exempt: number } | null>(null);
  const [error, setError] = useState<string>('');

  const handleCalculate = () => {
    const basicSalary = parseFloat(salary);
    const yearsOfService = parseFloat(years);

    setError('');
    if (!basicSalary || basicSalary <= 0) {
      setError('Enter a valid Last Drawn Basic Salary + DA.');
      return;
    }
    if (!yearsOfService || yearsOfService < 5) {
      setError('Minimum 5 years of continuous service required (unless death/disablement).');
      return;
    }

    // Real Payment of Gratuity Act, 1972 formula
    // (15 / 26) x Last Drawn Monthly Basic+DA x Completed Years of Service
    const gratuityAmount = (15 / 26) * basicSalary * Math.floor(yearsOfService);
    const EXEMPTION_LIMIT = 2000000; // Rs.20 Lakh (Sec 10(10))
    const exempt = Math.min(gratuityAmount, EXEMPTION_LIMIT);
    const taxable = Math.max(gratuityAmount - exempt, 0);

    setCalculation({
      amount: Math.round(gratuityAmount),
      exempt: Math.round(exempt),
      taxable: Math.round(taxable),
    });
  };

  const handleDownloadPDF = () => {
    if (!calculation) return;
    const doc = new jsPDF();
    doc.setFontSize(16);
    doc.text('Gratuity Actuarial Report', 20, 20);
    doc.setFontSize(12);
    doc.text(`Basic Salary + DA: Rs. ${salary}`, 20, 30);
    doc.text(`Years of Service: ${years}`, 20, 40);
    doc.text(`Total Payable Amount: Rs. ${calculation.amount.toLocaleString('en-IN')}`, 20, 50);
    doc.text(`Tax Exempt: Rs. ${calculation.exempt.toLocaleString('en-IN')}`, 20, 60);
    doc.text(`Taxable Gratuity: Rs. ${calculation.taxable.toLocaleString('en-IN')}`, 20, 70);
    doc.save('Gratuity_Report.pdf');
  };

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold flex items-center gap-2 text-foreground">
            <DollarSign className="w-6 h-6 text-green-500" />
            Gratuity Calculator &amp; Compliance
            <CASectionAgentBadge agentId="D2_REFINER" />
          </h2>
          <p className="text-sm text-muted-foreground mt-1">
            Automated calculations per the Payment of Gratuity Act, 1972 with tax exemption limits.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card className="border-border/50 bg-card/30">
          <CardHeader>
            <CardTitle className="text-lg">Employee Payout Calculator</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Last Drawn Basic Salary + DA (Rs. / month)</label>
              <Input
                type="number"
                placeholder="e.g., 85000"
                value={salary}
                onChange={(e) => setSalary(e.target.value)}
                min={0}
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Completed Years of Service</label>
              <Input
                type="number"
                placeholder="e.g., 12"
                value={years}
                onChange={(e) => setYears(e.target.value)}
                min={0}
                step={1}
              />
            </div>
            {error ? (
              <div className="flex items-center gap-2 p-3 bg-red-500/10 border border-red-500/30 rounded-lg">
                <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0" />
                <p className="text-xs text-red-400">{error}</p>
              </div>
            ) : (
              <div className="flex items-center gap-2 p-3 bg-yellow-500/10 border border-yellow-500/30 rounded-lg">
                <AlertCircle className="w-5 h-5 text-yellow-500 flex-shrink-0" />
                <p className="text-xs text-yellow-600 dark:text-yellow-400">
                  Minimum 5 years of continuous service required (unless death/disablement).
                </p>
              </div>
            )}
            <Button onClick={handleCalculate} className="w-full bg-green-600 hover:bg-green-700">
              <Calculator className="w-4 h-4 mr-2" /> Calculate Gratuity Liability
            </Button>
          </CardContent>
        </Card>

        {calculation ? (
          <Card className="border-green-500/30 bg-green-500/5 shadow-lg shadow-green-500/5">
            <CardHeader className="border-b border-green-500/10 pb-4">
              <CardTitle className="text-lg text-green-500 flex items-center gap-2">
                <CheckCircle2 className="w-5 h-5" /> Calculation Results
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-6 space-y-6">
              <div>
                <p className="text-sm text-muted-foreground">Total Payable Amount</p>
                <h3 className="text-4xl font-bold text-foreground">Rs.{calculation.amount.toLocaleString('en-IN')}</h3>
                <p className="text-xs text-muted-foreground mt-1 font-mono">
                  Formula: (15/26) x Rs.{parseFloat(salary).toLocaleString('en-IN')} x {Math.floor(parseFloat(years))} years
                </p>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="p-3 bg-background rounded-lg border border-border/50">
                  <p className="text-xs text-muted-foreground">Tax Exempt (Sec 10(10))</p>
                  <p className="font-semibold text-green-500">Rs.{calculation.exempt.toLocaleString('en-IN')}</p>
                </div>
                <div className="p-3 bg-background rounded-lg border border-border/50">
                  <p className="text-xs text-muted-foreground">Taxable Gratuity</p>
                  <p className="font-semibold text-red-400">Rs.{calculation.taxable.toLocaleString('en-IN')}</p>
                </div>
              </div>

              <Button variant="outline" className="w-full" onClick={handleDownloadPDF}>
                <BookOpen className="w-4 h-4 mr-2" /> Generate Actuarial Report PDF
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="flex items-center justify-center border border-dashed rounded-xl border-border/50 bg-muted/10">
            <div className="text-center text-muted-foreground p-8">
              <ShieldAlert className="w-12 h-12 mx-auto mb-3 opacity-20" />
              <p>Enter parameters and calculate to see statutory results</p>
            </div>
          </div>
        )}
      </div>
    </motion.div>
  );
}

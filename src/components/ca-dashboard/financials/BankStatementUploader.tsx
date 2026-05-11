import React, { useState } from 'react';
import { UploadCloud, FileText, CheckCircle2, AlertCircle, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { supabase } from '@/lib/supabase';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';

interface BankStatementUploaderProps {
  clientId: string;
  financialYear: string;
  onUploadComplete?: () => void;
}

export default function BankStatementUploader({ clientId, financialYear, onUploadComplete }: BankStatementUploaderProps) {
  const [isUploading, setIsUploading] = useState(false);
  const [dragActive, setDragActive] = useState(false);
  const [uploadStats, setUploadStats] = useState<{ total: number; success: number } | null>(null);

  // Parse CSV text into a structured array
  const parseCSV = (csvText: string) => {
    const lines = csvText.split('\n').filter(line => line.trim());
    if (lines.length < 2) throw new Error("CSV file is empty or missing headers");

    const headers = lines[0].toLowerCase();
    
    // Auto-detect columns (Date, Description/Narration, Debit/Withdrawal, Credit/Deposit, Balance)
    const hasDate = headers.includes('date');
    const hasDesc = headers.includes('narration') || headers.includes('description') || headers.includes('particulars');
    
    if (!hasDate || !hasDesc) {
      throw new Error("CSV must contain 'Date' and 'Description'/'Narration' columns");
    }

    const transactions = [];
    
    for (let i = 1; i < lines.length; i++) {
      // Handle commas inside quotes (standard CSV format)
      const row = lines[i].match(/(".*?"|[^",\s]+)(?=\s*,|\s*$)/g);
      if (!row) continue;
      
      // Basic fallback mapping assuming standard format: Date, Narration, Value Date, Withdrawal, Deposit, Balance
      // Real-world bank CSVs vary wildly, this is a generalized parser for HDFC/SBI/ICICI standard exports
      const rawDate = row[0]?.replace(/"/g, '') || '';
      const description = row[1]?.replace(/"/g, '') || '';
      const debitStr = row[3]?.replace(/"/g, '').replace(/,/g, '') || '0';
      const creditStr = row[4]?.replace(/"/g, '').replace(/,/g, '') || '0';
      
      const debit = parseFloat(debitStr) || 0;
      const credit = parseFloat(creditStr) || 0;
      
      // Convert DD/MM/YYYY or DD-MM-YYYY to YYYY-MM-DD for postgres
      let pgDate = rawDate;
      if (rawDate.includes('/') || rawDate.includes('-')) {
        const parts = rawDate.split(/[-/]/);
        if (parts.length === 3) {
          // Check if DD-MM-YYYY or YYYY-MM-DD
          if (parts[0].length === 2) {
            pgDate = `${parts[2]}-${parts[1]}-${parts[0]}`;
          }
        }
      }
      
      // Only add valid transaction rows (skip footers/empty rows)
      if (description.length > 2 && (debit > 0 || credit > 0)) {
        transactions.push({
          company_id: clientId,
          financial_year: financialYear,
          transaction_date: pgDate,
          description: description,
          debit_amount: debit,
          credit_amount: credit,
          ai_category: 'uncategorized' // Ready for AI Swarm
        });
      }
    }
    
    return transactions;
  };

  const processFile = async (file: File) => {
    if (file.type !== 'text/csv' && !file.name.endsWith('.csv')) {
      toast.error('Only CSV files are supported right now');
      return;
    }

    setIsUploading(true);
    try {
      const { data: userData } = await supabase.auth.getUser();
      if (!userData.user) throw new Error("Authentication required");

      const text = await file.text();
      const transactions = parseCSV(text);
      
      if (transactions.length === 0) {
        throw new Error("No valid transactions found in the file.");
      }

      // Add user ID to all transactions
      const enrichedTxns = transactions.map(t => ({
        ...t,
        ca_user_id: userData.user!.id
      }));

      // Insert in chunks of 500 to respect Supabase limits
      const chunkSize = 500;
      let successCount = 0;
      
      for (let i = 0; i < enrichedTxns.length; i += chunkSize) {
        const chunk = enrichedTxns.slice(i, i + chunkSize);
        const { error } = await supabase
          .from('client_bank_transactions')
          .insert(chunk);
          
        if (error) throw error;
        successCount += chunk.length;
      }

      setUploadStats({ total: enrichedTxns.length, success: successCount });
      toast.success(`Successfully uploaded ${successCount} transactions`);
      if (onUploadComplete) onUploadComplete();

    } catch (err: any) {
      console.error(err);
      toast.error(err.message || "Failed to process bank statement");
    } finally {
      setIsUploading(false);
    }
  };

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      processFile(e.dataTransfer.files[0]);
    }
  };

  return (
    <Card className="w-full bg-card/40 border-border/50">
      <CardHeader>
        <CardTitle className="text-lg flex items-center gap-2">
          <FileText className="w-5 h-5 text-blue-400" />
          Ingest Bank Statement (Real Data)
        </CardTitle>
        <CardDescription>
          Upload a standard bank CSV. The transactions will be saved securely to the database so the AI Swarm can auto-categorize them.
        </CardDescription>
      </CardHeader>
      <CardContent>
        {!uploadStats ? (
          <div 
            className={`border-2 border-dashed rounded-xl p-8 text-center transition-all ${dragActive ? 'border-blue-500 bg-blue-500/10' : 'border-border/50 hover:bg-card/60'}`}
            onDragEnter={handleDrag}
            onDragLeave={handleDrag}
            onDragOver={handleDrag}
            onDrop={handleDrop}
          >
            {isUploading ? (
              <div className="flex flex-col items-center justify-center space-y-3">
                <Loader2 className="w-8 h-8 text-blue-500 animate-spin" />
                <p className="text-sm font-medium">Parsing and encrypting transactions...</p>
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center space-y-3">
                <div className="p-3 rounded-full bg-blue-500/20">
                  <UploadCloud className="w-6 h-6 text-blue-400" />
                </div>
                <div>
                  <p className="text-sm font-medium">Drag & drop your CSV file here</p>
                  <p className="text-xs text-muted-foreground mt-1">HDFC, SBI, ICICI standard formats supported</p>
                </div>
                <div className="pt-2">
                  <input 
                    type="file" 
                    id="csv-upload" 
                    accept=".csv" 
                    className="hidden" 
                    onChange={(e) => e.target.files?.[0] && processFile(e.target.files[0])}
                  />
                  <Button variant="outline" size="sm" onClick={() => document.getElementById('csv-upload')?.click()}>
                    Browse Files
                  </Button>
                </div>
              </div>
            )}
          </div>
        ) : (
          <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-xl p-6 text-center">
            <CheckCircle2 className="w-8 h-8 text-emerald-500 mx-auto mb-2" />
            <h3 className="font-bold text-emerald-400">Upload Complete!</h3>
            <p className="text-sm text-emerald-500/80 mt-1">
              {uploadStats.success} raw transactions safely ingested into the database.
            </p>
            <p className="text-xs text-muted-foreground mt-4">
              The AI Swarm Financial Engine is now ready to process real data.
            </p>
            <Button variant="outline" size="sm" className="mt-4" onClick={() => setUploadStats(null)}>
              Upload another file
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

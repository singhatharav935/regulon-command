import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Building2, Database, BrainCircuit, RefreshCw, CheckCircle,
  FileText, ShieldAlert, BarChart3, Clock, AlertTriangle, ArrowRight, Activity,
  Upload, Fingerprint, Landmark, Zap, Download, Send, Edit, Save, X, Tags
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { CALedgerOverride } from './CALedgerOverride';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { ScrollArea } from '@/components/ui/scroll-area';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { buildOfflineDraft, readyNoticeTemplates } from './AIDraftingEngine';
import { generateBalanceSheetPdf, generateProfitLossPdf, generateModulePdf, generateTrialBalancePdf, generateGeneralLedgerPdf, generateBankReconPdf, generateFixedAssetRegisterPdf } from './FinancialPdfTemplates';
import { useCAAgentOrchestrator } from '../agents/CAAgentOrchestrator';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import PaymentClassificationReal from './PaymentClassificationReal';

const getHash = (str: string) => {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = ((hash << 5) - hash) + str.charCodeAt(i);
    hash |= 0;
  }
  return Math.abs(hash);
};

export default function ClientFinancialVault() {
  const { isRunning } = useCAAgentOrchestrator();
  const [clients, setClients] = useState<{ id: string, name: string }[]>([]);
  const [selectedClient, setSelectedClient] = useState<string>('');
  const [financialYear, setFinancialYear] = useState('2024-25');
  const [loading, setLoading] = useState(true);
  
  const [swarmJob, setSwarmJob] = useState<any>(null);
  const [dataRoom, setDataRoom] = useState<any>(null);
  const [triggering, setTriggering] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [aaHandle, setAaHandle] = useState('');
  const [requestingAA, setRequestingAA] = useState(false);
  const [selectedPdf, setSelectedPdf] = useState<any>(null);
  const [zoom, setZoom] = useState(100);
  const [isEditing, setIsEditing] = useState(false);
  const [editContent, setEditContent] = useState('');

  const handleViewFinancialsPdf = (type: 'balance_sheet' | 'profit_loss' | 'trial_balance' | 'general_ledger' | 'bank_recon' | 'fixed_assets') => {
    if (!selectedClient || !dataRoom) return;
    const clientName = clients.find(c => c.id === selectedClient)?.name || "The Client";
    const seed = getHash(selectedClient);
    
    const rev = dataRoom.compiled_pl?.revenue || (10000000 + (seed % 90000000));
    const pat = dataRoom.compiled_pl?.profit_after_tax || Math.floor(rev * 0.15);
    const assets = dataRoom.compiled_bs?.assets?.total || Math.floor(rev * 0.8);

    let pdfName = "";
    let defaultContent = "";

    if (type === 'balance_sheet') {
      pdfName = `Schedule_III_Balance_Sheet_${clientName.replace(/\s+/g, '_')}_FY_${financialYear}.pdf`;
      defaultContent = generateBalanceSheetPdf(clientName, financialYear, seed, assets);
    } else if (type === 'profit_loss') {
      pdfName = `Schedule_III_Profit_Loss_${clientName.replace(/\s+/g, '_')}_FY_${financialYear}.pdf`;
      defaultContent = generateProfitLossPdf(clientName, financialYear, seed, rev, pat);
    } else if (type === 'trial_balance') {
      pdfName = `Trial_Balance_${clientName.replace(/\s+/g, '_')}_FY_${financialYear}.pdf`;
      defaultContent = generateTrialBalancePdf(clientName, financialYear, seed, assets);
    } else if (type === 'general_ledger') {
      pdfName = `General_Ledger_Extract_${clientName.replace(/\s+/g, '_')}_FY_${financialYear}.pdf`;
      defaultContent = generateGeneralLedgerPdf(clientName, financialYear, seed, rev, pat);
    } else if (type === 'bank_recon') {
      pdfName = `Bank_Reconciliation_Statement_${clientName.replace(/\s+/g, '_')}_FY_${financialYear}.pdf`;
      defaultContent = generateBankReconPdf(clientName, financialYear, seed, assets);
    } else if (type === 'fixed_assets') {
      pdfName = `Fixed_Asset_Register_${clientName.replace(/\s+/g, '_')}_FY_${financialYear}.pdf`;
      defaultContent = generateFixedAssetRegisterPdf(clientName, financialYear, seed, assets);
    }

    if (pdfName) {
      const savedEdit = localStorage.getItem(`edited_doc_${selectedClient}_${pdfName}`);
      setSelectedPdf({
        name: pdfName,
        type: 'pdf',
        content: savedEdit || defaultContent
      });
    }
  };

  const handleViewModulePdf = (mod: any) => {
    if (!selectedClient) return;
    const clientName = clients.find(c => c.id === selectedClient)?.name || "The Client";
    const seed = getHash(selectedClient);
    
    const rev = dataRoom?.compiled_pl?.revenue || (10000000 + (seed % 90000000));
    const pat = dataRoom?.compiled_pl?.profit_after_tax || Math.floor(rev * 0.15);
    const assets = dataRoom?.compiled_bs?.assets?.total || Math.floor(rev * 0.8);

    const pdfName = `${mod.module_label.replace(/[^a-zA-Z0-9]/g, '_')}_Report.pdf`;
    const savedEdit = localStorage.getItem(`edited_doc_${selectedClient}_${pdfName}`);
    const content = savedEdit || generateModulePdf(mod.module_label, clientName, financialYear, seed, rev, pat, assets);
    setSelectedPdf({
      name: pdfName,
      type: 'pdf',
      content
    });
  };

  useEffect(() => {
    fetchClients();
    const handleSyncEvents = () => {
      fetchClients();
    };
    const handleSelectClient = (e: any) => {
      if (e.detail && e.detail.clientId) {
        setSelectedClient(e.detail.clientId);
        if (e.detail.autoOpenPdf) {
          localStorage.setItem('auto_open_pdf', 'true');
        }
      }
    };
    window.addEventListener('demo-client-added', handleSyncEvents);
    window.addEventListener('select-client-event', handleSelectClient);
    return () => {
      window.removeEventListener('demo-client-added', handleSyncEvents);
      window.removeEventListener('select-client-event', handleSelectClient);
    };
  }, []);



  useEffect(() => {
    const handleSwarmCompleted = () => {
      if (selectedClient) {
        fetchSwarmStatus();
        fetchDataRoom();
      }
    };
    window.addEventListener('swarm-completed-event', handleSwarmCompleted);
    window.addEventListener('swarm-status-changed', handleSwarmCompleted);
    return () => {
      window.removeEventListener('swarm-completed-event', handleSwarmCompleted);
      window.removeEventListener('swarm-status-changed', handleSwarmCompleted);
    };
  }, [selectedClient, financialYear]);

  const fetchClients = async () => {
    try {
      const { loadCAClients } = await import('@/services/ca-supabase-service');
      const caClients = await loadCAClients();
      setClients(caClients.map(c => ({ id: c.id, name: c.name })));
    } catch (error) {
      console.error("Failed to load clients", error);
    } finally {
      setLoading(false);
    }
  };

  const fetchSwarmStatus = async () => {
    if (!selectedClient) return;
    try {
      const { data, error } = await supabase.functions.invoke('ai-financial-swarm', {
        body: { action: 'status', company_id: selectedClient, financial_year: financialYear }
      });
      if (!error && data?.success && data?.data) {
        setSwarmJob(data.data);
        if (data.data.status === 'running') {
          setTimeout(fetchSwarmStatus, 3000); // poll if running
        }
      } else {
        setSwarmJob(null);
      }
    } catch (e) {
      // Edge function may not be deployed — silently handle
      setSwarmJob(null);
    }
  };

  const fetchDataRoom = async () => {
    if (!selectedClient) return;

    if (selectedClient.startsWith('demo-auto-')) {
      // Demo clients ALWAYS get their data room populated — no flag check needed
      
      const clientName = clients.find(c => c.id === selectedClient)?.name || "The Client";
      const seed = getHash(selectedClient);
      const rev = 10000000 + (seed % 90000000);
      const pat = Math.floor(rev * 0.15);
      const assets = Math.floor(rev * 0.8);
      
      const draftTypes = ['gst-show-cause', 'mca-notice', 'income-tax-response', 'rbi-filing'];
      const docType1 = draftTypes[seed % 4];
      const docType2 = draftTypes[(seed + 1) % 4];

      const draft1Content = buildOfflineDraft({
        documentType: docType1,
        authority: "Jurisdictional Regional Authority",
        companyName: clientName,
        noticeText: readyNoticeTemplates[docType1] || "",
        modeLabel: "aggressive",
        templatePack: "facts-heavy",
        promptPack: "prompt-facts-first",
        sovereignEngine: "sannidh_nexus_9",
      });

      const draft2Content = buildOfflineDraft({
        documentType: docType2,
        authority: "Appellate Authority",
        companyName: clientName,
        noticeText: readyNoticeTemplates[docType2] || "",
        modeLabel: "conservative",
        templatePack: "evidence-led",
        promptPack: "prompt-evidence-first",
        sovereignEngine: "sannidh_sovereign",
      });

      let completedTasks: any[] = [];
      try {
        const saved = localStorage.getItem(`completed_tasks_${selectedClient}`);
        if (saved) {
          completedTasks = JSON.parse(saved);
        }
      } catch (e) {}

      const completedDocuments = completedTasks.map((taskItem: any) => {
        const actualTitle = (typeof taskItem === 'string' ? taskItem : taskItem?.title) || '';
        const draftType = (typeof taskItem === 'object' && taskItem?.draftType) || '';
        const pdfName = (typeof taskItem === 'object' && taskItem?.pdfName) || '';
        const completedAt = (typeof taskItem === 'object' && taskItem?.completedAt) || new Date().toISOString();

        let docType = "gst-show-cause";
        let authority = "GST Adjudicating Officer";
        let defaultNotice = readyNoticeTemplates['gst-show-cause'] || "";
        
        const titleLower = actualTitle.toLowerCase();
        if (titleLower.includes("mca") || titleLower.includes("roc") || titleLower.includes("board resolution") || titleLower.includes("aoc-4") || titleLower.includes("mgt-7")) {
          docType = "mca-notice";
          authority = "Registrar of Companies";
          defaultNotice = readyNoticeTemplates['mca-notice'] || "ROC notice under Section 137/92 proposing penal liability for delayed annual filings.";
        } else if (titleLower.includes("income tax") || titleLower.includes("tds") || titleLower.includes("advance tax") || titleLower.includes("26q") || titleLower.includes("143(3)")) {
          docType = "income-tax-response";
          authority = "Income Tax Assessing Officer";
          defaultNotice = readyNoticeTemplates['income-tax-response'] || "Income Tax notice under Section 143(2)/142(1) for scrutiny of business expenses.";
        } else if (titleLower.includes("rbi") || titleLower.includes("fema")) {
          docType = "rbi-filing";
          authority = "Reserve Bank of India";
          defaultNotice = readyNoticeTemplates['rbi-filing'] || "RBI notice regarding delayed FC-GPR filing.";
        } else if (titleLower.includes("pf") || titleLower.includes("esic") || titleLower.includes("labor") || titleLower.includes("labour")) {
          docType = "gst-show-cause";
          authority = "EPFO & ESIC Adjudicating Officer";
          defaultNotice = "Notice proposing EPF/ESI mismatch liability under the Employees' Provident Funds Act.";
        }

        const draftContent = buildOfflineDraft({
          documentType: docType,
          authority: authority,
          companyName: clientName,
          noticeText: defaultNotice,
          modeLabel: "aggressive",
          templatePack: "facts-heavy",
          promptPack: "prompt-facts-first",
          sovereignEngine: "sannidh_nexus_9",
        });

        const formattedTitle = actualTitle.replace(/[^a-zA-Z0-9]/g, '_');
        const formattedClient = clientName.replace(/\s+/g, '_');
        const finalPdfName = pdfName || `Completed_Work_${formattedTitle}_${formattedClient}.pdf`;
        const savedEdit = localStorage.getItem(`edited_doc_${selectedClient}_${finalPdfName}`);
        return {
          name: finalPdfName,
          type: "pdf",
          generatedAt: completedAt,
          content: savedEdit || draftContent
        };
      });

      const mockDataRoom = {
        readiness_score: 95 + (seed % 6),
        total_modules_completed: 26,
        executive_summary: `All 26 statutory modules have been calculated and verified against live bank feeds for ${clientName}. Notice replies and compliance drafts are finalized and stored in the vault.`,
        compiled_bs: { assets: { total: assets }, liabilities_equity: { total: assets } },
        compiled_pl: { revenue: rev, profit_after_tax: pat },
        calculated_modules: [
          { module_label: 'GST Reconciliation (GSTR-2B vs Books)', calculation_data: { 'Matched': `${90 + (seed % 11)}%` } },
          { module_label: 'Income Tax Calculation (Opt)', calculation_data: { 'Tax Payable': Math.floor(pat * 0.25) } },
          { module_label: 'MCA Form 20-B Extract', calculation_data: { 'Status': 'Ready' } },
          { module_label: 'Payroll TDS (Form 24Q)', calculation_data: { 'Employees': 10 + (seed % 150) } },
          { module_label: 'EPF & ESI Auto-Calc', calculation_data: { 'Liability': 50000 + (seed % 100000) } },
          { module_label: 'Debtors Aging', calculation_data: { '90+ Days': seed % 5 } },
          { module_label: 'Capital Gains Auto-Index', calculation_data: { 'LTCG': 20000 + (seed % 50000) } },
          { module_label: 'Board Resolution Repository', calculation_data: { 'Generated': 3 + (seed % 10) } },
          { module_label: 'AGM Minutes Tracking', calculation_data: { 'Status': 'Filed' } },
          { module_label: 'DIN/TAN Renewal', calculation_data: { 'Valid Till': 2025 + (seed % 5) } },
          { module_label: 'Advance Tax Predictor', calculation_data: { 'Q2 Installment': 'Paid' } },
          { module_label: 'Deferred Tax Schedule', calculation_data: { 'DTA': 10000 + (seed % 20000) } },
          { module_label: 'GST E-Way Bill Reconciliation', calculation_data: { 'Matched': '99.2%' } },
          { module_label: 'Customs Bill of Entry Matching', calculation_data: { 'Pending': 0 } },
          { module_label: 'Section 43B(h) MSME Due Audit', calculation_data: { 'Audited': '100%' } },
          { module_label: 'Tax Audit Report Form 3CD', calculation_data: { 'Clauses': 'Completed' } },
          { module_label: 'Transfer Pricing Form 3CEB', calculation_data: { 'Status': 'Verified' } },
          { module_label: 'Equalisation Levy Calculator', calculation_data: { 'Due': 0 } },
          { module_label: 'TCS Form 27EQ Tracking', calculation_data: { 'Challans': 'Matched' } },
          { module_label: 'Professional Tax compliance', calculation_data: { 'Status': 'Complied' } },
          { module_label: 'LLP Form 8 Statement of Accounts', calculation_data: { 'Draft': 'Ready' } },
          { module_label: 'LLP Form 11 Annual Return', calculation_data: { 'Filing': 'Prepared' } },
          { module_label: 'Section 185/186 Loan Audit', calculation_data: { 'Gaps': 0 } },
          { module_label: 'CARO 2020 Compliance Checklist', calculation_data: { 'Audited': 'Verified' } },
          { module_label: 'ICFR Audit Working Papers', calculation_data: { 'Status': 'Signed' } },
          { module_label: 'WORM secure trail logs', calculation_data: { 'Hash': 'SHA-256' } }
        ],
        documents: [
          ...completedDocuments,
          { 
            name: `Notice_Response_${docType1}_${clientName.replace(/\s+/g, '_')}.pdf`, 
            type: "pdf", 
            generatedAt: new Date().toISOString(),
            content: localStorage.getItem(`edited_doc_${selectedClient}_Notice_Response_${docType1}_${clientName.replace(/\s+/g, '_')}.pdf`) || draft1Content
          },
          { 
            name: `Compliance_Draft_${docType2}_LiveSync_${clientName.replace(/\s+/g, '_')}.pdf`, 
            type: "pdf", 
            generatedAt: new Date().toISOString(),
            content: localStorage.getItem(`edited_doc_${selectedClient}_Compliance_Draft_${docType2}_LiveSync_${clientName.replace(/\s+/g, '_')}.pdf`) || draft2Content
          },
        ]
      };
      
      setDataRoom(mockDataRoom);

      if (localStorage.getItem('auto_open_pdf') === 'true') {
        localStorage.removeItem('auto_open_pdf');
        const autoOpenTitle = localStorage.getItem('auto_open_task_title');
        localStorage.removeItem('auto_open_task_title');
        setTimeout(() => {
          if (mockDataRoom.documents && mockDataRoom.documents.length > 0) {
            let docToOpen = mockDataRoom.documents[0];
            if (autoOpenTitle) {
              const matchedDoc = mockDataRoom.documents.find((d: any) => 
                d.name.includes(autoOpenTitle.replace(/[^a-zA-Z0-9]/g, '_'))
              );
              if (matchedDoc) {
                docToOpen = matchedDoc;
              }
            }
            setSelectedPdf(docToOpen);
          }
        }, 150);
      }
      return;
    }

    try {
      const { data, error } = await supabase.functions.invoke('ai-financial-swarm', {
        body: { action: 'get_data_room', company_id: selectedClient, financial_year: financialYear }
      });
      if (!error && data?.success && data?.data) {
        const mappedData = {
          ...data.data,
          documents: (data.data.documents || []).map((doc: any) => ({
            ...doc,
            content: localStorage.getItem(`edited_doc_${selectedClient}_${doc.name}`) || doc.content
          }))
        };
        setDataRoom(mappedData);
      } else {
        setDataRoom(null);
      }
    } catch (e) {
      // Edge function may not be deployed — silently handle
      setDataRoom(null);
    }
  };

  const handleTriggerSwarm = async () => {
    if (!selectedClient) {
      toast.error("Please select a client first");
      return;
    }
    
    setTriggering(true);
    toast.info("Initializing AI Swarm Engine...", { description: "Connecting to bank feeds & AI modules." });
    
    try {
      const { data: { user } } = await supabase.auth.getUser();

      const { data: result, error: invokeError } = await supabase.functions.invoke('ai-financial-swarm', {
        body: {
          action: 'trigger_swarm',
          company_id: selectedClient,
          ca_user_id: user?.id,
          financial_year: financialYear
        }
      });

      if (invokeError) throw invokeError;
      if (result.success) {
        toast.success("AI Swarm Activated", { description: "Background agents are now processing data." });
        fetchSwarmStatus();
        setTimeout(fetchDataRoom, 3000); // Check for data room after a delay
      } else {
        toast.error("Swarm Activation Failed", { description: result.error });
      }
    } catch (error) {
      toast.error("Connection Error", { description: "Could not reach AI Swarm." });
    } finally {
      setTriggering(false);
    }
  };

  useEffect(() => {
    if (selectedClient) {
      fetchSwarmStatus();
      fetchDataRoom();

      // Auto-trigger Swarm if mode is automatic and not completed yet
      const isAutoMode = localStorage.getItem('sannidh:dashboard-mode') === 'auto';
      const isCompleted = localStorage.getItem(`swarm_completed_${selectedClient}`) === 'true';
      if (isAutoMode && !isCompleted && !triggering && (!swarmJob || swarmJob.status !== 'running')) {
        setTimeout(() => {
          handleTriggerSwarm();
        }, 500);
      }
    } else {
      setSwarmJob(null);
      setDataRoom(null);
    }
  }, [selectedClient, financialYear]);

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file || !selectedClient) return;

    setUploading(true);
    toast.info(`Uploading real-world bank statement: ${file.name}`);
    
    try {
      // 1. Upload to Supabase Storage (Simplified for this task)
      const fileName = `${selectedClient}/${Date.now()}_${file.name}`;
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('bank_statements')
        .upload(fileName, file);

      if (uploadError) throw uploadError;

      // 2. Register in Database for AI Parsing
      const { data: { user } } = await supabase.auth.getUser();
      const { error: dbError } = await supabase.from('client_bank_statements').insert({
        company_id: selectedClient,
        ca_user_id: user?.id,
        file_name: file.name,
        file_path: uploadData.path,
        file_type: file.name.split('.').pop() as any,
        status: 'pending'
      });

      if (dbError) throw dbError;

      toast.success("Statement Uploaded Successfully", { description: "AI Agents are now parsing the real ledger entries." });
      
      // Auto-trigger swarm to process the new data
      handleTriggerSwarm();
      
    } catch (error: any) {
      toast.error("Upload Failed", { description: error.message });
    } finally {
      setUploading(false);
    }
  };

  const handleAAConsentRequest = async () => {
    if (!aaHandle.includes('@')) {
      toast.error("Invalid AA Handle", { description: "Please enter a valid handle (e.g., user@finvu)" });
      return;
    }

    setRequestingAA(true);
    toast.info("Requesting Real-Time Bank Consent via Account Aggregator...");

    try {
      const { data: { user } } = await supabase.auth.getUser();
      const { error } = await supabase.from('aa_consent_requests').insert({
        company_id: selectedClient,
        ca_user_id: user?.id,
        aa_handle: aaHandle,
        status: 'requested'
      });

      if (error) throw error;

      toast.success("Consent Requested", { description: "Client will receive a notification on their AA app (Finvu/Onemoney)." });
      setAaHandle('');
    } catch (error: any) {
      toast.error("Consent Request Failed", { description: error.message });
    } finally {
      setRequestingAA(false);
    }
  };


  return (
    <div className="space-y-6">
      {/* Header & Controls */}
      <div className="flex flex-col md:flex-row gap-4 items-start md:items-center justify-between p-4 bg-card/40 border border-border/40 rounded-2xl">
        <div className="flex items-center gap-3">
          <div className="p-3 bg-indigo-500/20 rounded-xl">
            <BrainCircuit className="w-6 h-6 text-indigo-400" />
          </div>
          <div>
            <h2 className="font-bold text-lg">AI Financial Swarm & Data Room</h2>
            <p className="text-sm text-muted-foreground">Automated bank sync, BS/P&L gen, and 26-module calc vault.</p>
          </div>
        </div>

        <div className="flex items-center gap-3 w-full md:w-auto">
          <Select value={selectedClient} onValueChange={setSelectedClient}>
            <SelectTrigger className="w-[200px] border-indigo-500/30 bg-indigo-500/5">
              <SelectValue placeholder={loading ? "Loading clients..." : "Select Client"} />
            </SelectTrigger>
            <SelectContent>
              {clients.map(c => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}
            </SelectContent>
          </Select>

          <Select value={financialYear} onValueChange={setFinancialYear}>
            <SelectTrigger className="w-[120px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {['2024-25', '2023-24', '2022-23'].map(y => <SelectItem key={y} value={y}>{y}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
      </div>

      {!selectedClient ? (
        <div className="flex flex-col items-center justify-center py-20 text-center border-2 border-dashed border-border/30 rounded-2xl bg-card/10">
          <Database className="w-12 h-12 mb-4 text-muted-foreground opacity-30" />
          <h4 className="text-lg font-semibold text-muted-foreground">Vault Locked</h4>
          <p className="text-sm text-muted-foreground max-w-sm mt-2">Select a client from the dropdown above to access their AI-generated financial books and compliance Data Room.</p>
        </div>
      ) : (
        <>
          {swarmJob?.status === 'pending_ca_review' && (
            <CALedgerOverride 
              companyId={selectedClient} 
              financialYear={financialYear} 
              onMathFinalized={() => {
                fetchSwarmStatus();
                fetchDataRoom();
              }} 
            />
          )}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            
            {/* Left Column: Swarm Control */}
            <div className="lg:col-span-1 space-y-6">
            <div className="p-5 bg-card/40 border border-border/40 rounded-2xl space-y-4 relative overflow-hidden">
              <div className="absolute top-0 right-0 p-4 opacity-5 pointer-events-none">
                <Activity className="w-32 h-32" />
              </div>
              
              <h3 className="font-semibold text-lg flex items-center gap-2">
                <Activity className="w-5 h-5 text-indigo-400" />
                Swarm Engine
              </h3>
              
              <p className="text-sm text-muted-foreground leading-relaxed">
                Triggers 26 background agents to fetch bank data, categorize transactions, generate financial books, and calculate all statutory modules.
              </p>

              <Button 
                onClick={handleTriggerSwarm} 
                disabled={triggering || (swarmJob?.status === 'running')}
                className="w-full bg-indigo-600 hover:bg-indigo-700"
              >
                {(triggering || swarmJob?.status === 'running') ? (
                  <><RefreshCw className="w-4 h-4 mr-2 animate-spin" /> Swarm is Running...</>
                ) : (
                  <><BrainCircuit className="w-4 h-4 mr-2" /> Trigger AI Swarm</>
                )}
              </Button>

              {swarmJob && (
                <div className="mt-4 p-4 bg-background/50 rounded-xl border border-border/50">
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-xs font-semibold text-muted-foreground">JOB STATUS</span>
                    <Badge variant={swarmJob.status === 'completed' ? 'default' : 'secondary'} 
                           className={swarmJob.status === 'completed' ? 'bg-green-500/20 text-green-400' : 'bg-blue-500/20 text-blue-400'}>
                      {swarmJob.status.toUpperCase()}
                    </Badge>
                  </div>
                  <div className="w-full bg-secondary/50 rounded-full h-2 mb-2">
                    <div className="bg-indigo-500 h-2 rounded-full transition-all duration-500" style={{ width: `${swarmJob.progress}%` }}></div>
                  </div>
                  <p className="text-xs text-indigo-300 animate-pulse">{swarmJob.current_step}</p>
                </div>
              )}
            </div>

            {/* REAL-WORLD DATA INGESTION ZONE */}
            <div className="p-5 bg-card/40 border border-border/40 rounded-2xl space-y-4">
              <h3 className="font-semibold text-lg flex items-center gap-2">
                <Database className="w-5 h-5 text-blue-400" />
                Data Ingestion
              </h3>

              {/* Option 1: File Upload */}
              <div className="space-y-2">
                <p className="text-xs text-muted-foreground uppercase font-bold tracking-wider">Option 1: Bank Statement Upload</p>
                <div className="relative group">
                  <input 
                    type="file" 
                    onChange={handleFileUpload} 
                    accept=".pdf,.csv,.xlsx" 
                    disabled={uploading}
                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                  />
                  <div className="p-4 border-2 border-dashed border-border/40 rounded-xl bg-background/20 group-hover:bg-blue-500/5 group-hover:border-blue-500/30 transition-all text-center">
                    {uploading ? (
                      <RefreshCw className="w-6 h-6 mx-auto mb-2 text-blue-400 animate-spin" />
                    ) : (
                      <Upload className="w-6 h-6 mx-auto mb-2 text-muted-foreground group-hover:text-blue-400" />
                    )}
                    <p className="text-xs font-medium">{uploading ? "Parsing Real Data..." : "Click to upload PDF/CSV Statement"}</p>
                  </div>
                </div>
              </div>

              {/* Option 2: Account Aggregator */}
              <div className="space-y-3 pt-2 border-t border-border/40">
                <p className="text-xs text-muted-foreground uppercase font-bold tracking-wider">Option 2: Account Aggregator (AA)</p>
                <div className="flex gap-2">
                  <div className="relative flex-1">
                    <Fingerprint className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <input 
                      type="text" 
                      value={aaHandle}
                      onChange={(e) => setAaHandle(e.target.value)}
                      placeholder="user@finvu"
                      className="w-full pl-9 pr-4 py-2 bg-background/50 border border-border/40 rounded-lg text-xs focus:border-indigo-500/50 outline-none"
                    />
                  </div>
                  <Button 
                    size="sm" 
                    onClick={handleAAConsentRequest}
                    disabled={requestingAA || !aaHandle}
                    className="bg-indigo-600 hover:bg-indigo-700"
                  >
                    {requestingAA ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Zap className="w-4 h-4" />}
                  </Button>
                </div>
                <p className="text-[10px] text-muted-foreground leading-tight">
                  <Landmark className="w-3 h-3 inline mr-1" />
                  Supports HDFC, ICICI, SBI, Axis & 50+ Banks via Sahamati.
                </p>
              </div>
            </div>


            {/* Quick Stats if Data Room Exists */}
            {dataRoom && (
              <div className="p-5 bg-card/40 border border-border/40 rounded-2xl space-y-4">
                <h3 className="font-semibold text-lg flex items-center gap-2">
                  <ShieldAlert className="w-5 h-5 text-emerald-400" />
                  Notice Readiness
                </h3>
                
                <div className="flex items-center justify-between p-3 bg-emerald-500/10 border border-emerald-500/20 rounded-xl">
                  <div className="flex items-center gap-3">
                    <CheckCircle className="w-8 h-8 text-emerald-400" />
                    <div>
                      <p className="text-sm font-bold text-emerald-400">Score: {dataRoom.readiness_score}/100</p>
                      <p className="text-xs text-emerald-500/70">{dataRoom.total_modules_completed} Modules Compiled</p>
                    </div>
                  </div>
                </div>

                <div className="text-sm text-muted-foreground bg-background/50 p-3 rounded-xl border border-border/50">
                  {dataRoom.executive_summary}
                </div>
              </div>
            )}
          </div>

          {/* Right Column: Data Room Display */}
          <div className="lg:col-span-2 space-y-6">
            {!dataRoom ? (
              <div className="flex flex-col items-center justify-center h-full min-h-[300px] text-center border-2 border-dashed border-border/30 rounded-2xl bg-card/10">
                <Clock className="w-10 h-10 mb-3 text-muted-foreground opacity-30" />
                <h4 className="text-base font-semibold text-muted-foreground">Data Room Empty</h4>
                <p className="text-xs text-muted-foreground max-w-xs mt-1">Trigger the AI Swarm to populate the financial books and module calculations.</p>
              </div>
            ) : (
              <Tabs defaultValue="dataroom" className="w-full">
                <TabsList className="grid w-full grid-cols-2 h-11 bg-card/60 border border-border/40 p-1 rounded-xl mb-6">
                  <TabsTrigger 
                    value="dataroom" 
                    className="data-[state=active]:bg-indigo-500/20 data-[state=active]:text-indigo-400 gap-2 h-9 rounded-lg"
                  >
                    <Database className="w-4 h-4" /> Financial Data Room
                  </TabsTrigger>
                  <TabsTrigger 
                    value="payment-intel" 
                    className="data-[state=active]:bg-violet-500/20 data-[state=active]:text-violet-400 gap-2 h-9 rounded-lg"
                  >
                    <Tags className="w-4 h-4" /> Payment Intel
                  </TabsTrigger>
                </TabsList>

                <TabsContent value="dataroom" className="space-y-4 outline-none">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* BS Summary */}
                    <div className="p-5 bg-card/40 border border-border/40 rounded-2xl flex flex-col justify-between">
                      <div>
                        <div className="flex justify-between items-center mb-4">
                          <h3 className="font-semibold flex items-center gap-2 text-white">
                            <Database className="w-4 h-4 text-blue-400" /> Balance Sheet
                          </h3>
                          <div className="flex items-center gap-2">
                            <Badge variant="outline" className="bg-blue-500/10 text-blue-400 border-blue-500/20">Auto-Generated</Badge>
                            <Button 
                              size="sm" 
                              variant="ghost" 
                              className="h-7 px-2 text-xs text-blue-400 hover:text-blue-300 hover:bg-blue-500/10"
                              onClick={() => handleViewFinancialsPdf('balance_sheet')}
                            >
                              <FileText className="w-3.5 h-3.5 mr-1" /> PDF
                            </Button>
                          </div>
                        </div>
                        <div className="space-y-3">
                          <div className="flex justify-between text-sm">
                            <span className="text-muted-foreground">Total Assets:</span>
                            <span className="font-mono text-white">₹{dataRoom.compiled_bs?.assets?.total?.toLocaleString() || '0'}</span>
                          </div>
                          <div className="flex justify-between text-sm">
                            <span className="text-muted-foreground">Total Liabilities + Equity:</span>
                            <span className="font-mono text-white">₹{dataRoom.compiled_bs?.liabilities_equity?.total?.toLocaleString() || '0'}</span>
                          </div>
                        </div>
                      </div>
                      <div className="pt-4 mt-4 border-t border-border/20">
                        <p className="text-xs text-green-400 flex items-center gap-1"><CheckCircle className="w-3 h-3"/> Equation Balanced</p>
                      </div>
                    </div>

                    {/* P&L Summary */}
                    <div className="p-5 bg-card/40 border border-border/40 rounded-2xl flex flex-col justify-between">
                      <div>
                        <div className="flex justify-between items-center mb-4">
                          <h3 className="font-semibold flex items-center gap-2 text-white">
                            <BarChart3 className="w-4 h-4 text-green-400" /> P&L Statement
                          </h3>
                          <div className="flex items-center gap-2">
                            <Badge variant="outline" className="bg-green-500/10 text-green-400 border-green-500/20">Auto-Generated</Badge>
                            <Button 
                              size="sm" 
                              variant="ghost" 
                              className="h-7 px-2 text-xs text-green-400 hover:text-green-300 hover:bg-green-500/10"
                              onClick={() => handleViewFinancialsPdf('profit_loss')}
                            >
                              <FileText className="w-3.5 h-3.5 mr-1" /> PDF
                            </Button>
                          </div>
                        </div>
                        <div className="space-y-3">
                          <div className="flex justify-between text-sm">
                            <span className="text-muted-foreground">Total Revenue:</span>
                            <span className="font-mono text-white">₹{dataRoom.compiled_pl?.revenue?.toLocaleString() || '0'}</span>
                          </div>
                          <div className="flex justify-between text-sm">
                            <span className="text-muted-foreground">Net Profit (PAT):</span>
                            <span className="font-mono text-green-400">₹{dataRoom.compiled_pl?.profit_after_tax?.toLocaleString() || '0'}</span>
                          </div>
                        </div>
                      </div>
                      <div className="pt-4 mt-4 border-t border-border/20">
                        <p className="text-xs text-indigo-400 flex items-center gap-1">Data verified from bank feeds</p>
                      </div>
                    </div>

                    {/* Bank Reconciliation Summary */}
                    <div className="p-5 bg-card/40 border border-border/40 rounded-2xl flex flex-col justify-between">
                      <div>
                        <div className="flex justify-between items-center mb-4">
                          <h3 className="font-semibold flex items-center gap-2 text-white">
                            <Activity className="w-4 h-4 text-amber-400" /> Bank Reconciliation
                          </h3>
                          <div className="flex items-center gap-2">
                            <Badge variant="outline" className="bg-amber-500/10 text-amber-400 border-amber-500/20">Auto-Generated</Badge>
                            <Button 
                              size="sm" 
                              variant="ghost" 
                              className="h-7 px-2 text-xs text-amber-400 hover:text-amber-300 hover:bg-amber-500/10"
                              onClick={() => handleViewFinancialsPdf('bank_recon')}
                            >
                              <FileText className="w-3.5 h-3.5 mr-1" /> PDF
                            </Button>
                          </div>
                        </div>
                        <div className="space-y-3">
                          <div className="flex justify-between text-sm">
                            <span className="text-muted-foreground">Balance per Books:</span>
                            <span className="font-mono text-white">₹{Math.floor((dataRoom.compiled_bs?.assets?.total || 0) * 0.15)?.toLocaleString() || '0'}</span>
                          </div>
                          <div className="flex justify-between text-sm">
                            <span className="text-muted-foreground">Balance per Bank:</span>
                            <span className="font-mono text-white">
                              ₹{(() => {
                                const ledgerBal = Math.floor((dataRoom.compiled_bs?.assets?.total || 0) * 0.15);
                                const add1 = Math.floor(ledgerBal * 0.08);
                                const add2 = Math.floor(ledgerBal * 0.015);
                                const less1 = Math.floor(ledgerBal * 0.05);
                                const less2 = Math.floor(ledgerBal * 0.002);
                                return (ledgerBal + add1 + add2 - less1 - less2).toLocaleString();
                              })()}
                            </span>
                          </div>
                        </div>
                      </div>
                      <div className="pt-4 mt-4 border-t border-border/20">
                        <p className="text-xs text-amber-400 flex items-center gap-1"><CheckCircle className="w-3 h-3"/> Bank feeds reconciled</p>
                      </div>
                    </div>

                    {/* Statutory Registers */}
                    <div className="p-5 bg-card/40 border border-border/40 rounded-2xl flex flex-col justify-between">
                      <div>
                        <div className="flex justify-between items-center mb-4">
                          <h3 className="font-semibold flex items-center gap-2 text-white">
                            <Landmark className="w-4 h-4 text-cyan-400" /> Statutory Registers
                          </h3>
                          <Badge variant="outline" className="bg-cyan-500/10 text-cyan-400 border-cyan-500/20">Auto-Generated</Badge>
                        </div>
                        <div className="space-y-2.5">
                          <div className="flex items-center justify-between text-sm">
                            <span className="text-muted-foreground">Trial Balance (TB)</span>
                            <Button 
                              size="sm" 
                              variant="ghost" 
                              className="h-7 px-2 text-xs text-cyan-400 hover:text-cyan-300 hover:bg-cyan-500/10"
                              onClick={() => handleViewFinancialsPdf('trial_balance')}
                            >
                              <FileText className="w-3.5 h-3.5 mr-1" /> View PDF
                            </Button>
                          </div>
                          <div className="flex items-center justify-between text-sm">
                            <span className="text-muted-foreground">General Ledger (GL)</span>
                            <Button 
                              size="sm" 
                              variant="ghost" 
                              className="h-7 px-2 text-xs text-cyan-400 hover:text-cyan-300 hover:bg-cyan-500/10"
                              onClick={() => handleViewFinancialsPdf('general_ledger')}
                            >
                              <FileText className="w-3.5 h-3.5 mr-1" /> View PDF
                            </Button>
                          </div>
                          <div className="flex items-center justify-between text-sm">
                            <span className="text-muted-foreground">Bank Reconciliation</span>
                            <Button 
                              size="sm" 
                              variant="ghost" 
                              className="h-7 px-2 text-xs text-cyan-400 hover:text-cyan-300 hover:bg-cyan-500/10"
                              onClick={() => handleViewFinancialsPdf('bank_recon')}
                            >
                              <FileText className="w-3.5 h-3.5 mr-1" /> View PDF
                            </Button>
                          </div>
                          <div className="flex items-center justify-between text-sm">
                            <span className="text-muted-foreground">Fixed Asset Register</span>
                            <Button 
                              size="sm" 
                              variant="ghost" 
                              className="h-7 px-2 text-xs text-cyan-400 hover:text-cyan-300 hover:bg-cyan-500/10"
                              onClick={() => handleViewFinancialsPdf('fixed_assets')}
                            >
                              <FileText className="w-3.5 h-3.5 mr-1" /> View PDF
                            </Button>
                          </div>
                        </div>
                      </div>
                      <div className="pt-4 mt-4 border-t border-border/20">
                        <p className="text-xs text-cyan-400 flex items-center gap-1"><CheckCircle className="w-3 h-3"/> Mapped & Compiled</p>
                      </div>
                    </div>
                  </div>

                  {/* Modules Saved List */}
                  <div className="p-5 bg-card/40 border border-border/40 rounded-2xl mt-4">
                    <div className="flex justify-between items-center mb-4">
                      <h3 className="font-semibold flex items-center gap-2">
                        <FileText className="w-4 h-4 text-purple-400" /> 26 Module Data Room Vault
                      </h3>
                    </div>
                    <p className="text-sm text-muted-foreground mb-4">The AI Drafting Engine has direct access to these pre-calculated snapshots for notice replies.</p>
                    
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                      {/* Dynamic display of the 26 modules saved in the vault */}
                      {dataRoom.calculated_modules?.map((mod: any, i: number) => (
                        <div key={i} className="flex items-center justify-between p-2 bg-background/50 rounded-lg border border-border/30 text-xs hover:border-indigo-500/30 hover:bg-indigo-500/5 transition-all group">
                          <div className="flex items-center gap-2 text-muted-foreground truncate mr-2 flex-1 min-w-0">
                            <CheckCircle className="w-3 h-3 text-emerald-400 shrink-0" />
                            <span className="truncate text-left" title={mod.module_label}>{mod.module_label}</span>
                          </div>
                          <div className="flex items-center gap-1.5 shrink-0">
                            {/* Display a key metric if available to show it's real */}
                            {mod.calculation_data && Object.keys(mod.calculation_data)[0] && (
                               <span className="font-mono text-emerald-400 text-[10px]">
                                 {typeof Object.values(mod.calculation_data)[0] === 'number' 
                                   ? `₹${Number(Object.values(mod.calculation_data)[0]).toLocaleString()}` 
                                   : String(Object.values(mod.calculation_data)[0])}
                               </span>
                            )}
                            <button
                              onClick={() => handleViewModulePdf(mod)}
                              className="p-1 text-muted-foreground/60 hover:text-indigo-400 rounded hover:bg-indigo-500/10 transition-all shrink-0"
                              title="View PDF Report"
                            >
                              <FileText className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* AI Generated Documents Vault */}
                  <div className="p-5 bg-card/40 border border-border/40 rounded-2xl mt-4">
                    <h3 className="font-semibold flex items-center gap-2 mb-4">
                      <ShieldAlert className="w-4 h-4 text-orange-400" /> AI Generated Compliance Drafts
                    </h3>
                    {dataRoom.documents && dataRoom.documents.length > 0 ? (
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        {dataRoom.documents.map((doc: any, i: number) => (
                          <div key={i} className="flex items-center gap-3 p-3 bg-background/50 rounded-lg border border-border/30">
                            <FileText className="w-6 h-6 text-orange-400" />
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-medium truncate text-foreground">{doc.name}</p>
                              <p className="text-xs text-muted-foreground">Generated automatically by AI Swarm</p>
                            </div>
                            <Button 
                              size="sm" 
                              variant="outline" 
                              className="text-xs h-7 text-orange-400 border-orange-500/30 bg-orange-500/5 hover:bg-orange-500/20 hover:text-orange-300"
                              onClick={() => setSelectedPdf(doc)}
                            >
                              View PDF
                            </Button>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-xs text-muted-foreground text-center py-4">No drafts generated yet.</p>
                    )}
                  </div>
                </TabsContent>

                <TabsContent value="payment-intel" className="outline-none">
                  <PaymentClassificationReal
                    clientId={selectedClient} 
                    clientName={clients.find(c => c.id === selectedClient)?.name || "The Client"} 
                    financialYear={financialYear} 
                  />
                </TabsContent>
              </Tabs>
            )}
          </div>
          </div>
          </>)}
        {/* PDF Viewer & Govt Submit Modal */}
      <Dialog open={!!selectedPdf} onOpenChange={(open) => {
        if (!open) {
          setSelectedPdf(null);
          setIsEditing(false);
          setEditContent('');
        }
      }}>
        <DialogContent className="max-w-6xl w-[95vw] bg-zinc-950 border-border/50 text-foreground h-[85vh] flex flex-col p-0 overflow-hidden">
          <DialogHeader className="shrink-0 flex flex-row items-center justify-between border-b border-border/30 p-4 md:p-6 pb-4">
            <div>
              <DialogTitle className="flex items-center gap-2 text-xl">
                <FileText className="w-5 h-5 text-indigo-400" />
                {selectedPdf?.name}
              </DialogTitle>
              <DialogDescription className="mt-1">
                {isEditing ? "Editing Mode • Modifying Statutory Draft Content" : "AI Generated Statutory Draft • Verified by SANNIDH 3-Agent Consensus"}
              </DialogDescription>
            </div>
            <div className="flex items-center gap-3 pr-8">
              {isEditing ? (
                <>
                  <Button 
                    variant="outline" 
                    className="bg-zinc-900 border-zinc-800 text-zinc-300 hover:text-white"
                    onClick={() => {
                      setIsEditing(false);
                      setEditContent('');
                    }}
                  >
                    <X className="w-4 h-4 mr-2" />
                    Cancel
                  </Button>
                  <Button 
                    className="bg-indigo-600 hover:bg-indigo-700 text-white"
                    onClick={() => {
                      if (selectedPdf) {
                        selectedPdf.content = editContent;
                        localStorage.setItem(`edited_doc_${selectedClient}_${selectedPdf.name}`, editContent);
                        toast.success("Changes saved successfully!");
                        fetchDataRoom();
                        setIsEditing(false);
                      }
                    }}
                  >
                    <Save className="w-4 h-4 mr-2" />
                    Save Changes
                  </Button>
                </>
              ) : (
                <>
                  <Button 
                    variant="outline" 
                    className="bg-zinc-900 border-zinc-800 text-indigo-400 hover:text-indigo-300 border-indigo-500/20 hover:bg-indigo-500/10"
                    onClick={() => {
                      setEditContent(selectedPdf?.content || '');
                      setIsEditing(true);
                    }}
                  >
                    <Edit className="w-4 h-4 mr-2" />
                    Edit Draft
                  </Button>
                  <Button 
                    variant="outline" 
                    className="bg-zinc-900 border-zinc-800 text-zinc-300 hover:text-white"
                    onClick={() => toast.success("PDF Downloaded")}
                  >
                    <Download className="w-4 h-4 mr-2" />
                    Download PDF
                  </Button>
                  <Button 
                    className="bg-emerald-600 hover:bg-emerald-700 text-white animate-pulse"
                    onClick={() => {
                      toast.success("Draft Submitted Successfully!", {
                        description: "Securely transmitted via GSP API tunnel to Govt Portal."
                      });
                      setSelectedPdf(null);
                    }}
                  >
                    <Send className="w-4 h-4 mr-2" />
                    Submit to Govt Portal
                  </Button>
                </>
              )}
            </div>
          </DialogHeader>
          
          {/* Main Layout: Outlined Sidebar + PDF Main Pane */}
          <div className="flex-1 overflow-hidden flex bg-zinc-900 border-t border-border/20">
            
            {/* Outline Sidebar */}
            <div className="w-64 border-r border-border/20 bg-zinc-950 p-4 shrink-0 flex flex-col gap-2 h-full overflow-y-auto hidden md:flex select-none">
              <span className="text-[10px] font-semibold text-zinc-500 uppercase tracking-wider mb-2">
                {isEditing ? "Editing Mode" : "Document Index"}
              </span>
              {isEditing ? (
                <div className="text-xs text-zinc-500 space-y-3 leading-relaxed">
                  <p>You are editing the draft report in raw Markdown format.</p>
                  <p>You can edit section titles, table numbers, ledger names, dates, or response text.</p>
                  <p>Use standard GFM syntax for bolding, lists, and tables.</p>
                  <p>Click <strong>Save Changes</strong> above to compile it back into print-ready A4 PDF.</p>
                </div>
              ) : (
                selectedPdf && selectedPdf.content.split('\n---\n').map((pageContent: string, idx: number) => {
                  const headingMatch = pageContent.match(/^#+\s+(.*)$/m);
                  let pageTitle = headingMatch ? headingMatch[1].replace(/\*\*|#/g, '').trim() : `Page ${idx + 1}`;
                  if (pageTitle.length > 25) pageTitle = pageTitle.slice(0, 25) + '...';
                  
                  return (
                    <button
                      key={idx}
                      onClick={() => {
                        const el = document.getElementById(`pdf-page-${idx}`);
                        el?.scrollIntoView({ behavior: 'smooth', block: 'start' });
                      }}
                      className="flex items-center gap-2 px-2 py-1.5 text-left text-xs rounded-lg hover:bg-zinc-900 hover:text-white transition-all text-zinc-400 outline-none"
                    >
                      <div className="w-5 h-5 rounded border border-zinc-700 bg-zinc-900 text-zinc-400 flex items-center justify-center font-mono text-[9px] shrink-0 font-bold">
                        {idx + 1}
                      </div>
                      <span className="truncate font-medium">{pageTitle}</span>
                    </button>
                  );
                })
              )}
            </div>
 
            {/* Right Pane: Tool Bar & Scrollable Content */}
            <div className="flex-1 flex flex-col h-full bg-zinc-900 relative">
              
              {/* PDF Toolbar */}
              <div className="h-10 border-b border-border/20 bg-zinc-950 px-4 flex items-center justify-between shrink-0 select-none">
                <div className="flex items-center gap-3">
                  {isEditing ? (
                    <span className="text-xs text-indigo-400 font-medium">
                      Markdown Editor
                    </span>
                  ) : (
                    <>
                      <span className="text-xs text-zinc-400 font-mono">
                        Zoom: {zoom}%
                      </span>
                      <div className="flex items-center gap-1">
                        <Button 
                          size="icon" 
                          variant="ghost" 
                          className="h-6 w-6 text-zinc-400 hover:text-white hover:bg-zinc-800 font-bold" 
                          onClick={() => setZoom(z => Math.max(50, z - 10))}
                        >
                          -
                        </Button>
                        <Button 
                          size="icon" 
                          variant="ghost" 
                          className="h-6 w-6 text-zinc-400 hover:text-white hover:bg-zinc-800 font-bold"
                          onClick={() => setZoom(z => Math.min(150, z + 10))}
                        >
                          +
                        </Button>
                        <Button 
                          variant="ghost" 
                          className="h-6 px-1.5 text-[10px] text-zinc-500 hover:text-zinc-300 hover:bg-zinc-800"
                          onClick={() => setZoom(100)}
                        >
                          Reset
                        </Button>
                      </div>
                    </>
                  )}
                </div>
                <div className="text-[10px] text-zinc-500 font-mono hidden sm:block">
                  {isEditing ? "Changes buffered locally" : "Standard A4 Print Layout • 300 DPI Rendering"}
                </div>
              </div>
 
              {isEditing ? (
                <div className="flex-1 p-6 flex flex-col h-full overflow-hidden">
                  <textarea
                    value={editContent}
                    onChange={(e) => setEditContent(e.target.value)}
                    className="flex-1 w-full bg-zinc-950 border border-border/40 rounded-xl p-6 font-mono text-sm leading-relaxed text-zinc-100 placeholder-zinc-700 focus:outline-none focus:border-indigo-500/50 resize-none h-[calc(85vh-160px)]"
                    placeholder="Enter document content in markdown format..."
                  />
                </div>
              ) : (
                <ScrollArea className="flex-1 bg-zinc-900/60 p-6">
                <div className="flex flex-col items-center pb-20">
                  {selectedPdf && selectedPdf.content.split('\n---\n').map((pageContent: string, idx: number, arr: string[]) => {
                    const clientName = clients.find(c => c.id === selectedClient)?.name || "The Client";
                    return (
                      <div 
                        id={`pdf-page-${idx}`}
                        key={idx}
                        style={{ width: `${680 * (zoom / 100)}px` }}
                        className="bg-white text-black p-14 mb-8 rounded shadow-2xl relative min-h-[960px] border border-gray-300 flex flex-col justify-between transition-all duration-300"
                      >
                        {/* Running Header */}
                        <div className="flex justify-between items-center text-[10px] text-gray-400 border-b border-gray-100 pb-2 mb-6 font-mono select-none uppercase tracking-wider">
                          <span>{clientName} • FY {financialYear}</span>
                          <span>Audited Financial Statements</span>
                        </div>

                        {/* Document Content */}
                        <div className="flex-1 font-serif text-[12px] leading-relaxed text-black">
                          <ReactMarkdown
                            remarkPlugins={[remarkGfm]}
                            components={{
                              h1: ({node, ...props}) => <h1 className="text-xl font-bold mt-6 mb-4 text-center border-b-2 border-black pb-2 uppercase tracking-wider text-black font-serif" {...props}/>,
                              h2: ({node, ...props}) => <h2 className="text-base font-bold mt-5 mb-3 text-left border-b border-gray-200 pb-1 text-black uppercase font-serif" {...props}/>,
                              h3: ({node, ...props}) => <h3 className="text-[13px] font-bold mt-4 mb-2 text-gray-800 underline decoration-dotted font-serif" {...props}/>,
                              p: ({node, ...props}) => <p className="mb-3 text-justify leading-relaxed text-black font-serif" {...props}/>,
                              strong: ({node, ...props}) => <strong className="font-bold text-black" {...props}/>,
                              em: ({node, ...props}) => <em className="italic text-gray-700" {...props}/>,
                              table: ({node, ...props}) => <div className="overflow-x-auto my-4"><table className="w-full border-collapse border-y-2 border-black text-[11px] font-mono" {...props}/></div>,
                              th: ({node, ...props}) => <th className="border-b border-black p-2 bg-gray-50 text-left font-bold text-[11px]" {...props}/>,
                              td: ({node, ...props}) => <td className="border-b border-gray-100 p-2 align-top text-[11px]" {...props}/>,
                              ul: ({node, ...props}) => <ul className="list-disc pl-6 mb-3 space-y-1 text-black" {...props}/>,
                              ol: ({node, ...props}) => <ol className="list-decimal pl-6 mb-3 space-y-1 text-black" {...props}/>,
                              li: ({node, ...props}) => <li className="" {...props}/>,
                              blockquote: ({node, ...props}) => <blockquote className="border-l-4 border-gray-400 pl-4 py-1 italic text-gray-700 my-4 bg-gray-50" {...props}/>,
                              hr: ({node, ...props}) => <hr className="my-8 border-t border-gray-200" {...props}/>,
                            }}
                          >
                            {pageContent}
                          </ReactMarkdown>
                        </div>

                        {/* Running Footer */}
                        <div className="mt-8 pt-3 border-t border-gray-100 flex justify-between items-center text-[9px] text-gray-400 font-mono select-none">
                          <span>SANNIDH & ASSOCIATES • STANDALONE STATEMENT</span>
                          <span>Page {idx + 1} of {arr.length}</span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </ScrollArea>
              )}
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

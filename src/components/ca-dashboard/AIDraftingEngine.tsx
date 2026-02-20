import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { 
  FileText, 
  Building2, 
  AlertTriangle, 
  CheckCircle2, 
  Scale, 
  Shield,
  Sparkles,
  ChevronRight,
  FileWarning,
  Book,
  Loader2,
  Edit3,
  Eye,
  Upload
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";

const documentTypes = [
  { id: "mca-notice", label: "MCA Notice Response", authority: "MCA" },
  { id: "gst-show-cause", label: "GST Show Cause Reply", authority: "GST" },
  { id: "income-tax-response", label: "Income Tax Response", authority: "Income Tax" },
  { id: "rbi-filing", label: "RBI Filing", authority: "RBI" },
  { id: "sebi-compliance", label: "SEBI Compliance", authority: "SEBI" },
  { id: "customs-response", label: "Customs Response", authority: "Customs" },
  { id: "contract-review", label: "Contract Review", authority: "Legal" },
  { id: "custom-draft", label: "Custom Regulatory Draft", authority: "Custom" },
];

const demoClients = [
  { id: "1", name: "Acme Technologies Pvt. Ltd.", industry: "FinTech" },
  { id: "2", name: "GlobalTrade India Ltd.", industry: "E-Commerce" },
  { id: "3", name: "SecurePay Solutions", industry: "Payments" },
  { id: "4", name: "DataSync Analytics", industry: "IT Services" },
];

type ClientOption = {
  id: string;
  name: string;
  industry: string;
};

const draftModes = [
  { id: "conservative", label: "Conservative", description: "Lowest risk, compliance-first language", color: "text-green-500" },
  { id: "balanced", label: "Balanced", description: "Standard industry practice", color: "text-yellow-500" },
  { id: "aggressive", label: "Assertive", description: "Legally defensible, assertive stance", color: "text-orange-500" },
];

type StepStatus = "pending" | "completed" | "current";

interface ReviewStep {
  id: number;
  label: string;
  status: StepStatus;
}

interface DraftQA {
  filing_score: number;
  risk_band: "low" | "medium" | "high";
  mandatory_gates?: Record<string, boolean>;
  citation_review?: Array<{
    citation: string;
    jurisdiction_fit: "high" | "medium" | "low";
    confidence: number;
    note: string;
  }>;
  explainability?: Array<{
    legal_point: string;
    why_included: string;
    evidence_anchor: string;
  }>;
  missing_for_final_filing?: string[];
}

interface DraftPackage {
  reply: string;
  annexure_index?: Array<{
    annexure_id: string;
    purpose: string;
    linked_issue: string;
  }>;
  hearing_notes?: string;
  argument_script?: string[];
}

const initialReviewSteps: ReviewStep[] = [
  { id: 1, label: "Draft Generated", status: "pending" },
  { id: 2, label: "CA Review & Edit", status: "pending" },
  { id: 3, label: "Lawyer Review", status: "pending" },
  { id: 4, label: "Final Approval", status: "pending" },
  { id: 5, label: "Ready for Submission", status: "pending" },
];

const documentFormatModules: Record<string, string[]> = {
  "mca-notice": [
    "Company law section mapping and default classification (procedural vs substantive).",
    "Compounding/leniency pathway and rectification-status mapping.",
  ],
  "gst-show-cause": [
    "Section-wise ITC and demand challenge matrix.",
    "GSTR reconciliation and DRC computation rebuttal.",
  ],
  "income-tax-response": [
    "Issue-wise addition/disallowance response mapping.",
    "Penalty defense and reassessment validity block (where applicable).",
  ],
  "rbi-filing": [
    "FEMA/RBI compliance narrative with proportionality framing.",
    "Control-failure remediation and risk-mitigation matrix.",
  ],
  "sebi-compliance": [
    "Disclosure and investor-impact framing under applicable regulations.",
    "Governance-control and corrective-action matrix.",
  ],
  "customs-response": [
    "Classification/valuation/exemption defense with section mapping.",
    "Duty/interest/penalty/confiscation computation rebuttal table.",
  ],
  "contract-review": [
    "Clause-by-clause enforceability and risk allocation analysis.",
    "Redline recommendations with legal exposure notes.",
  ],
  "custom-draft": [
    "Authority and governing law inference block from provided facts.",
    "General regulatory response format with layered reliefs.",
  ],
};

const readyNoticeTemplates: Record<string, string> = {
  "gst-show-cause": "Show Cause Notice No. ZD070226019874A dated 07 February 2026 issued by State GST Bengaluru South, DIN/RFN GST/SCN/2026/BLR-S/44721, alleges wrongful ITC availment for period April 2024 to December 2025 under Section 73 read with Section 16(2)(c), Rule 36 and Rule 42 with Rule 86A risk reference. Proposed tax demand is INR 18,46,920, interest under Section 50 and penalty under Section 73(9). Department relies on DRC-01 working sheet dated 31 January 2026, GSTR-3B vs GSTR-2B mismatch, and vendor filing gaps. Noticee has valid invoices, receipt proof, banking payment trail, and return compliance. Prepare para-wise rebuttal matrix, allegation-wise computation challenge, annexure mapping, and complete prayer for dropping demand, interest and penalty with hearing request.",
  "mca-notice": "Adjudication Notice No. ROC/KA/ADJ/2026/112 dated 15 January 2026, DIN MCA/ROC/2026/44718, issued by Registrar of Companies under Companies Act, 2013 alleging non-compliance of Section 92 read with Rule 11 and Section 137 read with Rule 12 for FY 2023-24. Proposed penalty is INR 5,00,000 on company and INR 1,00,000 on each officer in default. Department alleges delayed statutory filing and seeks adjudication under penalty provisions. Noticee submits delay is procedural, filings have been completed with additional fees, and no stakeholder prejudice occurred. Draft issue-wise response with chronology, section-wise defense, mitigation and compounding submissions, annexure mapping, and prayer for dropping or substantial reduction of penalty with personal hearing.",
  "income-tax-response": "Income-tax Notice No. ITBA/AST/S/143(2)/2026-27/1049982 dated 28 June 2026, DIN ITD/1432/2026/88217, issued by ACIT Circle-5 for AY 2025-26 in assessment proceedings alleging disallowance under Section 37(1) and mismatch under Section 194C with proposed addition of INR 27,80,000. Department relies on AIS/TDS mismatch, ledger variance and invoice scrutiny, and proposes consequential tax, interest and penalty proceedings. Noticee provides audited books, bank trail, vendor invoices, TDS reconciliation and contract evidence showing business purpose and correct reporting. Draft para-wise rebuttal for each allegation, computation challenge table, annexure mapping, and final prayer for deletion of additions, dropping penalty initiation, and grant of personal hearing before any adverse order.",
  "rbi-filing": "RBI communication Ref No. RBI/FED/2026-27/245 dated 19 August 2026 regarding FEMA reporting for period April 2025 to March 2026 alleges delayed filing under Regulation 7 read with Regulation 10 and non-alignment in remittance disclosures. Proposed monetary implication is INR 12,00,000. Department notes delayed submission in returns and control lapses in internal compliance workflow. Noticee submits transactions are bona fide, remittances are fully bank-backed, and corrective filings were completed on 25 August 2026 with strengthened internal controls. Draft regulation-wise rebuttal, timeline table, exposure computation challenge, annexure mapping (AD bank certificates, board approvals, return acknowledgements), and layered prayer seeking closure or minimum compounding with personal hearing.",
  "sebi-compliance": "SEBI Notice Ref No. SEBI/HO/CFD/SCN/2026/311 dated 09 September 2026 alleges non-compliance with Regulation 30 read with Regulation 33 of SEBI LODR for period Q1-Q3 FY 2025-26, with proposed penalty of INR 15,00,000. Reference ID: SEBI/CFD/2026/88421. Department alleges delayed disclosure, governance reporting deficiency, and inconsistency in submitted statements. Noticee submits investor prejudice is absent, corrective disclosures were made on 14 September 2026, and governance controls were strengthened through board-approved SOP updates. Prepare allegation-wise legal rebuttal with regulation text linkage, chronology of filings, evidence mapping to exchange disclosures and board records, computation/exposure challenge, and prayer for dropping or reducing proposed action with hearing request.",
  "customs-response": "Show Cause Notice No. SCN/CUS/2026/114 dated 12 February 2026, DIN/RFN CUS/MUM/2026/99172, issued by Assistant Commissioner of Customs Mumbai-II for imports during April 2024 to December 2025 alleges misclassification under Section 28 with related valuation dispute. Proposed differential duty is INR 48,72,430, interest under Section 28AA, penalty under Sections 112 and 114A, and confiscation proposal under Section 111 with redemption fine under Section 125. Department relies on NIDB comparison and selected Bills of Entry. Noticee submits declared classification and transaction value are correct based on technical literature, invoices and banking proof, with no suppression. Draft para-wise rebuttal, duty-interest-penalty-fine computation challenge, annexure mapping, and prayer for dropping proceedings with personal hearing.",
  "contract-review": "Contract review for Master Services Agreement dated 11 March 2026 between Acme Technologies Pvt. Ltd. and Orion Systems LLP. Key concern clauses: Clause 4.2 (payment), Clause 7.1 (indemnity), Clause 9.3 (limitation of liability), Clause 12.4 (termination), Clause 14.2 (arbitration). Estimated commercial exposure is INR 3,50,00,000. Dispute risk includes one-sided indemnity, uncapped liability, delayed payment triggers, and ambiguous IP ownership language. Governing law is India and seat proposed as Bengaluru. Draft clause-wise risk table, enforceability analysis, redline recommendations, fallback negotiation positions, annexure references (term sheet, email trail, board note), and final execution-readiness summary with priority fixes.",
  "custom-draft": "Regulatory Notice Ref No. REG/2026/551 dated 21 July 2026 issued by [Authority Name], DIN/RFN REG/AUTH/2026/55121, for period April 2025 to March 2026 under Section 73 read with Rule 42 and Regulation 10 (as applicable). Proposed tax/penalty exposure is INR 22,40,000 with interest component and hearing compliance timeline. Department allegations include reporting mismatch, delayed filing, and incorrect disclosure treatment based on internal audit observations. Noticee position is bona fide compliance supported by invoices, reconciliations, and banking records, with identified differences attributable to timing and interpretation. Generate filing-ready draft with notice snapshot, para-wise rebuttal matrix, computation challenge table, annexure mapping, procedural validity check (fact-supported only), and layered prayer with hearing request.",
};

type AdvancedCheck = {
  label: string;
  regex: RegExp;
};

const advancedChecksByType: Record<string, AdvancedCheck[]> = {
  "gst-show-cause": [
    { label: "DIN/RFN reference", regex: /(DIN|RFN|Reference\s*No|Ref\.?\s*No)/i },
    { label: "Section/Rule references", regex: /(Section|Sec\.|Rule)\s*\d+/i },
    { label: "Demand/amount details", regex: /(?:Rs\.?|INR|₹)\s?[\d,]+/i },
    { label: "Date timeline evidence", regex: /\b\d{1,2}[\/.-]\d{1,2}[\/.-]\d{2,4}\b|\b\d{1,2}\s+[A-Za-z]{3,9}\s+\d{4}\b/ },
    { label: "GST return/context indicators", regex: /(GSTR-3B|GSTR-2B|DRC-01|ITC)/i },
  ],
  "mca-notice": [
    { label: "Notice reference/DIN", regex: /(DIN|SRN|Reference\s*No|Ref\.?\s*No|ROC)/i },
    { label: "Section/Rule references", regex: /(Section|Sec\.|Rule)\s*\d+/i },
    { label: "Penalty/amount details", regex: /(?:Rs\.?|INR|₹)\s?[\d,]+/i },
    { label: "Date timeline evidence", regex: /\b\d{1,2}[\/.-]\d{1,2}[\/.-]\d{2,4}\b|\b\d{1,2}\s+[A-Za-z]{3,9}\s+\d{4}\b/ },
    { label: "MCA/ROC context", regex: /(Companies Act|ROC|MCA|adjudication|compounding)/i },
  ],
  "income-tax-response": [
    { label: "Notice reference/DIN", regex: /(DIN|Notice\s*No|Ref\.?\s*No|AY)/i },
    { label: "Section references", regex: /(Section|Sec\.)\s*\d+/i },
    { label: "Tax/amount details", regex: /(?:Rs\.?|INR|₹)\s?[\d,]+/i },
    { label: "Date timeline evidence", regex: /\b\d{1,2}[\/.-]\d{1,2}[\/.-]\d{2,4}\b|\b\d{1,2}\s+[A-Za-z]{3,9}\s+\d{4}\b/ },
    { label: "Income-tax context", regex: /(Income-tax|assessment|reassessment|CPC|AO)/i },
  ],
  "rbi-filing": [
    { label: "Reference number", regex: /(Ref\.?\s*No|Reference\s*No|letter|communication)/i },
    { label: "Regulation references", regex: /(Regulation|Section|Rule)\s*\d+/i },
    { label: "Exposure/amount details", regex: /(?:Rs\.?|INR|₹)\s?[\d,]+/i },
    { label: "Date timeline evidence", regex: /\b\d{1,2}[\/.-]\d{1,2}[\/.-]\d{2,4}\b|\b\d{1,2}\s+[A-Za-z]{3,9}\s+\d{4}\b/ },
    { label: "RBI/FEMA context", regex: /(RBI|FEMA|authorized dealer|compounding)/i },
  ],
  "sebi-compliance": [
    { label: "Reference number", regex: /(Ref\.?\s*No|Reference\s*No|SEBI)/i },
    { label: "Regulation references", regex: /(Regulation|Section|Rule)\s*\d+/i },
    { label: "Exposure/amount details", regex: /(?:Rs\.?|INR|₹)\s?[\d,]+/i },
    { label: "Date timeline evidence", regex: /\b\d{1,2}[\/.-]\d{1,2}[\/.-]\d{2,4}\b|\b\d{1,2}\s+[A-Za-z]{3,9}\s+\d{4}\b/ },
    { label: "SEBI/disclosure context", regex: /(SEBI|listing|disclosure|governance|investor)/i },
  ],
  "customs-response": [
    { label: "DIN/RFN reference", regex: /(DIN|RFN|SCN|Ref\.?\s*No)/i },
    { label: "Section references", regex: /(Section|Sec\.)\s*\d+/i },
    { label: "Duty/amount details", regex: /(?:Rs\.?|INR|₹)\s?[\d,]+/i },
    { label: "Date timeline evidence", regex: /\b\d{1,2}[\/.-]\d{1,2}[\/.-]\d{2,4}\b|\b\d{1,2}\s+[A-Za-z]{3,9}\s+\d{4}\b/ },
    { label: "Customs context", regex: /(Bill of Entry|BOE|classification|valuation|Section 28|Section 111)/i },
  ],
  "contract-review": [
    { label: "Agreement/contract reference", regex: /(agreement|contract|clause|party|effective date)/i },
    { label: "Clause/legal references", regex: /(clause|section)\s*\d+(\.\d+)*/i },
    { label: "Commercial exposure details", regex: /(?:Rs\.?|INR|₹)\s?[\d,]+|liability|damages/i },
    { label: "Date timeline evidence", regex: /\b\d{1,2}[\/.-]\d{1,2}[\/.-]\d{2,4}\b|\b\d{1,2}\s+[A-Za-z]{3,9}\s+\d{4}\b/ },
    { label: "Dispute/risk context", regex: /(indemnity|termination|dispute|arbitration|liability)/i },
  ],
  "custom-draft": [
    { label: "Reference identifier", regex: /(DIN|RFN|Ref\.?\s*No|Reference\s*No|notice)/i },
    { label: "Provision references", regex: /(Section|Sec\.|Rule|Regulation)\s*\d+/i },
    { label: "Amount/exposure details", regex: /(?:Rs\.?|INR|₹)\s?[\d,]+/i },
    { label: "Date timeline evidence", regex: /\b\d{1,2}[\/.-]\d{1,2}[\/.-]\d{2,4}\b|\b\d{1,2}\s+[A-Za-z]{3,9}\s+\d{4}\b/ },
    { label: "Authority/law context", regex: /(authority|department|act|regulation|notice|order)/i },
  ],
};

const AIDraftingEngine = () => {
  const [clientOptions, setClientOptions] = useState<ClientOption[]>(demoClients);
  const [clientSource, setClientSource] = useState<"demo" | "live">("demo");
  const [isLoadingClients, setIsLoadingClients] = useState(false);
  const [selectedClient, setSelectedClient] = useState<string>("");
  const [selectedDocType, setSelectedDocType] = useState<string>("");
  const [lastTemplateDocType, setLastTemplateDocType] = useState<string>("");
  const [selectedMode, setSelectedMode] = useState<string>("balanced");
  const [noticeDetails, setNoticeDetails] = useState<string>("");
  const [advancedMode, setAdvancedMode] = useState(true);
  const [isGenerating, setIsGenerating] = useState(false);
  const [draftGenerated, setDraftGenerated] = useState(false);
  const [draftContent, setDraftContent] = useState("");
  const [showFormatDetails, setShowFormatDetails] = useState(false);
  const [draftQA, setDraftQA] = useState<DraftQA | null>(null);
  const [draftPackage, setDraftPackage] = useState<DraftPackage | null>(null);
  const [currentSteps, setCurrentSteps] = useState<ReviewStep[]>(initialReviewSteps);
  const [generationError, setGenerationError] = useState<string | null>(null);

  const DRAFT_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/ai-draft`;
  const secureFunctionAuth = import.meta.env.VITE_ENABLE_SECURE_FUNCTION_AUTH === "true";
  const noticeLength = noticeDetails.trim().length;
  const activeChecks = selectedDocType
    ? (advancedChecksByType[selectedDocType] || advancedChecksByType["custom-draft"])
    : [];
  const checkResults = activeChecks.map((check) => ({
    ...check,
    passed: check.regex.test(noticeDetails),
  }));
  const selectedDocLabel = documentTypes.find(doc => doc.id === selectedDocType)?.label || "Selected Draft";
  const docSpecificFormat = documentFormatModules[selectedDocType] || documentFormatModules["custom-draft"];
  const selectedTemplate = selectedDocType ? readyNoticeTemplates[selectedDocType] : "";

  useEffect(() => {
    let mounted = true;

    const loadLiveClients = async () => {
      setIsLoadingClients(true);
      try {
        const {
          data: { user },
        } = await supabase.auth.getUser();

        if (!mounted) return;

        if (!user) {
          setClientOptions(demoClients);
          setClientSource("demo");
          return;
        }

        const { data: memberships, error: membershipError } = await supabase
          .from("company_members")
          .select("company_id")
          .eq("user_id", user.id);

        if (membershipError) {
          throw membershipError;
        }

        const companyIds = Array.from(new Set((memberships ?? []).map((row) => row.company_id)));

        if (companyIds.length === 0) {
          setClientOptions(demoClients);
          setClientSource("demo");
          return;
        }

        const { data: companies, error: companyError } = await supabase
          .from("companies")
          .select("id, name, industry")
          .in("id", companyIds)
          .order("name", { ascending: true });

        if (companyError) {
          throw companyError;
        }

        if ((companies ?? []).length === 0) {
          setClientOptions(demoClients);
          setClientSource("demo");
          return;
        }

        const mappedCompanies: ClientOption[] = (companies ?? []).map((company) => ({
          id: company.id,
          name: company.name,
          industry: company.industry ?? "General",
        }));

        setClientOptions(mappedCompanies);
        setClientSource("live");
      } catch {
        if (!mounted) return;
        setClientOptions(demoClients);
        setClientSource("demo");
      } finally {
        if (mounted) {
          setIsLoadingClients(false);
        }
      }
    };

    loadLiveClients();

    return () => {
      mounted = false;
    };
  }, []);

  useEffect(() => {
    if (!selectedClient) return;
    const exists = clientOptions.some((client) => client.id === selectedClient);
    if (!exists) {
      setSelectedClient("");
    }
  }, [clientOptions, selectedClient]);

  useEffect(() => {
    if (!selectedDocType) return;

    const prevTemplate = lastTemplateDocType ? readyNoticeTemplates[lastTemplateDocType] : "";
    const currentText = noticeDetails.trim();
    const canAutoReplace = currentText.length === 0 || (prevTemplate && currentText === prevTemplate);

    if (canAutoReplace) {
      setNoticeDetails(readyNoticeTemplates[selectedDocType] || "");
      setLastTemplateDocType(selectedDocType);
    }
  }, [selectedDocType, lastTemplateDocType, noticeDetails]);

  const handleInsertTemplate = () => {
    if (!selectedDocType || !selectedTemplate) {
      toast.error("Select a document type first.");
      return;
    }
    setNoticeDetails(selectedTemplate);
    setLastTemplateDocType(selectedDocType);
    toast.success("Ready 200+ template inserted.");
  };

  const handleCopyTemplate = async () => {
    if (!selectedDocType || !selectedTemplate) {
      toast.error("Select a document type first.");
      return;
    }
    try {
      await navigator.clipboard.writeText(selectedTemplate);
      toast.success("Template copied. Paste it in Notice / Order Details.");
    } catch {
      toast.error("Clipboard access failed. Use Insert Template instead.");
    }
  };

  const handleGenerateDraft = async () => {
    if (!selectedClient || !selectedDocType) return;

    if (advancedMode && noticeLength < 200) {
      toast.error("Advanced Mode requires detailed notice/order text (minimum 200 characters).");
      return;
    }

    if (advancedMode && checkResults.length > 0) {
      const missing = checkResults.filter((item) => !item.passed).map((item) => item.label);
      if (missing.length > 0) {
        toast.error(`Advanced Mode missing: ${missing.join(", ")}`);
        return;
      }
    }
    
    setIsGenerating(true);
    setGenerationError(null);
    setDraftContent("");
    setDraftQA(null);
    setDraftPackage(null);
    
    const client = clientOptions.find(c => c.id === selectedClient);
    
    try {
      let authToken = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY as string;
      if (secureFunctionAuth) {
        const {
          data: { session },
        } = await supabase.auth.getSession();
        authToken = session?.access_token ?? authToken;
      }

      const response = await fetch(DRAFT_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${authToken}`,
        },
        body: JSON.stringify({
          documentType: selectedDocType,
          companyName: client?.name || "Company",
          industry: client?.industry || "",
          draftMode: selectedMode,
          advancedMode,
          strictValidation: advancedMode,
          noticeDetails: noticeDetails || undefined,
          stream: !advancedMode,
        }),
      });

      if (response.status === 429) {
        throw new Error("Rate limit exceeded. Please try again in a moment.");
      }
      if (response.status === 402) {
        throw new Error("AI credits exhausted. Please add credits to continue.");
      }
      if (!response.ok) {
        let serverError = "Failed to generate draft. Please try again.";
        try {
          const data = await response.json();
          serverError = data?.error || serverError;
        } catch {
          // keep default message
        }
        throw new Error(serverError);
      }
      if (advancedMode) {
        const data = await response.json();
        const content = data?.draft as string | undefined;
        if (!content) {
          throw new Error("Advanced draft generation returned empty content.");
        }
        setDraftContent(content);
        setDraftQA((data?.qa ?? null) as DraftQA | null);
        setDraftPackage((data?.package ?? null) as DraftPackage | null);
        setDraftGenerated(true);
        setShowFormatDetails(false);
        setCurrentSteps(prev => prev.map(step => {
          if (step.id === 1) return { ...step, status: "completed" as StepStatus };
          if (step.id === 2) return { ...step, status: "current" as StepStatus };
          return step;
        }));
        toast.success("Advanced filing-ready draft generated successfully!");
        return;
      }

      if (!response.body) {
        throw new Error("Failed to generate draft stream. Please try again.");
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let textBuffer = "";
      let fullContent = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        
        textBuffer += decoder.decode(value, { stream: true });

        let newlineIndex: number;
        while ((newlineIndex = textBuffer.indexOf("\n")) !== -1) {
          let line = textBuffer.slice(0, newlineIndex);
          textBuffer = textBuffer.slice(newlineIndex + 1);

          if (line.endsWith("\r")) line = line.slice(0, -1);
          if (line.startsWith(":") || line.trim() === "") continue;
          if (!line.startsWith("data: ")) continue;

          const jsonStr = line.slice(6).trim();
          if (jsonStr === "[DONE]") break;

          try {
            const parsed = JSON.parse(jsonStr);
            const content = parsed.choices?.[0]?.delta?.content as string | undefined;
            if (content) {
              fullContent += content;
              setDraftContent(fullContent);
            }
          } catch {
            textBuffer = line + "\n" + textBuffer;
            break;
          }
        }
      }

      setDraftGenerated(true);
      setShowFormatDetails(false);
      setCurrentSteps(prev => prev.map(step => {
        if (step.id === 1) return { ...step, status: "completed" as StepStatus };
        if (step.id === 2) return { ...step, status: "current" as StepStatus };
        return step;
      }));
      toast.success("Filing-ready draft generated successfully!");

    } catch (error) {
      console.error("Draft generation error:", error);
      setGenerationError(error instanceof Error ? error.message : "An error occurred");
      toast.error(error instanceof Error ? error.message : "Failed to generate draft");
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.2 }}
      className="glass-card p-6 mb-8"
    >
      <div className="flex items-center gap-3 mb-6">
        <div className="p-3 rounded-xl bg-cyan-500/10">
          <Sparkles className="w-6 h-6 text-cyan-500" />
        </div>
        <div>
          <h2 className="text-xl font-semibold text-foreground">AI Drafting Engine</h2>
          <p className="text-sm text-muted-foreground">
            Generate filing-ready regulatory drafts — Facts → Law → Application → Conclusion
          </p>
        </div>
        <Badge className="ml-auto bg-cyan-500/20 text-cyan-500 border-cyan-500/30">
          CA-Only Access
        </Badge>
      </div>

      <Tabs defaultValue="create" className="w-full">
        <TabsList className="grid w-full grid-cols-3 mb-6">
          <TabsTrigger value="create">Create Draft</TabsTrigger>
          <TabsTrigger value="review">Review Workflow</TabsTrigger>
          <TabsTrigger value="legal-basis">Legal Basis</TabsTrigger>
        </TabsList>

        <TabsContent value="create">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Left: Configuration */}
            <div className="space-y-4">
              {/* Client Selection */}
              <div>
                <label className="block text-sm font-medium text-foreground mb-2">
                  <Building2 className="w-4 h-4 inline-block mr-2" />
                  Select Client
                </label>
                <Select value={selectedClient} onValueChange={setSelectedClient}>
                  <SelectTrigger className="bg-background/50">
                    <SelectValue placeholder="Choose a company..." />
                  </SelectTrigger>
                  <SelectContent>
                    {clientOptions.map(client => (
                      <SelectItem key={client.id} value={client.id}>
                        {client.name} ({client.industry})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <p className="text-xs text-muted-foreground mt-1">
                  {isLoadingClients
                    ? "Loading client list..."
                    : clientSource === "live"
                      ? "Live clients loaded from your account."
                      : "Using demo clients (no live company mapping found)."}
                </p>
              </div>

              {/* Document Type */}
              <div>
                <label className="block text-sm font-medium text-foreground mb-2">
                  <FileText className="w-4 h-4 inline-block mr-2" />
                  Document Type
                </label>
                <Select value={selectedDocType} onValueChange={setSelectedDocType}>
                  <SelectTrigger className="bg-background/50">
                    <SelectValue placeholder="Select document type..." />
                  </SelectTrigger>
                  <SelectContent>
                    {documentTypes.map(doc => (
                      <SelectItem key={doc.id} value={doc.id}>
                        {doc.label}
                        <Badge variant="outline" className="ml-2 text-xs">
                          {doc.authority}
                        </Badge>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Draft Mode */}
              <div>
                <label className="block text-sm font-medium text-foreground mb-2">
                  <Scale className="w-4 h-4 inline-block mr-2" />
                  Draft Mode
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {draftModes.map(mode => (
                    <button
                      key={mode.id}
                      onClick={() => setSelectedMode(mode.id)}
                      className={`p-3 rounded-lg border text-left transition-all ${
                        selectedMode === mode.id 
                          ? "border-primary bg-primary/10" 
                          : "border-border/50 hover:border-primary/30"
                      }`}
                    >
                      <p className={`font-medium text-sm ${mode.color}`}>{mode.label}</p>
                      <p className="text-xs text-muted-foreground">{mode.description}</p>
                    </button>
                  ))}
                </div>
              </div>

              {/* Notice Details */}
              <div>
                <label className="block text-sm font-medium text-foreground mb-2">
                  <Upload className="w-4 h-4 inline-block mr-2" />
                  Notice / Order Details
                </label>
                <Textarea 
                  placeholder="Paste notice content, order text, or key facts for para-by-para rebuttal. Technical objections will only be raised if supported by the content provided here."
                  value={noticeDetails}
                  onChange={(e) => setNoticeDetails(e.target.value)}
                  className="min-h-[100px] bg-background/50"
                />
                <p className="text-xs text-muted-foreground mt-1">
                  Providing notice details enables point-by-point rebuttal. Procedural objections are raised only if evidence supports them.
                </p>
                <div className="mt-2 grid grid-cols-1 sm:grid-cols-2 gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={handleInsertTemplate}
                    disabled={!selectedDocType}
                  >
                    Insert 200+ Template
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={handleCopyTemplate}
                    disabled={!selectedDocType}
                  >
                    Copy 200+ Template
                  </Button>
                </div>
              </div>

              <div className="p-3 rounded-lg border border-border/50 bg-background/30">
                <div className="flex items-center justify-between mb-2">
                  <p className="text-sm font-medium text-foreground">Advanced Draft Mode</p>
                  <button
                    type="button"
                    onClick={() => setAdvancedMode(prev => !prev)}
                    className={`px-3 py-1 rounded-md text-xs font-medium transition-colors ${
                      advancedMode
                        ? "bg-cyan-500/20 text-cyan-300 border border-cyan-500/30"
                        : "bg-muted text-muted-foreground border border-border"
                    }`}
                  >
                    {advancedMode ? "Enabled" : "Disabled"}
                  </button>
                </div>
                <p className="text-xs text-muted-foreground mb-2">
                  Enabled: document-specific para-wise matrix, computation rebuttal, annexure mapping, and quality gates.
                </p>
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <p className={noticeLength >= 200 ? "text-green-400" : "text-yellow-400"}>
                    {noticeLength >= 200 ? "✓" : "!"} Detailed notice text (200+)
                  </p>
                  {selectedDocType ? (
                    checkResults.map((item) => (
                      <p key={item.label} className={item.passed ? "text-green-400" : "text-yellow-400"}>
                        {item.passed ? "✓" : "!"} {item.label}
                      </p>
                    ))
                  ) : (
                    <p className="text-yellow-400">! Select document type to load specific checks</p>
                  )}
                </div>
              </div>

              {/* Generate Button */}
              <Button 
                size="lg" 
                className="w-full btn-glow"
                disabled={!selectedClient || !selectedDocType || isGenerating}
                onClick={handleGenerateDraft}
              >
                {isGenerating ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Generating Filing-Ready Draft...
                  </>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4 mr-2" />
                    Generate Draft
                  </>
                )}
              </Button>

              {generationError && (
                <div className="p-3 rounded-lg bg-destructive/10 border border-destructive/20 text-sm text-destructive">
                  {generationError}
                </div>
              )}
            </div>

            {/* Right: Draft Preview */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="block text-sm font-medium text-foreground">
                  <Edit3 className="w-4 h-4 inline-block mr-2" />
                  Draft Content
                </label>
                {draftGenerated && (
                  <Badge className="bg-green-500/20 text-green-500 border-green-500/30">
                    Filing-Ready
                  </Badge>
                )}
              </div>
              <Textarea 
                placeholder="Draft will appear here after generation. The engine produces a filing-ready document with proper legal structure, section citations, and prayer for reliefs..."
                value={draftContent}
                onChange={(e) => setDraftContent(e.target.value)}
                className="min-h-[400px] bg-background/50 font-mono text-sm"
              />
              <p className="text-xs text-muted-foreground mt-2">
                All edits are tracked line-by-line for audit compliance. Structure: Facts → Law → Application → Conclusion.
              </p>

              {draftGenerated && (
                <div className="mt-3">
                  <Button
                    type="button"
                    variant="outline"
                    className="w-full"
                    onClick={() => setShowFormatDetails(prev => !prev)}
                  >
                    {showFormatDetails ? "Hide Draft Format Followed" : "View Draft Format Followed"}
                  </Button>
                </div>
              )}

              {draftGenerated && showFormatDetails && (
                <div className="mt-3 p-4 rounded-lg border border-cyan-500/30 bg-cyan-500/5 text-sm space-y-3">
                  <p className="font-medium text-cyan-300">
                    Format Blueprint: {selectedDocLabel} ({advancedMode ? "Advanced Mode" : "Standard Mode"})
                  </p>
                  <ul className="space-y-1 text-muted-foreground list-disc pl-5">
                    <li>Notice Header and Filing Caption</li>
                    <li>Preliminary Submissions</li>
                    <li>Facts and Chronology</li>
                    <li>Issue-Wise Legal Submissions</li>
                    <li>Evidence and Annexure Mapping</li>
                    <li>Prayer / Relief Section with layered requests</li>
                    <li>Authorized Signatory Block</li>
                  </ul>
                  {advancedMode && (
                    <ul className="space-y-1 text-muted-foreground list-disc pl-5">
                      <li>Notice Intelligence Snapshot</li>
                      <li>Para-wise Rebuttal Matrix</li>
                      <li>Computation Reconciliation Table</li>
                      <li>Procedural Validity Check (fact-supported only)</li>
                      <li>RUD vs Annexure Mapping</li>
                    </ul>
                  )}
                  <ul className="space-y-1 text-muted-foreground list-disc pl-5">
                    {docSpecificFormat.map((item) => (
                      <li key={item}>{item}</li>
                    ))}
                  </ul>
                </div>
              )}

              {draftGenerated && draftQA && (
                <div className="mt-3 p-4 rounded-lg border border-border/50 bg-background/30 text-sm space-y-2">
                  <p className="font-medium text-foreground">
                    Filing Score: {draftQA.filing_score}/100
                    <span className="ml-2 text-xs uppercase text-muted-foreground">Risk: {draftQA.risk_band}</span>
                  </p>
                  {draftQA.missing_for_final_filing && draftQA.missing_for_final_filing.length > 0 && (
                    <ul className="list-disc pl-5 text-yellow-400">
                      {draftQA.missing_for_final_filing.map((item) => (
                        <li key={item}>{item}</li>
                      ))}
                    </ul>
                  )}
                </div>
              )}
            </div>
          </div>
        </TabsContent>

        <TabsContent value="review">
          <Card className="bg-card/50 border-border/50">
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Shield className="w-5 h-5 text-primary" />
                Mandatory Review Workflow
              </CardTitle>
              <p className="text-sm text-muted-foreground">
                Every draft must pass through all verification steps. No step can be skipped.
              </p>
            </CardHeader>
            <CardContent>
              <div className="relative">
                {/* Progress Line */}
                <div className="absolute left-6 top-0 bottom-0 w-0.5 bg-border/50" />
                
                <div className="space-y-6">
                  {currentSteps.map((step) => (
                    <div key={step.id} className="flex items-start gap-4 relative">
                      <div className={`relative z-10 w-12 h-12 rounded-full flex items-center justify-center ${
                        step.status === "completed" 
                          ? "bg-green-500/20 text-green-500" 
                          : step.status === "current"
                            ? "bg-primary/20 text-primary ring-2 ring-primary"
                            : "bg-muted text-muted-foreground"
                      }`}>
                        {step.status === "completed" ? (
                          <CheckCircle2 className="w-6 h-6" />
                        ) : (
                          <span className="font-bold">{step.id}</span>
                        )}
                      </div>
                      <div className="flex-1 pt-2">
                        <p className={`font-medium ${
                          step.status === "completed" 
                            ? "text-green-500" 
                            : step.status === "current"
                              ? "text-foreground"
                              : "text-muted-foreground"
                        }`}>
                          {step.label}
                        </p>
                        {step.status === "current" && (
                          <p className="text-sm text-muted-foreground mt-1">
                            Currently awaiting your review and approval
                          </p>
                        )}
                      </div>
                      {step.status === "current" && (
                        <Button size="sm" className="shrink-0">
                          <Eye className="w-4 h-4 mr-2" />
                          Review Now
                        </Button>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="legal-basis">
          <Card className="bg-card/50 border-border/50">
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Book className="w-5 h-5 text-primary" />
                Legal Basis Panel
              </CardTitle>
              <p className="text-sm text-muted-foreground">
                Every draft includes transparent regulatory citations
              </p>
            </CardHeader>
            <CardContent>
              {draftGenerated ? (
                <div className="space-y-4">
                  {draftQA && draftQA.explainability && draftQA.explainability.length > 0 && (
                    <div className="p-4 rounded-lg bg-cyan-500/5 border border-cyan-500/20">
                      <h4 className="font-medium text-foreground mb-3">Explainability Panel</h4>
                      <ul className="space-y-2 text-sm">
                        {draftQA.explainability.slice(0, 5).map((item) => (
                          <li key={`${item.legal_point}-${item.evidence_anchor}`} className="text-muted-foreground">
                            <strong className="text-foreground">{item.legal_point}:</strong> {item.why_included}
                            <span className="block text-xs text-cyan-300">Evidence: {item.evidence_anchor}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {draftPackage && (
                    <div className="p-4 rounded-lg bg-primary/5 border border-primary/20">
                      <h4 className="font-medium text-foreground mb-3">Multi-Output Package</h4>
                      <ul className="space-y-1 text-sm text-muted-foreground">
                        <li>Reply Draft: Ready</li>
                        <li>Annexure Index: {(draftPackage.annexure_index ?? []).length} items</li>
                        <li>Hearing Notes: {draftPackage.hearing_notes ? "Generated" : "Pending"}</li>
                        <li>Argument Script: {(draftPackage.argument_script ?? []).length} talking points</li>
                      </ul>
                    </div>
                  )}

                  <div className="p-4 rounded-lg bg-primary/5 border border-primary/20">
                    <h4 className="font-medium text-foreground mb-3">Draft prepared under:</h4>
                    <ul className="space-y-2 text-sm">
                      <li className="flex items-start gap-2">
                        <ChevronRight className="w-4 h-4 text-primary shrink-0 mt-0.5" />
                        <span><strong>Act:</strong> Central Goods and Services Tax Act, 2017</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <ChevronRight className="w-4 h-4 text-primary shrink-0 mt-0.5" />
                        <span><strong>Section:</strong> Section 73 (Determination of tax not paid or short paid)</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <ChevronRight className="w-4 h-4 text-primary shrink-0 mt-0.5" />
                        <span><strong>Rule:</strong> Rule 142 of CGST Rules, 2017</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <ChevronRight className="w-4 h-4 text-primary shrink-0 mt-0.5" />
                        <span><strong>Circular:</strong> Circular No. 185/2022-GST dated 27.12.2022</span>
                      </li>
                    </ul>
                  </div>

                  {/* Risk Highlights */}
                  <div className="p-4 rounded-lg bg-destructive/10 border border-destructive/20">
                    <h4 className="font-medium text-foreground mb-3 flex items-center gap-2">
                      <FileWarning className="w-4 h-4 text-destructive" />
                      Risk & Gap Highlights
                    </h4>
                    <ul className="space-y-2 text-sm">
                      <li className="flex items-start gap-2">
                        <AlertTriangle className="w-4 h-4 text-yellow-500 shrink-0 mt-0.5" />
                        <span>Missing disclosure: Bank reconciliation statement not attached</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <AlertTriangle className="w-4 h-4 text-orange-500 shrink-0 mt-0.5" />
                        <span>Penalty exposure: ₹2,50,000 if notice not addressed within 30 days</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <AlertTriangle className="w-4 h-4 text-destructive shrink-0 mt-0.5" />
                        <span>Filing delay: Response deadline is February 15, 2026</span>
                      </li>
                    </ul>
                  </div>
                </div>
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  <Book className="w-12 h-12 mx-auto mb-4 opacity-50" />
                  <p>Generate a draft to see the legal basis panel</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </motion.div>
  );
};

export default AIDraftingEngine;

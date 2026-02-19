import { useState } from "react";
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
  "gst-show-cause": "Show Cause Notice No. [INSERT] dated [INSERT DATE] issued by [State/Central GST authority], DIN/RFN [INSERT], alleges wrongful ITC availment for period [INSERT PERIOD] under Section 73 read with Section 16(2)(c), Rule 36/Rule 42/Rule 86A references (as applicable). Proposed tax demand is INR [INSERT], interest under Section 50 and penalty under Section 73(9). Department relies on DRC-01 working sheet, 3B vs 2B mismatch, and vendor filing gaps. Noticee confirms possession of valid invoices, receipt of goods/services, payment through banking channels, and return filing compliance. Mismatches are primarily timing differences and amendment effects. Provide para-wise rebuttal matrix, allegation-wise computation challenge, annexure mapping, and complete prayer for dropping demand/interest/penalty with hearing request.",
  "mca-notice": "Notice/Adjudication reference [INSERT] dated [INSERT DATE], DIN/RFN [INSERT], issued by Registrar of Companies/Adjudicating Officer under Companies Act, 2013 for alleged non-compliance of Section [INSERT] read with Rule [INSERT], period [INSERT]. Proposed penalty is INR [INSERT] on company and officers. Department alleges delayed filing/non-filing of statutory forms and seeks adjudication under applicable penalty provisions. Noticee submits that default, if any, is technical/procedural without mala fide intent, corrective filing steps have been initiated/completed, and no stakeholder prejudice occurred. Provide issue-wise legal response distinguishing procedural vs substantive default, chronology table, mitigation factors, compounding/leniency submissions where permissible, annexure mapping, and structured prayer for dropping/minimizing penalty with opportunity of personal hearing.",
  "income-tax-response": "Notice under Income-tax Act reference [INSERT] dated [INSERT DATE], DIN [INSERT], issued by [AO/CPC unit] for AY [INSERT], alleging addition/disallowance under Sections [INSERT], amount INR [INSERT]. Department relies on mismatch in books/return/AIS/TDS data and proposes tax, interest and penalty initiation. Noticee provides ledger extracts, bank proofs, invoices/supporting contracts and reconciliation statements showing bona fide reporting and explainable variance. Where reopening/disallowance is invoked, challenge jurisdictional and merits basis as fact-supported. Prepare para-wise reply against each allegation, computation rebuttal table, documentary annexure mapping, and final prayer for deletion of additions, dropping penalty proceedings, and grant of hearing before final order.",
  "rbi-filing": "Regulatory communication/SCN reference [INSERT] dated [INSERT DATE], issued by RBI/Authorized authority regarding alleged FEMA/RBI non-compliance for period [INSERT], reference no. [INSERT]. Proposed contravention and monetary implication is INR [INSERT]. Department alleges delayed/incorrect filing and control lapses. Noticee submits transactions were bona fide, underlying records are auditable, delays were procedural, and corrective filings/internal control enhancements are completed or in progress. Draft should provide regulation-wise response, timeline of compliance actions, risk-mitigation controls, proportionality arguments, annexure mapping (returns, board approvals, remittance docs), and layered prayer seeking closure/lenient view/compounding at minimum exposure with hearing request.",
  "sebi-compliance": "SEBI communication/notice reference [INSERT] dated [INSERT DATE], DIN/reference [INSERT], alleges non-compliance with Regulation/Section [INSERT] for period [INSERT] with proposed action/penalty INR [INSERT]. Basis includes disclosure delay, governance deficiency, or reporting mismatch. Noticee submits investor prejudice is absent, disclosures have been corrected, and governance controls are strengthened. Prepare allegation-wise legal rebuttal with regulatory text linkage, chronology of disclosures, evidence mapping to exchange filings/board records, and reasoned submissions on proportionality and natural justice. Include computation/exposure table, mitigation actions, and prayer seeking dropping or reduction of action with request for personal hearing.",
  "customs-response": "Show Cause Notice No. [INSERT] dated [INSERT DATE], DIN/RFN [INSERT], issued by Customs authority for period [INSERT], alleging misclassification/undervaluation/wrong exemption on imported goods under Section 28 and related provisions. Proposed differential duty is INR [INSERT], with interest under Section 28AA, penalty under Sections 112/114A/114AA, and confiscation proposal under Section 111 with redemption fine under Section 125. Department relies on NIDB comparison, audit findings, and selected Bills of Entry. Noticee submits declared classification and transaction value are correct based on product specifications, invoices and banking trail, with no suppression or mala fide intent. Provide para-wise rebuttal, duty/interest/penalty/fine computation challenge, evidence annexure matrix, and prayer for dropping proceedings and granting hearing.",
  "contract-review": "Contract review matter for agreement dated [INSERT DATE] between [Party A] and [Party B], governing law [INSERT], dispute/concern areas include indemnity, limitation of liability, termination rights, payment milestones, confidentiality/IP ownership, and dispute resolution clause enforceability. Business risk exposure estimated at INR [INSERT]. Identify ambiguous or one-sided clauses, statutory non-compliance risks, and litigation/arbitration vulnerabilities. Provide clause-wise risk rating, suggested revised language, fallback negotiation positions, and annexure references to commercial term sheet/emails. Output should include executive risk summary, legal analysis table, recommended redlines, and final action plan for negotiation/execution readiness.",
  "custom-draft": "Regulatory notice/order reference [INSERT] dated [INSERT DATE], authority [INSERT], DIN/RFN/reference [INSERT], applicable law/provision [INSERT], period [INSERT], proposed tax/penalty/exposure INR [INSERT]. Department allegations are summarized as: [INSERT ALLEGATION 1], [INSERT ALLEGATION 2], [INSERT ALLEGATION 3]. Noticee position is that transactions/compliances are bona fide and supported by records, and disputed findings arise from interpretation/timing/procedural issues. Generate a filing-ready draft with notice snapshot, para-wise rebuttal matrix, computation challenge table, documentary annexure mapping, procedural validity check (only if fact-supported), and layered prayer including hearing opportunity and any alternative relief.",
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
  const [selectedClient, setSelectedClient] = useState<string>("");
  const [selectedDocType, setSelectedDocType] = useState<string>("");
  const [selectedMode, setSelectedMode] = useState<string>("balanced");
  const [noticeDetails, setNoticeDetails] = useState<string>("");
  const [advancedMode, setAdvancedMode] = useState(true);
  const [isGenerating, setIsGenerating] = useState(false);
  const [draftGenerated, setDraftGenerated] = useState(false);
  const [draftContent, setDraftContent] = useState("");
  const [showFormatDetails, setShowFormatDetails] = useState(false);
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

  const handleInsertTemplate = () => {
    if (!selectedDocType || !selectedTemplate) {
      toast.error("Select a document type first.");
      return;
    }
    setNoticeDetails(selectedTemplate);
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
    
    const client = demoClients.find(c => c.id === selectedClient);
    
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
                    {demoClients.map(client => (
                      <SelectItem key={client.id} value={client.id}>
                        {client.name} ({client.industry})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
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

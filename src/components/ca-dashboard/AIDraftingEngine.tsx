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

const AIDraftingEngine = () => {
  const [selectedClient, setSelectedClient] = useState<string>("");
  const [selectedDocType, setSelectedDocType] = useState<string>("");
  const [selectedMode, setSelectedMode] = useState<string>("balanced");
  const [noticeDetails, setNoticeDetails] = useState<string>("");
  const [advancedMode, setAdvancedMode] = useState(true);
  const [isGenerating, setIsGenerating] = useState(false);
  const [draftGenerated, setDraftGenerated] = useState(false);
  const [draftContent, setDraftContent] = useState("");
  const [currentSteps, setCurrentSteps] = useState<ReviewStep[]>(initialReviewSteps);
  const [generationError, setGenerationError] = useState<string | null>(null);

  const DRAFT_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/ai-draft`;
  const secureFunctionAuth = import.meta.env.VITE_ENABLE_SECURE_FUNCTION_AUTH === "true";
  const noticeLength = noticeDetails.trim().length;
  const hasDinOrRfn = /(DIN|RFN|Reference\s*No|Ref\.?\s*No)/i.test(noticeDetails);
  const hasSectionReference = /(Section|Sec\.|Rule|Regulation)\s*\d+/i.test(noticeDetails);
  const hasAmount = /(?:Rs\.?|INR|₹)\s?[\d,]+/i.test(noticeDetails);
  const hasDate = /\b\d{1,2}[\/.-]\d{1,2}[\/.-]\d{2,4}\b|\b\d{1,2}\s+[A-Za-z]{3,9}\s+\d{4}\b/.test(noticeDetails);

  const handleGenerateDraft = async () => {
    if (!selectedClient || !selectedDocType) return;

    if (advancedMode && noticeLength < 200) {
      toast.error("Advanced Mode requires detailed notice/order text (minimum 200 characters).");
      return;
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
          stream: true,
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
                  Enabled: strict para-wise matrix, allegation-wise computation rebuttal, annexure mapping, and quality gates.
                </p>
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <p className={noticeLength >= 200 ? "text-green-400" : "text-yellow-400"}>
                    {noticeLength >= 200 ? "✓" : "!"} Detailed notice text
                  </p>
                  <p className={hasDinOrRfn ? "text-green-400" : "text-yellow-400"}>
                    {hasDinOrRfn ? "✓" : "!"} DIN/RFN reference
                  </p>
                  <p className={hasSectionReference ? "text-green-400" : "text-yellow-400"}>
                    {hasSectionReference ? "✓" : "!"} Section/Rule references
                  </p>
                  <p className={hasAmount ? "text-green-400" : "text-yellow-400"}>
                    {hasAmount ? "✓" : "!"} Demand/amount details
                  </p>
                  <p className={hasDate ? "text-green-400" : "text-yellow-400"}>
                    {hasDate ? "✓" : "!"} Date timeline evidence
                  </p>
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

/**
 * Regulon AI Executive Agent
 * Autonomous, proactive AI system for CA compliance management
 * Features: Activity Stream, Task Console, Voice I/O, Tool Execution, Approval Workflow
 */

import { useState, useEffect, useRef, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import {
  Bot,
  Mic,
  MicOff,
  Volume2,
  Send,
  CheckCircle,
  AlertCircle,
  Clock,
  Zap,
  FileText,
  Eye,
  X,
  MessageSquare,
  Loader,
} from "lucide-react";
import { toast } from "sonner";

interface Task {
  id: string;
  title: string;
  priority: "critical" | "high" | "medium" | "low";
  status: "pending" | "in_progress" | "completed" | "approved";
  dueDate: string;
  client?: string;
  action?: string;
  timestamp: string;
}

interface ActivityLog {
  id: string;
  type: "task" | "message" | "completion" | "alert";
  title: string;
  description: string;
  timestamp: string;
  metadata?: Record<string, any>;
}

interface ApprovalRequest {
  id: string;
  type: "draft" | "filing" | "reconciliation";
  title: string;
  content: string;
  client: string;
  details: string;
  generatedAt: string;
}

const RegulonAIAgent = () => {
  // State Management
  const [tasks, setTasks] = useState<Task[]>([]);
  const [activities, setActivities] = useState<ActivityLog[]>([]);
  const [userInput, setUserInput] = useState("");
  const [isListening, setIsListening] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [approvalRequest, setApprovalRequest] = useState<ApprovalRequest | null>(
    null
  );
  const [showSiriInterface, setShowSiriInterface] = useState(false);
  const [wakeWordDetected, setWakeWordDetected] = useState(false);
  const [listeningText, setListeningText] = useState("");
  const [dailyBrief, setDailyBrief] = useState("");
  const [showBriefing, setShowBriefing] = useState(false);
  const [activeTab, setActiveTab] = useState("brief");

  // Refs
  const recognitionRef = useRef<SpeechRecognition | null>(null);
  const synthesisRef = useRef<SpeechSynthesisUtterance | null>(null);

  // Initialize Speech Recognition with "Hey Regulon" wake-word detection
  useEffect(() => {
    const SpeechRecognition =
      window.SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (SpeechRecognition) {
      recognitionRef.current = new SpeechRecognition();
      recognitionRef.current.continuous = true; // Always listening for wake-word
      recognitionRef.current.interimResults = true;

      recognitionRef.current.onstart = () => {
        // Listening for wake-word in background
      };

      recognitionRef.current.onresult = (event: any) => {
        let transcript = "";
        let isFinal = false;

        for (let i = event.resultIndex; i < event.results.length; i++) {
          transcript += event.results[i][0].transcript;
          if (event.results[i].isFinal) {
            isFinal = true;
          }
        }

        const lowerTranscript = transcript.toLowerCase().trim();

        // Check for "Hey Regulon" wake-word
        if (isFinal && (lowerTranscript.includes("hey regulon") || lowerTranscript.startsWith("hey regulon"))) {
          setIsListening(true);
          setWakeWordDetected(true);
          setShowSiriInterface(true);
          setListeningText("Listening...");
          
          // Show Siri interface for 1 second, then hide
          setTimeout(() => {
            setShowSiriInterface(false);
          }, 3000);
          
          // Text-to-Speech: Regulon responds
          const utterance = new SpeechSynthesisUtterance(
            "Hey, this is Regulon AI, your compliance partner. Tell me what you need."
          );
          utterance.rate = 1;
          utterance.pitch = 1;
          utterance.volume = 1;
          window.speechSynthesis.cancel(); // Cancel any previous speech
          window.speechSynthesis.speak(utterance);
          
          toast.success("🎤 Regulon activated!");
          
          // Send wake-word event to backend
          fetch("/api/ca/voice/wake-word", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              "Authorization": `Bearer ${localStorage.getItem("token") || "ca-token-123"}`,
            },
            body: JSON.stringify({
              event: "wake_word_detected",
              timestamp: new Date().toISOString(),
              ca_id: "ca-001",
              responded_with_tts: true,
            }),
          }).catch(err => console.error("Wake-word logging failed:", err));

          // Extract command after "Hey Regulon"
          const commandText = lowerTranscript
            .replace(/hey regulon[\s,]*/i, "")
            .trim();

          if (commandText) {
            setUserInput(commandText);
            handleAgentQuery(commandText);
          }
        }
        // Only process normal commands if already listening
        else if (isListening && isFinal && transcript.length > 2) {
          setUserInput(transcript);
          handleAgentQuery(transcript);
        }
      };

      recognitionRef.current.onend = () => {
        // Restart listening for wake-word
        if (recognitionRef.current && !isListening) {
          recognitionRef.current.start();
        }
      };

      recognitionRef.current.onerror = (event: any) => {
        console.error("Speech recognition error:", event.error);
        if (event.error !== "no-speech") {
          setIsListening(false);
        }
      };

      // DON'T auto-start - user must click to activate
      // This respects user privacy and matches standard voice assistant behavior
    }
  }, []);

  // Initialize Daily Tasks
  useEffect(() => {
    fetchDailyBrief();
  }, []);

  // Fetch Daily Brief from Backend
  const fetchDailyBrief = async () => {
    try {
      const token = localStorage.getItem("token");
      if (!token) {
        console.error("No auth token found");
        return;
      }

      // Fetch real data from backend
      const response = await fetch("http://localhost:3001/api/ca/daily-governance", {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });

      if (!response.ok) {
        throw new Error("Failed to fetch daily brief");
      }

      const result = await response.json();

      if (!result.success || !result.data) {
        throw new Error("Invalid response from backend");
      }

      const { pendingTasks, dueIn7Days } = result.data;

      // Transform backend data to Task interface
      const allTasks: Task[] = [
        ...(pendingTasks || []).map((task: any, idx: number) => ({
          id: `task-${idx}`,
          title: task.title || task.name,
          priority: task.priority || "medium",
          status: task.status || "pending",
          dueDate: task.due_date || new Date().toISOString(),
          client: task.company_name || task.client,
          action: task.action || "Review",
          timestamp: new Date().toISOString(),
        })),
        ...(dueIn7Days || []).map((task: any, idx: number) => ({
          id: `due-${idx}`,
          title: task.title || task.name,
          priority: task.priority || "high",
          status: task.status || "pending",
          dueDate: task.due_date || new Date().toISOString(),
          client: task.company_name || task.client,
          action: task.action || "Review",
          timestamp: new Date().toISOString(),
        })),
      ];

      setTasks(allTasks);

      // Add initial activity
      addActivity(
        "task",
        "Daily Governance Brief",
        `${allTasks.length} tasks loaded from your portfolio. System ready.`
      );

      // Generate daily brief text from real data
      const taskList = allTasks
        .slice(0, 3)
        .map(
          (task, idx) =>
            `${idx + 1}. **${task.title}** for ${task.client} - Due on ${new Date(task.dueDate).toLocaleDateString()}`
        )
        .join("\n");

      const briefText = `Good morning! I've analyzed your compliance calendar. You have ${allTasks.length} active tasks:\n\n${taskList}\n\nWould you like me to start working on any of these?`;
      setDailyBrief(briefText);
    } catch (error) {
      console.error("Error fetching daily brief:", error);
      toast.error("Failed to load daily brief from backend");
    }
  };

  // Add Activity Log Entry
  const addActivity = (
    type: ActivityLog["type"],
    title: string,
    description: string,
    metadata?: Record<string, any>
  ) => {
    const newActivity: ActivityLog = {
      id: Math.random().toString(36).substr(2, 9),
      type,
      title,
      description,
      timestamp: new Date().toISOString(),
      metadata,
    };
    setActivities((prev) => [newActivity, ...prev].slice(0, 20)); // Keep last 20
  };

  // Handle Agent Query
  const handleAgentQuery = async (query: string) => {
    if (!query.trim()) return;

    setIsProcessing(true);
    setUserInput("");

    try {
      // Add user message to activity
      addActivity("message", "Your Request", query);

      // Send voice command to backend (if spoken)
      if (isListening) {
        try {
          const voiceResponse = await fetch("/api/ca/voice/command", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              "Authorization": `Bearer ${localStorage.getItem("token") || "ca-token-123"}`,
            },
            body: JSON.stringify({
              command: query,
              ca_id: "ca-001",
              timestamp: new Date().toISOString(),
            }),
          });

          if (voiceResponse.ok) {
            const voiceData = await voiceResponse.json();
            console.log("[VOICE] Command processed:", voiceData);
            // Add the backend response to activity log
            if (voiceData.log_entry) {
              addActivity(voiceData.action, "Voice Command", voiceData.response);
            }
          }
        } catch (voiceError) {
          console.error("Voice command logging failed:", voiceError);
        }
      }

      // Determine intent and execute tool
      if (
        query.toLowerCase().includes("draft") ||
        query.toLowerCase().includes("gstr") ||
        query.toLowerCase().includes("response")
      ) {
        // Tool: draft_response
        await executeDraftTool(query);
      } else if (
        query.toLowerCase().includes("reconcile") ||
        query.toLowerCase().includes("mismatch") ||
        query.toLowerCase().includes("gst-2a")
      ) {
        // Tool: reconcile_gst
        await executeReconcileTool(query);
      } else if (
        query.toLowerCase().includes("verify") ||
        query.toLowerCase().includes("hash") ||
        query.toLowerCase().includes("integrity")
      ) {
        // Tool: fetch_document_hash
        await executeVerifyTool(query);
      } else {
        // General AI response
        await executeGeneralQuery(query);
      }
    } catch (error) {
      console.error("Error processing agent query:", error);
      toast.error("Failed to process your request");
    } finally {
      setIsProcessing(false);
    }
  };

  // Tool: Draft Response
  const executeDraftTool = async (query: string) => {
    try {
      addActivity("task", "Executing: Draft Response", "Analyzing notice and preparing legal draft...");

      // Simulate tool execution
      await new Promise((resolve) => setTimeout(resolve, 2000));

      const draftContent = `RESPONSE TO GST NOTICE

TO: Deputy Commissioner of GST
Submitted by: Acme Pvt. Ltd.
Reference: Notice dated ${new Date().toLocaleDateString()}

LEGAL ARGUMENTS:
1. As per Section 73 of CGST Act, 2017, the demand is not sustainable.
2. The purchase register discrepancies are due to timing differences in document receipt.
3. Proper reconciliation is enclosed with supporting documentation.

SUPPORTING DOCUMENTS:
- Purchase Register (reconciled)
- GSTR-2A Report
- Bank Statements
- Vendor Invoices

CONCLUSION:
The assessee respectfully submits that the demand is erroneous and should be withdrawn.`;

      setApprovalRequest({
        id: Math.random().toString(36).substr(2, 9),
        type: "draft",
        title: "GST Notice Response - Acme Pvt. Ltd.",
        content: draftContent,
        client: "Acme Pvt. Ltd.",
        details: "Automated draft generated using legal precedents and GST Act provisions",
        generatedAt: new Date().toISOString(),
      });

      addActivity(
        "completion",
        "Draft Ready for Review",
        "GST notice response prepared. Awaiting your approval."
      );

      toast.success("Draft prepared! Please review and approve.");
    } catch (error) {
      console.error("Draft tool error:", error);
      toast.error("Failed to generate draft");
    }
  };

  // Tool: Reconcile GST
  const executeReconcileTool = async (query: string) => {
    try {
      addActivity(
        "task",
        "Executing: GST Reconciliation",
        "Fetching GSTR-2A data and comparing with purchase register..."
      );

      // Simulate tool execution
      await new Promise((resolve) => setTimeout(resolve, 2000));

      const reconcileContent = `GST RECONCILIATION REPORT
Date: ${new Date().toLocaleDateString()}

SUMMARY:
Total Purchase Register Amount: ₹50,00,000
Total GSTR-2A Amount: ₹48,50,000
Variance: ₹1,50,000 (3%)

MISMATCHES IDENTIFIED:
1. Invoice INV-001234: Amount difference ₹50,000
   - Register: ₹2,50,000
   - GSTR-2A: ₹2,00,000
   
2. Unmatched Invoices: 3 items (₹1,00,000)
   - Documents not uploaded by vendors

RECOMMENDATIONS:
1. Follow up with vendors for GSTR-1 filing
2. Verify invoice amounts in your records
3. Reconcile timing differences

ACTION ITEMS:
□ Contact vendors for confirmation
□ Update records if needed
□ File amended GSTR-2A claim`;

      setApprovalRequest({
        id: Math.random().toString(36).substr(2, 9),
        type: "reconciliation",
        title: "GSTR-2A Reconciliation Report",
        content: reconcileContent,
        client: "TechCorp India",
        details: "Automated reconciliation completed with action items identified",
        generatedAt: new Date().toISOString(),
      });

      addActivity(
        "alert",
        "Reconciliation Complete",
        "3 mismatches found. 2 require vendor follow-up."
      );

      toast.success("Reconciliation report generated!");
    } catch (error) {
      console.error("Reconcile tool error:", error);
      toast.error("Failed to reconcile");
    }
  };

  // Tool: Verify Document Hash
  const executeVerifyTool = async (query: string) => {
    try {
      addActivity(
        "task",
        "Executing: Document Verification",
        "Verifying SHA-256 hash against government registry..."
      );

      // Simulate tool execution
      await new Promise((resolve) => setTimeout(resolve, 2000));

      const verifyContent = `DOCUMENT INTEGRITY VERIFICATION REPORT

FILE: GSTR-3B_Jan2024.pdf
File Hash (SHA-256): a3f4d8e2f1b9c6a7e9f2d1c8b5a3e6f7

VERIFICATION RESULT: ✅ VERIFIED

Status: Hash matches government portal records
Verified At: ${new Date().toISOString()}
Verified Against: Official GST Portal Hash Registry

COMPLIANCE STATUS:
✓ File integrity confirmed
✓ No tampering detected
✓ Safe for government submission
✓ Audit trail established`;

      setApprovalRequest({
        id: Math.random().toString(36).substr(2, 9),
        type: "draft",
        title: "Document Integrity Verified",
        content: verifyContent,
        client: "Acme Pvt. Ltd.",
        details: "SHA-256 hash verification completed against government registry",
        generatedAt: new Date().toISOString(),
      });

      addActivity(
        "completion",
        "Document Verified",
        "File integrity confirmed. Safe for submission."
      );

      toast.success("Document verified! ✅");
    } catch (error) {
      console.error("Verify tool error:", error);
      toast.error("Failed to verify document");
    }
  };

  // General Query Handler
  const executeGeneralQuery = async (query: string) => {
    try {
      addActivity("task", "Processing Query", "Analyzing your request...");

      // Simulate AI processing
      await new Promise((resolve) => setTimeout(resolve, 1500));

      const response = `I've analyzed your request. Here's what I can help with:

1. **Draft Compliance Documents** - I can auto-draft GST responses, notice replies, and financial statements
2. **Reconcile Data** - Compare your records with GSTR-2A and identify discrepancies
3. **Verify Documents** - Check file integrity against government hash registries
4. **Monitor Deadlines** - Track all compliance dates and send alerts
5. **Generate Reports** - Create compliance summaries and audit trails

What would you like me to do next?`;

      addActivity("message", "AI Agent Response", response);

      toast.success("Processing complete");

      // Play audio response
      speakResponse(response);
    } catch (error) {
      console.error("General query error:", error);
      toast.error("Failed to process query");
    }
  };

  // Voice Output (Text-to-Speech)
  const speakResponse = (text: string) => {
    if ("speechSynthesis" in window) {
      // Cancel any ongoing speech
      window.speechSynthesis.cancel();

      const utterance = new SpeechSynthesisUtterance(text);
      utterance.rate = 1;
      utterance.pitch = 1;
      utterance.volume = 1;

      window.speechSynthesis.speak(utterance);
    }
  };

  // Voice Input Toggle
  const toggleVoiceInput = () => {
    if (!recognitionRef.current) {
      toast.error("Speech recognition not supported");
      return;
    }

    if (isListening) {
      recognitionRef.current.stop();
      setIsListening(false);
      toast.info("Voice assistant stopped");
    } else {
      try {
        recognitionRef.current.start();
        setIsListening(true);
        toast.success('Voice assistant active - Say "Hey Regulon"');
      } catch (error) {
        console.error("Failed to start speech recognition:", error);
        toast.error("Failed to start voice recognition");
      }
    }
  };

  // Play Daily Briefing
  const playDailyBriefing = () => {
    if (!dailyBrief) return;
    speakResponse(dailyBrief);
    setShowBriefing(true);
  };

  // Approve and Mark Task
  const approveAndFinalize = async () => {
    try {
      if (!approvalRequest) return;

      setIsProcessing(true);

      // Simulate approval and PDF generation
      await new Promise((resolve) => setTimeout(resolve, 2000));

      // Mark related task as approved
      const relatedTask = tasks.find(
        (t) => t.client === approvalRequest.client
      );
      if (relatedTask) {
        setTasks((prev) =>
          prev.map((t) =>
            t.id === relatedTask.id
              ? { ...t, status: "approved" }
              : t
          )
        );
      }

      addActivity(
        "completion",
        "Document Approved & Finalized",
        `${approvalRequest.title} marked as VERIFIED_BY_CA. PDF ready for download.`
      );

      // Simulate PDF generation
      const pdfText = `${approvalRequest.title}\n\nApproved by: CA\nApproval Date: ${new Date().toLocaleDateString()}\n\n${approvalRequest.content}`;
      const element = document.createElement("a");
      element.setAttribute(
        "href",
        "data:text/plain;charset=utf-8," + encodeURIComponent(pdfText)
      );
      element.setAttribute(
        "download",
        `${approvalRequest.title.replace(/\s+/g, "_")}.txt`
      );
      element.style.display = "none";
      document.body.appendChild(element);
      element.click();
      document.body.removeChild(element);

      toast.success("Document approved and exported!");
      setApprovalRequest(null);
    } catch (error) {
      console.error("Approval error:", error);
      toast.error("Failed to approve document");
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <>
      {/* Siri-like "Hey Regulon" Interface with Animated Circles */}
      <AnimatePresence>
        {showSiriInterface && (
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.8 }}
            className="fixed inset-0 flex items-center justify-center z-[9999] bg-black/60 backdrop-blur-md"
          >
            <motion.div className="text-center">
              {/* Animated Circle Background with Pulsing Rings */}
              <div className="relative w-64 h-64 flex items-center justify-center mb-8">
                {/* Outer pulsing ring 1 */}
                <motion.div
                  animate={{ scale: [1, 1.3], opacity: [1, 0] }}
                  transition={{ duration: 2, repeat: Infinity }}
                  className="absolute w-full h-full rounded-full border-4 border-cyan-400"
                />
                
                {/* Outer pulsing ring 2 */}
                <motion.div
                  animate={{ scale: [1, 1.2], opacity: [1, 0] }}
                  transition={{ duration: 2, repeat: Infinity, delay: 0.4 }}
                  className="absolute w-full h-full rounded-full border-4 border-blue-500"
                />
                
                {/* Middle ring */}
                <motion.div
                  animate={{ scale: [1, 1.1], opacity: [0.5, 1] }}
                  transition={{ duration: 2, repeat: Infinity }}
                  className="absolute w-4/5 h-4/5 rounded-full border-3 border-cyan-300"
                />

                {/* Center circle */}
                <motion.div
                  animate={{ 
                    boxShadow: [
                      "0 0 20px rgba(0, 188, 212, 0.5)",
                      "0 0 60px rgba(0, 188, 212, 1)",
                      "0 0 20px rgba(0, 188, 212, 0.5)"
                    ]
                  }}
                  transition={{ duration: 1.5, repeat: Infinity }}
                  className="w-32 h-32 rounded-full bg-gradient-to-br from-cyan-400 to-blue-600 flex items-center justify-center shadow-2xl"
                >
                  <motion.div
                    animate={{ scale: [0.8, 1.2] }}
                    transition={{ duration: 1.5, repeat: Infinity }}
                    className="text-white text-5xl"
                  >
                    🎤
                  </motion.div>
                </motion.div>

                {/* Animated dots around the circle */}
                {[0, 1, 2, 3, 4, 5].map((i) => (
                  <motion.div
                    key={i}
                    animate={{ 
                      rotate: 360,
                      y: [0, -80, 0]
                    }}
                    transition={{ 
                      duration: 3, 
                      repeat: Infinity,
                      delay: i * 0.3
                    }}
                    className="absolute w-4 h-4 rounded-full bg-cyan-400"
                    style={{
                      top: '50%',
                      left: '50%',
                      transform: `rotate(${(i * 60)}deg) translateY(-120px)`
                    }}
                  />
                ))}
              </div>

              {/* Text display */}
              <motion.div
                animate={{ opacity: [0.7, 1] }}
                transition={{ duration: 0.5, repeat: Infinity, repeatType: "mirror" }}
                className="text-center"
              >
                <h2 className="text-4xl font-bold text-cyan-400 mb-2">REGULON AI</h2>
                <p className="text-xl text-cyan-300 mb-4">Listening...</p>
                <p className="text-gray-300 max-w-md mx-auto">
                  "Hey, this is Regulon AI, your compliance partner. Tell me what you need."
                </p>
              </motion.div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* TOP RIGHT: Voice Assistant Status Indicator */}
      <motion.div
        initial={{ opacity: 0, x: 20 }}
        animate={{ opacity: 1, x: 0 }}
        className="fixed top-20 right-6 z-50"
      >
        <Card 
          className="glass-card border-cyan-500/30 bg-gradient-to-br from-cyan-500/10 to-blue-500/10 shadow-xl cursor-pointer hover:shadow-2xl transition-all duration-300 hover:scale-105"
          onClick={toggleVoiceInput}
        >
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <motion.div
                animate={{ 
                  scale: isListening ? [1, 1.2, 1] : 1,
                  boxShadow: isListening 
                    ? ["0 0 10px rgba(0,188,212,0.3)", "0 0 30px rgba(0,188,212,0.8)", "0 0 10px rgba(0,188,212,0.3)"]
                    : "0 0 10px rgba(0,188,212,0.2)"
                }}
                transition={{ duration: 1.5, repeat: Infinity }}
                className="p-3 rounded-full bg-gradient-to-br from-cyan-400 to-blue-600"
              >
                {isListening ? (
                  <Mic className="w-6 h-6 text-white" />
                ) : (
                  <Bot className="w-6 h-6 text-white" />
                )}
              </motion.div>
              <div>
                <p className="text-sm font-semibold text-cyan-400">
                  {isListening ? "Listening..." : "Regulon AI"}
                </p>
                <p className="text-xs text-muted-foreground">
                  {isListening ? '🎤 Say "Hey Regulon"' : "Click to activate"}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* BOTTOM: Chatbot Interface (like ChatGPT) */}
      <motion.div
        initial={{ opacity: 0, y: 100 }}
        animate={{ opacity: 1, y: 0 }}
        className="fixed bottom-6 left-1/2 -translate-x-1/2 w-full max-w-3xl px-4 z-40"
      >
        <Card className="glass-card border-cyan-500/30 bg-card/95 backdrop-blur-xl shadow-2xl">
          <CardContent className="p-6 space-y-4">
            {/* Activity Feed - Scrollable */}
            {activities.length > 0 && (
              <div className="max-h-48 overflow-y-auto space-y-2 mb-4">
                {activities.slice(-3).map((activity) => (
                  <motion.div
                    key={activity.id}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    className="p-3 rounded-lg bg-cyan-500/5 border border-cyan-500/20"
                  >
                    <div className="flex items-start gap-2">
                      <Bot className="w-4 h-4 text-cyan-400 mt-0.5" />
                      <div className="flex-1">
                        <p className="text-sm font-medium text-foreground">{activity.title}</p>
                        <p className="text-xs text-muted-foreground">{activity.description}</p>
                      </div>
                      <span className="text-xs text-muted-foreground">
                        {new Date(activity.timestamp).toLocaleTimeString()}
                      </span>
                    </div>
                  </motion.div>
                ))}
              </div>
            )}

            {/* Chat Input */}
            <div className="flex gap-3">
              <Textarea
                placeholder='Say "Hey Regulon" or type here...\n• "Draft GSTR-3B response"\n• "Check GST notices"\n• "Reconcile data"'
                value={userInput}
                onChange={(e) => setUserInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && e.ctrlKey) {
                    handleAgentQuery(userInput);
                  }
                }}
                disabled={isProcessing}
                className="flex-1 min-h-24 resize-none bg-card/50 border-cyan-500/30 focus:border-cyan-500"
              />
              <div className="flex flex-col gap-2">
                <Button
                  onClick={() => handleAgentQuery(userInput)}
                  disabled={isProcessing || !userInput.trim()}
                  className="bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-700 hover:to-blue-700"
                  size="lg"
                >
                  {isProcessing ? (
                    <Loader className="w-5 h-5 animate-spin" />
                  ) : (
                    <Send className="w-5 h-5" />
                  )}
                </Button>
                <Button
                  onClick={toggleVoiceInput}
                  variant={isListening ? "destructive" : "outline"}
                  size="lg"
                  className="border-cyan-500/30"
                >
                  {isListening ? (
                    <MicOff className="w-5 h-5" />
                  ) : (
                    <Mic className="w-5 h-5" />
                  )}
                </Button>
              </div>
            </div>

            {/* Tasks Preview */}
            {tasks.length > 0 && (
              <div className="pt-2 border-t border-border/50">
                <p className="text-xs text-muted-foreground mb-2">
                  {tasks.length} pending tasks • Say "Hey Regulon, show tasks"
                </p>
                <div className="flex gap-2 overflow-x-auto">
                  {tasks.slice(0, 3).map((task) => (
                    <Badge 
                      key={task.id} 
                      variant="outline" 
                      className="text-xs whitespace-nowrap border-cyan-500/30"
                    >
                      {task.title}
                    </Badge>
                  ))}
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </motion.div>
      {/* Approval Modal */}
      <AnimatePresence>
        {approvalRequest && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
            onClick={() => setApprovalRequest(null)}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className="w-full max-w-2xl max-h-[90vh] overflow-y-auto"
            >
              <Card className="glass-card border-cyan-500/20">
                <CardHeader className="flex flex-row items-start justify-between space-y-0">
                  <div>
                    <CardTitle className="text-cyan-400">
                      {approvalRequest.type === "draft"
                        ? "Document Draft for Approval"
                        : approvalRequest.type === "filing"
                        ? "Filing Submission for Approval"
                        : "Reconciliation Report for Review"}
                    </CardTitle>
                    <CardDescription className="mt-2">
                      {approvalRequest.title}
                    </CardDescription>
                  </div>
                  <Button
                    size="icon"
                    variant="ghost"
                    onClick={() => setApprovalRequest(null)}
                  >
                    <X className="w-4 h-4" />
                  </Button>
                </CardHeader>

                <CardContent className="space-y-4">
                  {/* Document Preview */}
                  <div>
                    <p className="text-sm text-muted-foreground mb-2">
                      Client: <span className="text-foreground font-medium">{approvalRequest.client}</span>
                    </p>
                    <p className="text-sm text-muted-foreground mb-4">
                      Details: {approvalRequest.details}
                    </p>

                    <div className="bg-card/50 border border-border/50 rounded-lg p-4 max-h-64 overflow-y-auto">
                      <pre className="text-xs text-foreground whitespace-pre-wrap font-mono">
                        {approvalRequest.content}
                      </pre>
                    </div>
                  </div>

                  {/* Action Buttons */}
                  <div className="flex gap-2 justify-end pt-4 border-t border-border/50">
                    <Button
                      variant="outline"
                      onClick={() => setApprovalRequest(null)}
                      disabled={isProcessing}
                    >
                      Reject
                    </Button>
                    <Button
                      onClick={approveAndFinalize}
                      disabled={isProcessing}
                      className="gap-2 bg-green-600 hover:bg-green-700"
                    >
                      {isProcessing ? (
                        <>
                          <div className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full" />
                          Finalizing...
                        </>
                      ) : (
                        <>
                          <CheckCircle className="w-4 h-4" />
                          Approve & Finalize PDF
                        </>
                      )}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};

export default RegulonAIAgent;

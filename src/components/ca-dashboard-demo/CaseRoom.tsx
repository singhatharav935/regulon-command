import React, { useState, useEffect, useCallback, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Scale,
  Building,
  Clock,
  AlertTriangle,
  CheckCircle,
  MessageSquare,
  Loader,
  Zap,
  Shield,
  X,
  Fingerprint,
  FileText,
  ChevronRight,
  Download,
  Gavel,
  Archive,
  ArrowLeft,
  Calendar,
  Sparkles,
  Play,
  Pause,
  Video,
  VideoOff,
  Mic,
  MicOff,
  PhoneOff,
  UserCheck,
  Volume2,
  BrainCircuit,
  PenLine,
  BadgeCheck,
  RefreshCw,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { buildOfflineDraft } from "./AIDraftingEngine";

interface DisputeCase {
  id: string;
  client: string;
  clientId: string;
  refNumber: string;
  portal: string;
  noticeType: string;
  mismatchAmount: string;
  status: "re_notice_received" | "drafting" | "rejoinder_drafted" | "signed" | "filing" | "filed";
  issueDate: string;
  dueDate: string;
  timeline: {
    title: string;
    description: string;
    timestamp: string;
    actor: "government" | "ca" | "ai-swarm";
    type: "notice" | "reply" | "re_notice" | "rejoinder" | "final_order";
  }[];
  rejoinderDraft?: string;
  arn?: string;
  hearingDate?: string;
  hearingTime?: string;
  hearingAuthority?: string;
}

export default function CaseRoom() {
  const [activeSubSection, setActiveSubSection] = useState<"cases" | "hearings" | "archive" | "ai-drafts">("cases");
  const [aiDraftSignCase, setAiDraftSignCase] = useState<DisputeCase | null>(null);
  const [aiDraftEditTexts, setAiDraftEditTexts] = useState<Record<string, string>>({});
  const [aiDraftTones, setAiDraftTones] = useState<Record<string, 'precedent' | 'aggressive' | 'fact'>>({});
  const [aiDraftSigningId, setAiDraftSigningId] = useState<string | null>(null);
  const [aiDraftEditMode, setAiDraftEditMode] = useState<Record<string, boolean>>({});
  const [demoClients, setDemoClients] = useState<any[]>([]);
  const [selectedClientFilter, setSelectedClientFilter] = useState<string>("all");
  const [cases, setCases] = useState<DisputeCase[]>([]);
  const [selectedCase, setSelectedCase] = useState<DisputeCase | null>(null);
  
  // E-Sign and Filing local state for interactive timeline
  const [showOtpModal, setShowOtpModal] = useState(false);
  const [otpInput, setOtpInput] = useState("");
  const [otpVerifying, setOtpVerifying] = useState(false);
  const [showFilingConsole, setShowFilingConsole] = useState(false);
  const [filingLogs, setFilingLogs] = useState<string[]>([]);

  // Virtual hearing state
  const [showVcModal, setShowVcModal] = useState(false);
  const [vcCase, setVcCase] = useState<DisputeCase | null>(null);
  const [vcLogs, setVcLogs] = useState<string[]>([]);
  const [vcStatus, setVcStatus] = useState<"connecting" | "active" | "concluded">("connecting");
  const [isMicMuted, setIsMicMuted] = useState(false);
  const [isCamOff, setIsCamOff] = useState(false);

  // Load clients and cases
  const loadData = useCallback(() => {
    let clients: any[] = [];
    try {
      const saved = localStorage.getItem("demo_clients");
      if (saved) clients = JSON.parse(saved);
    } catch (e) {}

    // Auto-seed three default clients for demo purposes if empty
    if (clients.length === 0) {
      clients = [
        {
          id: "demo-client-acme",
          name: "Acme Corporates Ltd",
          industry: "Technology & Software",
          health: 84,
          risk: "High",
          gaps: 2,
          deadline: new Date(Date.now() + 15 * 86400000).toLocaleDateString('en-GB'),
          status: "Verified",
          gstin: "27AABCT1234Q1Z5",
          pan: "AABCT1234Q",
          created_at: new Date().toISOString(),
        },
        {
          id: "demo-client-zenith",
          name: "Zenith Retail Pvt Ltd",
          industry: "Manufacturing & Retail",
          health: 92,
          risk: "Medium",
          gaps: 1,
          deadline: new Date(Date.now() + 18 * 86400000).toLocaleDateString('en-GB'),
          status: "Verified",
          gstin: "27AABCT5678R1Z2",
          pan: "AABCT5678R",
          created_at: new Date().toISOString(),
        },
        {
          id: "demo-client-apex",
          name: "Apex Logistics & Trade",
          industry: "Logistics & Supply Chain",
          health: 98,
          risk: "Low",
          gaps: 0,
          deadline: new Date(Date.now() + 25 * 86400000).toLocaleDateString('en-GB'),
          status: "Verified",
          gstin: "27AABCT9999S1Z9",
          pan: "AABCT9999S",
          created_at: new Date().toISOString(),
        }
      ];
      localStorage.setItem("demo_clients", JSON.stringify(clients));
      setTimeout(() => {
        window.dispatchEvent(new CustomEvent("demo-client-added"));
        window.dispatchEvent(new CustomEvent("ca:metrics-updated"));
      }, 100);
    }
    setDemoClients(clients);

    // Check if we have cases persisted in localStorage, otherwise generate them
    let savedCases: DisputeCase[] = [];
    try {
      const saved = localStorage.getItem("demo:case_room_cases");
      if (saved) {
        savedCases = JSON.parse(saved);
      } else {
        // Fallback: try loading company-wise keys
        clients.forEach((client) => {
          const clientSaved = localStorage.getItem(`demo:case_room_cases_${client.id}`);
          if (clientSaved) {
            try {
              savedCases.push(JSON.parse(clientSaved));
            } catch (e) {}
          }
        });
      }
    } catch (e) {}

    // Check if client list changed or cases need initialization
    const clientIds = clients.map((c) => c.id);
    const existingCaseClientIds = savedCases.map((c) => c.clientId);
    const missingClients = clients.filter((c) => !existingCaseClientIds.includes(c.id));

    // If we have cases but some clients are missing, generate them
    if (savedCases.length === 0 || missingClients.length > 0) {
      const newCases: DisputeCase[] = [...savedCases];
      clients.forEach((client, idx) => {
        // Only generate if client doesn't have a case in room
        if (existingCaseClientIds.includes(client.id)) return;

        const clientName = client.name || client.client_name;
        
        // Let's create realistic case timelines
        const distribution = idx % 3;
        if (distribution === 0) {
          // GST Dispute
          newCases.push({
            id: `case-gst-${client.id}`,
            client: clientName,
            clientId: client.id,
            refNumber: `SCN/DRC01/2026/${100 + idx}`,
            portal: "GST Portal",
            noticeType: "GST Show Cause Notice (GST-DRC-01) - Supplier Filing Default",
            mismatchAmount: `₹${((10 + idx * 4.3) * 100000).toLocaleString("en-IN")}`,
            status: "re_notice_received",
            issueDate: "2026-02-07",
            dueDate: "2026-06-25",
            timeline: [
              {
                title: "GST Show Cause Notice Issued",
                description: `Government flagged GSTR-2B vs Books mismatch of ₹${((10 + idx * 4.3) * 100000).toLocaleString("en-IN")} due to defaulting supplier filings.`,
                timestamp: "2026-02-07T10:00:00.000Z",
                actor: "government",
                type: "notice"
              },
              {
                title: "Sannidh AI Rebuttal Response Filed",
                description: "Submitted purchase register invoices and transaction RTGS proof. Government Acknowledgment ARN: GST-ARN-2026-902341.",
                timestamp: "2026-02-15T14:30:00.000Z",
                actor: "ca",
                type: "reply"
              },
              {
                title: "Government Rejoinder / DRC-01D Issued",
                description: "GST Superintendent rejected payment proof claiming supplier registration has been retroactively cancelled. Demanded revised defense within 15 days.",
                timestamp: "2026-06-10T11:00:00.000Z",
                actor: "government",
                type: "re_notice"
              }
            ],
            rejoinderDraft: buildOfflineDraft({
              documentType: "gst-show-cause",
              companyName: clientName,
              authority: "GST Department",
              noticeText: `REJOINDER REPLY TO RE-NOTICE DRC-01D
Reference No: SCN/DRC01/2026/${100 + idx}
We refer to the statement of facts issued under Form GST DRC-01D dated 10 June 2026.
It is respectfully submitted that:
1. The supplier's registration was active at the time of the transaction (February 2026).
2. Pursuant to the landmark Supreme Court ruling in CIT v. Suresh Kumar, the buyer cannot be penalized for retroactive cancellation of a supplier's registration.
3. Tax payment and actual delivery of goods have been fully verified via e-Way bills and bank statements.
We pray that the proposed demand be dropped.`,
              modeLabel: "conservative",
              templatePack: "Detailed Para-Wise Reply",
              promptPack: "Precedent Analysis + Objection Matrix",
              sovereignEngine: "sannidh_sovereign"
            }),
            hearingDate: "2026-06-22",
            hearingTime: "11:30 AM (IST)",
            hearingAuthority: "Deputy Commissioner of Tax (Appeals)"
          });
        } else if (distribution === 1) {
          // MCA Dispute
          newCases.push({
            id: `case-mca-${client.id}`,
            client: clientName,
            clientId: client.id,
            refNumber: `ROC/KA/ADJ/2026/${200 + idx}`,
            portal: "MCA Portal",
            noticeType: "Director DIN Suspension Notice (Sec 164) - Aadhaar Mismatch",
            mismatchAmount: "₹2,50,000",
            status: "re_notice_received",
            issueDate: "2026-01-15",
            dueDate: "2026-06-30",
            timeline: [
              {
                title: "Director DIN Suspension Notice",
                description: "MCA-21 flagged suspension of Director Identification Number (DIN) due to spelling discrepancy in Aadhaar vs MCA database.",
                timestamp: "2026-01-15T09:00:00.000Z",
                actor: "government",
                type: "notice"
              },
              {
                title: "DIR-3 KYC Change Request Submitted",
                description: "E-filed Form DIR-3 KYC with supporting biometric declaration. Acknowledgment SRN: SRN-MCA-928410.",
                timestamp: "2026-01-20T16:00:00.000Z",
                actor: "ca",
                type: "reply"
              },
              {
                title: "MCA Rejection Notice (Re-Notice)",
                description: "ROC Rejected KYC filing, citing signature verification failure on digitized board resolution. Demanded clean resolution scan.",
                timestamp: "2026-06-11T13:45:00.000Z",
                actor: "government",
                type: "re_notice"
              }
            ],
            rejoinderDraft: `RE-SUBMISSION OF DIR-3 KYC DETAILS
Reference No: ROC/KA/ADJ/2026/${200 + idx}
To the Registrar of Companies,
In response to the KYC rejection notice dated 11 June 2026:
1. We attach the high-resolution scan of the board resolution dated 12 January 2026.
2. The digital signatures of both the director and the practicing CA have been re-validated.
We request you to reinstate the Director DIN at the earliest.`,
            hearingDate: "2026-06-25",
            hearingTime: "02:30 PM (IST)",
            hearingAuthority: "Registrar of Companies (ROC-KA)"
          });
        }
        // index % 3 === 2 will have 0 active disputes (clean records!)
      });

      localStorage.setItem("demo:case_room_cases", JSON.stringify(newCases));
      setCases(newCases);
    } else {
      // Remove cases for clients that no longer exist
      const activeIds = clients.map(c => c.id);
      const filtered = savedCases.filter(c => activeIds.includes(c.clientId));
      if (filtered.length !== savedCases.length) {
        localStorage.setItem("demo:case_room_cases", JSON.stringify(filtered));
      }
      setCases(filtered);
    }
  }, []);

  useEffect(() => {
    loadData();
    window.addEventListener("demo-client-added", loadData);
    window.addEventListener("ca:metrics-updated", loadData);
    return () => {
      window.removeEventListener("demo-client-added", loadData);
      window.removeEventListener("ca:metrics-updated", loadData);
    };
  }, [loadData]);

  // Persist case thread history company-wise
  useEffect(() => {
    if (cases.length > 0) {
      cases.forEach((c) => {
        localStorage.setItem(`demo:case_room_cases_${c.clientId}`, JSON.stringify(c));
      });
    }
  }, [cases]);

  // Dynamic jsPDF document generation & download
  const downloadPdf = async (type: 'submissions' | 'disposal' | 'rejoinder', caseObj: DisputeCase) => {
    toast.info("Generating professional PDF document...");
    try {
      const { jsPDF } = await import('jspdf');
      const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
      const pageWidth = doc.internal.pageSize.getWidth();
      const pageHeight = doc.internal.pageSize.getHeight();
      const margin = 20;
      const contentWidth = pageWidth - (margin * 2);
      let yPos = margin;

      // Header Letterhead
      doc.setFillColor(88, 28, 135); // Deep Purple
      doc.rect(0, 0, pageWidth, 40, 'F');
      
      doc.setTextColor(255, 255, 255);
      doc.setFontSize(16);
      doc.setFont('helvetica', 'bold');
      doc.text("SANNIDH AI COMPLIANCE PLATFORM", margin, 15);
      
      doc.setFontSize(10);
      doc.setFont('helvetica', 'normal');
      doc.text("Automated Litigation & Appellate Dispute Room", margin, 22);
      doc.text(`Generated: ${new Date().toLocaleDateString('en-IN')} | Secure Doc ID: ${Math.random().toString(36).substring(2, 11).toUpperCase()}`, margin, 28);
      
      // Body layout
      yPos = 55;
      
      doc.setTextColor(15, 23, 42);
      doc.setFontSize(14);
      doc.setFont('helvetica', 'bold');
      
      let title = "";
      let filename = "";
      if (type === 'submissions') {
        title = "WRITTEN SUBMISSIONS FOR PERSONAL HEARING";
        filename = `SANNIDH-Submissions-Hearing-${caseObj.refNumber.replace(/[^a-zA-Z0-9]/g, "_")}.pdf`;
      } else if (type === 'disposal') {
        title = "FINAL ASSESSMENT DISPOSAL ORDER";
        filename = `Order_Disposal_${caseObj.refNumber.replace(/[^a-zA-Z0-9]/g, "_")}.pdf`;
      } else {
        title = "REJOINDER MEMO REPLY TO RE-NOTICE";
        filename = `Rejoinder_Reply_${caseObj.refNumber.replace(/[^a-zA-Z0-9]/g, "_")}.pdf`;
      }
      
      doc.text(title, margin, yPos);
      yPos += 8;
      
      // Line separator
      doc.setDrawColor(226, 232, 240);
      doc.line(margin, yPos, pageWidth - margin, yPos);
      yPos += 10;
      
      // Case Info table
      doc.setFontSize(10);
      doc.setFont('helvetica', 'bold');
      doc.text("CASE METADATA", margin, yPos);
      yPos += 6;
      
      doc.setFont('helvetica', 'normal');
      const metadata = [
        ["Client Name:", caseObj.client],
        ["Dispute Reference:", caseObj.refNumber],
        ["Authority/Portal:", caseObj.portal],
        ["Notice Type:", caseObj.noticeType],
        ["Disputed Objection Value:", caseObj.mismatchAmount],
        ["Case Status:", caseObj.status === 'filed' ? 'RESOLVED / CLOSED' : 'ACTIVE / IN-PROGRESS']
      ];
      
      metadata.forEach(([label, val]) => {
        doc.setFont('helvetica', 'bold');
        doc.text(label, margin, yPos);
        doc.setFont('helvetica', 'normal');
        
        // Handle multi-line wrap for long notice types
        const splitVal = doc.splitTextToSize(val, contentWidth - 45);
        doc.text(splitVal, margin + 45, yPos);
        
        yPos += (splitVal.length * 5) + 1;
      });
      
      yPos += 6;
      doc.line(margin, yPos, pageWidth - margin, yPos);
      yPos += 10;
      
      // Content body
      doc.setFont('helvetica', 'bold');
      doc.text("DOCUMENT BODY", margin, yPos);
      yPos += 6;
      
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(9.5);
      
      let contentText = "";
      if (type === 'submissions') {
        contentText = `STATUTORY SUBMISSIONS UNDER LAWS OF TRIBUNAL APPEALS\n\n` +
          `We refer to the scheduled personal hearing reference ${caseObj.refNumber} regarding the alleged liability of ${caseObj.mismatchAmount}.\n\n` +
          `1. The Assessee submits that all relevant purchase ledgers, RTGS receipts, and reciprocal GSTR-1 filings have been compiled and verified by Sannidh's automated audit swarm.\n` +
          `2. Precedent Case Law: The hon'ble Supreme Court in CIT v. Suresh Kumar (2024) held that retroactive cancellation of supplier GST registrations cannot defeat the input tax credit claims of bona fide purchasers.\n` +
          `3. All transactions were executed while the vendor's profile was fully compliant and active on the GSTIN portal.\n\n` +
          `We pray that the oral arguments be accepted and the proposed draft demands be set aside.`;
      } else if (type === 'disposal') {
        contentText = `OFFICE OF THE DEPUTY COMMISSIONER OF STATUTORY TAXATION\n\n` +
          `Order of Disposal under Section 73 of the Statutory Audit Act, 2026\n\n` +
          `Having examined the rejoinder submissions dated ${new Date(caseObj.issueDate).toLocaleDateString('en-IN')} and verified the transactional RTGS schedules submitted via the automated CA dashboard:\n\n` +
          `1. The objections regarding supplier cancellation are found to be unsubstantiated as the purchase ledgers demonstrate real delivery of goods.\n` +
          `2. The disputed value of ${caseObj.mismatchAmount} stands dropped in full.\n` +
          `3. The taxpayer account is marked clean and compliant. No penalty interest is assessed.\n\n` +
          `Case is hereby closed and disposed.`;
      } else {
        contentText = caseObj.rejoinderDraft || `REJOINDER MEMO REPLY\n\nReference: ${caseObj.refNumber}\n\nWe submit that our filings are fully compliant. Tax payment proof, e-way bills, and bank RTGS records have been attached. There is zero tax default.`;
      }
      
      const splitContent = doc.splitTextToSize(contentText, contentWidth);
      doc.text(splitContent, margin, yPos);
      
      // Footer Signature
      yPos = pageHeight - 35;
      doc.line(margin, yPos, pageWidth - margin, yPos);
      yPos += 8;
      
      doc.setFontSize(9);
      doc.setFont('helvetica', 'bold');
      doc.text("Digitally Authenticated By Sannidh Cryptographic Gateway", margin, yPos);
      doc.setFont('helvetica', 'normal');
      doc.text("Aadhaar DSC Signature: e-Sign verified via NeSL Gateway", margin, yPos + 5);
      doc.text(`ARN Number: ${caseObj.arn || 'PENDING_FINAL_FILING'}`, margin, yPos + 10);
      
      // Stamp Box
      doc.setDrawColor(88, 28, 135);
      doc.rect(pageWidth - margin - 35, yPos - 3, 35, 15);
      doc.setFontSize(8);
      doc.setTextColor(88, 28, 135);
      doc.text("SANNIDH VERIFIED", pageWidth - margin - 32, yPos + 3);
      doc.text("SECURE FILING", pageWidth - margin - 30, yPos + 8);
      
      doc.save(filename);
      toast.success("PDF Downloaded successfully!");
    } catch (err) {
      console.error(err);
      toast.error("Failed to generate PDF. Falling back to text file.");
      // Fallback simple download
      const text = `Title: ${type.toUpperCase()} - Case ${caseObj.refNumber}\nClient: ${caseObj.client}\nDisputed Amount: ${caseObj.mismatchAmount}\nARN: ${caseObj.arn || 'N/A'}`;
      const blob = new Blob([text], { type: "text/plain;charset=utf-8" });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `${type}_${caseObj.refNumber.replace(/[^a-zA-Z0-9]/g, "_")}.txt`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  };

  const handleJoinHearing = (caseObj: DisputeCase) => {
    setVcCase(caseObj);
    setShowVcModal(true);
    setVcStatus("connecting");
    setVcLogs(["Initializing secure connection to Court Server...", "Authorizing digital identity via Sannidh DSC token..."]);
    
    // Simulate connection phase
    setTimeout(() => {
      setVcLogs(prev => [...prev, "Authenticated. Joining hearing queue...", "Position in Queue: 1. Entering virtual bench."]);
      
      setTimeout(() => {
        setVcStatus("active");
        
        // Feed transcript steps
        const transcriptLines = [
          `[Appellate Authority]: Presiding in Case Ref: ${caseObj.refNumber} for ${caseObj.client}. Objection value: ${caseObj.mismatchAmount}.`,
          `[Assessing Officer]: Sir, the input credit is disallowed because supplier GSTIN registration cancellation is retrospective.`,
          `[Sannidh AI]: High Authority, we respectfully reference the supreme ruling in CIT v. Suresh Kumar. The taxpayer has bona fide evidence of actual delivery, bank RTGS clears, and active vendor profile at the time of supply.`,
          `[Commissioner]: Correct. Taxpayer cannot be penalized for retroactive vendor defaults when due diligence was satisfied.`,
          `[Commissioner]: I am directing the department to allow the full credit. The demand of ${caseObj.mismatchAmount} stands deleted in full.`,
          `[Appellate Authority]: Gavel stroke. Dispute closed. Assessment disposal order will be auto-generated and uploaded.`
        ];
        
        let index = 0;
        const interval = setInterval(() => {
          if (index < transcriptLines.length) {
            setVcLogs(prev => [...prev, transcriptLines[index]]);
            index++;
          } else {
            clearInterval(interval);
            setVcStatus("concluded");
            // Auto resolve case if not already filed!
            const arnNumber = `ARN-REJ-2026-${Math.floor(100000 + Math.random() * 900000)}`;
            if (caseObj.status !== 'filed') {
              completeCaseInStorage(caseObj.id, arnNumber);
            }
          }
        }, 3000);
      }, 2000);
    }, 2000);
  };

  // Swarm Auto-pilot Integration: runs in background and resolves cases in "auto" mode
  useEffect(() => {
    const isAutoMode = localStorage.getItem("sannidh:dashboard-mode") === "auto";
    if (!isAutoMode) return;

    // Find the first case awaiting action (re_notice_received)
    const activeCase = cases.find((c) => c.status === "re_notice_received");
    if (!activeCase) return;

    // Auto-resolve case with progressive state transitions
    const timer = setTimeout(() => {
      autoResolveCase(activeCase.id);
    }, 6000); // Trigger after 6 seconds of inactivity

    return () => clearTimeout(timer);
  }, [cases]);

  const simulateNewCase = useCallback(() => {
    // Get current clients
    let clients: any[] = [];
    try {
      const saved = localStorage.getItem("demo_clients");
      if (saved) clients = JSON.parse(saved);
    } catch (e) {}

    if (clients.length === 0) return;

    // Select a random client
    const randomClient = clients[Math.floor(Math.random() * clients.length)];
    const clientName = randomClient.name || randomClient.client_name;

    // Create a new active case for this client
    const newCaseId = `case-gst-sim-${Date.now()}`;
    const newRefNum = `SCN/DRC01/2026/${Math.floor(300 + Math.random() * 200)}`;
    const disputedVal = `₹${(Math.floor(5 + Math.random() * 25) * 100000).toLocaleString("en-IN")}`;
    
    const hasHearing = true; // simulated cases always schedule a hearing for demo completeness
    
    const newActiveCase: DisputeCase = {
      id: newCaseId,
      client: clientName,
      clientId: randomClient.id,
      refNumber: newRefNum,
      portal: Math.random() > 0.5 ? "GST Portal" : "MCA Portal",
      noticeType: Math.random() > 0.5 
        ? "GST Show Cause Notice (GST-DRC-01) - Supplier Filing Default"
        : "Director DIN Suspension Notice (Sec 164) - Aadhaar Mismatch",
      mismatchAmount: disputedVal,
      status: "re_notice_received",
      issueDate: new Date().toISOString().split('T')[0],
      dueDate: new Date(Date.now() + 15 * 86400000).toISOString().split('T')[0],
      timeline: [
        {
          title: "Re-notice / Objection Scraped",
          description: `Sannidh AI scraped a new government re-notice demanding clarification for transaction value of ${disputedVal} under reference ${newRefNum}.`,
          timestamp: new Date().toISOString(),
          actor: "government",
          type: "re_notice"
        }
      ],
      rejoinderDraft: `REJOINDER MEMO REPLY TO RE-NOTICE\nReference: ${newRefNum}\n\nWe submit that our filings are fully compliant. Tax payment proof, e-way bills, and bank RTGS records have been attached. There is zero tax default.`,
      hearingDate: hasHearing ? new Date(Date.now() + 10 * 86400000).toISOString().split('T')[0] : undefined,
      hearingTime: hasHearing ? "11:00 AM (IST)" : undefined,
      hearingAuthority: hasHearing ? "Appellate Tribunal Bench-III" : undefined
    };

    // Update state and localStorage
    setCases(prev => {
      const updated = [...prev.filter(c => c.clientId !== randomClient.id || c.status === 'filed'), newActiveCase];
      localStorage.setItem("demo:case_room_cases", JSON.stringify(updated));
      
      toast.warning(`New Appellate Notice Scraped!`, {
        description: `Active dispute case registered for ${clientName}. Reference: ${newRefNum}`,
        duration: 6000
      });

      // Trigger parent dashboard metric updates
      window.dispatchEvent(new CustomEvent("ca:metrics-updated"));
      
      return updated;
    });
  }, []);

  // Simulate new active case arrival every 2 minutes (120000ms), and trigger immediately if no active cases exist
  useEffect(() => {
    // Check if any active cases are present, if not, generate one immediately
    const hasActiveCase = cases.some(
      (c) =>
        c.status === "re_notice_received" ||
        c.status === "drafting" ||
        c.status === "rejoinder_drafted" ||
        c.status === "signed"
    );
    if (!hasActiveCase) {
      simulateNewCase();
    }

    const caseSimulationInterval = setInterval(() => {
      simulateNewCase();
    }, 120000); // 2 minutes

    return () => clearInterval(caseSimulationInterval);
  }, [cases, simulateNewCase]);

  const autoResolveCase = (caseId: string) => {
    setCases((prevCases) => {
      const updated = prevCases.map((c) => {
        if (c.id !== caseId) return c;

        // Progressively transition case status over 5 minutes (300 seconds)
        // 1. T = 30s: Show auto-drafting info, change status to drafting
        setTimeout(() => {
          toast.info(`AI Swarm: Auto-drafting rejoinder for ${c.client}...`, {
            description: `Analyzing re-notice objections for ${c.refNumber}`
          });
          updateCaseStatus(caseId, "drafting");

          // 2. T = 120s (2 min total): Show draft generated, sign with Aadhaar, change status to signed
          setTimeout(() => {
            toast.info(`AI Swarm: Rejoinder drafted. E-signing with Sannidh DSC...`, {
              description: `Attaching cryptographic signature`
            });
            updateCaseStatus(caseId, "signed");

            // 3. T = 210s (3.5 min total): Show e-filing in progress, change status to filing
            setTimeout(() => {
              toast.info(`AI Swarm: E-filing rejoinder to ${c.portal}...`, {
                description: `Securing government API handshake`
              });
              updateCaseStatus(caseId, "filing");

              // 4. T = 300s (5 min total): Show success, change status to filed
              setTimeout(() => {
                const arn = `ARN-REJ-2026-${Math.floor(100000 + Math.random() * 900000)}`;
                toast.success(`AI Swarm Task Completed!`, {
                  description: `Rejoinder filed successfully for ${c.client}. ARN: ${arn}`
                });
                
                // Commit the completed case!
                completeCaseInStorage(caseId, arn);
              }, 90000); // 90 seconds
            }, 90000); // 90 seconds
          }, 90000); // 90 seconds
        }, 30000); // 30 seconds

        return { ...c, status: "drafting" };
      });
      return updated;
    });
  };

  const updateCaseStatus = (caseId: string, nextStatus: DisputeCase["status"]) => {
    setCases((prev) => {
      const updated = prev.map((c) => {
        if (c.id !== caseId) return c;
        return { ...c, status: nextStatus };
      });
      localStorage.setItem("demo:case_room_cases", JSON.stringify(updated));
      return updated;
    });
  };

  const completeCaseInStorage = (caseId: string, arnNumber: string) => {
    setCases((prev) => {
      const updated = prev.map((c) => {
        if (c.id !== caseId) return c;

        const newTimelineNode = {
          title: "Rejoinder Filed Successfully",
          description: `Cryptographically signed para-wise appeal reply submitted to government. Portal Acknowledgment ARN: ${arnNumber}.`,
          timestamp: new Date().toISOString(),
          actor: "ai-swarm" as const,
          type: "rejoinder" as const
        };

        const finalTimelineNode = {
          title: "Dispute Resolved (Case Disposed)",
          description: "Assessing Officer closed the audit objection. Case closed with ZERO tax liability demands.",
          timestamp: new Date(Date.now() + 1000).toISOString(),
          actor: "government" as const,
          type: "final_order" as const
        };

        // Append PDF entry to client vault completed_tasks_${clientId}
        let completed = [];
        try {
          const saved = localStorage.getItem(`completed_tasks_${c.clientId}`);
          if (saved) completed = JSON.parse(saved);
        } catch (e) {}

        const taskEntry = {
          title: `Rejoinder Reply to Notice ${c.refNumber}`,
          draftType: c.portal.includes("GST") ? "gst-show-cause" : "mca-notice",
          pdfName: `Rejoinder_Reply_${c.refNumber.replace(/[^a-zA-Z0-9]/g, "_")}.pdf`,
          completedAt: new Date().toISOString(),
          arn: arnNumber,
          portal: c.portal,
          referenceNumber: c.refNumber,
          mismatchAmount: c.mismatchAmount
        };

        if (!completed.find((t: any) => t.arn === arnNumber)) {
          completed.push(taskEntry);
          localStorage.setItem(`completed_tasks_${c.clientId}`, JSON.stringify(completed));
        }

        // Save to global completed work history
        try {
          const historySaved = localStorage.getItem("demo:sannidh:completed-work-history");
          const history = historySaved ? JSON.parse(historySaved) : [];
          history.unshift({
            id: `hist-case-${Date.now()}`,
            title: `Rejoinder Reply to Notice ${c.refNumber}`,
            client: c.client,
            draftType: c.portal.includes("GST") ? "gst-show-cause" : "mca-notice",
            completedAt: new Date().toISOString(),
            documentName: `Rejoinder_Reply_${c.refNumber.replace(/[^a-zA-Z0-9]/g, "_")}.pdf`,
            arn: arnNumber,
          });
          if (history.length > 50) history.length = 50;
          localStorage.setItem("demo:sannidh:completed-work-history", JSON.stringify(history));
          window.dispatchEvent(new CustomEvent("demo:sannidh:history-updated"));
        } catch (e) {}

        // Set Swarm Completed
        localStorage.setItem(`swarm_completed_${c.clientId}`, "true");

        return {
          ...c,
          status: "filed" as const,
          arn: arnNumber,
          timeline: [...c.timeline, newTimelineNode, finalTimelineNode]
        };
      });

      localStorage.setItem("demo:case_room_cases", JSON.stringify(updated));
      
      // Dispatch events to notify other dashboard sections
      window.dispatchEvent(new CustomEvent("swarm-completed-event"));
      window.dispatchEvent(new CustomEvent("swarm-status-changed"));
      window.dispatchEvent(new CustomEvent("ca:metrics-updated"));

      // If we are looking at the case in details drawer, update it
      const currentSelected = updated.find(c => c.id === caseId);
      if (currentSelected) setSelectedCase(currentSelected);

      return updated;
    });
  };

  // Manual Mode Actions
  const handleManualDraftRejoinder = async (caseId: string) => {
    updateCaseStatus(caseId, "drafting");
    toast.info("Sannidh AI: Drafting para-wise rejoinder response...");

    setTimeout(() => {
      updateCaseStatus(caseId, "rejoinder_drafted");
      toast.success("Rejoinder Reply Prepared!", {
        description: "Draft is ready for CA review and Aadhaar signature."
      });

      // Update detail drawer view if open
      setCases((prev) => {
        const currentSelected = prev.find(c => c.id === caseId);
        if (currentSelected) setSelectedCase(currentSelected);
        return prev;
      });
    }, 3000);
  };

  const handleRegenerateDraft = (caseId: string, modelType: 'precedent' | 'aggressive' | 'fact') => {
    updateCaseStatus(caseId, "drafting");
    toast.info("Regenerating legal rejoinder using selected reasoning matrix...");
    
    setTimeout(() => {
      setCases((prev) => {
        const updated = prev.map((c) => {
          if (c.id !== caseId) return c;
          
          let newDraft = "";
          const clientName = c.client;
          const refNumber = c.refNumber;
          const mismatchAmount = c.mismatchAmount;
          
          if (modelType === 'precedent') {
            newDraft = `REJOINDER MEMO REPLY TO RE-NOTICE (PRECEDENT ANALYSIS)
Reference No: ${refNumber}
Authority: Appellate Tax Division

In response to the re-notice regarding GST credit eligibility:
1. Supreme Court Precedent: In CIT v. Suresh Kumar (2024), the apex court ruled that ITC claims of bona fide buyers cannot be retrospectively denied due to vendor registry cancellations.
2. Compliance Standard: The buyer has no statutory duty or system capability to monitor supplier behavior post-transaction.
3. We pray that the demand of ${mismatchAmount} be dropped on the basis of established statutory precedents.`;
          } else if (modelType === 'aggressive') {
            newDraft = `FORMAL DEMAND REBUTTAL & JURISDICTIONAL OBJECTION
Reference No: ${refNumber}
Statutory Authority: Show Cause Appellate Bench

We formally object to the arbitrary rejection of the assessee's transaction proofs:
1. The proposed demand of ${mismatchAmount} is patently illegal and violates natural justice.
2. The department has acted outside the scope of Section 73 by ignoring bank-cleared RTGS ledger payments and physical e-way bills.
3. We demand a personal hearing before any adverse assessment is entered onto the record.`;
          } else {
            newDraft = `FACT-BASED TRANSACTION REBUTTAL
Reference No: ${refNumber}
Subject: Ledger & Delivery Validation Schedule

We submit the complete factual registry for the disputed supplies:
1. Payment Schedule: Total payment of ${mismatchAmount} cleared via RTGS on 14 February 2026. Bank Txn Ref: RTGS/2026/02/14/098124.
2. Logistical Verification: Supply verified by E-Way Bill Ref: EWB-928410294 indicating vehicle registration KA-03-9021.
3. Actual receipt of goods has been audited and verified in the books of account. No leakage exists.`;
          }
          
          return {
            ...c,
            status: "rejoinder_drafted" as const,
            rejoinderDraft: newDraft
          };
        });
        localStorage.setItem("demo:case_room_cases", JSON.stringify(updated));
        
        // Update selectedCase
        const currentSelected = updated.find(c => c.id === caseId);
        if (currentSelected) setSelectedCase(currentSelected);
        
        return updated;
      });
      setAiDraftEditTexts((prev) => {
        const next = { ...prev };
        delete next[caseId];
        return next;
      });
      setAiDraftEditMode((prev) => {
        const next = { ...prev };
        delete next[caseId];
        return next;
      });
      toast.success("AI Rejoinder Draft Regenerated successfully!");
    }, 2000);
  };

  const handleEditDraftText = (caseId: string, text: string) => {
    setCases((prev) => {
      const updated = prev.map((c) => {
        if (c.id !== caseId) return c;
        return { ...c, rejoinderDraft: text };
      });
      localStorage.setItem("demo:case_room_cases", JSON.stringify(updated));
      
      // Update selectedCase
      const currentSelected = updated.find(c => c.id === caseId);
      if (currentSelected) setSelectedCase(currentSelected);
      
      return updated;
    });
  };

  const handleManualESign = () => {
    setShowOtpModal(true);
  };

  const verifySignatureOTP = async () => {
    if (otpInput !== "123456") {
      toast.error("Verification failed. Please enter the correct code: 123456.");
      return;
    }
    setOtpVerifying(true);
    toast.info("Authorizing digital signature via Aadhaar OTP gateway...");

    setTimeout(() => {
      if (selectedCase) {
        updateCaseStatus(selectedCase.id, "signed");
        setCases((prev) => {
          const currentSelected = prev.find(c => c.id === selectedCase.id);
          if (currentSelected) setSelectedCase(currentSelected);
          return prev;
        });
      }
      toast.success("Aadhaar Signature Authenticated!", {
        description: "Rejoinder response is fully signed and ready for government filing."
      });
      setShowOtpModal(false);
      setOtpInput("");
      setOtpVerifying(false);
      setAiDraftSigningId(null);
    }, 1500);
  };

  const handleManualFileToGovernment = () => {
    if (!selectedCase) return;
    updateCaseStatus(selectedCase.id, "filing");
    setShowFilingConsole(true);
    setFilingLogs([]);

    const logs = [
      "Establishing secure TLS 1.3 handshake with government server gateway...",
      "Gateway authorized. Credentials verified via Digital Signature Certificate (DSC)...",
      "Uploading XML payload and encrypted rejoinder response package...",
      "Validating schema and computing SHA-256 payload checksum...",
      "Checksum validation success. Dispatching to statutory litigation queue...",
      "Recording transaction entry onto immutable WORM audit log...",
      "Filing transaction confirmed by government gatekeeper API."
    ];

    let currentLogIndex = 0;
    const appendNextLog = () => {
      if (currentLogIndex < logs.length) {
        const timestamp = new Date().toLocaleTimeString();
        setFilingLogs(prev => [...prev, `[${timestamp}] ${logs[currentLogIndex]}`]);
        currentLogIndex++;
        setTimeout(appendNextLog, 1000);
      } else {
        const arnNumber = `ARN-REJ-2026-${Math.floor(100000 + Math.random() * 900000)}`;
        completeCaseInStorage(selectedCase.id, arnNumber);
        setShowFilingConsole(false);
        toast.success("Filed to Government Portal!", {
          description: `Acknowledgment Number: ${arnNumber}`
        });
      }
    };

    setTimeout(appendNextLog, 500);
  };

  // Helper colors
  const getStatusBadge = (status: DisputeCase["status"]) => {
    switch (status) {
      case "re_notice_received":
        return <Badge variant="destructive" className="bg-red-500/20 text-red-400 border border-red-500/30">RE-NOTICE RECEIVED</Badge>;
      case "drafting":
        return <Badge variant="outline" className="bg-yellow-500/10 text-yellow-400 border border-yellow-500/30 animate-pulse">🤖 AI DRAFTING</Badge>;
      case "rejoinder_drafted":
        return <Badge variant="outline" className="bg-blue-500/10 text-blue-400 border border-blue-500/30">DRAFT READY</Badge>;
      case "signed":
        return <Badge variant="outline" className="bg-cyan-500/10 text-cyan-400 border border-cyan-500/30">CLIENT SIGNED</Badge>;
      case "filing":
        return <Badge variant="outline" className="bg-indigo-500/10 text-indigo-400 border border-indigo-500/30 animate-pulse">🏛️ FILING</Badge>;
      case "filed":
        return <Badge className="bg-green-500/20 text-green-400 border border-green-500/30">RESOLVED (CLOSED)</Badge>;
      default:
        return null;
    }
  };

  // Filter cases
  const filteredCases = selectedClientFilter === "all"
    ? cases
    : cases.filter((c) => c.client === selectedClientFilter);

  // Archive cases (status === "filed")
  const archivedCases = filteredCases.filter((c) => c.status === "filed");
  // Active cases (status !== "filed")
  const activeCases = filteredCases.filter((c) => c.status !== "filed");
  // Hearing cases (has hearing date and status is not filed)
  const hearingCases = filteredCases.filter((c) => c.hearingDate && c.status !== "filed");

  return (
    <div className="space-y-6">
      {/* Tab Header */}
      <div className="flex flex-col md:flex-row gap-4 items-start md:items-center justify-between p-5 bg-card/30 border border-border/40 backdrop-blur-sm rounded-2xl">
        <div className="flex items-center gap-3">
          <div className="p-3 bg-purple-500/20 rounded-xl border border-purple-500/30">
            <Scale className="w-6 h-6 text-purple-400" />
          </div>
          <div>
            <h2 className="font-bold text-lg text-white">Case Room</h2>
            <p className="text-sm text-muted-foreground">Manage multi-stage litigation, re-notices, appeals, and hearings.</p>
          </div>
        </div>

        <div className="flex items-center gap-3 w-full md:w-auto">
          {/* Sub-tab selection */}
          <div className="flex rounded-lg bg-card/60 p-0.5 border border-border/40">
            <Button
              size="sm"
              variant={activeSubSection === "cases" ? "default" : "ghost"}
              className={`h-8 px-3 text-xs font-medium ${activeSubSection === "cases" ? "bg-purple-600 text-white hover:bg-purple-500" : "text-muted-foreground"}`}
              onClick={() => setActiveSubSection("cases")}
            >
              <Gavel className="w-3.5 h-3.5 mr-1" /> Active Cases
            </Button>
            <Button
              size="sm"
              variant={activeSubSection === "hearings" ? "default" : "ghost"}
              className={`h-8 px-3 text-xs font-medium ${activeSubSection === "hearings" ? "bg-purple-600 text-white hover:bg-purple-500" : "text-muted-foreground"}`}
              onClick={() => setActiveSubSection("hearings")}
            >
              <Calendar className="w-3.5 h-3.5 mr-1" /> Hearing Room
            </Button>
            <Button
              size="sm"
              variant={activeSubSection === "archive" ? "default" : "ghost"}
              className={`h-8 px-3 text-xs font-medium ${activeSubSection === "archive" ? "bg-purple-600 text-white hover:bg-purple-500" : "text-muted-foreground"}`}
              onClick={() => setActiveSubSection("archive")}
            >
              <Archive className="w-3.5 h-3.5 mr-1" /> Case Archive
            </Button>
            <Button
              size="sm"
              variant={activeSubSection === "ai-drafts" ? "default" : "ghost"}
              className={`h-8 px-3 text-xs font-medium relative ${activeSubSection === "ai-drafts" ? "bg-purple-600 text-white hover:bg-purple-500" : "text-muted-foreground"}`}
              onClick={() => setActiveSubSection("ai-drafts")}
            >
              <BrainCircuit className="w-3.5 h-3.5 mr-1" /> AI Drafts
              {cases.filter(c => c.status === 'rejoinder_drafted').length > 0 && (
                <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-purple-500 text-white text-[8px] flex items-center justify-center font-bold animate-pulse">
                  {cases.filter(c => c.status === 'rejoinder_drafted').length}
                </span>
              )}
            </Button>
          </div>

          <Select value={selectedClientFilter} onValueChange={setSelectedClientFilter}>
            <SelectTrigger className="w-[180px] bg-background/50 border-purple-500/20 text-xs h-9">
              <SelectValue placeholder="All Clients" />
            </SelectTrigger>
            <SelectContent className="bg-card border-border/40 text-xs">
              <SelectItem value="all">All Clients</SelectItem>
              {Array.from(new Set(cases.map(c => c.client))).map(clientName => (
                <SelectItem key={clientName} value={clientName}>{clientName}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {demoClients.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-center border border-dashed border-border/30 rounded-2xl bg-card/10">
          <Building className="w-12 h-12 mb-4 text-muted-foreground opacity-30" />
          <h4 className="text-lg font-semibold text-muted-foreground">No Clients Onboarded</h4>
          <p className="text-sm text-muted-foreground max-w-sm mt-2">Onboard a client under the Client Portfolio tab to initiate litigation tracking and Case Room alerts.</p>
        </div>
      ) : (
        <>
          {/* Active Cases Section */}
          {activeSubSection === "cases" && (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Cases List */}
              <div className="lg:col-span-1 space-y-3">
                <h3 className="text-sm font-bold uppercase tracking-wider text-muted-foreground">Active Case Threads</h3>
                {activeCases.length === 0 ? (
                  <div className="p-8 border border-dashed border-border/30 rounded-xl text-center text-muted-foreground text-xs bg-card/5">
                    No active disputes detected. All client accounts are fully compliant.
                  </div>
                ) : (
                  activeCases.map((c) => (
                    <div
                      key={c.id}
                      onClick={() => setSelectedCase(c)}
                      className={`p-4 rounded-xl border transition-all duration-300 bg-card/40 hover:bg-card/60 cursor-pointer ${
                        selectedCase?.id === c.id
                          ? "border-purple-500 shadow-[0_0_15px_rgba(168,85,247,0.15)] bg-purple-950/10"
                          : "border-border/50"
                      }`}
                    >
                      <div className="flex items-start justify-between flex-wrap gap-2 mb-2">
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-mono text-xs font-semibold text-purple-300">{c.refNumber}</span>
                            <Badge variant="outline" className="text-[10px] uppercase border-purple-500/30 text-purple-400 bg-purple-500/5">
                              {c.portal}
                            </Badge>
                          </div>
                          <p className="text-sm font-semibold text-white mt-1">{c.noticeType.split(" - ")[0]}</p>
                          <p className="text-xs text-muted-foreground">Client: {c.client}</p>
                        </div>
                      </div>
                      
                      <div className="flex items-center justify-between mt-4 pt-3 border-t border-border/20">
                        <div className="text-left">
                          <span className="text-[10px] text-slate-500 block">Objection Value</span>
                          <span className="text-xs font-bold text-red-400">{c.mismatchAmount}</span>
                        </div>
                        {getStatusBadge(c.status)}
                      </div>
                    </div>
                  ))
                )}
              </div>

              {/* Case timeline details */}
              <div className="lg:col-span-2">
                {!selectedCase ? (
                  <div className="bg-card/10 border border-border/40 rounded-2xl h-[450px] flex flex-col items-center justify-center p-6 text-center text-muted-foreground space-y-2">
                    <Scale className="w-12 h-12 opacity-30 text-purple-400" />
                    <p className="text-sm font-medium">Select a case thread to view timeline</p>
                    <p className="text-xs max-w-sm">Click on any active dispute case on the left to review the chronological timeline, read the government objections, and deploy Sannidh AI.</p>
                  </div>
                ) : (
                  <CardDetailTimeline 
                    selectedCase={selectedCase}
                    onDraft={handleManualDraftRejoinder}
                    onESign={handleManualESign}
                    onFile={handleManualFileToGovernment}
                    onDownloadPdf={downloadPdf}
                    onRegenerateDraft={handleRegenerateDraft}
                    onEditDraftText={handleEditDraftText}
                  />
                )}
              </div>
            </div>
          )}

          {/* Hearing Room Section */}
          {activeSubSection === "hearings" && (
            <div className="p-6 bg-card/30 border border-border/40 rounded-2xl space-y-6">
              <div>
                <h3 className="font-bold text-lg text-white mb-1 flex items-center gap-2">
                  <Calendar className="w-5 h-5 text-purple-400" />
                  Personal Hearing Summon Scheduler
                </h3>
                <p className="text-xs text-muted-foreground">Statutory oral hearings scheduled by assessing commissioners. Sannidh AI generates written submissions ahead of the slot.</p>
              </div>

              {hearingCases.length === 0 ? (
                <div className="text-center py-12 text-muted-foreground text-sm">No scheduled hearings.</div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {hearingCases.map((c, idx) => {
                    let monthName = "June";
                    let dayNum = "22";
                    try {
                      if (c.hearingDate) {
                        const dateObj = new Date(c.hearingDate);
                        monthName = dateObj.toLocaleString("en-IN", { month: "long" });
                        dayNum = String(dateObj.getDate());
                      }
                    } catch (e) {}

                    return (
                      <div key={idx} className="p-4 bg-background/50 border border-border/50 rounded-xl space-y-4">
                        <div className="flex justify-between items-start">
                          <div>
                            <Badge variant="outline" className="border-purple-500/35 text-purple-400 bg-purple-500/5 mb-1.5">{c.portal}</Badge>
                            <h4 className="font-semibold text-white">{c.client} - Personal Hearing</h4>
                            <p className="text-xs text-muted-foreground font-mono mt-0.5">Notice Ref: {c.refNumber}</p>
                          </div>
                          <div className="p-2.5 rounded-lg bg-purple-500/10 text-purple-400 border border-purple-500/20 text-center min-w-[70px]">
                            <span className="text-[10px] block uppercase font-bold text-purple-300">{monthName.substring(0, 4)}</span>
                            <span className="text-xl font-bold font-mono text-white">{dayNum}</span>
                          </div>
                        </div>

                        <div className="text-xs space-y-1 text-slate-300">
                          <p><strong className="text-slate-400">Authority:</strong> {c.hearingAuthority || "Deputy Commissioner of Tax (Appeals)"}</p>
                          <p><strong className="text-slate-400">Time:</strong> {c.hearingTime || "11:30 AM (IST)"} via Video Conference</p>
                          <p><strong className="text-slate-400">Status:</strong> <span className="text-green-400 font-semibold">VC Link Available</span></p>
                        </div>

                      <div className="flex gap-2 pt-2">
                        <Button 
                          size="sm" 
                          variant="outline" 
                          className="text-purple-400 border-purple-500/50 hover:bg-purple-500/10 text-[11px] h-8 flex-1"
                          onClick={() => downloadPdf('submissions', c)}
                        >
                          <Download className="w-3.5 h-3.5 mr-1" />
                          Written Submissions
                        </Button>
                        <Button 
                          size="sm" 
                          className="bg-purple-600 hover:bg-purple-700 text-white text-[11px] h-8 flex-1"
                          onClick={() => handleJoinHearing(c)}
                        >
                          <Gavel className="w-3.5 h-3.5 mr-1" />
                          Join Court VC
                        </Button>
                      </div>
                    </div>
                  );
                })}

                </div>
              )}
            </div>
          )}

          {/* Case Archive Section */}
          {activeSubSection === "archive" && (
            <div className="p-6 bg-card/30 border border-border/40 rounded-2xl space-y-4">
              <div>
                <h3 className="font-bold text-lg text-white mb-1 flex items-center gap-2">
                  <Archive className="w-5 h-5 text-purple-400" />
                  Resolved Case Files (Archive)
                </h3>
                <p className="text-xs text-muted-foreground">Historical dispute files which have been disposed of by the assessing authority with zero liabilities.</p>
              </div>

              {archivedCases.length === 0 ? (
                <div className="p-8 border border-dashed border-border/30 rounded-xl text-center text-muted-foreground text-xs bg-card/5">
                  No cases archived yet. File rejoinders to resolve active disputes.
                </div>
              ) : (
                <div className="space-y-3">
                  {archivedCases.map((c) => (
                    <div key={c.id} className="p-4 bg-background/50 border border-green-500/20 rounded-xl flex items-center justify-between flex-wrap gap-4">
                      <div>
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-mono text-xs font-semibold text-green-400">{c.refNumber}</span>
                          <Badge className="bg-green-500/20 text-green-400 border border-green-500/30 text-[9px]">DISPOSED</Badge>
                        </div>
                        <h4 className="font-semibold text-white mt-1">{c.noticeType}</h4>
                        <p className="text-xs text-muted-foreground">Client: {c.client} | Resolved ARN: {c.arn}</p>
                      </div>
                      
                      <div className="flex items-center gap-3">
                        <div className="text-right text-xs mr-2">
                          <span className="text-slate-500 block text-[10px]">Saved Tax Amount</span>
                          <span className="font-bold text-green-400">{c.mismatchAmount}</span>
                        </div>
                        <Button 
                          size="sm" 
                          variant="outline" 
                          className="h-8 text-green-400 border-green-500/30 hover:bg-green-500/10 text-xs"
                          onClick={() => downloadPdf('disposal', c)}
                        >
                          <Download className="w-3.5 h-3.5 mr-1" />
                          Final Order PDF
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* AI Drafts Section */}
          {activeSubSection === "ai-drafts" && (
            <div className="space-y-5">
              {/* Section Header */}
              <div className="p-5 bg-gradient-to-r from-purple-950/40 to-indigo-950/20 border border-purple-500/25 rounded-2xl flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <div className="p-2.5 bg-purple-500/15 rounded-xl border border-purple-500/30">
                    <BrainCircuit className="w-5 h-5 text-purple-400" />
                  </div>
                  <div>
                    <h3 className="font-bold text-white text-sm">AI-Generated Draft Review Centre</h3>
                    <p className="text-[11px] text-muted-foreground mt-0.5">Review every Sannidh AI rejoinder draft before the CA gives final Aadhaar sign-off.</p>
                  </div>
                </div>
                <div className="flex items-center gap-2 text-[10px] text-purple-400 bg-purple-500/10 px-3 py-1.5 rounded-lg border border-purple-500/20">
                  <Sparkles className="w-3.5 h-3.5" />
                  {cases.filter(c => c.status === 'rejoinder_drafted').length} draft(s) awaiting CA sign-off
                </div>
              </div>

              {cases.filter(c => c.status === 'rejoinder_drafted' || c.status === 'signed').length === 0 ? (
                <div className="flex flex-col items-center justify-center py-16 text-center border border-dashed border-purple-500/20 rounded-2xl bg-purple-500/5">
                  <BrainCircuit className="w-10 h-10 mb-3 text-purple-400/30" />
                  <h4 className="text-sm font-semibold text-muted-foreground">No AI Drafts Yet</h4>
                  <p className="text-xs text-muted-foreground max-w-xs mt-2">
                    Trigger Draft Rejoinder on an active case to generate AI-powered legal responses that will appear here for your review.
                  </p>
                  <Button
                    size="sm"
                    variant="outline"
                    className="mt-4 border-purple-500/30 text-purple-300 hover:bg-purple-500/10 text-xs gap-1"
                    onClick={() => setActiveSubSection("cases")}
                  >
                    <Scale className="w-3.5 h-3.5" /> Go to Active Cases
                  </Button>
                </div>
              ) : (
                <div className="space-y-5">
                  {cases
                    .filter(c => c.status === 'rejoinder_drafted' || c.status === 'signed')
                    .map((c) => {
                      const tone = aiDraftTones[c.id] || 'precedent';
                      const editText = aiDraftEditTexts[c.id] ?? c.rejoinderDraft ?? '';
                      const isSigned = c.status === 'signed';

                      return (
                        <motion.div
                          key={c.id}
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          className={`rounded-2xl border overflow-hidden ${
                            isSigned
                              ? 'border-cyan-500/30 bg-cyan-950/5'
                              : 'border-purple-500/30 bg-purple-950/5'
                          }`}
                        >
                          {/* Card Header */}
                          <div className={`px-5 py-4 flex flex-col md:flex-row items-start md:items-center justify-between gap-3 border-b ${
                            isSigned ? 'border-cyan-500/20 bg-cyan-950/10' : 'border-purple-500/20 bg-purple-950/10'
                          }`}>
                            <div className="flex items-center gap-3">
                              <div className={`p-2 rounded-lg ${
                                isSigned ? 'bg-cyan-500/10 border border-cyan-500/20' : 'bg-purple-500/10 border border-purple-500/20'
                              }`}>
                                {isSigned ? <BadgeCheck className="w-4 h-4 text-cyan-400" /> : <Sparkles className="w-4 h-4 text-purple-400 animate-pulse" />}
                              </div>
                              <div>
                                <div className="flex items-center gap-2 flex-wrap">
                                  <span className="font-mono text-xs font-bold text-purple-300">{c.refNumber}</span>
                                  <span className="text-[10px] text-slate-500">•</span>
                                  <span className="text-xs text-muted-foreground">{c.portal}</span>
                                </div>
                                <h4 className="font-semibold text-white text-sm mt-0.5">{c.client}</h4>
                                <p className="text-[11px] text-muted-foreground">{c.noticeType.split(' - ')[0]}</p>
                              </div>
                            </div>
                            <div className="flex items-center gap-2 flex-shrink-0">
                              {isSigned ? (
                                <span className="flex items-center gap-1 text-[11px] text-cyan-400 bg-cyan-500/10 px-2.5 py-1 rounded-full border border-cyan-500/25 font-medium">
                                  <BadgeCheck className="w-3.5 h-3.5" /> CA Signed Off
                                </span>
                              ) : (
                                <span className="flex items-center gap-1 text-[11px] text-purple-300 bg-purple-500/10 px-2.5 py-1 rounded-full border border-purple-500/25 font-medium animate-pulse">
                                  <PenLine className="w-3 h-3" /> Awaiting Sign-Off
                                </span>
                              )}
                              <span className="text-[11px] text-red-400 font-bold font-mono">{c.mismatchAmount}</span>
                            </div>
                          </div>

                          {/* Body: Tone Selector + Editable Draft */}
                          <div className="p-5 space-y-4">
                            {!isSigned && (
                              <div>
                                <p className="text-[10px] text-muted-foreground uppercase tracking-wider font-bold mb-2">Select AI Reasoning Matrix</p>
                                <div className="grid grid-cols-3 gap-2">
                                  {(['precedent', 'aggressive', 'fact'] as const).map((t) => (
                                    <Button
                                      key={t}
                                      size="sm"
                                      variant={tone === t ? 'default' : 'outline'}
                                      className={`text-[10px] h-8 px-2 ${
                                        tone === t
                                          ? 'bg-purple-600 text-white hover:bg-purple-500'
                                          : 'text-slate-400 border-purple-500/20 hover:border-purple-500/50'
                                      }`}
                                      onClick={() => {
                                        setAiDraftTones(prev => ({ ...prev, [c.id]: t }));
                                        handleRegenerateDraft(c.id, t);
                                      }}
                                    >
                                      {t === 'precedent' && <Shield className="w-3 h-3 mr-1" />}
                                      {t === 'aggressive' && <AlertTriangle className="w-3 h-3 mr-1" />}
                                      {t === 'fact' && <FileText className="w-3 h-3 mr-1" />}
                                      {t === 'precedent' ? 'Precedent' : t === 'aggressive' ? 'Jurisdictional' : 'Factual'}
                                    </Button>
                                  ))}
                                </div>
                              </div>
                            )}

                            {/* PDF-Style Document Preview */}
                            <div className="rounded-xl overflow-hidden border border-slate-700/50 shadow-[0_8px_32px_rgba(0,0,0,0.4)]">
                              {/* Toolbar bar above the paper */}
                              <div className="flex items-center justify-between bg-zinc-900 px-4 py-2 border-b border-zinc-800">
                                <div className="flex items-center gap-2">
                                  <div className="flex gap-1.5">
                                    <span className="w-3 h-3 rounded-full bg-red-500/70" />
                                    <span className="w-3 h-3 rounded-full bg-yellow-500/70" />
                                    <span className="w-3 h-3 rounded-full bg-green-500/70" />
                                  </div>
                                  <span className="text-[10px] text-zinc-500 font-mono ml-2">
                                    {isSigned ? '🔒 SIGNED & SEALED — READ ONLY' : '✏️  EDITABLE LEGAL DOCUMENT'}
                                  </span>
                                </div>
                                {!isSigned && (
                                  <div className="flex items-center gap-3">
                                    <button
                                      className={`text-[10px] flex items-center gap-1 transition-colors px-2 py-0.5 rounded font-medium border ${
                                        aiDraftEditMode[c.id]
                                          ? 'bg-amber-500/20 text-amber-300 border-amber-500/30 hover:bg-amber-500/30'
                                          : 'bg-purple-500/10 text-purple-300 border-purple-500/20 hover:bg-purple-500/20'
                                      }`}
                                      onClick={() => setAiDraftEditMode(prev => ({ ...prev, [c.id]: !prev[c.id] }))}
                                    >
                                      {aiDraftEditMode[c.id] ? (
                                        <>
                                          <BadgeCheck className="w-3.5 h-3.5" /> Done Editing
                                        </>
                                      ) : (
                                        <>
                                          <PenLine className="w-3.5 h-3.5" /> Edit Draft
                                        </>
                                      )}
                                    </button>
                                    <button
                                      className="text-[10px] text-purple-400 hover:text-purple-300 flex items-center gap-1 transition-colors"
                                      onClick={() => {
                                        setAiDraftEditTexts(prev => ({ ...prev, [c.id]: c.rejoinderDraft || '' }));
                                      }}
                                    >
                                      <RefreshCw className="w-3 h-3" /> Reset to AI Draft
                                    </button>
                                  </div>
                                )}
                              </div>

                              {/* Paper / Document Body */}
                              <div className="bg-[#f8f7f4] p-0 max-h-[520px] overflow-y-auto">
                                {/* Letterhead */}
                                <div className="bg-gradient-to-r from-purple-800 to-indigo-800 px-8 py-5">
                                  <div className="flex items-start justify-between">
                                    <div>
                                      <p className="text-white font-black text-sm tracking-widest uppercase">SANNIDH</p>
                                      <p className="text-purple-200 text-[10px] font-medium tracking-wide">AI Compliance & Litigation Platform</p>
                                    </div>
                                    <div className="text-right">
                                      <p className="text-purple-200 text-[10px]">Government of India Portal Filing</p>
                                      <p className="text-white text-[10px] font-mono font-bold mt-0.5">{c.refNumber}</p>
                                      <p className="text-purple-300 text-[9px] mt-0.5">
                                        Doc ID: {c.id.toUpperCase().slice(0, 12)}
                                      </p>
                                    </div>
                                  </div>
                                </div>

                                {/* Document content area */}
                                <div className="px-8 py-6 space-y-5 text-slate-800">
                                  {/* Document Title */}
                                  <div className="text-center border-b-2 border-slate-300 pb-4">
                                    <h2 className="text-sm font-black uppercase tracking-widest text-slate-900">
                                      REJOINDER MEMO REPLY TO RE-NOTICE
                                    </h2>
                                    <p className="text-[10px] text-slate-500 mt-1">
                                      Under Statutory Appellate Provisions — {c.portal}
                                    </p>
                                  </div>

                                  {/* Case Metadata Table */}
                                  <div className="border border-slate-300 rounded text-[10px]">
                                    <div className="grid grid-cols-2 divide-x divide-slate-300">
                                      <div className="p-2.5 space-y-2">
                                        <div>
                                          <span className="text-slate-500 uppercase font-bold tracking-wide block text-[9px]">Client / Assessee</span>
                                          <span className="text-slate-900 font-semibold">{c.client}</span>
                                        </div>
                                        <div>
                                          <span className="text-slate-500 uppercase font-bold tracking-wide block text-[9px]">Notice Reference</span>
                                          <span className="text-slate-900 font-mono font-bold">{c.refNumber}</span>
                                        </div>
                                        <div>
                                          <span className="text-slate-500 uppercase font-bold tracking-wide block text-[9px]">Government Portal</span>
                                          <span className="text-slate-900">{c.portal}</span>
                                        </div>
                                      </div>
                                      <div className="p-2.5 space-y-2">
                                        <div>
                                          <span className="text-slate-500 uppercase font-bold tracking-wide block text-[9px]">Notice Type</span>
                                          <span className="text-slate-900">{c.noticeType.split(' - ')[0]}</span>
                                        </div>
                                        <div>
                                          <span className="text-slate-500 uppercase font-bold tracking-wide block text-[9px]">Disputed Value</span>
                                          <span className="text-red-700 font-black">{c.mismatchAmount}</span>
                                        </div>
                                        <div>
                                          <span className="text-slate-500 uppercase font-bold tracking-wide block text-[9px]">Status</span>
                                          <span className={`font-bold ${isSigned ? 'text-green-700' : 'text-amber-700'}`}>
                                            {isSigned ? 'SIGNED — AWAITING FILING' : 'DRAFT — PENDING CA SIGN-OFF'}
                                          </span>
                                        </div>
                                      </div>
                                    </div>
                                  </div>

                                  {/* Horizontal Rule */}
                                  <div className="flex items-center gap-2">
                                    <div className="flex-1 border-t border-slate-300" />
                                    <span className="text-[9px] text-slate-400 uppercase tracking-widest font-bold">Document Body</span>
                                    <div className="flex-1 border-t border-slate-300" />
                                  </div>

                                  {/* Editable Body */}
                                  {aiDraftEditMode[c.id] && !isSigned ? (
                                    <div className="relative border border-amber-300 bg-amber-50/50 rounded-lg p-3 shadow-inner">
                                      <div className="absolute top-2 right-2 flex items-center gap-1 text-[9px] text-amber-700 font-bold bg-amber-200/50 px-2 py-0.5 rounded uppercase pointer-events-none">
                                        <PenLine className="w-2.5 h-2.5" /> Editing Mode
                                      </div>
                                      <textarea
                                        value={editText}
                                        onChange={(e) => {
                                          const val = e.target.value;
                                          setAiDraftEditTexts(prev => ({ ...prev, [c.id]: val }));
                                          handleEditDraftText(c.id, val);
                                        }}
                                        rows={12}
                                        spellCheck={false}
                                        className="w-full bg-transparent text-[11px] leading-7 font-serif text-slate-800 outline-none resize-none border-0 p-0 whitespace-pre-wrap focus:ring-0 focus:outline-none"
                                        style={{ fontFamily: '"Georgia", "Times New Roman", serif' }}
                                        placeholder="Edit legal rejoinder draft text here..."
                                      />
                                    </div>
                                  ) : (
                                    <div className="whitespace-pre-wrap text-[11px] leading-7 font-serif text-slate-800 p-1" style={{ fontFamily: '"Georgia", "Times New Roman", serif' }}>
                                      {isSigned ? (c.rejoinderDraft || '') : editText}
                                    </div>
                                  )}

                                  {/* Signature Footer */}
                                  <div className="border-t border-slate-300 pt-4 mt-4 flex items-start justify-between text-[9px] text-slate-500">
                                    <div>
                                      <p className="font-bold text-slate-700 text-[10px]">Respectfully submitted,</p>
                                      {isSigned ? (
                                        <div className="mt-2 p-2 bg-green-50 border border-green-300 rounded">
                                          <p className="text-green-700 font-bold text-[10px]">✓ Aadhaar e-Sign Authenticated</p>
                                          <p className="text-green-600">Signed by CA — Sannidh DSC Gateway</p>
                                          <p className="text-green-600">NeSL Timestamp: {new Date().toLocaleString('en-IN')}</p>
                                        </div>
                                      ) : (
                                        <div className="mt-2 p-2 bg-amber-50 border border-dashed border-amber-300 rounded">
                                          <p className="text-amber-600 italic">[ Signature Pending CA Aadhaar e-Sign ]</p>
                                        </div>
                                      )}
                                    </div>
                                    <div className="text-right">
                                      <p className="text-slate-400">Generated by Sannidh AI</p>
                                      <p className="font-mono text-slate-500">{new Date().toLocaleDateString('en-IN')}</p>
                                      {isSigned && (
                                        <div className="mt-1 px-2 py-1 border-2 border-purple-500 rounded text-purple-700 font-black text-[9px] tracking-widest">
                                          SANNIDH VERIFIED
                                        </div>
                                      )}
                                    </div>
                                  </div>
                                </div>
                              </div>
                            </div>


                            {/* Actions */}
                            <div className="flex items-center gap-2 flex-wrap">
                              <Button
                                size="sm"
                                variant="outline"
                                className="text-purple-400 border-purple-500/30 hover:bg-purple-500/10 text-[11px] h-8 gap-1"
                                onClick={() => downloadPdf('rejoinder', { ...c, rejoinderDraft: isSigned ? c.rejoinderDraft : editText })}
                              >
                                <Download className="w-3.5 h-3.5" /> Download Draft PDF
                              </Button>

                              {!isSigned ? (
                                <Button
                                  size="sm"
                                  className="bg-purple-600 hover:bg-purple-500 text-white text-[11px] h-8 gap-1 shadow-[0_0_15px_rgba(168,85,247,0.3)] ml-auto"
                                  disabled={aiDraftSigningId === c.id}
                                  onClick={() => {
                                    // Save latest edit first
                                    if (aiDraftEditTexts[c.id]) {
                                      handleEditDraftText(c.id, aiDraftEditTexts[c.id]);
                                    }
                                    // Set the selected case for the OTP modal and open it
                                    setSelectedCase(c);
                                    setAiDraftSigningId(c.id);
                                    setShowOtpModal(true);
                                  }}
                                >
                                  {aiDraftSigningId === c.id ? (
                                    <><Loader className="w-3.5 h-3.5 animate-spin" /> Verifying...</>
                                  ) : (
                                    <><Fingerprint className="w-3.5 h-3.5" /> CA Final Sign-Off (Aadhaar)</>
                                  )}
                                </Button>
                              ) : (
                                <Button
                                  size="sm"
                                  className="bg-cyan-600 hover:bg-cyan-500 text-white text-[11px] h-8 gap-1 shadow-[0_0_15px_rgba(6,182,212,0.3)] ml-auto"
                                  onClick={() => {
                                    setSelectedCase(c);
                                    handleManualFileToGovernment();
                                  }}
                                >
                                  <Scale className="w-3.5 h-3.5 animate-pulse" /> File to Government Portal
                                </Button>
                              )}
                            </div>
                          </div>
                        </motion.div>
                      );
                    })}
                </div>
              )}
            </div>
          )}
        </>
      )}

      {/* Aadhaar OTP e-Sign Modal */}
      <AnimatePresence>
        {showOtpModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/85 z-50 flex items-center justify-center p-4 backdrop-blur-sm"
            onClick={() => {
              if (!otpVerifying) {
                setShowOtpModal(false);
                setOtpInput("");
              }
            }}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-card border border-cyan-500/30 rounded-2xl max-w-md w-full overflow-hidden shadow-[0_0_50px_rgba(6,182,212,0.15)]"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Header */}
              <div className="bg-gradient-to-r from-cyan-950 to-blue-950 p-5 border-b border-cyan-500/20 text-center relative">
                <div className="mx-auto w-12 h-12 rounded-full bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center mb-3">
                  <Fingerprint className="w-6 h-6 text-cyan-400 animate-pulse" />
                </div>
                <h3 className="text-lg font-bold text-white tracking-wide">Aadhaar e-Sign Authentication</h3>
                <p className="text-[11px] text-cyan-300/80 mt-1">Secured by National e-Governance Services Limited (NeSL)</p>
                
                {!otpVerifying && (
                  <button 
                    onClick={() => { setShowOtpModal(false); setOtpInput(""); }}
                    className="absolute top-4 right-4 text-muted-foreground hover:text-white"
                  >
                    <X className="w-4 h-4" />
                  </button>
                )}
              </div>

              {/* Body */}
              <div className="p-6 space-y-5">
                <div className="text-center space-y-2 text-slate-200">
                  <p className="text-xs text-muted-foreground">
                    A secure 6-digit OTP has been sent to the registered mobile number of the authorized signatory for <strong className="text-white">{selectedCase?.client}</strong>.
                  </p>
                  <div className="p-2 bg-yellow-500/10 border border-yellow-500/30 rounded-lg text-[10px] text-yellow-300 inline-block font-medium">
                    💡 DEMO MODE: Enter code <strong className="font-mono text-white text-xs">123456</strong> to verify successfully.
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-xs font-semibold text-cyan-400 block text-center">Enter 6-Digit OTP</label>
                  <input
                    type="password"
                    maxLength={6}
                    value={otpInput}
                    onChange={(e) => setOtpInput(e.target.value.replace(/\D/g, ""))}
                    placeholder="• • • • • •"
                    disabled={otpVerifying}
                    className="w-full text-center bg-black/40 border border-cyan-500/30 rounded-lg py-3 text-xl font-mono tracking-[0.75em] text-white focus:border-cyan-400 outline-none transition-colors"
                  />
                </div>

                <div className="flex gap-3 pt-2">
                  <Button
                    variant="outline"
                    className="flex-1"
                    disabled={otpVerifying}
                    onClick={() => { setShowOtpModal(false); setOtpInput(""); }}
                  >
                    Cancel
                  </Button>
                  <Button
                    className="flex-1 bg-cyan-600 hover:bg-cyan-500 text-white font-medium shadow-[0_0_15px_rgba(6,182,212,0.4)]"
                    disabled={otpVerifying || otpInput.length !== 6}
                    onClick={verifySignatureOTP}
                  >
                    {otpVerifying ? (
                      <><Loader className="w-4 h-4 mr-2 animate-spin" /> Verifying...</>
                    ) : (
                      "Verify & Sign"
                    )}
                  </Button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Government E-Filing Console Modal */}
      <AnimatePresence>
        {showFilingConsole && (
          <div className="fixed inset-0 bg-black/90 z-50 flex items-center justify-center p-4 backdrop-blur-md">
            <div className="bg-zinc-950 border border-zinc-800 rounded-xl max-w-xl w-full overflow-hidden shadow-[0_0_80px_rgba(0,0,0,0.8)] font-mono">
              {/* Terminal Title Bar */}
              <div className="bg-zinc-900 px-4 py-2.5 border-b border-zinc-800 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="flex gap-1.5">
                    <span className="w-3 h-3 rounded-full bg-red-500/80 inline-block" />
                    <span className="w-3 h-3 rounded-full bg-yellow-500/80 inline-block" />
                    <span className="w-3 h-3 rounded-full bg-green-500/80 inline-block" />
                  </div>
                  <span className="text-xs text-zinc-400 font-bold ml-2">Appellate Portal Filing - Rejoinder Gateway</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
                  <span className="text-[10px] text-green-400 font-sans font-bold">TRANSMITTING</span>
                </div>
              </div>

              {/* Console Logs */}
              <div className="p-5 h-[320px] overflow-y-auto text-xs text-zinc-300 space-y-2 select-text text-left">
                {filingLogs.map((log, idx) => (
                  <div key={idx} className="leading-relaxed">
                    <span className="text-zinc-500 font-bold font-sans">[$]</span> {log}
                  </div>
                ))}
                <div className="flex items-center gap-2 text-cyan-400 pt-2 animate-pulse">
                  <Loader className="w-3.5 h-3.5 animate-spin" />
                  <span>Submitting rejoinder reply schedules...</span>
                </div>
              </div>

              {/* Footer status bar */}
              <div className="bg-zinc-900/50 px-4 py-2 border-t border-zinc-800/80 flex items-center justify-between text-[10px] text-zinc-500">
                <span>SECURE SSL v3 CONNECTION</span>
                <span>PACKETS: {filingLogs.length}/7 SENT</span>
              </div>
            </div>
          </div>
        )}
      </AnimatePresence>

      {/* Court Virtual Hearing VC Simulation Modal */}
      <AnimatePresence>
        {showVcModal && vcCase && (
          <div className="fixed inset-0 bg-black/95 z-50 flex items-center justify-center p-4 backdrop-blur-md">
            <div className="bg-card border border-purple-500/30 rounded-2xl max-w-4xl w-full h-[600px] flex flex-col overflow-hidden shadow-[0_0_80px_rgba(147,51,234,0.2)]">
              {/* Voice visualizer animation & Scanlines animation styles */}
              <style>{`
                @keyframes voiceBounce {
                  0%, 100% { transform: scaleY(0.2); }
                  50% { transform: scaleY(1); }
                }
                .voice-bar {
                  animation: voiceBounce 0.6s ease-in-out infinite;
                  transform-origin: bottom;
                }
                @keyframes scanlineMove {
                  0% { transform: translateY(-50%); }
                  100% { transform: translateY(50%); }
                }
                .scanline-overlay {
                  animation: scanlineMove 6s linear infinite;
                }
              `}</style>

              {/* Header */}
              <div className="bg-purple-950/20 px-6 py-4 border-b border-border/40 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-purple-500/10 rounded-lg text-purple-400">
                    <Video className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="font-bold text-white text-sm">Appellate Court Room — Webex Portal</h3>
                    <p className="text-xs text-muted-foreground">Case: {vcCase.refNumber} | Client: {vcCase.client}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <span className={`w-2 h-2 rounded-full ${vcStatus === 'connecting' ? 'bg-yellow-400 animate-pulse' : vcStatus === 'active' ? 'bg-red-400 animate-pulse' : 'bg-green-400'}`} />
                  <span className={`text-[10px] font-bold ${vcStatus === 'connecting' ? 'text-yellow-400' : vcStatus === 'active' ? 'text-red-400' : 'text-green-400'}`}>
                    {vcStatus.toUpperCase()}
                  </span>
                </div>
              </div>

              {/* 5-Step Visual Progress Roadmap */}
              <div className="px-6 py-2.5 bg-slate-900 border-b border-border/20 flex items-center justify-between text-[10px] font-mono text-zinc-400 flex-wrap gap-2 select-none">
                <div className="flex items-center gap-1.5">
                  <span className={`w-1.5 h-1.5 rounded-full ${vcStatus === 'connecting' ? 'bg-purple-500 animate-pulse' : 'bg-purple-800'}`} />
                  <span className={vcStatus === 'connecting' ? 'text-purple-400 font-bold' : 'text-zinc-500'}>1. Handshake</span>
                </div>
                <ChevronRight className="w-3 h-3 text-zinc-700" />
                <div className="flex items-center gap-1.5">
                  <span className={`w-1.5 h-1.5 rounded-full ${vcStatus === 'active' && vcLogs.length < 5 ? 'bg-purple-500 animate-pulse' : vcLogs.length >= 5 ? 'bg-purple-800' : 'bg-zinc-700'}`} />
                  <span className={vcStatus === 'active' && vcLogs.length < 5 ? 'text-purple-400 font-bold' : vcLogs.length >= 5 ? 'text-zinc-500' : ''}>2. Case Briefing</span>
                </div>
                <ChevronRight className="w-3 h-3 text-zinc-700" />
                <div className="flex items-center gap-1.5">
                  <span className={`w-1.5 h-1.5 rounded-full ${vcStatus === 'active' && vcLogs.length >= 5 && vcLogs.length < 7 ? 'bg-purple-500 animate-pulse' : vcLogs.length >= 7 ? 'bg-purple-800' : 'bg-zinc-700'}`} />
                  <span className={vcStatus === 'active' && vcLogs.length >= 5 && vcLogs.length < 7 ? 'text-purple-400 font-bold' : vcLogs.length >= 7 ? 'text-zinc-500' : ''}>3. AI Advocate Pleadings</span>
                </div>
                <ChevronRight className="w-3 h-3 text-zinc-700" />
                <div className="flex items-center gap-1.5">
                  <span className={`w-1.5 h-1.5 rounded-full ${vcStatus === 'active' && vcLogs.length >= 7 ? 'bg-purple-500 animate-pulse' : vcStatus === 'concluded' ? 'bg-purple-800' : 'bg-zinc-700'}`} />
                  <span className={vcStatus === 'active' && vcLogs.length >= 7 ? 'text-purple-400 font-bold' : vcStatus === 'concluded' ? 'text-zinc-500' : ''}>4. Deliberation</span>
                </div>
                <ChevronRight className="w-3 h-3 text-zinc-700" />
                <div className="flex items-center gap-1.5">
                  <span className={`w-1.5 h-1.5 rounded-full ${vcStatus === 'concluded' ? 'bg-green-500' : 'bg-zinc-700'}`} />
                  <span className={vcStatus === 'concluded' ? 'text-green-400 font-bold animate-pulse' : ''}>5. Order Issued</span>
                </div>
              </div>

              {/* Grid Layout: Video Feeds + Live Transcript */}
              <div className="flex-1 grid grid-cols-1 md:grid-cols-3 overflow-hidden">
                {/* 2/3 Video Grid */}
                <div className="md:col-span-2 p-4 bg-background/50 grid grid-cols-2 gap-3 h-full overflow-y-auto">
                  {/* Participant 1: Commissioner */}
                  <div className="relative rounded-xl overflow-hidden border border-border/50 bg-slate-900/60 flex flex-col items-center justify-center min-h-[160px]">
                    <div className="absolute inset-0 bg-gradient-to-b from-transparent via-purple-500/5 to-transparent scanline-overlay pointer-events-none w-full h-[200%]" />
                    <div className="p-4 rounded-full bg-purple-500/10 border border-purple-500/20 text-purple-400 mb-2">
                      <Gavel className="w-8 h-8" />
                    </div>
                    <span className="text-xs font-semibold text-white">Hon'ble Commissioner (Appeals)</span>
                    <span className="text-[10px] text-muted-foreground mt-1">presiding officer</span>
                    
                    {vcStatus === 'active' && vcLogs.length > 0 && (vcLogs[vcLogs.length - 1].startsWith("[Appellate Authority]") || vcLogs[vcLogs.length - 1]?.startsWith("[Commissioner]")) ? (
                      <>
                        <div className="absolute top-3 left-3 bg-red-600 text-white font-bold text-[8px] px-2 py-0.5 rounded-full">
                          SPEAKING
                        </div>
                        <div className="absolute bottom-3 left-3 flex items-end gap-1 h-5 pointer-events-none">
                          <span className="w-1 h-4 bg-purple-400 rounded-full voice-bar" style={{ animationDelay: '0.1s' }} />
                          <span className="w-1 h-4 bg-purple-400 rounded-full voice-bar" style={{ animationDelay: '0.3s' }} />
                          <span className="w-1 h-4 bg-purple-400 rounded-full voice-bar" style={{ animationDelay: '0.0s' }} />
                          <span className="w-1 h-4 bg-purple-400 rounded-full voice-bar" style={{ animationDelay: '0.4s' }} />
                          <span className="w-1 h-4 bg-purple-400 rounded-full voice-bar" style={{ animationDelay: '0.2s' }} />
                        </div>
                      </>
                    ) : (
                      <div className="absolute top-3 left-3 bg-zinc-800/80 text-zinc-400 text-[8px] px-2 py-0.5 rounded-full">
                        MUTED
                      </div>
                    )}
                  </div>

                  {/* Participant 2: Department Rep */}
                  <div className="relative rounded-xl overflow-hidden border border-border/50 bg-slate-900/60 flex flex-col items-center justify-center min-h-[160px]">
                    <div className="absolute inset-0 bg-gradient-to-b from-transparent via-rose-500/5 to-transparent scanline-overlay pointer-events-none w-full h-[200%]" />
                    <div className="p-4 rounded-full bg-slate-500/10 border border-slate-500/20 text-slate-400 mb-2">
                      <Building className="w-8 h-8" />
                    </div>
                    <span className="text-xs font-semibold text-white">Assessing Officer (Department Rep)</span>
                    <span className="text-[10px] text-muted-foreground mt-1">presenting officer</span>
                    
                    {vcStatus === 'active' && vcLogs.length > 0 && (vcLogs[vcLogs.length - 1].startsWith("[Assessing Officer]") || vcLogs[vcLogs.length - 1]?.startsWith("[Department Rep]")) ? (
                      <>
                        <div className="absolute top-3 left-3 bg-red-600 text-white font-bold text-[8px] px-2 py-0.5 rounded-full">
                          SPEAKING
                        </div>
                        <div className="absolute bottom-3 left-3 flex items-end gap-1 h-5 pointer-events-none">
                          <span className="w-1 h-4 bg-rose-400 rounded-full voice-bar" style={{ animationDelay: '0.1s' }} />
                          <span className="w-1 h-4 bg-rose-400 rounded-full voice-bar" style={{ animationDelay: '0.3s' }} />
                          <span className="w-1 h-4 bg-rose-400 rounded-full voice-bar" style={{ animationDelay: '0.0s' }} />
                          <span className="w-1 h-4 bg-rose-400 rounded-full voice-bar" style={{ animationDelay: '0.4s' }} />
                          <span className="w-1 h-4 bg-rose-400 rounded-full voice-bar" style={{ animationDelay: '0.2s' }} />
                        </div>
                      </>
                    ) : (
                      <div className="absolute top-3 left-3 bg-zinc-800/80 text-zinc-400 text-[8px] px-2 py-0.5 rounded-full">
                        MUTED
                      </div>
                    )}
                  </div>

                  {/* Participant 3: Sannidh AI */}
                  <div className="relative rounded-xl overflow-hidden border border-purple-500/30 bg-purple-950/5 flex flex-col items-center justify-center min-h-[160px]">
                    <div className="absolute inset-0 bg-gradient-to-b from-transparent via-purple-500/10 to-transparent scanline-overlay pointer-events-none w-full h-[200%]" />
                    <div className="p-4 rounded-full bg-purple-500/20 border border-purple-500/30 text-purple-300 mb-2 shadow-[0_0_15px_rgba(168,85,247,0.2)]">
                      <Sparkles className="w-8 h-8 text-purple-400 animate-pulse" />
                    </div>
                    <span className="text-xs font-semibold text-purple-300">Sannidh AI Counsel</span>
                    <span className="text-[10px] text-purple-400/80 mt-1">representing petitioner</span>
                    
                    {vcStatus === 'active' && vcLogs.length > 0 && vcLogs[vcLogs.length - 1].startsWith("[Sannidh AI]") ? (
                      <>
                        <div className="absolute top-3 left-3 bg-purple-600 text-white font-bold text-[8px] px-2 py-0.5 rounded-full animate-pulse flex items-center gap-1">
                          <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" />
                          ADVOCATING
                        </div>
                        <div className="absolute bottom-3 left-3 flex items-end gap-1 h-5 pointer-events-none">
                          <span className="w-1 h-4 bg-purple-400 rounded-full voice-bar" style={{ animationDelay: '0.1s' }} />
                          <span className="w-1 h-4 bg-purple-400 rounded-full voice-bar" style={{ animationDelay: '0.3s' }} />
                          <span className="w-1 h-4 bg-purple-400 rounded-full voice-bar" style={{ animationDelay: '0.0s' }} />
                          <span className="w-1 h-4 bg-purple-400 rounded-full voice-bar" style={{ animationDelay: '0.4s' }} />
                          <span className="w-1 h-4 bg-purple-400 rounded-full voice-bar" style={{ animationDelay: '0.2s' }} />
                        </div>
                      </>
                    ) : (
                      <div className="absolute top-3 left-3 bg-zinc-800/80 text-zinc-400 text-[8px] px-2 py-0.5 rounded-full">
                        LISTENING
                      </div>
                    )}
                  </div>

                  {/* Participant 4: You (CA Observer) */}
                  <div className={`relative rounded-xl overflow-hidden border flex flex-col items-center justify-center min-h-[160px] transition-all duration-300 ${
                    isCamOff 
                      ? 'border-border/50 bg-slate-950/90' 
                      : 'border-cyan-500/40 bg-gradient-to-br from-slate-900 via-cyan-950/20 to-slate-900 shadow-[0_0_20px_rgba(6,182,212,0.1)]'
                  }`}>
                    {isCamOff ? (
                      <>
                        <div className="p-4 rounded-full bg-slate-800 text-slate-500 mb-2">
                          <VideoOff className="w-8 h-8" />
                        </div>
                        <span className="text-xs font-semibold text-slate-500">Camera is Off</span>
                        <span className="text-[10px] text-slate-600 mt-1">observing audio-only</span>
                      </>
                    ) : (
                      <>
                        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-cyan-500/5 to-transparent scanline-overlay pointer-events-none w-full h-[200%]" />
                        <div className="p-4 rounded-full bg-cyan-500/10 border border-cyan-500/20 text-cyan-400 mb-2 animate-pulse">
                          <Scale className="w-8 h-8" />
                        </div>
                        <span className="text-xs font-semibold text-white">You (Chartered Accountant)</span>
                        <span className="text-[10px] text-cyan-400 mt-1">watching observer</span>
                        
                        <div className="absolute top-3 right-3 bg-cyan-600 text-white font-bold text-[8px] px-2 py-0.5 rounded-full flex items-center gap-1">
                          <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" />
                          LIVE
                        </div>
                      </>
                    )}
                    
                    <div className="absolute top-3 left-3 bg-cyan-600/20 text-cyan-300 border border-cyan-500/20 text-[8px] px-2 py-0.5 rounded-full font-mono">
                      {isMicMuted ? 'MUTED' : 'UNMUTED'}
                    </div>

                    {!isMicMuted && !isCamOff && (
                      <div className="absolute bottom-3 left-3 flex items-end gap-1 h-5 pointer-events-none">
                        <span className="w-1 h-3 bg-cyan-400 rounded-full voice-bar" style={{ animationDelay: '0.1s' }} />
                        <span className="w-1 h-3 bg-cyan-400 rounded-full voice-bar" style={{ animationDelay: '0.3s' }} />
                        <span className="w-1 h-3 bg-cyan-400 rounded-full voice-bar" style={{ animationDelay: '0.0s' }} />
                      </div>
                    )}
                  </div>
                </div>

                {/* 1/3 Live Transcript / Stenographer Minutes */}
                <div className="md:col-span-1 border-t md:border-t-0 md:border-l border-border/40 p-4 flex flex-col justify-between bg-card/10">
                  <div className="flex-1 flex flex-col overflow-hidden space-y-3">
                    <div className="flex items-center justify-between border-b border-border/20 pb-2">
                      <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider">Stenographer Transcript</h4>
                      <Badge variant="outline" className="text-[8px] border-purple-500/30 text-purple-400 bg-purple-500/5 animate-pulse">LIVE FEED</Badge>
                    </div>
                    
                    <div className="flex-1 overflow-y-auto space-y-3 pr-1 text-[11px] font-mono leading-relaxed select-text text-left">
                      {vcLogs.map((log, idx) => {
                        let color = "text-slate-300";
                        if (log.startsWith("[Appellate Authority]") || log.startsWith("[Commissioner]")) {
                          color = "text-yellow-400 font-semibold";
                        } else if (log.startsWith("[Assessing Officer]")) {
                          color = "text-rose-400";
                        } else if (log.startsWith("[Sannidh AI]")) {
                          color = "text-purple-300 font-semibold";
                        } else {
                          color = "text-slate-500 font-sans italic";
                        }
                        
                        return (
                          <div key={idx} className={`${color} border-l-2 border-purple-500/10 pl-2 py-1`}>
                            {log}
                          </div>
                        );
                      })}
                      
                      {vcStatus === 'connecting' && (
                        <div className="flex items-center gap-2 text-yellow-400 animate-pulse py-1">
                          <Loader className="w-3 h-3 animate-spin" />
                          <span>Establishing Webex gateway...</span>
                        </div>
                      )}
                      
                      {vcStatus === 'active' && (
                        <div className="flex items-center gap-2 text-red-400 animate-pulse py-1 font-sans text-[10px]">
                          <span className="w-1.5 h-1.5 rounded-full bg-red-400 animate-pulse" />
                          <span>Oral arguments in progress...</span>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Hearing Outcome Status */}
                  <div className="border-t border-border/20 pt-4 mt-3 space-y-3 text-left">
                    {vcStatus === 'concluded' ? (
                      <div className="space-y-2">
                        <div className="p-3 bg-green-500/10 border border-green-500/30 rounded-xl text-green-400 text-xs">
                          🎉 <strong className="text-white">Appeal Allowed!</strong> The Commissioner has ordered the demand to be dropped in full. Case marked as resolved.
                        </div>
                        <Button 
                          className="w-full bg-green-600 hover:bg-green-500 text-white text-xs h-9"
                          onClick={() => downloadPdf('disposal', vcCase)}
                        >
                          <Download className="w-4 h-4 mr-1.5" /> Download Disposal Order
                        </Button>
                      </div>
                    ) : (
                      <div className="text-center py-2 text-xs text-muted-foreground font-sans">
                        {vcStatus === 'connecting' ? 'Awaiting judicial officer presence...' : 'Oral pleadings presenting live...'}
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Bottom Control Bar */}
              <div className="bg-purple-950/10 px-6 py-4 border-t border-border/40 flex items-center justify-between">
                <div className="flex gap-2">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => setIsMicMuted(!isMicMuted)}
                    className={`h-9 w-9 p-0 rounded-full border-border/50 ${isMicMuted ? 'bg-red-500/20 text-red-400 border-red-500/30 hover:bg-red-500/30' : 'text-slate-300 hover:bg-slate-800'}`}
                  >
                    {isMicMuted ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => setIsCamOff(!isCamOff)}
                    className={`h-9 w-9 p-0 rounded-full border-border/50 ${isCamOff ? 'bg-red-500/20 text-red-400 border-red-500/30 hover:bg-red-500/30' : 'text-slate-300 hover:bg-slate-800'}`}
                  >
                    {isCamOff ? <VideoOff className="w-4 h-4" /> : <Video className="w-4 h-4" />}
                  </Button>
                </div>

                <Button
                  size="sm"
                  className="bg-red-600 hover:bg-red-500 text-white font-medium px-4 h-9 shadow-[0_0_15px_rgba(239,68,68,0.3)]"
                  onClick={() => {
                    setShowVcModal(false);
                    setVcCase(null);
                  }}
                >
                  <PhoneOff className="w-4 h-4 mr-1.5" /> Leave Room
                </Button>
              </div>
            </div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}

// Sub-component for Case Timeline rendering
interface TimelineProps {
  selectedCase: DisputeCase;
  onDraft: (caseId: string) => void;
  onESign: () => void;
  onFile: () => void;
  onDownloadPdf: (type: 'submissions' | 'disposal' | 'rejoinder', caseObj: DisputeCase) => void;
  onRegenerateDraft: (caseId: string, modelType: 'precedent' | 'aggressive' | 'fact') => void;
  onEditDraftText: (caseId: string, text: string) => void;
}

function CardDetailTimeline({ 
  selectedCase, 
  onDraft, 
  onESign, 
  onFile, 
  onDownloadPdf,
  onRegenerateDraft,
  onEditDraftText
}: TimelineProps) {
  const isAutoMode = localStorage.getItem("sannidh:dashboard-mode") === "auto";
  const [draftText, setDraftText] = useState(selectedCase.rejoinderDraft || "");
  const [selectedTone, setSelectedTone] = useState<'precedent' | 'aggressive' | 'fact'>('precedent');

  useEffect(() => {
    setDraftText(selectedCase.rejoinderDraft || "");
  }, [selectedCase.id, selectedCase.rejoinderDraft]);

  const handleToneChange = (tone: 'precedent' | 'aggressive' | 'fact') => {
    setSelectedTone(tone);
    onRegenerateDraft(selectedCase.id, tone);
  };

  return (
    <div className="bg-card/45 border border-border/50 rounded-2xl p-6 h-full flex flex-col justify-between space-y-6">
      {/* Header Info */}
      <div className="border-b border-border/20 pb-4 flex justify-between items-start flex-wrap gap-3">
        <div>
          <span className="text-xs text-purple-400 font-mono font-bold tracking-wide uppercase">{selectedCase.portal} • {selectedCase.refNumber}</span>
          <h3 className="text-xl font-bold text-white mt-1">{selectedCase.client}</h3>
          <p className="text-xs text-muted-foreground mt-0.5">{selectedCase.noticeType}</p>
        </div>
        <div className="text-right">
          <span className="text-[10px] text-slate-500 block uppercase font-bold tracking-wider">Objection Value</span>
          <span className="text-lg font-black text-red-400 font-mono">{selectedCase.mismatchAmount}</span>
        </div>
      </div>

      {/* Vertical Timeline */}
      <div className="flex-1 space-y-6 py-4 overflow-y-auto max-h-[350px] pr-2">
        <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-4">Chronological Case History</h4>
        <div className="relative border-l border-purple-500/20 ml-3 space-y-6">
          {selectedCase.timeline.map((node, index) => (
            <div key={index} className="relative pl-6">
              {/* Dot */}
              <div className={`absolute -left-2 top-1 w-4 h-4 rounded-full border-2 bg-background flex items-center justify-center ${
                node.type === "notice" || node.type === "re_notice" ? "border-red-500 text-red-500" :
                node.type === "final_order" ? "border-green-500 text-green-500" : "border-purple-500 text-purple-400"
              }`}>
                <div className={`w-1.5 h-1.5 rounded-full ${
                  node.type === "notice" || node.type === "re_notice" ? "bg-red-500" :
                  node.type === "final_order" ? "bg-green-500" : "bg-purple-500"
                }`} />
              </div>

              <div>
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-xs font-bold text-white">{node.title}</span>
                  <Badge variant="outline" className={`text-[8px] uppercase tracking-wide px-1.5 py-0 h-4 border-0 ${
                    node.actor === "government" ? "bg-red-500/10 text-red-400" :
                    node.actor === "ai-swarm" ? "bg-purple-500/10 text-purple-400" :
                    "bg-blue-500/10 text-blue-400"
                  }`}>
                    {node.actor === "ai-swarm" ? "SANNIDH SWARM" : node.actor.toUpperCase()}
                  </Badge>
                  <span className="text-[10px] text-slate-500 ml-auto">
                    {new Date(node.timestamp).toLocaleString("en-IN", { dateStyle: "short", timeStyle: "short" })}
                  </span>
                </div>
                <p className="text-xs text-muted-foreground mt-1 leading-relaxed text-left">{node.description}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Case Action Box */}
      <div className="border-t border-border/20 pt-4 space-y-4">
        {selectedCase.status === "re_notice_received" && (
          <div className="p-4 bg-red-500/5 border border-red-500/20 rounded-xl flex items-center justify-between flex-wrap gap-4">
            <div className="text-left max-w-md">
              <h5 className="font-semibold text-red-400 text-xs flex items-center gap-1.5">
                <AlertTriangle className="w-4 h-4 text-red-400" />
                Objection Rejoinder Required
              </h5>
              <p className="text-[11px] text-muted-foreground mt-0.5">
                Government rejects the previous rebuttal. Let Sannidh AI parse the rejection objections and draft a legal rejoinder to appeal.
              </p>
            </div>
            
            {isAutoMode ? (
              <div className="flex items-center gap-2 text-purple-400 text-xs font-bold animate-pulse bg-purple-500/10 px-3 py-1.5 rounded-lg border border-purple-500/30">
                <Loader className="w-3.5 h-3.5 animate-spin" />
                Sannidh Auto-Resolving Case...
              </div>
            ) : (
              <Button
                size="sm"
                className="bg-purple-600 hover:bg-purple-700 text-white font-medium text-xs gap-1 shadow-[0_0_15px_rgba(168,85,247,0.3)]"
                onClick={() => onDraft(selectedCase.id)}
              >
                <Sparkles className="w-3.5 h-3.5" />
                Draft Rejoinder
              </Button>
            )}
          </div>
        )}

        {selectedCase.status === "drafting" && (
          <div className="p-10 border border-purple-500/30 bg-purple-500/5 rounded-xl text-center space-y-3">
            <Loader className="w-8 h-8 mx-auto animate-spin text-purple-500" />
            <h5 className="font-semibold text-purple-300 text-sm">Sannidh Agent Swarm Active</h5>
            <p className="text-xs text-muted-foreground max-w-sm mx-auto">
              Running para-wise objection audit. Querying landmark tax court precedents and cross-referencing ledger data...
            </p>
          </div>
        )}

        {selectedCase.status === "rejoinder_drafted" && (
          <div className="p-5 bg-purple-950/10 border border-purple-500/20 rounded-xl space-y-4 text-left">
            <div className="flex justify-between items-center flex-wrap gap-2">
              <div className="flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-purple-400 animate-pulse" />
                <div>
                  <h5 className="font-bold text-white text-xs">Sannidh AI Rejoinder Studio</h5>
                  <p className="text-[10px] text-muted-foreground">Adjust reasoning tone or edit before sign-off</p>
                </div>
              </div>
              <Badge className="bg-purple-500/20 text-purple-400 border border-purple-500/30 text-[9px] uppercase">
                Defense Strength: 96%
              </Badge>
            </div>

            {/* Tone Selector Buttons */}
            <div className="grid grid-cols-3 gap-2">
              <Button
                size="sm"
                variant={selectedTone === 'precedent' ? 'default' : 'outline'}
                className={`text-[10px] h-8 px-2 ${selectedTone === 'precedent' ? 'bg-purple-600 text-white hover:bg-purple-500' : 'text-slate-300 border-purple-500/20'}`}
                onClick={() => handleToneChange('precedent')}
              >
                <Shield className="w-3 h-3 mr-1" /> Precedent Rebuttal
              </Button>
              <Button
                size="sm"
                variant={selectedTone === 'aggressive' ? 'default' : 'outline'}
                className={`text-[10px] h-8 px-2 ${selectedTone === 'aggressive' ? 'bg-purple-600 text-white hover:bg-purple-500' : 'text-slate-300 border-purple-500/20'}`}
                onClick={() => handleToneChange('aggressive')}
              >
                <AlertTriangle className="w-3 h-3 mr-1" /> Jurisdictional
              </Button>
              <Button
                size="sm"
                variant={selectedTone === 'fact' ? 'default' : 'outline'}
                className={`text-[10px] h-8 px-2 ${selectedTone === 'fact' ? 'bg-purple-600 text-white hover:bg-purple-500' : 'text-slate-300 border-purple-500/20'}`}
                onClick={() => handleToneChange('fact')}
              >
                <FileText className="w-3 h-3 mr-1" /> Factual Ledgers
              </Button>
            </div>
            
            {/* Editable Textarea */}
            <div className="space-y-1">
              <div className="flex justify-between items-center text-[10px] text-slate-500 px-1 font-mono">
                <span>EDITABLE LEGAL WORKSPACE</span>
                <span>AUTO-SAVED TO VAULT</span>
              </div>
              <textarea
                value={draftText}
                onChange={(e) => {
                  const val = e.target.value;
                  setDraftText(val);
                  onEditDraftText(selectedCase.id, val);
                }}
                rows={5}
                className="w-full bg-slate-950/80 text-slate-200 p-3.5 rounded-lg font-serif text-[11px] leading-relaxed border border-purple-500/20 focus:border-purple-500/50 outline-none select-text resize-none"
              />
            </div>

            <div className="flex gap-2 pt-1">
              <Button
                size="sm"
                variant="outline"
                className="text-purple-400 border-purple-500/30 hover:bg-purple-500/10 text-xs flex-1 h-9"
                onClick={() => onDownloadPdf('rejoinder', selectedCase)}
              >
                <Download className="w-4 h-4 mr-1" /> Download Memo Draft
              </Button>
              <Button
                size="sm"
                className="bg-purple-600 hover:bg-purple-500 text-white font-medium text-xs flex-1 h-9 shadow-[0_0_15px_rgba(168,85,247,0.3)]"
                onClick={onESign}
              >
                <Fingerprint className="w-4 h-4 mr-1" /> Approve & e-Sign (Aadhaar)
              </Button>
            </div>
          </div>
        )}

        {selectedCase.status === "signed" && (
          <div className="p-4 bg-cyan-500/5 border border-cyan-500/20 rounded-xl space-y-4 text-left">
            <div className="flex justify-between items-center">
              <h5 className="font-semibold text-cyan-400 text-xs flex items-center gap-1.5">
                <Shield className="w-4 h-4 text-cyan-400" />
                Rejoinder Cryptographically Signed
              </h5>
              <Badge className="bg-cyan-500/20 text-cyan-400 border border-cyan-500/30 text-[9px] uppercase">
                SEALED & DSC LOCKED
              </Badge>
            </div>
            
            <div className="bg-slate-950/60 text-slate-400 p-3.5 rounded-lg font-serif text-[10px] leading-relaxed max-h-[100px] overflow-y-auto border border-cyan-500/15 select-text whitespace-pre-wrap italic">
              {selectedCase.rejoinderDraft}
            </div>

            <div className="flex items-center justify-between gap-4 flex-wrap">
              <p className="text-[11px] text-muted-foreground leading-relaxed flex-1 min-w-[200px]">
                Aadhaar signature verification success. The document has been sealed and locked in the secure vault. Ready for final filing.
              </p>
              <Button
                size="sm"
                className="bg-cyan-600 hover:bg-cyan-500 text-white font-medium text-xs gap-1 shadow-[0_0_15px_rgba(6,182,212,0.3)] flex-shrink-0"
                onClick={onFile}
              >
                <Scale className="w-3.5 h-3.5 animate-pulse" />
                File Rejoinder (Appellate)
              </Button>
            </div>
          </div>
        )}

        {selectedCase.status === "filing" && (
          <div className="p-8 border border-indigo-500/30 bg-indigo-500/5 rounded-xl text-center space-y-3">
            <Loader className="w-7 h-7 mx-auto animate-spin text-indigo-500" />
            <h5 className="font-semibold text-indigo-300 text-sm">Filing to Appellate Portal</h5>
            <p className="text-xs text-muted-foreground max-w-sm mx-auto">
              Uploading cryptographically signed response schedules and audit credentials through the GSP gateway.
            </p>
          </div>
        )}

        {selectedCase.status === "filed" && (
          <div className="p-4 bg-green-500/5 border border-green-500/20 rounded-xl space-y-4 text-left">
            <div className="flex justify-between items-center">
              <h5 className="font-bold text-green-400 text-xs flex items-center gap-1.5">
                <CheckCircle className="w-4 h-4" />
                Case Resolved & Closed
              </h5>
              <Badge className="bg-green-500/20 text-green-400 border border-green-500/30 text-[9px] uppercase">
                TRANSMITTED TO PORTAL
              </Badge>
            </div>
            
            <div className="bg-slate-950/40 text-slate-400 p-3.5 rounded-lg font-serif text-[10px] leading-relaxed max-h-[100px] overflow-y-auto border border-green-500/15 select-text whitespace-pre-wrap">
              {selectedCase.rejoinderDraft}
            </div>

            <div className="flex items-center justify-between gap-4 flex-wrap">
              <p className="text-[11px] text-muted-foreground leading-relaxed flex-1 min-w-[200px]">
                Appellate reply filed under ARN: <span className="font-mono font-bold text-white">{selectedCase.arn}</span>. Government closed the dispute with zero liabilities. Copy saved to Client Vault.
              </p>
              <Button
                size="sm"
                variant="outline"
                className="text-green-400 border-green-500/50 hover:bg-green-500/10 text-xs flex-shrink-0"
                onClick={() => onDownloadPdf('disposal', selectedCase)}
              >
                <Download className="w-3.5 h-3.5 mr-1" />
                Final Order
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

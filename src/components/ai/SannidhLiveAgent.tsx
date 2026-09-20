/**
 * SANNIDH LIVE AI AGENT
 * 
 * A Siri/Alexa-like conversational AI assistant that:
 * - Listens to voice commands ("Hey Sannidh, make their balance sheet")
 * - Responds with natural voice like a human
 * - Executes tasks autonomously (Ingestor, Matchmaker, Architect, Sentinel)
 * - Keeps CA in control with approval workflows
 * 
 * Features:
 * - Wake word detection ("Hey Sannidh")
 * - Real-time speech recognition
 * - Natural text-to-speech responses
 * - Visual waveform animation
 * - Task execution with progress updates
 * - Hindi + English bilingual support
 */

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Mic, 
  MicOff, 
  Volume2, 
  VolumeX,
  MessageCircle,
  Send,
  Zap,
  CheckCircle,
  Clock,
  FileText,
  Calculator,
  Scale,
  Calendar,
  Bot,
  User,
  Sparkles,
  AlertCircle,
  ChevronDown,
  ChevronUp,
  Settings,
  X
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';

// =============================================================================
// TYPES
// =============================================================================

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  taskType?: TaskType;
  taskStatus?: 'started' | 'in_progress' | 'completed' | 'needs_approval';
}

type TaskType = 'ingestor' | 'matchmaker' | 'architect' | 'sentinel' | 'general';

interface TaskProgress {
  taskId: string;
  taskType: TaskType;
  taskName: string;
  progress: number;
  status: 'running' | 'completed' | 'needs_approval';
  details: string[];
}

interface SannidhLiveAgentProps {
  dashboardId: string;
  dashboardType: 'ca' | 'admin' | 'legal' | 'company' | 'university';
  userName?: string;
  companyName?: string;
}

// =============================================================================
// TASK DEFINITIONS (The 4 Agents)
// =============================================================================

const AGENT_TASKS = {
  ingestor: {
    name: 'The Ingestor',
    icon: FileText,
    color: 'text-blue-400',
    bgColor: 'bg-blue-500/20',
    description: 'Data extraction from emails, WhatsApp, documents',
    capabilities: [
      'Extract invoices from email',
      'Parse bank statements',
      'Validate GSTIN numbers',
      'Categorize bills',
      'Detect duplicates'
    ]
  },
  matchmaker: {
    name: 'The Matchmaker',
    icon: Calculator,
    color: 'text-green-400',
    bgColor: 'bg-green-500/20',
    description: 'Reconciliation between Purchase Register, GSTR-2B, Bank',
    capabilities: [
      'Match purchase register',
      'Compare GSTR-2B',
      'Reconcile bank statements',
      'Find variances',
      'Identify missing invoices'
    ]
  },
  architect: {
    name: 'The Architect',
    icon: Scale,
    color: 'text-purple-400',
    bgColor: 'bg-purple-500/20',
    description: 'Balance sheet, journal entries, trial balance',
    capabilities: [
      'Create journal entries',
      'Generate trial balance',
      'Build balance sheet',
      'Calculate depreciation',
      'Classify accounts'
    ]
  },
  sentinel: {
    name: 'The Sentinel',
    icon: Calendar,
    color: 'text-amber-400',
    bgColor: 'bg-amber-500/20',
    description: 'Compliance tracking, GST/TDS returns, deadlines',
    capabilities: [
      'Track deadlines',
      'Prepare GST returns',
      'Generate TDS returns',
      'Check RBI compliance',
      'Prepare MCA forms'
    ]
  }
};

// =============================================================================
// VOICE COMMANDS MAPPING
// =============================================================================

const COMMAND_PATTERNS = [
  // Balance Sheet Commands
  { pattern: /balance\s*sheet/i, task: 'architect', action: 'balance_sheet' },
  { pattern: /trial\s*balance/i, task: 'architect', action: 'trial_balance' },
  { pattern: /journal\s*entr/i, task: 'architect', action: 'journal_entries' },
  { pattern: /depreciation/i, task: 'architect', action: 'depreciation' },
  
  // Reconciliation Commands
  { pattern: /reconcil/i, task: 'matchmaker', action: 'reconcile' },
  { pattern: /match.*invoice/i, task: 'matchmaker', action: 'match_invoices' },
  { pattern: /gstr.*2b|2b.*match/i, task: 'matchmaker', action: 'gstr_2b' },
  { pattern: /bank.*match|match.*bank/i, task: 'matchmaker', action: 'bank_reconciliation' },
  
  // Data Extraction Commands
  { pattern: /extract.*invoice|invoice.*extract/i, task: 'ingestor', action: 'extract_invoices' },
  { pattern: /parse.*statement|statement.*parse/i, task: 'ingestor', action: 'parse_statements' },
  { pattern: /validate.*gstin|gstin.*validate/i, task: 'ingestor', action: 'validate_gstin' },
  { pattern: /scan.*email|email.*scan/i, task: 'ingestor', action: 'scan_emails' },
  
  // Compliance Commands
  { pattern: /gst.*return|return.*gst/i, task: 'sentinel', action: 'gst_return' },
  { pattern: /tds.*return|return.*tds/i, task: 'sentinel', action: 'tds_return' },
  { pattern: /deadline|due\s*date/i, task: 'sentinel', action: 'check_deadlines' },
  { pattern: /compliance.*status|status.*compliance/i, task: 'sentinel', action: 'compliance_status' },
  { pattern: /mca.*form|form.*mca/i, task: 'sentinel', action: 'mca_forms' },
  
  // General Commands
  { pattern: /status|what.*pending/i, task: 'general', action: 'status' },
  { pattern: /help|what.*can.*you/i, task: 'general', action: 'help' },
  { pattern: /approve.*all/i, task: 'general', action: 'approve_all' },
];

// =============================================================================
// RESPONSE TEMPLATES
// =============================================================================

const RESPONSES = {
  greeting: [
    "Namaste! Main Sannidh hoon, aapka compliance partner. Kaise madad kar sakta hoon?",
    "Good morning! I'm Sannidh, your AI compliance partner. How can I help you today?",
    "Hello! Sannidh here. Ready to work on your compliance tasks."
  ],
  balance_sheet: [
    "Starting balance sheet generation. I'll create journal entries, post to ledgers, and generate trial balance.",
    "Balance sheet work shuru kar raha hoon. Journal entries, ledger postings aur trial balance prepare karunga."
  ],
  reconciliation: [
    "Starting reconciliation. I'll match your purchase register with GSTR-2B and bank statements. Any variance, even ₹1, will be found.",
    "Reconciliation shuru. Purchase register ko GSTR-2B aur bank statement se match karunga. ₹1 ka bhi gap mil jayega."
  ],
  gst_return: [
    "Preparing GST return. I'll pull all invoices, calculate input credit, and prepare GSTR-3B for your approval.",
    "GST return prepare kar raha hoon. Sabhi invoices collect karke, input credit calculate karke GSTR-3B ready karunga."
  ],
  task_started: [
    "Task started. I'll keep you updated on progress.",
    "Kaam shuru. Progress ki updates deta rahunga."
  ],
  task_completed: [
    "Done! The task is complete. Please review and approve if everything looks good.",
    "Ho gaya! Kaam complete hai. Please review karein aur approve karein."
  ],
  needs_approval: [
    "Work is ready for your review. Please approve to proceed with filing.",
    "Kaam ready hai review ke liye. Filing ke liye please approve karein."
  ],
  not_understood: [
    "I didn't quite catch that. You can say things like 'make balance sheet', 'reconcile invoices', or 'prepare GST return'.",
    "Samajh nahi aaya. Aap bol sakte hain 'balance sheet banao', 'invoices match karo', ya 'GST return prepare karo'."
  ],
  help: [
    "I can help you with: Balance sheets, Journal entries, Reconciliation, GST/TDS returns, Deadline tracking, and Invoice extraction. Just tell me what you need!",
    "Main help kar sakta hoon: Balance sheet, Journal entries, Reconciliation, GST/TDS returns, Deadlines, aur Invoice extraction mein. Bas batao kya chahiye!"
  ]
};

// =============================================================================
// MAIN COMPONENT
// =============================================================================

const SannidhLiveAgent = ({
  dashboardId,
  dashboardType,
  userName = 'User',
  companyName = 'Your Company'
}: SannidhLiveAgentProps) => {
  // State
  const [isListening, setIsListening] = useState(false);
  const [isExpanded, setIsExpanded] = useState(true);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputText, setInputText] = useState('');
  const [currentTask, setCurrentTask] = useState<TaskProgress | null>(null);
  const [isWakeWordActive, setIsWakeWordActive] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [voiceLanguage, setVoiceLanguage] = useState<'en-IN' | 'hi-IN'>('en-IN');
  const [showSettings, setShowSettings] = useState(false);
  
  // Refs
  const recognitionRef = useRef<any>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const synthRef = useRef<SpeechSynthesis | null>(null);
  
  // Initialize speech synthesis
  useEffect(() => {
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      synthRef.current = window.speechSynthesis;
    }
  }, []);

  // Add initial greeting
  useEffect(() => {
    const greeting = RESPONSES.greeting[Math.floor(Math.random() * RESPONSES.greeting.length)];
    const initialMessage: Message = {
      id: 'initial',
      role: 'assistant',
      content: `${greeting}\n\nI'm your Sannidh Compliance Partner. I can:\n• Generate balance sheets and journal entries\n• Reconcile invoices with GSTR-2B\n• Prepare GST/TDS returns\n• Track compliance deadlines\n\nJust say "Hey Sannidh" and tell me what you need!`,
      timestamp: new Date()
    };
    setMessages([initialMessage]);
  }, []);

  // Scroll to bottom on new messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // =============================================================================
  // SPEECH RECOGNITION (Voice Input)
  // =============================================================================

  const startListening = useCallback(() => {
    if (typeof window === 'undefined') return;
    
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) {
      console.warn('Speech recognition not supported');
      return;
    }

    const recognition = new SpeechRecognition();
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.lang = voiceLanguage;

    recognition.onstart = () => {
      setIsListening(true);
      setTranscript('');
    };

    recognition.onresult = (event: any) => {
      let interim = '';
      let final = '';
      
      for (let i = event.resultIndex; i < event.results.length; i++) {
        const transcript = event.results[i][0].transcript;
        if (event.results[i].isFinal) {
          final += transcript;
        } else {
          interim += transcript;
        }
      }
      
      setTranscript(interim || final);
      
      // Check for wake word "Hey Sannidh"
      const fullText = (final + interim).toLowerCase();
      if (fullText.includes('hey sannidh') || fullText.includes('sannidh')) {
        setIsWakeWordActive(true);
      }
      
      // Process final result
      if (final && isWakeWordActive) {
        const command = final.replace(/hey sannidh/gi, '').trim();
        if (command.length > 2) {
          handleVoiceCommand(command);
          setIsWakeWordActive(false);
          stopListening();
        }
      }
    };

    recognition.onerror = (event: any) => {
      console.error('Speech recognition error:', event.error);
      setIsListening(false);
    };

    recognition.onend = () => {
      setIsListening(false);
    };

    recognitionRef.current = recognition;
    recognition.start();
  }, [voiceLanguage, isWakeWordActive]);

  const stopListening = useCallback(() => {
    if (recognitionRef.current) {
      recognitionRef.current.stop();
      recognitionRef.current = null;
    }
    setIsListening(false);
    setTranscript('');
  }, []);

  // =============================================================================
  // TEXT TO SPEECH (Voice Output)
  // =============================================================================

  const speak = useCallback((text: string) => {
    if (isMuted || !synthRef.current) return;
    
    synthRef.current.cancel();
    
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = voiceLanguage;
    utterance.rate = 0.95;
    utterance.pitch = 1.0;
    utterance.volume = 1.0;

    // Find best voice
    const voices = synthRef.current.getVoices();
    const prefix = voiceLanguage === 'hi-IN' ? 'hi' : 'en';
    const matchingVoice = voices.find(v => v.lang.toLowerCase().startsWith(prefix));
    if (matchingVoice) utterance.voice = matchingVoice;

    utterance.onstart = () => setIsSpeaking(true);
    utterance.onend = () => setIsSpeaking(false);
    utterance.onerror = () => setIsSpeaking(false);

    synthRef.current.speak(utterance);
  }, [isMuted, voiceLanguage]);

  const stopSpeaking = useCallback(() => {
    if (synthRef.current) {
      synthRef.current.cancel();
    }
    setIsSpeaking(false);
  }, []);

  // =============================================================================
  // COMMAND PROCESSING
  // =============================================================================

  const handleVoiceCommand = useCallback(async (command: string) => {
    // Add user message
    const userMessage: Message = {
      id: `user-${Date.now()}`,
      role: 'user',
      content: command,
      timestamp: new Date()
    };
    setMessages(prev => [...prev, userMessage]);

    // Find matching command
    let matchedTask: TaskType = 'general';
    let matchedAction = 'unknown';

    for (const pattern of COMMAND_PATTERNS) {
      if (pattern.pattern.test(command)) {
        matchedTask = pattern.task as TaskType;
        matchedAction = pattern.action;
        break;
      }
    }

    // Generate response
    let response = '';
    let taskProgress: TaskProgress | null = null;

    if (matchedTask === 'general') {
      if (matchedAction === 'help') {
        response = RESPONSES.help[voiceLanguage === 'hi-IN' ? 1 : 0];
      } else if (matchedAction === 'status') {
        response = `You have 3 tasks pending approval and 2 deadlines this week. ${currentTask ? `Currently working on: ${currentTask.taskName}` : 'Ready for your next command.'}`;
      } else if (matchedAction === 'approve_all') {
        response = 'All pending actions approved! I will proceed with the filings.';
      } else {
        response = RESPONSES.not_understood[voiceLanguage === 'hi-IN' ? 1 : 0];
      }
    } else {
      // Start the actual task
      const taskConfig = AGENT_TASKS[matchedTask];
      const taskId = `task-${Date.now()}`;
      
      // Get appropriate response
      if (matchedTask === 'architect') {
        response = RESPONSES.balance_sheet[voiceLanguage === 'hi-IN' ? 1 : 0];
      } else if (matchedTask === 'matchmaker') {
        response = RESPONSES.reconciliation[voiceLanguage === 'hi-IN' ? 1 : 0];
      } else if (matchedTask === 'sentinel' && matchedAction.includes('gst')) {
        response = RESPONSES.gst_return[voiceLanguage === 'hi-IN' ? 1 : 0];
      } else {
        response = RESPONSES.task_started[voiceLanguage === 'hi-IN' ? 1 : 0];
      }

      taskProgress = {
        taskId,
        taskType: matchedTask,
        taskName: `${taskConfig.name}: ${matchedAction.replace(/_/g, ' ')}`,
        progress: 0,
        status: 'running',
        details: []
      };

      setCurrentTask(taskProgress);

      // Simulate task progress
      simulateTaskProgress(taskProgress);
    }

    // Add assistant message
    const assistantMessage: Message = {
      id: `assistant-${Date.now()}`,
      role: 'assistant',
      content: response,
      timestamp: new Date(),
      taskType: matchedTask !== 'general' ? matchedTask : undefined,
      taskStatus: matchedTask !== 'general' ? 'started' : undefined
    };
    setMessages(prev => [...prev, assistantMessage]);

    // Speak the response
    speak(response);
  }, [voiceLanguage, currentTask, speak]);

  // =============================================================================
  // TASK SIMULATION (Real implementation would call backend)
  // =============================================================================

  const simulateTaskProgress = useCallback((task: TaskProgress) => {
    const steps = [
      { progress: 10, detail: 'Analyzing data sources...' },
      { progress: 25, detail: 'Extracting relevant records...' },
      { progress: 40, detail: 'Processing transactions...' },
      { progress: 60, detail: 'Applying business rules...' },
      { progress: 75, detail: 'Validating results...' },
      { progress: 90, detail: 'Generating output...' },
      { progress: 100, detail: 'Ready for review!' }
    ];

    let stepIndex = 0;
    const interval = setInterval(() => {
      if (stepIndex < steps.length) {
        const step = steps[stepIndex];
        setCurrentTask(prev => prev ? {
          ...prev,
          progress: step.progress,
          details: [...prev.details, step.detail],
          status: step.progress === 100 ? 'needs_approval' : 'running'
        } : null);

        if (step.progress === 100) {
          clearInterval(interval);
          
          // Add completion message
          const completionMessage: Message = {
            id: `complete-${Date.now()}`,
            role: 'assistant',
            content: RESPONSES.needs_approval[voiceLanguage === 'hi-IN' ? 1 : 0],
            timestamp: new Date(),
            taskType: task.taskType,
            taskStatus: 'needs_approval'
          };
          setMessages(prev => [...prev, completionMessage]);
          speak(RESPONSES.needs_approval[voiceLanguage === 'hi-IN' ? 1 : 0]);
        }
        
        stepIndex++;
      }
    }, 1500);

    return () => clearInterval(interval);
  }, [voiceLanguage, speak]);

  // =============================================================================
  // TEXT INPUT HANDLING
  // =============================================================================

  const handleTextSubmit = useCallback((e: React.FormEvent) => {
    e.preventDefault();
    if (inputText.trim()) {
      handleVoiceCommand(inputText.trim());
      setInputText('');
    }
  }, [inputText, handleVoiceCommand]);

  // =============================================================================
  // RENDER
  // =============================================================================

  return (
    <Card className="glass-card border-cyan-500/30 mb-6 overflow-hidden">
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-3">
            <motion.div
              animate={isSpeaking || isListening ? { scale: [1, 1.1, 1] } : {}}
              transition={{ repeat: Infinity, duration: 1.5 }}
              className="relative"
            >
              <Bot className="w-8 h-8 text-cyan-400" />
              {(isSpeaking || isListening) && (
                <motion.div
                  className="absolute -inset-2 rounded-full bg-cyan-500/30"
                  animate={{ scale: [1, 1.5, 1], opacity: [0.5, 0, 0.5] }}
                  transition={{ repeat: Infinity, duration: 2 }}
                />
              )}
            </motion.div>
            <div>
              <span className="text-xl font-bold text-white">Sannidh AI</span>
              <p className="text-xs text-cyan-300">Your Compliance Partner</p>
            </div>
          </CardTitle>
          
          <div className="flex items-center gap-2">
            <Badge 
              variant="outline" 
              className={`${isListening ? 'border-green-500/40 text-green-300 animate-pulse' : 'border-slate-500/40 text-slate-400'}`}
            >
              {isListening ? '🎤 Listening...' : isWakeWordActive ? '✨ Ready' : '💤 Say "Hey Sannidh"'}
            </Badge>
            
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowSettings(!showSettings)}
            >
              <Settings className="w-4 h-4" />
            </Button>
            
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsExpanded(!isExpanded)}
            >
              {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
            </Button>
          </div>
        </div>
      </CardHeader>

      <AnimatePresence>
        {isExpanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.3 }}
          >
            <CardContent className="space-y-4">
              {/* Settings Panel */}
              <AnimatePresence>
                {showSettings && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    className="p-3 rounded-lg bg-slate-800/50 border border-slate-700"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <div className="flex items-center gap-2">
                          <span className="text-xs text-slate-400">Language:</span>
                          <select
                            value={voiceLanguage}
                            onChange={(e) => setVoiceLanguage(e.target.value as any)}
                            className="bg-slate-700 text-white text-xs rounded px-2 py-1 border border-slate-600"
                          >
                            <option value="en-IN">English</option>
                            <option value="hi-IN">Hindi</option>
                          </select>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-xs text-slate-400">Sound:</span>
                          <Switch
                            checked={!isMuted}
                            onCheckedChange={(checked) => setIsMuted(!checked)}
                          />
                        </div>
                      </div>
                      <Button variant="ghost" size="sm" onClick={() => setShowSettings(false)}>
                        <X className="w-4 h-4" />
                      </Button>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Voice Waveform Animation */}
              {(isListening || isSpeaking) && (
                <motion.div 
                  className="flex items-center justify-center gap-1 py-4"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                >
                  {[...Array(12)].map((_, i) => (
                    <motion.div
                      key={i}
                      className={`w-1 rounded-full ${isListening ? 'bg-green-400' : 'bg-cyan-400'}`}
                      animate={{
                        height: [8, 24 + Math.random() * 16, 8],
                      }}
                      transition={{
                        repeat: Infinity,
                        duration: 0.5 + Math.random() * 0.5,
                        delay: i * 0.05,
                      }}
                    />
                  ))}
                </motion.div>
              )}

              {/* Live Transcript */}
              {transcript && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="p-3 rounded-lg bg-green-500/10 border border-green-500/30"
                >
                  <p className="text-sm text-green-300 flex items-center gap-2">
                    <Mic className="w-4 h-4" />
                    {transcript}
                  </p>
                </motion.div>
              )}

              {/* Current Task Progress */}
              {currentTask && currentTask.status === 'running' && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="p-4 rounded-lg bg-slate-800/50 border border-cyan-500/30"
                >
                  <div className="flex items-center gap-3 mb-3">
                    {(() => {
                      const TaskIcon = AGENT_TASKS[currentTask.taskType]?.icon || Zap;
                      return <TaskIcon className={`w-5 h-5 ${AGENT_TASKS[currentTask.taskType]?.color || 'text-cyan-400'}`} />;
                    })()}
                    <span className="font-medium text-white">{currentTask.taskName}</span>
                    <Badge className="bg-cyan-500/20 text-cyan-300 ml-auto">
                      {currentTask.progress}%
                    </Badge>
                  </div>
                  
                  {/* Progress Bar */}
                  <div className="w-full h-2 bg-slate-700 rounded-full overflow-hidden mb-3">
                    <motion.div
                      className="h-full bg-gradient-to-r from-cyan-500 to-blue-500"
                      initial={{ width: 0 }}
                      animate={{ width: `${currentTask.progress}%` }}
                      transition={{ duration: 0.5 }}
                    />
                  </div>
                  
                  {/* Progress Details */}
                  <div className="space-y-1">
                    {currentTask.details.slice(-3).map((detail, i) => (
                      <motion.p
                        key={i}
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        className="text-xs text-slate-400 flex items-center gap-2"
                      >
                        <CheckCircle className="w-3 h-3 text-green-400" />
                        {detail}
                      </motion.p>
                    ))}
                  </div>
                </motion.div>
              )}

              {/* Chat Messages */}
              <div className="max-h-[300px] overflow-y-auto space-y-3 pr-2">
                {messages.map((message) => (
                  <motion.div
                    key={message.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
                  >
                    <div
                      className={`max-w-[80%] p-3 rounded-2xl ${
                        message.role === 'user'
                          ? 'bg-cyan-600 text-white rounded-br-sm'
                          : 'bg-slate-700 text-slate-100 rounded-bl-sm'
                      }`}
                    >
                      <div className="flex items-start gap-2">
                        {message.role === 'assistant' && (
                          <Bot className="w-4 h-4 text-cyan-400 mt-0.5 flex-shrink-0" />
                        )}
                        <div>
                          <p className="text-sm whitespace-pre-line">{message.content}</p>
                          {message.taskStatus && (
                            <Badge
                              className={`mt-2 text-xs ${
                                message.taskStatus === 'needs_approval'
                                  ? 'bg-amber-500/20 text-amber-300'
                                  : message.taskStatus === 'completed'
                                  ? 'bg-green-500/20 text-green-300'
                                  : 'bg-cyan-500/20 text-cyan-300'
                              }`}
                            >
                              {message.taskStatus === 'needs_approval' && '⏳ Needs Approval'}
                              {message.taskStatus === 'started' && '🚀 Started'}
                              {message.taskStatus === 'completed' && '✅ Completed'}
                            </Badge>
                          )}
                        </div>
                        {message.role === 'user' && (
                          <User className="w-4 h-4 text-cyan-200 mt-0.5 flex-shrink-0" />
                        )}
                      </div>
                      <p className="text-[10px] text-slate-400 mt-1">
                        {message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </p>
                    </div>
                  </motion.div>
                ))}
                <div ref={messagesEndRef} />
              </div>

              {/* Input Area */}
              <div className="flex items-center gap-2 pt-2 border-t border-slate-700">
                {/* Voice Control */}
                <Button
                  variant={isListening ? 'default' : 'outline'}
                  size="icon"
                  onClick={isListening ? stopListening : startListening}
                  className={`${isListening ? 'bg-green-600 hover:bg-green-700 animate-pulse' : 'border-cyan-500/40 hover:bg-cyan-500/20'}`}
                >
                  {isListening ? <MicOff className="w-5 h-5" /> : <Mic className="w-5 h-5 text-cyan-400" />}
                </Button>

                {/* Mute Control */}
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => {
                    if (isSpeaking) stopSpeaking();
                    setIsMuted(!isMuted);
                  }}
                  className="border-slate-600"
                >
                  {isMuted ? <VolumeX className="w-5 h-5 text-slate-400" /> : <Volume2 className="w-5 h-5 text-cyan-400" />}
                </Button>

                {/* Text Input */}
                <form onSubmit={handleTextSubmit} className="flex-1 flex gap-2">
                  <Input
                    value={inputText}
                    onChange={(e) => setInputText(e.target.value)}
                    placeholder="Type a command or say 'Hey Sannidh'..."
                    className="flex-1 bg-slate-800 border-slate-600 text-white placeholder:text-slate-500"
                  />
                  <Button type="submit" className="bg-cyan-600 hover:bg-cyan-700">
                    <Send className="w-4 h-4" />
                  </Button>
                </form>
              </div>

              {/* Quick Actions */}
              <div className="flex flex-wrap gap-2 pt-2">
                <span className="text-xs text-slate-500">Quick:</span>
                {[
                  { label: '📊 Balance Sheet', command: 'generate balance sheet' },
                  { label: '🔄 Reconcile', command: 'reconcile invoices' },
                  { label: '📋 GST Return', command: 'prepare GST return' },
                  { label: '📅 Deadlines', command: 'check deadlines' },
                ].map((action) => (
                  <Button
                    key={action.label}
                    variant="outline"
                    size="sm"
                    onClick={() => handleVoiceCommand(action.command)}
                    className="text-xs border-slate-600 hover:bg-slate-700 hover:text-white"
                  >
                    {action.label}
                  </Button>
                ))}
              </div>
            </CardContent>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Collapsed View */}
      {!isExpanded && (
        <CardContent className="py-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Button
                variant={isListening ? 'default' : 'outline'}
                size="sm"
                onClick={isListening ? stopListening : startListening}
                className={isListening ? 'bg-green-600 animate-pulse' : 'border-cyan-500/40'}
              >
                <Mic className="w-4 h-4 mr-1" />
                {isListening ? 'Listening...' : 'Talk to Sannidh'}
              </Button>
              <span className="text-xs text-slate-400">
                {currentTask ? `Working: ${currentTask.taskName}` : 'Ready for commands'}
              </span>
            </div>
            {currentTask && (
              <Badge className="bg-cyan-500/20 text-cyan-300">
                {currentTask.progress}%
              </Badge>
            )}
          </div>
        </CardContent>
      )}
    </Card>
  );
};

export default SannidhLiveAgent;

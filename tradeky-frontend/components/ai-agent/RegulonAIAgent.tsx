'use client';

import { useState, useEffect, useRef } from 'react';
import { toast } from 'sonner';
import {
  Shield, FileText, CheckCircle, AlertTriangle, Zap, Clock,
  Mic, MicOff, Volume2, RefreshCw, Play, Download, Eye,
  TrendingUp, Activity, Settings, Lock, CheckCircle2,
  BarChart3, DollarSign, AlertCircle, Users
} from 'lucide-react';
import { motion } from 'framer-motion';

// ===== TELEMETRY & STATUS DISPLAY =====
const AgentTelemetryDisplay = ({ latency, isProcessing }: any) => {
  const [waveData, setWaveData] = useState<number[]>(Array(20).fill(0.5));

  useEffect(() => {
    const interval = setInterval(() => {
      setWaveData(prev => [
        ...prev.slice(1),
        Math.random() * 0.8 + 0.2
      ]);
    }, 50);
    return () => clearInterval(interval);
  }, []);

  return (
    <motion.div
      className="absolute top-4 right-4 bg-black/80 border border-cyan-500/30 rounded-lg p-4 backdrop-blur-sm"
      animate={{ opacity: isProcessing ? 1 : 0.6 }}
    >
      {/* Status Pulsing */}
      <div className="flex items-center gap-2 mb-3">
        <motion.div
          className="w-3 h-3 rounded-full bg-cyan-400"
          animate={{ scale: isProcessing ? [1, 1.3, 1] : 1 }}
          transition={{ duration: 1, repeat: isProcessing ? Infinity : 0 }}
        />
        <span className="text-xs text-cyan-300 font-mono">
          {isProcessing ? 'PROCESSING' : 'IDLE'}
        </span>
      </div>

      {/* Brain Activity Waveform */}
      <div className="h-16 flex items-end justify-between gap-1 mb-3 bg-black/40 p-2 rounded border border-cyan-500/20">
        {waveData.map((val, i) => (
          <div
            key={i}
            className="flex-1 bg-gradient-to-t from-cyan-400 to-cyan-600 rounded-t opacity-70"
            style={{ height: `${val * 100}%` }}
          />
        ))}
      </div>

      {/* System Stats */}
      <div className="space-y-1 text-xs font-mono">
        <div className="flex justify-between text-cyan-300">
          <span>Latency:</span>
          <span className="text-cyan-400">{latency}ms</span>
        </div>
        <div className="flex justify-between text-cyan-300">
          <span>Memory:</span>
          <span className="text-cyan-400">~156MB</span>
        </div>
      </div>
    </motion.div>
  );
};

// ===== EXECUTIVE LOG FEED =====
const ExecutiveLogFeed = ({ logs }: { logs: any[] }) => {
  const logIcons: Record<string, any> = {
    compliance: Shield,
    document: FileText,
    verify: CheckCircle,
    alert: AlertTriangle,
    processing: Zap,
    finance: DollarSign,
    user: Users,
  };

  return (
    <motion.div className="max-h-64 overflow-y-auto space-y-2 mb-4 pr-2">
      {logs.length === 0 ? (
        <div className="text-center py-8 text-gray-500">
          <Activity className="w-8 h-8 mx-auto mb-2 opacity-50" />
          <p className="text-sm">Awaiting agent activity...</p>
        </div>
      ) : (
        logs.map((log, idx) => {
          const IconComponent = logIcons[log.type] || Activity;
          return (
            <motion.div
              key={idx}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              className="bg-black/60 border border-cyan-500/20 rounded p-3 text-sm"
            >
              <div className="flex items-start gap-3">
                <IconComponent className="w-4 h-4 text-cyan-400 flex-shrink-0 mt-1" />
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <code className="text-xs text-gray-500">{log.timestamp}</code>
                    <span className={`text-xs font-semibold ${
                      log.status === 'SUCCESS' ? 'text-green-400' : 
                      log.status === 'ERROR' ? 'text-red-400' : 'text-yellow-400'
                    }`}>
                      {log.status}
                    </span>
                  </div>
                  <p className="text-gray-300">{log.message}</p>
                  {log.metadata && (
                    <div className="text-xs text-gray-500 mt-1">
                      {Object.entries(log.metadata).map(([k, v]) => (
                        <div key={k}>{k}: {String(v)}</div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </motion.div>
          );
        })
      )}
    </motion.div>
  );
};

// ===== ACTION QUEUE =====
const ActionQueue = ({ actions }: { actions: any[] }) => {
  return (
    <motion.div className="space-y-2 mb-4">
      {actions.length === 0 ? (
        <div className="text-center py-4 text-gray-500 text-sm">
          No active tasks
        </div>
      ) : (
        actions.map((action, idx) => (
          <motion.div
            key={idx}
            className="bg-black/60 border border-cyan-500/20 rounded p-3"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
          >
            <div className="flex items-center gap-3">
              <div className="flex-shrink-0">
                <svg className="w-6 h-6" viewBox="0 0 100 100">
                  <circle cx="50" cy="50" r="45" fill="none" stroke="#0891b2" strokeWidth="2" />
                  <circle
                    cx="50" cy="50" r="45"
                    fill="none"
                    stroke="#06b6d4"
                    strokeWidth="2"
                    strokeDasharray={`${2 * Math.PI * 45 * (action.progress || 0) / 100} ${2 * Math.PI * 45}`}
                    strokeLinecap="round"
                  />
                  <text x="50" y="55" textAnchor="middle" fontSize="20" fill="#06b6d4" fontWeight="bold">
                    {Math.round(action.progress || 0)}%
                  </text>
                </svg>
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-white truncate">{action.title}</p>
                <p className="text-xs text-gray-400">{action.subtitle}</p>
              </div>
              <div className="text-xs text-gray-500 flex-shrink-0">
                {action.eta}s
              </div>
            </div>
          </motion.div>
        ))
      )}
    </motion.div>
  );
};

// ===== VOICE TERMINAL UI =====
const VoiceTerminalUI = ({
  isListening,
  transcript,
  onVoiceClick,
  onSendMessage,
}: any) => {
  const [input, setInput] = useState('');
  const [displayText, setDisplayText] = useState('');

  useEffect(() => {
    if (transcript && !displayText) {
      let index = 0;
      const interval = setInterval(() => {
        setDisplayText(transcript.substring(0, index++));
        if (index > transcript.length) clearInterval(interval);
      }, 30);
      return () => clearInterval(interval);
    }
  }, [transcript, displayText]);

  return (
    <motion.div className="bg-black border border-cyan-500/20 rounded-lg p-4 mb-4">
      {/* Transcript Display */}
      {displayText && (
        <motion.div
          className="mb-4 p-3 bg-black/80 border-l-2 border-cyan-400 rounded"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
        >
          <p className="text-sm text-cyan-300 font-mono">{displayText}</p>
        </motion.div>
      )}

      {/* Input Area */}
      <div className="flex gap-2">
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Or type your request here..."
          className="flex-1 bg-black border border-cyan-500/40 rounded px-3 py-2 text-sm text-cyan-300 placeholder-gray-600 focus:outline-none focus:border-cyan-400"
          onKeyPress={(e) => {
            if (e.key === 'Enter' && input) {
              onSendMessage(input);
              setInput('');
            }
          }}
        />
        
        {/* Glowing Voice Pulse Icon */}
        <motion.button
          onClick={onVoiceClick}
          className={`p-3 rounded-full transition-all ${
            isListening
              ? 'bg-gradient-to-r from-cyan-600 to-blue-600 shadow-lg shadow-cyan-500/50'
              : 'bg-cyan-600 hover:bg-cyan-700'
          }`}
          animate={isListening ? { scale: [1, 1.1, 1] } : {}}
          transition={{ duration: 0.6, repeat: isListening ? Infinity : 0 }}
          title={isListening ? 'Listening...' : 'Click to start voice'}
        >
          {isListening ? (
            <Mic className="w-5 h-5 text-white" />
          ) : (
            <MicOff className="w-5 h-5 text-white" />
          )}
        </motion.button>

        {/* Frequency Wave when listening */}
        {isListening && (
          <motion.div className="flex items-center gap-1 px-3 py-2 bg-cyan-500/10 rounded border border-cyan-500/30">
            {[...Array(5)].map((_, i) => (
              <motion.div
                key={i}
                className="w-1 bg-cyan-400 rounded-full"
                animate={{ height: ['4px', '16px', '4px'] }}
                transition={{ duration: 0.4, delay: i * 0.1, repeat: Infinity }}
              />
            ))}
          </motion.div>
        )}
      </div>
    </motion.div>
  );
};

// ===== MAIN AI AGENT COMPONENT =====
export default function RegulonAIAgent() {
  const [activeTab, setActiveTab] = useState<'daily-brief' | 'activity' | 'direct-actions'>('daily-brief');
  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [executingAction, setExecutingAction] = useState<string | null>(null);
  const [logs, setLogs] = useState<any[]>([]);
  const [actionQueue, setActionQueue] = useState<any[]>([]);
  const [latency, setLatency] = useState(0);
  const [dailyBrief, setDailyBrief] = useState<any>(null);
  const [companies, setCompanies] = useState<any[]>([]);
  const [selectedCompany, setSelectedCompany] = useState<string | null>(null);
  const [isLoadingBrief, setIsLoadingBrief] = useState(false);
  
  const recognitionRef = useRef<any>(null);
  const synthRef = useRef<any>(null);

  // Initialize Voice APIs
  useEffect(() => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    const SpeechSynthesis = window.speechSynthesis;

    if (SpeechRecognition) {
      const recognition = new SpeechRecognition();
      recognition.continuous = false;
      recognition.interimResults = true;
      recognition.lang = 'en-US';

      recognition.onstart = () => {
        setIsListening(true);
        addLog('Voice recognition started', 'processing', 'PROCESSING');
      };

      recognition.onresult = (event: any) => {
        let current = '';
        for (let i = event.resultIndex; i < event.results.length; i++) {
          current += event.results[i][0].transcript;
        }
        setTranscript(current);

        if (event.results[event.results.length - 1].isFinal) {
          handleVoiceTranscript(current);
        }
      };

      recognition.onerror = (event: any) => {
        addLog(`Voice error: ${event.error}`, 'alert', 'ERROR');
      };

      recognition.onend = () => {
        setIsListening(false);
      };

      recognitionRef.current = recognition;
    }

    synthRef.current = SpeechSynthesis;
  }, []);

  // "Hey Regulon" Wake Word Detection
  useEffect(() => {
    if (transcript.toLowerCase().includes('hey regulon')) {
      setTranscript('');
      toast.info('🎙️ Hey Regulon activated! Ready for commands.');
      addLog('Wake word detected: "Hey Regulon"', 'processing', 'SUCCESS');
    }
  }, [transcript]);

  // Fetch Daily Governance Brief
  const fetchDailyBrief = async () => {
    setIsLoadingBrief(true);
    const startTime = Date.now();
    
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('http://localhost:3001/api/ca/daily-governance', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await response.json();
      setLatency(Date.now() - startTime);
      
      if (data.success) {
        setDailyBrief(data.data);
        setCompanies(data.data.assignedCompanies || []);
        addLog('Daily governance brief fetched', 'document', 'SUCCESS', {
          companies: data.data.assignedCompanies?.length || 0,
          tasks: data.data.pendingTasks || 0
        });
        toast.success('📊 Daily brief updated');
      }
    } catch (err: any) {
      addLog(`Failed to fetch brief: ${err.message}`, 'alert', 'ERROR');
      toast.error('Failed to fetch daily brief');
    } finally {
      setIsLoadingBrief(false);
    }
  };

  // Load brief on mount
  useEffect(() => {
    fetchDailyBrief();
  }, []);

  const addLog = (message: string, type: string = 'processing', status: string = 'INFO', metadata?: any) => {
    const timestamp = new Date().toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: true
    });

    setLogs(prev => [
      { timestamp, message, type, status, metadata },
      ...prev.slice(0, 19)
    ]);
  };

  const handleVoiceTranscript = (text: string) => {
    if (!selectedCompany) return; // Need company selected
    if (text.toLowerCase().includes('balance sheet')) {
      executeDirectAction('balance_sheet', selectedCompany);
    } else if (text.toLowerCase().includes('audit')) {
      executeDirectAction('audit_financials', selectedCompany);
    } else if (text.toLowerCase().includes('notices')) {
      executeDirectAction('check_notices', selectedCompany);
    }
  };

  const handleVoiceClick = () => {
    if (recognitionRef.current) {
      if (isListening) {
        recognitionRef.current.stop();
      } else {
        recognitionRef.current.start();
      }
    }
  };

  const executeDirectAction = async (action: string, companyId?: string) => {
    if (!selectedCompany && !companyId) {
      toast.error('Please select a company first');
      return;
    }

    const target = companyId || selectedCompany;
    setExecutingAction(action);

    const actionTitles: Record<string, string> = {
      balance_sheet: 'Generating Balance Sheet',
      audit_financials: 'Running Financial Audit',
      check_notices: 'Checking Government Notices',
      reconcile_gst: 'Reconciling GST Data',
      verify_documents: 'Verifying Document Hashes',
    };

    const newAction = {
      title: actionTitles[action] || 'Executing Action',
      subtitle: `Company: ${companies.find(c => c.id === target)?.name || 'Unknown'}`,
      progress: 0,
      eta: 45
    };

    setActionQueue(prev => [newAction, ...prev.slice(0, 4)]);
    addLog(`Initiating ${action} for company`, 'processing', 'PROCESSING');

    try {
      const token = localStorage.getItem('token');
      const response = await fetch('http://localhost:3001/api/ca/action-execute', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ action, company_id: target })
      });

      // Simulate progress updates
      for (let i = 0; i <= 100; i += 10) {
        await new Promise(r => setTimeout(r, 200));
        setActionQueue(prev => {
          if (prev[0]) {
            return [{
              ...prev[0],
              progress: i,
              eta: Math.max(5, 45 - Math.floor(i / 2))
            }, ...prev.slice(1)];
          }
          return prev;
        });
      }

      const result = await response.json();
      if (result.success) {
        addLog(`${action} completed successfully`, 'verify', 'SUCCESS', {
          pages: result.data?.pages || 0,
          timestamp: new Date().toISOString()
        });
        toast.success(`✅ ${actionTitles[action]} completed`);

        // Move to completed
        setActionQueue(prev => prev.slice(1));
      }
    } catch (err: any) {
      addLog(`Action failed: ${err.message}`, 'alert', 'ERROR');
      toast.error('Action execution failed');
      setActionQueue(prev => prev.slice(1));
    } finally {
      setExecutingAction(null);
    }
  };

  const handleSendMessage = (message: string) => {
    addLog(`User query: "${message}"`, 'processing', 'INFO');
    // Would integrate with actual AI backend here
    toast.info('Query received - AI will respond');
  };

  return (
    <motion.div
      className="bg-gradient-to-br from-[#0B0E14] to-[#1a1f2e] border border-cyan-500/20 rounded-xl p-6 mb-8"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <motion.div
            className="w-10 h-10 rounded-full bg-gradient-to-br from-cyan-400 to-blue-600 flex items-center justify-center"
            animate={{ rotate: 360 }}
            transition={{ duration: 3, repeat: Infinity }}
          >
            <Zap className="w-6 h-6 text-white" />
          </motion.div>
          <div>
            <h2 className="text-xl font-bold text-white">REGULON AI Executive</h2>
            <p className="text-xs text-gray-400">Autonomous Compliance Agent</p>
          </div>
        </div>

        {/* Telemetry Display */}
        <AgentTelemetryDisplay latency={latency} isProcessing={actionQueue.length > 0} />
      </div>

      {/* Tab Navigation */}
      <div className="flex gap-2 mb-6 border-b border-cyan-500/20">
        {(['daily-brief', 'activity', 'direct-actions'] as const).map(tab => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-4 py-2 text-sm font-semibold transition-colors border-b-2 ${
              activeTab === tab
                ? 'text-cyan-400 border-cyan-400'
                : 'text-gray-400 border-transparent hover:text-cyan-300'
            }`}
          >
            {tab === 'daily-brief' && '📊 Daily Brief'}
            {tab === 'activity' && '📝 Activity Stream'}
            {tab === 'direct-actions' && '⚡ Direct Actions'}
          </button>
        ))}
      </div>

      {/* Content Panels */}
      <div className="space-y-4">
        {/* DAILY BRIEF TAB */}
        {activeTab === 'daily-brief' && (
          <motion.div
            key="daily-brief"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="space-y-4"
          >
            <div className="flex items-center gap-2 mb-4">
              <RefreshCw
                className="w-5 h-5 text-cyan-400 cursor-pointer hover:animate-spin"
                onClick={fetchDailyBrief}
              />
              <button
                onClick={fetchDailyBrief}
                disabled={isLoadingBrief}
                className="text-sm text-cyan-400 hover:text-cyan-300 disabled:opacity-50"
              >
                {isLoadingBrief ? 'Refreshing...' : 'Refresh Data'}
              </button>
            </div>

            {dailyBrief && (
              <div className="grid grid-cols-2 gap-3 mb-4">
                <StatBox
                  icon={Users}
                  label="Assigned Companies"
                  value={dailyBrief.assignedCompanies?.length || 0}
                />
                <StatBox
                  icon={AlertTriangle}
                  label="Pending Tasks"
                  value={dailyBrief.pendingTasks || 0}
                />
                <StatBox
                  icon={Clock}
                  label="Due in 7 Days"
                  value={dailyBrief.dueIn7Days || 0}
                />
                <StatBox
                  icon={AlertCircle}
                  label="High-Risk Alerts"
                  value={dailyBrief.highRiskAlerts || 0}
                />
                <StatBox
                  icon={DollarSign}
                  label="Revenue This Month"
                  value={`₹${dailyBrief.revenueThisMonth || 0}`}
                />
                <StatBox
                  icon={TrendingUp}
                  label="Plan Limit"
                  value={`${dailyBrief.planLimit || 0}%`}
                />
              </div>
            )}

            <div className="bg-black/40 border border-cyan-500/20 rounded p-4">
              <p className="text-sm text-gray-300 mb-3">🤖 AI Daily Summary:</p>
              <p className="text-sm text-cyan-300 leading-relaxed">
                {dailyBrief?.aiSummary || 
                  'Good morning! You have ' + (dailyBrief?.pendingTasks || 0) + 
                  ' pending tasks across ' + (dailyBrief?.assignedCompanies?.length || 0) + 
                  ' companies. Review your high-risk alerts before taking any action.'}
              </p>
            </div>
          </motion.div>
        )}

        {/* ACTIVITY STREAM TAB */}
        {activeTab === 'activity' && (
          <motion.div
            key="activity"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="space-y-4"
          >
            <h3 className="text-sm font-semibold text-gray-300 mb-3">📋 Executive Log</h3>
            <ExecutiveLogFeed logs={logs} />

            <h3 className="text-sm font-semibold text-gray-300 mb-3">⏳ Action Queue</h3>
            <ActionQueue actions={actionQueue} />
          </motion.div>
        )}

        {/* DIRECT ACTIONS TAB */}
        {activeTab === 'direct-actions' && (
          <motion.div
            key="direct-actions"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="space-y-4"
          >
            <div className="mb-4">
              <label className="text-sm text-gray-300 mb-2 block">Select Company:</label>
              <select
                value={selectedCompany || ''}
                onChange={(e) => setSelectedCompany(e.target.value)}
                className="w-full bg-black border border-cyan-500/40 rounded px-3 py-2 text-sm text-cyan-300 focus:outline-none focus:border-cyan-400"
              >
                <option value="">-- Select a company --</option>
                {companies.map(company => (
                  <option key={company.id} value={company.id}>
                    {company.name} ({company.gstin})
                  </option>
                ))}
              </select>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <ActionButton
                label="Balance Sheet"
                icon={BarChart3}
                onClick={() => executeDirectAction('balance_sheet')}
                disabled={!selectedCompany}
              />
              <ActionButton
                label="Audit Financials"
                icon={FileText}
                onClick={() => executeDirectAction('audit_financials')}
                disabled={!selectedCompany}
              />
              <ActionButton
                label="Check Notices"
                icon={AlertTriangle}
                onClick={() => executeDirectAction('check_notices')}
                disabled={!selectedCompany}
              />
              <ActionButton
                label="Reconcile GST"
                icon={CheckCircle}
                onClick={() => executeDirectAction('reconcile_gst')}
                disabled={!selectedCompany}
              />
              <ActionButton
                label="Verify Documents"
                icon={Lock}
                onClick={() => executeDirectAction('verify_documents')}
                disabled={!selectedCompany}
              />
              <ActionButton
                label="Generate Report"
                icon={FileText}
                onClick={() => executeDirectAction('generate_report')}
                disabled={!selectedCompany}
              />
            </div>

            <VoiceTerminalUI
              isListening={isListening}
              transcript={transcript}
              onVoiceClick={handleVoiceClick}
              onSendMessage={handleSendMessage}
            />
          </motion.div>
        )}
      </div>
    </motion.div>
  );
}

// Helper Components
function StatBox({ icon: Icon, label, value }: any) {
  return (
    <motion.div
      className="bg-black/60 border border-cyan-500/20 rounded p-3"
      whileHover={{ scale: 1.02 }}
    >
      <div className="flex items-center gap-2 mb-2">
        <Icon className="w-4 h-4 text-cyan-400" />
        <span className="text-xs text-gray-400">{label}</span>
      </div>
      <p className="text-lg font-bold text-cyan-400">{value}</p>
    </motion.div>
  );
}

function ActionButton({ label, icon: Icon, onClick, disabled }: any) {
  return (
    <motion.button
      onClick={onClick}
      disabled={disabled}
      whileHover={{ scale: disabled ? 1 : 1.05 }}
      whileTap={{ scale: disabled ? 1 : 0.95 }}
      className={`p-3 rounded-lg border-2 transition-all flex flex-col items-center justify-center gap-2 ${
        disabled
          ? 'bg-black/40 border-gray-600 text-gray-500 cursor-not-allowed opacity-50'
          : 'bg-black/60 border-cyan-500/40 text-cyan-300 hover:bg-black/80 hover:border-cyan-400'
      }`}
    >
      <Icon className="w-5 h-5" />
      <span className="text-xs font-semibold text-center">{label}</span>
    </motion.button>
  );
}

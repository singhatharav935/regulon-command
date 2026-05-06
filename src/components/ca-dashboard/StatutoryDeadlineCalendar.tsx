import React, { useState, useEffect } from 'react';
import { isCABackendConfigured } from '@/lib/ca-backend-guard';
import { motion } from 'framer-motion';
import { CalendarDays, BellRing, Clock, AlertTriangle, RefreshCw, Calendar } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
const CA_API = (import.meta.env.VITE_CA_API_BASE_URL as string) || 'http://localhost:3001';

interface RealDeadline {
  id: string;
  date: string;
  label: string;
  active: boolean;
  urgency: 'normal' | 'high' | 'critical';
}

interface ExternalEscalation {
  id: string;
  title: string;
  summary: string;
  type: 'funds' | 'pending' | 'warning';
}

export default function StatutoryDeadlineCalendar() {
  const [deadlines, setDeadlines] = useState<RealDeadline[]>([]);
  const [escalations, setEscalations] = useState<ExternalEscalation[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchCalendar = async () => {
    if (!isCABackendConfigured()) {
      setIsLoading(false);
      return;
    }
    setIsLoading(true);
    try {
      const res = await fetch(`${CA_API}/api/v1/agent/deadlines`);
      const data = await res.json();
      if (data.deadlines) {
        setDeadlines(data.deadlines);
      }
      if (data.escalations) {
        setEscalations(data.escalations);
      }
    } catch (e) {
      // Backend unavailable — silently use empty state
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchCalendar();
  }, []);

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-6 mb-12 max-w-[1400px]">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold flex items-center gap-2 text-foreground">
            <CalendarDays className="w-6 h-6 text-pink-500" />
            Global Statutory Calendar
          </h2>
          <p className="text-sm text-muted-foreground mt-1">
            Live tracker of GST, ITR, MCA, and TDS deadlines for all clients.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Button variant="outline" size="sm" onClick={fetchCalendar} disabled={isLoading}>
            <RefreshCw className={`w-4 h-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
          <Button variant="outline" size="sm" className="border-pink-500/30 text-pink-500 hover:bg-pink-500/10">
            <BellRing className="w-4 h-4 mr-2" /> Sync Slack
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card className="md:col-span-3 border-border/50 bg-card/30">
          <CardContent className="p-0">
            {/* Real Deadlines view */}
            <div className="flex overflow-x-auto custom-scrollbar p-6 gap-3 min-h-[160px]">
              {isLoading ? (
                 <div className="w-full flex items-center justify-center p-8 text-muted-foreground">
                   <RefreshCw className="w-6 h-6 animate-spin mb-2 mx-auto" />
                   <span className="text-sm">Syncing calendar...</span>
                 </div>
              ) : deadlines.length === 0 ? (
                 <div className="w-full flex flex-col items-center justify-center p-6 text-muted-foreground border border-dashed border-border/50 rounded-xl bg-card/20">
                   <Calendar className="w-8 h-8 mb-2 opacity-30" />
                   <p className="text-sm font-medium">No active deadlines this week</p>
                   <p className="text-xs">Connecting clients will populate this timeline.</p>
                 </div>
              ) : (
                deadlines.map((d, i) => (
                  <div key={d.id || i} className={`min-w-[120px] p-4 rounded-xl border ${d.active ? 'border-pink-500/50 bg-pink-500/10' : 'border-border/50 bg-background'} text-center`}>
                    <p className={`text-2xl font-bold ${d.active ? 'text-pink-500' : 'text-foreground'}`}>{d.date}</p>
                    <p className="text-xs text-muted-foreground mt-1">{d.label}</p>
                    {d.active && d.urgency === 'critical' && <div className="mt-3 w-2 h-2 rounded-full bg-pink-500 mx-auto animate-pulse" />}
                    {d.active && d.urgency === 'high' && <div className="mt-3 w-2 h-2 rounded-full bg-orange-500 mx-auto animate-pulse" />}
                  </div>
                ))
              )}
            </div>

            <div className="border-t border-border/50 p-6">
              <h3 className="font-semibold mb-4 flex items-center gap-2 text-foreground">
                <Clock className="w-4 h-4 text-blue-500" /> Active Escalations
              </h3>
              
              {isLoading ? (
                <div className="text-center p-4 text-xs text-muted-foreground">Scanning client base...</div>
              ) : escalations.length === 0 ? (
                <div className="text-center p-4 text-sm text-muted-foreground border border-border/20 rounded-lg bg-card/10">
                  <span className="flex items-center justify-center gap-2 text-green-500/80">
                    <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" /> All client requirements met.
                  </span>
                </div>
              ) : (
                <div className="space-y-3">
                  {escalations.map((esc) => (
                    <div key={esc.id} className={`flex items-center justify-between p-3 rounded-lg border ${
                      esc.type === 'funds' ? 'bg-red-500/5 border-red-500/30' : 'bg-background border-border/50'
                    }`}>
                      <div>
                        {esc.type === 'funds' && (
                          <div className="flex items-center gap-2">
                             <AlertTriangle className="w-4 h-4 text-red-500" />
                             <p className="font-medium text-red-500">{esc.title}</p>
                          </div>
                        )}
                        {esc.type !== 'funds' && <p className="font-medium">{esc.title}</p>}
                        <p className={`text-xs mt-0.5 ${esc.type === 'funds' ? 'text-red-400' : 'text-muted-foreground'}`}>
                          {esc.summary}
                        </p>
                      </div>
                      <Button size="sm" variant={esc.type === 'funds' ? 'destructive' : 'outline'} className={esc.type !== 'funds' ? 'text-pink-500 border-pink-500/30' : ''}>
                        {esc.type === 'funds' ? 'Resolve' : 'Auto-Remind'}
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        <Card className="border-border/50 bg-card/30">
          <CardContent className="p-6 space-y-6">
            <h3 className="font-semibold text-foreground">Compliance Tiers</h3>
            
            <div className="space-y-4">
              <div>
                <div className="flex justify-between text-xs mb-1">
                  <span className="text-muted-foreground">Level 1: Prepare (60 Days)</span>
                  <span className="font-medium">Phase</span>
                </div>
                <div className="w-full h-2 bg-muted rounded-full overflow-hidden"><div className="w-full h-full bg-green-500/30" /></div>
              </div>
              <div>
                <div className="flex justify-between text-xs mb-1">
                  <span className="text-muted-foreground">Level 2: Collect (30 Days)</span>
                  <span className="font-medium">Phase</span>
                </div>
                <div className="w-full h-2 bg-muted rounded-full overflow-hidden"><div className="w-full h-full bg-yellow-500/50" /></div>
              </div>
              <div>
                <div className="flex justify-between text-xs mb-1">
                  <span className="text-muted-foreground">Level 3: Finalize (15 Days)</span>
                  <span className="font-medium">Active</span>
                </div>
                <div className="w-full h-2 bg-muted rounded-full overflow-hidden"><div className="w-3/4 h-full bg-orange-500" /></div>
              </div>
              <div>
                <div className="flex justify-between text-xs mb-1">
                  <span className="text-pink-500 font-bold">Level 4: Urgent (7 Days)</span>
                  <span className="font-medium text-pink-500">Critical</span>
                </div>
                <div className="w-full h-2 bg-muted rounded-full overflow-hidden"><div className="w-1/4 h-full bg-pink-500 animate-pulse" /></div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </motion.div>
  );
}

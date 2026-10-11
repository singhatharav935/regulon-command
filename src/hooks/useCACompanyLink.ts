/**
 * useCACompanyLink — Real Company ↔ CA Link Hook
 * ================================================
 * Handles the full real-data bidirectional connection between
 * Company Owners and CAs via Supabase Edge Function.
 *
 * Features:
 * - Generates/fetches real unique link codes stored in Supabase
 * - Sends real OTP to the other party's registered email via Resend
 * - Verifies OTP and activates the connection in Supabase
 * - Syncs real financial data from Company → CA
 * - Reads synced data for the CA
 */

import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/use-auth';
import { toast } from 'sonner';

export interface RealCAConnection {
  id: string;
  other_user_id: string;
  other_email: string;
  other_name: string;
  other_role: 'ca' | 'company';
  other_link_code: string;
  linked_at: string;
  status: 'active';
}

export interface SyncPayload {
  sentAt: string;
  companyName: string;
  gstin: string;
  pan: string;
  financialYear: string;
  revenue: string;
  profitAfterTax: string;
  totalAssets: string;
  complianceScore: number;
  pendingTasks: number;
  documents: { name: string; type: string; status: string }[];
  notifications: string[];
  [key: string]: unknown;
}

type Step = 'idle' | 'sending_otp' | 'otp_sent' | 'verifying' | 'linked';

const EDGE_FN = '/functions/v1/send-ca-link-otp';

async function callEdgeFn(action: string, body?: object, token?: string) {
  const supabaseUrl = import.meta.env.VITE_SUPABASE_URL as string;
  const res = await fetch(`${supabaseUrl}${EDGE_FN}?action=${action}`, {
    method: body ? 'POST' : 'GET',
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    ...(body ? { body: JSON.stringify(body) } : {}),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Request failed');
  return data;
}

export function useCACompanyLink(role: 'ca' | 'company') {
  const { user, session } = useAuth();
  const token = session?.access_token;

  const [myCode, setMyCode] = useState<string | null>(null);
  const [codeLoading, setCodeLoading] = useState(true);
  const [connection, setConnection] = useState<RealCAConnection | null>(null);
  const [connectionLoading, setConnectionLoading] = useState(true);
  const [step, setStep] = useState<Step>('idle');
  const [targetCodeInput, setTargetCodeInput] = useState('');
  const [otpInput, setOtpInput] = useState('');
  const [targetEmailMasked, setTargetEmailMasked] = useState('');
  const [syncPayload, setSyncPayload] = useState<SyncPayload | null>(null);
  const [isSyncing, setIsSyncing] = useState(false);
  const [lastSyncTime, setLastSyncTime] = useState<string | null>(null);

  // ── Load own link code ─────────────────────────────────────────────────────
  const loadMyCode = useCallback(async () => {
    if (!token) return;
    try {
      setCodeLoading(true);
      const data = await callEdgeFn('generate_code', { role }, token);
      setMyCode(data.code);
    } catch (err: any) {
      console.error('Failed to load link code:', err);
    } finally {
      setCodeLoading(false);
    }
  }, [token, role]);

  // ── Load existing connection ───────────────────────────────────────────────
  const loadConnection = useCallback(async () => {
    if (!token) return;
    try {
      setConnectionLoading(true);
      const supabaseUrl = import.meta.env.VITE_SUPABASE_URL as string;
      const res = await fetch(`${supabaseUrl}${EDGE_FN}?action=get_connection`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      setConnection(data.connection || null);
      if (data.connection) setStep('linked');
    } catch (err) {
      console.error('Failed to load connection:', err);
    } finally {
      setConnectionLoading(false);
    }
  }, [token]);

  // ── Load synced data (CA side) ─────────────────────────────────────────────
  const loadSyncData = useCallback(async () => {
    if (!token || role !== 'ca') return;
    try {
      const supabaseUrl = import.meta.env.VITE_SUPABASE_URL as string;
      const res = await fetch(`${supabaseUrl}${EDGE_FN}?action=get_sync_data`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (data.payload) {
        setSyncPayload(data.payload);
        setLastSyncTime(data.sent_at);
      }
    } catch (err) {
      console.error('Failed to load sync data:', err);
    }
  }, [token, role]);

  useEffect(() => {
    if (token) {
      loadMyCode();
      loadConnection();
      if (role === 'ca') loadSyncData();
    }
  }, [token, loadMyCode, loadConnection, loadSyncData]);

  // ── Send OTP ───────────────────────────────────────────────────────────────
  const sendOtp = async () => {
    const trimmed = targetCodeInput.trim().toUpperCase();
    if (!trimmed || trimmed.length < 6) {
      toast.error('Enter a valid link code');
      return;
    }
    if (!token) { toast.error('You must be logged in'); return; }

    try {
      setStep('sending_otp');
      const data = await callEdgeFn('send_otp', {
        target_code: trimmed,
        requester_role: role,
      }, token);

      setTargetEmailMasked(data.target_email_masked || '');
      setStep('otp_sent');
      toast.success('OTP sent!', {
        description: `A verification OTP was emailed to ${data.target_email_masked}. Ask them to share it with you.`,
        duration: 8000,
      });
    } catch (err: any) {
      setStep('idle');
      toast.error('Failed to send OTP', { description: err.message });
    }
  };

  // ── Verify OTP ─────────────────────────────────────────────────────────────
  const verifyOtp = async () => {
    if (!otpInput.trim() || otpInput.trim().length < 6) {
      toast.error('Enter the 6-digit OTP');
      return;
    }
    if (!token) return;

    try {
      setStep('verifying');
      const data = await callEdgeFn('verify_otp', {
        target_code: targetCodeInput.trim().toUpperCase(),
        otp: otpInput.trim(),
      }, token);

      const conn: RealCAConnection = {
        id: data.connection.id,
        other_user_id: data.connection.target_user_id,
        other_email: data.connection.target_email,
        other_name: data.connection.target_name,
        other_role: data.connection.target_role,
        other_link_code: data.connection.target_link_code,
        linked_at: data.connection.linked_at,
        status: 'active',
      };
      setConnection(conn);
      setStep('linked');
      setTargetCodeInput('');
      setOtpInput('');
      toast.success('🎉 Successfully Connected!', {
        description: `Your dashboard is now linked to ${conn.other_name || conn.other_email}.`,
        duration: 6000,
      });
    } catch (err: any) {
      setStep('otp_sent');
      toast.error('OTP Verification Failed', { description: err.message });
    }
  };

  // ── Disconnect ─────────────────────────────────────────────────────────────
  const disconnect = async () => {
    if (!token) return;
    try {
      await callEdgeFn('disconnect', {}, token);
      setConnection(null);
      setSyncPayload(null);
      setStep('idle');
      setTargetCodeInput('');
      setOtpInput('');
      toast.info('Dashboard disconnected');
    } catch (err: any) {
      toast.error('Failed to disconnect', { description: err.message });
    }
  };

  // ── Send Data to CA (company side) ────────────────────────────────────────
  const sendDataToCA = async (payload: Omit<SyncPayload, 'sentAt'>) => {
    if (!token || !connection) {
      toast.error('No active CA connection');
      return;
    }
    try {
      setIsSyncing(true);
      const fullPayload = { ...payload, sentAt: new Date().toISOString() };
      await callEdgeFn('sync_data', { payload: fullPayload }, token);
      setLastSyncTime(new Date().toISOString());
      toast.success(`✅ Data sent to ${connection.other_name || connection.other_email}!`, {
        description: 'All financials are now available in your CA\'s Client Vault.',
        duration: 6000,
      });
    } catch (err: any) {
      toast.error('Sync failed', { description: err.message });
    } finally {
      setIsSyncing(false);
    }
  };

  return {
    // State
    myCode,
    codeLoading,
    connection,
    connectionLoading,
    step,
    setStep,
    targetCodeInput,
    setTargetCodeInput,
    otpInput,
    setOtpInput,
    targetEmailMasked,
    syncPayload,
    isSyncing,
    lastSyncTime,
    isLinked: !!connection,
    // Actions
    sendOtp,
    verifyOtp,
    disconnect,
    sendDataToCA,
    refreshConnection: loadConnection,
    refreshSyncData: loadSyncData,
  };
}

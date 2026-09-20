import { useState, useCallback, useRef } from 'react';

type PollingStatus = 'idle' | 'polling' | 'success' | 'error';

interface AsyncPollingResult<T> {
  status: PollingStatus;
  data: T | null;
  error: string | null;
  progress: number;
  startPolling: (jobId: string, endpoint: string, intervalMs?: number, maxAttempts?: number) => void;
  stopPolling: () => void;
}

export function useAsyncPolling<T>(): AsyncPollingResult<T> {
  const [status, setStatus] = useState<PollingStatus>('idle');
  const [data, setData] = useState<T | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [progress, setProgress] = useState(0);

  const pollingRef = useRef<NodeJS.Timeout | null>(null);
  const attemptsRef = useRef(0);

  const stopPolling = useCallback(() => {
    if (pollingRef.current) {
      clearInterval(pollingRef.current);
      pollingRef.current = null;
    }
    if (status === 'polling') setStatus('idle');
  }, [status]);

  const startPolling = useCallback(
    (jobId: string, endpoint: string, intervalMs = 2000, maxAttempts = 30) => {
      stopPolling();
      setStatus('polling');
      setData(null);
      setError(null);
      setProgress(0);
      attemptsRef.current = 0;

      pollingRef.current = setInterval(async () => {
        attemptsRef.current += 1;
        
        try {
          const response = await fetch(`${endpoint}?job_id=${jobId}`);
          
          if (!response.ok) throw new Error('Polling request failed');
          
          const result = await response.json();

          if (result.status === 'completed') {
            stopPolling();
            setStatus('success');
            setProgress(100);
            setData(result.data);
          } else if (result.status === 'failed') {
            stopPolling();
            setStatus('error');
            setError(result.error || 'Job failed on the server');
          } else {
            // Processing status
            setProgress(result.progress || Math.min((attemptsRef.current / maxAttempts) * 100, 95));
          }
        } catch (err: any) {
          console.error('Polling error:', err);
          stopPolling();
          setStatus('error');
          setError(err.message || 'Network error during polling');
        }

        if (attemptsRef.current >= maxAttempts) {
          stopPolling();
          setStatus('error');
          setError('Polling timeout exceeded');
        }
      }, intervalMs);
    },
    [stopPolling]
  );

  return {
    status,
    data,
    error,
    progress,
    startPolling,
    stopPolling,
  };
}

'use client';

import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { authFetch } from '@/lib/authFetch';
import RegulonAIAgent from '@/components/ai-agent/RegulonAIAgent';
import { motion } from 'framer-motion';
import { LogOut, Settings } from 'lucide-react';

export default function RealCADashboard() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [userInfo, setUserInfo] = useState<any>(null);

  useEffect(() => {
    const token = localStorage.getItem('token');
    const userRole = localStorage.getItem('userRole');

    // Ensure only external CA can access
    if (!token || userRole !== 'external_ca') {
      router.replace('/login');
      return;
    }

    const verifyAuth = async () => {
      try {
        const data = await authFetch('http://localhost:3001/api/protected');
        if (data?.__unauthorized) {
          localStorage.removeItem('token');
          router.replace('/login');
          return;
        }
        setUserInfo(data.user || {});
        setLoading(false);
      } catch {
        localStorage.removeItem('token');
        router.replace('/login');
      }
    };

    verifyAuth();
  }, [router]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#0B0E14] to-[#1a1f2e] text-white flex items-center justify-center">
        <div className="text-center">
          <motion.div
            className="w-16 h-16 border-4 border-cyan-500 border-t-transparent rounded-full mx-auto mb-4"
            animate={{ rotate: 360 }}
            transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
          />
          <p className="text-gray-300">Loading Real CA Dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#0B0E14] to-[#1a1f2e] text-white">
      {/* Header */}
      <header className="border-b border-cyan-500/20 bg-black/40 backdrop-blur-sm sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <motion.div
                className="w-10 h-10 rounded-full bg-gradient-to-br from-cyan-400 to-blue-600 flex items-center justify-center font-bold"
                animate={{ rotate: [0, 360] }}
                transition={{ duration: 20, repeat: Infinity, ease: 'linear' }}
              >
                ℜ
              </motion.div>
              <div>
                <h1 className="text-2xl font-bold text-white">REGULON</h1>
                <p className="text-xs text-gray-400">External CA Dashboard</p>
              </div>
            </div>

            <div className="flex items-center gap-4">
              <div className="text-right">
                <p className="text-sm font-semibold text-white">{userInfo?.name || 'CA User'}</p>
                <p className="text-xs text-gray-400">{userInfo?.email || 'ca@regulon.com'}</p>
              </div>
              <div className="flex gap-2">
                <button
                  className="p-2 hover:bg-cyan-500/20 rounded-lg transition-colors text-gray-400 hover:text-cyan-400"
                  title="Settings"
                >
                  <Settings className="w-5 h-5" />
                </button>
                <button
                  onClick={() => {
                    localStorage.removeItem('token');
                    localStorage.removeItem('userRole');
                    router.push('/login');
                  }}
                  className="p-2 hover:bg-red-500/20 rounded-lg transition-colors text-gray-400 hover:text-red-400"
                  title="Logout"
                >
                  <LogOut className="w-5 h-5" />
                </button>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-6 py-8">
        {/* Welcome Banner */}
        <motion.div
          className="mb-8 p-6 bg-gradient-to-r from-cyan-500/10 to-blue-500/10 border border-cyan-500/30 rounded-xl"
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl font-bold text-white mb-2">Welcome to REGULON AI Executive</h2>
              <p className="text-sm text-gray-300">
                Your autonomous compliance agent is ready. Use the AI Executive section below to manage your entire CA portfolio.
              </p>
            </div>
            <motion.div
              className="text-4xl"
              animate={{ scale: [1, 1.1, 1] }}
              transition={{ duration: 2, repeat: Infinity }}
            >
              🤖
            </motion.div>
          </div>
        </motion.div>

        {/* AI Executive Agent - Full Featured */}
        <RegulonAIAgent />

        {/* Placeholder Sections (Will be built incrementally) */}
        <motion.div
          className="space-y-8 mt-12"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3 }}
        >
          {/* CA Control Tower - Coming Soon */}
          <Section title="CA Control Tower" icon="🏢">
            <p className="text-gray-400 text-sm">Comprehensive metrics for your CA practice will appear here.</p>
          </Section>

          {/* Client Portfolio - Coming Soon */}
          <Section title="Client Portfolio" icon="👥">
            <p className="text-gray-400 text-sm">Manage and monitor all your assigned clients and their compliance status.</p>
          </Section>

          {/* AI Draft Engine - Coming Soon */}
          <Section title="AI Draft Engine" icon="📝">
            <p className="text-gray-400 text-sm">Automatic document drafting and compliance response generation.</p>
          </Section>

          {/* Task Management - Coming Soon */}
          <Section title="Task & Filing Management" icon="✓">
            <p className="text-gray-400 text-sm">Track all compliance tasks and filing deadlines in one place.</p>
          </Section>
        </motion.div>
      </main>
    </div>
  );
}

// Section Component
function Section({ title, icon, children }: { title: string; icon: string; children: React.ReactNode }) {
  return (
    <motion.div
      className="bg-gradient-to-br from-[#1a1f2e] to-[#0B0E14] border border-cyan-500/20 rounded-xl p-6"
      whileHover={{ borderColor: 'rgba(6, 182, 212, 0.4)' }}
      transition={{ duration: 0.3 }}
    >
      <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
        <span className="text-2xl">{icon}</span>
        {title}
      </h3>
      {children}
    </motion.div>
  );
}

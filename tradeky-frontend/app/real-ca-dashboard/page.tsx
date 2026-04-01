'use client';

import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { authFetch } from '@/lib/authFetch';

export default function RealCADashboard() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) {
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
      <div className="min-h-screen bg-black text-white flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <p className="text-gray-400">Loading Real CA Dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black text-white">
      <header className="border-b border-zinc-800 bg-zinc-900">
        <div className="px-6 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-white">🎯 REAL CA Dashboard</h1>
              <p className="text-sm text-zinc-400">
                Welcome to your Compliance Authority Dashboard with real data
              </p>
            </div>
            <button
              onClick={() => {
                localStorage.removeItem('token');
                router.push('/login');
              }}
              className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded"
            >
              Logout
            </button>
          </div>
        </div>
      </header>

      <div className="p-6">
        <div className="mb-6 p-4 bg-green-900/20 border border-green-600 rounded-lg">
          <p className="text-green-400 font-semibold">✅ Successfully registered as External CA</p>
          <p className="text-green-300 text-sm mt-1">You now have access to real compliance data and client management tools</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-zinc-900 border border-zinc-800 p-6 rounded-lg">
            <h2 className="text-lg font-semibold text-blue-400 mb-2">Clients</h2>
            <p className="text-3xl font-bold text-white mb-2">--</p>
            <p className="text-sm text-gray-400">Your registered clients</p>
          </div>

          <div className="bg-zinc-900 border border-zinc-800 p-6 rounded-lg">
            <h2 className="text-lg font-semibold text-blue-400 mb-2">Compliance Status</h2>
            <p className="text-3xl font-bold text-green-400 mb-2">--</p>
            <p className="text-sm text-gray-400">Overall compliance health</p>
          </div>

          <div className="bg-zinc-900 border border-zinc-800 p-6 rounded-lg">
            <h2 className="text-lg font-semibold text-blue-400 mb-2">Pending Tasks</h2>
            <p className="text-3xl font-bold text-orange-400 mb-2">--</p>
            <p className="text-sm text-gray-400">Actions requiring attention</p>
          </div>
        </div>

        <div className="bg-zinc-900 border border-zinc-800 p-6 rounded-lg">
          <h2 className="text-xl font-semibold text-white mb-4">Dashboard Features</h2>
          <ul className="space-y-2 text-gray-300">
            <li className="flex items-center">
              <span className="text-blue-400 mr-3">•</span>
              Client portfolio management
            </li>
            <li className="flex items-center">
              <span className="text-blue-400 mr-3">•</span>
              Real-time compliance monitoring
            </li>
            <li className="flex items-center">
              <span className="text-blue-400 mr-3">•</span>
              Task assignment and tracking
            </li>
            <li className="flex items-center">
              <span className="text-blue-400 mr-3">•</span>
              Compliance reports and analytics
            </li>
            <li className="flex items-center">
              <span className="text-blue-400 mr-3">•</span>
              Client communication hub
            </li>
          </ul>
        </div>

        <div className="mt-6 text-center">
          <button
            onClick={() => router.push('/dashboards')}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded"
          >
            Go to Dashboard Selector
          </button>
        </div>
      </div>
    </div>
  );
}

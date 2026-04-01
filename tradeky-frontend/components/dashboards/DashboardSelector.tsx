'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { authFetch } from '@/lib/authFetch';

type UserProfile = {
  id: string;
  name: string;
  email: string;
  role: 'ADMIN' | 'CA' | 'COMPANY_USER' | 'SUPER_ADMIN';
  company?: string;
  permissions: string[];
};

export default function DashboardSelector() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);

  useEffect(() => {
    authFetch('http://localhost:3001/api/protected')
      .then((data: any) => {
        if (data?.__unauthorized) {
          localStorage.removeItem('token');
          router.replace('/login');
          return;
        }
        
        // Check if user just completed registration and has external_ca role
        const justRegistered = localStorage.getItem('justRegistered') === 'true';
        const userRole = localStorage.getItem('userRole');
        
        if (justRegistered && userRole === 'external_ca') {
          localStorage.removeItem('justRegistered');
          router.replace('/real-ca-dashboard');
          return;
        }
        
        // Mock user profile - replace with real API call
        const mockProfile: UserProfile = {
          id: data.user?.id || '1',
          name: data.user?.name || 'Demo User',
          email: data.user?.email || 'demo@example.com',
          role: 'ADMIN', // Change this based on your user system
          permissions: ['FULL_ACCESS']
        };
        
        setUserProfile(mockProfile);
        setLoading(false);
      })
      .catch(() => {
        localStorage.removeItem('token');
        router.replace('/login');
      });
  }, [router]);

  const navigateToDashboard = (dashboardType: string) => {
    router.push(`/dashboards/${dashboardType}`);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-black text-white flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <p className="text-gray-400">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black text-white">
      {/* Header */}
      <header className="border-b border-zinc-800 bg-zinc-900">
        <div className="px-6 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-white">Compliance Management System</h1>
              <p className="text-sm text-zinc-400">
                Professional Compliance Dashboards • Welcome, {userProfile?.name}
              </p>
            </div>
            <div className="flex items-center gap-4">
              <span className="bg-blue-600 text-white text-xs px-3 py-1 rounded-full">
                {userProfile?.role.replace('_', ' ')}
              </span>
              <button 
                onClick={() => {
                  localStorage.removeItem('token');
                  router.push('/login');
                }}
                className="bg-red-600 hover:bg-red-700 px-4 py-2 rounded-lg text-sm"
              >
                Logout
              </button>
            </div>
          </div>
        </div>
      </header>

      <div className="p-6">
        {/* Welcome Section */}
        <div className="bg-zinc-900 border border-zinc-800 rounded-lg p-8 mb-8 text-center">
          <h2 className="text-3xl font-bold mb-4">Choose Your Dashboard</h2>
          <p className="text-zinc-400 mb-6 max-w-2xl mx-auto">
            Access professional-grade compliance dashboards tailored to your role. 
            Each dashboard provides comprehensive tools and insights for effective compliance management.
          </p>
        </div>

        {/* Dashboard Options */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 max-w-full mx-auto">
          {/* Company Dashboard */}
          <div className="bg-zinc-900 border border-zinc-800 rounded-lg p-6 hover:border-blue-500 transition-all duration-300 cursor-pointer group"
               onClick={() => navigateToDashboard('company')}>
            <div className="text-center mb-6">
              <div className="w-16 h-16 bg-blue-600 rounded-lg flex items-center justify-center mx-auto mb-4 group-hover:bg-blue-500 transition-colors">
                <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                </svg>
              </div>
              <h3 className="text-xl font-bold mb-2 text-white">Company Dashboard</h3>
            </div>
            
            <div className="space-y-3 mb-6">
              <div className="flex items-center text-sm text-zinc-300">
                <div className="w-2 h-2 bg-green-500 rounded-full mr-3"></div>
                Compliance Health Monitoring
              </div>
              <div className="flex items-center text-sm text-zinc-300">
                <div className="w-2 h-2 bg-green-500 rounded-full mr-3"></div>
                Real-time Regulatory Alerts
              </div>
              <div className="flex items-center text-sm text-zinc-300">
                <div className="w-2 h-2 bg-green-500 rounded-full mr-3"></div>
                Task & Document Management
              </div>
              <div className="flex items-center text-sm text-zinc-300">
                <div className="w-2 h-2 bg-green-500 rounded-full mr-3"></div>
                Risk Assessment Matrix
              </div>
              <div className="flex items-center text-sm text-zinc-300">
                <div className="w-2 h-2 bg-green-500 rounded-full mr-3"></div>
                Compliance Calendar
              </div>
            </div>
            
            <button className="w-full bg-blue-600 hover:bg-blue-700 text-white py-3 rounded-lg font-medium transition-colors group-hover:bg-blue-500">
              Access Company Dashboard
            </button>
          </div>

          {/* CA Dashboard */}
          <div className="bg-zinc-900 border border-zinc-800 rounded-lg p-6 hover:border-purple-500 transition-all duration-300 cursor-pointer group"
               onClick={() => navigateToDashboard('ca')}>
            <div className="text-center mb-6">
              <div className="w-16 h-16 bg-purple-600 rounded-lg flex items-center justify-center mx-auto mb-4 group-hover:bg-purple-500 transition-colors">
                <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                </svg>
              </div>
              <h3 className="text-xl font-bold mb-2 text-white">CA Dashboard</h3>
            </div>
            
            <div className="space-y-3 mb-6">
              <div className="flex items-center text-sm text-zinc-300">
                <div className="w-2 h-2 bg-purple-500 rounded-full mr-3"></div>
                Client Portfolio Management
              </div>
              <div className="flex items-center text-sm text-zinc-300">
                <div className="w-2 h-2 bg-purple-500 rounded-full mr-3"></div>
                Multi-Client Task Tracking
              </div>
              <div className="flex items-center text-sm text-zinc-300">
                <div className="w-2 h-2 bg-purple-500 rounded-full mr-3"></div>
                Document Review Workflow
              </div>
              <div className="flex items-center text-sm text-zinc-300">
                <div className="w-2 h-2 bg-purple-500 rounded-full mr-3"></div>
                Billing & Time Management
              </div>
              <div className="flex items-center text-sm text-zinc-300">
                <div className="w-2 h-2 bg-purple-500 rounded-full mr-3"></div>
                Client Communications Hub
              </div>
            </div>
            
            <button className="w-full bg-purple-600 hover:bg-purple-700 text-white py-3 rounded-lg font-medium transition-colors group-hover:bg-purple-500">
              Access CA Dashboard
            </button>
          </div>

          {/* Real CA Dashboard (for external_ca role) */}
          <div className="bg-zinc-900 border border-green-600 rounded-lg p-6 hover:border-green-500 transition-all duration-300 cursor-pointer group"
               onClick={() => router.push('/real-ca-dashboard')}>
            <div className="text-center mb-6">
              <div className="w-16 h-16 bg-green-600 rounded-lg flex items-center justify-center mx-auto mb-4 group-hover:bg-green-500 transition-colors">
                <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <h3 className="text-xl font-bold mb-2 text-white">🎯 Real CA Dashboard</h3>
              <p className="text-xs text-green-400">New Enhanced Interface</p>
            </div>
            
            <div className="space-y-3 mb-6">
              <div className="flex items-center text-sm text-zinc-300">
                <div className="w-2 h-2 bg-green-500 rounded-full mr-3"></div>
                Real-time Data & Analytics
              </div>
              <div className="flex items-center text-sm text-zinc-300">
                <div className="w-2 h-2 bg-green-500 rounded-full mr-3"></div>
                Advanced Client Insights
              </div>
              <div className="flex items-center text-sm text-zinc-300">
                <div className="w-2 h-2 bg-green-500 rounded-full mr-3"></div>
                Compliance Tracking
              </div>
              <div className="flex items-center text-sm text-zinc-300">
                <div className="w-2 h-2 bg-green-500 rounded-full mr-3"></div>
                Performance Metrics
              </div>
              <div className="flex items-center text-sm text-zinc-300">
                <div className="w-2 h-2 bg-green-500 rounded-full mr-3"></div>
                Enhanced Reporting
              </div>
            </div>
            
            <button className="w-full bg-green-600 hover:bg-green-700 text-white py-3 rounded-lg font-medium transition-colors group-hover:bg-green-500">
              Access Real CA Dashboard
            </button>
          </div>

          {/* Admin Dashboard */}
          <div className="bg-zinc-900 border border-zinc-800 rounded-lg p-6 hover:border-red-500 transition-all duration-300 cursor-pointer group"
               onClick={() => navigateToDashboard('admin')}>
            <div className="text-center mb-6">
              <div className="w-16 h-16 bg-red-600 rounded-lg flex items-center justify-center mx-auto mb-4 group-hover:bg-red-500 transition-colors">
                <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                </svg>
              </div>
              <h3 className="text-xl font-bold mb-2 text-white">Admin Dashboard</h3>
            </div>
            
            <div className="space-y-3 mb-6">
              <div className="flex items-center text-sm text-zinc-300">
                <div className="w-2 h-2 bg-red-500 rounded-full mr-3"></div>
                System-wide Analytics
              </div>
              <div className="flex items-center text-sm text-zinc-300">
                <div className="w-2 h-2 bg-red-500 rounded-full mr-3"></div>
                User & Role Management
              </div>
              <div className="flex items-center text-sm text-zinc-300">
                <div className="w-2 h-2 bg-red-500 rounded-full mr-3"></div>
                Security & Audit Logs
              </div>
              <div className="flex items-center text-sm text-zinc-300">
                <div className="w-2 h-2 bg-red-500 rounded-full mr-3"></div>
                Revenue Analytics
              </div>
              <div className="flex items-center text-sm text-zinc-300">
                <div className="w-2 h-2 bg-red-500 rounded-full mr-3"></div>
                System Health Monitoring
              </div>
            </div>
            
            <button className="w-full bg-red-600 hover:bg-red-700 text-white py-3 rounded-lg font-medium transition-colors group-hover:bg-red-500">
              Access Admin Dashboard
            </button>
          </div>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mt-12 max-w-full mx-auto">
          <div className="bg-zinc-900 border border-zinc-800 rounded-lg p-4 text-center">
            <p className="text-2xl font-bold text-blue-400">156</p>
            <p className="text-sm text-zinc-400">Active Companies</p>
          </div>
          <div className="bg-zinc-900 border border-zinc-800 rounded-lg p-4 text-center">
            <p className="text-2xl font-bold text-purple-400">23</p>
            <p className="text-sm text-zinc-400">Professional CAs</p>
          </div>
          <div className="bg-zinc-900 border border-zinc-800 rounded-lg p-4 text-center">
            <p className="text-2xl font-bold text-green-400">98.7%</p>
            <p className="text-sm text-zinc-400">Compliance Rate</p>
          </div>
          <div className="bg-zinc-900 border border-zinc-800 rounded-lg p-4 text-center">
            <p className="text-2xl font-bold text-yellow-400">1,247</p>
            <p className="text-sm text-zinc-400">Total Users</p>
          </div>
        </div>

        {/* Footer Info */}
        <div className="text-center mt-12 text-zinc-500">
          <p className="text-sm">
            Professional compliance management system with real-time monitoring, 
            automated workflows, and comprehensive reporting capabilities.
          </p>
        </div>
      </div>
    </div>
  );
}
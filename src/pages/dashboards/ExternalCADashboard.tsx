// External CA Dashboard
import { usePersonaAuth } from '@/lib/persona-auth-context';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';

export function ExternalCADashboard() {
  const { currentUser, logout } = usePersonaAuth();
  const navigate = useNavigate();

  if (!currentUser) {
    navigate('/');
    return null;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-black p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-4xl font-bold text-white">External CA Dashboard</h1>
            <p className="text-gray-400 mt-2">Manage multiple client audits and compliance</p>
          </div>
          <Button variant="outline" onClick={logout} className="text-white border-gray-500">
            Switch Role
          </Button>
        </div>

        {/* User Info */}
        <Card className="bg-slate-800 border-gray-600 mb-8">
          <CardHeader>
            <CardTitle className="text-white">Current Session</CardTitle>
          </CardHeader>
          <CardContent className="text-gray-300 space-y-2">
            <p>Email: {currentUser.email}</p>
            <p>Company: {currentUser.companyName}</p>
            <p>Session ID: {currentUser.id}</p>
          </CardContent>
        </Card>

        {/* Feature Sections (Coming Soon) */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[
            { title: '📋 Client Companies', desc: 'Manage multiple clients' },
            { title: '📅 Audit Schedule', desc: 'Schedule and track audits' },
            { title: '✓ Compliance Checklist', desc: 'Create compliance requirements' },
            { title: '📁 Document Upload', desc: 'Upload audit documents' },
            { title: '📊 Audit Reports', desc: 'Generate audit reports' },
            { title: '💰 Fee Management', desc: 'Track and manage fees' },
          ].map((feature, idx) => (
            <motion.div
              key={idx}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: idx * 0.1 }}
            >
              <Card className="bg-slate-800 border-gray-600 hover:border-blue-500 cursor-pointer transition">
                <CardHeader>
                  <CardTitle className="text-white text-lg">{feature.title}</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-gray-400">{feature.desc}</p>
                  <Button variant="link" className="mt-4 text-blue-400 p-0">
                    Coming Soon →
                  </Button>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>

        {/* Status */}
        <Card className="bg-slate-800 border-gray-600 mt-8">
          <CardHeader>
            <CardTitle className="text-white">✨ Phase 1-2: Foundation Complete</CardTitle>
          </CardHeader>
          <CardContent className="text-gray-400">
            <p>This dashboard is part of Phase 1-2 implementation.</p>
            <p className="mt-2">Full features will be built in Phase 3 (External CA Dashboard).</p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

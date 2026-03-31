// Company Owner Dashboard
import { usePersonaAuth } from '@/lib/persona-auth-context';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';

export function OwnerDashboard() {
  const { currentUser, logout } = usePersonaAuth();
  const navigate = useNavigate();

  if (!currentUser) {
    navigate('/');
    return null;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-black p-6">
      <div className="max-w-7xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-4xl font-bold text-white">Company Owner Dashboard</h1>
            <p className="text-gray-400 mt-2">Executive Compliance Overview</p>
          </div>
          <Button variant="outline" onClick={logout} className="text-white border-gray-500">
            Switch Role
          </Button>
        </div>

        <Card className="bg-slate-800 border-gray-600 mb-8">
          <CardHeader>
            <CardTitle className="text-white">Current Session</CardTitle>
          </CardHeader>
          <CardContent className="text-gray-300 space-y-2">
            <p>Email: {currentUser.email}</p>
            <p>Company: {currentUser.companyName}</p>
          </CardContent>
        </Card>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[
            { title: '📊 KPI Dashboard', desc: 'Executive metrics' },
            { title: '✓ Compliance Score', desc: 'Overall compliance rating' },
            { title: '🗺️ Risk Map', desc: 'Visual risk assessment' },
            { title: '📅 Deadlines', desc: 'Critical upcoming dates' },
            { title: '🔔 Alerts', desc: 'Real-time notifications' },
            { title: '📈 Trends', desc: 'Compliance trends' },
          ].map((feature, idx) => (
            <motion.div key={idx} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: idx * 0.1 }}>
              <Card className="bg-slate-800 border-gray-600 hover:border-yellow-500 cursor-pointer transition">
                <CardHeader>
                  <CardTitle className="text-white text-lg">{feature.title}</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-gray-400">{feature.desc}</p>
                  <Button variant="link" className="mt-4 text-yellow-400 p-0">
                    Coming Soon →
                  </Button>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>
      </div>
    </div>
  );
}

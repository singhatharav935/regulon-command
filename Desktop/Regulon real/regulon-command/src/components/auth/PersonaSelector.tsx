// Persona Selector Component
import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { PERSONA_CONFIG, PersonaType } from '@/types/personas';
import { usePersonaAuth } from '@/lib/persona-auth-context';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';

export function PersonaSelector() {
  const [selectedPersona, setSelectedPersona] = useState<PersonaType | null>(null);
  const [email, setEmail] = useState('');
  const [companyName, setCompanyName] = useState('');
  const { loginAsPersona } = usePersonaAuth();
  const navigate = useNavigate();

  const handleSelectPersona = (persona: PersonaType) => {
    setSelectedPersona(persona);
  };

  const handleLogin = (persona: PersonaType) => {
    loginAsPersona(persona, email || undefined, companyName || undefined);
    navigate(PERSONA_CONFIG[persona].dashboardRoute);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-black p-4">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl md:text-5xl font-bold text-white mb-4">
            SANNIDH Dashboard
          </h1>
          <p className="text-xl text-gray-400">
            Choose your role to access your personalized dashboard
          </p>
        </div>

        {/* Main Content */}
        <div className="grid md:grid-cols-2 gap-8 items-start">
          {/* Persona Grid */}
          <div className="grid grid-cols-1 gap-4">
            <h2 className="text-2xl font-bold text-white mb-4">Select Your Role</h2>
            <div className="grid gap-3">
              {Object.values(PERSONA_CONFIG).map((persona) => (
                <motion.button
                  key={persona.id}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => handleSelectPersona(persona.id)}
                  className={`p-4 rounded-lg border-2 transition-all text-left ${
                    selectedPersona === persona.id
                      ? `${persona.color} border-current text-white`
                      : 'border-gray-600 hover:border-gray-400 bg-slate-800 text-gray-300'
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <span className="text-3xl">{persona.icon}</span>
                    <div className="flex-1">
                      <h3 className="font-bold text-sm">{persona.label}</h3>
                      <p className="text-xs opacity-75">{persona.description}</p>
                    </div>
                  </div>
                </motion.button>
              ))}
            </div>
          </div>

          {/* Login Form */}
          {selectedPersona && (
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.3 }}
            >
              <Card className="bg-slate-800 border-gray-600 sticky top-4">
                <CardHeader>
                  <CardTitle className="text-white">
                    {PERSONA_CONFIG[selectedPersona].label}
                  </CardTitle>
                  <CardDescription className="text-gray-400">
                    All fields optional - use defaults to test quickly
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  {/* Email Field (Optional) */}
                  <div>
                    <label className="text-sm text-gray-300 block mb-2">
                      Email (Optional)
                    </label>
                    <Input
                      type="email"
                      placeholder="user@company.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="bg-slate-700 border-gray-600 text-white placeholder:text-gray-500"
                    />
                    <p className="text-xs text-gray-500 mt-1">
                      Leave blank to auto-generate
                    </p>
                  </div>

                  {/* Company Name Field (Optional) */}
                  <div>
                    <label className="text-sm text-gray-300 block mb-2">
                      Company Name (Optional)
                    </label>
                    <Input
                      type="text"
                      placeholder="Test Company"
                      value={companyName}
                      onChange={(e) => setCompanyName(e.target.value)}
                      className="bg-slate-700 border-gray-600 text-white placeholder:text-gray-500"
                    />
                    <p className="text-xs text-gray-500 mt-1">
                      Leave blank to auto-generate
                    </p>
                  </div>

                  {/* Quick Test Button */}
                  <Button
                    onClick={() => handleLogin(selectedPersona)}
                    className={`w-full ${PERSONA_CONFIG[selectedPersona].color} text-white font-bold`}
                  >
                    Test as {PERSONA_CONFIG[selectedPersona].label}
                  </Button>

                  {/* Skip Login */}
                  <Button
                    variant="outline"
                    onClick={() => handleLogin(selectedPersona)}
                    className="w-full text-gray-300 border-gray-500 hover:border-gray-400"
                  >
                    Quick Access (Default Values)
                  </Button>
                </CardContent>
              </Card>
            </motion.div>
          )}
        </div>

        {/* Feature List */}
        <div className="mt-16 grid md:grid-cols-3 gap-6 max-w-4xl mx-auto">
          <Card className="bg-slate-800 border-gray-600">
            <CardHeader>
              <CardTitle className="text-white text-lg">✨ Live Dashboards</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-400 text-sm">
                Auto-refresh every 60 seconds with real-time data updates
              </p>
            </CardContent>
          </Card>

          <Card className="bg-slate-800 border-gray-600">
            <CardHeader>
              <CardTitle className="text-white text-lg">🔐 Data Isolated</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-400 text-sm">
                Each persona sees only their authorized data
              </p>
            </CardContent>
          </Card>

          <Card className="bg-slate-800 border-gray-600">
            <CardHeader>
              <CardTitle className="text-white text-lg">⚡ Ready to Use</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-400 text-sm">
                No credentials needed - test instantly
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

import { motion } from "framer-motion";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Shield,
  Lock,
  Eye,
  CheckCircle,
  AlertCircle,
  Key,
  Database,
  Globe,
  Zap,
  Users,
  BarChart3,
  FileText,
} from "lucide-react";

/**
 * Advanced Security Page
 * Enterprise-grade security features and certifications
 */

const securityFeatures = [
  {
    icon: <Lock className="w-8 h-8" />,
    title: "Encryption",
    description: "AES-256 encryption at rest and TLS 1.3 in transit",
    details: [
      "End-to-end encryption",
      "Encrypted database fields",
      "Secure key management",
      "Regular key rotation",
    ],
  },
  {
    icon: <Key className="w-8 h-8" />,
    title: "Authentication",
    description: "Multi-factor authentication with JWT tokens",
    details: [
      "JWT token-based auth",
      "OAuth 2.0 integration",
      "SAML SSO support",
      "2FA/MFA enabled",
    ],
  },
  {
    icon: <Users className="w-8 h-8" />,
    title: "Access Control",
    description: "Role-based access control with granular permissions",
    details: [
      "RBAC system",
      "Resource-level permissions",
      "Workspace isolation",
      "Admin controls",
    ],
  },
  {
    icon: <Eye className="w-8 h-8" />,
    title: "Monitoring",
    description: "Real-time security monitoring and threat detection",
    details: [
      "24/7 threat monitoring",
      "Intrusion detection",
      "Anomaly detection",
      "Security alerts",
    ],
  },
  {
    icon: <Database className="w-8 h-8" />,
    title: "Data Protection",
    description: "Comprehensive data protection and privacy measures",
    details: [
      "GDPR compliant",
      "Data residency options",
      "Regular backups",
      "Disaster recovery",
    ],
  },
  {
    icon: <FileText className="w-8 h-8" />,
    title: "Audit & Logging",
    description: "Complete audit trails and compliance logging",
    details: [
      "Activity logging",
      "Change tracking",
      "Compliance reports",
      "Forensic analysis",
    ],
  },
];

const certifications = [
  { name: "ISO 27001", description: "Information Security Management", status: "certified" },
  { name: "SOC 2 Type II", description: "Security and Confidentiality", status: "certified" },
  { name: "GDPR", description: "General Data Protection Regulation", status: "compliant" },
  { name: "HIPAA", description: "Health Insurance Portability", status: "certified" },
  { name: "PCI DSS", description: "Payment Card Industry Security", status: "certified" },
  { name: "CCPA", description: "California Consumer Privacy Act", status: "compliant" },
];

const securityPractices = [
  {
    category: "Code Security",
    practices: [
      "SAST/DAST scanning",
      "Dependency analysis",
      "Code reviews",
      "Penetration testing",
    ],
  },
  {
    category: "Infrastructure",
    practices: [
      "Multi-region deployment",
      "DDoS protection",
      "Firewall & WAF",
      "Load balancing",
    ],
  },
  {
    category: "Operations",
    practices: [
      "24/7 monitoring",
      "Incident response",
      "Disaster recovery",
      "Business continuity",
    ],
  },
  {
    category: "Personnel",
    practices: [
      "Background checks",
      "Security training",
      "NDA compliance",
      "Access limitations",
    ],
  },
];

export default function AdvancedSecurityPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
      {/* Hero Section */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-gradient-to-r from-red-900 to-slate-900 border-b border-slate-700 px-6 py-20"
      >
        <div className="max-w-6xl mx-auto">
          <div className="flex items-center gap-4 mb-6">
            <Shield className="w-12 h-12 text-red-400" />
            <h1 className="text-6xl font-bold text-white">Enterprise Security</h1>
          </div>
          <p className="text-xl text-slate-300 max-w-3xl mb-8">
            Military-grade security protecting your sensitive regulatory data. REGULON meets the strictest security
            standards and certifications.
          </p>
          <div className="flex gap-2 flex-wrap">
            {["ISO 27001", "SOC 2 Type II", "GDPR", "HIPAA"].map((cert) => (
              <Badge key={cert} className="bg-red-600 text-white">
                {cert}
              </Badge>
            ))}
          </div>
        </div>
      </motion.div>

      <div className="max-w-6xl mx-auto px-6 py-16">
        {/* Security Features Grid */}
        <h2 className="text-4xl font-bold text-white mb-12">Security Features</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-16">
          {securityFeatures.map((feature, idx) => (
            <motion.div
              key={idx}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: idx * 0.1 }}
            >
              <Card className="bg-slate-800 border-slate-700 h-full hover:border-red-500 transition">
                <CardHeader>
                  <div className="text-red-400 mb-4">{feature.icon}</div>
                  <CardTitle className="text-white">{feature.title}</CardTitle>
                  <CardDescription className="text-slate-400">{feature.description}</CardDescription>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-2">
                    {feature.details.map((detail, didx) => (
                      <li key={didx} className="flex items-center gap-2 text-slate-300 text-sm">
                        <CheckCircle className="w-4 h-4 text-green-400 flex-shrink-0" />
                        {detail}
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>

        {/* Certifications & Compliance */}
        <h2 className="text-4xl font-bold text-white mb-12">Certifications & Compliance</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-16">
          {certifications.map((cert, idx) => (
            <motion.div
              key={idx}
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: idx * 0.05 }}
            >
              <Card className="bg-slate-800 border-slate-700">
                <CardContent className="pt-6 flex items-start justify-between">
                  <div>
                    <p className="font-bold text-white text-lg">{cert.name}</p>
                    <p className="text-slate-400 text-sm mt-1">{cert.description}</p>
                  </div>
                  <Badge className={cert.status === "certified" ? "bg-green-600" : "bg-blue-600"}>
                    {cert.status === "certified" ? "✓ Certified" : "✓ Compliant"}
                  </Badge>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>

        {/* Security Practices */}
        <h2 className="text-4xl font-bold text-white mb-12">Security Practices</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-16">
          {securityPractices.map((practice, idx) => (
            <motion.div
              key={idx}
              initial={{ opacity: 0, x: idx % 2 === 0 ? -20 : 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: idx * 0.1 }}
            >
              <Card className="bg-gradient-to-br from-slate-800 to-slate-700 border-slate-700">
                <CardHeader>
                  <CardTitle className="text-white text-lg">{practice.category}</CardTitle>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-3">
                    {practice.practices.map((p, pidx) => (
                      <li key={pidx} className="flex items-center gap-3">
                        <div className="w-2 h-2 bg-red-400 rounded-full"></div>
                        <span className="text-slate-300 text-sm">{p}</span>
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>

        {/* Security Stats */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
          <h2 className="text-4xl font-bold text-white mb-12">Our Security Track Record</h2>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-16">
            {[
              { label: "Years in Business", value: "5+", icon: "📅" },
              { label: "Security Incidents", value: "0", icon: "🔒" },
              { label: "Uptime SLA", value: "99.99%", icon: "✅" },
              { label: "Data Breaches", value: "0", icon: "🛡️" },
            ].map((stat, idx) => (
              <motion.div
                key={idx}
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: idx * 0.1 }}
              >
                <Card className="bg-gradient-to-br from-red-900 to-slate-900 border-red-700">
                  <CardContent className="pt-6 text-center">
                    <p className="text-3xl mb-2">{stat.icon}</p>
                    <p className="text-2xl font-bold text-white">{stat.value}</p>
                    <p className="text-sm text-slate-300 mt-2">{stat.label}</p>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        </motion.div>

        {/* Data Protection */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="mb-16">
          <Card className="bg-slate-800 border-slate-700">
            <CardHeader>
              <CardTitle className="text-white flex items-center gap-2">
                <Database className="w-6 h-6 text-blue-400" />
                Data Protection Measures
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <h4 className="font-bold text-white mb-3">At-Rest Protection</h4>
                  <ul className="space-y-2 text-slate-300 text-sm">
                    <li>✓ AES-256 encryption</li>
                    <li>✓ Hardware security modules</li>
                    <li>✓ Secure key management</li>
                    <li>✓ Regular key rotation</li>
                    <li>✓ Encrypted backups</li>
                  </ul>
                </div>
                <div>
                  <h4 className="font-bold text-white mb-3">In-Transit Protection</h4>
                  <ul className="space-y-2 text-slate-300 text-sm">
                    <li>✓ TLS 1.3 encryption</li>
                    <li>✓ Certificate pinning</li>
                    <li>✓ HSTS enabled</li>
                    <li>✓ Secure protocols only</li>
                    <li>✓ VPN/Private networks</li>
                  </ul>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* CTA Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="bg-gradient-to-r from-red-900 to-slate-900 rounded-lg p-12 text-center border border-red-700"
        >
          <h2 className="text-4xl font-bold text-white mb-4">Your Data is Safe With REGULON</h2>
          <p className="text-lg text-slate-300 mb-8">
            Enterprise-grade security with global compliance standards
          </p>
          <div className="flex gap-4 justify-center flex-wrap">
            <Button size="lg" className="bg-red-600 hover:bg-red-700">
              Download Security Report
            </Button>
            <Button size="lg" variant="outline" className="border-red-600 text-white hover:bg-red-950">
              Contact Security Team
            </Button>
          </div>
        </motion.div>
      </div>
    </div>
  );
}

import { Link } from "react-router-dom";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import BackgroundEffects from "@/components/BackgroundEffects";
import { FileText, Shield, Scale, AlertCircle, CheckCircle2 } from "lucide-react";

const ComplianceCenterStandalone = () => {
  const legalDocuments = [
    {
      icon: FileText,
      title: "Terms of Service",
      description: "Comprehensive terms governing use of SANNIDH platform, user responsibilities, and service limitations.",
      path: "/terms",
      status: "ready",
      lastUpdated: "March 31, 2026",
      version: "1.0 (Placeholder)"
    },
    {
      icon: Shield,
      title: "Privacy Policy",
      description: "GDPR and DPDP Act 2023 compliant privacy policy covering data collection, processing, and user rights.",
      path: "/privacy",
      status: "ready",
      lastUpdated: "March 31, 2026",
      version: "1.0 (Placeholder)"
    },
    {
      icon: AlertCircle,
      title: "Disclaimers",
      description: "Legal, financial, and AI-generated content disclaimers for compliance automation platform.",
      path: "/disclaimers",
      status: "ready",
      lastUpdated: "March 31, 2026",
      version: "1.0 (Placeholder)"
    },
    {
      icon: Scale,
      title: "Refund & Cancellation Policy",
      description: "Terms for subscription refunds, cancellations, and payment dispute resolution.",
      path: "/refund-policy",
      status: "ready",
      lastUpdated: "March 31, 2026",
      version: "1.0 (Placeholder)"
    }
  ];

  return (
    <div className="min-h-screen bg-background relative">
      <BackgroundEffects />
      <Navbar />
      
      <main className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="glass-card p-6 md:p-10">
          {/* Header */}
          <div className="mb-8">
            <h1 className="text-4xl font-bold tracking-tight text-foreground mb-4">
              Compliance Center
            </h1>
            <p className="text-muted-foreground text-lg">
              Centralized access to all legal documents, policies, and compliance information for SANNIDH platform.
            </p>
          </div>

          {/* Status Banner */}
          <div className="bg-blue-500/10 border border-blue-500/20 rounded-lg p-4 mb-8 flex gap-3">
            <AlertCircle className="w-5 h-5 text-blue-400 flex-shrink-0 mt-0.5" />
            <div className="text-sm text-blue-300">
              <strong>Pre-Launch Status:</strong> All documents below are placeholder templates and must be reviewed and approved by qualified legal counsel before commercial launch. These are NOT final legal documents.
            </div>
          </div>

          {/* Document Grid */}
          <div className="grid md:grid-cols-2 gap-6 mb-8">
            {legalDocuments.map((doc) => {
              const IconComponent = doc.icon;
              return (
                <Link
                  key={doc.path}
                  to={doc.path}
                  className="group relative overflow-hidden rounded-lg border border-border/60 bg-background/30 p-6 hover:border-primary/50 hover:bg-background/50 transition-all duration-200"
                >
                  <div className="flex items-start gap-4">
                    <div className="p-3 rounded-lg bg-primary/10 group-hover:bg-primary/20 transition-colors">
                      <IconComponent className="w-6 h-6 text-primary" />
                    </div>
                    
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2 mb-2">
                        <h3 className="text-lg font-semibold text-foreground group-hover:text-primary transition-colors">
                          {doc.title}
                        </h3>
                        {doc.status === "ready" && (
                          <CheckCircle2 className="w-5 h-5 text-green-400 flex-shrink-0" />
                        )}
                      </div>
                      
                      <p className="text-sm text-muted-foreground mb-3 line-clamp-2">
                        {doc.description}
                      </p>
                      
                      <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted-foreground">
                        <span>Version: {doc.version}</span>
                        <span>Updated: {doc.lastUpdated}</span>
                      </div>
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>

          {/* Compliance Status */}
          <div className="border-t border-border/50 pt-8">
            <h2 className="text-2xl font-semibold text-foreground mb-4">Compliance Framework Status</h2>
            
            <div className="grid md:grid-cols-3 gap-4 mb-6">
              <div className="rounded-lg border border-green-500/20 bg-green-500/10 p-4">
                <div className="flex items-center gap-2 mb-2">
                  <CheckCircle2 className="w-5 h-5 text-green-400" />
                  <h3 className="font-semibold text-foreground">GDPR Ready</h3>
                </div>
                <p className="text-sm text-muted-foreground">
                  Privacy policy covers all GDPR requirements (Articles 13-15, 17, 20)
                </p>
              </div>

              <div className="rounded-lg border border-green-500/20 bg-green-500/10 p-4">
                <div className="flex items-center gap-2 mb-2">
                  <CheckCircle2 className="w-5 h-5 text-green-400" />
                  <h3 className="font-semibold text-foreground">DPDP Act 2023</h3>
                </div>
                <p className="text-sm text-muted-foreground">
                  India-specific compliance sections included in privacy policy
                </p>
              </div>

              <div className="rounded-lg border border-yellow-500/20 bg-yellow-500/10 p-4">
                <div className="flex items-center gap-2 mb-2">
                  <AlertCircle className="w-5 h-5 text-yellow-400" />
                  <h3 className="font-semibold text-foreground">Legal Review Pending</h3>
                </div>
                <p className="text-sm text-muted-foreground">
                  All documents require professional legal review before launch
                </p>
              </div>
            </div>

            {/* Next Steps */}
            <div className="bg-muted/30 rounded-lg p-6">
              <h3 className="font-semibold text-foreground mb-3">📋 Next Steps Before Launch</h3>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li className="flex gap-2">
                  <span className="text-yellow-400">⚠️</span>
                  <span>Engage legal counsel for comprehensive document review ($8K-17K, 2-4 weeks)</span>
                </li>
                <li className="flex gap-2">
                  <span className="text-yellow-400">⚠️</span>
                  <span>Add Data Processing Addendum (DPA) for B2B customers</span>
                </li>
                <li className="flex gap-2">
                  <span className="text-yellow-400">⚠️</span>
                  <span>Create Cookie Policy (separate from Privacy Policy)</span>
                </li>
                <li className="flex gap-2">
                  <span className="text-yellow-400">⚠️</span>
                  <span>Implement version control system for legal documents</span>
                </li>
                <li className="flex gap-2">
                  <span className="text-yellow-400">⚠️</span>
                  <span>Set up user acceptance tracking for ToS updates</span>
                </li>
              </ul>
            </div>
          </div>

          {/* Contact Section */}
          <div className="border-t border-border/50 pt-8 mt-8">
            <h2 className="text-xl font-semibold text-foreground mb-4">Questions About Our Policies?</h2>
            <p className="text-muted-foreground mb-4">
              If you have questions about any of our legal documents or compliance practices, please contact us:
            </p>
            <div className="bg-muted/30 rounded-lg p-4">
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li>📧 <strong>Legal Inquiries:</strong> legal@sannidh.ai</li>
                <li>🔒 <strong>Privacy Questions:</strong> privacy@sannidh.ai</li>
                <li>💳 <strong>Billing & Refunds:</strong> billing@sannidh.ai</li>
                <li>💬 <strong>General Support:</strong> support@sannidh.ai</li>
              </ul>
            </div>
          </div>
        </div>
      </main>
      
      <Footer />
    </div>
  );
};

export default ComplianceCenterStandalone;

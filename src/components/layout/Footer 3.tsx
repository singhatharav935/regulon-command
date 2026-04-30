import { Link } from "react-router-dom";
import { Shield, AlertTriangle } from "lucide-react";

const Footer = () => {
  return (
    <footer className="border-t border-border/50 bg-background/50 backdrop-blur-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-8 lg:gap-12">
          {/* Brand */}
          <div className="col-span-2 lg:col-span-1">
            <Link to="/" className="inline-flex items-center gap-2 mb-4">
              <span className="text-xl font-bold text-gradient-primary">SANNIDH</span>
            </Link>
            <p className="text-sm text-muted-foreground leading-relaxed">
              Enterprise-grade compliance infrastructure powered by AI and verified professionals.
            </p>
          </div>

          {/* Platform */}
          <div>
            <h4 className="text-sm font-semibold text-foreground mb-4">Platform</h4>
            <ul className="space-y-3">
              <li><Link to="/platform/infrastructure" className="text-sm text-muted-foreground hover:text-foreground transition-colors">Sovereign Infrastructure Overview</Link></li>
              <li><Link to="/platform/ai-human-review" className="text-sm text-muted-foreground hover:text-foreground transition-colors">Agentic Execution Model</Link></li>
              <li><Link to="/platform" className="text-sm text-muted-foreground hover:text-foreground transition-colors">Compliance Command Center</Link></li>
              <li><Link to="/platform/ai-assistant" className="text-sm text-muted-foreground hover:text-foreground transition-colors">Nexus-9 Drafting Engine</Link></li>
              <li><Link to="/platform/audit" className="text-sm text-muted-foreground hover:text-foreground transition-colors">Audit & Traceability Vault</Link></li>
            </ul>
          </div>

          {/* Solutions */}
          <div>
            <h4 className="text-sm font-semibold text-foreground mb-4">Solutions</h4>
            <ul className="space-y-3">
              <li><Link to="/solutions/gst" className="text-sm text-muted-foreground hover:text-foreground transition-colors">Statutory GST Compliance</Link></li>
              <li><Link to="/solutions/income-tax" className="text-sm text-muted-foreground hover:text-foreground transition-colors">Direct Tax Scrutiny Management</Link></li>
              <li><Link to="/solutions/roc" className="text-sm text-muted-foreground hover:text-foreground transition-colors">Corporate & MCA Governance</Link></li>
              <li><Link to="/solutions/rbi" className="text-sm text-muted-foreground hover:text-foreground transition-colors">RBI & FEMA Regulatory</Link></li>
              <li><Link to="/solutions/sebi" className="text-sm text-muted-foreground hover:text-foreground transition-colors">SEBI & Market Oversight</Link></li>
              <li><Link to="/solutions/labour-law" className="text-sm text-muted-foreground hover:text-foreground transition-colors">Labour Law & EPFO Audits</Link></li>
              <li><Link to="/solutions/contracts" className="text-sm text-muted-foreground hover:text-foreground transition-colors">Lattice Contract Reviews</Link></li>
            </ul>
          </div>

          {/* Company */}
          <div>
            <h4 className="text-sm font-semibold text-foreground mb-4">Company</h4>
            <ul className="space-y-3">
              <li><Link to="/about" className="text-sm text-muted-foreground hover:text-foreground transition-colors">About</Link></li>
              <li><Link to="/customers" className="text-sm text-muted-foreground hover:text-foreground transition-colors">Customers</Link></li>
              <li><Link to="/security" className="text-sm text-muted-foreground hover:text-foreground transition-colors">Security</Link></li>
              <li><Link to="/resources" className="text-sm text-muted-foreground hover:text-foreground transition-colors">Resources</Link></li>
            </ul>
          </div>

          {/* Legal */}
          <div>
            <h4 className="text-sm font-semibold text-foreground mb-4">Legal</h4>
            <ul className="space-y-3">
              <li><Link to="/privacy" className="text-sm text-muted-foreground hover:text-foreground transition-colors">Statutory Privacy Policy</Link></li>
              <li><Link to="/terms" className="text-sm text-muted-foreground hover:text-foreground transition-colors">Sovereign Service Terms</Link></li>
              <li><Link to="/dpa" className="text-sm text-muted-foreground hover:text-foreground transition-colors">DPA (Data Processing Agreement) Terms</Link></li>
              <li><Link to="/compliance" className="text-sm text-muted-foreground hover:text-foreground transition-colors">Standard Regulatory Disclaimer</Link></li>
              <li><Link to="/compliance" className="text-sm text-muted-foreground hover:text-foreground transition-colors">Ethics & Professional Standards</Link></li>
            </ul>
          </div>
        </div>

        {/* Trust Disclaimer */}
        <div className="mt-12 pt-8 border-t border-border/50">
          <div className="glass-card p-4 flex items-start gap-3">
            <AlertTriangle className="w-5 h-5 text-warning shrink-0 mt-0.5" />
            <div className="space-y-2">
              <p className="text-sm text-muted-foreground">
                <strong className="text-foreground">Official Regulatory Disclaimer:</strong> SANNIDH acts as a Sovereign Compliance Infrastructure provider. All AI-generated analysis (Nexus-9™) must be validated and signed by a licensed professional (CA/CS/Lawyer) before statutory filing. SANNIDH is an independent entity and is not an official arm of the GST Council, CBDT, or MCA. Data is processed in alignment with the Digital Personal Data Protection (DPDP) Act, 2026.
              </p>
            </div>
          </div>
        </div>

        {/* Bottom */}
        <div className="mt-8 pt-8 border-t border-border/30 flex flex-col md:flex-row items-center justify-between gap-4">
          <p className="text-sm text-muted-foreground">
            © {new Date().getFullYear()} SANNIDH. All rights reserved.
          </p>
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Shield className="w-4 h-4 text-primary" />
            <span>SOC 2 Type II Compliant</span>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;

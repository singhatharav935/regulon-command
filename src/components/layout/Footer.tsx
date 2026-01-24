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
              <span className="text-xl font-bold">
                <span className="text-foreground">XYZ</span>
                <span className="text-primary ml-1">AI</span>
              </span>
            </Link>
            <p className="text-sm text-muted-foreground leading-relaxed">
              Enterprise-grade compliance infrastructure powered by AI and verified professionals.
            </p>
          </div>

          {/* Platform */}
          <div>
            <h4 className="text-sm font-semibold text-foreground mb-4">Platform</h4>
            <ul className="space-y-3">
              <li><Link to="/platform" className="text-sm text-muted-foreground hover:text-foreground transition-colors">Overview</Link></li>
              <li><Link to="/platform/how-it-works" className="text-sm text-muted-foreground hover:text-foreground transition-colors">How It Works</Link></li>
              <li><Link to="/platform/ai-assistant" className="text-sm text-muted-foreground hover:text-foreground transition-colors">AI Assistant</Link></li>
              <li><Link to="/platform/audit" className="text-sm text-muted-foreground hover:text-foreground transition-colors">Audit Trail</Link></li>
            </ul>
          </div>

          {/* Solutions */}
          <div>
            <h4 className="text-sm font-semibold text-foreground mb-4">Solutions</h4>
            <ul className="space-y-3">
              <li><Link to="/solutions/roc" className="text-sm text-muted-foreground hover:text-foreground transition-colors">Corporate & ROC</Link></li>
              <li><Link to="/solutions/gst" className="text-sm text-muted-foreground hover:text-foreground transition-colors">GST Compliance</Link></li>
              <li><Link to="/solutions/rbi" className="text-sm text-muted-foreground hover:text-foreground transition-colors">RBI Regulatory</Link></li>
              <li><Link to="/solutions/sebi" className="text-sm text-muted-foreground hover:text-foreground transition-colors">SEBI Regulatory</Link></li>
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
              <li><Link to="/privacy" className="text-sm text-muted-foreground hover:text-foreground transition-colors">Privacy Policy</Link></li>
              <li><Link to="/terms" className="text-sm text-muted-foreground hover:text-foreground transition-colors">Terms of Service</Link></li>
              <li><Link to="/compliance" className="text-sm text-muted-foreground hover:text-foreground transition-colors">Compliance</Link></li>
            </ul>
          </div>
        </div>

        {/* Trust Disclaimer */}
        <div className="mt-12 pt-8 border-t border-border/50">
          <div className="glass-card p-4 flex items-start gap-3">
            <AlertTriangle className="w-5 h-5 text-warning shrink-0 mt-0.5" />
            <div className="space-y-2">
              <p className="text-sm text-muted-foreground">
                <strong className="text-foreground">Important Disclaimer:</strong> XYZ AI provides compliance assistance and regulatory guidance through AI-powered analysis verified by licensed professionals. This platform does not provide legal or financial advice. All regulatory filings and compliance actions are executed through verified Chartered Accountants and Lawyers.
              </p>
              <p className="text-sm text-muted-foreground">
                XYZ AI is not endorsed by or affiliated with any regulatory authority including MCA, GST Council, Income Tax Department, RBI, or SEBI. All actions taken through this platform are fully auditable and traceable.
              </p>
            </div>
          </div>
        </div>

        {/* Bottom */}
        <div className="mt-8 pt-8 border-t border-border/30 flex flex-col md:flex-row items-center justify-between gap-4">
          <p className="text-sm text-muted-foreground">
            © {new Date().getFullYear()} XYZ AI. All rights reserved.
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

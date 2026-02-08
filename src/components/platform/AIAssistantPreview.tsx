import { useState } from "react";
import { motion } from "framer-motion";
import { Upload, Eye, Shield, FileCheck, Clock, BarChart3 } from "lucide-react";
import { Button } from "@/components/ui/button";

const customerCapabilities = [
  {
    icon: Upload,
    title: "Upload Documents",
    description: "Submit PDF, DOCX, XLSX files for compliance processing"
  },
  {
    icon: Eye,
    title: "Track Compliance Status",
    description: "Monitor filing progress and regulatory deadlines"
  },
  {
    icon: BarChart3,
    title: "View Health Score",
    description: "See your real-time compliance health percentage"
  },
  {
    icon: FileCheck,
    title: "Download Approved Documents",
    description: "Access CA-verified, regulator-ready filings"
  },
  {
    icon: Clock,
    title: "Deadline Alerts",
    description: "Never miss a statutory deadline with smart notifications"
  },
  {
    icon: Shield,
    title: "Audit-Ready Packs",
    description: "One-click download of complete evidence packages"
  },
];

const AIAssistantPreview = () => {
  return (
    <section className="py-24 relative bg-card/30">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="text-center mb-12"
        >
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 border border-primary/20 mb-6">
            <Upload className="w-4 h-4 text-primary" />
            <span className="text-sm text-primary font-medium">Customer Portal</span>
          </div>
          <h2 className="text-3xl md:text-4xl font-bold mb-4">
            Your Compliance Control Center
          </h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Upload documents, track compliance status, and download regulator-ready filings — 
            all verified by licensed CAs before approval.
          </p>
        </motion.div>

        {/* Customer Capabilities Grid */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5, delay: 0.2 }}
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-12"
        >
          {customerCapabilities.map((capability, index) => {
            const Icon = capability.icon;
            return (
              <motion.div
                key={capability.title}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1 }}
                className="glass-card p-6 hover:border-primary/30 transition-all duration-300"
              >
                <div className="flex items-start gap-4">
                  <div className="p-3 rounded-xl bg-primary/10">
                    <Icon className="w-6 h-6 text-primary" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-foreground mb-1">{capability.title}</h3>
                    <p className="text-sm text-muted-foreground">{capability.description}</p>
                  </div>
                </div>
              </motion.div>
            );
          })}
        </motion.div>

        {/* Document Upload Preview */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5, delay: 0.3 }}
          className="glass-card p-8"
        >
          <div className="mb-6">
            <h3 className="text-xl font-semibold text-foreground mb-2">Upload Compliance Documents</h3>
            <p className="text-sm text-muted-foreground">
              Submit your documents for CA review. All drafting and regulatory submissions are handled by licensed professionals.
            </p>
          </div>
          
          <div className="border-2 border-dashed border-border rounded-xl p-8 text-center hover:border-primary/50 transition-colors cursor-pointer mb-6">
            <Upload className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
            <p className="text-foreground font-medium mb-1">
              Drag and drop files here, or click to browse
            </p>
            <p className="text-xs text-muted-foreground">
              PDF, DOCX, XLSX up to 25MB
            </p>
          </div>

          <div className="flex flex-wrap items-center justify-center gap-4">
            <Button size="lg" className="btn-glow">
              <Upload className="w-4 h-4 mr-2" />
              Upload for Review
            </Button>
            <Button size="lg" variant="outline">
              <Eye className="w-4 h-4 mr-2" />
              Track Status
            </Button>
          </div>
        </motion.div>

        {/* Important Notice */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5, delay: 0.4 }}
          className="mt-8 p-4 rounded-xl bg-accent/30 border border-accent/50 text-center"
        >
          <p className="text-sm text-foreground">
            <Shield className="w-4 h-4 inline-block mr-2 text-primary" />
            <strong>Professional Verification Required:</strong> All regulatory drafts are created and verified by licensed Chartered Accountants. 
            You cannot generate, edit, or submit regulatory documents directly.
          </p>
        </motion.div>

        {/* Trust indicators */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5, delay: 0.5 }}
          className="mt-8 flex flex-wrap items-center justify-center gap-6 text-sm text-muted-foreground"
        >
          <div className="flex items-center gap-2">
            <Shield className="w-4 h-4 text-primary" />
            <span>End-to-end encrypted</span>
          </div>
          <div className="flex items-center gap-2">
            <FileCheck className="w-4 h-4 text-primary" />
            <span>CA-Verified Documents</span>
          </div>
          <div className="flex items-center gap-2">
            <Shield className="w-4 h-4 text-primary" />
            <span>SOC 2 Type II Compliant</span>
          </div>
        </motion.div>
      </div>
    </section>
  );
};

export default AIAssistantPreview;

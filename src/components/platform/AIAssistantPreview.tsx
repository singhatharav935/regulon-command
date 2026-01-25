import { useState } from "react";
import { motion } from "framer-motion";
import { Upload, Send, Cpu, AlertTriangle, FileText, Search, Shield } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

const examplePrompts = [
  "Summarize compliance risks in this document",
  "Check SEBI applicability for my business",
  "Draft a response to this MCA notice",
  "Identify GST filing gaps for Q4",
];

const AIAssistantPreview = () => {
  const [query, setQuery] = useState("");

  return (
    <section className="py-24 relative bg-card/30">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="text-center mb-12"
        >
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 border border-primary/20 mb-6">
            <Cpu className="w-4 h-4 text-primary" />
            <span className="text-sm text-primary font-medium">REGULON AI Assistant</span>
          </div>
          <h2 className="text-3xl md:text-4xl font-bold mb-4">
            AI-Powered Compliance Analysis
          </h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Upload documents, ask questions, and receive AI-generated drafts — 
            all verified by professionals before any action is taken.
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5, delay: 0.2 }}
          className="glass-card p-8"
        >
          {/* Document Upload */}
          <div className="mb-8">
            <label className="block text-sm font-medium text-foreground mb-3">
              Upload Document for Analysis
            </label>
            <div className="border-2 border-dashed border-border rounded-xl p-8 text-center hover:border-primary/50 transition-colors cursor-pointer">
              <Upload className="w-10 h-10 text-muted-foreground mx-auto mb-3" />
              <p className="text-sm text-muted-foreground mb-1">
                Drag and drop files here, or click to browse
              </p>
              <p className="text-xs text-muted-foreground/70">
                PDF, DOCX, XLSX up to 25MB
              </p>
            </div>
          </div>

          {/* Query Input */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-foreground mb-3">
              Ask a Compliance Question
            </label>
            <div className="flex gap-3">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                <Input
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="e.g., What are the compliance requirements for..."
                  className="pl-10 h-12 bg-background/50"
                />
              </div>
              <Button size="lg" className="btn-glow h-12 px-6">
                <Send className="w-4 h-4 mr-2" />
                Submit for Analysis
              </Button>
            </div>
          </div>

          {/* Example Prompts */}
          <div className="mb-8">
            <p className="text-xs text-muted-foreground mb-3">Try an example:</p>
            <div className="flex flex-wrap gap-2">
              {examplePrompts.map((prompt) => (
                <button
                  key={prompt}
                  onClick={() => setQuery(prompt)}
                  className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs bg-accent hover:bg-accent/80 text-accent-foreground transition-colors"
                >
                  <FileText className="w-3 h-3" />
                  {prompt}
                </button>
              ))}
            </div>
          </div>

          {/* Disclaimer */}
          <div className="flex items-start gap-3 p-4 rounded-lg bg-warning/10 border border-warning/20">
            <AlertTriangle className="w-5 h-5 text-warning shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-medium text-foreground mb-1">AI-Generated Draft Notice</p>
              <p className="text-xs text-muted-foreground">
                All outputs from REGULON AI Assistant are marked as AI-generated drafts and require 
                mandatory verification by a licensed CA or Lawyer before any action is taken. 
                This tool does not provide legal or financial advice.
              </p>
            </div>
          </div>
        </motion.div>

        {/* Trust indicators */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5, delay: 0.3 }}
          className="mt-8 flex flex-wrap items-center justify-center gap-6 text-sm text-muted-foreground"
        >
          <div className="flex items-center gap-2">
            <Shield className="w-4 h-4 text-primary" />
            <span>End-to-end encrypted</span>
          </div>
          <div className="flex items-center gap-2">
            <Cpu className="w-4 h-4 text-primary" />
            <span>Powered by Lovable AI</span>
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

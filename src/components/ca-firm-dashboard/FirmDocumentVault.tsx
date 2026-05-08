import { motion } from "framer-motion";
import { Folder, FileText, Download, Lock, Search, Plus } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

const vaults = [
  { name: "Firm Standard Operating Procedures (SOP)", files: 24, type: "Internal" },
  { name: "Audit Working Paper Templates", files: 15, type: "Templates" },
  { name: "Client Master KYC Documents", files: 142, type: "Client Data" },
  { name: "Engagement Letters (Drafts)", files: 8, type: "Templates" },
];

export default function FirmDocumentVault() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-white">Firm Document Vault</h2>
          <p className="text-sm text-muted-foreground mt-1">Secure repository for firm-wide templates, SOPs, and KYC.</p>
        </div>
        <Button className="bg-indigo-600 hover:bg-indigo-700 text-white">
          <Plus className="w-4 h-4 mr-2" />
          Upload Document
        </Button>
      </div>

      <div className="flex gap-4 mb-6">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <Input 
            placeholder="Search templates, SOPs, or client documents..." 
            className="pl-9 bg-slate-800/50 border-gray-700/50 text-white"
          />
        </div>
        <Button variant="outline" className="border-gray-700/50 bg-slate-800/50 text-slate-300">
          <Lock className="w-4 h-4 mr-2" />
          Manage Access Rights
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {vaults.map((vault, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.1 }}
          >
            <Card className="bg-slate-800/50 border-gray-700/50 hover:bg-slate-800 transition-colors cursor-pointer group">
              <CardContent className="p-6">
                <div className="flex justify-between items-start mb-4">
                  <div className="p-3 bg-blue-500/10 rounded-xl group-hover:bg-blue-500/20 transition-colors">
                    <Folder className="w-8 h-8 text-blue-400" />
                  </div>
                  <span className="text-[10px] font-bold tracking-wider uppercase text-slate-500 bg-slate-900/50 px-2 py-1 rounded">
                    {vault.type}
                  </span>
                </div>
                <h3 className="font-semibold text-white leading-tight mb-2">{vault.name}</h3>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-slate-400 flex items-center gap-1">
                    <FileText className="w-3 h-3" /> {vault.files} Files
                  </span>
                  <Download className="w-4 h-4 text-slate-500 group-hover:text-white transition-colors" />
                </div>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>

      {/* Recent Files Table Placeholder */}
      <div className="mt-8 border border-gray-700/50 rounded-xl overflow-hidden bg-slate-800/20">
        <div className="p-4 border-b border-gray-700/50 flex justify-between items-center bg-slate-800/50">
          <h3 className="font-semibold text-white">Recently Accessed Documents</h3>
        </div>
        <div className="p-8 text-center text-slate-500">
          <FileText className="w-12 h-12 mx-auto mb-3 opacity-20" />
          <p>No documents accessed today.</p>
        </div>
      </div>
    </div>
  );
}

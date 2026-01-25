import { useState } from "react";
import { motion } from "framer-motion";
import { FileText, Upload, CheckCircle2, Clock, Eye, Download, MoreVertical } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

interface Document {
  id: string;
  name: string;
  fileType: string;
  regulator?: string;
  status: 'approved' | 'submitted' | 'under_review' | 'draft';
  uploadedAt: string;
}

interface DocumentVaultProps {
  documents: Document[];
}

const statusConfig: Record<string, { label: string; icon: React.ElementType; className: string }> = {
  approved: { label: "Approved", icon: CheckCircle2, className: "text-green-400 bg-green-500/20" },
  submitted: { label: "Submitted", icon: Upload, className: "text-blue-400 bg-blue-500/20" },
  under_review: { label: "Under Review", icon: Eye, className: "text-yellow-400 bg-yellow-500/20" },
  draft: { label: "Draft", icon: Clock, className: "text-muted-foreground bg-muted/50" },
};

const DocumentVault = ({ documents }: DocumentVaultProps) => {
  const [activeTab, setActiveTab] = useState("all");

  const filterDocuments = (status?: string) => {
    if (!status || status === "all") return documents;
    return documents.filter(doc => doc.status === status);
  };

  const DocumentCard = ({ doc }: { doc: Document }) => {
    const status = statusConfig[doc.status];
    const StatusIcon = status.icon;
    
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="group p-4 rounded-xl border border-border/50 bg-card/30 hover:bg-card/60 transition-all duration-300"
      >
        <div className="flex items-start justify-between mb-3">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-primary/10">
              <FileText className="w-5 h-5 text-primary" />
            </div>
            <div>
              <p className="font-medium text-foreground text-sm line-clamp-1">{doc.name}</p>
              <p className="text-xs text-muted-foreground">{doc.fileType.toUpperCase()}</p>
            </div>
          </div>
          <Button variant="ghost" size="icon" className="opacity-0 group-hover:opacity-100 transition-opacity">
            <MoreVertical className="w-4 h-4" />
          </Button>
        </div>
        
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Badge className={`${status.className} border-none text-xs`}>
              <StatusIcon className="w-3 h-3 mr-1" />
              {status.label}
            </Badge>
            {doc.regulator && (
              <Badge variant="outline" className="text-xs bg-card/50">
                {doc.regulator}
              </Badge>
            )}
          </div>
          <Button variant="ghost" size="icon" className="h-8 w-8">
            <Download className="w-4 h-4 text-muted-foreground" />
          </Button>
        </div>
        
        <p className="text-xs text-muted-foreground mt-3">{doc.uploadedAt}</p>
      </motion.div>
    );
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.3 }}
      className="glass-card p-6 mb-8"
    >
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-semibold text-foreground">Document Vault</h2>
        <Button className="bg-primary hover:bg-primary/90">
          <Upload className="w-4 h-4 mr-2" />
          Upload Document
        </Button>
      </div>
      
      <Tabs defaultValue="all" className="w-full">
        <TabsList className="bg-muted/30 border border-border/50 mb-6">
          <TabsTrigger value="all" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
            All ({documents.length})
          </TabsTrigger>
          <TabsTrigger value="approved" className="data-[state=active]:bg-green-500/20 data-[state=active]:text-green-400">
            Approved ({filterDocuments("approved").length})
          </TabsTrigger>
          <TabsTrigger value="submitted" className="data-[state=active]:bg-blue-500/20 data-[state=active]:text-blue-400">
            Submitted ({filterDocuments("submitted").length})
          </TabsTrigger>
          <TabsTrigger value="under_review" className="data-[state=active]:bg-yellow-500/20 data-[state=active]:text-yellow-400">
            Under Review ({filterDocuments("under_review").length})
          </TabsTrigger>
        </TabsList>
        
        {["all", "approved", "submitted", "under_review"].map(tab => (
          <TabsContent key={tab} value={tab}>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filterDocuments(tab === "all" ? undefined : tab).map(doc => (
                <DocumentCard key={doc.id} doc={doc} />
              ))}
            </div>
          </TabsContent>
        ))}
      </Tabs>
    </motion.div>
  );
};

export default DocumentVault;

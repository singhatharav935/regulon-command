import { useState, useEffect, useMemo } from "react";
import { motion } from "framer-motion";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { 
  AuditDocument, 
  mockAuditDocuments, 
  simulateHashVerification,
  mockClientCompanies
} from "@/data/mockData";
import { 
  Search, 
  Shield, 
  FileText, 
  Download, 
  Eye, 
  AlertTriangle,
  CheckCircle,
  XCircle,
  Clock,
  RefreshCw,
  Lock,
  Unlock,
  FileImage,
  FileSpreadsheet
} from "lucide-react";
import { toast } from "sonner";

export const AuditEvidenceVault = () => {
  const [documents, setDocuments] = useState<AuditDocument[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [documentTypeFilter, setDocumentTypeFilter] = useState<string>("all");
  const [companyFilter, setCompanyFilter] = useState<string>("all");
  const [verificationStatusFilter, setVerificationStatusFilter] = useState<string>("all");
  const [verifyingDocuments, setVerifyingDocuments] = useState<Set<string>>(new Set());
  const [verificationResults, setVerificationResults] = useState<Record<string, any>>({});

  // Load mock data
  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      // Simulate API call delay
      await new Promise(resolve => setTimeout(resolve, 800));
      setDocuments(mockAuditDocuments);
      setLoading(false);
    };
    loadData();
  }, []);

  // Filter documents based on search and filters
  const filteredDocuments = useMemo(() => {
    return documents.filter(doc => {
      const matchesSearch = doc.fileName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          doc.documentType.toLowerCase().includes(searchTerm.toLowerCase());
      
      const matchesDocumentType = documentTypeFilter === "all" || doc.documentType === documentTypeFilter;
      const matchesCompany = companyFilter === "all" || doc.companyId === companyFilter;
      const matchesVerificationStatus = verificationStatusFilter === "all" || doc.verificationStatus === verificationStatusFilter;
      
      return matchesSearch && matchesDocumentType && matchesCompany && matchesVerificationStatus;
    });
  }, [documents, searchTerm, documentTypeFilter, companyFilter, verificationStatusFilter]);

  // Get unique document types for filter
  const documentTypes = useMemo(() => {
    return Array.from(new Set(documents.map(d => d.documentType)));
  }, [documents]);

  // Get company names for filter
  const companies = useMemo(() => {
    return mockClientCompanies.map(c => ({ id: c.id, name: c.name }));
  }, []);

  // Verify document integrity using SHA-256 hash
  const verifyDocumentIntegrity = async (document: AuditDocument) => {
    setVerifyingDocuments(prev => new Set(prev).add(document.id));
    
    try {
      const result = await simulateHashVerification(document.id, document.shaHash);
      
      // Update verification status
      setDocuments(prev => 
        prev.map(d => 
          d.id === document.id 
            ? { ...d, verificationStatus: result.isValid ? 'Verified' : 'Failed' }
            : d
        )
      );

      // Store verification results for display
      setVerificationResults(prev => ({
        ...prev,
        [document.id]: result
      }));
      
      if (result.isValid) {
        toast.success(`✓ Document integrity verified for ${document.fileName}`);
      } else {
        toast.error(`✗ Document integrity check failed for ${document.fileName}`);
      }
    } catch (error) {
      toast.error("Failed to verify document integrity");
    } finally {
      setVerifyingDocuments(prev => {
        const newSet = new Set(prev);
        newSet.delete(document.id);
        return newSet;
      });
    }
  };

  const getVerificationStatusIcon = (status: string) => {
    switch (status) {
      case 'Verified':
        return <CheckCircle className="w-4 h-4 text-green-400" />;
      case 'Failed':
        return <XCircle className="w-4 h-4 text-red-400" />;
      case 'Tampered':
        return <AlertTriangle className="w-4 h-4 text-orange-400" />;
      default:
        return <Clock className="w-4 h-4 text-yellow-400" />;
    }
  };

  const getVerificationStatusBadge = (status: string) => {
    const variants = {
      Verified: "bg-green-500/20 text-green-400 border-green-500/30",
      Failed: "bg-red-500/20 text-red-400 border-red-500/30",
      Tampered: "bg-orange-500/20 text-orange-400 border-orange-500/30",
      Pending: "bg-yellow-500/20 text-yellow-400 border-yellow-500/30"
    };
    return variants[status as keyof typeof variants] || variants.Pending;
  };

  const getConfidentialityIcon = (level: string) => {
    switch (level) {
      case 'Restricted':
        return <Lock className="w-4 h-4 text-red-400" />;
      case 'Confidential':
        return <Lock className="w-4 h-4 text-orange-400" />;
      case 'Internal':
        return <Unlock className="w-4 h-4 text-yellow-400" />;
      default:
        return <Unlock className="w-4 h-4 text-green-400" />;
    }
  };

  const getFileTypeIcon = (fileType: string) => {
    switch (fileType) {
      case 'PDF':
        return <FileText className="w-4 h-4 text-red-400" />;
      case 'Excel':
        return <FileSpreadsheet className="w-4 h-4 text-green-400" />;
      case 'Image':
        return <FileImage className="w-4 h-4 text-blue-400" />;
      default:
        return <FileText className="w-4 h-4 text-slate-400" />;
    }
  };

  const getCompanyName = (companyId: string) => {
    const company = companies.find(c => c.id === companyId);
    return company ? company.name : 'Unknown Company';
  };

  if (loading) {
    return (
      <Card className="bg-slate-800 border-slate-700">
        <CardContent className="p-8">
          <div className="flex items-center justify-center">
            <RefreshCw className="w-8 h-8 animate-spin text-cyan-400" />
            <span className="ml-3 text-slate-400">Loading audit evidence vault...</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="bg-slate-800 border-slate-700">
      <CardHeader className="pb-4">
        <div className="flex items-center justify-between">
          <CardTitle className="text-xl font-bold text-white flex items-center">
            <Shield className="w-6 h-6 mr-2 text-cyan-400" />
            Audit Evidence Vault
            <Badge variant="secondary" className="ml-3 bg-cyan-500/20 text-cyan-400">
              {filteredDocuments.length} Documents
            </Badge>
          </CardTitle>
        </div>

        {/* Filters */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mt-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 w-4 h-4" />
            <Input
              placeholder="Search documents..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 bg-slate-700 border-slate-600 text-white"
            />
          </div>
          
          <Select value={documentTypeFilter} onValueChange={setDocumentTypeFilter}>
            <SelectTrigger className="bg-slate-700 border-slate-600 text-white">
              <SelectValue placeholder="Document Type" />
            </SelectTrigger>
            <SelectContent className="bg-slate-700 border-slate-600">
              <SelectItem value="all" className="text-white">All Types</SelectItem>
              {documentTypes.map(type => (
                <SelectItem key={type} value={type} className="text-white">
                  {type}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select value={companyFilter} onValueChange={setCompanyFilter}>
            <SelectTrigger className="bg-slate-700 border-slate-600 text-white">
              <SelectValue placeholder="Company" />
            </SelectTrigger>
            <SelectContent className="bg-slate-700 border-slate-600">
              <SelectItem value="all" className="text-white">All Companies</SelectItem>
              {companies.map(company => (
                <SelectItem key={company.id} value={company.id} className="text-white">
                  {company.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select value={verificationStatusFilter} onValueChange={setVerificationStatusFilter}>
            <SelectTrigger className="bg-slate-700 border-slate-600 text-white">
              <SelectValue placeholder="Verification Status" />
            </SelectTrigger>
            <SelectContent className="bg-slate-700 border-slate-600">
              <SelectItem value="all" className="text-white">All Statuses</SelectItem>
              <SelectItem value="Verified" className="text-white">Verified</SelectItem>
              <SelectItem value="Pending" className="text-white">Pending</SelectItem>
              <SelectItem value="Failed" className="text-white">Failed</SelectItem>
              <SelectItem value="Tampered" className="text-white">Tampered</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Verification Stats */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mt-4">
          <div className="bg-slate-700/50 p-3 rounded-lg">
            <div className="flex items-center text-green-400">
              <CheckCircle className="w-4 h-4 mr-2" />
              <span className="text-sm">Verified</span>
            </div>
            <p className="text-lg font-bold text-white">
              {documents.filter(d => d.verificationStatus === 'Verified').length}
            </p>
          </div>
          <div className="bg-slate-700/50 p-3 rounded-lg">
            <div className="flex items-center text-yellow-400">
              <Clock className="w-4 h-4 mr-2" />
              <span className="text-sm">Pending</span>
            </div>
            <p className="text-lg font-bold text-white">
              {documents.filter(d => d.verificationStatus === 'Pending').length}
            </p>
          </div>
          <div className="bg-slate-700/50 p-3 rounded-lg">
            <div className="flex items-center text-red-400">
              <XCircle className="w-4 h-4 mr-2" />
              <span className="text-sm">Failed</span>
            </div>
            <p className="text-lg font-bold text-white">
              {documents.filter(d => d.verificationStatus === 'Failed').length}
            </p>
          </div>
          <div className="bg-slate-700/50 p-3 rounded-lg">
            <div className="flex items-center text-orange-400">
              <AlertTriangle className="w-4 h-4 mr-2" />
              <span className="text-sm">Tampered</span>
            </div>
            <p className="text-lg font-bold text-white">
              {documents.filter(d => d.verificationStatus === 'Tampered').length}
            </p>
          </div>
        </div>
      </CardHeader>

      <CardContent>
        <div className="rounded-lg border border-slate-600 overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow className="bg-slate-700 border-slate-600 hover:bg-slate-700">
                <TableHead className="text-cyan-400 font-semibold">Document</TableHead>
                <TableHead className="text-cyan-400 font-semibold">Company</TableHead>
                <TableHead className="text-cyan-400 font-semibold">Type</TableHead>
                <TableHead className="text-cyan-400 font-semibold">Verification Status</TableHead>
                <TableHead className="text-cyan-400 font-semibold">Confidentiality</TableHead>
                <TableHead className="text-cyan-400 font-semibold">Upload Date</TableHead>
                <TableHead className="text-cyan-400 font-semibold">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredDocuments.map((document, index) => (
                <motion.tr
                  key={document.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3, delay: index * 0.1 }}
                  className="border-slate-600 hover:bg-slate-700/50 transition-colors"
                >
                  <TableCell>
                    <div className="flex items-start space-x-3">
                      {getFileTypeIcon(document.fileType)}
                      <div>
                        <div className="font-medium text-white">{document.fileName}</div>
                        <div className="text-xs text-slate-400">{document.fileSize}</div>
                        <div className="text-xs text-slate-500 font-mono truncate w-40">
                          SHA: {document.shaHash.substring(0, 16)}...
                        </div>
                      </div>
                    </div>
                  </TableCell>
                  
                  <TableCell>
                    <div className="text-white font-medium">
                      {getCompanyName(document.companyId)}
                    </div>
                  </TableCell>
                  
                  <TableCell>
                    <Badge variant="outline" className="border-slate-500 text-slate-300">
                      {document.documentType}
                    </Badge>
                  </TableCell>
                  
                  <TableCell>
                    <div className="flex items-center space-x-2">
                      {getVerificationStatusIcon(document.verificationStatus)}
                      <Badge className={getVerificationStatusBadge(document.verificationStatus)}>
                        {document.verificationStatus}
                      </Badge>
                    </div>
                    {verificationResults[document.id] && (
                      <div className="mt-1 text-xs text-slate-400">
                        Verified: {new Date(verificationResults[document.id].verificationTime).toLocaleTimeString()}
                      </div>
                    )}
                  </TableCell>
                  
                  <TableCell>
                    <div className="flex items-center space-x-2">
                      {getConfidentialityIcon(document.confidentialityLevel)}
                      <span className="text-sm text-slate-300">{document.confidentialityLevel}</span>
                    </div>
                  </TableCell>
                  
                  <TableCell>
                    <div className="text-slate-400">
                      {new Date(document.uploadDate).toLocaleDateString()}
                    </div>
                  </TableCell>
                  
                  <TableCell>
                    <div className="flex space-x-2">
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => verifyDocumentIntegrity(document)}
                        disabled={verifyingDocuments.has(document.id)}
                        className="text-green-400 hover:text-green-300"
                        title="Verify Integrity"
                      >
                        {verifyingDocuments.has(document.id) ? (
                          <RefreshCw className="w-4 h-4 animate-spin" />
                        ) : (
                          <Shield className="w-4 h-4" />
                        )}
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        className="text-cyan-400 hover:text-cyan-300"
                        title="View Document"
                      >
                        <Eye className="w-4 h-4" />
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        className="text-slate-400 hover:text-slate-300"
                        title="Download"
                        disabled={document.confidentialityLevel === 'Restricted'}
                      >
                        <Download className="w-4 h-4" />
                      </Button>
                    </div>
                  </TableCell>
                </motion.tr>
              ))}
            </TableBody>
          </Table>
        </div>

        {filteredDocuments.length === 0 && (
          <div className="text-center py-8">
            <FileText className="w-12 h-12 text-slate-600 mx-auto mb-4" />
            <p className="text-slate-400">No documents match your filter criteria</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
};
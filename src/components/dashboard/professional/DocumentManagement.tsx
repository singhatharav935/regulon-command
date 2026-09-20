/**
 * Professional Document Management Widget
 * Advanced document library with workflow management
 */

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
import { 
  FileText, 
  Upload, 
  Download, 
  Eye, 
  Search,
  Filter,
  Calendar,
  User,
  CheckCircle,
  Clock,
  AlertCircle,
  XCircle,
  MoreHorizontal
} from "lucide-react";
import { format } from "date-fns";

interface Document {
  id: string;
  name: string;
  file_type: string;
  size: number;
  status: 'pending' | 'under_review' | 'approved' | 'rejected';
  regulator: string;
  uploaded_by: string;
  reviewed_by?: string;
  upload_date: string;
  review_date?: string;
  category: string;
  compliance_score?: number;
  notes?: string;
}

interface DocumentManagementProps {
  documents: Document[];
  onUpload?: () => void;
  onView?: (doc: Document) => void;
  onDownload?: (doc: Document) => void;
  className?: string;
}

const DocumentManagement = ({ 
  documents, 
  onUpload, 
  onView, 
  onDownload,
  className = "" 
}: DocumentManagementProps) => {
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [categoryFilter, setCategoryFilter] = useState<string>("all");

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'approved': return <CheckCircle className="w-4 h-4 text-green-600" />;
      case 'pending': return <Clock className="w-4 h-4 text-yellow-600" />;
      case 'under_review': return <AlertCircle className="w-4 h-4 text-blue-600" />;
      case 'rejected': return <XCircle className="w-4 h-4 text-red-600" />;
      default: return <FileText className="w-4 h-4 text-gray-600" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'approved': return 'bg-green-100 text-green-800 border-green-200';
      case 'pending': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'under_review': return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'rejected': return 'bg-red-100 text-red-800 border-red-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const filteredDocuments = documents.filter(doc => {
    const matchesSearch = doc.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         doc.regulator.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === "all" || doc.status === statusFilter;
    const matchesCategory = categoryFilter === "all" || doc.category === categoryFilter;
    
    return matchesSearch && matchesStatus && matchesCategory;
  });

  const categories = [...new Set(documents.map(doc => doc.category))];
  const documentStats = {
    total: documents.length,
    approved: documents.filter(d => d.status === 'approved').length,
    pending: documents.filter(d => d.status === 'pending').length,
    under_review: documents.filter(d => d.status === 'under_review').length,
    rejected: documents.filter(d => d.status === 'rejected').length,
  };

  return (
    <Card className={className}>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center space-x-2">
            <FileText className="w-5 h-5" />
            <span>Document Management</span>
            <Badge variant="outline">{documentStats.total} documents</Badge>
          </CardTitle>
          {onUpload && (
            <Button onClick={onUpload} size="sm">
              <Upload className="w-4 h-4 mr-1" />
              Upload
            </Button>
          )}
        </div>

        {/* Document Stats */}
        <div className="grid grid-cols-5 gap-4 mt-4">
          <div className="text-center">
            <div className="text-xl font-bold text-gray-900">{documentStats.total}</div>
            <div className="text-xs text-gray-600">Total</div>
          </div>
          <div className="text-center">
            <div className="text-xl font-bold text-green-600">{documentStats.approved}</div>
            <div className="text-xs text-gray-600">Approved</div>
          </div>
          <div className="text-center">
            <div className="text-xl font-bold text-yellow-600">{documentStats.pending}</div>
            <div className="text-xs text-gray-600">Pending</div>
          </div>
          <div className="text-center">
            <div className="text-xl font-bold text-blue-600">{documentStats.under_review}</div>
            <div className="text-xs text-gray-600">Review</div>
          </div>
          <div className="text-center">
            <div className="text-xl font-bold text-red-600">{documentStats.rejected}</div>
            <div className="text-xs text-gray-600">Rejected</div>
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Search and Filters */}
        <div className="flex items-center space-x-4">
          <div className="flex-1 relative">
            <Search className="w-4 h-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
            <Input
              placeholder="Search documents..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
          <select 
            value={statusFilter} 
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-3 py-2 border rounded-md text-sm"
          >
            <option value="all">All Status</option>
            <option value="approved">Approved</option>
            <option value="pending">Pending</option>
            <option value="under_review">Under Review</option>
            <option value="rejected">Rejected</option>
          </select>
          <select 
            value={categoryFilter} 
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="px-3 py-2 border rounded-md text-sm"
          >
            <option value="all">All Categories</option>
            {categories.map(category => (
              <option key={category} value={category}>{category}</option>
            ))}
          </select>
        </div>

        {/* Document List */}
        <div className="space-y-2 max-h-96 overflow-y-auto">
          {filteredDocuments.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <FileText className="w-12 h-12 mx-auto mb-2 text-gray-300" />
              <p>No documents found</p>
            </div>
          ) : (
            filteredDocuments.map((doc) => (
              <div 
                key={doc.id}
                className="border rounded-lg p-4 hover:bg-gray-50 transition-colors"
              >
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-start space-x-3 flex-1">
                    <div className="p-2 bg-gray-100 rounded-lg">
                      <FileText className="w-5 h-5 text-gray-600" />
                    </div>
                    <div className="flex-1 space-y-1">
                      <h4 className="font-medium text-sm">{doc.name}</h4>
                      <div className="flex items-center space-x-4 text-xs text-gray-600">
                        <span>{doc.file_type.toUpperCase()}</span>
                        <span>{formatFileSize(doc.size)}</span>
                        <span>{doc.regulator}</span>
                        <span>{doc.category}</span>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    {getStatusIcon(doc.status)}
                    <Badge className={getStatusColor(doc.status)}>
                      {doc.status.replace('_', ' ')}
                    </Badge>
                  </div>
                </div>

                <div className="space-y-2">
                  {doc.compliance_score !== undefined && (
                    <div className="space-y-1">
                      <div className="flex justify-between text-xs">
                        <span>Compliance Score</span>
                        <span>{doc.compliance_score}%</span>
                      </div>
                      <Progress value={doc.compliance_score} className="h-1" />
                    </div>
                  )}

                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-4 text-xs text-gray-600">
                      <div className="flex items-center space-x-1">
                        <User className="w-3 h-3" />
                        <span>By {doc.uploaded_by}</span>
                      </div>
                      <div className="flex items-center space-x-1">
                        <Calendar className="w-3 h-3" />
                        <span>{format(new Date(doc.upload_date), 'MMM dd, yyyy')}</span>
                      </div>
                      {doc.review_date && (
                        <div className="flex items-center space-x-1">
                          <CheckCircle className="w-3 h-3" />
                          <span>Reviewed {format(new Date(doc.review_date), 'MMM dd')}</span>
                        </div>
                      )}
                    </div>

                    <div className="flex items-center space-x-2">
                      {onView && (
                        <Button variant="outline" size="sm" onClick={() => onView(doc)}>
                          <Eye className="w-3 h-3 mr-1" />
                          View
                        </Button>
                      )}
                      {onDownload && (
                        <Button variant="outline" size="sm" onClick={() => onDownload(doc)}>
                          <Download className="w-3 h-3 mr-1" />
                          Download
                        </Button>
                      )}
                      <Button variant="outline" size="sm">
                        <MoreHorizontal className="w-3 h-3" />
                      </Button>
                    </div>
                  </div>

                  {doc.notes && (
                    <div className="mt-2 p-2 bg-gray-50 rounded text-xs text-gray-700">
                      <strong>Notes:</strong> {doc.notes}
                    </div>
                  )}
                </div>
              </div>
            ))
          )}
        </div>

        {/* Summary */}
        {filteredDocuments.length > 0 && (
          <div className="pt-4 border-t text-xs text-gray-600">
            Showing {filteredDocuments.length} of {documents.length} documents
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default DocumentManagement;
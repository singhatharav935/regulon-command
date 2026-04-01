// Government API Mock Data - Simulates real GSTN, MCA, and Income Tax data
export interface ClientCompany {
  id: string;
  name: string;
  industry: string;
  gstin: string;
  cin?: string;
  complianceScore: number; // 0-100
  lastAuditDate: string;
  pendingActions: PendingAction[];
  monthlyTurnover: number;
  employeeCount: number;
  registrationDate: string;
  status: 'Active' | 'Suspended' | 'Cancelled';
  riskLevel: 'Low' | 'Medium' | 'High';
  auditHistory: AuditRecord[];
}

export interface PendingAction {
  id: string;
  type: 'GST_RETURN' | 'ITR_FILING' | 'ROC_COMPLIANCE' | 'AUDIT_REPORT' | 'TDS_RETURN';
  description: string;
  dueDate: string;
  priority: 'Low' | 'Medium' | 'High' | 'Critical';
  estimatedPenalty: number;
  assignedTo?: string;
}

export interface AuditRecord {
  id: string;
  auditDate: string;
  auditType: 'Internal' | 'Statutory' | 'Tax' | 'GST' | 'ROC';
  findings: number;
  status: 'Completed' | 'In Progress' | 'Scheduled';
  auditorName: string;
  reportUrl?: string;
}

export interface AuditDocument {
  id: string;
  companyId: string;
  fileName: string;
  fileType: 'PDF' | 'Excel' | 'Image' | 'Document';
  uploadDate: string;
  fileSize: string;
  shaHash: string;
  verificationStatus: 'Verified' | 'Pending' | 'Failed' | 'Tampered';
  documentType: 'Balance Sheet' | 'P&L Statement' | 'GST Return' | 'ITR' | 'Bank Statement' | 'Invoice' | 'Certificate';
  confidentialityLevel: 'Public' | 'Internal' | 'Confidential' | 'Restricted';
}

// Mock Government API Data
export const mockClientCompanies: ClientCompany[] = [
  {
    id: 'CMP001',
    name: 'Acme Manufacturing Pvt Ltd',
    industry: 'Manufacturing',
    gstin: '07AABCA1234F1Z5',
    cin: 'U25191DL2019PTC123456',
    complianceScore: 92,
    lastAuditDate: '2024-02-15',
    monthlyTurnover: 12500000,
    employeeCount: 145,
    registrationDate: '2019-03-15',
    status: 'Active',
    riskLevel: 'Low',
    pendingActions: [
      {
        id: 'PA001',
        type: 'GST_RETURN',
        description: 'GSTR-3B for March 2024',
        dueDate: '2024-04-20',
        priority: 'Medium',
        estimatedPenalty: 5000,
        assignedTo: 'CA Sharma'
      }
    ],
    auditHistory: [
      {
        id: 'AUD001',
        auditDate: '2024-02-15',
        auditType: 'Statutory',
        findings: 2,
        status: 'Completed',
        auditorName: 'CA Priya Mehta'
      }
    ]
  },
  {
    id: 'CMP002',
    name: 'TechNova Solutions India Pvt Ltd',
    industry: 'Information Technology',
    gstin: '29BBCDE5678G2A1',
    cin: 'U72200KA2020PTC134567',
    complianceScore: 76,
    lastAuditDate: '2024-01-20',
    monthlyTurnover: 8750000,
    employeeCount: 89,
    registrationDate: '2020-06-10',
    status: 'Active',
    riskLevel: 'Medium',
    pendingActions: [
      {
        id: 'PA002',
        type: 'ITR_FILING',
        description: 'Income Tax Return FY 2023-24',
        dueDate: '2024-07-31',
        priority: 'High',
        estimatedPenalty: 25000,
        assignedTo: 'CA Kumar'
      },
      {
        id: 'PA003',
        type: 'ROC_COMPLIANCE',
        description: 'Annual Filing with MCA',
        dueDate: '2024-09-30',
        priority: 'Critical',
        estimatedPenalty: 50000
      }
    ],
    auditHistory: [
      {
        id: 'AUD002',
        auditDate: '2024-01-20',
        auditType: 'Tax',
        findings: 5,
        status: 'Completed',
        auditorName: 'CA Rajesh Kumar'
      }
    ]
  },
  {
    id: 'CMP003',
    name: 'Global Textiles Export House',
    industry: 'Textiles & Exports',
    gstin: '33CDEFG9012H3B2',
    cin: 'U17111TN2018PTC145678',
    complianceScore: 45,
    lastAuditDate: '2023-11-30',
    monthlyTurnover: 15600000,
    employeeCount: 267,
    registrationDate: '2018-09-22',
    status: 'Active',
    riskLevel: 'High',
    pendingActions: [
      {
        id: 'PA004',
        type: 'GST_RETURN',
        description: 'GSTR-1 for February 2024 (Overdue)',
        dueDate: '2024-03-11',
        priority: 'Critical',
        estimatedPenalty: 75000,
        assignedTo: 'CA Venkat'
      },
      {
        id: 'PA005',
        type: 'AUDIT_REPORT',
        description: 'Statutory Audit Report Submission',
        dueDate: '2024-05-15',
        priority: 'Critical',
        estimatedPenalty: 100000
      },
      {
        id: 'PA006',
        type: 'TDS_RETURN',
        description: 'TDS Return for Q4 FY24',
        dueDate: '2024-04-30',
        priority: 'High',
        estimatedPenalty: 35000
      }
    ],
    auditHistory: [
      {
        id: 'AUD003',
        auditDate: '2023-11-30',
        auditType: 'GST',
        findings: 12,
        status: 'Completed',
        auditorName: 'CA Suresh Venkat'
      }
    ]
  },
  {
    id: 'CMP004',
    name: 'Green Energy Solutions Ltd',
    industry: 'Renewable Energy',
    gstin: '06EFGHI3456J4C3',
    cin: 'U40101HR2021PLC156789',
    complianceScore: 88,
    lastAuditDate: '2024-03-10',
    monthlyTurnover: 22000000,
    employeeCount: 198,
    registrationDate: '2021-01-15',
    status: 'Active',
    riskLevel: 'Low',
    pendingActions: [
      {
        id: 'PA007',
        type: 'ROC_COMPLIANCE',
        description: 'Board Resolution Filing',
        dueDate: '2024-05-20',
        priority: 'Low',
        estimatedPenalty: 5000,
        assignedTo: 'CA Neha'
      }
    ],
    auditHistory: [
      {
        id: 'AUD004',
        auditDate: '2024-03-10',
        auditType: 'Internal',
        findings: 1,
        status: 'Completed',
        auditorName: 'CA Neha Gupta'
      }
    ]
  },
  {
    id: 'CMP005',
    name: 'Mumbai Logistics Hub Pvt Ltd',
    industry: 'Logistics & Transportation',
    gstin: '27HIJKL7890M5D4',
    cin: 'U63032MH2017PTC167890',
    complianceScore: 67,
    lastAuditDate: '2023-12-15',
    monthlyTurnover: 6800000,
    employeeCount: 78,
    registrationDate: '2017-11-08',
    status: 'Active',
    riskLevel: 'Medium',
    pendingActions: [
      {
        id: 'PA008',
        type: 'GST_RETURN',
        description: 'GSTR-3B for March 2024',
        dueDate: '2024-04-20',
        priority: 'Medium',
        estimatedPenalty: 8000,
        assignedTo: 'CA Patil'
      },
      {
        id: 'PA009',
        type: 'ITR_FILING',
        description: 'Advance Tax Payment',
        dueDate: '2024-06-15',
        priority: 'High',
        estimatedPenalty: 15000
      }
    ],
    auditHistory: [
      {
        id: 'AUD005',
        auditDate: '2023-12-15',
        auditType: 'Tax',
        findings: 4,
        status: 'Completed',
        auditorName: 'CA Rahul Patil'
      }
    ]
  }
];

// Mock Audit Documents
export const mockAuditDocuments: AuditDocument[] = [
  {
    id: 'DOC001',
    companyId: 'CMP001',
    fileName: 'Acme_Balance_Sheet_FY24.pdf',
    fileType: 'PDF',
    uploadDate: '2024-03-15',
    fileSize: '2.4 MB',
    shaHash: 'a1b2c3d4e5f6789012345678901234567890abcdef1234567890abcdef123456',
    verificationStatus: 'Verified',
    documentType: 'Balance Sheet',
    confidentialityLevel: 'Confidential'
  },
  {
    id: 'DOC002',
    companyId: 'CMP001',
    fileName: 'GST_Return_March_2024.pdf',
    fileType: 'PDF',
    uploadDate: '2024-04-05',
    fileSize: '1.8 MB',
    shaHash: 'b2c3d4e5f6789012345678901234567890abcdef1234567890abcdef1234567',
    verificationStatus: 'Pending',
    documentType: 'GST Return',
    confidentialityLevel: 'Internal'
  },
  {
    id: 'DOC003',
    companyId: 'CMP002',
    fileName: 'TechNova_ITR_FY23.pdf',
    fileType: 'PDF',
    uploadDate: '2024-02-28',
    fileSize: '3.1 MB',
    shaHash: 'c3d4e5f6789012345678901234567890abcdef1234567890abcdef12345678',
    verificationStatus: 'Failed',
    documentType: 'ITR',
    confidentialityLevel: 'Confidential'
  },
  {
    id: 'DOC004',
    companyId: 'CMP003',
    fileName: 'Export_Invoices_Q1_2024.xlsx',
    fileType: 'Excel',
    uploadDate: '2024-04-01',
    fileSize: '5.7 MB',
    shaHash: 'd4e5f6789012345678901234567890abcdef1234567890abcdef123456789',
    verificationStatus: 'Tampered',
    documentType: 'Invoice',
    confidentialityLevel: 'Restricted'
  },
  {
    id: 'DOC005',
    companyId: 'CMP004',
    fileName: 'Green_Energy_Audit_Report_2024.pdf',
    fileType: 'PDF',
    uploadDate: '2024-03-20',
    fileSize: '4.2 MB',
    shaHash: 'e5f6789012345678901234567890abcdef1234567890abcdef1234567890',
    verificationStatus: 'Verified',
    documentType: 'Certificate',
    confidentialityLevel: 'Public'
  }
];

// GSTN API Simulation Functions
export const simulateGSTNApiCall = async (gstin: string): Promise<{ score: number; lastUpdated: string }> => {
  // Simulate API delay
  await new Promise(resolve => setTimeout(resolve, 2000));
  
  // Simulate score variation based on GSTIN
  const baseScore = 50;
  const variation = (gstin.charCodeAt(0) + gstin.charCodeAt(2)) % 40;
  const newScore = Math.min(100, baseScore + variation);
  
  return {
    score: newScore,
    lastUpdated: new Date().toISOString()
  };
};

// SHA-256 Hash Verification Simulation
export const simulateHashVerification = async (documentId: string, shaHash: string): Promise<{
  isValid: boolean;
  governmentHash?: string;
  verificationTime: string;
}> => {
  // Simulate verification delay
  await new Promise(resolve => setTimeout(resolve, 1500));
  
  // Simulate verification based on hash characteristics
  const isValid = shaHash.includes('abcdef') && shaHash.length === 64;
  
  return {
    isValid,
    governmentHash: isValid ? shaHash : shaHash.replace('abcdef', '123456'),
    verificationTime: new Date().toISOString()
  };
};

// Risk Assessment Algorithm
export const calculateRiskLevel = (company: ClientCompany): 'Low' | 'Medium' | 'High' => {
  if (company.complianceScore >= 80) return 'Low';
  if (company.complianceScore >= 60) return 'Medium';
  return 'High';
};

// Compliance Health Summary Generator
export const generateComplianceSummary = (company: ClientCompany): string => {
  const criticalActions = company.pendingActions.filter(action => action.priority === 'Critical');
  const highActions = company.pendingActions.filter(action => action.priority === 'High');
  
  return `Audit for ${company.name} as of ${new Date().toDateString()}: Compliance Health is ${company.complianceScore}%. ${criticalActions.length + highActions.length} gaps detected. Risk Level: ${company.riskLevel}. Last audit: ${company.lastAuditDate}.`;
};
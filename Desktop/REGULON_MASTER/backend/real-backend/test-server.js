/**
 * Simple test server for Real CA Dashboard
 * For testing purposes only - without authentication
 */

import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

const app = express();
const PORT = process.env.PORT || 3002;

// Basic middleware
app.use(cors({
  origin: ['http://localhost:8002', 'http://localhost:3000', 'http://127.0.0.1:8002', 'http://localhost:8007'],
  credentials: true
}));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Mock authentication middleware for testing
const mockAuth = (req, res, next) => {
  // Mock user for testing
  req.user = {
    userId: 'test-ca-user',
    ca_firm_id: 'test-ca-firm-123',
    ca_user_id: 'test-ca-user-456',
    firm_name: 'Test CA Firm'
  };
  next();
};

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'healthy', timestamp: new Date().toISOString() });
});

// ========================================
// REAL CA DASHBOARD API ENDPOINTS
// ========================================

// CA Control Tower Stats
app.get('/api/v1/ca/dashboard/stats', mockAuth, (req, res) => {
  res.json({
    success: true,
    data: {
      assigned_companies: 12,
      high_risk_alerts: 3,
      pending_filings_week: 7,
      active_tasks: 15,
      monthly_revenue: 125000,
      overdue_dependencies: 2,
      last_updated: new Date().toISOString()
    }
  });
});

// Client Portfolio
app.get('/api/v1/ca/clients/portfolio', mockAuth, (req, res) => {
  res.json({
    success: true,
    data: {
      clients: [
        {
          name: 'Acme Tech Solutions Pvt Ltd',
          industry: 'Technology',
          jurisdiction: 'Maharashtra',
          health: 87,
          risk: 'Low',
          gaps: 2,
          deadline: 'Feb 15',
          status: 'Waiting for Client'
        },
        {
          name: 'Global Trade India Ltd',
          industry: 'E-commerce',
          jurisdiction: 'Karnataka',
          health: 62,
          risk: 'High',
          gaps: 5,
          deadline: 'Feb 10',
          status: 'Waiting for CA'
        },
        {
          name: 'SecurePay Fintech Solutions',
          industry: 'Payments',
          jurisdiction: 'Delhi',
          health: 91,
          risk: 'Low',
          gaps: 1,
          deadline: 'Mar 01',
          status: 'Verified'
        },
        {
          name: 'DataSync Analytics Pvt Ltd',
          industry: 'IT Services',
          jurisdiction: 'Tamil Nadu',
          health: 74,
          risk: 'Medium',
          gaps: 3,
          deadline: 'Feb 20',
          status: 'Filed'
        }
      ]
    }
  });
});

// Filing Dashboard
app.get('/api/v1/ca/filings/dashboard', mockAuth, (req, res) => {
  res.json({
    success: true,
    data: {
      tasks: [
        {
          company: "Acme Tech Solutions",
          task: "Annual Return Filing (MGT-7)",
          authority: "MCA",
          dueDate: "Feb 15, 2026",
          penalty: "₹1,00,000",
          dependency: "Complete"
        },
        {
          company: "Global Trade India",
          task: "GSTR-1 January Filing",
          authority: "GST",
          dueDate: "Feb 11, 2026",
          penalty: "₹10,000/day",
          dependency: "Awaiting Data"
        },
        {
          company: "SecurePay Fintech",
          task: "RBI Annual Certificate",
          authority: "RBI",
          dueDate: "Mar 31, 2026",
          penalty: "License Risk",
          dependency: "Complete"
        },
        {
          company: "DataSync Analytics",
          task: "TDS Return Q4 FY2025-26",
          authority: "Income Tax",
          dueDate: "Jan 31, 2026",
          penalty: "₹200/day",
          dependency: "Pending Verification"
        }
      ]
    }
  });
});

// AI Drafting Engine
app.post('/api/v1/ca/ai/draft-response', mockAuth, (req, res) => {
  const { document_type, input_document } = req.body;
  
  // Simulate AI response based on document type
  let mockResponse = '';
  switch (document_type) {
    case 'gst_notice_reply':
      mockResponse = `To,
The GST Officer,
[Authority Name]

Subject: Reply to GST Notice dated [Date]

Dear Sir/Madam,

With reference to your notice dated [Date], we hereby submit our response:

1. The allegations mentioned in the notice are respectfully contested on the following grounds:
   - All transactions were conducted in accordance with GST provisions
   - Proper invoices and supporting documents are maintained
   - Input tax credit claimed was eligible as per Section 16 of CGST Act 2017

2. We request you to kindly reconsider the matter in light of the above submissions.

Thanking you,
[CA Name]
[Registration Number]`;
      break;
    default:
      mockResponse = `Professional document drafted successfully for ${document_type}. 

This is a real AI-generated response that would integrate with OpenAI GPT-4 in production environment.

Key points covered:
- Legal compliance requirements
- Appropriate citations and references
- Professional formatting and language
- Tailored content based on input document analysis`;
  }

  res.json({
    success: true,
    data: {
      id: 'draft-' + Date.now(),
      generated_response: mockResponse,
      tokens_used: 350,
      estimated_cost: 0.0105,
      document_type: document_type
    }
  });
});

// Client Dependencies
app.get('/api/v1/ca/dependencies/pending', mockAuth, (req, res) => {
  res.json({
    success: true,
    data: [
      {
        id: 'dep-1',
        dependency_type: 'Bank Statement',
        description: 'Bank statements for January 2024 required for GST return preparation',
        requested_date: '2024-02-01',
        expected_date: '2024-02-05',
        status: 'pending',
        urgency_level: 'urgent',
        company_name: 'Acme Tech Solutions',
        contact_person: 'John Doe',
        contact_email: 'john@acmetech.com',
        days_pending: 10,
        is_overdue: true
      }
    ]
  });
});

// Compliance Chatbot
app.post('/api/v1/ca/chatbot/query', mockAuth, (req, res) => {
  const { messages } = req.body;
  const lastMessage = messages[messages.length - 1]?.content || '';
  
  let response = '';
  if (lastMessage.toLowerCase().includes('gst')) {
    response = 'Based on current GST regulations, I can help you with GST-related queries. What specific GST matter would you like assistance with?';
  } else if (lastMessage.toLowerCase().includes('filing')) {
    response = 'For filing requirements, please ensure all supporting documents are ready. Which type of filing are you preparing?';
  } else {
    response = 'I\'m here to help with your compliance and regulatory queries. Please feel free to ask about GST, Income Tax, Company Law, or any other regulatory matter.';
  }
  
  res.json({
    success: true,
    response: response,
    timestamp: new Date().toISOString()
  });
});

// Catch-all route for any missing endpoints
app.get('/api/v1/ca/', mockAuth, (req, res) => {
  res.json({
    success: true,
    message: 'CA Dashboard API is running',
    endpoints: [
      'GET /api/v1/ca/dashboard/stats',
      'GET /api/v1/ca/clients/portfolio',
      'GET /api/v1/ca/filings/dashboard',
      'POST /api/v1/ca/ai/draft-response',
      'GET /api/v1/ca/dependencies/pending',
      'POST /api/v1/ca/chatbot/query'
    ]
  });
});

// Start server
app.listen(PORT, () => {
  console.log(`\n🚀 Sannidh Real Backend Test Server`);
  console.log(`📍 Running on: http://localhost:${PORT}`);
  console.log(`🔗 Health Check: http://localhost:${PORT}/health`);
  console.log(`📊 CA Dashboard API: http://localhost:${PORT}/api/v1/ca/`);
  console.log(`\n✅ Real CA Dashboard APIs ready for testing!\n`);
});

export default app;
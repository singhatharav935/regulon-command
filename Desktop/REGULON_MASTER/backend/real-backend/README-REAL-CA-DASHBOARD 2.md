# SANNIDH Real CA Dashboard

🎯 **Production-Ready CA Dashboard with Real Government Integration**

This is the **real** CA dashboard system that connects to actual government APIs, databases, and services. Unlike the demo dashboards, this system uses **NO MOCK DATA** and is designed for production use by actual CA firms.

## 🏗️ Architecture Overview

### Frontend Components
- **Real CA Dashboard** (`/real-ca-dashboard`)
- **CA Control Tower** - Real statistics from database
- **Client Portfolio** - Government API integration (GSTN/MCA)
- **AI Drafting Engine** - OpenAI integration for legal documents
- **Filing Management** - Real filing tracking with penalties
- **Dependency Tracker** - WhatsApp/Email automation
- **Payment Integration** - Razorpay revenue tracking

### Backend Services
- **Express.js Server** - Production API server
- **Supabase Database** - Primary PostgreSQL database
- **Government APIs** - GSTN, MCA, Income Tax, SEBI, RBI, CBIC
- **AI Integration** - OpenAI GPT-4 for document drafting
- **Notification System** - WhatsApp, SMS, Email automation
- **Payment Processing** - Razorpay integration

## 🚀 Quick Start

### 1. Database Setup
```bash
cd backend/real-backend
npm install
cp .env.example .env
# Update .env with your API keys and database credentials
npm run setup-db
```

### 2. Start Backend Server
```bash
npm run dev
# Server runs on http://localhost:3001
```

### 3. Start Frontend
```bash
cd frontend
npm run dev
# Visit http://localhost:3000/real-ca-dashboard
```

## 📊 Database Schema

### Core Tables
- `ca_firms` - CA firm registration and details
- `ca_users` - Individual CA practitioners
- `clients` - Client company information
- `client_filings` - Government filing tracking
- `client_tasks` - Task management system
- `client_dependencies` - Document request tracking
- `health_scores` - Historical compliance health data
- `ai_drafting_history` - AI document generation logs
- `payments` - Revenue and payment tracking
- `notifications` - Automated message system

### Government Integration
- `government_data_cache` - Cached API responses
- `regulatory_agents` - Data collection agents
- `compliance_updates` - Real-time regulatory changes

## 🔌 API Endpoints

### CA Dashboard Statistics
```
GET /api/ca/dashboard/stats
```
Returns real-time stats:
- Assigned companies count
- High-risk alerts
- Pending filings
- Monthly revenue
- Overdue dependencies

### Client Portfolio Management
```
GET /api/ca/clients/portfolio
POST /api/ca/clients
PUT /api/ca/clients/:id
```

### Government Data Integration
```
GET /api/government/gstn/search/:gstin
POST /api/government/calculate-health-score
GET /api/government/filing-requirements
```

### AI Drafting Engine
```
POST /api/ca/ai/draft-response
```
Request body:
```json
{
  "document_type": "gst_notice_reply",
  "input_document": "Notice content...",
  "instructions": "Additional instructions...",
  "client_id": "client_uuid"
}
```

## 🤖 Government API Integration

### GSTN API
- **Public Search**: Company information lookup
- **Returns Data**: Filing status and history
- **Compliance Tracking**: Automated health scoring

### MCA API
- **Company Master Data**: Director information, filings
- **ROC Data**: Registration details, compliance status
- **Annual Return**: Filing status tracking

### Income Tax API
- **PAN Verification**: Identity validation
- **TDS Returns**: Filing status
- **Compliance Status**: Tax payment history

## 💰 Payment Integration

### Razorpay Features
- **Revenue Tracking**: Monthly/yearly calculations
- **Client Billing**: Automated invoice generation
- **Payment Status**: Real-time payment updates
- **Analytics**: Revenue dashboards and reports

### Implementation
```javascript
// Create payment order
const order = await razorpay.orders.create({
  amount: amount * 100, // Amount in paisa
  currency: 'INR',
  client_id: clientId
});
```

## 🔔 Notification System

### WhatsApp Integration (Twilio)
```javascript
// Send WhatsApp reminder
await twilio.messages.create({
  from: 'whatsapp:+14155238886',
  to: `whatsapp:+91${clientPhone}`,
  body: reminderMessage
});
```

### Email Automation (Nodemailer)
- **Document Requests**: Automated follow-ups
- **Deadline Alerts**: Filing deadline reminders
- **Status Updates**: Task completion notifications

### SMS Notifications
- **Critical Alerts**: High-priority notifications
- **OTP Verification**: Multi-factor authentication
- **Instant Updates**: Real-time status changes

## 🤖 AI Drafting Engine

### OpenAI Integration
- **Model**: GPT-4 (configurable)
- **Use Cases**: 
  - GST notice replies
  - Audit responses
  - Legal opinions
  - Compliance letters

### Implementation
```javascript
const response = await openai.chat.completions.create({
  model: 'gpt-4',
  messages: [
    {
      role: 'system',
      content: 'You are a CA expert drafting legal responses...'
    },
    {
      role: 'user', 
      content: `Draft a reply for: ${inputDocument}`
    }
  ],
  max_tokens: 2000
});
```

## 📈 Health Score Calculation

### Formula
```javascript
const healthScore = (
  (onTimeFilings * 10) - 
  (delayedFilings * 5) - 
  (overdueFilings * 10)
) / totalFilings * 10;
```

### Risk Categories
- **90-100**: Low Risk (Green)
- **70-89**: Medium Risk (Yellow)
- **50-69**: High Risk (Orange)  
- **0-49**: Critical Risk (Red)

## 🔒 Security Features

### Authentication
- **JWT Tokens**: Secure API authentication
- **Role-based Access**: CA, Admin, Client roles
- **Session Management**: Secure session handling

### Data Protection
- **Encryption**: All sensitive data encrypted
- **API Rate Limiting**: Prevent abuse
- **Input Validation**: Joi schema validation
- **HTTPS Only**: TLS encryption enforced

## 📝 Environment Configuration

### Required API Keys
```bash
# Government APIs
GSTN_API_KEY=your_gstn_key
MCA_API_KEY=your_mca_key
INCOME_TAX_API_KEY=your_income_tax_key

# AI Integration
OPENAI_API_KEY=sk-your_openai_key

# Payment Gateway
RAZORPAY_KEY_ID=rzp_live_your_key
RAZORPAY_KEY_SECRET=your_secret

# Notifications
TWILIO_ACCOUNT_SID=your_twilio_sid
TWILIO_AUTH_TOKEN=your_token
```

## 🚀 Production Deployment

### Backend Deployment
1. Configure environment variables
2. Setup PostgreSQL database
3. Run database migrations
4. Deploy to production server
5. Configure HTTPS/SSL certificates

### Frontend Deployment  
1. Update API_BASE_URL for production
2. Build optimized bundle: `npm run build`
3. Deploy to Vercel/Netlify
4. Configure custom domain

## 📞 Support

For technical support or questions about the real CA dashboard:
- **Documentation**: See `/docs` folder
- **API Reference**: Available at `/api/docs` when server is running
- **Database Schema**: See `database-ca-dashboard.sql`

---

**⚠️ Important**: This is a **production system** with **real data integration**. Always test in development environment before deploying changes.

**🎯 Status**: Ready for production use with real CA firms and government API integration.
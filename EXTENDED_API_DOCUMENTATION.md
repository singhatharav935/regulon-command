# REGULON Extended API Documentation
## Complete Backend API Reference for Advanced Pages & Features
**Version 2.0** | Last Updated: March 2026

---

## Table of Contents
1. [Platform Pages API](#platform-pages-api)
2. [Solutions & Customers API](#solutions--customers-api)
3. [Security & Compliance API](#security--compliance-api)
4. [Learning Resources API](#learning-resources-api)
5. [Indian Regulatory Frameworks API](#indian-regulatory-frameworks-api)
6. [Dashboard & Analytics API](#dashboard--analytics-api)

---

## Platform Pages API

### 1. GET /api/platform/overview
Returns platform overview data for the Advanced Platform Page.

**Endpoint:** `GET /api/platform/overview`

**Authentication:** Required (Bearer Token)

**Response:**
```json
{
  "platform_name": "REGULON",
  "description": "Enterprise Regulatory Intelligence Platform",
  "version": "1.0.0",
  "status": "production",
  "uptime_percentage": 99.99,
  "transactions_processed": 2000000,
  "features_count": 50,
  "government_sources": 7,
  "avg_response_time_ms": 145,
  "timestamp": "2026-03-29T11:00:00Z"
}
```

**Status Code:** 200 OK

**Use Case:** Display on AdvancedPlatformPage hero section for real metrics

---

### 2. GET /api/platform/architecture
Returns detailed platform architecture information.

**Endpoint:** `GET /api/platform/architecture`

**Authentication:** Required (Bearer Token)

**Response:**
```json
{
  "layers": [
    {
      "name": "API Layer",
      "features": ["30+ REST Endpoints", "GraphQL Ready", "Real-time WebSockets"],
      "technologies": ["Express.js", "Node.js"],
      "status": "operational"
    },
    {
      "name": "Service Layer",
      "features": ["Authentication", "Compliance Engine", "Analytics"],
      "technologies": ["JWT", "Redis Cache"],
      "status": "operational"
    },
    {
      "name": "Data Layer",
      "features": ["PostgreSQL", "Redis Cache", "S3 Storage"],
      "technologies": ["PostgreSQL", "Redis", "AWS S3"],
      "status": "operational"
    },
    {
      "name": "Integration Layer",
      "features": ["Webhooks", "APIs", "Slack/Teams Integration"],
      "technologies": ["REST", "Webhooks", "OAuth 2.0"],
      "status": "operational"
    }
  ],
  "deployment": {
    "region": "Asia Pacific",
    "availability_zones": 3,
    "auto_scaling": true,
    "load_balancer": "active"
  }
}
```

**Status Code:** 200 OK

**Use Case:** Display on AdvancedPlatformPage architecture tab with visual diagrams

---

### 3. GET /api/platform/features
Returns platform features matrix across domains.

**Endpoint:** `GET /api/platform/features`

**Authentication:** Required (Bearer Token)

**Response:**
```json
{
  "real_time_intelligence": {
    "live_monitoring": "7 sources 24/7",
    "ai_analysis": "Impact assessment",
    "instant_alerts": "<2 min response"
  },
  "compliance_automation": {
    "smart_tasks": "Auto-generated",
    "deadline_management": "Never miss dates",
    "score_tracking": "Real-time metrics"
  },
  "enterprise_features": {
    "team_collaboration": "Multi-workspace",
    "security": "Enterprise-grade",
    "data_vault": "Secure storage"
  }
}
```

**Status Code:** 200 OK

---

### 4. GET /api/platform/roadmap
Returns product roadmap with upcoming features.

**Endpoint:** `GET /api/platform/roadmap`

**Authentication:** Required (Bearer Token)

**Response:**
```json
{
  "roadmap": [
    {
      "quarter": "Q2 2026",
      "items": ["Mobile App", "Advanced AI", "Custom Reports"],
      "status": "in_progress",
      "completion": 45
    },
    {
      "quarter": "Q3 2026",
      "items": ["Machine Learning", "Predictive Compliance", "Multi-language"],
      "status": "planned",
      "completion": 0
    },
    {
      "quarter": "Q4 2026",
      "items": ["Blockchain Audit", "Global Compliance", "Enterprise Suite"],
      "status": "planned",
      "completion": 0
    }
  ]
}
```

**Status Code:** 200 OK

---

## Solutions & Customers API

### 5. GET /api/solutions
Returns all industry solutions with metrics.

**Endpoint:** `GET /api/solutions`

**Authentication:** Required (Bearer Token)

**Response:**
```json
{
  "solutions": [
    {
      "id": "financial-services",
      "name": "Financial Services",
      "description": "Compliance for banks, NBFCs, fintech",
      "roi": "3.8x",
      "time_saved": "35%",
      "accuracy": "98.5%",
      "customers": 250
    },
    {
      "id": "legal-firms",
      "name": "Legal Firms",
      "description": "Compliance for law firms and legal departments",
      "roi": "4.2x",
      "time_saved": "42%",
      "accuracy": "99%",
      "customers": 180
    },
    {
      "id": "corporate",
      "name": "Corporate Compliance",
      "description": "Enterprise compliance management",
      "roi": "4.5x",
      "time_saved": "52%",
      "accuracy": "99.2%",
      "customers": 320
    },
    {
      "id": "ca-firms",
      "name": "CA Firms",
      "description": "Chartered accountant compliance automation",
      "roi": "3.9x",
      "time_saved": "38%",
      "accuracy": "98.8%",
      "customers": 150
    }
  ]
}
```

**Status Code:** 200 OK

**Use Case:** Display on AdvancedSolutionsPage with ROI cards

---

### 6. GET /api/solutions/:solutionId/case-study
Returns detailed case study for specific solution.

**Endpoint:** `GET /api/solutions/{solutionId}/case-study`

**Parameters:**
- `solutionId` (path): Solution ID (financial-services, legal-firms, corporate, ca-firms)

**Authentication:** Required (Bearer Token)

**Example:** `GET /api/solutions/financial-services/case-study`

**Response:**
```json
{
  "company": "TechBank Solutions",
  "industry": "Financial Services",
  "challenge": "Managing RBI, SEBI compliance across 50+ branches",
  "solution": "Automated compliance tracking with REGULON",
  "results": {
    "time_saved": "45%",
    "cost_reduced": "32%",
    "accuracy_improved": "99.2%",
    "roi": "3.8x",
    "implementation_time": "14 days"
  }
}
```

**Status Code:** 200 OK | 404 Not Found

---

### 7. GET /api/customers
Returns customer testimonials and statistics.

**Endpoint:** `GET /api/customers`

**Authentication:** Required (Bearer Token)

**Response:**
```json
{
  "total_customers": 1000,
  "retention_rate": "99%",
  "implementation_time_hours": 48,
  "tasks_automated_monthly": 15000,
  "testimonials": [
    {
      "id": "testimonial-1",
      "name": "Rajesh Kumar",
      "title": "CFO, TechBank Solutions",
      "company": "TechBank Solutions",
      "rating": 5,
      "quote": "REGULON transformed our compliance workflow. We now catch regulatory changes 10x faster.",
      "avatar": "https://api.dicebear.com/7.x/avataaars/svg?seed=rajesh"
    }
  ],
  "industries": {
    "Financial": 35,
    "Legal": 25,
    "Corporate": 30,
    "Others": 10
  }
}
```

**Status Code:** 200 OK

---

## Security & Compliance API

### 8. GET /api/security/features
Returns security features and certifications.

**Endpoint:** `GET /api/security/features`

**Authentication:** Required (Bearer Token)

**Response:**
```json
{
  "security_features": [
    {
      "name": "Data Encryption",
      "description": "AES-256 encryption for all data",
      "status": "active"
    },
    {
      "name": "Access Control",
      "description": "Role-based access control (RBAC)",
      "status": "active"
    }
  ],
  "certifications": [
    {
      "name": "ISO 27001",
      "issued_date": "2024-01-15",
      "valid_until": "2027-01-14",
      "status": "active"
    },
    {
      "name": "SOC 2 Type II",
      "issued_date": "2024-03-01",
      "valid_until": "2026-02-28",
      "status": "active"
    },
    {
      "name": "GDPR Compliance",
      "issued_date": "2024-01-01",
      "valid_until": "2026-01-31",
      "status": "active"
    },
    {
      "name": "HIPAA Compliance",
      "issued_date": "2024-02-15",
      "valid_until": "2027-02-14",
      "status": "active"
    },
    {
      "name": "PCI DSS Level 1",
      "issued_date": "2024-03-10",
      "valid_until": "2025-03-09",
      "status": "active"
    },
    {
      "name": "DPDP Act 2023",
      "issued_date": "2024-01-20",
      "valid_until": "2027-01-19",
      "status": "active"
    }
  ]
}
```

**Status Code:** 200 OK

**Use Case:** Display on AdvancedSecurityPage with certification badges

---

## Learning Resources API

### 9. GET /api/resources/documentation
Returns learning documentation and guides.

**Endpoint:** `GET /api/resources/documentation`

**Authentication:** Required (Bearer Token)

**Response:**
```json
{
  "documentation": [
    {
      "id": "guide-1",
      "title": "Getting Started Guide",
      "description": "Complete setup and configuration guide",
      "duration_minutes": 15,
      "level": "Beginner",
      "downloads": 2500,
      "url": "/docs/getting-started"
    },
    {
      "id": "guide-2",
      "title": "API Documentation",
      "description": "Complete REST API reference with examples",
      "duration_minutes": 45,
      "level": "Advanced",
      "downloads": 1800,
      "url": "/docs/api"
    }
  ]
}
```

**Status Code:** 200 OK

---

### 10. GET /api/resources/webinars
Returns webinars and workshops.

**Endpoint:** `GET /api/resources/webinars`

**Authentication:** Required (Bearer Token)

**Response:**
```json
{
  "webinars": [
    {
      "id": "webinar-1",
      "title": "Compliance Best Practices for CAs",
      "description": "Expert webinar on compliance automation",
      "duration_minutes": 60,
      "level": "All Levels",
      "date": "2026-04-15",
      "attendees": 3200,
      "status": "registered"
    }
  ]
}
```

**Status Code:** 200 OK

---

## Indian Regulatory Frameworks API

### 11. GET /api/regulatory-frameworks
Returns all Indian regulatory frameworks.

**Endpoint:** `GET /api/regulatory-frameworks`

**Authentication:** Required (Bearer Token)

**Response:**
```json
{
  "frameworks": [
    {
      "id": "gst",
      "name": "GST Compliance",
      "icon": "📋",
      "coverage": "All States",
      "authority": "GSTN",
      "description": "Goods and Services Tax compliance",
      "status": "active"
    },
    {
      "id": "income-tax",
      "name": "Income Tax India",
      "icon": "💰",
      "coverage": "Central",
      "authority": "Income Tax India",
      "description": "Federal income tax compliance",
      "status": "active"
    },
    {
      "id": "labour",
      "name": "Labour Compliance",
      "icon": "👷",
      "coverage": "State Level",
      "authority": "State Labour Department",
      "description": "Labour laws and employee compliance",
      "status": "active"
    },
    {
      "id": "mca",
      "name": "MCA Regulations",
      "icon": "🏢",
      "coverage": "Corporate",
      "authority": "Ministry of Corporate Affairs",
      "description": "Corporate governance and filing",
      "status": "active"
    },
    {
      "id": "rbi",
      "name": "RBI Guidelines",
      "icon": "🏦",
      "coverage": "Financial",
      "authority": "Reserve Bank of India",
      "description": "Banking and financial regulations",
      "status": "active"
    },
    {
      "id": "sebi",
      "name": "SEBI Standards",
      "icon": "📊",
      "coverage": "Securities",
      "authority": "Securities and Exchange Board",
      "description": "Securities market regulations",
      "status": "active"
    }
  ]
}
```

**Status Code:** 200 OK

**Use Case:** Display on landing page ComplianceShowcase for regulatory frameworks grid

---

### 12. GET /api/regulatory-frameworks/:frameworkId/details
Returns detailed information for specific framework.

**Endpoint:** `GET /api/regulatory-frameworks/{frameworkId}/details`

**Parameters:**
- `frameworkId` (path): Framework ID (gst, income-tax, labour, mca, rbi, sebi)

**Authentication:** Required (Bearer Token)

**Example:** `GET /api/regulatory-frameworks/gst/details`

**Response:**
```json
{
  "id": "gst",
  "name": "GST Compliance",
  "authority": "GSTN",
  "last_update": "2026-03-20",
  "active_notices": 12,
  "upcoming_deadlines": 5,
  "description": "Goods and Services Tax compliance across all states",
  "coverage": "Pan-India"
}
```

**Status Code:** 200 OK | 404 Not Found

---

### 13. GET /api/regulatory-alerts-by-framework
Returns alert count by regulatory framework.

**Endpoint:** `GET /api/regulatory-alerts-by-framework`

**Authentication:** Required (Bearer Token)

**Response:**
```json
{
  "alerts": [
    {
      "framework": "gst",
      "count": 12,
      "critical": 3,
      "warning": 5,
      "info": 4
    },
    {
      "framework": "income-tax",
      "count": 8,
      "critical": 1,
      "warning": 3,
      "info": 4
    },
    {
      "framework": "rbi",
      "count": 6,
      "critical": 2,
      "warning": 2,
      "info": 2
    }
  ]
}
```

**Status Code:** 200 OK

---

## Dashboard & Analytics API

### 14. GET /api/dashboard/overview
Returns dashboard overview metrics.

**Endpoint:** `GET /api/dashboard/overview`

**Authentication:** Required (Bearer Token)

**Response:**
```json
{
  "active_alerts": 26,
  "pending_tasks": 12,
  "compliance_score": 94.5,
  "frameworks_monitored": 6,
  "last_update": "2026-03-29T11:00:00Z",
  "critical_alerts": 3,
  "upcoming_deadlines": 5
}
```

**Status Code:** 200 OK

---

### 15. GET /api/dashboard/compliance-score
Returns compliance score trends and framework scores.

**Endpoint:** `GET /api/dashboard/compliance-score`

**Authentication:** Required (Bearer Token)

**Response:**
```json
{
  "current_score": 94.5,
  "target_score": 95,
  "trend": "up",
  "change": "+2.3%",
  "weekly_scores": [88.0, 89.5, 91.0, 92.3, 93.1, 93.8, 94.5],
  "framework_scores": {
    "gst": 96.2,
    "income-tax": 93.5,
    "labour": 92.0,
    "mca": 94.3,
    "rbi": 95.8,
    "sebi": 91.5
  }
}
```

**Status Code:** 200 OK

---

## Summary

**Total Endpoints:** 44+

| Category | Count | Status |
|----------|-------|--------|
| Authentication | 3 | Active |
| User Management | 5 | Active |
| Workspace Management | 5 | Active |
| Alert Management | 5 | Active |
| Compliance Tasks | 6 | Active |
| Document Vault | 4 | Active |
| Analytics | 3 | Active |
| Admin Dashboard | 2 | Active |
| Platform Pages | 4 | Active |
| Solutions & Customers | 2 | Active |
| Security | 1 | Active |
| Learning Resources | 2 | Active |
| Indian Frameworks | 3 | Active |
| Dashboard Analytics | 2 | Active |

---

## Error Handling

All endpoints follow standard HTTP status codes:

- **200 OK** - Request successful
- **400 Bad Request** - Invalid parameters
- **401 Unauthorized** - Missing or invalid token
- **403 Forbidden** - Insufficient permissions
- **404 Not Found** - Resource doesn't exist
- **500 Internal Server Error** - Server error

Error Response Format:
```json
{
  "error": "Error message",
  "details": "Additional details if applicable"
}
```

---

## Authentication

All endpoints (except `/api/health` and `/api/system/info`) require Bearer token authentication:

```
Authorization: Bearer <your-jwt-token>
```

Obtain token via `/api/auth/login` endpoint.

---

## Deployment Notes

✅ All endpoints are production-ready
✅ Supports Indian regulatory monitoring (7 sources)
✅ Integrates with advanced frontend pages
✅ Real-time data updates
✅ Comprehensive error handling
✅ CORS enabled for frontend integration

---

**Last Updated:** March 29, 2026
**Version:** 2.0
**Status:** Production Ready

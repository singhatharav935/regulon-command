# REGULON API Documentation

Complete REST API reference for REGULON - Advanced Regulatory Compliance Intelligence Platform.

**Base URL**: `http://localhost:3000/api`  
**Version**: 1.0.0  
**Last Updated**: March 2026

---

## Table of Contents

1. [Authentication](#authentication)
2. [Users](#users)
3. [Workspaces](#workspaces)
4. [Alerts & Regulatory Data](#alerts--regulatory-data)
5. [Compliance Tasks](#compliance-tasks)
6. [Documents](#documents)
7. [Analytics](#analytics)
8. [Regulatory Sources](#regulatory-sources)
9. [Admin](#admin)
10. [Error Handling](#error-handling)

---

## Authentication

### Overview

REGULON uses Bearer token authentication. Include your authentication token in the `Authorization` header of all requests:

```
Authorization: Bearer YOUR_TOKEN_HERE
```

Tokens expire after 7 days. Use the refresh endpoint to get a new token before expiration.

### Register New User

**POST** `/auth/register`

Create a new user account and workspace.

**Request Body**:
```json
{
  "email": "user@example.com",
  "name": "John Doe",
  "password": "secure_password",
  "role": "ca"
}
```

**Response** (201 Created):
```json
{
  "user": {
    "id": "user-abc123",
    "email": "user@example.com",
    "name": "John Doe",
    "role": "ca"
  },
  "token": "token_xyz789",
  "workspace": {
    "id": "ws-abc123",
    "name": "John Doe's Workspace"
  }
}
```

### Login

**POST** `/auth/login`

Authenticate with email and password.

**Request Body**:
```json
{
  "email": "user@example.com",
  "password": "secure_password"
}
```

**Response** (200 OK):
```json
{
  "user": {
    "id": "user-abc123",
    "email": "user@example.com",
    "name": "John Doe",
    "role": "ca"
  },
  "token": "token_xyz789",
  "workspace": {
    "id": "ws-abc123"
  }
}
```

### Logout

**POST** `/auth/logout`

Invalidate the current token.

**Response** (200 OK):
```json
{
  "message": "Logged out successfully"
}
```

---

## Users

### Get Current User

**GET** `/users/me`

Retrieve the authenticated user's profile.

**Response** (200 OK):
```json
{
  "id": "user-abc123",
  "email": "user@example.com",
  "name": "John Doe",
  "role": "ca",
  "workspace_id": "ws-abc123",
  "created_at": "2026-03-01T10:00:00Z"
}
```

### Update Current User

**PUT** `/users/me`

Update user profile information.

**Request Body**:
```json
{
  "name": "John Doe Smith",
  "email": "newemail@example.com"
}
```

**Response** (200 OK):
```json
{
  "id": "user-abc123",
  "email": "newemail@example.com",
  "name": "John Doe Smith",
  "role": "ca"
}
```

---

## Workspaces

### List Workspaces

**GET** `/workspaces`

Get all workspaces for the authenticated user.

**Response** (200 OK):
```json
[
  {
    "id": "ws-abc123",
    "name": "Primary Workspace",
    "owner_id": "user-abc123",
    "industry": "Financial Services",
    "company_size": "large",
    "created_at": "2026-03-01T10:00:00Z"
  }
]
```

### Get Workspace

**GET** `/workspaces/:id`

Get details for a specific workspace.

**Response** (200 OK):
```json
{
  "id": "ws-abc123",
  "name": "Primary Workspace",
  "owner_id": "user-abc123",
  "industry": "Financial Services",
  "company_size": "large",
  "created_at": "2026-03-01T10:00:00Z"
}
```

### Update Workspace

**PUT** `/workspaces/:id`

Update workspace settings.

**Request Body**:
```json
{
  "name": "Updated Workspace",
  "industry": "Fintech",
  "company_size": "medium"
}
```

**Response** (200 OK):
```json
{
  "id": "ws-abc123",
  "name": "Updated Workspace",
  "owner_id": "user-abc123",
  "industry": "Fintech",
  "company_size": "medium",
  "created_at": "2026-03-01T10:00:00Z"
}
```

---

## Alerts & Regulatory Data

### List Alerts

**GET** `/alerts`

Retrieve regulatory alerts with optional filtering.

**Query Parameters**:
- `source` (string): Filter by source (GSTN, RBI, Income Tax, MCA, SEBI, CBIC, eGazette)
- `priority` (string): Filter by priority (high, medium, low)
- `status` (string): Filter by status (active, resolved, archived)
- `limit` (number): Maximum results to return (default: 50, max: 500)

**Example**: `GET /alerts?source=GSTN&priority=high&limit=20`

**Response** (200 OK):
```json
{
  "total": 15,
  "alerts": [
    {
      "id": "alert-001",
      "source": "GSTN",
      "title": "GST Rate Amendment - Electronics Category",
      "summary": "Rate change for electronic goods effective April 1",
      "priority": "high",
      "status": "active",
      "category": "tax-law-change",
      "published_date": "2026-03-25",
      "effective_date": "2026-04-01",
      "deadline": "2026-03-31",
      "source_url": "https://www.gst.gov.in",
      "impact_score": 8,
      "created_at": "2026-03-25T10:00:00Z"
    }
  ]
}
```

### Get Single Alert

**GET** `/alerts/:id`

Retrieve details for a specific alert.

**Response** (200 OK):
```json
{
  "id": "alert-001",
  "source": "GSTN",
  "title": "GST Rate Amendment - Electronics Category",
  "summary": "Rate change for electronic goods effective April 1",
  "priority": "high",
  "status": "active",
  "category": "tax-law-change",
  "published_date": "2026-03-25",
  "effective_date": "2026-04-01",
  "deadline": "2026-03-31",
  "source_url": "https://www.gst.gov.in",
  "impact_score": 8,
  "created_at": "2026-03-25T10:00:00Z"
}
```

### Update Alert Status

**PUT** `/alerts/:id`

Update alert priority or status.

**Request Body**:
```json
{
  "status": "resolved",
  "priority": "medium"
}
```

**Response** (200 OK):
```json
{
  "id": "alert-001",
  "status": "resolved",
  "priority": "medium"
}
```

### Delete Alert

**DELETE** `/alerts/:id`

Remove an alert from the system.

**Response** (200 OK):
```json
{
  "message": "Alert deleted successfully"
}
```

---

## Compliance Tasks

### List Tasks

**GET** `/compliance-tasks`

Get compliance tasks with optional filtering.

**Query Parameters**:
- `status` (string): Filter by status (pending, in_progress, completed)
- `assignee` (string): Filter by assignee user ID
- `limit` (number): Maximum results (default: 50)

**Response** (200 OK):
```json
{
  "total": 10,
  "tasks": [
    {
      "id": "task-001",
      "workspace_id": "ws-abc123",
      "alert_id": "alert-001",
      "title": "Review GST Rate Changes",
      "status": "in_progress",
      "priority": "high",
      "assignee_id": "user-abc123",
      "deadline": "2026-03-28",
      "created_at": "2026-03-25T10:00:00Z"
    }
  ]
}
```

### Create Task

**POST** `/compliance-tasks`

Create a new compliance task.

**Request Body**:
```json
{
  "alert_id": "alert-001",
  "title": "Review and Update GST Procedures",
  "priority": "high",
  "assignee_id": "user-abc123",
  "deadline": "2026-04-15"
}
```

**Response** (201 Created):
```json
{
  "id": "task-002",
  "workspace_id": "ws-abc123",
  "alert_id": "alert-001",
  "title": "Review and Update GST Procedures",
  "status": "pending",
  "priority": "high",
  "assignee_id": "user-abc123",
  "deadline": "2026-04-15",
  "created_at": "2026-03-25T10:00:00Z"
}
```

### Get Task

**GET** `/compliance-tasks/:id`

Retrieve a specific task.

**Response** (200 OK):
```json
{
  "id": "task-001",
  "workspace_id": "ws-abc123",
  "alert_id": "alert-001",
  "title": "Review GST Rate Changes",
  "status": "in_progress",
  "priority": "high",
  "assignee_id": "user-abc123",
  "deadline": "2026-03-28",
  "created_at": "2026-03-25T10:00:00Z"
}
```

### Update Task

**PUT** `/compliance-tasks/:id`

Update task details.

**Request Body**:
```json
{
  "status": "completed",
  "priority": "medium"
}
```

**Response** (200 OK):
```json
{
  "id": "task-001",
  "status": "completed",
  "priority": "medium"
}
```

### Delete Task

**DELETE** `/compliance-tasks/:id`

Remove a task.

**Response** (200 OK):
```json
{
  "message": "Task deleted successfully"
}
```

---

## Documents

### Upload Document

**POST** `/documents/upload`

Upload a compliance document.

**Request Body**:
```json
{
  "name": "GST_Audit_Report_2026.pdf",
  "category": "audit",
  "content_type": "application/pdf"
}
```

**Response** (201 Created):
```json
{
  "id": "doc-001",
  "workspace_id": "ws-abc123",
  "name": "GST_Audit_Report_2026.pdf",
  "category": "audit",
  "content_type": "application/pdf",
  "uploaded_by": "user-abc123",
  "uploaded_at": "2026-03-25T10:00:00Z",
  "size": 2048576
}
```

### List Documents

**GET** `/documents`

Get all documents in the workspace.

**Response** (200 OK):
```json
{
  "total": 5,
  "documents": [
    {
      "id": "doc-001",
      "workspace_id": "ws-abc123",
      "name": "GST_Audit_Report_2026.pdf",
      "category": "audit",
      "content_type": "application/pdf",
      "uploaded_by": "user-abc123",
      "uploaded_at": "2026-03-25T10:00:00Z",
      "size": 2048576
    }
  ]
}
```

### Get Document

**GET** `/documents/:id`

Retrieve a specific document.

**Response** (200 OK):
```json
{
  "id": "doc-001",
  "workspace_id": "ws-abc123",
  "name": "GST_Audit_Report_2026.pdf",
  "category": "audit",
  "content_type": "application/pdf",
  "uploaded_by": "user-abc123",
  "uploaded_at": "2026-03-25T10:00:00Z",
  "size": 2048576
}
```

### Delete Document

**DELETE** `/documents/:id`

Remove a document.

**Response** (200 OK):
```json
{
  "message": "Document deleted successfully"
}
```

---

## Analytics

### Compliance Metrics

**GET** `/analytics/compliance-metrics`

Get overall compliance metrics and scores.

**Response** (200 OK):
```json
{
  "overall_score": 94,
  "task_completion_rate": 85,
  "total_alerts": 50,
  "active_alerts": 12,
  "high_priority_alerts": 3,
  "total_tasks": 20,
  "completed_tasks": 17,
  "pending_tasks": 2,
  "in_progress_tasks": 1
}
```

### Source Summary

**GET** `/analytics/source-summary`

Get alert summary by source.

**Response** (200 OK):
```json
{
  "GSTN": {
    "total": 15,
    "high": 2,
    "medium": 5,
    "low": 8
  },
  "RBI": {
    "total": 10,
    "high": 1,
    "medium": 4,
    "low": 5
  }
}
```

### Alert Trends

**GET** `/analytics/alert-trends`

Get alert trends over time.

**Response** (200 OK):
```json
[
  {
    "date": "2026-03-20",
    "count": 5
  },
  {
    "date": "2026-03-21",
    "count": 8
  },
  {
    "date": "2026-03-22",
    "count": 3
  }
]
```

---

## Regulatory Sources

### Source Status

**GET** `/regulatory-sources/status`

Get real-time status of all monitoring sources.

**Response** (200 OK):
```json
{
  "timestamp": "2026-03-25T10:00:00Z",
  "status": "syncing",
  "sources": [
    {
      "name": "GSTN",
      "status": "active",
      "last_fetch": "2026-03-25T09:55:00Z",
      "notice_count": 15,
      "next_fetch": "2026-03-25T10:00:00Z"
    },
    {
      "name": "RBI",
      "status": "active",
      "last_fetch": "2026-03-25T09:52:00Z",
      "notice_count": 10,
      "next_fetch": "2026-03-25T10:00:00Z"
    }
  ],
  "total_notices": 66
}
```

---

## Admin

### System Health

**GET** `/admin/system-health`

Get overall system health and performance metrics. *(Admin only)*

**Response** (200 OK):
```json
{
  "status": "healthy",
  "timestamp": "2026-03-25T10:00:00Z",
  "uptime": 864000,
  "memory": {
    "total": 4850,
    "alerts": 50,
    "tasks": 100,
    "documents": 250
  },
  "sources": {
    "total": 7,
    "active": 7,
    "last_sync": "2026-03-25T09:55:00Z"
  }
}
```

### Platform Stats

**GET** `/admin/stats`

Get overall platform statistics. *(Admin only)*

**Response** (200 OK):
```json
{
  "total_users": 1245,
  "total_workspaces": 450,
  "total_alerts": 5234,
  "total_tasks": 2847,
  "total_documents": 12456,
  "active_sessions": 234,
  "timestamp": "2026-03-25T10:00:00Z"
}
```

---

## Error Handling

All errors return a JSON response with an error message and HTTP status code.

### Common Error Responses

**401 Unauthorized**
```json
{
  "error": "Unauthorized",
  "message": "Invalid or expired token"
}
```

**403 Forbidden**
```json
{
  "error": "Forbidden",
  "message": "Insufficient permissions"
}
```

**404 Not Found**
```json
{
  "error": "Not found",
  "message": "Resource not found"
}
```

**400 Bad Request**
```json
{
  "error": "Bad Request",
  "message": "Missing required fields"
}
```

**500 Internal Server Error**
```json
{
  "error": "Internal server error",
  "message": "An unexpected error occurred"
}
```

---

## Rate Limiting

- **Rate Limit**: 1,000 requests per hour per user
- **Headers**: `X-RateLimit-Limit`, `X-RateLimit-Remaining`, `X-RateLimit-Reset`
- **Status Code**: 429 Too Many Requests when exceeded

---

## Pagination

List endpoints support pagination:

**Query Parameters**:
- `limit`: Items per page (default: 50, max: 500)
- `offset`: Number of items to skip (default: 0)

**Response Format**:
```json
{
  "total": 100,
  "limit": 50,
  "offset": 0,
  "items": []
}
```

---

## Webhooks

Register webhooks to receive real-time events.

**Supported Events**:
- `alert.created` - New alert detected
- `task.assigned` - Task assigned to user
- `task.completed` - Task marked complete
- `source.sync_failed` - Source sync failed
- `compliance_score.changed` - Compliance score updated

To register a webhook:

**POST** `/webhooks/register`

```json
{
  "url": "https://yourapp.com/webhook",
  "events": ["alert.created", "task.assigned"]
}
```

---

## SDK & Libraries

**Official SDKs**:
- [JavaScript/Node.js](https://github.com/regulon/sdk-js)
- [Python](https://github.com/regulon/sdk-python)
- [Go](https://github.com/regulon/sdk-go)

---

## Support

- **Documentation**: https://docs.regulon.in
- **Status Page**: https://status.regulon.in
- **Email Support**: support@regulon.in
- **Community Forum**: https://community.regulon.in

---

**Last Updated**: March 29, 2026  
**API Version**: 1.0.0  
**Status**: ✅ Production Ready

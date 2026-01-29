# RIVET API Specification

REST API for the web dashboard (Phase 2).

---

## 📋 Table of Contents

- [Overview](#overview)
- [Authentication](#authentication)
- [Projects](#projects)
- [Scans](#scans)
- [Issues](#issues)
- [Fixes](#fixes)
- [Dependencies](#dependencies)
- [Flows](#flows)
- [Analytics](#analytics)
- [Webhooks](#webhooks)
- [Rate Limits](#rate-limits)

---

## 🔍 Overview

### Base URL
```
https://api.rivet.dev/v1
```

### Protocol
REST with JSON payloads

### WebSocket
Real-time scan updates:
```
wss://api.rivet.dev/v1/ws
```

---

## 🔐 Authentication

All requests require an API key in the Authorization header:

```http
Authorization: Bearer <api-key>
```

### Get API Key
```http
POST /auth/login
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "********"
}
```

**Response:**
```json
{
  "apiKey": "rvt_abc123...",
  "expiresIn": 2592000,
  "user": {
    "id": "usr_123",
    "email": "user@example.com",
    "plan": "pro"
  }
}
```

---

## 📁 Projects

### List Projects
```http
GET /projects
```

**Response:**
```json
{
  "projects": [
    {
      "id": "prj_abc123",
      "name": "my-app",
      "repository": "github.com/user/my-app",
      "language": "typescript",
      "framework": "react",
      "lastScan": "2026-01-15T10:30:00Z",
      "score": 72,
      "criticalIssues": 2
    }
  ],
  "total": 5,
  "page": 1,
  "pageSize": 20
}
```

### Create Project
```http
POST /projects
Content-Type: application/json

{
  "name": "my-app",
  "repository": "github.com/user/my-app",
  "settings": {
    "engines": ["security", "bugs", "smells"],
    "autoFix": true
  }
}
```

**Response:**
```json
{
  "id": "prj_abc123",
  "name": "my-app",
  "apiKey": "prj_key_abc123...",
  "webhookUrl": "https://api.rivet.dev/v1/webhooks/prj_abc123"
}
```

### Get Project
```http
GET /projects/:id
```

**Response:**
```json
{
  "id": "prj_abc123",
  "name": "my-app",
  "repository": "github.com/user/my-app",
  "language": "typescript",
  "framework": "react",
  "createdAt": "2026-01-01T00:00:00Z",
  "lastScan": "2026-01-15T10:30:00Z",
  "score": 72,
  "trend": {
    "week": +4,
    "month": +12
  },
  "stats": {
    "filesScanned": 245,
    "linesOfCode": 15420,
    "issuesTotal": 23,
    "issuesBySeverity": {
      "critical": 2,
      "high": 5,
      "medium": 16,
      "low": 0
    }
  },
  "settings": {
    "engines": {
      "security": { "enabled": true },
      "bugs": { "enabled": true },
      "smells": { "enabled": true }
    },
    "autoFix": {
      "safe": true,
      "interactive": false
    }
  }
}
```

### Update Project
```http
PATCH /projects/:id
Content-Type: application/json

{
  "settings": {
    "autoFix": {
      "safe": true
    }
  }
}
```

### Delete Project
```http
DELETE /projects/:id
```

---

## 🔍 Scans

### Trigger Scan
```http
POST /projects/:projectId/scans
Content-Type: application/json

{
  "branch": "main",
  "commit": "abc123...",
  "engines": ["security", "bugs"],
  "options": {
    "fast": false,
    "autoFix": true
  }
}
```

**Response:**
```json
{
  "scanId": "scn_xyz789",
  "status": "queued",
  "estimatedDuration": 45,
  "websocketUrl": "wss://api.rivet.dev/v1/ws/scn_xyz789"
}
```

### Get Scan Status
```http
GET /scans/:scanId
```

**Response:**
```json
{
  "id": "scn_xyz789",
  "projectId": "prj_abc123",
  "status": "running",
  "progress": 65,
  "currentStep": "Analyzing security issues...",
  "startedAt": "2026-01-15T10:30:00Z",
  "estimatedCompletion": "2026-01-15T10:31:30Z"
}
```

**Status values:** `queued`, `running`, `completed`, `failed`

### Get Scan Results
```http
GET /scans/:scanId/results
```

**Response:**
```json
{
  "scanId": "scn_xyz789",
  "projectId": "prj_abc123",
  "completedAt": "2026-01-15T10:31:15Z",
  "duration": 75,
  "score": 72,
  "scoreDelta": +4,
  "summary": {
    "filesScanned": 245,
    "issuesFound": 23,
    "issuesFixed": 12,
    "newIssues": 3,
    "resolvedIssues": 7
  },
  "issues": [
    {
      "id": "iss_abc123",
      "category": "security",
      "severity": "critical",
      "title": "SQL Injection",
      "file": "src/auth.ts",
      "line": 42,
      "column": 15,
      "message": "User input flows directly into SQL query",
      "codeSnippet": "db.query(`SELECT * FROM users WHERE id=${id}`)",
      "explanation": "...",
      "fix": {
        "available": true,
        "safe": false,
        "preview": "db.query('SELECT * FROM users WHERE id=?', [id])"
      }
    }
  ],
  "engines": {
    "security": {
      "duration": 12,
      "issuesFound": 5
    },
    "bugs": {
      "duration": 8,
      "issuesFound": 8
    }
  }
}
```

### List Scans
```http
GET /projects/:projectId/scans?page=1&pageSize=20
```

### Cancel Scan
```http
POST /scans/:scanId/cancel
```

---

## 🐛 Issues

### List Issues
```http
GET /projects/:projectId/issues?severity=critical&status=open
```

**Query Parameters:**
- `severity` - Filter by severity (critical, high, medium, low)
- `status` - Filter by status (open, fixed, ignored, resolved)
- `category` - Filter by category (security, bugs, smells, etc.)
- `file` - Filter by file path
- `page` - Page number (default: 1)
- `pageSize` - Items per page (default: 20)

**Response:**
```json
{
  "issues": [
    {
      "id": "iss_abc123",
      "projectId": "prj_abc123",
      "category": "security",
      "severity": "critical",
      "status": "open",
      "title": "SQL Injection",
      "file": "src/auth.ts",
      "line": 42,
      "detectedAt": "2026-01-15T10:30:00Z",
      "lastSeenAt": "2026-01-15T10:30:00Z",
      "occurrences": 3
    }
  ],
  "total": 23,
  "page": 1,
  "pageSize": 20
}
```

### Get Issue Details
```http
GET /issues/:issueId
```

**Response:**
```json
{
  "id": "iss_abc123",
  "projectId": "prj_abc123",
  "category": "security",
  "severity": "critical",
  "status": "open",
  "title": "SQL Injection",
  "description": "User input flows directly into SQL query without sanitization",
  "file": "src/auth.ts",
  "line": 42,
  "column": 15,
  "codeSnippet": {
    "before": "const userId = req.params.id\n",
    "highlighted": "db.query(`SELECT * FROM users WHERE id=${id}`)",
    "after": "return user\n"
  },
  "explanation": {
    "whatIsWrong": "...",
    "whyItMatters": "...",
    "howToFix": "...",
    "analogy": "...",
    "references": [
      {
        "title": "OWASP SQL Injection",
        "url": "https://owasp.org/..."
      }
    ]
  },
  "fix": {
    "available": true,
    "safe": false,
    "automated": true,
    "preview": "db.query('SELECT * FROM users WHERE id=?', [id])",
    "diff": "..."
  },
  "history": [
    {
      "scanId": "scn_xyz789",
      "detectedAt": "2026-01-15T10:30:00Z",
      "status": "open"
    }
  ],
  "relatedIssues": ["iss_def456", "iss_ghi789"]
}
```

### Update Issue Status
```http
PATCH /issues/:issueId
Content-Type: application/json

{
  "status": "ignored",
  "reason": "False positive - input is already validated"
}
```

### Bulk Update Issues
```http
POST /issues/bulk
Content-Type: application/json

{
  "issueIds": ["iss_abc123", "iss_def456"],
  "action": "ignore",
  "reason": "Not applicable"
}
```

---

## 🔧 Fixes

### Preview Fix
```http
GET /issues/:issueId/fix/preview
```

**Response:**
```json
{
  "issueId": "iss_abc123",
  "safe": false,
  "automated": true,
  "changes": [
    {
      "file": "src/auth.ts",
      "diff": "...",
      "preview": "db.query('SELECT * FROM users WHERE id=?', [id])"
    }
  ],
  "warnings": [
    "This fix requires manual verification"
  ]
}
```

### Apply Fix
```http
POST /issues/:issueId/fix
Content-Type: application/json

{
  "createPullRequest": true,
  "branch": "rivet/fix-sql-injection"
}
```

**Response:**
```json
{
  "status": "applied",
  "pullRequest": {
    "url": "https://github.com/user/repo/pull/123",
    "number": 123
  }
}
```

### Bulk Fix
```http
POST /projects/:projectId/fixes/bulk
Content-Type: application/json

{
  "filters": {
    "severity": ["critical", "high"],
    "safeOnly": true
  },
  "createPullRequest": true
}
```

---

## 📦 Dependencies

### Get Dependency Health
```http
GET /projects/:projectId/dependencies
```

**Response:**
```json
{
  "projectId": "prj_abc123",
  "totalPackages": 142,
  "outdated": 23,
  "vulnerable": 3,
  "unused": 8,
  "totalSize": 350720,
  "packages": [
    {
      "name": "express",
      "current": "4.17.1",
      "latest": "4.18.2",
      "type": "direct",
      "vulnerabilities": [
        {
          "id": "CVE-2022-24999",
          "severity": "critical",
          "title": "CSRF vulnerability",
          "fixedIn": "4.18.2"
        }
      ],
      "updateType": "patch",
      "breaking": false
    }
  ]
}
```

### Update Dependencies
```http
POST /projects/:projectId/dependencies/update
Content-Type: application/json

{
  "packages": ["express", "lodash"],
  "strategy": "safe",
  "createPullRequest": true
}
```

**Strategy values:** `safe` (patches only), `minor`, `major`

### Check Licenses
```http
GET /projects/:projectId/dependencies/licenses
```

**Response:**
```json
{
  "projectLicense": "MIT",
  "compatible": 125,
  "incompatible": 2,
  "unknown": 3,
  "details": [
    {
      "package": "gpl-library",
      "license": "GPL-3.0",
      "compatible": false,
      "reason": "Copyleft license conflicts with MIT"
    }
  ]
}
```

---

## 🔄 Flows

### List Flows
```http
GET /projects/:projectId/flows
```

**Response:**
```json
{
  "flows": [
    {
      "id": "flw_abc123",
      "name": "User Registration",
      "critical": false,
      "steps": 4,
      "coverage": 95,
      "status": "covered",
      "lastTested": "2026-01-15T10:30:00Z"
    },
    {
      "id": "flw_def456",
      "name": "Payment Flow",
      "critical": true,
      "steps": 5,
      "coverage": 0,
      "status": "untested",
      "lastTested": null
    }
  ],
  "summary": {
    "total": 15,
    "covered": 12,
    "partial": 2,
    "untested": 1,
    "averageCoverage": 78
  }
}
```

### Get Flow Details
```http
GET /flows/:flowId
```

**Response:**
```json
{
  "id": "flw_abc123",
  "projectId": "prj_abc123",
  "name": "User Registration",
  "critical": false,
  "coverage": 95,
  "steps": [
    {
      "name": "Navigate to signup",
      "url": "/signup",
      "tested": true
    },
    {
      "name": "Fill registration form",
      "tested": true
    },
    {
      "name": "Verify email",
      "tested": true
    },
    {
      "name": "Complete profile",
      "tested": false
    }
  ],
  "tests": [
    {
      "file": "tests/e2e/registration.spec.ts",
      "coverage": ["step1", "step2", "step3"]
    }
  ]
}
```

### Generate Flow Tests
```http
POST /flows/:flowId/generate-tests
Content-Type: application/json

{
  "framework": "playwright",
  "createPullRequest": true
}
```

---

## 📊 Analytics

### Get Project Trends
```http
GET /projects/:projectId/analytics/trends?period=month
```

**Response:**
```json
{
  "period": "month",
  "score": {
    "current": 72,
    "trend": [68, 69, 70, 71, 72],
    "change": +4
  },
  "issues": {
    "trend": [30, 28, 26, 25, 23],
    "change": -7
  },
  "categories": {
    "security": { "current": 5, "change": -2 },
    "bugs": { "current": 8, "change": -3 },
    "smells": { "current": 10, "change": -2 }
  }
}
```

### Get Team Metrics
```http
GET /teams/:teamId/analytics
```

**Response:**
```json
{
  "teamId": "tm_abc123",
  "projects": 12,
  "totalIssues": 345,
  "averageScore": 74,
  "topIssues": [
    {
      "category": "security",
      "count": 45,
      "percentage": 13
    }
  ],
  "projectLeaderboard": [
    {
      "projectId": "prj_abc123",
      "name": "flagship-app",
      "score": 89
    }
  ]
}
```

---

## 🪝 Webhooks

### Create Webhook
```http
POST /projects/:projectId/webhooks
Content-Type: application/json

{
  "url": "https://your-app.com/webhooks/rivet",
  "events": ["scan.completed", "issue.detected"],
  "secret": "whsec_..."
}
```

### Webhook Events

#### `scan.completed`
```json
{
  "event": "scan.completed",
  "timestamp": "2026-01-15T10:31:15Z",
  "data": {
    "scanId": "scn_xyz789",
    "projectId": "prj_abc123",
    "score": 72,
    "scoreDelta": +4,
    "issuesFound": 23,
    "newIssues": 3
  }
}
```

#### `issue.detected`
```json
{
  "event": "issue.detected",
  "timestamp": "2026-01-15T10:30:00Z",
  "data": {
    "issueId": "iss_abc123",
    "projectId": "prj_abc123",
    "severity": "critical",
    "category": "security",
    "title": "SQL Injection",
    "file": "src/auth.ts"
  }
}
```

#### `issue.fixed`
```json
{
  "event": "issue.fixed",
  "timestamp": "2026-01-15T10:35:00Z",
  "data": {
    "issueId": "iss_abc123",
    "projectId": "prj_abc123",
    "fixMethod": "automated"
  }
}
```

### Webhook Signature Verification

```javascript
const crypto = require('crypto')

function verifyWebhook(payload, signature, secret) {
  const hmac = crypto.createHmac('sha256', secret)
  const digest = hmac.update(payload).digest('hex')
  return crypto.timingSafeEqual(
    Buffer.from(signature),
    Buffer.from(digest)
  )
}

// Express middleware
app.post('/webhooks/rivet', (req, res) => {
  const signature = req.headers['x-rivet-signature']
  const isValid = verifyWebhook(
    JSON.stringify(req.body),
    signature,
    process.env.RIVET_WEBHOOK_SECRET
  )
  
  if (!isValid) {
    return res.status(401).send('Invalid signature')
  }
  
  // Process webhook
  res.sendStatus(200)
})
```

---

## 🚦 Rate Limits

### Limits by Plan

| Plan | Requests/hour | Scans/day | Projects |
|------|--------------|-----------|----------|
| Free | 60 | 5 | 1 |
| Pro | 1000 | 50 | 10 |
| Team | 5000 | Unlimited | 50 |
| Enterprise | Unlimited | Unlimited | Unlimited |

### Rate Limit Headers

```http
X-RateLimit-Limit: 1000
X-RateLimit-Remaining: 999
X-RateLimit-Reset: 1610712000
```

### Error Response

```json
{
  "error": "rate_limit_exceeded",
  "message": "API rate limit exceeded",
  "retryAfter": 3600
}
```

---

## 🔌 WebSocket API

### Connect
```javascript
const ws = new WebSocket('wss://api.rivet.dev/v1/ws')

ws.onopen = () => {
  ws.send(JSON.stringify({
    type: 'authenticate',
    apiKey: 'rvt_abc123...'
  }))
}
```

### Subscribe to Scan Updates
```javascript
ws.send(JSON.stringify({
  type: 'subscribe',
  channel: 'scan',
  scanId: 'scn_xyz789'
}))

ws.onmessage = (event) => {
  const message = JSON.parse(event.data)
  
  switch (message.type) {
    case 'scan.progress':
      console.log(`Progress: ${message.progress}%`)
      break
      
    case 'scan.completed':
      console.log('Scan complete!', message.results)
      break
  }
}
```

---

## 📝 Error Responses

### Standard Error Format
```json
{
  "error": "error_code",
  "message": "Human-readable message",
  "details": {
    "field": "Additional context"
  },
  "requestId": "req_abc123"
}
```

### Error Codes

| Code | Status | Description |
|------|--------|-------------|
| `invalid_request` | 400 | Malformed request |
| `unauthorized` | 401 | Invalid/missing API key |
| `forbidden` | 403 | Insufficient permissions |
| `not_found` | 404 | Resource not found |
| `rate_limit_exceeded` | 429 | Too many requests |
| `internal_error` | 500 | Server error |
| `service_unavailable` | 503 | Temporary outage |

---

## 🧪 Example: Complete Integration

```typescript
import axios from 'axios'

const client = axios.create({
  baseURL: 'https://api.rivet.dev/v1',
  headers: {
    'Authorization': `Bearer ${process.env.RIVET_API_KEY}`
  }
})

async function analyzePullRequest(repoUrl: string, branch: string) {
  // 1. Create project
  const { data: project } = await client.post('/projects', {
    name: 'my-app',
    repository: repoUrl
  })
  
  // 2. Trigger scan
  const { data: scan } = await client.post(
    `/projects/${project.id}/scans`,
    { branch }
  )
  
  // 3. Wait for completion
  let scanStatus = 'running'
  while (scanStatus === 'running') {
    const { data } = await client.get(`/scans/${scan.scanId}`)
    scanStatus = data.status
    await new Promise(resolve => setTimeout(resolve, 5000))
  }
  
  // 4. Get results
  const { data: results } = await client.get(
    `/scans/${scan.scanId}/results`
  )
  
  // 5. Auto-fix safe issues
  if (results.issues.some(i => i.fix?.safe)) {
    await client.post(`/projects/${project.id}/fixes/bulk`, {
      filters: { safeOnly: true },
      createPullRequest: true
    })
  }
  
  return results
}
```

---

**Build powerful integrations. Automate code quality.** 🔩

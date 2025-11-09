# API Documentation

## Overview

Lightpoint uses tRPC for type-safe API communication between frontend and backend.

## Base URL

- **Development**: http://localhost:3004/api/trpc
- **Production**: https://your-app.railway.app/api/trpc

## Authentication

Currently using mock authentication. In production, integrate with:
- Supabase Auth
- Auth0
- Clerk
- Or your preferred auth provider

## API Endpoints (tRPC Procedures)

### Complaints

#### `complaints.create`

Create a new complaint.

**Input:**
```typescript
{
  organizationId: string;
  createdBy: string;
  clientReference: string;
  complaintType?: string;
  hmrcDepartment?: string;
}
```

**Returns:**
```typescript
{
  id: string;
  organization_id: string;
  created_by: string;
  client_reference: string;
  status: 'assessment';
  complaint_type: string | null;
  hmrc_department: string | null;
  created_at: string;
  updated_at: string;
  timeline: any[];
  metadata: Record<string, any>;
}
```

#### `complaints.list`

List complaints for an organization.

**Input:**
```typescript
{
  organizationId: string;
  status?: 'assessment' | 'draft' | 'active' | 'escalated' | 'resolved' | 'closed';
}
```

**Returns:** Array of complaints

#### `complaints.getById`

Get a specific complaint by ID.

**Input:** `string` (complaint ID)

**Returns:** Complaint object

#### `complaints.updateStatus`

Update complaint status.

**Input:**
```typescript
{
  id: string;
  status: 'assessment' | 'draft' | 'active' | 'escalated' | 'resolved' | 'closed';
}
```

#### `complaints.addTimelineEvent`

Add an event to complaint timeline.

**Input:**
```typescript
{
  complaintId: string;
  event: {
    date: string;
    type: string;
    summary: string;
    responseDeadline?: string;
  };
}
```

### Analysis

#### `analysis.analyzeDocument`

Analyze a document for violations and precedents.

**Input:**
```typescript
{
  documentId: string;
}
```

**Returns:**
```typescript
{
  analysis: {
    hasGrounds: boolean;
    violations: Array<{
      type: string;
      description: string;
      citation: string;
    }>;
    actions: string[];
    successRate: number;
    reasoning: string;
  };
  guidance: Array<KnowledgeBase>;
  precedents: Array<Precedent>;
}
```

### Letters

#### `letters.generateComplaint`

Generate a formal complaint letter.

**Input:**
```typescript
{
  complaintId: string;
  analysis: AnalysisResult;
}
```

**Returns:**
```typescript
{
  letter: string;
}
```

#### `letters.generateResponse`

Generate a response to HMRC correspondence.

**Input:**
```typescript
{
  complaintId: string;
  correspondence: string;
  responseType: 'acknowledgement' | 'rebuttal' | 'escalation';
}
```

**Returns:**
```typescript
{
  response: string;
}
```

### Documents

#### `documents.list`

List all documents for a complaint.

**Input:** `string` (complaint ID)

**Returns:** Array of documents

### Time Tracking

#### `time.getComplaintTime`

Get time logs for a complaint.

**Input:** `string` (complaint ID)

**Returns:**
```typescript
{
  logs: Array<TimeLog>;
  totalMinutes: number;
  totalHours: string;
}
```

### Knowledge Base

#### `knowledge.search`

Semantic search in knowledge base.

**Input:**
```typescript
{
  query: string;
  threshold?: number; // default 0.7
  limit?: number; // default 10
}
```

**Returns:** Array of matching knowledge base entries

#### `knowledge.list`

List all knowledge base entries.

**Input:**
```typescript
{
  category?: string;
}
```

**Returns:** Array of knowledge base entries

## REST Endpoints

### Document Upload

**POST** `/api/documents/upload`

Upload a document for processing.

**Headers:**
```
Content-Type: multipart/form-data
```

**Body:**
```typescript
FormData {
  file: File;
  complaintId: string;
  documentType?: string; // default 'evidence'
}
```

**Returns:**
```typescript
{
  success: boolean;
  document: Document;
}
```

### Health Check

**GET** `/api/health`

Check API health status.

**Returns:**
```typescript
{
  status: 'healthy';
  timestamp: string;
  service: string;
}
```

## Error Handling

All tRPC procedures throw errors with the following format:

```typescript
{
  message: string;
  code: 'BAD_REQUEST' | 'UNAUTHORIZED' | 'INTERNAL_SERVER_ERROR' | ...;
  data?: {
    zodError?: ZodError; // for validation errors
  };
}
```

## Rate Limiting

Currently no rate limiting. In production, implement:
- Per-user rate limits
- API key-based throttling
- DDoS protection

## Usage Example (Frontend)

```typescript
import { trpc } from '@/lib/trpc/Provider';

function MyComponent() {
  // Query
  const { data, isLoading } = trpc.complaints.list.useQuery({
    organizationId: 'org-1',
  });

  // Mutation
  const createComplaint = trpc.complaints.create.useMutation({
    onSuccess: (data) => {
      console.log('Created:', data);
    },
  });

  const handleCreate = () => {
    createComplaint.mutate({
      organizationId: 'org-1',
      createdBy: 'user-1',
      clientReference: 'CLIENT-001',
    });
  };

  return (
    <button onClick={handleCreate}>
      Create Complaint
    </button>
  );
}
```

## WebSocket Support

Not currently implemented. Future enhancement for real-time updates.

---

**API Version**: 1.0.0


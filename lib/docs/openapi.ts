/**
 * OpenAPI Specification Generator
 * 
 * Generates OpenAPI 3.0 documentation from tRPC router definitions.
 */

import { logger } from '../logger';

// OpenAPI 3.0 types
interface OpenAPISpec {
  openapi: string;
  info: {
    title: string;
    description: string;
    version: string;
    contact: {
      name: string;
      email: string;
      url: string;
    };
  };
  servers: Array<{
    url: string;
    description: string;
  }>;
  paths: Record<string, Record<string, PathOperation>>;
  components: {
    schemas: Record<string, Schema>;
    securitySchemes: Record<string, SecurityScheme>;
  };
  security: Array<Record<string, string[]>>;
  tags: Array<{ name: string; description: string }>;
}

interface PathOperation {
  operationId: string;
  summary: string;
  description: string;
  tags: string[];
  security?: Array<Record<string, string[]>>;
  requestBody?: {
    required: boolean;
    content: Record<string, { schema: Schema }>;
  };
  responses: Record<string, {
    description: string;
    content?: Record<string, { schema: Schema }>;
  }>;
}

interface Schema {
  type: string;
  properties?: Record<string, Schema>;
  items?: Schema;
  required?: string[];
  description?: string;
  example?: any;
  format?: string;
  enum?: string[];
}

interface SecurityScheme {
  type: string;
  scheme?: string;
  bearerFormat?: string;
  name?: string;
  in?: string;
}

/**
 * Generate complete OpenAPI specification
 */
export function generateOpenAPISpec(): OpenAPISpec {
  return {
    openapi: '3.0.3',
    info: {
      title: 'Lightpoint API',
      description: `
# Lightpoint Complaint Management API

Lightpoint is an AI-powered complaint management system for UK tax professionals.

## Authentication

All API endpoints require authentication using Bearer tokens or API keys.

### Bearer Token (Supabase Auth)
Include the access token in the Authorization header:
\`\`\`
Authorization: Bearer <access_token>
\`\`\`

### API Key
Include your API key in the X-API-Key header:
\`\`\`
X-API-Key: lp_live_xxxxxxxxxxxx
\`\`\`

## Rate Limiting

Rate limits are based on your subscription tier:
- Free: 100 requests/hour
- Starter: 500 requests/hour  
- Professional: 2,000 requests/hour
- Enterprise: 10,000 requests/hour

Rate limit headers are included in all responses.

## Errors

The API uses standard HTTP status codes and returns JSON error responses:
\`\`\`json
{
  "error": "Error message",
  "code": "ERROR_CODE",
  "details": {}
}
\`\`\`
      `,
      version: '2.0.0',
      contact: {
        name: 'Lightpoint Support',
        email: 'api@lightpoint.uk',
        url: 'https://lightpoint.uk/docs',
      },
    },
    servers: [
      {
        url: 'https://lightpoint.uk/api',
        description: 'Production API',
      },
      {
        url: 'https://staging.lightpoint.uk/api',
        description: 'Staging API',
      },
      {
        url: 'http://localhost:3000/api',
        description: 'Local development',
      },
    ],
    paths: {
      // Complaints
      '/trpc/complaints.create': {
        post: {
          operationId: 'createComplaint',
          summary: 'Create new complaint',
          description: 'Creates a new complaint case for processing.',
          tags: ['Complaints'],
          requestBody: {
            required: true,
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    complaint_reference: { type: 'string', description: 'Client reference number' },
                    organization_id: { type: 'string', format: 'uuid' },
                  },
                  required: ['complaint_reference'],
                },
              },
            },
          },
          responses: {
            '200': {
              description: 'Complaint created successfully',
              content: {
                'application/json': {
                  schema: {
                    type: 'object',
                    properties: {
                      id: { type: 'string', format: 'uuid' },
                      complaint_reference: { type: 'string' },
                      status: { type: 'string', enum: ['assessment', 'draft', 'active', 'closed'] },
                      created_at: { type: 'string', format: 'date-time' },
                    },
                  },
                },
              },
            },
            '401': { description: 'Unauthorized' },
            '422': { description: 'Validation error' },
          },
        },
      },
      '/trpc/complaints.list': {
        get: {
          operationId: 'listComplaints',
          summary: 'List all complaints',
          description: 'Returns paginated list of complaints for the organization.',
          tags: ['Complaints'],
          responses: {
            '200': {
              description: 'List of complaints',
              content: {
                'application/json': {
                  schema: {
                    type: 'array',
                    items: {
                      type: 'object',
                      properties: {
                        id: { type: 'string', format: 'uuid' },
                        complaint_reference: { type: 'string' },
                        status: { type: 'string' },
                        viability_score: { type: 'number' },
                        created_at: { type: 'string', format: 'date-time' },
                      },
                    },
                  },
                },
              },
            },
          },
        },
      },
      '/trpc/complaints.getById': {
        get: {
          operationId: 'getComplaintById',
          summary: 'Get complaint by ID',
          description: 'Returns full complaint details including timeline and documents.',
          tags: ['Complaints'],
          responses: {
            '200': { description: 'Complaint details' },
            '404': { description: 'Complaint not found' },
          },
        },
      },
      '/trpc/complaints.analyzeDocument': {
        post: {
          operationId: 'analyzeDocument',
          summary: 'Analyze complaint document',
          description: 'Runs AI analysis on uploaded documents to extract key facts and assess viability.',
          tags: ['Complaints', 'AI'],
          requestBody: {
            required: true,
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    complaintId: { type: 'string', format: 'uuid' },
                    additionalContext: { type: 'string' },
                  },
                  required: ['complaintId'],
                },
              },
            },
          },
          responses: {
            '200': {
              description: 'Analysis results',
              content: {
                'application/json': {
                  schema: {
                    type: 'object',
                    properties: {
                      viability: { type: 'number', description: 'Viability score 0-100' },
                      keyIssues: { type: 'array', items: { type: 'string' } },
                      charterBreaches: { type: 'array', items: { type: 'string' } },
                      recommendedActions: { type: 'array', items: { type: 'string' } },
                    },
                  },
                },
              },
            },
          },
        },
      },

      // Letters
      '/trpc/letters.generate': {
        post: {
          operationId: 'generateLetter',
          summary: 'Generate complaint letter',
          description: 'Generates a professional complaint letter using three-stage AI pipeline.',
          tags: ['Letters', 'AI'],
          requestBody: {
            required: true,
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    complaintId: { type: 'string', format: 'uuid' },
                    letterType: { 
                      type: 'string',
                      enum: ['initial_complaint', 'tier2_escalation', 'adjudicator', 'rebuttal'],
                    },
                  },
                  required: ['complaintId', 'letterType'],
                },
              },
            },
          },
          responses: {
            '200': {
              description: 'Generated letter',
              content: {
                'application/json': {
                  schema: {
                    type: 'object',
                    properties: {
                      id: { type: 'string', format: 'uuid' },
                      content: { type: 'string' },
                      letterType: { type: 'string' },
                    },
                  },
                },
              },
            },
          },
        },
      },

      // Knowledge Base
      '/trpc/knowledge.search': {
        post: {
          operationId: 'searchKnowledge',
          summary: 'Search knowledge base',
          description: 'Semantic search across HMRC guidance, precedents, and case law.',
          tags: ['Knowledge Base', 'AI'],
          requestBody: {
            required: true,
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    query: { type: 'string', description: 'Search query' },
                    category: { type: 'string', enum: ['hmrc_guidance', 'precedents', 'case_law'] },
                    limit: { type: 'number', example: 10 },
                  },
                  required: ['query'],
                },
              },
            },
          },
          responses: {
            '200': {
              description: 'Search results',
              content: {
                'application/json': {
                  schema: {
                    type: 'array',
                    items: {
                      type: 'object',
                      properties: {
                        id: { type: 'string' },
                        title: { type: 'string' },
                        content: { type: 'string' },
                        similarity: { type: 'number' },
                      },
                    },
                  },
                },
              },
            },
          },
        },
      },

      // Documents
      '/trpc/documents.upload': {
        post: {
          operationId: 'uploadDocument',
          summary: 'Upload document',
          description: 'Uploads a document for OCR processing and analysis.',
          tags: ['Documents'],
          requestBody: {
            required: true,
            content: {
              'multipart/form-data': {
                schema: {
                  type: 'object',
                  properties: {
                    file: { type: 'string', format: 'binary' },
                    complaintId: { type: 'string', format: 'uuid' },
                    documentType: { 
                      type: 'string',
                      enum: ['hmrc_letter', 'evidence', 'response', 'other'],
                    },
                  },
                  required: ['file', 'complaintId'],
                },
              },
            },
          },
          responses: {
            '200': { description: 'Document uploaded and processed' },
          },
        },
      },

      // Time Tracking
      '/trpc/time.log': {
        post: {
          operationId: 'logTime',
          summary: 'Log time entry',
          description: 'Records time spent on a complaint.',
          tags: ['Time Tracking'],
          requestBody: {
            required: true,
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    complaintId: { type: 'string', format: 'uuid' },
                    minutes: { type: 'number' },
                    activity: { type: 'string' },
                    notes: { type: 'string' },
                  },
                  required: ['complaintId', 'minutes', 'activity'],
                },
              },
            },
          },
          responses: {
            '200': { description: 'Time logged' },
          },
        },
      },
    },
    components: {
      schemas: {
        Complaint: {
          type: 'object',
          properties: {
            id: { type: 'string', format: 'uuid' },
            complaint_reference: { type: 'string' },
            status: { 
              type: 'string',
              enum: ['assessment', 'draft', 'active', 'closed'],
            },
            viability_score: { type: 'number' },
            timeline: { type: 'array', items: { type: 'object' } },
            created_at: { type: 'string', format: 'date-time' },
            updated_at: { type: 'string', format: 'date-time' },
          },
        },
        Letter: {
          type: 'object',
          properties: {
            id: { type: 'string', format: 'uuid' },
            complaint_id: { type: 'string', format: 'uuid' },
            letter_type: { type: 'string' },
            letter_content: { type: 'string' },
            locked_at: { type: 'string', format: 'date-time' },
            sent_at: { type: 'string', format: 'date-time' },
          },
        },
        Document: {
          type: 'object',
          properties: {
            id: { type: 'string', format: 'uuid' },
            filename: { type: 'string' },
            document_type: { type: 'string' },
            extracted_text: { type: 'string' },
            ocr_used: { type: 'boolean' },
          },
        },
        Error: {
          type: 'object',
          properties: {
            error: { type: 'string' },
            code: { type: 'string' },
            details: { type: 'object' },
          },
        },
      },
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
        },
        apiKey: {
          type: 'apiKey',
          name: 'X-API-Key',
          in: 'header',
        },
      },
    },
    security: [
      { bearerAuth: [] },
      { apiKey: [] },
    ],
    tags: [
      { name: 'Complaints', description: 'Complaint management operations' },
      { name: 'Letters', description: 'Letter generation and management' },
      { name: 'Documents', description: 'Document upload and processing' },
      { name: 'Knowledge Base', description: 'Knowledge base search and management' },
      { name: 'Time Tracking', description: 'Time logging and billing' },
      { name: 'AI', description: 'AI-powered operations' },
    ],
  };
}

/**
 * Serve OpenAPI spec as JSON
 */
export function getOpenAPIJson(): string {
  return JSON.stringify(generateOpenAPISpec(), null, 2);
}

/**
 * Serve OpenAPI spec as YAML
 */
export function getOpenAPIYaml(): string {
  const spec = generateOpenAPISpec();
  
  // Simple YAML conversion (for production, use a proper YAML library)
  const toYaml = (obj: any, indent: number = 0): string => {
    const spaces = '  '.repeat(indent);
    let result = '';
    
    for (const [key, value] of Object.entries(obj)) {
      if (value === null || value === undefined) continue;
      
      if (typeof value === 'object' && !Array.isArray(value)) {
        result += `${spaces}${key}:\n${toYaml(value, indent + 1)}`;
      } else if (Array.isArray(value)) {
        result += `${spaces}${key}:\n`;
        for (const item of value) {
          if (typeof item === 'object') {
            result += `${spaces}  -\n${toYaml(item, indent + 2)}`;
          } else {
            result += `${spaces}  - ${item}\n`;
          }
        }
      } else {
        result += `${spaces}${key}: ${value}\n`;
      }
    }
    
    return result;
  };
  
  return toYaml(spec);
}


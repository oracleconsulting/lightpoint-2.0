/**
 * OpenAPI Documentation Endpoint
 * 
 * Serves the OpenAPI specification in JSON or YAML format.
 */

import { NextRequest, NextResponse } from 'next/server';
import { getOpenAPIJson, getOpenAPIYaml } from '@/lib/docs/openapi';

export async function GET(request: NextRequest) {
  const format = request.nextUrl.searchParams.get('format') || 'json';
  
  if (format === 'yaml' || format === 'yml') {
    return new NextResponse(getOpenAPIYaml(), {
      headers: {
        'Content-Type': 'text/yaml',
        'Cache-Control': 'public, max-age=3600',
      },
    });
  }
  
  return NextResponse.json(JSON.parse(getOpenAPIJson()), {
    headers: {
      'Cache-Control': 'public, max-age=3600',
    },
  });
}


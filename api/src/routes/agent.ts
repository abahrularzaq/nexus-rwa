import { Hono } from 'hono';
import { createMeta } from '../shared/index.js';

export const agentRouter = new Hono();

agentRouter.get('/manifest', (c) => c.json({
  success: true,
  data: {
    name: 'Nexus RWA Agent Manifest',
    version: '0.1.0',
    description: 'Machine-readable discovery metadata for AI agents using Nexus RWA enterprise workflows.',
    documentationUrl: '/docs/agent-integration.md',
    endpoints: [
      {
        id: 'dataset-export',
        method: 'GET',
        path: '/v1/export',
        access: 'enterprise',
        purpose: 'Fetch a full machine-readable dataset snapshot.',
        query: {
          format: ['json', 'csv', 'ndjson'],
        },
      },
      {
        id: 'bulk-analytics',
        method: 'GET',
        path: '/v1/analytics/bulk',
        access: 'enterprise',
        purpose: 'Fetch a normalized bulk analytics snapshot across tracked assets.',
      },
      {
        id: 'ask-nexus',
        method: 'POST',
        path: '/v1/ask',
        access: 'enterprise',
        purpose: 'Ask a natural-language question over Nexus RWA asset context.',
        body: {
          required: ['question'],
          optional: ['context'],
        },
        response: {
          contentType: 'text/event-stream',
        },
      },
    ],
    workflow: [
      'Fetch the dataset with /v1/export or /v1/analytics/bulk.',
      'Compare assets by risk, yield, and source quality signals.',
      'Use /v1/ask for a natural-language answer over shortlisted asset context.',
    ],
    disclaimer: 'Nexus RWA responses are informational only and are not investment advice.',
  },
  meta: createMeta(false),
}));

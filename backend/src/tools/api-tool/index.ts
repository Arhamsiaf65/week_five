import { tool } from '@langchain/core/tools';
import { z } from 'zod';

export const generateApiDesignTool = tool(
  async ({ resources }) => {
    return JSON.stringify({
      restEndpoints: ["GET /api/resource", "POST /api/resource"],
      requestPayloads: [{ endpoint: "POST /api/resource", payload: "{ name: string }" }],
      responsePayloads: [{ endpoint: "GET /api/resource", payload: "[{ id: 1, name: 'string' }]" }]
    });
  },
  {
    name: 'generateApiDesign',
    description: 'Generates REST endpoints, request payloads, and response payloads based on resources.',
    schema: z.object({
      resources: z.array(z.string()).describe('List of resources that need API endpoints.'),
    }),
  }
);

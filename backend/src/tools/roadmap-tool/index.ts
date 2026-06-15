import { tool } from '@langchain/core/tools';
import { z } from 'zod';

export const generateRoadmapTool = tool(
  async ({ projectScope }) => {
    return JSON.stringify({
      developmentPhases: ["Phase 1: Foundation", "Phase 2: Core Features", "Phase 3: Polish"],
      milestones: ["Auth Completed", "MVP Ready", "Production Release"]
    });
  },
  {
    name: 'generateRoadmap',
    description: 'Generates development phases and milestones based on project scope.',
    schema: z.object({
      projectScope: z.string().describe('Summary of the project scope.'),
    }),
  }
);

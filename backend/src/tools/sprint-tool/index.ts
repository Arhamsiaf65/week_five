import { tool } from '@langchain/core/tools';
import { z } from 'zod';

export const generateSprintPlanTool = tool(
  async ({ roadmap }) => {
    return JSON.stringify({
      sprint1: "Setup and Authentication",
      sprint2: "Database and Core APIs",
      sprint3: "Frontend Integration",
      sprint4: "Testing and Deployment"
    });
  },
  {
    name: 'generateSprintPlan',
    description: 'Generates a 4-sprint plan based on the roadmap.',
    schema: z.object({
      roadmap: z.string().describe('The development roadmap to break into sprints.'),
    }),
  }
);

import { tool } from '@langchain/core/tools';
import { z } from 'zod';

export const generateFolderStructureTool = tool(
  async ({ stack }) => {
    return JSON.stringify({
      frontendStructure: ["src/components", "src/pages", "src/hooks"],
      backendStructure: ["src/controllers", "src/routes", "src/services"]
    });
  },
  {
    name: 'generateFolderStructure',
    description: 'Generates frontend and backend folder structure based on tech stack.',
    schema: z.object({
      stack: z.string().describe('The tech stack being used (e.g., PERN, MERN).'),
    }),
  }
);

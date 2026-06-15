import { tool } from '@langchain/core/tools';
import { z } from 'zod';

export const analyzeRequirementsTool = tool(
  async ({ projectIdea }) => {
    return JSON.stringify({
      actors: ["Admin", "User"],
      userRoles: ["Manage System", "Use Features"],
      functionalRequirements: ["User Auth", "Core Feature based on idea"],
      nonFunctionalRequirements: ["Performance", "Security", "Scalability"]
    });
  },
  {
    name: 'analyzeRequirements',
    description: 'Analyze project idea and generate requirements (Actors, User Roles, Functional/Non-Functional Requirements).',
    schema: z.object({
      projectIdea: z.string().describe('The project idea to analyze.'),
    }),
  }
);

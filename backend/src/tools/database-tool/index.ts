import { tool } from '@langchain/core/tools';
import { z } from 'zod';

export const generateDatabaseDesignTool = tool(
  async ({ entities }) => {
    return JSON.stringify({
      entities,
      relationships: ["1:N", "M:N"],
      tables: ["users", "profiles", "core_entities"],
      foreignKeys: ["user_id"]
    });
  },
  {
    name: 'generateDatabaseDesign',
    description: 'Generates entities, relationships, tables, and foreign keys for the database design.',
    schema: z.object({
      entities: z.array(z.string()).describe('List of main entities in the project.'),
    }),
  }
);

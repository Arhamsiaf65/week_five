export * from './requirements-tool/index.js';
export * from './database-tool/index.js';
export * from './api-tool/index.js';
export * from './folder-tool/index.js';
export * from './roadmap-tool/index.js';
export * from './sprint-tool/index.js';

import { analyzeRequirementsTool } from './requirements-tool/index.js';
import { generateDatabaseDesignTool } from './database-tool/index.js';
import { generateApiDesignTool } from './api-tool/index.js';
import { generateFolderStructureTool } from './folder-tool/index.js';
import { generateRoadmapTool } from './roadmap-tool/index.js';
import { generateSprintPlanTool } from './sprint-tool/index.js';

export const architectTools = [
    analyzeRequirementsTool,
    generateDatabaseDesignTool,
    generateApiDesignTool,
    generateFolderStructureTool,
    generateRoadmapTool,
    generateSprintPlanTool
];

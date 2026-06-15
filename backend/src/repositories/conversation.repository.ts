import { pool } from '../utils/db.js';

export interface Conversation {
    id: string;
    user_id: string;
    title: string;
    created_at: Date;
    updated_at: Date;
}

export interface Message {
    id: string;
    conversation_id: string;
    role: string;
    content: string;
    created_at: Date;
}

export type ToolPayload = Record<string, unknown> | null;

export interface ToolExecution {
    id: string;
    conversation_id: string;
    tool_name: string;
    tool_input: ToolPayload;
    tool_output: ToolPayload;
    created_at: Date;
}

// Conversation
export const createConversation = async (userId: string, title: string): Promise<Conversation> => {
    const result = await pool.query<Conversation>(
        `INSERT INTO conversations (user_id, title) VALUES ($1, $2) RETURNING *`,
        [userId, title]
    );
    return result.rows[0];
};

export const getConversationsByUser = async (userId: string): Promise<Conversation[]> => {
    const result = await pool.query<Conversation>(
        `SELECT * FROM conversations WHERE user_id = $1 ORDER BY updated_at DESC`,
        [userId]
    );
    return result.rows;
};

export const getConversationById = async (id: string, userId: string): Promise<Conversation | null> => {
    const result = await pool.query<Conversation>(
        `SELECT * FROM conversations WHERE id = $1 AND user_id = $2`,
        [id, userId]
    );
    return result.rows[0] || null;
};

export const deleteConversation = async (id: string, userId: string): Promise<void> => {
    await pool.query(
        `DELETE FROM conversations WHERE id = $1 AND user_id = $2`,
        [id, userId]
    );
};

// Messages
export const createMessage = async (conversationId: string, role: string, content: string): Promise<Message> => {
    const result = await pool.query<Message>(
        `INSERT INTO messages (conversation_id, role, content) VALUES ($1, $2, $3) RETURNING *`,
        [conversationId, role, content]
    );
    
    // Update conversation timestamp
    await pool.query(`UPDATE conversations SET updated_at = CURRENT_TIMESTAMP WHERE id = $1`, [conversationId]);
    
    return result.rows[0];
};

export const getMessagesByConversation = async (conversationId: string): Promise<Message[]> => {
    const result = await pool.query<Message>(
        `SELECT * FROM messages WHERE conversation_id = $1 ORDER BY created_at ASC`,
        [conversationId]
    );
    return result.rows;
};

// Tool Executions
export const createToolExecution = async (
    conversationId: string,
    toolName: string,
    toolInput: ToolPayload,
    toolOutput: ToolPayload,
): Promise<ToolExecution> => {
    const result = await pool.query<ToolExecution>(
        `INSERT INTO tool_executions (conversation_id, tool_name, tool_input, tool_output) VALUES ($1, $2, $3, $4) RETURNING *`,
        [conversationId, toolName, JSON.stringify(toolInput), JSON.stringify(toolOutput)]
    );
    return result.rows[0];
};

export const getToolExecutionsByConversation = async (conversationId: string): Promise<ToolExecution[]> => {
    const result = await pool.query<ToolExecution>(
        `SELECT * FROM tool_executions WHERE conversation_id = $1 ORDER BY created_at ASC`,
        [conversationId]
    );
    return result.rows;
};

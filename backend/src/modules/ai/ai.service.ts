import { ChatGoogleGenerativeAI } from '@langchain/google-genai';
import { architectTools } from '../../tools/index.js';
import { getMessagesByConversation, createMessage, createToolExecution } from '../../repositories/conversation.repository.js';
import { BaseMessage, HumanMessage, AIMessage, SystemMessage } from '@langchain/core/messages';
import { Response } from 'express';
import { createReactAgent } from '@langchain/langgraph/prebuilt';
import dotenv from 'dotenv';

dotenv.config()

const getModel = () => {
  return new ChatGoogleGenerativeAI({
    model: "gemini-2.5-flash",
    apiKey: process.env.GEMINI_API_KEY, // DO NOT hardcode
    streaming: true,
  });
};

export const chatStreamService = async (conversationId: string, messageContent: string, res: Response) => {
    // Save User Message
    await createMessage(conversationId, 'user', messageContent);

    // Fetch History
    const history = await getMessagesByConversation(conversationId);
    
    // Construct LangChain Chat History
    const chatHistory: BaseMessage[] = [];
    for (const msg of history) {
        if (msg.role === 'user') chatHistory.push(new HumanMessage(msg.content));
        if (msg.role === 'assistant') chatHistory.push(new AIMessage(msg.content));
    }

    // Add current message
    chatHistory.push(new HumanMessage(messageContent));

    const llm = getModel();

    const agentExecutor = createReactAgent({
        llm,
        tools: architectTools,
        messageModifier: new SystemMessage("You are an expert Software Architect named ArchitectAI. You have access to tools to generate comprehensive software blueprints. You MUST use the tools available to you to gather requirements, design databases, APIs, folder structures, and roadmaps before giving your final summary. DO NOT invent the details without using tools if a tool exists for it. IMPORTANT: When you are summarizing architectures, databases, or roadmaps, you MUST include visual diagrams using markdown `mermaid` code blocks (e.g. ```mermaid\n graph TD;\n A-->B;\n```). The frontend will visually render these blocks.")
    });

    let fullOutput = "";

    try {
        const eventStream = await agentExecutor.streamEvents(
            { messages: chatHistory },
            { version: "v2" }
        );

        for await (const event of eventStream) {
            const eventType = event.event;

            if (eventType === "on_chat_model_stream") {
                const chunk = event.data?.chunk?.content;
                if (chunk && typeof chunk === "string") {
                    res.write(`data: ${JSON.stringify({ type: 'token', content: chunk })}\n\n`);
                    fullOutput += chunk;
                }
            } else if (eventType === "on_tool_start") {
                const toolName = event.name;
                const toolInput = event.data?.input;
                res.write(`data: ${JSON.stringify({ type: 'tool_start', tool: toolName, input: toolInput })}\n\n`);
            } else if (eventType === "on_tool_end") {
                const toolName = event.name;
                const toolOutput = event.data?.output;
                const toolInput = event.data?.input;
                
                await createToolExecution(conversationId, toolName, toolInput || {}, toolOutput || {});
                
                res.write(`data: ${JSON.stringify({ type: 'tool_end', tool: toolName })}\n\n`);
            }
        }

        // Save AI final message
        if (fullOutput) {
            await createMessage(conversationId, 'assistant', fullOutput);
        }

        res.write(`data: ${JSON.stringify({ type: 'done' })}\n\n`);
        res.end();
    } catch (error) {
        console.error("Agent execution error:", error);
        res.write(`data: ${JSON.stringify({ type: 'error', message: 'Failed to generate response.' })}\n\n`);
        res.end();
    }
};

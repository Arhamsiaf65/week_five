import { useEffect, useState, useRef } from 'react';
import { useParams } from 'react-router-dom';
import ReactMarkdown, { type Components } from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { api } from '../services/api';
import { useAuthStore } from '../store/authStore';
import { Send, Bot, User, CheckCircle2, Copy } from 'lucide-react';
import { MermaidDiagram } from '../components/MermaidDiagram';

interface Message {
    id?: string;
    role: string;
    content: string;
}

interface ToolExecution {
    tool_name: string;
    tool_input?: Record<string, unknown> | null;
}

const markdownComponents: Partial<Components> = {
    p: ({ node, ...props }) => (
        <p className="mb-2 text-sm leading-6 text-gray-900 dark:text-gray-100" {...props} />
    ),
    strong: ({ node, ...props }) => (
        <strong className="font-semibold text-gray-900 dark:text-gray-100" {...props} />
    ),
    em: ({ node, ...props }) => (
        <em className="italic text-gray-900 dark:text-gray-100" {...props} />
    ),
    ul: ({ node, ...props }) => (
        <ul className="ml-5 list-disc text-sm leading-6 text-gray-900 dark:text-gray-100" {...props} />
    ),
    ol: ({ node, ...props }) => (
        <ol className="ml-5 list-decimal text-sm leading-6 text-gray-900 dark:text-gray-100" {...props} />
    ),
    li: ({ node, ...props }) => (
        <li className="mb-1" {...props} />
    ),
    code: ({ node, className, children, ...props }) => {
        const classString = className || '';
        const match = /language-(\w+)/.exec(classString);
        const rawValue = Array.isArray(children) ? children.join('') : String(children);
        const sanitizedValue = rawValue
            .replace(/^```mermaid\s*/, '')
            .replace(/\s*```$/, '')
            .trim();

        if (match && match[1] === 'mermaid') {
            return <MermaidDiagram chart={sanitizedValue} />;
        }

        return (
            <code className={`${classString} rounded bg-gray-100 px-1 py-0.5 text-sm text-gray-900 dark:bg-gray-700 dark:text-gray-100`} {...props}>
                {rawValue}
            </code>
        );
    },
};

const Workspace = () => {
    const { id } = useParams<{ id: string }>();
    const [messages, setMessages] = useState<Message[]>([]);
    const [tools, setTools] = useState<ToolExecution[]>([]);
    const [input, setInput] = useState('');
    const [streamingContent, setStreamingContent] = useState('');
    const [isStreaming, setIsStreaming] = useState(false);
    const [copiedMessageId, setCopiedMessageId] = useState<string | null>(null);
    const messagesEndRef = useRef<HTMLDivElement>(null);
    const accessToken = useAuthStore((state) => state.accessToken);

    useEffect(() => {
        const fetchDetails = async () => {
            const { data } = await api.get(`/conversations/${id}`);
            setMessages(data.messages || []);
            setTools(data.toolExecutions || []);
        };
        fetchDetails();
    }, [id]);

    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages, streamingContent]);

    const handleCopy = async (text: string, id: string) => {
        try {
            await navigator.clipboard.writeText(text);
            setCopiedMessageId(id);
            window.setTimeout(() => setCopiedMessageId(null), 1600);
        } catch (error: unknown) {
            console.error('Copy failed', error);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!input.trim() || isStreaming) return;

        const userMessage = input.trim();
        setInput('');
        setMessages((prev) => [...prev, { role: 'user', content: userMessage }]);
        setIsStreaming(true);
        setStreamingContent('');

        try {
            const response = await fetch(`${api.defaults.baseURL}/ai/chat`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${accessToken}`,
                },
                body: JSON.stringify({ conversationId: id, message: userMessage }),
            });

            if (!response.body) throw new Error('No response body');

            const reader = response.body.getReader();
            const decoder = new TextDecoder('utf-8');

            while (true) {
                const { done, value } = await reader.read();
                if (done) break;

                const chunk = decoder.decode(value, { stream: true });
                const lines = chunk.split('\n\n').filter(Boolean);

                for (const line of lines) {
                    if (line.startsWith('data: ')) {
                        const data = JSON.parse(line.slice(6));
                        
                        if (data.type === 'token') {
                            setStreamingContent((prev) => prev + data.content);
                        } else if (data.type === 'tool_end') {
                            setTools((prev) => [...prev, { tool_name: data.tool }]);
                        } else if (data.type === 'done') {
                            // Finish streaming
                            setIsStreaming(false);
                            setMessages((prev) => {
                                // Have to use functional update to capture the latest streamingContent closure value
                                // But simpler: we know it's done, we'll append the final streamingContent in a useLayoutEffect 
                                // Actually we can just do it here if we use a ref or just let the next render append it.
                                return prev; 
                            });
                        } else if (data.type === 'error') {
                            console.error(data.message);
                            setIsStreaming(false);
                        }
                    }
                }
            }
        } catch (error) {
            console.error('Streaming error', error);
            setIsStreaming(false);
        }
    };

    // Effect to commit streamed message to message list when done
    useEffect(() => {
        if (!isStreaming && streamingContent) {
            setMessages((prev) => [...prev, { role: 'assistant', content: streamingContent }]);
            setStreamingContent('');
        }
    }, [isStreaming, streamingContent]);


    return (
        <div className="flex h-[calc(100vh-80px)] gap-6">
            {/* Chat Section */}
            <div className="flex-1 flex flex-col bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
                <div className="flex-1 overflow-y-auto p-4 space-y-4">
                    {messages.map((msg, idx) => {
                        const messageKey = `${msg.role}-${idx}`;
                        const isAssistant = msg.role === 'assistant';

                        return (
                            <div key={messageKey} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                                <div className={`flex max-w-[80%] ${msg.role === 'user' ? 'flex-row-reverse' : 'flex-row'} items-start gap-3`}>
                                    <div className={`p-2 rounded-full ${msg.role === 'user' ? 'bg-blue-100 text-blue-600' : 'bg-green-100 text-green-600'}`}>
                                        {msg.role === 'user' ? <User className="w-5 h-5" /> : <Bot className="w-5 h-5" />}
                                    </div>
                                    <div className={`${isAssistant ? 'bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 shadow-sm' : 'bg-blue-600 text-white'} rounded-xl overflow-hidden w-full`}>
                                        {isAssistant ? (
                                            <div className="flex items-center justify-between gap-3 border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900 px-4 py-3">
                                                <div>
                                                    <p className="text-xs uppercase tracking-[0.18em] text-gray-500 dark:text-gray-400 font-semibold">ArchitectAI</p>
                                                    <p className="text-sm text-gray-600 dark:text-gray-300">AI response</p>
                                                </div>
                                                <button
                                                    type="button"
                                                    onClick={() => handleCopy(msg.content, messageKey)}
                                                    className="inline-flex items-center gap-2 rounded-md border border-gray-300 bg-white px-3 py-1 text-xs text-gray-700 transition hover:bg-gray-50 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-200 dark:hover:bg-gray-700"
                                                >
                                                    <Copy className="w-4 h-4" />
                                                    {copiedMessageId === messageKey ? 'Copied' : 'Copy'}
                                                </button>
                                            </div>
                                        ) : null}
                                        <div className={`p-4 ${msg.role === 'user' ? '' : 'bg-white dark:bg-gray-800'}`}>
                                            {isAssistant ? (
                                                <ReactMarkdown
                                                    remarkPlugins={[remarkGfm]}
                                                    components={markdownComponents}
                                                >
                                                    {msg.content}
                                                </ReactMarkdown>
                                            ) : (
                                                <pre className="whitespace-pre-wrap font-sans text-sm leading-6 text-gray-900 dark:text-gray-100">{msg.content}</pre>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                    {isStreaming && streamingContent && (
                        <div className="flex justify-start">
                            <div className="flex max-w-[80%] flex-row items-start gap-3">
                                <div className="p-2 rounded-full bg-green-100 text-green-600">
                                    <Bot className="w-5 h-5" />
                                </div>
                                <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 shadow-sm rounded-xl overflow-hidden w-full">
                                    <div className="flex items-center justify-between gap-3 border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900 px-4 py-3">
                                        <div>
                                            <p className="text-xs uppercase tracking-[0.18em] text-gray-500 dark:text-gray-400 font-semibold">ArchitectAI</p>
                                            <p className="text-sm text-gray-600 dark:text-gray-300">Streaming response</p>
                                        </div>
                                        <div className="inline-flex items-center gap-2 rounded-md border border-gray-300 bg-white px-3 py-1 text-xs text-gray-700 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-200">
                                            <Copy className="w-4 h-4" />
                                            Streaming
                                        </div>
                                    </div>
                                    <div className="p-4 bg-white dark:bg-gray-800">
                                        <ReactMarkdown
                                            remarkPlugins={[remarkGfm]}
                                            components={markdownComponents}
                                        >
                                            {streamingContent}
                                        </ReactMarkdown>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}
                    <div ref={messagesEndRef} />
                </div>
                
                <div className="p-4 border-t dark:border-gray-700 bg-gray-50 dark:bg-gray-800">
                    <form onSubmit={handleSubmit} className="flex gap-4">
                        <input
                            type="text"
                            value={input}
                            onChange={(e) => setInput(e.target.value)}
                            placeholder="Describe your software idea..."
                            className="flex-1 rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 p-3 border dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                            disabled={isStreaming}
                        />
                        <button
                            type="submit"
                            disabled={isStreaming || !input.trim()}
                            className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-md flex items-center gap-2 disabled:opacity-50 transition-colors"
                        >
                            <Send className="w-5 h-5" />
                            <span>Send</span>
                        </button>
                    </form>
                </div>
            </div>

            {/* Tool Execution Timeline Section */}
            <div className="w-80 bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 flex flex-col hidden lg:flex">
                <div className="p-4 border-b dark:border-gray-700">
                    <h3 className="font-semibold text-gray-900 dark:text-white">Tool Execution Timeline</h3>
                </div>
                <div className="flex-1 overflow-y-auto p-4 space-y-4">
                    {tools.map((tool, idx) => (
                        <div key={idx} className="flex items-start gap-3">
                            <CheckCircle2 className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" />
                            <div>
                                <p className="text-sm font-medium text-gray-900 dark:text-white">{tool.tool_name}</p>
                                <p className="text-xs text-gray-500 dark:text-gray-400">Completed successfully</p>
                            </div>
                        </div>
                    ))}
                    {tools.length === 0 && (
                        <p className="text-sm text-gray-500 text-center mt-10">No tools executed yet.</p>
                    )}
                </div>
            </div>
        </div>
    );
};

export default Workspace;

import { useNavigate } from 'react-router-dom';
import { api } from '../services/api';
import { PlusCircle, MessageSquare, Trash2 } from 'lucide-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

interface Conversation {
    id: string;
    title: string;
    updated_at: string;
}

const Dashboard = () => {
    const navigate = useNavigate();
    const queryClient = useQueryClient();

    const { data: conversations = [], isLoading } = useQuery<Conversation[]>({
        queryKey: ['conversations'],
        queryFn: async () => {
            const { data } = await api.get('/conversations');
            return data;
        }
    });

    const createMutation = useMutation({
        mutationFn: async () => {
            const { data } = await api.post('/conversations', { title: 'New Blueprint' });
            return data;
        },
        onSuccess: (data) => {
            navigate(`/workspace/${data.id}`);
        }
    });

    const deleteMutation = useMutation({
        mutationFn: async (id: string) => {
            await api.delete(`/conversations/${id}`);
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['conversations'] });
        }
    });

    if (isLoading) return <div className="p-8 text-center">Loading...</div>;

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Your Blueprints</h2>
                <button
                    onClick={() => createMutation.mutate()}
                    disabled={createMutation.isPending}
                    className="flex items-center space-x-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md transition-colors disabled:opacity-50"
                >
                    <PlusCircle className="w-5 h-5" />
                    <span>{createMutation.isPending ? 'Creating...' : 'New Blueprint'}</span>
                </button>
            </div>

            {conversations.length === 0 ? (
                <div className="text-center py-12 bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
                    <p className="text-gray-500 dark:text-gray-400">No blueprints yet. Start by creating a new one!</p>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {conversations.map((conv) => (
                        <div
                            key={conv.id}
                            onClick={() => navigate(`/workspace/${conv.id}`)}
                            className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 hover:border-blue-500 cursor-pointer transition-colors group relative"
                        >
                            <div className="flex items-start justify-between">
                                <div className="flex items-center space-x-3">
                                    <div className="p-2 bg-blue-100 dark:bg-blue-900 rounded-lg text-blue-600 dark:text-blue-300">
                                        <MessageSquare className="w-6 h-6" />
                                    </div>
                                    <div>
                                        <h3 className="text-lg font-medium text-gray-900 dark:text-white truncate w-40">{conv.title}</h3>
                                        <p className="text-sm text-gray-500 dark:text-gray-400">
                                            {new Date(conv.updated_at).toLocaleDateString()}
                                        </p>
                                    </div>
                                </div>
                                <button
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        deleteMutation.mutate(conv.id);
                                    }}
                                    disabled={deleteMutation.isPending}
                                    className="text-gray-400 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity disabled:opacity-50"
                                >
                                    <Trash2 className="w-5 h-5" />
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};

export default Dashboard;

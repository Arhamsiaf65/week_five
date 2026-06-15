import { Outlet, Navigate } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';

const AuthLayout = () => {
    const user = useAuthStore((state) => state.user);

    // If already logged in, redirect to dashboard
    if (user) {
        return <Navigate to="/" replace />;
    }

    return (
        <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center p-4">
            <div className="max-w-md w-full bg-white dark:bg-gray-800 rounded-lg shadow-xl p-8">
                <div className="text-center mb-8">
                    <h1 className="text-3xl font-bold text-gray-900 dark:text-white">ArchitectAI</h1>
                    <p className="text-gray-500 dark:text-gray-400 mt-2">Your AI Software Architect</p>
                </div>
                <Outlet />
            </div>
        </div>
    );
};

export default AuthLayout;

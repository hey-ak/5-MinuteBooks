import { useEffect } from 'react';
import { useNavigate } from 'react-router';
import { useAuth } from '@getmocha/users-service/react';
import { Shield, Loader2, LogIn } from 'lucide-react';
import Logo from '@/react-app/components/Logo';

export default function AdminLogin() {
  const { user, redirectToLogin, isPending } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    const checkAdminStatus = async () => {
      if (user) {
        try {
          const response = await fetch('/api/admin/verify');
          if (response.ok) {
            navigate('/admin/dashboard');
          } else {
            console.error('User is not an admin');
          }
        } catch (error) {
          console.error('Failed to verify admin status:', error);
        }
      }
    };

    if (user) {
      checkAdminStatus();
    }
  }, [user, navigate]);

  if (isPending) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-gradient-to-br from-yellow-50 via-white to-yellow-100">
        <div className="animate-spin mb-4">
          <Loader2 className="w-12 h-12 text-yellow-500" />
        </div>
        <p className="text-gray-800 text-lg">Checking authentication...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-yellow-50 via-white to-yellow-100 flex items-center justify-center">
      <div className="bg-white border border-gray-200 rounded-2xl p-8 shadow-lg max-w-md w-full mx-4">
        <div className="text-center mb-8">
          <div className="mx-auto mb-4">
            <Logo size={80} />
          </div>
          <h1 className="text-2xl font-bold text-gray-800 mb-2">Admin Login</h1>
          <p className="text-gray-600">Sign in to access the admin dashboard</p>
        </div>

        {user ? (
          <div className="text-center py-8">
            <p className="text-red-600 mb-4">
              You are not authorized as an admin. Please contact the system administrator.
            </p>
            <button
              onClick={() => navigate('/')}
              className="text-yellow-600 hover:text-yellow-700 underline"
            >
              Back to Home
            </button>
          </div>
        ) : (
          <button
            onClick={redirectToLogin}
            className="w-full flex items-center justify-center space-x-2 py-3 px-4 bg-gradient-to-r from-yellow-500 to-amber-600 text-white rounded-lg hover:from-yellow-600 hover:to-amber-700 transition-all duration-200 transform hover:scale-105"
          >
            <LogIn className="w-5 h-5" />
            <span>Sign in with Google</span>
          </button>
        )}
      </div>
    </div>
  );
}

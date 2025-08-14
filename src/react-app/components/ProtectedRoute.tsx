import { ReactNode, useEffect } from 'react';
import { useNavigate } from 'react-router';
import { useSimpleAuth } from '@/react-app/hooks/useSimpleAuth';
import { Loader2 } from 'lucide-react';

interface ProtectedRouteProps {
  children: ReactNode;
  requireAdmin?: boolean;
}

export default function ProtectedRoute({ children, requireAdmin = false }: ProtectedRouteProps) {
  const { user, loading } = useSimpleAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!loading) {
      if (!user) {
        // Redirect to signup if no user
        navigate('/signup');
      } else if (requireAdmin && user.type !== 'admin') {
        // Redirect to home if admin required but user is not admin
        navigate('/');
      }
    }
  }, [user, loading, navigate, requireAdmin]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-yellow-50 via-white to-yellow-100 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin text-yellow-600 mx-auto mb-4" />
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  // Show children if user is authenticated and meets requirements
  if (user && (!requireAdmin || user.type === 'admin')) {
    return <>{children}</>;
  }

  // Return null while redirecting
  return null;
}

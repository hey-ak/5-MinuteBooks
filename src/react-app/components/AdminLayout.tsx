import { useEffect } from 'react';
import { useNavigate } from 'react-router';
import { useSimpleAuth } from '@/react-app/hooks/useSimpleAuth';
import { LogOut } from 'lucide-react';
import Logo from '@/react-app/components/Logo';

interface AdminLayoutProps {
  children: React.ReactNode;
}

export default function AdminLayout({ children }: AdminLayoutProps) {
  const { user, logout } = useSimpleAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!user || user.type !== 'admin') {
      navigate('/signin');
    }
  }, [user, navigate]);

  if (!user || user.type !== 'admin') {
    return null;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-yellow-50 via-white to-yellow-100">
      {/* Admin Header */}
      <header className="bg-white/90 backdrop-blur-lg border-b border-yellow-200 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-3">
              <Logo size={32} />
              <span className="text-gray-800 text-xl font-bold">Admin Dashboard</span>
            </div>

            <div className="flex items-center space-x-4">
              <span className="text-gray-600 text-sm">Welcome, {user.username}</span>
              <button
                onClick={() => navigate('/')}
                className="text-gray-600 hover:text-gray-800 transition-colors"
              >
                View Site
              </button>
              <button
                onClick={() => {
                  logout();
                  navigate('/signin');
                }}
                className="flex items-center space-x-1 px-3 py-2 rounded-lg text-gray-600 hover:text-gray-800 hover:bg-yellow-50 transition-colors"
              >
                <LogOut className="w-4 h-4" />
                <span>Logout</span>
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main>{children}</main>
    </div>
  );
}

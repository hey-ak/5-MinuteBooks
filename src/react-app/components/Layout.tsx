import { useSimpleAuth } from '@/react-app/hooks/useSimpleAuth';
import { Heart, Home, User, LogOut, LogIn, Settings } from 'lucide-react';
import { Link, useLocation, useNavigate } from 'react-router';
import Logo from '@/react-app/components/Logo';

interface LayoutProps {
  children: React.ReactNode;
}

export default function Layout({ children }: LayoutProps) {
  const { user, logout } = useSimpleAuth();
  const navigate = useNavigate();
  const location = useLocation();

  // Redirect to signup if no user is authenticated and not on auth pages
  if (!user && !location.pathname.includes('sign')) {
    navigate('/signup');
    return null;
  }

  const isActive = (path: string) => location.pathname === path;

  return (
    <div className="min-h-screen bg-gradient-to-br from-yellow-50 via-white to-yellow-100">
      {/* Header */}
      <header className="bg-white/90 backdrop-blur-lg border-b border-yellow-200 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <Link to="/" className="flex items-center space-x-2">
              <Logo size={32} />
              <span className="text-gray-800 text-xl font-bold">5 Minute Books</span>
            </Link>

            <nav className="flex items-center space-x-4">
              <Link
                to="/"
                className={`flex items-center space-x-1 px-3 py-2 rounded-lg transition-colors ${
                  isActive('/') 
                    ? 'bg-yellow-100 text-yellow-800' 
                    : 'text-gray-600 hover:text-gray-800 hover:bg-yellow-50'
                }`}
              >
                <Home className="w-4 h-4" />
                <span>Home</span>
              </Link>

              {user && (
                <Link
                  to="/favorites"
                  className={`flex items-center space-x-1 px-3 py-2 rounded-lg transition-colors ${
                    isActive('/favorites') 
                      ? 'bg-yellow-100 text-yellow-800' 
                      : 'text-gray-600 hover:text-gray-800 hover:bg-yellow-50'
                  }`}
                >
                  <Heart className="w-4 h-4" />
                  <span>Favorites</span>
                </Link>
              )}

              {user ? (
                <div className="flex items-center space-x-3">
                  <div className="flex items-center space-x-2 text-gray-600">
                    <User className="w-4 h-4" />
                    <span className="text-sm">{user.email || user.username}</span>
                  </div>
                  {user.type === 'admin' && (
                    <Link
                      to="/admin/dashboard"
                      className="flex items-center space-x-1 text-xs bg-yellow-100 text-yellow-700 px-2 py-1 rounded-full hover:bg-yellow-200 transition-colors"
                    >
                      <Settings className="w-3 h-3" />
                      <span>Admin</span>
                    </Link>
                  )}
                  <button
                    onClick={() => {
                      logout();
                      navigate('/signup');
                    }}
                    className="flex items-center space-x-1 px-3 py-2 rounded-lg text-gray-600 hover:text-gray-800 hover:bg-yellow-50 transition-colors"
                  >
                    <LogOut className="w-4 h-4" />
                    <span>Logout</span>
                  </button>
                </div>
              ) : (
                <button
                  onClick={() => navigate('/signup')}
                  className="flex items-center space-x-1 px-4 py-2 bg-gradient-to-r from-yellow-500 to-amber-600 text-white rounded-lg hover:from-yellow-600 hover:to-amber-700 transition-all duration-200 transform hover:scale-105"
                >
                  <LogIn className="w-4 h-4" />
                  <span>Sign Up</span>
                </button>
              )}
            </nav>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main>{children}</main>
    </div>
  );
}

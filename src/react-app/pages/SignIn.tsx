import { useState } from 'react';
import { useNavigate, Link } from 'react-router';
import { useSimpleAuth } from '@/react-app/hooks/useSimpleAuth';
import { Shield, User, LogIn, Loader2 } from 'lucide-react';
import Logo from '@/react-app/components/Logo';

export default function SignIn() {
  const navigate = useNavigate();
  const { login } = useSimpleAuth();
  const [userType, setUserType] = useState<'user' | 'admin'>('user');
  const [formData, setFormData] = useState({
    username: '',
    password: '',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | React.ReactNode>('');
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  const validateField = (name: string, value: string) => {
    const errors: Record<string, string> = {};
    
    switch (name) {
      case 'username':
        if (!value.trim()) {
          errors.username = userType === 'admin' ? 'Email is required' : 'Username is required';
        } else if (userType === 'admin' && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) {
          errors.username = 'Please enter a valid email address';
        }
        break;
      
      case 'password':
        if (!value) {
          errors.password = 'Password is required';
        } else if (value.length < 3) {
          errors.password = 'Password must be at least 3 characters long';
        }
        break;
    }
    
    return errors;
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value,
    }));
    
    // Clear general error
    setError('');
    
    // Validate field and update field errors
    const fieldValidationErrors = validateField(name, value);
    setFieldErrors(prev => ({
      ...prev,
      ...fieldValidationErrors,
      [name]: fieldValidationErrors[name] || ''
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    // Validate all fields
    const allErrors: Record<string, string> = {};
    Object.keys(formData).forEach(field => {
      const fieldErrors = validateField(field, formData[field as keyof typeof formData]);
      Object.assign(allErrors, fieldErrors);
    });

    if (Object.keys(allErrors).length > 0) {
      setFieldErrors(allErrors);
      setError('Please fix the errors below');
      setLoading(false);
      return;
    }

    try {
      const response = await fetch('/api/auth/signin', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          username: formData.username,
          password: formData.password,
          userType,
        }),
      });

      const data = await response.json();

      if (response.ok) {
        // Login user with simple auth
        login(data.user);
        
        // Redirect based on user type
        if (data.user.type === 'admin') {
          navigate('/admin/dashboard');
        } else {
          navigate('/');
        }
      } else {
        // Handle specific error cases
        if (response.status === 404 && data.suggestion === 'signup') {
          setError(
            <div>
              {data.error}
              <div className="mt-2">
                <Link 
                  to="/signup" 
                  className="text-yellow-600 hover:text-yellow-700 font-medium underline"
                >
                  Create Account
                </Link>
              </div>
            </div>
          );
        } else if (response.status === 403) {
          // User trying to use admin credentials in user mode
          setError(
            <div>
              {data.error}
              <div className="mt-2 text-sm text-gray-600">
                Switch to "Admin" account type above to sign in with admin credentials.
              </div>
            </div>
          );
        } else {
          setError(data.error || 'Sign in failed');
        }
      }
    } catch (error) {
      setError('Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-yellow-50 via-white to-yellow-100 flex items-center justify-center">
      <div className="bg-white border border-gray-200 rounded-2xl p-8 shadow-lg max-w-md w-full mx-4">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="mx-auto mb-4">
            <Logo size={80} />
          </div>
          <h1 className="text-3xl font-bold text-gray-800 mb-2">5 Minute Books</h1>
          <p className="text-gray-600">Discover and listen to your favorite books in bite-sized 5-minute audio summaries</p>
        </div>

        {/* User Type Selection */}
        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-700 mb-3">
            Choose Account Type
          </label>
          <div className="grid grid-cols-2 gap-3">
            <button
              type="button"
              onClick={() => setUserType('user')}
              className={`flex items-center justify-center space-x-2 py-3 px-4 border rounded-lg transition-all duration-200 ${
                userType === 'user'
                  ? 'border-yellow-500 bg-yellow-50 text-yellow-700'
                  : 'border-gray-200 text-gray-600 hover:bg-gray-50'
              }`}
            >
              <User className="w-4 h-4" />
              <span>User</span>
            </button>
            <button
              type="button"
              onClick={() => setUserType('admin')}
              className={`flex items-center justify-center space-x-2 py-3 px-4 border rounded-lg transition-all duration-200 ${
                userType === 'admin'
                  ? 'border-yellow-500 bg-yellow-50 text-yellow-700'
                  : 'border-gray-200 text-gray-600 hover:bg-gray-50'
              }`}
            >
              <Shield className="w-4 h-4" />
              <span>Admin</span>
            </button>
          </div>
        </div>

        {/* Sign In Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="username" className="block text-sm font-medium text-gray-700 mb-2">
              {userType === 'admin' ? 'Email' : 'Username'}
            </label>
            <input
              type={userType === 'admin' ? 'email' : 'text'}
              id="username"
              name="username"
              value={formData.username}
              onChange={handleInputChange}
              required
              className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:border-transparent ${
                fieldErrors.username 
                  ? 'border-red-300 focus:ring-red-500' 
                  : 'border-gray-200 focus:ring-yellow-500'
              }`}
              placeholder={userType === 'admin' ? 'Enter admin email' : 'Any username'}
            />
            {fieldErrors.username && (
              <p className="mt-1 text-sm text-red-600">{fieldErrors.username}</p>
            )}
          </div>

          <div>
            <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-2">
              Password
            </label>
            <input
              type="password"
              id="password"
              name="password"
              value={formData.password}
              onChange={handleInputChange}
              required
              className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:border-transparent ${
                fieldErrors.password 
                  ? 'border-red-300 focus:ring-red-500' 
                  : 'border-gray-200 focus:ring-yellow-500'
              }`}
              placeholder={userType === 'admin' ? 'Enter admin password' : 'Any password'}
            />
            {fieldErrors.password && (
              <p className="mt-1 text-sm text-red-600">{fieldErrors.password}</p>
            )}
          </div>

          {error && (
            <div className="text-red-600 text-sm bg-red-50 border border-red-200 rounded-lg p-3">
              {error}
            </div>
          )}

          {/* Instructions */}
          <div className="bg-gray-50 border border-gray-200 rounded-lg p-3 text-sm">
            {userType === 'admin' ? (
              <div className="text-gray-600">
                <p className="font-medium mb-1">Admin Access:</p>
                <p>Please enter your admin credentials to access the dashboard.</p>
              </div>
            ) : (
              <div className="text-gray-600">
                <p className="font-medium mb-2">User Mode:</p>
                <p className="mb-2">Sign in with your existing account or try demo credentials:</p>
                <div className="bg-white border border-gray-200 rounded p-2 text-xs">
                  <p><strong>Demo accounts:</strong></p>
                  <p>• Username: <code>demo</code>, Password: <code>demo</code></p>
                  <p>• Username: <code>test</code>, Password: <code>test</code></p>
                </div>
              </div>
            )}
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full flex items-center justify-center space-x-2 py-3 px-4 bg-gradient-to-r from-yellow-500 to-amber-600 text-white rounded-lg hover:from-yellow-600 hover:to-amber-700 transition-all duration-200 transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? (
              <Loader2 className="w-5 h-5 animate-spin" />
            ) : (
              <LogIn className="w-5 h-5" />
            )}
            <span>{loading ? 'Signing in...' : 'Sign In'}</span>
          </button>
        </form>

        {/* Sign Up Link */}
        <div className="mt-6 text-center">
          <p className="text-sm text-gray-600">
            Don't have an account?{' '}
            <Link
              to="/signup"
              className="text-yellow-600 hover:text-yellow-700 font-medium transition-colors"
            >
              Sign Up
            </Link>
          </p>
        </div>

        {/* Footer */}
        <div className="mt-6 text-center text-sm text-gray-500">
          Welcome to 5 Minute Books - Your gateway to quick learning
        </div>
      </div>
    </div>
  );
}

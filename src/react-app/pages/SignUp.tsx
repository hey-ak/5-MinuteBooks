import { useState } from 'react';
import { useNavigate, Link } from 'react-router';
import { useSimpleAuth } from '@/react-app/hooks/useSimpleAuth';
import { UserPlus, Loader2 } from 'lucide-react';
import Logo from '@/react-app/components/Logo';

export default function SignUp() {
  const navigate = useNavigate();
  const { login } = useSimpleAuth();
  const userType = 'user'; // Only allow user signups
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    password: '',
    confirmPassword: '',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  const validateField = (name: string, value: string) => {
    const errors: Record<string, string> = {};
    
    switch (name) {
      case 'username':
        if (!value.trim()) {
          errors.username = 'Username is required';
        } else if (value.length < 3) {
          errors.username = 'Username must be at least 3 characters long';
        } else if (!/^[a-zA-Z0-9_]+$/.test(value)) {
          errors.username = 'Username can only contain letters, numbers, and underscores';
        }
        break;
      
      case 'email':
        if (!value.trim()) {
          errors.email = 'Email is required';
        } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) {
          errors.email = 'Please enter a valid email address';
        }
        break;
      
      case 'password':
        if (!value) {
          errors.password = 'Password is required';
        } else if (value.length < 8) {
          errors.password = 'Password must be at least 8 characters long';
        } else if (!/(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/.test(value)) {
          errors.password = 'Password must contain at least one uppercase letter, one lowercase letter, and one number';
        }
        break;
      
      case 'confirmPassword':
        if (!value) {
          errors.confirmPassword = 'Please confirm your password';
        } else if (value !== formData.password) {
          errors.confirmPassword = 'Passwords do not match';
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
    
    // Special case: revalidate confirm password when password changes
    if (name === 'password' && formData.confirmPassword) {
      const confirmPasswordErrors = validateField('confirmPassword', formData.confirmPassword);
      setFieldErrors(prev => ({
        ...prev,
        confirmPassword: confirmPasswordErrors.confirmPassword || ''
      }));
    }
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
      const response = await fetch('/api/auth/signup', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          username: formData.username,
          email: formData.email,
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
        setError(data.error || 'Sign up failed');
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
          <p className="text-gray-600">Create your account to start listening</p>
        </div>



        {/* Sign Up Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="username" className="block text-sm font-medium text-gray-700 mb-2">
              Username
            </label>
            <input
              type="text"
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
              placeholder="Choose a username"
            />
            {fieldErrors.username && (
              <p className="mt-1 text-sm text-red-600">{fieldErrors.username}</p>
            )}
          </div>

          <div>
            <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
              Email
            </label>
            <input
              type="email"
              id="email"
              name="email"
              value={formData.email}
              onChange={handleInputChange}
              required
              className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:border-transparent ${
                fieldErrors.email 
                  ? 'border-red-300 focus:ring-red-500' 
                  : 'border-gray-200 focus:ring-yellow-500'
              }`}
              placeholder="your@email.com"
            />
            {fieldErrors.email && (
              <p className="mt-1 text-sm text-red-600">{fieldErrors.email}</p>
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
              placeholder="Create a secure password"
            />
            {fieldErrors.password && (
              <p className="mt-1 text-sm text-red-600">{fieldErrors.password}</p>
            )}
          </div>

          <div>
            <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700 mb-2">
              Confirm Password
            </label>
            <input
              type="password"
              id="confirmPassword"
              name="confirmPassword"
              value={formData.confirmPassword}
              onChange={handleInputChange}
              required
              className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:border-transparent ${
                fieldErrors.confirmPassword 
                  ? 'border-red-300 focus:ring-red-500' 
                  : 'border-gray-200 focus:ring-yellow-500'
              }`}
              placeholder="Confirm your password"
            />
            {fieldErrors.confirmPassword && (
              <p className="mt-1 text-sm text-red-600">{fieldErrors.confirmPassword}</p>
            )}
          </div>

          {error && (
            <div className="text-red-600 text-sm bg-red-50 border border-red-200 rounded-lg p-3">
              {error}
            </div>
          )}



          <button
            type="submit"
            disabled={loading}
            className="w-full flex items-center justify-center space-x-2 py-3 px-4 bg-gradient-to-r from-yellow-500 to-amber-600 text-white rounded-lg hover:from-yellow-600 hover:to-amber-700 transition-all duration-200 transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? (
              <Loader2 className="w-5 h-5 animate-spin" />
            ) : (
              <UserPlus className="w-5 h-5" />
            )}
            <span>{loading ? 'Creating Account...' : 'Create Account'}</span>
          </button>
        </form>

        {/* Sign In Link */}
        <div className="mt-6 text-center">
          <p className="text-sm text-gray-600">
            Already have an account?{' '}
            <Link
              to="/signin"
              className="text-yellow-600 hover:text-yellow-700 font-medium transition-colors"
            >
              Sign In
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

import { useState } from 'react';
import { FlaskConical, LogIn, AlertCircle } from 'lucide-react';
import api from '../../api';

interface LoginProps {
  onLogin: (userData: any) => void;
}

export default function Login({ onLogin }: LoginProps) {
  const [formData, setFormData] = useState({ username: '', password: '' });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    try {
      const response = await api.post('auth/login/', {
        username: formData.username.trim(),
        password: formData.password.trim(),
      });

      const payload = response.data;

      if (payload.success) {
        // Persist auth to sessionStorage so session survives page refresh
        const userData = {
          token: payload.data.token,
          username: payload.data.username,
          role: payload.data.role,
          lab: payload.data.lab,
          // legacy field used by some components
          laboratory: payload.data.lab,
        };
        sessionStorage.setItem('lims_auth', JSON.stringify(userData));
        onLogin(userData);
      } else {
        setError(payload.message || 'Invalid credentials. Please try again.');
      }
    } catch (err: any) {
      setError(err.response?.data?.message || 'Cannot connect to server. Make sure the Django backend is running on http://127.0.0.1:8000');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-gray-100 flex items-center justify-center px-4">
      <div className="w-full max-w-md">
        {/* Logo & Branding */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-20 h-20 bg-blue-600 rounded-full mb-4">
            <FlaskConical className="w-10 h-10 text-white" />
          </div>
          <h1 className="text-3xl font-bold text-gray-800 mb-2">
            Laboratory Information Management System
          </h1>
          <p className="text-gray-600">Industrial Fertilizer Manufacturing</p>
        </div>

        {/* Login Card */}
        <div className="bg-white rounded-lg shadow-lg p-8">
          <h2 className="text-2xl font-semibold text-gray-800 mb-6">Sign In</h2>

          {/* Error Banner */}
          {error && (
            <div className="mb-4 flex items-start gap-2 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
              <AlertCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit}>
            {/* Username */}
            <div className="mb-4">
              <label className="block text-gray-700 font-medium mb-2">
                Employee ID / Username
              </label>
              <input
                type="text"
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="e.g. Admin001 or Employee001"
                value={formData.username}
                onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                autoComplete="username"
                required
              />
            </div>

            {/* Password */}
            <div className="mb-6">
              <label className="block text-gray-700 font-medium mb-2">
                Password
              </label>
              <input
                type="password"
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Enter your password"
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                autoComplete="current-password"
                required
              />
            </div>

            {/* Login Button */}
            <button
              type="submit"
              disabled={isLoading}
              className={`w-full flex items-center justify-center gap-2 py-3 rounded-lg font-semibold transition-colors text-white ${isLoading ? 'bg-blue-400 cursor-not-allowed' : 'bg-blue-600 hover:bg-blue-700'
                }`}
            >
              <LogIn className="w-5 h-5" />
              {isLoading ? 'Signing in...' : 'Sign In'}
            </button>
          </form>
        </div>

        {/* Footer */}
        <div className="text-center mt-6 text-gray-500 text-sm">
          <p>© 2026 Industrial Fertilizer Manufacturing Organization</p>
          <p className="mt-1">Quality Control &amp; Laboratory Services</p>
        </div>
      </div>
    </div>
  );
}

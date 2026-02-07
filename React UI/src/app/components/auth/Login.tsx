import { useState } from 'react';
import { FlaskConical } from 'lucide-react';

interface LoginProps {
  onLogin: (userData: any) => void;
}

export default function Login({ onLogin }: LoginProps) {
  const [formData, setFormData] = useState({
    username: '',
    password: '',
    laboratory: 'central'
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // Mock login - in real Django, this would be handled by backend
    onLogin({
      username: formData.username,
      laboratory: formData.laboratory,
      role: formData.laboratory === 'central' ? 'Central Admin' : 'Plant Admin'
    });
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
          <h2 className="text-2xl font-semibold text-gray-800 mb-6">Login</h2>
          
          <form onSubmit={handleSubmit}>
            {/* Employee ID / Username */}
            <div className="mb-4">
              <label className="block text-gray-700 font-medium mb-2">
                Employee ID / Username
              </label>
              <input
                type="text"
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Enter your employee ID"
                value={formData.username}
                onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                required
              />
            </div>

            {/* Password */}
            <div className="mb-4">
              <label className="block text-gray-700 font-medium mb-2">
                Password
              </label>
              <input
                type="password"
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Enter your password"
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                required
              />
            </div>

            {/* Laboratory Selection */}
            <div className="mb-6">
              <label className="block text-gray-700 font-medium mb-2">
                Laboratory
              </label>
              <select
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                value={formData.laboratory}
                onChange={(e) => setFormData({ ...formData, laboratory: e.target.value })}
              >
                <option value="central">Central Laboratory</option>
                <option value="plant-1">Plant-1 Laboratory</option>
                <option value="plant-2">Plant-2 Laboratory</option>
                <option value="plant-3">Plant-3 Laboratory</option>
                <option value="plant-4">Plant-4 Laboratory</option>
                <option value="plant-5">Plant-5 Laboratory</option>
                <option value="plant-6">Plant-6 Laboratory</option>
                <option value="plant-7">Plant-7 Laboratory</option>
              </select>
            </div>

            {/* Login Button */}
            <button
              type="submit"
              className="w-full bg-blue-600 text-white py-3 rounded-lg font-semibold hover:bg-blue-700 transition-colors"
            >
              Login
            </button>
          </form>
        </div>

        {/* Footer */}
        <div className="text-center mt-6 text-gray-600 text-sm">
          <p>© 2026 Industrial Fertilizer Manufacturing Organization</p>
          <p className="mt-1">Quality Control & Laboratory Services</p>
        </div>
      </div>
    </div>
  );
}

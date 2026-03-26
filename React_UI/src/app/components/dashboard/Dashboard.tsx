import { TestTube, AlertTriangle, CheckCircle, TrendingUp, Clock, RefreshCw, ArrowRight, ShieldCheck, ShieldAlert } from 'lucide-react';
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import SystemInsights from './SystemInsights';
import QualityInsights from './QualityInsights';
import { useState, useEffect } from 'react';
import { Skeleton } from '../ui/Skeleton';
import api from '../../api';

interface DashboardProps {
  user: any;
  onNavigate: (page: string) => void;
  onLogout: () => void;
}

export default function Dashboard({ user, onNavigate, onLogout }: DashboardProps) {
  const [isLoading, setIsLoading] = useState(true);
  const [lastRefreshed, setLastRefreshed] = useState(new Date());
  const [stats, setStats] = useState({
    samples_today: 0,
    pct_change_yesterday: 0,
    pending_approvals: 0,
    active_alerts: 0,
    monthly_samples: 0,
    daily_samples: [] as { day: string; samples: number }[],
  });
  const [recentTests, setRecentTests] = useState<any[]>([]);

  // Mock chart data (production data is not stored per-product yet)
  const productionData = [
    { month: 'Jan', urea: 4500, dap: 3200, npk: 2800 },
    { month: 'Feb', urea: 4800, dap: 3400, npk: 3000 },
    { month: 'Mar', urea: 5200, dap: 3600, npk: 3200 },
    { month: 'Apr', urea: 4900, dap: 3500, npk: 3100 },
    { month: 'May', urea: 5500, dap: 3800, npk: 3400 },
    { month: 'Jun', urea: 5300, dap: 3700, npk: 3300 },
  ];

  const fetchDashboardData = async () => {
    setIsLoading(true);
    try {
      const [statsRes, labRes] = await Promise.all([
        api.get('dashboard/stats/'),
        api.get('labdata/latest/'),
      ]);
      if (statsRes.data.success && statsRes.data.data) {
        setStats(statsRes.data.data);
      }
      if (labRes.data.success && labRes.data.data) {
        const records = labRes.data.data.records || [];
        setRecentTests(records.slice(0, 3));
      }
    } catch (err) {
      console.error('Dashboard fetch failed', err);
    } finally {
      setIsLoading(false);
      setLastRefreshed(new Date());
    }
  };

  useEffect(() => {
    fetchDashboardData();
    const interval = setInterval(fetchDashboardData, 300000);
    return () => clearInterval(interval);
  }, []);

  return (
    <>
      <div className="flex justify-between items-center mb-6">
        <div>
            <h2 className="text-2xl font-bold text-gray-800">Laboratory Dashboard</h2>
            <p className="text-sm text-gray-500">Welcome back, {user?.username} ({user?.lab})</p>
        </div>
        <button 
           onClick={fetchDashboardData} 
           disabled={isLoading}
           className="flex items-center gap-2 px-3 py-1.5 bg-white border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50 transition-colors"
        >
            <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin text-blue-500' : ''}`} />
            {isLoading ? 'Refreshing...' : `Refreshed ${lastRefreshed.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit'})}`}
        </button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {/* Samples Today */}
        <div className="bg-white rounded-lg shadow p-6 border-l-4 border-blue-500 min-h-[140px]">
          <div className="flex items-center justify-between h-full">
            <div className="flex flex-col h-full justify-between">
              <p className="text-gray-500 text-sm font-medium">Samples Today</p>
              {isLoading ? <Skeleton className="h-10 w-24 my-2" /> : <p className="text-3xl font-bold text-gray-800 mt-2">{stats.samples_today}</p>}
              {isLoading ? <Skeleton className="h-5 w-32" /> : (
                <p className={`text-sm mt-2 flex items-center gap-1 ${stats.pct_change_yesterday >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                  <TrendingUp className="w-4 h-4" />
                  {stats.pct_change_yesterday >= 0 ? '+' : ''}{stats.pct_change_yesterday}% from yesterday
                </p>
              )}
            </div>
            <div className="bg-blue-100 p-3 rounded-full">
              <TestTube className="w-8 h-8 text-blue-600" />
            </div>
          </div>
        </div>

        {/* Pending Approvals */}
        <div className="bg-white rounded-lg shadow p-6 border-l-4 border-yellow-500 min-h-[140px]">
          <div className="flex items-center justify-between h-full">
            <div className="flex flex-col h-full justify-between">
              <p className="text-gray-500 text-sm font-medium">Pending Approvals</p>
              {isLoading ? <Skeleton className="h-10 w-24 my-2" /> : <p className="text-3xl font-bold text-gray-800 mt-2">{stats.pending_approvals}</p>}
              {isLoading ? <Skeleton className="h-5 w-32" /> : (
                  <p className="text-gray-500 text-sm mt-2 flex items-center gap-1">
                    <Clock className="w-4 h-4" />
                    Requires attention
                  </p>
              )}
            </div>
            <div className="bg-yellow-100 p-3 rounded-full">
              <AlertTriangle className="w-8 h-8 text-yellow-600" />
            </div>
          </div>
        </div>

        {/* Inventory Alerts */}
        <div className="bg-white rounded-lg shadow p-6 border-l-4 border-red-500 min-h-[140px]">
          <div className="flex items-center justify-between h-full">
            <div className="flex flex-col h-full justify-between">
              <p className="text-gray-500 text-sm font-medium">Inventory Alerts</p>
              {isLoading ? <Skeleton className="h-10 w-24 my-2" /> : <p className="text-3xl font-bold text-gray-800 mt-2">{stats.active_alerts}</p>}
              {isLoading ? <Skeleton className="h-5 w-32" /> : <p className="text-red-600 text-sm mt-2">Low stock items</p>}
            </div>
            <div className="bg-red-100 p-3 rounded-full">
              <AlertTriangle className="w-8 h-8 text-red-600" />
            </div>
          </div>
        </div>

        {/* Monthly Samples */}
        <div className="bg-white rounded-lg shadow p-6 border-l-4 border-green-500 min-h-[140px]">
          <div className="flex items-center justify-between h-full">
            <div className="flex flex-col h-full justify-between">
              <p className="text-gray-500 text-sm font-medium">Monthly Samples</p>
              {isLoading ? <Skeleton className="h-10 w-24 my-2" /> : <p className="text-3xl font-bold text-gray-800 mt-2">{stats.monthly_samples.toLocaleString()}</p>}
              {isLoading ? <Skeleton className="h-5 w-32" /> : <p className="text-gray-500 text-sm mt-2">This Month</p>}
            </div>
            <div className="bg-green-100 p-3 rounded-full">
              <CheckCircle className="w-8 h-8 text-green-600" />
            </div>
          </div>
        </div>
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        {/* Monthly Production Chart */}
        <div className="bg-white rounded-lg shadow p-6 relative">
          <h3 className="text-lg font-semibold text-gray-800 mb-4">Monthly Production (MT)</h3>
          {isLoading ? (
              <div className="absolute inset-x-6 bottom-6 top-16 flex items-end gap-2">
                  <Skeleton className="w-full h-1/4" />
                  <Skeleton className="w-full h-2/4" />
                  <Skeleton className="w-full h-1/2" />
                  <Skeleton className="w-full h-2/3" />
                  <Skeleton className="w-full h-full" />
                  <Skeleton className="w-full h-3/4" />
              </div>
          ) : (
             <ResponsiveContainer width="100%" height={300}>
                <BarChart data={productionData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="month" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="urea" fill="#3b82f6" name="Urea" />
                  <Bar dataKey="dap" fill="#10b981" name="DAP" />
                  <Bar dataKey="npk" fill="#f59e0b" name="NPK" />
                </BarChart>
              </ResponsiveContainer>
          )}
        </div>

        {/* Daily Samples Chart */}
        <div className="bg-white rounded-lg shadow p-6 relative">
          <h3 className="text-lg font-semibold text-gray-800 mb-4">Daily Samples - This Week</h3>
          {isLoading ? (
              <div className="absolute inset-x-6 bottom-6 top-16 flex items-end gap-2">
                  <Skeleton className="w-full h-1/4" />
                  <Skeleton className="w-full h-2/4" />
                  <Skeleton className="w-full h-1/2" />
                  <Skeleton className="w-full h-2/3" />
                  <Skeleton className="w-full h-full" />
                  <Skeleton className="w-full h-3/4" />
              </div>
          ) : (
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={stats.daily_samples}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="day" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Line type="monotone" dataKey="samples" stroke="#3b82f6" strokeWidth={2} name="Samples" />
                </LineChart>
              </ResponsiveContainer>
          )}
        </div>
      </div>

      {/* System Insights Panel */}
      <div className="mb-6">
        <SystemInsights recentTests={recentTests} isLoading={isLoading} onNavigate={onNavigate} />
      </div>

      {/* Quality Insights Panel */}
      <div className="mb-6">
        <QualityInsights />
      </div>

    </>
  );
}

import Layout from '../layout/Layout';
import { TestTube, AlertTriangle, CheckCircle, TrendingUp, Clock } from 'lucide-react';
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

interface DashboardProps {
  user: any;
  onNavigate: (page: string) => void;
  onLogout: () => void;
}

export default function Dashboard({ user, onNavigate, onLogout }: DashboardProps) {
  // Mock data for charts
  const productionData = [
    { month: 'Jan', urea: 4500, dap: 3200, npk: 2800 },
    { month: 'Feb', urea: 4800, dap: 3400, npk: 3000 },
    { month: 'Mar', urea: 5200, dap: 3600, npk: 3200 },
    { month: 'Apr', urea: 4900, dap: 3500, npk: 3100 },
    { month: 'May', urea: 5500, dap: 3800, npk: 3400 },
    { month: 'Jun', urea: 5300, dap: 3700, npk: 3300 },
  ];

  const dailySamplesData = [
    { day: 'Mon', samples: 45 },
    { day: 'Tue', samples: 52 },
    { day: 'Wed', samples: 48 },
    { day: 'Thu', samples: 61 },
    { day: 'Fri', samples: 55 },
    { day: 'Sat', samples: 38 },
    { day: 'Sun', samples: 28 },
  ];

  const recentActivities = [
    { id: 1, sample: 'S-2026-0205-001', product: 'Urea', analyst: 'John Doe', status: 'Completed', time: '2 hours ago' },
    { id: 2, sample: 'S-2026-0205-002', product: 'DAP', analyst: 'Jane Smith', status: 'Pending', time: '3 hours ago' },
    { id: 3, sample: 'S-2026-0205-003', product: 'NPK', analyst: 'Mike Johnson', status: 'Completed', time: '4 hours ago' },
    { id: 4, sample: 'S-2026-0205-004', product: 'Urea', analyst: 'Sarah Williams', status: 'In Progress', time: '5 hours ago' },
    { id: 5, sample: 'S-2026-0205-005', product: 'SSP', analyst: 'David Brown', status: 'Completed', time: '6 hours ago' },
  ];

  return (
    <Layout user={user} onNavigate={onNavigate} onLogout={onLogout} currentPage="dashboard">
      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {/* Samples Today */}
        <div className="bg-white rounded-lg shadow p-6 border-l-4 border-blue-500">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-500 text-sm font-medium">Samples Today</p>
              <p className="text-3xl font-bold text-gray-800 mt-2">48</p>
              <p className="text-green-600 text-sm mt-2 flex items-center gap-1">
                <TrendingUp className="w-4 h-4" />
                +12% from yesterday
              </p>
            </div>
            <div className="bg-blue-100 p-3 rounded-full">
              <TestTube className="w-8 h-8 text-blue-600" />
            </div>
          </div>
        </div>

        {/* Pending Approvals */}
        <div className="bg-white rounded-lg shadow p-6 border-l-4 border-yellow-500">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-500 text-sm font-medium">Pending Approvals</p>
              <p className="text-3xl font-bold text-gray-800 mt-2">12</p>
              <p className="text-gray-500 text-sm mt-2 flex items-center gap-1">
                <Clock className="w-4 h-4" />
                Requires attention
              </p>
            </div>
            <div className="bg-yellow-100 p-3 rounded-full">
              <AlertTriangle className="w-8 h-8 text-yellow-600" />
            </div>
          </div>
        </div>

        {/* Inventory Alerts */}
        <div className="bg-white rounded-lg shadow p-6 border-l-4 border-red-500">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-500 text-sm font-medium">Inventory Alerts</p>
              <p className="text-3xl font-bold text-gray-800 mt-2">3</p>
              <p className="text-red-600 text-sm mt-2">Low stock items</p>
            </div>
            <div className="bg-red-100 p-3 rounded-full">
              <AlertTriangle className="w-8 h-8 text-red-600" />
            </div>
          </div>
        </div>

        {/* Monthly Production */}
        <div className="bg-white rounded-lg shadow p-6 border-l-4 border-green-500">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-500 text-sm font-medium">Monthly Production</p>
              <p className="text-3xl font-bold text-gray-800 mt-2">14,400</p>
              <p className="text-gray-500 text-sm mt-2">MT (Metric Tons)</p>
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
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold text-gray-800 mb-4">Monthly Production (MT)</h3>
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
        </div>

        {/* Daily Samples Chart */}
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold text-gray-800 mb-4">Daily Samples - This Week</h3>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={dailySamplesData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="day" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Line type="monotone" dataKey="samples" stroke="#3b82f6" strokeWidth={2} name="Samples" />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Recent Activity Table */}
      <div className="bg-white rounded-lg shadow">
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-semibold text-gray-800">Recent Activity</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Sample ID
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Product
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Analyst
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Time
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {recentActivities.map((activity) => (
                <tr key={activity.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                    {activity.sample}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                    {activity.product}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                    {activity.analyst}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-3 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${
                      activity.status === 'Completed'
                        ? 'bg-green-100 text-green-800'
                        : activity.status === 'Pending'
                        ? 'bg-yellow-100 text-yellow-800'
                        : 'bg-blue-100 text-blue-800'
                    }`}>
                      {activity.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {activity.time}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </Layout>
  );
}

import Layout from '../layout/Layout';
import { 
  BarChart, 
  Bar, 
  LineChart, 
  Line, 
  PieChart, 
  Pie, 
  Cell,
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend, 
  ResponsiveContainer 
} from 'recharts';
import { Calendar, TrendingUp, Download } from 'lucide-react';

interface AnalyticsIndexProps {
  user: any;
  onNavigate: (page: string) => void;
  onLogout: () => void;
}

export default function AnalyticsIndex({ user, onNavigate, onLogout }: AnalyticsIndexProps) {
  // Monthly Production Data
  const monthlyProduction = [
    { month: 'Jan', urea: 4500, dap: 3200, npk: 2800, ssp: 1800 },
    { month: 'Feb', urea: 4800, dap: 3400, npk: 3000, ssp: 1900 },
    { month: 'Mar', urea: 5200, dap: 3600, npk: 3200, ssp: 2100 },
    { month: 'Apr', urea: 4900, dap: 3500, npk: 3100, ssp: 2000 },
    { month: 'May', urea: 5500, dap: 3800, npk: 3400, ssp: 2200 },
    { month: 'Jun', urea: 5300, dap: 3700, npk: 3300, ssp: 2150 },
  ];

  // Daily Raw Material Usage
  const dailyMaterialUsage = [
    { day: 'Mon', nitrogen: 120, sulphuric: 85, ammonia: 95 },
    { day: 'Tue', nitrogen: 135, sulphuric: 92, ammonia: 105 },
    { day: 'Wed', nitrogen: 125, sulphuric: 88, ammonia: 98 },
    { day: 'Thu', nitrogen: 142, sulphuric: 95, ammonia: 110 },
    { day: 'Fri', nitrogen: 138, sulphuric: 90, ammonia: 108 },
    { day: 'Sat', nitrogen: 110, sulphuric: 75, ammonia: 85 },
    { day: 'Sun', nitrogen: 95, sulphuric: 65, ammonia: 72 },
  ];

  // Product Contribution
  const productContribution = [
    { name: 'Urea', value: 35, color: '#3b82f6' },
    { name: 'DAP', value: 25, color: '#10b981' },
    { name: 'NPK', value: 22, color: '#f59e0b' },
    { name: 'SSP', value: 12, color: '#ef4444' },
    { name: 'Others', value: 6, color: '#8b5cf6' },
  ];

  // Lab Performance (Samples per Plant)
  const labPerformance = [
    { lab: 'Central', samples: 425 },
    { lab: 'Plant-1', samples: 285 },
    { lab: 'Plant-2', samples: 310 },
    { lab: 'Plant-3', samples: 265 },
    { lab: 'Plant-4', samples: 295 },
    { lab: 'Plant-5', samples: 275 },
    { lab: 'Plant-6', samples: 240 },
    { lab: 'Plant-7', samples: 220 },
  ];

  // Quality Metrics Trend
  const qualityMetrics = [
    { week: 'Week 1', purity: 98.5, moisture: 0.8 },
    { week: 'Week 2', purity: 98.7, moisture: 0.7 },
    { week: 'Week 3', purity: 98.3, moisture: 0.9 },
    { week: 'Week 4', purity: 98.9, moisture: 0.6 },
  ];

  return (
    <Layout user={user} onNavigate={onNavigate} onLogout={onLogout} currentPage="analytics">
      <div>
        {/* Page Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-2xl font-bold text-gray-800">Analytics & Insights</h2>
            <p className="text-gray-600">Comprehensive data visualization and analysis</p>
          </div>
          <button className="flex items-center gap-2 bg-blue-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-blue-700 transition-colors">
            <Download className="w-5 h-5" />
            Export Dashboard
          </button>
        </div>

        {/* Filters */}
        <div className="bg-white rounded-lg shadow p-4 mb-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <label className="block text-gray-700 font-medium mb-2">Date Range</label>
              <select className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500">
                <option>Last 7 Days</option>
                <option>Last 30 Days</option>
                <option>Last 3 Months</option>
                <option>Last 6 Months</option>
                <option>Custom Range</option>
              </select>
            </div>
            <div>
              <label className="block text-gray-700 font-medium mb-2">Product</label>
              <select className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500">
                <option>All Products</option>
                <option>Urea</option>
                <option>DAP</option>
                <option>NPK</option>
                <option>SSP</option>
              </select>
            </div>
            <div>
              <label className="block text-gray-700 font-medium mb-2">Laboratory</label>
              <select className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500">
                <option>All Labs</option>
                <option>Central Lab</option>
                <option>Plant-1</option>
                <option>Plant-2</option>
                <option>Plant-3</option>
                <option>Plant-4</option>
                <option>Plant-5</option>
                <option>Plant-6</option>
                <option>Plant-7</option>
              </select>
            </div>
            <div className="flex items-end">
              <button className="w-full flex items-center justify-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700">
                <Calendar className="w-5 h-5" />
                Apply
              </button>
            </div>
          </div>
        </div>

        {/* Charts Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
          {/* Monthly Production - Bar Chart */}
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-800">Monthly Production (MT)</h3>
              <TrendingUp className="w-5 h-5 text-green-600" />
            </div>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={monthlyProduction}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Bar dataKey="urea" fill="#3b82f6" name="Urea" />
                <Bar dataKey="dap" fill="#10b981" name="DAP" />
                <Bar dataKey="npk" fill="#f59e0b" name="NPK" />
                <Bar dataKey="ssp" fill="#ef4444" name="SSP" />
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* Product Contribution - Pie Chart */}
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-lg font-semibold text-gray-800 mb-4">Product Contribution (%)</h3>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={productContribution}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, value }) => `${name}: ${value}%`}
                  outerRadius={100}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {productContribution.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>

          {/* Daily Raw Material Usage - Line Chart */}
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-lg font-semibold text-gray-800 mb-4">Daily Raw Material Usage (MT)</h3>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={dailyMaterialUsage}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="day" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Line type="monotone" dataKey="nitrogen" stroke="#3b82f6" strokeWidth={2} name="Nitrogen" />
                <Line type="monotone" dataKey="sulphuric" stroke="#ef4444" strokeWidth={2} name="Sulphuric Acid" />
                <Line type="monotone" dataKey="ammonia" stroke="#10b981" strokeWidth={2} name="Ammonia" />
              </LineChart>
            </ResponsiveContainer>
          </div>

          {/* Lab Performance - Bar Chart */}
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-lg font-semibold text-gray-800 mb-4">Lab Performance - Samples Processed</h3>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={labPerformance} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis type="number" />
                <YAxis dataKey="lab" type="category" width={80} />
                <Tooltip />
                <Bar dataKey="samples" fill="#8b5cf6" name="Samples" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Quality Metrics */}
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold text-gray-800 mb-4">Quality Metrics Trend</h3>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={qualityMetrics}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="week" />
              <YAxis yAxisId="left" domain={[97, 100]} />
              <YAxis yAxisId="right" orientation="right" domain={[0, 2]} />
              <Tooltip />
              <Legend />
              <Line 
                yAxisId="left" 
                type="monotone" 
                dataKey="purity" 
                stroke="#10b981" 
                strokeWidth={3} 
                name="Purity (%)" 
              />
              <Line 
                yAxisId="right" 
                type="monotone" 
                dataKey="moisture" 
                stroke="#ef4444" 
                strokeWidth={3} 
                name="Moisture (%)" 
              />
            </LineChart>
          </ResponsiveContainer>
        </div>

        {/* Key Performance Indicators */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mt-6">
          <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg shadow p-6 text-white">
            <p className="text-sm opacity-90 mb-1">Total Production (This Month)</p>
            <p className="text-3xl font-bold">14,400 MT</p>
            <p className="text-sm mt-2 opacity-90">+8% from last month</p>
          </div>
          <div className="bg-gradient-to-br from-green-500 to-green-600 rounded-lg shadow p-6 text-white">
            <p className="text-sm opacity-90 mb-1">Average Purity</p>
            <p className="text-3xl font-bold">98.6%</p>
            <p className="text-sm mt-2 opacity-90">Within standards</p>
          </div>
          <div className="bg-gradient-to-br from-purple-500 to-purple-600 rounded-lg shadow p-6 text-white">
            <p className="text-sm opacity-90 mb-1">Samples Analyzed</p>
            <p className="text-3xl font-bold">2,315</p>
            <p className="text-sm mt-2 opacity-90">This month</p>
          </div>
          <div className="bg-gradient-to-br from-orange-500 to-orange-600 rounded-lg shadow p-6 text-white">
            <p className="text-sm opacity-90 mb-1">Material Efficiency</p>
            <p className="text-3xl font-bold">94.2%</p>
            <p className="text-sm mt-2 opacity-90">+2.3% improvement</p>
          </div>
        </div>
      </div>
    </Layout>
  );
}

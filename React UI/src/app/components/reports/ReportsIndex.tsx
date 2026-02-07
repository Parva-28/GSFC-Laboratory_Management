import Layout from '../layout/Layout';
import { FileText, Download, Calendar, Filter } from 'lucide-react';

interface ReportsIndexProps {
  user: any;
  onNavigate: (page: string) => void;
  onLogout: () => void;
}

export default function ReportsIndex({ user, onNavigate, onLogout }: ReportsIndexProps) {
  const reportCategories = [
    {
      id: 1,
      category: 'Production Reports',
      icon: '🏭',
      reports: [
        { name: 'Daily Production Summary', period: 'Daily', format: 'PDF/Excel' },
        { name: 'Monthly Production Analysis', period: 'Monthly', format: 'PDF/Excel' },
        { name: 'Product-wise Output Report', period: 'Custom', format: 'PDF/Excel' },
        { name: 'Batch Production Report', period: 'Per Batch', format: 'PDF' }
      ]
    },
    {
      id: 2,
      category: 'Inventory Reports',
      icon: '📦',
      reports: [
        { name: 'Current Stock Levels', period: 'Real-time', format: 'PDF/Excel' },
        { name: 'Material Consumption Report', period: 'Daily/Monthly', format: 'Excel' },
        { name: 'Low Stock Alert Report', period: 'Real-time', format: 'PDF' },
        { name: 'Inventory Movement History', period: 'Custom', format: 'Excel' }
      ]
    },
    {
      id: 3,
      category: 'Lab Performance Reports',
      icon: '🧪',
      reports: [
        { name: 'Sample Analysis Report', period: 'Daily', format: 'PDF' },
        { name: 'Quality Control Metrics', period: 'Weekly/Monthly', format: 'PDF/Excel' },
        { name: 'Analyst Performance Report', period: 'Monthly', format: 'PDF' },
        { name: 'Test Result Summary', period: 'Custom', format: 'Excel' }
      ]
    },
    {
      id: 4,
      category: 'Tanker & Logistics Reports',
      icon: '🚛',
      reports: [
        { name: 'Tanker Arrival Register', period: 'Daily', format: 'PDF/Excel' },
        { name: 'Dispatch Summary Report', period: 'Daily/Monthly', format: 'PDF/Excel' },
        { name: 'Material Traceability Report', period: 'Per Batch', format: 'PDF' },
        { name: 'Supplier Performance Report', period: 'Monthly', format: 'Excel' }
      ]
    },
    {
      id: 5,
      category: 'Compliance & Audit Reports',
      icon: '✅',
      reports: [
        { name: 'Regulatory Compliance Report', period: 'Monthly', format: 'PDF' },
        { name: 'Audit Trail Report', period: 'Custom', format: 'PDF/Excel' },
        { name: 'Quality Assurance Summary', period: 'Monthly', format: 'PDF' },
        { name: 'Safety & Standards Report', period: 'Monthly', format: 'PDF' }
      ]
    }
  ];

  return (
    <Layout user={user} onNavigate={onNavigate} onLogout={onLogout} currentPage="reports">
      <div>
        {/* Page Header */}
        <div className="mb-6">
          <h2 className="text-2xl font-bold text-gray-800">Reports</h2>
          <p className="text-gray-600">Generate and download comprehensive reports</p>
        </div>

        {/* Filter Section */}
        <div className="bg-white rounded-lg shadow p-4 mb-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-gray-700 font-medium mb-2">From Date</label>
              <input
                type="date"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-gray-700 font-medium mb-2">To Date</label>
              <input
                type="date"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div className="flex items-end">
              <button className="w-full flex items-center justify-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700">
                <Filter className="w-5 h-5" />
                Apply Filters
              </button>
            </div>
          </div>
        </div>

        {/* Report Categories */}
        <div className="space-y-6">
          {reportCategories.map((category) => (
            <div key={category.id} className="bg-white rounded-lg shadow">
              <div className="px-6 py-4 border-b border-gray-200 bg-gray-50">
                <h3 className="text-lg font-semibold text-gray-800 flex items-center gap-2">
                  <span className="text-2xl">{category.icon}</span>
                  {category.category}
                </h3>
              </div>
              <div className="p-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {category.reports.map((report, index) => (
                    <div
                      key={index}
                      className="border border-gray-200 rounded-lg p-4 hover:border-blue-500 hover:shadow-md transition-all cursor-pointer"
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-start gap-3">
                            <FileText className="w-5 h-5 text-blue-600 mt-1 flex-shrink-0" />
                            <div>
                              <h4 className="font-semibold text-gray-800 mb-1">
                                {report.name}
                              </h4>
                              <div className="flex flex-wrap gap-2 text-xs text-gray-600">
                                <span className="flex items-center gap-1">
                                  <Calendar className="w-3 h-3" />
                                  {report.period}
                                </span>
                                <span className="text-gray-400">•</span>
                                <span>{report.format}</span>
                              </div>
                            </div>
                          </div>
                        </div>
                        <button className="ml-2 p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors">
                          <Download className="w-5 h-5" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Quick Actions */}
        <div className="mt-8 bg-gradient-to-r from-blue-600 to-blue-700 rounded-lg shadow p-6 text-white">
          <h3 className="text-xl font-semibold mb-4">Quick Export Options</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <button className="bg-white text-blue-600 px-6 py-3 rounded-lg font-semibold hover:bg-blue-50 transition-colors">
              Export Today's Data
            </button>
            <button className="bg-white text-blue-600 px-6 py-3 rounded-lg font-semibold hover:bg-blue-50 transition-colors">
              Export This Week
            </button>
            <button className="bg-white text-blue-600 px-6 py-3 rounded-lg font-semibold hover:bg-blue-50 transition-colors">
              Export This Month
            </button>
          </div>
        </div>
      </div>
    </Layout>
  );
}

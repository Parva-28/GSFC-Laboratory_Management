import { FileText, Download, Calendar, Filter, Building2, FileSpreadsheet } from 'lucide-react';
import { useState } from 'react';
import api from '../../api';

interface ReportsIndexProps {
  user: any;
  onNavigate: (page: string) => void;
  onLogout: () => void;
}

export default function ReportsIndex({ user, onNavigate, onLogout }: ReportsIndexProps) {
  const isAdmin = user?.role === 'SUPER_ADMIN' || user?.role === 'LAB_ADMIN';
  const [selectedLab, setSelectedLab] = useState(isAdmin ? 'ALL' : user?.lab || '');

  const labs = ['Urea-1', 'Urea-2', 'Ammonia-4', 'AS-1', 'Caprolactam-1', 'Melamine-3', 'Nylon-6'];
  const [isDownloading, setIsDownloading] = useState(false);

  const handleDownloadReport = async (dataset: string, format: 'pdf' | 'excel') => {
    try {
      setIsDownloading(true);
      const res = await api.get(`/api/export/${format}/${dataset}/`, {
        responseType: 'blob', // Important for file downloads
      });
      
      const url = window.URL.createObjectURL(new Blob([res.data]));
      const link = document.createElement('a');
      link.href = url;
      // Extract filename from headers if possible, else fallback
      const disposition = res.headers['content-disposition'];
      let fileName = `${dataset}_report.${format === 'excel' ? 'xlsx' : 'pdf'}`;
      if (disposition && disposition.indexOf('attachment') !== -1) {
          const filenameRegex = /filename[^;=\n]*=((['"]).*?\2|[^;\n]*)/;
          const matches = filenameRegex.exec(disposition);
          if (matches != null && matches[1]) { 
            fileName = matches[1].replace(/['"]/g, '');
          }
      }

      link.setAttribute('download', fileName);
      document.body.appendChild(link);
      link.click();
      link.parentNode?.removeChild(link);
    } catch (err) {
      console.error('Download failed:', err);
      alert('Failed to download report. Please try again.');
    } finally {
      setIsDownloading(false);
    }
  };

  const reportCategories = [
    {
      id: 1,
      category: 'Lab Data Reports',
      icon: '🧪',
      reports: [
        { name: 'Complete Lab Data (All Labs)', dataset: 'labdata', format: 'PDF/Excel' },
      ]
    },
    {
      id: 2,
      category: 'Logistics Reports',
      icon: '🚛',
      reports: [
        { name: 'Tanker Arrival & Dispatch History', dataset: 'tankers', format: 'PDF/Excel' },
      ]
    }
  ];

  return (
    <>
      <div>
        {/* Page Header */}
        <div className="mb-6">
          <h2 className="text-2xl font-bold text-gray-800">Reports Export</h2>
          <p className="text-gray-600">Generate and download comprehensive data reports</p>
        </div>

        {/* Filter Section */}
        <div className="bg-white rounded-lg shadow p-4 mb-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
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
            <div>
              <label className="block text-gray-700 font-medium mb-2 flex items-center gap-1">
                <Building2 className="w-4 h-4" /> Laboratory
              </label>
              <select
                value={selectedLab}
                onChange={(e) => setSelectedLab(e.target.value)}
                disabled={!isAdmin}
                className={`w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${!isAdmin ? 'bg-gray-100 cursor-not-allowed' : ''}`}
              >
                {isAdmin && <option value="ALL">All Laboratories</option>}
                {labs.map(lab => (
                  <option key={lab} value={lab}>{lab}</option>
                ))}
              </select>
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
                      className="border border-gray-200 rounded-lg p-4 hover:border-blue-500 hover:shadow-md transition-all"
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
                                  All Time
                                </span>
                                <span className="text-gray-400">•</span>
                                <span>{report.format}</span>
                              </div>
                            </div>
                          </div>
                        </div>
                        <div className="flex gap-2">
                            <button 
                                onClick={() => handleDownloadReport(report.dataset, 'excel')}
                                disabled={isDownloading}
                                className="p-2 text-green-600 hover:bg-green-50 rounded-lg transition-colors disabled:opacity-50"
                                title="Download Excel"
                            >
                                <FileSpreadsheet className="w-5 h-5" />
                            </button>
                            <button 
                                onClick={() => handleDownloadReport(report.dataset, 'pdf')}
                                disabled={isDownloading}
                                className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors disabled:opacity-50"
                                title="Download PDF"
                            >
                                <Download className="w-5 h-5" />
                            </button>
                        </div>
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
    </>
  );
}

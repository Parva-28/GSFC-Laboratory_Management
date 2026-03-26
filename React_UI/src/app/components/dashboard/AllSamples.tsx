import { useState, useEffect } from 'react';
import { TestTube, ShieldCheck, ShieldAlert, ArrowLeft, Search, Filter } from 'lucide-react';
import api from '../../api';

interface AllSamplesProps {
  user: any;
  onNavigate: (page: string) => void;
  onLogout: () => void;
}

export default function AllSamples({ user, onNavigate, onLogout }: AllSamplesProps) {
  const [samples, setSamples] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState<'all' | 'passed' | 'anomaly'>('all');

  useEffect(() => {
    fetchAllSamples();
  }, []);

  const fetchAllSamples = async () => {
    setLoading(true);
    try {
      const res = await api.get('labdata/latest/');
      if (res.data.success && res.data.data) {
        setSamples(res.data.data.records || []);
      }
    } catch (err) {
      console.error('Failed to fetch samples:', err);
    } finally {
      setLoading(false);
    }
  };

  const filteredSamples = samples.filter((s) => {
    const matchesSearch =
      !searchTerm ||
      (s.sample_id || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (s.product || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (s.analyst || '').toLowerCase().includes(searchTerm.toLowerCase());

    const matchesFilter =
      filterStatus === 'all' ||
      (filterStatus === 'passed' && s.anomaly_flag !== 'YES') ||
      (filterStatus === 'anomaly' && s.anomaly_flag === 'YES');

    return matchesSearch && matchesFilter;
  });

  const passedCount = samples.filter((s) => s.anomaly_flag !== 'YES').length;
  const anomalyCount = samples.filter((s) => s.anomaly_flag === 'YES').length;

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <button
            onClick={() => onNavigate('dashboard')}
            className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
          >
            <ArrowLeft className="w-5 h-5 text-gray-600" />
          </button>
          <div>
            <h2 className="text-2xl font-bold text-gray-800">All Test Samples</h2>
            <p className="text-sm text-gray-500">{samples.length} total records • {passedCount} passed • {anomalyCount} anomalies</p>
          </div>
        </div>
      </div>

      {/* Filters Bar */}
      <div className="bg-white rounded-lg shadow p-4 mb-6 flex flex-col md:flex-row items-center gap-4">
        <div className="relative flex-1 w-full">
          <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search by Sample ID, Product, or Analyst..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
          />
        </div>
        <div className="flex items-center gap-2">
          <Filter className="w-4 h-4 text-gray-500" />
          <button
            onClick={() => setFilterStatus('all')}
            className={`px-3 py-1.5 text-xs font-medium rounded-full transition-colors ${
              filterStatus === 'all' ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            All ({samples.length})
          </button>
          <button
            onClick={() => setFilterStatus('passed')}
            className={`px-3 py-1.5 text-xs font-medium rounded-full transition-colors ${
              filterStatus === 'passed' ? 'bg-green-600 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            ✓ Passed ({passedCount})
          </button>
          <button
            onClick={() => setFilterStatus('anomaly')}
            className={`px-3 py-1.5 text-xs font-medium rounded-full transition-colors ${
              filterStatus === 'anomaly' ? 'bg-red-600 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            ⚠ Anomaly ({anomalyCount})
          </button>
        </div>
      </div>

      {/* Samples List */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        {loading ? (
          <div className="p-8 text-center text-gray-400">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-3"></div>
            <p>Loading samples...</p>
          </div>
        ) : filteredSamples.length === 0 ? (
          <div className="p-8 text-center text-gray-400">
            <TestTube className="w-10 h-10 mx-auto mb-2 opacity-50" />
            <p>No samples match your criteria.</p>
          </div>
        ) : (
          <>
            {/* Table Header */}
            <div className="hidden md:grid grid-cols-12 gap-4 px-6 py-3 bg-gray-50 border-b border-gray-200 text-xs font-medium text-gray-500 uppercase tracking-wider">
              <div className="col-span-1">Status</div>
              <div className="col-span-2">Sample ID</div>
              <div className="col-span-2">Product</div>
              <div className="col-span-2">Analyst</div>
              <div className="col-span-2">Date</div>
              <div className="col-span-3">Details</div>
            </div>

            {/* Rows */}
            <div className="divide-y divide-gray-100">
              {filteredSamples.map((sample: any, idx: number) => {
                const isPassed = sample.anomaly_flag !== 'YES';
                return (
                  <div
                    key={idx}
                    className="grid grid-cols-1 md:grid-cols-12 gap-2 md:gap-4 px-6 py-4 hover:bg-gray-50 transition-colors items-center"
                  >
                    {/* Status Icon */}
                    <div className="col-span-1 flex items-center">
                      <div className={`p-1.5 rounded-full ${isPassed ? 'bg-green-100' : 'bg-red-100'}`}>
                        {isPassed
                          ? <ShieldCheck className="w-4 h-4 text-green-600" />
                          : <ShieldAlert className="w-4 h-4 text-red-600" />
                        }
                      </div>
                    </div>

                    {/* Sample ID */}
                    <div className="col-span-2">
                      <p className="text-sm font-semibold text-gray-900">
                        {sample.sample_id || `#${sample.id}`}
                      </p>
                    </div>

                    {/* Product */}
                    <div className="col-span-2">
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-50 text-blue-700">
                        {sample.product}
                      </span>
                    </div>

                    {/* Analyst */}
                    <div className="col-span-2 text-sm text-gray-600">
                      {sample.analyst}
                    </div>

                    {/* Date */}
                    <div className="col-span-2 text-sm text-gray-500">
                      {sample.date || sample.sample_date}
                    </div>

                    {/* Details / Status */}
                    <div className="col-span-3 flex items-center gap-2">
                      <span className={`shrink-0 px-2.5 py-1 text-xs font-semibold rounded-full ${
                        isPassed
                          ? 'bg-green-100 text-green-700'
                          : 'bg-red-100 text-red-700'
                      }`}>
                        {isPassed ? '✓ Passed' : '⚠ Anomaly'}
                      </span>
                      {sample.anomaly_reason && (
                        <span className="text-xs text-red-500 truncate" title={sample.anomaly_reason}>
                          {sample.anomaly_reason}
                        </span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </>
        )}
      </div>
    </div>
  );
}

import { useState, useEffect } from 'react';
import { ShieldAlert, AlertTriangle, ShieldCheck, Search, Filter } from 'lucide-react';
import api from '../../api';

export default function QualityInsights() {
    const [summary, setSummary] = useState<any>(null);
    const [anomalies, setAnomalies] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    // Modal State
    const [selectedSample, setSelectedSample] = useState<any>(null);
    const [actionLoading, setActionLoading] = useState(false);

    useEffect(() => {
        fetchQualityData();
    }, []);

    const fetchQualityData = async () => {
        setLoading(true);
        try {
            const res = await api.get('reports/anomalies-summary/');
            if (res.data.success) {
                setSummary(res.data.data?.summary || {});
                const td = res.data.data?.table_data;
                setAnomalies(Array.isArray(td) ? td : (td?.results || []));
            }
        } catch (err) {
            console.error('Failed to fetch quality insights:', err);
        } finally {
            setLoading(false);
        }
    };

    const handleAction = async (sampleId: string, action: 'clear' | 'confirm') => {
        setActionLoading(true);
        try {
            const res = await api.patch(`lab/anomaly/${sampleId}/${action}/`);
            if (res.data.success) {
                // Refresh table
                await fetchQualityData();
                setSelectedSample(null);
            } else {
                alert(res.data.message || 'Failed to update status');
            }
        } catch (err: any) {
            alert(err.response?.data?.error || 'Error completing action');
        } finally {
            setActionLoading(false);
        }
    };

    if (loading && !summary) {
        return (
            <div className="bg-white rounded-lg shadow p-6 border-l-4 border-purple-500 animate-pulse">
                <div className="h-6 bg-gray-200 rounded w-1/4 mb-4"></div>
                <div className="h-20 bg-gray-200 rounded w-full"></div>
            </div>
        );
    }

    return (
        <div className="bg-white rounded-lg shadow border-l-4 border-purple-500 overflow-hidden mb-8">
            {/* Header */}
            <div className="bg-gradient-to-r from-purple-50 to-white px-6 py-4 border-b border-purple-100 flex items-center justify-between">
                <h3 className="text-lg font-bold text-purple-900 flex items-center gap-2">
                    <ShieldAlert className="w-5 h-5 text-purple-600" />
                    Quality Assurance Insights
                </h3>
                <button onClick={fetchQualityData} className="text-xs text-purple-600 hover:underline">
                    Refresh Data
                </button>
            </div>

            <div className="p-6">
                {/* Summary Metric Cards */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                    <div className="bg-purple-50 rounded-lg p-4 border border-purple-100 text-center">
                        <p className="text-sm font-medium text-purple-600 mb-1">Open Anomalies</p>
                        <p className="text-3xl font-bold text-purple-900">{summary?.open_count || 0}</p>
                    </div>

                    <div className="bg-red-50 rounded-lg p-4 border border-red-100 text-center">
                        <p className="text-sm font-medium text-red-600 mb-1">High Severity</p>
                        <p className="text-3xl font-bold text-red-900">{summary?.high_severity_count || 0}</p>
                    </div>

                    <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                        <p className="text-xs font-semibold text-gray-500 uppercase mb-2">Top Flagged Product</p>
                        {summary?.by_product && Object.keys(summary.by_product).length > 0 ? (
                            <p className="font-medium text-gray-800">
                                {Object.entries(summary.by_product).sort((a: any, b: any) => b[1] - a[1])[0][0] as string}
                                <span className="text-gray-500 text-sm ml-2">({Object.entries(summary.by_product).sort((a: any, b: any) => b[1] - a[1])[0][1] as number})</span>
                            </p>
                        ) : (
                            <p className="text-gray-400 italic text-sm">No data</p>
                        )}
                    </div>
                </div>

                {/* Anomalies Table */}
                <div>
                    <h4 className="text-sm font-semibold text-gray-700 uppercase tracking-wider mb-3">Detected Anomalies</h4>
                    {anomalies.length === 0 ? (
                        <div className="text-center py-8 bg-gray-50 rounded-lg border border-dashed border-gray-200">
                            <ShieldCheck className="w-12 h-12 text-green-400 mx-auto mb-2" />
                            <p className="text-gray-500 font-medium">All clear! No open anomalies detected.</p>
                        </div>
                    ) : (
                        <div className="overflow-x-auto rounded-lg border border-gray-200">
                            <table className="w-full text-left border-collapse">
                                <thead>
                                    <tr className="bg-gray-50 text-gray-600 text-xs uppercase tracking-wider">
                                        <th className="px-4 py-3 font-medium border-b">Sample ID</th>
                                        <th className="px-4 py-3 font-medium border-b">Product</th>
                                        <th className="px-4 py-3 font-medium border-b">Score / Severity</th>
                                        <th className="px-4 py-3 font-medium border-b">Status</th>
                                        <th className="px-4 py-3 font-medium border-b text-right">Action</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-200 text-sm">
                                    {anomalies.map((item, idx) => (
                                        <tr key={idx} className="hover:bg-purple-50 transition-colors">
                                            <td className="px-4 py-3 font-medium text-purple-700">{item['Sample_ID']}</td>
                                            <td className="px-4 py-3 text-gray-800">{item['Product']}</td>
                                            <td className="px-4 py-3">
                                                <span className={`inline-flex items-center gap-1 px-2 py-1 rounded text-xs font-bold ${item['Anomaly_Score'] >= 40 ? 'bg-red-100 text-red-700' : 'bg-yellow-100 text-yellow-700'
                                                    }`}>
                                                    {item['Anomaly_Score'] >= 40 ? <AlertTriangle className="w-3 h-3" /> : ''}
                                                    {item['Anomaly_Score']} pts
                                                </span>
                                            </td>
                                            <td className="px-4 py-3">
                                                {item['Review_Status'] === 'PENDING_REVIEW' ? (
                                                    <span className="px-2 py-1 bg-yellow-100 text-yellow-800 text-xs rounded-full font-medium">PENDING</span>
                                                ) : item['Review_Status'] === 'CLEARED' ? (
                                                    <span className="px-2 py-1 bg-green-100 text-green-800 text-xs rounded-full font-medium">CLEARED</span>
                                                ) : (
                                                    <span className="px-2 py-1 bg-red-100 text-red-800 text-xs rounded-full font-medium">CONFIRMED</span>
                                                )}
                                            </td>
                                            <td className="px-4 py-3 text-right">
                                                <button
                                                    onClick={() => setSelectedSample(item)}
                                                    className="text-purple-600 hover:text-purple-800 font-medium text-xs bg-purple-50 hover:bg-purple-100 px-3 py-1.5 rounded transition-colors"
                                                >
                                                    Review Details
                                                </button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>
            </div>

            {/* Review Modal */}
            {selectedSample && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-4">
                    <div className="bg-white rounded-xl shadow-2xl max-w-lg w-full overflow-hidden">
                        <div className="bg-purple-600 px-6 py-4 flex justify-between items-center text-white">
                            <h3 className="font-bold text-lg">Review Lab Anomaly</h3>
                            <button onClick={() => setSelectedSample(null)} className="text-white hover:text-gray-200 text-xl font-bold">&times;</button>
                        </div>

                        <div className="p-6">
                            <div className="grid grid-cols-2 gap-4 mb-4 text-sm">
                                <div>
                                    <p className="text-gray-500 mb-1">Sample ID</p>
                                    <p className="font-semibold text-gray-800">{selectedSample['Sample_ID']}</p>
                                </div>
                                <div>
                                    <p className="text-gray-500 mb-1">Product</p>
                                    <p className="font-semibold text-gray-800">{selectedSample['Product']}</p>
                                </div>
                                <div>
                                    <p className="text-gray-500 mb-1">Moisture (%)</p>
                                    <p className="font-semibold text-gray-800">{selectedSample['Moisture_%']}</p>
                                </div>
                                <div>
                                    <p className="text-gray-500 mb-1">Purity (%)</p>
                                    <p className="font-semibold text-gray-800">{selectedSample['Purity_%']}</p>
                                </div>
                                <div>
                                    <p className="text-gray-500 mb-1">Analyst</p>
                                    <p className="font-semibold text-gray-800">{selectedSample['Analyst']}</p>
                                </div>
                                <div>
                                    <p className="text-gray-500 mb-1">Time</p>
                                    <p className="font-semibold text-gray-800">{selectedSample['Sample_Date']} {selectedSample['Sample_Time']}</p>
                                </div>
                            </div>

                            <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
                                <p className="text-xs font-bold text-red-800 uppercase mb-1">Anomaly Reason / Flags</p>
                                <p className="text-sm text-red-900">{selectedSample['Anomaly_Reason'] || 'Unknown reason'}</p>
                            </div>

                            {selectedSample['Review_Status'] === 'PENDING_REVIEW' ? (
                                <div className="flex items-center gap-3 pt-4 border-t border-gray-100">
                                    <button
                                        onClick={() => handleAction(selectedSample['Sample_ID'], 'clear')}
                                        disabled={actionLoading}
                                        className="flex-1 py-2 bg-green-500 hover:bg-green-600 text-white rounded-lg font-medium transition-colors"
                                    >
                                        Mark as False Positive (Clear)
                                    </button>
                                    <button
                                        onClick={() => handleAction(selectedSample['Sample_ID'], 'confirm')}
                                        disabled={actionLoading}
                                        className="flex-1 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg font-medium transition-colors"
                                    >
                                        Confirm Anomaly
                                    </button>
                                </div>
                            ) : (
                                <div className="text-center pt-4 border-t border-gray-100">
                                    <p className="text-sm text-gray-500 italic">This anomaly was already reviewed and {selectedSample['Review_Status'].toLowerCase().replace('_', ' ')}.</p>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

import Layout from '../layout/Layout';
import { ShieldCheck, CheckCircle, XCircle, Clock, RefreshCw } from 'lucide-react';
import { useState, useEffect } from 'react';

interface Request {
    request_id: string;
    raw_material: string;
    quantity: number;
    unit: string;
    purpose: string;
    employee_name: string;
    employee_id: string;
    date: string;
    time: string;
    remarks: string;
    status: string;
    approved_by: string;
    approval_time: string;
}

interface InventoryAdminPanelProps {
    user: any;
    onNavigate: (page: string) => void;
    onLogout: () => void;
}

export default function InventoryAdminPanel({ user, onNavigate, onLogout }: InventoryAdminPanelProps) {
    const [requests, setRequests] = useState<Request[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [processingId, setProcessingId] = useState<string | null>(null);
    const [filterStatus, setFilterStatus] = useState('All');

    const fetchRequests = async () => {
        setLoading(true);
        setError('');
        try {
            const response = await fetch('http://127.0.0.1:8000/api/inventory/requests/');
            const data = await response.json();
            if (data.ok) {
                setRequests(data.requests);
            } else {
                setError(data.error || 'Failed to load requests');
            }
        } catch {
            setError('Network error. Make sure the backend is running on http://127.0.0.1:8000');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchRequests();
    }, []);

    const handleAction = async (requestId: string, action: 'APPROVE' | 'REJECT') => {
        setProcessingId(requestId);
        try {
            const response = await fetch('http://127.0.0.1:8000/api/inventory/approve/', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    request_id: requestId,
                    action,
                    approved_by: user?.name || 'Admin',
                }),
            });
            const data = await response.json();
            if (data.ok) {
                // Update row in local state instead of re-fetching
                setRequests((prev) =>
                    prev.map((r) =>
                        r.request_id === requestId
                            ? { ...r, status: data.status }
                            : r
                    )
                );
            } else {
                alert(`Error: ${data.error}`);
            }
        } catch {
            alert('Network error.');
        } finally {
            setProcessingId(null);
        }
    };

    const statusColor = (status: string) => {
        if (status === 'Approved') return 'bg-green-100 text-green-800';
        if (status === 'Rejected') return 'bg-red-100 text-red-800';
        return 'bg-amber-100 text-amber-800';
    };

    const filteredRequests = filterStatus === 'All'
        ? requests
        : requests.filter((r) => r.status === filterStatus);

    const pendingCount = requests.filter((r) => r.status === 'Pending').length;

    return (
        <Layout user={user} onNavigate={onNavigate} onLogout={onLogout} currentPage="inventory-admin">
            <div>
                {/* Header */}
                <div className="flex items-center justify-between mb-6">
                    <div className="flex items-center gap-4">
                        <div className="bg-purple-600 p-3 rounded-lg">
                            <ShieldCheck className="w-8 h-8 text-white" />
                        </div>
                        <div>
                            <h2 className="text-2xl font-bold text-gray-800">Inventory Admin Panel</h2>
                            <p className="text-gray-600">Review and action employee borrow/withdraw requests</p>
                        </div>
                    </div>
                    <button
                        onClick={fetchRequests}
                        className="flex items-center gap-2 text-gray-600 hover:text-gray-800 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                    >
                        <RefreshCw className="w-4 h-4" />
                        Refresh
                    </button>
                </div>

                {/* Summary Cards */}
                <div className="grid grid-cols-3 gap-4 mb-6">
                    <div className="bg-white rounded-lg shadow p-4 flex items-center gap-3">
                        <Clock className="w-8 h-8 text-amber-500" />
                        <div>
                            <p className="text-2xl font-bold text-gray-800">{requests.filter((r) => r.status === 'Pending').length}</p>
                            <p className="text-sm text-gray-500">Pending</p>
                        </div>
                    </div>
                    <div className="bg-white rounded-lg shadow p-4 flex items-center gap-3">
                        <CheckCircle className="w-8 h-8 text-green-500" />
                        <div>
                            <p className="text-2xl font-bold text-gray-800">{requests.filter((r) => r.status === 'Approved').length}</p>
                            <p className="text-sm text-gray-500">Approved</p>
                        </div>
                    </div>
                    <div className="bg-white rounded-lg shadow p-4 flex items-center gap-3">
                        <XCircle className="w-8 h-8 text-red-500" />
                        <div>
                            <p className="text-2xl font-bold text-gray-800">{requests.filter((r) => r.status === 'Rejected').length}</p>
                            <p className="text-sm text-gray-500">Rejected</p>
                        </div>
                    </div>
                </div>

                {/* Pending alert */}
                {pendingCount > 0 && (
                    <div className="mb-4 px-4 py-3 bg-amber-50 border border-amber-200 rounded-lg text-amber-800 text-sm">
                        ⚠️ You have <strong>{pendingCount}</strong> pending request{pendingCount > 1 ? 's' : ''} awaiting action.
                    </div>
                )}

                {/* Filter Tabs */}
                <div className="flex gap-2 mb-4">
                    {['All', 'Pending', 'Approved', 'Rejected'].map((s) => (
                        <button
                            key={s}
                            onClick={() => setFilterStatus(s)}
                            className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${filterStatus === s
                                    ? 'bg-blue-600 text-white'
                                    : 'bg-white text-gray-600 border border-gray-300 hover:bg-gray-50'
                                }`}
                        >
                            {s}
                        </button>
                    ))}
                </div>

                {/* Table */}
                <div className="bg-white rounded-lg shadow overflow-hidden">
                    {loading ? (
                        <div className="p-12 text-center text-gray-500">Loading requests...</div>
                    ) : error ? (
                        <div className="p-6 text-center text-red-600">{error}</div>
                    ) : filteredRequests.length === 0 ? (
                        <div className="p-12 text-center text-gray-500">No {filterStatus !== 'All' ? filterStatus.toLowerCase() : ''} requests found.</div>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="w-full text-sm">
                                <thead className="bg-gray-50 border-b border-gray-200">
                                    <tr>
                                        {['Request ID', 'Material', 'Qty', 'Purpose', 'Employee', 'Date & Time', 'Status', 'Action'].map(
                                            (h) => (
                                                <th
                                                    key={h}
                                                    className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                                                >
                                                    {h}
                                                </th>
                                            )
                                        )}
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-200">
                                    {filteredRequests.map((r) => (
                                        <tr key={r.request_id} className="hover:bg-gray-50">
                                            <td className="px-4 py-4 font-mono text-xs text-gray-700">{r.request_id}</td>
                                            <td className="px-4 py-4 font-medium text-gray-900">{r.raw_material}</td>
                                            <td className="px-4 py-4 text-gray-700">
                                                {r.quantity} {r.unit}
                                            </td>
                                            <td className="px-4 py-4 text-gray-600 max-w-[160px] truncate" title={r.purpose}>
                                                {r.purpose}
                                            </td>
                                            <td className="px-4 py-4">
                                                <div className="text-gray-900 font-medium">{r.employee_name}</div>
                                                <div className="text-gray-500 text-xs">{r.employee_id}</div>
                                            </td>
                                            <td className="px-4 py-4 text-gray-600">
                                                {r.date}<br />
                                                <span className="text-xs">{r.time}</span>
                                            </td>
                                            <td className="px-4 py-4">
                                                <span className={`px-2 py-1 rounded-full text-xs font-semibold ${statusColor(r.status)}`}>
                                                    {r.status}
                                                </span>
                                                {r.approved_by && (
                                                    <div className="text-xs text-gray-400 mt-1">by {r.approved_by}</div>
                                                )}
                                            </td>
                                            <td className="px-4 py-4">
                                                {r.status === 'Pending' ? (
                                                    <div className="flex gap-2">
                                                        <button
                                                            onClick={() => handleAction(r.request_id, 'APPROVE')}
                                                            disabled={processingId === r.request_id}
                                                            className="flex items-center gap-1 bg-green-600 text-white px-3 py-1.5 rounded text-xs font-medium hover:bg-green-700 disabled:opacity-50 transition-colors"
                                                        >
                                                            <CheckCircle className="w-3 h-3" />
                                                            Approve
                                                        </button>
                                                        <button
                                                            onClick={() => handleAction(r.request_id, 'REJECT')}
                                                            disabled={processingId === r.request_id}
                                                            className="flex items-center gap-1 bg-red-600 text-white px-3 py-1.5 rounded text-xs font-medium hover:bg-red-700 disabled:opacity-50 transition-colors"
                                                        >
                                                            <XCircle className="w-3 h-3" />
                                                            Reject
                                                        </button>
                                                    </div>
                                                ) : (
                                                    <span className="text-gray-400 text-xs italic">
                                                        {r.status === 'Approved' ? '✅ Done' : '❌ Done'}
                                                    </span>
                                                )}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>
            </div>
        </Layout>
    );
}

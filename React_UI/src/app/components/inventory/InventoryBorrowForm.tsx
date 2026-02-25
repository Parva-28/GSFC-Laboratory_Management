import Layout from '../layout/Layout';
import { ArrowLeft, Send, Package } from 'lucide-react';
import { useState } from 'react';

interface InventoryBorrowFormProps {
    user: any;
    onNavigate: (page: string) => void;
    onLogout: () => void;
    selectedMaterial?: string;
}

export default function InventoryBorrowForm({
    user,
    onNavigate,
    onLogout,
    selectedMaterial = '',
}: InventoryBorrowFormProps) {
    const now = new Date();
    const todayDate = now.toISOString().slice(0, 10);
    const currentTime = now.toTimeString().slice(0, 5);

    const [formData, setFormData] = useState({
        raw_material: selectedMaterial,
        quantity: '',
        unit: 'MT',
        purpose: '',
        employee_name: '',
        employee_id: '',
        request_date: todayDate,
        request_time: currentTime,
        remarks: '',
    });

    const [isSaving, setIsSaving] = useState(false);
    const [statusMsg, setStatusMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

    const handleChange = (
        e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>
    ) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSaving(true);
        setStatusMsg(null);

        try {
            const response = await fetch('http://127.0.0.1:8000/api/inventory/borrow/', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(formData),
            });

            const result = await response.json();

            if (response.ok && result.ok) {
                setStatusMsg({
                    type: 'success',
                    text: `✅ Request submitted successfully! ID: ${result.request_id}. Pending Admin approval.`,
                });
                setFormData({
                    raw_material: selectedMaterial,
                    quantity: '',
                    unit: 'MT',
                    purpose: '',
                    employee_name: '',
                    employee_id: '',
                    request_date: todayDate,
                    request_time: currentTime,
                    remarks: '',
                });
            } else {
                setStatusMsg({ type: 'error', text: `❌ Error: ${result.error || 'Unknown error'}` });
            }
        } catch (err) {
            setStatusMsg({
                type: 'error',
                text: `❌ Network error. Make sure the backend is running on http://127.0.0.1:8000`,
            });
        } finally {
            setIsSaving(false);
        }
    };

    const materials = [
        'Nitrogen',
        'Sulphuric Acid',
        'Caustic Soda',
        'Phosphoric Acid',
        'Ammonia',
        'Potassium Chloride',
    ];

    return (
        <Layout user={user} onNavigate={onNavigate} onLogout={onLogout} currentPage="inventory-borrow">
            <div className="max-w-3xl mx-auto">
                {/* Back */}
                <button
                    onClick={() => onNavigate('inventory')}
                    className="flex items-center gap-2 text-gray-600 hover:text-gray-800 mb-6"
                >
                    <ArrowLeft className="w-5 h-5" />
                    Back to Inventory
                </button>

                {/* Header */}
                <div className="mb-6 flex items-center gap-4">
                    <div className="bg-orange-600 p-3 rounded-lg">
                        <Package className="w-8 h-8 text-white" />
                    </div>
                    <div>
                        <h2 className="text-2xl font-bold text-gray-800">Borrow / Withdraw Raw Material</h2>
                        <p className="text-gray-600">Submit a withdrawal request for Admin approval</p>
                    </div>
                </div>

                {/* Status Message */}
                {statusMsg && (
                    <div
                        className={`mb-6 px-4 py-3 rounded-lg border ${statusMsg.type === 'success'
                                ? 'bg-green-50 border-green-200 text-green-800'
                                : 'bg-red-50 border-red-200 text-red-800'
                            }`}
                    >
                        {statusMsg.text}
                    </div>
                )}

                <form onSubmit={handleSubmit} className="bg-white rounded-lg shadow">
                    {/* Material & Quantity */}
                    <div className="p-6 border-b border-gray-200">
                        <h3 className="text-lg font-semibold text-gray-800 mb-4">Material Details</h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div>
                                <label className="block text-gray-700 font-medium mb-2">
                                    Raw Material <span className="text-red-500">*</span>
                                </label>
                                <select
                                    name="raw_material"
                                    value={formData.raw_material}
                                    onChange={handleChange}
                                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                                    required
                                >
                                    <option value="">Select Material</option>
                                    {materials.map((m) => (
                                        <option key={m} value={m}>{m}</option>
                                    ))}
                                </select>
                            </div>

                            <div>
                                <label className="block text-gray-700 font-medium mb-2">
                                    Quantity Requested <span className="text-red-500">*</span>
                                </label>
                                <div className="flex gap-2">
                                    <input
                                        type="number"
                                        step="0.01"
                                        min="0.01"
                                        name="quantity"
                                        value={formData.quantity}
                                        onChange={handleChange}
                                        className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                                        placeholder="0.00"
                                        required
                                    />
                                    <select
                                        name="unit"
                                        value={formData.unit}
                                        onChange={handleChange}
                                        className="w-24 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                                    >
                                        <option value="MT">MT</option>
                                        <option value="KG">KG</option>
                                        <option value="L">L</option>
                                    </select>
                                </div>
                            </div>

                            <div className="md:col-span-2">
                                <label className="block text-gray-700 font-medium mb-2">
                                    Purpose / Production Line <span className="text-red-500">*</span>
                                </label>
                                <input
                                    type="text"
                                    name="purpose"
                                    value={formData.purpose}
                                    onChange={handleChange}
                                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                                    placeholder="e.g. Production Line A, Lab Testing, Maintenance"
                                    required
                                />
                            </div>
                        </div>
                    </div>

                    {/* Employee Info */}
                    <div className="p-6 border-b border-gray-200">
                        <h3 className="text-lg font-semibold text-gray-800 mb-4">Employee Details</h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div>
                                <label className="block text-gray-700 font-medium mb-2">
                                    Employee Name <span className="text-red-500">*</span>
                                </label>
                                <input
                                    type="text"
                                    name="employee_name"
                                    value={formData.employee_name}
                                    onChange={handleChange}
                                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                                    placeholder="Full name"
                                    required
                                />
                            </div>

                            <div>
                                <label className="block text-gray-700 font-medium mb-2">
                                    Employee ID <span className="text-red-500">*</span>
                                </label>
                                <input
                                    type="text"
                                    name="employee_id"
                                    value={formData.employee_id}
                                    onChange={handleChange}
                                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                                    placeholder="EMP-XXXXX"
                                    required
                                />
                            </div>

                            <div>
                                <label className="block text-gray-700 font-medium mb-2">
                                    Request Date <span className="text-red-500">*</span>
                                </label>
                                <input
                                    type="date"
                                    name="request_date"
                                    value={formData.request_date}
                                    onChange={handleChange}
                                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                                    required
                                />
                            </div>

                            <div>
                                <label className="block text-gray-700 font-medium mb-2">
                                    Request Time <span className="text-red-500">*</span>
                                </label>
                                <input
                                    type="time"
                                    name="request_time"
                                    value={formData.request_time}
                                    onChange={handleChange}
                                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                                    required
                                />
                            </div>
                        </div>
                    </div>

                    {/* Remarks */}
                    <div className="p-6 border-b border-gray-200">
                        <label className="block text-gray-700 font-medium mb-2">Remarks</label>
                        <textarea
                            name="remarks"
                            value={formData.remarks}
                            onChange={handleChange}
                            rows={3}
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                            placeholder="Any additional notes..."
                        />
                    </div>

                    {/* Notice Banner */}
                    <div className="mx-6 my-4 bg-amber-50 border border-amber-200 rounded-lg px-4 py-3 text-amber-800 text-sm">
                        ⚠️ This request will be sent to the <strong>Central Admin</strong> for approval. Inventory
                        will only be reduced once approved.
                    </div>

                    {/* Actions */}
                    <div className="p-6 bg-gray-50 flex gap-4">
                        <button
                            type="submit"
                            disabled={isSaving}
                            className={`flex items-center gap-2 px-6 py-3 rounded-lg font-semibold transition-colors text-white ${isSaving ? 'bg-orange-400 cursor-not-allowed' : 'bg-orange-600 hover:bg-orange-700'
                                }`}
                        >
                            <Send className="w-5 h-5" />
                            {isSaving ? 'Submitting...' : 'Submit Request'}
                        </button>
                        <button
                            type="button"
                            onClick={() => onNavigate('inventory')}
                            className="bg-gray-200 text-gray-700 px-6 py-3 rounded-lg font-semibold hover:bg-gray-300 transition-colors"
                        >
                            Cancel
                        </button>
                    </div>
                </form>
            </div>
        </Layout>
    );
}

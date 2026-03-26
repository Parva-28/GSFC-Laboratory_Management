import { Save, ArrowLeft, PackagePlus, ShieldX } from 'lucide-react';
import { useState } from 'react';
import api from '../../api';

interface InventoryAddProps {
  user: any;
  onNavigate: (page: string) => void;
  onLogout: () => void;
}

export default function InventoryAdd({ user, onNavigate, onLogout }: InventoryAddProps) {
  // Guard: Not needed since we now allow both roles
  // but keep the user check just in case
  if (!user) {
    return null;
  }

  const now = new Date();
  const todayDate = now.toISOString().slice(0, 10);
  const currentTime = now.toTimeString().slice(0, 5);

  const [formData, setFormData] = useState({
    material: '',
    quantity: '',
    unit: 'MT',
    supplier: '',
    invoice_no: '',
    date: todayDate,
    time: currentTime,
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
      const response = await api.post('inventory/borrow/', {
        request_type: 'ADD',
        raw_material: formData.material,
        quantity: formData.quantity,
        unit: formData.unit,
        purpose: 'Incoming Stock',
        employee_name: user?.username || 'Employee',
        employee_id: 'N/A',
        request_date: formData.date,
        request_time: formData.time,
        remarks: formData.remarks + `${formData.supplier ? ' Supplier: ' + formData.supplier : ''}${formData.invoice_no ? ' Invoice: ' + formData.invoice_no : ''}`
      });

      const result = response.data;

      if (result.success) {
        setStatusMsg({
          type: 'success',
          text: `✅ Request submitted! ID: ${result.data?.request_id || 'N/A'}. Pending Admin approval.`,
        });
        // Reset form but keep date/time and material
        setFormData((prev) => ({
          ...prev,
          quantity: '',
          supplier: '',
          invoice_no: '',
          remarks: '',
        }));
      } else {
        setStatusMsg({ type: 'error', text: `❌ Error: ${result.message || 'Unknown error'}` });
      }
    } catch (error: any) {
      setStatusMsg({
        type: 'error',
        text: `❌ Network error. ${error.response?.data?.error || error.message || 'Make sure the Django backend is running on http://127.0.0.1:8000'}`,
      });
    } finally {
      setIsSaving(false);
    }
  };

  const materials = [
    { value: 'Nitrogen', label: 'Nitrogen (N₂)' },
    { value: 'Sulphuric Acid', label: 'Sulphuric Acid (H₂SO₄)' },
    { value: 'Caustic Soda', label: 'Caustic Soda (NaOH)' },
    { value: 'Phosphoric Acid', label: 'Phosphoric Acid (H₃PO₄)' },
    { value: 'Ammonia', label: 'Ammonia (NH₃)' },
    { value: 'Potassium Chloride', label: 'Potassium Chloride (KCl)' },
  ];

  return (
    <>
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
          <div className="bg-blue-600 p-3 rounded-lg">
            <PackagePlus className="w-8 h-8 text-white" />
          </div>
          <div>
            <h2 className="text-2xl font-bold text-gray-800">Request Stock Addition (IN)</h2>
            <p className="text-gray-600">Submit an incoming material receipt for Admin Approval</p>
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
          {/* Material & Stock Details */}
          <div className="p-6 border-b border-gray-200">
            <h3 className="text-lg font-semibold text-gray-800 mb-4">Stock Details</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

              {/* Material */}
              <div className="md:col-span-2">
                <label className="block text-gray-700 font-medium mb-2">
                  Raw Material <span className="text-red-500">*</span>
                </label>
                <select
                  name="material"
                  value={formData.material}
                  onChange={handleChange}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                >
                  <option value="">Select Material</option>
                  {materials.map((m) => (
                    <option key={m.value} value={m.value}>{m.label}</option>
                  ))}
                </select>
              </div>

              {/* Quantity + Unit */}
              <div>
                <label className="block text-gray-700 font-medium mb-2">
                  Quantity Received <span className="text-red-500">*</span>
                </label>
                <div className="flex gap-2">
                  <input
                    type="number"
                    step="0.01"
                    min="0.01"
                    name="quantity"
                    value={formData.quantity}
                    onChange={handleChange}
                    className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="0.00"
                    required
                  />
                  <select
                    name="unit"
                    value={formData.unit}
                    onChange={handleChange}
                    className="w-24 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="MT">MT</option>
                    <option value="KG">KG</option>
                    <option value="L">L</option>
                  </select>
                </div>
              </div>

              {/* Received By (read-only) */}
              <div>
                <label className="block text-gray-700 font-medium mb-2">Received By</label>
                <input
                  type="text"
                  value={user?.username || 'Admin'}
                  readOnly
                  className="w-full px-4 py-2 border border-gray-200 rounded-lg bg-gray-50 text-gray-600 cursor-not-allowed"
                />
              </div>

              {/* Supplier */}
              <div>
                <label className="block text-gray-700 font-medium mb-2">
                  Supplier Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  name="supplier"
                  value={formData.supplier}
                  onChange={handleChange}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Supplier company name"
                  required
                />
              </div>

              {/* Invoice / LR No. */}
              <div>
                <label className="block text-gray-700 font-medium mb-2">Invoice / LR Number</label>
                <input
                  type="text"
                  name="invoice_no"
                  value={formData.invoice_no}
                  onChange={handleChange}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="INV-XXXXXX or LR-XXXXXX"
                />
              </div>

              {/* Date */}
              <div>
                <label className="block text-gray-700 font-medium mb-2">
                  Arrival Date <span className="text-red-500">*</span>
                </label>
                <input
                  type="date"
                  name="date"
                  value={formData.date}
                  onChange={handleChange}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>

              {/* Time */}
              <div>
                <label className="block text-gray-700 font-medium mb-2">
                  Arrival Time <span className="text-red-500">*</span>
                </label>
                <input
                  type="time"
                  name="time"
                  value={formData.time}
                  onChange={handleChange}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
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
              className="w-full px-3 py-2 border border-slate-300 rounded-md focus:outline-none focus:ring-1 focus:ring-slate-500 text-sm"
              placeholder="Any additional notes..."
            />
          </div>

          {/* Notice banner */}
          <div className="mx-6 my-4 bg-amber-50 border border-amber-200 rounded-lg px-4 py-3 text-amber-800 text-sm">
            ⚠️ This request will be sent to the <strong>Central Admin</strong> for approval.
          </div>

          {/* Actions */}
          <div className="p-6 bg-gray-50 flex gap-4">
            <button
              type="submit"
              disabled={isSaving}
              className={`flex items-center gap-2 px-6 py-3 rounded-lg font-semibold transition-colors text-white ${isSaving ? 'bg-blue-400 cursor-not-allowed' : 'bg-blue-600 hover:bg-blue-700'
                }`}
            >
              <Save className="w-5 h-5" />
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
    </>
  );
}

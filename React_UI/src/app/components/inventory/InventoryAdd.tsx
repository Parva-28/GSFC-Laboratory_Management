import Layout from '../layout/Layout';
import { Save, ArrowLeft, PackagePlus, ShieldX } from 'lucide-react';
import { useState } from 'react';

interface InventoryAddProps {
  user: any;
  onNavigate: (page: string) => void;
  onLogout: () => void;
}

export default function InventoryAdd({ user, onNavigate, onLogout }: InventoryAddProps) {
  // Guard: Plant Employees only — admin approves, employees add stock
  if (user?.role !== 'PLANT_EMPLOYEE') {
    return (
      <Layout user={user} onNavigate={onNavigate} onLogout={onLogout} currentPage="inventory-add">
        <div className="max-w-lg mx-auto mt-16 text-center">
          <div className="bg-purple-50 border border-purple-200 rounded-lg p-10">
            <ShieldX className="w-16 h-16 text-purple-400 mx-auto mb-4" />
            <h2 className="text-xl font-bold text-purple-700 mb-2">Admin — Approvals Only</h2>
            <p className="text-purple-600 mb-6">
              As <strong>Central Admin</strong> you approve or reject requests — employees submit stock additions.
              Use <strong>Manage Approvals</strong> to process pending requests.
            </p>
            <button
              onClick={() => onNavigate('inventory-admin')}
              className="bg-purple-600 text-white px-6 py-2 rounded-lg hover:bg-purple-700 transition-colors"
            >
              Go to Manage Approvals
            </button>
          </div>
        </div>
      </Layout>
    );
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
      const response = await fetch('http://127.0.0.1:8000/api/inventory/add-stock/', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          received_by: user?.username || 'Admin',
        }),
      });

      const result = await response.json();

      if (response.ok && result.ok) {
        setStatusMsg({
          type: 'success',
          text: `✅ Stock added successfully! New balance: ${result.new_balance} ${formData.unit}`,
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
        setStatusMsg({ type: 'error', text: `❌ Error: ${result.error || 'Unknown error'}` });
      }
    } catch {
      setStatusMsg({
        type: 'error',
        text: '❌ Network error. Make sure the Django backend is running on http://127.0.0.1:8000',
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
    <Layout user={user} onNavigate={onNavigate} onLogout={onLogout} currentPage="inventory-add">
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
            <h2 className="text-2xl font-bold text-gray-800">Add Inventory Stock (IN)</h2>
            <p className="text-gray-600">Record incoming raw material from supplier — Central Admin only</p>
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
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Any additional notes..."
            />
          </div>

          {/* Admin badge */}
          <div className="mx-6 my-4 bg-blue-50 border border-blue-200 rounded-lg px-4 py-3 text-blue-800 text-sm">
            🔒 This action is logged under <strong>{user?.username}</strong> (Central Admin). The transaction will be recorded in <code>inventory.xlsx</code>.
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
              {isSaving ? 'Saving...' : 'Add Stock to Inventory'}
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

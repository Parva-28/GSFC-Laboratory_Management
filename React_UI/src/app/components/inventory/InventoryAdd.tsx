import Layout from '../layout/Layout';
import { Save, ArrowLeft } from 'lucide-react';
import { useState } from 'react';

interface InventoryAddProps {
  user: any;
  onNavigate: (page: string) => void;
  onLogout: () => void;
}

export default function InventoryAdd({ user, onNavigate, onLogout }: InventoryAddProps) {
  const [formData, setFormData] = useState({
    material: '',
    transactionType: 'in',
    quantity: '',
    unit: 'MT',
    date: '',
    time: '',
    supplier: '',
    remarks: ''
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    alert('Inventory entry added successfully!');
    onNavigate('inventory');
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  return (
    <Layout user={user} onNavigate={onNavigate} onLogout={onLogout} currentPage="inventory-add">
      <div className="max-w-3xl mx-auto">
        {/* Back Button */}
        <button
          onClick={() => onNavigate('inventory')}
          className="flex items-center gap-2 text-gray-600 hover:text-gray-800 mb-6"
        >
          <ArrowLeft className="w-5 h-5" />
          Back to Inventory
        </button>

        {/* Page Header */}
        <div className="mb-6">
          <h2 className="text-2xl font-bold text-gray-800">Add Inventory Entry</h2>
          <p className="text-gray-600">Record incoming or outgoing material transactions</p>
        </div>

        {/* Form Card */}
        <form onSubmit={handleSubmit} className="bg-white rounded-lg shadow">
          {/* Transaction Details */}
          <div className="p-6 border-b border-gray-200">
            <h3 className="text-lg font-semibold text-gray-800 mb-4">Transaction Details</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-gray-700 font-medium mb-2">
                  Material <span className="text-red-500">*</span>
                </label>
                <select
                  name="material"
                  value={formData.material}
                  onChange={handleChange}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                >
                  <option value="">Select Material</option>
                  <option value="Nitrogen">Nitrogen (N₂)</option>
                  <option value="Sulphuric Acid">Sulphuric Acid (H₂SO₄)</option>
                  <option value="Caustic Soda">Caustic Soda (NaOH)</option>
                  <option value="Phosphoric Acid">Phosphoric Acid (H₃PO₄)</option>
                  <option value="Ammonia">Ammonia (NH₃)</option>
                  <option value="Potassium Chloride">Potassium Chloride (KCl)</option>
                </select>
              </div>

              <div>
                <label className="block text-gray-700 font-medium mb-2">
                  Transaction Type <span className="text-red-500">*</span>
                </label>
                <select
                  name="transactionType"
                  value={formData.transactionType}
                  onChange={handleChange}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                >
                  <option value="in">Stock In (Received)</option>
                  <option value="out">Stock Out (Used)</option>
                </select>
              </div>

              <div>
                <label className="block text-gray-700 font-medium mb-2">
                  Quantity <span className="text-red-500">*</span>
                </label>
                <input
                  type="number"
                  step="0.01"
                  name="quantity"
                  value={formData.quantity}
                  onChange={handleChange}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="0.00"
                  required
                />
              </div>

              <div>
                <label className="block text-gray-700 font-medium mb-2">
                  Unit
                </label>
                <select
                  name="unit"
                  value={formData.unit}
                  onChange={handleChange}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="MT">MT (Metric Tons)</option>
                  <option value="KG">KG (Kilograms)</option>
                  <option value="L">L (Liters)</option>
                </select>
              </div>

              <div>
                <label className="block text-gray-700 font-medium mb-2">
                  Date <span className="text-red-500">*</span>
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

              <div>
                <label className="block text-gray-700 font-medium mb-2">
                  Time <span className="text-red-500">*</span>
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

              <div className="md:col-span-2">
                <label className="block text-gray-700 font-medium mb-2">
                  Supplier / Source
                </label>
                <input
                  type="text"
                  name="supplier"
                  value={formData.supplier}
                  onChange={handleChange}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Supplier name or internal department"
                />
              </div>
            </div>
          </div>

          {/* Additional Information */}
          <div className="p-6 border-b border-gray-200">
            <h3 className="text-lg font-semibold text-gray-800 mb-4">Additional Information</h3>
            <div>
              <label className="block text-gray-700 font-medium mb-2">
                Remarks
              </label>
              <textarea
                name="remarks"
                value={formData.remarks}
                onChange={handleChange}
                rows={4}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Enter any additional notes about this transaction..."
              ></textarea>
            </div>
          </div>

          {/* Form Actions */}
          {statusMsg && (
  <div
    className={`mx-6 mb-4 px-4 py-3 rounded-lg border ${
      statusMsg.type === "success"
        ? "bg-green-50 border-green-200 text-green-800"
        : "bg-red-50 border-red-200 text-red-800"
    }`}
  >
    {statusMsg.text}
  </div>
)}

          <div className="p-6 bg-gray-50 flex gap-4">
          <button
  type="submit"
  disabled={isSaving}
  className={`flex items-center gap-2 px-6 py-3 rounded-lg font-semibold transition-colors text-white
    ${isSaving ? "bg-blue-400 cursor-not-allowed" : "bg-blue-600 hover:bg-blue-700"}`}
>
  <Save className="w-5 h-5" />
  {isSaving ? "Saving..." : "Submit Sample Data"}
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

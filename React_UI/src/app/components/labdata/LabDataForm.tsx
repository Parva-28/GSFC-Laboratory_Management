import Layout from '../layout/Layout';
import { Save, RotateCcw } from 'lucide-react';
import { useState } from 'react';

interface LabDataFormProps {
  user: any;
  onNavigate: (page: string) => void;
  onLogout: () => void;
}

export default function LabDataForm({ user, onNavigate, onLogout }: LabDataFormProps) {
  const [formData, setFormData] = useState({
    sampleId: '',
    batchId: '',
    orderNumber: '',
    product: '',
    moisture: '',
    purity: '',
    analyst: user.username,
    sampleDate: '',
    sampleTime: '',
    remarks: ''
  });

  const [isSaving, setIsSaving] = useState(false);
const [statusMsg, setStatusMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);


 const handleSubmit = async (e: React.FormEvent) => {
  e.preventDefault();
  setIsSaving(true);
  setStatusMsg(null);

  try {
    const res = await fetch("http://127.0.0.1:8001/api/labdata/save/", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        sample_id: formData.sampleId,
        batch_id: formData.batchId,
        order_number: formData.orderNumber,
        product: formData.product,
        moisture: formData.moisture,
        purity: formData.purity,
        analyst: formData.analyst,
        sample_date: formData.sampleDate,
        sample_time: formData.sampleTime,
        remarks: formData.remarks,
      }),
    });

    const data = await res.json();

    if (!res.ok || !data.ok) {
      throw new Error(data?.error || "Failed to save data");
    }

    setStatusMsg({ type: "success", text: "✅ Saved to Excel successfully!" });
    handleReset();
  } catch (err: any) {
    setStatusMsg({
      type: "error",
      text: `❌ ${err?.message || "Server error"}`
    });
  } finally {
    setIsSaving(false);
  }
};

  const handleReset = () => {
    setFormData({
      sampleId: '',
      batchId: '',
      orderNumber: '',
      product: '',
      moisture: '',
      purity: '',
      analyst: user.username,
      sampleDate: '',
      sampleTime: '',
      remarks: ''
    });
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  return (
    <Layout user={user} onNavigate={onNavigate} onLogout={onLogout} currentPage="labdata-form">
      <div className="max-w-4xl mx-auto">
        {/* Page Header */}
        <div className="mb-6">
          <h2 className="text-2xl font-bold text-gray-800">Lab Data Entry</h2>
          <p className="text-gray-600">Enter sample analysis data for quality control</p>
        </div>

        {/* Form Card */}
        <form onSubmit={handleSubmit} className="bg-white rounded-lg shadow">
          {/* Sample Identification Section */}
          <div className="p-6 border-b border-gray-200">
            <h3 className="text-lg font-semibold text-gray-800 mb-4">Sample Identification</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-gray-700 font-medium mb-2">
                  Sample ID <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  name="sampleId"
                  value={formData.sampleId}
                  onChange={handleChange}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="S-2026-0205-XXX"
                  required
                />
              </div>

              <div>
                <label className="block text-gray-700 font-medium mb-2">
                  Batch ID <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  name="batchId"
                  value={formData.batchId}
                  onChange={handleChange}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="B-XXXXXX"
                  required
                />
              </div>

              <div>
                <label className="block text-gray-700 font-medium mb-2">
                  Order Number
                </label>
                <input
                  type="text"
                  name="orderNumber"
                  value={formData.orderNumber}
                  onChange={handleChange}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="ORD-XXXXXX"
                />
              </div>

              <div>
                <label className="block text-gray-700 font-medium mb-2">
                  Product <span className="text-red-500">*</span>
                </label>
                <select
                  name="product"
                  value={formData.product}
                  onChange={handleChange}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                >
                  <option value="">Select Product</option>
                  <option value="Urea">Urea</option>
                  <option value="DAP">DAP (Diammonium Phosphate)</option>
                  <option value="NPK">NPK Complex</option>
                  <option value="SSP">SSP (Single Super Phosphate)</option>
                  <option value="MOP">MOP (Muriate of Potash)</option>
                  <option value="Ammonium Sulphate">Ammonium Sulphate</option>
                </select>
              </div>
            </div>
          </div>

          {/* Analysis Data Section */}
          <div className="p-6 border-b border-gray-200">
            <h3 className="text-lg font-semibold text-gray-800 mb-4">Analysis Data</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-gray-700 font-medium mb-2">
                  Moisture % <span className="text-red-500">*</span>
                </label>
                <input
                  type="number"
                  step="0.01"
                  name="moisture"
                  value={formData.moisture}
                  onChange={handleChange}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="0.00"
                  required
                />
              </div>

              <div>
                <label className="block text-gray-700 font-medium mb-2">
                  Purity % <span className="text-red-500">*</span>
                </label>
                <input
                  type="number"
                  step="0.01"
                  name="purity"
                  value={formData.purity}
                  onChange={handleChange}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="0.00"
                  required
                />
              </div>

              <div>
                <label className="block text-gray-700 font-medium mb-2">
                  Analyst Name
                </label>
                <input
                  type="text"
                  name="analyst"
                  value={formData.analyst}
                  onChange={handleChange}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-gray-50"
                  readOnly
                />
              </div>

              <div>
                <label className="block text-gray-700 font-medium mb-2">
                  Sample Date <span className="text-red-500">*</span>
                </label>
                <input
                  type="date"
                  name="sampleDate"
                  value={formData.sampleDate}
                  onChange={handleChange}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>

              <div>
                <label className="block text-gray-700 font-medium mb-2">
                  Sample Time <span className="text-red-500">*</span>
                </label>
                <input
                  type="time"
                  name="sampleTime"
                  value={formData.sampleTime}
                  onChange={handleChange}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>
            </div>
          </div>

          {/* Remarks Section */}
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
                placeholder="Enter any additional observations or notes..."
              ></textarea>
            </div>
          </div>

          {/* Form Actions */}
          <div className="p-6 bg-gray-50 flex gap-4">
            <button
              type="submit"
              className="flex items-center gap-2 bg-blue-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-blue-700 transition-colors"
            >
              <Save className="w-5 h-5" />
              Submit Sample Data
            </button>
            <button
              type="button"
              onClick={handleReset}
              className="flex items-center gap-2 bg-gray-200 text-gray-700 px-6 py-3 rounded-lg font-semibold hover:bg-gray-300 transition-colors"
            >
              <RotateCcw className="w-5 h-5" />
              Reset Form
            </button>
          </div>
        </form>
      </div>
    </Layout>
  );
}

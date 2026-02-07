import Layout from '../layout/Layout';
import { Save, Truck } from 'lucide-react';
import { useState } from 'react';

interface TankerArrivalProps {
  user: any;
  onNavigate: (page: string) => void;
  onLogout: () => void;
}

export default function TankerArrival({ user, onNavigate, onLogout }: TankerArrivalProps) {
  const [formData, setFormData] = useState({
    tankerNumber: '',
    rawMaterial: '',
    arrivalDate: '',
    arrivalTime: '',
    samplingDate: '',
    samplingTime: '',
    batchNumber: '',
    orderNumber: '',
    driver: '',
    quantity: '',
    supplier: ''
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    alert('Tanker arrival recorded successfully!');
    setFormData({
      tankerNumber: '',
      rawMaterial: '',
      arrivalDate: '',
      arrivalTime: '',
      samplingDate: '',
      samplingTime: '',
      batchNumber: '',
      orderNumber: '',
      driver: '',
      quantity: '',
      supplier: ''
    });
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  return (
    <Layout user={user} onNavigate={onNavigate} onLogout={onLogout} currentPage="tanker-arrival">
      <div className="max-w-4xl mx-auto">
        {/* Page Header */}
        <div className="mb-6 flex items-center gap-4">
          <div className="bg-blue-600 p-3 rounded-lg">
            <Truck className="w-8 h-8 text-white" />
          </div>
          <div>
            <h2 className="text-2xl font-bold text-gray-800">Tanker Arrival</h2>
            <p className="text-gray-600">Record incoming raw material tanker arrival</p>
          </div>
        </div>

        {/* Form Card */}
        <form onSubmit={handleSubmit} className="bg-white rounded-lg shadow">
          {/* Tanker Information */}
          <div className="p-6 border-b border-gray-200">
            <h3 className="text-lg font-semibold text-gray-800 mb-4">Tanker Information</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-gray-700 font-medium mb-2">
                  Tanker Number <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  name="tankerNumber"
                  value={formData.tankerNumber}
                  onChange={handleChange}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="TKR-XXXXX"
                  required
                />
              </div>

              <div>
                <label className="block text-gray-700 font-medium mb-2">
                  Raw Material <span className="text-red-500">*</span>
                </label>
                <select
                  name="rawMaterial"
                  value={formData.rawMaterial}
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
                  Quantity (MT) <span className="text-red-500">*</span>
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
                  Supplier
                </label>
                <input
                  type="text"
                  name="supplier"
                  value={formData.supplier}
                  onChange={handleChange}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Supplier name"
                />
              </div>

              <div>
                <label className="block text-gray-700 font-medium mb-2">
                  Driver Name
                </label>
                <input
                  type="text"
                  name="driver"
                  value={formData.driver}
                  onChange={handleChange}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Driver name"
                />
              </div>
            </div>
          </div>

          {/* Arrival Details */}
          <div className="p-6 border-b border-gray-200">
            <h3 className="text-lg font-semibold text-gray-800 mb-4">Arrival Details</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-gray-700 font-medium mb-2">
                  Arrival Date <span className="text-red-500">*</span>
                </label>
                <input
                  type="date"
                  name="arrivalDate"
                  value={formData.arrivalDate}
                  onChange={handleChange}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>

              <div>
                <label className="block text-gray-700 font-medium mb-2">
                  Arrival Time <span className="text-red-500">*</span>
                </label>
                <input
                  type="time"
                  name="arrivalTime"
                  value={formData.arrivalTime}
                  onChange={handleChange}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>

              <div>
                <label className="block text-gray-700 font-medium mb-2">
                  Sampling Date <span className="text-red-500">*</span>
                </label>
                <input
                  type="date"
                  name="samplingDate"
                  value={formData.samplingDate}
                  onChange={handleChange}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>

              <div>
                <label className="block text-gray-700 font-medium mb-2">
                  Sampling Time <span className="text-red-500">*</span>
                </label>
                <input
                  type="time"
                  name="samplingTime"
                  value={formData.samplingTime}
                  onChange={handleChange}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>
            </div>
          </div>

          {/* Batch & Order Information */}
          <div className="p-6 border-b border-gray-200">
            <h3 className="text-lg font-semibold text-gray-800 mb-4">Batch & Order Information</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-gray-700 font-medium mb-2">
                  Batch Number
                </label>
                <input
                  type="text"
                  name="batchNumber"
                  value={formData.batchNumber}
                  onChange={handleChange}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="B-XXXXXX"
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
            </div>
          </div>

          {/* Form Actions */}
          <div className="p-6 bg-gray-50">
            <button
              type="submit"
              className="flex items-center gap-2 bg-blue-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-blue-700 transition-colors"
            >
              <Save className="w-5 h-5" />
              Record Arrival
            </button>
          </div>
        </form>
      </div>
    </Layout>
  );
}

import Layout from '../layout/Layout';
import { Save, TruckIcon } from 'lucide-react';
import { useState } from 'react';

interface TankerDispatchProps {
  user: any;
  onNavigate: (page: string) => void;
  onLogout: () => void;
}

export default function TankerDispatch({ user, onNavigate, onLogout }: TankerDispatchProps) {
  const [formData, setFormData] = useState({
    tanker_number: '',
    finished_product: '',
    dispatch_date: '',
    dispatch_time: '',
    batch_number: '',
    order_number: '',
    destination: '',
    quantity: '',
    driver_name: '',
    customer_name: ''
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const response = await fetch(
      'http://127.0.0.1:8000/api/tanker/dispatch/',
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      }
    );

    if (response.ok) {
      alert('Tanker dispatch recorded successfully!');
      setFormData({
        tanker_number: '',
        finished_product: '',
        quantity: '',
        driver_name: '',
        dispatch_date: '',
        dispatch_time: '',
        destination: '',
        customer_name: '',
        batch_number: '',
        order_number: '',
      });
    } else {
      alert('Error saving tanker dispatch');
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  return (
    <Layout user={user} onNavigate={onNavigate} onLogout={onLogout} currentPage="tanker-dispatch">
      <div className="max-w-4xl mx-auto">
        {/* Page Header */}
        <div className="mb-6 flex items-center gap-4">
          <div className="bg-green-600 p-3 rounded-lg">
            <TruckIcon className="w-8 h-8 text-white" />
          </div>
          <div>
            <h2 className="text-2xl font-bold text-gray-800">Tanker Dispatch</h2>
            <p className="text-gray-600">Record outgoing finished product dispatch</p>
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
                  name="tanker_number"
                  value={formData.tanker_number}
                  onChange={handleChange}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="TKR-XXXXX"
                  required
                />
              </div>

              <div>
                <label className="block text-gray-700 font-medium mb-2">
                  Finished Product <span className="text-red-500">*</span>
                </label>
                <select
                  name="finished_product"
                  value={formData.finished_product}
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
                  Driver Name
                </label>
                <input
                  type="text"
                  name="driver_name"
                  value={formData.driver_name}
                  onChange={handleChange}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Driver name"
                />
              </div>
            </div>
          </div>

          {/* Dispatch Details */}
          <div className="p-6 border-b border-gray-200">
            <h3 className="text-lg font-semibold text-gray-800 mb-4">Dispatch Details</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-gray-700 font-medium mb-2">
                  Dispatch Date <span className="text-red-500">*</span>
                </label>
                <input
                  type="date"
                  name="dispatch_date"
                  value={formData.dispatch_date}
                  onChange={handleChange}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>

              <div>
                <label className="block text-gray-700 font-medium mb-2">
                  Dispatch Time <span className="text-red-500">*</span>
                </label>
                <input
                  type="time"
                  name="dispatch_time"
                  value={formData.dispatch_time}
                  onChange={handleChange}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>

              <div>
                <label className="block text-gray-700 font-medium mb-2">
                  Destination
                </label>
                <input
                  type="text"
                  name="destination"
                  value={formData.destination}
                  onChange={handleChange}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Destination location"
                />
              </div>

              <div>
                <label className="block text-gray-700 font-medium mb-2">
                  Customer Name
                </label>
                <input
                  type="text"
                  name="customer_name"
                  value={formData.customer_name}
                  onChange={handleChange}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Customer/Distributor name"
                />
              </div>
            </div>
          </div>

          {/* Batch & Order Information */}
          <div className="p-6 border-b border-gray-200">
            <h3 className="text-lg font-semibold text-gray-800 mb-4">Linked Batch & Order</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-gray-700 font-medium mb-2">
                  Batch Number <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  name="batch_number"
                  value={formData.batch_number}
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
                  name="order_number"
                  value={formData.order_number}
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
              className="flex items-center gap-2 bg-green-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-green-700 transition-colors"
            >
              <Save className="w-5 h-5" />
              Record Dispatch
            </button>
          </div>
        </form>
      </div>
    </Layout>
  );
}

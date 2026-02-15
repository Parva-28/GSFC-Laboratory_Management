import Layout from '../layout/Layout';
import { Search, Calendar, TruckIcon, ArrowRight } from 'lucide-react';
import { useEffect, useState } from "react";


interface TankerHistoryProps {
  user: any;
  onNavigate: (page: string) => void;
  onLogout: () => void;
}

export default function TankerHistory({ user, onNavigate, onLogout }: TankerHistoryProps) {
  const [searchTerm, setSearchTerm] = useState('');


  const [history, setHistory] = useState<any[]>([]);

  useEffect(() => {
  fetch("http://127.0.0.1:8000/api/tanker/history/")
    .then(res => res.json())
    .then(data => setHistory(data))
    .catch(err => console.error("History fetch error", err));
}, []);


const uiHistory = history.map((item, index) => ({
  id: index + 1,

  tankerNumber: item.tanker_number,

  type: item.movement_type === "ARRIVAL" ? "arrival" : "dispatch",

  material: item.material_or_product,

  quantity: item.quantity,

  date: item.date,
  time: item.time,

  batchNumber: item.batch_number,

  status:
    item.movement_type === "ARRIVAL"
      ? "Completed"
      : "Delivered",

  supplier:
    item.movement_type === "ARRIVAL"
      ? item.source_destination
      : undefined,

  destination:
    item.movement_type === "DISPATCH"
      ? item.source_destination
      : undefined,
}));

 const filteredHistory = uiHistory.filter(item =>

    item.tankerNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
    item.material.toLowerCase().includes(searchTerm.toLowerCase()) ||
    item.batchNumber.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <Layout user={user} onNavigate={onNavigate} onLogout={onLogout} currentPage="tanker-history">
      <div>
        {/* Page Header */}
        <div className="mb-6">
          <h2 className="text-2xl font-bold text-gray-800">Tanker History & Traceability</h2>
          <p className="text-gray-600">Complete tracking from arrival to dispatch</p>
        </div>

        {/* Search & Filter */}
        <div className="bg-white rounded-lg shadow p-4 mb-6">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input
                type="text"
                placeholder="Search by tanker number, material, or batch..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <button className="flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50">
              <Calendar className="w-5 h-5" />
              Filter by Date
            </button>
          </div>
        </div>

        {/* Timeline View */}
        <div className="space-y-4">
          {filteredHistory.map((item) => (
            <div key={item.id} className="bg-white rounded-lg shadow hover:shadow-md transition-shadow">
              <div className="p-6">
                <div className="flex items-start gap-4">
                  {/* Icon */}
                  <div className={`p-3 rounded-full ${
                    item.type === 'arrival' ? 'bg-blue-100' : 'bg-green-100'
                  }`}>
                    <TruckIcon className={`w-6 h-6 ${
                      item.type === 'arrival' ? 'text-blue-600' : 'text-green-600'
                    }`} />
                  </div>

                  {/* Content */}
                  <div className="flex-1">
                    <div className="flex items-start justify-between mb-2">
                      <div>
                        <h3 className="text-lg font-semibold text-gray-800">
                          {item.tankerNumber}
                        </h3>
                        <p className="text-sm text-gray-600">
                          {item.type === 'arrival' ? 'Raw Material Arrival' : 'Product Dispatch'}
                        </p>
                      </div>
                      <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
                        item.status === 'Completed' || item.status === 'Delivered'
                          ? 'bg-green-100 text-green-800'
                          : 'bg-blue-100 text-blue-800'
                      }`}>
                        {item.status}
                      </span>
                    </div>

                    {/* Details Grid */}
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-4">
                      <div>
                        <p className="text-xs text-gray-500 mb-1">Material/Product</p>
                        <p className="text-sm font-medium text-gray-800">{item.material}</p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-500 mb-1">Quantity</p>
                        <p className="text-sm font-medium text-gray-800">{item.quantity} MT</p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-500 mb-1">Date & Time</p>
                        <p className="text-sm font-medium text-gray-800">
                          {new Date(item.date).toLocaleDateString()} {item.time}
                        </p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-500 mb-1">Batch Number</p>
                        <p className="text-sm font-medium text-gray-800">{item.batchNumber}</p>
                      </div>
                    </div>

                    {/* Additional Info */}
                    <div className="mt-4 pt-4 border-t border-gray-200 flex items-center justify-between">
                      <div className="text-sm text-gray-600">
                        {item.type === 'arrival' && item.supplier && (
                          <span>Supplier: <strong>{item.supplier}</strong></span>
                        )}
                        {item.type === 'dispatch' && item.destination && (
                          <span>Destination: <strong>{item.destination}</strong></span>
                        )}
                      </div>
                      <button className="flex items-center gap-2 text-blue-600 hover:text-blue-700 font-medium text-sm">
                        View Details
                        <ArrowRight className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Empty State */}
        {filteredHistory.length === 0 && (
          <div className="bg-white rounded-lg shadow p-12 text-center">
            <TruckIcon className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-800 mb-2">No records found</h3>
            <p className="text-gray-600">Try adjusting your search criteria</p>
          </div>
        )}
      </div>
    </Layout>
  );
}

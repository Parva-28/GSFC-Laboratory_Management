import { useState, useEffect } from 'react';
import { Search, Calendar, TruckIcon, ArrowRight, Save, X, Plus } from 'lucide-react';
import api from '../../api';

interface TankerTrackProps {
  user: any;
  onNavigate: (page: string) => void;
  onLogout: () => void;
}

type ModalMode = null | 'arrival' | 'dispatch';

const INITIAL_ARRIVAL = {
  tanker_number: '', raw_material: '', arrival_date: '', arrival_time: '',
  sampling_date: '', sampling_time: '', batch_number: '', order_number: '',
  driver_name: '', quantity: '', supplier: ''
};

const INITIAL_DISPATCH = {
  tanker_number: '', finished_product: '', dispatch_date: '', dispatch_time: '',
  batch_number: '', order_number: '', destination: '', quantity: '',
  driver_name: '', customer_name: ''
};

export default function TankerTrack({ user, onNavigate, onLogout }: TankerTrackProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [history, setHistory] = useState<any[]>([]);
  const [modalMode, setModalMode] = useState<ModalMode>(null);
  const [arrivalForm, setArrivalForm] = useState(INITIAL_ARRIVAL);
  const [dispatchForm, setDispatchForm] = useState(INITIAL_DISPATCH);
  const [submitting, setSubmitting] = useState(false);
  const [isDownloadingCoA, setIsDownloadingCoA] = useState(false);

  const fetchHistory = () => {
    api.get("tanker/history/")
      .then(res => setHistory(res.data.data?.results || []))
      .catch(err => console.error("History fetch error", err));
  };

  useEffect(() => { fetchHistory(); }, []);

  // ── Arrival form submit ──
  const handleArrivalSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const response = await api.post('tanker/arrival/', arrivalForm);
      const generatedTankerId = response.data.data?.tanker_id || "Unknown";
      alert(`Tanker arrival recorded!\nGenerated Tanker ID: ${generatedTankerId}`);
      setArrivalForm(INITIAL_ARRIVAL);
      setModalMode(null);
      fetchHistory();
    } catch (error: any) {
      const errorMsg = error.response?.data?.error || error.message || 'Unknown error';
      alert(`Failed to submit tanker arrival. Error: ${errorMsg}`);
    } finally { setSubmitting(false); }
  };

  // ── Dispatch form submit ──
  const handleDispatchSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await api.post('tanker/dispatch/', dispatchForm);
      alert('Tanker dispatch recorded successfully!');
      setDispatchForm(INITIAL_DISPATCH);
      setModalMode(null);
      fetchHistory();
    } catch (error: any) {
      const errorMsg = error.response?.data?.error || error.message || 'Unknown error';
      alert(`Failed to submit tanker dispatch. Error: ${errorMsg}`);
    } finally { setSubmitting(false); }
  };

  const handleDownloadCoA = async (batchNumber: string) => {
    if (!batchNumber) { alert("Batch number is required to generate CoA."); return; }
    try {
      setIsDownloadingCoA(true);
      const res = await api.get(`/api/reports/coa/${encodeURIComponent(batchNumber)}/`, { responseType: 'blob' });
      const url = window.URL.createObjectURL(new Blob([res.data]));
      const link = document.createElement('a');
      link.href = url;
      const disposition = res.headers['content-disposition'];
      let fileName = `CoA_${batchNumber}.pdf`;
      if (disposition && disposition.indexOf('attachment') !== -1) {
        const filenameRegex = /filename[^;=\n]*=((['"]).*?\2|[^;\n]*)/;
        const matches = filenameRegex.exec(disposition);
        if (matches != null && matches[1]) { fileName = matches[1].replace(/['"]/g, ''); }
      }
      link.setAttribute('download', fileName);
      document.body.appendChild(link);
      link.click();
      link.parentNode?.removeChild(link);
    } catch (err: any) {
      if (err.response?.status === 404) { alert('Lab data not found for this batch.'); }
      else { alert('Failed to generate CoA.'); }
    } finally { setIsDownloadingCoA(false); }
  };

  const uiHistory = history.map((item, index) => ({
    id: index + 1,
    tankerNumber: item.tanker_number,
    type: item.movement_type === "ARRIVAL" ? "arrival" : "dispatch",
    material: item.material_or_product,
    quantity: item.quantity,
    date: item.date,
    time: item.time,
    batchNumber: item.batch_number,
    status: item.movement_type === "ARRIVAL" ? "Completed" : "Delivered",
    supplier: item.movement_type === "ARRIVAL" ? item.source_destination : undefined,
    destination: item.movement_type === "DISPATCH" ? item.source_destination : undefined,
  }));

  const filteredHistory = uiHistory.filter(item =>
    item.tankerNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
    item.material.toLowerCase().includes(searchTerm.toLowerCase()) ||
    item.batchNumber.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleChange = (setter: Function) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setter((prev: any) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  return (
    <>
      <div>
        {/* Page Header */}
        <div className="mb-6 flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold text-gray-800">Tanker Track</h2>
            <p className="text-gray-600">Complete tracking from arrival to dispatch</p>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={() => setModalMode('arrival')}
              className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2.5 rounded-lg font-semibold hover:bg-blue-700 transition-colors shadow-sm"
            >
              <Plus className="w-4 h-4" /> Arrival
            </button>
            <button
              onClick={() => setModalMode('dispatch')}
              className="flex items-center gap-2 bg-green-600 text-white px-4 py-2.5 rounded-lg font-semibold hover:bg-green-700 transition-colors shadow-sm"
            >
              <Plus className="w-4 h-4" /> Dispatch
            </button>
          </div>
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
                  <div className={`p-3 rounded-full ${item.type === 'arrival' ? 'bg-blue-100' : 'bg-green-100'}`}>
                    <TruckIcon className={`w-6 h-6 ${item.type === 'arrival' ? 'text-blue-600' : 'text-green-600'}`} />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-start justify-between mb-2">
                      <div>
                        <h3 className="text-lg font-semibold text-gray-800">{item.tankerNumber}</h3>
                        <p className="text-sm text-gray-600">
                          {item.type === 'arrival' ? 'Raw Material Arrival' : 'Product Dispatch'}
                        </p>
                      </div>
                      <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
                        item.status === 'Completed' || item.status === 'Delivered'
                          ? 'bg-green-100 text-green-800' : 'bg-blue-100 text-blue-800'}`}>
                        {item.status}
                      </span>
                    </div>

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

                    <div className="mt-4 pt-4 border-t border-gray-200 flex items-center justify-between">
                      <div className="text-sm text-gray-600 flex-1">
                        {item.type === 'arrival' && item.supplier && (
                          <span>Supplier: <strong>{item.supplier}</strong></span>
                        )}
                        {item.type === 'dispatch' && item.destination && (
                          <span>Destination: <strong>{item.destination}</strong></span>
                        )}
                      </div>
                      <div className="flex items-center gap-4">
                        {item.type === 'dispatch' && (
                          <button
                            onClick={() => handleDownloadCoA(item.batchNumber)}
                            disabled={isDownloadingCoA}
                            className="flex items-center gap-2 text-red-600 hover:text-red-700 bg-red-50 hover:bg-red-100 px-3 py-1.5 rounded-lg font-medium text-sm transition-colors disabled:opacity-50"
                          >
                            {isDownloadingCoA ? 'Generating...' : 'Download CoA'}
                          </button>
                        )}
                        <button className="flex items-center gap-2 text-blue-600 hover:text-blue-700 font-medium text-sm">
                          View Details
                          <ArrowRight className="w-4 h-4" />
                        </button>
                      </div>
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

      {/* ── MODAL OVERLAY ── */}
      {modalMode && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-start justify-center pt-10 overflow-y-auto">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-2xl mx-4 mb-10 relative animate-in fade-in">
            {/* Modal Header */}
            <div className={`px-6 py-4 rounded-t-xl flex items-center justify-between ${modalMode === 'arrival' ? 'bg-blue-600' : 'bg-green-600'}`}>
              <div className="flex items-center gap-3 text-white">
                <TruckIcon className="w-6 h-6" />
                <h2 className="text-lg font-bold">
                  {modalMode === 'arrival' ? 'Record Tanker Arrival' : 'Record Tanker Dispatch'}
                </h2>
              </div>
              <button onClick={() => setModalMode(null)} className="text-white/80 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* ── ARRIVAL FORM ── */}
            {modalMode === 'arrival' && (
              <form onSubmit={handleArrivalSubmit}>
                <div className="p-6 space-y-5">
                  <h3 className="text-sm font-bold text-gray-500 uppercase tracking-wider">Tanker Information</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-gray-700 font-medium mb-1 text-sm">Tanker Number <span className="text-red-500">*</span></label>
                      <input type="text" name="tanker_number" value={arrivalForm.tanker_number} onChange={handleChange(setArrivalForm)} className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" placeholder="TKR-XXXXX" required />
                    </div>
                    <div>
                      <label className="block text-gray-700 font-medium mb-1 text-sm">Raw Material <span className="text-red-500">*</span></label>
                      <select name="raw_material" value={arrivalForm.raw_material} onChange={handleChange(setArrivalForm)} className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" required>
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
                      <label className="block text-gray-700 font-medium mb-1 text-sm">Quantity (MT) <span className="text-red-500">*</span></label>
                      <input type="number" step="0.01" name="quantity" value={arrivalForm.quantity} onChange={handleChange(setArrivalForm)} className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" placeholder="0.00" required />
                    </div>
                    <div>
                      <label className="block text-gray-700 font-medium mb-1 text-sm">Supplier</label>
                      <input type="text" name="supplier" value={arrivalForm.supplier} onChange={handleChange(setArrivalForm)} className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" placeholder="Supplier name" />
                    </div>
                    <div>
                      <label className="block text-gray-700 font-medium mb-1 text-sm">Driver Name</label>
                      <input type="text" name="driver_name" value={arrivalForm.driver_name} onChange={handleChange(setArrivalForm)} className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" placeholder="Driver name" />
                    </div>
                  </div>

                  <h3 className="text-sm font-bold text-gray-500 uppercase tracking-wider pt-2">Arrival Details</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-gray-700 font-medium mb-1 text-sm">Arrival Date <span className="text-red-500">*</span></label>
                      <input type="date" name="arrival_date" value={arrivalForm.arrival_date} onChange={handleChange(setArrivalForm)} className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" required />
                    </div>
                    <div>
                      <label className="block text-gray-700 font-medium mb-1 text-sm">Arrival Time <span className="text-red-500">*</span></label>
                      <input type="time" name="arrival_time" value={arrivalForm.arrival_time} onChange={handleChange(setArrivalForm)} className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" required />
                    </div>
                    <div>
                      <label className="block text-gray-700 font-medium mb-1 text-sm">Sampling Date <span className="text-red-500">*</span></label>
                      <input type="date" name="sampling_date" value={arrivalForm.sampling_date} onChange={handleChange(setArrivalForm)} className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" required />
                    </div>
                    <div>
                      <label className="block text-gray-700 font-medium mb-1 text-sm">Sampling Time <span className="text-red-500">*</span></label>
                      <input type="time" name="sampling_time" value={arrivalForm.sampling_time} onChange={handleChange(setArrivalForm)} className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" required />
                    </div>
                  </div>

                  <h3 className="text-sm font-bold text-gray-500 uppercase tracking-wider pt-2">Batch & Order</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-gray-700 font-medium mb-1 text-sm">Batch Number</label>
                      <input type="text" name="batch_number" value={arrivalForm.batch_number} onChange={handleChange(setArrivalForm)} className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" placeholder="B-XXXXXX" />
                    </div>
                    <div>
                      <label className="block text-gray-700 font-medium mb-1 text-sm">Order Number</label>
                      <input type="text" name="order_number" value={arrivalForm.order_number} onChange={handleChange(setArrivalForm)} className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" placeholder="ORD-XXXXXX" />
                    </div>
                  </div>
                </div>
                <div className="px-6 py-4 bg-gray-50 rounded-b-xl flex justify-end gap-3">
                  <button type="button" onClick={() => setModalMode(null)} className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-100 font-medium">Cancel</button>
                  <button type="submit" disabled={submitting} className="flex items-center gap-2 bg-blue-600 text-white px-5 py-2 rounded-lg font-semibold hover:bg-blue-700 transition-colors disabled:opacity-60">
                    <Save className="w-4 h-4" /> {submitting ? 'Saving...' : 'Record Arrival'}
                  </button>
                </div>
              </form>
            )}

            {/* ── DISPATCH FORM ── */}
            {modalMode === 'dispatch' && (
              <form onSubmit={handleDispatchSubmit}>
                <div className="p-6 space-y-5">
                  <h3 className="text-sm font-bold text-gray-500 uppercase tracking-wider">Tanker Information</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-gray-700 font-medium mb-1 text-sm">Tanker Number <span className="text-red-500">*</span></label>
                      <input type="text" name="tanker_number" value={dispatchForm.tanker_number} onChange={handleChange(setDispatchForm)} className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500" placeholder="TKR-XXXXX" required />
                    </div>
                    <div>
                      <label className="block text-gray-700 font-medium mb-1 text-sm">Finished Product <span className="text-red-500">*</span></label>
                      <select name="finished_product" value={dispatchForm.finished_product} onChange={handleChange(setDispatchForm)} className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500" required>
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
                      <label className="block text-gray-700 font-medium mb-1 text-sm">Quantity (MT) <span className="text-red-500">*</span></label>
                      <input type="number" step="0.01" name="quantity" value={dispatchForm.quantity} onChange={handleChange(setDispatchForm)} className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500" placeholder="0.00" required />
                    </div>
                    <div>
                      <label className="block text-gray-700 font-medium mb-1 text-sm">Driver Name</label>
                      <input type="text" name="driver_name" value={dispatchForm.driver_name} onChange={handleChange(setDispatchForm)} className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500" placeholder="Driver name" />
                    </div>
                  </div>

                  <h3 className="text-sm font-bold text-gray-500 uppercase tracking-wider pt-2">Dispatch Details</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-gray-700 font-medium mb-1 text-sm">Dispatch Date <span className="text-red-500">*</span></label>
                      <input type="date" name="dispatch_date" value={dispatchForm.dispatch_date} onChange={handleChange(setDispatchForm)} className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500" required />
                    </div>
                    <div>
                      <label className="block text-gray-700 font-medium mb-1 text-sm">Dispatch Time <span className="text-red-500">*</span></label>
                      <input type="time" name="dispatch_time" value={dispatchForm.dispatch_time} onChange={handleChange(setDispatchForm)} className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500" required />
                    </div>
                    <div>
                      <label className="block text-gray-700 font-medium mb-1 text-sm">Destination</label>
                      <input type="text" name="destination" value={dispatchForm.destination} onChange={handleChange(setDispatchForm)} className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500" placeholder="Destination location" />
                    </div>
                    <div>
                      <label className="block text-gray-700 font-medium mb-1 text-sm">Customer Name</label>
                      <input type="text" name="customer_name" value={dispatchForm.customer_name} onChange={handleChange(setDispatchForm)} className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500" placeholder="Customer/Distributor name" />
                    </div>
                  </div>

                  <h3 className="text-sm font-bold text-gray-500 uppercase tracking-wider pt-2">Linked Batch & Order</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-gray-700 font-medium mb-1 text-sm">Batch Number <span className="text-red-500">*</span></label>
                      <input type="text" name="batch_number" value={dispatchForm.batch_number} onChange={handleChange(setDispatchForm)} className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500" placeholder="B-XXXXXX" required />
                    </div>
                    <div>
                      <label className="block text-gray-700 font-medium mb-1 text-sm">Order Number</label>
                      <input type="text" name="order_number" value={dispatchForm.order_number} onChange={handleChange(setDispatchForm)} className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500" placeholder="ORD-XXXXXX" />
                    </div>
                  </div>
                </div>
                <div className="px-6 py-4 bg-gray-50 rounded-b-xl flex justify-end gap-3">
                  <button type="button" onClick={() => setModalMode(null)} className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-100 font-medium">Cancel</button>
                  <button type="submit" disabled={submitting} className="flex items-center gap-2 bg-green-600 text-white px-5 py-2 rounded-lg font-semibold hover:bg-green-700 transition-colors disabled:opacity-60">
                    <Save className="w-4 h-4" /> {submitting ? 'Saving...' : 'Record Dispatch'}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </>
  );
}

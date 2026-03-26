import { useState, useEffect } from "react"
import { motion } from "framer-motion"
import api from "../../api"
import { Plus, Edit, Calendar, AlertTriangle, CheckCircle2 } from "lucide-react"

export default function InstrumentCalibration() {
  const [calibrations, setCalibrations] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")

  // Form states
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [formData, setFormData] = useState({ id: "", instrument_id: "", name: "", last_calibration_date: "", next_due_date: "", status: "PENDING", calibrated_by: "", notes: "" })

  const fetchCalibrations = async () => {
    try {
      setLoading(true)
      const res = await api.get("instruments/calibration/")
      setCalibrations(res.data.data)
      setError("")
    } catch (err: any) {
      setError(err.response?.data?.message || "Failed to load calibrations")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchCalibrations()
  }, [])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      if (formData.id) {
        // Update
        await api.patch(`instruments/calibration/${formData.id}/`, formData)
      } else {
        // Create
        await api.post("instruments/calibration/add/", formData)
      }
      setIsModalOpen(false)
      fetchCalibrations()
    } catch (err: any) {
      alert(err.response?.data?.errors || err.response?.data?.message || "Error saving calibration")
    }
  }

  const openEditModal = (item: any) => {
    setFormData({ 
        id: item.id, 
        instrument_id: item.instrument_id, 
        name: item.name, 
        last_calibration_date: item.last_calibration || "", 
        next_due_date: item.next_due || "", 
        status: item.status, 
        calibrated_by: item.calibrated_by || "", 
        notes: item.notes || "" 
    })
    setIsModalOpen(true)
  }

  const openCreateModal = () => {
    setFormData({ id: "", instrument_id: "", name: "", last_calibration_date: "", next_due_date: "", status: "PENDING", calibrated_by: "", notes: "" })
    setIsModalOpen(true)
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Instrument Calibration</h1>
          <p className="text-gray-500 text-sm">Track and manage laboratory equipment maintenance</p>
        </div>
        <button
          onClick={openCreateModal}
          className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-medium flex items-center transition-colors"
        >
          <Plus className="w-4 h-4 mr-2" />
          Add Instrument
        </button>
      </div>

      {error && (
        <div className="bg-red-50 text-red-600 p-4 rounded-xl border border-red-100/50 flex items-center space-x-3">
          <AlertTriangle className="w-5 h-5 text-red-500" />
          <p className="text-sm font-medium">{error}</p>
        </div>
      )}

      {loading ? (
        <div className="animate-pulse space-y-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-16 bg-gray-100 dark:bg-gray-800 rounded-xl"></div>
          ))}
        </div>
      ) : (
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead className="bg-gray-50 dark:bg-gray-700/50 text-gray-500 dark:text-gray-400 font-medium border-b border-gray-100 dark:border-gray-700">
                <tr>
                  <th className="px-6 py-4">Instrument</th>
                  <th className="px-6 py-4">Lab</th>
                  <th className="px-6 py-4">Last Calibration</th>
                  <th className="px-6 py-4">Next Due</th>
                  <th className="px-6 py-4">Status</th>
                  <th className="px-6 py-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-gray-700/50">
                {calibrations.map((item) => {
                  const isOverdue = new Date(item.next_due) < new Date() && item.status !== 'COMPLETED';
                  const statusColor = item.status === 'COMPLETED' ? 'bg-emerald-100 text-emerald-700' :
                                      isOverdue || item.status === 'OVERDUE' ? 'bg-red-100 text-red-700' :
                                      'bg-amber-100 text-amber-700';

                  return (
                    <motion.tr
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      key={item.id}
                      className="hover:bg-gray-50/50 dark:hover:bg-gray-800/50 transition-colors"
                    >
                      <td className="px-6 py-4">
                        <div className="font-medium text-gray-900 dark:text-gray-100">{item.name}</div>
                        <div className="text-xs text-gray-500">{item.instrument_id}</div>
                      </td>
                      <td className="px-6 py-4 text-gray-600 dark:text-gray-300">
                        {item.lab}
                      </td>
                      <td className="px-6 py-4 text-gray-600 dark:text-gray-300">
                        {item.last_calibration || "—"}
                      </td>
                      <td className="px-6 py-4">
                         <div className={`font-medium ${isOverdue ? 'text-red-600 font-bold' : 'text-gray-600 dark:text-gray-300'}`}>
                            {item.next_due}
                         </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold ${statusColor}`}>
                          {isOverdue && item.status !== 'COMPLETED' ? 'OVERDUE' : item.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <button
                          onClick={() => openEditModal(item)}
                          className="text-gray-400 hover:text-blue-500 transition-colors"
                          title="Edit Instrument"
                        >
                          <Edit className="w-4 h-4 inline" />
                        </button>
                      </td>
                    </motion.tr>
                  )
                })}
                {calibrations.length === 0 && (
                  <tr>
                    <td colSpan={6} className="px-6 py-8 text-center text-gray-500">
                      No instruments found.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Create/Edit Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl w-full max-w-lg overflow-hidden border border-gray-100 dark:border-gray-700"
          >
            <div className="px-6 py-4 border-b border-gray-100 dark:border-gray-700 flex justify-between items-center bg-gray-50 dark:bg-gray-800/50">
              <h3 className="text-lg font-bold text-gray-900 dark:text-gray-100">
                {formData.id ? "Update Calibration Log" : "Add Instrument"}
              </h3>
            </div>
            <form onSubmit={handleSubmit} className="p-6 space-y-4 text-left">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Instrument ID</label>
                  <input
                    type="text"
                    value={formData.instrument_id}
                    onChange={(e) => setFormData({...formData, instrument_id: e.target.value})}
                    disabled={!!formData.id}
                    required
                    className="w-full px-4 py-2 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl focus:ring-2 focus:ring-blue-500 disabled:opacity-60"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Instrument Name</label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData({...formData, name: e.target.value})}
                    disabled={!!formData.id}
                    required
                    className="w-full px-4 py-2 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl focus:ring-2 focus:ring-blue-500 disabled:opacity-60"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Last Calibration Date</label>
                  <input
                    type="date"
                    value={formData.last_calibration_date}
                    onChange={(e) => setFormData({...formData, last_calibration_date: e.target.value})}
                    className="w-full px-4 py-2 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Next Due Date</label>
                  <input
                    type="date"
                    value={formData.next_due_date}
                    onChange={(e) => setFormData({...formData, next_due_date: e.target.value})}
                    required
                    className="w-full px-4 py-2 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Status</label>
                  <select
                    value={formData.status}
                    onChange={(e) => setFormData({...formData, status: e.target.value})}
                    className="w-full px-4 py-2 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="PENDING">Pending</option>
                    <option value="COMPLETED">Completed</option>
                    <option value="OVERDUE">Overdue</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Calibrated By</label>
                  <input
                    type="text"
                    value={formData.calibrated_by}
                    onChange={(e) => setFormData({...formData, calibrated_by: e.target.value})}
                    className="w-full px-4 py-2 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Notes / Remarks</label>
                <textarea
                  value={formData.notes}
                  onChange={(e) => setFormData({...formData, notes: e.target.value})}
                  className="w-full px-4 py-2 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl focus:ring-2 focus:ring-blue-500 min-h-[80px]"
                ></textarea>
              </div>

              <div className="pt-4 flex justify-end space-x-3">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 text-sm font-medium text-gray-600 hover:text-gray-800 dark:text-gray-400 dark:hover:text-gray-200"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-medium transition-colors"
                >
                  {formData.id ? "Save Changes" : "Save Instrument"}
                </button>
              </div>
            </form>
          </motion.div>
        </div>
      )}
    </div>
  )
}

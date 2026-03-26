import { useState, useEffect } from "react"
import { motion } from "framer-motion"
import api from "../../api"
import { Plus, Users, Clock, AlertTriangle, CheckCircle, Info } from "lucide-react"

const LAB_OPTIONS = [
  { value: "Plant Lab 1", label: "Plant Lab 1" },
  { value: "Plant Lab 2", label: "Plant Lab 2" },
  { value: "Plant Lab 3", label: "Plant Lab 3" },
  { value: "Plant Lab 4", label: "Plant Lab 4" },
  { value: "Plant Lab 5", label: "Plant Lab 5" },
  { value: "Plant Lab 6", label: "Plant Lab 6" },
  { value: "Plant Lab 7", label: "Plant Lab 7" },
  { value: "Central Lab", label: "Central Lab" },
]

export default function ShiftHandover({ user }: { user: any }) {
  const [handovers, setHandovers] = useState<any[]>([])
  const [users, setUsers] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")

  // Form states
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [formData, setFormData] = useState({ 
      shift_date: new Date().toISOString().split('T')[0], 
      shift_type: "Morning", 
      handed_over_to_username: "", 
      lab: "",
      notes: "", 
      pending_tasks: "", 
      equipment_status: "" 
  })

  // Fetch available users to handover TO
  const fetchUsers = async () => {
    try {
        const res = await api.get("users/list/")
        setUsers(res.data.data)
    } catch (err) {
        console.error("Failed to load users", err)
    }
  }

  const fetchHandovers = async () => {
    try {
      setLoading(true)
      const res = await api.get("shifts/handovers/")
      const data = res.data.data
      setHandovers(data.results || data)
      setError("")
    } catch (err: any) {
      setError(err.response?.data?.message || "Failed to load shift handovers")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchUsers()
    fetchHandovers()
  }, [])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      await api.post("shifts/handovers/create/", formData)
      setIsModalOpen(false)
      fetchHandovers()
      setFormData({ 
          shift_date: new Date().toISOString().split('T')[0], 
          shift_type: "Morning", 
          handed_over_to_username: "", 
          lab: "",
          notes: "", 
          pending_tasks: "", 
          equipment_status: "" 
      })
    } catch (err: any) {
      alert(err.response?.data?.errors || err.response?.data?.message || "Error submitting handover")
    }
  }

  const openCreateModal = () => {
    setIsModalOpen(true)
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Shift Handover Log</h1>
          <p className="text-gray-500 text-sm">Communicate pending tasks and equipment status between shifts</p>
        </div>
        <button
          onClick={openCreateModal}
          className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-medium flex items-center transition-colors shadow-sm"
        >
          <Plus className="w-4 h-4 mr-2" />
          Log Handover
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
            <div key={i} className="h-24 bg-gray-100 dark:bg-gray-800 rounded-xl"></div>
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {handovers.map((item) => (
                <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    key={item.id}
                    className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-100 dark:border-gray-700 transition-hover hover:shadow-md"
                >
                    <div className="flex justify-between items-start mb-4">
                        <div>
                            <span className="inline-flex items-center px-2.5 py-1 rounded-md text-xs font-semibold bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200">
                                {item.shift_date} — {item.shift_type}
                            </span>
                            <div className="mt-2 text-xs text-gray-500 flex items-center gap-1">
                                <Clock className="w-3 h-3" /> Recorded: {item.created_at}
                            </div>
                        </div>
                        <div className="text-right">
                            <span className="text-xs font-bold text-blue-600 bg-blue-50 px-2 py-1 rounded">Lab: {item.lab}</span>
                        </div>
                    </div>
                    
                    <div className="flex items-center justify-between mb-4 pb-4 border-b border-gray-100 dark:border-gray-700">
                        <div className="flex items-center gap-2">
                            <div className="w-8 h-8 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center font-bold text-xs">
                                {item.handed_over_by?.substring(0,2).toUpperCase()}
                            </div>
                            <div className="text-sm font-medium">{item.handed_over_by}</div>
                        </div>
                        <div className="text-gray-400">→</div>
                        <div className="flex items-center gap-2 flex-row-reverse">
                            <div className="w-8 h-8 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center font-bold text-xs">
                                {item.handed_over_to?.substring(0,2).toUpperCase()}
                            </div>
                            <div className="text-sm font-medium">{item.handed_over_to}</div>
                        </div>
                    </div>
                    
                    <div className="space-y-3 text-sm">
                        <div>
                            <span className="font-semibold text-gray-700 dark:text-gray-300 block mb-1">Notes:</span>
                            <p className="text-gray-600 dark:text-gray-400 bg-gray-50 dark:bg-gray-900/50 p-2 rounded">{item.notes}</p>
                        </div>
                        {item.pending_tasks && (
                            <div>
                                <span className="font-semibold text-yellow-700 dark:text-yellow-500 flex items-center gap-1 mb-1">
                                    <AlertTriangle className="w-3 h-3" /> Pending Tasks:
                                </span>
                                <p className="text-gray-600 dark:text-gray-400">{item.pending_tasks}</p>
                            </div>
                        )}
                        {item.equipment_status && (
                            <div>
                                <span className="font-semibold text-gray-700 dark:text-gray-300 block mb-1">Equipment Status:</span>
                                <p className="text-gray-600 dark:text-gray-400">{item.equipment_status}</p>
                            </div>
                        )}
                    </div>
                </motion.div>
            ))}
            {handovers.length === 0 && (
                <div className="col-span-full py-12 text-center bg-white dark:bg-gray-800 rounded-xl border border-dashed border-gray-300 dark:border-gray-700">
                    <Users className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                    <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100">No Handovers Recorded</h3>
                    <p className="text-sm text-gray-500 mt-1">Start by logging the first shift handover.</p>
                </div>
            )}
        </div>
      )}

      {/* Create Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl w-full max-w-lg overflow-hidden border border-gray-100 dark:border-gray-700 max-h-[90vh] overflow-y-auto"
          >
            <div className="px-6 py-4 border-b border-gray-100 dark:border-gray-700 flex justify-between items-center bg-gray-50 dark:bg-gray-800/50">
              <h3 className="text-lg font-bold text-gray-900 dark:text-gray-100">
                Log Shift Handover
              </h3>
            </div>
            <form onSubmit={handleSubmit} className="p-6 space-y-4 text-left">
              
              {/* Lab Selection with Info Box */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Lab Under Handover *
                </label>
                <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-3 mb-2 flex gap-2">
                  <Info className="w-4 h-4 text-blue-600 dark:text-blue-400 flex-shrink-0 mt-0.5" />
                  <p className="text-xs text-blue-700 dark:text-blue-300">
                    Select the laboratory that is being handed over. Choose from Plant Lab 1 to 7 for plant-level labs, or Central Lab for the central laboratory.
                  </p>
                </div>
                <select
                  value={formData.lab}
                  onChange={(e) => setFormData({...formData, lab: e.target.value})}
                  required
                  className="w-full px-4 py-2 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl focus:ring-2 focus:ring-blue-500"
                >
                  <option value="" disabled>— Select Lab —</option>
                  {LAB_OPTIONS.map((opt) => (
                    <option key={opt.value} value={opt.value}>{opt.label}</option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Shift Date</label>
                  <input
                    type="date"
                    value={formData.shift_date}
                    onChange={(e) => setFormData({...formData, shift_date: e.target.value})}
                    required
                    className="w-full px-4 py-2 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Shift Type</label>
                  <select
                    value={formData.shift_type}
                    onChange={(e) => setFormData({...formData, shift_type: e.target.value})}
                    className="w-full px-4 py-2 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="Morning">Morning (1st Shift)</option>
                    <option value="Evening">Evening (2nd Shift)</option>
                    <option value="Night">Night (3rd Shift)</option>
                    <option value="General">General Shift</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1 flex items-center gap-1">
                  Handing Over To (Select User) *
                </label>
                <select
                    value={formData.handed_over_to_username}
                    onChange={(e) => setFormData({...formData, handed_over_to_username: e.target.value})}
                    required
                    className="w-full px-4 py-2 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl focus:ring-2 focus:ring-blue-500"
                >
                  <option value="" disabled>— Select User —</option>
                  {users.map((u) => (
                    <option key={u.username} value={u.username}>
                      {u.username} {u.lab ? `(${u.lab})` : ''}
                    </option>
                  ))}
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">General Notes *</label>
                <textarea
                  value={formData.notes}
                  onChange={(e) => setFormData({...formData, notes: e.target.value})}
                  required
                  placeholder="Summary of the shift operations..."
                  className="w-full px-4 py-2 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl focus:ring-2 focus:ring-blue-500 min-h-[80px]"
                ></textarea>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Pending Tasks</label>
                <textarea
                  value={formData.pending_tasks}
                  onChange={(e) => setFormData({...formData, pending_tasks: e.target.value})}
                  placeholder="Tasks left for the next shift..."
                  className="w-full px-4 py-2 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl focus:ring-2 focus:ring-blue-500 min-h-[60px]"
                ></textarea>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Equipment Status</label>
                <textarea
                  value={formData.equipment_status}
                  onChange={(e) => setFormData({...formData, equipment_status: e.target.value})}
                  placeholder="Any equipment down or needing recalibration?"
                  className="w-full px-4 py-2 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl focus:ring-2 focus:ring-blue-500 min-h-[60px]"
                ></textarea>
              </div>

              <div className="pt-4 flex justify-end space-x-3 border-t border-gray-100 dark:border-gray-700 pt-6">
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
                  Submit Handover
                </button>
              </div>
            </form>
          </motion.div>
        </div>
      )}
    </div>
  )
}

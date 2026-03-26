import { useState, useEffect } from "react"
import { motion } from "framer-motion"
import api from "../../api"
import { Plus, Edit, Trash2, KeyRound, ShieldAlert, ShieldCheck } from "lucide-react"

export default function AdminUserManagement() {
  const [users, setUsers] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")

  // Form states
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [isPasswordModalOpen, setIsPasswordModalOpen] = useState(false)
  const [formData, setFormData] = useState({ id: "", username: "", email: "", role: "EMPLOYEE", lab: "", password: "", is_active: true })
  const [passwordData, setPasswordData] = useState({ id: "", username: "", new_password: "" })

  const fetchUsers = async () => {
    try {
      setLoading(true)
      const res = await api.get("/api/admin/users/")
      setUsers(res.data.data)
      setError("")
    } catch (err: any) {
      setError(err.response?.data?.message || "Failed to load users")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchUsers()
  }, [])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      if (formData.id) {
        // Update
        await api.patch(`/api/admin/users/${formData.id}/`, {
          email: formData.email,
          role: formData.role,
          lab: formData.lab,
          is_active: formData.is_active
        })
      } else {
        // Create
        await api.post("/api/admin/users/create/", formData)
      }
      setIsModalOpen(false)
      fetchUsers()
    } catch (err: any) {
      alert(err.response?.data?.message || "Error saving user")
    }
  }

  const handlePasswordReset = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      await api.post(`/api/admin/users/${passwordData.id}/reset-password/`, {
        new_password: passwordData.new_password
      })
      alert("Password reset successfully!")
      setIsPasswordModalOpen(false)
    } catch (err: any) {
      alert(err.response?.data?.message || "Error resetting password")
    }
  }

  const openEditModal = (user: any) => {
    setFormData({ id: user.id, username: user.username, email: user.email, role: user.role, lab: user.lab || "", password: "", is_active: user.is_active })
    setIsModalOpen(true)
  }

  const openCreateModal = () => {
    setFormData({ id: "", username: "", email: "", role: "EMPLOYEE", lab: "", password: "", is_active: true })
    setIsModalOpen(true)
  }

  const openPasswordModal = (user: any) => {
    setPasswordData({ id: user.id, username: user.username, new_password: "" })
    setIsPasswordModalOpen(true)
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">User Management</h1>
          <p className="text-gray-500 text-sm">Create and manage access for employees and admins</p>
        </div>
        <button
          onClick={openCreateModal}
          className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-medium flex items-center transition-colors"
        >
          <Plus className="w-4 h-4 mr-2" />
          Add User
        </button>
      </div>

      {error && (
        <div className="bg-red-50 text-red-600 p-4 rounded-xl border border-red-100/50 flex items-center space-x-3">
          <ShieldAlert className="w-5 h-5 text-red-500" />
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
                  <th className="px-6 py-4">Username</th>
                  <th className="px-6 py-4">Role</th>
                  <th className="px-6 py-4">Lab / Plant</th>
                  <th className="px-6 py-4">Status</th>
                  <th className="px-6 py-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-gray-700/50">
                {users.map((user) => (
                  <motion.tr
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    key={user.id}
                    className="hover:bg-gray-50/50 dark:hover:bg-gray-800/50 transition-colors"
                  >
                    <td className="px-6 py-4">
                      <div className="font-medium text-gray-900 dark:text-gray-100">{user.username}</div>
                      <div className="text-xs text-gray-500">{user.email || "No email"}</div>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold ${
                        user.role === 'SUPER_ADMIN' ? 'bg-purple-100 text-purple-700' :
                        user.role === 'LAB_ADMIN' ? 'bg-blue-100 text-blue-700' :
                        'bg-gray-100 text-gray-700'
                      }`}>
                        {user.role}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-gray-600 dark:text-gray-300">
                      {user.lab || "—"}
                    </td>
                    <td className="px-6 py-4">
                      {user.is_active ? (
                        <span className="inline-flex items-center text-emerald-600 text-xs font-medium">
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 mr-2"></span> Active
                        </span>
                      ) : (
                        <span className="inline-flex items-center text-red-600 text-xs font-medium">
                          <span className="w-1.5 h-1.5 rounded-full bg-red-500 mr-2"></span> Disabled
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4 text-right space-x-3">
                      <button
                        onClick={() => openPasswordModal(user)}
                        className="text-gray-400 hover:text-orange-500 transition-colors"
                        title="Reset Password"
                      >
                        <KeyRound className="w-4 h-4 inline" />
                      </button>
                      <button
                        onClick={() => openEditModal(user)}
                        className="text-gray-400 hover:text-blue-500 transition-colors"
                        title="Edit User"
                      >
                        <Edit className="w-4 h-4 inline" />
                      </button>
                    </td>
                  </motion.tr>
                ))}
                {users.length === 0 && (
                  <tr>
                    <td colSpan={5} className="px-6 py-8 text-center text-gray-500">
                      No users found.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* User Create/Edit Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl w-full max-w-md overflow-hidden border border-gray-100 dark:border-gray-700"
          >
            <div className="px-6 py-4 border-b border-gray-100 dark:border-gray-700 flex justify-between items-center bg-gray-50 dark:bg-gray-800/50">
              <h3 className="text-lg font-bold text-gray-900 dark:text-gray-100">
                {formData.id ? "Edit User" : "Create New User"}
              </h3>
            </div>
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Username</label>
                <input
                  type="text"
                  value={formData.username}
                  onChange={(e) => setFormData({...formData, username: e.target.value})}
                  disabled={!!formData.id}
                  required
                  className="w-full px-4 py-2 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl focus:ring-2 focus:ring-blue-500 disabled:opacity-60"
                />
              </div>

              {!formData.id && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Password</label>
                  <input
                    type="password"
                    value={formData.password}
                    onChange={(e) => setFormData({...formData, password: e.target.value})}
                    required={!formData.id}
                    className="w-full px-4 py-2 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl focus:ring-2 focus:ring-blue-500"
                  />
                  <p className="text-xs text-gray-500 mt-1">Must contain at least 8 chars, 1 uppercase, 1 digit.</p>
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Email</label>
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({...formData, email: e.target.value})}
                  className="w-full px-4 py-2 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Role</label>
                  <select
                    value={formData.role}
                    onChange={(e) => setFormData({...formData, role: e.target.value})}
                    className="w-full px-4 py-2 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="EMPLOYEE">Employee</option>
                    <option value="LAB_ADMIN">Lab Admin</option>
                    <option value="SUPER_ADMIN">Super Admin</option>
                    <option value="VIEWER">Viewer</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Lab / Plant</label>
                  <select
                    value={formData.lab}
                    onChange={(e) => setFormData({...formData, lab: e.target.value})}
                    className="w-full px-4 py-2 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">(None)</option>
                    <option value="Urea-1">Urea-1</option>
                    <option value="Urea-2">Urea-2</option>
                    <option value="Ammonia-4">Ammonia-4</option>
                    <option value="AS-1">AS-1</option>
                    <option value="Caprolactam-1">Caprolactam-1</option>
                    <option value="Melamine-3">Melamine-3</option>
                    <option value="Nylon-6">Nylon-6</option>
                  </select>
                </div>
              </div>

              {!!formData.id && (
                <div className="flex items-center mt-4">
                  <input
                    type="checkbox"
                    id="isActive"
                    checked={formData.is_active}
                    onChange={(e) => setFormData({...formData, is_active: e.target.checked})}
                    className="w-4 h-4 text-blue-600 rounded border-gray-300 focus:ring-blue-500"
                  />
                  <label htmlFor="isActive" className="ml-2 text-sm text-gray-700 dark:text-gray-300">
                    Account is active (can login)
                  </label>
                </div>
              )}

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
                  {formData.id ? "Save Changes" : "Create User"}
                </button>
              </div>
            </form>
          </motion.div>
        </div>
      )}

      {/* Password Reset Modal */}
      {isPasswordModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl w-full max-w-sm overflow-hidden border border-gray-100 dark:border-gray-700"
          >
            <div className="px-6 py-4 border-b border-gray-100 dark:border-gray-700 bg-orange-50 dark:bg-orange-900/20">
              <h3 className="text-lg font-bold text-orange-800 dark:text-orange-400">
                Reset Password
              </h3>
              <p className="text-xs text-orange-600 dark:text-orange-500 mt-1">For user: {passwordData.username}</p>
            </div>
            <form onSubmit={handlePasswordReset} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">New Password</label>
                <input
                  type="password"
                  value={passwordData.new_password}
                  onChange={(e) => setPasswordData({...passwordData, new_password: e.target.value})}
                  required
                  className="w-full px-4 py-2 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl focus:ring-2 focus:ring-orange-500"
                />
                <p className="text-xs text-gray-500 mt-2">
                  This will log the user out of all active sessions immediately.
                </p>
              </div>

              <div className="pt-2 flex justify-end space-x-3">
                <button
                  type="button"
                  onClick={() => setIsPasswordModalOpen(false)}
                  className="px-4 py-2 text-sm font-medium text-gray-600 hover:text-gray-800"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-orange-600 hover:bg-orange-700 text-white rounded-lg text-sm font-medium transition-colors"
                >
                  Reset Password
                </button>
              </div>
            </form>
          </motion.div>
        </div>
      )}
    </div>
  )
}

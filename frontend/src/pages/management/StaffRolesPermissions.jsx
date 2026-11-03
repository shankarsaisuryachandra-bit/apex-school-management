import { useState, useEffect } from 'react'
import api from '../../api/axiosConfig'
import {
  HiShieldCheck, HiUserPlus, HiKey, HiTrash, HiCheckCircle,
  HiExclamationTriangle, HiXMark, HiCheck, HiSparkles, HiMagnifyingGlass,
  HiEye, HiPencilSquare, HiLockClosed, HiUserGroup, HiAdjustmentsHorizontal,
  HiArrowPath, HiFingerPrint, HiInformationCircle
} from 'react-icons/hi2'

export default function StaffRolesPermissions() {
  const [staffUsers, setStaffUsers] = useState([])
  const [modules, setModules] = useState([])
  const [roleTemplates, setRoleTemplates] = useState({})
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [roleFilter, setRoleFilter] = useState('ALL')
  const [message, setMessage] = useState(null)
  const [submitting, setSubmitting] = useState(false)

  // Modals state
  const [showModal, setShowModal] = useState(false)
  const [isEditing, setIsEditing] = useState(false)
  const [selectedUserId, setSelectedUserId] = useState(null)

  // Form state
  const [formData, setFormData] = useState({
    username: '',
    password: '',
    fullName: '',
    designation: '',
    phone: '',
    email: '',
    staffRole: 'ACCOUNTANT',
    permissions: [],
    isActive: true
  })

  // Role Simulator state
  const [simulatedRole, setSimulatedRole] = useState(null)

  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async () => {
    setLoading(true)
    try {
      const [usersRes, modulesRes] = await Promise.all([
        api.get('/admin/roles/staff-users'),
        api.get('/admin/roles/modules')
      ])
      setStaffUsers(usersRes.data || [])
      setModules(modulesRes.data?.modules || [])
      setRoleTemplates(modulesRes.data?.roleTemplates || {})
    } catch (error) {
      console.error('Failed to load staff roles and permissions:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleOpenAddModal = () => {
    setIsEditing(false)
    setSelectedUserId(null)
    const defaultTemplate = roleTemplates['ACCOUNTANT'] || []
    setFormData({
      username: '',
      password: '',
      fullName: '',
      designation: '',
      phone: '',
      email: '',
      staffRole: 'ACCOUNTANT',
      permissions: defaultTemplate.includes('*') ? modules.map(m => m.code) : defaultTemplate,
      isActive: true
    })
    setShowModal(true)
  }

  const handleOpenEditModal = (user) => {
    setIsEditing(true)
    setSelectedUserId(user.id)
    setFormData({
      username: user.username,
      password: '',
      fullName: user.fullName || '',
      designation: user.designation || '',
      phone: user.phone || '',
      email: user.email || '',
      staffRole: user.staffRole || 'CUSTOM',
      permissions: user.permissions || [],
      isActive: user.isActive !== false
    })
    setShowModal(true)
  }

  const handleRoleTemplateChange = (newRole) => {
    const templatePerms = roleTemplates[newRole]
    let newPerms = []
    if (templatePerms) {
      if (templatePerms.includes('*')) {
        newPerms = modules.map(m => m.code)
      } else {
        newPerms = [...templatePerms]
      }
    }
    setFormData(prev => ({
      ...prev,
      staffRole: newRole,
      permissions: newPerms
    }))
  }

  const togglePermission = (code) => {
    setFormData(prev => {
      const exists = prev.permissions.includes(code)
      const updated = exists
        ? prev.permissions.filter(p => p !== code)
        : [...prev.permissions, code]
      return {
        ...prev,
        staffRole: 'CUSTOM', // When manually toggling, switch to custom role
        permissions: updated
      }
    })
  }

  const handleSelectAllPermissions = () => {
    setFormData(prev => ({
      ...prev,
      permissions: modules.map(m => m.code)
    }))
  }

  const handleClearAllPermissions = () => {
    setFormData(prev => ({
      ...prev,
      permissions: ['DASHBOARD']
    }))
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setSubmitting(true)
    setMessage(null)

    try {
      if (isEditing) {
        await api.put(`/admin/roles/staff-users/${selectedUserId}`, formData)
        setMessage({ type: 'success', text: `Staff account '${formData.username}' updated successfully!` })
      } else {
        await api.post('/admin/roles/staff-users', formData)
        setMessage({ type: 'success', text: `New staff account '${formData.username}' created successfully!` })
      }
      setShowModal(false)
      setTimeout(() => setMessage(null), 3500)
      await fetchData()
    } catch (error) {
      setMessage({ type: 'error', text: error.response?.data?.message || 'Failed to save staff account' })
    } finally {
      setSubmitting(false)
    }
  }

  const handleDeleteStaff = async (user) => {
    if (user.username === 'admin') {
      alert('The root Super Administrator account cannot be deleted.')
      return
    }
    if (!confirm(`Are you sure you want to delete staff account '${user.fullName}' (${user.username})?`)) {
      return
    }

    try {
      await api.delete(`/admin/roles/staff-users/${user.id}`)
      setMessage({ type: 'success', text: `Staff account '${user.username}' deleted successfully` })
      setTimeout(() => setMessage(null), 3000)
      await fetchData()
    } catch (error) {
      setMessage({ type: 'error', text: error.response?.data?.message || 'Failed to delete staff account' })
    }
  }

  const getRoleBadgeStyle = (staffRole) => {
    switch (staffRole) {
      case 'SUPER_ADMIN':
        return 'bg-amber-100 text-amber-900 border-amber-300'
      case 'ACCOUNTANT':
        return 'bg-emerald-100 text-emerald-900 border-emerald-300'
      case 'LIBRARIAN':
        return 'bg-purple-100 text-purple-900 border-purple-300'
      case 'ACADEMIC_DEAN':
        return 'bg-indigo-100 text-indigo-900 border-indigo-300'
      case 'REGISTRAR':
        return 'bg-sky-100 text-sky-900 border-sky-300'
      case 'TRANSPORT_MANAGER':
        return 'bg-orange-100 text-orange-900 border-orange-300'
      case 'HEALTH_OFFICER':
        return 'bg-rose-100 text-rose-900 border-rose-300'
      case 'MEDIA_OFFICER':
        return 'bg-teal-100 text-teal-900 border-teal-300'
      default:
        return 'bg-slate-100 text-slate-800 border-slate-300'
    }
  }

  // Filtered staff users
  const filteredUsers = staffUsers.filter(u => {
    if (roleFilter !== 'ALL' && u.staffRole !== roleFilter) return false
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase()
      return (
        u.username?.toLowerCase().includes(q) ||
        u.fullName?.toLowerCase().includes(q) ||
        u.designation?.toLowerCase().includes(q) ||
        u.email?.toLowerCase().includes(q)
      )
    }
    return true
  })

  // Group modules by category for clean matrix
  const categories = ['Directorate', 'People & Classes', 'Academics', 'Governance', 'Bursar & Finance', 'Outreach', 'Security']

  return (
    <div className="animate-fade-in space-y-6">
      {/* ════ Header & Action Buttons ════ */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-[#0F2942] text-amber-400">
              <HiShieldCheck className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-2xl sm:text-3xl font-display font-extrabold text-[#0F2942]">
                Staff Roles & Granular Permissions (RBAC)
              </h1>
              <p className="text-slate-500 text-xs sm:text-sm mt-0.5">
                Fine-grained access control: assign dedicated staff roles or configure custom module-by-module authorizations
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={handleOpenAddModal}
            className="px-4 py-2.5 rounded-xl bg-[#0F2942] hover:bg-slate-900 text-amber-400 font-extrabold text-xs flex items-center gap-2 shadow-md transition-all"
          >
            <HiUserPlus className="w-5 h-5" />
            <span>Create Staff Account</span>
          </button>
        </div>
      </div>

      {/* ════ Global Message Banner ════ */}
      {message && (
        <div className={`p-4 rounded-2xl text-xs font-bold flex items-center gap-2.5 shadow-sm ${
          message.type === 'success'
            ? 'bg-emerald-50 text-emerald-900 border border-emerald-300'
            : 'bg-rose-50 text-rose-900 border border-rose-300'
        }`}>
          {message.type === 'success' ? (
            <HiCheckCircle className="w-5 h-5 text-emerald-600 flex-shrink-0" />
          ) : (
            <HiExclamationTriangle className="w-5 h-5 text-rose-600 flex-shrink-0" />
          )}
          <span>{message.text}</span>
        </div>
      )}

      {/* ════ Role Summary & Quick Stats Cards ════ */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
          <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">Staff Accounts</span>
          <span className="text-2xl font-black text-[#0F2942] mt-1 block">{staffUsers.length}</span>
          <span className="text-[10px] text-emerald-600 font-bold mt-0.5 block">Active Administrators</span>
        </div>
        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
          <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">Protected Modules</span>
          <span className="text-2xl font-black text-amber-600 mt-1 block">{modules.length}</span>
          <span className="text-[10px] text-slate-500 font-medium mt-0.5 block">Granular Permission Keys</span>
        </div>
        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
          <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">Predefined Templates</span>
          <span className="text-2xl font-black text-indigo-600 mt-1 block">{Object.keys(roleTemplates).length}</span>
          <span className="text-[10px] text-slate-500 font-medium mt-0.5 block">Bursar, Librarian, Dean, etc.</span>
        </div>
        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
          <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">Security Protocol</span>
          <span className="text-2xl font-black text-emerald-600 mt-1 block">JWT + RBAC</span>
          <span className="text-[10px] text-slate-500 font-medium mt-0.5 block">Endpoint-Level Enforcement</span>
        </div>
      </div>

      {/* ════ Filters & Search Bar ════ */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-3">
        {/* Role Filter Buttons */}
        <div className="flex flex-wrap items-center gap-1.5">
          <span className="text-[11px] font-extrabold uppercase text-slate-500 mr-1">Filter Role:</span>
          {[
            { id: 'ALL', label: `All (${staffUsers.length})` },
            { id: 'SUPER_ADMIN', label: 'Super Admin' },
            { id: 'ACCOUNTANT', label: 'Bursar / Accounts' },
            { id: 'LIBRARIAN', label: 'Librarian' },
            { id: 'REGISTRAR', label: 'Registrar' },
            { id: 'ACADEMIC_DEAN', label: 'Academic Dean' },
            { id: 'CUSTOM', label: 'Custom' }
          ].map(f => (
            <button
              key={f.id}
              onClick={() => setRoleFilter(f.id)}
              className={`px-3 py-1.5 rounded-xl font-bold text-xs transition-all border ${
                roleFilter === f.id
                  ? 'bg-[#0F2942] text-amber-400 border-[#0F2942] shadow-xs'
                  : 'bg-slate-50 hover:bg-slate-100 text-slate-700 border-slate-200'
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>

        {/* Search */}
        <div className="relative min-w-[240px]">
          <HiMagnifyingGlass className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Search by name, username, or title..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-3 py-1.5 rounded-xl border border-slate-300 text-xs font-medium focus:ring-2 focus:ring-amber-500 outline-none bg-white"
          />
        </div>
      </div>

      {/* ════ Staff Accounts Table ════ */}
      {loading ? (
        <div className="flex flex-col items-center justify-center py-16 space-y-3">
          <div className="w-8 h-8 border-3 border-amber-500 border-t-transparent rounded-full animate-spin"></div>
          <p className="text-xs font-semibold text-slate-500">Loading staff authorization profiles...</p>
        </div>
      ) : (
        <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="px-6 py-4 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
            <div>
              <h3 className="font-extrabold text-[#0F2942] text-sm flex items-center gap-2">
                <HiFingerPrint className="w-5 h-5 text-amber-500" />
                Administrative & Staff Access Directory
              </h3>
              <p className="text-[11px] text-slate-500">
                Staff members only see the sidebar modules and data they are granted permission to access
              </p>
            </div>
            <span className="text-xs font-bold text-slate-600 bg-white px-3 py-1 rounded-xl border border-slate-200">
              Showing {filteredUsers.length} Staff Accounts
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left border-collapse">
              <thead className="bg-[#0F2942] text-white font-extrabold uppercase text-[11px]">
                <tr>
                  <th className="p-4">Staff Member & Login ID</th>
                  <th className="p-4">Designation & Role</th>
                  <th className="p-4">Staff Role Preset</th>
                  <th className="p-4">Granted Modules ({modules.length} Total)</th>
                  <th className="p-4 text-center">Status</th>
                  <th className="p-4 text-center w-36">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 font-medium">
                {filteredUsers.map((user) => {
                  const isRootAdmin = user.username === 'admin'
                  const grantedCount = user.permissions?.length || 0
                  const isAll = grantedCount >= modules.length || user.staffRole === 'SUPER_ADMIN'

                  return (
                    <tr key={user.id} className="hover:bg-slate-50/80 transition-colors">
                      {/* Name & Username */}
                      <td className="p-4">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-2xl bg-amber-100 text-amber-800 flex items-center justify-center font-black text-sm flex-shrink-0">
                            {user.fullName?.charAt(0) || user.username?.charAt(0) || 'U'}
                          </div>
                          <div>
                            <span className="font-extrabold text-slate-900 block text-sm">
                              {user.fullName}
                            </span>
                            <div className="flex items-center gap-2 text-[10px] text-slate-500 font-medium">
                              <span className="font-mono font-bold text-[#0F2942]">@{user.username}</span>
                              {user.email && (
                                <>
                                  <span>•</span>
                                  <span>{user.email}</span>
                                </>
                              )}
                            </div>
                          </div>
                        </div>
                      </td>

                      {/* Designation */}
                      <td className="p-4">
                        <span className="font-bold text-slate-800 block text-xs">
                          {user.designation || 'Staff Officer'}
                        </span>
                        <span className="text-[10px] text-slate-500 block font-mono">
                          {user.phone || 'No phone'}
                        </span>
                      </td>

                      {/* Staff Role */}
                      <td className="p-4">
                        <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-black border ${getRoleBadgeStyle(user.staffRole)}`}>
                          <HiShieldCheck className="w-3.5 h-3.5" />
                          {user.staffRole?.replace('_', ' ') || 'CUSTOM'}
                        </span>
                      </td>

                      {/* Permissions Count & Preview */}
                      <td className="p-4">
                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            <span className={`px-2 py-0.5 rounded-md text-[10px] font-extrabold ${
                              isAll 
                                ? 'bg-emerald-100 text-emerald-800 border border-emerald-300' 
                                : 'bg-indigo-100 text-indigo-800 border border-indigo-300'
                            }`}>
                              {isAll ? 'Full Access (All 23 Modules)' : `${grantedCount} of ${modules.length} Modules Allowed`}
                            </span>
                          </div>
                          {!isAll && (
                            <div className="flex flex-wrap gap-1 max-w-sm">
                              {user.permissions?.slice(0, 4).map(p => (
                                <span key={p} className="px-1.5 py-0.2 rounded bg-slate-100 text-slate-700 text-[9px] font-mono">
                                  {p}
                                </span>
                              ))}
                              {grantedCount > 4 && (
                                <span className="text-[9px] text-slate-400 font-bold">
                                  +{grantedCount - 4} more
                                </span>
                              )}
                            </div>
                          )}
                        </div>
                      </td>

                      {/* Status */}
                      <td className="p-4 text-center">
                        {user.isActive ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 text-[10px] font-bold">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span> Active
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-rose-50 text-rose-700 border border-rose-200 text-[10px] font-bold">
                            <span className="w-1.5 h-1.5 rounded-full bg-rose-500"></span> Disabled
                          </span>
                        )}
                      </td>

                      {/* Actions */}
                      <td className="p-4 text-center">
                        <div className="flex items-center justify-center gap-1.5">
                          <button
                            onClick={() => handleOpenEditModal(user)}
                            className="p-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 transition-colors"
                            title="Edit Staff Role & Permissions"
                          >
                            <HiAdjustmentsHorizontal className="w-4 h-4 text-slate-700" />
                          </button>
                          <button
                            onClick={() => setSimulatedRole(user)}
                            className="p-1.5 rounded-xl bg-amber-50 hover:bg-amber-100 text-amber-800 transition-colors"
                            title="Preview / Simulate Sidebar View"
                          >
                            <HiEye className="w-4 h-4 text-amber-700" />
                          </button>
                          {!isRootAdmin && (
                            <button
                              onClick={() => handleDeleteStaff(user)}
                              className="p-1.5 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-700 transition-colors"
                              title="Delete Staff Account"
                            >
                              <HiTrash className="w-4 h-4" />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ════ Modal: Create / Edit Staff Member & Granular Permissions ════ */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-fade-in">
          <div className="bg-white rounded-3xl shadow-2xl overflow-hidden max-w-2xl w-full border border-slate-200 max-h-[92vh] flex flex-col">
            {/* Header */}
            <div className="p-5 bg-slate-50 border-b border-slate-200 flex items-center justify-between flex-shrink-0">
              <div>
                <h3 className="text-base font-extrabold text-[#0F2942] flex items-center gap-2">
                  <HiShieldCheck className="w-5 h-5 text-amber-500" />
                  {isEditing ? `Edit Staff Member: @${formData.username}` : 'Register New Staff Account'}
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Assign a standardized staff role or configure granular custom permissions per module
                </p>
              </div>
              <button onClick={() => setShowModal(false)} className="text-slate-400 hover:text-slate-700">
                <HiXMark className="w-5 h-5" />
              </button>
            </div>

            {/* Scrollable Form Body */}
            <form onSubmit={handleSubmit} className="p-6 space-y-5 overflow-y-auto flex-1 text-xs">
              {/* Profile Details */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                <div>
                  <label className="block font-bold text-slate-700 uppercase text-[11px] mb-1">Full Name *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Marcus Vance"
                    value={formData.fullName}
                    onChange={e => setFormData({ ...formData, fullName: e.target.value })}
                    className="w-full px-3.5 py-2 rounded-xl border border-slate-300 font-bold focus:ring-2 focus:ring-amber-500 outline-none"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 uppercase text-[11px] mb-1">Designation / Title</label>
                  <input
                    type="text"
                    placeholder="e.g. Bursar & Accounts Officer"
                    value={formData.designation}
                    onChange={e => setFormData({ ...formData, designation: e.target.value })}
                    className="w-full px-3.5 py-2 rounded-xl border border-slate-300 font-bold focus:ring-2 focus:ring-amber-500 outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                <div>
                  <label className="block font-bold text-slate-700 uppercase text-[11px] mb-1">Username (Login ID) *</label>
                  <input
                    type="text"
                    required
                    disabled={isEditing}
                    placeholder="e.g. bursar"
                    value={formData.username}
                    onChange={e => setFormData({ ...formData, username: e.target.value })}
                    className="w-full px-3.5 py-2 rounded-xl border border-slate-300 font-mono font-bold focus:ring-2 focus:ring-amber-500 outline-none bg-slate-50 disabled:opacity-60"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 uppercase text-[11px] mb-1">
                    {isEditing ? 'New Password (leave blank to keep current)' : 'Login Password *'}
                  </label>
                  <input
                    type="password"
                    required={!isEditing}
                    placeholder="••••••••"
                    value={formData.password}
                    onChange={e => setFormData({ ...formData, password: e.target.value })}
                    className="w-full px-3.5 py-2 rounded-xl border border-slate-300 font-bold focus:ring-2 focus:ring-amber-500 outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                <div>
                  <label className="block font-bold text-slate-700 uppercase text-[11px] mb-1">Email Address</label>
                  <input
                    type="email"
                    placeholder="staff@school.edu"
                    value={formData.email}
                    onChange={e => setFormData({ ...formData, email: e.target.value })}
                    className="w-full px-3.5 py-2 rounded-xl border border-slate-300 font-medium focus:ring-2 focus:ring-amber-500 outline-none"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 uppercase text-[11px] mb-1">Phone Number</label>
                  <input
                    type="text"
                    placeholder="+1 555-0145"
                    value={formData.phone}
                    onChange={e => setFormData({ ...formData, phone: e.target.value })}
                    className="w-full px-3.5 py-2 rounded-xl border border-slate-300 font-medium focus:ring-2 focus:ring-amber-500 outline-none"
                  />
                </div>
              </div>

              {/* Staff Role Presets Bar */}
              <div className="space-y-2 pt-2 border-t border-slate-100">
                <div className="flex items-center justify-between">
                  <label className="block font-extrabold text-[#0F2942] uppercase text-[11px] tracking-wider">
                    Standard Role Template Preset:
                  </label>
                  <span className="text-[10px] text-slate-500">
                    Applying a preset auto-checks relevant module authorizations
                  </span>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  {[
                    { id: 'SUPER_ADMIN', label: 'Super Admin', desc: 'All Modules' },
                    { id: 'ACCOUNTANT', label: 'Bursar / Accounts', desc: 'Fees, Payroll' },
                    { id: 'LIBRARIAN', label: 'Chief Librarian', desc: 'E-Library, Books' },
                    { id: 'ACADEMIC_DEAN', label: 'Academic Dean', desc: 'Teachers, Classes' },
                    { id: 'REGISTRAR', label: 'Registrar', desc: 'Students, Exams' },
                    { id: 'TRANSPORT_MANAGER', label: 'Fleet Manager', desc: 'Transport, Assets' },
                    { id: 'HEALTH_OFFICER', label: 'Health Officer', desc: 'Infirmary, Wellness' },
                    { id: 'CUSTOM', label: 'Custom Matrix', desc: 'Hand-picked keys' }
                  ].map(r => (
                    <button
                      key={r.id}
                      type="button"
                      onClick={() => handleRoleTemplateChange(r.id)}
                      className={`p-2.5 rounded-xl border text-left transition-all ${
                        formData.staffRole === r.id
                          ? 'bg-[#0F2942] text-amber-400 border-[#0F2942] shadow-xs'
                          : 'bg-slate-50 hover:bg-slate-100 text-slate-700 border-slate-200'
                      }`}
                    >
                      <span className="font-extrabold text-xs block leading-tight">{r.label}</span>
                      <span className={`text-[10px] block mt-0.5 ${formData.staffRole === r.id ? 'text-slate-300' : 'text-slate-400'}`}>
                        {r.desc}
                      </span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Granular Module Permission Checkbox Matrix */}
              <div className="space-y-3 pt-2 border-t border-slate-100">
                <div className="flex items-center justify-between">
                  <div>
                    <label className="block font-extrabold text-[#0F2942] uppercase text-[11px] tracking-wider">
                      Granular Module Authorizations ({formData.permissions.length} of {modules.length} Checked)
                    </label>
                    <span className="text-[10px] text-slate-500">
                      Check specific modules this staff account is allowed to access
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={handleSelectAllPermissions}
                      className="text-[11px] text-amber-700 hover:text-amber-900 font-bold underline"
                    >
                      Select All
                    </button>
                    <span className="text-slate-300">•</span>
                    <button
                      type="button"
                      onClick={handleClearAllPermissions}
                      className="text-[11px] text-rose-700 hover:text-rose-900 font-bold underline"
                    >
                      Reset Minimum
                    </button>
                  </div>
                </div>

                <div className="space-y-4 max-h-60 overflow-y-auto pr-1">
                  {categories.map(cat => {
                    const catModules = modules.filter(m => m.category === cat)
                    if (catModules.length === 0) return null

                    return (
                      <div key={cat} className="space-y-1.5 bg-slate-50/60 p-2.5 rounded-2xl border border-slate-200">
                        <span className="text-[10px] font-black uppercase text-slate-500 tracking-wider block px-1">
                          {cat}
                        </span>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                          {catModules.map(m => {
                            const isChecked = formData.permissions.includes(m.code)
                            return (
                              <label
                                key={m.code}
                                className={`flex items-start gap-2.5 p-2 rounded-xl border cursor-pointer transition-all ${
                                  isChecked
                                    ? 'bg-amber-50/80 border-amber-300 shadow-xs'
                                    : 'bg-white border-slate-200 hover:bg-slate-100/70'
                                }`}
                              >
                                <input
                                  type="checkbox"
                                  checked={isChecked}
                                  onChange={() => togglePermission(m.code)}
                                  className="w-4 h-4 mt-0.5 text-amber-600 rounded border-slate-300 focus:ring-amber-500"
                                />
                                <div className="min-w-0 flex-1">
                                  <span className="font-extrabold text-xs text-slate-900 block truncate">
                                    {m.name}
                                  </span>
                                  <span className="text-[10px] text-slate-500 block leading-tight">
                                    {m.description}
                                  </span>
                                </div>
                              </label>
                            )
                          })}
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>

              {/* Footer Buttons */}
              <div className="flex gap-3 pt-3 border-t border-slate-100 flex-shrink-0">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="flex-1 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="flex-1 py-2.5 rounded-xl bg-[#0F2942] hover:bg-slate-900 text-amber-400 font-extrabold shadow-md flex items-center justify-center gap-1.5"
                >
                  <HiCheck className="w-4 h-4" />
                  <span>{isEditing ? 'Save Staff Permissions' : 'Create Staff Member'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ════ Modal: Live Role Simulator & Sidebar Preview Tool ════ */}
      {simulatedRole && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-fade-in">
          <div className="bg-white rounded-3xl shadow-2xl overflow-hidden max-w-lg w-full border border-slate-200 p-6 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div>
                <h3 className="text-base font-extrabold text-[#0F2942] flex items-center gap-2">
                  <HiEye className="w-5 h-5 text-amber-500" />
                  Staff Role Simulator: @{simulatedRole.username}
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Visual preview of what <strong>{simulatedRole.fullName}</strong> sees when logged into the portal
                </p>
              </div>
              <button onClick={() => setSimulatedRole(null)} className="text-slate-400 hover:text-slate-700">
                <HiXMark className="w-5 h-5" />
              </button>
            </div>

            <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200 flex items-center justify-between text-xs">
              <div>
                <span className="font-bold text-slate-700 block">Designated Role:</span>
                <span className={`inline-flex items-center gap-1 mt-0.5 px-2.5 py-0.5 rounded-full font-black text-[10px] border ${getRoleBadgeStyle(simulatedRole.staffRole)}`}>
                  {simulatedRole.staffRole}
                </span>
              </div>
              <div className="text-right">
                <span className="font-bold text-slate-700 block">Granted Access:</span>
                <span className="font-extrabold text-emerald-800 text-xs">
                  {simulatedRole.permissions?.length} of {modules.length} Modules
                </span>
              </div>
            </div>

            <div className="space-y-2">
              <span className="text-[11px] font-extrabold uppercase text-slate-500 tracking-wider block">
                Accessible Sidebar Modules:
              </span>
              <div className="max-h-60 overflow-y-auto grid grid-cols-1 sm:grid-cols-2 gap-2 p-1">
                {modules.map(m => {
                  const isAllowed = simulatedRole.permissions?.includes(m.code) || simulatedRole.staffRole === 'SUPER_ADMIN'
                  return (
                    <div
                      key={m.code}
                      className={`p-2 rounded-xl border flex items-center justify-between gap-2 text-xs ${
                        isAllowed
                          ? 'bg-emerald-50/80 border-emerald-300 text-emerald-950 font-bold'
                          : 'bg-slate-100/70 border-slate-200 text-slate-400 opacity-60'
                      }`}
                    >
                      <span className="truncate">{m.name}</span>
                      {isAllowed ? (
                        <HiCheckCircle className="w-4 h-4 text-emerald-600 flex-shrink-0" />
                      ) : (
                        <HiLockClosed className="w-3.5 h-3.5 text-slate-400 flex-shrink-0" />
                      )}
                    </div>
                  )
                })}
              </div>
            </div>

            <div className="pt-2">
              <button
                type="button"
                onClick={() => setSimulatedRole(null)}
                className="w-full py-2.5 rounded-xl bg-[#0F2942] text-amber-400 font-extrabold text-xs shadow-md"
              >
                Close Role Simulator
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

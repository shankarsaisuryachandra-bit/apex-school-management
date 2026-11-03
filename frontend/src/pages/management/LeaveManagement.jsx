import { useState, useEffect } from 'react'
import api from '../../api/axiosConfig'
import { HiClipboardDocumentCheck, HiPlus, HiXMark, HiCheck, HiXMark as HiCross } from 'react-icons/hi2'
import { useAuth } from '../../auth/AuthContext'

export default function LeaveManagement() {
  const { user } = useAuth()
  const isStudent = user?.role === 'STUDENT'
  const isStaff = user?.role === 'MANAGEMENT' || user?.role === 'TEACHER'

  const [leaves, setLeaves] = useState([])
  const [loading, setLoading] = useState(true)
  const [showApplyModal, setShowApplyModal] = useState(false)
  const [message, setMessage] = useState('')
  const [submitting, setSubmitting] = useState(false)

  const [formData, setFormData] = useState({
    startDate: '',
    endDate: '',
    reason: ''
  })

  useEffect(() => {
    fetchLeaves()
  }, [])

  const fetchLeaves = async () => {
    try {
      const targetId = isStudent ? (user?.profileId || user?.userId) : null
      const url = targetId ? `/leaves?studentId=${targetId}` : '/leaves'
      const { data } = await api.get(url)
      setLeaves(data)
    } catch (error) {
      console.error('Failed to fetch leave requests:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleApplyLeave = async (e) => {
    e.preventDefault()
    if (!formData.startDate || !formData.endDate || !formData.reason) return
    if (formData.endDate < formData.startDate) {
      setMessage('Invalid date range: End date cannot be earlier than start date. System rejected application.')
      return
    }
    setSubmitting(true)
    setMessage('')
    try {
      const studentId = user?.profileId || user?.userId
      await api.post('/leaves', {
        ...formData,
        studentId
      })
      setMessage('Leave application submitted successfully!')
      setTimeout(() => {
        setMessage('')
        setShowApplyModal(false)
        setFormData({ startDate: '', endDate: '', reason: '' })
        fetchLeaves()
      }, 1500)
    } catch (error) {
      setMessage(error.response?.data?.message || 'Failed to submit leave application')
    } finally {
      setSubmitting(false)
    }
  }

  const [actionModal, setActionModal] = useState({ open: false, leave: null, status: 'APPROVED', remarks: '' })

  const handleStatusUpdate = async (e) => {
    e.preventDefault()
    if (!actionModal.leave) return
    try {
      await api.put(`/leaves/${actionModal.leave.id}/status`, {
        status: actionModal.status,
        adminRemarks: actionModal.remarks
      })
      setActionModal({ open: false, leave: null, status: 'APPROVED', remarks: '' })
      fetchLeaves()
    } catch (error) {
      console.error('Failed to update leave status:', error)
    }
  }

  const getStatusBadge = (status) => {
    switch (status) {
      case 'APPROVED': return 'badge-paid'
      case 'REJECTED': return 'badge-unpaid'
      default: return 'badge-partial'
    }
  }

  return (
    <div className="animate-fade-in space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-display font-bold text-surface-900">Leave Applications</h1>
          <p className="text-surface-700/60 mt-1">Student leave requests, approvals, and absence records</p>
        </div>
        {isStudent && (
          <button
            onClick={() => setShowApplyModal(true)}
            className="btn-primary text-sm flex items-center gap-2"
          >
            <HiPlus className="w-4 h-4" />
            Apply for Leave
          </button>
        )}
      </div>

      <div className="card p-6">
        {loading ? (
          <div className="animate-pulse text-surface-700/50 py-4">Loading leave applications...</div>
        ) : leaves.length === 0 ? (
          <div className="text-center py-8 text-surface-700/50">
            <HiClipboardDocumentCheck className="w-12 h-12 mx-auto mb-2 text-surface-300" />
            <p>No leave applications recorded.</p>
          </div>
        ) : (
          <div className="table-container">
            <table>
              <thead>
                <tr>
                  <th>#</th>
                  <th>Student Name</th>
                  <th>Applied On</th>
                  <th>Duration</th>
                  <th>Reason</th>
                  <th>Status & Remarks</th>
                  {isStaff && <th>Actions</th>}
                </tr>
              </thead>
              <tbody>
                {leaves.map((l, idx) => (
                  <tr key={l.id}>
                    <td className="text-surface-400 text-xs font-semibold">{idx + 1}</td>
                    <td className="font-semibold text-surface-900">
                      {l.student?.fullName || user?.fullName}
                      <span className="block text-xs text-surface-400 font-mono font-normal">
                        {l.student?.admissionNumber}
                      </span>
                    </td>
                    <td className="text-sm text-surface-700/60">{l.appliedDate}</td>
                    <td className="text-sm font-medium">
                      {l.startDate} ➔ {l.endDate}
                    </td>
                    <td className="text-sm text-surface-700/80 max-w-xs truncate">{l.reason}</td>
                    <td>
                      <span className={getStatusBadge(l.status)}>{l.status}</span>
                      {l.adminRemarks && (
                        <div className="text-xs text-surface-600 mt-1 italic max-w-xs">
                          💬 "{l.adminRemarks}"
                        </div>
                      )}
                    </td>
                    {isStaff && (
                      <td>
                        {l.status === 'PENDING' ? (
                          <div className="flex items-center gap-2">
                            <button
                              onClick={() => setActionModal({ open: true, leave: l, status: 'APPROVED', remarks: 'Approved by class authority.' })}
                              className="px-2.5 py-1 rounded-lg bg-green-100 text-green-700 hover:bg-green-200 transition-colors text-xs font-medium flex items-center gap-1"
                            >
                              <HiCheck className="w-3.5 h-3.5" />
                              Approve
                            </button>
                            <button
                              onClick={() => setActionModal({ open: true, leave: l, status: 'REJECTED', remarks: 'Denied due to mandatory assessment schedule.' })}
                              className="px-2.5 py-1 rounded-lg bg-red-100 text-red-700 hover:bg-red-200 transition-colors text-xs font-medium flex items-center gap-1"
                            >
                              <HiCross className="w-3.5 h-3.5" />
                              Reject
                            </button>
                          </div>
                        ) : (
                          <button
                            onClick={() => setActionModal({ open: true, leave: l, status: l.status, remarks: l.adminRemarks || '' })}
                            className="text-xs text-primary-600 hover:underline font-medium"
                          >
                            Update
                          </button>
                        )}
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Staff Action Modal */}
      {actionModal.open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 animate-fade-in">
          <div className="card-glass w-full max-w-md bg-white p-6 rounded-2xl shadow-2xl relative border border-surface-200">
            <button onClick={() => setActionModal({ open: false, leave: null, status: 'APPROVED', remarks: '' })} className="absolute top-4 right-4 text-surface-400 hover:text-surface-900">
              <HiXMark className="w-6 h-6" />
            </button>
            <h3 className="text-xl font-display font-bold text-surface-900 mb-1">
              {actionModal.status === 'APPROVED' ? 'Approve Leave Request' : 'Reject Leave Request'}
            </h3>
            <p className="text-sm text-surface-700/60 mb-4">
              Student: {actionModal.leave?.student?.fullName || 'Student'} • {actionModal.leave?.startDate} to {actionModal.leave?.endDate}
            </p>

            <form onSubmit={handleStatusUpdate} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-surface-700 uppercase mb-1">Status Decision</label>
                <select
                  value={actionModal.status}
                  onChange={(e) => setActionModal({ ...actionModal, status: e.target.value })}
                  className="input-field py-2 font-medium"
                >
                  <option value="APPROVED">APPROVED</option>
                  <option value="REJECTED">REJECTED</option>
                  <option value="PENDING">PENDING</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-surface-700 uppercase mb-1">Approval / Rejection Remarks</label>
                <textarea
                  rows="3"
                  placeholder="e.g. Approved. Medical certificate required upon return."
                  value={actionModal.remarks}
                  onChange={(e) => setActionModal({ ...actionModal, remarks: e.target.value })}
                  className="input-field py-2"
                />
              </div>

              <div className="flex gap-3 pt-2">
                <button type="button" onClick={() => setActionModal({ open: false, leave: null, status: 'APPROVED', remarks: '' })} className="btn-secondary flex-1">
                  Cancel
                </button>
                <button
                  type="submit"
                  className={`flex-1 font-bold py-2.5 px-4 rounded-xl text-white shadow-md transition-all ${
                    actionModal.status === 'APPROVED'
                      ? 'bg-green-600 hover:bg-green-700'
                      : 'bg-red-600 hover:bg-red-700'
                  }`}
                >
                  Save Decision
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Apply Leave Modal */}
      {showApplyModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 animate-fade-in">
          <div className="card-glass w-full max-w-md bg-white p-6 rounded-2xl shadow-2xl relative border border-surface-200">
            <button onClick={() => setShowApplyModal(false)} className="absolute top-4 right-4 text-surface-400 hover:text-surface-900">
              <HiXMark className="w-6 h-6" />
            </button>
            <h3 className="text-xl font-display font-bold text-surface-900 mb-1">Apply for Leave</h3>
            <p className="text-sm text-surface-700/60 mb-4">Submit leave request for approval</p>

            {message && (
              <div className="mb-4 p-3 rounded-xl bg-accent-100 text-accent-800 text-sm font-medium">
                {message}
              </div>
            )}

            <form onSubmit={handleApplyLeave} className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-surface-700 uppercase mb-1">Start Date</label>
                  <input
                    type="date"
                    required
                    value={formData.startDate}
                    onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                    className="input-field py-2"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-surface-700 uppercase mb-1">End Date</label>
                  <input
                    type="date"
                    required
                    value={formData.endDate}
                    onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
                    className="input-field py-2"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-surface-700 uppercase mb-1">Reason for Leave</label>
                <textarea
                  rows="3"
                  required
                  placeholder="State reason for absence..."
                  value={formData.reason}
                  onChange={(e) => setFormData({ ...formData, reason: e.target.value })}
                  className="input-field py-2"
                />
              </div>

              <div className="flex gap-3 pt-2">
                <button type="button" onClick={() => setShowApplyModal(false)} className="btn-secondary flex-1">
                  Cancel
                </button>
                <button type="submit" disabled={submitting} className="btn-primary flex-1">
                  {submitting ? 'Submitting...' : 'Submit Leave'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}

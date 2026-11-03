import { useState, useEffect } from 'react'
import api from '../../api/axiosConfig'
import { HiUserGroup, HiPlus, HiXMark, HiCalendar, HiClock } from 'react-icons/hi2'
import { useAuth } from '../../auth/AuthContext'

export default function PtmManagement() {
  const { user } = useAuth()
  const isStudent = user?.role === 'STUDENT'
  const isTeacher = user?.role === 'TEACHER'

  const [ptms, setPtms] = useState([])
  const [teachers, setTeachers] = useState([])
  const [loading, setLoading] = useState(true)
  const [showScheduleModal, setShowScheduleModal] = useState(false)
  const [message, setMessage] = useState('')
  const [submitting, setSubmitting] = useState(false)

  const [formData, setFormData] = useState({
    teacherId: '',
    appointmentDate: '',
    timeSlot: '10:00 AM - 10:30 AM',
    notes: ''
  })

  useEffect(() => {
    fetchPtms()
  }, [])

  const fetchPtms = async () => {
    try {
      let url = '/ptm'
      if (isStudent) {
        const studentId = user?.profileId || user?.userId
        url = `/ptm?studentId=${studentId}`
      } else if (isTeacher) {
        const teacherId = user?.profileId || user?.userId
        url = `/ptm?teacherId=${teacherId}`
      }
      const [pRes, tRes] = await Promise.all([
        api.get(url),
        api.get('/ptm/teachers')
      ])
      setPtms(pRes.data)
      setTeachers(tRes.data)
    } catch (error) {
      console.error('Failed to fetch PTM appointments:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleSchedulePtm = async (e) => {
    e.preventDefault()
    if (!formData.teacherId || !formData.appointmentDate) return
    const today = new Date().toISOString().split('T')[0]
    if (formData.appointmentDate < today) {
      setMessage('Cannot schedule a PTM appointment for a past date. System rejected input.')
      return
    }
    setSubmitting(true)
    setMessage('')
    try {
      const studentId = user?.profileId || user?.userId
      await api.post('/ptm', {
        ...formData,
        studentId: parseInt(studentId),
        teacherId: parseInt(formData.teacherId)
      })
      setMessage('PTM Appointment scheduled successfully!')
      setTimeout(() => {
        setMessage('')
        setShowScheduleModal(false)
        setFormData({ teacherId: '', appointmentDate: '', timeSlot: '10:00 AM - 10:30 AM', notes: '' })
        fetchPtms()
      }, 1500)
    } catch (error) {
      setMessage(error.response?.data?.message || 'Failed to schedule PTM')
    } finally {
      setSubmitting(false)
    }
  }

  const [actionModal, setActionModal] = useState({ open: false, ptm: null, status: 'ACCEPTED', remarks: '' })

  const handleStatusUpdate = async (e) => {
    e.preventDefault()
    if (!actionModal.ptm) return
    try {
      await api.put(`/ptm/${actionModal.ptm.id}/status`, {
        status: actionModal.status,
        adminRemarks: actionModal.remarks
      })
      setActionModal({ open: false, ptm: null, status: 'ACCEPTED', remarks: '' })
      fetchPtms()
    } catch (error) {
      console.error('Failed to update PTM status:', error)
    }
  }

  const getPtmStatusBadge = (status) => {
    switch (status) {
      case 'ACCEPTED':
      case 'COMPLETED':
        return 'bg-green-100 text-green-800 border-green-200'
      case 'REJECTED':
      case 'CANCELLED':
        return 'bg-red-100 text-red-800 border-red-200'
      case 'PENDING':
      case 'SCHEDULED':
      default:
        return 'bg-amber-100 text-amber-800 border-amber-200'
    }
  }

  return (
    <div className="animate-fade-in space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-display font-bold text-surface-900">Parent-Teacher Meetings (PTM)</h1>
          <p className="text-surface-700/60 mt-1">Schedule, manage, and view PTM meeting requests and approval remarks</p>
        </div>
        {isStudent && (
          <button
            onClick={() => setShowScheduleModal(true)}
            className="btn-primary text-sm flex items-center gap-2"
          >
            <HiPlus className="w-4 h-4" />
            Book PTM Slot
          </button>
        )}
      </div>

      <div className="card p-6">
        {loading ? (
          <div className="animate-pulse text-surface-700/50 py-4">Loading PTM appointments...</div>
        ) : ptms.length === 0 ? (
          <div className="text-center py-8 text-surface-700/50">
            <HiUserGroup className="w-12 h-12 mx-auto mb-2 text-surface-300" />
            <p>No PTM appointments scheduled.</p>
          </div>
        ) : (
          <div className="table-container">
            <table>
              <thead>
                <tr>
                  <th>#</th>
                  <th>Student Name</th>
                  <th>Class & Section</th>
                  <th>Roll No</th>
                  <th>Assigned Teacher</th>
                  <th>Meeting Date</th>
                  <th>Time Slot</th>
                  <th>Agenda</th>
                  <th>Status & Remarks</th>
                  {(!isStudent) && <th>Actions</th>}
                </tr>
              </thead>
              <tbody>
                {ptms.map((p, idx) => {
                  const sName = p.student?.fullName || p.student?.user?.fullName || 'Student'
                  const sClass = p.student?.schoolClass
                    ? `${p.student.schoolClass.name} - ${p.student.schoolClass.section}`
                    : 'N/A'
                  const sRoll = p.student?.rollNumber || '—'
                  const tName = p.teacher?.fullName || p.teacher?.user?.fullName || 'Faculty'

                  return (
                    <tr key={p.id}>
                      <td className="text-surface-400 text-xs font-semibold">{idx + 1}</td>
                      <td className="font-semibold text-surface-900">{sName}</td>
                      <td className="text-sm font-medium text-surface-700">
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-md bg-surface-100 text-surface-800 text-xs font-bold">
                          {sClass}
                        </span>
                      </td>
                      <td className="text-sm font-mono text-surface-600">{sRoll}</td>
                      <td className="font-medium text-primary-700">{tName}</td>
                      <td className="text-sm font-medium">
                        <span className="flex items-center gap-1">
                          <HiCalendar className="w-3.5 h-3.5 text-surface-400" />
                          {p.appointmentDate}
                        </span>
                      </td>
                      <td className="text-sm">
                        <span className="flex items-center gap-1 text-surface-700 font-mono">
                          <HiClock className="w-3.5 h-3.5 text-accent-600" />
                          {p.timeSlot}
                        </span>
                      </td>
                      <td className="text-sm text-surface-700/80 max-w-xs truncate">{p.notes || '—'}</td>
                      <td>
                        <span className={`inline-block px-2.5 py-1 text-xs font-bold rounded-full border ${getPtmStatusBadge(p.status)}`}>
                          {p.status}
                        </span>
                        {p.adminRemarks && (
                          <div className="text-xs text-surface-600 mt-1 italic max-w-xs">
                            💬 "{p.adminRemarks}"
                          </div>
                        )}
                      </td>
                      {(!isStudent) && (
                        <td>
                          {p.status === 'PENDING' || p.status === 'SCHEDULED' ? (
                            <div className="flex items-center gap-1.5">
                              <button
                                onClick={() => setActionModal({ open: true, ptm: p, status: 'ACCEPTED', remarks: 'Confirmed. Room 102.' })}
                                className="px-2.5 py-1 rounded-lg bg-green-100 text-green-700 hover:bg-green-200 transition-colors text-xs font-bold"
                              >
                                Accept
                              </button>
                              <button
                                onClick={() => setActionModal({ open: true, ptm: p, status: 'REJECTED', remarks: 'Slot occupied. Please request another time.' })}
                                className="px-2.5 py-1 rounded-lg bg-red-100 text-red-700 hover:bg-red-200 transition-colors text-xs font-bold"
                              >
                                Reject
                              </button>
                            </div>
                          ) : (
                            <button
                              onClick={() => setActionModal({ open: true, ptm: p, status: p.status, remarks: p.adminRemarks || '' })}
                              className="text-xs text-primary-600 hover:underline font-medium"
                            >
                              Update
                            </button>
                          )}
                        </td>
                      )}
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Decision / Remarks Modal for Staff */}
      {actionModal.open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 animate-fade-in">
          <div className="card-glass w-full max-w-md bg-white p-6 rounded-2xl shadow-2xl relative border border-surface-200">
            <button onClick={() => setActionModal({ open: false, ptm: null, status: 'ACCEPTED', remarks: '' })} className="absolute top-4 right-4 text-surface-400 hover:text-surface-900">
              <HiXMark className="w-6 h-6" />
            </button>
            <h3 className="text-xl font-display font-bold text-surface-900 mb-1">
              {actionModal.status === 'ACCEPTED' ? 'Accept PTM Meeting' : 'Reject PTM Meeting'}
            </h3>
            <p className="text-sm text-surface-700/60 mb-4">
              Student: {actionModal.ptm?.student?.fullName || 'Student'} • Date: {actionModal.ptm?.appointmentDate} ({actionModal.ptm?.timeSlot})
            </p>

            <form onSubmit={handleStatusUpdate} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-surface-700 uppercase mb-1">Status Decision</label>
                <select
                  value={actionModal.status}
                  onChange={(e) => setActionModal({ ...actionModal, status: e.target.value })}
                  className="input-field py-2 font-medium"
                >
                  <option value="ACCEPTED">ACCEPTED (Confirm Slot)</option>
                  <option value="REJECTED">REJECTED (Decline Slot)</option>
                  <option value="COMPLETED">COMPLETED (Meeting Finished)</option>
                  <option value="CANCELLED">CANCELLED</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-surface-700 uppercase mb-1">Remarks / Meeting Instructions for Parent & Student</label>
                <textarea
                  rows="3"
                  placeholder="e.g. Please meet in Staff Room 102 at 10:00 AM sharp."
                  value={actionModal.remarks}
                  onChange={(e) => setActionModal({ ...actionModal, remarks: e.target.value })}
                  className="input-field py-2"
                />
              </div>

              <div className="flex gap-3 pt-2">
                <button type="button" onClick={() => setActionModal({ open: false, ptm: null, status: 'ACCEPTED', remarks: '' })} className="btn-secondary flex-1">
                  Cancel
                </button>
                <button
                  type="submit"
                  className={`flex-1 font-bold py-2.5 px-4 rounded-xl text-white shadow-md transition-all ${
                    actionModal.status === 'ACCEPTED'
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

      {/* Book PTM Modal */}
      {showScheduleModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 animate-fade-in">
          <div className="card-glass w-full max-w-md bg-white p-6 rounded-2xl shadow-2xl relative border border-surface-200">
            <button onClick={() => setShowScheduleModal(false)} className="absolute top-4 right-4 text-surface-400 hover:text-surface-900">
              <HiXMark className="w-6 h-6" />
            </button>
            <h3 className="text-xl font-display font-bold text-surface-900 mb-1">Book PTM Slot</h3>
            <p className="text-sm text-surface-700/60 mb-4">Select teacher and appointment time</p>

            {message && (
              <div className="mb-4 p-3 rounded-xl bg-accent-100 text-accent-800 text-sm font-medium">
                {message}
              </div>
            )}

            <form onSubmit={handleSchedulePtm} className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-surface-700 uppercase mb-1">Select Teacher</label>
                <select
                  required
                  value={formData.teacherId}
                  onChange={(e) => setFormData({ ...formData, teacherId: e.target.value })}
                  className="input-field py-2 font-medium"
                >
                  <option value="">-- Select Faculty / Class Teacher / Principal --</option>
                  {teachers.map((t) => (
                    <option key={t.id} value={t.id}>
                      {t.displayLabel || `${t.fullName} (${t.subject || t.qualification || 'Faculty'})`}
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-surface-700 uppercase mb-1">Meeting Date</label>
                  <input
                    type="date"
                    required
                    value={formData.appointmentDate}
                    onChange={(e) => setFormData({ ...formData, appointmentDate: e.target.value })}
                    className="input-field py-2"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-surface-700 uppercase mb-1">Time Slot</label>
                  <select
                    value={formData.timeSlot}
                    onChange={(e) => setFormData({ ...formData, timeSlot: e.target.value })}
                    className="input-field py-2"
                  >
                    <option value="10:00 AM - 10:30 AM">10:00 AM - 10:30 AM</option>
                    <option value="11:00 AM - 11:30 AM">11:00 AM - 11:30 AM</option>
                    <option value="02:00 PM - 02:30 PM">02:00 PM - 02:30 PM</option>
                    <option value="03:00 PM - 03:30 PM">03:00 PM - 03:30 PM</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-surface-700 uppercase mb-1">Agenda / Discussion Points</label>
                <textarea
                  rows="3"
                  placeholder="Notes for teacher..."
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  className="input-field py-2"
                />
              </div>

              <div className="flex gap-3 pt-2">
                <button type="button" onClick={() => setShowScheduleModal(false)} className="btn-secondary flex-1">
                  Cancel
                </button>
                <button type="submit" disabled={submitting} className="btn-primary flex-1">
                  {submitting ? 'Booking...' : 'Confirm PTM Slot'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}

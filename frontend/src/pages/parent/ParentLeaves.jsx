import { useState, useEffect } from 'react'
import api from '../../api/axiosConfig'
import {
  HiClipboardDocumentCheck, HiCalendarDays, HiCheckCircle,
  HiClock, HiXMark, HiPlus, HiDocumentText, HiShieldExclamation
} from 'react-icons/hi2'

export default function ParentLeaves() {
  const [children, setChildren] = useState([])
  const [selectedChildId, setSelectedChildId] = useState(null)
  const [summary, setSummary] = useState(null)
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [startDate, setStartDate] = useState('')
  const [endDate, setEndDate] = useState('')
  const [reason, setReason] = useState('')

  useEffect(() => {
    loadChildren()
  }, [])

  const loadChildren = async () => {
    try {
      const res = await api.get('/parent/children')
      const kids = res.data || []
      setChildren(kids)
      if (kids.length > 0) {
        setSelectedChildId(kids[0].id)
        loadChildData(kids[0].id)
      } else {
        setLoading(false)
      }
    } catch (err) {
      console.error('Failed to load children:', err)
      setLoading(false)
    }
  }

  const loadChildData = async (childId) => {
    setLoading(true)
    try {
      const res = await api.get(`/parent/child/${childId}/summary`)
      setSummary(res.data)
    } catch (err) {
      console.error('Failed to load leave records:', err)
    } finally {
      setLoading(false)
    }
  }

  const handleSelectChild = (id) => {
    setSelectedChildId(id)
    loadChildData(id)
  }

  const handleSubmitLeave = async (e) => {
    e.preventDefault()
    if (endDate < startDate) {
      alert('Invalid date range: End date cannot be earlier than start date. System rejected application.')
      return
    }
    setSubmitting(true)
    try {
      await api.post(`/parent/child/${selectedChildId}/leave`, {
        startDate: startDate,
        endDate: endDate,
        reason: reason
      })
      setShowModal(false)
      setReason('')
      setStartDate('')
      setEndDate('')
      await loadChildData(selectedChildId)
    } catch (err) {
      console.error('Failed to submit leave:', err)
      alert('Unable to submit leave request. Please check date range.')
    } finally {
      setSubmitting(false)
    }
  }

  const activeChild = children.find(c => c.id === selectedChildId) || children[0]
  const leaves = summary?.leaveRequests || []

  return (
    <div className="space-y-6 font-sans">
      
      {/* Top Header & Switcher */}
      <div className="bg-white rounded-2xl border border-[#E8E6DF] p-6 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <span className="text-[11px] font-bold uppercase tracking-wider text-[#8C6837] bg-amber-50 border border-amber-200 px-2.5 py-0.5 rounded-full">
            Institutional Absence Management
          </span>
          <h1 className="text-2xl font-serif font-bold text-[#0B1B2B] mt-1.5">
            Absence &amp; Medical Leave Notes
          </h1>
          <p className="text-xs text-gray-500 mt-0.5">
            Submit formal parent leave notes, medical excuse slips, and track teacher approvals.
          </p>
        </div>

        <div className="flex items-center gap-3">
          {children.length > 0 && (
            <div className="flex items-center gap-2 overflow-x-auto">
              <span className="text-xs font-semibold text-gray-500 whitespace-nowrap">Ward:</span>
              {children.map(child => {
                const isSelected = child.id === selectedChildId
                return (
                  <button
                    key={child.id}
                    type="button"
                    onClick={() => handleSelectChild(child.id)}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold border transition-all ${
                      isSelected
                        ? 'bg-[#0B1B2B] text-white border-[#0B1B2B]'
                        : 'bg-[#F6F5EF] text-gray-700 border-[#E8E6DF] hover:bg-white'
                    }`}
                  >
                    {child.fullName}
                  </button>
                )
              })}
            </div>
          )}

          <button
            type="button"
            onClick={() => setShowModal(true)}
            className="btn-gold flex items-center gap-1.5 px-4 py-2 text-xs font-bold rounded-xl shadow-xs shrink-0"
          >
            <HiPlus className="w-4 h-4" />
            <span>Submit Leave Note</span>
          </button>
        </div>
      </div>

      {/* Leave Requests History */}
      <div className="bg-white rounded-2xl border border-[#E8E6DF] p-6 shadow-xs">
        <h3 className="text-sm font-bold uppercase tracking-wider text-[#0B1B2B] mb-4">
          Submitted Applications &amp; Review Status
        </h3>

        {leaves.length === 0 ? (
          <div className="p-12 text-center text-gray-400">
            <HiClipboardDocumentCheck className="w-10 h-10 mx-auto text-gray-300 mb-2" />
            <p className="text-xs font-medium text-gray-600">No leave requests filed for this student.</p>
            <p className="text-[11px] text-gray-400 mt-0.5">
              If your child needs to take a planned or medical leave, use the button above to notify the school.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-gray-100 text-[11px] uppercase tracking-wider text-gray-400 font-semibold bg-[#FAF9F5]">
                  <th className="py-2.5 px-4">Period</th>
                  <th className="py-2.5 px-4">Applied Date</th>
                  <th className="py-2.5 px-4">Reason / Particulars</th>
                  <th className="py-2.5 px-4">Status</th>
                  <th className="py-2.5 px-4">Directorate Remarks</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 text-gray-700">
                {leaves.map((l, idx) => (
                  <tr key={idx} className="hover:bg-[#FAF9F5]">
                    <td className="py-3 px-4 font-bold text-[#0B1B2B]">
                      {l.startDate} to {l.endDate}
                    </td>
                    <td className="py-3 px-4 text-gray-500 font-mono">
                      {l.appliedDate || '2026-10-08'}
                    </td>
                    <td className="py-3 px-4 text-gray-600 max-w-xs truncate">
                      {l.reason}
                    </td>
                    <td className="py-3 px-4">
                      <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                        l.status === 'APPROVED'
                          ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                          : l.status === 'PENDING'
                          ? 'bg-amber-50 text-amber-700 border border-amber-200'
                          : 'bg-rose-50 text-rose-700 border border-rose-200'
                      }`}>
                        {l.status}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-gray-500 italic">
                      {l.adminRemarks || 'Under standard attendance review'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Submission Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 sm:p-8 shadow-2xl border border-[#C5A059]/40 relative font-sans animate-in zoom-in-95 duration-150">
            
            <button
              type="button"
              onClick={() => setShowModal(false)}
              className="absolute top-5 right-5 text-gray-400 hover:text-gray-700 p-1"
            >
              <HiXMark className="w-5 h-5" />
            </button>

            <div className="mb-5">
              <span className="text-[10px] font-bold uppercase tracking-wider text-[#8C6837] bg-amber-50 px-2 py-0.5 rounded border border-amber-200">
                Official Absence Note
              </span>
              <h2 className="text-xl font-serif font-bold text-[#0B1B2B] mt-1.5">
                Submit Leave Application
              </h2>
              <p className="text-xs text-gray-500 mt-0.5">
                For student: <strong className="text-[#0B1B2B]">{activeChild?.fullName}</strong> ({activeChild?.className})
              </p>
            </div>

            <form onSubmit={handleSubmitLeave} className="space-y-4">
              
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">
                    Start Date
                  </label>
                  <input
                    type="date"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg border border-gray-300 text-xs focus:outline-none focus:border-[#C5A059]"
                    required
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">
                    End Date
                  </label>
                  <input
                    type="date"
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg border border-gray-300 text-xs focus:outline-none focus:border-[#C5A059]"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">
                  Reason for Absence
                </label>
                <textarea
                  rows="3"
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  placeholder="e.g. Mild seasonal fever. Doctor has advised 2 days of bed rest."
                  className="w-full px-3 py-2 rounded-lg border border-gray-300 text-xs focus:outline-none focus:border-[#C5A059]"
                  required
                />
              </div>

              <div className="p-3 rounded-xl bg-amber-50 border border-amber-200 text-amber-900 text-[11px] leading-relaxed">
                ℹ️ <strong>Note:</strong> Absences for more than 3 consecutive days require a medical practitioner's fitness certificate upon resumption.
              </div>

              <button
                type="submit"
                disabled={submitting}
                className="btn-gold w-full py-3 text-xs font-bold rounded-xl flex items-center justify-center gap-2 mt-2 disabled:opacity-50"
              >
                {submitting ? 'Submitting Leave...' : 'Submit to Homeroom Teacher'}
              </button>

            </form>

          </div>
        </div>
      )}

    </div>
  )
}

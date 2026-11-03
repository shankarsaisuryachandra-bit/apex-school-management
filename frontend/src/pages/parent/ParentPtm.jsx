import { useState, useEffect } from 'react'
import api from '../../api/axiosConfig'
import {
  HiUserGroup, HiCalendarDays, HiClock, HiCheckCircle,
  HiXMark, HiPlus, HiChatBubbleLeftRight, HiVideoCamera
} from 'react-icons/hi2'

export default function ParentPtm() {
  const [children, setChildren] = useState([])
  const [selectedChildId, setSelectedChildId] = useState(null)
  const [summary, setSummary] = useState(null)
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [teacherId, setTeacherId] = useState('')
  const [appointmentDate, setAppointmentDate] = useState('')
  const [timeSlot, setTimeSlot] = useState('03:30 PM - 04:00 PM')
  const [notes, setNotes] = useState('')

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
      if (res.data?.faculty?.length > 0) {
        setTeacherId(res.data.faculty[0].teacherId.toString())
      }
    } catch (err) {
      console.error('Failed to load PTM data:', err)
    } finally {
      setLoading(false)
    }
  }

  const handleSelectChild = (id) => {
    setSelectedChildId(id)
    loadChildData(id)
  }

  const handleBookPtm = async (e) => {
    e.preventDefault()
    const today = new Date().toISOString().split('T')[0]
    if (appointmentDate < today) {
      alert('Cannot request a PTM appointment for a past date. System rejected request.')
      return
    }
    setSubmitting(true)
    try {
      await api.post(`/parent/child/${selectedChildId}/ptm-request`, {
        teacherId: Number(teacherId),
        appointmentDate: appointmentDate,
        timeSlot: timeSlot,
        notes: notes || 'Parent discussion on term progress and academic support.'
      })
      setShowModal(false)
      setNotes('')
      await loadChildData(selectedChildId)
    } catch (err) {
      console.error('Failed to schedule PTM:', err)
      alert('Unable to schedule conference. Please ensure valid date and time slot.')
    } finally {
      setSubmitting(false)
    }
  }

  const activeChild = children.find(c => c.id === selectedChildId) || children[0]
  const ptms = summary?.ptmAppointments || []
  const faculty = summary?.faculty || []

  return (
    <div className="space-y-6 font-sans">
      
      {/* Top Header & Switcher */}
      <div className="bg-white rounded-2xl border border-[#E8E6DF] p-6 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <span className="text-[11px] font-bold uppercase tracking-wider text-[#8C6837] bg-amber-50 border border-amber-200 px-2.5 py-0.5 rounded-full">
            Faculty Collaboration Desk
          </span>
          <h1 className="text-2xl font-serif font-bold text-[#0B1B2B] mt-1.5">
            Parent-Teacher Conferences (PTM)
          </h1>
          <p className="text-xs text-gray-500 mt-0.5">
            Book 1-on-1 consultations with faculty chairs, track meeting slots, and review academic remarks.
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
            <span>Schedule Conference</span>
          </button>
        </div>
      </div>

      {/* Scheduled PTM List */}
      <div className="bg-white rounded-2xl border border-[#E8E6DF] p-6 shadow-xs">
        <h3 className="text-sm font-bold uppercase tracking-wider text-[#0B1B2B] mb-4">
          Conferences &amp; Scheduled Consultations
        </h3>

        {ptms.length === 0 ? (
          <div className="p-12 text-center text-gray-400">
            <HiUserGroup className="w-10 h-10 mx-auto text-gray-300 mb-2" />
            <p className="text-xs font-medium text-gray-600">No PTM conferences scheduled yet.</p>
            <p className="text-[11px] text-gray-400 mt-0.5">
              Click "Schedule Conference" above to book a direct slot with your child's teachers.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {ptms.map((p, idx) => (
              <div key={idx} className="p-5 rounded-xl bg-[#FAF9F5] border border-[#E8E6DF] flex flex-col justify-between space-y-3">
                <div className="flex items-start justify-between">
                  <div>
                    <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">
                      Faculty Advisor
                    </span>
                    <h4 className="text-sm font-bold text-[#0B1B2B]">
                      {p.teacher?.fullName || 'Sarah Jenkins'}
                    </h4>
                    <p className="text-xs text-gray-500">
                      {p.teacher?.email || 'Faculty Chair'}
                    </p>
                  </div>
                  <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                    p.status === 'ACCEPTED' || p.status === 'SCHEDULED'
                      ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                      : p.status === 'PENDING'
                      ? 'bg-amber-50 text-amber-700 border border-amber-200'
                      : 'bg-gray-100 text-gray-700'
                  }`}>
                    {p.status}
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-2 text-xs pt-2 border-t border-gray-200/60">
                  <div className="flex items-center gap-1.5 text-gray-600">
                    <HiCalendarDays className="w-4 h-4 text-[#C5A059]" />
                    <span className="font-semibold">{p.appointmentDate}</span>
                  </div>
                  <div className="flex items-center gap-1.5 text-gray-600">
                    <HiClock className="w-4 h-4 text-[#C5A059]" />
                    <span className="font-semibold">{p.timeSlot}</span>
                  </div>
                </div>

                <div className="text-[11px] text-gray-600 bg-white p-2.5 rounded-lg border border-gray-200">
                  <span className="font-bold text-[#0B1B2B]">Discussion Agenda:</span> {p.notes || 'Academic review and classroom progress.'}
                </div>

                <div className="flex items-center justify-between text-xs pt-1">
                  <span className="text-[11px] text-gray-500 flex items-center gap-1">
                    <HiVideoCamera className="w-3.5 h-3.5 text-sky-600" />
                    <span>Room: Staff Annex Room 204 / Virtual Link</span>
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Booking Modal */}
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
                1-on-1 Faculty Booking
              </span>
              <h2 className="text-xl font-serif font-bold text-[#0B1B2B] mt-1.5">
                Schedule Parent Conference
              </h2>
              <p className="text-xs text-gray-500 mt-0.5">
                Consultation regarding <strong className="text-[#0B1B2B]">{activeChild?.fullName}</strong>
              </p>
            </div>

            <form onSubmit={handleBookPtm} className="space-y-4">
              
              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">
                  Select Faculty Member
                </label>
                <select
                  value={teacherId}
                  onChange={(e) => setTeacherId(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-gray-300 text-xs font-medium focus:outline-none focus:border-[#C5A059]"
                  required
                >
                  {faculty.length === 0 ? (
                    <option value="1">Sarah Jenkins (Mathematics &amp; Class Teacher)</option>
                  ) : (
                    faculty.map(fac => (
                      <option key={fac.teacherId} value={fac.teacherId}>
                        {fac.fullName} ({fac.subject})
                      </option>
                    ))
                  )}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">
                  Preferred Date
                </label>
                <input
                  type="date"
                  value={appointmentDate}
                  onChange={(e) => setAppointmentDate(e.target.value)}
                  min={new Date().toISOString().split('T')[0]}
                  className="w-full px-3 py-2 rounded-lg border border-gray-300 text-xs focus:outline-none focus:border-[#C5A059]"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">
                  Time Slot
                </label>
                <select
                  value={timeSlot}
                  onChange={(e) => setTimeSlot(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-gray-300 text-xs focus:outline-none focus:border-[#C5A059]"
                >
                  <option value="03:30 PM - 04:00 PM">03:30 PM - 04:00 PM (Afternoon Slot)</option>
                  <option value="04:00 PM - 04:30 PM">04:00 PM - 04:30 PM (Evening Slot)</option>
                  <option value="10:00 AM - 10:30 AM">10:00 AM - 10:30 AM (Morning Slot)</option>
                  <option value="11:30 AM - 12:00 PM">11:30 AM - 12:00 PM (Midday Slot)</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">
                  Discussion Agenda / Note for Teacher
                </label>
                <textarea
                  rows="3"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="e.g. Inquiring about progress in algebra and science practical projects."
                  className="w-full px-3 py-2 rounded-lg border border-gray-300 text-xs focus:outline-none focus:border-[#C5A059]"
                  required
                />
              </div>

              <button
                type="submit"
                disabled={submitting}
                className="btn-gold w-full py-3 text-xs font-bold rounded-xl flex items-center justify-center gap-2 mt-2 disabled:opacity-50"
              >
                {submitting ? 'Booking Slot...' : 'Confirm Consultation Request'}
              </button>

            </form>

          </div>
        </div>
      )}

    </div>
  )
}

import { useState, useEffect } from 'react'
import api from '../../api/axiosConfig'
import { HiCalendar, HiPlus, HiXMark, HiMapPin, HiTag } from 'react-icons/hi2'
import { useAuth } from '../../auth/AuthContext'

export default function EventScheduler() {
  const { user } = useAuth()
  const isStaff = user?.role === 'MANAGEMENT' || user?.role === 'TEACHER'

  const [events, setEvents] = useState([])
  const [loading, setLoading] = useState(true)
  const [showAddModal, setShowAddModal] = useState(false)
  const [message, setMessage] = useState('')
  const [submitting, setSubmitting] = useState(false)

  const [formData, setFormData] = useState({
    title: '',
    description: '',
    eventDate: '',
    eventType: 'EXAM',
    venue: 'Auditorium'
  })

  useEffect(() => {
    fetchEvents()
  }, [])

  const fetchEvents = async () => {
    try {
      const { data } = await api.get('/events')
      setEvents(data)
    } catch (error) {
      console.error('Failed to fetch school events:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleCreateEvent = async (e) => {
    e.preventDefault()
    if (!formData.title || !formData.eventDate) return
    setSubmitting(true)
    setMessage('')
    try {
      await api.post('/events', formData)
      setMessage('Event scheduled successfully!')
      setTimeout(() => {
        setMessage('')
        setShowAddModal(false)
        setFormData({ title: '', description: '', eventDate: '', eventType: 'EXAM', venue: 'Auditorium' })
        fetchEvents()
      }, 1500)
    } catch (error) {
      setMessage(error.response?.data?.message || 'Failed to schedule event')
    } finally {
      setSubmitting(false)
    }
  }

  const getBadgeColor = (type) => {
    switch (type) {
      case 'EXAM': return 'bg-red-100 text-red-700'
      case 'HOLIDAY': return 'bg-green-100 text-green-700'
      case 'SPORTS': return 'bg-amber-100 text-amber-700'
      case 'MEETING': return 'bg-purple-100 text-purple-700'
      default: return 'bg-primary-100 text-primary-700'
    }
  }

  return (
    <div className="animate-fade-in space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-display font-bold text-surface-900">Event & Exam Calendar</h1>
          <p className="text-surface-700/60 mt-1">Institutional academic calendar, exam schedules, and events</p>
        </div>
        {isStaff && (
          <button
            onClick={() => setShowAddModal(true)}
            className="btn-primary text-sm flex items-center gap-2"
          >
            <HiPlus className="w-4 h-4" />
            Schedule Event
          </button>
        )}
      </div>

      {loading ? (
        <div className="animate-pulse text-surface-700/50 py-4">Loading calendar events...</div>
      ) : events.length === 0 ? (
        <div className="text-center py-8 text-surface-700/50 card p-6">
          <HiCalendar className="w-12 h-12 mx-auto mb-2 text-surface-300" />
          <p>No upcoming events scheduled.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {events.map((evt) => (
            <div key={evt.id} className="card p-6 flex flex-col justify-between border-l-4 border-l-primary-600">
              <div>
                <div className="flex items-center justify-between gap-2 mb-3">
                  <span className={`px-2.5 py-1 rounded-lg text-xs font-bold uppercase ${getBadgeColor(evt.eventType)}`}>
                    {evt.eventType || 'EVENT'}
                  </span>
                  <span className="text-xs font-semibold text-surface-600 flex items-center gap-1">
                    <HiCalendar className="w-3.5 h-3.5 text-primary-600" />
                    {evt.eventDate}
                  </span>
                </div>

                <h3 className="font-display font-bold text-surface-900 text-lg mb-2">{evt.title}</h3>
                <p className="text-surface-700/70 text-sm leading-relaxed mb-4">{evt.description || 'No description provided.'}</p>
              </div>

              {evt.venue && (
                <div className="flex items-center gap-1.5 text-xs text-surface-700/60 border-t border-surface-100 pt-3">
                  <HiMapPin className="w-4 h-4 text-surface-400" />
                  <span>Venue: <strong className="text-surface-900">{evt.venue}</strong></span>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Add Event Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 animate-fade-in">
          <div className="card-glass w-full max-w-md bg-white p-6 rounded-2xl shadow-2xl relative border border-surface-200">
            <button onClick={() => setShowAddModal(false)} className="absolute top-4 right-4 text-surface-400 hover:text-surface-900">
              <HiXMark className="w-6 h-6" />
            </button>
            <h3 className="text-xl font-display font-bold text-surface-900 mb-1">Schedule New Event</h3>
            <p className="text-sm text-surface-700/60 mb-4">Add to institutional calendar</p>

            {message && (
              <div className="mb-4 p-3 rounded-xl bg-accent-100 text-accent-800 text-sm font-medium">
                {message}
              </div>
            )}

            <form onSubmit={handleCreateEvent} className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-surface-700 uppercase mb-1">Event Title</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. FA1 Periodic Assessment"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  className="input-field py-2"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-surface-700 uppercase mb-1">Event Type</label>
                  <select
                    value={formData.eventType}
                    onChange={(e) => setFormData({ ...formData, eventType: e.target.value })}
                    className="input-field py-2"
                  >
                    <option value="EXAM">EXAM</option>
                    <option value="HOLIDAY">HOLIDAY</option>
                    <option value="SPORTS">SPORTS</option>
                    <option value="MEETING">MEETING</option>
                    <option value="EVENT">GENERAL</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-surface-700 uppercase mb-1">Event Date</label>
                  <input
                    type="date"
                    required
                    value={formData.eventDate}
                    onChange={(e) => setFormData({ ...formData, eventDate: e.target.value })}
                    className="input-field py-2"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-surface-700 uppercase mb-1">Venue / Location</label>
                <input
                  type="text"
                  placeholder="e.g. Main Examination Hall"
                  value={formData.venue}
                  onChange={(e) => setFormData({ ...formData, venue: e.target.value })}
                  className="input-field py-2"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-surface-700 uppercase mb-1">Description</label>
                <textarea
                  rows="3"
                  placeholder="Additional event details..."
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="input-field py-2"
                />
              </div>

              <div className="flex gap-3 pt-2">
                <button type="button" onClick={() => setShowAddModal(false)} className="btn-secondary flex-1">
                  Cancel
                </button>
                <button type="submit" disabled={submitting} className="btn-primary flex-1">
                  {submitting ? 'Scheduling...' : 'Save Event'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}

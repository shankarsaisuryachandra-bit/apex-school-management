import { useState, useEffect } from 'react'
import api from '../../api/axiosConfig'
import { HiMegaphone, HiPlus, HiTrash, HiCalendarDays, HiXMark } from 'react-icons/hi2'
import { useAuth } from '../../auth/AuthContext'

export default function NoticeBoard() {
  const { user } = useAuth()
  const [notices, setNotices] = useState([])
  const [loading, setLoading] = useState(true)
  const [showCreateForm, setShowCreateForm] = useState(false)
  const [title, setTitle] = useState('')
  const [content, setContent] = useState('')
  const [audience, setAudience] = useState('ALL')
  const [message, setMessage] = useState('')

  const canPost = user?.role === 'MANAGEMENT' || user?.role === 'TEACHER'
  const canDelete = user?.role === 'MANAGEMENT'

  useEffect(() => {
    fetchNotices()
  }, [])

  const fetchNotices = async () => {
    try {
      const { data } = await api.get('/notices')
      setNotices(data)
    } catch (error) {
      console.error('Failed to fetch notices:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleCreateNotice = async (e) => {
    e.preventDefault()
    if (!title || !content) return
    try {
      await api.post('/notices', { title, content, audience })
      setTitle('')
      setContent('')
      setShowCreateForm(false)
      setMessage('Official notice published successfully.')
      setTimeout(() => setMessage(''), 3500)
      fetchNotices()
    } catch (error) {
      console.error('Failed to post notice:', error)
    }
  }

  const handleDeleteNotice = async (id) => {
    try {
      await api.delete(`/notices/${id}`)
      fetchNotices()
    } catch (error) {
      console.error('Failed to delete notice:', error)
    }
  }

  const audienceBadges = {
    ALL: 'bg-[#F6F5EF] text-[#0B1B2B] border-[#E2DFD2]',
    STUDENTS: 'bg-sky-50 text-sky-800 border-sky-200',
    TEACHERS: 'bg-emerald-50 text-emerald-800 border-emerald-200',
    MANAGEMENT: 'bg-amber-50 text-amber-900 border-amber-200',
  }

  return (
    <div className="bg-white rounded-xl border border-[#E8E6DF] p-6 shadow-sm">
      <div className="flex items-center justify-between pb-4 border-b border-[#F2F0E8] mb-5">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-[#0B1B2B] text-[#DFBF77] flex items-center justify-center shadow-sm">
            <HiMegaphone className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-base font-serif font-bold text-[#0B1B2B]">
              Gazette & Official Announcements
            </h2>
            <p className="text-xs text-[#7A889B]">Institutional administrative notices & advisories</p>
          </div>
        </div>

        {canPost && (
          <button
            onClick={() => setShowCreateForm(!showCreateForm)}
            className="btn-primary text-xs !py-2 !px-3.5 flex items-center gap-1.5"
          >
            {showCreateForm ? <HiXMark className="w-3.5 h-3.5" /> : <HiPlus className="w-3.5 h-3.5 text-[#DFBF77]" />}
            <span>{showCreateForm ? 'Close Form' : 'Publish Notice'}</span>
          </button>
        )}
      </div>

      {message && (
        <div className="mb-4 p-3 rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-semibold">
          {message}
        </div>
      )}

      {showCreateForm && (
        <form onSubmit={handleCreateNotice} className="p-5 rounded-xl bg-[#FAF9F5] mb-5 space-y-3.5 border border-[#E8E6DF]">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-bold uppercase tracking-wider text-[#0B1B2B]">Draft Institutional Notice</h3>
            <span className="text-[10px] text-[#8C9BAE]">Signed by {user?.fullName}</span>
          </div>

          <div>
            <label className="block text-[11px] font-bold text-[#5A6878] uppercase mb-1">Announcement Subject / Headline</label>
            <input
              type="text"
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="input-field"
              placeholder="e.g. Schedule of Term II Practical Examinations"
            />
          </div>

          <div>
            <label className="block text-[11px] font-bold text-[#5A6878] uppercase mb-1">Target Circulation</label>
            <select
              value={audience}
              onChange={(e) => setAudience(e.target.value)}
              className="input-field"
            >
              <option value="ALL">Institutional (All Scholars, Faculty & Admin)</option>
              <option value="STUDENTS">Scholars & Guardians Only</option>
              <option value="TEACHERS">Academic Faculty Only</option>
              <option value="MANAGEMENT">Directorate & Admin Only</option>
            </select>
          </div>

          <div>
            <label className="block text-[11px] font-bold text-[#5A6878] uppercase mb-1">Detailed Circular Text</label>
            <textarea
              rows="3"
              required
              value={content}
              onChange={(e) => setContent(e.target.value)}
              className="input-field"
              placeholder="Provide exact procedural details, room allocations, statutory compliance rules, or deadlines..."
            />
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={() => setShowCreateForm(false)}
              className="btn-secondary text-xs !py-2 !px-4"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="btn-primary text-xs !py-2 !px-4"
            >
              Sign & Publish
            </button>
          </div>
        </form>
      )}

      {loading ? (
        <div className="text-xs text-[#8C9BAE] py-6 text-center animate-pulse">
          Fetching official institutional gazette...
        </div>
      ) : notices.length === 0 ? (
        <div className="text-xs text-[#8C9BAE] py-6 text-center italic bg-[#FAF9F5] rounded-lg border border-[#E8E6DF]">
          No active gazette notices currently posted for this academic term.
        </div>
      ) : (
        <div className="space-y-3">
          {notices.map((notice) => (
            <div
              key={notice.id}
              className="p-4 rounded-xl bg-[#FAF9F5] border border-[#E8E6DF] hover:border-[#C5A059] transition-all"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="space-y-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded border ${audienceBadges[notice.audience] || audienceBadges.ALL}`}>
                      {notice.audience}
                    </span>
                    <span className="text-[11px] text-[#7A889B] flex items-center gap-1">
                      <HiCalendarDays className="w-3.5 h-3.5 text-[#C5A059]" />
                      {notice.createdAt ? notice.createdAt.split('T')[0] : 'Today'}
                    </span>
                  </div>
                  <h4 className="font-serif font-bold text-[#0B1B2B] text-sm">
                    {notice.title}
                  </h4>
                  <p className="text-xs text-[#5A6878] whitespace-pre-line leading-relaxed">
                    {notice.content}
                  </p>
                </div>

                {canDelete && (
                  <button
                    onClick={() => handleDeleteNotice(notice.id)}
                    className="text-[#8C9BAE] hover:text-rose-600 transition-colors p-1"
                    title="Archive / Remove notice"
                  >
                    <HiTrash className="w-4 h-4" />
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}


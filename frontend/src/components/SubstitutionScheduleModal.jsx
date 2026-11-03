import { useState, useEffect } from 'react'
import api from '../api/axiosConfig'
import { HiXMark, HiUserGroup, HiClock, HiCheckCircle } from 'react-icons/hi2'

export default function SubstitutionScheduleModal({ onClose }) {
  const [subs, setSubs] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchSubs()
  }, [])

  const fetchSubs = async () => {
    try {
      const res = await api.get('/substitutions/today')
      setSubs(res.data || [])
    } catch (err) {
      console.error('Failed to load substitutions:', err)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-fade-in">
      <div className="bg-white rounded-3xl shadow-2xl overflow-hidden max-w-lg w-full border border-slate-200 relative">
        
        {/* Header */}
        <div className="bg-[#0F2942] text-white px-6 py-4 flex items-center justify-between border-b-4 border-amber-500">
          <div className="flex items-center gap-2">
            <HiUserGroup className="w-6 h-6 text-amber-400" />
            <h3 className="text-base font-extrabold tracking-tight">Today's Faculty Substitution Schedule</h3>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-full text-slate-300 hover:bg-white/10">
            <HiXMark className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-3 max-h-[75vh] overflow-y-auto">
          {loading ? (
            <div className="text-center py-6 text-xs text-slate-500">Loading daily substitution schedule...</div>
          ) : subs.length === 0 ? (
            <div className="text-center py-6 text-xs text-slate-500">All faculty members present today!</div>
          ) : (
            subs.map((s, i) => (
              <div key={i} className="p-4 rounded-2xl border border-slate-200 bg-slate-50 space-y-2 text-xs">
                <div className="flex items-center justify-between">
                  <span className="font-extrabold text-[#0F2942] flex items-center gap-1">
                    <HiClock className="w-4 h-4 text-amber-600" /> {s.period}
                  </span>
                  <span className="px-2 py-0.5 rounded bg-emerald-100 text-emerald-800 font-extrabold text-[10px]">
                    {s.status}
                  </span>
                </div>
                <div className="grid grid-cols-2 gap-2 pt-1 border-t border-slate-200">
                  <div>
                    <span className="text-[10px] text-slate-400 uppercase font-bold block">Class & Division</span>
                    <span className="font-bold text-slate-900">{s.class}</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-400 uppercase font-bold block">Substitute Assigned</span>
                    <span className="font-bold text-emerald-700">{s.substituteTeacher}</span>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

      </div>
    </div>
  )
}

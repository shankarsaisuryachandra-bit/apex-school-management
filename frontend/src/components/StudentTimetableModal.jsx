import { useState, useEffect } from 'react'
import { HiXMark, HiAcademicCap, HiClock, HiCalendarDays, HiBuildingOffice, HiUser } from 'react-icons/hi2'
import { useAuth } from '../auth/AuthContext'
import api from '../api/axiosConfig'

export default function StudentTimetableModal({ onClose }) {
  const { user } = useAuth()
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [todaySubstitutions, setTodaySubstitutions] = useState([])
  const todayDateStr = new Date().toISOString().split('T')[0]
  const todayDayOfWeek = new Date().toLocaleDateString('en-US', { weekday: 'long' })

  useEffect(() => {
    fetchClassTimetable()
  }, [user])

  const fetchClassTimetable = async () => {
    setLoading(true)
    setError(null)
    try {
      const res = await api.get('/timetable/my-class')
      setData(res.data)

      try {
        const subRes = await api.get(`/substitutions/daily?date=${todayDateStr}`)
        setTodaySubstitutions(subRes.data || [])
      } catch (subErr) {
        console.warn('Optional daily substitutions not loaded:', subErr)
        setTodaySubstitutions([])
      }
    } catch (err) {
      console.error('Failed to load student timetable:', err)
      setError(err.response?.data?.message || 'Failed to load your class weekly schedule')
    } finally {
      setLoading(false)
    }
  }

  const days = data?.days || ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday']
  const periods = data?.periods || []
  const matrix = data?.matrix || {}
  const className = data ? `${data.className} - Section ${data.section}` : (user?.className || 'Class Schedule')

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-fade-in">
      <div className="bg-white rounded-3xl shadow-2xl overflow-hidden max-w-4xl w-full border border-slate-200 relative flex flex-col max-h-[90vh]">
        
        {/* Header */}
        <div className="bg-[#0F2942] text-white px-6 py-4 flex items-center justify-between border-b-4 border-amber-500">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-amber-500/20 border border-amber-400/30 flex items-center justify-center text-amber-400">
              <HiAcademicCap className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-base font-extrabold tracking-tight">Class Weekly Schedule Matrix</h3>
              <p className="text-[11px] text-amber-300 font-medium">Official class timetable for {className}</p>
            </div>
          </div>
          <button 
            onClick={onClose} 
            className="p-2 rounded-full text-slate-300 hover:text-white hover:bg-white/10 transition-colors"
            title="Close"
          >
            <HiXMark className="w-5 h-5" />
          </button>
        </div>

        {/* Schedule Matrix Table */}
        <div className="p-6 overflow-y-auto flex-1 space-y-4">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-16 space-y-3">
              <div className="w-8 h-8 border-3 border-amber-500 border-t-transparent rounded-full animate-spin"></div>
              <p className="text-xs font-semibold text-slate-500">Fetching official class schedule...</p>
            </div>
          ) : error ? (
            <div className="p-4 rounded-2xl bg-rose-50 border border-rose-200 text-rose-800 text-xs font-medium text-center">
              {error}
            </div>
          ) : (
            <>
              {/* Information pill */}
              <div className="flex items-center justify-between px-4 py-2 rounded-2xl bg-slate-50 border border-slate-200 text-xs">
                <span className="font-bold text-slate-700">
                  Enrolled Class: <span className="text-[#0F2942] font-black">{className}</span>
                </span>
                <span className="px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 font-bold text-[10px]">
                  Live Synchronized
                </span>
              </div>

              <div className="overflow-x-auto rounded-2xl border border-slate-200 shadow-sm">
                <table className="w-full text-xs text-left border-collapse">
                  <thead className="bg-[#0F2942] text-white font-extrabold uppercase text-[11px]">
                    <tr>
                      <th className="p-3 border border-slate-700 w-28">Day / Period</th>
                      {periods.map(p => (
                        <th key={p.periodId || p.id} className="p-3 border border-slate-700 min-w-[130px]">
                          {p.periodLabel || p.label}
                          <span className="block text-[10px] text-amber-300 font-normal font-mono mt-0.5">
                            {p.startTime && p.endTime ? `${p.startTime} - ${p.endTime}` : p.time}
                          </span>
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200 font-medium">
                    {days.map((day, idx) => (
                      <tr key={day} className={idx % 2 === 0 ? 'bg-white' : 'bg-slate-50/60'}>
                        <td className="p-3 font-extrabold text-[#0F2942] border border-slate-200 bg-slate-100">
                          {day}
                        </td>
                        {periods.map(period => {
                          const pId = period.periodId || period.id
                          const slot = matrix?.[day]?.[pId] || matrix?.[day]?.[pId?.toLowerCase()] || matrix?.[day]?.[pId?.toUpperCase()]
                          const coverSub = (day === todayDayOfWeek) 
                            ? todaySubstitutions.find(s => s.periodId?.toLowerCase() === pId?.toLowerCase()) 
                            : null

                          return (
                            <td 
                              key={pId} 
                              className={`p-3 border border-slate-200 transition-all ${
                                coverSub
                                  ? 'bg-amber-100/90 border-amber-400 font-bold'
                                  : slot ? 'bg-amber-50/50' : 'text-slate-300'
                              }`}
                            >
                              {slot ? (
                                <div className="space-y-1">
                                  <span className="font-extrabold text-[#0F2942] block text-[13px]">
                                    {slot.subjectName || slot.subject?.name || 'Subject'}
                                  </span>
                                  {coverSub ? (
                                    <div className="p-1.5 rounded-lg bg-amber-600 text-white text-[10px] font-black space-y-0.5 shadow-sm">
                                      <span className="block text-[9px] uppercase tracking-wider text-amber-200">🔁 Daily Cover Teacher Today:</span>
                                      <span className="block flex items-center gap-1">
                                        <HiUser className="w-3 h-3 text-amber-200" />
                                        {coverSub.substituteTeacher?.fullName}
                                      </span>
                                    </div>
                                  ) : (
                                    <span className="text-[10px] text-slate-600 block flex items-center gap-1 font-semibold">
                                      <HiUser className="w-3 h-3 text-slate-400" />
                                      {slot.teacherName || slot.teacher?.fullName || 'Faculty Member'}
                                    </span>
                                  )}
                                  <span className="text-[9px] text-slate-400 block flex items-center gap-1">
                                    <HiBuildingOffice className="w-2.5 h-2.5" />
                                    {slot.room || 'Room 101'}
                                  </span>
                                </div>
                              ) : (
                                <span className="text-slate-400 italic text-[11px]">— Study Period —</span>
                              )}
                            </td>
                          )
                        })}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </>
          )}
        </div>

      </div>
    </div>
  )
}

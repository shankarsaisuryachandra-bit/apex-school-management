import { useState, useEffect } from 'react'
import { HiXMark, HiClock, HiCalendarDays, HiBuildingOffice, HiAcademicCap, HiCheckCircle } from 'react-icons/hi2'
import { useAuth } from '../auth/AuthContext'
import api from '../api/axiosConfig'

export default function TeacherTimetableModal({ onClose }) {
  const { user } = useAuth()
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [myCovers, setMyCovers] = useState([])
  const todayDayOfWeek = new Date().toLocaleDateString('en-US', { weekday: 'long' })

  useEffect(() => {
    fetchMySchedule()
  }, [user])

  const fetchMySchedule = async () => {
    setLoading(true)
    setError(null)
    try {
      const [res, covRes] = await Promise.all([
        api.get('/timetable/my-schedule'),
        api.get('/substitutions/my-covers')
      ])
      setData(res.data)
      setMyCovers(covRes.data || [])
    } catch (err) {
      console.error('Failed to load teacher timetable from backend:', err)
      setError(err.response?.data?.message || 'Failed to load your assigned teaching schedule')
    } finally {
      setLoading(false)
    }
  }

  const days = data?.days || ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday']
  const periods = data?.periods || []
  const assignedSlots = data?.assignedSlots || []

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-fade-in">
      <div className="bg-white rounded-3xl shadow-2xl overflow-hidden max-w-4xl w-full border border-slate-200 relative flex flex-col max-h-[90vh]">
        
        {/* Header */}
        <div className="bg-[#0F2942] text-white px-6 py-4 flex items-center justify-between border-b-4 border-amber-500">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-amber-500/20 border border-amber-400/30 flex items-center justify-center text-amber-400">
              <HiCalendarDays className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-base font-extrabold tracking-tight">Faculty Teaching Schedule</h3>
              <p className="text-[11px] text-amber-300 font-medium">
                Live teaching timetable for {data?.teacherName || user?.fullName || 'Faculty Member'}
                {data?.employeeId ? ` (ID: ${data.employeeId})` : ''}
              </p>
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

        {/* Content */}
        <div className="p-6 overflow-y-auto flex-1 space-y-4">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-16 space-y-3">
              <div className="w-8 h-8 border-3 border-amber-500 border-t-transparent rounded-full animate-spin"></div>
              <p className="text-xs font-semibold text-slate-500">Syncing teaching schedule with database...</p>
            </div>
          ) : error ? (
            <div className="p-4 rounded-2xl bg-rose-50 border border-rose-200 text-rose-800 text-xs font-medium text-center">
              {error}
            </div>
          ) : (
            <>
              {/* Status Banner */}
              <div className="flex items-center justify-between px-4 py-2.5 rounded-2xl bg-slate-50 border border-slate-200 text-xs">
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse"></span>
                  <span className="font-bold text-[#0F2942]">
                    Total Allocated Classes: <span className="text-emerald-700">{assignedSlots.length} periods / week</span>
                  </span>
                </div>
                <button
                  onClick={fetchMySchedule}
                  className="text-amber-700 hover:text-amber-800 font-bold text-[11px] underline"
                >
                  Refresh Schedule
                </button>
              </div>

              {myCovers.length > 0 && (
                <div className="p-4 rounded-2xl bg-amber-500/10 border-2 border-amber-500/40 space-y-2 text-xs">
                  <div className="flex items-center gap-2 text-amber-900 font-extrabold text-xs uppercase tracking-wider">
                    <span className="w-2 h-2 rounded-full bg-amber-600 animate-ping"></span>
                    ⚡ Daily Substitute Covers Assigned to You Today ({myCovers.length})
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {myCovers.map(cov => (
                      <div key={cov.id} className="p-3 rounded-xl bg-white border border-amber-300 shadow-sm space-y-1">
                        <div className="flex items-center justify-between font-extrabold text-[#0F2942]">
                          <span>{cov.periodLabel || cov.periodId}</span>
                          <span className="px-2 py-0.5 rounded bg-amber-600 text-white text-[10px]">
                            Cover Active
                          </span>
                        </div>
                        <p className="text-xs text-amber-950 font-bold">
                          Class: {cov.schoolClass?.className} ({cov.subject?.name || 'Subject'})
                        </p>
                        <p className="text-[11px] text-slate-500">
                          Covering for: <span className="font-semibold text-slate-700">{cov.absentTeacher?.fullName}</span>
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {assignedSlots.length === 0 ? (
                <div className="text-center py-12 px-6 rounded-2xl bg-amber-50/50 border border-amber-200/60 text-slate-600 space-y-2">
                  <HiAcademicCap className="w-12 h-12 mx-auto text-amber-500/60" />
                  <p className="text-sm font-bold text-slate-800">No Teaching Periods Configured Yet</p>
                  <p className="text-xs max-w-md mx-auto text-slate-500">
                    Your administration has not scheduled any class periods for your account yet. Once management updates the master timetable, your assigned classes will reflect here immediately.
                  </p>
                </div>
              ) : (
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
                            const slot = assignedSlots.find(s => 
                              s.dayOfWeek?.toLowerCase() === day?.toLowerCase() && 
                              s.periodId?.toLowerCase() === pId?.toLowerCase()
                            )

                            return (
                              <td 
                                key={pId} 
                                className={`p-3 border border-slate-200 transition-colors ${
                                  slot ? 'bg-emerald-50/80 border-emerald-300' : 'text-slate-300'
                                }`}
                              >
                                {slot ? (
                                  <div className="space-y-1">
                                    <span className="font-extrabold text-emerald-950 block text-[13px]">
                                      {slot.subjectName || 'Subject'}
                                    </span>
                                    <span className="inline-block px-2 py-0.5 rounded-lg bg-emerald-700 text-white text-[10px] font-bold">
                                      {slot.className} {slot.section ? `(${slot.section})` : ''}
                                    </span>
                                    <span className="text-[10px] text-slate-500 block flex items-center gap-1 font-medium mt-1">
                                      <HiBuildingOffice className="w-3.5 h-3.5 text-slate-400" />
                                      {slot.room || 'Main Hall'}
                                    </span>
                                  </div>
                                ) : (
                                  <span className="text-slate-400 italic text-[11px]">— Free Period —</span>
                                )}
                              </td>
                            )
                          })}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </>
          )}
        </div>

      </div>
    </div>
  )
}

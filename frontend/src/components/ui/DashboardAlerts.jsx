import { useState, useEffect } from 'react'
import api from '../../api/axiosConfig'
import {
  HiBell, HiCheckCircle, HiExclamationTriangle, HiXCircle,
  HiCalendar, HiXMark, HiChevronRight, HiArrowTopRightOnSquare,
  HiClipboardDocumentCheck
} from 'react-icons/hi2'
import { useAuth } from '../../auth/AuthContext'
import { Link } from 'react-router-dom'

export default function DashboardAlerts() {
  const { user } = useAuth()
  const role = user?.role || 'STUDENT'
  const profileId = user?.profileId || user?.userId

  const [alerts, setAlerts] = useState([])
  const [loading, setLoading] = useState(true)
  const [dismissed, setDismissed] = useState({})

  useEffect(() => {
    fetchAlerts()
    const timer = setInterval(fetchAlerts, 10000) // Poll every 10 seconds for real-time responsiveness
    return () => clearInterval(timer)
  }, [user])

  const fetchAlerts = async () => {
    try {
      let query = `role=${role}`
      if (role === 'STUDENT') query += `&studentId=${profileId}`
      if (role === 'TEACHER') query += `&teacherId=${profileId}`

      const res = await api.get(`/dashboard/alerts?${query}`)
      setAlerts(res.data || [])
    } catch (err) {
      console.error('Failed to load dashboard alerts:', err)
    } finally {
      setLoading(false)
    }
  }

  const handleDismiss = (id) => {
    setDismissed(prev => ({ ...prev, [id]: true }))
  }

  const activeAlerts = alerts.filter(a => !dismissed[a.id])

  if (loading && alerts.length === 0) return null
  if (activeAlerts.length === 0) return null

  const getAlertStyle = (urgency) => {
    switch (urgency) {
      case 'SUCCESS':
        return {
          bg: 'bg-emerald-50/90 border-emerald-300 text-emerald-950',
          icon: <HiCheckCircle className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />,
          badge: 'bg-emerald-100 text-emerald-800'
        }
      case 'DANGER':
        return {
          bg: 'bg-rose-50/90 border-rose-300 text-rose-950',
          icon: <HiXCircle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />,
          badge: 'bg-rose-100 text-rose-800'
        }
      case 'WARNING':
        return {
          bg: 'bg-amber-50/90 border-amber-300 text-amber-950',
          icon: <HiExclamationTriangle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />,
          badge: 'bg-amber-100 text-amber-900'
        }
      default:
        return {
          bg: 'bg-blue-50/90 border-blue-300 text-blue-950',
          icon: <HiCalendar className="w-5 h-5 text-blue-600 shrink-0 mt-0.5" />,
          badge: 'bg-blue-100 text-blue-800'
        }
    }
  }

  return (
    <div className="space-y-2.5 animate-fade-in">
      <div className="flex items-center justify-between px-1">
        <div className="flex items-center gap-2">
          <span className="p-1 rounded-md bg-[#0B1B2B] text-[#DFBF77] border border-[#C5A059]/30">
            <HiBell className="w-3.5 h-3.5" />
          </span>
          <h3 className="text-xs font-bold text-[#0B1B2B] tracking-wide uppercase font-serif">
            Institutional Notices & Directives ({activeAlerts.length})
          </h3>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {activeAlerts.map((alert) => {
          const style = getAlertStyle(alert.urgency)
          return (
            <div
              key={alert.id}
              className={`p-4 rounded-2xl border-2 ${style.bg} shadow-sm transition-all hover:shadow-md relative flex items-start justify-between gap-3`}
            >
              <div className="flex items-start gap-3 min-w-0">
                {style.icon}
                <div className="space-y-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <h4 className="text-sm font-display font-extrabold">
                      {alert.title}
                    </h4>
                    <span className={`text-[10px] font-black uppercase px-2 py-0.5 rounded-full ${style.badge}`}>
                      {alert.type} • {alert.status}
                    </span>
                  </div>

                  <p className="text-xs font-medium leading-snug">
                    {alert.message}
                  </p>

                  {alert.remarks && (
                    <div className="p-2 rounded-xl bg-white/80 border border-slate-200/80 text-[11px] space-y-0.5 mt-1.5">
                      <span className="font-extrabold text-slate-800 uppercase tracking-wider text-[10px] block">
                        Remarks / Instructions:
                      </span>
                      <p className="italic text-slate-700">"{alert.remarks}"</p>
                    </div>
                  )}

                  {/* Navigation link based on alert type */}
                  <div className="pt-1.5 flex items-center gap-3 text-xs">
                    {alert.type === 'LEAVE' && (
                      <Link
                        to={role === 'STUDENT' ? '/student/leaves' : role === 'TEACHER' ? '/teacher/leaves' : '/management/leaves'}
                        className="font-bold underline text-slate-900 hover:text-amber-700 flex items-center gap-1"
                      >
                        <span>View Leave Details</span>
                        <HiChevronRight className="w-3.5 h-3.5" />
                      </Link>
                    )}

                    {alert.type === 'PTM' && (
                      <Link
                        to={role === 'STUDENT' ? '/student/ptm' : role === 'TEACHER' ? '/teacher/ptm' : '/management/ptm'}
                        className="font-bold underline text-slate-900 hover:text-amber-700 flex items-center gap-1"
                      >
                        <span>View PTM Schedule</span>
                        <HiChevronRight className="w-3.5 h-3.5" />
                      </Link>
                    )}

                    {alert.type === 'ASSIGNMENT' && (
                      <Link
                        to={role === 'STUDENT' ? '/student/assignments' : role === 'TEACHER' ? '/teacher/assignments' : '/management/assignments'}
                        className="font-bold underline text-slate-900 hover:text-amber-700 flex items-center gap-1"
                      >
                        <span>Go to Assignment Portal</span>
                        <HiChevronRight className="w-3.5 h-3.5" />
                      </Link>
                    )}
                  </div>
                </div>
              </div>

              {/* Dismiss Button */}
              <button
                onClick={() => handleDismiss(alert.id)}
                className="p-1 text-slate-400 hover:text-slate-700 hover:bg-black/5 rounded-lg transition-colors shrink-0"
                title="Dismiss"
              >
                <HiXMark className="w-4 h-4" />
              </button>
            </div>
          )
        })}
      </div>
    </div>
  )
}

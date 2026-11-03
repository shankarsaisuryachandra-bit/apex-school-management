import { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import api from '../../api/axiosConfig'
import {
  HiBell, HiCheckCircle, HiExclamationTriangle, HiInformationCircle,
  HiTruck, HiAcademicCap, HiCurrencyRupee, HiCheck, HiSparkles,
  HiXMark
} from 'react-icons/hi2'

export default function NotificationBell() {
  const [notifications, setNotifications] = useState([])
  const [unreadCount, setUnreadCount] = useState(0)
  const [isOpen, setIsOpen] = useState(false)
  const [filter, setFilter] = useState('ALL')
  const [toastNotification, setToastNotification] = useState(null)
  const [simulating, setSimulating] = useState(false)
  const menuRef = useRef(null)
  const navigate = useNavigate()
  const prevCountRef = useRef(0)

  const fetchNotifications = async () => {
    try {
      const [listRes, countRes] = await Promise.all([
        api.get('/notifications'),
        api.get('/notifications/unread-count')
      ])
      const newItems = listRes.data || []
      const newCount = countRes.data?.unreadCount || 0

      // Trigger toast if a new unread alert arrives
      if (newCount > prevCountRef.current && prevCountRef.current !== 0 && newItems.length > 0) {
        const latest = newItems[0]
        setToastNotification(latest)
        setTimeout(() => setToastNotification(null), 6000)
      }
      prevCountRef.current = newCount

      setNotifications(newItems)
      setUnreadCount(newCount)
    } catch (err) {
      console.warn('Failed to load notifications:', err.message)
    }
  }

  useEffect(() => {
    fetchNotifications()
    // Live polling every 12 seconds
    const interval = setInterval(fetchNotifications, 12000)
    return () => clearInterval(interval)
  }, [])

  // Close dropdown when clicked outside
  useEffect(() => {
    function handleClickOutside(event) {
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        setIsOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const handleMarkAsRead = async (id, link) => {
    try {
      await api.put(`/notifications/${id}/read`)
      setNotifications(prev => prev.map(n => n.id === id ? { ...n, isRead: true } : n))
      setUnreadCount(prev => Math.max(0, prev - 1))
      prevCountRef.current = Math.max(0, prevCountRef.current - 1)
      if (link) {
        setIsOpen(false)
        navigate(link)
      }
    } catch (err) {
      console.error('Error marking notification read:', err)
    }
  }

  const handleMarkAllRead = async () => {
    try {
      await api.put('/notifications/read-all')
      setNotifications(prev => prev.map(n => ({ ...n, isRead: true })))
      setUnreadCount(0)
      prevCountRef.current = 0
    } catch (err) {
      console.error('Error marking all read:', err)
    }
  }

  const handleSimulateAlert = async (category) => {
    setSimulating(true)
    try {
      const res = await api.post(`/notifications/simulate-alert?category=${category}`)
      await fetchNotifications()
      setToastNotification(res.data)
      setTimeout(() => setToastNotification(null), 6000)
    } catch (err) {
      console.error('Error triggering simulation:', err)
    } finally {
      setSimulating(false)
    }
  }

  const filteredNotifications = notifications.filter(n => {
    if (filter === 'UNREAD') return !n.isRead
    if (filter === 'TRANSPORT') return n.type === 'TRANSPORT'
    if (filter === 'ACADEMIC') return n.type === 'ACADEMIC'
    if (filter === 'FEE') return n.type === 'FEE'
    return true
  })

  const getIconForType = (type, severity) => {
    switch (type) {
      case 'TRANSPORT':
        return <HiTruck className="w-4 h-4 text-sky-500" />
      case 'ACADEMIC':
        return <HiAcademicCap className="w-4 h-4 text-emerald-500" />
      case 'FEE':
        return <HiCurrencyRupee className="w-4 h-4 text-amber-500" />
      default:
        if (severity === 'WARNING' || severity === 'URGENT') {
          return <HiExclamationTriangle className="w-4 h-4 text-rose-500" />
        }
        return <HiInformationCircle className="w-4 h-4 text-[#C5A059]" />
    }
  }

  return (
    <div className="relative" ref={menuRef}>
      {/* Bell Button */}
      <button
        type="button"
        onClick={() => setIsOpen(prev => !prev)}
        className="relative p-2 rounded-lg text-gray-600 hover:text-[#0B1B2B] hover:bg-[#F6F5EF] transition-all focus:outline-none"
        title="Live Institutional Notifications"
        aria-label="Notifications"
      >
        <HiBell className="w-5 h-5 text-gray-700" />
        {unreadCount > 0 && (
          <span className="absolute top-1 right-1 flex items-center justify-center min-w-[18px] h-[18px] px-1 text-[10px] font-bold text-white bg-red-600 rounded-full border-2 border-white animate-pulse shadow-sm">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {/* Dropdown Drawer */}
      {isOpen && (
        <div className="absolute right-0 mt-2 w-80 sm:w-96 bg-white rounded-xl shadow-2xl border border-[#E8E6DF] z-50 overflow-hidden font-sans animate-in fade-in slide-in-from-top-2 duration-150">
          
          {/* Header */}
          <div className="bg-[#0B1B2B] text-white p-3.5 flex items-center justify-between border-b border-[#C5A059]/30">
            <div className="flex items-center gap-2">
              <HiBell className="w-4 h-4 text-[#DFBF77]" />
              <span className="text-xs font-serif font-bold tracking-wide text-[#FAF9F5]">
                Campus Dispatch &amp; Alerts
              </span>
              {unreadCount > 0 && (
                <span className="text-[10px] bg-[#C5A059]/30 text-[#DFBF77] px-2 py-0.5 rounded-full font-semibold">
                  {unreadCount} new
                </span>
              )}
            </div>
            {unreadCount > 0 && (
              <button
                type="button"
                onClick={handleMarkAllRead}
                className="text-[10px] text-[#DFBF77] hover:text-white flex items-center gap-1 font-semibold transition-colors"
              >
                <HiCheck className="w-3 h-3" />
                <span>Mark all read</span>
              </button>
            )}
          </div>

          {/* Filter Pills */}
          <div className="flex items-center gap-1.5 px-3 py-2 bg-[#F6F5EF] border-b border-[#E8E6DF] overflow-x-auto text-[11px] font-medium text-gray-600">
            {[
              { id: 'ALL', label: 'All' },
              { id: 'UNREAD', label: `Unread (${unreadCount})` },
              { id: 'TRANSPORT', label: 'Transport' },
              { id: 'ACADEMIC', label: 'Academics' },
              { id: 'FEE', label: 'Fees' }
            ].map(f => (
              <button
                key={f.id}
                type="button"
                onClick={() => setFilter(f.id)}
                className={`px-2.5 py-1 rounded-full whitespace-nowrap transition-all ${
                  filter === f.id
                    ? 'bg-[#0B1B2B] text-white font-semibold shadow-xs'
                    : 'hover:bg-white text-gray-600'
                }`}
              >
                {f.label}
              </button>
            ))}
          </div>

          {/* Notifications List */}
          <div className="max-h-80 overflow-y-auto divide-y divide-gray-100">
            {filteredNotifications.length === 0 ? (
              <div className="p-8 text-center text-gray-400">
                <HiCheckCircle className="w-8 h-8 mx-auto text-emerald-400 mb-2 opacity-60" />
                <p className="text-xs font-medium text-gray-600">All caught up!</p>
                <p className="text-[11px] text-gray-400 mt-0.5">No alerts matching this filter.</p>
              </div>
            ) : (
              filteredNotifications.map(n => (
                <div
                  key={n.id}
                  onClick={() => handleMarkAsRead(n.id, n.link)}
                  className={`p-3.5 hover:bg-[#FAF9F5] transition-colors cursor-pointer flex gap-3 text-left relative ${
                    !n.isRead ? 'bg-amber-50/40' : ''
                  }`}
                >
                  {/* Status dot */}
                  {!n.isRead && (
                    <span className="absolute top-4 left-2 w-1.5 h-1.5 rounded-full bg-[#C5A059]" />
                  )}
                  
                  {/* Category Icon */}
                  <div className="shrink-0 w-8 h-8 rounded-lg bg-gray-50 border border-gray-200 flex items-center justify-center mt-0.5">
                    {getIconForType(n.type, n.severity)}
                  </div>

                  {/* Text Content */}
                  <div className="flex-1 min-w-0 pr-1">
                    <div className="flex items-center justify-between gap-2 mb-1">
                      <h4 className="text-xs font-semibold text-[#0B1B2B] truncate">
                        {n.title}
                      </h4>
                      <span className="text-[10px] text-gray-400 shrink-0 font-mono">
                        {n.createdAt ? new Date(n.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'Now'}
                      </span>
                    </div>
                    <p className="text-[11px] text-gray-600 line-clamp-2 leading-relaxed">
                      {n.message}
                    </p>
                    {n.link && (
                      <span className="inline-block mt-1 text-[10px] font-semibold text-[#8C6837] hover:underline">
                        View details →
                      </span>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Quick Real-Time Simulator Footer */}
          <div className="p-2.5 bg-[#F6F5EF] border-t border-[#E8E6DF] flex items-center justify-between text-[11px]">
            <span className="text-gray-500 font-medium flex items-center gap-1">
              <HiSparkles className="w-3.5 h-3.5 text-[#C5A059]" />
              <span>Test Live Dispatch:</span>
            </span>
            <div className="flex items-center gap-1">
              <button
                type="button"
                disabled={simulating}
                onClick={() => handleSimulateAlert('TRANSPORT')}
                className="px-2 py-0.5 rounded bg-white border border-gray-200 text-gray-700 hover:text-sky-600 hover:border-sky-300 font-medium text-[10px] transition-all"
                title="Simulate Bus Geofence Arrival"
              >
                Bus GPS
              </button>
              <button
                type="button"
                disabled={simulating}
                onClick={() => handleSimulateAlert('ACADEMIC')}
                className="px-2 py-0.5 rounded bg-white border border-gray-200 text-gray-700 hover:text-emerald-600 hover:border-emerald-300 font-medium text-[10px] transition-all"
                title="Simulate Exam Marks Upload"
              >
                Marks
              </button>
              <button
                type="button"
                disabled={simulating}
                onClick={() => handleSimulateAlert('FEE')}
                className="px-2 py-0.5 rounded bg-white border border-gray-200 text-gray-700 hover:text-amber-600 hover:border-amber-300 font-medium text-[10px] transition-all"
                title="Simulate Fee Payment Receipt"
              >
                Fee
              </button>
            </div>
          </div>

        </div>
      )}

      {/* Floating Real-Time Toast Alert */}
      {toastNotification && (
        <div className="fixed bottom-6 right-6 z-50 max-w-sm bg-[#0B1B2B] text-white rounded-xl shadow-2xl border border-[#C5A059]/40 p-4 animate-in slide-in-from-bottom-5 duration-200">
          <div className="flex items-start gap-3">
            <div className="shrink-0 w-8 h-8 rounded-lg bg-[#162E48] border border-[#C5A059]/30 flex items-center justify-center">
              {getIconForType(toastNotification.type, toastNotification.severity)}
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between mb-1">
                <span className="text-[10px] text-[#DFBF77] font-semibold uppercase tracking-wider">
                  Live Alert
                </span>
                <button
                  type="button"
                  onClick={() => setToastNotification(null)}
                  className="text-gray-400 hover:text-white"
                >
                  <HiXMark className="w-3.5 h-3.5" />
                </button>
              </div>
              <h4 className="text-xs font-bold text-white mb-0.5">
                {toastNotification.title}
              </h4>
              <p className="text-[11px] text-gray-300 leading-snug">
                {toastNotification.message}
              </p>
              {toastNotification.link && (
                <button
                  type="button"
                  onClick={() => {
                    navigate(toastNotification.link)
                    setToastNotification(null)
                  }}
                  className="mt-2 text-[10px] font-semibold text-[#DFBF77] hover:underline"
                >
                  Open Page →
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

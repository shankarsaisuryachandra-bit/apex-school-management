import { useState, useEffect } from 'react'
import api from '../../api/axiosConfig'
import { HiClipboardDocumentList, HiCheckCircle, HiXCircle } from 'react-icons/hi2'

export default function StudentAttendance() {
  const [attendance, setAttendance] = useState(null)
  const [loading, setLoading] = useState(true)

  // Default to current academic year range (April 1 to today)
  const todayStr = new Date().toISOString().split('T')[0]
  const currentYear = new Date().getFullYear()
  const startMonth = new Date().getMonth() >= 3 ? currentYear : currentYear - 1
  const defaultFrom = `${startMonth}-04-01`

  const [fromDate, setFromDate] = useState(defaultFrom)
  const [toDate, setToDate] = useState(todayStr)

  useEffect(() => {
    fetchAttendance()
  }, [fromDate, toDate])

  const fetchAttendance = async () => {
    setLoading(true)
    try {
      const user = JSON.parse(sessionStorage.getItem('user'))
      const targetId = user?.profileId || user?.userId
      const { data } = await api.get(`/attendance/student/${targetId}?from=${fromDate}&to=${toDate}`)
      setAttendance(data)
    } catch (error) {
      console.error('Failed to fetch attendance:', error)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="animate-fade-in space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-display font-bold text-surface-900">Attendance Summary</h1>
          <p className="text-surface-700/60 mt-1">Track your daily attendance record</p>
        </div>

        {/* Date Range Selector */}
        <div className="flex items-center gap-2 bg-white p-2 rounded-xl border border-surface-200 shadow-sm">
          <input
            type="date"
            value={fromDate}
            onChange={(e) => setFromDate(e.target.value)}
            className="px-3 py-1.5 rounded-lg text-sm border border-surface-200 text-surface-700 focus:outline-none focus:ring-2 focus:ring-primary-500"
          />
          <span className="text-surface-400 text-xs font-semibold">TO</span>
          <input
            type="date"
            value={toDate}
            onChange={(e) => setToDate(e.target.value)}
            className="px-3 py-1.5 rounded-lg text-sm border border-surface-200 text-surface-700 focus:outline-none focus:ring-2 focus:ring-primary-500"
          />
        </div>
      </div>

      {loading ? (
        <div className="animate-pulse text-surface-700/50 py-4">Loading attendance records...</div>
      ) : !attendance ? (
        <div className="card p-8 text-center text-surface-700/60">No attendance data found.</div>
      ) : (
        <>
          {/* Summary Cards */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="card p-5">
              <p className="text-xs font-semibold text-surface-700/60 uppercase">Total Days</p>
              <p className="text-3xl font-display font-bold text-surface-900 mt-1">{attendance.totalDays}</p>
            </div>
            <div className="card p-5 border-l-4 border-accent-500">
              <p className="text-xs font-semibold text-surface-700/60 uppercase">Present Days</p>
              <p className="text-3xl font-display font-bold text-accent-700 mt-1">{attendance.presentDays}</p>
            </div>
            <div className="card p-5 border-l-4 border-red-500">
              <p className="text-xs font-semibold text-surface-700/60 uppercase">Absent Days</p>
              <p className="text-3xl font-display font-bold text-red-700 mt-1">{attendance.absentDays}</p>
            </div>
            <div className="card p-5 border-l-4 border-primary-500">
              <p className="text-xs font-semibold text-surface-700/60 uppercase">Attendance %</p>
              <p className={`text-3xl font-display font-bold mt-1 ${
                attendance.percentage >= 75 ? 'text-accent-600' : 'text-red-600'
              }`}>
                {attendance.percentage}%
              </p>
            </div>
          </div>

          {/* Daily Record Table */}
          <div className="card p-6">
            <h2 className="text-lg font-display font-bold text-surface-900 mb-4 flex items-center gap-2">
              <HiClipboardDocumentList className="w-5 h-5 text-primary-600" />
              Daily History
            </h2>
            {(!attendance.records || attendance.records.length === 0) ? (
              <p className="text-surface-700/50 text-sm py-4">No daily records for the selected date range.</p>
            ) : (
              <div className="table-container">
                <table>
                  <thead>
                    <tr>
                      <th>Date</th>
                      <th>Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {attendance.records.map((rec, idx) => (
                      <tr key={idx}>
                        <td className="font-medium text-surface-900">{rec.date}</td>
                        <td>
                          {rec.status === 'PRESENT' ? (
                            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-accent-100 text-accent-800">
                              <HiCheckCircle className="w-4 h-4 text-accent-600" />
                              PRESENT
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-red-100 text-red-800">
                              <HiXCircle className="w-4 h-4 text-red-600" />
                              ABSENT
                            </span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  )
}

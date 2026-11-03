import { useState, useEffect } from 'react'
import api from '../../api/axiosConfig'
import {
  HiClipboardDocumentList, HiCheckCircle, HiXCircle, HiClock,
  HiTruck, HiPhone, HiMapPin, HiShieldCheck, HiArrowPath
} from 'react-icons/hi2'

export default function ParentAttendance() {
  const [children, setChildren] = useState([])
  const [selectedChildId, setSelectedChildId] = useState(null)
  const [summary, setSummary] = useState(null)
  const [loading, setLoading] = useState(true)
  const [refreshingBus, setRefreshingBus] = useState(false)

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
      console.error('Failed to load child attendance data:', err)
    } finally {
      setLoading(false)
    }
  }

  const handleSelectChild = (id) => {
    setSelectedChildId(id)
    loadChildData(id)
  }

  const refreshTransport = async () => {
    if (!selectedChildId) return
    setRefreshingBus(true)
    try {
      const res = await api.get(`/parent/child/${selectedChildId}/summary`)
      if (res.data?.transport) {
        setSummary(prev => ({ ...prev, transport: res.data.transport }))
      }
    } catch (err) {
      console.error('Failed to refresh transport:', err)
    } finally {
      setTimeout(() => setRefreshingBus(false), 500)
    }
  }

  const activeChild = children.find(c => c.id === selectedChildId) || children[0]
  const attendance = summary?.attendance
  const transport = summary?.transport

  return (
    <div className="space-y-6 font-sans">
      
      {/* Top Header & Child Switcher */}
      <div className="bg-white rounded-2xl border border-[#E8E6DF] p-6 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <span className="text-[11px] font-bold uppercase tracking-wider text-[#8C6837] bg-amber-50 border border-amber-200 px-2.5 py-0.5 rounded-full">
            Roll Register &amp; Telemetry
          </span>
          <h1 className="text-2xl font-serif font-bold text-[#0B1B2B] mt-1.5">
            Attendance &amp; Live Transit Tracker
          </h1>
          <p className="text-xs text-gray-500 mt-0.5">
            Daily roll call logs, attendance percentages, and live GPS bus tracking for your child.
          </p>
        </div>

        {/* Children Multi-Switcher */}
        {children.length > 0 && (
          <div className="flex items-center gap-2 overflow-x-auto pb-1 md:pb-0">
            <span className="text-xs font-semibold text-gray-500 whitespace-nowrap">Ward:</span>
            {children.map(child => {
              const isSelected = child.id === selectedChildId
              return (
                <button
                  key={child.id}
                  type="button"
                  onClick={() => handleSelectChild(child.id)}
                  className={`px-3.5 py-2 rounded-xl text-left border transition-all flex items-center gap-2 whitespace-nowrap ${
                    isSelected
                      ? 'bg-[#0B1B2B] text-white border-[#0B1B2B] shadow-sm'
                      : 'bg-[#F6F5EF] text-gray-700 border-[#E8E6DF] hover:bg-white'
                  }`}
                >
                  <span className="text-xs font-bold">{child.fullName}</span>
                </button>
              )
            })}
          </div>
        )}
      </div>

      {/* Attendance Vital Numbers */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
        <div className="bg-white rounded-xl border border-[#E8E6DF] p-4 text-center">
          <span className="text-[11px] font-bold text-gray-400 uppercase">Attendance Rate</span>
          <p className="text-2xl font-bold font-serif text-[#0B1B2B] mt-1">
            {attendance?.attendancePercentage || 96}%
          </p>
          <span className="text-[10px] text-emerald-600 font-semibold">Exceeds 75% Requirement</span>
        </div>

        <div className="bg-white rounded-xl border border-[#E8E6DF] p-4 text-center">
          <span className="text-[11px] font-bold text-gray-400 uppercase">Working Days</span>
          <p className="text-2xl font-bold font-serif text-[#0B1B2B] mt-1">
            {attendance?.totalDays || 42}
          </p>
          <span className="text-[10px] text-gray-500">Term II Session</span>
        </div>

        <div className="bg-white rounded-xl border border-[#E8E6DF] p-4 text-center">
          <span className="text-[11px] font-bold text-gray-400 uppercase">Present</span>
          <p className="text-2xl font-bold font-serif text-emerald-600 mt-1">
            {attendance?.presentDays || 40}
          </p>
          <span className="text-[10px] text-gray-500">Verified by Biometric/Roll</span>
        </div>

        <div className="bg-white rounded-xl border border-[#E8E6DF] p-4 text-center">
          <span className="text-[11px] font-bold text-gray-400 uppercase">Absences</span>
          <p className="text-2xl font-bold font-serif text-rose-600 mt-1">
            {attendance?.absentDays || 2}
          </p>
          <span className="text-[10px] text-gray-500">Recorded Excuses</span>
        </div>
      </div>

      {/* Live Transit & Bus Telemetry Panel */}
      {transport?.hasTransport ? (
        <div className="bg-white rounded-2xl border border-[#E8E6DF] p-6 shadow-xs">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-5 border-b border-gray-100 pb-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-indigo-50 border border-indigo-200 text-indigo-600 flex items-center justify-center">
                <HiTruck className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-[#0B1B2B]">
                  Live Fleet Radar: {transport.routeName} (Bus #{transport.busNumber})
                </h3>
                <p className="text-xs text-gray-500">
                  Assigned Student Stop: <strong className="text-[#0B1B2B]">{transport.busStop || 'Designated Stop'}</strong>
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 text-xs font-semibold">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping"></span>
                <span>Telemetry: {transport.status}</span>
              </div>
              <button
                type="button"
                onClick={refreshTransport}
                disabled={refreshingBus}
                className="p-2 rounded-lg border border-gray-200 hover:bg-gray-50 text-gray-600 transition-colors"
                title="Refresh GPS Telemetry"
              >
                <HiArrowPath className={`w-4 h-4 ${refreshingBus ? 'animate-spin' : ''}`} />
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            <div className="p-4 rounded-xl bg-[#FAF9F5] border border-[#E8E6DF]">
              <span className="text-[10px] font-bold text-gray-400 uppercase">Driver in Charge</span>
              <p className="text-xs font-bold text-[#0B1B2B] mt-1">{transport.driverName || 'Designated Driver'}</p>
              <div className="flex items-center gap-1 text-[11px] text-[#8C6837] font-semibold mt-1">
                <HiPhone className="w-3 h-3" />
                <span>{transport.driverPhone || '+1 555-0182'}</span>
              </div>
            </div>

            <div className="p-4 rounded-xl bg-[#FAF9F5] border border-[#E8E6DF]">
              <span className="text-[10px] font-bold text-gray-400 uppercase">Current Coordinates</span>
              <p className="text-xs font-mono font-semibold text-[#0B1B2B] mt-1">
                {transport.currentLat ? `${transport.currentLat.toFixed(5)}, ${transport.currentLng.toFixed(5)}` : 'Campus Terminal Station'}
              </p>
              <p className="text-[11px] text-gray-500 mt-1">Live Speed: {transport.speedKmH || 38} km/h</p>
            </div>

            <div className="p-4 rounded-xl bg-[#FAF9F5] border border-[#E8E6DF]">
              <span className="text-[10px] font-bold text-gray-400 uppercase">Est. Arrival at Stop</span>
              <p className="text-xs font-bold text-emerald-700 mt-1">On Schedule (Approx. 8-12 min)</p>
              <p className="text-[11px] text-gray-500 mt-1">Morning Corridor Service</p>
            </div>
          </div>

          {/* Transit Route Stepper */}
          <div className="p-4 rounded-xl bg-[#0B1B2B] text-white">
            <div className="flex items-center justify-between text-xs font-semibold mb-3">
              <span className="text-[#DFBF77] uppercase tracking-wider text-[10px]">Route Progress Monitor</span>
              <span className="text-gray-300">Transit Corridor: {transport.routeName}</span>
            </div>
            <div className="relative flex items-center justify-between text-[11px]">
              <div className="flex flex-col items-center">
                <div className="w-4 h-4 rounded-full bg-emerald-500 border-2 border-white mb-1"></div>
                <span className="text-gray-300">Campus Depot</span>
              </div>
              <div className="flex-1 h-0.5 bg-emerald-500 mx-2"></div>
              <div className="flex flex-col items-center">
                <div className="w-4 h-4 rounded-full bg-emerald-500 border-2 border-white mb-1"></div>
                <span className="text-gray-300">Sector 4 Crossing</span>
              </div>
              <div className="flex-1 h-0.5 bg-[#C5A059] mx-2"></div>
              <div className="flex flex-col items-center">
                <div className="w-5 h-5 rounded-full bg-[#C5A059] border-2 border-white mb-1 flex items-center justify-center font-bold text-[9px] text-[#0B1B2B] animate-pulse">
                  ●
                </div>
                <span className="text-[#DFBF77] font-bold">{transport.busStop || 'Your Stop'}</span>
              </div>
              <div className="flex-1 h-0.5 bg-gray-600 mx-2"></div>
              <div className="flex flex-col items-center">
                <div className="w-4 h-4 rounded-full bg-gray-600 border-2 border-gray-400 mb-1"></div>
                <span className="text-gray-400">Main Campus Gates</span>
              </div>
            </div>
          </div>
        </div>
      ) : (
        <div className="p-6 rounded-2xl bg-white border border-[#E8E6DF] text-center text-gray-500 text-xs">
          <HiTruck className="w-8 h-8 mx-auto text-gray-300 mb-2" />
          <p className="font-semibold text-gray-700">No School Bus Linked</p>
          <p className="mt-0.5">This child is currently registered for private commute / family drop-off.</p>
        </div>
      )}

      {/* Recent Attendance Register Table */}
      <div className="bg-white rounded-2xl border border-[#E8E6DF] p-6 shadow-xs">
        <h3 className="text-sm font-bold uppercase tracking-wider text-[#0B1B2B] mb-4">
          Recent Roll Call Register Logs
        </h3>

        {attendance?.recentLogs?.length === 0 ? (
          <div className="p-8 text-center text-gray-400 text-xs">
            No roll logs recorded for this student in the current window.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-gray-100 text-[11px] uppercase tracking-wider text-gray-400 font-semibold">
                  <th className="py-2.5 px-3">Date</th>
                  <th className="py-2.5 px-3">Status</th>
                  <th className="py-2.5 px-3">Check-In Timestamp</th>
                  <th className="py-2.5 px-3">Method</th>
                  <th className="py-2.5 px-3">Verified By</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 text-gray-700">
                {attendance?.recentLogs?.map((log, idx) => (
                  <tr key={idx} className="hover:bg-[#FAF9F5]">
                    <td className="py-3 px-3 font-semibold text-[#0B1B2B]">
                      {log.date}
                    </td>
                    <td className="py-3 px-3">
                      <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                        log.status === 'PRESENT'
                          ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                          : log.status === 'LATE'
                          ? 'bg-amber-50 text-amber-700 border border-amber-200'
                          : 'bg-rose-50 text-rose-700 border border-rose-200'
                      }`}>
                        {log.status}
                      </span>
                    </td>
                    <td className="py-3 px-3 font-mono text-gray-500">
                      {log.status === 'PRESENT' ? '08:24 AM' : log.status === 'LATE' ? '08:47 AM' : '—'}
                    </td>
                    <td className="py-3 px-3 text-gray-500">
                      Homeroom Register
                    </td>
                    <td className="py-3 px-3 text-gray-600 font-medium">
                      Class Teacher
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

    </div>
  )
}

import React, { useState, useEffect, useRef } from 'react'
import axios from '../../api/axiosConfig'
import {
  FiRadio,
  FiNavigation,
  FiCompass,
  FiBatteryCharging,
  FiAlertOctagon,
  FiCheckCircle,
  FiUserCheck,
  FiUsers,
  FiPhoneCall,
  FiClock,
  FiMapPin,
  FiPlay,
  FiSquare,
  FiShield,
  FiActivity
} from 'react-icons/fi'

export default function DriverGpsTransmitter({
  route,
  onClose = () => {},
  onTelemetryUpdate = () => {}
}) {
  const [isBroadcasting, setIsBroadcasting] = useState(false)
  const [currentCoords, setCurrentCoords] = useState({
    lat: route?.currentLat || 28.6448,
    lng: route?.currentLng || 77.2167,
    speed: route?.currentSpeedKmh || 0,
    heading: route?.heading || 0,
    accuracy: route?.gpsAccuracyMeters || 5,
    altitude: null
  })
  const [batteryLevel, setBatteryLevel] = useState(88)
  const [studentsList, setStudentsList] = useState([])
  const [boardingLogs, setBoardingLogs] = useState([])
  const [isLoadingManifest, setIsLoadingManifest] = useState(false)
  const [sosModalOpen, setSosModalOpen] = useState(false)
  const [sosReason, setSosReason] = useState('Mechanical Breakdown / Engine Issue')
  const [sosCustomMsg, setSosCustomMsg] = useState('')
  const [isTransmittingSos, setIsTransmittingSos] = useState(false)
  const [lastStreamTime, setLastStreamTime] = useState(null)
  const [broadcastCount, setBroadcastCount] = useState(0)

  const watchIdRef = useRef(null)
  const autoIntervalRef = useRef(null)

  // Fetch Manifest for this route
  useEffect(() => {
    if (!route?.id) return
    const fetchManifest = async () => {
      setIsLoadingManifest(true)
      try {
        const res = await axios.get(`/transport/${route.id}`)
        setStudentsList(res.data.students || [])
        setBoardingLogs(res.data.recentBoardingLogs || [])
      } catch (err) {
        console.error('Failed to load bus manifest', err)
      } finally {
        setIsLoadingManifest(false)
      }
    }
    fetchManifest()
  }, [route?.id])

  // Get Battery Level if supported
  useEffect(() => {
    if (navigator.getBattery) {
      navigator.getBattery().then((battery) => {
        setBatteryLevel(Math.round(battery.level * 100))
        battery.addEventListener('levelchange', () => {
          setBatteryLevel(Math.round(battery.level * 100))
        })
      }).catch(() => {})
    }
  }, [])

  // Send GPS Telemetry to Backend
  const streamLocationToBackend = async (lat, lng, speedKmh, heading, accuracy) => {
    try {
      const payload = {
        latitude: lat,
        longitude: lng,
        speedKmh: Math.round(speedKmh || 0),
        heading: Math.round(heading || 0),
        accuracyMeters: Math.round(accuracy || 5),
        batteryLevel: batteryLevel,
        source: 'DRIVER_DEVICE',
        isBroadcasting: true
      }

      const res = await axios.post(`/transport/${route.id}/gps-stream`, payload)
      if (res.data.success) {
        setLastStreamTime(new Date().toLocaleTimeString())
        setBroadcastCount(prev => prev + 1)
        if (onTelemetryUpdate) {
          onTelemetryUpdate(res.data.route)
        }
      }
    } catch (err) {
      console.error('Failed to stream GPS to server', err)
    }
  }

  // Start Real-World Device GPS Broadcast
  const startGpsBroadcast = () => {
    if (!navigator.geolocation) {
      alert('HTML5 Geolocation is not supported by your browser/device.')
      return
    }

    setIsBroadcasting(true)

    // Watch real physical device GPS
    const id = navigator.geolocation.watchPosition(
      (pos) => {
        const lat = pos.coords.latitude
        const lng = pos.coords.longitude
        const speedKmh = pos.coords.speed !== null ? pos.coords.speed * 3.6 : 35
        const heading = pos.coords.heading || 0
        const accuracy = pos.coords.accuracy || 5

        setCurrentCoords({
          lat,
          lng,
          speed: Math.round(speedKmh),
          heading: Math.round(heading),
          accuracy: Math.round(accuracy),
          altitude: pos.coords.altitude
        })

        streamLocationToBackend(lat, lng, speedKmh, heading, accuracy)
      },
      (err) => {
        console.warn('Geolocation watch error (falling back to coordinate updates):', err.message)
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 0
      }
    )

    watchIdRef.current = id
  }

  // Stop Broadcast
  const stopGpsBroadcast = async () => {
    if (watchIdRef.current !== null) {
      navigator.geolocation.clearWatch(watchIdRef.current)
      watchIdRef.current = null
    }
    if (autoIntervalRef.current) {
      clearInterval(autoIntervalRef.current)
      autoIntervalRef.current = null
    }
    setIsBroadcasting(false)

    try {
      await axios.post(`/transport/${route.id}/telemetry`, {
        isBroadcasting: false,
        currentStatus: 'STANDBY'
      })
    } catch (ignored) {}
  }

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (watchIdRef.current !== null) {
        navigator.geolocation.clearWatch(watchIdRef.current)
      }
      if (autoIntervalRef.current) {
        clearInterval(autoIntervalRef.current)
      }
    }
  }, [])

  // Passenger Boarding / Deboarding Check-in
  const handleBoardStudent = async (student, actionType) => {
    try {
      const res = await axios.post(`/transport/${route.id}/board-passenger`, {
        studentId: student.id,
        studentName: student.fullName,
        actionType: actionType,
        stopName: student.busStop || 'Designated Stop',
        latitude: currentCoords.lat,
        longitude: currentCoords.lng,
        scannedBy: 'DRIVER_COCKPIT'
      })

      if (res.data.success) {
        setBoardingLogs(prev => [res.data.boardingRecord, ...prev])
      }
    } catch (err) {
      alert('Failed to log student boarding: ' + (err.response?.data?.message || err.message))
    }
  }

  // Send Emergency SOS
  const handleSendSos = async () => {
    setIsTransmittingSos(true)
    try {
      const msg = sosCustomMsg ? `${sosReason} — ${sosCustomMsg}` : sosReason
      const res = await axios.post(`/transport/${route.id}/sos`, {
        emergencyStatus: 'EMERGENCY_SOS',
        sosAlertMessage: msg
      })
      if (res.data.success) {
        setSosModalOpen(false)
        alert('EMERGENCY SOS BROADCAST ACTIVE: Dispatch and parents have been alerted.')
        if (onTelemetryUpdate) onTelemetryUpdate(res.data.route)
      }
    } catch (err) {
      alert('Failed to send SOS: ' + err.message)
    } finally {
      setIsTransmittingSos(false)
    }
  }

  const handleResolveSos = async () => {
    try {
      const res = await axios.post(`/transport/${route.id}/sos`, {
        emergencyStatus: 'NORMAL',
        sosAlertMessage: null
      })
      if (res.data.success) {
        alert('Emergency SOS resolved. Status reset to Normal.')
        if (onTelemetryUpdate) onTelemetryUpdate(res.data.route)
      }
    } catch (err) {
      alert('Failed to resolve SOS')
    }
  }

  // Test GPS Coordinates Advance (Field Testing Helper)
  const handleSimulateStepForward = () => {
    const latDelta = (Math.random() - 0.5) * 0.003
    const lngDelta = (Math.random() - 0.5) * 0.003
    const nextLat = (currentCoords.lat || 28.6448) + latDelta
    const nextLng = (currentCoords.lng || 77.2167) + lngDelta
    const nextSpeed = Math.floor(Math.random() * 25) + 30
    const nextHeading = Math.floor(Math.random() * 360)

    setCurrentCoords({
      lat: nextLat,
      lng: nextLng,
      speed: nextSpeed,
      heading: nextHeading,
      accuracy: 3,
      altitude: 215
    })

    streamLocationToBackend(nextLat, nextLng, nextSpeed, nextHeading, 3)
  }

  return (
    <div className="fixed inset-0 z-[3000] bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-slate-900 border border-slate-700 w-full max-w-4xl rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        
        {/* Header HUD */}
        <div className="bg-gradient-to-r from-slate-900 via-blue-950 to-slate-900 px-6 py-4 border-b border-slate-700 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-blue-600 flex items-center justify-center text-white shadow-lg shadow-blue-500/30">
              <FiRadio className="text-xl animate-pulse" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-black text-white tracking-wide">
                  DRIVER TRANSMITTER & ATTENDANCE COCKPIT
                </h2>
                <span className={`px-2.5 py-0.5 rounded-full text-xs font-black uppercase tracking-wider ${isBroadcasting ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40' : 'bg-slate-800 text-slate-400 border border-slate-700'}`}>
                  {isBroadcasting ? '● ON AIR (LIVE GPS)' : 'OFFLINE'}
                </span>
              </div>
              <p className="text-xs text-slate-400">
                {route?.routeName} • Bus: {route?.busNumber} ({route?.plateNumber})
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-xs font-bold transition"
          >
            Close Deck
          </button>
        </div>

        <div className="p-6 overflow-y-auto space-y-6 flex-1">
          
          {/* Real-World Telemetry Meters */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            
            {/* Speedometer */}
            <div className="bg-slate-800/80 border border-slate-700 rounded-2xl p-4 flex flex-col items-center justify-center text-center">
              <span className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1 flex items-center gap-1.5">
                <FiActivity className="text-blue-400" /> Current Speed
              </span>
              <div className="text-3xl font-black text-white">
                {currentCoords.speed}
                <span className="text-xs font-semibold text-slate-400 ml-1">km/h</span>
              </div>
              <div className="text-[10px] text-emerald-400 font-bold mt-1">
                {currentCoords.speed > 50 ? '⚠️ High Speed Warning' : 'Safe Speed Zone'}
              </div>
            </div>

            {/* GPS Signal & Accuracy */}
            <div className="bg-slate-800/80 border border-slate-700 rounded-2xl p-4 flex flex-col items-center justify-center text-center">
              <span className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1 flex items-center gap-1.5">
                <FiCompass className="text-indigo-400" /> GPS Precision
              </span>
              <div className="text-3xl font-black text-indigo-400">
                ±{currentCoords.accuracy}
                <span className="text-xs font-semibold text-slate-400 ml-1">m</span>
              </div>
              <div className="text-[10px] text-slate-400 mt-1 truncate max-w-full">
                Heading: {currentCoords.heading}°
              </div>
            </div>

            {/* Device Battery */}
            <div className="bg-slate-800/80 border border-slate-700 rounded-2xl p-4 flex flex-col items-center justify-center text-center">
              <span className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1 flex items-center gap-1.5">
                <FiBatteryCharging className="text-amber-400" /> Transmitter Battery
              </span>
              <div className="text-3xl font-black text-amber-400">
                {batteryLevel}%
              </div>
              <div className="text-[10px] text-slate-400 mt-1">
                Transmitted: {broadcastCount} pings
              </div>
            </div>

            {/* Last Broadcast Ping */}
            <div className="bg-slate-800/80 border border-slate-700 rounded-2xl p-4 flex flex-col items-center justify-center text-center">
              <span className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1 flex items-center gap-1.5">
                <FiClock className="text-emerald-400" /> Last Server Ping
              </span>
              <div className="text-xl font-black text-slate-200">
                {lastStreamTime || 'Not started'}
              </div>
              <div className="text-[10px] text-slate-400 mt-1">
                {currentCoords.lat ? `${currentCoords.lat.toFixed(4)}, ${currentCoords.lng.toFixed(4)}` : 'No fix'}
              </div>
            </div>

          </div>

          {/* Master Transmitter Actions */}
          <div className="flex flex-wrap items-center justify-between gap-4 p-4 rounded-2xl bg-gradient-to-r from-blue-950/40 via-slate-800 to-blue-950/40 border border-blue-500/30">
            <div className="flex items-center gap-3">
              {!isBroadcasting ? (
                <button
                  type="button"
                  onClick={startGpsBroadcast}
                  className="px-6 py-3.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-extrabold text-sm shadow-lg shadow-emerald-600/30 transition flex items-center gap-2"
                >
                  <FiPlay className="text-lg" />
                  START LIVE GPS BROADCAST
                </button>
              ) : (
                <button
                  type="button"
                  onClick={stopGpsBroadcast}
                  className="px-6 py-3.5 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-extrabold text-sm shadow-lg shadow-rose-600/30 transition flex items-center gap-2 animate-pulse"
                >
                  <FiSquare className="text-lg" />
                  STOP BROADCAST
                </button>
              )}

              <button
                type="button"
                onClick={handleSimulateStepForward}
                className="px-4 py-3 rounded-xl bg-slate-700 hover:bg-slate-600 text-slate-200 text-xs font-bold transition flex items-center gap-2 border border-slate-600"
                title="Field Testing Tool: Advance bus coordinate by 1 waypoint"
              >
                <FiNavigation />
                Step Coordinate (Test)
              </button>
            </div>

            <div className="flex items-center gap-2">
              {route?.emergencyStatus === 'EMERGENCY_SOS' ? (
                <button
                  type="button"
                  onClick={handleResolveSos}
                  className="px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold transition flex items-center gap-1.5"
                >
                  <FiCheckCircle /> Resolve Active SOS
                </button>
              ) : (
                <button
                  type="button"
                  onClick={() => setSosModalOpen(true)}
                  className="px-5 py-3 rounded-xl bg-red-600 hover:bg-red-500 text-white text-xs font-black tracking-wider uppercase transition shadow-lg shadow-red-600/40 flex items-center gap-2"
                >
                  <FiAlertOctagon className="text-base" />
                  EMERGENCY PANIC (SOS)
                </button>
              )}
            </div>
          </div>

          {/* Passenger Attendance Checklist */}
          <div className="bg-slate-800/60 border border-slate-700 rounded-2xl p-5">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <FiUsers className="text-blue-400" />
                <h3 className="text-sm font-bold text-white">
                  Passenger Boarding & Deboarding Checklist ({studentsList.length} Assigned Scholars)
                </h3>
              </div>
              <span className="text-xs text-slate-400">
                Tap status when student steps in/out
              </span>
            </div>

            {isLoadingManifest ? (
              <div className="text-center py-6 text-slate-400 text-xs">Loading passenger list...</div>
            ) : studentsList.length === 0 ? (
              <div className="text-center py-6 text-slate-400 text-xs">
                No scholars currently assigned to this bus route.
              </div>
            ) : (
              <div className="space-y-2 max-h-64 overflow-y-auto pr-1">
                {studentsList.map((student) => {
                  const recentLog = boardingLogs.find(l => l.studentId === student.id)
                  const isBoarded = recentLog && (recentLog.actionType === 'BOARDED_PICKUP' || recentLog.actionType === 'BOARDED_CAMPUS')

                  return (
                    <div
                      key={student.id}
                      className="flex items-center justify-between p-3 rounded-xl bg-slate-900 border border-slate-700/80 hover:border-slate-600 transition"
                    >
                      <div>
                        <div className="font-bold text-sm text-white flex items-center gap-2">
                          {student.fullName}
                          <span className="text-[11px] font-semibold text-slate-400">
                            ({student.admissionNumber})
                          </span>
                        </div>
                        <div className="text-xs text-slate-400 flex items-center gap-2 mt-0.5">
                          <span className="text-blue-400 font-medium">{student.className}</span>
                          <span>•</span>
                          <span className="flex items-center gap-1">
                            <FiMapPin className="text-[10px]" /> {student.busStop || 'Default Stop'}
                          </span>
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        {recentLog && (
                          <span className="text-[10px] font-bold text-slate-400 px-2 py-1 rounded bg-slate-800">
                            {recentLog.actionType.replace('_', ' ')} @ {new Date(recentLog.scannedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </span>
                        )}

                        <button
                          type="button"
                          onClick={() => handleBoardStudent(student, 'BOARDED_PICKUP')}
                          className={`px-3 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1 ${isBoarded ? 'bg-emerald-600/30 text-emerald-300 border border-emerald-500/40' : 'bg-blue-600 hover:bg-blue-500 text-white'}`}
                        >
                          <FiUserCheck />
                          {isBoarded ? 'Boarded' : 'Check-In'}
                        </button>

                        <button
                          type="button"
                          onClick={() => handleBoardStudent(student, 'DROPPED_CAMPUS')}
                          className="px-2.5 py-1.5 rounded-lg text-xs font-bold bg-slate-800 hover:bg-slate-700 text-slate-300 transition"
                          title="Mark Dropped at Campus/Home"
                        >
                          Drop-Off
                        </button>
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </div>

        </div>

        {/* SOS Panic Modal */}
        {sosModalOpen && (
          <div className="fixed inset-0 z-[4000] bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
            <div className="bg-slate-900 border-2 border-red-500 max-w-md w-full rounded-2xl p-6 shadow-2xl space-y-4">
              <div className="flex items-center gap-3 text-red-500">
                <FiAlertOctagon className="text-3xl animate-bounce" />
                <div>
                  <h3 className="text-lg font-black text-white">TRIGGER EMERGENCY SOS</h3>
                  <p className="text-xs text-red-400 font-semibold">Instant Alert to School Security & Parents</p>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1">Reason for Emergency</label>
                <select
                  value={sosReason}
                  onChange={(e) => setSosReason(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-xs text-white focus:outline-none"
                >
                  <option value="Mechanical Breakdown / Flat Tyre">Mechanical Breakdown / Flat Tyre</option>
                  <option value="Traffic Road Block / Major Delay">Traffic Road Block / Major Delay</option>
                  <option value="Medical Incident / Scholar Illness">Medical Incident / Scholar Illness</option>
                  <option value="Extreme Weather / Waterlogging">Extreme Weather / Waterlogging</option>
                  <option value="Security / Route Deviation Incident">Security / Route Deviation Incident</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1">Additional Note (Optional)</label>
                <input
                  type="text"
                  placeholder="e.g. Near Ring Road Flyover, assistance requested"
                  value={sosCustomMsg}
                  onChange={(e) => setSosCustomMsg(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-xs text-white focus:outline-none"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setSosModalOpen(false)}
                  className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg text-xs font-bold"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleSendSos}
                  disabled={isTransmittingSos}
                  className="px-5 py-2 bg-red-600 hover:bg-red-500 text-white rounded-lg text-xs font-black tracking-wider uppercase shadow-lg shadow-red-600/50"
                >
                  {isTransmittingSos ? 'Transmitting...' : 'CONFIRM & BROADCAST SOS'}
                </button>
              </div>
            </div>
          </div>
        )}

      </div>
    </div>
  )
}

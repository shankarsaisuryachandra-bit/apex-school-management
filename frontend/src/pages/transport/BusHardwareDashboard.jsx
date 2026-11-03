import React, { useState, useEffect } from 'react'
import api from '../../api/axiosConfig'
import RealWorldBusMap from '../../components/transport/RealWorldBusMap'
import TravelsRouteTimeline from '../../components/transport/TravelsRouteTimeline'
import {
  FiRadio,
  FiPower,
  FiPlay,
  FiSquare,
  FiCheckCircle,
  FiAlertOctagon,
  FiCompass,
  FiBatteryCharging,
  FiNavigation,
  FiUsers,
  FiClock,
  FiActivity,
  FiShield,
  FiCpu,
  FiMapPin
} from 'react-icons/fi'
import { HiTruck, HiSignal, HiSparkles, HiBell } from 'react-icons/hi2'

export default function BusHardwareDashboard() {
  const [busData, setBusData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [isIgnitionOn, setIsIgnitionOn] = useState(false)
  const [tripStatus, setTripStatus] = useState('IDLE_AT_CAMPUS')
  const [currentSpeed, setCurrentSpeed] = useState(0)
  const [actionLoading, setActionLoading] = useState(false)
  const [sosModalOpen, setSosModalOpen] = useState(false)
  const [sosReason, setSosReason] = useState('Mechanical Breakdown / Flat Tyre')
  const [breadcrumbs, setBreadcrumbs] = useState([])
  const [selectedStop, setSelectedStop] = useState(null)
  const [message, setMessage] = useState(null)

  useEffect(() => {
    fetchBusConsole()
    const interval = setInterval(fetchBusConsoleQuietly, 3000)
    return () => clearInterval(interval)
  }, [])

  const fetchBusConsole = async () => {
    setLoading(true)
    try {
      const res = await api.get('/transport/bus-console')
      if (res.data.hasBus) {
        setBusData(res.data)
        setIsIgnitionOn(Boolean(res.data.route.isIgnitionOn))
        setTripStatus(res.data.route.tripStatus || 'IDLE_AT_CAMPUS')
        setCurrentSpeed(res.data.route.currentSpeedKmh || 0)
        fetchBreadcrumbs(res.data.route.id)
      }
    } catch (err) {
      console.error('Failed to load bus console', err)
    } finally {
      setLoading(false)
    }
  }

  const fetchBusConsoleQuietly = async () => {
    try {
      const res = await api.get('/transport/bus-console')
      if (res.data.hasBus) {
        setBusData(res.data)
        setIsIgnitionOn(Boolean(res.data.route.isIgnitionOn))
        setTripStatus(res.data.route.tripStatus || 'IDLE_AT_CAMPUS')
        setCurrentSpeed(res.data.route.currentSpeedKmh || 0)
      }
    } catch (ignored) {}
  }

  const fetchBreadcrumbs = async (id) => {
    try {
      const res = await api.get(`/transport/${id}/gps-history`)
      setBreadcrumbs(res.data || [])
    } catch (ignored) {}
  }

  // 1. Start Trip at School (Turns on Hardware GPS & Notifies All Students)
  const handleStartTripAtSchool = async () => {
    if (!busData?.route?.id) return
    setActionLoading(true)
    try {
      const res = await api.post(`/transport/${busData.route.id}/trip/start`, {})
      if (res.data.success) {
        setIsIgnitionOn(true)
        setTripStatus('TRIP_STARTED')
        setMessage({
          type: 'success',
          text: `Trip started at school! Instant departure notifications sent to all ${busData.students?.length || 0} assigned scholars.`
        })
        fetchBusConsoleQuietly()
      }
    } catch (err) {
      setMessage({ type: 'error', text: 'Failed to start trip: ' + err.message })
    } finally {
      setActionLoading(false)
    }
  }

  // 2. End / Complete Trip
  const handleEndTrip = async () => {
    if (!busData?.route?.id) return
    setActionLoading(true)
    try {
      const res = await api.post(`/transport/${busData.route.id}/trip/end`, {})
      if (res.data.success) {
        setIsIgnitionOn(false)
        setTripStatus('TRIP_COMPLETED')
        setCurrentSpeed(0)
        setMessage({
          type: 'success',
          text: 'Trip completed safely and bus parked at campus depot. GPS tracker set to standby.'
        })
        fetchBusConsoleQuietly()
      }
    } catch (err) {
      setMessage({ type: 'error', text: 'Failed to end trip: ' + err.message })
    } finally {
      setActionLoading(false)
    }
  }

  // 3. Hardware Ignition Sensor Toggle
  const handleToggleIgnition = async () => {
    if (!busData?.route?.id) return
    const nextIgnition = !isIgnitionOn
    try {
      await api.post(`/transport/${busData.route.id}/gps-stream`, {
        ignition: nextIgnition,
        speedKmh: nextIgnition ? 38 : 0,
        source: 'ON_BUS_HARDWARE_UNIT'
      })
      setIsIgnitionOn(nextIgnition)
      fetchBusConsoleQuietly()
    } catch (err) {
      console.error('Failed to toggle ignition', err)
    }
  }

  // 4. Passenger Boarding Check-in
  const handleBoardStudent = async (student, actionType) => {
    if (!busData?.route?.id) return
    try {
      const res = await api.post(`/transport/${busData.route.id}/board-passenger`, {
        studentId: student.id,
        studentName: student.fullName,
        actionType: actionType,
        stopName: student.busStop || 'Designated Stop',
        latitude: busData.route.currentLat,
        longitude: busData.route.currentLng,
        scannedBy: 'ON_BUS_RFID_UNIT'
      })
      if (res.data.success) {
        fetchBusConsoleQuietly()
      }
    } catch (err) {
      alert('Failed to log student boarding: ' + (err.response?.data?.message || err.message))
    }
  }

  // 5. Trigger SOS Panic Beacon
  const handleSendSos = async () => {
    if (!busData?.route?.id) return
    try {
      await api.post(`/transport/${busData.route.id}/sos`, {
        emergencyStatus: 'EMERGENCY_SOS',
        sosAlertMessage: sosReason
      })
      setSosModalOpen(false)
      alert('EMERGENCY SOS BROADCAST ACTIVE: Dispatch and parents have been alerted.')
      fetchBusConsoleQuietly()
    } catch (err) {
      alert('Failed to send SOS')
    }
  }

  const handleResolveSos = async () => {
    if (!busData?.route?.id) return
    try {
      await api.post(`/transport/${busData.route.id}/sos`, {
        emergencyStatus: 'NORMAL',
        sosAlertMessage: null
      })
      alert('Emergency SOS resolved. Status reset to Normal.')
      fetchBusConsoleQuietly()
    } catch (err) {
      alert('Failed to resolve SOS')
    }
  }

  // 6. Test Move Waypoint (Simulate On-Bus GPS moving)
  const handleSimulateStep = async () => {
    if (!busData?.route?.id) return
    const latDelta = (Math.random() - 0.5) * 0.003
    const lngDelta = (Math.random() - 0.5) * 0.003
    const nextLat = (busData.route.currentLat || 28.6448) + latDelta
    const nextLng = (busData.route.currentLng || 77.2167) + lngDelta
    const nextSpeed = Math.floor(Math.random() * 25) + 30
    const nextHeading = Math.floor(Math.random() * 360)

    try {
      const res = await api.post(`/transport/${busData.route.id}/gps-stream`, {
        latitude: nextLat,
        longitude: nextLng,
        speedKmh: nextSpeed,
        heading: nextHeading,
        accuracyMeters: 3.5,
        ignition: true,
        source: 'ON_BUS_HARDWARE_UNIT'
      })
      if (res.data.success) {
        if (res.data.triggeredAlertsCount > 0) {
          setMessage({
            type: 'success',
            text: `Hardware GPS Ping: ${res.data.triggeredAlertsCount} student proximity alert(s) automatically triggered!`
          })
        }
        fetchBusConsoleQuietly()
        fetchBreadcrumbs(busData.route.id)
      }
    } catch (err) {
      console.error('Step error', err)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 text-white flex items-center justify-center p-6">
        <div className="text-center space-y-3">
          <div className="inline-block h-10 w-10 animate-spin rounded-full border-4 border-blue-500 border-t-transparent"></div>
          <div className="text-sm font-bold text-slate-300">Connecting to On-Bus Hardware Telemetry Unit...</div>
        </div>
      </div>
    )
  }

  const { route, students = [], boardingLogs = [], notifications = [] } = busData || {}

  return (
    <div className="min-h-screen bg-slate-950 text-slate-200 p-6 space-y-6 max-w-7xl mx-auto">
      
      {/* Top Header */}
      <div className="flex flex-wrap items-center justify-between gap-4 bg-slate-900 border border-slate-800 p-6 rounded-3xl shadow-2xl">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-blue-600 to-indigo-600 flex items-center justify-center text-white shadow-xl shadow-blue-500/20">
            <FiCpu className="text-3xl" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-black text-blue-400 tracking-widest uppercase">
                DEPARTMENT OF TRANSPORT • ON-BOARD FLEET CONSOLE
              </span>
              <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase ${isIgnitionOn ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40' : 'bg-slate-800 text-slate-400'}`}>
                {isIgnitionOn ? '● GPS TRACKER ON' : 'TRACKER STANDBY'}
              </span>
            </div>
            <h1 className="text-2xl font-black text-white tracking-tight">
              {route?.busNumber} — {route?.routeName}
            </h1>
            <p className="text-xs text-slate-400 mt-0.5">
              Device ID: <strong className="text-slate-200 font-mono">{route?.hardwareDeviceId || 'GPS-APEX-01'}</strong> • Plate: <strong className="text-slate-200 font-mono">{route?.plateNumber}</strong>
            </p>
          </div>
        </div>

        {/* Master Action Buttons */}
        <div className="flex flex-wrap items-center gap-2">
          {tripStatus !== 'TRIP_STARTED' && tripStatus !== 'IN_TRANSIT' ? (
            <button
              type="button"
              disabled={actionLoading}
              onClick={handleStartTripAtSchool}
              className="px-6 py-3.5 rounded-2xl bg-emerald-600 hover:bg-emerald-500 text-white font-black text-xs uppercase tracking-wider shadow-xl shadow-emerald-600/30 transition flex items-center gap-2 animate-pulse"
            >
              <FiPlay className="text-base" />
              START TRIP AT SCHOOL (NOTIFY ALL SCHOLARS)
            </button>
          ) : (
            <button
              type="button"
              disabled={actionLoading}
              onClick={handleEndTrip}
              className="px-6 py-3.5 rounded-2xl bg-rose-600 hover:bg-rose-500 text-white font-black text-xs uppercase tracking-wider shadow-xl shadow-rose-600/30 transition flex items-center gap-2"
            >
              <FiSquare className="text-base" />
              END TRIP & PARK AT CAMPUS
            </button>
          )}

          <button
            type="button"
            onClick={handleSimulateStep}
            className="px-4 py-3.5 rounded-2xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold border border-slate-700 transition flex items-center gap-1.5"
            title="Simulate Hardware GPS Movement"
          >
            <FiNavigation /> Step Move
          </button>
        </div>
      </div>

      {/* Notification Banner */}
      {message && (
        <div className={`p-4 rounded-2xl flex items-center justify-between text-xs font-bold ${message.type === 'success' ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30' : 'bg-red-500/20 text-red-300 border border-red-500/30'}`}>
          <span>{message.text}</span>
          <button onClick={() => setMessage(null)} className="text-lg leading-none">&times;</button>
        </div>
      )}

      {/* On-Board Hardware Telemetry Sensors */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        
        {/* Ignition Sensor */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 flex flex-col items-center text-center">
          <span className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1 flex items-center gap-1.5">
            <FiPower className={isIgnitionOn ? 'text-emerald-400' : 'text-slate-500'} /> Engine Ignition (ACC)
          </span>
          <div className={`text-2xl font-black ${isIgnitionOn ? 'text-emerald-400' : 'text-slate-400'}`}>
            {isIgnitionOn ? 'IGNITION ON' : 'OFF'}
          </div>
          <button
            type="button"
            onClick={handleToggleIgnition}
            className="mt-2 text-[10px] font-bold text-blue-400 hover:underline"
          >
            Toggle Sensor
          </button>
        </div>

        {/* Speedometer */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 flex flex-col items-center text-center">
          <span className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1 flex items-center gap-1.5">
            <FiActivity className="text-blue-400" /> Vehicle Speed
          </span>
          <div className="text-3xl font-black text-white">
            {currentSpeed}
            <span className="text-xs font-normal text-slate-400 ml-1">km/h</span>
          </div>
          <div className="text-[10px] text-slate-400 mt-1">
            Status: {tripStatus}
          </div>
        </div>

        {/* Satellite Lock Precision */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 flex flex-col items-center text-center">
          <span className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1 flex items-center gap-1.5">
            <FiCompass className="text-indigo-400" /> GPS Lock & Precision
          </span>
          <div className="text-3xl font-black text-indigo-400">
            ±{route?.gpsAccuracyMeters || 4}m
          </div>
          <div className="text-[10px] text-slate-400 mt-1">
            14 Satellites Fix Locked
          </div>
        </div>

        {/* Fuel & OBD-II */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 flex flex-col items-center text-center">
          <span className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1 flex items-center gap-1.5">
            <FiBatteryCharging className="text-amber-400" /> Fuel Level
          </span>
          <div className="text-3xl font-black text-amber-400">
            {route?.fuelLevelPercent || 85}%
          </div>
          <div className="text-[10px] text-slate-400 mt-1">
            Chassis Voltage: 24.2V
          </div>
        </div>

      </div>

      {/* Travels-Style Route Corridor & Sequential Stops Stepper */}
      <TravelsRouteTimeline
        route={route}
        selectedStopName={selectedStop?.name}
        onSelectStop={(stop) => setSelectedStop(stop)}
        currentSpeed={currentSpeed}
      />

      {/* Real-World OpenStreetMap Cartography */}
      <RealWorldBusMap
        routes={route ? [route] : []}
        selectedRouteId={route?.id}
        showAllFleet={false}
        breadcrumbs={breadcrumbs}
        height="480px"
      />

      {/* Two Column Section: Passenger Boarding Scanner & Notifications Broadcast Stream */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* Passenger Boarding RFID/Manual Scanner */}
        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-xl space-y-4">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <div className="flex items-center gap-2">
              <FiUsers className="text-blue-400 text-lg" />
              <h3 className="text-sm font-black text-white uppercase tracking-wider">
                Passenger Boarding Scanner ({students.length} Scholars)
              </h3>
            </div>
            <span className="text-xs text-slate-400 font-bold">
              Tap when scholar steps in/out
            </span>
          </div>

          <div className="space-y-2 max-h-80 overflow-y-auto pr-1">
            {students.map((student) => {
              const recentLog = boardingLogs.find(l => l.studentId === student.id)
              const isBoarded = recentLog && (recentLog.actionType === 'BOARDED_PICKUP' || recentLog.actionType === 'BOARDED_CAMPUS')

              return (
                <div
                  key={student.id}
                  className="flex items-center justify-between p-3 rounded-2xl bg-slate-800/70 border border-slate-700/60 hover:border-slate-600 transition"
                >
                  <div>
                    <div className="font-bold text-xs text-white flex items-center gap-2">
                      {student.fullName}
                      <span className="text-[10px] text-slate-400 font-mono">({student.admissionNumber})</span>
                    </div>
                    <div className="text-[11px] text-slate-400 flex items-center gap-1.5 mt-0.5">
                      <FiMapPin className="text-[10px] text-amber-400" />
                      <span>{student.busStop || 'Default Stop'}</span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => handleBoardStudent(student, 'BOARDED_PICKUP')}
                      className={`px-3 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1 ${
                        isBoarded
                          ? 'bg-emerald-600/30 text-emerald-300 border border-emerald-500/40'
                          : 'bg-blue-600 hover:bg-blue-500 text-white'
                      }`}
                    >
                      <FiCheckCircle /> {isBoarded ? 'Boarded' : 'Check-In'}
                    </button>

                    <button
                      type="button"
                      onClick={() => handleBoardStudent(student, 'DROPPED_CAMPUS')}
                      className="px-2.5 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold"
                    >
                      Drop
                    </button>
                  </div>
                </div>
              )
            })}
          </div>
        </div>

        {/* Real-time Notifications & Proximity Alerts Stream */}
        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-xl space-y-4">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <div className="flex items-center gap-2">
              <HiBell className="text-amber-400 text-lg" />
              <h3 className="text-sm font-black text-white uppercase tracking-wider">
                Automated Student Notification Feed
              </h3>
            </div>
            <span className="text-xs text-slate-400">
              Trip Start & 10-Min Proximity Alerts
            </span>
          </div>

          <div className="space-y-2 max-h-80 overflow-y-auto pr-1">
            {notifications.map((n) => (
              <div
                key={n.id}
                className="p-3.5 rounded-2xl bg-slate-800/60 border border-slate-700/60 space-y-1 text-xs"
              >
                <div className="flex items-center justify-between font-bold">
                  <span className={n.notificationType === 'PROXIMITY_10_MIN_AWAY' ? 'text-amber-300' : 'text-blue-400'}>
                    {n.title}
                  </span>
                  <span className="text-[10px] text-slate-400 font-mono">
                    {new Date(n.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>
                <p className="text-slate-300 text-[11px] leading-relaxed">{n.message}</p>
              </div>
            ))}
            {notifications.length === 0 && (
              <div className="text-center py-8 text-slate-500 text-xs">
                No notifications broadcasted yet today. Starting trip will broadcast alerts to all scholars.
              </div>
            )}
          </div>
        </div>

      </div>

    </div>
  )
}

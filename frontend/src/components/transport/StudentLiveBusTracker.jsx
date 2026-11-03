import React, { useState, useEffect } from 'react'
import axios from '../../api/axiosConfig'
import RealWorldBusMap from './RealWorldBusMap'
import TravelsRouteTimeline from './TravelsRouteTimeline'
import {
  FiNavigation,
  FiMapPin,
  FiClock,
  FiPhoneCall,
  FiShield,
  FiCheckCircle,
  FiAlertCircle,
  FiActivity,
  FiUserCheck,
  FiCompass,
  FiBell,
  FiCpu,
  FiRadio
} from 'react-icons/fi'

export default function StudentLiveBusTracker() {
  const [liveData, setLiveData] = useState(null)
  const [notifications, setNotifications] = useState([])
  const [loading, setLoading] = useState(true)
  const [lastRefreshed, setLastRefreshed] = useState(new Date())

  const fetchLiveTracking = async () => {
    try {
      const [trackRes, notifRes] = await Promise.all([
        axios.get('/transport/my-bus/live'),
        axios.get('/transport/my-notifications').catch(() => ({ data: [] }))
      ])
      setLiveData(trackRes.data)
      setNotifications(notifRes.data || [])
      setLastRefreshed(new Date())
    } catch (err) {
      console.error('Failed to fetch live bus status', err)
    } finally {
      setLoading(false)
    }
  }

  // Poll live telemetry every 3 seconds for real-time tracking
  useEffect(() => {
    fetchLiveTracking()
    const interval = setInterval(fetchLiveTracking, 3000)
    return () => clearInterval(interval)
  }, [])

  if (loading) {
    return (
      <div className="p-8 text-center bg-slate-900 rounded-3xl border border-slate-800">
        <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-blue-500 border-t-transparent mb-3"></div>
        <div className="text-slate-300 font-bold text-sm">Connecting to On-Board Hardware GPS Receiver...</div>
      </div>
    )
  }

  if (!liveData || !liveData.assigned) {
    return (
      <div className="p-8 text-center bg-slate-900 rounded-3xl border border-slate-800">
        <FiMapPin className="text-4xl text-slate-500 mx-auto mb-3" />
        <h3 className="text-base font-bold text-white mb-1">No Transport Route Assigned</h3>
        <p className="text-xs text-slate-400 max-w-sm mx-auto">
          You are currently not enrolled in the Apex Academy School Fleet Service. Contact the Transport Directorate for route registration.
        </p>
      </div>
    )
  }

  const { route, studentName, busStop, distanceToStopMeters, etaMinutes, isApproaching, lastBoarding } = liveData
  const isSos = route?.emergencyStatus === 'EMERGENCY_SOS'

  // Latest 10-minute proximity notification
  const latest10MinAlert = notifications.find(n => n.type === 'PROXIMITY_10_MIN_AWAY')
  // Latest trip started notification
  const latestTripStartedAlert = notifications.find(n => n.type === 'TRIP_STARTED_AT_SCHOOL')

  return (
    <div className="space-y-6">

      {/* Real-time Hardware GPS Tracker Status Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-slate-850 to-slate-900 border border-slate-700/80 rounded-2xl p-4 flex flex-wrap items-center justify-between gap-4 shadow-xl">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-blue-500/20 border border-blue-500/40 flex items-center justify-center text-blue-400">
            <FiCpu className="text-xl animate-pulse" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-black uppercase tracking-wider text-slate-400">
                On-Board Hardware GPS Tracker
              </span>
              <span className="text-[10px] px-2 py-0.5 rounded-full font-bold bg-blue-900/50 text-blue-300 border border-blue-700">
                {route?.hardwareDeviceId || 'GPS-APEX-01'}
              </span>
            </div>
            <div className="text-sm font-bold text-white flex items-center gap-2">
              <span>{route?.busNumber} ({route?.routeName})</span>
              <span className={`inline-flex items-center gap-1 text-[11px] font-bold px-2 py-0.5 rounded-full ${
                route?.isIgnitionOn
                  ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                  : 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
              }`}>
                <span className={`w-1.5 h-1.5 rounded-full ${route?.isIgnitionOn ? 'bg-emerald-400 animate-ping' : 'bg-amber-400'}`}></span>
                {route?.isIgnitionOn ? 'Engine Ignition: ON (Broadcasting GPS)' : 'Ignition: OFF (Standby)'}
              </span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className="text-right hidden sm:block">
            <div className="text-[10px] font-bold uppercase text-slate-400">Assigned Boarding Point</div>
            <div className="text-xs font-black text-amber-400 flex items-center justify-end gap-1">
              <FiMapPin /> {busStop || 'Designated Stop'}
            </div>
          </div>
          <div className="px-3 py-1.5 rounded-xl bg-slate-800 border border-slate-700 flex items-center gap-2 text-xs font-bold text-emerald-400">
            <FiRadio className="animate-spin text-sm" /> Live Telemetry
          </div>
        </div>
      </div>
      
      {/* Dynamic Alert Banners */}
      {isSos ? (
        <div className="p-4 rounded-2xl bg-red-600/20 border-2 border-red-500 flex items-center gap-4 animate-pulse shadow-lg shadow-red-900/30">
          <FiAlertCircle className="text-3xl text-red-500 shrink-0" />
          <div>
            <div className="text-sm font-black text-white">EMERGENCY ADVISORY ACTIVE</div>
            <div className="text-xs text-red-300 font-medium">
              {route.sosAlertMessage || 'School fleet management is attending to an incident. Operations team is monitoring.'}
            </div>
          </div>
        </div>
      ) : null}

      {/* 10-Minute Proximity Notification Banner */}
      {latest10MinAlert && (
        <div className="p-4 rounded-2xl bg-gradient-to-r from-amber-500/20 via-orange-500/20 to-amber-500/20 border-2 border-amber-400 flex items-center gap-4 animate-pulse shadow-lg shadow-amber-900/30">
          <div className="w-11 h-11 rounded-xl bg-amber-500 flex items-center justify-center text-slate-950 font-black text-2xl shrink-0 shadow-md">
            🔔
          </div>
          <div className="flex-1">
            <div className="flex items-center justify-between">
              <span className="text-xs font-black text-amber-300 uppercase tracking-wide">
                10-MINUTE PROXIMITY ALERT
              </span>
              <span className="text-[10px] text-amber-300/80 font-bold">
                {new Date(latest10MinAlert.sentAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </span>
            </div>
            <div className="text-sm font-black text-white mt-0.5">
              {latest10MinAlert.title}
            </div>
            <div className="text-xs text-slate-200 mt-0.5">
              {latest10MinAlert.message}
            </div>
          </div>
        </div>
      )}

      {/* Trip Started At School Notification Banner */}
      {latestTripStartedAlert && !latest10MinAlert && (
        <div className="p-4 rounded-2xl bg-blue-500/15 border border-blue-500/40 flex items-center gap-4 shadow-lg shadow-blue-900/20">
          <div className="w-10 h-10 rounded-xl bg-blue-500 flex items-center justify-center text-slate-950 font-black text-xl shrink-0">
            🚌
          </div>
          <div className="flex-1">
            <div className="flex items-center justify-between">
              <span className="text-xs font-black text-blue-300 uppercase tracking-wide">
                DEPARTURE NOTICE
              </span>
              <span className="text-[10px] text-blue-300/80 font-bold">
                {new Date(latestTripStartedAlert.sentAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </span>
            </div>
            <div className="text-sm font-black text-white mt-0.5">
              {latestTripStartedAlert.title}
            </div>
            <div className="text-xs text-slate-300 mt-0.5">
              {latestTripStartedAlert.message}
            </div>
          </div>
        </div>
      )}

      {/* Live Distance & ETA Stat Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 flex flex-col items-center text-center shadow-md">
          <span className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1 flex items-center gap-1.5">
            <FiClock className="text-blue-400" /> Estimated Arrival
          </span>
          <div className="text-3xl font-black text-white">
            {etaMinutes}
            <span className="text-xs font-semibold text-slate-400 ml-1">mins</span>
          </div>
          <div className="text-[10px] text-blue-400 font-bold mt-1">
            Next Stop: {route?.nextStop || 'In Transit'}
          </div>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 flex flex-col items-center text-center shadow-md">
          <span className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1 flex items-center gap-1.5">
            <FiNavigation className="text-emerald-400" /> Distance to Stop
          </span>
          <div className="text-3xl font-black text-emerald-400">
            {distanceToStopMeters >= 0 ? (
              distanceToStopMeters > 1000
                ? `${(distanceToStopMeters / 1000).toFixed(1)} km`
                : `${Math.round(distanceToStopMeters)} m`
            ) : 'Locating...'}
          </div>
          <div className="text-[10px] text-slate-400 mt-1 truncate max-w-full font-medium">
            Stop: {busStop || 'Main Gate'}
          </div>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 flex flex-col items-center text-center shadow-md">
          <span className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1 flex items-center gap-1.5">
            <FiActivity className="text-indigo-400" /> Vehicle Speed
          </span>
          <div className="text-3xl font-black text-white">
            {route?.currentSpeedKmh || 0}
            <span className="text-xs font-semibold text-slate-400 ml-1">km/h</span>
          </div>
          <div className="text-[10px] text-slate-400 mt-1">
            Trip Status: {route?.tripStatus || route?.currentStatus || 'IN_TRANSIT'}
          </div>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 flex flex-col items-center text-center shadow-md">
          <span className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1 flex items-center gap-1.5">
            <FiUserCheck className="text-amber-400" /> Boarding Status
          </span>
          <div className="text-base font-bold text-white truncate max-w-full mt-1">
            {lastBoarding ? lastBoarding.actionType.replace('_', ' ') : 'Scheduled'}
          </div>
          <div className="text-[10px] text-slate-400 mt-1">
            {lastBoarding ? `At ${new Date(lastBoarding.scannedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}` : 'Pending Boarding'}
          </div>
        </div>

      </div>

      {/* Real-World Leaflet Map */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <span className="relative flex h-2.5 w-2.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500"></span>
            </span>
            <span className="text-xs font-black text-slate-300 uppercase tracking-wider">
              REAL-TIME HIGH PRECISION GPS TRACKER
            </span>
          </div>
          <span className="text-[11px] text-slate-400">
            Updated {lastRefreshed.toLocaleTimeString()}
          </span>
        </div>

        <RealWorldBusMap
          routes={route ? [route] : []}
          selectedRouteId={route?.id}
          showAllFleet={false}
          height="460px"
        />
      </div>

      {/* Travels-Style Route Timeline Corridor */}
      {route && (
        <TravelsRouteTimeline
          route={route}
          studentBoardingStop={busStop}
        />
      )}

      {/* Driver & Conductor Hotline Bar */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-blue-600/20 border border-blue-500/30 flex items-center justify-center text-blue-400">
            <FiShield className="text-xl" />
          </div>
          <div>
            <div className="text-xs font-bold text-slate-400">Designated Transport Crew</div>
            <div className="text-sm font-black text-white">
              Capt. {route?.driverName} & {route?.conductorName}
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <a
            href={`tel:${route?.driverPhone}`}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-bold transition flex items-center gap-1.5 shadow-lg shadow-blue-600/30"
          >
            <FiPhoneCall /> Call Driver ({route?.driverPhone})
          </a>
          {route?.conductorPhone && (
            <a
              href={`tel:${route?.conductorPhone}`}
              className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl text-xs font-bold transition flex items-center gap-1.5"
            >
              <FiPhoneCall /> Conductor
            </a>
          )}
        </div>
      </div>

    </div>
  )
}

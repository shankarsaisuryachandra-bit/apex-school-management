import React, { useState, useEffect, useRef } from 'react'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'
import {
  FiPlay,
  FiPause,
  FiRotateCcw,
  FiX,
  FiCompass,
  FiActivity,
  FiClock,
  FiMapPin,
  FiUsers,
  FiCheckCircle,
  FiFastForward,
  FiNavigation,
  FiLayers
} from 'react-icons/fi'
import { fetchRoadGeometry, calculateBearing } from '../../utils/osrmRouting'
import api from '../../api/axiosConfig'

// Animated Bus Pin Generator for Playback
const createPlaybackBusIcon = (busNumber, heading = 0, isAtStop = false) => {
  const pulseColor = isAtStop ? '#f59e0b' : '#38bdf8'
  const html = `
    <div style="position: relative; width: 46px; height: 46px; display: flex; align-items: center; justify-content: center;">
      <div style="
        position: absolute;
        width: 46px;
        height: 46px;
        border-radius: 50%;
        background: ${pulseColor}25;
        border: 2px solid ${pulseColor}aa;
        animation: ping 1.5s cubic-bezier(0, 0, 0.2, 1) infinite;
      "></div>
      <div style="
        position: relative;
        width: 34px;
        height: 34px;
        background: #0284c7;
        border-radius: 50%;
        border: 3px solid #ffffff;
        box-shadow: 0 4px 14px rgba(0,0,0,0.5);
        display: flex;
        align-items: center;
        justify-content: center;
        color: white;
        font-weight: 900;
        transform: rotate(${heading}deg);
        transition: transform 0.2s ease-out;
      ">
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
          <rect x="3" y="3" width="18" height="16" rx="2"></rect>
          <path d="M4 11h16"></path>
          <path d="M8 19v2"></path>
          <path d="M16 19v2"></path>
          <circle cx="7.5" cy="15.5" r="1.5" fill="currentColor"></circle>
          <circle cx="16.5" cy="15.5" r="1.5" fill="currentColor"></circle>
        </svg>
      </div>
      <div style="
        position: absolute;
        bottom: -20px;
        background: rgba(15, 23, 42, 0.95);
        color: #38bdf8;
        padding: 2px 7px;
        border-radius: 6px;
        font-size: 10px;
        font-weight: 800;
        white-space: nowrap;
        border: 1px solid rgba(56, 189, 248, 0.4);
        box-shadow: 0 2px 8px rgba(0,0,0,0.4);
      ">
        ${busNumber}
      </div>
    </div>
  `
  return L.divIcon({
    html,
    className: 'playback-bus-marker',
    iconSize: [46, 46],
    iconAnchor: [23, 23],
    popupAnchor: [0, -23]
  })
}

const createStopBadgeIcon = (idx, name, isPassed = false, isCurrent = false) => {
  const bg = isCurrent ? '#f59e0b' : isPassed ? '#10b981' : '#6366f1'
  const html = `
    <div style="position: relative; display: flex; flex-direction: column; align-items: center;">
      <div style="
        width: 28px;
        height: 28px;
        background: ${bg};
        border: 2px solid #ffffff;
        border-radius: 50%;
        color: white;
        font-size: 12px;
        font-weight: 900;
        display: flex;
        align-items: center;
        justify-content: center;
        box-shadow: 0 3px 10px rgba(0,0,0,0.4);
        ${isCurrent ? 'transform: scale(1.2); transition: transform 0.3s;' : ''}
      ">
        ${isPassed && !isCurrent ? '✓' : idx + 1}
      </div>
      <div style="
        background: rgba(15, 23, 42, 0.9);
        color: #f8fafc;
        padding: 1px 6px;
        border-radius: 4px;
        font-size: 9px;
        font-weight: 700;
        margin-top: 3px;
        white-space: nowrap;
        border: 1px solid rgba(255,255,255,0.15);
      ">
        ${name}
      </div>
    </div>
  `
  return L.divIcon({
    html,
    className: 'playback-stop-marker',
    iconSize: [30, 42],
    iconAnchor: [15, 14]
  })
}

export default function RoutePlaybackModal({
  route,
  onClose = () => {}
}) {
  const mapContainerRef = useRef(null)
  const mapRef = useRef(null)
  const busMarkerRef = useRef(null)
  const stopMarkersRef = useRef([])
  const roadPolylineRef = useRef(null)
  const glowPolylineRef = useRef(null)
  const passedPolylineRef = useRef(null)

  const [isPlaying, setIsPlaying] = useState(false)
  const [playbackSpeed, setPlaybackSpeed] = useState(2) // 1x, 2x, 5x, 10x
  const [currentProgressIndex, setCurrentProgressIndex] = useState(0)
  const [roadCoordinates, setRoadCoordinates] = useState([])
  const [roadSteps, setRoadSteps] = useState([])
  const [totalDistanceKm, setTotalDistanceKm] = useState(0)
  const [totalDurationMin, setTotalDurationMin] = useState(0)
  const [isLoadingRoad, setIsLoadingRoad] = useState(true)
  const [mapLayer, setMapLayer] = useState('dark') // dark, streets, satellite
  const [students, setStudents] = useState([])

  const animFrameRef = useRef(null)
  const lastTimeRef = useRef(0)

  // Parse Stops
  const stops = React.useMemo(() => {
    if (!route || !route.stopsJson) return []
    try {
      return typeof route.stopsJson === 'string' ? JSON.parse(route.stopsJson) : route.stopsJson || []
    } catch (e) {
      return []
    }
  }, [route?.stopsJson])

  // Fetch Route Details for manifest
  useEffect(() => {
    if (!route?.id) return
    api.get(`/transport/${route.id}`)
      .then(res => setStudents(res.data.students || []))
      .catch(() => {})
  }, [route?.id])

  // Fetch OSRM Road Geometry
  useEffect(() => {
    let isMounted = true
    setIsLoadingRoad(true)

    fetchRoadGeometry(stops).then(res => {
      if (!isMounted) return
      setRoadCoordinates(res.coordinates || [])
      setTotalDistanceKm(res.distanceKm || 0)
      setTotalDurationMin(res.durationMin || 0)
      setRoadSteps(res.steps || [])
      setIsLoadingRoad(false)
    })

    return () => {
      isMounted = false
    }
  }, [stops])

  // Initialize Map
  useEffect(() => {
    if (!mapContainerRef.current) return

    const initialCenter = stops.length > 0 && stops[0].lat
      ? [Number(stops[0].lat), Number(stops[0].lng)]
      : [28.6139, 77.2090]

    const map = L.map(mapContainerRef.current, {
      center: initialCenter,
      zoom: 14,
      zoomControl: true
    })

    const getTileUrl = layer => {
      switch (layer) {
        case 'satellite':
          return 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}'
        case 'streets':
          return 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png'
        case 'dark':
        default:
          return 'https://server.arcgisonline.com/ArcGIS/rest/services/Canvas/World_Dark_Gray_Base/MapServer/tile/{z}/{y}/{x}'
      }
    }

    const tileLayer = L.tileLayer(getTileUrl(mapLayer), {
      attribution: '&copy; OpenStreetMap contributors, Esri',
      maxZoom: 19
    }).addTo(map)

    mapRef.current = { map, tileLayer }

    return () => {
      map.remove()
      mapRef.current = null
    }
  }, [])

  // Switch Tile Layer
  useEffect(() => {
    if (!mapRef.current) return
    const { map, tileLayer } = mapRef.current

    const getTileUrl = layer => {
      switch (layer) {
        case 'satellite':
          return 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}'
        case 'streets':
          return 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png'
        case 'dark':
        default:
          return 'https://server.arcgisonline.com/ArcGIS/rest/services/Canvas/World_Dark_Gray_Base/MapServer/tile/{z}/{y}/{x}'
      }
    }

    map.removeLayer(tileLayer)
    mapRef.current.tileLayer = L.tileLayer(getTileUrl(mapLayer), {
      attribution: '&copy; OpenStreetMap contributors, Esri',
      maxZoom: 19
    }).addTo(map)
  }, [mapLayer])

  // Draw Stops & Road Geometry
  useEffect(() => {
    if (!mapRef.current || roadCoordinates.length === 0) return
    const { map } = mapRef.current

    // Clear previous elements
    stopMarkersRef.current.forEach(m => map.removeLayer(m))
    stopMarkersRef.current = []

    if (roadPolylineRef.current) map.removeLayer(roadPolylineRef.current)
    if (glowPolylineRef.current) map.removeLayer(glowPolylineRef.current)
    if (passedPolylineRef.current) map.removeLayer(passedPolylineRef.current)
    if (busMarkerRef.current) map.removeLayer(busMarkerRef.current)

    // 1. Draw Road Glow
    glowPolylineRef.current = L.polyline(roadCoordinates, {
      color: '#0284c7',
      weight: 8,
      opacity: 0.35,
      lineCap: 'round',
      lineJoin: 'round'
    }).addTo(map)

    // 2. Draw Road Core Line
    roadPolylineRef.current = L.polyline(roadCoordinates, {
      color: '#38bdf8',
      weight: 4,
      opacity: 0.85,
      lineJoin: 'round'
    }).addTo(map)

    // 3. Draw Passed Trail (dynamic)
    passedPolylineRef.current = L.polyline([], {
      color: '#10b981',
      weight: 5,
      opacity: 0.95,
      lineJoin: 'round'
    }).addTo(map)

    // 4. Draw Stops Badges
    stops.forEach((stop, idx) => {
      const sLat = Number(stop.lat)
      const sLng = Number(stop.lng)
      const stopIcon = createStopBadgeIcon(idx, stop.name, false, idx === 0)
      const m = L.marker([sLat, sLng], { icon: stopIcon, zIndexOffset: 900 }).addTo(map)
      stopMarkersRef.current.push(m)
    })

    // 5. Draw Animated Bus Marker
    const startCoord = roadCoordinates[0]
    const nextCoord = roadCoordinates[1] || startCoord
    const initialHeading = calculateBearing(startCoord[0], startCoord[1], nextCoord[0], nextCoord[1])
    const busIcon = createPlaybackBusIcon(route?.busNumber || 'BUS-05', initialHeading, true)

    busMarkerRef.current = L.marker(startCoord, {
      icon: busIcon,
      zIndexOffset: 1200
    }).addTo(map)

    // 6. Fit Bounds on Road Path
    const bounds = L.latLngBounds(roadCoordinates)
    map.fitBounds(bounds, { padding: [50, 50], maxZoom: 15 })

  }, [roadCoordinates, stops])

  // Playback Loop
  useEffect(() => {
    if (!isPlaying || roadCoordinates.length < 2) return

    let lastTimestamp = performance.now()
    let currentIndex = currentProgressIndex

    const step = (timestamp) => {
      const delta = timestamp - lastTimestamp

      // Advance index based on speed multiplier (e.g. 1 index per ~150ms / playbackSpeed)
      const stepTimeMs = 180 / playbackSpeed

      if (delta >= stepTimeMs) {
        currentIndex += 1
        lastTimestamp = timestamp

        if (currentIndex >= roadCoordinates.length - 1) {
          currentIndex = roadCoordinates.length - 1
          setIsPlaying(false)
        }

        setCurrentProgressIndex(currentIndex)
        updateBusPosition(currentIndex)
      }

      if (currentIndex < roadCoordinates.length - 1 && isPlaying) {
        animFrameRef.current = requestAnimationFrame(step)
      }
    }

    animFrameRef.current = requestAnimationFrame(step)

    return () => {
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current)
    }
  }, [isPlaying, roadCoordinates, playbackSpeed])

  // Update Bus & Map Position
  const updateBusPosition = (index) => {
    if (!busMarkerRef.current || !roadCoordinates[index]) return
    const currentCoord = roadCoordinates[index]
    const nextCoord = roadCoordinates[Math.min(index + 1, roadCoordinates.length - 1)] || currentCoord
    const heading = calculateBearing(currentCoord[0], currentCoord[1], nextCoord[0], nextCoord[1])

    // Find if at or near any stop
    const nearStopIdx = stops.findIndex(s => {
      const dLat = Math.abs(Number(s.lat) - currentCoord[0])
      const dLng = Math.abs(Number(s.lng) - currentCoord[1])
      return dLat < 0.0015 && dLng < 0.0015
    })

    const isAtStop = nearStopIdx !== -1
    const busIcon = createPlaybackBusIcon(route?.busNumber || 'BUS-05', heading, isAtStop)

    busMarkerRef.current.setLatLng(currentCoord)
    busMarkerRef.current.setIcon(busIcon)

    // Update Passed Trail
    if (passedPolylineRef.current) {
      passedPolylineRef.current.setLatLngs(roadCoordinates.slice(0, index + 1))
    }

    // Update Stop Marker icons (passed vs current)
    stopMarkersRef.current.forEach((marker, idx) => {
      const isPassed = index > (idx / (stops.length - 1)) * roadCoordinates.length
      const isCurrent = nearStopIdx === idx
      marker.setIcon(createStopBadgeIcon(idx, stops[idx].name, isPassed, isCurrent))
    })

    // Pan camera with bus
    if (mapRef.current && isPlaying) {
      mapRef.current.map.panTo(currentCoord, { animate: true, duration: 0.2 })
    }
  }

  // Scrubber change
  const handleSeek = (e) => {
    const val = parseInt(e.target.value, 10)
    setCurrentProgressIndex(val)
    updateBusPosition(val)
  }

  const handleReset = () => {
    setIsPlaying(false)
    setCurrentProgressIndex(0)
    updateBusPosition(0)
    if (mapRef.current && roadCoordinates.length > 0) {
      mapRef.current.map.panTo(roadCoordinates[0], { animate: true })
    }
  }

  // Calculations for HUD
  const progressPercent = roadCoordinates.length > 1
    ? Math.round((currentProgressIndex / (roadCoordinates.length - 1)) * 100)
    : 0

  const elapsedKm = roadCoordinates.length > 1
    ? ((currentProgressIndex / (roadCoordinates.length - 1)) * totalDistanceKm).toFixed(1)
    : 0

  const remainingKm = Math.max(0, (totalDistanceKm - elapsedKm)).toFixed(1)

  const simulatedSpeed = isPlaying
    ? Math.floor(32 + Math.sin(currentProgressIndex * 0.3) * 12)
    : 0

  return (
    <div className="fixed inset-0 z-[5000] bg-black/90 backdrop-blur-md flex items-center justify-center p-3 sm:p-5">
      <div className="bg-slate-900 border border-slate-700 w-full max-w-6xl h-[92vh] rounded-3xl shadow-2xl overflow-hidden flex flex-col relative">
        
        {/* Header HUD */}
        <div className="px-6 py-4 bg-slate-950/80 border-b border-slate-800 flex flex-wrap items-center justify-between gap-4 z-20">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-blue-600 flex items-center justify-center text-white shadow-lg shadow-blue-500/30">
              <FiNavigation className="text-xl animate-pulse" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-black text-white tracking-wide">
                  TRIP SIMULATION & ROUTE REPLAY
                </h2>
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-blue-900/60 text-blue-300 border border-blue-700">
                  🛣️ OSRM Road Geometry
                </span>
              </div>
              <p className="text-xs text-slate-400">
                {route?.routeName || 'School Corridor'} • {route?.busNumber} ({stops.length} Boarding Stops)
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {/* Map Layers */}
            <div className="flex bg-slate-800 p-1 rounded-xl border border-slate-700">
              <button
                type="button"
                onClick={() => setMapLayer('dark')}
                className={`px-2.5 py-1 rounded-lg text-xs font-bold transition ${mapLayer === 'dark' ? 'bg-blue-600 text-white' : 'text-slate-400 hover:text-white'}`}
              >
                Dark
              </button>
              <button
                type="button"
                onClick={() => setMapLayer('streets')}
                className={`px-2.5 py-1 rounded-lg text-xs font-bold transition ${mapLayer === 'streets' ? 'bg-blue-600 text-white' : 'text-slate-400 hover:text-white'}`}
              >
                Streets
              </button>
              <button
                type="button"
                onClick={() => setMapLayer('satellite')}
                className={`px-2.5 py-1 rounded-lg text-xs font-bold transition ${mapLayer === 'satellite' ? 'bg-blue-600 text-white' : 'text-slate-400 hover:text-white'}`}
              >
                Satellite
              </button>
            </div>

            <button
              onClick={onClose}
              className="p-2.5 rounded-xl bg-slate-800 text-slate-400 hover:text-white hover:bg-slate-700 transition"
              title="Close Replay"
            >
              <FiX className="text-lg" />
            </button>
          </div>
        </div>

        {/* Map Canvas */}
        <div className="relative flex-1 bg-slate-950 overflow-hidden">
          <div ref={mapContainerRef} className="w-full h-full" style={{ zIndex: 1 }} />

          {/* Floating Top Left Telemetry Overlay */}
          <div className="absolute top-4 left-4 z-[1000] flex flex-wrap gap-2 pointer-events-none">
            
            {/* Speedometer Card */}
            <div className="bg-slate-900/90 backdrop-blur-md border border-slate-700/80 p-3 rounded-2xl shadow-xl flex items-center gap-3 pointer-events-auto">
              <div className="w-9 h-9 rounded-xl bg-blue-500/20 text-blue-400 flex items-center justify-center font-black text-sm">
                <FiActivity />
              </div>
              <div>
                <div className="text-[10px] uppercase font-bold text-slate-400">Road Speed</div>
                <div className="text-base font-black text-white font-mono">
                  {simulatedSpeed} <span className="text-[10px] text-slate-400 font-normal">km/h</span>
                </div>
              </div>
            </div>

            {/* Distance & ETA */}
            <div className="bg-slate-900/90 backdrop-blur-md border border-slate-700/80 p-3 rounded-2xl shadow-xl flex items-center gap-3 pointer-events-auto">
              <div className="w-9 h-9 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center font-black text-sm">
                <FiNavigation />
              </div>
              <div>
                <div className="text-[10px] uppercase font-bold text-slate-400">Road Corridor</div>
                <div className="text-xs font-black text-emerald-400">
                  {elapsedKm} / {totalDistanceKm} km <span className="text-[10px] text-slate-400">({remainingKm} km left)</span>
                </div>
              </div>
            </div>

            {/* Status Pill */}
            <div className="bg-slate-900/90 backdrop-blur-md border border-slate-700/80 px-3.5 py-2 rounded-2xl shadow-xl flex items-center gap-2 pointer-events-auto">
              <span className="relative flex h-2.5 w-2.5">
                <span className={`animate-ping absolute inline-flex h-full w-full rounded-full ${isPlaying ? 'bg-emerald-400 opacity-75' : 'bg-amber-400 opacity-75'}`}></span>
                <span className={`relative inline-flex rounded-full h-2.5 w-2.5 ${isPlaying ? 'bg-emerald-500' : 'bg-amber-500'}`}></span>
              </span>
              <span className="text-xs font-bold text-slate-200">
                {isPlaying ? 'CRUISING ON CORRIDOR' : currentProgressIndex === 0 ? 'READY AT ORIGIN' : 'PAUSED'}
              </span>
            </div>

          </div>

          {/* Floating Right Passenger Manifest Summary */}
          <div className="absolute top-4 right-4 z-[1000] max-w-xs w-64 bg-slate-900/90 backdrop-blur-md border border-slate-700/80 p-4 rounded-2xl shadow-2xl hidden md:block">
            <div className="flex items-center justify-between border-b border-slate-800 pb-2 mb-2">
              <span className="text-xs font-black text-white flex items-center gap-1.5">
                <FiUsers className="text-blue-400" /> Passenger Boarding
              </span>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-blue-900/60 text-blue-300">
                {stops.reduce((acc, s) => acc + (s.students || 0), 0)} Scholars
              </span>
            </div>

            <div className="space-y-2 max-h-48 overflow-y-auto pr-1 text-xs">
              {stops.map((s, idx) => {
                const isPassed = currentProgressIndex > (idx / (stops.length - 1)) * roadCoordinates.length
                return (
                  <div
                    key={idx}
                    className={`p-2 rounded-xl border flex items-center justify-between transition ${
                      isPassed
                        ? 'bg-emerald-950/30 border-emerald-500/40 text-emerald-300'
                        : 'bg-slate-800/60 border-slate-700 text-slate-400'
                    }`}
                  >
                    <div className="truncate">
                      <div className="font-bold text-white text-[11px] truncate">
                        {idx + 1}. {s.name}
                      </div>
                      <div className="text-[10px] text-slate-400">{s.time}</div>
                    </div>
                    <span className={`text-[10px] font-black px-2 py-0.5 rounded-md ${isPassed ? 'bg-emerald-500/20 text-emerald-400' : 'bg-slate-700 text-slate-400'}`}>
                      {isPassed ? '✓ Picked' : `+${s.students || 0}`}
                    </span>
                  </div>
                )
              })}
            </div>
          </div>
        </div>

        {/* Bottom Floating Scrubber & Playback Controls */}
        <div className="p-4 bg-slate-950/90 border-t border-slate-800 space-y-3 z-20">
          
          {/* Progress Timeline Scrubber */}
          <div className="flex items-center gap-4">
            <span className="text-xs font-mono font-bold text-slate-400 w-12 text-right">
              {progressPercent}%
            </span>
            <input
              type="range"
              min="0"
              max={Math.max(1, roadCoordinates.length - 1)}
              value={currentProgressIndex}
              onChange={handleSeek}
              disabled={isLoadingRoad || roadCoordinates.length === 0}
              className="flex-1 h-2 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-blue-500 focus:outline-none"
            />
            <span className="text-xs font-mono font-bold text-blue-400 w-16">
              {totalDurationMin} min trip
            </span>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-wrap items-center justify-between gap-4">
            
            <div className="flex items-center gap-2">
              
              {/* Play / Pause */}
              <button
                type="button"
                onClick={() => setIsPlaying(!isPlaying)}
                disabled={isLoadingRoad || roadCoordinates.length === 0}
                className="px-6 py-2.5 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-black shadow-lg shadow-blue-600/30 transition flex items-center gap-2 disabled:opacity-50"
              >
                {isPlaying ? <FiPause className="text-base" /> : <FiPlay className="text-base" />}
                {isPlaying ? 'Pause Trip' : currentProgressIndex === roadCoordinates.length - 1 ? 'Replay Trip' : 'Start Simulation'}
              </button>

              {/* Reset */}
              <button
                type="button"
                onClick={handleReset}
                className="p-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs font-bold transition"
                title="Rewind to Start"
              >
                <FiRotateCcw className="text-sm" />
              </button>

              {/* Speed Multipliers */}
              <div className="flex items-center bg-slate-800 p-1 rounded-xl border border-slate-700 ml-2">
                {[1, 2, 5, 10].map(speed => (
                  <button
                    key={speed}
                    type="button"
                    onClick={() => setPlaybackSpeed(speed)}
                    className={`px-2.5 py-1 rounded-lg text-xs font-bold transition ${
                      playbackSpeed === speed ? 'bg-blue-600 text-white' : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    {speed}x
                  </button>
                ))}
              </div>

            </div>

            <div className="flex items-center gap-2">
              <span className="text-xs text-slate-400">
                Waypoints: <strong className="text-white">{roadCoordinates.length} road nodes</strong>
              </span>
            </div>

          </div>

        </div>

      </div>
    </div>
  )
}

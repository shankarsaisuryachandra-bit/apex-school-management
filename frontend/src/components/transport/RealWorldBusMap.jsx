import React, { useEffect, useRef, useState } from 'react'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'
import {
  FiNavigation,
  FiMapPin,
  FiCompass,
  FiLayers,
  FiSearch,
  FiMaximize2,
  FiCrosshair,
  FiActivity,
  FiAlertTriangle,
  FiCheckCircle,
  FiPlayCircle
} from 'react-icons/fi'
import { fetchRoadGeometry, calculateBearing } from '../../utils/osrmRouting'
import RoutePlaybackModal from './RoutePlaybackModal'

// Fix default Leaflet icon paths in React/Vite
delete L.Icon.Default.prototype._getIconUrl
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
})

// Custom SVG Bus Icon generator
const createBusIcon = (busNumber, heading = 0, isSos = false, isBroadcasting = false) => {
  const pulseColor = isSos ? '#ef4444' : isBroadcasting ? '#10b981' : '#3b82f6'
  const bgColor = isSos ? '#dc2626' : '#2563eb'

  const html = `
    <div style="position: relative; width: 44px; height: 44px; display: flex; align-items: center; justify-content: center;">
      <div style="
        position: absolute;
        width: 44px;
        height: 44px;
        border-radius: 50%;
        background: ${pulseColor}22;
        border: 2px solid ${pulseColor}88;
        animation: ping 2s cubic-bezier(0, 0, 0.2, 1) infinite;
      "></div>
      <div style="
        position: relative;
        width: 32px;
        height: 32px;
        background: ${bgColor};
        border-radius: 50%;
        border: 3px solid #ffffff;
        box-shadow: 0 4px 12px rgba(0,0,0,0.35);
        display: flex;
        align-items: center;
        justify-content: center;
        color: white;
        font-weight: 800;
        font-size: 11px;
        transform: rotate(${heading}deg);
        transition: transform 0.4s ease;
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
        bottom: -18px;
        background: rgba(15, 23, 42, 0.9);
        color: #f8fafc;
        padding: 2px 6px;
        border-radius: 4px;
        font-size: 10px;
        font-weight: 700;
        white-space: nowrap;
        box-shadow: 0 2px 6px rgba(0,0,0,0.3);
        border: 1px solid rgba(255,255,255,0.2);
        letter-spacing: 0.5px;
      ">
        ${busNumber}
      </div>
    </div>
  `

  return L.divIcon({
    html: html,
    className: 'custom-bus-marker',
    iconSize: [44, 44],
    iconAnchor: [22, 22],
    popupAnchor: [0, -22]
  })
}

// Custom Stop Pin Icon generator
const createStopIcon = (index, stopName, studentCount, isNext = false) => {
  const bg = isNext ? '#f59e0b' : '#6366f1'
  const html = `
    <div style="
      position: relative;
      display: flex;
      flex-direction: column;
      align-items: center;
    ">
      <div style="
        width: 26px;
        height: 26px;
        background: ${bg};
        border: 2px solid white;
        border-radius: 50%;
        color: white;
        font-size: 11px;
        font-weight: 800;
        display: flex;
        align-items: center;
        justify-content: center;
        box-shadow: 0 2px 8px rgba(0,0,0,0.3);
      ">
        ${index + 1}
      </div>
      <div style="
        width: 2px;
        height: 6px;
        background: ${bg};
      "></div>
    </div>
  `

  return L.divIcon({
    html: html,
    className: 'custom-stop-marker',
    iconSize: [26, 32],
    iconAnchor: [13, 32],
    popupAnchor: [0, -32]
  })
}

export default function RealWorldBusMap({
  routes = [],
  selectedRouteId = null,
  onSelectRoute = () => {},
  onMapClick = null,
  interactivePlacement = false,
  showAllFleet = true,
  breadcrumbs = [],
  height = '520px'
}) {
  const mapContainerRef = useRef(null)
  const mapInstanceRef = useRef(null)
  const prevSelectedRouteIdRef = useRef(null)
  const markersRef = useRef({ buses: {}, stops: [], polyline: null, polylineGlow: null, breadcrumbPolyline: null, accuracyCircle: null })
  const [mapLayer, setMapLayer] = useState('streets') // streets, satellite, dark
  const [isLockedOnBus, setIsLockedOnBus] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [isSearching, setIsSearching] = useState(false)
  const [searchResults, setSearchResults] = useState([])
  const [showPlaybackModal, setShowPlaybackModal] = useState(false)
  const [roadInfo, setRoadInfo] = useState({ distanceKm: 0, durationMin: 0, isRoadFollow: false })

  const selectedRoute = routes.find(r => r.id === selectedRouteId) || routes[0]

  // Helper to validate and convert coordinates
  const isValidCoord = (lat, lng) => {
    const nLat = Number(parseFloat(lat))
    const nLng = Number(parseFloat(lng))
    return (
      !Number.isNaN(nLat) &&
      !Number.isNaN(nLng) &&
      nLat >= -90 &&
      nLat <= 90 &&
      nLng >= -180 &&
      nLng <= 180 &&
      (nLat !== 0 || nLng !== 0)
    )
  }

  // Helper to parse stops safely
  const getParsedStops = (route) => {
    if (!route || !route.stopsJson) return []
    try {
      return typeof route.stopsJson === 'string' ? JSON.parse(route.stopsJson) : (route.stopsJson || [])
    } catch (e) {
      return []
    }
  }

  // Initialize Leaflet Map
  useEffect(() => {
    if (!mapContainerRef.current) return

    // Determine initial center
    let initialCenter = [28.6139, 77.2090]
    if (selectedRoute) {
      const stops = getParsedStops(selectedRoute)
      if (isValidCoord(selectedRoute.currentLat, selectedRoute.currentLng)) {
        initialCenter = [Number(selectedRoute.currentLat), Number(selectedRoute.currentLng)]
      } else if (stops.length > 0 && isValidCoord(stops[0].lat, stops[0].lng)) {
        initialCenter = [Number(stops[0].lat), Number(stops[0].lng)]
      }
    }

    const map = L.map(mapContainerRef.current, {
      center: initialCenter,
      zoom: 13,
      zoomControl: false
    })

    // Custom Zoom control at bottom right
    L.control.zoom({ position: 'bottomright' }).addTo(map)

    // Base Tile Layer (CartoDB Voyager / OSM / Esri Satellite)
    const getTileUrl = (layer) => {
      switch (layer) {
        case 'satellite':
          return 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}'
        case 'dark':
          return 'https://server.arcgisonline.com/ArcGIS/rest/services/Canvas/World_Dark_Gray_Base/MapServer/tile/{z}/{y}/{x}'
        case 'streets':
        default:
          return 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png'
      }
    }

    const tileLayer = L.tileLayer(getTileUrl(mapLayer), {
      attribution: '&copy; OpenStreetMap contributors, Esri',
      maxZoom: 19
    }).addTo(map)

    mapInstanceRef.current = { map, tileLayer }

    // Map click handler for interactive stop placement or test coordinate picking
    map.on('click', (e) => {
      if (onMapClick) {
        onMapClick({ lat: e.latlng.lat, lng: e.latlng.lng })
      }
    })

    return () => {
      map.remove()
      mapInstanceRef.current = null
    }
  }, [])

  // Switch Tile Layer when changed
  useEffect(() => {
    if (!mapInstanceRef.current) return
    const { map, tileLayer } = mapInstanceRef.current

    const getTileUrl = (layer) => {
      switch (layer) {
        case 'satellite':
          return 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}'
        case 'dark':
          return 'https://server.arcgisonline.com/ArcGIS/rest/services/Canvas/World_Dark_Gray_Base/MapServer/tile/{z}/{y}/{x}'
        case 'streets':
        default:
          return 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png'
      }
    }

    map.removeLayer(tileLayer)
    const newTileLayer = L.tileLayer(getTileUrl(mapLayer), {
      attribution: '&copy; OpenStreetMap contributors, Esri',
      maxZoom: 19
    }).addTo(map)

    mapInstanceRef.current.tileLayer = newTileLayer
  }, [mapLayer])

  // Update Markers, Routes, Stops & Breadcrumbs
  useEffect(() => {
    if (!mapInstanceRef.current) return
    const { map } = mapInstanceRef.current

    // Clear previous stops & polylines
    markersRef.current.stops.forEach(marker => map.removeLayer(marker))
    markersRef.current.stops = []

    if (markersRef.current.polyline) {
      map.removeLayer(markersRef.current.polyline)
      markersRef.current.polyline = null
    }
    if (markersRef.current.polylineGlow) {
      map.removeLayer(markersRef.current.polylineGlow)
      markersRef.current.polylineGlow = null
    }

    if (markersRef.current.breadcrumbPolyline) {
      map.removeLayer(markersRef.current.breadcrumbPolyline)
      markersRef.current.breadcrumbPolyline = null
    }

    if (markersRef.current.accuracyCircle) {
      map.removeLayer(markersRef.current.accuracyCircle)
      markersRef.current.accuracyCircle = null
    }

    // Determine routes to show
    const routesToDisplay = showAllFleet ? routes : (selectedRoute ? [selectedRoute] : [])

    // Track active bus markers
    const currentBusIds = new Set(routesToDisplay.map(r => r.id))

    // Remove any buses not in display
    Object.keys(markersRef.current.buses).forEach(id => {
      if (!currentBusIds.has(Number(id))) {
        map.removeLayer(markersRef.current.buses[id])
        delete markersRef.current.buses[id]
      }
    })

    // Render Bus Markers with Smooth Animation
    routesToDisplay.forEach(route => {
      let busLat = Number(parseFloat(route.currentLat))
      let busLng = Number(parseFloat(route.currentLng))

      // If bus coordinate is missing or (0,0), check first stop as fallback
      if (!isValidCoord(busLat, busLng)) {
        const stops = getParsedStops(route)
        if (stops.length > 0 && isValidCoord(stops[0].lat, stops[0].lng)) {
          busLat = Number(parseFloat(stops[0].lat))
          busLng = Number(parseFloat(stops[0].lng))
        }
      }

      if (isValidCoord(busLat, busLng)) {
        const isSelected = selectedRoute && selectedRoute.id === route.id
        const isSos = route.emergencyStatus === 'EMERGENCY_SOS'
        const isBroadcasting = Boolean(route.isBroadcasting)
        const heading = Number(route.heading) || 0

        const busIcon = createBusIcon(
          route.busNumber || `BUS-${route.id}`,
          heading,
          isSos,
          isBroadcasting
        )

        let marker = markersRef.current.buses[route.id]

        if (!marker) {
          marker = L.marker([busLat, busLng], { icon: busIcon, zIndexOffset: isSelected ? 1000 : 500 })
            .addTo(map)
            .on('click', () => onSelectRoute(route.id))
          markersRef.current.buses[route.id] = marker
        } else {
          // Smooth glide animation between positions
          const curPos = marker.getLatLng()
          const dist = Math.abs(curPos.lat - busLat) + Math.abs(curPos.lng - busLng)

          if (dist > 0.00005 && dist < 0.2) {
            const computedHeading = calculateBearing(curPos.lat, curPos.lng, busLat, busLng)
            const dynamicIcon = createBusIcon(
              route.busNumber || `BUS-${route.id}`,
              computedHeading || heading,
              isSos,
              isBroadcasting
            )
            marker.setIcon(dynamicIcon)

            const startTime = performance.now()
            const duration = 1200
            const startLat = curPos.lat
            const startLng = curPos.lng

            const animateStep = (now) => {
              const elapsed = now - startTime
              const progress = Math.min(1, elapsed / duration)
              const ease = 1 - Math.pow(1 - progress, 3)

              const interpLat = startLat + (busLat - startLat) * ease
              const interpLng = startLng + (busLng - startLng) * ease

              marker.setLatLng([interpLat, interpLng])

              if (progress < 1) {
                requestAnimationFrame(animateStep)
              }
            }
            requestAnimationFrame(animateStep)
          } else {
            marker.setLatLng([busLat, busLng])
            marker.setIcon(busIcon)
          }
          marker.setZIndexOffset(isSelected ? 1000 : 500)
        }

        const popupContent = `
          <div style="font-family: inherit; padding: 4px 2px; min-width: 200px;">
            <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 6px;">
              <span style="font-weight: 800; font-size: 13px; color: #1e293b;">${route.busNumber}</span>
              <span style="font-size: 10px; font-weight: 700; padding: 2px 6px; border-radius: 4px; background: ${isBroadcasting ? '#dcfce7; color: #15803d;' : '#f1f5f9; color: #64748b;'}">
                ${isBroadcasting ? '● LIVE GPS' : 'STANDBY'}
              </span>
            </div>
            <div style="font-size: 11px; color: #475569; margin-bottom: 4px;"><strong>Route:</strong> ${route.routeName}</div>
            <div style="font-size: 11px; color: #475569; margin-bottom: 4px;"><strong>Speed:</strong> ${route.currentSpeedKmh || 0} km/h</div>
            <div style="font-size: 11px; color: #475569; margin-bottom: 4px;"><strong>Next Stop:</strong> ${route.nextStop || 'N/A'} (ETA: ${route.nextStopEtaMinutes || 0}m)</div>
            <div style="font-size: 11px; color: #475569;"><strong>Driver:</strong> ${route.driverName} (${route.driverPhone})</div>
          </div>
        `
        marker.bindPopup(popupContent)

        // If this is the selected route, add accuracy circle and center if locked
        if (isSelected) {
          if (route.gpsAccuracyMeters && route.gpsAccuracyMeters > 0) {
            markersRef.current.accuracyCircle = L.circle([busLat, busLng], {
              radius: Math.min(route.gpsAccuracyMeters, 150),
              color: isBroadcasting ? '#10b981' : '#3b82f6',
              fillColor: isBroadcasting ? '#10b981' : '#3b82f6',
              fillOpacity: 0.15,
              weight: 1
            }).addTo(map)
          }

          if (isLockedOnBus) {
            map.panTo([busLat, busLng], { animate: true, duration: 0.5 })
          }
        }
      }
    })

    // Render Stops and Route Polyline for Selected Route
    const routePointsForFitting = []

    if (selectedRoute) {
      const stops = getParsedStops(selectedRoute)
      const latLngs = []

      stops.forEach((stop, idx) => {
        const sLat = Number(parseFloat(stop.lat))
        const sLng = Number(parseFloat(stop.lng))

        if (isValidCoord(sLat, sLng)) {
          latLngs.push([sLat, sLng])
          routePointsForFitting.push([sLat, sLng])

          const isNext = selectedRoute.nextStop && selectedRoute.nextStop.includes(stop.name)
          const stopIcon = createStopIcon(idx, stop.name, stop.students || 0, isNext)

          const stopMarker = L.marker([sLat, sLng], { icon: stopIcon, zIndexOffset: 800 })
            .addTo(map)
            .bindPopup(`
              <div style="font-family: inherit; padding: 4px 2px; min-width: 180px;">
                <div style="font-weight: 700; font-size: 13px; color: #0f172a; margin-bottom: 4px;">
                  Stop #${idx + 1}: ${stop.name}
                </div>
                <div style="font-size: 11px; color: #475569; margin-bottom: 2px;">
                  <strong>Scheduled Arrival:</strong> ${stop.time || 'N/A'}
                </div>
                <div style="font-size: 11px; color: #475569; margin-bottom: 2px;">
                  <strong>Scholars Boarding:</strong> ${stop.students || 0} students
                </div>
                <div style="font-size: 10px; color: #94a3b8; margin-top: 4px;">
                  Coordinates: ${sLat.toFixed(6)}, ${sLng.toFixed(6)}
                </div>
              </div>
            `)

          markersRef.current.stops.push(stopMarker)
        }
      })

      // Fetch Real Road-Following Geometry via OSRM
      if (stops.length > 1) {
        fetchRoadGeometry(stops).then(res => {
          if (!mapInstanceRef.current) return
          const roadCoords = res.coordinates && res.coordinates.length > 1 ? res.coordinates : latLngs

          if (markersRef.current.polylineGlow) map.removeLayer(markersRef.current.polylineGlow)
          if (markersRef.current.polyline) map.removeLayer(markersRef.current.polyline)

          // Glowing road halo
          markersRef.current.polylineGlow = L.polyline(roadCoords, {
            color: '#0284c7',
            weight: 8,
            opacity: 0.35,
            lineCap: 'round',
            lineJoin: 'round'
          }).addTo(map)

          // Core crisp road trajectory
          markersRef.current.polyline = L.polyline(roadCoords, {
            color: '#38bdf8',
            weight: 4,
            opacity: 0.95,
            dashArray: res.isRoadFollow ? undefined : '8, 6',
            lineJoin: 'round'
          }).addTo(map)

          setRoadInfo({
            distanceKm: res.distanceKm,
            durationMin: res.durationMin,
            isRoadFollow: res.isRoadFollow
          })
        })
      }

      // Add bus coordinate to points if valid
      if (isValidCoord(selectedRoute.currentLat, selectedRoute.currentLng)) {
        routePointsForFitting.push([Number(selectedRoute.currentLat), Number(selectedRoute.currentLng)])
      }

      // Auto-fit bounds on initial load or when selected route changes
      if (prevSelectedRouteIdRef.current !== selectedRoute.id && routePointsForFitting.length > 0) {
        prevSelectedRouteIdRef.current = selectedRoute.id
        const bounds = L.latLngBounds(routePointsForFitting)
        map.fitBounds(bounds, { padding: [50, 50], maxZoom: 15 })
      }
    }

    // Render Historical Breadcrumbs Trail
    if (breadcrumbs && breadcrumbs.length > 1) {
      const breadcrumbCoords = breadcrumbs
        .map(b => [Number(parseFloat(b.latitude)), Number(parseFloat(b.longitude))])
        .filter(([bLat, bLng]) => isValidCoord(bLat, bLng))

      if (breadcrumbCoords.length > 1) {
        markersRef.current.breadcrumbPolyline = L.polyline(breadcrumbCoords, {
          color: '#10b981',
          weight: 4,
          opacity: 0.85,
          lineJoin: 'round'
        }).addTo(map)
      }
    }
  }, [routes, selectedRouteId, showAllFleet, isLockedOnBus, breadcrumbs])

  // OpenStreetMap Nominatim Real-world Location Search
  const handleLocationSearch = async (e) => {
    e.preventDefault()
    if (!searchQuery.trim()) return

    setIsSearching(true)
    try {
      const res = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(searchQuery)}`)
      const data = await res.json()
      setSearchResults(data || [])
    } catch (err) {
      console.error('Geocoding search failed', err)
    } finally {
      setIsSearching(false)
    }
  }

  const handleSelectSearchResult = (result) => {
    if (!mapInstanceRef.current) return
    const lat = parseFloat(result.lat)
    const lon = parseFloat(result.lon)
    mapInstanceRef.current.map.flyTo([lat, lon], 16)
    setSearchResults([])
    setSearchQuery(result.display_name.split(',')[0])
  }

  const centerOnSelectedBus = () => {
    if (!mapInstanceRef.current || !selectedRoute) return
    const stops = getParsedStops(selectedRoute)
    let lat = Number(selectedRoute.currentLat)
    let lng = Number(selectedRoute.currentLng)
    if (!isValidCoord(lat, lng) && stops.length > 0) {
      lat = Number(stops[0].lat)
      lng = Number(stops[0].lng)
    }
    if (isValidCoord(lat, lng)) {
      mapInstanceRef.current.map.flyTo([lat, lng], 15)
      setIsLockedOnBus(true)
    }
  }

  const fitRouteCorridor = () => {
    if (!mapInstanceRef.current || !selectedRoute) return
    const stops = getParsedStops(selectedRoute)
    const points = stops
      .map(s => [Number(parseFloat(s.lat)), Number(parseFloat(s.lng))])
      .filter(([lat, lng]) => isValidCoord(lat, lng))

    if (isValidCoord(selectedRoute.currentLat, selectedRoute.currentLng)) {
      points.push([Number(selectedRoute.currentLat), Number(selectedRoute.currentLng)])
    }

    if (points.length > 0) {
      const bounds = L.latLngBounds(points)
      mapInstanceRef.current.map.fitBounds(bounds, { padding: [50, 50], maxZoom: 15 })
      setIsLockedOnBus(false)
    }
  }

  const fitAllFleetBounds = () => {
    if (!mapInstanceRef.current || routes.length === 0) return
    const validCoords = routes
      .filter(r => isValidCoord(r.currentLat, r.currentLng))
      .map(r => [Number(r.currentLat), Number(r.currentLng)])

    if (validCoords.length > 0) {
      const bounds = L.latLngBounds(validCoords)
      mapInstanceRef.current.map.fitBounds(bounds, { padding: [50, 50] })
      setIsLockedOnBus(false)
    }
  }

  return (
    <div className="relative rounded-2xl overflow-hidden border border-slate-700 bg-slate-900 shadow-2xl flex flex-col">
      {/* Top Map HUD Control Bar */}
      <div className="bg-slate-900/90 backdrop-blur-md px-4 py-3 border-b border-slate-700 flex flex-wrap items-center justify-between gap-3 z-[1000]">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-slate-800 border border-slate-700">
            <span className="relative flex h-2.5 w-2.5">
              <span className={`animate-ping absolute inline-flex h-full w-full rounded-full ${selectedRoute?.isBroadcasting ? 'bg-emerald-400 opacity-75' : 'bg-blue-400 opacity-75'}`}></span>
              <span className={`relative inline-flex rounded-full h-2.5 w-2.5 ${selectedRoute?.isBroadcasting ? 'bg-emerald-500' : 'bg-blue-500'}`}></span>
            </span>
            <span className="text-xs font-bold text-slate-200">
              {selectedRoute?.isBroadcasting ? 'REAL-WORLD GPS: ACTIVE' : 'GPS STANDBY'}
            </span>
          </div>

          <span className="text-xs font-semibold text-slate-400 hidden sm:inline">
            {selectedRoute?.routeName || 'Select Bus'}
          </span>
        </div>

        {/* Real Geocoding Search Bar */}
        <div className="relative flex-1 max-w-xs">
          <form onSubmit={handleLocationSearch} className="relative flex items-center">
            <FiSearch className="absolute left-3 text-slate-400 text-xs" />
            <input
              type="text"
              placeholder="Search real address / city..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-8 pr-8 py-1.5 bg-slate-800/90 border border-slate-700 rounded-lg text-xs text-white placeholder-slate-400 focus:outline-none focus:border-blue-500 transition"
            />
            {isSearching && (
              <div className="absolute right-2.5 h-3 w-3 border-2 border-blue-400 border-t-transparent rounded-full animate-spin"></div>
            )}
          </form>

          {searchResults.length > 0 && (
            <div className="absolute top-full left-0 right-0 mt-1 bg-slate-800 border border-slate-700 rounded-lg shadow-xl overflow-hidden z-[2000] max-h-48 overflow-y-auto">
              {searchResults.map((res, i) => (
                <button
                  key={i}
                  type="button"
                  onClick={() => handleSelectSearchResult(res)}
                  className="w-full text-left px-3 py-2 text-xs text-slate-300 hover:bg-slate-700 flex items-start gap-2 border-b border-slate-700/50 last:border-0"
                >
                  <FiMapPin className="text-blue-400 shrink-0 mt-0.5" />
                  <span className="truncate">{res.display_name}</span>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Map View & Layer Switches */}
        <div className="flex items-center gap-1.5">
          {/* Trip Replay Launch Button */}
          <button
            type="button"
            onClick={() => setShowPlaybackModal(true)}
            title="Launch Interactive Trip Simulation & Replay"
            className="px-3 py-1.5 rounded-lg text-xs font-bold bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white shadow-md shadow-blue-500/20 transition flex items-center gap-1.5 shrink-0"
          >
            <FiPlayCircle className="text-sm" />
            <span>Replay Trip</span>
          </button>

          <button
            type="button"
            onClick={fitRouteCorridor}
            title="Focus & Frame Full Route Corridor"
            className="p-2 rounded-lg text-xs font-medium bg-blue-600/20 text-blue-400 border border-blue-500/40 hover:bg-blue-600 hover:text-white transition flex items-center gap-1.5"
          >
            <FiNavigation className="text-sm" />
            <span className="hidden md:inline font-bold">Focus Route</span>
          </button>

          <button
            type="button"
            onClick={centerOnSelectedBus}
            title="Lock Camera on Bus"
            className={`p-2 rounded-lg text-xs font-medium border transition flex items-center gap-1.5 ${isLockedOnBus ? 'bg-blue-600 text-white border-blue-500 shadow-md' : 'bg-slate-800 text-slate-300 border-slate-700 hover:bg-slate-700'}`}
          >
            <FiCrosshair className="text-sm" />
            <span className="hidden md:inline">Follow Bus</span>
          </button>

          <button
            type="button"
            onClick={fitAllFleetBounds}
            title="View All Fleet"
            className="p-2 rounded-lg text-xs font-medium bg-slate-800 text-slate-300 border border-slate-700 hover:bg-slate-700 transition flex items-center gap-1.5"
          >
            <FiMaximize2 className="text-sm" />
            <span className="hidden md:inline">All Fleet</span>
          </button>

          {/* Layer Selector */}
          <div className="flex items-center bg-slate-800 rounded-lg border border-slate-700 p-0.5">
            <button
              type="button"
              onClick={() => setMapLayer('streets')}
              className={`px-2 py-1 text-xs font-semibold rounded ${mapLayer === 'streets' ? 'bg-blue-600 text-white' : 'text-slate-400 hover:text-white'}`}
            >
              Streets
            </button>
            <button
              type="button"
              onClick={() => setMapLayer('satellite')}
              className={`px-2 py-1 text-xs font-semibold rounded ${mapLayer === 'satellite' ? 'bg-blue-600 text-white' : 'text-slate-400 hover:text-white'}`}
            >
              Satellite
            </button>
            <button
              type="button"
              onClick={() => setMapLayer('dark')}
              className={`px-2 py-1 text-xs font-semibold rounded ${mapLayer === 'dark' ? 'bg-blue-600 text-white' : 'text-slate-400 hover:text-white'}`}
            >
              Dark
            </button>
          </div>
        </div>
      </div>

      {/* Map Canvas */}
      <div
        ref={mapContainerRef}
        style={{ height, width: '100%' }}
        className="w-full bg-slate-950 relative z-10"
      />

      {/* Bottom Map Status Bar */}
      <div className="bg-slate-900/90 backdrop-blur-md px-4 py-2 border-t border-slate-700 flex flex-wrap items-center justify-between gap-3 text-xs text-slate-400 z-[1000]">
        <div className="flex items-center gap-4">
          <span>
            <strong className="text-slate-200">GPS Coordinates:</strong>{' '}
            {selectedRoute?.currentLat ? `${selectedRoute.currentLat.toFixed(5)}, ${selectedRoute.currentLng.toFixed(5)}` : 'N/A'}
          </span>
          <span>
            <strong className="text-slate-200">Heading:</strong> {selectedRoute?.heading ? `${Math.round(selectedRoute.heading)}°` : '0°'}
          </span>
          {roadInfo.distanceKm > 0 && (
            <span className="flex items-center gap-1.5 text-blue-400 font-semibold">
              <span>🛣️ {roadInfo.isRoadFollow ? 'Road Path' : 'Corridor'}:</span>
              <strong className="text-white">{roadInfo.distanceKm} km</strong>
              <span className="text-slate-400">(~{roadInfo.durationMin} mins)</span>
            </span>
          )}
        </div>

        <div className="flex items-center gap-3">
          <span className="flex items-center gap-1.5 text-emerald-400 font-medium">
            <FiCheckCircle /> OpenStreetMap Live Vector Feed
          </span>
        </div>
      </div>

      {/* Interactive Trip Playback Modal */}
      {showPlaybackModal && selectedRoute && (
        <RoutePlaybackModal
          route={selectedRoute}
          onClose={() => setShowPlaybackModal(false)}
        />
      )}
    </div>
  )
}

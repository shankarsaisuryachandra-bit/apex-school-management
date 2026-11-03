import React, { useState, useEffect, useRef } from 'react'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'
import {
  FiMapPin,
  FiSearch,
  FiCrosshair,
  FiCheck,
  FiX,
  FiCompass,
  FiLayers,
  FiNavigation
} from 'react-icons/fi'

// Fix default Leaflet icon paths
delete L.Icon.Default.prototype._getIconUrl
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
})

const createPickerPinIcon = () => {
  const html = `
    <div style="position: relative; display: flex; flex-direction: column; align-items: center; cursor: grab;">
      <div style="
        width: 36px;
        height: 36px;
        background: #ef4444;
        border: 3px solid #ffffff;
        border-radius: 50% 50% 50% 0;
        transform: rotate(-45deg);
        box-shadow: 0 4px 14px rgba(0,0,0,0.45);
        display: flex;
        align-items: center;
        justify-content: center;
      ">
        <div style="
          width: 12px;
          height: 12px;
          background: #ffffff;
          border-radius: 50%;
          transform: rotate(45deg);
        "></div>
      </div>
      <div style="
        width: 8px;
        height: 8px;
        background: rgba(0,0,0,0.3);
        border-radius: 50%;
        filter: blur(1px);
        margin-top: -4px;
      "></div>
    </div>
  `
  return L.divIcon({
    html: html,
    className: 'picker-pin-marker',
    iconSize: [36, 42],
    iconAnchor: [18, 42],
    popupAnchor: [0, -42]
  })
}

// Popular institutional presets
const locationPresets = [
  { name: 'Apex Academy Main Quadrangle', lat: 28.6100, lng: 77.2350, desc: 'School Main Campus' },
  { name: 'Greenfield Heights Gate 2', lat: 28.6650, lng: 77.2050, desc: 'North Sector Terminal' },
  { name: 'St. Xavier Circle', lat: 28.6520, lng: 77.2100, desc: 'Interchange Junction' },
  { name: 'Civil Lines Metro Interchange', lat: 28.6400, lng: 77.2180, desc: 'Metro Yellow Line' },
  { name: 'Diplomatic Avenue Point', lat: 28.6250, lng: 77.2280, desc: 'Embassy Corridor' },
  { name: 'Cyber City Tech Crossing', lat: 28.5300, lng: 77.2400, desc: 'South Corridor Stop' },
  { name: 'Prestige Cyber Enclave', lat: 28.5100, lng: 77.2300, desc: 'IT Hub Depot' },
  { name: 'Riverside Orchid Villas', lat: 28.6300, lng: 77.2800, desc: 'East Riverside Terminal' },
]

export default function MapCoordinatePickerModal({
  initialLat = 28.6139,
  initialLng = 77.2090,
  stopName = '',
  onSave = () => {},
  onClose = () => {}
}) {
  const mapContainerRef = useRef(null)
  const mapRef = useRef(null)
  const markerRef = useRef(null)

  const [lat, setLat] = useState(
    typeof initialLat === 'number' && !isNaN(initialLat) && initialLat !== 0 ? initialLat : 28.6139
  )
  const [lng, setLng] = useState(
    typeof initialLng === 'number' && !isNaN(initialLng) && initialLng !== 0 ? initialLng : 77.2090
  )
  const [searchQuery, setSearchQuery] = useState('')
  const [searchResults, setSearchResults] = useState([])
  const [isSearching, setIsSearching] = useState(false)
  const [resolvedAddress, setResolvedAddress] = useState('')
  const [mapLayer, setMapLayer] = useState('streets') // streets, satellite

  // Reverse geocode lat/lng to human address
  const reverseGeocode = async (latitude, longitude) => {
    try {
      const res = await fetch(
        `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}&zoom=18&addressdetails=1`,
        { headers: { 'Accept-Language': 'en' } }
      )
      const data = await res.json()
      if (data && data.display_name) {
        setResolvedAddress(data.display_name)
      }
    } catch (e) {
      // Ignore geocode error
    }
  }

  // Initialize Map
  useEffect(() => {
    if (!mapContainerRef.current) return

    const initialCenter = [
      typeof lat === 'number' && !isNaN(lat) ? lat : 28.6139,
      typeof lng === 'number' && !isNaN(lng) ? lng : 77.2090
    ]

    const map = L.map(mapContainerRef.current, {
      center: initialCenter,
      zoom: 15,
      zoomControl: true
    })

    const tileLayer = L.tileLayer(
      mapLayer === 'satellite'
        ? 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}'
        : 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
      {
        attribution: '&copy; OpenStreetMap contributors',
        maxZoom: 19
      }
    ).addTo(map)

    const pinIcon = createPickerPinIcon()
    const marker = L.marker(initialCenter, {
      icon: pinIcon,
      draggable: true,
      autoPan: true
    }).addTo(map)

    marker.bindPopup(`<strong>${stopName || 'Selected Boarding Point'}</strong><br/>Drag pin or click map to move`).openPopup()

    // Handle Marker Drag
    marker.on('dragend', (e) => {
      const position = e.target.getLatLng()
      setLat(Number(position.lat.toFixed(6)))
      setLng(Number(position.lng.toFixed(6)))
      reverseGeocode(position.lat, position.lng)
    })

    // Handle Map Click
    map.on('click', (e) => {
      const { lat: clickLat, lng: clickLng } = e.latlng
      marker.setLatLng([clickLat, clickLng])
      setLat(Number(clickLat.toFixed(6)))
      setLng(Number(clickLng.toFixed(6)))
      reverseGeocode(clickLat, clickLng)
    })

    mapRef.current = { map, tileLayer, marker }
    markerRef.current = marker

    reverseGeocode(initialCenter[0], initialCenter[1])

    // Fix map size after modal open transition
    setTimeout(() => {
      map.invalidateSize()
    }, 250)

    return () => {
      map.remove()
      mapRef.current = null
    }
  }, [])

  // Update map when tileLayer changes
  useEffect(() => {
    if (!mapRef.current) return
    const { map, tileLayer } = mapRef.current
    map.removeLayer(tileLayer)
    const newLayer = L.tileLayer(
      mapLayer === 'satellite'
        ? 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}'
        : 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
      { attribution: '&copy; OpenStreetMap', maxZoom: 19 }
    ).addTo(map)
    mapRef.current.tileLayer = newLayer
  }, [mapLayer])

  // Handle Search Location via Nominatim
  const handleSearch = async (e) => {
    e.preventDefault()
    if (!searchQuery.trim()) return
    setIsSearching(true)
    try {
      const res = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(searchQuery)}&limit=5&addressdetails=1`,
        { headers: { 'Accept-Language': 'en' } }
      )
      const data = await res.json()
      setSearchResults(data || [])
    } catch (err) {
      console.error('Location search failed', err)
    } finally {
      setIsSearching(false)
    }
  }

  // Select Search Result or Preset
  const handleSelectLocation = (itemLat, itemLng, displayName) => {
    const parsedLat = Number(parseFloat(itemLat).toFixed(6))
    const parsedLng = Number(parseFloat(itemLng).toFixed(6))
    setLat(parsedLat)
    setLng(parsedLng)
    setResolvedAddress(displayName || '')
    setSearchResults([])

    if (mapRef.current && markerRef.current) {
      const { map } = mapRef.current
      markerRef.current.setLatLng([parsedLat, parsedLng])
      map.flyTo([parsedLat, parsedLng], 16, { duration: 1.2 })
      markerRef.current.openPopup()
    }
  }

  // Use Browser GPS Location
  const handleUseCurrentLocation = () => {
    if (!navigator.geolocation) {
      alert('Geolocation is not supported by your browser')
      return
    }
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        handleSelectLocation(pos.coords.latitude, pos.coords.longitude, 'Current Device GPS Location')
      },
      (err) => {
        alert('Could not acquire your current location: ' + err.message)
      },
      { enableHighAccuracy: true }
    )
  }

  const handleSaveCoordinates = () => {
    onSave({
      lat: Number(lat),
      lng: Number(lng),
      address: resolvedAddress
    })
    onClose()
  }

  return (
    <div className="fixed inset-0 z-[4000] bg-black/85 backdrop-blur-md flex items-center justify-center p-4">
      <div className="bg-slate-900 border border-slate-700 w-full max-w-4xl rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[92vh]">
        
        {/* Header */}
        <div className="px-6 py-4 bg-slate-850 border-b border-slate-700/80 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-red-600/20 border border-red-500/40 flex items-center justify-center text-red-400">
              <FiMapPin className="text-xl" />
            </div>
            <div>
              <h3 className="text-base font-black text-white flex items-center gap-2">
                Interactive Boarding Point GPS Picker
                {stopName && <span className="text-xs px-2.5 py-0.5 rounded-full bg-blue-900/60 text-blue-300 font-bold border border-blue-700">{stopName}</span>}
              </h3>
              <p className="text-xs text-slate-400">
                Click anywhere on the map, drag the red pin, or search landmarks to set exact coordinates.
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-xl bg-slate-800 text-slate-400 hover:text-white hover:bg-slate-700 transition"
          >
            <FiX className="text-lg" />
          </button>
        </div>

        {/* Toolbar & Search Bar */}
        <div className="p-4 bg-slate-900 border-b border-slate-800 space-y-3">
          <div className="flex flex-wrap items-center gap-3">
            
            {/* Search Input */}
            <form onSubmit={handleSearch} className="flex-1 min-w-[260px] relative flex items-center gap-2">
              <div className="relative flex-1">
                <FiSearch className="absolute left-3.5 top-3 text-slate-400 text-sm" />
                <input
                  type="text"
                  placeholder="Search landmark, school, metro station, colony..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 bg-slate-800 border border-slate-700 rounded-xl text-xs text-white placeholder-slate-400 focus:outline-none focus:border-blue-500"
                />
              </div>
              <button
                type="submit"
                disabled={isSearching}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-bold transition flex items-center gap-1.5 shadow-md disabled:opacity-50"
              >
                {isSearching ? 'Searching...' : 'Search'}
              </button>
            </form>

            {/* Current Device Location */}
            <button
              type="button"
              onClick={handleUseCurrentLocation}
              className="px-3.5 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 rounded-xl text-xs font-bold transition flex items-center gap-1.5"
              title="Acquire current device location"
            >
              <FiCrosshair className="text-emerald-400" /> My Location
            </button>

            {/* Map Layer Switch */}
            <div className="flex bg-slate-800 p-1 rounded-xl border border-slate-700">
              <button
                type="button"
                onClick={() => setMapLayer('streets')}
                className={`px-3 py-1 rounded-lg text-xs font-bold transition ${mapLayer === 'streets' ? 'bg-blue-600 text-white' : 'text-slate-400 hover:text-white'}`}
              >
                Streets
              </button>
              <button
                type="button"
                onClick={() => setMapLayer('satellite')}
                className={`px-3 py-1 rounded-lg text-xs font-bold transition ${mapLayer === 'satellite' ? 'bg-blue-600 text-white' : 'text-slate-400 hover:text-white'}`}
              >
                Satellite
              </button>
            </div>

          </div>

          {/* Search Dropdown Results */}
          {searchResults.length > 0 && (
            <div className="p-2 bg-slate-800 border border-slate-700 rounded-xl space-y-1 max-h-40 overflow-y-auto shadow-xl">
              <div className="text-[10px] uppercase font-bold text-slate-400 px-2 py-1">
                Search Results (Click to pin)
              </div>
              {searchResults.map((item, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => handleSelectLocation(item.lat, item.lon, item.display_name)}
                  className="w-full text-left px-3 py-1.5 rounded-lg text-xs text-white hover:bg-blue-600/30 transition truncate flex items-center gap-2"
                >
                  <FiMapPin className="text-blue-400 shrink-0 text-sm" />
                  <span className="truncate">{item.display_name}</span>
                </button>
              ))}
            </div>
          )}

          {/* Quick Presets Strip */}
          <div className="flex items-center gap-2 overflow-x-auto pb-1 text-xs">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider shrink-0 flex items-center gap-1">
              <FiNavigation className="text-amber-400" /> Quick Presets:
            </span>
            {locationPresets.map((preset, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => handleSelectLocation(preset.lat, preset.lng, preset.name)}
                className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-blue-600 text-slate-300 hover:text-white text-[11px] font-medium border border-slate-700 shrink-0 transition"
              >
                {preset.name}
              </button>
            ))}
          </div>

        </div>

        {/* Map Container */}
        <div className="relative flex-1 min-h-[360px]">
          <div ref={mapContainerRef} className="w-full h-full min-h-[360px]" style={{ zIndex: 1 }} />
        </div>

        {/* Bottom Coordinates & Confirmation Bar */}
        <div className="p-4 bg-slate-850 border-t border-slate-800 flex flex-wrap items-center justify-between gap-4">
          <div className="flex flex-wrap items-center gap-4">
            
            {/* Latitude Display */}
            <div className="bg-slate-900 border border-slate-700 px-3.5 py-1.5 rounded-xl flex items-center gap-2">
              <span className="text-[10px] font-black uppercase text-slate-400 tracking-wider">Latitude</span>
              <input
                type="number"
                step="0.000001"
                value={lat}
                onChange={(e) => {
                  const val = parseFloat(e.target.value) || 0
                  setLat(val)
                  if (mapRef.current && markerRef.current) {
                    markerRef.current.setLatLng([val, lng])
                    mapRef.current.map.panTo([val, lng])
                  }
                }}
                className="w-28 bg-transparent text-sm font-mono font-black text-emerald-400 focus:outline-none"
              />
            </div>

            {/* Longitude Display */}
            <div className="bg-slate-900 border border-slate-700 px-3.5 py-1.5 rounded-xl flex items-center gap-2">
              <span className="text-[10px] font-black uppercase text-slate-400 tracking-wider">Longitude</span>
              <input
                type="number"
                step="0.000001"
                value={lng}
                onChange={(e) => {
                  const val = parseFloat(e.target.value) || 0
                  setLng(val)
                  if (mapRef.current && markerRef.current) {
                    markerRef.current.setLatLng([lat, val])
                    mapRef.current.map.panTo([lat, val])
                  }
                }}
                className="w-28 bg-transparent text-sm font-mono font-black text-emerald-400 focus:outline-none"
              />
            </div>

            {/* Resolved Address Text */}
            {resolvedAddress && (
              <div className="text-[11px] text-slate-400 truncate max-w-sm hidden md:block">
                📍 {resolvedAddress}
              </div>
            )}
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs font-bold transition"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleSaveCoordinates}
              className="px-6 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-black shadow-lg shadow-emerald-600/30 transition flex items-center gap-1.5"
            >
              <FiCheck className="text-base" /> Apply Coordinates
            </button>
          </div>
        </div>

      </div>
    </div>
  )
}

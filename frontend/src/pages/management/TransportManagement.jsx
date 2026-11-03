import { useState, useEffect } from 'react'
import api from '../../api/axiosConfig'
import RealWorldBusMap from '../../components/transport/RealWorldBusMap'
import DriverGpsTransmitter from '../../components/transport/DriverGpsTransmitter'
import MapCoordinatePickerModal from '../../components/transport/MapCoordinatePickerModal'
import RoutePlaybackModal from '../../components/transport/RoutePlaybackModal'
import {
  HiTruck, HiPlus, HiXMark, HiPhone, HiUser, HiMapPin,
  HiClock, HiShieldCheck, HiExclamationTriangle, HiArrowPath,
  HiSignal, HiSparkles, HiPrinter, HiUserPlus,
  HiTrash, HiPencilSquare, HiCheckCircle, HiMagnifyingGlass,
  HiArrowsRightLeft, HiBolt, HiAcademicCap, HiRadio, HiEye, HiGlobeAlt
} from 'react-icons/hi2'
import { FiRadio, FiActivity, FiNavigation, FiCompass, FiBatteryCharging } from 'react-icons/fi'

export default function TransportManagement() {
  const [routes, setRoutes] = useState([])
  const [selectedRouteId, setSelectedRouteId] = useState(null)
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState('MAP') // 'MAP', 'STOPS', 'STUDENTS', 'LOGS', 'BREADCRUMBS'
  const [message, setMessage] = useState(null)
  const [lastPollingTime, setLastPollingTime] = useState(new Date())

  // Driver Cockpit & Playback Modals
  const [showDriverTransmitter, setShowDriverTransmitter] = useState(false)
  const [showPlaybackModal, setShowPlaybackModal] = useState(false)

  // Modals
  const [showAddRouteModal, setShowAddRouteModal] = useState(false)
  const [showAssignStudentModal, setShowAssignStudentModal] = useState(false)
  const [showManifestModal, setShowManifestModal] = useState(false)
  const [editingRoute, setEditingRoute] = useState(null)
  const [pickingStopIndex, setPickingStopIndex] = useState(null)

  // Data for assignment modal & details
  const [allStudents, setAllStudents] = useState([])
  const [selectedRouteDetails, setSelectedRouteDetails] = useState(null)
  const [assignStudentId, setAssignStudentId] = useState('')
  const [assignStopName, setAssignStopName] = useState('')
  const [searchStudentQuery, setSearchStudentQuery] = useState('')
  const [breadcrumbs, setBreadcrumbs] = useState([])

  // Route Form State
  const [formData, setFormData] = useState({
    routeName: '',
    busNumber: '',
    plateNumber: '',
    hardwareDeviceId: 'GPS-APEX-01',
    operatorUsername: 'bus01',
    sourceName: 'Greenfield Heights Terminal',
    destinationName: 'Apex International Main Quadrangle',
    driverName: '',
    driverPhone: '',
    driverLicense: '',
    conductorName: '',
    conductorPhone: '',
    monthlyFee: '2400',
    capacity: '45',
    morningDepartureTime: '06:45 AM',
    morningArrivalTime: '07:50 AM',
    eveningDepartureTime: '03:15 PM',
    eveningArrivalTime: '04:30 PM',
    stops: [
      { id: 1, name: 'Greenfield Heights Gate 2', time: '06:50 AM', lat: 28.665, lng: 77.205, students: 6 },
      { id: 2, name: 'St. Xavier Circle', time: '07:05 AM', lat: 28.652, lng: 77.210, students: 12 },
      { id: 3, name: 'Civil Lines Metro Interchange', time: '07:20 AM', lat: 28.640, lng: 77.218, students: 8 },
      { id: 4, name: 'Apex International Main Quadrangle', time: '07:50 AM', lat: 28.610, lng: 77.235, students: 0 },
    ]
  })

  // Initial Data Fetch
  useEffect(() => {
    fetchRoutes()
    fetchStudents()
  }, [])

  // Auto-select first route when loaded
  useEffect(() => {
    if (routes.length > 0 && !selectedRouteId) {
      setSelectedRouteId(routes[0].id)
    }
  }, [routes])

  // Load detailed route students and breadcrumbs when selectedRouteId changes
  useEffect(() => {
    if (selectedRouteId) {
      fetchRouteDetails(selectedRouteId)
      fetchBreadcrumbs(selectedRouteId)
    }
  }, [selectedRouteId])

  // Real-time Polling Loop (every 3 seconds) for live vehicle coordinates
  useEffect(() => {
    const interval = setInterval(() => {
      fetchRoutesQuietly()
      if (selectedRouteId) {
        fetchBreadcrumbs(selectedRouteId)
      }
    }, 3000)
    return () => clearInterval(interval)
  }, [selectedRouteId])

  const fetchRoutes = async () => {
    setLoading(true)
    try {
      const res = await api.get('/transport')
      setRoutes(res.data)
      setLastPollingTime(new Date())
    } catch (err) {
      console.error('Failed to load transport routes', err)
      setMessage({ type: 'error', text: 'Failed to load transport routes.' })
    } finally {
      setLoading(false)
    }
  }

  const fetchRoutesQuietly = async () => {
    try {
      const res = await api.get('/transport')
      setRoutes(res.data)
      setLastPollingTime(new Date())
    } catch (err) {
      // Quiet poll error
    }
  }

  const fetchStudents = async () => {
    try {
      const res = await api.get('/students')
      setAllStudents(res.data || [])
    } catch (err) {
      console.error('Failed to fetch students', err)
    }
  }

  const fetchRouteDetails = async (id) => {
    try {
      const res = await api.get(`/transport/${id}`)
      setSelectedRouteDetails(res.data)
    } catch (err) {
      console.error('Failed to load route details', err)
    }
  }

  const fetchBreadcrumbs = async (id) => {
    try {
      const res = await api.get(`/transport/${id}/gps-history`)
      setBreadcrumbs(res.data || [])
    } catch (err) {
      // Quiet error
    }
  }

  const selectedRoute = routes.find(r => r.id === selectedRouteId) || routes[0]

  const parseTimeToMinutes = (timeStr) => {
    if (!timeStr) return 0
    const match = timeStr.trim().match(/^(\d{1,2}):(\d{2})\s*(AM|PM)?$/i)
    if (!match) return 0
    let hours = parseInt(match[1], 10)
    const minutes = parseInt(match[2], 10)
    const period = (match[3] || '').toUpperCase()
    if (period === 'PM' && hours < 12) hours += 12
    if (period === 'AM' && hours === 12) hours = 0
    return hours * 60 + minutes
  }

  const handleMoveStop = (index, direction) => {
    const targetIndex = index + direction
    if (targetIndex < 0 || targetIndex >= formData.stops.length) return
    const updated = [...formData.stops]
    const temp = updated[index]
    updated[index] = updated[targetIndex]
    updated[targetIndex] = temp
    setFormData({ ...formData, stops: updated })
  }

  const handleAutoSortStops = () => {
    const sorted = [...formData.stops].sort((a, b) => {
      const tA = parseTimeToMinutes(a.time)
      const tB = parseTimeToMinutes(b.time)
      return tA - tB
    })
    setFormData({ ...formData, stops: sorted })
    setMessage({ type: 'success', text: 'Stops re-sequenced in chronological departure order.' })
  }

  const handleAddStop = () => {
    const nextId = formData.stops.length + 1
    const newStop = {
      id: nextId,
      name: `Boarding Point ${nextId}`,
      time: '07:15 AM',
      lat: 28.6300,
      lng: 77.2200,
      students: 0
    }
    setFormData({
      ...formData,
      stops: [...formData.stops, newStop]
    })
  }

  const handleRemoveStop = (index) => {
    if (formData.stops.length <= 2) {
      alert('A route corridor must have at least 2 points (Origin and Terminus).')
      return
    }
    const updated = formData.stops.filter((_, i) => i !== index)
    setFormData({ ...formData, stops: updated })
  }

  const handleStopChange = (index, field, value) => {
    const updated = [...formData.stops]
    updated[index] = {
      ...updated[index],
      [field]: field === 'students' ? (parseInt(value, 10) || 0) : value
    }
    setFormData({ ...formData, stops: updated })
  }

  const handleCreateOrUpdateRoute = async (e) => {
    e.preventDefault()
    try {
      const cap = parseInt(formData.capacity, 10)
      const fee = parseFloat(formData.monthlyFee)
      if (isNaN(cap) || cap < 1 || cap > 150) {
        setMessage({ type: 'error', text: 'Vehicle seating capacity must be in the permitted range [1 - 150].' })
        return
      }
      if (isNaN(fee) || fee < 0 || fee > 100000) {
        setMessage({ type: 'error', text: 'Monthly transport fee must be in the permitted range [₹0 - ₹100,000].' })
        return
      }

      // Ensure all stops have numeric lat & lng parsed safely
      const sanitizedStops = (formData.stops || []).map((s, idx) => ({
        ...s,
        id: s.id || (idx + 1),
        lat: Number(parseFloat(s.lat)) || 28.610,
        lng: Number(parseFloat(s.lng)) || 77.235,
        students: parseInt(s.students, 10) || 0
      }))

      const payload = {
        routeName: formData.routeName,
        busNumber: formData.busNumber,
        plateNumber: formData.plateNumber,
        hardwareDeviceId: formData.hardwareDeviceId || 'GPS-APEX-01',
        operatorUsername: formData.operatorUsername || 'bus01',
        sourceName: formData.sourceName || 'Origin Terminal',
        destinationName: formData.destinationName || 'Apex International Main Quadrangle',
        driverName: formData.driverName,
        driverPhone: formData.driverPhone,
        driverLicense: formData.driverLicense,
        conductorName: formData.conductorName,
        conductorPhone: formData.conductorPhone,
        monthlyFee: parseFloat(formData.monthlyFee) || 2400,
        capacity: parseInt(formData.capacity, 10) || 45,
        morningDepartureTime: formData.morningDepartureTime,
        morningArrivalTime: formData.morningArrivalTime,
        eveningDepartureTime: formData.eveningDepartureTime,
        eveningArrivalTime: formData.eveningArrivalTime,
        stopsJson: JSON.stringify(sanitizedStops),
        currentLat: sanitizedStops[0]?.lat || 28.610,
        currentLng: sanitizedStops[0]?.lng || 77.235,
        currentStatus: 'IN_TRANSIT'
      }

      if (editingRoute) {
        await api.put(`/transport/${editingRoute.id}`, payload)
        setMessage({ type: 'success', text: `Route "${formData.routeName}" updated successfully.` })
      } else {
        const res = await api.post('/transport', payload)
        setMessage({ type: 'success', text: `New Route "${formData.routeName}" registered successfully.` })
        setSelectedRouteId(res.data.id)
      }

      setShowAddRouteModal(false)
      setEditingRoute(null)
      fetchRoutes()
    } catch (err) {
      setMessage({ type: 'error', text: err.response?.data?.message || 'Failed to save route.' })
    }
  }

  const handleDeleteRoute = async (id) => {
    if (!window.confirm('Are you sure you want to decommission this transport route? Assigned scholars will be safely unlinked.')) return
    try {
      await api.delete(`/transport/${id}`)
      setMessage({ type: 'success', text: 'Transport route decommissioned.' })
      setSelectedRouteId(null)
      fetchRoutes()
    } catch (err) {
      setMessage({ type: 'error', text: 'Failed to delete transport route.' })
    }
  }

  const handleAssignStudent = async (e) => {
    e.preventDefault()
    if (!assignStudentId || !selectedRouteId) return
    try {
      await api.post(`/transport/${selectedRouteId}/assign-student`, {
        studentId: parseInt(assignStudentId, 10),
        busStop: assignStopName || (selectedRoute?.nextStop || 'Campus Main Gate')
      })
      setMessage({ type: 'success', text: 'Scholar assigned to bus route successfully.' })
      setShowAssignStudentModal(false)
      setAssignStudentId('')
      setAssignStopName('')
      fetchRoutes()
      fetchRouteDetails(selectedRouteId)
    } catch (err) {
      setMessage({ type: 'error', text: err.response?.data?.message || 'Failed to assign scholar.' })
    }
  }

  const handleUnassignStudent = async (studentId) => {
    if (!window.confirm('Remove scholar from this bus pass allocation?')) return
    try {
      await api.post(`/transport/unassign-student/${studentId}`)
      setMessage({ type: 'success', text: 'Scholar unassigned from transport.' })
      fetchRoutes()
      fetchRouteDetails(selectedRouteId)
    } catch (err) {
      setMessage({ type: 'error', text: 'Failed to unassign student.' })
    }
  }

  const openEditModal = (route) => {
    let parsedStops = []
    try {
      parsedStops = typeof route.stopsJson === 'string' ? JSON.parse(route.stopsJson) : route.stopsJson || []
    } catch (e) {
      parsedStops = []
    }

    setEditingRoute(route)
    setFormData({
      routeName: route.routeName || '',
      busNumber: route.busNumber || '',
      plateNumber: route.plateNumber || '',
      hardwareDeviceId: route.hardwareDeviceId || 'GPS-APEX-0' + route.id,
      operatorUsername: route.operatorUsername || 'bus0' + route.id,
      sourceName: route.sourceName || 'Greenfield Heights Terminal',
      destinationName: route.destinationName || 'Apex International Main Quadrangle',
      driverName: route.driverName || '',
      driverPhone: route.driverPhone || '',
      driverLicense: route.driverLicense || '',
      conductorName: route.conductorName || '',
      conductorPhone: route.conductorPhone || '',
      monthlyFee: route.monthlyFee?.toString() || '2400',
      capacity: route.capacity?.toString() || '45',
      morningDepartureTime: route.morningDepartureTime || '06:45 AM',
      morningArrivalTime: route.morningArrivalTime || '07:50 AM',
      eveningDepartureTime: route.eveningDepartureTime || '03:15 PM',
      eveningArrivalTime: route.eveningArrivalTime || '04:30 PM',
      stops: parsedStops.length > 0 ? parsedStops : [
        { id: 1, name: 'Sector 14 Residential Gate', time: '06:50 AM', lat: 28.665, lng: 77.205, students: 6 },
        { id: 2, name: 'Apex Academy Main Quadrangle', time: '07:50 AM', lat: 28.610, lng: 77.235, students: 0 }
      ]
    })
    setShowAddRouteModal(true)
  }

  const totalCapacity = routes.reduce((acc, r) => acc + (r.capacity || 0), 0)
  const totalAssigned = routes.reduce((acc, r) => acc + (r.assignedStudentsCount || 0), 0)
  const activeBroadcastingCount = routes.filter(r => r.isBroadcasting).length

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      
      {/* Top Banner & Title */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs font-black tracking-widest text-blue-400 uppercase">
            <span className="flex h-2 w-2 relative">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
            </span>
            Real-World Transit Fleet Command Center
          </div>
          <h1 className="text-3xl font-black text-white tracking-tight flex items-center gap-3">
            <HiTruck className="text-blue-500" />
            Interactive Transport Route & Real GPS Bus Tracker
          </h1>
          <p className="text-sm text-slate-400 mt-1">
            Real-world OpenStreetMap cartography, live driver GPS mobile broadcaster, student boarding scanner, and emergency dispatch.
          </p>
        </div>

        {/* Global Action Buttons */}
        <div className="flex flex-wrap items-center gap-2">
          
          {/* Driver Transmitter Cockpit Launcher */}
          <button
            type="button"
            onClick={() => setShowDriverTransmitter(true)}
            className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-extrabold text-xs tracking-wider uppercase shadow-lg shadow-emerald-600/30 transition flex items-center gap-2 animate-pulse"
          >
            <FiRadio className="text-sm" />
            Driver Transmitter Cockpit
          </button>

          {/* Add Route Button */}
          <button
            type="button"
            onClick={() => {
              setEditingRoute(null)
              setShowAddRouteModal(true)
            }}
            className="px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs shadow-lg shadow-blue-600/30 transition flex items-center gap-1.5"
          >
            <HiPlus className="text-sm" />
            Register Bus Route
          </button>

          {/* Manifest Print Button */}
          <button
            type="button"
            onClick={() => setShowManifestModal(true)}
            className="px-3 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 font-bold text-xs transition flex items-center gap-1.5"
          >
            <HiPrinter />
            Print Manifest
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

      {/* Live Fleet KPI Ribbon */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 flex items-center gap-3 shadow-lg">
          <div className="w-12 h-12 rounded-xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-blue-400">
            <HiTruck className="text-2xl" />
          </div>
          <div>
            <div className="text-2xl font-black text-white">{routes.length} Active Buses</div>
            <div className="text-xs text-slate-400">
              {activeBroadcastingCount} broadcasting live GPS
            </div>
          </div>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 flex items-center gap-3 shadow-lg">
          <div className="w-12 h-12 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
            <HiAcademicCap className="text-2xl" />
          </div>
          <div>
            <div className="text-2xl font-black text-white">{totalAssigned} Scholars</div>
            <div className="text-xs text-slate-400">
              {totalCapacity > 0 ? `${Math.round((totalAssigned / totalCapacity) * 100)}% Fleet Capacity` : '0%'}
            </div>
          </div>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 flex items-center gap-3 shadow-lg">
          <div className="w-12 h-12 rounded-xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400">
            <FiCompass className="text-2xl" />
          </div>
          <div>
            <div className="text-2xl font-black text-indigo-400">±3m to ±5m</div>
            <div className="text-xs text-slate-400">GPS Signal Precision</div>
          </div>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 flex items-center gap-3 shadow-lg">
          <div className="w-12 h-12 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400">
            <HiShieldCheck className="text-2xl" />
          </div>
          <div>
            <div className="text-2xl font-black text-amber-400">98.6% On-Time</div>
            <div className="text-xs text-slate-400">Punctuality Score</div>
          </div>
        </div>

      </div>

      {/* Fleet Route Selector Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {routes.map((route) => {
          const isSelected = selectedRoute?.id === route.id
          const isBroadcasting = Boolean(route.isBroadcasting)
          const isSos = route.emergencyStatus === 'EMERGENCY_SOS'
          const occupancy = route.capacity ? Math.round(((route.assignedStudentsCount || 0) / route.capacity) * 100) : 0

          return (
            <div
              key={route.id}
              onClick={() => setSelectedRouteId(route.id)}
              className={`p-4 rounded-2xl cursor-pointer transition-all border text-left relative overflow-hidden ${isSelected ? 'bg-slate-800 border-blue-500 shadow-xl shadow-blue-500/10 ring-2 ring-blue-500/30' : 'bg-slate-900 border-slate-800 hover:border-slate-700'}`}
            >
              {isSos && (
                <div className="absolute top-0 right-0 bg-red-600 text-white text-[9px] font-black uppercase px-2 py-0.5 rounded-bl-lg animate-pulse">
                  SOS ALERT
                </div>
              )}

              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-black text-white">{route.busNumber}</span>
                  <span className="text-[10px] text-slate-400 font-mono">({route.plateNumber})</span>
                </div>
                <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${isBroadcasting ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40' : 'bg-slate-800 text-slate-400'}`}>
                  {isBroadcasting ? '● LIVE' : 'STANDBY'}
                </span>
              </div>

              <div className="font-bold text-xs text-slate-200 truncate mb-2">
                {route.routeName}
              </div>

              <div className="flex items-center justify-between text-[11px] text-slate-400 mb-2">
                <span>Speed: <strong className="text-white">{route.currentSpeedKmh || 0} km/h</strong></span>
                <span>Next: <strong className="text-slate-200">{route.nextStop || 'In Transit'}</strong></span>
              </div>

              {/* Capacity Bar */}
              <div>
                <div className="flex justify-between text-[10px] font-bold text-slate-400 mb-1">
                  <span>Occupancy</span>
                  <span>{route.assignedStudentsCount || 0} / {route.capacity || 45} ({occupancy}%)</span>
                </div>
                <div className="w-full bg-slate-800 h-1.5 rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full ${occupancy > 90 ? 'bg-rose-500' : occupancy > 70 ? 'bg-amber-500' : 'bg-blue-500'}`}
                    style={{ width: `${Math.min(occupancy, 100)}%` }}
                  ></div>
                </div>
              </div>

            </div>
          )
        })}
      </div>

      {/* Real-World Leaflet OpenStreetMap Map */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2 text-xs font-bold text-slate-300">
            <HiGlobeAlt className="text-blue-400 text-sm" />
            <span>OpenStreetMap Real-World Satellite & Street Telemetry Map</span>
          </div>
          <div className="text-[11px] text-slate-400 flex items-center gap-2">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
            </span>
            <span>Live Sync: {lastPollingTime.toLocaleTimeString()}</span>
          </div>
        </div>

        <RealWorldBusMap
          routes={routes}
          selectedRouteId={selectedRouteId}
          onSelectRoute={(id) => setSelectedRouteId(id)}
          breadcrumbs={breadcrumbs}
          height="540px"
        />
      </div>

      {/* Selected Bus Telemetry Cockpit & Driver Dossier */}
      {selectedRoute && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          
          {/* Telemetry Gauge Card */}
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <FiActivity className="text-blue-400 text-lg" />
                <h3 className="text-sm font-black text-white uppercase tracking-wider">
                  Vehicle Telemetry Cockpit
                </h3>
              </div>
              <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold ${selectedRoute.isBroadcasting ? 'bg-emerald-500/20 text-emerald-400' : 'bg-slate-800 text-slate-400'}`}>
                {selectedRoute.isBroadcasting ? '● Active Broadcast' : 'Stationary'}
              </span>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="bg-slate-800/60 p-4 rounded-2xl text-center">
                <div className="text-xs text-slate-400 font-bold mb-1">Live Speed</div>
                <div className="text-3xl font-black text-white">
                  {selectedRoute.currentSpeedKmh || 0}
                  <span className="text-xs text-slate-400 font-normal ml-1">km/h</span>
                </div>
                <div className="text-[10px] text-emerald-400 font-semibold mt-1">
                  Speed Limit: 50 km/h
                </div>
              </div>

              <div className="bg-slate-800/60 p-4 rounded-2xl text-center">
                <div className="text-xs text-slate-400 font-bold mb-1">Next Stop ETA</div>
                <div className="text-3xl font-black text-amber-400">
                  {selectedRoute.nextStopEtaMinutes !== null ? selectedRoute.nextStopEtaMinutes : 4}
                  <span className="text-xs text-slate-400 font-normal ml-1">mins</span>
                </div>
                <div className="text-[10px] text-slate-400 truncate mt-1">
                  {selectedRoute.nextStop || 'In Transit'}
                </div>
              </div>
            </div>

            <div className="bg-slate-800/40 p-3 rounded-xl border border-slate-800 text-xs text-slate-300 space-y-1.5">
              <div className="flex justify-between">
                <span className="text-slate-400">Current Position:</span>
                <span className="font-mono font-bold text-white">
                  {selectedRoute.currentLat ? `${selectedRoute.currentLat.toFixed(5)}, ${selectedRoute.currentLng?.toFixed(5)}` : 'N/A'}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Compass Heading:</span>
                <span className="font-bold text-white">{selectedRoute.heading || 0}°</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">GPS Signal Quality:</span>
                <span className="font-bold text-emerald-400">±{selectedRoute.gpsAccuracyMeters || 5} meters</span>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1">
              <button
                type="button"
                onClick={() => setShowDriverTransmitter(true)}
                className="py-2.5 px-3 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold transition flex items-center justify-center gap-1.5 shadow-lg shadow-blue-600/30"
              >
                <FiRadio /> Driver Cockpit
              </button>
              <button
                type="button"
                onClick={() => setShowPlaybackModal(true)}
                className="py-2.5 px-3 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white text-xs font-bold transition flex items-center justify-center gap-1.5 shadow-lg shadow-indigo-600/30"
              >
                <FiNavigation /> Replay Trip
              </button>
            </div>
          </div>

          {/* Driver & Conductor Dossier */}
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <HiShieldCheck className="text-emerald-400 text-lg" />
                <h3 className="text-sm font-black text-white uppercase tracking-wider">
                  Driver & Safety Escort Dossier
                </h3>
              </div>
              <button
                onClick={() => openEditModal(selectedRoute)}
                className="text-xs text-blue-400 hover:text-blue-300 font-bold flex items-center gap-1"
              >
                <HiPencilSquare /> Edit Crew
              </button>
            </div>

            {/* Driver Card */}
            <div className="p-4 rounded-2xl bg-slate-800/70 border border-slate-700/60 flex items-start gap-3">
              <div className="w-12 h-12 rounded-2xl bg-blue-600 flex items-center justify-center text-white font-black text-lg shrink-0">
                {selectedRoute.driverName ? selectedRoute.driverName.charAt(0) : 'D'}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between">
                  <h4 className="text-sm font-bold text-white truncate">{selectedRoute.driverName}</h4>
                  <span className="text-[10px] font-bold text-emerald-400 px-2 py-0.5 rounded bg-emerald-950/60 border border-emerald-800">
                    Verified
                  </span>
                </div>
                <div className="text-xs text-slate-400 mt-0.5">Commercial Heavy Driver</div>
                <div className="text-[11px] text-slate-400 mt-1 font-mono">
                  Lic: {selectedRoute.driverLicense || 'DL-COMM-2023-1002'}
                </div>
                <a
                  href={`tel:${selectedRoute.driverPhone}`}
                  className="inline-flex items-center gap-1.5 mt-2 text-xs font-bold text-blue-400 hover:text-blue-300"
                >
                  <HiPhone className="text-xs" /> {selectedRoute.driverPhone || 'Not provided'}
                </a>
              </div>
            </div>

            {/* Conductor Card */}
            <div className="p-4 rounded-2xl bg-slate-800/70 border border-slate-700/60 flex items-start gap-3">
              <div className="w-12 h-12 rounded-2xl bg-indigo-600 flex items-center justify-center text-white font-black text-lg shrink-0">
                {selectedRoute.conductorName ? selectedRoute.conductorName.charAt(0) : 'C'}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between">
                  <h4 className="text-sm font-bold text-white truncate">{selectedRoute.conductorName || 'Attendant on Duty'}</h4>
                  <span className="text-[10px] font-bold text-indigo-400 px-2 py-0.5 rounded bg-indigo-950/60 border border-indigo-800">
                    Safety Escort
                  </span>
                </div>
                <div className="text-xs text-slate-400 mt-0.5">Route Marshal & Conductor</div>
                <a
                  href={`tel:${selectedRoute.conductorPhone}`}
                  className="inline-flex items-center gap-1.5 mt-2 text-xs font-bold text-indigo-400 hover:text-indigo-300"
                >
                  <HiPhone className="text-xs" /> {selectedRoute.conductorPhone || 'Not provided'}
                </a>
              </div>
            </div>
          </div>

          {/* Schedule & Route Operational Stats */}
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <HiClock className="text-amber-400 text-lg" />
                <h3 className="text-sm font-black text-white uppercase tracking-wider">
                  Daily Timetable & Fare
                </h3>
              </div>
              <span className="text-xs font-bold text-emerald-400">
                ₹{selectedRoute.monthlyFee || 2400}/mo
              </span>
            </div>

            <div className="space-y-3">
              <div className="p-3.5 rounded-xl bg-slate-800/60 border border-slate-800 flex items-center justify-between">
                <div>
                  <div className="text-xs font-bold text-slate-400">Morning Pickup Cycle</div>
                  <div className="text-sm font-black text-white">
                    {selectedRoute.morningDepartureTime || '06:45 AM'} → {selectedRoute.morningArrivalTime || '07:50 AM'}
                  </div>
                </div>
                <span className="text-xs font-bold text-blue-400">Campus Arrival</span>
              </div>

              <div className="p-3.5 rounded-xl bg-slate-800/60 border border-slate-800 flex items-center justify-between">
                <div>
                  <div className="text-xs font-bold text-slate-400">Evening Dropoff Cycle</div>
                  <div className="text-sm font-black text-white">
                    {selectedRoute.eveningDepartureTime || '03:15 PM'} → {selectedRoute.eveningArrivalTime || '04:30 PM'}
                  </div>
                </div>
                <span className="text-xs font-bold text-amber-400">Campus Departure</span>
              </div>
            </div>

            <div className="pt-2 flex gap-2">
              <button
                type="button"
                onClick={() => setShowAssignStudentModal(true)}
                className="flex-1 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs transition flex items-center justify-center gap-1.5 shadow-lg shadow-emerald-600/30"
              >
                <HiUserPlus /> Assign Scholar
              </button>
              <button
                type="button"
                onClick={() => handleDeleteRoute(selectedRoute.id)}
                className="p-2.5 rounded-xl bg-slate-800 hover:bg-rose-950 text-rose-400 border border-slate-700 hover:border-rose-800 transition"
                title="Decommission Route"
              >
                <HiTrash />
              </button>
            </div>
          </div>

        </div>
      )}

      {/* Tabbed Detail Section (Stops, Assigned Students, Boarding Logs, Breadcrumbs) */}
      <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-xl">
        <div className="flex border-b border-slate-800 pb-4 mb-6 gap-3 overflow-x-auto">
          <button
            onClick={() => setActiveTab('MAP')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-2 ${activeTab === 'MAP' ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/30' : 'bg-slate-800 text-slate-400 hover:text-white'}`}
          >
            <HiMapPin /> Waypoint Stops & Coordinates
          </button>

          <button
            onClick={() => setActiveTab('STUDENTS')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-2 ${activeTab === 'STUDENTS' ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/30' : 'bg-slate-800 text-slate-400 hover:text-white'}`}
          >
            <HiUser /> Scholar Boarding Manifest ({selectedRouteDetails?.students?.length || 0})
          </button>

          <button
            onClick={() => setActiveTab('LOGS')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-2 ${activeTab === 'LOGS' ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/30' : 'bg-slate-800 text-slate-400 hover:text-white'}`}
          >
            <FiActivity /> Live Boarding Scan Stream
          </button>

          <button
            onClick={() => setActiveTab('BREADCRUMBS')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-2 ${activeTab === 'BREADCRUMBS' ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/30' : 'bg-slate-800 text-slate-400 hover:text-white'}`}
          >
            <FiNavigation /> GPS Breadcrumbs Trail ({breadcrumbs.length})
          </button>
        </div>

        {/* Tab 1: Waypoints & Stops */}
        {activeTab === 'MAP' && (
          <div className="space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div className="text-xs text-slate-400">
                Waypoints and boarding points define the travels corridor from <strong className="text-slate-200">{selectedRoute?.sourceName || 'Origin Terminal'}</strong> to <strong className="text-slate-200">{selectedRoute?.destinationName || 'Main Campus'}</strong>.
              </div>
              <button
                type="button"
                onClick={() => openEditModal(selectedRoute)}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-bold transition flex items-center gap-1.5 shadow-lg shadow-blue-600/30"
              >
                <HiPencilSquare /> Configure Boarding Points & Corridor
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {(() => {
                let stops = []
                try {
                  stops = typeof selectedRoute?.stopsJson === 'string' ? JSON.parse(selectedRoute.stopsJson) : selectedRoute?.stopsJson || []
                } catch (e) {
                  stops = []
                }
                return stops.map((stop, i) => (
                  <div key={i} className="bg-slate-800/60 border border-slate-700/60 rounded-2xl p-4 flex flex-col justify-between">
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <span className="w-6 h-6 rounded-full bg-blue-600 text-white font-extrabold text-xs flex items-center justify-center">
                          {i + 1}
                        </span>
                        <span className="text-xs font-bold text-amber-400">{stop.time}</span>
                      </div>
                      <h4 className="text-sm font-bold text-white mb-1">{stop.name}</h4>
                      <div className="text-xs text-slate-400">
                        {stop.students || 0} Scholars Boarding
                      </div>
                    </div>
                    <div className="mt-3 text-[10px] text-slate-500 font-mono">
                      GPS: {stop.lat ? `${Number(stop.lat).toFixed(4)}, ${Number(stop.lng).toFixed(4)}` : 'N/A'}
                    </div>
                  </div>
                ))
              })()}
            </div>
          </div>
        )}

        {/* Tab 2: Scholar Manifest */}
        {activeTab === 'STUDENTS' && (
          <div className="space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div className="relative flex-1 max-w-sm">
                <HiMagnifyingGlass className="absolute left-3 top-2.5 text-slate-400 text-sm" />
                <input
                  type="text"
                  placeholder="Search passenger name or admission..."
                  value={searchStudentQuery}
                  onChange={(e) => setSearchStudentQuery(e.target.value)}
                  className="w-full pl-9 pr-4 py-2 bg-slate-800 border border-slate-700 rounded-xl text-xs text-white placeholder-slate-400 focus:outline-none"
                />
              </div>

              <button
                type="button"
                onClick={() => setShowAssignStudentModal(true)}
                className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-lg shadow-emerald-600/30"
              >
                <HiUserPlus /> Add Student to Route
              </button>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs text-slate-300">
                <thead className="bg-slate-800/80 text-slate-400 uppercase font-black tracking-wider">
                  <tr>
                    <th className="p-3 rounded-l-xl">Scholar Name</th>
                    <th className="p-3">Admission No</th>
                    <th className="p-3">Class & Sec</th>
                    <th className="p-3">Designated Stop</th>
                    <th className="p-3 rounded-r-xl text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800">
                  {(selectedRouteDetails?.students || [])
                    .filter(s => !searchStudentQuery || s.fullName?.toLowerCase().includes(searchStudentQuery.toLowerCase()) || s.admissionNumber?.toLowerCase().includes(searchStudentQuery.toLowerCase()))
                    .map((student) => (
                      <tr key={student.id} className="hover:bg-slate-800/40">
                        <td className="p-3 font-bold text-white flex items-center gap-2">
                          <div className="w-7 h-7 rounded-full bg-blue-600/30 border border-blue-500/40 flex items-center justify-center text-blue-300 font-bold text-xs">
                            {student.fullName?.charAt(0)}
                          </div>
                          {student.fullName}
                        </td>
                        <td className="p-3 font-mono">{student.admissionNumber}</td>
                        <td className="p-3">{student.className}</td>
                        <td className="p-3">
                          <span className="inline-flex items-center gap-1 text-slate-200">
                            <HiMapPin className="text-amber-400" /> {student.busStop || 'Default'}
                          </span>
                        </td>
                        <td className="p-3 text-right">
                          <button
                            type="button"
                            onClick={() => handleUnassignStudent(student.id)}
                            className="px-2.5 py-1 rounded bg-rose-950/60 hover:bg-rose-900 text-rose-400 border border-rose-800 font-bold text-[11px] transition"
                          >
                            Unassign
                          </button>
                        </td>
                      </tr>
                    ))}
                  {(selectedRouteDetails?.students || []).length === 0 && (
                    <tr>
                      <td colSpan="5" className="text-center py-8 text-slate-500 font-medium">
                        No scholars currently allocated to this transport route. Click "Add Student to Route" to assign.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Tab 3: Boarding Scan Logs */}
        {activeTab === 'LOGS' && (
          <div className="space-y-4">
            <div className="text-xs text-slate-400 mb-2">
              Real-time audit log of student boardings and deboardings scanned via driver cockpit or RFID.
            </div>

            <div className="space-y-2 max-h-96 overflow-y-auto">
              {(selectedRouteDetails?.recentBoardingLogs || []).map((log) => (
                <div key={log.id} className="p-3 rounded-xl bg-slate-800/70 border border-slate-700 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-emerald-600/20 text-emerald-400 flex items-center justify-center text-sm font-bold">
                      ✓
                    </div>
                    <div>
                      <div className="text-sm font-bold text-white">{log.studentName}</div>
                      <div className="text-xs text-slate-400 flex items-center gap-2">
                        <span>Action: <strong>{log.actionType}</strong></span>
                        <span>•</span>
                        <span>Stop: <strong>{log.stopName || 'Designated Stop'}</strong></span>
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-xs font-bold text-slate-200">
                      {new Date(log.scannedAt).toLocaleTimeString()}
                    </div>
                    <div className="text-[10px] text-slate-400">By {log.scannedBy}</div>
                  </div>
                </div>
              ))}
              {(selectedRouteDetails?.recentBoardingLogs || []).length === 0 && (
                <div className="text-center py-8 text-slate-500">
                  No boarding scans recorded for this bus today yet.
                </div>
              )}
            </div>
          </div>
        )}

        {/* Tab 4: GPS Breadcrumbs Trail */}
        {activeTab === 'BREADCRUMBS' && (
          <div className="space-y-4">
            <div className="text-xs text-slate-400 mb-2">
              Recent high-frequency GPS breadcrumbs received from the driver device or IoT hardware.
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 max-h-96 overflow-y-auto">
              {breadcrumbs.map((crumb) => (
                <div key={crumb.id} className="p-3 rounded-xl bg-slate-800/60 border border-slate-700 text-xs">
                  <div className="flex justify-between text-slate-400 mb-1">
                    <span>{new Date(crumb.recordedAt).toLocaleTimeString()}</span>
                    <span className="font-bold text-emerald-400">{crumb.speedKmh} km/h</span>
                  </div>
                  <div className="font-mono text-white">
                    {crumb.latitude.toFixed(5)}, {crumb.longitude.toFixed(5)}
                  </div>
                  <div className="text-[10px] text-slate-500 mt-1 flex justify-between">
                    <span>Heading: {crumb.headingDegrees || 0}°</span>
                    <span>Acc: ±{crumb.accuracyMeters || 5}m</span>
                  </div>
                </div>
              ))}
              {breadcrumbs.length === 0 && (
                <div className="col-span-full text-center py-8 text-slate-500">
                  No breadcrumbs recorded yet. Start a broadcast from the Driver Cockpit to generate real-world GPS logs.
                </div>
              )}
            </div>
          </div>
        )}

      </div>

      {/* Driver GPS Transmitter Cockpit Modal */}
      {showDriverTransmitter && selectedRoute && (
        <DriverGpsTransmitter
          route={selectedRoute}
          onClose={() => setShowDriverTransmitter(false)}
          onTelemetryUpdate={(updatedRoute) => {
            fetchRoutesQuietly()
            if (selectedRouteId) fetchBreadcrumbs(selectedRouteId)
          }}
        />
      )}

      {/* Modal: Add/Edit Route */}
      {showAddRouteModal && (
        <div className="fixed inset-0 z-[3000] bg-black/75 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-slate-900 border border-slate-700 w-full max-w-2xl rounded-3xl shadow-2xl p-6 space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="text-base font-black text-white">
                {editingRoute ? 'Edit Transport Fleet Route' : 'Register New Bus Route'}
              </h3>
              <button onClick={() => setShowAddRouteModal(false)} className="text-slate-400 hover:text-white text-xl">
                &times;
              </button>
            </div>

            <form onSubmit={handleCreateOrUpdateRoute} className="space-y-5">
              
              {/* Basic Route & Vehicle Metadata */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-400 mb-1">Route Name</label>
                  <input
                    type="text"
                    required
                    placeholder="Route 1 — Northern Metro Corridor"
                    value={formData.routeName}
                    onChange={(e) => setFormData({ ...formData, routeName: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-xs text-white focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-400 mb-1">Bus Callout & Number</label>
                  <input
                    type="text"
                    required
                    placeholder="BUS-01 (Apex Eagle)"
                    value={formData.busNumber}
                    onChange={(e) => setFormData({ ...formData, busNumber: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-xs text-white focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-400 mb-1">Vehicle License Plate</label>
                  <input
                    type="text"
                    required
                    placeholder="DL-01-AX-9942"
                    value={formData.plateNumber}
                    onChange={(e) => setFormData({ ...formData, plateNumber: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-xs text-white focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-400 mb-1">Seating Capacity</label>
                  <input
                    type="number"
                    required
                    value={formData.capacity}
                    onChange={(e) => setFormData({ ...formData, capacity: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-xs text-white focus:outline-none"
                  />
                </div>
              </div>

              {/* Corridor Source & Destination Terminals */}
              <div className="p-4 rounded-2xl bg-slate-800/40 border border-slate-700/80 space-y-3">
                <div className="flex items-center gap-2 text-xs font-black text-amber-400 uppercase tracking-wider">
                  <HiMapPin /> Route Corridor Endpoints (Travels-Style Corridor)
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-400 mb-1">Source Origin Terminal</label>
                    <input
                      type="text"
                      required
                      placeholder="Greenfield Heights Terminal"
                      value={formData.sourceName}
                      onChange={(e) => setFormData({ ...formData, sourceName: e.target.value })}
                      className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-xs text-white focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-400 mb-1">Final Destination Terminus</label>
                    <input
                      type="text"
                      required
                      placeholder="Apex International Main Quadrangle"
                      value={formData.destinationName}
                      onChange={(e) => setFormData({ ...formData, destinationName: e.target.value })}
                      className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-xs text-white focus:outline-none"
                    />
                  </div>
                </div>
              </div>

              {/* Hardware GPS Tracker & Sub-Login */}
              <div className="p-4 rounded-2xl bg-slate-800/40 border border-slate-700/80 space-y-3">
                <div className="flex items-center gap-2 text-xs font-black text-blue-400 uppercase tracking-wider">
                  <FiRadio /> Hardware GPS & Bus Sub-Login Dispatch
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-400 mb-1">Hardware GPS Device ID (IoT / OBD-II)</label>
                    <input
                      type="text"
                      required
                      placeholder="GPS-APEX-01"
                      value={formData.hardwareDeviceId}
                      onChange={(e) => setFormData({ ...formData, hardwareDeviceId: e.target.value })}
                      className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-xs text-white font-mono focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-400 mb-1">Bus Sub-Login Operator Username</label>
                    <input
                      type="text"
                      required
                      placeholder="bus01"
                      value={formData.operatorUsername}
                      onChange={(e) => setFormData({ ...formData, operatorUsername: e.target.value })}
                      className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-xs text-white font-mono focus:outline-none"
                    />
                  </div>
                </div>
              </div>

              {/* Interactive Boarding Stops & Waypoints Editor */}
              <div className="p-4 rounded-2xl bg-slate-800/60 border border-slate-700 space-y-3">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="flex items-center gap-2 text-xs font-black text-emerald-400 uppercase tracking-wider">
                    <HiMapPin /> Sequential Boarding Points & Waypoints ({formData.stops?.length || 0})
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={handleAutoSortStops}
                      title="Sort stops automatically in chronological order to ensure smooth forward travel without loops"
                      className="px-3 py-1 bg-indigo-600/30 hover:bg-indigo-600 text-indigo-300 hover:text-white border border-indigo-500/40 rounded-lg text-xs font-bold flex items-center gap-1 shadow-md transition"
                    >
                      <HiSparkles /> Auto-Sort by Time
                    </button>
                    <button
                      type="button"
                      onClick={handleAddStop}
                      className="px-3 py-1 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-bold flex items-center gap-1 shadow-md transition"
                    >
                      <HiPlus /> Add Stop
                    </button>
                  </div>
                </div>

                <div className="text-[11px] text-slate-400">
                  Set boarding points in chronological order from Origin to Terminus with GPS coordinates for automated 10-minute proximity alerts.
                </div>

                <div className="space-y-3 max-h-72 overflow-y-auto pr-1">
                  {(formData.stops || []).map((stop, idx) => (
                    <div key={idx} className="p-3 rounded-xl bg-slate-900 border border-slate-700/80 flex flex-wrap items-center gap-2">
                      <div className="w-6 h-6 rounded-full bg-blue-600 text-white font-black text-xs flex items-center justify-center shrink-0">
                        {idx + 1}
                      </div>

                      {/* Reorder Buttons */}
                      <div className="flex flex-col gap-0.5 shrink-0">
                        <button
                          type="button"
                          disabled={idx === 0}
                          onClick={() => handleMoveStop(idx, -1)}
                          className="p-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 disabled:opacity-30 text-[9px] font-bold leading-none"
                          title="Move Stop Up"
                        >
                          ▲
                        </button>
                        <button
                          type="button"
                          disabled={idx === formData.stops.length - 1}
                          onClick={() => handleMoveStop(idx, 1)}
                          className="p-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 disabled:opacity-30 text-[9px] font-bold leading-none"
                          title="Move Stop Down"
                        >
                          ▼
                        </button>
                      </div>

                      <div className="flex-1 min-w-[140px]">
                        <input
                          type="text"
                          required
                          placeholder="Stop Name (e.g. St. Xavier Circle)"
                          value={stop.name}
                          onChange={(e) => handleStopChange(idx, 'name', e.target.value)}
                          className="w-full px-2.5 py-1.5 bg-slate-800 border border-slate-700 rounded-lg text-xs text-white focus:outline-none"
                        />
                      </div>

                      <div className="w-24">
                        <input
                          type="text"
                          required
                          placeholder="07:05 AM"
                          value={stop.time}
                          onChange={(e) => handleStopChange(idx, 'time', e.target.value)}
                          className="w-full px-2 py-1.5 bg-slate-800 border border-slate-700 rounded-lg text-xs text-white font-mono focus:outline-none"
                          title="Scheduled Time"
                        />
                      </div>

                      <div className="w-24">
                        <input
                          type="text"
                          inputMode="decimal"
                          required
                          placeholder="Lat (28.65)"
                          value={stop.lat ?? ''}
                          onChange={(e) => handleStopChange(idx, 'lat', e.target.value)}
                          className="w-full px-2 py-1.5 bg-slate-800 border border-slate-700 rounded-lg text-xs text-white font-mono focus:outline-none"
                          title="Latitude (e.g. 28.6520)"
                        />
                      </div>

                      <div className="w-24">
                        <input
                          type="text"
                          inputMode="decimal"
                          required
                          placeholder="Lng (77.21)"
                          value={stop.lng ?? ''}
                          onChange={(e) => handleStopChange(idx, 'lng', e.target.value)}
                          className="w-full px-2 py-1.5 bg-slate-800 border border-slate-700 rounded-lg text-xs text-white font-mono focus:outline-none"
                          title="Longitude (e.g. 77.2100)"
                        />
                      </div>

                      <button
                        type="button"
                        onClick={() => setPickingStopIndex(idx)}
                        className="px-2.5 py-1.5 rounded-lg bg-blue-600/20 hover:bg-blue-600 text-blue-400 hover:text-white border border-blue-500/40 text-xs font-bold transition flex items-center gap-1 shrink-0"
                        title="Pick GPS coordinates on interactive Map"
                      >
                        <HiMapPin className="text-sm" /> Pick Map
                      </button>

                      <button
                        type="button"
                        onClick={() => handleRemoveStop(idx)}
                        className="p-1.5 rounded-lg bg-rose-600/20 text-rose-400 hover:bg-rose-600 hover:text-white transition text-xs shrink-0"
                        title="Remove Stop"
                      >
                        <HiTrash />
                      </button>
                    </div>
                  ))}
                </div>
              </div>

              {/* Crew Dossier & Financials */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-400 mb-1">Driver Name</label>
                  <input
                    type="text"
                    required
                    placeholder="Capt. Rajesh Sharma"
                    value={formData.driverName}
                    onChange={(e) => setFormData({ ...formData, driverName: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-xs text-white focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-400 mb-1">Driver Contact Phone</label>
                  <input
                    type="text"
                    required
                    placeholder="+91 98765 43210"
                    value={formData.driverPhone}
                    onChange={(e) => setFormData({ ...formData, driverPhone: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-xs text-white focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-400 mb-1">Conductor / Safety Escort</label>
                  <input
                    type="text"
                    placeholder="Suresh Kumar"
                    value={formData.conductorName}
                    onChange={(e) => setFormData({ ...formData, conductorName: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-xs text-white focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-400 mb-1">Monthly Transport Fee (₹)</label>
                  <input
                    type="number"
                    value={formData.monthlyFee}
                    onChange={(e) => setFormData({ ...formData, monthlyFee: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-xs text-white focus:outline-none"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-4 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowAddRouteModal(false)}
                  className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs font-bold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-bold shadow-lg shadow-blue-600/30"
                >
                  {editingRoute ? 'Save Route & Boarding Points' : 'Register Route & Waypoints'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Interactive Map Coordinate Picker */}
      {pickingStopIndex !== null && (
        <MapCoordinatePickerModal
          initialLat={parseFloat(formData.stops[pickingStopIndex]?.lat) || 28.6139}
          initialLng={parseFloat(formData.stops[pickingStopIndex]?.lng) || 77.2090}
          stopName={formData.stops[pickingStopIndex]?.name || `Stop #${pickingStopIndex + 1}`}
          onSave={({ lat, lng, address }) => {
            const updated = [...formData.stops]
            const currentName = updated[pickingStopIndex]?.name
            updated[pickingStopIndex] = {
              ...updated[pickingStopIndex],
              lat: lat,
              lng: lng,
              name: currentName && !currentName.startsWith('Boarding Point') ? currentName : (address ? address.split(',')[0].trim() : currentName)
            }
            setFormData({ ...formData, stops: updated })
            setPickingStopIndex(null)
          }}
          onClose={() => setPickingStopIndex(null)}
        />
      )}

      {/* Modal: Trip Playback & Road Simulation */}
      {showPlaybackModal && selectedRoute && (
        <RoutePlaybackModal
          route={selectedRoute}
          onClose={() => setShowPlaybackModal(false)}
        />
      )}

      {/* Modal: Assign Student */}
      {showAssignStudentModal && (
        <div className="fixed inset-0 z-[3000] bg-black/75 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-700 w-full max-w-md rounded-3xl shadow-2xl p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="text-base font-black text-white">Assign Scholar to Bus Route</h3>
              <button onClick={() => setShowAssignStudentModal(false)} className="text-slate-400 hover:text-white text-xl">
                &times;
              </button>
            </div>

            <form onSubmit={handleAssignStudent} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-400 mb-1">Select Enrolled Scholar</label>
                <select
                  required
                  value={assignStudentId}
                  onChange={(e) => setAssignStudentId(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-xs text-white focus:outline-none"
                >
                  <option value="">-- Choose Student --</option>
                  {allStudents.map(s => (
                    <option key={s.id} value={s.id}>
                      {s.fullName} ({s.admissionNumber}) — {s.schoolClass ? s.schoolClass.name + ' ' + s.schoolClass.section : 'N/A'}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-400 mb-1">Designated Boarding Stop</label>
                <input
                  type="text"
                  placeholder="e.g. Greenfield Heights Gate 2"
                  value={assignStopName}
                  onChange={(e) => setAssignStopName(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-xs text-white focus:outline-none"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowAssignStudentModal(false)}
                  className="px-4 py-2 bg-slate-800 text-slate-300 rounded-xl text-xs font-bold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold shadow-lg shadow-emerald-600/30"
                >
                  Confirm Allocation
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Printable Daily Boarding Manifest */}
      {showManifestModal && (
        <div className="fixed inset-0 z-[3000] bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white text-slate-900 w-full max-w-3xl rounded-3xl shadow-2xl p-8 space-y-6 max-h-[90vh] overflow-y-auto">
            
            {/* Header */}
            <div className="flex justify-between items-start border-b pb-4">
              <div>
                <h2 className="text-2xl font-black text-slate-900 tracking-tight">
                  APEX INTERNATIONAL ACADEMY
                </h2>
                <p className="text-xs text-slate-500 uppercase font-bold tracking-wider">
                  Official Transport Directorate • Daily Passenger Manifest
                </p>
              </div>
              <div className="text-right text-xs">
                <div className="font-bold text-slate-800">Date: {new Date().toLocaleDateString()}</div>
                <div className="text-slate-500">Bus: {selectedRoute?.busNumber}</div>
              </div>
            </div>

            {/* Route Metadata */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 p-4 bg-slate-50 rounded-2xl text-xs">
              <div>
                <span className="text-slate-500 block">Route Name</span>
                <strong className="text-slate-900">{selectedRoute?.routeName}</strong>
              </div>
              <div>
                <span className="text-slate-500 block">Plate Number</span>
                <strong className="text-slate-900">{selectedRoute?.plateNumber}</strong>
              </div>
              <div>
                <span className="text-slate-500 block">Driver In-Charge</span>
                <strong className="text-slate-900">{selectedRoute?.driverName}</strong>
              </div>
              <div>
                <span className="text-slate-500 block">Driver Phone</span>
                <strong className="text-slate-900">{selectedRoute?.driverPhone}</strong>
              </div>
            </div>

            {/* Student Table */}
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b-2 border-slate-900 text-slate-900 uppercase">
                  <th className="py-2">#</th>
                  <th className="py-2">Scholar Name</th>
                  <th className="py-2">Admission No</th>
                  <th className="py-2">Class</th>
                  <th className="py-2">Boarding Stop</th>
                  <th className="py-2 text-center">Morning Boarding</th>
                  <th className="py-2 text-center">Evening Dropoff</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {(selectedRouteDetails?.students || []).map((s, idx) => (
                  <tr key={s.id}>
                    <td className="py-2 font-bold">{idx + 1}</td>
                    <td className="py-2 font-bold">{s.fullName}</td>
                    <td className="py-2 font-mono">{s.admissionNumber}</td>
                    <td className="py-2">{s.className}</td>
                    <td className="py-2">{s.busStop || 'Main Gate'}</td>
                    <td className="py-2 text-center border-x">
                      <span className="inline-block w-4 h-4 border border-slate-400 rounded"></span>
                    </td>
                    <td className="py-2 text-center border-r">
                      <span className="inline-block w-4 h-4 border border-slate-400 rounded"></span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            <div className="flex justify-between items-center pt-6 border-t text-xs">
              <div className="space-y-4">
                <div>Driver Signature: ______________________</div>
                <div>Safety Marshal Signature: ______________</div>
              </div>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => window.print()}
                  className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl"
                >
                  Print Document
                </button>
                <button
                  type="button"
                  onClick={() => setShowManifestModal(false)}
                  className="px-4 py-2 bg-slate-200 hover:bg-slate-300 text-slate-800 font-bold rounded-xl"
                >
                  Close
                </button>
              </div>
            </div>

          </div>
        </div>
      )}

    </div>
  )
}

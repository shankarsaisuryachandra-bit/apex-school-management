import React from 'react'
import {
  FiMapPin,
  FiNavigation,
  FiClock,
  FiUsers,
  FiCheckCircle,
  FiCircle,
  FiArrowRight
} from 'react-icons/fi'

export default function TravelsRouteTimeline({
  route,
  selectedStopName = null,
  onSelectStop = () => {},
  currentSpeed = 40
}) {
  if (!route) return null

  let stops = []
  try {
    stops = typeof route.stopsJson === 'string' ? JSON.parse(route.stopsJson) : route.stopsJson || []
  } catch (e) {
    stops = []
  }

  const sourceName = route.sourceName || (stops.length > 0 ? stops[0].name : 'Origin Depot')
  const destinationName = route.destinationName || (stops.length > 0 ? stops[stops.length - 1].name : 'Campus Depot')
  const currentNextStop = route.nextStop || (stops.length > 0 ? stops[0].name : '')

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl space-y-4">
      
      {/* Route Header (Source -> Destination Corridor) */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-800 pb-3">
        <div className="flex items-center gap-2">
          <div className="px-2.5 py-1 rounded-lg bg-blue-600/20 border border-blue-500/30 text-blue-400 font-extrabold text-xs">
            {route.busNumber}
          </div>
          <div className="flex items-center gap-2 text-xs font-bold text-slate-300">
            <span className="text-white font-black">{sourceName}</span>
            <FiArrowRight className="text-blue-400" />
            <span className="text-white font-black">{destinationName}</span>
          </div>
        </div>

        <div className="flex items-center gap-3 text-xs">
          <span className="text-slate-400">
            Total Stops: <strong className="text-slate-200">{stops.length} Boarding Points</strong>
          </span>
          <span className="text-slate-400">•</span>
          <span className="text-slate-400">
            Trip Status:{' '}
            <strong className={`font-black ${route.isIgnitionOn ? 'text-emerald-400' : 'text-slate-400'}`}>
              {route.tripStatus || 'IDLE_AT_CAMPUS'}
            </strong>
          </span>
        </div>
      </div>

      {/* Commercial Travels-Style Stops Stepper Ribbon */}
      <div className="relative pt-3 pb-2 overflow-x-auto">
        <div className="flex items-start justify-between min-w-[650px] relative">
          
          {/* Background Polyline Track */}
          <div className="absolute top-5 left-6 right-6 h-1 bg-slate-800 -z-0"></div>

          {stops.map((stop, index) => {
            const isNextStop = currentNextStop && currentNextStop.toLowerCase().includes(stop.name.toLowerCase())
            const isCurrentOrPassed = isNextStop || (route.currentStatus && route.currentStatus.includes(stop.name))
            const isSource = index === 0
            const isDestination = index === stops.length - 1

            return (
              <div
                key={stop.id || index}
                onClick={() => onSelectStop(stop)}
                className="relative z-10 flex flex-col items-center cursor-pointer group flex-1 px-2 text-center"
              >
                {/* Node Marker */}
                <div
                  className={`w-10 h-10 rounded-2xl flex items-center justify-center font-black text-xs transition-all shadow-lg ${
                    isNextStop
                      ? 'bg-amber-500 text-slate-950 scale-110 ring-4 ring-amber-500/30 animate-pulse'
                      : isCurrentOrPassed
                      ? 'bg-blue-600 text-white'
                      : isDestination
                      ? 'bg-emerald-600 text-white'
                      : 'bg-slate-800 text-slate-400 border border-slate-700 group-hover:border-slate-500'
                  }`}
                >
                  {isSource ? '🛫' : isDestination ? '🏫' : index + 1}
                </div>

                {/* Stop Name & Time */}
                <div className="mt-2.5">
                  <div className={`text-xs font-bold transition ${isNextStop ? 'text-amber-300' : 'text-slate-200 group-hover:text-white'}`}>
                    {stop.name}
                  </div>
                  <div className="text-[11px] font-semibold text-slate-400 flex items-center justify-center gap-1 mt-0.5">
                    <FiClock className="text-[10px] text-blue-400" />
                    <span>{stop.time || 'N/A'}</span>
                  </div>
                  <div className="text-[10px] text-slate-400 mt-0.5">
                    {stop.students || 0} Scholars
                  </div>
                </div>

                {/* Next Stop Indicator Badge */}
                {isNextStop && (
                  <div className="mt-2 px-2 py-0.5 bg-amber-500/20 border border-amber-500/40 text-amber-300 text-[9px] font-black rounded-full uppercase tracking-wider">
                    Next Stop (ETA: {route.nextStopEtaMinutes || 4}m)
                  </div>
                )}
              </div>
            )
          })}

        </div>
      </div>

    </div>
  )
}

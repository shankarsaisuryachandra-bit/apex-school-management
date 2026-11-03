/**
 * OSRM (Open Source Routing Machine) Service
 * Computes exact real-world road geometries, driving distances, and turn-by-turn navigation.
 */

// In-memory cache to avoid repeated HTTP calls for identical stop coordinates
const routeCache = new Map()

export async function fetchRoadGeometry(waypoints = []) {
  if (!waypoints || waypoints.length < 2) {
    return {
      coordinates: [],
      distanceKm: 0,
      durationMin: 0,
      steps: []
    }
  }

  // Filter valid coordinates
  const validWaypoints = waypoints.filter(
    w => typeof w.lat === 'number' && typeof w.lng === 'number' && !isNaN(w.lat) && !isNaN(w.lng) && (w.lat !== 0 || w.lng !== 0)
  )

  if (validWaypoints.length < 2) {
    return {
      coordinates: validWaypoints.map(w => [w.lat, w.lng]),
      distanceKm: 0,
      durationMin: 0,
      steps: []
    }
  }

  // Generate cache key
  const cacheKey = validWaypoints.map(w => `${w.lat.toFixed(5)},${w.lng.toFixed(5)}`).join(';')
  if (routeCache.has(cacheKey)) {
    return routeCache.get(cacheKey)
  }

  // OSRM expects coordinates in "lng,lat" format separated by semicolon
  const coordString = validWaypoints.map(w => `${w.lng},${w.lat}`).join(';')
  const url = `https://router.project-osrm.org/route/v1/driving/${coordString}?overview=full&geometries=geojson&steps=true&annotations=true&continue_straight=true`

  try {
    const res = await fetch(url, { signal: AbortSignal.timeout(8000) })
    if (!res.ok) throw new Error(`OSRM HTTP ${res.status}`)
    const data = await res.json()

    if (data.code === 'Ok' && data.routes && data.routes.length > 0) {
      const bestRoute = data.routes[0]
      // GeoJSON coordinates are [lng, lat] -> convert to Leaflet [lat, lng]
      const latLngCoordinates = bestRoute.geometry.coordinates.map(([lng, lat]) => [lat, lng])
      const distanceKm = Number((bestRoute.distance / 1000).toFixed(2))
      const durationMin = Math.round(bestRoute.duration / 60)

      // Extract turn-by-turn maneuvers
      const steps = []
      if (bestRoute.legs) {
        bestRoute.legs.forEach((leg, legIdx) => {
          if (leg.steps) {
            leg.steps.forEach(step => {
              if (step.maneuver && step.name) {
                steps.push({
                  instruction: `${step.maneuver.type === 'arrive' ? 'Arrive at stop' : step.maneuver.type} onto ${step.name || 'Road'}`,
                  distanceMeters: Math.round(step.distance),
                  durationSec: Math.round(step.duration),
                  location: [step.maneuver.location[1], step.maneuver.location[0]]
                })
              }
            })
          }
        })
      }

      const result = {
        coordinates: latLngCoordinates,
        distanceKm,
        durationMin,
        steps,
        isRoadFollow: true
      }

      routeCache.set(cacheKey, result)
      return result
    }
  } catch (err) {
    console.warn('OSRM routing request failed or timed out, using linear stop fallback:', err.message)
  }

  // Fallback to straight lines between waypoints
  const fallbackResult = {
    coordinates: validWaypoints.map(w => [w.lat, w.lng]),
    distanceKm: calculateStraightLineDistanceKm(validWaypoints),
    durationMin: Math.round(validWaypoints.length * 7),
    steps: [],
    isRoadFollow: false
  }
  return fallbackResult
}

/**
 * Calculates bearing angle between two lat/lng points in degrees (0 - 360)
 */
export function calculateBearing(startLat, startLng, destLat, destLng) {
  const toRad = deg => (deg * Math.PI) / 180
  const toDeg = rad => (rad * 180) / Math.PI

  const lat1 = toRad(startLat)
  const lat2 = toRad(destLat)
  const dLng = toRad(destLng - startLng)

  const y = Math.sin(dLng) * Math.cos(lat2)
  const x = Math.cos(lat1) * Math.sin(lat2) - Math.sin(lat1) * Math.cos(lat2) * Math.cos(dLng)

  let brng = toDeg(Math.atan2(y, x))
  return (brng + 360) % 360
}

/**
 * Haversine formula for straight-line distance
 */
export function calculateStraightLineDistanceKm(points = []) {
  if (points.length < 2) return 0
  let totalMeters = 0
  const R = 6371e3 // Earth radius in meters

  for (let i = 0; i < points.length - 1; i++) {
    const lat1 = (points[i].lat * Math.PI) / 180
    const lat2 = (points[i + 1].lat * Math.PI) / 180
    const dLat = ((points[i + 1].lat - points[i].lat) * Math.PI) / 180
    const dLng = ((points[i + 1].lng - points[i].lng) * Math.PI) / 180

    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLng / 2) * Math.sin(dLng / 2)
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
    totalMeters += R * c
  }

  return Number((totalMeters / 1000).toFixed(2))
}

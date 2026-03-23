type Point = [number, number]

function isPointInLinearRing(point: Point, ring: number[][]) {
  const [x, y] = point
  let inside = false

  for (let i = 0, j = ring.length - 1; i < ring.length; j = i++) {
    const current = ring[i]
    const previous = ring[j]
    if (!current || !previous) continue

    const xi = current[0]
    const yi = current[1]
    const xj = previous[0]
    const yj = previous[1]

    if (
      !Number.isFinite(xi) ||
      !Number.isFinite(yi) ||
      !Number.isFinite(xj) ||
      !Number.isFinite(yj)
    ) {
      continue
    }

    const intersects =
      yi > y !== yj > y &&
      x < ((xj - xi) * (y - yi)) / (yj - yi || Number.EPSILON) + xi

    if (intersects) inside = !inside
  }

  return inside
}

function isPointInPolygon(point: Point, rings: number[][][]) {
  if (rings.length === 0) return false
  if (!isPointInLinearRing(point, rings[0])) return false

  for (let i = 1; i < rings.length; i += 1) {
    if (isPointInLinearRing(point, rings[i])) {
      return false
    }
  }

  return true
}

export function isPointInGeometry(
  point: Point,
  geometry: GeoJSON.Geometry | null | undefined
): boolean {
  if (!geometry) return false

  if (geometry.type === "Polygon") {
    return isPointInPolygon(point, geometry.coordinates as number[][][])
  }

  if (geometry.type === "MultiPolygon") {
    return (geometry.coordinates as number[][][][]).some((polygon) =>
      isPointInPolygon(point, polygon)
    )
  }

  return false
}

export function geometryBounds(geometry: GeoJSON.Geometry | null | undefined) {
  if (!geometry) return null

  const points: number[][] = []

  if (geometry.type === "Polygon") {
    ;(geometry.coordinates as number[][][]).forEach((ring) => {
      ring.forEach((coord) => points.push(coord))
    })
  } else if (geometry.type === "MultiPolygon") {
    ;(geometry.coordinates as number[][][][]).forEach((polygon) => {
      polygon.forEach((ring) => {
        ring.forEach((coord) => points.push(coord))
      })
    })
  } else {
    return null
  }

  if (points.length === 0) return null

  let minLng = Number.POSITIVE_INFINITY
  let minLat = Number.POSITIVE_INFINITY
  let maxLng = Number.NEGATIVE_INFINITY
  let maxLat = Number.NEGATIVE_INFINITY

  points.forEach(([lng, lat]) => {
    if (!Number.isFinite(lng) || !Number.isFinite(lat)) return
    minLng = Math.min(minLng, lng)
    minLat = Math.min(minLat, lat)
    maxLng = Math.max(maxLng, lng)
    maxLat = Math.max(maxLat, lat)
  })

  if (
    !Number.isFinite(minLng) ||
    !Number.isFinite(minLat) ||
    !Number.isFinite(maxLng) ||
    !Number.isFinite(maxLat)
  ) {
    return null
  }

  return {
    minLng,
    minLat,
    maxLng,
    maxLat,
    center: [(minLng + maxLng) / 2, (minLat + maxLat) / 2] as Point,
  }
}

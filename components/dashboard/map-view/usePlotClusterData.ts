import { useMemo } from "react"

import {
  geometryBounds,
  isPointInGeometry,
} from "@/components/dashboard/map-view/geometry"

export function usePlotClusterData({
  data,
  plotsData,
}: {
  data: GeoJSON.FeatureCollection | null
  plotsData: GeoJSON.FeatureCollection | null
}) {
  return useMemo<GeoJSON.FeatureCollection | null>(() => {
    if (!data || !plotsData) return null

    const points = data.features.filter(
      (feature) => feature.geometry?.type === "Point"
    )

    const features: GeoJSON.Feature[] = []

    plotsData.features.forEach((plotFeature, index) => {
      const bounds = geometryBounds(plotFeature.geometry)
      if (!bounds) return

      const summary = points.reduce(
        (acc, feature) => {
          const geometry = feature.geometry
          if (!geometry || geometry.type !== "Point") return acc

          const point = geometry.coordinates as [number, number]
          if (!isPointInGeometry(point, plotFeature.geometry)) {
            return acc
          }

          const props = feature.properties as Record<string, unknown> | null
          const hasAnyUse = Number(props?.["has_any_use"] ?? 0) === 1

          return {
            count: acc.count + 1,
            withUseCount: acc.withUseCount + (hasAnyUse ? 1 : 0),
            noUseCount: acc.noUseCount + (hasAnyUse ? 0 : 1),
          }
        },
        {
          count: 0,
          withUseCount: 0,
          noUseCount: 0,
        }
      )

      if (summary.count === 0) return

      const plotProperties =
        (plotFeature.properties as Record<string, unknown> | null) ?? {}

      features.push({
        type: "Feature",
        id: `plot-cluster-${plotFeature.id ?? index}`,
        geometry: {
          type: "Point",
          coordinates: bounds.center,
        },
        properties: {
          is_plot_cluster: 1,
          plot_id: plotProperties["id"] ?? plotFeature.id ?? index,
          point_count: summary.count,
          point_count_abbreviated: String(summary.count),
          with_use_count: summary.withUseCount,
          no_use_count: summary.noUseCount,
          min_lng: bounds.minLng,
          min_lat: bounds.minLat,
          max_lng: bounds.maxLng,
          max_lat: bounds.maxLat,
        },
      })
    })

    return {
      type: "FeatureCollection",
      features,
    }
  }, [data, plotsData])
}

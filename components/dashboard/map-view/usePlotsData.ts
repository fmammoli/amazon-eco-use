import { useEffect, useState } from "react"

export function usePlotsData() {
  const [plotsData, setPlotsData] = useState<GeoJSON.FeatureCollection | null>(
    null
  )

  useEffect(() => {
    const controller = new AbortController()

    const loadPlots = async () => {
      try {
        const response = await fetch("/data/plots.geojson", {
          signal: controller.signal,
        })

        if (!response.ok) {
          throw new Error(`Failed to load plots: ${response.status}`)
        }

        const geojson = (await response.json()) as GeoJSON.FeatureCollection
        setPlotsData(geojson)
      } catch (error) {
        if (error instanceof DOMException && error.name === "AbortError") {
          return
        }

        console.error("Unable to load plot polygons", error)
      }
    }

    loadPlots()

    return () => {
      controller.abort()
    }
  }, [])

  return plotsData
}

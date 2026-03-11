"use client"

import { Popup } from "react-map-gl/maplibre"

export type HoverInfo = {
  feature: GeoJSON.Feature
  lngLat: [number, number]
}

export function MapHoverPopup({ hoverInfo }: { hoverInfo: HoverInfo | null }) {
  if (!hoverInfo) return null

  const properties = (hoverInfo.feature.properties ?? {}) as Record<
    string,
    unknown
  >
  const hiddenHoverFields = new Set(["task5_use", "coelho_arboreal_uses"])

  return (
    <Popup
      longitude={hoverInfo.lngLat[0]}
      latitude={hoverInfo.lngLat[1]}
      closeButton={false}
      closeOnClick={false}
      anchor="bottom"
      offset={[0, -10]}
    >
      <div className="max-w-xs text-xs">
        <div className="font-semibold">Plant info</div>
        <div className="mt-1 space-y-0.5">
          {Object.entries(properties)
            .filter(([key]) => !hiddenHoverFields.has(key))
            .slice(0, 10)
            .map(([key, value]) => (
              <div key={key} className="flex justify-between">
                <span className="text-[11px] font-medium text-muted-foreground">
                  {key}
                </span>
                <span className="ml-2 text-[11px]">{String(value)}</span>
              </div>
            ))}
        </div>
      </div>
    </Popup>
  )
}

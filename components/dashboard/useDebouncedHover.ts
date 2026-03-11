"use client"

import { useCallback, useRef, useState } from "react"

export type HoverInfo = {
  feature: GeoJSON.Feature
  lngLat: [number, number]
}

export function useDebouncedHover(delay = 50) {
  const [hoverInfo, setHoverInfo] = useState<HoverInfo | null>(null)
  const debounceRef = useRef<number | null>(null)

  const clearHover = useCallback(() => {
    if (debounceRef.current) {
      window.clearTimeout(debounceRef.current)
      debounceRef.current = null
    }
    setHoverInfo(null)
  }, [])

  const setHover = useCallback(
    (value: HoverInfo) => {
      if (debounceRef.current) {
        window.clearTimeout(debounceRef.current)
      }

      debounceRef.current = window.setTimeout(() => {
        setHoverInfo(value)
        debounceRef.current = null
      }, delay)
    },
    [delay]
  )

  return {
    hoverInfo,
    setHover,
    clearHover,
  }
}

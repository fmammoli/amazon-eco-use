import { useEffect, useState } from "react"

export type SpeciesReferenceEntry = { reference: string; webpage?: string }
export type SpeciesReferencesData = Record<string, SpeciesReferenceEntry[]>

// Module-level cache so the file is fetched only once across all components
let cachedData: SpeciesReferencesData | null = null
let fetchPromise: Promise<SpeciesReferencesData> | null = null

export function useSpeciesReferences(): SpeciesReferencesData | null {
  const [data, setData] = useState<SpeciesReferencesData | null>(cachedData)

  useEffect(() => {
    if (cachedData) return
    if (!fetchPromise) {
      fetchPromise = fetch(
        "/api/data?pathname=data/species_references_by_species.json"
      )
        .then((r) => r.json() as Promise<SpeciesReferencesData>)
        .then((d) => {
          cachedData = d
          return d
        })
        .catch((err) => {
          console.error("Failed to load species references", err)
          fetchPromise = null
          return {} as SpeciesReferencesData
        })
    }
    fetchPromise.then(setData)
  }, [])

  return data
}

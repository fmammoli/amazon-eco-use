import { get } from "@vercel/blob"
import { Suspense } from "react"

import { Dashboard } from "@/components/dashboard/Dashboard"
import type {
  DashboardInitialData,
  SpeciesMetadata,
  SpeciesReferencesData,
} from "@/components/dashboard/types"

async function fetchBlobJson<T>(pathname: string): Promise<T> {
  const result = await get(pathname, { access: "private" })
  if (!result) throw new Error(`Blob not found: ${pathname}`)
  return new Response(result.stream).json() as Promise<T>
}

export default async function Page() {
  const [geojson, speciesMetadata, plotsData, speciesReferences] =
    await Promise.all([
      fetchBlobJson<GeoJSON.FeatureCollection>(
        "data/final_AmzFACE_merged_by_coords.with_ids.geojson"
      ),
      fetchBlobJson<SpeciesMetadata[]>(
        "data/final_data_species_with_gbif_inaturalist copy.json"
      ),
      fetchBlobJson<GeoJSON.FeatureCollection>("data/plots.geojson"),
      fetchBlobJson<SpeciesReferencesData>(
        "data/species_references_by_species.json"
      ),
    ])

  const initialData: DashboardInitialData = {
    geojson,
    speciesMetadata,
    plotsData,
    speciesReferences,
  }

  return (
    <Suspense
      fallback={
        <main className="min-h-screen bg-background px-4 py-6 lg:px-8">
          <div className="mx-auto w-full max-w-dvw text-sm text-muted-foreground">
            Loading dashboard...
          </div>
        </main>
      }
    >
      <Dashboard initialData={initialData} />
    </Suspense>
  )
}

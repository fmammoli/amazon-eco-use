import speciesReferences from "@/public/data/species_references_by_species.json"

export interface SpeciesStudyData {
  species: string
  referenceCount: number
  treeCount: number
}

export type SpeciesFeature = {
  properties?: {
    species_name?: string
  } | null
}

/**
 * Get all unique species from GeoJSON features
 */
export function getUniqueSpecies(features: SpeciesFeature[]): Set<string> {
  const species = new Set<string>()
  features.forEach((feature) => {
    const speciesName = feature.properties?.species_name
    if (speciesName) {
      species.add(speciesName)
    }
  })
  return species
}

/**
 * Count references for a species from the species_references_by_species.json
 */
export function getSpeciesReferenceCount(speciesName: string): number {
  const refs = speciesReferences as Record<string, Array<{ reference: string }>>
  return refs[speciesName]?.length ?? 0
}

/**
 * Count how many trees belong to each species
 */
export function getSpeciesTreeCount(
  features: SpeciesFeature[],
  speciesName: string
): number {
  return features.filter(
    (feature) => feature.properties?.species_name === speciesName
  ).length
}

/**
 * Compute study score data for all species
 * Returns array sorted by reference count (descending)
 */
export function computeSpeciesStudyScores(
  features: SpeciesFeature[]
): SpeciesStudyData[] {
  const uniqueSpecies = getUniqueSpecies(features)

  const studyData: SpeciesStudyData[] = Array.from(uniqueSpecies).map(
    (species) => ({
      species,
      referenceCount: getSpeciesReferenceCount(species),
      treeCount: getSpeciesTreeCount(features, species),
    })
  )

  // Sort by reference count descending
  return studyData.sort((a, b) => b.referenceCount - a.referenceCount)
}

/**
 * Compute study score based on reference count
 * Higher score = more studied
 */
export function computeStudyScore(
  referenceCount: number,
  treeCount: number
): number {
  // Score is simply the number of references
  return referenceCount
}

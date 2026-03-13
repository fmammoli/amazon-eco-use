import type { SpeciesMetadata } from "@/components/dashboard/types"
import { normalizeSpeciesName } from "@/components/dashboard/utils"

export type SpeciesAbundancePoint = {
  species: string
  abundance: number
  rank: number
  use: string
  uses: string[]
  primaryUse: PrimaryUse
  hasMultipleUses: boolean
}

type PrimaryUse =
  | "Medicinal"
  | "Medicine"
  | "Food"
  | "Raw material"
  | "Manufacture"
  | "Construction"
  | "Thatching"
  | "Firewood"
  | "Other"
  | "No recorded use"

export type UseSource = "task5" | "coelho"

const hasPositiveUse = (value: unknown) => {
  if (value === null || value === undefined) return false
  if (typeof value === "number") return value > 0
  if (typeof value !== "string") return false

  const normalized = value.trim().toLowerCase()
  if (!normalized || normalized === "." || normalized === "na") return false

  return normalized === "1" || normalized === "x" || normalized === "yes"
}

const getUseSummary = (
  metadata: SpeciesMetadata | undefined,
  source: UseSource
): {
  uses: string[]
  primaryUse: PrimaryUse
  hasMultipleUses: boolean
} => {
  if (!metadata) {
    return {
      uses: [] as string[],
      primaryUse: "No recorded use" as const,
      hasMultipleUses: false,
    }
  }

  const task5 = metadata.task5_use ?? null
  const coelho = metadata.coelho_arboreal_uses ?? null

  let uses: string[] = []
  let primaryUse: PrimaryUse = "No recorded use"

  if (source === "task5") {
    const hasFood = hasPositiveUse(task5?.["Food"])
    const hasMedicinal = hasPositiveUse(task5?.["Medicinal"])
    const hasRawMaterial = hasPositiveUse(task5?.["Raw material"])

    uses = [
      hasMedicinal ? "Medicinal" : null,
      hasFood ? "Food" : null,
      hasRawMaterial ? "Raw material" : null,
    ].filter((value): value is string => value !== null)

    primaryUse = hasMedicinal
      ? "Medicinal"
      : hasFood
        ? "Food"
        : hasRawMaterial
          ? "Raw material"
          : "No recorded use"
  } else {
    const hasFood = hasPositiveUse(coelho?.["Food"])
    const hasMedicine = hasPositiveUse(coelho?.["Medicine"])
    const hasManufacture = hasPositiveUse(coelho?.["Manufacture"])
    const hasConstruction = hasPositiveUse(coelho?.["Construction"])
    const hasThatching = hasPositiveUse(coelho?.["Thatching"])
    const hasFirewood = hasPositiveUse(coelho?.["Firewood"])

    uses = [
      hasMedicine ? "Medicine" : null,
      hasFood ? "Food" : null,
      hasManufacture ? "Manufacture" : null,
      hasConstruction ? "Construction" : null,
      hasThatching ? "Thatching" : null,
      hasFirewood ? "Firewood" : null,
    ].filter((value): value is string => value !== null)

    primaryUse = hasMedicine
      ? "Medicine"
      : hasFood
        ? "Food"
        : hasConstruction
          ? "Construction"
          : hasManufacture
            ? "Manufacture"
            : hasThatching
              ? "Thatching"
              : hasFirewood
                ? "Firewood"
                : "No recorded use"
  }

  return {
    uses,
    primaryUse,
    hasMultipleUses: uses.length > 1,
  }
}

export function computeSpeciesAbundance(
  features: GeoJSON.Feature[] | null | undefined,
  speciesMetadataByName: Map<string, SpeciesMetadata>,
  source: UseSource
): SpeciesAbundancePoint[] {
  if (!features || features.length === 0) return []

  const abundanceBySpecies = new Map<string, number>()

  features.forEach((feature) => {
    const props = feature.properties as Record<string, unknown> | null
    const speciesName =
      typeof props?.["species_name"] === "string"
        ? props["species_name"].trim()
        : ""

    if (!speciesName) return

    abundanceBySpecies.set(
      speciesName,
      (abundanceBySpecies.get(speciesName) ?? 0) + 1
    )
  })

  const ranked = Array.from(abundanceBySpecies.entries())
    .map(([species, abundance]) => {
      const metadata = speciesMetadataByName.get(normalizeSpeciesName(species))
      const useSummary = getUseSummary(metadata, source)

      return {
        species,
        abundance,
        use: useSummary.primaryUse,
        uses: useSummary.uses,
        primaryUse: useSummary.primaryUse,
        hasMultipleUses: useSummary.hasMultipleUses,
      }
    })
    .sort(
      (a, b) => b.abundance - a.abundance || a.species.localeCompare(b.species)
    )

  return ranked.map((point, index) => ({
    species: point.species,
    abundance: point.abundance,
    use: point.use,
    uses: point.uses,
    primaryUse: point.primaryUse,
    hasMultipleUses: point.hasMultipleUses,
    rank: index + 1,
  }))
}

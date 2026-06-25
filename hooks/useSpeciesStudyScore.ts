import { useMemo } from "react"
import {
  computeSpeciesStudyScores,
  computeStudyScore,
  SpeciesFeature,
  SpeciesStudyData,
} from "@/lib/speciesStudyScore"
import type { SpeciesReferencesData } from "@/components/dashboard/types"

export interface UseSpeciesStudyScoreResult {
  speciesStudyData: SpeciesStudyData[]
  speciesWithScores: (SpeciesStudyData & { score: number })[]
  maxScore: number
  minScore: number
}

export function useSpeciesStudyScore(
  features: SpeciesFeature[] | null | undefined,
  refs: SpeciesReferencesData
): UseSpeciesStudyScoreResult {
  return useMemo(() => {
    if (!features || features.length === 0) {
      return {
        speciesStudyData: [],
        speciesWithScores: [],
        maxScore: 0,
        minScore: 0,
      }
    }

    const studyData = computeSpeciesStudyScores(features, refs)

    const speciesWithScores = studyData.map((data) => ({
      ...data,
      score: computeStudyScore(data.referenceCount, data.treeCount),
    }))

    const scores = speciesWithScores.map((s) => s.score)
    const maxScore = Math.max(...scores, 0)
    const minScore = Math.min(...scores, 0)

    return {
      speciesStudyData: studyData,
      speciesWithScores,
      maxScore,
      minScore,
    }
  }, [features, refs])
}

"use client"

import { useMemo } from "react"
import { Treemap, ResponsiveContainer, Tooltip } from "recharts"

export interface TreeMapDataPoint {
  name: string
  value: number
  fill: string
  referenceCount: number
  treeCount: number
  score: number
}

interface SpeciesStudyTreeMapProps {
  data: Array<{
    species: string
    referenceCount: number
    treeCount: number
    score: number
  }>
  maxScore: number
  hoveredSpecies?: string | null
  onHoverSpecies?: (species: string | null) => void
}

function normalizeSpecies(value: string | null | undefined): string {
  return (value ?? "").trim().toLowerCase()
}

function getColorByScore(score: number, maxScore: number): string {
  // Dark, high-contrast palette for better readability
  const normalized = maxScore > 0 ? score / maxScore : 0

  if (normalized >= 0.85) return "#0b3d1a" // very dark green
  if (normalized >= 0.65) return "#1a5e2e" // dark green
  if (normalized >= 0.45) return "#2e7a3f" // medium-dark green
  if (normalized >= 0.25) return "#4fa378" // medium green
  return "#7fc9a0" // light green, still readable
}

interface CustomTreeMapContentProps {
  x?: number
  y?: number
  width?: number
  height?: number
  fill?: string
  name?: string
  payload?: Partial<TreeMapDataPoint>
  referenceCount?: number
  treeCount?: number
  hoveredSpecies?: string | null
  onHoverSpecies?: (species: string | null) => void
}

const CustomTreeMapContent = ({
  x = 0,
  y = 0,
  width = 0,
  height = 0,
  fill,
  name,
  payload,
  hoveredSpecies,
  onHoverSpecies,
}: CustomTreeMapContentProps) => {
  const rawName =
    typeof name === "string"
      ? name
      : typeof payload?.name === "string"
        ? payload.name
        : ""
  const displayName = rawName
    ? rawName.split(" ").slice(0, 2).join(" ")
    : "Unknown species"
  if (width <= 1 || height <= 1) return null

  const normalizedCurrent = normalizeSpecies(rawName)
  const normalizedHovered = normalizeSpecies(hoveredSpecies)
  const isHoverLinked =
    normalizedHovered.length > 0 &&
    normalizedCurrent === normalizedHovered &&
    !rawName.startsWith("Other (")
  const hoverTargetSpecies =
    rawName.length > 0 && !rawName.startsWith("Other (") ? rawName : null

  // Use very soft, light text for better readability on darker backgrounds
  const textColor = "#f3f4f6"

  // Split name into two lines: genus on first, species on second
  const nameParts = displayName.split(" ")
  const line1 = nameParts[0] || ""
  const line2 = nameParts.slice(1).join(" ") || ""

  // Responsive display based on tile size
  const showBothLines = width >= 60 && height >= 50
  const showFirstLineOnly = width >= 38 && height >= 28

  // Responsive font size
  let fontSize = 11
  if (width >= 80) fontSize = 13
  if (width >= 100) fontSize = 14

  return (
    <g
      onMouseEnter={() => {
        onHoverSpecies?.(hoverTargetSpecies)
      }}
    >
      <rect
        x={x}
        y={y}
        width={width}
        height={height}
        fill={fill}
        stroke={isHoverLinked ? "#f59e0b" : "rgba(255,255,255,0.82)"}
        strokeWidth={isHoverLinked ? 2.2 : 1}
        opacity={isHoverLinked ? 1 : 0.9}
      />
      {showBothLines ? (
        <>
          {line1 && (
            <text
              x={x + 5}
              y={y + 6}
              fill={textColor}
              fontSize={fontSize}
              fontWeight={400}
              dominantBaseline="hanging"
              letterSpacing="0.5"
            >
              {line1}
            </text>
          )}
          {line2 && (
            <text
              x={x + 5}
              y={y + 6 + fontSize + 4}
              fill={textColor}
              fontSize={fontSize}
              fontWeight={400}
              dominantBaseline="hanging"
              letterSpacing="0.5"
            >
              {line2}
            </text>
          )}
        </>
      ) : showFirstLineOnly ? (
        <text
          x={x + 5}
          y={y + Math.max(4, (height - 11) / 2)}
          fill={textColor}
          fontSize={11}
          fontWeight={400}
          dominantBaseline="hanging"
          letterSpacing="0.5"
        >
          {line1}
        </text>
      ) : null}

      {isHoverLinked && payload ? (
        <g pointerEvents="none">
          <rect
            x={Math.max(2, x + 4)}
            y={Math.max(2, y - 58)}
            width={170}
            height={54}
            rx={6}
            ry={6}
            fill="rgba(9,9,11,0.96)"
            stroke="rgba(255,255,255,0.7)"
            strokeWidth={1}
          />
          <text
            x={Math.max(8, x + 8)}
            y={Math.max(15, y - 44)}
            fill="#f8fafc"
            fontSize={11}
            fontWeight={600}
          >
            {String(payload.name ?? "Unknown species")}
          </text>
          <text
            x={Math.max(8, x + 8)}
            y={Math.max(15, y - 30)}
            fill="#e5e7eb"
            fontSize={10}
          >
            {`Study Score: ${typeof payload.score === "number" ? payload.score.toFixed(1) : "0.0"}`}
          </text>
          <text
            x={Math.max(8, x + 8)}
            y={Math.max(15, y - 18)}
            fill="#e5e7eb"
            fontSize={10}
          >
            {`References: ${typeof payload.referenceCount === "number" ? payload.referenceCount : 0}`}
          </text>
          <text
            x={Math.max(8, x + 8)}
            y={Math.max(15, y - 6)}
            fill="#e5e7eb"
            fontSize={10}
          >
            {`Trees in Plot: ${typeof payload.treeCount === "number" ? payload.treeCount : 0}`}
          </text>
        </g>
      ) : null}
    </g>
  )
}

interface CustomTooltipProps {
  active?: boolean
  payload?: Array<{
    payload?: Partial<TreeMapDataPoint>
  }>
}

const CustomTooltip = ({ active, payload }: CustomTooltipProps) => {
  if (active && payload && payload[0]) {
    const data = payload[0].payload ?? {}
    const speciesName =
      typeof data.name === "string" && data.name.length > 0
        ? data.name
        : "Unknown species"
    const score = typeof data.score === "number" ? data.score : 0
    const referenceCount =
      typeof data.referenceCount === "number" ? data.referenceCount : 0
    const treeCount = typeof data.treeCount === "number" ? data.treeCount : 0

    return (
      <div className="rounded-md border border-border bg-popover p-3 text-popover-foreground shadow-md">
        <p className="mb-1 text-sm font-semibold">{speciesName}</p>
        <p className="text-xs">
          <strong>Study Score:</strong> {score.toFixed(1)}
        </p>
        <p className="text-xs">
          <strong>References:</strong> {referenceCount}
        </p>
        <p className="text-xs">
          <strong>Trees in Plot:</strong> {treeCount}
        </p>
      </div>
    )
  }

  return null
}

export function SpeciesStudyTreeMap({
  data,
  maxScore,
  hoveredSpecies = null,
  onHoverSpecies,
}: SpeciesStudyTreeMapProps) {
  const { treemapData, collapsedSpeciesCount, collapsedReferenceCount } =
    useMemo(() => {
      const rankedData = data
        .filter((d) => d.referenceCount > 0)
        .sort((a, b) => b.referenceCount - a.referenceCount)

      const MAX_SPECIES = 200
      const visible = rankedData.slice(0, MAX_SPECIES)
      const collapsed = rankedData.slice(MAX_SPECIES)

      const mappedVisible: TreeMapDataPoint[] = visible.map((d) => ({
        name: d.species,
        value: Math.max(d.referenceCount, 1),
        fill: getColorByScore(d.score, maxScore),
        referenceCount: d.referenceCount,
        treeCount: d.treeCount,
        score: d.score,
      }))

      if (collapsed.length > 0) {
        const collapsedRefs = collapsed.reduce(
          (sum, item) => sum + item.referenceCount,
          0
        )
        const collapsedTrees = collapsed.reduce(
          (sum, item) => sum + item.treeCount,
          0
        )

        mappedVisible.push({
          name: `Other (${collapsed.length})`,
          value: Math.max(collapsedRefs, 1),
          fill: "#5ba89a",
          referenceCount: collapsedRefs,
          treeCount: collapsedTrees,
          score: collapsedRefs,
        })
      }

      return {
        treemapData: mappedVisible,
        collapsedSpeciesCount: collapsed.length,
        collapsedReferenceCount: collapsed.reduce(
          (sum, item) => sum + item.referenceCount,
          0
        ),
      }
    }, [data, maxScore])

  const chartHeight = treemapData.length <= 20 ? 400 : 550

  const totalReferences = useMemo(
    () => treemapData.reduce((sum, item) => sum + item.referenceCount, 0),
    [treemapData]
  )

  const shownSpeciesCount =
    treemapData.length - (collapsedSpeciesCount > 0 ? 1 : 0)

  const chartSubtitle =
    collapsedSpeciesCount > 0
      ? `${shownSpeciesCount} species shown individually, ${collapsedSpeciesCount} grouped as Other`
      : `${shownSpeciesCount} species shown`

  const chartCaption =
    collapsedSpeciesCount > 0
      ? `Grouped species contribute ${collapsedReferenceCount} references in total.`
      : "Hover cells to inspect species-level reference counts."

  if (treemapData.length === 0) {
    return (
      <div className="flex h-80 items-center justify-center text-muted-foreground">
        No studied species data available
      </div>
    )
  }

  return (
    <div className="space-y-2">
      <div className="flex flex-wrap items-center justify-between gap-x-3 gap-y-1 text-[11px] text-muted-foreground">
        <span>{chartSubtitle}</span>
        <span>Total references: {totalReferences}</span>
      </div>

      <div
        className="relative"
        onMouseLeave={() => {
          onHoverSpecies?.(null)
        }}
      >
        <ResponsiveContainer width="100%" height={chartHeight}>
          <Treemap
            data={treemapData}
            dataKey="value"
            stroke="#fff"
            fill="#09090b"
            content={
              <CustomTreeMapContent
                hoveredSpecies={hoveredSpecies}
                onHoverSpecies={onHoverSpecies}
              />
            }
            aspectRatio={4 / 3}
          >
            <Tooltip content={<CustomTooltip />} isAnimationActive={false} />
          </Treemap>
        </ResponsiveContainer>
      </div>

      <p className="text-[11px] text-muted-foreground italic">{chartCaption}</p>
    </div>
  )
}

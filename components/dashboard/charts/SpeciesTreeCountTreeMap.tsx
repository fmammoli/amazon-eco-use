"use client"

import { useMemo } from "react"
import { Treemap, ResponsiveContainer, Tooltip } from "recharts"

export interface TreeCountTreeMapDataPoint {
  name: string
  value: number
  fill: string
  treeCount: number
  referenceCount: number
}

interface SpeciesTreeCountTreeMapProps {
  data: Array<{
    species: string
    referenceCount: number
    treeCount: number
    score: number
  }>
  maxTreeCount: number
}

function getColorByTreeCount(count: number, maxCount: number): string {
  // Dark, high-contrast palette based on tree count
  const normalized = maxCount > 0 ? count / maxCount : 0

  if (normalized >= 0.85) return "#0b3d1a" // very dark green
  if (normalized >= 0.65) return "#1a5e2e" // dark green
  if (normalized >= 0.45) return "#2e7a3f" // medium-dark green
  if (normalized >= 0.25) return "#4fa378" // medium green
  return "#7fc9a0" // light green, still readable
}

// Recharts injects props dynamically into custom content components
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const CustomTreeMapContent = (props: any) => {
  const { x = 0, y = 0, width = 0, height = 0 } = props
  const payload = props?.payload as
    | Partial<TreeCountTreeMapDataPoint>
    | undefined
  const rawName =
    typeof props?.name === "string"
      ? props.name
      : typeof payload?.name === "string"
        ? payload.name
        : ""
  const displayName = rawName
    ? rawName.split(" ").slice(0, 2).join(" ")
    : "Unknown species"

  if (width < 22 || height < 18) return null

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
    <g>
      <rect
        x={x}
        y={y}
        width={width}
        height={height}
        fill={props.fill}
        stroke="rgba(255,255,255,0.82)"
        strokeWidth={1}
        opacity={0.9}
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
    </g>
  )
}

interface CustomTooltipProps {
  active?: boolean
  payload?: Array<{
    payload: Partial<TreeCountTreeMapDataPoint>
  }>
}

const CustomTooltip = ({ active, payload }: CustomTooltipProps) => {
  if (active && payload && payload[0]) {
    const data = (payload[0].payload ??
      {}) as Partial<TreeCountTreeMapDataPoint>
    const speciesName =
      typeof data.name === "string" && data.name.length > 0
        ? data.name
        : "Unknown species"
    const treeCount = typeof data.treeCount === "number" ? data.treeCount : 0
    const referenceCount =
      typeof data.referenceCount === "number" ? data.referenceCount : 0

    return (
      <div className="rounded-md border border-border bg-popover p-3 text-popover-foreground shadow-md">
        <p className="mb-1 text-sm font-semibold">{speciesName}</p>
        <p className="text-xs">
          <strong>Trees in Plot:</strong> {treeCount}
        </p>
        <p className="text-xs">
          <strong>References:</strong> {referenceCount}
        </p>
      </div>
    )
  }

  return null
}

export function SpeciesTreeCountTreeMap({
  data,
  maxTreeCount,
}: SpeciesTreeCountTreeMapProps) {
  const { treemapData, collapsedSpeciesCount, collapsedTreeCount } =
    useMemo(() => {
      const rankedData = data
        .filter((d) => d.treeCount > 0)
        .sort((a, b) => b.treeCount - a.treeCount)

      const MAX_SPECIES = 60
      const visible = rankedData.slice(0, MAX_SPECIES)
      const collapsed = rankedData.slice(MAX_SPECIES)

      const mappedVisible: TreeCountTreeMapDataPoint[] = visible.map((d) => ({
        name: d.species,
        value: Math.max(d.treeCount, 1),
        fill: getColorByTreeCount(d.treeCount, maxTreeCount),
        treeCount: d.treeCount,
        referenceCount: d.referenceCount,
      }))

      if (collapsed.length > 0) {
        const collapsedTrees = collapsed.reduce(
          (sum, item) => sum + item.treeCount,
          0
        )
        const collapsedRefs = collapsed.reduce(
          (sum, item) => sum + item.referenceCount,
          0
        )

        mappedVisible.push({
          name: `Other (${collapsed.length})`,
          value: Math.max(collapsedTrees, 1),
          fill: "#5ba89a",
          treeCount: collapsedTrees,
          referenceCount: collapsedRefs,
        })
      }

      return {
        treemapData: mappedVisible,
        collapsedSpeciesCount: collapsed.length,
        collapsedTreeCount: collapsed.reduce(
          (sum, item) => sum + item.treeCount,
          0
        ),
      }
    }, [data, maxTreeCount])

  const chartHeight = treemapData.length <= 20 ? 400 : 550

  const totalTrees = useMemo(
    () => treemapData.reduce((sum, item) => sum + item.treeCount, 0),
    [treemapData]
  )

  const shownSpeciesCount =
    treemapData.length - (collapsedSpeciesCount > 0 ? 1 : 0)

  const chartCaption =
    collapsedSpeciesCount > 0
      ? `Grouped species contribute ${collapsedTreeCount} trees in total.`
      : "Hover cells to inspect species-level tree counts."

  if (treemapData.length === 0) {
    return (
      <div className="flex h-80 items-center justify-center text-muted-foreground">
        No data to display
      </div>
    )
  }

  return (
    <div className="space-y-2">
      <div className="flex flex-wrap items-center justify-between gap-x-3 gap-y-1 text-[11px] text-muted-foreground">
        <span>
          {shownSpeciesCount} species shown individually
          {collapsedSpeciesCount > 0 && (
            <>, {collapsedSpeciesCount} grouped as Other</>
          )}
        </span>
        <span>Total trees: {totalTrees}</span>
      </div>

      <ResponsiveContainer width="100%" height={chartHeight}>
        <Treemap
          data={treemapData}
          dataKey="value"
          stroke="#fff"
          fill="#09090b"
          content={<CustomTreeMapContent />}
        >
          <Tooltip content={<CustomTooltip />} />
        </Treemap>
      </ResponsiveContainer>
      <p className="mt-2 text-[11px] text-muted-foreground italic">
        {chartCaption}
      </p>
    </div>
  )
}

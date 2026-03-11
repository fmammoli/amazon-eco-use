#!/usr/bin/env node

import fs from "fs"
import path from "path"

const argv = process.argv.slice(2)
const args = {}
for (let i = 0; i < argv.length; i++) {
  const arg = argv[i]
  if (arg.startsWith("--")) {
    const name = arg.slice(2)
    const value = argv[i + 1]
    if (value && !value.startsWith("--")) {
      args[name] = value
      i++
    } else {
      args[name] = true
    }
  }
}

const inputPath =
  args.input || "public/data/final_AmzFACE_merged_by_coords.geojson"
const outputPath = args.output || inputPath

async function run() {
  const absIn = path.resolve(process.cwd(), inputPath)
  const absOut = path.resolve(process.cwd(), outputPath)

  if (!fs.existsSync(absIn)) {
    console.error(`Input file not found: ${absIn}`)
    process.exit(1)
  }

  const raw = await fs.promises.readFile(absIn, "utf8")
  const data = JSON.parse(raw)

  if (
    !data ||
    data.type !== "FeatureCollection" ||
    !Array.isArray(data.features)
  ) {
    console.error(`Expected a GeoJSON FeatureCollection in ${absIn}`)
    process.exit(1)
  }

  data.features.forEach((feature, index) => {
    if (!feature || typeof feature !== "object") return
    if (!feature.properties || typeof feature.properties !== "object") {
      feature.properties = {}
    }
    feature.properties.plant_id = `plant-${String(index).padStart(6, "0")}`
  })

  const out = JSON.stringify(data, null, 2)
  await fs.promises.writeFile(absOut, out, "utf8")

  console.log(`Wrote ${data.features.length} plant_id values to ${absOut}`)
}

run().catch((err) => {
  console.error(err)
  process.exit(1)
})

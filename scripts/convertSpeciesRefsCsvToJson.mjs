import { readFileSync, writeFileSync } from "node:fs"
import { resolve } from "node:path"

const INPUT_PATH = resolve("public/data/Species_ref_link-Table 1.csv")
const OUTPUT_PATH = resolve("public/data/species_references_by_species.json")

const parseSemicolonCsv = (text) => {
  const rows = []
  let row = []
  let field = ""
  let inQuotes = false

  for (let i = 0; i < text.length; i += 1) {
    const ch = text[i]

    if (inQuotes) {
      if (ch === '"') {
        const next = text[i + 1]
        if (next === '"') {
          field += '"'
          i += 1
        } else {
          inQuotes = false
        }
      } else {
        field += ch
      }
      continue
    }

    if (ch === '"') {
      inQuotes = true
      continue
    }

    if (ch === ";") {
      row.push(field)
      field = ""
      continue
    }

    if (ch === "\n") {
      row.push(field)
      field = ""

      if (row.some((value) => value.trim() !== "")) {
        rows.push(row)
      }

      row = []
      continue
    }

    if (ch === "\r") {
      continue
    }

    field += ch
  }

  if (field.length > 0 || row.length > 0) {
    row.push(field)
    if (row.some((value) => value.trim() !== "")) {
      rows.push(row)
    }
  }

  return rows
}

const toUrlArray = (value) => {
  if (!value) return []

  return value
    .split(/\s+/)
    .map((token) => token.trim())
    .filter((token) => /^https?:\/\//i.test(token))
}

const csvText = readFileSync(INPUT_PATH, "utf8")
const rows = parseSemicolonCsv(csvText)

if (rows.length === 0) {
  throw new Error("CSV appears empty")
}

const header = rows[0].map((column) => column.trim())
const speciesIndex = header.findIndex((column) => /^species$/i.test(column))
const referencesIndex = header.findIndex((column) =>
  /^references$/i.test(column)
)
const webpageIndex = header.findIndex((column) => /^webpage$/i.test(column))

if (speciesIndex < 0 || referencesIndex < 0) {
  throw new Error("CSV is missing required Species or References columns")
}

const grouped = {}

for (let i = 1; i < rows.length; i += 1) {
  const row = rows[i]
  const species = (row[speciesIndex] ?? "").trim()
  const reference = (row[referencesIndex] ?? "").trim()
  const webpage = (row[webpageIndex] ?? "").trim()

  if (!species || !reference) {
    continue
  }

  if (!grouped[species]) {
    grouped[species] = []
  }

  const entry = {
    reference,
    webpage: webpage || null,
    linksInReference: toUrlArray(reference),
  }

  grouped[species].push(entry)
}

writeFileSync(OUTPUT_PATH, `${JSON.stringify(grouped, null, 2)}\n`, "utf8")

console.log(`Wrote ${Object.keys(grouped).length} species to ${OUTPUT_PATH}`)

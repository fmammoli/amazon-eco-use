# AmazonFACE Ethnobotanical Dashboard

Interactive dashboard for exploring AmazonFACE tree records, species-level abundance patterns, trait distributions, and ethnobotanical use categories.

The app combines geospatial tree data with species metadata (including use categories and references) and provides chart- and map-based exploration tools for ecological analysis.

## Tech Stack

- Next.js (App Router)
- React + TypeScript
- Tailwind CSS + shadcn/ui components
- Recharts for plots and summaries
- react-map-gl + maplibre-gl for map rendering

## Main Features

- Authentication gate with login page and protected routes.
- Interactive map of individual trees with hover details and click-to-open plant drawer.
- Drawer with tree details, species metadata, image gallery, and species references.
- Dynamic filter panel (use categories + numeric trait ranges + missing values behavior).
- Species rank-abundance curve with:
  - source toggle (`task5_use` vs `coelho_arboreal_use`)
  - color by primary use category
  - shape by single-use vs multi-use classification
  - click-to-open table of all trees for the selected species
- Additional charts:
  - use prevalence summaries
  - trait distributions by category
  - trait-use scatter analysis
  - species-level tree/reference comparison
  - species treemaps (study attention and abundance)
- About page describing scientific context and data provenance.

## Getting Started

Install dependencies:

```bash
npm install
```

Start development server:

```bash
npm run dev
```

Build for production:

```bash
npm run build
```

Run production server:

```bash
npm run start
```

Quality checks:

```bash
npm run lint
npm run typecheck
```

## Data

Primary data files are stored in `public/data/`, including:

- `final_AmzFACE_merged_by_coords.with_ids.geojson` (tree-level records)
- `final_data_species_with_gbif_inaturalist copy.json` (species metadata)
- `species_references_by_species.json` (species reference lists)

Supporting scripts are in `scripts/` for data preparation/conversion tasks.

## Project Structure

- `app/`: routes (`/`, `/about`, `/login`) and API endpoints
- `components/dashboard/`: dashboard UI, map, filters, plant drawer, chart modules
- `components/ui/`: shared shadcn/base-ui primitives
- `hooks/`: dashboard data processing hooks
- `lib/`: reusable computation utilities (for example species abundance scoring)
- `public/data/`: source datasets used at runtime

## License

No license file is currently defined in this repository.

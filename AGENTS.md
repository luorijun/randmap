# Project Notes

- This is a Vite + TypeScript + PixiJS random map visualization project.
- Run with `bun install` and `bun run dev`.
- The active app entry is `src/main.ts`, which initializes `src/ui/view.ts` and `src/ui/canvas.ts`.
- The current rendering path is `src/ui/canvas.ts` -> `src/voronoi/index.ts`.
- `src/voronoi/index.ts` is the main map implementation: Poisson sampling, Delaunay/Voronoi generation, height, temperature, inland distance, wind data, and PixiJS tile rendering.
- `src/base/input.ts` handles drag, zoom, and viewport state.
- `src/base/draw.ts` contains color mappings for terrain, temperature, and inland views.
- `src/calc/wind.ts` contains the basic wind calculation.
- `src/terrain/` is a separate experimental/unused path for chunked noise terrain with a worker and `SharedArrayBuffer`; it is not currently wired into `src/main.ts`.
- Vite uses `@` as an alias for `src`, Tailwind CSS v4, and COOP/COEP dev headers for `SharedArrayBuffer` support.

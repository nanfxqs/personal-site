# Use Custom Astro with React Islands for Static Knowledge Base and Personal Site

---
status: accepted
---

We chose Custom Astro (Content Layer API + MDX + Islands) with React, TypeScript, Tailwind CSS, KaTeX, Mermaid, and Pagefind over Astro Starlight, VitePress, Next.js Static Export, and Quartz 4.

## Considered Options

- **Astro Starlight**: Fast to start for pure docs, but assumes a single global documentation tree; adapting it to a hybrid personal profile + journal timeline + multi-subject workbench with custom backlinks requires brittle component overrides.
- **VitePress**: Bound to Vue 3, lacking React's scientific/math visualization ecosystem (Mafs, React Three Fiber, Motion) and native typed cross-collection references.
- **Next.js Static Export (Fumadocs / Nextra)**: Ships full-page React hydration even for read-only prose pages; unnecessary full-stack complexity for a static site.
- **Quartz 4**: Great out-of-the-box wikilinks and graph view, but its Preact + `micromorph` SPA layer does not natively support stateful MDX React/Three.js interactive components.

## Consequences

- Pure text, LaTeX formulas (KaTeX), and Mermaid diagrams compile to zero-JS static HTML at build time.
- 2D interactive visualizations (Motion, D3 calculations, Mafs) hydrate on demand via `client:visible`; 3D WebGL scenes (Three.js / R3F) skip SSR and lazy-load only when scrolled into view.
- We own the layout shell (editorial magazine style, light/dark theme, three-column knowledge workbench, and backlinks/graph views) without fighting theme constraints.

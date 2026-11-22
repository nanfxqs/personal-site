# Decouple Syllabus Registry from Co-located Topic Bundles with Stub Fallback

---
status: accepted
---

Each Course defines its Chapter → Section → Topic tree and custom pedagogical order in a lightweight syllabus registry file, while actual Topic content lives in self-contained co-located folders (`topic-id/index.mdx` plus optional `_Widget.tsx` files) created incrementally by an AI agent.

## Considered Options

- **Pre-generating empty MDX files for every syllabus node**: Pollutes the repository with hundreds of stub files and makes reordering chapters/topics tedious.
- **Strict link validation requiring target pages to exist**: Breaks builds whenever a Topic references an unstudied concept or when a Topic folder is temporarily removed.

## Consequences

- Any Topic declared in a syllabus without a corresponding content bundle renders as a **Stub Topic** (unstudied placeholder) and can be safely cross-referenced from any Course, Subject, or Journal Entry without breaking builds.
- Deleting or moving a Topic folder gracefully degrades it back to a Stub Topic, preserving high cohesion and pluggability.
- Teaching order can be freely reorganized in the syllabus registry without touching individual MDX files.

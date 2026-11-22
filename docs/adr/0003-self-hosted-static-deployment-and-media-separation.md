# Self-Host Static Output on Personal Server and Separate Heavy Media from Git

---
status: accepted
---

The site builds to a pure static bundle deployed to the user's own server (`debian-cloud`), while heavy audio/video assets for Journal Entries are stored outside the Git repository (served directly from a static media path on the server or embedded via external links).

## Considered Options

- **Committing audio/video files directly to Git**: Rapidly bloats repository history, slows clone/push operations, and complicates future migration to CDN/static hosts.
- **Adding a backend CMS or object-storage upload API**: Unnecessary overhead since all authoring happens locally via Git and AI agents.

## Consequences

- Images used in Journal Entries and Topics may be co-located in Git and optimized at build time.
- Heavy audio and video files are excluded from Git and referenced by URL/server media path, keeping the repository fast and portable.
- Access control (initially private to the owner) is handled at the server/network layer rather than in application code.

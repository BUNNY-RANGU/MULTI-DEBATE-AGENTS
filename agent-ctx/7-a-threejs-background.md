# Task 7-a — Three.js Background Builder

**Status:** ✅ Complete

## Deliverable
- Created `/src/components/agora/particle-background.tsx`

## What was built
A full-screen Three.js particle background component for the dark-themed AGORA AI platform:

- **2200 particles** with weighted 4-color palette (violet, cyan, emerald, warm white)
- **~15% "star" particles** — larger/brighter for visual depth
- **Custom GLSL shaders** — soft circular points, additive blending, per-particle color & size
- **Neural-network connecting lines** between nearby particles (low opacity, distance-faded)
- **Mouse repulsion** — subtle 150px radius push-away effect
- **Seamless edge-wrapping** for infinite field
- **Performance optimized** — BufferGeometry, bounding-box pre-check, line count cap, low-power GPU preference
- **Fully responsive** with proper resize handling
- **Clean unmount** — all Three.js resources disposed, listeners removed, RAF cancelled
- Canvas: `fixed inset-0 z-0 pointer-events-none` (transparent, behind all content)
- **Zero lint errors**
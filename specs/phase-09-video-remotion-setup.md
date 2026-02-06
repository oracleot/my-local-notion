# Phase 9 — Video Walkthrough: Remotion Project Setup

> **Goal**: Create a ~60-90 second programmatic YouTube video using Remotion (React-based video).
> Targets general users — highlights privacy, productivity, and key features.
> Animated text captions over stylized app screenshots, smooth transitions, background music. No screen recording or voiceover.

- [ ] **9.1** Initialize Remotion project in `video/` directory at repo root
  - Run `npx create-video@latest` (TypeScript template)
  - Configure Tailwind CSS for Remotion (per `rules/tailwind.md`)
  - Add to `.gitignore`: `video/out/`, `video/node_modules/`
- [ ] **9.2** Set up project structure inside `video/`
  - `video/src/Root.tsx` — Register all compositions
  - `video/src/compositions/` — One folder per scene
  - `video/src/components/` — Shared animated components
  - `video/src/assets/` — Screenshots, music, icons
  - `video/src/lib/` — Timing constants, color tokens, font config
- [ ] **9.3** Configure video composition with Zod schema (per `rules/parameters.md`)
  - Props: `title`, `tagline`, `features[]`, `themeColors`
  - Register single `MainVideo` composition: **1920×1080 @ 30fps**, ~85 seconds
- [ ] **9.4** Load fonts (per `rules/fonts.md`)
  - Use `@remotion/google-fonts` for a distinctive display font (e.g., Space Grotesk)
  - Clean body font for captions
- [ ] **9.5** Define shared timing constants and color tokens in `video/src/lib/`
  - Scene durations, transition durations, frame breakpoints
  - Brand colors matching the app's theme

# Phase 12 — Video Walkthrough: Build Scenes

> Use **frontend design skill** for distinctive visuals. Use **Remotion best practices** for animations, sequencing, and transitions.

- [ ] **12.1** Build Scene 1 — Intro/Hook (0–8s)
  - Animated text reveal of hook line against gradient mesh background
  - `spring()` entrance animation (per `rules/animations.md`, `rules/text-animations.md`)
  - Transition out with slide/wipe (per `rules/transitions.md`)
- [ ] **12.2** Build Scene 2 — Problem (8–14s)
  - Pain-point text animates in with subtle glitch/shake effect
  - Dark, moody background tone
- [ ] **12.3** Build Scene 3 — App Reveal (14–22s)
  - App name/logo scales up with spring bounce
  - Tagline fades in below
  - Background shifts to brand colors
- [ ] **12.4** Build Scene 4 — Feature Showcase (22–60s)
  - 5 feature cards, ~7–8 seconds each
  - Each card: text caption slides in from left, framed screenshot scales in from right
  - Use `<Sequence>` / `<Series>` (per `rules/sequencing.md`)
  - Scene transitions between features (per `rules/transitions.md`)
  - Screenshots inside a `BrowserFrame` mockup component
- [ ] **12.5** Build Scene 5 — Privacy Punch (60–72s)
  - Bold, large text: "100% local." — staggered word entrance
  - Icons for "No accounts", "No cloud", "No tracking" with spring animations
- [ ] **12.6** Build Scene 6 — CTA/Outro (72–85s)
  - App name, URL, GitHub star prompt
  - Fade out with music

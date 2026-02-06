# Phase 14 — Video Walkthrough: Polish & Render

- [ ] **14.1** Add music track to composition
  - Import audio, set volume, sync timing (per `rules/audio.md`)
  - Apply short fade-in at start and fade-out at end
- [ ] **14.2** Wire all scenes into `Root.tsx`
  - Register as single `<Composition>` using `<Series>` to chain scenes
  - Verify total duration is 80–90 seconds
- [ ] **14.3** Preview and iterate
  - Run `npx remotion preview` in `video/` directory
  - Scrub through all scenes — verify timing, transitions, text readability
- [ ] **14.4** Render final video
  - Run `npx remotion render MainVideo out/walkthrough.mp4 --codec h264`
  - Verify output: 1080p, 30fps, correct duration, audio synced
- [ ] **14.5** Final QA
  - Confirm `pnpm build` in main project root still passes (video workspace doesn't interfere)
  - Test video playback in multiple players
  - Verify text is readable at 720p (YouTube's most common quality)

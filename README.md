# UnMorph

**Decentralized image integrity & authentication layer.**
Prevent morphing. Prove authenticity.

UnMorph fingerprints original images, anchors that proof on decentralized infrastructure
(World ID · Arkiv · 0G), and exposes manipulation — from subtle retouching to AI-generated
alterations. See [`docs/project-overview.md`](docs/project-overview.md) for the product vision.

> **Status:** front-end prototype. The sign-in flow is a demo (any credentials open the
> dashboard) and the dashboard runs on deterministic internal mock data. The SHA-256 fingerprint
> in the verifier is real (Web Crypto, in-browser); registry, tamper analysis and attestation are
> simulated from that hash.

## Stack

| Concern    | Choice                                                                       |
| ---------- | ---------------------------------------------------------------------------- |
| Runtime/PM | **Bun only** (`bun install` — other package managers are rejected)           |
| Framework  | Next.js 16 (App Router, Turbopack, Cache Components, Partial Prefetching)    |
| Language   | TypeScript (strict)                                                          |
| Styling    | Tailwind CSS v4 (CSS-first tokens in `src/app/globals.css`)                  |
| Motion     | Motion (`motion/react`) for scroll-linked parallax · Lenis for smooth scroll |
| Fonts      | Plus Jakarta Sans (display) + Inter (body), self-hosted in `src/fonts` (OFL) |
| Unit tests | Jest + Testing Library (`src/**/*.test.ts(x)`)                               |
| E2E tests  | Playwright (`e2e/`, desktop + Pixel 7 projects)                              |
| Git hooks  | Husky + lint-staged                                                          |

## Getting started

```bash
bun install                 # also installs Husky hooks
bun run test:e2e:install    # one-time: Playwright's Chromium
bun run dev                 # http://localhost:3000
```

## Scripts

| Script                    | What it does                                                            |
| ------------------------- | ----------------------------------------------------------------------- |
| `bun run dev`             | Dev server                                                              |
| `bun run build` / `start` | Production build / serve                                                |
| `bun run lint`            | ESLint (Next core-web-vitals + TypeScript)                              |
| `bun run typecheck`       | `tsc --noEmit`                                                          |
| `bun run format`          | Prettier (+ Tailwind class sorting)                                     |
| `bun run test`            | Jest unit/component tests                                               |
| `bun run test:e2e`        | Playwright — builds and serves on `:3100` unless one is already running |

### Git hooks

- **pre-commit** — lint-staged (ESLint `--fix`, Prettier, related Jest tests) then `typecheck`
- **pre-push** — full Jest suite, then Playwright E2E

## Routes

| Route        | Description                                                                                                                                                             |
| ------------ | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `/`          | Landing page — parallax hero, scroll-scrubbed manifesto, sticky "how it works", draggable tamper-detection demo, bento infrastructure grid, pinned horizontal use cases |
| `/sign-in`   | Demo sign-in (email or "Continue with World ID") → `/dashboard`                                                                                                         |
| `/dashboard` | Image verification dashboard — KPIs, live verifier, activity chart, filterable registry, report drawer                                                                  |
| any other    | Branded 404 ("This page didn't pass verification")                                                                                                                      |

## Project structure

```text
src/
  app/
    (marketing)/        landing page + layout (Lenis smooth scroll, dynamic island, footer)
    sign-in/            demo auth screen
    dashboard/          dashboard shell + overview
    not-found.tsx       404
    fonts.ts            next/font/local setup
    globals.css         design tokens (brand palette, shadows, keyframes)
  components/
    nav/dynamic-island.tsx   the morphing navbar
    landing/ auth/ dashboard/ not-found/
    motion/             Reveal, RevealWords, Parallax primitives
    visuals/landscape.tsx    procedural vector "photographs"
  hooks/                pointer parallax, active section, media query, measure
  lib/
    mock-data.ts        deterministic internal mock data (seeded)
    verification.ts     SHA-256 + mock verdict engine
    build-verification.ts
  fonts/                Plus Jakarta Sans + Inter variable woff2 (+ OFL licences)
e2e/                    Playwright specs
assets/ docs/           brand source files & product overview
```

## Notes

- **Cache Components / `<Activity>`:** Next keeps recently visited routes mounted but hidden.
  Transient UI (menus, drawers, form loading states, in-flight verifications) resets itself in
  `useLayoutEffect` cleanups, and dashboard section ids are prefixed (`dash-*`) so they never
  collide with the hidden landing page.
- **Reduced motion:** honoured globally (`MotionConfig reducedMotion="user"`, Lenis
  `respectReducedMotion`, and a CSS fallback).
- **Chart colours** (authentic / unregistered / tampered) were validated for colour-vision-deficiency
  separation; verdicts always pair colour with an icon and a label, and the activity chart has a
  table view.

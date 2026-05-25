# Project Overview

## Purpose

A Bible reading tracker and plan generator deployed as a progressive web app (PWA) at `https://emeraldwalk.github.io/tasks/`.

Users mark Bible chapters as read, browse reading history, and follow a configurable day-by-day reading plan that interleaves Old Testament (OT) and New Testament (NT) chapters.

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Framework | [SolidJS](https://www.solidjs.com/) 1.9 |
| Language | TypeScript 5.7 |
| Routing | `@solidjs/router` 0.15 |
| Build | Vite 6 |
| Persistence | Browser IndexedDB (`BibleReadDB` v2) |
| Hosting | GitHub Pages (auto-deployed from `main` via `.github/workflows/deploy.yml`) |

## Entry Points

| File | Role |
|------|------|
| `web/index.html` | HTML shell, mounts `#root` |
| `web/src/index.tsx` | SolidJS render call |
| `web/src/components/App.tsx` | Root component; bootstraps `Api` via `createResource` |
| `web/src/components/AppRouter.tsx` | Declares all routes |

## Routes

| Path | View | Description |
|------|------|-------------|
| `/` | Books | All 66 books grouped by book name; mark chapters read |
| `/plan` | Plan | Day-by-day reading plan, chapters grouped into day buckets |
| `/history` | History | Chronological log of every read timestamp |

## Static Data Sources

Bible metadata is bundled at build time as raw text imports:

- `web/src/data/chapters.txt` — CSV: `ABBREV,Full Name,Chapter Count` (one row per book)
- `web/src/data/tags.txt` — CSV: `TAG,ABBREV` (maps tag names like `OT`/`NT` to book abbreviations)

These files are parsed by `web/src/utils/dataUtils.ts` at startup and never hit a network.

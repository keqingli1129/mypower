# Genpage Plan

## User Requirements
Run our board game nights: players, the game library, scheduled nights, RSVPs and results.

## Working Directory
/home/keqing-li/Documents/mypower/game-night-hq

## Plugin Root
/home/keqing-li/.claude/plugins/cache/power-platform-skills/model-apps/2.12.0

## Environment
- URL: https://orgf8ec768a.crm.dynamics.com
- App: Game Night HQ
- Languages: 1033
- Solution: BoardGameManagement
- Publisher Prefix: kli
- Mode: app-builder

## Pages
| Page | Key | File | Purpose | Entities |
|------|-----|------|---------|----------|
| Game Night Home | home | home.tsx | Landing page: the next scheduled game night as a hero card (title, date/time, location, countdown, Going/Maybe counts from RSVPs), the next few upcoming nights, and the most recent game results (game, winner, fun rating). | kli_gamenight, kli_rsvp, kli_gameresult, kli_boardgame, kli_player |
| Leaderboard | leaderboard | leaderboard.tsx | Analytics: players ranked by number of wins (with win count bars), most-played board games, and average fun rating per game, computed from Game Results. | kli_gameresult, kli_player, kli_boardgame |

## Entity Creation Required
No entity creation required — all entities already exist.

## Existing Entities
kli_gamenight, kli_rsvp, kli_gameresult, kli_boardgame, kli_player

## Connector Bindings
No connector bindings.

## Custom API Bindings
No custom API bindings.

## Design Preferences
- Styling: Fluent UI V9 tokens — Accent color: #6b3fa0; Density: comfortable; Corner radius: medium; Dark mode: system
- Layout: cards layout, responsive
- Features: Search, sorting and filtering where the page lists records
- Accessibility: WCAG AA (ARIA labels, keyboard navigation, semantic HTML)

## Relevant Samples
| Page | Sample | Reason |
|------|--------|--------|
| Game Night Home | 9-list-with-caching.tsx | Dataverse-bound page: queryTable + DataTable rows with the on-mount de-dupe cache |
| Leaderboard | 9-list-with-caching.tsx | Dataverse-bound page: queryTable + DataTable rows with the on-mount de-dupe cache |

## Per-Page Specifications

### Game Night Home
- **Key:** home
- **File:** home.tsx
- **Purpose:** Landing page: the next scheduled game night as a hero card (title, date/time, location, countdown, Going/Maybe counts from RSVPs), the next few upcoming nights, and the most recent game results (game, winner, fun rating).
- **Entities:** kli_gamenight, kli_rsvp, kli_gameresult, kli_boardgame, kli_player
- **Needs caching:** true
- **Key Features:** Landing page: the next scheduled game night as a hero card (title, date/time, location, countdown, Going/Maybe counts from RSVPs), the next few upcoming nights, and the most recent game results (game, winner, fun rating).
- **Components:** Fluent UI V9 (unsized Regular/Filled icons only)
- **Layout:** cards layout, responsive — responsive flexbox/grid with relative units (never 100vh/100vw)
- **Data Binding:** dataApi.queryTable / retrieveRow over the entities above
- **Interactions:** In-page interactions only (no cross-page navigation)

### Leaderboard
- **Key:** leaderboard
- **File:** leaderboard.tsx
- **Purpose:** Analytics: players ranked by number of wins (with win count bars), most-played board games, and average fun rating per game, computed from Game Results.
- **Entities:** kli_gameresult, kli_player, kli_boardgame
- **Needs caching:** true
- **Key Features:** Analytics: players ranked by number of wins (with win count bars), most-played board games, and average fun rating per game, computed from Game Results.
- **Components:** Fluent UI V9 (unsized Regular/Filled icons only)
- **Layout:** cards layout, responsive — responsive flexbox/grid with relative units (never 100vh/100vw)
- **Data Binding:** dataApi.queryTable / retrieveRow over the entities above
- **Interactions:** In-page interactions only (no cross-page navigation)

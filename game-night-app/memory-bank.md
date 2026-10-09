# Game Night — Memory Bank

## Project
- Path: ~/Documents/mypower/game-night-app/
- App name: Game Night (Power Apps code app, React 19 + Vite)
- Environment: Keqing Li Dev (`0f940836-d097-e42c-8597-62d9d7f17f1d`)
- App ID: `f5916d4e-9207-4946-b0e3-30852e341c57`
- Solution: Board Game Management (`86c1d50c-2ac1-f111-aaad-6045bd08c2a1`), publisher Keqing Li (`kli`)
- CLI Binary: `pa` (`@microsoft/power-apps-cli` 1.2.0, added by hand — the template no longer ships it)
- Publish: `npm run deploy` (= `npm run build && pa app push --solution-id <solution>`)

## Completed steps (tiny-steps learning path)
- [x] 1 Enable code apps in Keqing Li Dev (admin center)
- [x] 2 Scaffold template (`npx degit`) + `npm install` + add `pa` CLI
- [x] 3 `pa auth login` + `pa app init` → power.config.json (needed before `npm run dev` works)
- [x] 4 Cut App.tsx to a 5-line Hello
- [x] 5 User's own edit: two headings in a fragment
- [x] 6 First publish (`npm run build` + `pa app push`) — landed in the default solution
- [x] 7 User created the Board Game Management solution in the maker portal, added the app (Add existing), added the `deploy` npm script

- [x] 8 Player table created (kli_player / entity set kli_players / primary column kli_name) in the solution — via Web API with MSCRM.SolutionUniqueName header
- [x] 9 Email column (kli_email, Text/Email format) added to Player
- [x] 10 Three sample players added (Tom Nguyen, Priya Shah, Marcus Bell) via POST /kli_players
- [x] 11 Connected kli_player to the app (`pa app add data-source --connector dataverse --table kli_player`): power.config.json databaseReferences "players", .power/schemas, src/generated/ (Kli_playersModel.ts, Kli_playersService.ts); build passes
- [x] 12a `useState<number | null>(null)` + ternary display ("Loading players…")
- [x] 12b `useEffect(..., [])` calls `Kli_playersService.getAll({ select: ['kli_name'] })`, `console.log` the result (works only in **Local Play**, not plain localhost)
- [x] 12c `setPlayerCount(result.data?.length ?? 0)` → "We have 3 players."

## Next
- Step 13: list the players' names — keep the whole array in state (`useState<Kli_players[]>`), render with `.map()` and `key`. Then Step 14: add-player form (`Kli_playersService.create`).
- Later: Board Game, Game Night, RSVP, Game Result tables, one at a time.

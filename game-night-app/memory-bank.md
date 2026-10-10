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
- [x] 13a state holds the array `useState<Kli_players[] | null>`, count = `players.length` (import type, type narrowing)
- [x] 13b `<ul>` + `players?.map(...)` with `key={player.kli_playerid}`
- [x] 14a controlled `<input>` (`value` + `onChange`, `useState('')` type inference)
- [x] 14b `<button onClick={handleAdd}>` (pass the function, not `handleAdd()`)
- [x] 14c `async`/`await` `Kli_playersService.create({ kli_name, statecode: 0 })` — TS error taught that `statecode` is required by the generated Base type
- [x] 14d `if (newPlayer)` narrowing, `setPlayers((current) => [...(current ?? []), newPlayer])`, clear input
- [x] 15 `disabled={newName.trim() === ''}` on the Add button

## Next
- Step 16: delete a player — ✕ button per row, `Kli_playersService.delete(id)`, `setPlayers(current => current.filter(...))`. Then: edit a name (update), then the second table (Board Game).
- Later: Board Game, Game Night, RSVP, Game Result tables, one at a time.

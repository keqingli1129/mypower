# Board Game Management — Power Platform learning project

Following the Power Academy tutorial in `docs/transcript_1.txt`.

## Target (all work goes here unless told otherwise)
- Environment: **Keqing Li Dev** — https://orgf8ec768a.crm.dynamics.com/ (personal Developer environment; user is System Administrator)
- Solution: `BoardGameManagement` ("Board Game Management")
- Publisher: `KeqingLi` ("Keqing Li"), prefix `kli`, choice value prefix `31847`

Moved here from FBISD Personal Productivity (https://fbisd.crm.dynamics.com/) because the user cannot create tables there (Environment Maker only). An empty publisher + solution with the same names remain there; leave them alone.

## Rules
- Build every table, column, choice, app, flow, page, and security role inside the `BoardGameManagement` solution using the `kli` publisher. Never create components in the Default / Common Data Services Default solution.
- When a tool or skill has no solution parameter, add the component to `BoardGameManagement` afterwards (e.g. `pac solution add-solution-component`).
- Before any build, confirm `pac org who` shows Keqing Li Dev.
- Never target FBISD-Ai-PROD or the shared FBISD Personal Productivity environment. Moving to another environment later is done by exporting the solution (managed for production), not by rebuilding there.

## Known environment quirk
- FBISD's sign-in policy (Continuous Access Evaluation) binds the az token to the IP it was issued from. Node-based plugin scripts can get `401 insufficient_claims` when they connect over IPv4. Run them with `NODE_OPTIONS="--require <file>"`, where the file overrides `dns.lookup` to force `family: 6`.

## Local snapshot (for learning what each step changes)
- `solution/BoardGameManagement/` is an unpacked clone of the cloud solution (Dataverse is the source of truth).
- After each tutorial step: run `pac solution sync` in `solution/BoardGameManagement/`, then review `git diff --stat` / `git diff` with the user and commit with a message naming the step.

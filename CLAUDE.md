# Board Game Management — Power Platform learning project

Following the Power Academy tutorial in `docs/transcript_1.txt`.

## Target (all work goes here unless told otherwise)
- Environment: FBISD Personal Productivity — https://fbisd.crm.dynamics.com/ (shared tenant default environment)
- Solution: `BoardGameManagement` ("Board Game Management")
- Publisher: `KeqingLi` ("Keqing Li"), prefix `kli`, choice value prefix `31847`

## Rules
- Build every table, column, choice, app, flow, page, and security role inside the `BoardGameManagement` solution using the `kli` publisher. Never create components in the Default / Common Data Services Default solution.
- When a tool or skill has no solution parameter, add the component to `BoardGameManagement` afterwards (e.g. `pac solution add-solution-component`).
- This is a shared environment with ~60 other solutions owned by colleagues — never modify or delete components that are not part of `BoardGameManagement`.
- Never target FBISD-Ai-PROD.

## Local snapshot (for learning what each step changes)
- `solution/BoardGameManagement/` is an unpacked clone of the cloud solution (Dataverse is the source of truth).
- After each tutorial step: run `pac solution sync` in `solution/BoardGameManagement/`, then review `git diff --stat` / `git diff` with the user and commit with a message naming the step.

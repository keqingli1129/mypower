# Board Game Management — Power Platform learning project

The user is learning **TypeScript and the Power Apps build process** by building a Game Night app as a
**Power Apps code app** (React + Vite, `code-apps-preview` plugin) in the **tiniest possible steps**.
The original model-driven attempt (Power Academy tutorial, `docs/transcript_1.txt`) was torn down on
2026-10-05; its files are kept for reference in `archive/`.

## Target (all work goes here unless told otherwise)
- Environment: **Keqing Li Dev** — https://orgf8ec768a.crm.dynamics.com/ (env id `0f940836-d097-e42c-8597-62d9d7f17f1d`; personal Developer environment; user is System Administrator)
- Solution: `BoardGameManagement` ("Board Game Management") — recreate when the step calls for it
- Publisher: `KeqingLi` ("Keqing Li"), prefix `kli`, choice value prefix `31847` (still exists in Keqing Li Dev)

## How to teach (user's explicit request)
- One tiny step at a time: make one small change, explain every new TypeScript/React/Power Platform concept in it, deploy or run it so the user sees the result, commit it, then STOP and wait for "next".
- Never batch several features into one step. Prefer writing code by hand over generators; when a generator is required (`pa app add data-source`), show and explain what it generated.
- Each step = one git commit named `Code app Step N: <what it adds>`.
- Run the type check / build before every deploy.

## Rules
- Put every Dataverse component (tables, columns, choices, apps) in the `BoardGameManagement` solution with the `kli` publisher. Never use the Default solution.
- Before any Dataverse or deploy command, confirm `pac org who` shows Keqing Li Dev.
- Never target FBISD-Ai-PROD or the shared FBISD Personal Productivity environment.

## Known environment quirk
- FBISD's sign-in policy (Continuous Access Evaluation) binds the az token to the IP it was issued from. Node-based scripts can get `401 insufficient_claims` when they connect over IPv4. Run them with `NODE_OPTIONS="--require <file>"`, where the file overrides `dns.lookup` to force `family: 6`.

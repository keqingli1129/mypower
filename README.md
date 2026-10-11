# Game Night — Power Platform learning project

A small "Game Night" project built three ways on one Dataverse table, kept in Git.
This file is the how-to for maintaining the folder. Setting up a new code app from scratch
is covered in [docs/code-app-setup-guide.md](docs/code-app-setup-guide.md).

## What lives where

| Folder / file | What it is | Source of truth |
|---|---|---|
| `game-night-app/` | **Code app** (React + TypeScript). The only copy of its source code. | **This folder** |
| `solution/BoardGameManagement/` | Clone of the **whole solution** from Dataverse (table, flow, canvas app, built code app). Refreshed by `sync-solution.sh`. | The cloud (this is a copy) |
| `sync-solution.sh` | One command: deploy the code app, pull the solution, extract canvas YAML. | — |
| `game-night-canvas/` | Working folder Claude uses to build canvas screens by co-authoring (`.pa.yaml` + plugin planning notes). | The cloud (copy) |
| `game-night-app/dataverse/*.json` | Records of the API requests that created the Player table, Email column and sample players. Notes only. | — |
| `flows/` | Hand-kept copy of the flow definition. Notes only (the real one is in `solution/…/Workflows/`). | — |
| `docs/` | Tutorial transcript + code app setup guide. | — |
| `archive/` | The first (model-driven) attempt, torn down 2026-10-05. Reference only. | — |
| `CLAUDE.md` | Rules Claude follows in this folder. | — |

Never committed (ignored): `node_modules/`, `game-night-app/dist/`, `.maker-workspace/`.

## The cloud side

| | Value |
|---|---|
| Environment | **Keqing Li Dev** (personal Developer env) — `https://orgf8ec768a.crm.dynamics.com/`, ID `0f940836-d097-e42c-8597-62d9d7f17f1d` |
| Solution | **Board Game Management** (`BoardGameManagement`), ID `86c1d50c-2ac1-f111-aaad-6045bd08c2a1` |
| Publisher | Keqing Li — prefix `kli`, choice value prefix `31847` |

What's in the solution:

| Component | Type | How you change it | How it goes live |
|---|---|---|---|
| **Game Night** (`f5916d4e-…`) | Code app | Edit `game-night-app/src/` in VS Code | `npm run deploy` (or `./sync-solution.sh`) |
| **Game Night Players** (`00cd1a37-…`) | Canvas app | Power Apps Studio (or Claude via co-authoring) | **Save + Publish in Studio** |
| **New Player Welcome** (`2142bc9f-…`) | Cloud flow | make.powerautomate.com flow designer | Saved = live (flow must be **On**) |
| **Player** (`kli_player`) | Dataverse table | Maker portal → Tables, or the Web API | Live as soon as saved |
| 2 connection references | Dataverse + Outlook | Added automatically with the flow | — |

Rows of data (the players themselves) are **not** part of the solution and are not in Git.

## Everyday routine

**Start of a session**
```bash
cd ~/Documents/mypower
git pull                          # only if you also work elsewhere / on GitHub
./sync-solution.sh --no-deploy    # catch up with changes made in the cloud
git status                        # anything changed? commit it first as "Sync: cloud changes"
```

**While working**

| You are changing… | Do this |
|---|---|
| Code app (trying things) | `cd game-night-app && npm run dev`, open the **Local Play** link (data only works there, not plain localhost) |
| Code app (ready to go live) | `./sync-solution.sh` (builds, deploys, then pulls) |
| Canvas app | Edit in Studio → **Save** → **Publish** → `./sync-solution.sh --no-deploy` |
| Flow or table | Edit in the browser → save → `./sync-solution.sh --no-deploy` |

**End of a session**
```bash
./sync-solution.sh        # or --no-deploy if game-night-app/ didn't change
git status && git diff    # review
# commit + push yourself (VS Code Source Control)
```

`./sync-solution.sh` without `--no-deploy` **publishes whatever is in `game-night-app/`**. Don't run it
with half-finished code.

## Sign-ins (FBISD makes you re-sign-in every 7 days)

| Tool | Used for | Sign in |
|---|---|---|
| `pac` | solutions, environments, `sync-solution.sh` | `pac auth create --environment https://orgf8ec768a.crm.dynamics.com/` |
| `pa` | code app deploy (`npm run deploy`) | `cd game-night-app && npx pa auth login` |
| `az` | direct Dataverse API calls (Claude uses these) | `az login` |

An expired sign-in shows `AADSTS70043` / "sign-in frequency", or the script stops with
"pac is not connected to Keqing Li Dev". Sign in again and rerun.

## Moving the solution to another environment

1. `./sync-solution.sh` so everything is current, and commit.
2. Make the package:
   ```bash
   pac solution export --name BoardGameManagement --managed --path BoardGameManagement_managed.zip
   ```
   (or `pac solution pack --folder solution/BoardGameManagement/src …` to build it from Git; that clone is
   unmanaged-only).
3. Importing into another environment needs System Customizer/Administrator there; for FBISD production,
   IT imports it (or uses Pipelines).
4. In the target: turn on **code apps**, pick connections for the 2 connection references, turn the flow on,
   share the apps. Code apps need Power Apps Premium licenses for users.

Never `npm run deploy` straight into a production environment, and never edit things there — change them in
Keqing Li Dev and ship a new package.

## Troubleshooting (things that actually happened)

| Symptom | Fix |
|---|---|
| `npm run dev` → "Missing file … power.config.json" | Run `npx pa app init` in `game-night-app/` (already done; only for a new app) |
| Code app shows "Loading players…" forever | You're on plain `localhost` — use the **Local Play** link |
| Canvas edits disappeared | They were never **Saved** in Studio. Save + Publish right after any change |
| Can't type in a canvas text box in Studio | Edit mode selects controls — press **F5 / ▶ Play** (or Alt+click) |
| Flow won't turn on: `CannotStartUnpublishedSolutionFlow` | Open it once in the flow designer and **Save**, then turn on |
| Flow didn't email someone | They have no Email — the flow's condition skips them on purpose |
| Red lines in a `.tsx` file | `npm install` in that folder, then **TypeScript: Restart TS Server** |
| Node scripts get `401 insufficient_claims` | FBISD IPv4/IPv6 token binding — see "Known environment quirk" in `CLAUDE.md` |

## Where to look in the cloud

- Apps, tables, solution: **make.powerapps.com** → environment **Keqing Li Dev** → Solutions → Board Game Management → **Objects**
- Flow + run history: **make.powerautomate.com** → Keqing Li Dev → My flows → New Player Welcome
- Connections: either portal → **Connections**
- Environment settings (e.g. code apps on/off): **admin.powerplatform.microsoft.com** → Environments → Keqing Li Dev → Settings

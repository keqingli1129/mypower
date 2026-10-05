# Workflow log — Game Night HQ (app-builder)

## Phase 1 — Authoring

`node --version`
v24.18.0
`pac help`
PAC CLI Version 2.12.2
`pac auth list`
[1] * UNIVERSAL Keqing.Li@fortbendisd.gov — FBISD Personal Productivity (single active profile; confirmed, not asked)
`pac org who`
Org URL: https://fbisd.crm.dynamics.com
`pac model list-tables --search player`
No tables found (no exact matches for kli_player etc. — all tables need creation)
`pac model list`
No existing Game Night HQ app → create new (settled by user request)
Solution: BoardGameManagement / publisher KeqingLi / prefix kli — pre-created by user in Step 4 of the tutorial; question skipped (settled per CLAUDE.md + user request)
AskUserQuestion: Who will use Game Night HQ? (Organizer + Player) → Yes, Organizer + Player (Recommended)
Level (a0): personas "Game Night Organizer" (6 jobs), "Game Night Player" (4 jobs) — names prefixed "Game Night" so the roles don't collide in the shared environment
Level (a): data model written — kli_player, kli_boardgame, kli_gamenight, kli_rsvp, kli_gameresult; 5 OneToMany
`node lint-app-spec.js --spec @app-spec.json --json` (data-model only)
AskUserQuestion: Does this data model look right? → Looks good, continue (Recommended)
Level (b): 6 views, 3 charts, 5 forms (sub-grids), 2 intent pages (home, leaderboard), appShell 3 groups, design contract, sample data (5 players, 5 games, 4 nights, 10 RSVPs, 3 results), 5 SVG table icons
`node preview-app.js --spec @app-spec.json` → rendered and shown verbatim
AskUserQuestion: Happy with these screens, pages, navigation and sample data? → Looks good, continue (Recommended)
Level (c): Organizer = full CRUD @ organization on all 5 tables; Player = read @ org, RSVP create/write @ user, appendTo on game night/player
AskUserQuestion: Approve this access model for the two roles? → Approve (Recommended)
`node lint-app-spec.js --spec @app-spec.json --json` → ok=true, errors=0, warnings=0
`node build-model-app.js --env https://fbisd.crm.dynamics.com --spec @app-spec.json` (dry run) → 35 "could not be read": HTTP 401
`node check-auth.js https://fbisd.crm.dynamics.com` → whoami_401
Diagnosis: WWW-Authenticate error="insufficient_claims" (Entra Continuous Access Evaluation, IP-bound token). az token ipaddr claim = IPv6; Node fetch sometimes connects over IPv4 → 401.
Workaround: NODE_OPTIONS="--require <scratchpad>/force-ipv6.cjs" (forces dns.lookup family 6) → check-auth ok 3/3
`node build-model-app.js ...` (dry run, with workaround) → 35 to create, 0 already present, 40 not probed
`node write-app-spec-doc.js --spec @app-spec.json --env https://fbisd.crm.dynamics.com` → model-app-plan.md, warnings: []
EnterPlanMode called
approved
`node build-model-app.js --env https://fbisd.crm.dynamics.com --spec @app-spec.json --stage data --apply`
✓ solution BoardGameManagement (reused); ✗ table kli_player — HTTP 403 SecLib::CheckPrivilege prvCreateEntity (Create Table). Nothing else created.
Roles in FBISD Personal Productivity: Basic User, Environment Maker, Project User (no System Customizer). IS-Web team env: Teams membership only, no prvCreateEntity.
AskUserQuestion: Your account can't create Dataverse tables… → Ask admin for a role
Build PAUSED pending System Customizer grant. Resume: re-run the data pre-build (idempotent).

## Environment switch
User created personal Developer environment "Keqing Li Dev" (https://orgf8ec768a.crm.dynamics.com/, System Administrator).
`pac org select --environment https://orgf8ec768a.crm.dynamics.com/`
Recreated publisher KeqingLi (kli / 31847) + solution BoardGameManagement there. solution/ re-cloned. .maker-workspace cleared (it cached the old environment).

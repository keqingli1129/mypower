#!/usr/bin/env bash
# Upload home.tsx to the existing "Game Night Home" page in Keqing Li Dev (updates it in place).
set -e
cd "$(dirname "$0")"
pac model genpage upload \
  --environment https://orgf8ec768a.crm.dynamics.com \
  --app-id 3bdf046f-d1a0-47b8-9358-8891bd4e4b7e \
  --page-id 2a10c3e0-d318-4b92-893b-28a16b8bcce7 \
  --code-file home.tsx \
  --name "Game Night Home" \
  --prompt "Hand-written step by step while learning TypeScript (see git history of game-night-hq/home.tsx)." \
  --agent-message "Learning build; see commit message for what this step adds." \
  --data-sources "kli_gamenight,kli_rsvp,kli_gameresult"

#!/usr/bin/env bash
# One command to make solution/ match the latest of everything:
#   1. build + deploy the code app from game-night-app/ (so the solution holds your newest TypeScript)
#   2. pull the Board Game Management solution from Keqing Li Dev into solution/
#   3. extract each canvas app's readable .pa.yaml source next to its .msapp package
# Skip step 1 with:  ./sync-solution.sh --no-deploy
# Afterwards review with: git status / git diff
set -euo pipefail
ROOT="$(cd "$(dirname "$0")" && pwd)"

pac org who | grep -q "Keqing Li Dev" || { echo "pac is not connected to Keqing Li Dev - stopping"; exit 1; }

if [[ "${1:-}" != "--no-deploy" ]]; then
  echo "== 1/3 Deploying the code app (game-night-app)"
  (cd "$ROOT/game-night-app" && npm run deploy)
else
  echo "== 1/3 Skipping code app deploy (--no-deploy)"
fi

echo "== 2/3 Syncing the solution from Keqing Li Dev"
cd "$ROOT/solution/BoardGameManagement"
pac solution sync --packagetype Unmanaged

echo "== 3/3 Extracting canvas app source"
for msapp in src/CanvasApps/*.msapp; do
  out="${msapp%_DocumentUri.msapp}_src"
  rm -rf "$out" && mkdir -p "$out"
  python3 - "$msapp" "$out" <<'PY'
import sys, zipfile, os
msapp, out = sys.argv[1], sys.argv[2]
with zipfile.ZipFile(msapp) as z:
    for name in z.namelist():
        if name.replace('\\', '/').startswith('Src/') and name.endswith('.pa.yaml'):
            target = os.path.join(out, os.path.basename(name.replace('\\', '/')))
            with open(target, 'wb') as f:
                f.write(z.read(name))
            print('  extracted', target)
PY
done
echo "Done. Review with: git status && git diff"

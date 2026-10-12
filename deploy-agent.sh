#!/usr/bin/env bash
# One command to send the Game Night Helper agent from game-night-agent/ to Keqing Li Dev:
#   1. pack the YAML files into a solution zip
#   2. fix the zip's label: pack invents a "kli" publisher, so copy in the real
#      KeqingLi publisher + "Board Game Management" name from solution/
#   3. import the zip into Keqing Li Dev
#   4. run ./sync-solution.sh --no-deploy so git shows what reached the cloud
set -euo pipefail
ROOT="$(cd "$(dirname "$0")" && pwd)"
BUILD="$(mktemp -d)"                     # throwaway folder for the zip
trap 'rm -rf "$BUILD"' EXIT              # delete it when the script ends

pac org who | grep -q "Keqing Li Dev" || { echo "pac is not connected to Keqing Li Dev - stopping"; exit 1; }

echo "== 1/4 Packing game-night-agent/"
pac copilot pack --publisher-prefix kli --project-dir "$ROOT/game-night-agent" \
  --solution-name BoardGameManagement --output-path "$BUILD"

echo "== 2/4 Fixing the publisher in solution.xml"
mkdir "$BUILD/x"
unzip -q "$BUILD/BoardGameManagement.zip" -d "$BUILD/x"
python3 - "$BUILD/x/solution.xml" "$ROOT/solution/BoardGameManagement/src/Other/Solution.xml" <<'PY'
import re, sys
zipped, real_file = sys.argv[1], sys.argv[2]
header = re.compile(r'<SolutionManifest>.*?</Publisher>', re.S)   # name, version, publisher
real = header.search(open(real_file, encoding='utf-8-sig').read()).group(0)
text = open(zipped, encoding='utf-8').read()
open(zipped, 'w', encoding='utf-8').write(header.sub(lambda m: real, text, count=1))
PY
grep -q "<UniqueName>KeqingLi</UniqueName>" "$BUILD/x/solution.xml" || { echo "publisher fix failed - stopping"; exit 1; }
(cd "$BUILD/x" && zip -q -r "$BUILD/fixed.zip" .)

echo "== 3/4 Importing into Keqing Li Dev"
pac solution import --path "$BUILD/fixed.zip"

echo "== 4/4 Syncing solution/ to see what changed"
"$ROOT/sync-solution.sh" --no-deploy

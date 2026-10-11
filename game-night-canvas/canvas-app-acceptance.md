# Canvas App Acceptance — Game Night Players

Contract version: 1
Mode: CREATE · Screens: Screen1 (Players) · Data: Dataverse `Players` (kli_player)

## Compile evidence
- App-level compile before dispatch: PASS (3 files).
- First full compile after builder: 1 warning — `txtPlayersCount.Text`: "CountRows may return a cached value".
  Repair: `CountRows(Players)` → `CountRows(galPlayersList.AllItems)` (counts the rows the gallery shows, refreshed after every Patch/Remove).
- Second full compile: PASS (0 diagnostics).
- Coauthoring check: live session synced to a scratch directory contains Screen1 with 35 controls (Studio-normalized property order); generated controls reached the session.

## Action Contract evidence
| Action | Entry point | Handler | Source transition | Observer / receipt | Result |
|---|---|---|---|---|---|
| ACT-ADD | btnPlayersAdd (enabled when `Trim(txtPlayersNewName.Value)` non-blank) | OnSelect | `Patch(Players, Defaults(Players), {Name: newName})` → new Player GUID | galPlayersList row, txtPlayersCount +1, receipt "Added" + Name + GUID; input reset | PASS (static) |
| ACT-RENAME-START | btnPlayersRename (✎) | OnSelect | none (sets `varRenameId = ThisItem.Player`) | edit row visible with input prefilled from ThisItem.Name | PASS (static) |
| ACT-RENAME-SAVE | btnPlayersSaveRename (✓, disabled when blank) | OnSelect | `Patch(Players, ThisItem, {Name: newName})` same GUID; Email preserved by omission | row name updated, receipt "Renamed" + Name + same GUID | PASS (static) |
| ACT-RENAME-CANCEL | btnPlayersCancelRename | OnSelect | none (`varRenameId = Blank()`) | display row with original name | PASS (static) |
| ACT-DELETE-ASK | btnPlayersDelete (✕) | OnSelect | none (`varDeleteId = ThisItem.Player`) | confirm row "Delete <name>?" | PASS (static) |
| ACT-DELETE | btnPlayersConfirmDelete (Yes) | OnSelect | `Remove(Players, gone)` with snapshot `gone: ThisItem` | row absent, count −1, receipt "Deleted" + snapshot Name + GUID | PASS (static) |
| ACT-DELETE-CANCEL | btnPlayersCancelDelete | OnSelect | none | display row returns, count unchanged | PASS (static) |

## Functional Test Matrix (symbolic)
SCN-COUNT-LOAD, SCN-LIST-LOAD, SCN-ADD-OK, SCN-ADD-BLANK, SCN-RENAME-OK, SCN-RENAME-CANCEL, SCN-RENAME-BLANK,
SCN-DELETE-YES, SCN-DELETE-CANCEL — each traced against final formulas by the builder (see its Functional section);
all PASS statically.

## Layout evidence
Single AutoLayout root (`conPlayersRoot`, Width/Height = Parent) as the screen's only child; vertical scroll.
Row budgets fit at 640 and 320 logical width (largest: edit row 264 ≤ 280). Gallery TemplateSize 65 = 10 + 44 + 10 + 1.

## Runtime evidence
2026-10-11: first session's edits were lost (never saved); screen re-pushed from this folder, user saved and
published in Studio (lastpublishtime 2026-10-11T14:09:10Z), then play-tested count, list, add, rename (incl. cancel)
and delete — user reported all good.

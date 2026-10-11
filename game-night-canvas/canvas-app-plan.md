# Canvas App Plan

## Mode

CREATE

## Requirements

Create a new canvas app named "Game Night Players" (environment Keqing Li Dev, solution Board Game
Management). Phone layout. One screen that mirrors the user's code app: a label "We have N players."
(CountRows), a gallery listing player names from the Dataverse table Players (`kli_player`, column Name),
a text input + Add button (Patch, disabled when empty, reset after), a ✎ rename and ✕ delete (with
confirmation) per row. Simple, clean styling. Full contract:
`/home/keqing-li/Documents/mypower/game-night-canvas/canvas-app-requirements.md` (immutable).

Approved plan: one screen (Screen1); Dataverse `Players` is the only source of truth (durable, no
collections, no mock data); stable ID `kli_playerid` (display name `Player`, Guid); mutable field
`kli_name` (`Name`); `kli_email` (`Email`) read-only display; inline rename and inline delete confirmation
driven by two nullable GUID variables (`varRenameId`, `varDeleteId`).

## Original Request Capability Inventory

| Requirement key | Original request clause | Capability family | Required outcome / scope | Required action(s) | Observer(s) | Scenario(s) |
| --- | --- | --- | --- | --- | --- | --- |
| REQ-COUNT | a label "We have N players." (CountRows) | Analytics / KPI | Visible label "We have N players." with N = CountRows(Players); recalculates after add/delete | ACT-ADD, ACT-DELETE | `txtPlayersCount.Text: ="We have " & CountRows(Players) & " players."` | SCN-COUNT-LOAD, SCN-ADD-OK, SCN-DELETE-YES |
| REQ-LIST | a gallery listing player names from the Dataverse table Players (column Name) | Data exploration (read/sort) | Gallery bound to Players sorted by Name asc; each row shows full Name and Email when present | — (read) | `galPlayersList.Items: =SortByColumns(Players, "kli_name", SortOrder.Ascending)`; `txtPlayersRowName.Text: =ThisItem.Name`; `txtPlayersRowEmail.Text: =ThisItem.Email` | SCN-LIST-LOAD |
| REQ-ADD | a text input + Add button (Patch) | Data lifecycle (create) | `Patch(Players, Defaults(Players), {Name: Trim(input)})` creates a durable record; new name visible in list | ACT-ADD | `galPlayersList` row `txtPlayersRowName`; receipt `txtPlayersReceiptName`/`txtPlayersReceiptId` | SCN-ADD-OK |
| REQ-ADD-DISABLED | disabled when empty | Data lifecycle (validation) | Add disabled while `IsBlank(Trim(txtPlayersNewName.Value))` | ACT-ADD | `btnPlayersAdd.DisplayMode` | SCN-ADD-BLANK |
| REQ-ADD-RESET | reset after | Data lifecycle (create post-state) | Input empty after successful add | ACT-ADD | `txtPlayersNewName.Value` (Reset to Default `""`) | SCN-ADD-OK |
| REQ-RENAME | a ✎ rename per row | Data lifecycle (edit) | Row-level edit mode; `Patch(Players, ThisItem, {Name: new})` on the same `Player` ID; cancel writes nothing | ACT-RENAME-START, ACT-RENAME-SAVE, ACT-RENAME-CANCEL | `conPlayersEditRow.Visible`; `txtPlayersRowName`; receipt | SCN-RENAME-OK, SCN-RENAME-CANCEL, SCN-RENAME-BLANK |
| REQ-DELETE | ✕ delete (with confirmation if feasible) per row | Data lifecycle (delete) / Workflow (confirm) | ✕ shows inline confirmation on that row; Yes = `Remove(Players, ThisItem)`; Cancel writes nothing | ACT-DELETE-ASK, ACT-DELETE, ACT-DELETE-CANCEL | `conPlayersDeleteRow.Visible`; gallery absence; `txtPlayersCount`; receipt | SCN-DELETE-YES, SCN-DELETE-CANCEL |
| REQ-STYLE | Simple, clean styling; phone layout | App shell / presentation | Phone, sole AutoLayout scroll root, white background, purple accent RGBA(107, 63, 160, 1), grey dividers | — | `conPlayersRoot` viewport containment; shared Visual Contract | — (static QA: QACHK-ROOT-CONTAINMENT, QACHK-VISUAL-CONTRACT) |

## Requirement Coverage

| Requirement | Planned affordance | Fidelity |
| --- | --- | --- |
| Label "We have N players." | `txtPlayersCount` Text control, `="We have " & CountRows(Players) & " players."` (literal wording kept, including "1 players.") | Exact |
| Gallery of player names from Players | `galPlayersList` (Gallery Vertical) over `SortByColumns(Players, "kli_name", SortOrder.Ascending)`; row shows Name, Email under it when present | Exact |
| Text input | `txtPlayersNewName` (TextInput) with visible sibling label "New player name" | Exact |
| Add button (Patch, disabled when empty, reset after) | `btnPlayersAdd` "Add": Patch(Players, Defaults(Players), {Name: Trim(...)}); Disabled while blank/whitespace; `Reset(txtPlayersNewName)` on success | Exact |
| ✎ rename per row | `btnPlayersRename` "✎" → inline edit row with prefilled `txtPlayersRenameInput`, "✓" `btnPlayersSaveRename`, "✕" `btnPlayersCancelRename` | Exact |
| ✕ delete with confirmation per row | `btnPlayersDelete` "✕" → inline row "Delete <Name>?" with "Yes" `btnPlayersConfirmDelete` and "Cancel" `btnPlayersCancelDelete` | Approximation: Canvas has no `confirm()` dialog; inline row confirmation is the approved equivalent |
| Simple, clean styling, phone | White page, purple header bar + primary buttons, grey 1px row dividers, sole scrolling AutoLayout root | Exact |
| Long names | Row name is single-line; fits ≈55 characters at the 640px phone logical width | Approximation: names longer than ≈55 chars clip at the row edge (Dataverse text, no requested length limit) |

## Required Record Fields

| Field key | Screen | Record surface | Required field | Source field | Presentation requirement |
| --- | --- | --- | --- | --- | --- |
| players/row/name | Screen1 | `galPlayersList` row (display mode) | Player name (canonical identity) | `Name` (`kli_name`) | Full text, Size 16 Semibold, single line, always visible in display mode |
| players/row/email | Screen1 | `galPlayersList` row (display mode) | Email (secondary) | `Email` (`kli_email`) | Size 13 secondary color under the name; visible only when `!IsBlank(ThisItem.Email)` |
| players/row/delete-name | Screen1 | `galPlayersList` row (delete-confirm mode) | Name of player being deleted | `Name` | Prompt text `"Delete " & ThisItem.Name & "?"` |

## State-Driven Surface Visibility

| Surface key | Owner screen | Surface control | State predicate | Visible and hidden states |
| --- | --- | --- | --- | --- |
| row-display | Screen1 | `conPlayersDisplayRow` | `=!(!IsBlank(varRenameId) && varRenameId = ThisItem.Player) && !(!IsBlank(varDeleteId) && varDeleteId = ThisItem.Player)` | Visible for every row not in rename/delete mode; hidden on the one row being renamed or confirmed |
| row-rename | Screen1 | `conPlayersEditRow` | `=!IsBlank(varRenameId) && varRenameId = ThisItem.Player` | Visible only on the row whose ID is in `varRenameId`; hidden everywhere when blank |
| row-delete-confirm | Screen1 | `conPlayersDeleteRow` | `=!IsBlank(varDeleteId) && varDeleteId = ThisItem.Player` | Visible only on the row whose ID is in `varDeleteId`; hidden everywhere when blank |
| receipt | Screen1 | `conPlayersReceipt` | `=varReceiptVisible` | Visible after any successful add/rename/delete until Dismiss; hidden on screen entry and after Dismiss |

## Action Contracts

| Requested action | Preconditions | Entry point | Owner screen | Control and event | Source and stable ID | Transition and postcondition | Mutation write set | Receipt proof set | Observer and evidence |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| ACT-ADD — Add player | `!IsBlank(Trim(txtPlayersNewName.Value))`; else `btnPlayersAdd` Disabled | `txtPlayersNewName` + `btnPlayersAdd` "Add" (body, initial viewport) | Screen1 | `btnPlayersAdd.OnSelect` | Players; new `Player` GUID assigned by Dataverse, captured from Patch result | `Patch(Players, Defaults(Players), {Name: Trim(txtPlayersNewName.Value)})` → new row; on success `Set(varLastPlayer, created)`, `varLastAction="Added"`, `varReceiptVisible=true`, `Reset(txtPlayersNewName)` | Name | Action "Added", Player ID, Name | `conPlayersReceipt` (Visible=varReceiptVisible): `txtPlayersReceiptAction`, `txtPlayersReceiptName`, `txtPlayersReceiptId`; `galPlayersList` shows new row in sort position; `txtPlayersCount` +1; input empty |
| ACT-RENAME-START — enter rename | Row in display mode | `btnPlayersRename` "✎" on each display row | Screen1 | `btnPlayersRename.OnSelect` | Players; `ThisItem.Player` | `Set(varDeleteId, Blank()); Set(varRenameId, ThisItem.Player); Reset(txtPlayersRenameInput)`; no write | N/A | N/A | `conPlayersEditRow.Visible=!IsBlank(varRenameId) && varRenameId = ThisItem.Player`; `txtPlayersRenameInput.Value: =ThisItem.Name` prefilled |
| ACT-RENAME-SAVE — save rename | Row in rename mode; `!IsBlank(Trim(txtPlayersRenameInput.Value))` else `btnPlayersSaveRename` Disabled | "✓" `btnPlayersSaveRename` in edit row | Screen1 | `btnPlayersSaveRename.OnSelect` | Players; `ThisItem.Player` (same record passed to Patch) | `Patch(Players, ThisItem, {Name: Trim(txtPlayersRenameInput.Value)})`; on success capture `varLastPlayer`, `varLastAction="Renamed"`, `varReceiptVisible=true`, `Set(varRenameId, Blank())` | Name | Action "Renamed", Player ID (unchanged), new Name | Receipt controls; row returns to display mode showing new `ThisItem.Name`; count unchanged |
| ACT-RENAME-CANCEL — cancel rename | Row in rename mode | "✕" `btnPlayersCancelRename` in edit row | Screen1 | `btnPlayersCancelRename.OnSelect` | N/A (no write) | `Set(varRenameId, Blank()); Reset(txtPlayersRenameInput)`; Players unchanged | N/A | N/A | `conPlayersDisplayRow` visible again with original Name |
| ACT-DELETE-ASK — ask to delete | Row in display mode | "✕" `btnPlayersDelete` on each display row | Screen1 | `btnPlayersDelete.OnSelect` | Players; `ThisItem.Player` | `Set(varRenameId, Blank()); Set(varDeleteId, ThisItem.Player)`; no write | N/A | N/A | `conPlayersDeleteRow.Visible=!IsBlank(varDeleteId) && varDeleteId = ThisItem.Player` showing "Delete <Name>?" |
| ACT-DELETE — confirm delete | Row in delete-confirm mode | "Yes" `btnPlayersConfirmDelete` | Screen1 | `btnPlayersConfirmDelete.OnSelect` | Players; snapshot `gone = ThisItem` (its `Player` GUID) | `Remove(Players, gone)`; if `IsEmpty(Errors(Players))`: `Set(varLastPlayer, gone)`, `varLastAction="Deleted"`, `varReceiptVisible=true`, `Set(varDeleteId, Blank())`; else Notify error | Record existence (removed) | Action "Deleted", Player ID and Name from snapshot | Receipt controls; row absent from `galPlayersList`; `txtPlayersCount` −1 |
| ACT-DELETE-CANCEL — cancel delete | Row in delete-confirm mode | "Cancel" `btnPlayersCancelDelete` | Screen1 | `btnPlayersCancelDelete.OnSelect` | N/A (no write) | `Set(varDeleteId, Blank())`; Players unchanged | N/A | N/A | Row back in display mode; count unchanged |

Supporting (not a requested mutation): `btnPlayersDismissReceipt.OnSelect: =Set(varReceiptVisible, false)` hides the receipt.

## Mutation Lifecycle Evidence

| Action | Receipt binding | Canonical source and observer | Requested destination and observer | Stable ID continuity | Synchronization when sources differ | Destination focus |
| --- | --- | --- | --- | --- | --- | --- |
| ACT-ADD | `varLastPlayer` = Patch return record → `conPlayersReceipt` | Players; `CountRows(Players)` in `txtPlayersCount` | `galPlayersList` (`SortByColumns(Players, "kli_name", ...)`) row `txtPlayersRowName` | `varLastPlayer.Player` = new row's `ThisItem.Player` | N/A — gallery, count and Patch all use the live Players source (Patch refreshes the cached source) | N/A — receipt names the exact ID; list is sorted by name (no programmatic scroll) |
| ACT-RENAME-SAVE | `varLastPlayer` = Patch return record → receipt | Players; `ThisItem.Name` of row with same `Player` | Same row in `galPlayersList` (`txtPlayersRowName`) | `ThisItem.Player` → Patch target → `varLastPlayer.Player` | N/A — same live source | N/A — the edited row is the one the user acted on and exits edit mode in place |
| ACT-DELETE | `varLastPlayer` = pre-delete snapshot `gone` → receipt | Players; `CountRows(Players)` | `galPlayersList` (row absent) | `gone.Player` → Remove target → `varLastPlayer.Player` | N/A — same live source | N/A — deleted record has no destination row |

## Mutation Field Ledger

| Action | Field | Classification | Canonical pre-state or input | Write or preservation mechanism | Receipt/proof binding | Post-state observer |
| --- | --- | --- | --- | --- | --- | --- |
| ACT-ADD | Name | Changed | `Trim(txtPlayersNewName.Value)` | `Patch(Players, Defaults(Players), {Name: newName})` | `txtPlayersReceiptName.Text: ="Name: " & varLastPlayer.Name` | `txtPlayersRowName.Text: =ThisItem.Name` |
| ACT-ADD | Player (ID) | Changed (system-assigned) | Dataverse default | Returned by Patch | `txtPlayersReceiptId.Text: ="Player ID: " & Text(varLastPlayer.Player)` | Row exists in `galPlayersList` |
| ACT-RENAME-SAVE | Name | Changed | `Trim(txtPlayersRenameInput.Value)` | `Patch(Players, ThisItem, {Name: newName})` | `txtPlayersReceiptName.Text` | `txtPlayersRowName.Text: =ThisItem.Name` |
| ACT-RENAME-SAVE | Email | Preserved | Current Dataverse `Email` | Omitted from the partial Patch record | Row still shows the same `txtPlayersRowEmail` | `txtPlayersRowEmail.Text: =ThisItem.Email` |
| ACT-RENAME-SAVE | Player (ID) | Preserved | `ThisItem.Player` | Patch by record keeps primary key | `txtPlayersReceiptId.Text` equals the row's ID | Same row, same ID |
| ACT-DELETE | Record existence | Changed | Snapshot `gone` | `Remove(Players, gone)` | `txtPlayersReceiptAction` "Deleted" + `txtPlayersReceiptName` + `txtPlayersReceiptId` from snapshot | Row absent from `galPlayersList`; `CountRows(Players)` −1 |

## Functional Test Matrix

Live Dataverse data (no seed). Example Given state: Players contains `Alice` (alice@example.com) and `Bob` (no email); create missing rows with Add first.

| Scenario | Given | When | Then | Evidence surface | Boundary or negative case |
| --- | --- | --- | --- | --- | --- |
| SCN-COUNT-LOAD | Players has 2 rows (Alice, Bob) | Open app | Count reads source | `txtPlayersCount` = "We have 2 players." | 0 rows → "We have 0 players." and empty gallery |
| SCN-LIST-LOAD | Players has Bob, Alice | Open app | Rows listed Name ascending | `galPlayersList`: row 1 "Alice" with "alice@example.com" below; row 2 "Bob" with no email line | Email blank → `txtPlayersRowEmail` hidden |
| SCN-ADD-OK | 2 rows; input empty | Type "  Carol " in `txtPlayersNewName`; tap "Add" | Players gains row Name="Carol" with new GUID | Receipt: "Last change: Added", "Name: Carol", "Player ID: <guid>"; gallery order Alice, Bob, Carol; count "We have 3 players."; input empty | Patch failure → Notify error, input kept, no receipt |
| SCN-ADD-BLANK | Input empty | Leave empty, then type "   " (spaces) | No write | `btnPlayersAdd` Disabled in both states; count unchanged | Typing "D" enables Add immediately (TriggerOutput Keypress) |
| SCN-RENAME-OK | Row Bob (ID G_bob) in display mode | Tap "✎" on Bob → edit row with input prefilled "Bob"; change to "Bobby"; tap "✓" | Players row G_bob Name="Bobby"; Email unchanged | Receipt: "Last change: Renamed", "Name: Bobby", "Player ID: G_bob"; Bob's row back in display mode showing "Bobby"; count unchanged | Tapping ✎ on another row moves edit mode to that row (single-row rule) |
| SCN-RENAME-CANCEL | Bob row in rename mode, input changed to "Zed" | Tap "✕" (cancel) | No write; `varRenameId` blank | Row shows "Bob"; reopening ✎ shows "Bob" prefilled again | N/A |
| SCN-RENAME-BLANK | Bob row in rename mode | Clear input or enter spaces | No write possible | `btnPlayersSaveRename` Disabled | N/A |
| SCN-DELETE-YES | 3 rows incl. Carol (G_carol) | Tap "✕" on Carol → "Delete Carol?" Yes / Cancel; tap "Yes" | Row G_carol removed from Players | Receipt: "Last change: Deleted", "Name: Carol", "Player ID: G_carol"; Carol absent; count "We have 2 players." | Remove failure → Notify error, confirm row stays |
| SCN-DELETE-CANCEL | Alice row in delete-confirm mode | Tap "Cancel" | No write | Alice row back in display mode; count unchanged | Starting ✎ on any row clears pending delete |

## Data Entry Label Contracts

| Required input | Persistent visible label | Shared field region |
| --- | --- | --- |
| `txtPlayersNewName` | `txtPlayersAddLabel.Text: ="New player name"` | `conPlayersAddField` (vertical: label, input) |
| `txtPlayersRenameInput` | `txtPlayersRenameLabel.Text: ="Name"` | `conPlayersRenameField` (horizontal: label, input) inside `conPlayersEditRow` (shared surface predicate row-rename) |

## Layout Budget Contracts

Phone app, scale-to-fit: logical width 640 × height 1136 always; narrow sanity bound 320.

| Screen / container | Branch / screen-width source | Horizontal total-width arithmetic | Vertical height arithmetic | Protected controls |
| --- | --- | --- | --- | --- |
| Screen1 / conPlayersRoot | 640 logical (single branch) | N/A (vertical) | 64 header + body 758 (no receipt) / 888 (receipt) = 822 / 952 ≤ 1136; root scrolls anyway | All |
| Screen1 / conPlayersBody | 640; 320 bound | inner 640−32=608 (320→288) | 16+32+12+70+12+[118+12 if receipt]+600+16 = 758 / 888 | count, add row, receipt, gallery |
| Screen1 / conPlayersAddRow (horizontal) | 608 / 288 | field (min 120) + 8 + Add 88 = 216 ≤ 288 ≤ 608 | Height 70 = label 22 + 4 + input 44; Add 44 aligned End | `txtPlayersNewName`, `btnPlayersAdd` |
| Screen1 / conPlayersReceipt (vertical, fixed 118) | 608 / 288 | top row: action text fill + 8 + Dismiss 88 ≤ 584 | 12+44+4+22+4+20+12 = 118 | action, name, ID, Dismiss |
| Screen1 / gallery row shell (TemplateSize 65) | template ≈608 → shell inner 600 (320 → 280) | see three mode rows | 10 + 44 + 10 + 1 = 65 | ✎, ✕, ✓, cancel, Yes, Cancel |
| Screen1 / conPlayersDisplayRow | 600 / 280 | info fill (min 0) + 8 + 44 + 8 + 44 = 104 → info 496 / 176 | 44 = name 24 + email 20 | ✎ `btnPlayersRename`, ✕ `btnPlayersDelete` |
| Screen1 / conPlayersEditRow | 600 / 280 | field (label 52 + 8 + input min 100 = 160) + 8 + 44 + 8 + 44 = 264 ≤ 280 | 44 | `txtPlayersRenameInput`, ✓, ✕ |
| Screen1 / conPlayersDeleteRow | 600 / 280 | prompt fill (min 80) + 8 + Yes 64 + 8 + Cancel 80 = 240 ≤ 280 | 44 | Yes, Cancel |

## Viewport Containment Contracts

| Screen | Root control | Layout variant | Width binding | Height binding | Overflow policy |
| --- | --- | --- | --- | --- | --- |
| Screen1 | conPlayersRoot (sole top-level child) | AutoLayout | `conPlayersRoot.Width: =Parent.Width` | `conPlayersRoot.Height: =Parent.Height` | `LayoutOverflowY: =LayoutOverflow.Scroll`; gallery has its own bounded 600px viewport |

## Working Directory

/home/keqing-li/Documents/mypower/game-night-canvas

## Discovery Summary

- Controls: GroupContainer (AutoLayout), Gallery (Vertical), Text, TextInput, Button (FluentV9) — definitions copied into the screen brief
- Data sources: Players (CdsNative, Writable, Delegatable) — `kli_name` Name, `kli_email` Email, `kli_playerid` Player (Guid)
- Connectors: none

## Dispatch

| Action | Screen | Target File | YAML Key | Name Prefix | Screen Brief |
| --- | --- | --- | --- | --- | --- |
| Create | Players (landing) | `/home/keqing-li/Documents/mypower/game-night-canvas/Screen1.pa.yaml` | Screen1 | Players | `/home/keqing-li/Documents/mypower/game-night-canvas/Screen1.screen-plan.md` |

## Editor State Changes

None (ScreensOrder stays `[Screen1]`; no component definitions).

## Orchestrator Notes

- `App.pa.yaml` written: `StartScreen: =Screen1`, `Theme: =PowerAppsTheme` (no OnStart, no collections).
- If `SortByColumns(Players, "kli_name", SortOrder.Ascending)` fails to compile (Power Fx 1.0 identifier
  column names), replace it with the equivalent `Sort(Players, Name, SortOrder.Ascending)`.

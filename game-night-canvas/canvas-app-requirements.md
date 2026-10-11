# Canvas App Original Request Contract

Contract version: 1
Target device: Phone

## Original Request

Create a new canvas app named "Game Night Players" in environment Keqing Li Dev, solution Board Game
Management. Phone layout. One screen that mirrors the user's code app: a label "We have N players."
(CountRows), a gallery listing player names from the Dataverse table kli_player (display name Players,
column Name), a text input + Add button (Patch, disabled when empty, reset after), a ✎ rename and ✕ delete
(with confirmation if feasible) per row. Simple, clean styling.

Approved clarifications (plan approved by the user):
- Data source is the existing Dataverse table **Players** (logical `kli_player`; columns `kli_name`
  "Name" String, `kli_email` "Email" String, stable ID `kli_playerid` "Player" Guid). Same rows as the
  user's code app; changes are durable in Dataverse.
- List sorted by Name ascending. Email shown read-only under the name when present.
- Add writes Name only; Add is disabled when the input is blank or whitespace-only; the input resets
  after a successful add.
- Rename is inline on the row: ✎ switches that one row into edit mode with a prefilled text input,
  ✓ saves via Patch on that row's record (blank names rejected / save disabled), ✕-cancel leaves edit mode
  without writing.
- Delete asks for confirmation on the row (Delete? Yes / Cancel); Yes removes the record, Cancel writes
  nothing. Canvas has no confirm() dialog, so an inline confirmation is the approved equivalent.
- Look: white background, purple accent RGBA(107, 63, 160, 1) for header and primary buttons, grey row
  dividers, readable sizes.

## Capability Inventory

| Requirement key | Original request clause | Capability family | Required outcome / scope | Required action(s) | Scenario(s) | Specialized contract mappings |
| --------------- | ----------------------- | ----------------- | ------------------------ | ------------------ | ----------- | ----------------------------- |
| REQ-COUNT | a label "We have N players." (CountRows) | Aggregation / KPI | Visible label reads "We have N players." where N = CountRows(Players) and updates after add/delete | ACT-ADD, ACT-DELETE | SCN-COUNT-LOAD, SCN-ADD-OK, SCN-DELETE-YES | N/A |
| REQ-LIST | a gallery listing player names from the Dataverse table Players (column Name) | Browse / list | Gallery bound to Players sorted by Name asc; each row shows full Name (and Email when present) | — (read) | SCN-LIST-LOAD | N/A |
| REQ-ADD | a text input + Add button (Patch) | Create | Patch(Players, Defaults(Players), {Name: trimmed input}) creates a durable record; new name visible in list | ACT-ADD | SCN-ADD-OK | N/A |
| REQ-ADD-DISABLED | disabled when empty | Validation | Add DisplayMode Disabled when IsBlank(Trim(input)) | ACT-ADD | SCN-ADD-BLANK | N/A |
| REQ-ADD-RESET | reset after | Create (post-state) | Input value empty after successful add | ACT-ADD | SCN-ADD-OK | N/A |
| REQ-RENAME | a ✎ rename per row | Edit | Row-level edit mode; Patch(Players, ThisItem, {Name: new}) updates the same record ID; cancel writes nothing | ACT-RENAME-START, ACT-RENAME-SAVE, ACT-RENAME-CANCEL | SCN-RENAME-OK, SCN-RENAME-CANCEL, SCN-RENAME-BLANK | N/A |
| REQ-DELETE | ✕ delete (with confirmation if feasible) per row | Delete | ✕ shows inline confirmation on that row; Yes = Remove(Players, ThisItem); Cancel writes nothing | ACT-DELETE-ASK, ACT-DELETE, ACT-DELETE-CANCEL | SCN-DELETE-YES, SCN-DELETE-CANCEL | N/A |
| REQ-STYLE | Simple, clean styling; phone layout | Presentation | Phone, responsive AutoLayout root, white background, purple accent RGBA(107, 63, 160, 1) | — | — | Viewport containment = Screen1 root |

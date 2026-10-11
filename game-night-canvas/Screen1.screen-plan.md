# Screen Plan: Players (landing)

## Assignment

- Action: Create
- Target file: `/home/keqing-li/Documents/mypower/game-night-canvas/Screen1.pa.yaml` (replace the scaffold wholesale)
- YAML key: Screen1
- Control name prefix: Players

## Specification

- Purpose: list, count, add, rename and delete players stored in the Dataverse table `Players`.
- Screen properties: `Fill: =RGBA(255, 255, 255, 1)`, `LoadingSpinnerColor: =RGBA(107, 63, 160, 1)`, and

  ```yaml
  OnVisible: |-
    =Set(varRenameId, Blank());
    Set(varDeleteId, Blank());
    Set(varLastAction, "");
    Set(varReceiptVisible, false)
  ```

- Breakpoint source: none. Phone scale-to-fit logical width is 640; every row is budgeted to also fit 320,
  so no width formulas are used.
- Control tree (screen `Children:` contains ONLY `conPlayersRoot`; `[V]` vertical / `[H]` horizontal AutoLayout):

```text
conPlayersRoot [V] Width =Parent.Width, Height =Parent.Height, MinW/MinH 0, LayoutOverflowY Scroll, gap 0, Fill white
├─ conPlayersHeader [V] FillPortions 0, Height 64, Fill accent, PaddingLeft/Right 16, JustifyContent Center, AlignItems Stretch
│   └─ txtPlayersTitle  Text "Game Night Players"  Size 22 Bold, white, Height 32, Wrap false
└─ conPlayersBody [V] FillPortions 0, Height (formula below), Padding 16 all sides, gap 12, AlignItems Stretch, Fill white
    ├─ txtPlayersCount  Text, Height 32, Size 18 Semibold, Wrap false
    ├─ conPlayersAddRow [H] FillPortions 0, Height 70, gap 8, AlignItems End
    │   ├─ conPlayersAddField [V] FillPortions 1, LayoutMinWidth 120, gap 4, AlignItems Stretch, AlignInContainer Stretch
    │   │   ├─ txtPlayersAddLabel  "New player name"  Height 22, Size 14 Semibold, FillPortions 0
    │   │   └─ txtPlayersNewName   TextInput, Height 44, FillPortions 0, LayoutMinWidth 0
    │   └─ btnPlayersAdd  "Add"  Width 88, Height 44, FillPortions 0, AlignInContainer End
    ├─ conPlayersReceipt [V] Visible =varReceiptVisible, FillPortions 0, Height 118, Padding 12, gap 4, radius 8, Fill tint, AlignItems Stretch
    │   ├─ conPlayersReceiptTop [H] FillPortions 0, Height 44, gap 8, AlignItems Center
    │   │   ├─ txtPlayersReceiptAction  FillPortions 1, LayoutMinWidth 0, Height 22, Size 14 Semibold, Wrap false
    │   │   └─ btnPlayersDismissReceipt "Dismiss" Width 88, Height 44, FillPortions 0
    │   ├─ txtPlayersReceiptName  Height 22, Size 14 Regular, Wrap false, FillPortions 0
    │   └─ txtPlayersReceiptId    Height 20, Size 12 secondary, Wrap false, FillPortions 0
    └─ galPlayersList  Gallery Vertical, FillPortions 0, Height 600, TemplateSize 65, TemplatePadding 0
        └─ conPlayersRowShell [V] Width =Parent.TemplateWidth, Height =Parent.TemplateHeight,
             PaddingTop 10, PaddingBottom 0, PaddingLeft 4, PaddingRight 4, gap 10, AlignItems Stretch
            ├─ conPlayersDisplayRow [H] Height 44, gap 8, AlignItems Center, FillPortions 0   (Visible: row-display)
            │   ├─ conPlayersRowInfo [V] FillPortions 1, MinW 0, JustifyContent Center, AlignItems Stretch, gap 0, AlignInContainer Stretch
            │   │   ├─ txtPlayersRowName   Height 24, Size 16 Semibold, Wrap false, FillPortions 0
            │   │   └─ txtPlayersRowEmail  Height 20, Size 13 secondary, Wrap false, FillPortions 0, Visible =!IsBlank(ThisItem.Email)
            │   ├─ btnPlayersRename  "✎"  44×44, FillPortions 0, AlignInContainer Center
            │   └─ btnPlayersDelete  "✕"  44×44, FillPortions 0, AlignInContainer Center
            ├─ conPlayersEditRow [H] Height 44, gap 8, AlignItems Center, FillPortions 0   (Visible: row-rename)
            │   ├─ conPlayersRenameField [H] FillPortions 1, LayoutMinWidth 160, gap 8, AlignItems Center, AlignInContainer Stretch
            │   │   ├─ txtPlayersRenameLabel  "Name" Width 52, Height 24, Size 14 Semibold, Wrap false, FillPortions 0
            │   │   └─ txtPlayersRenameInput  TextInput FillPortions 1, LayoutMinWidth 100, Height 40, AlignInContainer Center
            │   ├─ btnPlayersSaveRename    "✓" 44×44 primary, FillPortions 0
            │   └─ btnPlayersCancelRename  "✕" 44×44 subtle, FillPortions 0
            ├─ conPlayersDeleteRow [H] Height 44, gap 8, AlignItems Center, FillPortions 0   (Visible: row-delete-confirm)
            │   ├─ txtPlayersDeletePrompt  FillPortions 1, LayoutMinWidth 80, Height 24, Size 14 Semibold, destructive color, Wrap false
            │   ├─ btnPlayersConfirmDelete "Yes" Width 64, Height 44, FillPortions 0
            │   └─ btnPlayersCancelDelete  "Cancel" Width 80, Height 44, FillPortions 0
            └─ conPlayersRowDivider [V] Height 1, FillPortions 0, Fill RGBA(224, 224, 224, 1), no children
```

- All GroupContainers: `Variant: AutoLayout`, `LayoutMinWidth: =0` (except where a larger min is listed),
  `LayoutMinHeight: =0`, `DropShadow: =DropShadow.None`, radius 0 (receipt 8). Children of a `[V]` parent
  that are text/inputs/sections: `AlignInContainer: =AlignInContainer.Stretch`. Children of `[H]` rows:
  `AlignInContainer: =AlignInContainer.Center` unless listed otherwise.
- Every Text control: `PaddingTop/Bottom/Left/Right: =0`, `VerticalAlign: =VerticalAlign.Middle`,
  `Align: ='TextCanvas.Align'.Start`, explicit `FontColor` (all surfaces set a Fill).
- Gallery: `Items: =SortByColumns(Players, "kli_name", SortOrder.Ascending)`, `Selectable: =false`,
  `ShowScrollbar: =true`, `Fill: =RGBA(255, 255, 255, 1)`, `BorderThickness: =0`, `LayoutMinWidth: =0`,
  `LayoutMinHeight: =0`, `AlignInContainer: =AlignInContainer.Stretch`, `AccessibleLabel: ="Players list"`,
  `TabIndex: =0`. Do NOT set Gallery `DisplayMode` (row buttons must stay interactive).
- `conPlayersBody.Height` (literal paddings/gaps; receipt hidden removes its slot and one gap):

  ```yaml
  Height: =16 + 32 + 12 + 70 + 12 + If(varReceiptVisible, 118 + 12, 0) + 600 + 16
  ```

- Numeric layout budgets (640 logical; 320 bound):
  - Root: header 64 + body 758 / 888 = 822 / 952 ≤ 1136; root scrolls regardless.
  - Body inner width 608 (288). Add row: field min 120 + 8 + 88 = 216 ≤ 288. Height 70 = 22 + 4 + 44.
  - Receipt: 12 + 44 + 4 + 22 + 4 + 20 + 12 = 118. Top row: action fill + 8 + 88 ≤ 584.
  - Row template 65 = PaddingTop 10 + visible mode row 44 + gap 10 + divider 1 (exactly one mode row is visible).
  - Shell inner width 600 (280 at 320). Display row: info + 8 + 44 + 8 + 44 → info 496 (176). Edit row:
    rename field (52 + 8 + 100 = 160) + 8 + 44 + 8 + 44 = 264 ≤ 280. Delete row: 80 + 8 + 64 + 8 + 80 = 240 ≤ 280.
  - Display row height 44 = name 24 + email 20.
- Text fit: Title "Game Night Players" at 22 Bold ≈ 210px ≤ 608. Count "We have 9999 players." ≈ 190px.
  Row name single line ≈ 55 chars at 496px (approximation for longer names). Receipt ID text
  "Player ID: " + 36-char GUID at Size 12 ≈ 300px ≤ 484. Delete prompt "Delete <name>?" single line, 440px
  at 640. Button labels: "Add", "Yes", "Cancel" (≈50px at 14 → Width 80), "Dismiss" (Width 88), glyphs ✎ ✕ ✓.
- Visual hierarchy: purple header title → count line (focal) → add field → receipt → list.

## Required Record Fields

| Field key | Record surface | Required field | Source field | Bound control | Exact formula | Placement and visibility |
| --- | --- | --- | --- | --- | --- | --- |
| players/row/name | gallery row, display mode | Player name | Name | txtPlayersRowName | `Text: =ThisItem.Name` | First line of `conPlayersRowInfo`, Height 24, always visible in display mode |
| players/row/email | gallery row, display mode | Email | Email | txtPlayersRowEmail | `Text: =ThisItem.Email` | Second line, Height 20, `Visible: =!IsBlank(ThisItem.Email)` |
| players/row/delete-name | gallery row, delete-confirm mode | Name being deleted | Name | txtPlayersDeletePrompt | `Text: ="Delete " & ThisItem.Name & "?"` | Left of Yes/Cancel in `conPlayersDeleteRow` |

## State-Driven Surface Visibility

| Surface key | Surface control | State predicate | Visible and hidden states |
| --- | --- | --- | --- |
| row-display | conPlayersDisplayRow | `=!(!IsBlank(varRenameId) && varRenameId = ThisItem.Player) && !(!IsBlank(varDeleteId) && varDeleteId = ThisItem.Player)` | Every row not being renamed/confirmed |
| row-rename | conPlayersEditRow | `=!IsBlank(varRenameId) && varRenameId = ThisItem.Player` | Only the row being renamed |
| row-delete-confirm | conPlayersDeleteRow | `=!IsBlank(varDeleteId) && varDeleteId = ThisItem.Player` | Only the row awaiting confirmation |
| receipt | conPlayersReceipt | `=varReceiptVisible` | After a successful mutation until Dismiss |

## Required Actions

All handlers below are exact; write each as a `|-` block (they contain record literals / `: `).

**Count label** — `txtPlayersCount.Text: ="We have " & CountRows(Players) & " players."`

**ACT-ADD** — Precondition `!IsBlank(Trim(txtPlayersNewName.Value))`. Write set: Name. Proof set: action, Player ID, Name.

```yaml
txtPlayersNewName:   # TextInput
  Value: =""
  Placeholder: ="e.g. Alice"
  TriggerOutput: ='TextInputCanvas.TriggerOutput'.Keypress   # so Add enables while typing
  AccessibleLabel: ="New player name"
btnPlayersAdd:
  DisplayMode: =If(IsBlank(Trim(txtPlayersNewName.Value)), DisplayMode.Disabled, DisplayMode.Edit)
  AccessibleLabel: ="Add player"
  OnSelect: |-
    =With(
      {newName: Trim(txtPlayersNewName.Value)},
      If(
        !IsBlank(newName),
        With(
          {created: Patch(Players, Defaults(Players), {Name: newName})},
          If(
            IsBlank(created),
            Notify("Could not add the player.", NotificationType.Error),
            Set(varLastPlayer, created);
            Set(varLastAction, "Added");
            Set(varReceiptVisible, true);
            Reset(txtPlayersNewName)
          )
        )
      )
    )
```

**ACT-RENAME-START** — `btnPlayersRename` (Text "✎", `AccessibleLabel: ="Rename " & ThisItem.Name`):

```yaml
OnSelect: |-
  =Set(varDeleteId, Blank());
  Set(varRenameId, ThisItem.Player);
  Reset(txtPlayersRenameInput)
```

`txtPlayersRenameInput`: `Value: =ThisItem.Name` (prefill), `TriggerOutput: ='TextInputCanvas.TriggerOutput'.Keypress`,
`AccessibleLabel: ="New name for " & ThisItem.Name`.

**ACT-RENAME-SAVE** — `btnPlayersSaveRename` (Text "✓", `AccessibleLabel: ="Save new name"`). Write set: Name.
Proof set: action, Player ID, new Name. Email preserved (omitted from Patch).

```yaml
DisplayMode: =If(IsBlank(Trim(txtPlayersRenameInput.Value)), DisplayMode.Disabled, DisplayMode.Edit)
OnSelect: |-
  =With(
    {newName: Trim(txtPlayersRenameInput.Value)},
    If(
      !IsBlank(newName),
      With(
        {updated: Patch(Players, ThisItem, {Name: newName})},
        If(
          IsBlank(updated),
          Notify("Could not rename the player.", NotificationType.Error),
          Set(varLastPlayer, updated);
          Set(varLastAction, "Renamed");
          Set(varReceiptVisible, true);
          Set(varRenameId, Blank())
        )
      )
    )
  )
```

**ACT-RENAME-CANCEL** — `btnPlayersCancelRename` (Text "✕", `AccessibleLabel: ="Cancel rename"`), no write:
`OnSelect: =Set(varRenameId, Blank()); Reset(txtPlayersRenameInput)`

**ACT-DELETE-ASK** — `btnPlayersDelete` (Text "✕", FontColor destructive, `AccessibleLabel: ="Delete " & ThisItem.Name`), no write:
`OnSelect: =Set(varRenameId, Blank()); Set(varDeleteId, ThisItem.Player)`

**ACT-DELETE** — `btnPlayersConfirmDelete` (Text "Yes", `AccessibleLabel: ="Yes, delete " & ThisItem.Name`).
Write set: record existence. Proof set: action, Player ID and Name from snapshot.

```yaml
OnSelect: |-
  =With(
    {gone: ThisItem},
    Remove(Players, gone);
    If(
      IsEmpty(Errors(Players)),
      Set(varLastPlayer, gone);
      Set(varLastAction, "Deleted");
      Set(varReceiptVisible, true);
      Set(varDeleteId, Blank()),
      Notify("Could not delete the player.", NotificationType.Error)
    )
  )
```

**ACT-DELETE-CANCEL** — `btnPlayersCancelDelete` (Text "Cancel", `AccessibleLabel: ="Cancel delete"`), no write:
`OnSelect: =Set(varDeleteId, Blank())`

**Receipt** (inside `conPlayersReceipt`, `Visible: =varReceiptVisible`, Fill RGBA(243, 238, 250, 1)):

```yaml
txtPlayersReceiptAction.Text: '="Last change: " & varLastAction'
txtPlayersReceiptName.Text:   '="Name: " & varLastPlayer.Name'
txtPlayersReceiptId.Text:     '="Player ID: " & Text(varLastPlayer.Player)'
btnPlayersDismissReceipt:  Text ="Dismiss", OnSelect =Set(varReceiptVisible, false), AccessibleLabel ="Dismiss last change"
```

(The `.Text:` keys above are shorthand: in YAML each is `Text: '="Last change: " & varLastAction'` on that control.)

## Data Entry Label Contracts

| Required input | Persistent visible label | Shared field region |
| --- | --- | --- |
| txtPlayersNewName | `txtPlayersAddLabel.Text: ="New player name"` | conPlayersAddField |
| txtPlayersRenameInput | `txtPlayersRenameLabel.Text: ="Name"` | conPlayersRenameField (inside surface conPlayersEditRow) |

## Mutation Lifecycle Evidence

| Action | Receipt binding | Canonical source and observer | Requested destination and observer | Stable ID continuity | Synchronization | Destination focus |
| --- | --- | --- | --- | --- | --- | --- |
| ACT-ADD | `varLastPlayer` = Patch result → conPlayersReceipt | Players; `txtPlayersCount` | galPlayersList → `txtPlayersRowName` | `varLastPlayer.Player` = new row ID | N/A — same live source | N/A — receipt shows ID |
| ACT-RENAME-SAVE | `varLastPlayer` = Patch result | Players; row `ThisItem.Name` | same row `txtPlayersRowName` | `ThisItem.Player` → Patch → receipt | N/A | N/A — edited row in place |
| ACT-DELETE | `varLastPlayer` = snapshot `gone` | Players; `txtPlayersCount` | galPlayersList (row absent) | `gone.Player` → Remove → receipt | N/A | N/A |

## Mutation Field Ledger

| Action | Field | Classification | Input / pre-state | Write / preservation | Receipt binding | Post-state observer |
| --- | --- | --- | --- | --- | --- | --- |
| ACT-ADD | Name | Changed | `Trim(txtPlayersNewName.Value)` | Patch `{Name: newName}` | txtPlayersReceiptName | txtPlayersRowName |
| ACT-ADD | Player | Changed (system) | Dataverse | Patch result | txtPlayersReceiptId | row present |
| ACT-RENAME-SAVE | Name | Changed | `Trim(txtPlayersRenameInput.Value)` | Patch(Players, ThisItem, `{Name: newName}`) | txtPlayersReceiptName | txtPlayersRowName |
| ACT-RENAME-SAVE | Email | Preserved | Dataverse Email | omitted from Patch | row email unchanged | txtPlayersRowEmail |
| ACT-RENAME-SAVE | Player | Preserved | ThisItem.Player | Patch by record | txtPlayersReceiptId | same row |
| ACT-DELETE | existence | Changed | snapshot `gone` | Remove(Players, gone) | action/name/ID from snapshot | row absent; count −1 |

## Functional Test Scenarios

| Scenario | Given | When | Then | Evidence surface | Boundary or negative case |
| --- | --- | --- | --- | --- | --- |
| SCN-COUNT-LOAD | Players = Alice, Bob | Open app | count reads source | txtPlayersCount "We have 2 players." | 0 rows → "We have 0 players." |
| SCN-LIST-LOAD | Players = Bob, Alice(alice@example.com) | Open app | sorted asc | rows "Alice"+email, "Bob" (email line hidden) | blank email hidden |
| SCN-ADD-OK | 2 rows, input empty | type "  Carol ", tap Add | new row Name "Carol" | receipt Added / Carol / GUID; list Alice, Bob, Carol; "We have 3 players."; input empty | Patch failure → Notify, no receipt, input kept |
| SCN-ADD-BLANK | input empty | leave empty; type "   " | no write | btnPlayersAdd Disabled | typing "D" enables Add (Keypress) |
| SCN-RENAME-OK | Bob (G_bob) | ✎ on Bob (prefilled "Bob"), type "Bobby", ✓ | G_bob Name "Bobby", Email unchanged | receipt Renamed / Bobby / G_bob; row "Bobby" in display mode | ✎ on another row moves edit mode |
| SCN-RENAME-CANCEL | Bob in rename mode, input "Zed" | tap ✕ | no write | row shows "Bob"; ✎ again shows "Bob" | N/A |
| SCN-RENAME-BLANK | Bob in rename mode | clear input / spaces | no write | ✓ Disabled | N/A |
| SCN-DELETE-YES | Carol (G_carol), 3 rows | ✕ on Carol → "Delete Carol?" → Yes | G_carol removed | receipt Deleted / Carol / G_carol; row gone; "We have 2 players." | Remove error → Notify, confirm row stays |
| SCN-DELETE-CANCEL | Alice in confirm mode | Cancel | no write | Alice display row back; count unchanged | ✎ clears pending delete |

## Relevant Data Source Schemas

`Players` (Dataverse, CdsNative, Writable, Delegatable) — use display names in formulas:

| Display name | Logical | Type | Use |
| --- | --- | --- | --- |
| Name | kli_name | String | displayed, written by Add/Rename, sort key (`"kli_name"` in SortByColumns) |
| Email | kli_email | String | displayed read-only |
| Player | kli_playerid | Guid | stable ID for mode variables and receipt |

## Required Variants

- GroupContainer → `Variant: AutoLayout` (every container)
- Gallery → `Variant: Vertical`

## Control Definitions

Creation keywords (verbatim): `Control: GroupContainer` + `Variant: AutoLayout`; `Control: Gallery` + `Variant: Vertical`;
`Control: Text`; `Control: TextInput`; `Control: Button`. No `@version` suffixes.

**GroupContainer (AutoLayout)** — inputs: BorderColor, BorderStyle, BorderThickness, ContentLanguage, DropShadow,
EnableChildFocus, Fill, Height, RadiusBottomLeft, RadiusBottomRight, RadiusTopLeft, RadiusTopRight, Visible, Width, X, Y,
LayoutAlignItems, LayoutDirection (required), LayoutGap, LayoutJustifyContent, LayoutOverflowX, LayoutOverflowY, LayoutWrap,
PaddingBottom, PaddingLeft, PaddingRight, PaddingTop; as AutoLayout child: AlignInContainer, FillPortions, LayoutMaxHeight,
LayoutMaxWidth, LayoutMinHeight, LayoutMinWidth.
Literals: `=LayoutDirection.Vertical` / `=LayoutDirection.Horizontal`; `=LayoutAlignItems.Stretch|Center|End`;
`=LayoutJustifyContent.Center`; `=LayoutOverflow.Scroll`; `=DropShadow.None`; `=AlignInContainer.Stretch|Center|End`.

**Gallery (Vertical)** — inputs: BorderStyle, ContentLanguage, Default, DisplayMode, Fill, FocusedBorderColor,
FocusedBorderThickness, LoadingSpinnerColor, NavigationStep, Selectable, ShowNavigation, TabIndex, Transition, Visible,
AccessibleLabel, BorderColor, BorderThickness, DelayItemLoading, Height, Items, LoadingSpinner, ShowScrollbar,
TemplatePadding, TemplateSize, Width, WrapCount, X, Y; child: AlignInContainer, FillPortions, LayoutMaxHeight,
LayoutMaxWidth, LayoutMinHeight, LayoutMinWidth. Outputs used: TemplateWidth, TemplateHeight (shell only).
Literal (optional): `LoadingSpinnerColor: =RGBA(107, 63, 160, 1)`.

**Text** — inputs: Align, AutoHeight, BorderColor, BorderRadius (+corner variants), BorderStyle, BorderThickness,
ContentLanguage, DisplayMode, Fill, Font, FontColor, FontItalic, FontStrikethrough, FontUnderline, Height, PaddingBottom,
PaddingLeft, PaddingRight, PaddingTop, Size, Text, VerticalAlign, Visible, Weight, Width, Wrap, X, Y; child:
AlignInContainer, FillPortions, LayoutMaxHeight, LayoutMaxWidth, LayoutMinHeight, LayoutMinWidth.
No `AccessibleLabel`, `Color`, or `FontWeight` on Text — use `FontColor`, `Size`, `Weight`.
Literals: `Weight: ='TextCanvas.Weight'.Bold|Semibold|Regular`; `Align: ='TextCanvas.Align'.Start`;
`VerticalAlign: =VerticalAlign.Middle`.

**TextInput** — inputs: AccessibleLabel, Align, Appearance, BasePaletteColor, BorderColor, BorderRadius, BorderStyle,
BorderThickness, ContentLanguage, DisplayMode, Fill, Font, FontColor, FontItalic, FontSize, FontStrikethrough,
FontUnderline, FontWeight, Height, MaxLength, Mode, OnChange, PaddingBottom, PaddingLeft, PaddingRight, PaddingTop,
Placeholder, Required, TriggerOutput, Type, ValidationState, Value, Visible, Width, X, Y; child: AlignInContainer,
FillPortions, LayoutMaxHeight, LayoutMaxWidth, LayoutMinHeight, LayoutMinWidth (default 320 — always override). Output: Value.
Literals: `Appearance: ='TextInputCanvas.Appearance'.Outline`; `TriggerOutput: ='TextInputCanvas.TriggerOutput'.Keypress`;
`Mode: ='TextInputCanvas.Mode'.SingleLine`; `FontSize: =14`; `FontColor: =RGBA(36, 36, 36, 1)`;
`BasePaletteColor: =RGBA(107, 63, 160, 1)`.

**Button** — inputs: AcceptsFocus, AccessibleLabel, Align, Appearance, BasePaletteColor, BorderColor, BorderRadius
(+corners), BorderStyle, BorderThickness, ContentLanguage, DisplayMode, Font, FontColor, FontItalic, FontSize,
FontStrikethrough, FontUnderline, FontWeight, Height, Icon, IconRotation, IconStyle, Layout, OnSelect, PaddingBottom,
PaddingLeft, PaddingRight, PaddingTop, Text, VerticalAlign, Visible, Width, X, Y; child: AlignInContainer, FillPortions,
LayoutMaxHeight, LayoutMaxWidth, LayoutMinHeight, LayoutMinWidth (default 96 — set `=0` on 44/64/80/88px buttons).
Literals: `Appearance: ='ButtonCanvas.Appearance'.Primary|Subtle|Outline`; `FontWeight: =FontWeight.Semibold`;
`DisplayMode: =DisplayMode.Disabled|Edit`; `Layout: ='ButtonCanvas.Layout'.TextOnly`; `BorderRadius: =6`.
Per-button styling (from shared Visual Contract): Add & ✓ = Primary + accent BasePaletteColor + white FontColor;
✎ & ✕-cancel = Subtle + FontColor RGBA(36, 36, 36, 1), FontSize 18; ✕-delete = Subtle + FontColor RGBA(196, 43, 28, 1),
FontSize 18; Yes = Primary + BasePaletteColor RGBA(196, 43, 28, 1) + white; Cancel = Outline + FontColor RGBA(36, 36, 36, 1);
Dismiss = Subtle + FontColor RGBA(107, 63, 160, 1).

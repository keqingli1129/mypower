# Canvas App Shared Plan

## Aesthetic Direction

- Palette: clean light — white page, one purple accent for the header bar and primary actions, grey
  hairline dividers, red only for destructive confirmation.
- Primary background (screen, body, gallery, rows): RGBA(255, 255, 255, 1)
- Accent (header Fill, primary button BasePaletteColor, Dismiss text): RGBA(107, 63, 160, 1)
- Accent tint (receipt surface Fill): RGBA(243, 238, 250, 1)
- Text primary: RGBA(36, 36, 36, 1)
- Text secondary: RGBA(97, 97, 97, 1)
- Divider: RGBA(224, 224, 224, 1)
- Destructive: RGBA(196, 43, 28, 1)
- Text on accent: RGBA(255, 255, 255, 1)
- Typography: default font (do not set `Font`); sizes below.

## Visual Contract

- Type roles (Text control: `Size`, `Weight`, `FontColor`):
  - Page title: Size 22, `'TextCanvas.Weight'.Bold`, white on purple header
  - Count / focal line: Size 18, `'TextCanvas.Weight'.Semibold`, text primary
  - Row name: Size 16, `'TextCanvas.Weight'.Semibold`, text primary
  - Field label / receipt action: Size 14, `'TextCanvas.Weight'.Semibold`, text primary
  - Body / receipt name: Size 14, `'TextCanvas.Weight'.Regular`, text primary
  - Caption (email, receipt ID): Size 13 (email) / 12 (ID), `'TextCanvas.Weight'.Regular`, text secondary
- Spacing scale: 4, 8, 10, 12, 16. Page padding 16; section gap 12; row control gap 8.
- Surfaces: every GroupContainer `DropShadow: =DropShadow.None`. Layout containers radius 0
  (`RadiusTopLeft/TopRight/BottomLeft/BottomRight: =0`); receipt radius 8. Row divider = 1px
  GroupContainer with divider Fill. No borders elsewhere.
- Actions (Button, FontSize 14 unless noted, Height 44, all `BorderRadius: =6`):
  - Primary (Add, ✓ save): `Appearance: ='ButtonCanvas.Appearance'.Primary`,
    `BasePaletteColor: =RGBA(107, 63, 160, 1)`, `FontColor: =RGBA(255, 255, 255, 1)`
  - Row icon actions (✎, ✕ delete, ✕ cancel-rename): `Appearance: ='ButtonCanvas.Appearance'.Subtle`,
    FontSize 18, `FontColor` text primary (✕ delete uses destructive red)
  - Destructive confirm (Yes): `Appearance: ='ButtonCanvas.Appearance'.Primary`,
    `BasePaletteColor: =RGBA(196, 43, 28, 1)`, `FontColor: =RGBA(255, 255, 255, 1)`
  - Secondary (Cancel, Dismiss): `Appearance: ='ButtonCanvas.Appearance'.Outline` (Cancel, FontColor
    text primary) / `'ButtonCanvas.Appearance'.Subtle` (Dismiss, FontColor accent)
  - Disabled: driven only by `DisplayMode: =DisplayMode.Disabled` (Fluent renders the disabled look)
- Density: phone only; single column; touch targets ≥ 44px.

## Layout Strategy

- Phone app, scale-to-fit: logical canvas 640 × 1136. Narrowest budgeted width 320 (all rows fit it
  without a breakpoint, so no width-dependent formulas are used anywhere). Do not create layout
  variables in `OnVisible`.
- One AutoLayout root (`conPlayersRoot`) is the only screen-level child: `Width: =Parent.Width`,
  `Height: =Parent.Height`, `LayoutMinWidth: =0`, `LayoutMinHeight: =0`, vertical,
  `LayoutOverflowY: =LayoutOverflow.Scroll`. Direct children use `FillPortions: =0` with explicit Height.
- Every GroupContainer: `Variant: AutoLayout`, explicit `LayoutDirection`, `LayoutMinWidth: =0`,
  `LayoutMinHeight: =0`. Vertical text containers use `LayoutAlignItems: =LayoutAlignItems.Stretch`.
- Every AutoLayout child sets `AlignInContainer` and `FillPortions` explicitly.
- Gallery: exactly one direct child (row shell) sized `Parent.TemplateWidth` / `Parent.TemplateHeight`;
  no X/Y inside the template.

## Named State

All global (`Set`), owned by Screen1; initialized in `Screen1.OnVisible`. No collections, no named formulas.

| Variable | Type | Initial | Assigned by | Meaning |
| --- | --- | --- | --- | --- |
| varRenameId | GUID (Players.Player) | `Blank()` | ✎ sets `ThisItem.Player`; ✓ success / cancel / ✕-delete-ask clear | Row in rename mode (blank = none) |
| varDeleteId | GUID | `Blank()` | ✕ sets `ThisItem.Player`; Yes success / Cancel / ✎ clear | Row awaiting delete confirmation |
| varLastPlayer | Players record | (never blank-set) | Add/Rename Patch result; Delete pre-delete snapshot | Receipt record |
| varLastAction | Text | `""` | "Added" / "Renamed" / "Deleted" | Receipt action |
| varReceiptVisible | Boolean | `false` | true on mutation success; false on Dismiss | Receipt visibility |

Field names in formulas use Dataverse display names: `Name` (kli_name), `Email` (kli_email),
`Player` (kli_playerid, GUID). Data source name: `Players`.

## Control Naming

Abbreviation + screen namespace `Players`: `con` GroupContainer, `gal` Gallery, `txt` Text and TextInput,
`btn` Button — e.g. `conPlayersRoot`, `btnPlayersAdd`. Single screen; no repeated cross-screen blocks.

## Cross-Screen Contracts

None — one screen, no navigation. `App.StartScreen: =Screen1`.

## YAML Conventions

- Every property value starts with `=`; literal text quoted (`Text: ="Add"`).
- Multi-line formulas use `|-` with `=` on the first content line.
- Any value containing `: ` (captions like `"Name: "`, record literals `{Name: x}`) must be single-quoted
  or written as a `|-` block. Put every Patch with a record literal in a `|-` block.
- Dotted enum names are quoted: `='ButtonCanvas.Appearance'.Primary`, `='TextCanvas.Weight'.Bold`,
  `='TextInputCanvas.TriggerOutput'.Keypress`. Plain enums unquoted: `=DisplayMode.Disabled`,
  `=LayoutDirection.Vertical`, `=VerticalAlign.Middle`, `=DropShadow.None`.
- `Variant:` is mandatory on GroupContainer (`AutoLayout`) and Gallery (`Vertical`).
- Never use bare `PaddingTop`/`LayoutGap` names inside formulas — write literal numbers.

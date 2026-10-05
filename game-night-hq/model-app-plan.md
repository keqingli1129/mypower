# Game Night HQ — design

Run our board game nights: players, the game library, scheduled nights, RSVPs and results.

Generated from `app-spec.json` by `scripts/write-app-spec-doc.js`. **Regenerate rather than
hand-edit** — `app-spec.json` is the source of truth, so a manual edit here is lost on the next
run and silently disagrees with what actually builds.

## Environment

| Setting | Value |
|---|---|
| Environment | https://fbisd.crm.dynamics.com |
| Solution | BoardGameManagement |
| Publisher prefix | kli |

## Jobs to be done

| Persona | Job to be done | Surfaces that satisfy it |
|---|---|---|
| Game Night Organizer | Maintain the player list — Add and update the people who come to game nights | Players, All Players, Player |
| Game Night Organizer | Curate the game library — Keep the board game collection with player counts, play time and complexity | Board Games, Game Library, Board Game |
| Game Night Organizer | Schedule game nights — Create upcoming nights, change their status, cancel them | Game Night Schedule, Game Night |
| Game Night Organizer | Track RSVPs — See who is going to each night and record responses on players' behalf | RSVPs by Night, Game Night |
| Game Night Organizer | Record game results — Log which game was played on which night, who won, and how fun it was | Game Result, Recent Results |
| Game Night Organizer | See how the group is doing — At-a-glance home: next night, recent results, leaderboard of winners | home, leaderboard |
| Game Night Player | See upcoming game nights — Find out when and where the next nights are | home, Game Nights This Week, Game Night Schedule |
| Game Night Player | RSVP to a game night — Say whether I am going | RSVP, Game Night |
| Game Night Player | Browse the game library — See which games we own and how many players they need | Game Library |
| Game Night Player | Check results and the leaderboard — See who won what and who is on top | leaderboard, Recent Results |

**Deliberately out of scope**

- Game Night Player — Scheduling or cancelling game nights — organizers only
- Game Night Player — Editing the game library or player list — organizers only

## Data model

### Player `kli_player`

A person who attends game nights; RSVPs and wins link back to them.

**Nav icon:** a single person silhouette — round head above rounded shoulders

| Column | Type | Notes |
|---|---|---|
| Name | Text | primary name |
| Email | Text | required |

### Board Game `kli_boardgame`

A game in our library, with the player range and typical play time used to pick games for a night.

**Nav icon:** a die face showing five pips

| Column | Type | Notes |
|---|---|---|
| Name | Text | primary name |
| Minimum Players | Integer | required |
| Maximum Players | Integer | required |
| Average Duration | Integer | — |
| Complexity | Choice | choices: Light, Medium, Heavy |

### Game Night `kli_gamenight`

A scheduled evening of games. Status reason Scheduled → Played; Cancelled deactivates it. A new Scheduled night triggers the confirmation email flow.

**Nav icon:** a calendar page with a small star in the middle

| Column | Type | Notes |
|---|---|---|
| Title | Text | primary name |
| Starts On | DateTime | required |
| Location | Text | — |

### RSVP `kli_rsvp`

One player's response for one game night (junction between Player and Game Night).

**Nav icon:** an envelope with a checkmark on its front

| Column | Type | Notes |
|---|---|---|
| Name | Text | primary name |
| Response | Choice | required; choices: Going, Maybe, Not Going |

### Game Result `kli_gameresult`

The outcome of one game played on a game night: which game, who won, and how fun it was.

**Nav icon:** a trophy cup with two handles on a small base

| Column | Type | Notes |
|---|---|---|
| Name | Text | primary name |
| Fun Rating | Choice | choices: 1 - Meh, 2 - Okay, 3 - Good, 4 - Great, 5 - Brilliant |
| Note | Memo | — |

### Relationships

| Kind | From | To | Lookup |
|---|---|---|---|
| 1:N | kli_gamenight | kli_rsvp | kli_GameNightId |
| 1:N | kli_player | kli_rsvp | kli_PlayerId |
| 1:N | kli_gamenight | kli_gameresult | kli_GameNightId |
| 1:N | kli_boardgame | kli_gameresult | kli_BoardGameId |
| 1:N | kli_player | kli_gameresult | kli_WinnerId |

## Surfaces

### Generative pages

| Page | Key | Purpose | Reads | Navigates to | State |
|---|---|---|---|---|---|
| Game Night Home | `home` | Landing page: the next scheduled game night as a hero card (title, date/time, location, countdown, Going/Maybe counts from RSVPs), the next few upcoming nights, and the most recent game results (game, winner, fun rating). | kli_gamenight, kli_rsvp, kli_gameresult, kli_boardgame, kli_player | — | intent (code not yet generated) |
| Leaderboard | `leaderboard` | Analytics: players ranked by number of wins (with win count bars), most-played board games, and average fun rating per game, computed from Game Results. | kli_gameresult, kli_player, kli_boardgame | — | intent (code not yet generated) |

### Forms

| Form | Table | Type | Layout | Sub-grids |
|---|---|---|---|---|
| Player | kli_player | Main | auto | kli_rsvp, kli_gameresult |
| Board Game | kli_boardgame | Main | auto | kli_gameresult |
| Game Night | kli_gamenight | Main | auto | kli_rsvp, kli_gameresult |
| RSVP | kli_rsvp | Main | auto | — |
| Game Result | kli_gameresult | Main | auto | — |

### Views

| View | Table | Columns | Filters | Sort |
|---|---|---|---|---|
| All Players | kli_player | kli_name, kli_email | — | kli_name asc |
| Game Library | kli_boardgame | kli_name, kli_minplayers, kli_maxplayers, kli_avgduration, kli_complexity | — | kli_name asc |
| Game Night Schedule | kli_gamenight | kli_name, kli_startson, kli_location, statuscode | — | kli_startson asc |
| Game Nights This Week | kli_gamenight | kli_name, kli_startson, kli_location | kli_startson this-week | kli_startson asc |
| RSVPs by Night | kli_rsvp | kli_name, kli_gamenightid, kli_playerid, kli_response | — | kli_gamenightid asc |
| Recent Results | kli_gameresult | kli_name, kli_gamenightid, kli_boardgameid, kli_winnerid, kli_funrating | — | createdon desc |

### Charts

| Chart | Table | Type | Measure | Grouped by |
|---|---|---|---|---|
| Library by Complexity | kli_boardgame | Pie | count | kli_complexity |
| RSVPs by Response | kli_rsvp | Pie | count | kli_response |
| Results by Fun Rating | kli_gameresult | Column | count | kli_funrating |

## Navigation

- **Game Night HQ**
  - Overview
    - Home → page `home` — icon: a house
    - Leaderboard → page `leaderboard` — icon: a podium with three steps
  - Game Nights
    - Game Nights → table `kli_gamenight` — icon: the table's own
    - RSVPs → table `kli_rsvp` — icon: the table's own
    - Game Results → table `kli_gameresult` — icon: the table's own
  - Library & People
    - Board Games → table `kli_boardgame` — icon: the table's own
    - Players → table `kli_player` — icon: the table's own

## Security

### Role: Game Night Organizer

The app is granted to this role, so it opens for this persona.

| Table | Access | Scope |
|---|---|---|
| kli_player | read, create, write, delete, append, appendTo | organization |
| kli_boardgame | read, create, write, delete, append, appendTo | organization |
| kli_gamenight | read, create, write, delete, append, appendTo | organization |
| kli_rsvp | read, create, write, delete, append, appendTo | organization |
| kli_gameresult | read, create, write, delete, append, appendTo | organization |

### Role: Game Night Player

The app is granted to this role, so it opens for this persona.

| Table | Access | Scope |
|---|---|---|
| kli_gamenight | read, appendTo | organization |
| kli_rsvp | read | organization |
| kli_rsvp | create, write, append | user |
| kli_player | read, appendTo | organization |
| kli_boardgame | read | organization |
| kli_gameresult | read | organization |

## Sample data

| Table | Records |
|---|---|
| kli_player | 5 |
| kli_boardgame | 5 |
| kli_gamenight | 4 |
| kli_rsvp | 10 |
| kli_gameresult | 3 |

## Design contract

| Token | Value |
|---|---|
| accentColor | #6b3fa0 |
| density | comfortable |
| cornerRadius | medium |
| darkMode | system |
| layout | cards |

These tokens are threaded to every generative page so the app looks consistent.

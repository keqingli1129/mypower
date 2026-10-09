# Starting a Power Apps code app: the proper order

How to go from nothing to a published code app that lives in its own solution.
It's written from the Game Night project. The **Example** values are this project's real ones; use
your own for a new project.

The rule behind the order: **Environment → Publisher → Solution → app.** Create the container first,
so everything you build afterwards goes into it, and nothing ends up in the Default solution.

---

## Part 1: In the cloud (browser, done once per project)

### Step 1. Have an environment you can build in
You need an environment where your account may create tables and apps. Being **System
Administrator** or **System Customizer** is enough; **Environment Maker** alone can't create tables.

- Check: make.powerapps.com → environment picker (top right).
- No suitable environment? Create a free personal **Developer** environment:
  ```bash
  pac admin create --name "Keqing Li Dev" --type Developer --region unitedstates
  ```
  The command can report a timeout even though the environment was created; check with `pac admin list`.
- Write down the **environment ID** (the GUID in the maker-portal URL:
  `make.powerapps.com/environments/<env-id>/…`) and the **environment URL**.

| | Example |
|---|---|
| Environment | Keqing Li Dev |
| Environment ID | `0f940836-d097-e42c-8597-62d9d7f17f1d` |
| Environment URL | `https://orgf8ec768a.crm.dynamics.com/` |

### Step 2. Turn on code apps in that environment
Code apps are off by default.

1. admin.powerplatform.microsoft.com → **Manage → Environments** → your environment
2. **Settings** → **Product** → **Features**
3. **Power Apps code apps** → turn on **Enable code apps** → **Save**

### Step 3. Create a publisher (once per environment)
The publisher supplies the **prefix** that every table and column name starts with. **The prefix
can't be changed later.**

1. make.powerapps.com → **Solutions** → **Publishers** tab → **+ New publisher**
   (or use **+ New publisher** inside the New solution panel in Step 4)
2. Fill in:
   - **Display name:** e.g. `Keqing Li`
   - **Name:** e.g. `KeqingLi`
   - **Prefix:** 2–8 lowercase letters, not already used in the environment, e.g. `kli`
   - **Choice value prefix:** a number from 10000 to 99999. Avoid `10000`, the default that many publishers share. Example: `31847`
3. **Save**

### Step 4. Create the solution
1. make.powerapps.com → **Solutions** → **+ New solution**
2. **Display name:** e.g. `Board Game Management`. The **Name** fills in as `BoardGameManagement`.
3. **Publisher:** pick yours from Step 3, not the Default publisher.
4. **Create**
5. Write down the **solution ID**. Run `npx pa solution list` once the project exists (Part 2),
   or `pac solution list`.

| | Example |
|---|---|
| Solution | Board Game Management (`BoardGameManagement`) |
| Solution ID | `86c1d50c-2ac1-f111-aaad-6045bd08c2a1` |

> In the solution, **Overview** shows solution-level actions (Export, Publish…). Go to **Objects**
> (left navigation) for **+ New** and **Add existing**.

---

## Part 2: On your computer (once per app)

Requirements: **Node.js 22+** (`node --version`) and Git.

### Step 5. Copy the template (this creates the app folder)
```bash
cd ~/Documents/mypower
npx degit microsoft/PowerAppsCodeApps/templates/vite game-night-app
cd game-night-app
npm install
```
- `npx degit` copies Microsoft's template from GitHub into a new folder, without Git history.
- `npm install` downloads the libraries listed in `package.json` into `node_modules/`.

### Step 6. Add the Power Apps CLI (`pa`)
The template no longer includes it, so add it to the project:
```bash
npm install --save-dev @microsoft/power-apps-cli
```
Always run it as **`npx pa …`** from inside the project folder.

### Step 7. Sign in and connect the folder to the environment
```bash
npx pa auth login            # opens a browser; sign in with your work account
npx pa app init --environment-id <env-id> --display-name "Game Night"
```
- `pa app init` creates **`power.config.json`**, which records which environment (and later which app)
  this folder belongs to.
- **`npm run dev` won't start until this file exists.** It fails with
  *"Missing file … power.config.json"*.
- `pa app init` also pins the CLI version in `package.json`. Commit that change.

### Step 8. Add a deploy script that targets your solution
In `package.json`, under `"scripts"`, add (mind the comma on the line before):
```json
"deploy": "npm run build && pa app push --solution-id <solution-id>"
```
Now **`npm run deploy`** = type-check + build, then publish into your solution. `&&` stops if the
build fails, so a broken build is never published.

### Step 9. Write a little code and run it locally
Edit `src/App.tsx`, e.g.:
```tsx
function App() {
  return <h1>Hello, Game Night!</h1>
}

export default App
```
```bash
npm run dev
```
- Open the **Local Play** link to see it running inside Power Apps. The plain `localhost` link
  shows it alone, without Power Platform features.
- Saving a file updates the browser instantly; no publish is needed while developing.

### Step 10. Commit to Git
```bash
git add .
git commit -m "Code app: scaffold, connect to environment, deploy script"
git push
```
`node_modules/` and `dist/` are generated and stay out of Git (`.gitignore`).

---

## Part 3: Publish

### Step 11. First publish
```bash
npm run deploy
```
- The first push **creates** the app, directly inside your solution, so no "Add existing" is needed.
- `power.config.json` now has an **`appId`**. **Commit it**, so later deploys update this same app
  instead of creating a new one.
- Check: make.powerapps.com → your environment → Solutions → your solution → **Objects**.
  The app is listed there.

| | Example |
|---|---|
| App | Game Night |
| App ID | `f5916d4e-9207-4946-b0e3-30852e341c57` |

---

## The everyday loop (after setup)

| You changed… | Do this |
|---|---|
| Code in `src/` (trying things out) | `npm run dev` (instant, local) |
| Code in `src/` (ready to publish) | `npm run deploy` |
| A table or column | Nothing; it's already live in Dataverse |
| Anything (to save it) | `git add` → `git commit` → `git push` |

`git push` updates **GitHub only**. `npm run deploy` updates **Power Apps only**. They aren't connected.

---

## Sign-ins: three tools, three sign-ins

| Tool | Used for | Sign in with |
|---|---|---|
| `pa` | Code apps: init, push, data sources | `npx pa auth login` |
| `pac` | Environments, solutions, tables | `pac auth create --environment <env-url>` |
| `az` | Direct Dataverse API calls | `az login` |

FBISD requires signing in again every **7 days**. An expired sign-in shows **`AADSTS70043`** or
"sign-in frequency". Run that tool's sign-in command again.

---

## Problems we hit, and the fix

| Symptom | Cause | Fix |
|---|---|---|
| `Missing file … power.config.json` on `npm run dev` | Project not connected yet | Step 7 (`npx pa app init`) |
| App appeared in *Common Data Services Default Solution* | First push had no `--solution-id` | Create the solution first (Step 4) and deploy with Step 8's script, or **Add existing** afterwards |
| No `pa` command after `npm install` | Template doesn't ship the CLI | Step 6 |
| 403 `prvCreateEntity` when creating tables | Only Environment Maker in that environment | Use an environment where you're System Administrator/Customizer (Step 1) |
| 401 `insufficient_claims` from Node scripts | FBISD binds sign-in tokens to your IPv4/IPv6 address | Use IPv6 for Node scripts (see `CLAUDE.md`) |
| Creating a table "times out" | Dataverse can take several minutes | Check whether it exists before retrying |
| Red lines in a `.tsx` file in VS Code | Libraries not installed for the editor | `npm install` in that folder, then **TypeScript: Restart TS Server** |

# START HERE: the plain-English guide

> **Starting fresh? Use `docs/handover/FRESH_START_CHECKLIST.md`. It is the single ordered checklist; this guide is the longer explanation.**

You do not need to be technical to follow this. Do the steps in order. Where you see `this style`, type or pick exactly that.

## 1. The big picture (five places, five jobs)

| Place | Think of it as | Its one job | Real data allowed? |
|---|---|---|---|
| **GitHub** | A filing cabinet | Keeps every file safe, with a history of every change | No |
| **Netlify** | A shop window | Shows the website page to people for review | **Never** |
| **Render** | A practice kitchen | Runs the engine (the API) so you can try it with pretend data | **Never** |
| **Neon** | A storage room | Would hold the database. **Not used yet**, so skip it for now | Not yet |
| **AWS London** | The real vault | Where the real, live system will run later | Yes, later |

Why Render and Neon are "pretend data only": Render has no UK data centre, so real worker records must never go there.

## 2. What is in the box (the folders)

You received one file called `tfw-portal-deploy.zip`. It is a normal zip file. **Unpack it first** (right-click, Extract All). You will get a folder called `tfw-portal-deploy`. Inside:

| Folder or file | In plain words | Goes to |
|---|---|---|
| `web/` (holds `index.html`) | The website page people see | GitHub, then Netlify shows it |
| `apps/portal-api/` | The engine: checks insurance, permits, QR sign-ins and keeps the audit record | GitHub, then Render runs it |
| `config/` | **The settings sheet.** Every detail TfW will give you lives here | GitHub only |
| `scripts/` | Small helper programs that check everything is right and swap in TfW's details safely | GitHub only (Netlify also runs two of them) |
| `tests/` | The checks for the helper programs | GitHub only |
| `docs/` | All the written documents | GitHub only (never published) |
| `.github/` | The robot that re-checks everything on every change | GitHub only. **Must sit at the very top level** |
| `netlify.toml` | Instructions for Netlify | GitHub. Netlify reads it by itself |
| `render.yaml` | Instructions for Render | GitHub. Render reads it by itself |
| `.env.example` | A blank form showing which secret names exist | GitHub (it has no real secrets in it) |
| `.gitignore` | A list of things GitHub must never store (passwords, keys) | GitHub |
| `README.md`, `SECURITY.md` | Welcome note and "how to report a security problem" | GitHub |

**Do not move files between folders.** The helper programs expect them exactly where they are.

**Items that go nowhere:** the `.zip` file itself (do not upload it) and the web link I gave you earlier (it is the same page as `web/index.html`).

## 3. Step by step

### Step 1: GitHub (do this first)

1. Sign in at github.com. Click **New repository**.
2. Name: `tfw-contractors-portal`. Choose **Private**. Do **not** tick "Add a README".
3. **Easiest way (no commands):** on the new repository page click **uploading an existing file**. Open the unzipped folder, select **everything inside it** (Ctrl+A), and drag it in. If the hidden `.github` folder does not appear, turn on "Hidden items" in the File Explorer View menu and drag it too; the site works without it, it only holds the automatic checks. Then click **Commit changes**.
   **Command way:** open a terminal inside the unpacked folder and type these lines one at a time (replace `YOUR-ORG` with your GitHub organisation or username):

```
git init -b main
git add .
git commit -m "Initial working build"
git remote add origin https://github.com/YOUR-ORG/tfw-contractors-portal.git
git push -u origin main
```

4. **Turn on the safety switches.** In the repository click **Settings**, then:
   - **Code security** (may be called "Advanced Security"): switch on Dependabot alerts, Dependabot security updates, Secret scanning, Push protection, Code scanning.
   - **Branches**: add a rule for `main`: require a pull request, 2 approvals, review by code owners, and the checks named `preview-safety`, `secrets`, `codeql`, `registry`, `api`. Tick "no force pushes" and "apply to administrators".
   - **Environments**: create `staging` (1 required reviewer) and `production` (2 required reviewers, only the `main` branch).
5. **Add one secret.** Settings, **Secrets and variables**, **Actions**, **New repository secret**: name `GITLEAKS_LICENSE`, value = the licence key from gitleaks.io (organisation accounts need one). If you cannot get it yet, the check called `secrets` will fail and block changes. Tell me and I will swap in a different scanner.
6. **Edit one file** on GitHub: `.github/CODEOWNERS`. Replace every `@ORG/` with your real organisation, like `@my-organisation/`. Then create these four teams in GitHub: `safety-compliance`, `security`, `data-protection`, `frontend`.
7. **How you know it worked:** on the **Actions** tab, all five checks show green ticks.

### Step 2: Netlify (the shop window)

1. Sign in at netlify.com. **Add new project**, **Import an existing project**, choose **GitHub**, pick `tfw-contractors-portal`.
2. Leave "Base directory" blank. Netlify will fill in the build settings from `netlify.toml`. **Do not change them.**
3. **Environment variables: add none.** (`netlify.toml` already holds the two harmless ones.)
4. Switch **off** anything called Functions, Forms, Identity or Analytics. If your plan allows, switch **on** password protection for previews.
5. Click **Deploy**.
6. **How you know it worked:** the deploy log says `scanned 1 file(s), 0 violation(s)` and `CSP hashes in sync`, and the web address Netlify gives you shows the page with English and Cymraeg buttons.

### Step 3: Render (the practice kitchen)

1. Sign in at render.com. Click **New +**, then **Web Service**.
2. Choose **GitHub**, pick your repository, click **Connect**. (If the repository is not listed: **Configure account**, **Only select repositories**, add it, save.)
3. **Language: choose Node. Never choose Docker.** (A Docker service runs a Dockerfile; this project has none.)
4. Fill the form:

| Setting | What to put |
|---|---|
| Name | `tfw-portal-api` |
| Region | **Frankfurt** (cannot be changed later) |
| Branch | `main` |
| Root Directory | leave **empty** |
| Build Command | `cd apps/portal-api && npm run build` |
| Start Command | `cd apps/portal-api && node src/server.js` |
| Instance Type | **Free** (it sleeps when unused; the page wakes it for you) |

5. Add these **Environment Variables** (on the form, or later under **Environment** in the left menu):

| Name | Value |
|---|---|
| `NODE_VERSION` | `20` |
| `DATA_CLASSIFICATION` | `synthetic` |
| `TRUST_PROXY` | `1` |
| `AUDIT_HMAC_KEY` | a random 64-character string you generate |
| `QR_SIGNING_KEY` | a **different** random 64-character string |
| `SIMULATED_USER_PASSWORD` | a password you invent, 12 characters or more |
| `EXTRA_ALLOWED_ORIGINS` | your Netlify address, added in Step 3b (leave out for now) |

Making a random string in Windows PowerShell:
`$b=New-Object byte[] 32;[Security.Cryptography.RandomNumberGenerator]::Create().GetBytes($b);($b|ForEach-Object{$_.ToString('x2')}) -join ''`
Run it twice (once per key). Keep all secrets in a password manager; never in GitHub or chat.

6. In **Settings**, **Health Checks**, set the path to `/health`. Click **Create Web Service**.
7. **How you know it worked:** open `https://YOUR-SERVICE.onrender.com/health`. You must see `{"data":{"status":"ok"}}`. (The bare address shows "Not found". That is normal.)
8. If the log mentions port 5432 or a database, Render is running some other program: you chose Docker, or the repository contains someone else's files. Start again from a clean repository.

### Step 3b: Connect the web page to the engine (needed for live testing)

The engine address is already built into this release (`https://tfw-portal-api.onrender.com`). If your Render service has a different address, change it with the apply tool (item TFW-07) before uploading.

After Netlify gives you its address (Step 2):
1. Open Render, your service, **Environment**.
2. Add `EXTRA_ALLOWED_ORIGINS` with your Netlify address as the value (no slash at the end, for example `https://something-12345.netlify.app`). Save. Render restarts.
3. **How you know it worked:** open the Netlify address, choose `alpha.w1`, type your password, press **Sign in**. You should reach the Check in screen.
4. Give testers the Netlify address, the account list and the password (see `docs/handover/TESTER_GUIDE.md`). Share the password privately.

Only the main Netlify address works. Netlify's temporary "deploy preview" addresses are different and will be refused unless added to `EXTRA_ALLOWED_ORIGINS`.

### Step 4: Neon (skip for now)

Nothing uses it yet. Creating one now changes nothing. When we build the database part later: choose **AWS Europe (London)** (`aws-eu-west-2`) because the region can never be changed afterwards, use pretend data only, and paste the connection string **only** into Render's Environment tab under the name `DATABASE_URL`. Never put it in GitHub or Netlify.

### Step 5: When TfW sends their details

Do not hunt through files. Use the fill-in form:

1. In the `config` folder, copy `tfw-values.example.json` and name the copy `tfw-values.json` (in the top-level folder). GitHub is set up to ignore this file, so it will not be uploaded by accident.
2. Type only what you have received. Left side is the ID, right side is the value:

| ID | What TfW gives you | Looks like | Ask |
|---|---|---|---|
| TFW-01 | Official product name | `TfW Contractor Portal` | TfW communications |
| TFW-02 | Exact legal name | `Transport for Wales` | TfW legal |
| TFW-03 | Help desk email | `help@tfw.example` | TfW service desk |
| TFW-04 | Security contact email | `security@tfw.example` | TfW security |
| TFW-05 | "From" address for emails | `no-reply@tfw.example` | TfW IT |
| TFW-06 | Website address of the portal | `https://portal.tfw.example` (no slash at the end) | TfW IT |
| TFW-07 | Website address of the engine | `https://api.tfw.example` | Vendor and TfW IT |
| TFW-10 | Microsoft tenant ID | 36 characters like `1234abcd-...` | TfW Microsoft admin |
| TFW-11 | Microsoft application (client) ID | same style | TfW Microsoft admin |
| TFW-12 | The 8 Microsoft group IDs, one per role | a list of 8 | TfW Microsoft admin |
| TFW-14, 16, 18 | Addresses of TfW, RISQS and card-check systems | `https://...` | Each provider |
| TFW-19 to 25 | Safety rules: expiry rule, cards required, QR time, log-out times, permit length, how long to keep records | numbers and choices | TfW safety team and data protection officer |
| TFW-26 | Real site list | code (like `CDF-001`) and name | TfW operations |
| TFW-27 | Your GitHub organisation name | `@my-organisation/` | You |
| TFW-28 | Welsh text approved | `approved` | TfW Welsh-language reviewer |

3. **Preview** (changes nothing): `node scripts/apply-tfw-values.mjs tfw-values.json`
4. **Apply:** `node scripts/apply-tfw-values.mjs tfw-values.json --write`. It rejects mistakes (a web address without `https`, a wrongly shaped ID) **before** changing anything.
5. Upload the changes to GitHub the normal way. Delete `tfw-values.json` afterwards.

**Passwords and keys never go in that form.** They go in the places below.

### Where each secret goes (and who makes it)

| Secret name | Put it in | Who makes it |
|---|---|---|
| `AUDIT_HMAC_KEY`, `QR_SIGNING_KEY`, `SIMULATED_USER_PASSWORD` | Render's Environment tab (Render makes them) | Render, automatically |
| `GITLEAKS_LICENSE` | GitHub: Settings, Secrets and variables, Actions | gitleaks.io |
| `ENTRA_CLIENT_SECRET` (later) | AWS Secrets Manager, London | TfW's Microsoft admin |
| TfW, RISQS and card-provider keys (later) | AWS Secrets Manager, London | Each provider |
| `AWS_ROLE_ARN` (later) | GitHub: Environments, `production`, **Variables** | Your AWS administrator |
| `DATABASE_URL` (later) | Render's Environment tab; later AWS Secrets Manager | Neon / AWS |

**Never** put a password, key or secret in: any file in the folder, GitHub issues or chat, or Netlify.

### Other places that need connecting later

| Place | What happens there |
|---|---|
| **Microsoft Entra admin centre** (TfW's) | TfW registers the portal, creates the 8 role groups, and gives you the IDs above |
| **TfW's domain (DNS) provider** | Adds the website names and the email-security records |
| **AWS London account** | The real, live system. Nothing is built there yet |
| **Email sending service** | Not chosen yet. Must be UK-based or approved by TfW |
| **Monitoring tools** | Not chosen yet. Same rule |

## 4. Before going live

Run `node scripts/verify-placeholders.mjs --go-live`. It lists every pretend value or simulation still left. **It fails today on purpose.** It only passes when everything real has been swapped in.

## 5. What you have got beyond the minimum

- A working engine that blocks permits and sign-ins when insurance, RISQS, induction, RAMS, permit or cards are missing or expired, and is tested for replayed QR codes, expiry-mid-action, two requests at once, and one contractor peeking at another.
- A tamper-evident audit record.
- English and Welsh error messages from the engine.
- **A settings sheet plus a checker** so TfW's details cannot be put in the wrong place or forgotten.
- A **file-placement checker** so no file is ever without a home.
- A **go-live gate** that refuses to pass while any pretend value remains.
- No outside software libraries at all in the engine, which removes a whole category of security risk.

## 6. The honest limits (so nobody is surprised)

I cannot promise that nothing will ever be flagged. Today, these are true:
1. Sign-in is pretend until the Microsoft sign-in part is built (needs a test Microsoft tenant from TfW).
2. The engine keeps records in memory only, so a restart wipes them.
3. The Welsh is a draft that a Welsh speaker must approve.
4. No outside security test, accessibility audit or speed test has been done.
5. The web page does not talk to the engine yet.
6. Nothing has been deployed by me; Render's first build is untested.
7. The AWS London setup does not exist yet.

## 7. Plain-word glossary

- **Repository (repo):** the filing cabinet on GitHub.
- **Commit / push:** save a set of changes / send them to GitHub.
- **Deploy:** publish or start the latest version.
- **API / engine:** the behind-the-scenes program that makes the decisions.
- **Synthetic data:** invented pretend data.
- **Environment variable:** a named setting, such as a secret, typed into a platform's settings page instead of a file.
- **Entra ID:** Microsoft's sign-in system TfW uses.
- **RISQS, Sentinel, CSCS:** the industry safety schemes for companies and workers.
- **RAMS:** risk assessments and method statements.
- **QR roll call:** workers scan a code on their own phones to sign in and out of a site.
- **Hard-stop:** the engine says "no" and nothing changes, whatever the website tries.


## 8. If the web page looks blank or stuck
| What you see | What to do |
|---|---|
| Only the dark background with railway lines, nothing else (older version) | Upload release 0.2.1, which fixes it |
| "Loading the portal…" that never goes away | Reload. If it stays: press F12, click **Console**, and send the red text to the test team. It means the page was blocked or has an error |
| Login screen appears but sign-in says "Cannot reach the server" | The engine is asleep or the address is wrong. Open `https://YOUR-SERVICE.onrender.com/health`, wait up to a minute, then try again. Free Render services sleep after 15 minutes without visitors; the page wakes the engine and says so |
| Sign-in works on your computer but not for someone else | Check `EXTRA_ALLOWED_ORIGINS` in Render holds the exact Netlify address |

## 9. Running on Render's Free plan (what to expect)
- **It sleeps.** After 15 minutes with no visitors the engine goes to sleep. The next person waits about 30 to 60 seconds. The page shows "Waking the test server…" and signs them in automatically when it is ready.
- **It forgets.** Each wake-up starts the engine fresh: invented data goes back to the start and everyone is signed out. For testing this is fine; tell testers (see the Tester Guide).
- **Optional: keep it awake during a test session.** A free monitoring service such as UptimeRobot can visit `https://YOUR-SERVICE.onrender.com/health` every 5 minutes. Render does not officially support this as a fix, and one service kept awake all month uses about 744 of the 750 free hours, so run it only while testing. It sends no personal data. Remove it before real use.
- **When you need it always-on and not forgetful:** the paid Starter plan, and later the real AWS London setup.

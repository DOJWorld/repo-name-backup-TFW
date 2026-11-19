# FRESH START CHECKLIST (GitHub, Render, Netlify)

Do the parts **in this order**. Tick each box. Do not skip the "how you know it worked" checks.

**What you need first:** a GitHub account, a Render account, a Netlify account, the file `tfw-contractors-portal-v0.2.3.zip`, and a password manager (or a notebook kept somewhere safe) for three secrets.

**The three places and their jobs:** GitHub keeps the files. Render runs the engine. Netlify shows the web page. They are joined only by two web addresses.

---

## PART 0: Make your three secrets (2 minutes)

You need three secrets for Render. Make them now and keep them in the password manager. **Never paste them into GitHub, Netlify, an email or a chat.**

**Way A (if Node is installed):** unzip the zip, open a terminal inside the folder, type `node scripts/make-secrets.mjs`. It prints three lines. It saves nothing.

**Way B (no installs):** open a blank browser tab, press **F12**, click **Console**, type `allow pasting` and press Enter, then paste this single line and press Enter:

```
const r=n=>[...crypto.getRandomValues(new Uint8Array(n))].map(b=>b.toString(16).padStart(2,'0')).join('');console.log('AUDIT_HMAC_KEY='+r(32));console.log('QR_SIGNING_KEY='+r(32));console.log('SIMULATED_USER_PASSWORD='+r(12))
```

You get three lines like `AUDIT_HMAC_KEY=3fa9...`. The first two are 64 characters, the password is 24. All three are different. Copy each into the password manager.

- [ ] I have `AUDIT_HMAC_KEY`, `QR_SIGNING_KEY` and `SIMULATED_USER_PASSWORD` saved safely.

---

## PART 1: GitHub (new repository)

1. Go to github.com, click **+** (top right), then **New repository**.
2. **Repository name:** `tfw-contractors-portal`. **Private.** Leave "Add a README", ".gitignore" and "license" **unticked**. Click **Create repository**.
3. Unzip `tfw-contractors-portal-v0.2.3.zip` (right-click, **Extract All**). Open the folder it makes, then open the `tfw-contractors-portal` folder inside.
4. Press **Ctrl + A** to select everything inside it. On the new repository page click **uploading an existing file** and drag everything in. If the hidden `.github` folder does not come with it, in File Explorer open the **View** menu, tick **Hidden items**, and drag `.github` in as well. (The site works without it; it only holds the automatic checks.)
5. Click **Commit changes**.

**How you know it worked:** the repository's main page lists `apps`, `config`, `docs`, `scripts`, `tests`, `web`, `netlify.toml`, `package.json`, `render.yaml` and `README.md`. Click `apps`: you see `portal-api`. There is **no file called Dockerfile** anywhere.

6. **Settings** (if your plan offers them): **Code security**, switch on Secret scanning and Push protection, and Dependabot alerts. Under **Branches**, protect `main` (require a pull request).

- [ ] Repository created and the file list above is correct.

---

## PART 2: Render (new engine service)

If you still have an old `tfw-portal` service, delete it first: open it, **Settings**, bottom of the page, **Delete or suspend**.

1. On dashboard.render.com click **New +**, then **Web Service**.
2. Choose **GitHub**. If your new repository is not listed: **Configure account**, **Only select repositories**, add `tfw-contractors-portal`, save.
3. Pick `tfw-contractors-portal`, click **Connect**.
4. Fill the form exactly:

| Setting | What to put |
|---|---|
| Name | `tfw-portal-api` |
| Region | **Frankfurt** (cannot be changed later; it has no UK region, so only invented data may ever go here) |
| Branch | `main` |
| Root Directory | leave **empty** |
| **Language** | **Node** (**never** Docker) |
| Build Command | `cd apps/portal-api && npm run build` |
| Start Command | `cd apps/portal-api && node src/server.js` |
| Instance Type | **Free** |

5. Add these **Environment Variables** (button **Add Environment Variable**; name on the left, value on the right):

| Name | Value |
|---|---|
| `NODE_VERSION` | `20` |
| `DATA_CLASSIFICATION` | `synthetic` |
| `TRUST_PROXY` | `1` |
| `AUDIT_HMAC_KEY` | the first secret from Part 0 |
| `QR_SIGNING_KEY` | the second secret |
| `SIMULATED_USER_PASSWORD` | the third secret |

**Do not add** `PORT`, `DATABASE_URL`, `AWS_REGION` or anything else. **Never** set `DATA_CLASSIFICATION` to `real`: the engine would refuse to start, which is a safety lock.

6. Click **Create Web Service**. Wait until the log says the service is live.
7. In **Settings**, **Health Checks**, set the path to `/health` and save.
8. Copy the address at the top of the page.

**How you know it worked:** open that address with `/health` on the end. You must see `{"data":{"status":"ok"}}`. (The bare address showing "Not found" is normal.)

**The address must be exactly `https://tfw-portal-api.onrender.com`.** That is what is already built into the web page. If Render gave you a different address (for example it adds letters because the name was taken), stop and see Part 6.

- [ ] `/health` shows ok. [ ] The address is exactly the one above.

---

## PART 3: Netlify (new web page)

If you still have an old site, delete it: **Site configuration**, bottom, **Delete this site**.

1. On app.netlify.com click **Add new project**, then **Import an existing project**, then **GitHub**. Authorise and choose `tfw-contractors-portal`.
2. Leave **Base directory** empty. Check the settings show:

| Setting | Value |
|---|---|
| Build command | `node scripts/preview-safety-check.mjs && node scripts/sync-csp.mjs --check` |
| Publish directory | `web` |

3. **Environment variables: add none.** (`netlify.toml` already holds the harmless two.)
4. Click **Deploy** and wait for "Published".
5. **Site configuration**, **Change site name**: set it to `tfw-contractors-portal` so the address becomes `https://tfw-contractors-portal.netlify.app`. Copy the address.
6. In Netlify, switch **off** anything called Forms, Functions, Identity or Analytics.

**How you know it worked:** the page opens with a dark railway background, the title "TfW Contractors Portal", **English / Cymraeg** buttons, a "Test account" box and the words "Built by the FST". The status line says "Waking the test server…" and then "Test server ready."

- [ ] Page opens. [ ] I have the Netlify address.

---

## PART 4: Join the two (1 minute)

The engine only accepts requests from the web page address you tell it about.

1. Open Render, your service, **Environment**.
2. Click **Add Environment Variable**: name `EXTRA_ALLOWED_ORIGINS`, value your Netlify address, **exactly**, with `https://` and **no slash on the end** (for example `https://tfw-contractors-portal.netlify.app`). Save. Render restarts (a minute).
3. Open the Netlify address, choose **alpha.w1**, type `SIMULATED_USER_PASSWORD`, press **Sign in**.

**How you know it worked:** you reach the **Check in / out** screen.

- [ ] Signed in. Now give testers the web address and `docs/handover/TESTER_GUIDE.md`; share the password **privately**.

---

## PART 5: Complete list of every setting, by place

**Render environment variables** (the only ones): `NODE_VERSION=20`, `DATA_CLASSIFICATION=synthetic`, `TRUST_PROXY=1`, `AUDIT_HMAC_KEY=<secret>`, `QR_SIGNING_KEY=<secret>`, `SIMULATED_USER_PASSWORD=<secret>`, `EXTRA_ALLOWED_ORIGINS=<Netlify address>`.

**Netlify environment variables:** none.

**GitHub secrets and variables:** none are needed for this test. Later: `GITLEAKS_LICENSE` (only if the secrets check asks for it on an organisation account); `AWS_ROLE_ARN` (production, later).

**Never put in any file, GitHub, Netlify or chat:** the three secrets, any Microsoft or TfW credential, any database address.

---

## PART 6: If your Render address is not exactly `https://tfw-portal-api.onrender.com`

The page has the engine address built in. Change it with the replacement tool (needs Node): make a file `tfw-values.json` in the top folder containing `{"TFW-07": "https://YOUR-REAL-RENDER-ADDRESS"}`, run `node scripts/apply-tfw-values.mjs tfw-values.json --write`, then upload the changed files (`config/tenant.config.json`, `config/replacement-registry.json`, `docs/handover/TFW_REPLACEMENT_REGISTER.md`, `web/index.html`, `netlify.toml`) to GitHub and delete `tfw-values.json`. Or send the address to the FST engineer to do it.

---

## PART 7: When TfW sends their details: what goes where

Never edit these by hand. Fill a file called `tfw-values.json` (copy `config/tfw-values.example.json`) with only the IDs you have, then run:

1. `node scripts/apply-tfw-values.mjs tfw-values.json` (preview; changes nothing)
2. `node scripts/apply-tfw-values.mjs tfw-values.json --write` (applies and re-checks everything)
3. Upload the changed files to GitHub, delete `tfw-values.json`.

It rejects wrongly shaped values (for example a web address without `https`) before changing anything. These are the things TfW supplies, where they live today, and what the placeholder is now:

| ID | What | Placeholder now | Where it lives | Supplied by |
|---|---|---|---|---|
| TFW-01 | Product name | `TfW Contractors Portal` | `config/tenant.config.json` line 3; also in `web/index.html` (the tool updates these too) | TfW communications / product owner |
| TFW-02 | Legal entity name | `Transport for Wales` | `config/tenant.config.json` line 4 | TfW legal / procurement |
| TFW-03 | Support email | `support@portal.example.invalid` | `config/tenant.config.json` line 5 | TfW service desk |
| TFW-04 | Security contact email | `security@portal.example.invalid` | `config/tenant.config.json` line 6; also in `SECURITY.md` (the tool updates these too) | TfW security team |
| TFW-05 | Notification sender email | `no-reply@portal.example.invalid` | `config/tenant.config.json` line 7 | TfW IT / DNS admin |
| TFW-06 | Portal base URL (web origin) | `https://portal.example.invalid` | `config/tenant.config.json` line 10 | TfW IT / DNS admin |
| TFW-07 | API base URL | `https://tfw-portal-api.onrender.com` | `config/tenant.config.json` line 11; also in `web/index.html`, `netlify.toml` (the tool updates these too) | Vendor (AWS) with TfW DNS |
| TFW-08 | Extra allowed web origins | `[]` | `config/tenant.config.json` line 12 | TfW IT |
| TFW-09 | Identity mode | `simulated` | `config/tenant.config.json` line 15 | Vendor + TfW |
| TFW-10 | Entra tenant ID | `00000000-0000-0000-0000-000000000000` | `config/tenant.config.json` line 17 | TfW Entra administrator |
| TFW-11 | Entra application (client) ID | `00000000-0000-0000-0000-000000000001` | `config/tenant.config.json` line 18 | TfW Entra administrator |
| TFW-12 | Entra group to role map | `{"00000000-0000-0000-0000-0000000000a1":"tf...` | `config/tenant.config.json` line 20 | TfW Entra administrator |
| TFW-13 | TfW systems integration mode | `simulated` | `config/tenant.config.json` line 34 | Vendor + TfW |
| TFW-14 | TfW systems API base URL | `https://tfw-api.example.invalid` | `config/tenant.config.json` line 35 | TfW integration team |
| TFW-15 | RISQS verification mode | `simulated` | `config/tenant.config.json` line 38 | Vendor + provider |
| TFW-16 | RISQS provider API base URL | `https://risqs.example.invalid` | `config/tenant.config.json` line 39 | RISQS provider |
| TFW-17 | Sentinel/CSCS verification mode | `simulated` | `config/tenant.config.json` line 42 | Vendor + provider |
| TFW-18 | Sentinel/CSCS provider API base URL | `https://cards.example.invalid` | `config/tenant.config.json` line 43 | Card scheme provider |
| TFW-19 | Expiry semantics | `end_of_day_utc` | `config/tenant.config.json` line 47 | TfW safety / SMS-OCC-003 owner |
| TFW-20 | Cards required for sign-in | `["sentinel","cscs"]` | `config/tenant.config.json` line 48 | TfW safety |
| TFW-21 | QR challenge lifetime (seconds) | `60` | `config/tenant.config.json` line 52 | TfW safety / security |
| TFW-22 | Session idle timeout (minutes) | `30` | `config/tenant.config.json` line 53 | TfW security |
| TFW-23 | Session absolute lifetime (minutes) | `480` | `config/tenant.config.json` line 54 | TfW security |
| TFW-24 | Permit validity (hours) | `12` | `config/tenant.config.json` line 55 | TfW safety |
| TFW-25 | Audit retention (days) | `2555` | `config/tenant.config.json` line 56 | TfW DPO / contract |
| TFW-26 | Site list | `[{"code":"SITE-001","name":"Demo Depot Nort...` | `config/tenant.config.json` line 63 | TfW operations |
| TFW-41 | "Built by" credit line | `Built by the FST` | `web/index.html` line 111 | Vendor (the FST) |
| TFW-27 | GitHub organisation handle prefix | `@ORG/` | `.github/CODEOWNERS` line 1, 2, 3, 4, 5, 6, 7, 8 | Repository owner (vendor, then TfW if transferred) |
| TFW-28 | Welsh translation review status | `draft-unreviewed` | `apps/portal-api/src/locales/cy.json` line 4 | TfW Welsh-language reviewer |

**Set outside the repository (the tool cannot do these):**

| ID | What | Where exactly | Supplied by |
|---|---|---|---|
| TFW-31 | Entra client secret (or certificate) | AWS Secrets Manager, London (later) | TfW Microsoft administrator |
| TFW-32 | Entra redirect address registered | Microsoft Entra admin centre, App registration, Authentication | TfW Microsoft administrator |
| TFW-33 | TfW API client ID and secret | AWS Secrets Manager (later) | TfW integration team |
| TFW-34 | RISQS key | AWS Secrets Manager (later) | RISQS provider |
| TFW-35 | Card-check key | AWS Secrets Manager (later) | Sentinel/CSCS provider |
| TFW-36, 37 | Web address and DNS records | Netlify domain settings; TfW's DNS provider | TfW IT |
| TFW-38 | AWS deploy role | GitHub, Settings, Environments, production, Variables | Vendor AWS administrator |
| TFW-40 | Remove `SIMULATED_USER_PASSWORD`; set `DATA_CLASSIFICATION=real` | Production environment only | Vendor, approved by TfW |
| TFW-42 | `EXTRA_ALLOWED_ORIGINS` | Render, Environment | Vendor |

**Before any real data:** `node scripts/verify-placeholders.mjs --go-live` must pass. It fails today on purpose and lists everything still pretend.

---

## PART 8: Security: what is true

**Checked by tests that were actually run** (22 engine tests, 16 journey and tooling tests, plus structure, security-hash and safety-scanner checks): refusal when insurance, RISQS, induction, RAMS, permit or cards fail; checks repeated at the moment of action; contractor A cannot see contractor B; wrong roles refused; QR check-ins are single-use, tied to one worker and expire; two simultaneous requests give one result; login lockout and rate limits; sessions end after 30 minutes idle; no passwords, keys or tokens in the audit record; audit tampering is detected; strict browser security policy (by hash); the page uses no unsafe code or browser storage; only the exact web address you list may call the engine; the engine refuses to start with real data on this setup.

**What no one can promise:** that it passes every security test. Only an independent penetration test can show that. Not done yet: independent penetration test, accessibility audit, load test; Microsoft sign-in, real database, live TfW connections and the AWS London setup are not built; the Welsh is a draft; GitHub Actions are tagged by version, not pinned by fingerprint.

**Things a reviewer may mention, and why they are there:** one shared password for all test accounts and the account names shown on the login page (for easy testing; both go before real use); data lost on each Render wake (Free plan, invented data only); Render is Frankfurt, not UK (invented data only; real data goes to AWS London).

---

## PART 9: If something goes wrong

| What you see | What it means / do this |
|---|---|
| Render log mentions port 5432 or a database | Wrong program: you chose Docker or the repository holds someone else's files. Recreate from a clean repository, **Node** |
| Render log: `AUDIT_HMAC_KEY must be set` (or QR_SIGNING_KEY, SIMULATED_USER_PASSWORD) | That variable is missing or too short. Re-add it |
| `/health` never answers | Wait a minute (Free plan waking). Check the Start Command is typed exactly |
| Page shows "Loading the portal…" for over a minute | Reload. If it stays: F12, Console, send the red text |
| Sign-in says "Cannot reach the server" | Engine asleep or address wrong. Open `/health`, wait, retry. Check Part 6 |
| Sign-in loads then fails with no reason | `EXTRA_ALLOWED_ORIGINS` missing or has a slash or typo (Part 4) |
| "Incorrect username or password" | Password differs from Render's `SIMULATED_USER_PASSWORD` |
| Netlify build fails with "CSP hashes out of date" | Only `index.html` or only `netlify.toml` was uploaded. Upload both from the zip |

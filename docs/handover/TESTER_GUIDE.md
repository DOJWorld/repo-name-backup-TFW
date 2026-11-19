# Tester Guide (for the people trying the portal)

This is a **test version with invented data**. Nothing you do affects real TfW records. Built by the FST.

## Before you start
You need three things from the test team: the **web address**, the **test accounts** below, and the **password** (the same for every account; the team gives it to you privately).

Use a phone or a computer. Choose **English** or **Cymraeg** at the top at any time; your place on the screen is kept.

## The test accounts
| Account name | Role | What it can do |
|---|---|---|
| `alpha.w1` | Worker (Alpha company) | Check in and out. Fully compliant |
| `alpha.w2` | Worker (Alpha company) | Has **no site induction**: check-in should be refused |
| `beta.w1` | Worker (Beta company) | Check in only after Beta's paperwork is approved |
| `alpha.admin` | Contractor administrator (Alpha) | See company checks, submit RAMS, request permits |
| `beta.admin` | Contractor administrator (Beta) | Same, for Beta (cannot see Alpha's records) |
| `approver` | Permit approver | Authorise or revoke permits |
| `safety` | Safety and compliance officer | Approve RAMS, change insurance, RISQS, card and induction dates |
| `sitemgr` | Site manager | See who is on site; print the QR poster |
| `tfw.admin` | TfW administrator | Overview screens |
| `auditor` | Auditor | Read and verify the audit log |
| `support` | Technical support | Sees **no** data, on purpose |

## Tasks to try (about 20 minutes)
1. **Happy path.** Sign in as `alpha.admin`, open **Permits**, press **Request a permit**. Sign out. Sign in as `approver` and press **Authorise**. Sign in as `alpha.w1` and press **Check in**, then **Check out**.
2. **The safety stop.** Sign in as `alpha.w2` and press **Check in**. It must be refused, with a reason, and say nothing was changed.
3. **Break the chain.** Sign in as `safety`. Change Alpha's insurance date to a date in the past and press **Save**. Sign in as `alpha.admin` and request a permit: it must be refused. Put the date back to the future afterwards.
4. **Approve paperwork.** As `safety`, approve Beta's waiting RAMS. As `beta.admin` request a permit; as `approver` authorise; as `beta.w1` check in.
5. **The poster.** As `sitemgr`, open **Roll call and poster**, press **Print poster** (or save as PDF). Scan the QR code with a phone camera. It should open the portal for that site; sign in as a worker and press **Check in**.
6. **Welsh.** Repeat any task in **Cymraeg**. Note anything that looks wrong or unnatural (the Welsh is a draft).
7. **Privacy.** As `beta.admin`, try to find any sign of Alpha's records. You should find none.
8. **The record.** As `auditor`, press **Verify audit chain**. It should say the chain is intact. Look for your earlier actions in the list.

## Please tell us
For each task: **Did it work? (yes/no)**, **was it clear what to do?**, **was any wording confusing?**, **anything missing that you would expect?** If something is refused, copy the **Reference** shown in the message. It lets the team find exactly what happened.

## Good to know
- **The first page load after a quiet spell can take up to a minute** while the test server wakes up. The page tells you. Just wait.
- The test server may reset itself (for example after an update). If your account or data seems to have changed back, that is why.
- You are signed out when you reload the page or after 30 minutes of inactivity. This is deliberate.
- If the internet drops, the portal says so and does **not** let you check in. This is deliberate safety behaviour.

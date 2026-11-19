# Changelog

## 0.2.3
- New: `docs/handover/FRESH_START_CHECKLIST.md` (one ordered checklist for GitHub, Render, Netlify) and `scripts/make-secrets.mjs`.

## 0.2.2
- Built for Render Free: the page shows a live "waking the test server" status, retries, and signs in automatically once the engine is awake; a failed wake-up is reported clearly.
- Never blank: crash screen if the page itself fails; render never depends on the network.
- Render blueprint switched to the free plan; documentation updated.

## 0.2.1
- Fix: the page now draws immediately instead of waiting for the engine (a sleeping or slow engine previously left a blank screen).
- Requests time out after 20 seconds and report "cannot reach the server".
- A bilingual loading message stays visible if the page script is blocked.

## 0.2.0
- Web app wired to the API: role-based screens, worker check-in/out, permits, RAMS, safety credentials, roll call, audit verification.
- Printable QR poster (generator written in-house, no libraries; decode-verified).
- English/Welsh switching that keeps your place; server messages re-translated on switch.
- Tenant configuration + replacement register + safe apply tool + go-live gate + placement check.
- Strict Content Security Policy by hash; Netlify redirect for poster links.
- New: `EXTRA_ALLOWED_ORIGINS` (Render) so the web address needs no code edit.
- Fixes: Dependabot folder, line-ending-safe security hashes, Node version pinned.

## 0.1.0
- Initial API, hard-stop guard, audit chain, QR challenges, tests.

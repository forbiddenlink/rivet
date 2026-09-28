# Authentication coverage

Snapshot as of 2026-09-27, branch `feat/annotated-source-redesign`, written against `6bc2114`.

## Verdict

RIVET has no authentication. It has no sign-in, accounts, sessions, roles or protected
routes, so there is no auth flow to test or repair. Nothing here is broken. The feature does
not exist yet. The roadmap lists it as Phase 2 work, not yet started.

Nothing below is marked verified on the strength of a build or a mocked test. Every row
states what was inspected.

## Evidence

| Check | Result | How |
|---|---|---|
| Auth library in any package | None | Searched `apps/web/src`, `apps/cli/src` and `packages` for next-auth, better-auth, `@auth/`, clerk, supabase, lucia, passport, jsonwebtoken, iron-session, `getServerSession` and `cookies(`. No matches (grep exit 1). |
| Web dependencies | No auth or database package | `apps/web/package.json` dependencies: the ten `@rivet/*` packages, `next`, `react`, `react-dom`. |
| Middleware or proxy guarding routes | None | No `middleware.ts` or `proxy.ts` in `apps/web` or `apps/web/src`. |
| Server routes | Two, both anonymous by design | `app/api/analyze` and `app/api/explain`. Neither reads a cookie or an `Authorization` header from the caller. |
| Cookies | None set | Source search found no cookie writes. The privacy page states "RIVET sets no cookies". |
| Only `Authorization` header in source | Outbound, not user auth | `app/api/explain/route.ts:142` sends the server's `OPENAI_API_KEY` to OpenAI. It does not authenticate visitors. |
| Abuse protection on anonymous routes | Present | Per-route in-memory rate limits: analyze, explain (guide), and a tighter limit on explain AI calls. Covered by tests in `app/api/*/route.test.ts`. |
| Secrets in git | None found | `.env.local` and `apps/web/.env.local` are gitignored (confirmed with `git check-ignore`). Their contents were not read. |

## Flows

| Flow | Status | Reason |
|---|---|---|
| Sign up, sign in, sign out | Not applicable | No accounts exist. |
| Google or GitHub OAuth | Not applicable | No provider is configured. `.env.example` lists `GITHUB_CLIENT_ID` and `GITHUB_CLIENT_SECRET` commented out as Phase 2. |
| Email verification, password reset, magic link | Not applicable | No email or password auth. |
| MFA | Not applicable | No accounts. |
| Session expiry, refresh, CSRF on auth routes | Not applicable | No sessions. |
| Protected pages and role checks | Not applicable | Every page is public on purpose. `/dashboard` is a scan tool, not an account area. |
| CLI auth | Not applicable | `rivet scan` runs locally and makes no authenticated calls. |

## Docs that describe auth that does not exist

These are aspirational. They are recorded here so that nobody mistakes them for current
behavior. They were not changed in this pass.

- `docs/API_SPEC.md:41-51` describes a Bearer API key on every request and `POST /auth/login`.
  The real API takes no key and has no login route.
- `docs/ROADMAP.md:202` "User authentication (GitHub OAuth)" is unchecked, which is accurate.
- `docs/ROADMAP.md:240` lists "User accounts & auth" with a check mark under the Phase 2
  deliverables. That list describes the target, not shipped work. Worth rewording.

## Not checked

- The production Vercel project settings (protection, env vars). No console access was used,
  and the brief rules out touching production auth settings.
- Screenshots. There is no auth UI to capture, so `shots/` is empty on purpose.

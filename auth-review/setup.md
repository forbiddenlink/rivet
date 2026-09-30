# Authentication setup

Snapshot as of 2026-09-27.

## Today: nothing to configure

The app runs with no auth configuration. The only secret is `OPENAI_API_KEY`, which is
optional. It turns on AI explanations. Without it, the app serves the built-in guide.
Set it in `apps/web/.env.local` for local work and in the Vercel project environment for
deploys. Do not commit it.

## If you want accounts later

This is a product decision, not a fix. Adding auth introduces a new system: a database, an
auth library, sessions and a provider app. The brief requires approval before that happens.
Decide first what accounts are for. The roadmap names saved scan history and GitHub
integration. A per-user API key for the CLI is the other likely reason.

Once that is decided, the smallest setup would be:

1. **Database.** Postgres (Neon or Supabase) to store users and sessions. Env var:
   `DATABASE_URL`, already named in `.env.example`.
2. **Auth library.** One library, chosen when the feature is scoped. Its session secret goes in
   the env var the library documents. `.env.example` currently names `JWT_SECRET`. Rename it to
   match the chosen library.
3. **GitHub OAuth app.** Create it under GitHub Settings, Developer settings, OAuth Apps. Create
   one app for local and one for production, because each takes a single callback URL.
   - Env vars: `GITHUB_CLIENT_ID`, `GITHUB_CLIENT_SECRET` (already named in `.env.example`).
   - Callback URL: the path the chosen library documents, on each origin. For example,
     `http://localhost:3000/api/auth/callback/github` locally and the production origin with
     the same path. Confirm the exact path against the library's docs before creating the app.
4. **Headers.** The current CSP sets `connect-src 'self'` and `form-action` rules. OAuth
   redirects happen through top-level navigation, so they should not need changes. Re-test
   after the library is in.
5. **Tests that count.** Run a real sign-in against a GitHub test account on a preview deploy.
   Check sign-out, an expired session and a direct hit on a protected route. Mocked tests alone
   do not prove it works.

## Smallest action needed from you

Answer one question: should RIVET have accounts, and for which feature? Until that is
answered, there is nothing to set up.

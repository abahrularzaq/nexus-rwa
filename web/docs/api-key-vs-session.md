# Developer API keys vs production user sessions

Nexus RWA separates internal/developer API-key access from production user access.

## Developer API key

- Intended for internal dashboard development, QA, and server-to-server integrations.
- May be pasted into the dashboard API documentation page to update local curl examples during development.
- If pasted in the browser, it is stored only in `localStorage` under `nexus_api_key`; this is not a secure production-user storage mechanism.
- The browser client must not automatically attach this key to generic API requests.
- Full key values must never be logged, rendered in error boundaries, or included in thrown error messages.

## Production user session

- Intended for end users accessing gated Pro/Enterprise data.
- Should use a short-lived server-managed session or an httpOnly cookie.
- Sensitive endpoint requests should go through the Next.js route handler proxy so credentials stay server-side whenever possible.
- Browser calls may pass wallet context, but raw production secrets should not be stored in localStorage.

## Sensitive endpoints

The Next.js proxy at `/api/proxy/v1/...` is restricted to sensitive gated endpoints such as full asset profiles, history, risk, sources, insights, bulk analytics, export, and Ask Nexus.

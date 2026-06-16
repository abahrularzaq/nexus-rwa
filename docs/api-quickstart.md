# API Quickstart

This guide covers the core operational endpoint for quickly validating that the Nexus RWA API is running and connected to its required background services.

## Health check

Use `GET /health` to check whether the API process is alive, whether the database is reachable, whether schedulers have been registered, which environment mode is active, and which API version is deployed.

```bash
curl http://localhost:3001/health
```

Example response:

```json
{
  "status": "ok",
  "timestamp": "2026-06-14T00:00:00.000Z",
  "api": {
    "status": "ok"
  },
  "database": {
    "status": "ok"
  },
  "scheduler": {
    "status": "active",
    "jobs": {
      "dataSync": "active",
      "riskScore": "active",
      "yieldHistory": "active"
    }
  },
  "environment": {
    "mode": "production"
  },
  "version": "1.0.0"
}
```

### Response fields

| Field | Description |
| --- | --- |
| `status` | Overall API health. Returns `ok` when required checks pass and `degraded` when the database probe fails. |
| `timestamp` | ISO-8601 timestamp generated when the health response is returned. |
| `api.status` | API process status. A returned response means the HTTP process is available, so this should be `ok`. |
| `database.status` | Database reachability from a minimal `SELECT 1` probe. The response intentionally exposes only `ok` or `unavailable` and never returns the connection string, host, username, password, or other credentials. |
| `scheduler.status` | Aggregate scheduler status. Returns `active` after all registered scheduler jobs are started; otherwise returns `starting`. |
| `scheduler.jobs` | Per-job status for data sync, risk scoring, and yield history schedulers. |
| `environment.mode` | Runtime mode from `NODE_ENV`, defaulting to `development` when unset. |
| `version` | Runtime API version from `API_VERSION`, defaulting to `1.0.0` when unset. |

The health endpoint is public and does not require X402 payment headers or an API key. Because it is suitable for load balancers and uptime checks, it avoids returning sensitive database details even when the database is unavailable.

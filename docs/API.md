# Initial API Contract

These endpoints exist for the pilot and are guarded by `DEMO_MODE=true`. Replace that gate with real authentication and workspace authorization before public exposure.

## `GET /api/health`

Returns application and database health.

## `POST /api/v1/planning/generate`

Request:

```json
{
  "workspaceId": "uuid",
  "userId": "uuid",
  "dateKey": "2026-07-28"
}
```

Response: the versioned deterministic mission-selection output. Repeating the same request returns the prior successful output.

## `GET /api/v1/planning/today`

Query parameters: `workspaceId`, `userId`, `dateKey`.

Returns workspace, user, check-in and ordered missions for the date.

## Server actions

The pilot UI uses server actions to generate today's missions and update mission status. These are not a substitute for production authorization.

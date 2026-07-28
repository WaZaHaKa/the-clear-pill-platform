# Implementation Baseline v0.1

## Decisions now locked

1. **Porkbun remains registrar and authoritative DNS provider.** There is no DNS migration to Google Cloud DNS and no domain transfer in this phase.
2. **The existing Hetzner server remains the first deployment target.** The new stack is isolated by Compose project, internal network, named volume, and a loopback-only web port.
3. **Docker Compose comes before K3s.** Introducing a second orchestrator onto a shared production server would increase risk before the product requires it. The code remains containerized and portable so a later K3s/Helm transition is still possible.
4. **Planning is the product spine, not a plugin.** The primary lineage is:

   `five-year plan → annual plan → objective → work item → daily mission → evidence/event`

5. **Daily mission generation is deterministic first.** AI may later propose wording, decomposition, or alternatives, but approved plans are never silently rewritten.
6. **Every generated day is replayable.** Inputs, algorithm version, outputs, status, and execution events are stored.

## First vertical slice

The first usable flow is deliberately narrow:

1. Create or seed a five-year plan.
2. Create an annual plan under it.
3. Define annual objectives with measurable targets.
4. Add ready work items with effort, energy and strategic scoring fields.
5. Record today's capacity and energy, or use workspace defaults.
6. Generate no more than the configured number of daily missions.
7. See why each mission was selected and which objective/plan it serves.
8. Start, complete, skip or reschedule it with evidence or a reason.
9. Preserve all events in the audit trail.

## Runtime shape

```text
Porkbun DNS
    │
Host Nginx + existing ACME automation
    │  proxy to 127.0.0.1:3070 only
    ▼
The Clear Pill Compose project
    ├── web (Next.js UI + route handlers)
    ├── worker (timezone-aware daily generation)
    └── PostgreSQL (internal network only)
```

No application container receives Porkbun credentials. DNS and certificates remain edge/infrastructure concerns.

## Planning invariants

- A daily mission normally points to one work item.
- A work item must point to an objective.
- An objective must point to a plan.
- An annual plan should point to the five-year plan it advances.
- Mission generation may not exceed daily capacity or the mission-count limit.
- Blocked and unavailable work is not selected.
- The same work item is not assigned twice on the same date.
- The same generation key is safe to call repeatedly.
- Completing a mission completes its underlying work item in this first slice.
- Any future AI-generated proposal must be labeled `AI_PROPOSED` and approved before it changes an active plan.

## Deferred on purpose

- Public signup and customer tenancy.
- Production authentication/authorization.
- Email and WhatsApp campaign delivery.
- Full CRM and payment flows.
- AI model/provider router.
- Redis or Temporal.
- K3s, Helm and OpenTofu deployment.
- Automatic Porkbun DNS writes from the application.

These are not rejected; they are sequenced after the planning loop works with Yafa in daily use.

## First production gate

The interface must remain loopback-only or protected staging until identity is implemented. `DEMO_MODE=true` exposes pilot actions and must never be the final public production setting.

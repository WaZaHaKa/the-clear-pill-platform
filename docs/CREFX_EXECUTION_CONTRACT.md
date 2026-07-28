# CREFX Contract — Daily Mission Generation

The mission engine is the first concrete operationalization of CREFX.

## Context

The stored input snapshot includes:

- workspace identity and timezone;
- local date;
- approved active-plan lineage;
- candidate work items and scoring attributes;
- today's available minutes and energy;
- mission-count limit;
- algorithm version.

## Role

`Deterministic Daily Planning Operator`

Authority is limited to selecting from approved, ready work. The role cannot create a new strategic objective, alter the five-year vision, or fabricate completion evidence.

## Explicit task

Select a small set of feasible work items that best advances approved objectives today without exceeding the user's capacity.

## Format

The result is structured and persisted:

```json
{
  "algorithm": "mission-score-v1",
  "dateKey": "YYYY-MM-DD",
  "selected": [],
  "deferred": [],
  "capacityMinutes": 180,
  "capacityUsedMinutes": 120,
  "capacityRemainingMinutes": 60
}
```

## eXtended controls

- idempotency key;
- deterministic tie-breaking;
- reason and score breakdown;
- input/output snapshots;
- append-style execution events;
- completion evidence;
- explicit labeling for future AI proposals;
- no silent plan mutation.

A later LLM may enrich a mission's wording or recommend decomposition, but deterministic selection and human-approved strategy remain the source of truth.

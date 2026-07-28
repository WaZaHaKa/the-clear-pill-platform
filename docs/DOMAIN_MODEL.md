# Planning Domain Model

## Strategic hierarchy

### Plan

A versioned time horizon. Supported horizons are five years, year, quarter, month and week. Plans form a parent/child tree; for example, an annual plan belongs to a five-year plan.

### Objective

A measurable result owned by a plan. Objectives may form their own hierarchy and contain priority, weight, progress and optional metric values.

### Work item

A concrete unit of work linked to one objective. It carries the fields needed for transparent daily selection:

- estimated minutes;
- due and available dates;
- impact;
- urgency;
- strategic fit;
- revenue impact;
- dependency unlock value;
- confidence;
- required energy;
- status and block reason.

### Daily check-in

A per-user, per-date capacity and energy override. If none exists, workspace defaults are used.

### Mission-generation run

An idempotent, versioned execution record. It stores the complete selection input and output snapshots, including deferred candidates and reasons.

### Daily mission

A dated assignment of a work item to a user. It stores a title snapshot, objective path, score, reason, planned effort and status so history remains intelligible even when the work item changes later.

### Mission event and audit event

Append-style records of creation, start, completion, skip, reschedule and broader system actions.

## Required lineage

```text
DailyMission.workItemId
  → WorkItem.objectiveId
    → Objective.planId
      → Plan.parentPlanId (annual → five-year)
```

This is the minimum trace needed to answer: **Why is this today's mission, and which future does it serve?**

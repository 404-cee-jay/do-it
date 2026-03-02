# Database Schema Documentation

**doit - Task Entropy Management System**

This document provides a comprehensive overview of the database architecture for doit, with emphasis on the design decisions that enable the entropy-based task prioritization algorithm.

---

## Overview

The schema is designed around a core principle: **task relevance is a function of priority and temporal interaction patterns**. This architecture enables the entropy algorithm to automatically adjust task visibility without user intervention.

### Technology

- **ORM**: Prisma (type-safe, migration-based)
- **Database**: PostgreSQL 14+
- **Hosting**: Supabase (with Row-Level Security)

---

## Core Tables

### `User`

Handles authentication and task ownership.

```prisma
model User {
  id            String    @id @default(cuid())
  email         String    @unique
  name          String?
  passwordHash  String
  createdAt     DateTime  @default(now())
  updatedAt     DateTime  @updatedAt

  tasks         Task[]

  @@index([email])
}
```

**Key Fields:**

- `id`: CUID for globally unique, URL-safe identifiers
- `email`: Unique constraint ensures one account per email
- `tasks`: One-to-many relationship with Task model

---

### `Task`

The central entity of the application. Every field serves the entropy calculation or user context.

```prisma
model Task {
  id                String    @id @default(cuid())
  title             String
  description       String?
  priority          Priority  @default(MEDIUM)
  status            Status    @default(ACTIVE)
  dueDate           DateTime?

  // ENTROPY FIELDS (Critical)
  lastInteractedAt  DateTime  @default(now())

  // METADATA
  createdAt         DateTime  @default(now())
  updatedAt         DateTime  @updatedAt
  completedAt       DateTime?

  // RELATIONSHIPS
  userId            String
  user              User      @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@index([userId, status, lastInteractedAt])
  @@index([lastInteractedAt])
}

enum Priority {
  LOW
  MEDIUM
  HIGH
}

enum Status {
  ACTIVE
  COMPLETED
  ARCHIVED
}
```

---

## Field-Level Documentation

### Critical: `lastInteractedAt`

**Type:** `DateTime`  
**Default:** `now()` (set on creation)  
**Updated:** On any of the following actions:

- Task viewed (opened in detail view)
- Task edited (title, description, priority changed)
- Task status changed (marked complete/incomplete)
- Task "snoozed" or manually bumped

**Why This Field Matters:**

`lastInteractedAt` is the **temporal component** of the entropy algorithm. It enables tasks to automatically fade based on staleness, answering the question: _"When did the user last care about this?"_

#### Entropy Calculation

```javascript
function calculateEntropy(task) {
  const priorityWeights = { HIGH: 3, MEDIUM: 2, LOW: 1 };
  const daysSinceInteraction = Math.max(
    (Date.now() - task.lastInteractedAt) / (1000 * 60 * 60 * 24),
    0.1, // Prevent division by zero
  );

  return priorityWeights[task.priority] / daysSinceInteraction;
}
```

**Behavior Examples:**

| Task            | Priority | Last Interaction | Days Ago | Entropy Score | Visual Result             |
| --------------- | -------- | ---------------- | -------- | ------------- | ------------------------- |
| "Deploy API"    | HIGH     | 2024-03-02       | 0.1      | 30.0          | 100% opacity, top of list |
| "Review PR"     | MEDIUM   | 2024-03-01       | 1        | 2.0           | 80% opacity, mid-list     |
| "Research tool" | LOW      | 2024-02-20       | 10       | 0.1           | 40% opacity, faded        |

**Without `lastInteractedAt`:**

- All HIGH priority tasks would stay at the top forever
- Completed work from last month competes with today's urgency
- Users manually delete or archive, defeating the "low-friction" goal

**With `lastInteractedAt`:**

- Old HIGH priority tasks fade naturally if ignored
- Recently edited LOW priority tasks can surface above stale HIGH tasks
- The list becomes a **living reflection of actual focus**, not aspirational intent

---

### Other Key Fields

#### `priority` (enum)

**Purpose:** User's manual assessment of importance  
**Values:** `LOW`, `MEDIUM`, `HIGH`  
**Default:** `MEDIUM`  
**Rationale:** Combined with `lastInteractedAt` to calculate entropy. Static without time decay would recreate the "cluttered list" problem.

#### `status` (enum)

**Purpose:** Task lifecycle state  
**Values:** `ACTIVE`, `COMPLETED`, `ARCHIVED`  
**Default:** `ACTIVE`  
**Behavior:**

- `ACTIVE`: Included in entropy calculations, visible in main view
- `COMPLETED`: Moves to "Recently Completed" view, archived after 7 days of no interaction
- `ARCHIVED`: Excluded from all views (queryable for history)

#### `dueDate` (DateTime, optional)

**Purpose:** Hard deadlines for time-sensitive tasks  
**Entropy Impact:** Tasks with `dueDate` within 24 hours receive a 2× entropy multiplier  
**Rationale:** Combines user-set priority with calendar-driven urgency

#### `completedAt` (DateTime, optional)

**Purpose:** Timestamp when status changed to `COMPLETED`  
**Use Case:** Calculate "days since completion" for auto-archiving logic

---

## Indexes

### Composite Index: `[userId, status, lastInteractedAt]`

**Query Pattern:**

```sql
SELECT * FROM "Task"
WHERE "userId" = ?
  AND "status" = 'ACTIVE'
ORDER BY "lastInteractedAt" DESC;
```

**Justification:**

- **userId**: Multi-tenant isolation, every query filters by user
- **status**: Separate active tasks from completed/archived
- **lastInteractedAt**: Sort by recency for entropy calculation

This index covers 90%+ of queries in the app with a single index scan.

### Single Index: `[lastInteractedAt]`

**Query Pattern:** Admin dashboards showing globally stale tasks (for analytics)  
**Use Case:** "Show all tasks not interacted with in 30+ days across all users"

---

## Entropy Algorithm Implementation

### Server-Side Calculation (Recommended)

```typescript
// app/actions/getTasks.ts
import { prisma } from "@/lib/db";

export async function getTasksWithEntropy(userId: string) {
  const tasks = await prisma.task.findMany({
    where: { userId, status: "ACTIVE" },
    orderBy: { lastInteractedAt: "desc" },
  });

  const now = Date.now();
  return tasks
    .map((task) => {
      const entropy = calculateEntropy(task, now);
      return {
        ...task,
        entropy,
        opacity: mapEntropyToOpacity(entropy),
      };
    })
    .sort((a, b) => b.entropy - a.entropy);
}

function mapEntropyToOpacity(entropy: number): number {
  // Map entropy [0, 10+] to opacity [0.4, 1.0]
  return Math.min(1.0, Math.max(0.4, 0.4 + (entropy / 10) * 0.6));
}
```

**Why Server-Side:**

- Consistent calculation across all clients
- Can add Prisma computed fields in future versions
- Reduces client-side JavaScript bundle

---

## Migration Strategy

### Initial Schema (v1.0)

```bash
npx prisma migrate dev --name init
```

Creates:

- `User` table with auth fields
- `Task` table with all fields including `lastInteractedAt`
- Indexes for query performance
- Enums for `Priority` and `Status`

### Future Considerations

**Potential Additions:**

- `InteractionLog` table: Track every interaction for analytics (view, edit, complete)
- `Tag` model: Many-to-many relationship for categorization (without forcing usage)
- `entropyScore` computed field: Cache entropy in DB for very large task lists (10,000+ tasks)

**Non-Goals:**

- Subtasks: Adds complexity, users can use description field or break into separate tasks
- Collaboration: v1 is single-user; multi-user would require `TaskShare` join table

---

## Data Integrity Rules

### Cascade Deletes

```prisma
user User @relation(fields: [userId], references: [id], onDelete: Cascade)
```

**Behavior:** Deleting a user permanently removes all associated tasks  
**Rationale:** GDPR compliance, no orphaned data

### Timestamps

All `DateTime` fields use ISO 8601 format (UTC) for consistency across time zones.

### Required vs Optional

- **Required:** `title`, `priority`, `status`, `lastInteractedAt`, `userId`
- **Optional:** `description`, `dueDate`, `completedAt`

**Design Choice:** Minimize friction during task creation. Users should be able to add a task with just a title and hit Enter.

---

## Performance Considerations

### Query Performance

- Expected task count per user: 20-200 active tasks
- Composite index enables sub-millisecond queries up to 1,000 tasks
- Archiving completed tasks after 7 days prevents unbounded growth

### `lastInteractedAt` Update Frequency

- **Concern:** Updating `lastInteractedAt` on every task view could cause write contention
- **Mitigation:** Debounce updates to once per 5-minute window per task (client-side)
- **Alternative:** Background job updates `lastInteractedAt` daily for tasks viewed but not edited

### Entropy Calculation Cost

- Calculation is `O(n)` where n = active tasks per user
- JavaScript calculation takes ~0.01ms per task
- For 100 tasks: ~1ms total (negligible)

---

## Summary

The schema is intentionally **minimal but opinionated**:

- Every field serves the entropy algorithm or essential user context
- `lastInteractedAt` is the architectural innovation that enables self-organizing task lists
- Indexes optimize for the 90% use case: "Show me my active tasks, sorted by relevance"
- Prisma + PostgreSQL provide type safety and reliable migrations

**The schema embodies the product philosophy:** help users focus on what matters now, let everything else fade gracefully.

---

**Schema Version:** 1.0  
**Last Updated:** March 2, 2026  
**Prisma Version:** 5.x

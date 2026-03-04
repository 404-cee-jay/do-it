# Entropy Engine Documentation

This directory contains the core mathematical logic for EntropyTasks.

## Files

### `entropy.js`
Core entropy calculation algorithm that determines task visibility based on priority and temporal interaction patterns.

**Key Functions:**
- `calculateEntropy(task, now)` - Computes entropy score for a single task
- `applyDueDateMultiplier(task, baseEntropy, now)` - Applies 2× boost for tasks due within 24 hours
- `mapEntropyToOpacity(entropy)` - Converts entropy score to CSS opacity (0.4-1.0)
- `calculateTaskEntropy(tasks, now)` - Batch calculation and sorting for task arrays
- `findStaleTasksForArchiving(tasks, now)` - Identifies tasks eligible for auto-archiving

**Formula:**
```
entropy = (priorityWeight / daysSinceInteraction) × dueDateMultiplier

where:
  priorityWeight = { HIGH: 3, MEDIUM: 2, LOW: 1 }
  daysSinceInteraction = max(actualDays, 0.1)
  dueDateMultiplier = 2.0 if due within 24 hours, else 1.0
```

### `stress.js`
Stress meter calculation for cognitive load tracking.

**Key Functions:**
- `calculateStressMeter(tasks)` - Computes stress score from active task priority weights
- `getStressIndicatorProps(score)` - Returns UI properties (color, label) based on stress level
- `calculateStressMeterWithIndicator(tasks)` - Combined calculation + indicator (convenience)
- `getArchiveRecommendation(tasks, targetScore)` - Suggests tasks to archive to reduce stress

**Formula:**
```
stressScore = Sum(priorityWeights of ACTIVE tasks) / availableCapacity

where:
  availableCapacity = 8 hours/day × 5 days/week × 1.5 slots/hour = 60
```

**Stress Levels:**
- **Healthy** (0-50%): Green - Comfortable capacity
- **Elevated** (50-80%): Yellow - Approaching limits
- **High** (80-100%): Orange - At full capacity
- **Critical** (>100%): Red - Overcommitted

## Auto-Archiving Logic

Tasks are eligible for auto-archiving when:
1. `lastInteractedAt` > 30 days ago
2. `entropy` < 0.5 (very low relevance)
3. `status` = ACTIVE

**Implementation Approaches:**

### Option 1: Manual Trigger (Current)
User manually runs archive sweep via UI button or admin command.

**Pros:**
- Simple, no cron setup needed
- User has full control
- No risk of premature archiving

**Cons:**
- Requires user action
- Graveyard grows indefinitely

### Option 2: Scheduled Cron Job (Recommended for v1.1)
Background job runs daily to archive stale tasks automatically.

**Setup with `node-cron`:**
```javascript
// lib/cron.js
import cron from 'node-cron';
import { prisma } from './db.js';
import { findStaleTasksForArchiving } from '../src/engine/entropy.js';

// Run daily at 3 AM
cron.schedule('0 3 * * *', async () => {
  const users = await prisma.user.findMany();
  
  for (const user of users) {
    const tasks = await prisma.task.findMany({
      where: { userId: user.id, status: 'ACTIVE' }
    });
    
    const staleTasks = findStaleTasksForArchiving(tasks);
    
    if (staleTasks.length > 0) {
      await prisma.task.updateMany({
        where: { id: { in: staleTasks.map(t => t.id) } },
        data: { status: 'ARCHIVED' }
      });
      
      console.log(`Archived ${staleTasks.length} tasks for user ${user.id}`);
    }
  }
});
```

**Vercel Deployment:**
Use Vercel Cron (requires Pro plan) or external cron service (cron-job.org) to hit API endpoint.

```javascript
// app/api/cron/archive/route.js
export async function GET(request) {
  // Verify authorization header
  const authHeader = request.headers.get('authorization');
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return new Response('Unauthorized', { status: 401 });
  }

  // Run archive logic...
  return Response.json({ archived: count });
}
```

### Option 3: On-Demand Check (Hybrid)
Check for stale tasks when user loads board, archive if found.

**Pros:**
- No cron infrastructure needed
- Runs only when necessary

**Cons:**
- Adds latency to page load
- Inconsistent timing

## Testing Entropy Calculations

### Edge Cases to Test

1. **Brand new task (< 2 hours old)**
   ```javascript
   const task = {
     priority: 'HIGH',
     lastInteractedAt: new Date(Date.now() - 1000 * 60 * 60), // 1 hour ago
   };
   const entropy = calculateEntropy(task);
   // Should use actual days (0.04), not MIN_DAYS_THRESHOLD
   ```

2. **Task due in 12 hours**
   ```javascript
   const task = {
     priority: 'MEDIUM',
     lastInteractedAt: daysAgo(5),
     dueDate: new Date(Date.now() + 12 * 60 * 60 * 1000),
   };
   const entropy = calculateEntropy(task);
   // Should get 2× multiplier: (2 / 5) × 2 = 0.8
   ```

3. **Very stale LOW priority task**
   ```javascript
   const task = {
     priority: 'LOW',
     lastInteractedAt: daysAgo(60),
   };
   const entropy = calculateEntropy(task);
   // Should be ~0.017 (very low, candidate for archiving)
   ```

### Unit Test Example

```javascript
import { calculateEntropy, mapEntropyToOpacity } from './entropy.js';

describe('Entropy Engine', () => {
  test('HIGH priority recent task has high entropy', () => {
    const task = {
      priority: 'HIGH',
      lastInteractedAt: new Date(Date.now() - 1000 * 60 * 60 * 24), // 1 day ago
    };
    
    const entropy = calculateEntropy(task);
    expect(entropy).toBeGreaterThan(2.5); // HIGH=3, 1 day = 3/1 = 3.0
  });

  test('Opacity maps correctly', () => {
    expect(mapEntropyToOpacity(0)).toBe(0.4);  // Minimum opacity
    expect(mapEntropyToOpacity(10)).toBe(1.0); // Maximum opacity
    expect(mapEntropyToOpacity(5)).toBe(0.7);  // Mid-range
  });
});
```

## Future Enhancements

1. **User-Configurable Weights**
   - Allow users to adjust priority weights (e.g., HIGH=5 instead of 3)
   - Store in user preferences table

2. **Contextual Entropy**
   - Factor in task tags/categories
   - Boost tasks in currently active project

3. **Machine Learning**
   - Learn user's actual completion patterns
   - Predict task completion likelihood
   - Adjust entropy based on historical behavior

4. **Team Entropy**
   - Shared tasks with collaborative entropy
   - Task "hot potato" detection (passed between users without completion)

---

**Last Updated:** March 4, 2026  
**Version:** 1.0

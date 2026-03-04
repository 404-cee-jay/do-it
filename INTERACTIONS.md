# Task Interaction Triggers

This document defines exactly when `lastInteractedAt` is updated to prevent database write overload while maintaining accurate entropy calculations.

## When `lastInteractedAt` IS Updated ✅

1. **Task Title Edited**
   - User clicks on task title and changes text
   - Triggers: `updateTask()` Server Action
   - Rationale: Editing shows active engagement

2. **Task Description Edited**
   - User modifies description field
   - Triggers: `updateTask()` Server Action
   - Rationale: Content changes indicate task is still relevant

3. **Priority Changed**
   - User changes priority dropdown (LOW → MEDIUM → HIGH)
   - Triggers: `updateTask()` Server Action with `{ priority: newValue }`
   - Rationale: Re-prioritizing signals renewed focus

4. **Status Toggled**
   - User checks/unchecks task checkbox (ACTIVE ↔ COMPLETED)
   - Triggers: `toggleTaskStatus()` Server Action
   - Rationale: Completion or reopening is explicit interaction

5. **Manual Bump**
   - User clicks "⬆️" bump button
   - Triggers: `bumpTask()` Server Action
   - Rationale: User explicitly wants task to stay visible
   - Use case: "I haven't worked on this but don't want it to fade"

6. **Task Resurrected from Graveyard**
   - User clicks "Restore" in Graveyard sidebar
   - Triggers: `resurrectTask()` Server Action
   - Rationale: Reviving archived task signals renewed importance

7. **Task Moved to Column** (future feature)
   - Drag-and-drop between Kanban columns
   - Would trigger: `updateTask()` Server Action with `{ column: newColumn }`
   - Rationale: Moving indicates progress/status change

## When `lastInteractedAt` is NOT Updated ❌

1. **Passive Viewing**
   - Scrolling past task in list view
   - Task visible on screen
   - Rationale: Prevents write spam, viewing ≠ engagement

2. **Opening Detail Modal** (future feature)
   - Clicking task to view details without editing
   - Rationale: Read-only action, no commitment change

3. **Sorting/Filtering**
   - Changing task display order
   - Filtering by priority/status
   - Rationale: UI manipulation, not task interaction

4. **Auto-Archive**
   - System moves task to ARCHIVED status (stale detection)
   - Does NOT update `lastInteractedAt` (intentionally stale)
   - Rationale: Preserve timestamp showing why it was archived

## Implementation Details

### Debouncing Strategy

**Current:** No debouncing (each action updates immediately)

**Rationale:**
- Update frequency is low (max ~10-20 per session)
- Immediate updates provide instant visual feedback (opacity changes)
- Debouncing would require client-side state tracking and risk data loss

**Future Consideration:**
- If write load becomes issue (>1000 users), batch updates every 5 minutes
- Use Redis to cache latest `lastInteractedAt` in memory
- Sync to PostgreSQL on interval or session end

### Database Write Impact

**Current Load:**
- Average user: ~20 active tasks × 5 interactions/day = 100 writes/day
- 100 users = 10,000 writes/day
- PostgreSQL easily handles this (can do 1000+ writes/second)

**At Scale (10,000 users):**
- 1M writes/day = ~12 writes/second
- Still well within PostgreSQL capacity
- No optimization needed until 100K+ users

### Entropy Recalculation Frequency

**When does entropy refresh?**
- On every page load (server-side calculation in `getTasksWithEntropy()`)
- After any mutation (via `revalidatePath('/')` in Server Actions)
- No polling/websocket needed

**Why this works:**
- User sees fresh entropy immediately after their actions
- Other users' actions don't affect your task list (single-user app)
- Server Components eliminate stale data issues

## Testing Interaction Updates

### Manual Testing Checklist

```bash
# 1. Start Prisma Studio to watch database
npx prisma studio

# 2. Perform each interaction type
- [ ] Edit task title → Check lastInteractedAt updated
- [ ] Change priority → Check lastInteractedAt updated
- [ ] Toggle status → Check lastInteractedAt updated
- [ ] Bump task → Check lastInteractedAt updated
- [ ] Scroll past task → Verify lastInteractedAt NOT changed
- [ ] Archive task → Check lastInteractedAt updated
- [ ] Resurrect task → Check lastInteractedAt updated
```

### Automated Testing (future)

```javascript
// Example test case
describe('Task Interaction Tracking', () => {
  it('should update lastInteractedAt when title is edited', async () => {
    const task = await createTask(userId, { title: 'Original' });
    const originalTimestamp = task.lastInteractedAt;
    
    await sleep(100); // Ensure time passes
    
    await updateTask(task.id, { title: 'Updated' });
    const updated = await getTask(task.id);
    
    expect(updated.lastInteractedAt).toBeGreaterThan(originalTimestamp);
  });

  it('should NOT update lastInteractedAt on passive view', async () => {
    // This would require view tracking endpoint, not implemented
    // Passive views intentionally don't trigger updates
  });
});
```

## Monitoring Recommendations

Track these metrics in production:

1. **Average `lastInteractedAt` updates per user per day**
   - Healthy: 5-20 updates/day
   - High: 50+ updates/day (investigate UI causing excessive updates)

2. **Database write latency**
   - Monitor `UPDATE Task SET lastInteractedAt` query times
   - Alert if >100ms (indicates index issues)

3. **Tasks with stale `lastInteractedAt`**
   - Count tasks with `lastInteractedAt > 30 days ago`
   - High count → Auto-archive working correctly
   - Low count → Users may be over-bumping tasks

## Future Optimizations

If write load becomes an issue:

1. **Batch Updates:**
   ```javascript
   // Update multiple tasks at once
   await prisma.task.updateMany({
     where: { id: { in: taskIds } },
     data: { lastInteractedAt: new Date() }
   });
   ```

2. **Background Worker:**
   - Queue interaction updates in Redis
   - Flush to PostgreSQL every 5 minutes
   - Trade real-time accuracy for write efficiency

3. **Last-Write-Wins Strategy:**
   - Store timestamp in localStorage during session
   - Sync on session end (browser close)
   - Risk: Lost updates if browser crashes

**Current Recommendation:** No optimization needed until 10K+ users.

---

**Document Version:** 1.0  
**Last Updated:** March 4, 2026  
**Related:** [SCHEMA.md](SCHEMA.md), [src/actions/taskActions.js](src/actions/taskActions.js)

/**
 * Entropy Engine - Core calculation logic for task relevance
 * 
 * This module implements the entropy algorithm that automatically prioritizes
 * tasks based on priority level and temporal interaction patterns.
 * 
 * Key Principles:
 * - High priority tasks decay slower than low priority tasks
 * - Recently interacted tasks have higher entropy (more visible)
 * - Entropy determines visual opacity (0.4 to 1.0)
 * - Due dates within 24 hours receive 2× multiplier
 */

/**
 * Priority weight mapping for entropy calculations
 * @type {Object.<string, number>}
 */
const PRIORITY_WEIGHTS = {
  HIGH: 3,
  MEDIUM: 2,
  LOW: 1,
};

/**
 * Minimum days value to prevent artificial entropy inflation
 * Tasks interacted with in last 2.4 hours use actual time, not this minimum
 * @type {number}
 */
const MIN_DAYS_THRESHOLD = 0.1;

/**
 * Calculates entropy score for a task
 * 
 * Formula: entropy = (priorityWeight / daysSinceInteraction) × dueDateMultiplier
 * 
 * @param {Object} task - Task object from database
 * @param {string} task.priority - Priority level (HIGH, MEDIUM, LOW)
 * @param {Date|string} task.lastInteractedAt - Last interaction timestamp
 * @param {Date|string|null} task.dueDate - Optional due date
 * @param {Date} [now=new Date()] - Current time (injectable for testing)
 * @returns {number} Entropy score (typically 0.1 to 30+)
 * 
 * @example
 * const task = {
 *   priority: 'HIGH',
 *   lastInteractedAt: new Date('2026-03-04T10:00:00Z'),
 *   dueDate: null
 * };
 * const entropy = calculateEntropy(task);
 * // Returns ~30 for task interacted with today
 */
export function calculateEntropy(task, now = new Date()) {
  const priorityWeight = PRIORITY_WEIGHTS[task.priority] || PRIORITY_WEIGHTS.MEDIUM;
  
  // Convert lastInteractedAt to Date object if it's a string
  const lastInteraction = typeof task.lastInteractedAt === 'string' 
    ? new Date(task.lastInteractedAt) 
    : task.lastInteractedAt;
  
  // Calculate days since last interaction
  const millisecondsSinceInteraction = now.getTime() - lastInteraction.getTime();
  const actualDays = millisecondsSinceInteraction / (1000 * 60 * 60 * 24);
  
  // Use actual days if greater than threshold, otherwise use minimum
  // This prevents artificial inflation for very recent tasks
  const daysSinceInteraction = Math.max(actualDays, MIN_DAYS_THRESHOLD);
  
  // Base entropy calculation
  let entropy = priorityWeight / daysSinceInteraction;
  
  // Apply due date multiplier if applicable
  entropy = applyDueDateMultiplier(task, entropy, now);
  
  return entropy;
}

/**
 * Applies 2× multiplier to entropy if task is due within 24 hours
 * 
 * @param {Object} task - Task object
 * @param {Date|string|null} task.dueDate - Optional due date
 * @param {number} baseEntropy - Pre-calculated entropy score
 * @param {Date} [now=new Date()] - Current time
 * @returns {number} Entropy with multiplier applied (if applicable)
 * 
 * @example
 * const task = { dueDate: new Date(Date.now() + 12 * 60 * 60 * 1000) }; // 12 hours from now
 * const entropy = applyDueDateMultiplier(task, 5.0);
 * // Returns 10.0 (2× multiplier)
 */
export function applyDueDateMultiplier(task, baseEntropy, now = new Date()) {
  if (!task.dueDate) {
    return baseEntropy;
  }
  
  const dueDate = typeof task.dueDate === 'string' 
    ? new Date(task.dueDate) 
    : task.dueDate;
  
  const hoursUntilDue = (dueDate.getTime() - now.getTime()) / (1000 * 60 * 60);
  
  // Apply 2× multiplier if due within 24 hours and not yet overdue
  if (hoursUntilDue > 0 && hoursUntilDue <= 24) {
    return baseEntropy * 2.0;
  }
  
  return baseEntropy;
}

/**
 * Maps entropy score to CSS opacity value (0.4 to 1.0 range)
 * 
 * - High entropy (10+): 100% opacity (fully visible)
 * - Medium entropy (5): 70% opacity
 * - Low entropy (0.5): 40% opacity (faded, "sinking")
 * 
 * @param {number} entropy - Calculated entropy score
 * @returns {number} Opacity value between 0.4 and 1.0
 * 
 * @example
 * mapEntropyToOpacity(15); // Returns 1.0 (fully visible)
 * mapEntropyToOpacity(5);  // Returns 0.7 (medium visibility)
 * mapEntropyToOpacity(0.5); // Returns 0.4 (faded)
 */
export function mapEntropyToOpacity(entropy) {
  // Map entropy range [0, 10+] to opacity range [0.4, 1.0]
  // Formula: opacity = 0.4 + (entropy / 10) * 0.6
  const normalizedEntropy = Math.min(entropy / 10, 1.0);
  const opacity = 0.4 + normalizedEntropy * 0.6;
  
  return Math.max(0.4, Math.min(1.0, opacity));
}

/**
 * Calculates entropy for multiple tasks and sorts by score (highest first)
 * 
 * @param {Array<Object>} tasks - Array of task objects
 * @param {Date} [now=new Date()] - Current time for consistent calculations
 * @returns {Array<Object>} Tasks with added entropy and opacity fields, sorted
 * 
 * @example
 * const tasks = await prisma.task.findMany({ where: { userId } });
 * const enrichedTasks = calculateTaskEntropy(tasks);
 * // Each task now has: { ...task, entropy: 5.2, opacity: 0.71 }
 */
export function calculateTaskEntropy(tasks, now = new Date()) {
  return tasks
    .map(task => {
      const entropy = calculateEntropy(task, now);
      const opacity = mapEntropyToOpacity(entropy);
      
      return {
        ...task,
        entropy,
        opacity,
      };
    })
    .sort((a, b) => b.entropy - a.entropy); // Sort highest entropy first
}

/**
 * Identifies tasks eligible for auto-archiving
 * 
 * Criteria:
 * - lastInteractedAt > 30 days ago
 * - entropy < 0.5 (very low relevance)
 * - status is ACTIVE (not already completed/archived)
 * 
 * @param {Array<Object>} tasks - Array of task objects
 * @param {Date} [now=new Date()] - Current time
 * @returns {Array<Object>} Tasks that should be archived
 */
export function findStaleTasksForArchiving(tasks, now = new Date()) {
  const STALE_THRESHOLD_DAYS = 30;
  const LOW_ENTROPY_THRESHOLD = 0.5;
  
  return tasks.filter(task => {
    if (task.status !== 'ACTIVE') {
      return false;
    }
    
    const lastInteraction = typeof task.lastInteractedAt === 'string'
      ? new Date(task.lastInteractedAt)
      : task.lastInteractedAt;
    
    const daysSinceInteraction = (now.getTime() - lastInteraction.getTime()) / (1000 * 60 * 60 * 24);
    const entropy = calculateEntropy(task, now);
    
    return daysSinceInteraction > STALE_THRESHOLD_DAYS && entropy < LOW_ENTROPY_THRESHOLD;
  });
}

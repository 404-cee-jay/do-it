/**
 * Stress Meter Calculation Engine
 * 
 * Calculates cognitive load based on active task priority and available work capacity.
 * Helps users recognize when they're overcommitted before burnout occurs.
 * 
 * Formula: Stress Score = Sum(Priority Weights of Active Tasks) / Available Work Capacity
 * 
 * Available Capacity = 8 hours/day × 12 slots/week = 96 work slots
 * (Assumes 5-day work week with weekends off)
 */

/**
 * Priority weight mapping (matches entropy.js)
 * @type {Object.<string, number>}
 */
const PRIORITY_WEIGHTS = {
  HIGH: 3,
  MEDIUM: 2,
  LOW: 1,
};

/**
 * Work capacity constants
 * Adjustable based on user preferences or team policies
 */
const WORK_HOURS_PER_DAY = 8;
const WORK_DAYS_PER_WEEK = 5;
const SLOTS_PER_HOUR = 1.5; // Assumes ~40min per task slot with breaks

// Total available work capacity per week
const AVAILABLE_CAPACITY = WORK_HOURS_PER_DAY * WORK_DAYS_PER_WEEK * SLOTS_PER_HOUR;

/**
 * Stress level thresholds for color coding
 */
const STRESS_LEVELS = {
  HEALTHY: {
    name: 'healthy',
    threshold: 0.5,
    color: '#22c55e', // green-500
    label: 'Healthy Load',
    description: 'You have comfortable capacity',
  },
  ELEVATED: {
    name: 'elevated',
    threshold: 0.8,
    color: '#eab308', // yellow-500
    label: 'Elevated Load',
    description: 'Approaching capacity limits',
  },
  HIGH: {
    name: 'high',
    threshold: 1.0,
    color: '#ea580c', // orange-600
    label: 'High Load',
    description: 'At or near full capacity',
  },
  CRITICAL: {
    name: 'critical',
    threshold: Infinity,
    color: '#dc2626', // red-700
    label: 'Critical Overload',
    description: 'Overcommitted - consider archiving low-priority tasks',
  },
};

/**
 * Calculates stress meter score from active tasks
 * 
 * @param {Array<Object>} tasks - Array of task objects
 * @param {string} tasks[].priority - Priority level (HIGH, MEDIUM, LOW)
 * @param {string} tasks[].status - Task status (ACTIVE, COMPLETED, ARCHIVED)
 * @returns {Object} Stress calculation result
 * @returns {number} return.score - Stress score (0 to 1+ where 1.0 = 100% capacity)
 * @returns {number} return.totalWeight - Sum of priority weights
 * @returns {number} return.capacity - Available work capacity
 * @returns {number} return.percentage - Stress as percentage (0-100+)
 * 
 * @example
 * const tasks = [
 *   { priority: 'HIGH', status: 'ACTIVE' },
 *   { priority: 'MEDIUM', status: 'ACTIVE' },
 *   { priority: 'LOW', status: 'ACTIVE' },
 * ];
 * const result = calculateStressMeter(tasks);
 * // Returns: { score: 0.10, totalWeight: 6, capacity: 60, percentage: 10 }
 */
export function calculateStressMeter(tasks) {
  // Sum priority weights for active tasks only
  const totalWeight = tasks
    .filter(task => task.status === 'ACTIVE')
    .reduce((sum, task) => {
      const weight = PRIORITY_WEIGHTS[task.priority] || PRIORITY_WEIGHTS.MEDIUM;
      return sum + weight;
    }, 0);
  
  // Calculate stress score (ratio of load to capacity)
  const score = totalWeight / AVAILABLE_CAPACITY;
  const percentage = Math.round(score * 100);
  
  return {
    score,
    totalWeight,
    capacity: AVAILABLE_CAPACITY,
    percentage,
  };
}

/**
 * Determines stress level and visual properties based on score
 * 
 * @param {number} score - Stress score from calculateStressMeter
 * @returns {Object} Stress level properties for UI rendering
 * @returns {string} return.level - Level name (healthy, elevated, high, critical)
 * @returns {string} return.color - Hex color code for visualization
 * @returns {string} return.label - Human-readable label
 * @returns {string} return.description - Explanatory text for users
 * 
 * @example
 * const props = getStressIndicatorProps(0.65);
 * // Returns: {
 * //   level: 'elevated',
 * //   color: '#eab308',
 * //   label: 'Elevated Load',
 * //   description: 'Approaching capacity limits'
 * // }
 */
export function getStressIndicatorProps(score) {
  if (score < STRESS_LEVELS.HEALTHY.threshold) {
    return STRESS_LEVELS.HEALTHY;
  } else if (score < STRESS_LEVELS.ELEVATED.threshold) {
    return STRESS_LEVELS.ELEVATED;
  } else if (score < STRESS_LEVELS.HIGH.threshold) {
    return STRESS_LEVELS.HIGH;
  } else {
    return STRESS_LEVELS.CRITICAL;
  }
}

/**
 * Generates complete stress meter data for UI components
 * 
 * Combines calculation and indicator logic for single-call convenience
 * 
 * @param {Array<Object>} tasks - Array of task objects
 * @returns {Object} Complete stress meter data
 * @returns {number} return.score - Stress score (0 to 1+)
 * @returns {number} return.percentage - Percentage (0-100+)
 * @returns {string} return.level - Stress level name
 * @returns {string} return.color - Color for UI
 * @returns {string} return.label - Display label
 * @returns {string} return.description - Help text
 * 
 * @example
 * const stressMeterData = calculateStressMeterWithIndicator(tasks);
 * // Use in component: <div style={{ backgroundColor: stressMeterData.color }}>
 */
export function calculateStressMeterWithIndicator(tasks) {
  const calculation = calculateStressMeter(tasks);
  const indicator = getStressIndicatorProps(calculation.score);
  
  return {
    score: calculation.score,
    percentage: calculation.percentage,
    totalWeight: calculation.totalWeight,
    capacity: calculation.capacity,
    level: indicator.level,
    color: indicator.color,
    label: indicator.label,
    description: indicator.description,
  };
}

/**
 * Suggests how many tasks should be archived to reach healthy stress level
 * 
 * @param {Array<Object>} tasks - Array of active task objects
 * @param {number} targetScore - Desired stress score (default: 0.5 for healthy)
 * @returns {Object} Recommendation
 * @returns {number} return.tasksToArchive - Suggested number of tasks to archive
 * @returns {Array<Object>} return.candidates - Tasks to consider archiving (sorted by low entropy)
 * 
 * @example
 * const recommendation = getArchiveRecommendation(tasks);
 * // Returns: { tasksToArchive: 3, candidates: [task1, task2, task3] }
 */
export function getArchiveRecommendation(tasks, targetScore = 0.5) {
  const activeTasks = tasks.filter(task => task.status === 'ACTIVE');
  const currentCalculation = calculateStressMeter(activeTasks);
  
  if (currentCalculation.score <= targetScore) {
    return {
      tasksToArchive: 0,
      candidates: [],
    };
  }
  
  // Sort tasks by priority weight (LOW first) - candidates for archiving
  const sortedByPriority = [...activeTasks].sort((a, b) => {
    const weightA = PRIORITY_WEIGHTS[a.priority] || PRIORITY_WEIGHTS.MEDIUM;
    const weightB = PRIORITY_WEIGHTS[b.priority] || PRIORITY_WEIGHTS.MEDIUM;
    return weightA - weightB;
  });
  
  // Calculate how many tasks to remove to reach target
  const targetWeight = targetScore * AVAILABLE_CAPACITY;
  const excessWeight = currentCalculation.totalWeight - targetWeight;
  
  let removedWeight = 0;
  let tasksToArchive = 0;
  
  for (const task of sortedByPriority) {
    if (removedWeight >= excessWeight) break;
    
    const weight = PRIORITY_WEIGHTS[task.priority] || PRIORITY_WEIGHTS.MEDIUM;
    removedWeight += weight;
    tasksToArchive++;
  }
  
  return {
    tasksToArchive,
    candidates: sortedByPriority.slice(0, tasksToArchive),
  };
}

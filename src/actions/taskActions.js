'use server';

/**
 * Task Server Actions
 * 
 * All database mutations and queries for tasks.
 * Uses Next.js Server Actions for automatic serialization and client-side calling.
 * 
 * IMPORTANT: lastInteractedAt updates only on explicit actions:
 * - Edit (title, description changed)
 * - Priority change
 * - Status toggle
 * - Manual bump
 * - Resurrect from Graveyard
 * 
 * NOT updated on passive viewing/scrolling.
 */

import { prisma } from '../lib/db.js';
import { calculateTaskEntropy, findStaleTasksForArchiving } from '../engine/entropy.js';
import { revalidatePath } from 'next/cache';

/**
 * Fetches all active tasks for a user with entropy calculations
 * 
 * @param {string} userId - User ID to fetch tasks for
 * @returns {Promise<Array<Object>>} Tasks with entropy and opacity fields
 */
export async function getTasksWithEntropy(userId) {
  const tasks = await prisma.task.findMany({
    where: {
      userId,
      status: 'ACTIVE',
    },
    orderBy: {
      lastInteractedAt: 'desc',
    },
  });

  // Calculate entropy and add to each task
  const tasksWithEntropy = calculateTaskEntropy(tasks);
  
  return tasksWithEntropy;
}

/**
 * Fetches archived tasks (for Graveyard sidebar)
 * 
 * @param {string} userId - User ID
 * @returns {Promise<Array<Object>>} Archived tasks
 */
export async function getArchivedTasks(userId) {
  const tasks = await prisma.task.findMany({
    where: {
      userId,
      status: 'ARCHIVED',
    },
    orderBy: {
      updatedAt: 'desc',
    },
  });

  return tasks;
}

/**
 * Fetches recently completed tasks (last 7 days)
 * 
 * @param {string} userId - User ID
 * @returns {Promise<Array<Object>>} Completed tasks from last 7 days
 */
export async function getRecentlyCompletedTasks(userId) {
  const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
  
  const tasks = await prisma.task.findMany({
    where: {
      userId,
      status: 'COMPLETED',
      completedAt: {
        gte: sevenDaysAgo,
      },
    },
    orderBy: {
      completedAt: 'desc',
    },
  });

  return tasks;
}

/**
 * Creates a new task
 * 
 * @param {string} userId - User ID
 * @param {Object} taskData - Task creation data
 * @param {string} taskData.title - Task title (required)
 * @param {string} [taskData.description] - Task description
 * @param {string} [taskData.priority='MEDIUM'] - Priority level
 * @param {string} [taskData.column='TODO'] - Kanban column
 * @param {Date} [taskData.dueDate] - Due date
 * @returns {Promise<Object>} Created task
 */
export async function createTask(userId, taskData) {
  const task = await prisma.task.create({
    data: {
      userId,
      title: taskData.title,
      description: taskData.description,
      priority: taskData.priority || 'MEDIUM',
      column: taskData.column || 'TODO',
      dueDate: taskData.dueDate,
      lastInteractedAt: new Date(), // Set on creation
    },
  });

  revalidatePath('/');
  return task;
}

/**
 * Updates task interaction timestamp
 * Called when user explicitly interacts with task (edit, priority change, status toggle)
 * 
 * @param {string} taskId - Task ID to update
 * @returns {Promise<Object>} Updated task
 */
export async function updateTaskInteraction(taskId) {
  const task = await prisma.task.update({
    where: { id: taskId },
    data: {
      lastInteractedAt: new Date(),
    },
  });

  revalidatePath('/');
  return task;
}

/**
 * Updates task properties (triggers lastInteractedAt update)
 * 
 * @param {string} taskId - Task ID
 * @param {Object} updates - Fields to update
 * @returns {Promise<Object>} Updated task
 */
export async function updateTask(taskId, updates) {
  const task = await prisma.task.update({
    where: { id: taskId },
    data: {
      ...updates,
      lastInteractedAt: new Date(), // Update interaction timestamp
    },
  });

  revalidatePath('/');
  return task;
}

/**
 * Toggles task status between ACTIVE and COMPLETED
 * 
 * @param {string} taskId - Task ID
 * @returns {Promise<Object>} Updated task
 */
export async function toggleTaskStatus(taskId) {
  const task = await prisma.task.findUnique({
    where: { id: taskId },
  });

  if (!task) {
    throw new Error('Task not found');
  }

  const newStatus = task.status === 'ACTIVE' ? 'COMPLETED' : 'ACTIVE';
  const completedAt = newStatus === 'COMPLETED' ? new Date() : null;

  const updated = await prisma.task.update({
    where: { id: taskId },
    data: {
      status: newStatus,
      completedAt,
      lastInteractedAt: new Date(),
    },
  });

  revalidatePath('/');
  return updated;
}

/**
 * Manually archives a task (moves to Graveyard)
 * 
 * @param {string} taskId - Task ID
 * @returns {Promise<Object>} Updated task
 */
export async function archiveTask(taskId) {
  const task = await prisma.task.update({
    where: { id: taskId },
    data: {
      status: 'ARCHIVED',
      lastInteractedAt: new Date(),
    },
  });

  revalidatePath('/');
  return task;
}

/**
 * Resurrects task from Graveyard back to ACTIVE
 * 
 * @param {string} taskId - Task ID
 * @returns {Promise<Object>} Updated task
 */
export async function resurrectTask(taskId) {
  const task = await prisma.task.update({
    where: { id: taskId },
    data: {
      status: 'ACTIVE',
      lastInteractedAt: new Date(), // Revive with fresh timestamp
    },
  });

  revalidatePath('/');
  return task;
}

/**
 * Deletes a task permanently
 * 
 * @param {string} taskId - Task ID
 * @returns {Promise<Object>} Deleted task
 */
export async function deleteTask(taskId) {
  const task = await prisma.task.delete({
    where: { id: taskId },
  });

  revalidatePath('/');
  return task;
}

/**
 * Finds and archives stale tasks (30+ days without interaction, low entropy)
 * 
 * @param {string} userId - User ID
 * @returns {Promise<Array<Object>>} Archived tasks
 */
export async function autoArchiveStaleTasks(userId) {
  const tasks = await prisma.task.findMany({
    where: {
      userId,
      status: 'ACTIVE',
    },
  });

  const staleTasks = findStaleTasksForArchiving(tasks);
  
  if (staleTasks.length === 0) {
    return [];
  }

  const staleTaskIds = staleTasks.map(task => task.id);
  
  await prisma.task.updateMany({
    where: {
      id: {
        in: staleTaskIds,
      },
    },
    data: {
      status: 'ARCHIVED',
    },
  });

  revalidatePath('/');
  return staleTasks;
}

/**
 * Manual "bump" action - refreshes lastInteractedAt without other changes
 * Useful for keeping a task visible when user wants to prevent it from fading
 * 
 * @param {string} taskId - Task ID
 * @returns {Promise<Object>} Updated task
 */
export async function bumpTask(taskId) {
  return updateTaskInteraction(taskId);
}

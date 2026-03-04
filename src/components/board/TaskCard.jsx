'use client';

/**
 * TaskCard Component
 * 
 * Displays individual task with entropy-based opacity.
 * Handles inline editing, priority changes, and status toggles.
 * Each interaction updates lastInteractedAt via Server Actions.
 */

import { useState } from 'react';
import { motion } from 'framer-motion';
import { updateTask, toggleTaskStatus, archiveTask, bumpTask } from '../../actions/taskActions.js';

/**
 * Priority badge colors
 */
const PRIORITY_COLORS = {
  HIGH: 'bg-red-100 text-red-800 border-red-300',
  MEDIUM: 'bg-yellow-100 text-yellow-800 border-yellow-300',
  LOW: 'bg-green-100 text-green-800 border-green-300',
};

/**
 * @param {Object} props
 * @param {Object} props.task - Task object with entropy and opacity
 * @param {string} props.task.id - Task ID
 * @param {string} props.task.title - Task title
 * @param {string} props.task.description - Task description
 * @param {string} props.task.priority - Priority level
 * @param {string} props.task.status - Task status
 * @param {number} props.task.opacity - Calculated opacity (0.4-1.0)
 * @param {number} props.task.entropy - Calculated entropy score
 */
export default function TaskCard({ task }) {
  const [isEditing, setIsEditing] = useState(false);
  const [title, setTitle] = useState(task.title);
  const [description, setDescription] = useState(task.description || '');
  const [isUpdating, setIsUpdating] = useState(false);

  const handleSave = async () => {
    if (!title.trim()) return;
    
    setIsUpdating(true);
    try {
      await updateTask(task.id, {
        title: title.trim(),
        description: description.trim() || null,
      });
      setIsEditing(false);
    } catch (error) {
      console.error('Failed to update task:', error);
    } finally {
      setIsUpdating(false);
    }
  };

  const handlePriorityChange = async (newPriority) => {
    setIsUpdating(true);
    try {
      await updateTask(task.id, { priority: newPriority });
    } catch (error) {
      console.error('Failed to update priority:', error);
    } finally {
      setIsUpdating(false);
    }
  };

  const handleStatusToggle = async () => {
    setIsUpdating(true);
    try {
      await toggleTaskStatus(task.id);
    } catch (error) {
      console.error('Failed to toggle status:', error);
    } finally {
      setIsUpdating(false);
    }
  };

  const handleArchive = async () => {
    if (!confirm('Move this task to the Graveyard?')) return;
    
    setIsUpdating(true);
    try {
      await archiveTask(task.id);
    } catch (error) {
      console.error('Failed to archive task:', error);
    } finally {
      setIsUpdating(false);
    }
  };

  const handleBump = async () => {
    setIsUpdating(true);
    try {
      await bumpTask(task.id);
    } catch (error) {
      console.error('Failed to bump task:', error);
    } finally {
      setIsUpdating(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: task.opacity, y: 0 }}
      exit={{ opacity: 0, scale: 0.95 }}
      transition={{ duration: 0.3 }}
      className="task-card task-fade bg-white rounded-lg border border-gray-200 p-4 shadow-sm hover:shadow-md transition-shadow"
      style={{ opacity: task.opacity }}
    >
      {/* Header: Checkbox + Title */}
      <div className="flex items-start gap-3 mb-2">
        <input
          type="checkbox"
          checked={task.status === 'COMPLETED'}
          onChange={handleStatusToggle}
          disabled={isUpdating}
          className="mt-1 w-4 h-4 text-blue-600 rounded focus:ring-2 focus:ring-blue-500"
        />
        
        {isEditing ? (
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            onBlur={handleSave}
            onKeyDown={(e) => {
              if (e.key === 'Enter') handleSave();
              if (e.key === 'Escape') {
                setTitle(task.title);
                setIsEditing(false);
              }
            }}
            autoFocus
            className="flex-1 px-2 py-1 border border-blue-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        ) : (
          <h3
            onClick={() => setIsEditing(true)}
            className="flex-1 font-medium text-gray-900 cursor-pointer hover:text-blue-600"
          >
            {task.title}
          </h3>
        )}
      </div>

      {/* Description */}
      {(description || isEditing) && (
        <div className="ml-7 mb-3">
          {isEditing ? (
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              onBlur={handleSave}
              placeholder="Add description..."
              className="w-full px-2 py-1 text-sm border border-gray-200 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
              rows={2}
            />
          ) : (
            <p className="text-sm text-gray-600">{task.description}</p>
          )}
        </div>
      )}

      {/* Footer: Priority + Actions */}
      <div className="flex items-center justify-between ml-7">
        <div className="flex items-center gap-2">
          {/* Priority Dropdown */}
          <select
            value={task.priority}
            onChange={(e) => handlePriorityChange(e.target.value)}
            disabled={isUpdating}
            className={`px-2 py-1 text-xs font-medium border rounded ${PRIORITY_COLORS[task.priority]}`}
          >
            <option value="LOW">Low</option>
            <option value="MEDIUM">Medium</option>
            <option value="HIGH">High</option>
          </select>

          {/* Entropy Score (for debugging/visibility) */}
          <span className="text-xs text-gray-400" title={`Entropy: ${task.entropy.toFixed(2)}`}>
            {task.entropy.toFixed(1)}
          </span>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-2">
          <button
            onClick={handleBump}
            disabled={isUpdating}
            className="text-xs text-gray-500 hover:text-blue-600 transition-colors"
            title="Bump task to top (refresh interaction)"
          >
            ⬆️
          </button>
          <button
            onClick={handleArchive}
            disabled={isUpdating}
            className="text-xs text-gray-500 hover:text-red-600 transition-colors"
            title="Move to Graveyard"
          >
            🗑️
          </button>
        </div>
      </div>

      {/* Due Date (if exists) */}
      {task.dueDate && (
        <div className="ml-7 mt-2 text-xs text-gray-500">
          Due: {new Date(task.dueDate).toLocaleDateString()}
        </div>
      )}
    </motion.div>
  );
}

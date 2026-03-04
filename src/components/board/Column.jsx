'use client';

/**
 * Column Component
 * 
 * Displays a vertical column of tasks for Kanban board.
 * Shows WIP limit warnings when task count exceeds threshold.
 */

import TaskCard from './TaskCard.jsx';

/**
 * @param {Object} props
 * @param {string} props.title - Column title (e.g., "To Do", "Doing", "Done")
 * @param {Array<Object>} props.tasks - Tasks in this column
 * @param {number} [props.maxTasks] - WIP limit (optional)
 * @param {string} [props.columnId] - Column identifier
 */
export default function Column({ title, tasks, maxTasks, columnId }) {
  const isOverLimit = maxTasks && tasks.length > maxTasks;
  
  return (
    <div className="flex flex-col bg-gray-50 rounded-lg p-4 min-h-[500px] w-full md:w-80">
      {/* Column Header */}
      <div className="flex items-center justify-between mb-4">
        <h2 className="font-semibold text-gray-700 text-lg">
          {title}
          <span className="ml-2 text-sm text-gray-500">({tasks.length})</span>
        </h2>
        
        {/* WIP Limit Indicator */}
        {maxTasks && (
          <span
            className={`text-xs px-2 py-1 rounded ${
              isOverLimit
                ? 'bg-red-100 text-red-700 border border-red-300'
                : 'bg-gray-200 text-gray-600'
            }`}
            title={isOverLimit ? 'Over WIP limit!' : 'Within WIP limit'}
          >
            {maxTasks} max
          </span>
        )}
      </div>

      {/* WIP Limit Warning */}
      {isOverLimit && (
        <div className="mb-3 p-2 bg-yellow-50 border border-yellow-200 rounded text-xs text-yellow-800">
          ⚠️ Over capacity! Consider moving tasks or archiving low-priority items.
        </div>
      )}

      {/* Task List */}
      <div className="flex-1 space-y-3 overflow-y-auto">
        {tasks.length === 0 ? (
          <p className="text-center text-gray-400 text-sm mt-8">No tasks</p>
        ) : (
          tasks.map((task) => <TaskCard key={task.id} task={task} />)
        )}
      </div>

      {/* Add Task Button (placeholder) */}
      <button
        className="mt-4 w-full py-2 border-2 border-dashed border-gray-300 rounded-lg text-gray-500 hover:border-blue-400 hover:text-blue-600 transition-colors text-sm"
        onClick={() => alert('Add task feature coming soon!')}
      >
        + Add task
      </button>
    </div>
  );
}

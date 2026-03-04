/**
 * KanbanBoard Component
 * 
 * Server Component that fetches tasks with entropy calculations
 * and renders them in Kanban columns (TODO, DOING, DONE).
 */

import { getTasksWithEntropy } from '../../actions/taskActions.js';
import Column from './Column.jsx';

/**
 * WIP (Work In Progress) limits for each column
 */
const WIP_LIMITS = {
  TODO: 10,
  DOING: 5,
  DONE: null, // No limit for completed tasks
};

/**
 * @param {Object} props
 * @param {string} props.userId - User ID to fetch tasks for
 */
export default async function KanbanBoard({ userId }) {
  // Fetch tasks with entropy calculations (Server Component)
  const tasks = await getTasksWithEntropy(userId);

  // Group tasks by column
  const tasksByColumn = {
    TODO: tasks.filter(task => task.column === 'TODO'),
    DOING: tasks.filter(task => task.column === 'DOING'),
    DONE: tasks.filter(task => task.column === 'DONE'),
  };

  return (
    <div className="space-y-6">
      {/* Board Header */}
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold text-gray-800">Your Tasks</h2>
        <p className="text-sm text-gray-500">
          {tasks.length} active {tasks.length === 1 ? 'task' : 'tasks'}
        </p>
      </div>

      {/* Kanban Columns */}
      <div className="flex flex-col md:flex-row gap-4 overflow-x-auto pb-4">
        <Column
          title="To Do"
          tasks={tasksByColumn.TODO}
          maxTasks={WIP_LIMITS.TODO}
          columnId="TODO"
        />
        <Column
          title="Doing"
          tasks={tasksByColumn.DOING}
          maxTasks={WIP_LIMITS.DOING}
          columnId="DOING"
        />
        <Column
          title="Done"
          tasks={tasksByColumn.DONE}
          maxTasks={WIP_LIMITS.DONE}
          columnId="DONE"
        />
      </div>

      {/* Empty State */}
      {tasks.length === 0 && (
        <div className="text-center py-12 bg-white rounded-lg border-2 border-dashed border-gray-200">
          <p className="text-gray-500 mb-4">
            No active tasks yet. Create your first task to get started!
          </p>
          <button className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
            Create First Task
          </button>
        </div>
      )}
    </div>
  );
}

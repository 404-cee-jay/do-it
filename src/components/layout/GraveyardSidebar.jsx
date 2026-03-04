'use client';

/**
 * GraveyardSidebar Component
 * 
 * Slide-in sidebar displaying archived tasks.
 * Users can resurrect tasks back to ACTIVE status.
 */

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useUIStore } from '../../store/uiStore.js';
import { getArchivedTasks, resurrectTask, deleteTask } from '../../actions/taskActions.js';

export default function GraveyardSidebar({ userId }) {
  const { graveyardOpen, toggleGraveyard } = useUIStore();
  const [archivedTasks, setArchivedTasks] = useState([]);
  const [isLoading, setIsLoading] = useState(false);

  // Fetch archived tasks when sidebar opens
  useEffect(() => {
    if (graveyardOpen && userId) {
      setIsLoading(true);
      getArchivedTasks(userId)
        .then(tasks => setArchivedTasks(tasks))
        .catch(err => console.error('Failed to load archived tasks:', err))
        .finally(() => setIsLoading(false));
    }
  }, [graveyardOpen, userId]);

  const handleResurrect = async (taskId) => {
    try {
      await resurrectTask(taskId);
      setArchivedTasks(prev => prev.filter(t => t.id !== taskId));
    } catch (error) {
      console.error('Failed to resurrect task:', error);
    }
  };

  const handleDelete = async (taskId) => {
    if (!confirm('Permanently delete this task? This cannot be undone.')) return;
    
    try {
      await deleteTask(taskId);
      setArchivedTasks(prev => prev.filter(t => t.id !== taskId));
    } catch (error) {
      console.error('Failed to delete task:', error);
    }
  };

  return (
    <>
      {/* Toggle Button */}
      <button
        onClick={toggleGraveyard}
        className="fixed bottom-6 right-6 z-40 px-4 py-2 bg-gray-800 text-white rounded-full shadow-lg hover:bg-gray-700 transition-colors"
        title="Open Graveyard"
      >
        🪦 Graveyard {archivedTasks.length > 0 && `(${archivedTasks.length})`}
      </button>

      {/* Sidebar Overlay */}
      <AnimatePresence>
        {graveyardOpen && (
          <>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black bg-opacity-50 z-40"
              onClick={toggleGraveyard}
            />

            {/* Sidebar Panel */}
            <motion.div
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              className="fixed top-0 right-0 h-full w-96 bg-white shadow-2xl z-50 flex flex-col"
            >
              {/* Header */}
              <div className="flex items-center justify-between p-6 border-b border-gray-200">
                <div>
                  <h2 className="text-xl font-bold text-gray-800">🪦 The Graveyard</h2>
                  <p className="text-sm text-gray-500 mt-1">
                    Archived tasks from the past
                  </p>
                </div>
                <button
                  onClick={toggleGraveyard}
                  className="text-gray-400 hover:text-gray-600 text-2xl"
                >
                  ×
                </button>
              </div>

              {/* Task List */}
              <div className="flex-1 overflow-y-auto p-6 space-y-4">
                {isLoading ? (
                  <div className="text-center text-gray-400 py-12">Loading...</div>
                ) : archivedTasks.length === 0 ? (
                  <div className="text-center text-gray-400 py-12">
                    <p>No archived tasks</p>
                    <p className="text-sm mt-2">
                      Tasks that haven't been touched in 30+ days will appear here
                    </p>
                  </div>
                ) : (
                  archivedTasks.map(task => (
                    <div
                      key={task.id}
                      className="bg-gray-50 rounded-lg p-4 border border-gray-200 opacity-60 hover:opacity-100 transition-opacity"
                    >
                      <h3 className="font-medium text-gray-800 mb-2">
                        {task.title}
                      </h3>
                      {task.description && (
                        <p className="text-sm text-gray-600 mb-3">
                          {task.description}
                        </p>
                      )}
                      <div className="flex items-center justify-between">
                        <span className="text-xs text-gray-400">
                          Archived {new Date(task.updatedAt).toLocaleDateString()}
                        </span>
                        <div className="flex gap-2">
                          <button
                            onClick={() => handleResurrect(task.id)}
                            className="text-sm text-green-600 hover:text-green-700 font-medium"
                            title="Resurrect task"
                          >
                            ↩️ Restore
                          </button>
                          <button
                            onClick={() => handleDelete(task.id)}
                            className="text-sm text-red-600 hover:text-red-700 font-medium"
                            title="Delete permanently"
                          >
                            🗑️ Delete
                          </button>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
}

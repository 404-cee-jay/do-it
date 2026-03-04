/**
 * Main Board Page
 * Server Component that renders the Kanban board with entropy-calculated tasks
 */

import KanbanBoard from '../src/components/board/KanbanBoard.jsx';

export default async function HomePage() {
  // TODO: Replace with actual authentication (NextAuth v5)
  // For development, using hardcoded userId
  const DEV_USER_ID = 'dev-user-001';

  return (
    <div className="space-y-6">
      {/* Welcome Section */}
      <div className="bg-white rounded-lg shadow-sm p-6">
        <h2 className="text-xl font-semibold text-gray-800 mb-2">
          Welcome to EntropyTasks
        </h2>
        <p className="text-gray-600">
          Your tasks automatically prioritize based on recency and importance. 
          High-entropy tasks stay visible, while stale tasks gracefully fade away.
        </p>
      </div>

      {/* Kanban Board */}
      <KanbanBoard userId={DEV_USER_ID} />
    </div>
  );
}

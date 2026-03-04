import './globals.css';
import StressMeter from '../src/components/layout/StressMeter.jsx';
import GraveyardSidebar from '../src/components/layout/GraveyardSidebar.jsx';
import { getTasksWithEntropy } from '../src/actions/taskActions.js';

/**
 * Root Layout Component
 * Wraps all pages with StressMeter header and GraveyardSidebar overlay
 */
export const metadata = {
  title: 'EntropyTasks - Intelligent Task Management',
  description: 'Task management that prevents overload through entropy-based prioritization',
};

export default async function RootLayout({ children }) {
  // TODO: Replace with actual authentication
  const DEV_USER_ID = 'dev-user-001';
  
  // Fetch tasks for StressMeter (only active tasks needed)
  let tasks = [];
  try {
    tasks = await getTasksWithEntropy(DEV_USER_ID);
  } catch (error) {
    console.error('Failed to fetch tasks for layout:', error);
  }

  return (
    <html lang="en">
      <body>
        <div className="min-h-screen bg-gray-50">
          {/* Header with Stress Meter */}
          <header className="bg-white border-b border-gray-200 px-6 py-4">
            <div className="max-w-7xl mx-auto flex items-center justify-between">
              <h1 className="text-2xl font-bold text-gray-900">EntropyTasks</h1>
              <StressMeter tasks={tasks} />
            </div>
          </header>

          {/* Main content */}
          <main className="max-w-7xl mx-auto px-6 py-8">
            {children}
          </main>

          {/* Graveyard Sidebar */}
          <GraveyardSidebar userId={DEV_USER_ID} />
        </div>
      </body>
    </html>
  );
}

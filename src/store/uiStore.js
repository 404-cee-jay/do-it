/**
 * UI State Store (Zustand)
 * 
 * Manages client-side UI state only.
 * Does NOT store task data (tasks live in Server Components).
 */

import { create } from 'zustand';

/**
 * UI Store
 * @typedef {Object} UIStore
 * @property {boolean} graveyardOpen - Graveyard sidebar visibility
 * @property {string|null} selectedTaskId - Currently selected task ID (for modals)
 * @property {Function} toggleGraveyard - Toggle graveyard sidebar
 * @property {Function} selectTask - Set selected task
 * @property {Function} clearSelection - Clear task selection
 */

export const useUIStore = create((set) => ({
  // Graveyard sidebar state
  graveyardOpen: false,
  toggleGraveyard: () => set((state) => ({ graveyardOpen: !state.graveyardOpen })),
  closeGraveyard: () => set({ graveyardOpen: false }),
  openGraveyard: () => set({ graveyardOpen: true }),

  // Task selection (for detail modals, future feature)
  selectedTaskId: null,
  selectTask: (taskId) => set({ selectedTaskId: taskId }),
  clearSelection: () => set({ selectedTaskId: null }),
}));

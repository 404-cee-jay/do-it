'use client';

/**
 * StressMeter Component
 * 
 * Displays cognitive load based on active task priority weights.
 * Visual indicator changes color based on stress level.
 */

import { useState, useEffect } from 'react';

/**
 * @param {Object} props
 * @param {Array<Object>} props.tasks - Active tasks for stress calculation
 */
export default function StressMeter({ tasks }) {
  const [stressData, setStressData] = useState(null);
  const [showTooltip, setShowTooltip] = useState(false);

  useEffect(() => {
    // Dynamically import to avoid server-side issues
    import('../../engine/stress.js').then(({ calculateStressMeterWithIndicator }) => {
      const data = calculateStressMeterWithIndicator(tasks || []);
      setStressData(data);
    });
  }, [tasks]);

  if (!stressData) {
    return (
      <div className="flex items-center gap-2">
        <div className="w-32 h-3 bg-gray-200 rounded-full animate-pulse" />
        <span className="text-xs text-gray-400">Loading...</span>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-3">
      {/* Label */}
      <span className="text-sm text-gray-600 font-medium">Stress:</span>

      {/* Progress Bar */}
      <div
        className="relative"
        onMouseEnter={() => setShowTooltip(true)}
        onMouseLeave={() => setShowTooltip(false)}
      >
        <div className="w-32 h-3 bg-gray-200 rounded-full overflow-hidden">
          <div
            className="h-full transition-all duration-500 ease-out rounded-full"
            style={{
              width: `${Math.min(stressData.percentage, 100)}%`,
              backgroundColor: stressData.color,
            }}
          />
        </div>

        {/* Tooltip */}
        {showTooltip && (
          <div className="absolute top-full mt-2 left-0 z-50 w-64 p-3 bg-gray-900 text-white text-xs rounded-lg shadow-lg">
            <div className="font-semibold mb-1">{stressData.label}</div>
            <div className="text-gray-300 mb-2">{stressData.description}</div>
            <div className="border-t border-gray-700 pt-2">
              <div>Load: {stressData.totalWeight} / {stressData.capacity} slots</div>
              <div>Percentage: {stressData.percentage}%</div>
            </div>
          </div>
        )}
      </div>

      {/* Percentage Badge */}
      <span
        className="text-xs font-semibold px-2 py-1 rounded"
        style={{
          backgroundColor: `${stressData.color}20`,
          color: stressData.color,
        }}
      >
        {stressData.percentage}%
      </span>
    </div>
  );
}

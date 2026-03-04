/** @type {import('tailwindcss').Config} */
export default {
  content: [
    './app/**/*.{js,jsx}',
    './src/**/*.{js,jsx}',
  ],
  theme: {
    extend: {
      opacity: {
        '40': '0.4',
        '50': '0.5',
        '60': '0.6',
        '70': '0.7',
        '80': '0.8',
        '90': '0.9',
        '100': '1.0',
      },
      colors: {
        stress: {
          healthy: '#22c55e',    // green-500
          elevated: '#eab308',   // yellow-500
          high: '#ea580c',       // orange-600
          critical: '#dc2626',   // red-700
        },
      },
      transitionProperty: {
        'opacity': 'opacity',
      },
      transitionDuration: {
        '300': '300ms',
      },
    },
  },
  plugins: [],
};

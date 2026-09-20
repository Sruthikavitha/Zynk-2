/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        zynk: {
          purple: '#5B3DF5',
          'purple-hover': '#4A2CE0',
          'purple-light': '#EEECFE',
          navy: '#11162A',
          'navy-light': '#1D2540',
          'navy-card': '#182035',
          canvas: '#F7F8FC',
          card: '#FFFFFF',
          muted: '#64748B',
          success: '#22C55E',
          warning: '#F59E0B',
          danger: '#EF4444',
        },
      },
      fontFamily: {
        sans: ['Inter', 'Outfit', 'sans-serif'],
      },
      boxShadow: {
        'card': '0 4px 20px -2px rgba(17, 22, 42, 0.05)',
        'card-hover': '0 10px 25px -5px rgba(91, 61, 245, 0.12)',
        'purple-glow': '0 0 20px rgba(91, 61, 245, 0.3)',
      },
    },
  },
  plugins: [],
}

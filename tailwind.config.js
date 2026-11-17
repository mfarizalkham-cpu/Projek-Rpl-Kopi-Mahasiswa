/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: 'class',
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        coffee: {
          50: '#fdf8f6',
          100: '#f2e8e5',
          200: '#e4d3cd',
          300: '#ceb3a8',
          400: '#b48c7c',
          500: '#9e6d5b',
          600: '#895544',
          700: '#724335',
          800: '#5f392d',
          900: '#503127',
          950: '#2b1711',
        },
        gold: {
          400: '#fbbf24',
          500: '#f59e0b',
          600: '#d97706',
        },
        espresso: {
          950: '#120d0a',
          900: '#18120e',
          850: '#1e1713',
          800: '#261e19',
          700: '#382d26',
          600: '#4d3d34',
        }
      },
    },
  },
  plugins: [],
};

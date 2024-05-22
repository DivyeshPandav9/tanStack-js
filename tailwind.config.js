export default {
  purge: ['./src/**/*.{js,jsx,ts,tsx}'], // Paths to your JSX/TSX files
  darkMode: false, // or 'media' or 'class'
  theme: {
    extend: {
      colors: {
        // Define your own color palette
        primary: '#FF6347',
        secondary: '#4682B4',
        // Add more colors as needed
      },
      fontFamily: {
        // Define custom fonts
        sans: ['Roboto', 'sans-serif'],
        // Add more font families as needed
      },
      spacing: {
        // Define custom spacing scale
        '72': '18rem',
        '84': '21rem',
        // Add more spacing as needed
      },
      screens: {
        // Define custom breakpoints
        'sm': '640px',
        'md': '768px',
        'lg': '1024px',
        'xl': '1280px',
        // Add more breakpoints as needed
      },
    },
  },
  variants: {
    extend: {},
  },
  plugins: [],
};

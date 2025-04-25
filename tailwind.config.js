/** @type {import('tailwindcss').Config} */
module.exports = {
    content: [
        './app/**/*.{js,ts,jsx,tsx,mdx}',
        './components/**/*.{js,ts,jsx,tsx,mdx}',
    ],
    theme: {
        extend: {
            colors: {
                primary: '#3b82f6',    // Blue
                secondary: '#10b981',  // Green
                background: '#0a1121', // Dark blue (matches your --background-start-rgb)
                'background-end': '#0f172a', // Slightly lighter blue (matches your --background-end-rgb)
                card: 'rgba(30, 41, 59, 0.4)', // Card background from your CSS variables
                text: {
                    primary: '#f8fafc',   // Almost white
                    secondary: '#94a3b8', // Light gray
                }
            },
            fontFamily: {
                sans: ['var(--font-inter)'],
                mono: ['var(--font-roboto-mono)'],
            },
            animation: {
                'fade-in': 'fadeIn 0.8s ease-in-out forwards',
                'slide-up': 'slideUp 0.8s ease-in-out forwards',
            },
            keyframes: {
                fadeIn: {
                    'from': { opacity: '0' },
                    'to': { opacity: '1' },
                },
                slideUp: {
                    'from': {
                        opacity: '0',
                        transform: 'translateY(30px)'
                    },
                    'to': {
                        opacity: '1',
                        transform: 'translateY(0)'
                    },
                },
            },
            boxShadow: {
                'card': '0 10px 25px -5px rgba(0, 0, 0, 0.3)',
            },
            transitionProperty: {
                'height': 'height',
                'spacing': 'margin, padding',
            }
        },
    },
    plugins: [],
}
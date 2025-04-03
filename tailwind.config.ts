import type { Config } from "tailwindcss"
import tailwindAnimate from "tailwindcss-animate"

export default {
  darkMode: ["class"],
  content: [
    "./pages/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}",
    "./app/**/*.{ts,tsx}",
    "./src/**/*.{ts,tsx}",
  ],
  prefix: "",
  theme: {
    container: {
      center: true,
      padding: '2rem',
      screens: {
        '2xl': '1400px'
      }
    },
    extend: {
      colors: {
        background: {
          DEFAULT: 'hsl(240 5% 10%)',   // Softer dark gray base
          foreground: 'hsl(240 5% 95%)' // Light text for contrast
        },
        border: 'hsl(240 3% 20%)',      // Border color
        input: 'hsl(240 3% 20%)',
        ring: 'hsl(240 4% 30%)',
        primary: {
          DEFAULT: 'hsl(24 83% 47%)',   // Maintain Villi orange accent
          foreground: 'hsl(0 0% 98%)'
        },
        secondary: {
          DEFAULT: 'hsl(240 3% 15%)',   // Slightly darker secondary
          foreground: 'hsl(0 0% 98%)'
        },
        destructive: {
          DEFAULT: 'hsl(0 62.8% 30.6%)',
          foreground: 'hsl(0 0% 98%)'
        },
        muted: {
          DEFAULT: 'hsl(240 3% 20%)',   // Dark gray muted color
          foreground: 'hsl(240 5% 65%)'
        },
        accent: {
          DEFAULT: 'hsl(240 3% 20%)',   // Dark gray accent
          foreground: 'hsl(0 0% 98%)'
        },
        popover: {
          DEFAULT: 'hsl(240 5% 15%)',   // Matching background
          foreground: 'hsl(240 5% 95%)'
        },
        card: {
          DEFAULT: 'hsl(240 5% 18%)',   // Slightly lighter than background
          foreground: 'hsl(240 5% 95%)'
        },
      },
      borderRadius: {
        lg: 'var(--radius)',
        md: 'calc(var(--radius) - 2px)',
        sm: 'calc(var(--radius) - 4px)'
      },
      keyframes: {
        'accordion-down': {
          from: { height: '0' },
          to: { height: 'var(--radix-accordion-content-height)' }
        },
        'accordion-up': {
          from: { height: 'var(--radix-accordion-content-height)' },
          to: { height: '0' }
        }
      },
      animation: {
        'accordion-down': 'accordion-down 0.2s ease-out',
        'accordion-up': 'accordion-up 0.2s ease-out'
      }
    }
  },
  plugins: [tailwindAnimate],
} satisfies Config

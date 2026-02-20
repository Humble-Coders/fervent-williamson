import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/page-components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/layouts/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    screens: {
      'xs': '475px',
      'sm': '640px',
      'md': '768px',
      'lg': '1024px',
      'xl': '1280px',
      '2xl': '1536px',
    },
    extend: {
      colors: {
        // Primary brand colors with extended palette
        primary: {
          50: '#f0fdfa',
          100: '#ccfbf1',
          200: '#99f6e4',
          300: '#5eead4',
          400: '#2dd4bf',
          500: '#00C6A1',
          600: '#019F84',
          700: '#0f766e',
          800: '#115e59',
          900: '#134e4a',
          950: '#042f2e',
        },
        // Accent colors with extended palette (now green-based)
        accent: {
          50: '#f0fdf4',
          100: '#dcfce7',
          200: '#bbf7d0',
          300: '#86efac',
          400: '#4ade80',
          500: '#22c55e',
          600: '#16a34a',
          700: '#15803d',
          800: '#166534',
          900: '#14532d',
          950: '#052e16',
        },
        // Extended neutral palette
        neutral: {
          50: '#fafafa',
          100: '#f5f5f5',
          200: '#e5e5e5',
          300: '#d4d4d4',
          400: '#a3a3a3',
          500: '#737373',
          600: '#525252',
          700: '#404040',
          800: '#262626',
          900: '#171717',
          950: '#0a0a0a',
        },
        // Text colors
        text: {
          primary: '#1a1a1a',
          secondary: '#4a5568',
          muted: '#718096',
          light: '#a0aec0',
          inverse: '#ffffff',
        },
        // Background colors
        background: {
          primary: '#FFFFFF',
          secondary: '#fafafa',
          tertiary: '#f7fafc',
          dark: '#0f172a',
          glass: 'rgba(255, 255, 255, 0.1)',
        },
        // Status colors with extended palette
        success: {
          50: '#f0fdf4',
          100: '#dcfce7',
          200: '#bbf7d0',
          300: '#86efac',
          400: '#4ade80',
          500: '#22c55e',
          600: '#16a34a',
          700: '#15803d',
          800: '#166534',
          900: '#14532d',
        },
        warning: {
          50: '#fffbeb',
          100: '#fef3c7',
          200: '#fde68a',
          300: '#fcd34d',
          400: '#fbbf24',
          500: '#f59e0b',
          600: '#d97706',
          700: '#b45309',
          800: '#92400e',
          900: '#78350f',
        },
        error: {
          50: '#fef2f2',
          100: '#fee2e2',
          200: '#fecaca',
          300: '#fca5a5',
          400: '#f87171',
          500: '#ef4444',
          600: '#dc2626',
          700: '#b91c1c',
          800: '#991b1b',
          900: '#7f1d1d',
        },
        // Special effect colors
        glow: {
          primary: 'rgba(0, 198, 161, 0.4)',
          accent: 'rgba(34, 197, 94, 0.4)',
          white: 'rgba(255, 255, 255, 0.6)',
          purple: 'rgba(147, 51, 234, 0.4)',
          blue: 'rgba(59, 130, 246, 0.4)',
        },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
        heading: ['Poppins', 'Inter', 'system-ui', 'sans-serif'],
        display: ['Playfair Display', 'serif'],
        mono: ['JetBrains Mono', 'monospace'],
      },
      fontSize: {
        // Mobile-first typography with responsive scaling
        'h1': ['32px', { lineHeight: '1.1', fontWeight: '700' }],
        'h1-lg': ['48px', { lineHeight: '1.1', fontWeight: '700' }],
        'h2': ['24px', { lineHeight: '1.2', fontWeight: '600' }],
        'h2-lg': ['36px', { lineHeight: '1.2', fontWeight: '600' }],
        'h3': ['20px', { lineHeight: '1.3', fontWeight: '600' }],
        'h3-lg': ['28px', { lineHeight: '1.3', fontWeight: '600' }],
        'h4': ['18px', { lineHeight: '1.4', fontWeight: '600' }],
        'h4-lg': ['24px', { lineHeight: '1.4', fontWeight: '600' }],
        'body': ['14px', { lineHeight: '1.6', fontWeight: '400' }],
        'body-lg': ['16px', { lineHeight: '1.6', fontWeight: '400' }],
        'small': ['12px', { lineHeight: '1.5', fontWeight: '400' }],
        'small-lg': ['14px', { lineHeight: '1.5', fontWeight: '400' }],
        'caption': ['11px', { lineHeight: '1.4', fontWeight: '400' }],
        'caption-lg': ['12px', { lineHeight: '1.4', fontWeight: '400' }],
        'display': ['48px', { lineHeight: '0.9', fontWeight: '800' }],
        'display-lg': ['72px', { lineHeight: '0.9', fontWeight: '800' }],
        'hero': ['40px', { lineHeight: '1', fontWeight: '700' }],
        'hero-lg': ['64px', { lineHeight: '1', fontWeight: '700' }],
        'mega': ['56px', { lineHeight: '0.8', fontWeight: '900' }],
        'mega-lg': ['96px', { lineHeight: '0.8', fontWeight: '900' }],
      },
      spacing: {
        '18': '4.5rem',
        '88': '22rem',
        '128': '32rem',
        '144': '36rem',
        '160': '40rem',
        '192': '48rem',
        // Mobile-specific spacing
        '0.5': '0.125rem',
        '1.5': '0.375rem',
        '2.5': '0.625rem',
        '3.5': '0.875rem',
      },
      borderRadius: {
        'button': '16px',
        'input': '12px',
        'card': '24px',
        'modal': '32px',
        'xl': '16px',
        '2xl': '24px',
        '3xl': '32px',
        '4xl': '40px',
        '5xl': '48px',
      },
      boxShadow: {
        'soft': '0 2px 8px rgba(0, 0, 0, 0.04)',
        'soft-lg': '0 8px 25px rgba(0, 0, 0, 0.08)',
        'hover': '0 20px 60px rgba(0, 0, 0, 0.15)',
        'glow': '0 0 30px rgba(0, 198, 161, 0.4)',
        'glow-accent': '0 0 30px rgba(34, 197, 94, 0.4)',
        'glow-white': '0 0 40px rgba(255, 255, 255, 0.6)',
        'glow-purple': '0 0 40px rgba(147, 51, 234, 0.4)',
        'glow-blue': '0 0 40px rgba(59, 130, 246, 0.4)',
        'inner-soft': 'inset 0 2px 4px rgba(0, 0, 0, 0.06)',
        'glass': '0 8px 32px rgba(31, 38, 135, 0.37)',
        'glass-lg': '0 25px 50px rgba(31, 38, 135, 0.25)',
        'neumorphism': '20px 20px 60px #d1d9e6, -20px -20px 60px #ffffff',
        'neumorphism-inset': 'inset 20px 20px 60px #d1d9e6, inset -20px -20px 60px #ffffff',
      },
      backdropBlur: {
        'xs': '2px',
        'sm': '4px',
        'md': '8px',
        'lg': '12px',
        'xl': '16px',
        '2xl': '24px',
        '3xl': '40px',
        '4xl': '64px',
      },
      animation: {
        'fade-in': 'fadeIn 0.8s ease-out',
        'slide-up': 'slideUp 0.8s ease-out',
        'slide-down': 'slideDown 0.8s ease-out',
        'slide-left': 'slideLeft 0.8s ease-out',
        'slide-right': 'slideRight 0.8s ease-out',
        'scale-in': 'scaleIn 0.6s ease-out',
        'bounce-soft': 'bounceSoft 3s ease-in-out infinite',
        'float': 'float 8s ease-in-out infinite',
        'float-slow': 'float 12s ease-in-out infinite',
        'pulse-soft': 'pulseSoft 4s ease-in-out infinite',
        'pulse-minimal': 'pulseMinimal 6s ease-in-out infinite',
        'gradient': 'gradient 8s ease infinite',
        'gradient-slow': 'gradient 15s ease infinite',
        'shimmer': 'shimmer 2.5s linear infinite',
        'shimmer-slow': 'shimmer 4s linear infinite',
        'rotate-slow': 'rotateSlow 20s linear infinite',
        'morph': 'morph 8s ease-in-out infinite',
        'particle': 'particle 10s linear infinite',
        'glow-pulse': 'glowPulse 3s ease-in-out infinite',
        'text-reveal': 'textReveal 1.5s ease-out',
        'magnetic': 'magnetic 0.3s ease-out',
        'ripple': 'ripple 0.6s ease-out',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        slideUp: {
          '0%': { transform: 'translateY(40px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
        slideDown: {
          '0%': { transform: 'translateY(-40px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
        slideLeft: {
          '0%': { transform: 'translateX(40px)', opacity: '0' },
          '100%': { transform: 'translateX(0)', opacity: '1' },
        },
        slideRight: {
          '0%': { transform: 'translateX(-40px)', opacity: '0' },
          '100%': { transform: 'translateX(0)', opacity: '1' },
        },
        scaleIn: {
          '0%': { transform: 'scale(0.8)', opacity: '0' },
          '100%': { transform: 'scale(1)', opacity: '1' },
        },
        bounceSoft: {
          '0%, 100%': { transform: 'translateY(0)' },
          '50%': { transform: 'translateY(-15px)' },
        },
        float: {
          '0%, 100%': { transform: 'translateY(0px) rotate(0deg)' },
          '33%': { transform: 'translateY(-20px) rotate(2deg)' },
          '66%': { transform: 'translateY(-10px) rotate(-1deg)' },
        },
        pulseSoft: {
          '0%, 100%': { opacity: '0.8' },
          '50%': { opacity: '1' },
        },
        pulseMinimal: {
          '0%, 100%': { opacity: '0.9' },
          '50%': { opacity: '1' },
        },
        gradient: {
          '0%, 100%': { backgroundPosition: '0% 50%' },
          '50%': { backgroundPosition: '100% 50%' },
        },
        shimmer: {
          '0%': { transform: 'translateX(-100%)' },
          '100%': { transform: 'translateX(100%)' },
        },
        rotateSlow: {
          '0%': { transform: 'rotate(0deg)' },
          '100%': { transform: 'rotate(360deg)' },
        },
        morph: {
          '0%, 100%': { borderRadius: '60% 40% 30% 70% / 60% 30% 70% 40%' },
          '50%': { borderRadius: '30% 60% 70% 40% / 50% 60% 30% 60%' },
        },
        particle: {
          '0%': { transform: 'translateY(0) rotate(0deg)', opacity: '1' },
          '100%': { transform: 'translateY(-100vh) rotate(360deg)', opacity: '0' },
        },
        glowPulse: {
          '0%, 100%': { boxShadow: '0 0 20px rgba(0, 198, 161, 0.4)' },
          '50%': { boxShadow: '0 0 40px rgba(0, 198, 161, 0.8)' },
        },
        textReveal: {
          '0%': { transform: 'translateY(100%)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
        magnetic: {
          '0%': { transform: 'scale(1)' },
          '50%': { transform: 'scale(1.05)' },
          '100%': { transform: 'scale(1)' },
        },
        ripple: {
          '0%': { transform: 'scale(0)', opacity: '1' },
          '100%': { transform: 'scale(4)', opacity: '0' },
        },
      },
      transitionDuration: {
        '250': '250ms',
        '350': '350ms',
        '400': '400ms',
        '600': '600ms',
        '800': '800ms',
        '1000': '1000ms',
        '1500': '1500ms',
      },
      backgroundImage: {
        'gradient-radial': 'radial-gradient(var(--tw-gradient-stops))',
        'gradient-conic': 'conic-gradient(from 180deg at 50% 50%, var(--tw-gradient-stops))',
        'mesh-gradient': 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        'aurora': 'linear-gradient(45deg, #ff6b6b, #4ecdc4, #45b7d1, #96ceb4, #ffeaa7)',
        'cosmic': 'linear-gradient(135deg, #667eea 0%, #764ba2 25%, #f093fb 50%, #f5576c 75%, #4facfe 100%)',
      },
      backgroundSize: {
        '300%': '300%',
        '400%': '400%',
        '500%': '500%',
      },
      perspective: {
        '1000': '1000px',
        '2000': '2000px',
      },
      transformOrigin: {
        'center-center': 'center center',
      },
    },
  },
  plugins: [
    // Plugin to generate text utilities for custom fontSize
    function({ addUtilities, theme }: any) {
      const fontSizes = theme('fontSize');
      const textUtilities: Record<string, any> = {};

      Object.keys(fontSizes).forEach((key) => {
        const value = fontSizes[key];
        if (Array.isArray(value)) {
          const [fontSize, options] = value;
          textUtilities[`.text-${key}`] = {
            fontSize,
            ...(options.lineHeight && { lineHeight: options.lineHeight }),
            ...(options.fontWeight && { fontWeight: options.fontWeight }),
          };
        } else {
          textUtilities[`.text-${key}`] = { fontSize: value };
        }
      });

      addUtilities(textUtilities);
    },
  ],
};
export default config;

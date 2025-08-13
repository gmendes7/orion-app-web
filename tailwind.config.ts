import type { Config } from "tailwindcss";

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
				border: 'hsl(var(--border))',
				input: 'hsl(var(--input))',
				ring: 'hsl(var(--ring))',
				background: 'hsl(var(--background))',
				foreground: 'hsl(var(--foreground))',
				primary: {
					DEFAULT: 'hsl(var(--primary))',
					foreground: 'hsl(var(--primary-foreground))'
				},
				secondary: {
					DEFAULT: 'hsl(var(--secondary))',
					foreground: 'hsl(var(--secondary-foreground))'
				},
				destructive: {
					DEFAULT: 'hsl(var(--destructive))',
					foreground: 'hsl(var(--destructive-foreground))'
				},
				muted: {
					DEFAULT: 'hsl(var(--muted))',
					foreground: 'hsl(var(--muted-foreground))'
				},
				accent: {
					DEFAULT: 'hsl(var(--accent))',
					foreground: 'hsl(var(--accent-foreground))'
				},
				popover: {
					DEFAULT: 'hsl(var(--popover))',
					foreground: 'hsl(var(--popover-foreground))'
				},
				card: {
					DEFAULT: 'hsl(var(--card))',
					foreground: 'hsl(var(--card-foreground))'
				},
				'jarvis-deep-black': 'hsl(var(--jarvis-deep-black))',
				'jarvis-gold': 'hsl(var(--jarvis-gold))',
				'jarvis-gold-dark': 'hsl(var(--jarvis-gold-dark))',
				'jarvis-gold-light': 'hsl(var(--jarvis-gold-light))',
				'jarvis-surface': 'hsl(var(--jarvis-surface))',
				'jarvis-surface-elevated': 'hsl(var(--jarvis-surface-elevated))',
			},
			borderRadius: {
				lg: 'var(--radius)',
				md: 'calc(var(--radius) - 2px)',
				sm: 'calc(var(--radius) - 4px)'
			},
			keyframes: {
				'accordion-down': {
					from: {
						height: '0'
					},
					to: {
						height: 'var(--radix-accordion-content-height)'
					}
				},
				'accordion-up': {
					from: {
						height: 'var(--radix-accordion-content-height)'
					},
					to: {
						height: '0'
					}
				},
				'jarvis-eye-open': {
					'0%': {
						transform: 'scaleY(0) scaleX(1.2)',
						opacity: '0'
					},
					'50%': {
						transform: 'scaleY(0.1) scaleX(1.1)',
						opacity: '0.8'
					},
					'100%': {
						transform: 'scaleY(1) scaleX(1)',
						opacity: '1'
					}
				},
				'jarvis-glow-pulse': {
					'0%, 100%': {
						boxShadow: '0 0 20px hsl(51 100% 50% / 0.3)'
					},
					'50%': {
						boxShadow: '0 0 40px hsl(51 100% 50% / 0.6)'
					}
				},
				'jarvis-text-appear': {
					'0%': {
						opacity: '0',
						transform: 'translateY(20px)'
					},
					'100%': {
						opacity: '1',
						transform: 'translateY(0)'
					}
				}
			},
			animation: {
				'accordion-down': 'accordion-down 0.2s ease-out',
				'accordion-up': 'accordion-up 0.2s ease-out',
				'jarvis-eye-open': 'jarvis-eye-open 2s cubic-bezier(0.4, 0, 0.2, 1) forwards',
				'jarvis-glow-pulse': 'jarvis-glow-pulse 3s ease-in-out infinite',
				'jarvis-text-appear': 'jarvis-text-appear 1s ease-out forwards'
			}
		}
	},
	plugins: [require("tailwindcss-animate")],
} satisfies Config;
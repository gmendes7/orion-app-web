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
			padding: {
				DEFAULT: '1rem',
				sm: '1.5rem',
				md: '2rem',
				lg: '2.5rem',
				xl: '3rem',
			},
			screens: {
				'2xl': '1400px'
			}
		},
		screens: {
			'xs': '320px',
			'sm': '640px',
			'md': '768px',
			'lg': '1024px',
			'xl': '1280px',
			'2xl': '1536px',
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
				'orion-void': 'hsl(var(--orion-void))',
				'orion-event-horizon': 'hsl(var(--orion-event-horizon))',
				'orion-accretion-disk': 'hsl(var(--orion-accretion-disk))',
				'orion-stellar-gold': 'hsl(var(--orion-stellar-gold))',
				'orion-energy-burst': 'hsl(var(--orion-energy-burst))',
				'orion-plasma-glow': 'hsl(var(--orion-plasma-glow))',
				'orion-space-dust': 'hsl(var(--orion-space-dust))',
				'orion-cosmic-blue': 'hsl(var(--orion-cosmic-blue))',
				'orion-nebula-purple': 'hsl(var(--orion-nebula-purple))',
				'neon-yellow': 'hsl(54 100% 50%)',
				'neon-gold': 'hsl(45 100% 50%)',
				'neon-amber': 'hsl(40 100% 50%)',
				'neon-lime': 'hsl(60 100% 55%)',
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
				'orion-constellation': {
					'0%, 100%': {
						transform: 'translateY(0) rotate(0deg)',
						opacity: '0.6'
					},
					'50%': {
						transform: 'translateY(-10px) rotate(180deg)',
						opacity: '1'
					}
				},
				'cosmic-glow': {
					'0%, 100%': {
						boxShadow: '0 0 20px hsl(45 100% 50% / 0.4)',
						filter: 'brightness(1)'
					},
					'50%': {
						boxShadow: '0 0 40px hsl(45 100% 50% / 0.8)',
						filter: 'brightness(1.2)'
					}
				},
				'nebula-drift': {
					'0%': {
						transform: 'translateX(-10px) rotate(0deg)',
						opacity: '0.3'
					},
					'50%': {
						transform: 'translateX(10px) rotate(180deg)',
						opacity: '0.8'
					},
					'100%': {
						transform: 'translateX(-10px) rotate(360deg)',
						opacity: '0.3'
					}
				},
				'saturn-spin': {
					'from': {
						transform: 'rotate(0deg)'
					},
					'to': {
						transform: 'rotate(360deg)'
					}
				}
			},
			animation: {
				'accordion-down': 'accordion-down 0.2s ease-out',
				'accordion-up': 'accordion-up 0.2s ease-out',
				'orion-constellation': 'orion-constellation 8s ease-in-out infinite',
				'cosmic-glow': 'cosmic-glow 4s ease-in-out infinite',
				'nebula-drift': 'nebula-drift 12s linear infinite',
				'saturn-spin': 'saturn-spin 20s linear infinite'
			}
		}
	},
	plugins: [require("tailwindcss-animate")],
} satisfies Config;
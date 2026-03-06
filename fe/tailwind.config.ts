import type { Config } from 'tailwindcss';

export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        background: '#0A0C13',
        point: '#F5F2EB',
        gold: '#C7B282',
      },
    },
  },
  plugins: [],
} satisfies Config;

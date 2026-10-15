/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./index.html",
    "./script.js",
    "./cup.js"
  ],
  safelist: [
    'rounded-tl-none',
    'rounded-tl-3xl',
    'rounded-tr-none',
    'rounded-tr-3xl',
    'opacity-40',
    'h-0',
    'overflow-hidden',
    '-translate-x-1/2',
    'scale-95',
    'aspect-[4/3]',
    'aspect-[3/4]',
    'bg-rose-200',
    'bg-rose-100',
    'bg-black/55',
    'from-black/60',
    'to-black/15',
    'text-rose-600',
    'text-rose-900/70',
    'text-rose-950',
    'text-rose-900/60',
    'border-rose-600'
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ['"Nunito"', 'system-ui', '-apple-system', 'BlinkMacSystemFont', '"Segoe UI"', 'Roboto', 'sans-serif'],
        display: ['"Momo Trust Display"', '"Nunito"', 'system-ui', 'sans-serif'],
      },
    },
  },
  plugins: [],
};
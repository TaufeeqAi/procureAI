/**
 * Tailwind CSS v4 moved its PostCSS integration to a separate package and
 * no longer needs `autoprefixer` (handled internally) or a JS theme config
 * — theme tokens live in app/globals.css via `@theme`. Verified against
 * the current Tailwind v4 Next.js install guide (tailwindcss.com/docs/
 * guides/nextjs), not assumed from pre-v4 knowledge.
 */
const config = {
  plugins: {
    "@tailwindcss/postcss": {},
  },
};

export default config;

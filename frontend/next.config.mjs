/**
 * Next.js 16 no longer recognizes an `eslint` key here — linting during
 * `next build` was decoupled from next.config.mjs in this version (confirmed
 * by the build itself warning "Unrecognized key(s): 'eslint'"). Lint now
 * runs via `next lint` / `npm run lint`, wired to eslint.config.mjs.
 * @type {import('next').NextConfig}
 */
const nextConfig = {
  reactStrictMode: true,
  typescript: {
    ignoreBuildErrors: false,
  },
};

export default nextConfig;

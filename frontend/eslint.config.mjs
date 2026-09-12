import nextCoreWebVitals from "eslint-config-next/core-web-vitals";
import nextTypescript from "eslint-config-next/typescript";

/**
 * eslint-config-next 16.x ships native flat-config arrays directly (no
 * legacy shareable-config strings), so unlike pre-16 Next.js projects this
 * needs no FlatCompat bridge at all — importing the two subpaths and
 * spreading them is the whole integration. Verified by inspecting
 * node_modules/eslint-config-next/dist/*.js directly after the FlatCompat
 * approach failed with a circular-JSON error from the compat layer trying
 * to validate an already-flat config through its legacy-schema path.
 */
const eslintConfig = [
  ...nextCoreWebVitals,
  ...nextTypescript,
  {
    rules: {
      "no-console": ["warn", { allow: ["warn", "error"] }],
    },
  },
];

export default eslintConfig;

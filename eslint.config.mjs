import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";

export default defineConfig([
  ...nextVitals,
  {
    rules: {
      // The React 19 plugin promotes compiler-oriented recommendations that
      // reject established client synchronization patterns in this codebase.
      // Keep the standard hook dependency/rules checks, but do not make those
      // opt-in compiler constraints the repository's lint baseline.
      "react-hooks/set-state-in-effect": "off",
      "react-hooks/refs": "off",
      "react-hooks/purity": "off",
    },
  },
  {
    files: ["features/adventure/combat/engine.ts"],
    rules: {
      // Domain functions named useItem/useRootAccessAttack are pure combat
      // reducers, not React hooks.
      "react-hooks/rules-of-hooks": "off",
    },
  },
  globalIgnores([
    ".next/**",
    "node_modules/**",
    "coverage/**",
    "next-env.d.ts",
  ]),
]);

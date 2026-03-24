import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

const eslintConfig = defineConfig([
    ...nextVitals,
    ...nextTs,
    globalIgnores([
        ".next/**",
        "out/**",
        "build/**",
        "next-env.d.ts",
        "src/test_notifications.ts",
    ]),
    {
        rules: {
            // Codebase uses `any` extensively — warn instead of blocking CI
            "@typescript-eslint/no-explicit-any": "warn",
            // JSX text with apostrophes/quotes — cosmetic only
            "react/no-unescaped-entities": "off",
            // Date.now() in render (tracker components) — impure but
            // intentional for time display. Downgrade to warn.
            "react-hooks/purity": "warn",
            // setMounted pattern (LocalTime, etc.) is required for Next.js
            // hydration. setState-in-effect is a warn, not a block.
            "react-hooks/set-state-in-effect": "warn",
        },
    },
]);

export default eslintConfig;

import js from "@eslint/js";
import tseslint from "typescript-eslint";
import reactHooks from "eslint-plugin-react-hooks";
import jsxA11y from "eslint-plugin-jsx-a11y";

export default tseslint.config(
  { ignores: ["node_modules/"] },
  js.configs.recommended,
  ...tseslint.configs.recommended,
  reactHooks.configs.flat.recommended,
  jsxA11y.flatConfigs.recommended,
  {
    rules: {
      // Chart cells are focusable images so keyboard users can reach their tooltips
      "jsx-a11y/no-noninteractive-tabindex": [
        "error",
        { roles: ["img", "tabpanel"], allowExpressionValues: true },
      ],
    },
  },
);

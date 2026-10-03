import type { ThemeRegistration } from "shiki";

// Colours are the site's tokens, so snippets follow light and dark mode.
export const snippetTheme: ThemeRegistration = {
  name: "nienke",
  type: "light",
  colors: {
    "editor.foreground": "var(--ink)",
    "editor.background": "color-mix(in srgb, var(--ink) 5%, var(--paper))",
  },
  tokenColors: [
    {
      scope: ["comment", "punctuation.definition.comment"],
      settings: { foreground: "var(--ink-faint)", fontStyle: "italic" },
    },
    {
      scope: [
        "punctuation.definition.tag",
        "punctuation.separator.key-value",
        "punctuation.definition.string",
        "punctuation.section",
        "punctuation.terminator",
        "meta.brace",
      ],
      settings: { foreground: "var(--ink-faint)" },
    },
    {
      scope: ["entity.other.attribute-name", "support.type.property-name", "variable"],
      settings: { foreground: "var(--ink-soft)" },
    },
    {
      scope: ["string", "constant", "support.constant.property-value", "constant.other.color"],
      settings: { foreground: "var(--movies)" },
    },
  ],
};

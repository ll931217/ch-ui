import * as monaco from "monaco-editor";

// Theme definition type from Monaco
type MonacoThemeData = monaco.editor.IStandaloneThemeData;

// Dracula Theme
const draculaTheme: MonacoThemeData = {
  base: "vs-dark",
  inherit: true,
  rules: [
    { background: "282a36", token: "" },
    { foreground: "6272a4", token: "comment" },
    { foreground: "f1fa8c", token: "string" },
    { foreground: "bd93f9", token: "constant.numeric" },
    { foreground: "bd93f9", token: "constant.language" },
    { foreground: "ff79c6", token: "keyword" },
    { foreground: "ff79c6", token: "storage" },
    { foreground: "8be9fd", fontStyle: "italic", token: "storage.type" },
    { foreground: "50fa7b", token: "entity.name.function" },
    { foreground: "50fa7b", token: "entity.name.class" },
    { foreground: "ffb86c", fontStyle: "italic", token: "variable.parameter" },
    { foreground: "8be9fd", token: "support.function" },
    { foreground: "ff79c6", token: "predefined" },
    { foreground: "ff79c6", token: "entity.name.tag" },
    { foreground: "50fa7b", token: "entity.other.attribute-name" },
    // SQL-specific tokens
    { foreground: "ff79c6", token: "keyword.sql" },
    { foreground: "8be9fd", token: "support.function.sql" },
    { foreground: "50fa7b", token: "entity.name.function.sql" },
  ],
  colors: {
    "editor.foreground": "#f8f8f2",
    "editor.background": "#282a36",
    "editor.selectionBackground": "#44475a",
    "editor.lineHighlightBackground": "#44475a",
    "editorCursor.foreground": "#f8f8f0",
    "editorWhitespace.foreground": "#3B3A32",
    "editorLineNumber.foreground": "#6272a4",
    "editorLineNumber.activeForeground": "#f8f8f2",
  },
};

// Nord Theme
const nordTheme: MonacoThemeData = {
  base: "vs-dark",
  inherit: true,
  rules: [
    { background: "2E3440", token: "" },
    { foreground: "616e88", token: "comment" },
    { foreground: "a3be8c", token: "string" },
    { foreground: "b48ead", token: "constant.numeric" },
    { foreground: "81a1c1", token: "keyword" },
    { foreground: "81a1c1", token: "storage" },
    { foreground: "81a1c1", token: "storage.type" },
    { foreground: "8fbcbb", token: "entity.name.class" },
    { foreground: "88c0d0", token: "entity.name.function" },
    { foreground: "81a1c1", token: "entity.name.tag" },
    { foreground: "8fbcbb", token: "entity.other.attribute-name" },
    { foreground: "88c0d0", token: "support.function" },
    { foreground: "81a1c1", token: "predefined" },
    { foreground: "ebcb8b", token: "constant.character.escape" },
  ],
  colors: {
    "editor.foreground": "#D8DEE9",
    "editor.background": "#2E3440",
    "editor.selectionBackground": "#434C5ECC",
    "editor.lineHighlightBackground": "#3B4252",
    "editorCursor.foreground": "#D8DEE9",
    "editorWhitespace.foreground": "#434C5ECC",
    "editorLineNumber.foreground": "#4C566A",
    "editorLineNumber.activeForeground": "#D8DEE9",
  },
};

// Gruvbox Dark Theme
const gruvboxDarkTheme: MonacoThemeData = {
  base: "vs-dark",
  inherit: true,
  rules: [
    { background: "282828", token: "" },
    { foreground: "928374", token: "comment" },
    { foreground: "b8bb26", token: "string" },
    { foreground: "d3869b", token: "constant.numeric" },
    { foreground: "fb4934", token: "keyword" },
    { foreground: "fb4934", token: "storage" },
    { foreground: "83a598", token: "storage.type" },
    { foreground: "fabd2f", token: "entity.name.class" },
    { foreground: "b8bb26", token: "entity.name.function" },
    { foreground: "8ec07c", token: "entity.name.tag" },
    { foreground: "fabd2f", token: "entity.other.attribute-name" },
    { foreground: "8ec07c", token: "support.function" },
    { foreground: "fb4934", token: "predefined" },
    { foreground: "fe8019", token: "constant.character.escape" },
  ],
  colors: {
    "editor.foreground": "#ebdbb2",
    "editor.background": "#282828",
    "editor.selectionBackground": "#504945",
    "editor.lineHighlightBackground": "#3c3836",
    "editorCursor.foreground": "#ebdbb2",
    "editorWhitespace.foreground": "#504945",
    "editorLineNumber.foreground": "#665c54",
    "editorLineNumber.activeForeground": "#ebdbb2",
  },
};

// Tokyo Night Theme
const tokyoNightTheme: MonacoThemeData = {
  base: "vs-dark",
  inherit: true,
  rules: [
    { background: "1a1b26", token: "" },
    { foreground: "565f89", token: "comment" },
    { foreground: "9ece6a", token: "string" },
    { foreground: "ff9e64", token: "constant.numeric" },
    { foreground: "bb9af7", token: "keyword" },
    { foreground: "bb9af7", token: "storage" },
    { foreground: "7dcfff", token: "storage.type" },
    { foreground: "7aa2f7", token: "entity.name.class" },
    { foreground: "7aa2f7", token: "entity.name.function" },
    { foreground: "f7768e", token: "entity.name.tag" },
    { foreground: "73daca", token: "entity.other.attribute-name" },
    { foreground: "7dcfff", token: "support.function" },
    { foreground: "bb9af7", token: "predefined" },
    { foreground: "89ddff", token: "constant.character.escape" },
  ],
  colors: {
    "editor.foreground": "#a9b1d6",
    "editor.background": "#1a1b26",
    "editor.selectionBackground": "#33467c",
    "editor.lineHighlightBackground": "#292e42",
    "editorCursor.foreground": "#c0caf5",
    "editorWhitespace.foreground": "#3b4261",
    "editorLineNumber.foreground": "#3b4261",
    "editorLineNumber.activeForeground": "#a9b1d6",
  },
};

// GitHub Light Theme
const githubLightTheme: MonacoThemeData = {
  base: "vs",
  inherit: true,
  rules: [
    { background: "ffffff", token: "" },
    { foreground: "6a737d", token: "comment" },
    { foreground: "032f62", token: "string" },
    { foreground: "005cc5", token: "constant.numeric" },
    { foreground: "d73a49", token: "keyword" },
    { foreground: "d73a49", token: "storage" },
    { foreground: "d73a49", token: "storage.type" },
    { foreground: "6f42c1", token: "entity.name.class" },
    { foreground: "6f42c1", token: "entity.name.function" },
    { foreground: "22863a", token: "entity.name.tag" },
    { foreground: "6f42c1", token: "entity.other.attribute-name" },
    { foreground: "005cc5", token: "support.function" },
    { foreground: "6f42c1", token: "predefined" },
    { foreground: "005cc5", token: "variable" },
  ],
  colors: {
    "editor.foreground": "#24292e",
    "editor.background": "#ffffff",
    "editor.selectionBackground": "#c8c8fa",
    "editor.lineHighlightBackground": "#fafbfc",
    "editorCursor.foreground": "#24292e",
    "editorWhitespace.foreground": "#959da5",
    "editorLineNumber.foreground": "#959da5",
    "editorLineNumber.activeForeground": "#24292e",
  },
};

// Gruvbox Light Theme
const gruvboxLightTheme: MonacoThemeData = {
  base: "vs",
  inherit: true,
  rules: [
    { background: "fbf1c7", token: "" },
    { foreground: "928374", token: "comment" },
    { foreground: "79740e", token: "string" },
    { foreground: "8f3f71", token: "constant.numeric" },
    { foreground: "9d0006", token: "keyword" },
    { foreground: "9d0006", token: "storage" },
    { foreground: "076678", token: "storage.type" },
    { foreground: "b57614", token: "entity.name.class" },
    { foreground: "79740e", token: "entity.name.function" },
    { foreground: "427b58", token: "entity.name.tag" },
    { foreground: "b57614", token: "entity.other.attribute-name" },
    { foreground: "427b58", token: "support.function" },
    { foreground: "427b58", token: "predefined" },
    { foreground: "af3a03", token: "constant.character.escape" },
  ],
  colors: {
    "editor.foreground": "#3c3836",
    "editor.background": "#fbf1c7",
    "editor.selectionBackground": "#d5c4a1",
    "editor.lineHighlightBackground": "#ebdbb2",
    "editorCursor.foreground": "#3c3836",
    "editorWhitespace.foreground": "#a89984",
    "editorLineNumber.foreground": "#a89984",
    "editorLineNumber.activeForeground": "#3c3836",
  },
};

// Catppuccin Latte Theme
const catppuccinLatteTheme: MonacoThemeData = {
  base: "vs",
  inherit: true,
  rules: [
    { background: "eff1f5", token: "" },
    { foreground: "9ca0b0", token: "comment" },
    { foreground: "40a02b", token: "string" },
    { foreground: "fe640b", token: "constant.numeric" },
    { foreground: "8839ef", token: "keyword" },
    { foreground: "8839ef", token: "storage" },
    { foreground: "1e66f5", token: "storage.type" },
    { foreground: "df8e1d", token: "entity.name.class" },
    { foreground: "1e66f5", token: "entity.name.function" },
    { foreground: "179299", token: "entity.name.tag" },
    { foreground: "df8e1d", token: "entity.other.attribute-name" },
    { foreground: "04a5e5", token: "support.function" },
    { foreground: "1e66f5", token: "predefined" },
    { foreground: "dd7878", token: "constant.character.escape" },
  ],
  colors: {
    "editor.foreground": "#4c4f69",
    "editor.background": "#eff1f5",
    "editor.selectionBackground": "#acb0be",
    "editor.lineHighlightBackground": "#e6e9ef",
    "editorCursor.foreground": "#dc8a78",
    "editorWhitespace.foreground": "#9ca0b0",
    "editorLineNumber.foreground": "#9ca0b0",
    "editorLineNumber.activeForeground": "#4c4f69",
  },
};

// One Light Theme
const oneLightTheme: MonacoThemeData = {
  base: "vs",
  inherit: true,
  rules: [
    { background: "fafafa", token: "" },
    { foreground: "a0a1a7", token: "comment" },
    { foreground: "50a14f", token: "string" },
    { foreground: "986801", token: "constant.numeric" },
    { foreground: "a626a4", token: "keyword" },
    { foreground: "a626a4", token: "storage" },
    { foreground: "0184bc", token: "storage.type" },
    { foreground: "c18401", token: "entity.name.class" },
    { foreground: "4078f2", token: "entity.name.function" },
    { foreground: "e45649", token: "entity.name.tag" },
    { foreground: "c18401", token: "entity.other.attribute-name" },
    { foreground: "0184bc", token: "support.function" },
    { foreground: "0184bc", token: "predefined" },
    { foreground: "986801", token: "constant.character.escape" },
  ],
  colors: {
    "editor.foreground": "#383a42",
    "editor.background": "#fafafa",
    "editor.selectionBackground": "#e5e5e6",
    "editor.lineHighlightBackground": "#f2f2f2",
    "editorCursor.foreground": "#526fff",
    "editorWhitespace.foreground": "#d3d3d3",
    "editorLineNumber.foreground": "#9d9d9f",
    "editorLineNumber.activeForeground": "#383a42",
  },
};

// All theme definitions for registration
export const MONACO_THEMES: Record<string, MonacoThemeData> = {
  dracula: draculaTheme,
  nord: nordTheme,
  "gruvbox-dark": gruvboxDarkTheme,
  "tokyo-night": tokyoNightTheme,
  "github-light": githubLightTheme,
  "gruvbox-light": gruvboxLightTheme,
  "catppuccin-latte": catppuccinLatteTheme,
  "one-light": oneLightTheme,
};

// Light themes list for reference
export const LIGHT_THEMES = [
  "github-light",
  "gruvbox-light",
  "catppuccin-latte",
  "one-light",
];

// Track registered themes
let themesRegistered = false;

/**
 * Register all custom Monaco themes
 * Should be called once during Monaco initialization
 */
export function registerMonacoThemes(): void {
  if (themesRegistered) return;

  Object.entries(MONACO_THEMES).forEach(([name, themeData]) => {
    monaco.editor.defineTheme(name, themeData);
  });

  themesRegistered = true;
}

/**
 * Get the Monaco theme name for a given app theme
 * Returns the matching custom theme, or falls back to vs-dark/vs-light
 */
export function getMonacoTheme(appTheme: string, systemIsDark = true): string {
  if (appTheme === "system") {
    return systemIsDark ? "dracula" : "github-light";
  }
  
  // If we have a custom theme registered for this app theme, use it
  if (appTheme in MONACO_THEMES) {
    return appTheme;
  }
  
  // Fallback to built-in themes
  return LIGHT_THEMES.includes(appTheme) ? "vs" : "vs-dark";
}

/**
 * Check if a theme is a light theme
 */
export function isLightTheme(theme: string): boolean {
  if (theme === "system") {
    return !window.matchMedia("(prefers-color-scheme: dark)").matches;
  }
  return LIGHT_THEMES.includes(theme);
}

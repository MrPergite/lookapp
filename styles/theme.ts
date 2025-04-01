import { Theme } from "./types";

const theme: Theme = {
  colors: {
    primary: {
      pink: "#d94a8f",
      purple: "#6b5cd1",
      lavender: "#f0e6ff",
      periwinkle: "#e6e6ff",
      white: "#ffffff",
    },
    secondary: {
      veryLightGray: "#f7f7f7",
      lightGray: "#f0f0f0",
      mediumLightGray: "#e0e0e0",
      mediumGray: "#a8a8a8",
      darkGray: "#777777",
      mediumDarkGray: "#999999",
      veryDarkGray: "#333333",
      underlineGray: "#d9d9d9",
      black: "#000000",
    },
    error: "#FFE5E5",

    // Custom colors (extendable)
    custom: {} as Record<string, string>,
  },

  spacing: {
    xs: 4,
    sm: 8,
    md: 16,
    lg: 24,
    xl: 32,

    // Custom spacing (extendable)
    custom: {} as Record<string, number>,
  },

  opacity: {
    low: 0.2,
    medium: 0.5,
    high: 0.8,
    full: 1,

    // Custom opacity (extendable)
    custom: {} as Record<string, number>,
  },

  extendTheme: (overrides: Partial<typeof theme>) => {
    return {
      ...theme,
      ...overrides,
      colors: { ...theme.colors, ...overrides.colors },
      spacing: { ...theme.spacing, ...overrides.spacing },
      opacity: { ...theme.opacity, ...overrides.opacity },
    };
  },
};

export default theme;

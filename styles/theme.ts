import { Theme } from "./types";

// Light mode colors
const lightColors = {
  primary: {
    pink: "#d94a8f",
    purple: "#a855f7",
    lavender: "#f0e6ff",
    periwinkle: "#e6e6ff",
    white: "#ffffff",
    paleWhite: "#fff6",
    green: "rgba(22, 163, 74, 1)",
    bgGreen: "#22c55e1a",
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
  background: "#ffffff",
  card: "#ffffff",
  text: "#000000",
  border: "#d9d9d9",
  custom: {} as Record<string, string>,
};

// Dark mode colors
const darkColors = {
  primary: {
    pink: "#ff5fa9",
    purple: "#8b7dee",
    lavender: "#352b59", // Darker lavender that's still visible
    periwinkle: "#3a3a66", // Darker periwinkle
    white: "#1a1a1a", // Dark mode "white" is actually dark
    paleWhite: "#fff6",
    green: "rgba(22, 163, 74, 1)",
    bgGreen: "#22c55e1a",
  },
  secondary: {
    veryLightGray: "#2a2a2a", // Dark mode grays are inverted
    lightGray: "#333333",
    mediumLightGray: "#444444",
    mediumGray: "#777777",
    darkGray: "#aaaaaa", // Lighter in dark mode for better contrast
    mediumDarkGray: "#bbbbbb",
    veryDarkGray: "#eeeeee", // Nearly white in dark mode
    underlineGray: "#444444",
    black: "#ffffff", // Dark mode "black" is white
  },
  error: "#661a1a", // Darker red for dark mode
  background: "#121212", // Standard dark mode background
  card: "#1e1e1e", // Slightly lighter than background for cards
  text: "#f0f0f0", // Light text for dark mode
  border: "#444444", // Visible borders in dark mode
  custom: {} as Record<string, string>,
};

const spacing = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  custom: {} as Record<string, number>,
};

const opacity = {
  low: 0.2,
  medium: 0.5,
  high: 0.8,
  full: 1,
  custom: {} as Record<string, number>,
};

// Base theme object
const baseTheme = {
  spacing,
  opacity,
  extendTheme: (overrides: Partial<Theme>) => {
    return {
      ...theme,
      ...overrides,
      colors: { ...theme.colors, ...overrides.colors },
      spacing: { ...theme.spacing, ...overrides.spacing },
      opacity: { ...theme.opacity, ...overrides.opacity },
    };
  },
};

// Create light and dark theme variants
const lightTheme: Theme = {
  ...baseTheme,
  colors: lightColors,
};

const darkTheme: Theme = {
  ...baseTheme,
  colors: darkColors,
};

// Default export is light theme for backward compatibility
const theme = lightTheme;

export default theme;
export { lightTheme, darkTheme };

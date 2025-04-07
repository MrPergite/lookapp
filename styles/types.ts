type ColorPalette = {
  primary: {
    pink: string;
    purple: string;
    lavender: string;
    periwinkle: string;
    white: string;
    paleWhite: string;
    green: string;
    bgGreen: string;
  };
  secondary: {
    veryLightGray: string;
    lightGray: string;
    mediumLightGray: string;
    mediumGray: string;
    darkGray: string;
    mediumDarkGray: string;
    veryDarkGray: string;
    underlineGray: string;
    black: string;
  };
  background: string;
  card: string;
  text: string;
  border: string;
  error: string;
  // success: string;
  // warning: string;
  custom: Record<string, string>;
};

type Spacing = {
  xs: number;
  sm: number;
  md: number;
  lg: number;
  xl: number;
  custom: Record<string, number>;
};

type Opacity = {
  low: number;
  medium: number;
  high: number;
  full: number;
  custom: Record<string, number>;
};

export type Theme = {
  colors: ColorPalette;
  spacing: Spacing;
  opacity: Opacity;
  extendTheme: (overrides: Partial<Theme>) => Theme;
};

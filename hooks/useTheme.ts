import { useColorScheme } from 'react-native';
import theme, { lightTheme, darkTheme } from '@/styles/theme';
import { Theme } from '@/styles/types';

/**
 * Custom hook that returns the appropriate theme based on the device's color scheme
 */
export function useAppTheme(): Theme {
  const colorScheme = useColorScheme();
  
  // Return dark theme when color scheme is dark, otherwise return light theme
  return colorScheme === 'dark' ? darkTheme : lightTheme;
}

// Default export for backward compatibility
export default useAppTheme; 
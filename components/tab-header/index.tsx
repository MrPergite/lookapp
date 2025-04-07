import React from 'react';
import { SafeAreaView, StyleSheet, TouchableOpacity, View } from 'react-native';
import { ThemedText } from '../ThemedText';
import useAppTheme from '@/hooks/useTheme';
import { Theme } from '@/styles/types';
import { LogIn, LogOut } from 'lucide-react-native';

interface HeaderProps {
  title: string;
  label: string;
  onLogout?: () => void;
  isLogin?: boolean;
}

export function TabHeader({ title, label, onLogout,isLogin }: HeaderProps) {
  const theme = useAppTheme();
  const styles = createStyles(theme);

  return (
   <SafeAreaView>
     <View style={styles.container}>
      <ThemedText type="subtitle" style={styles.title}>
        {title}
      </ThemedText>
      <TouchableOpacity
        style={styles.logoutButton}
        onPress={onLogout}
        activeOpacity={theme.opacity.medium}
      >
        {isLogin ? <LogIn color={theme.colors.secondary.black} /> : <LogOut color={theme.colors.secondary.black} />}        
      </TouchableOpacity>
    </View>
   </SafeAreaView>
  );
}

const createStyles = (theme: Theme) => StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.sm,
    backgroundColor: theme.colors.background,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
    width: '100%',
    justifyContent: 'space-between',
  },
  title: {
    // flex: 1,
  },
  logoutButton: {
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.xs,
    borderRadius: theme.spacing.xs,
  },
  logoutText: {
    fontWeight: '600',
  },
}); 
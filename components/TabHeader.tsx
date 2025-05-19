// TabHeader.tsx

import React from 'react';
import {
  SafeAreaView,
  View,
  Image,
  Pressable,
  StyleSheet,
  Platform,
  useColorScheme,
} from 'react-native';
import { UserCircle } from 'lucide-react-native';
import theme from '@/styles/theme';

interface TabHeaderProps {
  onProfilePress: () => void;
}

export const TabHeader: React.FC<TabHeaderProps> = ({ onProfilePress }) => {
  const isDark = useColorScheme() === 'dark';

  return (
    <SafeAreaView style={[styles.safeArea, {
      backgroundColor: isDark ? '#1F2937' : theme.colors.primary.white,
    }]}>
      <View style={styles.headerContainer}>
        {/* left spacer */}
        <View style={styles.sideContainer} />

        {/* logo */}
        <View style={styles.logoContainer}>
          <Image
            source={require('@/assets/images/image.png')}
            style={styles.logo}
            resizeMode="contain"
          />
        </View>

        {/* profile icon */}
        <View style={[styles.sideContainer, styles.profileIconContainer]}>
          <Pressable onPress={onProfilePress} hitSlop={10}>
            <UserCircle size={24} color={theme.colors.primary.purple} />
          </Pressable>
        </View>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  // absolutely fixed header
  safeArea: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    // shadow-md
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 4, // for Android
    zIndex: 50,
  },
  headerContainer: {
    flexDirection: 'row',
    alignItems: 'center',    // items-center
    justifyContent: 'space-between',
    height: 40,              // h-10 (40px)
    paddingHorizontal: 16,
  },
  sideContainer: {
    flex: 1,
  },
  logoContainer: {
    flex: 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  logo: {
    width: 56,
    height: 56,
  },
  profileIconContainer: {
    alignItems: 'flex-end',
    justifyContent: 'center',
  },
});

export default TabHeader;

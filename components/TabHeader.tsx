// TabHeader.tsx

import React, { useRef } from 'react';
import {
  SafeAreaView,
  View,
  Image,
  Pressable,
  StyleSheet,
  Platform,
  useColorScheme,
  Animated,
} from 'react-native';
import { UserCircle } from 'lucide-react-native';
import theme from '@/styles/theme';
import * as Haptics from 'expo-haptics';

interface TabHeaderProps {
  onProfilePress: () => void;
}

export const TabHeader: React.FC<TabHeaderProps> = ({ onProfilePress }) => {
  const isDark = useColorScheme() === 'dark';
  const scaleAnim = useRef(new Animated.Value(1)).current;
  const opacityAnim = useRef(new Animated.Value(0)).current;

  // Shadow opacity animation
  const shadowOpacity = opacityAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0, 0.5]
  });

  const handleProfilePress = () => {
    // Trigger haptic feedback
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    
    // Animate scale with a bounce effect
    Animated.sequence([
      // Scale down quickly
      Animated.timing(scaleAnim, {
        toValue: 0.85,
        duration: 80,
        useNativeDriver: true,
      }),
      // Scale up with slight overshoot
      Animated.spring(scaleAnim, {
        toValue: 1.15,
        friction: 3,  // Lower friction for more bounce
        tension: 40,  // Adjust tension for bounce strength
        useNativeDriver: true,
      }),
      // Scale back to normal
      Animated.spring(scaleAnim, {
        toValue: 1,
        friction: 5,
        tension: 40,
        useNativeDriver: true,
      }),
    ]).start();
    
    // Animate shadow/glow effect
    Animated.sequence([
      Animated.timing(opacityAnim, {
        toValue: 1,
        duration: 100,
        useNativeDriver: false,
      }),
      Animated.timing(opacityAnim, {
        toValue: 0,
        duration: 500,
        useNativeDriver: false,
      }),
    ]).start();
    
    // Call the original callback
    onProfilePress();
  };

  return (
    <SafeAreaView style={[styles.safeArea, {
      backgroundColor: isDark ? '#1F2937' : theme.colors.primary.white,
    }]}>
      <View style={styles.headerContainer}>
        {/* left spacer */}
        <View style={styles.sideContainer} />

        {/* logo */}
        {/* <View style={styles.logoContainer}>
          <Image
            source={require('@/assets/images/image.png')}
            style={styles.logo}
            resizeMode="contain"
          />
        </View> */}

        {/* profile icon */}
        <View style={[styles.sideContainer, styles.profileIconContainer]}>
          <Pressable onPress={handleProfilePress} hitSlop={15}>
            <View style={styles.iconWrapper}>
              <Animated.View style={[
                styles.glowEffect,
                {
                  opacity: opacityAnim,
                }
              ]} />
              <Animated.View style={{
                transform: [{ scale: scaleAnim }],
                zIndex: 2,
              }}>
                <UserCircle size={26} color={'rgb(147, 51, 234)'} />
              </Animated.View>
            </View>
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
    zIndex: 10,
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
  iconWrapper: {
    position: 'relative',
    width: 40, 
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  glowEffect: {
    position: 'absolute',
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: 'rgb(147, 51, 234)',
    zIndex: 1,
  },
});

export default TabHeader;

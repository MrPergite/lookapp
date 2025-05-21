// Skeleton.tsx

import React, { useRef, useEffect } from 'react';
import {
  Animated,
  ViewProps,
  StyleSheet,
  ViewStyle,
  View,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import theme from '@/styles/theme'; // adjust your import

interface SkeletonProps extends ViewProps {
  style?: ViewStyle;
  shimmerColors?: string[];
}

export function Skeleton({ style, shimmerColors, ...props }: SkeletonProps) {
  // Animated value for opacity pulsing (blinking)
  const opacity = useRef(new Animated.Value(0.2)).current;

  useEffect(() => {
    // Create blinking animation with more dramatic effect
    const pulse = Animated.loop(
      Animated.sequence([
        Animated.timing(opacity, {
          toValue: 0.8,
          duration: 500,
          useNativeDriver: true,
        }),
        Animated.timing(opacity, {
          toValue: 0.2,
          duration: 500,
          useNativeDriver: true,
        }),
      ])
    );
    
    // Start blinking animation
    pulse.start();
    
    // Clean up animation
    return () => {
      pulse.stop();
    };
  }, [opacity]);

  // Default shimmer colors
  const defaultColors = ['#f5f5f5', '#e0e0e0', '#f5f5f5'];
  const gradientColors = shimmerColors || defaultColors;

  return (
    <View style={[styles.container, style]} {...props}>
      <View style={[styles.base, { backgroundColor: '#e0e0e0' }]} />
      <Animated.View
        style={[
          StyleSheet.absoluteFillObject,
          {
            opacity,
          },
        ]}
      >
        <LinearGradient
          style={StyleSheet.absoluteFillObject}
          colors={gradientColors as [string, string, string]}
          start={{ x: 0, y: 0.5 }}
          end={{ x: 1, y: 0.5 }}
        />
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    overflow: 'hidden',
    borderRadius: 4, // rounded-md (~4px)
  },
  base: {
    width: '100%',
    height: '100%',
    borderRadius: 4, // rounded-md (~4px)
  },
});

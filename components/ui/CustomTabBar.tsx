import React, { useEffect } from 'react';
import { View, TouchableOpacity, StyleSheet, Dimensions } from 'react-native';
import { BottomTabBarProps } from '@react-navigation/bottom-tabs';
import Animated, { 
  useSharedValue, 
  useAnimatedStyle, 
  withSpring, 
  withRepeat,
  withTiming,
  Easing,
  interpolateColor,
  useDerivedValue
} from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import theme from '@/styles/theme';
import { Text } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Archive, Camera, MessageCircle, ShoppingCart, UserCircle } from 'lucide-react-native';
import * as Haptics from 'expo-haptics';

const { width } = Dimensions.get('window');

export default function CustomTabBar({ state, descriptors, navigation }: BottomTabBarProps) {
  const insets = useSafeAreaInsets();
  
  // Animation values
  const indicatorPosition = useSharedValue(0);
  const indicatorWidth = useSharedValue(0);
  const pulseScale = useSharedValue(1);
  const glowOpacity = useSharedValue(0.2);
  
  // Update indicator position when tab changes
  useEffect(() => {
    const tabWidth = width / state.routes.length;
    indicatorPosition.value = withSpring(state.index * tabWidth, {
      damping: 15,
      stiffness: 120,
    });
    indicatorWidth.value = withSpring(tabWidth / 2, {
      damping: 15, 
      stiffness: 120,
    });
    
    // Reset and restart pulse animations
    pulseScale.value = 1;
    glowOpacity.value = 0.2;
    
    // Start repeating pulse animation
    pulseScale.value = withRepeat(
      withTiming(1.4, { duration: 1500, easing: Easing.bezier(0.25, 0.1, 0.25, 1) }), 
      -1, // Infinite repetitions
      true // Reverse
    );
    
    // Glow animation
    glowOpacity.value = withRepeat(
      withTiming(0.6, { duration: 1000, easing: Easing.bezier(0.25, 0.1, 0.25, 1) }),
      -1,
      true
    );
  }, [state.index, state.routes.length]);

  // Create animated styles for the indicator
  const indicatorStyle = useAnimatedStyle(() => {
    const tabWidth = width / state.routes.length;
    return {
      transform: [
        { translateX: indicatorPosition.value + (tabWidth / 4) }
      ],
      width: indicatorWidth.value,
    };
  });
  
  // Pulse animation style
  const pulseStyle = useAnimatedStyle(() => {
    return {
      transform: [{ scale: pulseScale.value }],
      opacity: glowOpacity.value,
    };
  });

  return (
    <View style={[styles.container, { paddingBottom: insets.bottom }]}>
      {/* Animated tab indicator */}
      <Animated.View style={[styles.indicator, indicatorStyle]}>
        <LinearGradient
          colors={[theme.colors.primary.purple as string, '#ec4899', '#6366f1']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={styles.indicatorGradient}
        />
        <Animated.View style={[styles.indicatorGlow, pulseStyle]} />
      </Animated.View>

      {/* Tab buttons */}
      {state.routes.map((route, index) => {
        const { options } = descriptors[route.key];
        const label = options.title || route.name;
        const isFocused = state.index === index;

        // Animated value for icon scale on focus
        const iconFocusScale = useSharedValue(isFocused ? 1.15 : 1); 
        // Animated value for tab press scale
        const tabPressScale = useSharedValue(1);

        useEffect(() => {
            iconFocusScale.value = withSpring(isFocused ? 1.15 : 1, {
                damping: 10,
                stiffness: 150,
            });
        }, [isFocused, iconFocusScale]);

        const animatedIconStyle = useAnimatedStyle(() => {
            return {
                transform: [{ scale: iconFocusScale.value }],
            };
        });

        const animatedTabPressStyle = useAnimatedStyle(() => {
            return {
                transform: [{ scale: tabPressScale.value }],
            };
        });

        const getTabIcon = (routeName: string, isFocused: boolean) => {
          const color = isFocused ? theme.colors.primary.purple : '#9CA3AF';
          const size = 24;

          const iconMap = {
            'chat': <MessageCircle size={size} color={color} />,
            'virtual-tryon': <Camera size={size} color={color} />,
            'digital-wardrobe': <Archive size={size} color={color} />,
            'shopping-list': <ShoppingCart size={size} color={color} />,
            'profile': <UserCircle size={size} color={color} />,
          };
          
          return iconMap[routeName as keyof typeof iconMap] || null;
        };

        const onPress = () => {
          const event = navigation.emit({
            type: 'tabPress',
            target: route.key,
            canPreventDefault: true,
          });

          if (!isFocused && !event.defaultPrevented) {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            navigation.navigate(route.name);
          }
        };

        // Create an animated wrapper for active tab
        const ActiveTabWrapper = ({ children }: { children: React.ReactNode }) => {
          if (!isFocused) return <>{children}</>;
          
          return (
            <Animated.View style={styles.activeTabContainer}>
              {children}
              <Animated.View style={[styles.activeTabMark]}>
                <Animated.View style={[styles.pulse, pulseStyle]} />
              </Animated.View>
            </Animated.View>
          );
        };

        return (
          <TouchableOpacity
            key={route.key}
            accessibilityRole="button"
            accessibilityState={isFocused ? { selected: true } : {}}
            onPress={onPress}
            style={styles.tabButton}
          >
            <ActiveTabWrapper>
              <Animated.View style={[animatedIconStyle]}>
                {getTabIcon(route.name, isFocused)}
              </Animated.View>
              <Text style={[
                styles.label, 
                { color: isFocused ? theme.colors.primary.purple : '#9CA3AF' }
              ]}>
                {label}
              </Text>
            </ActiveTabWrapper>
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    backgroundColor: 'white',
    borderTopWidth: 1,
    borderTopColor: '#F3F4F6',
    position: 'relative',
    paddingTop: 8,
  },
  tabButton: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
    position: 'relative',
  },
  activeTabContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  label: {
    fontSize: 10,
    marginTop: 4,
    fontWeight: '500',
  },
  indicator: {
    height: 4,
    position: 'absolute',
    top: 0,
    borderRadius: 2,
    overflow: 'hidden',
  },
  indicatorGradient: {
    width: '100%',
    height: '100%',
  },
  indicatorGlow: {
    position: 'absolute',
    width: '150%',
    height: '400%',
    top: '-150%',
    left: '-25%',
    borderRadius: 10,
    backgroundColor: theme.colors.primary.purple,
    opacity: 0.2,
  },
  activeTabMark: {
    position: 'absolute',
    bottom: '100%',
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: theme.colors.primary.purple,
    marginBottom: 4,
  },
  pulse: {
    position: 'absolute',
    top: -3,
    left: -3,
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: 'rgba(139, 92, 246, 0.3)',
  },
}); 
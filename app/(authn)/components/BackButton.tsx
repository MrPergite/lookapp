import React, { useRef, useEffect } from 'react';
import { TouchableOpacity, StyleSheet, ViewStyle, StyleProp, View, Animated, Text } from 'react-native';
import { useRouter } from 'expo-router';
import useAppTheme from '@/hooks/useTheme';
import * as Haptics from "expo-haptics";
import { ChevronLeft, ArrowLeft } from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient';

interface BackButtonProps {
  customStyle?: StyleProp<ViewStyle>;
  variant?: 'pill' | 'circle' | 'minimal';
  showText?: boolean;
}

const BackButton: React.FC<BackButtonProps> = ({ 
  customStyle = {}, 
  variant = 'pill', 
  showText = false 
}) => {
  const router = useRouter();
  const appTheme = useAppTheme();
  const scaleAnim = useRef(new Animated.Value(1)).current;
  const bounceAnim = useRef(new Animated.Value(0)).current;
  
  // Add initial bounce animation when component mounts
  useEffect(() => {
    startBounceAnimation();
    
    // Optional: Set up an interval to occasionally bounce the button for attention
    const bounceInterval = setInterval(() => {
      startBounceAnimation();
    }, 30000); // Every 30 seconds
    
    return () => clearInterval(bounceInterval);
  }, []);
  
  const startBounceAnimation = () => {
    Animated.sequence([
      Animated.timing(bounceAnim, {
        toValue: 1,
        duration: 150,
        useNativeDriver: true,
      }),
      Animated.timing(bounceAnim, {
        toValue: 0,
        duration: 150,
        useNativeDriver: true,
      })
    ]).start();
  };

  const handlePress = () => {
    // Play haptic feedback
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    
    // Visual feedback animation - more pronounced scale effect
    Animated.sequence([
      Animated.timing(scaleAnim, {
        toValue: 0.85,
        duration: 100,
        useNativeDriver: true,
      }),
      Animated.timing(scaleAnim, {
        toValue: 1.05,
        duration: 100,
        useNativeDriver: true,
      }),
      Animated.timing(scaleAnim, {
        toValue: 1,
        duration: 100,
        useNativeDriver: true,
      }),
    ]).start();
    
    // Navigate back
    router.back();
  };
  
  // Combine scale and bounce animations
  const animatedStyle = {
    transform: [
      { scale: scaleAnim },
      { translateY: bounceAnim.interpolate({
        inputRange: [0, 1],
        outputRange: [0, -5]
      })}
    ]
  };

  // Content components for each button type
  const renderPillContent = () => (
    <View style={styles.pillContent}>
      <ArrowLeft size={18} color="#9c5ef0" strokeWidth={2.5} />
      {showText && <Text style={styles.pillText}>Back</Text>}
    </View>
  );
  
  const renderCircleContent = () => (
    <LinearGradient
      colors={['#ec4899', '#8b5cf6']}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 0 }}
      style={styles.gradient}
    >
      <ChevronLeft size={28} color="#FFFFFF" />
    </LinearGradient>
  );
  
  const renderMinimalContent = () => (
    <View style={{flexDirection: 'row', alignItems: 'center'}}>
      <ArrowLeft size={24} color="#9c5ef0" strokeWidth={2} />
      {showText && <Text style={styles.minimalText}>Back</Text>}
    </View>
  );

  // Determine which style and content to use
  let buttonStyle;
  let content;
  
  switch (variant) {
    case 'minimal':
      buttonStyle = [styles.minimalButton, customStyle];
      content = renderMinimalContent();
      break;
    case 'pill':
      buttonStyle = [styles.pillButton, customStyle];
      content = renderPillContent();
      break;
    case 'circle':
    default:
      buttonStyle = [styles.circleButton, customStyle];
      content = renderCircleContent();
      break;
  }

  return (
    <Animated.View style={[animatedStyle, {zIndex: 1000}]}>
      <TouchableOpacity
        style={buttonStyle}
        onPress={handlePress}
        activeOpacity={0.7}
        hitSlop={{ top: 15, bottom: 15, left: 15, right: 15 }}
      >
        {content}
      </TouchableOpacity>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  // Original circle button
  circleButton: {
    position: 'absolute',
    top: 50,
    left: 20,
    zIndex: 1000,
    width: 40,
    height: 40,
    borderRadius: 20,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  gradient: {
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
  },
  
  // New pill-shaped button
  pillButton: {
    position: 'absolute',
    top: 50,
    left: 20,
    zIndex: 1000,
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: 'rgba(245, 243, 255, 0.95)',
    borderWidth: 1,
    borderColor: '#E9D5FF',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 1,
  },
  pillContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  pillText: {
    marginLeft: 4,
    fontSize: 14,
    fontFamily: 'default-medium',
    color: '#9c5ef0',
  },
  
  // Minimal button (just icon)
  minimalButton: {
    position: 'absolute',
    top: 50,
    left: 20,
    zIndex: 1000,
    padding: 5, // Add some padding to increase touch area
    flexDirection: 'row',
    alignItems: 'center',
  },
  minimalText: {
    marginLeft: 6,
    fontSize: 16,
    fontFamily: 'default-medium',
    color: '#9c5ef0',
  }
});

export default BackButton; 
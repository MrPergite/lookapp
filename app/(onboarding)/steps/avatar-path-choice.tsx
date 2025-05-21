import React, { useEffect, useState, useRef } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Platform, Animated } from 'react-native';
import { MotiView, AnimatePresence } from 'moti';
import { Camera, Clock, UserRound, ArrowRight } from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient';
import theme from '@/styles/theme';
import { useOnBoarding } from '../context';
import { ThemedText } from '@/components/ThemedText';

interface AvatarPathChoiceProps {
  onBack?: () => void;
  onNext?: (path: 'custom' | 'premade') => void;
}

const AvatarPathChoice: React.FC<AvatarPathChoiceProps> = ({ onBack, onNext }) => {
  const { payload, dispatch } = useOnBoarding();
  // Initialize selectedPath to null to ensure no initial visual selection
  const [selectedPath, setSelectedPath] = useState<string | null>(null);

  // Animation values for icon pulse
  const pulseAnim = useRef(new Animated.Value(1)).current;

  // Start pulse animation when path is selected
  useEffect(() => {
    if (selectedPath) {
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1.2,
          duration: 200,
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 200,
          useNativeDriver: true,
        })
      ]).start();
    }
  }, [selectedPath]);

  const handlePathSelect = (path: 'custom' | 'premade') => {
    setSelectedPath(path); // For visual feedback
    
    // Animate selection
    Animated.sequence([
      Animated.timing(pulseAnim, {
        toValue: 1.2,
        duration: 200,
        useNativeDriver: true,
      }),
      Animated.timing(pulseAnim, {
        toValue: 1,
        duration: 200,
        useNativeDriver: true,
      })
    ]).start();
    
    dispatch({
      type: 'SET_PAYLOAD',
      payload: { key: 'avatarPath', value: path },
    });
    
    // Delay navigation to allow animation to complete
    setTimeout(() => {
      if (onNext) {
        onNext(path);
      }
    }, 300);
  };

  const options = [
    {
      key: 'custom',
      title: 'Create Your Own Avatar',
      description: 'Upload 3-5 images of yourself',
      time: 'Takes about 2 minutes',
      icon: Camera,
      gradientColors: ['#8B5CF6', '#EC4899', '#3B82F6'] as const,
    },
    {
      key: 'premade',
      title: 'Use Pre-made Avatar',
      description: 'Choose from our selection of ready-to-use avatars',
      time: 'Quick setup',
      icon: UserRound,
      gradientColors: ['#8B5CF6', '#EC4899', '#3B82F6'] as const,
    },
  ];

  return (
    <MotiView
      style={styles.container}
      from={{ opacity: 0, translateY: 20 }}
      animate={{ opacity: 1, translateY: 0 }}
      transition={{
        delay: 100, // milliseconds
        type: 'timing',
        duration: 300,
      }}
    >
      <View style={styles.contentContainer}>
        {options.map((option, index) => {
          const IconComponent = option.icon;
          const isSelected = selectedPath === option.key;
          
          return (
            <MotiView
              key={option.key}
              from={{ opacity: 0, translateX: -20 }}
              animate={{ opacity: 1, translateX: 0 }}
              transition={{
                type: 'timing',
                duration: 400,
                delay: 150 + (index * 150), // Staggered entrance
              }}
            >
              <TouchableOpacity
                style={[
                  styles.optionButton,
                  isSelected && styles.selectedOptionButton
                ]}
                onPress={() => handlePathSelect(option.key as 'custom' | 'premade')}
                activeOpacity={0.85}
              >
                <View style={styles.buttonContent}>
                  <Animated.View 
                    style={[
                      { transform: [{ scale: isSelected ? pulseAnim : 1 }] }
                    ]}
                  >
                    <LinearGradient
                      colors={option.gradientColors}
                      start={{ x: 0, y: 0 }}
                      end={{ x: 1, y: 0 }}
                      style={styles.iconContainer}
                    >
                      <IconComponent color="white" size={28} />
                    </LinearGradient>
                  </Animated.View>
                  <View style={styles.textContainer}>
                    <ThemedText style={styles.titleText}>{option.title}</ThemedText>
                    <ThemedText style={styles.descriptionText}>{option.description}</ThemedText>
                    <View style={styles.timeContainer}>
                      <Clock color={theme.colors.secondary.darkGray} size={12} style={styles.timeIcon} />
                      <ThemedText style={styles.timeText}>{option.time}</ThemedText>
                    </View>
                  </View>
                  
                  {isSelected && (
                    <MotiView
                      from={{ opacity: 0, scale: 0.8 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{
                        type: 'spring',
                        stiffness: 300,
                        damping: 20,
                      }}
                      style={styles.selectedIndicator}
                    >
                      <ArrowRight color="white" size={16} />
                    </MotiView>
                  )}
                </View>
              </TouchableOpacity>
            </MotiView>
          );
        })}
      </View>
    </MotiView>
  );
};

const styles = StyleSheet.create({
  container: {
    width: '100%',
    minHeight: 100,
    paddingHorizontal: theme.spacing.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  contentContainer: {
    width: '100%',
    paddingTop: theme.spacing.lg,
    gap: theme.spacing.lg,
  },
  optionButton: {
    width: '100%',
    padding: 16,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#E9D5FF', // Tailwind purple-200
    backgroundColor: '#FFFFFF',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    ...Platform.select({
      android: {
        elevation: 2,
      },
    }),
    position: 'relative',
    overflow: 'hidden',
  },
  selectedOptionButton: {
    borderColor: theme.colors.primary.purple,
    borderWidth: 2,
    backgroundColor: '#F3E8FF',
  },
  buttonContent: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: theme.spacing.md,
  },
  iconContainer: {
    padding: theme.spacing.sm,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#8B5CF6',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 3,
  },
  textContainer: {
    flex: 1,
    gap: theme.spacing.xs / 2,
  },
  titleText: {
    fontFamily: 'Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, Segoe UI, Roboto, Helvetica Neue, Arial, Noto Sans, sans-serif, Apple Color Emoji, Segoe UI Emoji, Segoe UI Symbol, Noto Color Emoji;',
    fontSize: 16,
    color: '#1F2937',
    fontWeight: '600',
  },
  descriptionText: {
    fontFamily: 'default-regular',
    fontSize: 14,
    lineHeight: 20,
    color: 'rgba(75 85 99 / 1)',
    marginTop: theme.spacing.xs / 2,
  },
  timeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: theme.spacing.sm,
  },
  timeIcon: {
    marginRight: 4,
  },
  timeText: {
    fontFamily: 'Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, Segoe UI, Roboto, Helvetica Neue, Arial, Noto Sans, sans-serif, Apple Color Emoji, Segoe UI Emoji, Segoe UI Symbol, Noto Color Emoji;',
    fontSize: 12,
    color: 'rgba(107 114 128 / 1)',
  },
  selectedIndicator: {
    position: 'absolute',
    right: 0,
    top: '50%',
    marginTop: -12,
    backgroundColor: theme.colors.primary.purple,
    width: 24,
    height: 24,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
});

export default AvatarPathChoice; 
import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Platform } from 'react-native';
import { MotiView } from 'moti';
import { Camera, Clock, UserRound } from 'lucide-react-native';
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

  const handlePathSelect = (path: 'custom' | 'premade') => {
    setSelectedPath(path); // For visual feedback
    dispatch({
      type: 'SET_PAYLOAD',
      payload: { key: 'avatarPath', value: path },
    });
    if (onNext) {
      onNext(path);
    }
  };

  const options = [
    {
      key: 'custom',
      title: 'Create Your Own Avatar',
      description: 'Upload 3-5 images of yourself',
      time: 'Takes about 2 minutes',
      icon: Camera,
      gradientColors: ['#ec4899', '#a855f7'], // pink-500 to purple-500
    },
    {
      key: 'premade',
      title: 'Use Pre-made Avatar',
      description: 'Choose from our selection of ready-to-use avatars',
      time: 'Quick setup',
      icon: UserRound,
      gradientColors: ['#ec4899', '#a855f7'], // pink-500 to purple-500
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
        {options.map((option) => {
          const IconComponent = option.icon;
          const isSelected = selectedPath === option.key;
          return (
            <TouchableOpacity
              key={option.key}
              style={[
                styles.optionButton,
                isSelected && styles.selectedOptionButton
              ]}
              onPress={() => handlePathSelect(option.key as 'custom' | 'premade')}
              activeOpacity={0.7}
            >
              <View style={styles.buttonContent}>
                <LinearGradient
                  colors={option.gradientColors as [string, string, ...string[]]}
                  style={styles.iconContainer}
                >
                  <IconComponent color="white" size={28} />
                </LinearGradient>
                <View style={styles.textContainer}>
                  <ThemedText style={styles.titleText}>{option.title}</ThemedText>
                  <ThemedText style={styles.descriptionText}>{option.description}</ThemedText>
                  <View style={styles.timeContainer}>
                    <Clock color={theme.colors.secondary.darkGray} size={12} style={styles.timeIcon} />
                    <ThemedText style={styles.timeText}>{option.time}</ThemedText>
                  </View>
                </View>
              </View>
            </TouchableOpacity>
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
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    ...Platform.select({
      android: {
        elevation: 1,
      },
    }),
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
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
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
});

export default AvatarPathChoice; 
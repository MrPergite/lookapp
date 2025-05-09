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
      gradientColors: ['#ec4899', '#8b5cf6'], // pink-500 to purple-500
    },
    {
      key: 'premade',
      title: 'Use Pre-made Avatar',
      description: 'Choose from our selection of ready-to-use avatars',
      time: 'Quick setup',
      icon: UserRound,
      gradientColors: ['#ec4899', '#8b5cf6'], // pink-500 to purple-500
    },
  ];

  return (
    <MotiView
      style={styles.container}
      animate={{ opacity: 1, translateY: 0 }}
    >
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
                  <Clock color={theme.colors.secondary.darkGray} size={14} style={styles.timeIcon} />
                  <ThemedText style={styles.timeText}>{option.time}</ThemedText>
                </View>
              </View>
            </View>
          </TouchableOpacity>
        );
      })}
    </MotiView>
  );
};

const styles = StyleSheet.create({
  container: {
    width: '100%',
    paddingHorizontal: theme.spacing.md,
    alignItems: 'center',
    gap: theme.spacing.md,
  },
  optionButton: {
    width: '100%',
    maxWidth: 400,
    padding: theme.spacing.md,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: theme.colors.secondary.lightGray,
    backgroundColor: '#FFFFFF',
    ...Platform.select({
      ios: {
        shadowColor: theme.colors.secondary.darkGray,
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
      },
      android: {
        elevation: 3,
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
    fontFamily: 'default-semibold',
    fontSize: 17,
    color: '#1F2937',
  },
  descriptionText: {
    fontFamily: 'default-regular',
    fontSize: 14,
    color: '#6B7280',
    marginTop: theme.spacing.xs / 2,
  },
  timeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: theme.spacing.sm,
  },
  timeIcon: {
    marginRight: theme.spacing.xs / 2,
  },
  timeText: {
    fontFamily: 'default-regular',
    fontSize: 13,
    color: '#9CA3AF',
  },
});

export default AvatarPathChoice; 
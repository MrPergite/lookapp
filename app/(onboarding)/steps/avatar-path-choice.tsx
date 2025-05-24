import React, { useEffect, useState, useRef } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Platform, Animated, Dimensions, Image } from 'react-native';
import { MotiView, AnimatePresence } from 'moti';
import { Camera, Clock, UserRound, Check } from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient';
import theme from '@/styles/theme';
import { useOnBoarding } from '../context';
import { ThemedText } from '@/components/ThemedText';
import * as Haptics from 'expo-haptics';
import MaskedView from '@react-native-masked-view/masked-view';

const { width, height } = Dimensions.get('window');

interface AvatarPathChoiceProps {
  onBack?: () => void;
  onNext?: (path: 'custom' | 'premade') => void;
}

const AvatarPathChoice: React.FC<AvatarPathChoiceProps> = ({ onBack, onNext }) => {
  const { payload, dispatch } = useOnBoarding();
  // Initialize selectedPath based on payload or null
  const [selectedPath, setSelectedPath] = useState<string | null>(payload?.avatarPath || null);

  // Animation values
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const titleOpacity = useRef(new Animated.Value(0)).current;
  const titleTranslateY = useRef(new Animated.Value(-20)).current;

  // Start entrance animations
  useEffect(() => {
    // Title animation
    Animated.parallel([
      Animated.timing(titleOpacity, {
        toValue: 1,
        duration: 600,
        useNativeDriver: true,
      }),
      Animated.timing(titleTranslateY, {
        toValue: 0,
        duration: 600,
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

  // Start pulse animation when path is selected
  useEffect(() => {
    if (selectedPath) {
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1.1,
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
    // Add medium haptic feedback
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    
    setSelectedPath(path);
    dispatch({
        type: "SET_PAYLOAD",
        payload: { key: "avatarPath", value: path }
    });
    
    // Delay navigation to allow animation to complete
    setTimeout(() => {
      if (onNext) {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        onNext(path);
      }
    }, 400);
  };

  const options = [
    {
      key: 'custom',
      title: 'Create Your Own Avatar',
      description: 'Upload 3-5 images of yourself',
      time: 'Takes about 2 minutes',
      icon: Camera,
      gradientColors: ['#9333EA', '#A855F7', '#7C3AED'] as const,
      previewType: 'custom',
    },
    {
      key: 'premade',
      title: 'Use Pre-made Avatar',
      description: 'Choose from our selection of ready-to-use avatars',
      time: 'Quick setup',
      icon: UserRound,
      gradientColors: ['#9333EA', '#A855F7', '#7C3AED'] as const,
      previewType: 'premade',
    },
  ];

  return (
    <View style={styles.pageContainer}>
      {/* Background pattern elements */}
      <View style={styles.patternContainer}>
        {[...Array(15)].map((_, i) => (
          <View 
            key={i} 
            style={[
              styles.patternItem, 
              { 
                left: Math.random() * width, 
                top: Math.random() * height * 0.7,
                opacity: 0.03 + (Math.random() * 0.05), // Between 0.03 and 0.08
                transform: [{ rotate: `${Math.random() * 360}deg` }]
              }
            ]} 
          />
        ))}
      </View>

      <LinearGradient
        colors={['#ffffff', '#f5f3ff', '#f0f9ff']}
        style={styles.gradientBackground}
      >
        <MotiView
          style={styles.container}
          from={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{
            delay: 100,
            type: 'timing',
            duration: 300,
          }}
        >
          {/* Title with gradient text */}
          <MaskedView
            style={styles.titleContainer}
            maskElement={
              <Text style={styles.titleHeading}>
                Choose Your Avatar Path
              </Text>
            }
          >
            <LinearGradient
              colors={['#8B5CF6', '#EC4899', '#3B82F6']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={{ height: 40 }}
            />
          </MaskedView>

          
          <View style={styles.contentContainer}>
            {options.map((option, index) => {
              const IconComponent = option.icon;
              const isSelected = selectedPath === option.key;
              
              return (
                <MotiView
                  key={option.key}
                  from={{ opacity: 0, translateY: 20 }}
                  animate={{ opacity: 1, translateY: 0 }}
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
                    {/* Left side - Icon */}
                    <View style={styles.leftSide}>
                      <Animated.View 
                        style={[
                          { transform: [{ scale: isSelected ? pulseAnim : 1 }] }
                        ]}
                      >
                        <LinearGradient
                          colors={option.gradientColors}
                          start={{ x: 0.1, y: 0.1 }}
                          end={{ x: 0.9, y: 0.9 }}
                          style={styles.iconContainer}
                        >
                          <IconComponent 
                            color="rgba(255, 255, 255, 0.95)" 
                            size={26}
                            style={styles.icon} 
                          />
                        </LinearGradient>
                      </Animated.View>
                    </View>
                    
                    {/* Center - Content */}
                    <View style={styles.contentColumn}>
                      <View style={styles.textContainer}>
                        <Text style={[
                          styles.titleText,
                          isSelected && styles.selectedTitleText
                        ]}>
                          {option.title}
                        </Text>
                        <Text style={[
                          styles.descriptionText,
                          isSelected && styles.selectedDescriptionText
                        ]}>
                          {option.description}
                        </Text>
                        
                        <View style={styles.timeContainer}>
                          <Clock color={isSelected ? "rgba(255, 255, 255, 0.7)" : theme.colors.secondary.darkGray} size={12} style={styles.timeIcon} />
                          <Text style={[
                            styles.timeText,
                            isSelected && styles.selectedTimeText
                          ]}>
                            {option.time}
                          </Text>
                        </View>
                      </View>
                      
                      {/* Preview thumbnail */}
                      <View style={styles.previewContainer}>
                        <View style={[
                          styles.previewBackground,
                          isSelected ? styles.selectedPreviewBackground : null
                        ]}>
                          {option.previewType === 'custom' ? (
                            <View style={styles.customPreview}>
                              <View style={[
                                styles.customPreviewImage,
                                isSelected && styles.selectedPreviewImage
                              ]} />
                              <View style={[
                                styles.customPreviewImage,
                                isSelected && styles.selectedPreviewImage
                              ]} />
                              <View style={[
                                styles.customPreviewImage,
                                isSelected && styles.selectedPreviewImage
                              ]} />
                            </View>
                          ) : (
                            <View style={styles.premadePreview}>
                              <View style={[
                                styles.premadePreviewImage,
                                isSelected && styles.selectedPreviewImage
                              ]} />
                              <View style={[
                                styles.premadePreviewImage,
                                { opacity: 0.7 },
                                isSelected && styles.selectedPreviewImage
                              ]} />
                              <View style={[
                                styles.premadePreviewImage,
                                { opacity: 0.4 },
                                isSelected && styles.selectedPreviewImage
                              ]} />
                            </View>
                          )}
                        </View>
                      </View>
                    </View>
                    
                    {/* Right side - Selected indicator */}
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
                        <Check color="white" size={16} />
                      </MotiView>
                    )}
                  </TouchableOpacity>
                </MotiView>
              );
            })}
          </View>
        </MotiView>
      </LinearGradient>
    </View>
  );
};

const styles = StyleSheet.create({
  pageContainer: {
    flex: 1,
    position: 'relative',
  },
  gradientBackground: {
    flex: 1,
    width: '100%',
  },
  patternContainer: {
    position: 'absolute',
    width: '100%',
    height: '100%',
    zIndex: 0,
  },
  patternItem: {
    position: 'absolute',
    width: 30,
    height: 30,
    borderRadius: 6,
    backgroundColor: '#8B5CF6',
  },
  container: {
    width: '100%',
    height: '100%',
    paddingHorizontal: theme.spacing.lg,
    alignItems: 'center',
    justifyContent: 'flex-start',
    paddingTop: 20,
  },
  titleContainer: {
    marginBottom: 5,
    alignItems: 'center',
  },
  titleHeading: {
    fontSize: 26,
    fontWeight: '700',
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 16,
    color: '#6B7280',
    textAlign: 'center',
    fontWeight: '500',
    marginBottom: 35,
    marginTop: 8,
  },
  contentContainer: {
    width: '100%',
    gap: 18,
  },
  optionButton: {
    width: '100%',
    paddingVertical: 18,
    paddingHorizontal: 16,
    borderRadius: 24,
    borderWidth: 1,
    borderColor: 'rgba(233, 213, 255, 0.3)', // Very light purple border
    backgroundColor: '#FFFFFF',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
    position: 'relative',
    overflow: 'hidden',
    flexDirection: 'row',
    alignItems: 'center',
  },
  selectedOptionButton: {
    borderColor: '#A78BFA', // More vibrant purple border
    borderWidth: 1,
    backgroundColor: '#A78BFA', // Vibrant purple background
    shadowColor: '#8B5CF6',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 10,
    elevation: 4,
  },
  leftSide: {
    marginRight: 16,
  },
  contentColumn: {
    flex: 1,
    alignItems: 'center',
  },
  iconContainer: {
    padding: 12,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#8B5CF6',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 3,
    width: 54,
    height: 54,
    borderWidth: 0.5,
    borderColor: 'rgba(255, 255, 255, 0.2)',
  },
  icon: {
    shadowColor: 'rgba(0, 0, 0, 0.4)',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
  },
  textContainer: {
    width: '100%',
    alignItems: 'center',
    gap: 4,
  },
  titleText: {
    fontSize: 17,
    color: '#1F2937',
    fontWeight: '600',
    marginBottom: 2,
    textAlign: 'center',
  },
  selectedTitleText: {
    color: '#FFFFFF',
    fontWeight: '700',
  },
  descriptionText: {
    fontSize: 14,
    lineHeight: 18,
    color: 'rgba(75, 85, 99, 1)',
    marginBottom: 4,
    textAlign: 'center',
  },
  selectedDescriptionText: {
    color: 'rgba(255, 255, 255, 0.9)',
  },
  timeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  timeIcon: {
    marginRight: 6,
  },
  timeText: {
    fontSize: 12,
    color: 'rgba(107, 114, 128, 1)',
  },
  selectedTimeText: {
    color: 'rgba(255, 255, 255, 0.7)',
  },
  selectedIndicator: {
    backgroundColor: '#7C3AED', // Deeper purple for the check
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 8,
    shadowColor: 'rgba(0, 0, 0, 0.3)',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 3,
    elevation: 3,
  },
  previewContainer: {
    width: '90%',
    height: 55,
    borderRadius: 12,
    overflow: 'hidden',
    marginTop: 0,
  },
  previewBackground: {
    width: '100%',
    height: '100%',
    padding: 8,
    justifyContent: 'center',
    backgroundColor: 'rgba(233, 213, 255, 0.3)', // Very light purple background
    borderRadius: 12,
  },
  selectedPreviewBackground: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)', // Slightly white background for selected
  },
  customPreview: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    height: '100%',
  },
  customPreviewImage: {
    width: '30%',
    height: '80%',
    backgroundColor: 'rgba(139, 92, 246, 0.2)',
    borderRadius: 8,
  },
  selectedPreviewImage: {
    backgroundColor: 'rgba(255, 255, 255, 0.3)', // Lighter for better contrast
  },
  premadePreview: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    height: '100%',
  },
  premadePreviewImage: {
    width: 28,
    height: 28,
    backgroundColor: 'rgba(139, 92, 246, 0.2)',
    borderRadius: 14,
  },
});

export default AvatarPathChoice; 
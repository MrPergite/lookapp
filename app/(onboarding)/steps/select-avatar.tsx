import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Dimensions,
  ScrollView,
  Animated,
  Easing,
} from 'react-native';
import theme from '@/styles/theme';
import { AVATARS } from '@/constants';
import { useOnBoarding } from '../context';
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { MotiView, AnimatePresence } from 'moti';
import * as Haptics from 'expo-haptics';
import { Check } from 'lucide-react-native';
import MaskedView from '@react-native-masked-view/masked-view';

const { width, height } = Dimensions.get('window');

// Define the Avatar type
interface Avatar {
  id: string;
  name: string;
  src: string;
  gender: string;
}

interface SelectAvatarsProps {
  goToNextStep: () => void;
}

function SelectAvatars({ goToNextStep }: SelectAvatarsProps) {
  const { payload, dispatch } = useOnBoarding();
  const [selectedAvatar, setSelectedAvatar] = useState<string | null>(payload.pref_avatar_url);
  const avatarScales = useRef(AVATARS.map(() => new Animated.Value(1))).current;

  const handleSelection = (avatar: Avatar) => {
    // Provide haptic feedback
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    
    // Get the index of the selected avatar for animation
    const index = AVATARS.findIndex(a => a.id === avatar.id);
    
    // Animate the selected avatar
    Animated.sequence([
      Animated.timing(avatarScales[index], {
        toValue: 0.95,
        duration: 100,
        useNativeDriver: true,
      }),
      Animated.spring(avatarScales[index], {
        toValue: 1,
        friction: 3,
        tension: 40,
        useNativeDriver: true,
      })
    ]).start();
    
    setSelectedAvatar(avatar.src);

    if (dispatch) {
      dispatch({
        type: "SET_PAYLOAD",
        payload: {
          key: "pref_avatar_url",
          value: avatar.src
        }
      });
    }
  };

  const displayAvatars = AVATARS;
  
  // Background pattern elements
  const renderPatternElements = () => (
    <View style={styles.patternContainer}>
      {[...Array(15)].map((_, i) => (
        <View 
          key={i} 
          style={[
            styles.patternItem, 
            { 
              left: Math.random() * width, 
              top: Math.random() * height * 0.7,
              opacity: 0.03 + (Math.random() * 0.05),
              transform: [{ rotate: `${Math.random() * 360}deg` }]
            }
          ]} 
        />
      ))}
    </View>
  );

  // Make sure avatarScales is referenced in a useEffect to animate on touch
  useEffect(() => {
    // Add a subtle pulse animation for selected avatar
    if (selectedAvatar) {
        const index = AVATARS.findIndex(a => a.src === selectedAvatar);
        if (index !== -1) {
            Animated.sequence([
                Animated.timing(avatarScales[index], {
                    toValue: 0.98,
                    duration: 300,
                    useNativeDriver: true,
                }),
                Animated.spring(avatarScales[index], {
                    toValue: 1,
                    friction: 5,
                    tension: 40,
                    useNativeDriver: true,
                })
            ]).start();
        }
    }
  }, [selectedAvatar]);

  return (
    <View style={styles.container}>
      {renderPatternElements()}
      
      <LinearGradient
        colors={['#ffffff', '#f5f3ff', '#f0f9ff']}
        style={styles.gradientBackground}
      >
        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={{
            paddingHorizontal: 8,
            paddingBottom: 100,
            paddingTop: 10,
          }}
          showsVerticalScrollIndicator={false}
        >
          {/* Heading with gradient text */}
          <View style={styles.headerContainer}>
            <MaskedView
              style={{ height: 50 }}
              maskElement={
                <Text style={styles.title}>
                  Choose Your Avatar
                </Text>
              }
            >
              <LinearGradient
                colors={['#8B5CF6', '#EC4899', '#3B82F6']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={{ height: 50 }}
              />
            </MaskedView>
            
            <Text style={styles.subtitle}>
              Select an avatar for your virtual try-on experience
            </Text>
          </View>

          <View style={styles.gridContainer}>
            {displayAvatars.map((avatar, index) => (
              <Animated.View
                key={avatar.id}
                style={[
                  styles.cardWrapper,
                  {
                    opacity: 1,
                    transform: [
                      { scale: avatarScales[index] },
                    ]
                  }
                ]}
              >
                <TouchableOpacity
                  style={[
                    styles.avatarCard,
                    selectedAvatar === avatar.src && styles.selectedAvatarCard
                  ]}
                  onPress={() => handleSelection(avatar)}
                  activeOpacity={0.9}
                >
                  <View style={styles.imageContainer}>
                    <Image
                      source={{ uri: avatar.src }}
                      style={styles.avatarImage}
                      contentFit='cover'
                      contentPosition={'top'}
                    />
                  </View>

                  {/* Name overlay */}
                  <LinearGradient
                    colors={['rgba(0,0,0,0.7)', 'rgba(0,0,0,0.4)', 'transparent']}
                    start={{ x: 0.5, y: 1 }}
                    end={{ x: 0.5, y: 0.7 }}
                    style={styles.nameContainer}>
                    <Text style={styles.avatarName}>{avatar.name}</Text>
                  </LinearGradient>

                  {/* Selection checkmark */}
                  {selectedAvatar === avatar.src && (
                    <MotiView
                      from={{ opacity: 0, scale: 0.5 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{
                        type: "timing",
                        duration: 300,
                      }}
                      style={styles.checkmarkContainer}
                    >
                      <LinearGradient
                        colors={['#8B5CF6', '#7C3AED']}
                        style={styles.checkmarkGradient}
                      >
                        <Check size={16} color="white" strokeWidth={3} />
                      </LinearGradient>
                    </MotiView>
                  )}
                </TouchableOpacity>
              </Animated.View>
            ))}
          </View>
        </ScrollView>
      </LinearGradient>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
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
  scrollView: {
    flex: 1,
    width: '100%',
  },
  headerContainer: {
    alignItems: 'center',
    marginBottom: 16,
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    textAlign: 'center',
    fontFamily: 'default-bold',
  },
  subtitle: {
    fontSize: 16,
    color: '#6B7280',
    textAlign: 'center',
    fontWeight: '500',
    marginTop: 8,
    lineHeight: 22,
    maxWidth: '90%',
  },
  gridContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    width: '100%',
    paddingHorizontal: 4,
  },
  avatarCard: {
    width: '100%',
    height: '100%',
    borderRadius: 24,
    overflow: 'hidden',
    backgroundColor: "rgba(255, 255, 255, 0.7)",
    position: 'relative',
    borderWidth: 2,
    borderColor: 'rgba(233, 213, 255, 0.6)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.12,
    shadowRadius: 5,
    elevation: 4,
  },
  selectedAvatarCard: {
    borderWidth: 3,
    borderColor: '#9333EA',
    shadowColor: theme.colors.primary.purple,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 8,
  },
  imageContainer: {
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: "rgba(245, 245, 245, 0.7)",
  },
  avatarImage: {
    width: '100%',
    height: '100%',
    backgroundColor: "rgba(245, 245, 245, 0.5)",
  },
  nameContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    paddingVertical: 12,
    alignItems: 'center',
  },
  avatarName: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
    textShadowColor: 'rgba(0, 0, 0, 0.7)',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 3,
  },
  cardWrapper: {
    width: '48%',
    aspectRatio: 0.67,
    marginBottom: 16,
    marginHorizontal: '1%',
  },
  checkmarkContainer: {
    position: 'absolute',
    top: 12,
    right: 12,
    zIndex: 10,
  },
  checkmarkGradient: {
    width: 28,
    height: 28,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: 'rgba(0, 0, 0, 0.4)',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 3,
    elevation: 4,
    borderWidth: 1.5,
    borderColor: 'rgba(255, 255, 255, 0.9)',
  },
  selectionGlow: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    borderRadius: 24,
    opacity: 0.6,
  },
});

export default SelectAvatars;

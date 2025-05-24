import React, { useRef, useState, useEffect } from 'react';
import {
  View,
  StyleSheet,
  ActivityIndicator,
  Text,
  Pressable,
  Dimensions,
  Animated,
  Easing,
  ViewStyle,
  ImageStyle,
} from 'react-native';
import Video, { VideoRef } from 'react-native-video';
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import Feather from 'react-native-vector-icons/Feather';
import { BlurView } from '@react-native-community/blur';
import {OutfitDialog} from './outfit-dialog';
import { useSaveShoppingList } from '../queries/save-shopping-list';
import * as Haptics from 'expo-haptics';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

interface OutfitCardProps {
  darkMode: boolean;
  comingSoon?: boolean;
  resultImage?: string;
  isMobile?: boolean;
  videoUrl?: string;
  outfitItems?: any[];
  outfitName?: string;
  outfitPrice?: string;
  entranceAnimationDelay?: number; // For staggered entrance
}

const OutfitCardMediaSkeleton: React.FC = () => {
    const shimmerAnimation = useRef(new Animated.Value(0)).current;

    useEffect(() => {
        Animated.loop(
            Animated.sequence([
                Animated.timing(shimmerAnimation, {
                    toValue: 1,
                    duration: 1200,
                    useNativeDriver: true,
                }),
                Animated.timing(shimmerAnimation, {
                    toValue: 0,
                    duration: 1200,
                    useNativeDriver: true,
                }),
            ])
        ).start();
    }, [shimmerAnimation]);

    const translateX = shimmerAnimation.interpolate({
        inputRange: [0, 1],
        // Make the shimmer move across the entire card width if mediaContainer is full width
        outputRange: [-SCREEN_WIDTH, SCREEN_WIDTH], 
    });

    return (
        <View style={[styles.mediaContainer, { backgroundColor: '#e0e0e0', overflow: 'hidden' }]}>
            <Animated.View
                style={{
                    width: '300%', 
                    height: '100%',
                    position: 'absolute',
                    transform: [{ translateX }],
                    left: '-100%', 
                }}
            >
                <LinearGradient
                    colors={['#e0e0e0', '#f0f0f0', '#e0e0e0']}
                    start={{ x: 0, y: 0.5 }}
                    end={{ x: 1, y: 0.5 }}
                    style={{ flex: 1 }}
                />
            </Animated.View>
        </View>
    );
};

const OutfitCard: React.FC<OutfitCardProps> = ({
  darkMode,
  comingSoon,
  resultImage,
  isMobile,
  videoUrl,
  outfitItems = [],
  outfitName = 'Casual Outfit',
  outfitPrice,
  entranceAnimationDelay = 0, // Default to 0 if not provided
}) => {
  const videoRef = useRef<VideoRef>(null);
  const cardPressScaleAnim = useRef(new Animated.Value(1)).current; // For card press effect
  const cardPressTranslateYAnim = useRef(new Animated.Value(0)).current; // For card press Y translation
  const cardEntranceAnim = useRef(new Animated.Value(0)).current; // For entrance animation
  const mediaOpacityAnim = useRef(new Animated.Value(0)).current; // For media crossfade
  const seeOutfitButtonScaleAnim = useRef(new Animated.Value(1)).current; // For "See Full Outfit" button press
  const badgeAnim = useRef(new Animated.Value(0)).current;
  const footerAnim = useRef(new Animated.Value(0)).current;
  const priceAnim = useRef(new Animated.Value(0)).current;
  const comingSoonAnim = useRef(new Animated.Value(0)).current;
  const imageDriftAnim = useRef(new Animated.Value(0)).current;
  const isVideo = !!videoUrl;
  const [mediaLoaded, setMediaLoaded] = useState(false);
  const [hasError, setHasError] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [showLoginModal, setShowLoginModal] = useState(false);
  const { savedProducts, savingProducts, saveSuccess, saveError, saveShoppingItem, isPending } = useSaveShoppingList(() => setShowLoginModal(true))

  useEffect(() => {
    // Card entrance animation
    Animated.timing(cardEntranceAnim, {
        toValue: 1,
        duration: 500,
        delay: entranceAnimationDelay, // Use the passed delay
        useNativeDriver: true,
        easing: Easing.out(Easing.cubic), // Smoother easing
    }).start();
  }, [cardEntranceAnim, entranceAnimationDelay]);

  useEffect(() => {
    // Coming Soon overlay animation
    if (comingSoon) {
        Animated.timing(comingSoonAnim, {
            toValue: 1,
            duration: 400,
            useNativeDriver: false, // BlurView might not support native animation for opacity
        }).start();
    } else {
        // Optionally, animate out if comingSoon becomes false, though usually it's fixed per card
        comingSoonAnim.setValue(0);
    }
  }, [comingSoon, comingSoonAnim]);

  useEffect(() => {
    // Media drift animation - start when media is loaded and available
    if (mediaLoaded && !hasError && (resultImage || videoUrl)) {
        Animated.loop(
            Animated.sequence([
                Animated.timing(imageDriftAnim, {
                    toValue: 1, 
                    duration: 4000, // Faster: Was 8000
                    useNativeDriver: true,
                    easing: Easing.bezier(0.42, 0, 0.58, 1),
                }),
                Animated.timing(imageDriftAnim, {
                    toValue: -1, 
                    duration: 6000, // Faster: Was 8000
                    useNativeDriver: true,
                    easing: Easing.bezier(0.42, 0, 0.58, 1),
                }),
                Animated.timing(imageDriftAnim, {
                    toValue: 0, 
                    duration: 6000, // Faster: Was 8000
                    useNativeDriver: true,
                    easing: Easing.bezier(0.42, 0, 0.58, 1),
                }),
            ])
        ).start();
    }
    return () => {
        imageDriftAnim.stopAnimation();
    };
  }, [mediaLoaded, hasError, resultImage, videoUrl, imageDriftAnim]);

  const handleCardPressIn = () => {
    Animated.parallel([
        Animated.spring(cardPressScaleAnim, {
            toValue: isMobile ? 0.97 : 0.98, 
            friction: 7,
            tension: 100,
            useNativeDriver: true,
        }),
        Animated.spring(cardPressTranslateYAnim, { // Animate Y position up slightly
            toValue: -4, // Move up by 4 units
            friction: 7,
            tension: 100,
            useNativeDriver: true,
        })
    ]).start();
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  };

  const handleCardPressOut = () => {
    Animated.parallel([
        Animated.spring(cardPressScaleAnim, {
            toValue: 1, 
            friction: 7,
            tension: 100,
            useNativeDriver: true,
        }),
        Animated.spring(cardPressTranslateYAnim, { // Animate Y position back to 0
            toValue: 0,
            friction: 7,
            tension: 100,
            useNativeDriver: true,
        })
    ]).start();
  };

  const handleError = () => {
    setHasError(true);
    setMediaLoaded(true); 
    mediaOpacityAnim.setValue(1); 
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error); // Haptic for error
  };

  const handleSeeOutfitPressIn = () => {
    Animated.spring(seeOutfitButtonScaleAnim, {
        toValue: 0.96,
        friction: 7,
        tension: 100,
        useNativeDriver: true,
    }).start();
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
  };

  const handleSeeOutfitPressOut = () => {
    Animated.spring(seeOutfitButtonScaleAnim, {
        toValue: 1,
        friction: 7,
        tension: 100,
        useNativeDriver: true,
    }).start();
  };

  // Style for the drifting media Animated.View
  const driftingMediaWrapperStyle: Animated.AnimatedProps<ViewStyle> = {
    width: '110%', 
    height: '100%',
    position: 'absolute', 
    left: '-5%', 
    opacity: mediaOpacityAnim, 
    transform: [
        {
            translateX: imageDriftAnim.interpolate({
                inputRange: [-1, 1],
                outputRange: [-8, 8], 
            }),
        },
    ],
  };

  // Style for the actual Image/Video component inside the drifting wrapper
  const mediaFillStyle: ViewStyle = { // For Video
    width: '100%',
    height: '100%',
  };
  // Separate for expo-image due to stricter ImageStyle typing if needed, though above often works.
  const imageMediaFillStyle: ImageStyle = { // For expo-image Image
    width: '100%',
    height: '100%',
  };

  return (
    <Pressable
      onPress={() => { 
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy); // More significant haptic for opening dialog
        setDialogOpen(true); 
      }}
      onPressIn={handleCardPressIn}
      onPressOut={handleCardPressOut}
      android_ripple={{ color: 'rgba(0,0,0,0.05)' }}
    >
      <Animated.View style={[
        styles.card, 
        darkMode ? styles.darkBg : styles.lightBg, 
        isMobile ? styles.shadow : styles.shadowLg,
        {
          opacity: cardEntranceAnim, // Fade in
          transform: [
            { scale: cardPressScaleAnim }, // Existing press scale
            { translateY: cardPressTranslateYAnim }, // Add Y translation for press
            { 
              translateY: cardEntranceAnim.interpolate({ // Slide up for entrance
                inputRange: [0, 1],
                outputRange: [50, 0] 
              })
            }
          ]
        }
      ]}>
        {/* Media container */}
        <View style={styles.mediaContainer}>
          {!mediaLoaded && !hasError && ( // Show skeleton if not loaded and no error
            <OutfitCardMediaSkeleton />
          )}

          {isVideo ? (
            <>
              {/* Video badge - animates in */}
              {mediaLoaded && (
                <Animated.View style={[
                  styles.badge,
                  {
                    opacity: badgeAnim,
                    transform: [
                      { scale: badgeAnim.interpolate({ inputRange: [0,1], outputRange: [0.5, 1] }) },
                      { translateY: badgeAnim.interpolate({ inputRange: [0,1], outputRange: [10,0] }) }
                    ]
                  }
                ]}>
                  <Feather name="video" size={14} color="#FFF" />
                  <Text style={styles.badgeText}>Video</Text>
                </Animated.View>
              )}

              {/* Error State for Video - shown if hasError is true */} 
              {hasError && (
                <View style={[styles.overlay, styles.errorBg]}>
                  <Text style={styles.errorText}>Media unavailable</Text>
                </View>
              )}

              {/* Video player - animates in */} 
              {!hasError && videoUrl && (
                <Animated.View style={driftingMediaWrapperStyle}>
                  <Video
                    ref={videoRef}
                    source={{ uri: videoUrl }}
                    style={mediaFillStyle}
                    resizeMode="cover"
                    muted
                    repeat
                    onLoad={() => {
                        setMediaLoaded(true);
                        // Haptics.selectionAsync();
                        Animated.timing(mediaOpacityAnim, { toValue: 1, duration: 400, useNativeDriver: true }).start(() => {
                            if (isVideo) { 
                                Animated.timing(badgeAnim, { toValue: 1, duration: 300, delay: 200, useNativeDriver: true }).start();
                            }
                        });
                    }}
                    onError={handleError} 
                  />
                </Animated.View>
              )}
            </>
          ) : (
            <> 
              {/* Error State for Image - shown if hasError is true */} 
              {hasError && !resultImage && (
                  <View style={[styles.overlay, styles.errorBg]}>
                      <Text style={styles.errorText}>Image unavailable</Text>
                  </View>
              )}

              {/* Image - animates in */} 
              {!hasError && resultImage ? (
                <Animated.View style={driftingMediaWrapperStyle}>
                  <Image
                    source={{ uri: resultImage, priority: 'high', }}
                    style={imageMediaFillStyle}
                    contentFit="cover"
                    
                    onLoad={() => {
                        setMediaLoaded(true);
                        // Haptics.selectionAsync();
                        Animated.timing(mediaOpacityAnim, { toValue: 1, duration: 400, useNativeDriver: true }).start(() => {
                            if (isVideo) { 
                                Animated.timing(badgeAnim, { toValue: 1, duration: 300, delay: 200, useNativeDriver: true }).start();
                            }
                        });
                    }}
                    onError={handleError} 
                  />
                </Animated.View>
              ) : null} 
            </>
          )}

          {/* Gradient overlay - ensure it renders above the media if media is loaded */} 
          {mediaLoaded && !hasError && (
            <LinearGradient
              colors={['transparent', 'rgba(0,0,0,0.6)']}
              style={StyleSheet.absoluteFill}
            />
          )}
          
          {/* Coming soon overlay - animates in */} 
          {comingSoon && (
            <Animated.View 
              style={[
                styles.overlay, 
                { 
                  opacity: comingSoonAnim, 
                  // backgroundColor: darkMode ? 'rgba(0,0,0,0.7)' : 'rgba(255,255,255,0.7)' // Fallback if BlurView fails
                }
              ]}
            >
              <BlurView
                style={StyleSheet.absoluteFill} // BlurView takes up the whole Animated.View
                blurType={darkMode ? 'dark' : 'light'}
                blurAmount={10}
              />
              <Text style={[styles.comingSoonText, darkMode ? styles.darkComingSoonText : styles.lightComingSoonText]}>
                Coming Soon
              </Text>
            </Animated.View>
          )}

          {/* Outfit name footer - animates in */} 
          {!comingSoon && mediaLoaded && !hasError && outfitItems.length > 0 && (
            <View style={styles.footer}>
              {/* This gradient is purely for the footer background color effect */}
              <LinearGradient
                colors={['transparent', 'rgba(0,0,0,0.8)']} // Darker at bottom, fading up to transparent
                style={StyleSheet.absoluteFillObject} // Fills the Animated.View (footer)
              />
              {/* Text content needs to be above the gradient background */}
              <View style={{zIndex: 1}}> 
                <Text style={styles.outfitName}>{outfitName}</Text>
                {outfitPrice && 
                  <Text style={styles.outfitPrice}>
                    {outfitPrice}
                  </Text>
                }
              </View>
            </View>
          )}
        </View>

        {/* Details & button */}
        {!comingSoon && mediaLoaded && !hasError && (
          <View style={[styles.details, darkMode ? styles.darkBg : styles.lightBg]}>
            {outfitItems.length > 0 && (
              <Pressable
                onPress={() => {
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy); // Haptic on actual click action
                  setDialogOpen(true);
                }}
                onPressIn={handleSeeOutfitPressIn}
                onPressOut={handleSeeOutfitPressOut}
              >
                <Animated.View style={[
                  styles.fullBtn, 
                  { transform: [{ scale: seeOutfitButtonScaleAnim }] }
                ]}>
                  <LinearGradient
                    colors={['#8B5CF6', '#EC4899', '#3B82F6']}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 0 }}
                    style={[StyleSheet.absoluteFill, { borderRadius: 999 }]}
                  />
                  <View style={styles.fullContent}>
                    <Feather name="eye" size={16} color="#FFF" />
                    <Text style={styles.fullText}>See Full Outfit</Text>
                  </View>
                </Animated.View>
              </Pressable>
            )}
          </View>
        )}

        {/* Dialog */}
        <OutfitDialog
          open={dialogOpen}
          onClose={() => setDialogOpen(false)}
          outfitImage={resultImage}
          outfitName={outfitName}
          items={outfitItems}
          saveShoppingItemConfig={{
            savedProducts,
            savingProducts,
            saveSuccess,
            saveError,
            saveShoppingItem,
            isPending
          }}
        />
      </Animated.View>
    </Pressable>
  );
};

const styles = StyleSheet.create({
  card: {
    borderRadius: 16,
    overflow: 'hidden',
    zIndex: 10,
  },
  darkBg: { backgroundColor: '#1F2937' }, // gray-800
  lightBg: { backgroundColor: '#FFFFFF' },
  shadow: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 2,
  },
  shadowLg: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.3,
    shadowRadius: 25,
    elevation: 5,
  },
  mediaContainer: {
    width: '100%',
    aspectRatio: 3 / 4,
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
    overflow: 'hidden',
    borderTopLeftRadius: 12,
    borderTopRightRadius: 12,
    borderBottomLeftRadius: 12,
    borderBottomRightRadius: 12,
  },
  badge: {
    position: 'absolute',
    top: 8,
    right: 8,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.5)',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 12,
    zIndex: 1,
  },
  badgeText: {
    color: '#FFF',
    fontSize: 10,
    marginLeft: 4,
    fontWeight: '600',
    textAlign: 'center',
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1,
  },
  loadingBg: { backgroundColor: 'rgba(229,231,235,0.5)' },
  errorBg: { backgroundColor: '#F3F4F6' },
  errorText: { color: '#6B7280', fontSize: 14 },
  placeholder: { flex: 1, backgroundColor: 'rgba(167,139,250,0.2)' },
  footer: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    padding: 12,
    alignItems: 'center',
  },
  outfitName: { color: '#FFF', fontSize: 16, fontWeight: '500', textAlign: 'center' },
  outfitPrice: { color: 'rgba(255,255,255,0.9)', fontSize: 12, marginTop: 4 },
  details: { padding: 16 },
  fullBtn: {
    borderRadius: 999,
    overflow: 'hidden',
    position: 'relative',
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  fullContent: {
    flexDirection: 'row',
    alignItems: 'center',
    zIndex: 2,
    padding:12
  },
  fullText: { color: '#FFF', fontSize: 14, marginLeft: 8, fontWeight: '600' },
  comingSoonText: { color: '#FFF', fontSize: 16, fontWeight: '500', textAlign: 'center' },
  darkComingSoonText: { color: '#FFF', fontSize: 16, fontWeight: '500', textAlign: 'center' },
  lightComingSoonText: { color: '#000', fontSize: 16, fontWeight: '500', textAlign: 'center' },
});
export default OutfitCard;


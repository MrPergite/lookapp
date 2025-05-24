import React, { useEffect, useRef, useState } from 'react';
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    Animated,
    Easing,
    Dimensions,
    Pressable,
    GestureResponderEvent,
    ViewStyle,
    Platform,
} from 'react-native';
import { useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { LogOut, Sparkles, Tag, ArrowLeft } from 'lucide-react-native';
import theme from '@/styles/theme';
import GradientText from '../GradientText';
import { useAuth } from '@clerk/clerk-expo';
import { GradientHeading } from '.';
import { responsiveFontSize } from '@/utils';
import * as Haptics from 'expo-haptics';

// Optional import that won't crash if module isn't available
let DeviceMotion: any = null;
try {
    // This will be evaluated at module load time, but won't crash the app
    // if expo-sensors isn't available
    const ExpoSensors = require('expo-sensors');
    DeviceMotion = ExpoSensors?.DeviceMotion;
} catch (e) {
    // Silently fail, DeviceMotion will be null
    console.log('Device motion not available');
}

interface RippleProps {
    onPress?: (event: GestureResponderEvent) => void;
    style?: ViewStyle;
    children: React.ReactNode;
}

// Ripple Effect Component
const Ripple: React.FC<RippleProps> = ({ onPress, style, children }) => {
    const [rippleX, setRippleX] = useState(0);
    const [rippleY, setRippleY] = useState(0);
    const [rippleSize, setRippleSize] = useState(0);
    const rippleOpacity = useRef(new Animated.Value(0)).current;
    const rippleScale = useRef(new Animated.Value(0)).current;
    
    const handlePress = (event: GestureResponderEvent) => {
        // Get touch coordinates
        const { locationX, locationY } = event.nativeEvent;
        
        // Calculate ripple position
        setRippleX(locationX);
        setRippleY(locationY);
        
        // Calculate ripple size
        const containerWidth = 300; // Default fallback size
        const containerHeight = 60; // Default fallback size
        const size = Math.max(containerWidth, containerHeight) * 1.5;
        setRippleSize(size);
        
        // Reset animations
        rippleOpacity.setValue(0.3);
        rippleScale.setValue(0);
        
        // Start animations
        Animated.parallel([
            Animated.timing(rippleScale, {
                toValue: 1,
                duration: 400,
                easing: Easing.out(Easing.ease),
                useNativeDriver: true,
            }),
            Animated.timing(rippleOpacity, {
                toValue: 0,
                duration: 400,
                easing: Easing.out(Easing.ease),
                useNativeDriver: true,
            }),
        ]).start();
        
        // Call original onPress handler
        onPress && onPress(event);
    };
    
    return (
        <Pressable onPress={handlePress} style={[styles.rippleContainer, style]}>
            <Animated.View
                style={[
                    styles.ripple,
                    {
                        left: rippleX - rippleSize / 2,
                        top: rippleY - rippleSize / 2,
                        width: rippleSize,
                        height: rippleSize,
                        borderRadius: rippleSize / 2,
                        opacity: rippleOpacity,
                        transform: [{ scale: rippleScale }],
                    },
                ]}
            />
            {children}
        </Pressable>
    );
};

interface PostLoginScreenProps {
    userName: string;
    onRestartOnboarding?: () => void;
    onSignOut?: () => void;
}

interface DeviceMotionState {
    x: number;
    y: number;
}

const { width } = Dimensions.get('window');

const PostLoginScreen: React.FC<PostLoginScreenProps> = ({
    userName = '',
    onRestartOnboarding,
    onSignOut,
}) => {
    const router = useRouter();
    const { signOut } = useAuth();
    
    // Animation for card shine effect
    const shineAnim = useRef(new Animated.Value(-width)).current;
    
    // Animations for greeting text
    const greetingContainerOpacity = useRef(new Animated.Value(0)).current;
    const greetingContainerTranslateY = useRef(new Animated.Value(-20)).current;
    const greetingOpacity = useRef(new Animated.Value(0)).current;
    const greetingTranslateY = useRef(new Animated.Value(15)).current;
    const nameOpacity = useRef(new Animated.Value(0)).current;
    const nameTranslateY = useRef(new Animated.Value(15)).current;
    
    // Simple state for card touch effect
    const [isCardPressed, setIsCardPressed] = useState(false);
    
    // Device motion for tilt effect
    const [deviceMotion, setDeviceMotion] = useState<DeviceMotionState>({ x: 0, y: 0 });
    const [isMotionAvailable, setIsMotionAvailable] = useState(false);
    
    // Add bounce animation ref for sign out button
    const signOutBounceAnim = useRef(new Animated.Value(0)).current;
    
    // Subscribe to device motion
    useEffect(() => {
        // Safe way to check for DeviceMotion without relying on dynamic imports
        const setupDeviceMotion = async () => {
            try {
                // Only attempt to use DeviceMotion if it's available and we're not on web
                if (DeviceMotion && Platform.OS !== 'web') {
                    const available = await DeviceMotion.isAvailableAsync();
                    
                    if (available) {
                        setIsMotionAvailable(true);
                        DeviceMotion.setUpdateInterval(100);
                        
                        const subscription = DeviceMotion.addListener((data: any) => {
                            if (data?.rotation) {
                                // Get rotation data (limited range for subtle effect)
                                const x = Math.max(-10, Math.min(10, data.rotation.beta * 5));
                                const y = Math.max(-10, Math.min(10, data.rotation.gamma * 5));
                                
                                setDeviceMotion({ x, y });
                            }
                        });
                        
                        return () => subscription.remove();
                    }
                }
            } catch (error) {
                console.log('Error setting up device motion:', error);
            }
            
            return () => {}; // Return empty cleanup function if no subscription
        };
        
        const cleanupFn = setupDeviceMotion();
        
        return () => {
            cleanupFn.then(cleanup => cleanup && cleanup());
        };
    }, []);
    
    // Start bounce animation for sign out button
    useEffect(() => {
        // Setup occasional bounce animation for sign out button
        const bounceInterval = setInterval(() => {
            startSignOutBounceAnimation();
        }, 45000); // Every 45 seconds
        
        return () => clearInterval(bounceInterval);
    }, []);
    
    // For the greeting based on time of day
    const getTimeBasedGreeting = () => {
        const hour = new Date().getHours();
        if (hour < 12) return 'Good morning';
        if (hour < 17) return 'Good afternoon';
        return 'Good evening';
    };
    
    // Get first name from full name
    const getFirstName = (fullName: string) => {
        if (!fullName) return '';
        return fullName.split(' ')[0];
    };

    useEffect(() => {
        // Start shine animation when component mounts
        startShineAnimation();
        
        // Set up interval to run the animation periodically
        const intervalId = setInterval(() => {
            startShineAnimation();
        }, 8000); // Run every 8 seconds
        
        // Animate greeting text when component mounts
        if (userName) {
            Animated.timing(greetingContainerOpacity, {
                toValue: 1,
                duration: 400,
                useNativeDriver: true,
                easing: Easing.out(Easing.cubic),
            }).start(() => {
                animateGreeting();
            });
            
            Animated.timing(greetingContainerTranslateY, {
                toValue: 0,
                duration: 400,
                useNativeDriver: true,
                easing: Easing.out(Easing.cubic),
            }).start();
        } else {
            // If no username, ensure greeting is hidden
            greetingContainerOpacity.setValue(0);
            greetingContainerTranslateY.setValue(-20);
        }
        
        // Clean up interval on unmount
        return () => clearInterval(intervalId);
    }, [userName]); // Add userName as dependency to re-run animations if it changes
    
    const startShineAnimation = () => {
        // Reset animation position
        shineAnim.setValue(-width);
        
        // Animate shine across the card
        Animated.timing(shineAnim, {
            toValue: width,
            duration: 2500,
            easing: Easing.ease,
            useNativeDriver: true,
        }).start();
    };
    
    const animateGreeting = () => {
        // Sequence of animations for greeting components
        Animated.sequence([
            // First animate the greeting text
            Animated.parallel([
                Animated.timing(greetingOpacity, {
                    toValue: 1,
                    duration: 600,
                    useNativeDriver: true,
                    easing: Easing.out(Easing.cubic),
                }),
                Animated.timing(greetingTranslateY, {
                    toValue: 0,
                    duration: 600,
                    useNativeDriver: true,
                    easing: Easing.out(Easing.cubic),
                }),
            ]),
            // Then animate the name with a slight delay
            Animated.parallel([
                Animated.timing(nameOpacity, {
                    toValue: 1,
                    duration: 600,
                    useNativeDriver: true,
                    easing: Easing.out(Easing.cubic),
                }),
                Animated.timing(nameTranslateY, {
                    toValue: 0,
                    duration: 600,
                    useNativeDriver: true,
                    easing: Easing.out(Easing.cubic),
                }),
            ]),
        ]).start();
    };

    const handleRestartOnboarding = () => {
        // Trigger haptic feedback
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
        router.push('/(onboarding)');
    };

    const handleSignOut = async () => {
        // Ensure haptic feedback is triggered
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
        
        // Add visual bounce feedback
        startSignOutBounceAnimation();
        
        // Small delay to allow animation and haptic to be felt
        setTimeout(async () => {
            await signOut();
            router.replace('/');
        }, 100);
    };

    // Mock data for style preferences
    const preferenceStats = {
        total: 5,
        topPreference: 'Casual'
    };
    
    // Get current season for style tips
    const getCurrentSeason = () => {
        const month = new Date().getMonth();
        // Northern hemisphere seasons
        if (month >= 2 && month <= 4) return 'Spring';
        if (month >= 5 && month <= 7) return 'Summer';
        if (month >= 8 && month <= 10) return 'Fall';
        return 'Winter';
    };
    
    // Get personalized style tip based on season and preferences
    const getSeasonalStyleTip = () => {
        const season = getCurrentSeason().toLowerCase() as 'spring' | 'summer' | 'fall' | 'winter';
        const preference = preferenceStats.topPreference.toLowerCase();
        
        const tips = {
            spring: {
                casual: "Try layering light fabrics with a pastel overshirt for spring casual looks.",
                formal: "Light wool blazers in neutral tones work great for spring formal events.",
                default: "Spring is perfect for incorporating pastels and lighter fabrics."
            },
            summer: {
                casual: "Breathable cotton tees paired with linen shorts keep casual summer looks cool.",
                formal: "Consider unlined suits in light colors for summer formal occasions.",
                default: "Embrace breathable fabrics and lighter colors this summer."
            },
            fall: {
                casual: "Layer your casual looks with light jackets and scarves for fall transitions.",
                formal: "Rich textures and deeper colors enhance formal fall wardrobes.",
                default: "Fall is perfect for layering with light jackets and seasonal colors."
            },
            winter: {
                casual: "Elevate your casual winter style with textured sweaters and quality denim.",
                formal: "Wool overcoats in classic colors make winter formal wear stand out.",
                default: "Focus on quality layering pieces in deeper tones this winter."
            }
        };
        
        const seasonTips = tips[season];
        return seasonTips[preference as 'casual' | 'formal'] || seasonTips.default;
    };

    // Handle card press
    const handleCardPress = () => {
        // Toggle card pressed state
        setIsCardPressed(!isCardPressed);
        
        // Optional: Add haptic feedback
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    };

    // Get card tilt transform based on device motion - make it safer
    const getCardTilt = () => {
        if (!isMotionAvailable) {
            // If motion is not available, just return the scale transform
            return {
                transform: [
                    { scale: isCardPressed ? 1.08 : 1 }
                ]
            };
        }
        
        return {
            transform: [
                { perspective: 800 },
                { rotateX: `${deviceMotion.x}deg` },
                { rotateY: `${deviceMotion.y}deg` },
                { scale: isCardPressed ? 1.08 : 1 }
            ]
        };
    };

    const startSignOutBounceAnimation = () => {
        Animated.sequence([
            Animated.timing(signOutBounceAnim, {
                toValue: 1,
                duration: 150,
                useNativeDriver: true,
            }),
            Animated.timing(signOutBounceAnim, {
                toValue: 0,
                duration: 150,
                useNativeDriver: true,
            }),
            Animated.timing(signOutBounceAnim, {
                toValue: 0.5,
                duration: 100,
                useNativeDriver: true,
            }),
            Animated.timing(signOutBounceAnim, {
                toValue: 0,
                duration: 100,
                useNativeDriver: true,
            })
        ]).start();
    };

    return (
        <LinearGradient
            colors={['#ffffff', '#f5f3ff', '#f0f9ff']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.container}
        >
            {/* Back Button */}
            <TouchableOpacity
                style={styles.backButton}
                onPress={() => {
                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                    router.back();
                }}
            >
                <ArrowLeft size={24} color="white" />
            </TouchableOpacity>

            {/* Personalized time-based greeting */}
            <Animated.View 
                style={[
                    styles.greetingContainer,
                    {
                        opacity: greetingContainerOpacity,
                        transform: [{ translateY: greetingContainerTranslateY }]
                    }
                ]}
            >
                <Animated.Text 
                    style={[
                        styles.greeting, 
                        {
                            opacity: greetingOpacity,
                            transform: [{ translateY: greetingTranslateY }]
                        }
                    ]}
                >
                    {getTimeBasedGreeting()},
                </Animated.Text>
                
                <Animated.View 
                    style={{
                        opacity: nameOpacity,
                        transform: [{ translateY: nameTranslateY }]
                    }}
                >
                    <GradientText 
                        style={styles.userName} 
                        gradientColors={['#8B5CF6', '#EC4899', '#3B82F6']}
                    >
                        {getFirstName(userName)}!
                    </GradientText>
                </Animated.View>
            </Animated.View>

            {/* LookPass Card with tilt effect */}
            <TouchableOpacity
                activeOpacity={0.95}
                onPressIn={() => setIsCardPressed(true)}
                onPressOut={() => setIsCardPressed(false)}
                delayPressIn={0}
                style={[
                    { width: '100%' },
                    getCardTilt()
                ]}
            >
                <LinearGradient
                    colors={['#ffffff', '#f5f3ff', '#f0f9ff']}
                    style={[
                        styles.lookPassCard, 
                        { 
                            borderWidth: 1, 
                            borderColor: isCardPressed ? "#9c5ef0" : "#E9D5FF",
                            shadowOpacity: isCardPressed ? 0.18 : 0.08,
                        }
                    ]}
                >
                    {/* Card Content */}
                    <View style={styles.lookPassContent}>
                        {/* Fashion Icon */}
                        <View style={styles.iconContainer}>
                            <LinearGradient
                                colors={['rgba(147, 51, 234, 0.2)', 'rgba(59, 130, 246, 0.1)']}
                                style={styles.iconGradient}
                            >
                                <Tag size={80} color="#9c5ef0" strokeWidth={1.2} />
                            </LinearGradient>
                        </View>
                        <GradientHeading text="LookPass" />
                        <Text style={styles.lookPassSubtitle}>Your personal fashion pass</Text>

                        {/* LookPass Description */}
                        <Text style={styles.lookPassDescription}>
                            Your LookPass contains everything Look AI has learned about your shopping preferences to personalize your experience.
                        </Text>
                        
                        {/* Seasonal Style Tip */}
                        {/* <View style={styles.inCardTipContainer}>
                            <View style={styles.seasonalTipHeader}>
                                <Sparkles size={18} color="#EC4899" style={styles.seasonalTipIcon} />
                                <Text style={styles.seasonalTipTitle}>
                                    {getCurrentSeason()} Style Tip
                                </Text>
                            </View>
                            <Text style={styles.seasonalTipText}>
                                {getSeasonalStyleTip()}
                            </Text>
                        </View> */}
                    </View>
                    
                    {/* Shine effect overlay */}
                    <Animated.View style={[styles.shineEffect, {
                        transform: [{ translateX: shineAnim }]
                    }]} />
                </LinearGradient>
            </TouchableOpacity>

            {/* Buttons with ripple effect */}
            <View style={styles.buttonsContainer}>
                {/* Restart Onboarding button with ripple */}
                <Ripple
                    onPress={handleRestartOnboarding}
                    style={styles.restartButton}
                >
                    <LinearGradient
                        colors={['#8B5CF6', '#EC4899', '#3B82F6']}
                        start={{ x: 0, y: 0 }}
                        end={{ x: 1, y: 0 }}
                        style={styles.restartButtonGradient}
                    >
                        <Text style={styles.restartButtonText}>Restart Onboarding</Text>
                    </LinearGradient>
                </Ripple>

                <View style={styles.divider} />

                {/* Sign Out button with split design and bounce animation */}
                <View style={styles.signOutContainer}>
                    <Animated.View style={{
                        transform: [
                            { translateY: signOutBounceAnim.interpolate({
                                inputRange: [0, 1],
                                outputRange: [0, -8]
                            })}
                        ],
                        width: '100%'
                    }}>
                        <Ripple
                            onPress={handleSignOut}
                            style={styles.signOutButton}
                        >
                            <View style={styles.signOutContent}>
                                <Text style={styles.signOutText}>Sign Out</Text>
                            </View>
                        </Ripple>
                    </Animated.View>
                </View>
            </View>
        </LinearGradient>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        paddingHorizontal: 24,
        paddingTop: 10,
        paddingBottom: 24,
        alignItems: 'center',
        height: '100%',
        justifyContent: 'flex-start',
    },
    greetingContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        alignSelf: 'center',
        marginBottom: 20,
        flexWrap: 'wrap',
        marginTop: 40,
    },
    greeting: {
        fontSize: responsiveFontSize(18),
        fontFamily: 'default-medium',
        color: '#4B5563',
        marginRight: 6,
    },
    userName: {
        fontSize: responsiveFontSize(20),
        fontFamily: 'default-bold',
    },
    lookPassCard: {
        width: '100%',
        borderRadius: 16,
        padding: 20,
        marginBottom: 16,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.08,
        shadowRadius: 12,
        elevation: 3,
        overflow: 'hidden', // Important for the shine effect
        position: 'relative', // For positioning the shine effect
    },
    shineEffect: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        width: 60,
        height: '100%',
        backgroundColor: 'rgba(255, 255, 255, 0.4)',
        transform: [{ skewX: '-20deg' }],
        zIndex: 5,
    },
    lookPassContent: {
        alignItems: 'center',
        paddingVertical: 16,
        zIndex: 1,
        width: '100%',
    },
    iconContainer: {
        width: 180,
        height: 180,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 20,
    },
    iconGradient: {
        width: '100%',
        height: '100%',
        borderRadius: 90,
        justifyContent: 'center',
        alignItems: 'center',
    },
    lookPassSubtitle: {
        fontSize: responsiveFontSize(12),
        fontFamily: 'default-semibold',
        color: '#9333EA',
        marginBottom: 18,
        fontWeight: 500,
    },
    lookPassDescription: {
        fontSize: responsiveFontSize(12),
        fontFamily: 'default-regular',
        textAlign: 'center',
        lineHeight: 22,
        paddingHorizontal: 16,
        color: 'rgba(75, 85, 99, 1)',
        width: "100%",
        marginBottom: 20,
    },
    inCardTipContainer: {
        width: '100%',
        padding: 16,
        backgroundColor: 'rgba(255, 255, 255, 0.7)',
        borderRadius: 12,
    },
    seasonalTipHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 8,
    },
    seasonalTipIcon: {
        marginRight: 6,
    },
    seasonalTipTitle: {
        fontSize: responsiveFontSize(14),
        fontFamily: 'default-semibold',
        color: '#9c5ef0',
    },
    seasonalTipText: {
        fontSize: responsiveFontSize(12),
        fontFamily: 'default-regular',
        lineHeight: 18,
        color: '#4B5563',
    },
    buttonsContainer: {
        width: '100%',
        marginTop: 0,
    },
    restartButton: {
        width: '100%',
        height: 48,
        borderRadius: 12,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 2,
        marginBottom: 16,
        overflow: 'hidden',
    },
    restartButtonGradient: {
        width: '100%',
        height: '100%',
        justifyContent: 'center',
        alignItems: 'center',
    },
    restartButtonText: {
        fontSize: responsiveFontSize(14),
        fontFamily: 'default-semibold',
        color: '#FFFFFF',
        letterSpacing: 0.2,
    },
    divider: {
        width: '100%',
        height: 1,
        backgroundColor: 'rgba(229, 231, 235, 0.8)',
        marginVertical: 12,
    },
    signOutContainer: {
        width: '100%',
        alignItems: 'center',
        marginTop: 8,
        paddingHorizontal: 16,
    },
    signOutButton: {
        width: '100%',
        height: 56,
        borderRadius: 24,
        overflow: 'hidden',
        backgroundColor: 'rgba(255, 255, 255, 0.8)',
        borderWidth: 1,
        borderColor: 'rgba(139, 92, 246, 0.3)',
        shadowColor: 'transparent',
        shadowOffset: { width: 0, height: 0 },
        shadowOpacity: 0,
        shadowRadius: 0,
        elevation: 0,
    },
    signOutContent: {
        width: '100%',
        height: '100%',
        justifyContent: 'center',
        alignItems: 'center',
    },
    signOutText: {
        fontSize: responsiveFontSize(16),
        fontFamily: 'default-semibold',
        color: '#8B5CF6',
        letterSpacing: 0.3,
    },
    rippleContainer: {
        position: 'relative',
        overflow: 'hidden',
        borderRadius: 12,
    },
    ripple: {
        position: 'absolute',
        backgroundColor: 'rgba(255, 255, 255, 0.4)',
        zIndex: 10,
    },
    backButton: {
        position: 'absolute', 
        top: 20,
        left: 20,
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: '#9D4EDD',
        justifyContent: 'center',
        alignItems: 'center',
        zIndex: 10,
    },
});

export default PostLoginScreen; 
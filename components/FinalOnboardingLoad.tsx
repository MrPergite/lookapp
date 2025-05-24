// components/FinalOnboardingLoad.tsx

import React, { useState, useEffect, useRef } from "react";
import { View, Text, StyleSheet, SafeAreaView, Modal, Button, ActivityIndicator, Animated, TouchableOpacity } from "react-native";
import { AnimatePresence, MotiView, MotiText } from "moti";
import { Loader2, CheckCircle2, Sparkles } from "lucide-react-native";
import theme from "@/styles/theme";
import { useSharedValue } from "react-native-reanimated";
import { withTiming } from "react-native-reanimated";
import { withRepeat } from "react-native-reanimated";
import { useAnimatedStyle, Easing } from "react-native-reanimated";
import { LinearGradient } from "expo-linear-gradient";
import axios from "axios";
import { useAuth, useUser } from "@clerk/clerk-expo";
import { routes } from "@/client-api/routes";
import Constants from "expo-constants";
import { responsiveFontSize } from "@/utils";
import MaskedView from '@react-native-masked-view/masked-view';
import * as Haptics from 'expo-haptics';
import ConfettiCannon from 'react-native-confetti-cannon';

const loadingMessages = [
    "Setting up your personalized profile...",
    "Customizing your shopping preferences...",
    "Getting everything ready for you...",
];

interface OnboardingData {
    gender: string;
    sizes: {
        clothing: string;
        shoeSize: string;
        shoeUnit: string;
        country: string;
    };
    avatar: {
        src: string;
    };
}

interface FinalOnboardingLoadProps {
    onComplete: () => void;
    onboardingData: OnboardingData;
}

export default function FinalOnboardingLoad({ onComplete, onboardingData }: FinalOnboardingLoadProps) {
    const [progress, setProgress] = useState<number>(0);
    const [currentMessageIndex, setCurrentMessageIndex] = useState<number>(0);
    const [showDialog, setShowDialog] = useState<boolean>(false);
    const [isLoading, setIsLoading] = useState<boolean>(true);
    const [error, setError] = useState<string | null>(null);
    const { getToken } = useAuth();
    const { user } = useUser();
    // Use refs to track mounted state and prevent state updates after unmount
    const isMounted = useRef<boolean>(true);

    // Animation values for success screen
    const successScale = useRef(new Animated.Value(0.5)).current;
    const successOpacity = useRef(new Animated.Value(0)).current;
    const dialogScale = useRef(new Animated.Value(0.9)).current;
    const [showConfetti, setShowConfetti] = useState(false);
    const confettiRef = useRef<ConfettiCannon>(null);
    
    // Create an Animated.Value for the progress bar
    const animatedProgress = useRef(new Animated.Value(0)).current;
    const spinAnim = useRef(new Animated.Value(0)).current;

    // Simplified save function to prevent crashes
    const saveOnboardingData = (): Promise<boolean> => {
        return new Promise(async (resolve) => {
            {
                try {
                    const token = await getToken();
                    const resp = await axios(`${Constants.expoConfig?.extra?.origin}${routes.protected.saveOnboardingInfo}`, {
                        method: "POST",
                        headers: {
                            "Content-Type": "application/json",
                            "Authorization": `Bearer ${token}`,
                        },
                        data: { onboardingInfo: onboardingData },
                    });
                    if (resp.status === 200) {
                        resolve(resp.data.success);
                    }
                    resolve(false);
                } catch (error) {
                    console.error("Error saving onboarding data:", JSON.stringify(error));
                    resolve(false);
                }
            }
        });
    };

    useEffect(() => {
        saveOnboardingData().then((success) => {
            if (!success) {
                setError("Error saving onboarding data");
            }
        })
        .catch(() => {
            setError("Error saving onboarding data");
        });
        
        // Start loading animations
        Animated.loop(
            Animated.timing(spinAnim, {
                toValue: 1,
                duration: 1000,
                useNativeDriver: true,
                easing: Easing.linear,
            })
        ).start();
        
        // Start progress bar animation
        Animated.timing(animatedProgress, {
            toValue: 100,
            duration: 4000, // 4 seconds
            useNativeDriver: false,
            easing: Easing.linear
        }).start();

        // Cycle through loading messages
        const messageInterval = setInterval(() => {
            if (isMounted.current) {
                setCurrentMessageIndex(prevIndex => {
                    return (prevIndex + 1) % loadingMessages.length;
                });
            }
        }, 2000);
        
        // Show completion dialog after loading
        const timer = setTimeout(() => {
            setIsLoading(false);
            setShowDialog(true);
            setShowConfetti(true);
            
            // Fire confetti after dialog appears
            setTimeout(() => {
                if (confettiRef.current) {
                    confettiRef.current.start();
                }
            
                // Animate success icon and dialog
                Animated.parallel([
                    Animated.spring(successScale, {
                        toValue: 1,
                        friction: 6,
                        tension: 50,
                        useNativeDriver: true
                    }),
                    Animated.timing(successOpacity, {
                        toValue: 1,
                        duration: 400,
                        useNativeDriver: true
                    }),
                    Animated.spring(dialogScale, {
                        toValue: 1,
                        friction: 7,
                        tension: 40,
                        useNativeDriver: true
                    })
                ]).start();
            }, 100);
        }, 4000);
        
        return () => {
            isMounted.current = false;
            clearInterval(messageInterval);
            clearTimeout(timer);
            spinAnim.stopAnimation();
            animatedProgress.stopAnimation();
        };
    }, []);

    const handleContinue = () => {
        // Provide strong haptic feedback when continuing
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        
        setShowDialog(false);
        onComplete();
    };

    // Get first name from user if available
    const getFirstName = () => {
        if (user?.firstName) return user.firstName;
        if (user?.fullName) return user.fullName.split(' ')[0];
        return '';
    };
    
    // Rotation for loading spinner
    const spin = spinAnim.interpolate({
        inputRange: [0, 1],
        outputRange: ["0deg", "360deg"],
    });
    
    // Progress bar width animation
    const progressWidthInterpolate = animatedProgress.interpolate({
        inputRange: [0, 100],
        outputRange: ['0%', '100%'],
    });

    // Render loading screen
    const renderLoadingScreen = () => (
        <View style={styles.content}>
            <LinearGradient
                colors={['rgba(139, 92, 246, 0.08)', 'rgba(236, 72, 153, 0.08)', 'rgba(59, 130, 246, 0.08)']}
                style={StyleSheet.absoluteFill}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
            />
            
            <View style={styles.textCenter}>
                <Animated.View style={[styles.loader, { transform: [{ rotate: spin }] }]}>
                    <Loader2 size={64} color={theme.colors.primary.purple} />
                </Animated.View>
                <View style={styles.messageContainer}>
                    <Text style={styles.message}>
                        {loadingMessages[currentMessageIndex]}
                    </Text>
                </View>

                <View style={styles.progressBarContainer}>
                    <Animated.View
                        style={[
                            styles.progressBar,
                            { width: progressWidthInterpolate }
                        ]}
                    >
                        <LinearGradient
                            colors={['#ec4899', '#8b5cf6']}
                            style={StyleSheet.absoluteFill}
                            start={{ x: 0, y: 0 }}
                            end={{ x: 1, y: 0 }}
                        />
                    </Animated.View>
                </View>
            </View>
        </View>
    );

    return (
        <SafeAreaView style={styles.container}>
            {isLoading ? (
                renderLoadingScreen()
            ) : (
                <Modal
                    visible={showDialog}
                    transparent={true}
                    animationType="fade"
                    statusBarTranslucent={true}
                    onRequestClose={() => {
                        setShowDialog(false);
                        onComplete();
                    }}
                >
                    <View style={styles.modalOverlay}>
                        {showConfetti && (
                            <>
                                <ConfettiCannon
                                    ref={confettiRef}
                                    count={80}
                                    origin={{x: -10, y: 0}}
                                    explosionSpeed={350}
                                    fallSpeed={3000}
                                    colors={['#8B5CF6', '#EC4899', '#3B82F6', '#FBBF24', '#10B981']}
                                />
                                <ConfettiCannon
                                    count={80}
                                    origin={{x: 400, y: 0}} 
                                    explosionSpeed={350}
                                    fallSpeed={3000}
                                    autoStart={true}
                                    colors={['#8B5CF6', '#EC4899', '#3B82F6', '#FBBF24', '#10B981']}
                                />
                                <ConfettiCannon
                                    count={100}
                                    origin={{x: 200, y: 600}} 
                                    explosionSpeed={400}
                                    fallSpeed={2500}
                                    autoStart={true}
                                    fadeOut={true}
                                    colors={['#8B5CF6', '#EC4899', '#3B82F6', '#FBBF24', '#10B981', '#FFFFFF']}
                                />
                            </>
                        )}
                        <View 
                            style={[
                                styles.modalContainer,
                                
                            ]}
                        >
                            {/* Success Animation/Icon */}
                            <Animated.View 
                                style={[
                                    styles.successAnimation,
                                    {
                                        transform: [{ scale: successScale }],
                                        opacity: successOpacity
                                    }
                                ]}
                            >
                                <LinearGradient
                                    colors={['#8B5CF6', '#EC4899', '#3B82F6']}
                                    style={styles.successIconContainer}
                                    start={{ x: 0, y: 0 }}
                                    end={{ x: 1, y: 0 }}
                                >
                                    <CheckCircle2 size={50} color="#FFFFFF" strokeWidth={2.5} />
                                </LinearGradient>
                            </Animated.View>
                            
                            {/* Gradient title */}
                            <MaskedView
                                style={{ width: '100%', alignItems: 'center', justifyContent: 'center', marginBottom: 12 }} 
                                maskElement={
                                    <View style={{ alignItems: 'center', width: '100%' }}>
                                        <Text style={[styles.dialogTitle, { color: 'black' }]}>
                                            {error ? "Oops!" : "Setup Complete!"}
                                        </Text>
                                    </View>
                                }
                            >
                                <LinearGradient
                                    colors={['#8B5CF6', '#EC4899', '#3B82F6']}
                                    start={{ x: 0, y: 0 }}
                                    end={{ x: 1, y: 0 }}
                                    style={{ height: 40, width: '100%' }}
                                />
                            </MaskedView>
                            
                            {/* Personalized description */}
                            <Text style={styles.dialogDescription}>
                                {error || 
                                    (getFirstName() 
                                        ? `${getFirstName()}, your personalized fashion profile is ready!` 
                                        : "Your personalized fashion profile is ready!")}
                            </Text>
                            
                            {/* Completion status */}
                            <View style={styles.completionStatus}>
                                <LinearGradient
                                    colors={['#8B5CF6', '#EC4899', '#3B82F6']}
                                    start={{ x: 0, y: 0 }}
                                    end={{ x: 1, y: 0 }}
                                    style={styles.completionBadge}
                                >
                                    <Text style={styles.completionText}>100% Complete</Text>
                                </LinearGradient>
                            </View>
                            
                            {/* Next steps section */}
                            {!error && (
                                <View style={styles.nextStepsContainer}>
                                    <Text style={styles.nextStepsTitle}>What's next:</Text>
                                    
                                    <View style={styles.stepItem}>
                                        <View style={styles.bulletPoint} />
                                        <Text style={styles.stepText}>Browse personalized recommendations</Text>
                                    </View>
                                    
                                    <View style={styles.stepItem}>
                                        <View style={styles.bulletPoint} />
                                        <Text style={styles.stepText}>Try on clothes with your avatar</Text>
                                    </View>
                                    
                                    <View style={styles.stepItem}>
                                        <View style={styles.bulletPoint} />
                                        <Text style={styles.stepText}>Discover your style insights</Text>
                                    </View>
                                </View>
                            )}

                            {/* Enhanced button */}
                            <TouchableOpacity
                                onPress={handleContinue}
                                disabled={isLoading}
                                style={styles.buttonWrapper}
                            >
                                <LinearGradient
                                    colors={['#8B5CF6', '#EC4899', '#3B82F6']}
                                    start={{ x: 0, y: 0 }}
                                    end={{ x: 1, y: 0 }}
                                    style={styles.buttonContainer}
                                >
                                    <Text style={styles.buttonText}>
                                        {error ? "Retry" : "let's go shopping!"}
                                    </Text>
                                    
                                </LinearGradient>
                            </TouchableOpacity>
                        </View>
                    </View>
                </Modal>
            )}
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: theme.colors.primary.white,
        justifyContent: "center",
        alignItems: "center",
        padding: 16,
    },
    content: {
        flex: 1,
        justifyContent: "center",
        alignItems: "center",
        width: "100%",
    },
    textCenter: {
        alignItems: "center",
    },
    loader: {
        marginBottom: 16,
    },
    messageContainer: {
        height: 56,
        justifyContent: "center",
        alignItems: "center",
        marginBottom: 16,
    },
    message: {
        textAlign: "center",
        fontSize: responsiveFontSize(18),
        color: '#374151',
        fontFamily: 'default-medium',
    },
    progressBarContainer: {
        width: 256,
        height: 8,
        backgroundColor: "#E5E7EB",
        borderRadius: 4,
        overflow: "hidden",
    },
    progressBar: {
        height: "100%",
        backgroundColor: "#9D4EDD",
    },
    modalOverlay: {
        flex: 1,
        justifyContent: "center",
        alignItems: "center",
        backgroundColor: "rgba(0, 0, 0, 0.5)",
        padding: 16,
    },
    modalContainer: {
        width: "100%",
       
        backgroundColor: "white",
        borderRadius: 24,
        padding: 28,
        alignItems: "center",
        shadowColor: "#6366F1",
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.25,
        shadowRadius: 12,
        elevation: 8,
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.8)',
        margin: 20,
    },
    successAnimation: {
        marginTop: -60,
        marginBottom: 16,
        alignItems: 'center',
        justifyContent: 'center',
    },
    successIconContainer: {
        width: 90,
        height: 90,
        borderRadius: 45,
        justifyContent: 'center',
        alignItems: 'center',
        shadowColor: "#8B5CF6",
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
        elevation: 5,
        borderWidth: 4,
        borderColor: 'white',
    },
    dialogTitle: {
        fontSize: 28,
        fontWeight: "bold",
        textAlign: "center",
    },
    dialogDescription: {
        textAlign: "center",
        fontSize: 16,
        color: "#4B5563",
        lineHeight: 24,
        marginBottom: 12,
    },
    completionStatus: {
        marginVertical: 12,
        alignItems: 'center',
    },
    completionBadge: {
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 16,
    },
    completionText: {
        color: 'white',
        fontWeight: 'bold',
        fontSize: 14,
    },
    nextStepsContainer: {
        width: '100%',
        marginTop: 8,
        marginBottom: 16,
        backgroundColor: 'rgba(249, 250, 251, 0.8)',
        borderRadius: 12,
        padding: 16,
        borderWidth: 1,
        borderColor: 'rgba(229, 231, 235, 0.8)',
    },
    nextStepsTitle: {
        fontSize: 16,
        fontWeight: 'bold',
        color: '#4B5563',
        marginBottom: 8,
    },
    stepItem: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 8,
    },
    bulletPoint: {
        width: 6,
        height: 6,
        borderRadius: 3,
        backgroundColor: '#8B5CF6',
        marginRight: 10,
    },
    stepText: {
        fontSize: 14,
        color: '#4B5563',
        flex: 1,
    },
    buttonWrapper: {
        width: "100%",
        marginTop: 8,
        borderRadius: 28,
        overflow: 'hidden',
        shadowColor: "#8B5CF6",
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
        elevation: 4,
    },
    buttonContainer: {
        paddingVertical: 16,
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
    },
    buttonText: {
        color: 'white',
        fontSize: 16,
        fontWeight: 'bold',
    }
});
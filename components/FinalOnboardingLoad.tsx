// components/FinalOnboardingLoad.tsx

import React, { useState, useEffect, useRef } from "react";
import { View, Text, StyleSheet, SafeAreaView, Modal, Button, ActivityIndicator, Animated, TouchableOpacity } from "react-native";
import { AnimatePresence, MotiView, MotiText } from "moti";
import { Loader2 } from "lucide-react-native";
import theme from "@/styles/theme";
import { useSharedValue } from "react-native-reanimated";
import { withTiming } from "react-native-reanimated";
import { withRepeat } from "react-native-reanimated";
import { useAnimatedStyle, Easing } from "react-native-reanimated";
import { LinearGradient } from "expo-linear-gradient";
import axios from "axios";
import { useAuth } from "@clerk/clerk-expo";
import { routes } from "@/client-api/routes";
import Constants from "expo-constants";
import { responsiveFontSize } from "@/utils";
import MaskedView from '@react-native-masked-view/masked-view';

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
    // Explicitly initialize state values
    const [progress, setProgress] = useState<number>(0);
    const [currentMessageIndex, setCurrentMessageIndex] = useState<number>(0);
    const [isComplete, setIsComplete] = useState<boolean>(false);
    const [showDialog, setShowDialog] = useState<boolean>(false);
    const [isLoading, setIsLoading] = useState<boolean>(false);
    const [error, setError] = useState<string | null>(null);
    const { getToken } = useAuth();
    // Use refs to track mounted state and prevent state updates after unmount
    const isMounted = useRef<boolean>(true);

    // Create an Animated.Value for the progress bar
    const animatedProgress = useRef(new Animated.Value(0)).current;

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
            if (success) {
                setIsComplete(success);
            }
            else {
                setIsComplete(false);
                setError("Error saving onboarding data");
            }
        })
            .catch((error) => {
                setIsComplete(false);
                setError("Error saving onboarding data");
            });
    }, []);

    useEffect(() => {
        // Make sure dialog is NOT shown initially
        setShowDialog(false);

        // Simplified loading animation with reasonable times
        const messageDuration = 3000; // Time each message is displayed
        const totalDuration = 6000;   // Total loading time (3 messages × 1.5s)

        // Start direct animation of progress bar from 0 to 100
        Animated.timing(animatedProgress, {
            toValue: 100,
            duration: totalDuration,
            useNativeDriver: false,
            easing: Easing.linear
        }).start();

        // Message rotation interval - cycles through messages
        const messageInterval = setInterval(() => {
            if (isMounted.current) {
                setCurrentMessageIndex(prevIndex => {
                    if (prevIndex >= loadingMessages.length - 1) {
                        clearInterval(messageInterval);
                        return prevIndex;
                    }
                    return prevIndex + 1;
                });
            }
        }, messageDuration);

        // Final completion timer - shows dialog after loading
        const timer = setTimeout(() => {
            if (!isMounted.current) return;
            // Add a delay before showing dialog
            setTimeout(() => {
                if (isMounted.current) {
                    setShowDialog(true);
                }
            }, 800);
        }, totalDuration);

        // Cleanup function to prevent memory leaks
        return () => {
            isMounted.current = false;
            clearInterval(messageInterval);
            clearTimeout(timer);
            // Stop the animation if component unmounts
            animatedProgress.stopAnimation();
        };
    }, []); // Empty array means this effect runs once on mount

    const handleContinue = () => {
        setShowDialog(false);
        onComplete();
    };

    const progressValue = useSharedValue(0);

    useEffect(() => {
        // Use a slower timing for smoother animation
        progressValue.value = withTiming(progress, {
            duration: 300,
            easing: Easing.bezier(0.25, 0.1, 0.25, 1),
        });
    }, [progress]);

    const animatedStyle = useAnimatedStyle(() => {
        return {
            width: `${progressValue.value}%`,
        };
    });

    // Simplified content renderer that doesn't rely on complex animations
    const renderContent = () => {
        const spinAnim = useRef(new Animated.Value(0)).current;

        useEffect(() => {
            Animated.loop(
                Animated.timing(spinAnim, {
                    toValue: 1,
                    duration: 1000,
                    useNativeDriver: true,
                    easing: Easing.linear,
                })
            ).start();
        }, []);

        const rotateInterpolate = spinAnim.interpolate({
            inputRange: [0, 1],
            outputRange: ["0deg", "360deg"],
        });

        // Create an interpolated width string for the progress bar
        const progressWidthInterpolate = animatedProgress.interpolate({
            inputRange: [0, 100],
            outputRange: ['0%', '100%'],
        });


        return (
            <View style={styles.content}>
                <View style={styles.textCenter}>
                    <Animated.View style={[styles.loader, { transform: [{ rotate: rotateInterpolate }] }]}>
                        <Loader2 size={64} color={theme.colors.primary.purple} />
                    </Animated.View>
                    <MotiView
                        key={currentMessageIndex}
                        from={{ opacity: 0, translateY: 20 }}
                        animate={{ opacity: 1, translateY: 0 }}
                        exit={{ opacity: 0, translateY: -20 }}
                        transition={{ duration: 0.5 }}
                        style={styles.messageContainer}>
                        <AnimatePresence>
                            <MotiText
                                key={currentMessageIndex}
                                from={{ opacity: 0, translateY: 20 }}
                                animate={{ opacity: 1, translateY: 0 }}
                                exit={{ opacity: 0, translateY: -20 }}
                                transition={{ duration: 1000 }}
                                style={styles.message}
                                className="text-lg font-medium text-gray-700 mb-4"
                            >
                                {loadingMessages[currentMessageIndex]}
                            </MotiText>
                        </AnimatePresence>
                    </MotiView>

                    <View style={styles.progressBarContainer}>
                        <Animated.View
                            style={[
                                styles.progressBar,
                                { width: progressWidthInterpolate }
                            ]}
                        >
                            <LinearGradient
                                colors={['#ec4899', '#8b5cf6']} // from-pink-500 to-purple-500
                                style={StyleSheet.absoluteFill}
                                start={{ x: 0, y: 0 }}
                                end={{ x: 1, y: 0 }}
                            />
                        </Animated.View>
                    </View>
                </View>
            </View>
        );
    };

    return (
        <SafeAreaView style={styles.container}>
            {renderContent()}

            <Modal
                visible={showDialog}
                transparent={true}
                animationType="fade"
                onRequestClose={() => {
                    setShowDialog(false);
                    onComplete();
                }}
            >
                <View style={styles.modalContainer}>
                    <View style={styles.dialogContent}>
                        <View style={{ position: 'relative', width: '100%', alignItems: 'center', marginBottom: 8 }}>
                            
            <MaskedView
              style={{ width: '100%', alignItems: 'center', justifyContent: 'center', marginBottom: 16 }} 
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
                style={{ height: 30, width: '100%' }}
              />
            </MaskedView>
                        </View>
                        <Text style={{ color: '#64748b',fontSize: 14,marginBottom: 8}} className="text-sm text-center">
                            {error ||
                                "Your personalized shopping profile is ready. Get ready for an amazing shopping experience!"}
                        </Text>

                        <TouchableOpacity
                            onPress={handleContinue}
                            disabled={isLoading}
                            style={{
                                width: "100%",
                                // padding: 16,
                                // alignItems: 'center'
                            }}
                        >
                            <LinearGradient
  colors={['#8B5CF6', '#EC4899', '#3B82F6']}
                                start={{ x: 0, y: 0 }}
                                end={{ x: 1, y: 0 }}
                                style={styles.buttonContainer}
                            >
                                <Text style={{ color: 'rgba(255,255,255,1)', fontSize: 16, fontFamily: 'Inter-Bold' }}>
                                    {error ? "Retry" : "Continue"}
                                </Text>
                            </LinearGradient>
                        </TouchableOpacity>
                    </View>
                </View>
            </Modal>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: theme.colors.primary.white, // Light purple background
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
        fontSize: responsiveFontSize(18), // text-lg
        color: '#374151', // text-gray-700
        fontFamily: 'default-medium',
    },
    progressBarContainer: {
        width: 256,
        height: 8,
        backgroundColor: "#E5E7EB", // Gray-200
        borderRadius: 4,
        overflow: "hidden",
    },
    progressBar: {
        height: "100%",
        backgroundColor: "#9D4EDD", // Purple
    },
    modalContainer: {
        flex: 1,
        justifyContent: "center",
        alignItems: "center",
        backgroundColor: "rgba(0, 0, 0, 0.5)",
    },
    dialogContent: {
        width: "80%",
        backgroundColor: "white",
        borderRadius: 12,
        padding: 24,
        alignItems: "center",
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.25,
        shadowRadius: 3.84,
        elevation: 5,
    },
    dialogTitle: {
        fontSize: 24,
        fontWeight: "bold",
        textAlign: "center",
        color: "#1F2937", // Gray-800
    },
    dialogDescription: {
        textAlign: "center",
        marginTop: 8,
        fontSize: 16,
        color: "#4B5563", // Gray-700
        lineHeight: 24,
    },
    buttonContainer: {
        marginTop: 24,
        width: "100%",
        borderRadius: 24,
        padding: 13,
        alignItems: "center",
    },
});
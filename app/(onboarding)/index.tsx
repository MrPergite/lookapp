import React, { useReducer, useState, useEffect, useMemo } from 'react';
import { View, Text, StyleSheet, Button, Animated, SafeAreaView, Pressable, TouchableOpacity } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { Easing } from 'react-native-reanimated';
import { Ionicons } from '@expo/vector-icons';
import theme from '@/styles/theme';
import { LinearGradient } from 'expo-linear-gradient';
import { ThemedText } from '@/components/ThemedText';
import { onBoardingReducer, useOnBoarding } from './context';
import { authnStyles } from '../(authn)/styles';
import * as Haptics from "expo-haptics";
import { withHaptick } from '@/utils';
import GenderSelect from './steps/gender-select';
import UserDetails from './steps/user-details';
import SelectAvatar from './steps/select-avatar';
import { useApi } from '@/client-api';
import { useQuery } from '@tanstack/react-query';
import Toast from 'react-native-toast-message';
import { router } from 'expo-router';
import { ArrowLeft, ChevronLeft } from 'lucide-react-native';
import axios from 'axios';
import { routes } from '@/client-api/routes';
import { useAuth } from '@clerk/clerk-expo';
import Constants from 'expo-constants';
import { GradientHeading } from '@/components/auth';
import { MotiScrollView, MotiView } from 'moti'
import FinalOnboardingLoad from '../../components/FinalOnboardingLoad';
import Spinner from '@/components/Spinner';
import GradientText from '@/components/GradientText';
const Steps = [
    {
        title: {
            text: "Tell us about yourself",
            subText: "We'll use this to show you items you'll love!"
        },
        name: "gender",
        component: GenderSelect,
        requiredFields: ["gender"]
    },
    {
        title: {
            text: "Tell us your sizes and location",
            subText: "We'll use this to recommend items that fit you perfectly!"
        },
        name: "user-details",
        component: UserDetails,
        requiredFields: ["clothing_size", "shoe_size", "shoe_unit", "country"]
    },
    {
        title: {
            text: "Choose Your Avatar",
            subText: "Select an avatar for your virtual try-on experience"
        },
        name: "select-avatar",
        component: SelectAvatar,
        requiredFields: ["pref_avatar_url"]
    }
]

// Type for onboarding data
interface OnboardingData {
    gender: string | null;
    clothing_size: string | null;
    shoe_size: string | null;
    shoe_unit: string | null;
    country: string | null;
    pref_avatar_url: string | null;
}

const Onboarding = () => {
    const { payload, dispatch } = useOnBoarding();
    const { isAuthenticated, callProtectedEndpoint } = useApi();
    const navigation = useNavigation();
    const { getToken } = useAuth();
    const [saveOnboardingData, setSaveOnboardingData] = useState(false);

    // Step control
    const [currentStep, setCurrentStep] = useState(0);

    // Animated values
    const translateX = new Animated.Value(0);
    // const [isLoading, setIsLoading] = useState(true);
    // Use React Query to fetch onboarding data
    const { data, isLoading, error } = useQuery({
        queryKey: ['onboardingData'],
        queryFn: async () => {
            try {
                const token = await getToken();
                if (!isAuthenticated) {
                    console.log('User not authenticated, skipping onboarding fetch');
                    return null;
                }

                const response = await axios<{ success: boolean, data: { onboardingInfo: OnboardingData } }>(
                    `${Constants.expoConfig?.extra?.origin}${routes.protected.getOnboardingInfo}`,
                    {
                        method: 'GET', headers: {
                            'Authorization': `Bearer ${token}`
                        }
                    }
                );

                return response.data;
            } catch (err) {
                console.error('Failed to fetch onboarding data:', err);
                Toast.show({
                    type: 'error',
                    text1: 'Error',
                    text2: 'Failed to load your profile data'
                });
                return null;
            }
        },
        enabled: isAuthenticated,
    });

    // Set fetched data to context when available
    useEffect(() => {
        if (data?.data) {
            // Update each field in the context
            Object.entries(data.data).forEach(([key, value]) => {
                if (value !== null) {
                    dispatch({
                        type: 'SET_PAYLOAD',
                        payload: { key, value }
                    });
                }
            });
        }
    }, [data, dispatch]);

    // Check if current step is complete
    const isCurrentStepComplete = useMemo(() => {
        const currentStepConfig = Steps[currentStep];
        if (!currentStepConfig.requiredFields || currentStepConfig.requiredFields.length === 0) {
            return true;
        }

        // Check if all required fields for this step have values
        return currentStepConfig.requiredFields.every(field => {
            // Use type assertion to handle dynamic field access
            const value = payload[field as keyof typeof payload];
            return value !== null && value !== undefined && value !== '';
        });
    }, [currentStep, payload]);

    const handleNext = () => {
        if (currentStep < Steps.length - 1) {
            Animated.timing(translateX, {
                toValue: -1000, // Direct value instead of using ._value
                duration: 300,
                easing: Easing.ease,
                useNativeDriver: true,
            }).start(() => {
                setCurrentStep(currentStep + 1);
                translateX.setValue(0); // Reset animation
            });
        } else {
            // Save onboarding data on completion
            handleSaveOnboarding();
        }
    };

    const handleBack = () => {
        if (currentStep > 0) {
            Animated.timing(translateX, {
                toValue: 1000,
                duration: 300,
                easing: Easing.ease,
                useNativeDriver: true,
            }).start(() => {
                setCurrentStep(currentStep - 1);
                translateX.setValue(0); // Reset animation
            });
        } else {
            // Return to previous screen if on first step
            router.back();
        }
    };

    // Function to save onboarding data
    const handleSaveOnboarding = async () => {
        if (!isAuthenticated) {
            console.log('User not authenticated, skipping save');
            return;
        }
        setSaveOnboardingData(true);
    };

    const renderStep = () => {
        const StepComponent = Steps[currentStep].component;
        return (
            <StepComponent goToNextStep={handleNext} />
        );
    };

    // Determine if we're on the SelectAvatar step
    const isAvatarStep = currentStep === 2;

    // Calculate progress percentage
    const progressPercentage = ((currentStep + 1) / Steps.length) * 100;

    if (isLoading) {
        return (
            <View style={styles.container}>
                <Spinner />
            </View>
        )
    }

    return (
        <LinearGradient
            colors={['#E9D5FF', '#FFFFFF']}
            style={styles.container}
            start={{ x: 0.5, y: 0 }}
            end={{ x: 0.5, y: 1 }}
        >
            <SafeAreaView style={styles.safeArea}>

                {saveOnboardingData ? <FinalOnboardingLoad onComplete={() => router.replace("/(tabs)/chat" as any)} onboardingData={payload} /> :
                    <>
                        <MotiView
                            key={currentStep}
                            from={{ opacity: 0, translateY: 20 }}
                            animate={{ opacity: 1, translateY: 0 }}
                            transition={{ duration: 500 }}
                        >
                            {/* Header with back button and progress bar */}
                            <View style={styles.header}>
                                <TouchableOpacity
                                    style={styles.backButton}
                                    onPress={handleBack}
                                >
                                    <ArrowLeft size={24} color="white" />
                                </TouchableOpacity>
                                <View style={[styles.progressBarContainer, { width: `${progressPercentage - 20}%` }]}>
                                    <LinearGradient
                                        colors={['#ec4899', '#8b5cf6']} // from-pink-500 to-purple-500
                                        start={{ x: 0, y: 0 }}
                                        end={{ x: 1, y: 0 }}
                                    >
                                        <View style={[{ width: `${progressPercentage}%` }]} >
                                            <View style={[styles.progressBar]} />
                                        </View>
                                    </LinearGradient>
                                </View>
                            </View>

                            {isLoading && (
                                <ThemedText style={styles.loadingText}>Loading your profile...</ThemedText>
                            )}
                            <GradientText gradientColors={['#9333ea', '#ec4899']} className='text-2xl font-bold mb-2 text-transparent bg-clip-text' style={styles.title} >
                                {Steps[currentStep].title.text}
                            </GradientText>
                            <ThemedText type='default' className='text-base text-gray-600' style={[styles.subTitle]} >{Steps[currentStep].title.subText}</ThemedText>

                            {/* Rest of the content */}
                            <MotiScrollView
                                key={currentStep}
                                contentContainerStyle={[styles.stepContainer]}
                                // style={{ height: '100%', width: '100%', justifyContent: 'flex-start', alignItems: 'center' }}
                                from={{ opacity: 0, translateX: 20 }}
                                animate={{ opacity: 1, translateX: 0 }}
                                exit={{ opacity: 0, translateX: -20 }}
                                transition={{ duration: 0.3 }}
                            >
                                {renderStep()}
                            </MotiScrollView>

                        </MotiView>
                        <LinearGradient
                            colors={['#ec4899', '#8b5cf6']} // from-pink-500 to-purple-500
                            start={{ x: 0, y: 0 }}
                            end={{ x: 1, y: 0 }}
                            style={[styles.btnContainer, isAvatarStep && styles.avatarStepButton]}
                        >
                            <Pressable
                                style={[
                                    authnStyles.ctaActionContainer,
                                    styles.button,
                                    !isCurrentStepComplete && styles.disabledButton
                                ]}
                                onPress={() => {
                                    if (isCurrentStepComplete) {
                                        withHaptick(handleNext)()
                                    }
                                }}
                                disabled={!isCurrentStepComplete}
                            >
                                <ThemedText
                                    style={[
                                        authnStyles.ctaActionText,
                                        !isCurrentStepComplete && styles.disabledButtonText
                                    ]}
                                >
                                    {"Next"}
                                </ThemedText>
                            </Pressable>
                        </LinearGradient>
                    </>

                }
            </SafeAreaView>

        </LinearGradient>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        height: "100%",
        flexDirection: "column"
    },
    safeArea: {
        flex: 1,
        opacity: 1
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 16,
        paddingTop: 8,
        paddingBottom: 16,
        width: '100%',
    },
    backButton: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: '#9D4EDD',
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 16,
    },
    progressBarContainer: {
        borderRadius: 999,
        overflow: 'hidden',
        height: 8,
    },
    progressBar: {
        height: '100%',
        // backgroundColor: '#9D4EDD',
        borderRadius: 3,
    },
    stepContainer: {
        alignItems: 'center',
        padding: 0,
        // height: "100%",
        gap: theme.spacing.lg * 2,
        width: "100%",
        shadowColor: theme.colors.secondary.darkGray,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 5,
        elevation: 4,
        position: "relative",

    },
    stepText: {
        fontSize: 24,
        fontWeight: 'bold',
        textAlign: 'center',
    },
    flexContainer: {
        display: "flex",
        flexDirection: "row",
        gap: theme.spacing.lg
    },
    cardContainer: {
        backgroundColor: theme.colors.primary.purple,
        padding: theme.spacing.md,
        justifyContent: "center",
        alignItems: "center",
        borderRadius: "10%",
        shadowColor: theme.colors.secondary.darkGray,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 5,
        elevation: 4,
    },
    title: {
        color: theme.colors.primary.purple, // Make text transparent so that gradient shows
        fontSize: 30,
        fontWeight: 'bold',
        backgroundColor: 'transparent', // Make sure background is transparent
        padding: theme.spacing.md,
        paddingBottom: 0,
        textAlign: "center"
    },
    button: {
        backgroundColor: "transparent",
        width: "100%",
        height: 50,
        fontSize: 16,
        fontWeight: "bold",
        fontFamily: "default-semibold",
    },
    disabledButton: {
        opacity: 0.7,
    },
    disabledButtonText: {
        color: theme.colors.secondary.darkGray,
    },
    btnContainer: {
        borderRadius: "7%",
        bottom: 60,
        zIndex: 999, // Ensure button is above other elements
        width: "90%",
        position: 'absolute',
        left: 0,
        right: 0,
        transform: [{ translateX: 20 }],
    },
    avatarStepButton: {
        bottom: 50, // Move the button higher up on the avatar step
    },
    loadingText: {
        textAlign: 'center',
        padding: theme.spacing.sm,
        color: theme.colors.primary.purple
    },
    subTitle: {
        color: 'rgba(75 85 99 / 1)',
        fontSize: 16,
        fontWeight: '600',
        textAlign: 'center',
        paddingHorizontal: 16,
        paddingBottom: 16,
        fontFamily: 'default-regular',
        lineHeight: 24,
    }
});

export default Onboarding;
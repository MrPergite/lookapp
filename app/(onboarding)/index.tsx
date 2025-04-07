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
import { ChevronLeft } from 'lucide-react-native';

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

    // Step control
    const [currentStep, setCurrentStep] = useState(0);

    // Animated values
    const translateX = new Animated.Value(0);

    // Use React Query to fetch onboarding data
    const { data, isLoading, error } = useQuery({
        queryKey: ['onboardingData'],
        queryFn: async () => {
            try {
                if (!isAuthenticated) {
                    console.log('User not authenticated, skipping onboarding fetch');
                    return null;
                }
                
                const response = await callProtectedEndpoint<{success: boolean, data: {onboardingInfo: OnboardingData}}>(
                    'getOnboardingInfo'
                );
                
                return response.data.onboardingInfo;
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
        console.log({ data })
        if (data) {
            // Update each field in the context
            Object.entries(data).forEach(([key, value]) => {
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
            saveOnboardingData();
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
    const saveOnboardingData = async () => {
        if (!isAuthenticated) {
            console.log('User not authenticated, skipping save');
            return;
        }

        try {
            const response = await callProtectedEndpoint(
                'saveOnboardingInfo',
                {
                    method: 'POST',
                    data: { onboardingInfo: payload }
                }
            );
            
            // Navigate to home after saving
            router.navigate('/');
            
            Toast.show({
                type: 'success',
                text1: 'Success',
                text2: 'Your profile has been saved!'
            });
        } catch (err) {
            console.error('Failed to save onboarding data:', err);
            Toast.show({
                type: 'error',
                text1: 'Error',
                text2: 'Failed to save your profile'
            });
        }
    };

    const renderStep = () => {
        const StepComponent = Steps[currentStep].component;
        return <StepComponent />;
    };

    // Determine if we're on the SelectAvatar step
    const isAvatarStep = currentStep === 2;

    // Calculate progress percentage
    const progressPercentage = ((currentStep + 1) / Steps.length) * 100;

    return (
        <LinearGradient
            colors={['#F3EEFF', '#F3EEFF']}
            style={styles.container}
            start={[0, 0]} 
            end={[1, 0]}
        >
            <SafeAreaView style={styles.safeArea}>
                {/* Header with back button and progress bar */}
                <View style={styles.header}>
                    <TouchableOpacity 
                        style={styles.backButton}
                        onPress={handleBack}
                    >
                        <ChevronLeft size={24} color="white" />
                    </TouchableOpacity>
                    <View style={styles.progressBarContainer}>
                        <View style={[styles.progressBar, { width: `${progressPercentage}%` }]} />
                    </View>
                </View>
                
                {isLoading && (
                    <ThemedText style={styles.loadingText}>Loading your profile...</ThemedText>
                )}
                <ThemedText type='title' style={styles.title} >{Steps[currentStep].title.text}</ThemedText>
                <ThemedText type='default' style={[{ padding: theme.spacing.md, paddingTop: 0,textAlign: "center" }]} >{Steps[currentStep].title.subText}</ThemedText>
                
                {/* Rest of the content */}
                <Animated.ScrollView contentContainerStyle={[styles.stepContainer, { transform: [{ translateX }] }]}>
                    {renderStep()}
                    <LinearGradient
                        colors={isCurrentStepComplete 
                            ? [theme.colors.primary.pink, theme.colors.primary.purple] 
                            : [theme.colors.secondary.lightGray, theme.colors.secondary.darkGray]}
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
                                {currentStep === Steps.length - 1 ? "Done" : "Next"}
                            </ThemedText>
                        </Pressable>
                    </LinearGradient>
                </Animated.ScrollView>
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
        flex: 1,
        height: 6,
        backgroundColor: '#E0E0E0',
        borderRadius: 3,
        overflow: 'hidden',
    },
    progressBar: {
        height: '100%',
        backgroundColor: '#9D4EDD',
        borderRadius: 3,
    },
    stepContainer: {
        alignItems: 'center',
        padding: 0,
        height: "100%",
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
        backgroundColor: "transparent"
    },
    disabledButton: {
        opacity: 0.7,
    },
    disabledButtonText: {
        color: theme.colors.secondary.darkGray,
    },
    btnContainer: {
        borderRadius: "8%",
        bottom: 20,
        zIndex: 999, // Ensure button is above other elements
    },
    avatarStepButton: {
        bottom: 50, // Move the button higher up on the avatar step
    },
    loadingText: {
        textAlign: 'center',
        padding: theme.spacing.sm,
        color: theme.colors.primary.purple
    }
});

export default Onboarding;
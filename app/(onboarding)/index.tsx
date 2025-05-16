import React, { useReducer, useState, useEffect, useMemo, useRef } from 'react';
import { View, Text, StyleSheet, Button, Animated, SafeAreaView, Pressable, TouchableOpacity, ActivityIndicator } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { Easing } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import theme from '@/styles/theme';
import { LinearGradient } from 'expo-linear-gradient';
import { ThemedText } from '@/components/ThemedText';
import { onBoardingReducer, useOnBoarding, StyleProfileDataType } from './context';
import { authnStyles } from '../(authn)/styles';
import * as Haptics from "expo-haptics";
import { withHaptick } from '@/utils';
import GenderSelect from './steps/gender-select';
import UserDetails from './steps/user-details';
import SelectAvatar from './steps/select-avatar';
import AvatarPathChoice from './steps/avatar-path-choice';
import StyleProfile, { StyleProfileRefHandles } from './steps/style-profile';
import DisplayCustomAvatars from './steps/DisplayCustomAvatars';
import { useApi } from '@/client-api';
import { useQuery } from '@tanstack/react-query';
import Toast from 'react-native-toast-message';
import { router } from 'expo-router';
import { ArrowLeft, ChevronLeft } from 'lucide-react-native';
import axios from 'axios';
import { routes } from '@/client-api/routes';
import { useAuth, useUser } from '@clerk/clerk-expo';
import Constants from 'expo-constants';
import { GradientHeading } from '@/components/auth';
import { MotiScrollView, MotiView } from 'moti'
import FinalOnboardingLoad from '../../components/FinalOnboardingLoad';
import Spinner from '@/components/Spinner';
import GradientText from '@/components/GradientText';
import DigitalWardrobe from './steps/digital-wardrobe';

// Define a more specific type for components that can be refs
type StepComponentWithRef<P, T> = React.ForwardRefExoticComponent<P & React.RefAttributes<T>>;

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
            text: "Discover Your Digital Wardrobe",
            subText: "Help us build your virtual wardrobe by scanning your fashion purchase emails"
        },
        name: "digitalWardrobe",
        component: DigitalWardrobe,
        requiredFields: []
    },
    {
        title: {
            text: "Choose Your Avatar Path",
            subText: "How would you like to create your profile?"
        },
        name: "avatarPathChoice",
        component: AvatarPathChoice,
        requiredFields: ["avatarPath"]
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
            text: "Create an avatar of you",
            subText: "We've created personalized avatars based on your photo and style preferences"
        },
        name: "styleProfile",
        component: StyleProfile,
        requiredFields: ["styleProfileState"]
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
    gender: string;
    clothing_size: string | null;
    shoe_size: string | null;
    shoe_unit: string | null;
    country: string | null;
    pref_avatar_url: string | null;
    avatarPath: string | null;
    sizes: any | null;
    avatar: any | null;
    styleProfileState?: StyleProfileDataType | null;
}

const Onboarding = () => {
    const { payload, dispatch } = useOnBoarding();
    const { isAuthenticated, callProtectedEndpoint } = useApi();
    const navigation = useNavigation();
    const { getToken } = useAuth();
    const { user, isLoaded: isUserLoaded } = useUser();
    const [saveOnboardingData, setSaveOnboardingData] = useState(false);
    const [currentStep, setCurrentStep] = useState(0);
    const translateX = new Animated.Value(0);
    const styleProfileRef = useRef<StyleProfileRefHandles>(null);
    const [isSettingPreference, setIsSettingPreference] = useState(false);

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

    useEffect(() => {
        // if (data?.data) {
        //     Object.entries(data?.data?.onboardingInfo).forEach(([key, value]) => {
        //         if (value !== null) {
        //             dispatch({
        //                 type: 'SET_PAYLOAD',
        //                 payload: { key, value }
        //             });
        //         }
        //     });
        // }
    }, [data, dispatch]);

    const isCurrentStepComplete = useMemo(() => {
        const currentStepConfig = Steps[currentStep];
        if (!currentStepConfig.requiredFields || currentStepConfig.requiredFields.length === 0) {
            return true;
        }
        return currentStepConfig.requiredFields.every(field => {
            const value = payload[field as keyof typeof payload];
            if (field === "styleProfileState" && currentStepConfig.name === "styleProfile") {
                const currentAvatarStatus = user?.publicMetadata?.avatar_creation_status
                if ( currentAvatarStatus &&  currentAvatarStatus!== 'ready' ) {
                    // If avatar is ready, this specific field requirement is met for enabling Next button.
                    return true; 
                } else {
                    return false
                }
            }
            
            // Default check for other fields or other steps
            return value !== null && value !== undefined && value !== '';
        });
    }, [currentStep, payload]);

    const handleNextParent = (pathFromAvatarChoice?: 'custom' | 'premade') => {
        const currentStepConfig = Steps[currentStep];
        let nextStepIndex = -1;

        if (currentStepConfig.name === "avatarPathChoice") {
            const chosenPath = pathFromAvatarChoice || payload.avatarPath;
            if (!chosenPath) {
                console.error("Avatar path not determined for navigation from avatarPathChoice.");
                Toast.show({ type: 'error', text1: 'Selection Error', text2: 'Please make a selection to continue.' });
                return;
            }
            const nextStepAfterAvatarChoice = chosenPath === 'custom' ? "styleProfile" : "select-avatar";
            nextStepIndex = Steps.findIndex(step => step.name === nextStepAfterAvatarChoice);
        } else if (currentStepConfig.name === "gender") {
            nextStepIndex = Steps.findIndex(step => step.name === "digitalWardrobe");
        } else if (currentStepConfig.name === "digitalWardrobe") {
            nextStepIndex = Steps.findIndex(step => step.name === "avatarPathChoice");
        } else if (currentStepConfig.name === "styleProfile") {
            nextStepIndex = Steps.findIndex(step => step.name === "user-details");
        } else if (currentStepConfig.name === "user-details") {
            if (payload.avatarPath === 'premade') {
                nextStepIndex = Steps.findIndex(step => step.name === "select-avatar");
            } else {
                handleSaveOnboarding();
                return;
            }
        } else {
            if (currentStep < Steps.length - 1) {
                nextStepIndex = currentStep + 1;
                if (Steps[nextStepIndex]?.name === 'styleProfile' && payload.avatarPath === 'premade') {
                    const selectAvatarIndex = Steps.findIndex(step => step.name === "select-avatar");
                    if (selectAvatarIndex !== -1) nextStepIndex = selectAvatarIndex;
                }
            } else {
                handleSaveOnboarding();
                return;
            }
        }

        if (nextStepIndex !== -1 && nextStepIndex < Steps.length) {
            Animated.timing(translateX, {
                toValue: -1000,
                duration: 300,
                easing: Easing.ease,
                useNativeDriver: true,
            }).start(() => {
                setCurrentStep(nextStepIndex);
                translateX.setValue(0);
            });
        } else if (nextStepIndex === -1 && currentStepConfig.name !== "select-avatar" && currentStepConfig.name !== "user-details") {
            console.warn("Could not determine next step from:", currentStepConfig.name, "with payload:", payload);
            handleSaveOnboarding();
        } else if (nextStepIndex !== -1) {
            handleSaveOnboarding();
        }
    };

    const handleBack = () => {
        const currentStepConfig = Steps[currentStep];
        let prevStepIndex = -1;
        if (currentStepConfig.name === "select-avatar") {
            const prevStep = payload.avatarPath === 'custom' ? "styleProfile" : "avatarPathChoice";
            prevStepIndex = Steps.findIndex(step => step.name === prevStep);
        } else if (currentStepConfig.name === "styleProfile") {
            prevStepIndex = Steps.findIndex(step => step.name === "avatarPathChoice");
        } else if (currentStepConfig.name === "avatarPathChoice") {
            prevStepIndex = Steps.findIndex(step => step.name === "digitalWardrobe");
        } else if (currentStepConfig.name === "digitalWardrobe") {
            prevStepIndex = Steps.findIndex(step => step.name === "gender");
        } else {
            if (currentStep > 0) {
                prevStepIndex = currentStep - 1;
            }
        }
        if (prevStepIndex !== -1) {
            Animated.timing(translateX, {
                toValue: 1000,
                duration: 300,
                easing: Easing.ease,
                useNativeDriver: true,
            }).start(() => {
                setCurrentStep(prevStepIndex);
                translateX.setValue(0);
            });
        } else {
            router.back();
        }
    };

    const handleSaveOnboarding = async () => {
        if (!isAuthenticated) {
            console.log('User not authenticated, skipping save');
            return;
        }
        setSaveOnboardingData(true);
    };

    const isCurrentStepInternallyScrollable = useMemo(() => {
        const currentStepName = Steps[currentStep]?.name;
        // "styleProfile" is the step name when DisplayCustomAvatars or StyleProfile is rendered
        // "select-avatar" is when SelectAvatars is rendered
        const DYNAMIC_STEPS_WITH_INTERNAL_SCROLL = ["styleProfile", "select-avatar"];
        return DYNAMIC_STEPS_WITH_INTERNAL_SCROLL.includes(currentStepName || "");
    }, [currentStep]);

    const renderStep = () => {
        const stepConfig = Steps[currentStep];
        const stepName = stepConfig.name;
        switch (stepName) {
            case "styleProfile":
                const customAvatars = user?.publicMetadata?.custom_avatar_urls as string[] || [];
                const chosenAvatarPath = payload.avatarPath;

                if (chosenAvatarPath === 'custom' && customAvatars.length > 0 && isUserLoaded) {
                    return <DisplayCustomAvatars onNext={() => handleNextParent()} onBack={handleBack} />;
                } else if (isUserLoaded || chosenAvatarPath !== 'custom') {
                    return <StyleProfile ref={styleProfileRef} onNext={() => handleNextParent()} onBack={handleBack} />;
                } else {
                    return (
                        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
                            <ActivityIndicator size="large" color={theme.colors.primary.purple} />
                        </View>
                    );
                }
            case "avatarPathChoice":
                const AvatarPathComponent = stepConfig.component as React.FC<{ onNext?: (path: 'custom' | 'premade') => void, onBack?: () => void }>;
                return <AvatarPathComponent onNext={handleNextParent} onBack={handleBack} />;
            case "gender":
                const GenderSelectComponent = stepConfig.component as React.FC<{ goToNextStep: () => void }>;
                return <GenderSelectComponent goToNextStep={() => handleNextParent()} />;
            case "user-details":
            case "select-avatar":
            default:
                const OtherComponent = stepConfig.component as React.FC<{ goToNextStep: () => void }>;
                return <OtherComponent goToNextStep={() => handleNextParent()} />;
        }
    };

    const isAvatarStep = Steps[currentStep].name === "select-avatar";
    const showNextButton = Steps[currentStep].name !== "avatarPathChoice";
    const isAvatarPathStep = Steps[currentStep].name === "avatarPathChoice";

    const motiViewAnimationProps = isAvatarPathStep ? {
        from: { opacity: 1, translateY: 0 },
        animate: { opacity: 1, translateY: 0 },
        transition: { duration: 0 }
    } : {
        from: { opacity: 0, translateY: 20 },
        animate: { opacity: 1, translateY: 0 },
        transition: { duration: 500 }
    };

    const motiScrollAnimationProps = isAvatarPathStep ? {
        from: { opacity: 1, translateX: 0 },
        animate: { opacity: 1, translateX: 0 },
        exit: { opacity: 0, translateX: -20 },
        transition: { duration: 0 }
    } : {
        from: { opacity: 0, translateX: 20 },
        animate: { opacity: 1, translateX: 0 },
        exit: { opacity: 0, translateX: -20 },
        transition: { type: "timing" as const, duration: 300 }
    };

    const progressPercentage = useMemo(() => {
        const isPremadePath = payload.avatarPath === 'premade';
        const totalStepsInFlow = isPremadePath ? Steps.length - 1 : Steps.length;
        let currentLogicalStepNumber = 0;
        if (isPremadePath) {
            let count = 0;
            for (let i = 0; i <= currentStep; i++) {
                if (Steps[i].name !== 'styleProfile') {
                    count++;
                }
            }
            currentLogicalStepNumber = count;
        } else {
            currentLogicalStepNumber = currentStep + 1;
        }
        return (currentLogicalStepNumber / totalStepsInFlow) * 100;
    }, [currentStep, payload.avatarPath, Steps]);

    if (isLoading || !isUserLoaded && Steps[currentStep].name === "styleProfile" && payload.avatarPath === 'custom') {
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
                {saveOnboardingData ? 
                    (() => {
                        const finalData = {
                            gender: payload.gender || "", 
                            clothing_size: payload.clothing_size,
                            shoe_size: payload.shoe_size,
                            shoe_unit: payload.shoe_unit,
                            country: payload.country,
                            pref_avatar_url: payload.pref_avatar_url,
                          
                        } as OnboardingData;
                        return (
                            <FinalOnboardingLoad 
                                onComplete={() => router.replace("/(tabs)/chat" as any)} 
                                onboardingData={finalData}
                            />
                        );
                    })()
                    :
                    <>
                        <MotiView
                            key={currentStep}
                            from={{ opacity: 0, translateY: 20 }}
                            animate={{ opacity: 1, translateY: 0 }}
                            transition={{
                                delay: 100, // milliseconds
                                type: 'timing',
                                duration: 300,
                            }}
                        >
                            <View style={styles.header}>
                                <TouchableOpacity
                                    style={styles.backButton}
                                    onPress={handleBack}
                                >
                                    <ArrowLeft size={24} color="white" />
                                </TouchableOpacity>
                                <View style={[styles.progressBarContainer, { width: `${progressPercentage - 20}%` }]}>
                                    <LinearGradient
                                        colors={['#ec4899', '#8b5cf6']}
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
                            <GradientText gradientColors={['#9333ea', '#ec4899']} className='text-2xl font-bold mb- text-transparent bg-clip-text' style={styles.title} >
                                {Steps[currentStep].title.text}
                            </GradientText>
                            <ThemedText type='default' className='text-base text-gray-1000' style={[styles.subTitle]} >{Steps[currentStep].title.subText}</ThemedText>

                            <MotiScrollView
                                key={`scroll-${currentStep}`}
                                // Apply a style that allows the child to truly flex if it's internally scrollable
                                // Remove minHeight: '100%' from stepContainer when child is internally scrollable
                                contentContainerStyle={[
                                    styles.stepContainer,
                                    isCurrentStepInternallyScrollable && { minHeight: undefined, flexGrow: 1, alignSelf: 'stretch' }
                                ]}
                                scrollEnabled={!isCurrentStepInternallyScrollable}
                                bounces={!isCurrentStepInternallyScrollable} // Optional: disable bounce for non-scrolling parent
                                {...motiScrollAnimationProps}
                            >
                                {/* Ensure the rendered step itself can flex if it needs to take full height */}
                                <View style={{ flex: isCurrentStepInternallyScrollable ? 1 : 0, width: '100%' }}>
                                    {renderStep()}
                                </View>
                            </MotiScrollView>

                        </MotiView>
                        {showNextButton && (
                            <LinearGradient
                                colors={['#ec4899', '#8b5cf6']}
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
                                    onPress={async () => {
                                        if (!isCurrentStepComplete) return;

                                        const currentOnboardingStepName = Steps[currentStep].name;
                                        const styleState = payload.styleProfileState;

                                        if (currentOnboardingStepName === "styleProfile") {
                                            // Check for new avatar creation first (applies if user chose custom path and status isn't ready/completed)
                                            const isNewAvatarBeingCreated = 
                                                payload.avatarPath === 'custom' && 
                                                styleState?.avatarStatus !== 'ready'
                                            
                                            if (isNewAvatarBeingCreated) {
                                                // Avatar creation is in progress, allow navigation to next step
                                                withHaptick(() => handleNextParent())();
                                            } else if (styleState?.usingExisting && styleState?.images?.[0]) {
                                                // User selected an existing custom avatar from DisplayCustomAvatars, and no new one is actively processing.
                                                setIsSettingPreference(true);
                                                const preferredAvatarUrl = styleState.images[0];
                                                try {
                                                    await callProtectedEndpoint('setPreferredAvatarUrl', {
                                                        method: 'POST',
                                                        data: { pref_avatar_url: preferredAvatarUrl }
                                                    });
                                                    // Dispatch update to context on success
                                                    dispatch({
                                                        type: 'SET_PAYLOAD',
                                                        payload: {
                                                            key: 'pref_avatar_url',
                                                            value: preferredAvatarUrl
                                                        }
                                                    });
                                                    // Also update styleProfileState to reflect completion of this specific action pathway
                                                    // This ensures that if the user comes back, it doesn't re-trigger setPreferredAvatarUrl unnecessarily
                                                    // if usingExisting was true but avatarStatus was still e.g. 'completed' from a generic avatar load.
                                                    dispatch({
                                                        type: 'SET_PAYLOAD',
                                                        payload: {
                                                            key: 'styleProfileState',
                                                            value: {
                                                                ...styleState, // Preserve other styleProfileState fields
                                                                images: [preferredAvatarUrl], // Confirm selected image
                                                                avatarStatus: 'ready', // Mark as ready/set
                                                                isProcessing: false, // No longer processing this specific action
                                                                // usingExisting: true // This should already be true
                                                            }
                                                        }
                                                    });
                                                    Toast.show({ type: 'success', text1: 'We have processed your avatar!' });
                                                    withHaptick(() => handleNextParent())();
                                                } catch (err: any) {
                                                    console.error("Failed to set preferred avatar:", err);
                                                    Toast.show({ 
                                                        type: 'error', 
                                                        text1: 'Failed to set preference', 
                                                        text2: err.message || 'Please try again.' 
                                                    });
                                                } finally {
                                                    setIsSettingPreference(false);
                                                }
                                            } else if (styleProfileRef.current) {
                                                // User is on StyleProfile (upload screen) to create a new avatar
                                                withHaptick(() => styleProfileRef.current?.submitStep())();
                                            } else {
                                                // Fallback: should ideally not be reached if DisplayCustomAvatars/StyleProfile logic is correct for context updates
                                                withHaptick(() => handleNextParent())(); 
                                            }
                                        } else {
                                            // Handle other steps
                                            withHaptick(() => handleNextParent())();
                                        }
                                    }}
                                    disabled={!isCurrentStepComplete || isSettingPreference}
                                >
                                    <ThemedText
                                        style={[
                                            authnStyles.ctaActionText,
                                            !isCurrentStepComplete && styles.disabledButtonText,
                                            { color: '#ffffff', fontWeight: '900' }
                                        ]}
                                    >
                                        {isSettingPreference || payload.styleProfileState?.isProcessing
                                            ? "Processing..." 
                                            : (Steps[currentStep].name === "styleProfile" && 
                                               (payload.styleProfileState?.avatarStatus && payload.styleProfileState?.avatarStatus !== 'ready' && payload.styleProfileState?.avatarStatus !== 'completed') &&
                                               payload.avatarPath === 'custom' &&   payload.styleProfileState?.isProcessing
                                              )
                                            ? "Processing..." 
                                            : "Next"}
                                    </ThemedText>
                                </Pressable>
                            </LinearGradient>
                        )}
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
        alignItems: 'flex-start',
        // padding: 0, // If padding is desired, ensure it doesn't conflict with child's 100% width needs
        // gap: theme.spacing.lg * 2, // Gap might be an issue if child is flex:1
        width: "100%",
        // shadowColor: theme.colors.secondary.darkGray, // Shadow might be better on individual step components
        // shadowOffset: { width: 0, height: 4 },
        // shadowOpacity: 0.3,
        // shadowRadius: 5,
        // elevation: 4,
        position: "relative",
        minHeight: '100%', // Default, will be overridden by isCurrentStepInternallyScrollable
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
        fontSize: 24,
        fontWeight: '700',
        backgroundColor: 'transparent', // Make sure background is transparent
        padding: theme.spacing.md,
        paddingBottom: 0,
        marginBottom: 8,
        textAlign: "center",
        lineHeight: 32
    },
    button: {
        backgroundColor: "transparent",
        width: "100%",
        height: 50,
        fontSize: 16,
        fontWeight: "bold",
        fontFamily: 'Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, Segoe UI, Roboto, Helvetica Neue, Arial, Noto Sans, sans-serif, Apple Color Emoji, Segoe UI Emoji, Segoe UI Symbol, Noto Color Emoji;',
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
        color: 'rgba(75 85 99  / 1)',
        fontSize: 16,
        // fontWeight: '500',
        textAlign: 'center',
        paddingHorizontal: 16,
        paddingBottom: 16,
        fontFamily: 'Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, Segoe UI, Roboto, Helvetica Neue, Arial, Noto Sans, sans-serif, Apple Color Emoji, Segoe UI Emoji, Segoe UI Symbol, Noto Color Emoji;',
        lineHeight: 20
    },
    loaderViewStyle: {
        width: 20, // Or whatever size you use for Loader2
        height: 20,
        alignItems: 'center',
        justifyContent: 'center',
    }
});

export default Onboarding;
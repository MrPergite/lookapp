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
    
    // Animation values for the Next button
    const nextButtonScale = useRef(new Animated.Value(1)).current;

    // Animation for button press
    const handleNextButtonPressIn = () => {
        Animated.spring(nextButtonScale, {
            toValue: 0.95,
            useNativeDriver: true,
            friction: 5,
            tension: 50,
        }).start();
        
        // Restore enhanced haptic feedback when pressing the button
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    };

    const handleNextButtonPressOut = () => {
        Animated.spring(nextButtonScale, {
            toValue: 1,
            friction: 3,
            tension: 40,
            useNativeDriver: true,
        }).start();
    };

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
                    text2: 'Failed to load your profile data',
                    visibilityTime: 2000
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
        const currentStepName = currentStepConfig.name;

        // Specific condition to enable "Next" button for styleProfile:
        // custom path, an avatar_creation_status exists on user metadata, and no actual custom avatars are stored yet.
        if (
            currentStepName === "styleProfile" &&
            payload.avatarPath === 'custom' &&
            user?.publicMetadata?.avatar_creation_status && user?.publicMetadata?.avatar_creation_status !== 'ready'
        ) {
            console.log("isCurrentStepComplete: Enabling Next for styleProfile (custom path, avatar_creation_status exists, no clerk custom avatars).");
            return true; // Override: Step is considered complete for button enablement in this specific scenario.
        }

        // Original general logic for required fields
        if (!currentStepConfig.requiredFields || currentStepConfig.requiredFields.length === 0) {
            return true;
        }

        return currentStepConfig.requiredFields.every(field => {
            const value = payload[field as keyof typeof payload];
            
            // Original conditional logic for 'styleProfileState' for the 'styleProfile' step
            if (field === "styleProfileState" && currentStepName === "styleProfile") {
                const styleState = value as StyleProfileDataType | null | undefined;
                if (styleState?.avatarStatus === 'ready') {
                    // If avatar is ready (e.g., selected from DisplayCustomAvatars, or a premade one has been fully processed by context),
                    // this part of the step is considered "complete" for navigation enablement.
                    return true; 
                } else {
                    // If avatar is NOT ready, then styleProfileState (the object itself) needs to be present for the step to operate.
                    // The child component (StyleProfile/DisplayCustomAvatars) will handle if it can *actually* proceed based on internal state.
                    return value !== null && value !== undefined;
                }
            }
            
            // Default check for all other fields or other steps
            return value !== null && value !== undefined && value !== '';
        });
    }, [currentStep, payload, user]); // Added user to dependency array

    const handleNextParent = (pathFromAvatarChoice?: 'custom' | 'premade') => {
        const currentStepConfig = Steps[currentStep];
        let nextStepIndex = -1;

        if (currentStepConfig.name === "avatarPathChoice") {
            const chosenPath = pathFromAvatarChoice || payload.avatarPath;
            if (!chosenPath) {
                console.error("Avatar path not determined for navigation from avatarPathChoice.");
                // Restore error haptic feedback
                Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
                Toast.show({ type: 'error', text1: 'Selection Error', text2: 'Please make a selection to continue.', visibilityTime: 2000 });
                return;
            }
            // If 'premade' is chosen, next step is 'select-avatar'. If 'custom', it's 'styleProfile'.
            const nextStepAfterAvatarChoice = chosenPath === 'custom' ? "styleProfile" : "select-avatar";
            nextStepIndex = Steps.findIndex(step => step.name === nextStepAfterAvatarChoice);
        } else if (currentStepConfig.name === "gender") {
            nextStepIndex = Steps.findIndex(step => step.name === "digitalWardrobe");
        } else if (currentStepConfig.name === "digitalWardrobe") {
            nextStepIndex = Steps.findIndex(step => step.name === "avatarPathChoice");
        } else if (currentStepConfig.name === "styleProfile") {
            // After styleProfile (custom avatar flow), go to user-details
            nextStepIndex = Steps.findIndex(step => step.name === "user-details");
        } else if (currentStepConfig.name === "select-avatar") {
            // After select-avatar (premade avatar flow), go to user-details
            nextStepIndex = Steps.findIndex(step => step.name === "user-details");
        } else if (currentStepConfig.name === "user-details") {
            // This was the old logic: if (payload.avatarPath === 'premade') { nextStepIndex = Steps.findIndex(step => step.name === "select-avatar"); }
            // Now, after user-details, if it's not the end, it would typically be the final save/completion.
            // Or, if select-avatar was skipped for custom path, this might be an endpoint.
            // For now, assume user-details is the last *interactive* data input step before potential finalization.
            // If it's truly the end of specific data gathering before final save:
            handleSaveOnboarding();
            return;
            // If there was another step after user-details in *all* flows, handle it here.
            // Example: if (currentStep < Steps.length - 1) nextStepIndex = currentStep + 1;
        } else {
            if (currentStep < Steps.length - 1) {
                nextStepIndex = currentStep + 1;
                // This specific skip logic might need re-evaluation based on the new flow.
                // if (Steps[nextStepIndex]?.name === 'styleProfile' && payload.avatarPath === 'premade') {
                //     const selectAvatarIndex = Steps.findIndex(step => step.name === "select-avatar");
                //     if (selectAvatarIndex !== -1) nextStepIndex = selectAvatarIndex;
                // }
            } else {
                handleSaveOnboarding();
                return;
            }
        }

        if (nextStepIndex !== -1 && nextStepIndex < Steps.length) {
            // Restore success haptic feedback for step transition
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
            
            Animated.timing(translateX, {
                toValue: -1000,
                duration: 300,
                easing: Easing.ease,
                useNativeDriver: true,
            }).start(() => {
                setCurrentStep(nextStepIndex);
                translateX.setValue(0);
                
                // Restore additional feedback when the transition completes
                Haptics.selectionAsync();
            });
        } else if (nextStepIndex === -1 && currentStepConfig.name !== "select-avatar" && currentStepConfig.name !== "user-details") {
            console.warn("Could not determine next step from:", currentStepConfig.name, "with payload:", payload);
            handleSaveOnboarding();
        } else if (nextStepIndex !== -1) {
            handleSaveOnboarding();
        }
    };

    const handleBack = () => {
        // Restore haptic feedback for back button press
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        
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
                // Restore haptic feedback when the transition completes
                Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
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
        // Restore strong haptic feedback to signify completion
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
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
                if ((chosenAvatarPath === 'custom' && customAvatars.length > 0 && isUserLoaded) || user?.publicMetadata?.avatar_creation_status) {
                    return <DisplayCustomAvatars  onNext={() => handleNextParent()} onBack={handleBack} />
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

    // Add animations for step transitions
    const stepTransitionAnimation = {
        from: { opacity: 0, translateX: 20 },
        animate: { opacity: 1, translateX: 0 },
        exit: { opacity: 0, translateX: -20 },
        transition: { type: 'timing' as const, duration: 500 }
    };

    // Add animations for button press
    const buttonPressAnimation = {
        scale: nextButtonScale,
        transition: { type: 'spring', stiffness: 100, damping: 10 }
    };

    if (isLoading || !isUserLoaded && Steps[currentStep].name === "styleProfile" && payload.avatarPath === 'custom') {
        return (
            <View style={styles.container}>
                <Spinner />
            </View>
        )
    }

    return (
        <LinearGradient
            colors={['#ffffff', '#f5f3ff', '#f0f9ff']}
            start={{ x: 0, y: 0 }}
            end={{ x: 0, y: 1 }}
            style={styles.container}
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
                            {...stepTransitionAnimation}
                        >
                            <View style={styles.header}>
                        
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
                            <GradientText   gradientColors={['#8B5CF6', '#EC4899', '#3B82F6']}
 className='text-2xl font-bold mb- text-transparent bg-clip-text' style={styles.title} >
                                {Steps[currentStep].title.text}
                            </GradientText>
                            <ThemedText type='default' className='text-base text-gray-1000' style={[styles.subTitle]} >{Steps[currentStep].title.subText}</ThemedText>

                            <MotiScrollView
                                key={`scroll-${currentStep}`}
                                contentContainerStyle={[
                                    styles.stepContainer,
                                    isCurrentStepInternallyScrollable && { minHeight: '100%', flexGrow: 1, alignSelf: 'stretch' }
                                ]}
                                scrollEnabled={true}
                                bounces={true}
                                {...motiScrollAnimationProps}
                            >
                                <View style={{
                                    flex: 1, 
                                    width: '100%',
                                    paddingBottom: 200 
                                }}>
                                    {renderStep()}
                                </View>
                            </MotiScrollView>

                        </MotiView>
                        {isAvatarStep && (
                          <Animated.View 
                            style={[
                              styles.btnContainerWrapper,
                              { transform: [{ scale: nextButtonScale }], bottom: 20 }
                            ]}
                          >
                            <LinearGradient
                              colors={['#8B5CF6', '#EC4899', '#3B82F6']}
                              start={{ x: 0, y: 0 }}
                              end={{ x: 1, y: 0 }}
                              style={[styles.btnContainer]}
                            >
                              <Pressable
                                style={[
                                  authnStyles.ctaActionContainer,
                                  styles.button,
                                  !isCurrentStepComplete && styles.disabledButton
                                ]}
                                onPress={async () => {
                                  if (!isCurrentStepComplete) return;
                                  withHaptick(() => handleNextParent())();
                                }}
                                onPressIn={handleNextButtonPressIn}
                                onPressOut={handleNextButtonPressOut}
                                android_ripple={{ color: 'rgba(255,255,255,0.3)', borderless: false, radius: 36 }}
                                disabled={!isCurrentStepComplete || isSettingPreference}
                                {...buttonPressAnimation}
                              >
                                <ThemedText
                                  style={[
                                    authnStyles.ctaActionText,
                                    !isCurrentStepComplete && styles.disabledButtonText,
                                    { color: '#ffffff', fontWeight: 600, fontSize:18, lineHeight:28 }
                                  ]}
                                >
                                  Next
                                </ThemedText>
                              </Pressable>
                            </LinearGradient>
                          </Animated.View>
                        )}
                        
                        {showNextButton && !isAvatarStep && (
                          <Animated.View 
                            style={[
                              styles.btnContainerWrapper,
                              { transform: [{ scale: nextButtonScale }] }
                            ]}
                          >
                            <LinearGradient
                              colors={['#8B5CF6', '#EC4899', '#3B82F6']}
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
                                  const clerkCustomAvatars = user?.publicMetadata?.custom_avatar_urls as string[] || [];

                                  if (currentOnboardingStepName === "styleProfile") {
                                    if (
                                      payload.avatarPath === 'custom' &&
                                      user?.publicMetadata?.avatar_creation_status  && clerkCustomAvatars.length === 0 && !styleProfileRef.current
                                    ) {
                                        // User is on StyleProfile upload screen, custom path, avatar not ready, and NO avatars exist yet.
                                        // Pressing Next should just go to the next screen without API calls.
                                        console.log("Onboarding: StyleProfile - Custom path, avatar not ready, no custom avatars. Proceeding without API call.");
                                        withHaptick(() => handleNextParent())();
                                    } else if (payload.avatarPath === 'custom' && user?.publicMetadata?.avatar_creation_status !== 'ready' && !styleProfileRef.current) {
                                        // Custom path, avatar is not ready, but either: 
                                        // 1. customAvatars *do* exist (so user might be on DisplayCustomAvatars with a processing status from elsewhere)
                                        // 2. Or, StyleProfile component itself has started processing (styleState.isProcessing might be true)
                                        // In these cases, allow proceeding as the avatar generation is likely happening or expected to be handled by DisplayCustomAvatars/StyleProfile context updates.
                                        console.log("Onboarding: StyleProfile - Custom path, avatar not ready (processing or has existing). Proceeding.");
                                        withHaptick(() => handleNextParent())();
                                    } else if (styleState?.usingExisting && styleState?.images?.[0] &&  user?.publicMetadata?.avatar_creation_status  === 'ready') {
                                        // User selected an existing custom avatar from DisplayCustomAvatars.
                                        console.log("Onboarding: StyleProfile - Using existing custom avatar. Setting preference.");
                                        setIsSettingPreference(true);
                                        const preferredAvatarUrl = styleState.images[0];
                                        try {
                                            await callProtectedEndpoint('setPreferredAvatarUrl', {
                                                method: 'POST',
                                                data: { pref_avatar_url: preferredAvatarUrl }
                                            });
                                            dispatch({
                                                type: 'SET_PAYLOAD',
                                                payload: { key: 'pref_avatar_url', value: preferredAvatarUrl }
                                            });
                                            dispatch({
                                                type: 'SET_PAYLOAD',
                                                payload: {
                                                    key: 'styleProfileState',
                                                    value: {
                                                        ...styleState,
                                                        images: [preferredAvatarUrl],
                                                        avatarStatus: 'ready',
                                                        isProcessing: false,
                                                    }
                                                }
                                            });
                                            Toast.show({ type: 'success', text1: 'We have processed your avatar!', visibilityTime: 2000 });
                                            withHaptick(() => handleNextParent())();
                                        } catch (err: any) {
                                            console.error("Failed to set preferred avatar:", err);
                                            Toast.show({ 
                                                type: 'error', 
                                                text1: 'Failed to set preference', 
                                                text2: err.message || 'Please try again.' ,
                                                visibilityTime: 2000
                                            });
                                        } finally {
                                            setIsSettingPreference(false);
                                        }
                                    } else if (styleProfileRef.current) {
                                        // Likely on StyleProfile (upload) screen and needs to submit images for new avatar creation.
                                        // This case hits if: 
                                        // - payload.avatarPath is 'custom' AND 
                                        //   - styleState.avatarStatus IS 'ready' (but maybe wants to create a new one) OR
                                        //   - clerkCustomAvatars.length > 0 (but they chose to create new via StyleProfile)
                                        //   - styleState is null/undefined initially
                                        console.log("Onboarding: StyleProfile - Submitting via styleProfileRef.");
                                        withHaptick(() => styleProfileRef.current?.submitStep())();
                                    } else {
                                        // Fallback for styleProfile step if no other condition met.
                                        console.log("Onboarding: StyleProfile - Fallback. Proceeding.");
                                        withHaptick(() => handleNextParent())(); 
                                    }
                                  } else {
                                    // Handle other steps
                                    withHaptick(() => handleNextParent())();
                                  }
                                }}
                                onPressIn={handleNextButtonPressIn}
                                onPressOut={handleNextButtonPressOut}
                                android_ripple={{ color: 'rgba(255,255,255,0.3)', borderless: false, radius: 36 }}
                                disabled={!isCurrentStepComplete || isSettingPreference}
                              >
                                <ThemedText
                                  style={[
                                    authnStyles.ctaActionText,
                                    !isCurrentStepComplete && styles.disabledButtonText,
                                    { color: '#ffffff', fontWeight: 600, fontSize:18, lineHeight:28 }
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
                          </Animated.View>
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
        flexDirection: "column",
        backgroundColor: theme.colors.primary.white
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
        // height: 50,
        fontSize: 16,
        fontWeight:600,
        fontFamily: 'Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, Segoe UI, Roboto, Helvetica Neue, Arial, Noto Sans, sans-serif, Apple Color Emoji, Segoe UI Emoji, Segoe UI Symbol, Noto Color Emoji;',
    },
    disabledButton: {
        opacity: 0.7,
    },
    disabledButtonText: {
        color: theme.colors.secondary.darkGray,
    },
    btnContainerWrapper: {
        position: 'absolute',
        bottom: 60,
        width: '90%',
        left: '5%',
        zIndex: 999,
        overflow: 'hidden',
        borderRadius: 9999,
        elevation: 5,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.2,
        shadowRadius: 8,
    },
    btnContainer: {
        borderRadius: 16,
        width: '100%',
        overflow: 'hidden',
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
        color: 'rgba(75,85,99,1)',
        fontSize: 16,
        fontWeight: '500',
        textAlign: 'center',
        paddingHorizontal: 16,
        paddingBottom: 16,
        fontFamily: 'Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, Segoe UI, Roboto, Helvetica Neue, Arial, Noto Sans, sans-serif, Apple Color Emoji, Segoe UI Emoji, Segoe UI Symbol, Noto Color Emoji;',
        lineHeight: 24
    },
    loaderViewStyle: {
        width: 20, // Or whatever size you use for Loader2
        height: 20,
        alignItems: 'center',
        justifyContent: 'center',
    }
});

export default Onboarding;
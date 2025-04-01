import React, { useReducer, useState } from 'react';
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


const Steps = [
    {
        title: "Gender",
        name: "gender",
        component: GenderSelect
    }
]

const Onboarding = () => {
    const { payload, dispatch } = useOnBoarding()

    // Step control
    const [currentStep, setCurrentStep] = useState(0);

    // Animated values
    const translateX = new Animated.Value(0);

    const handleNext = () => {
        // if (currentStep < 3) {
        //     Animated.timing(translateX, {
        //         toValue: translateX._value - 1000, // Slide left
        //         duration: 300,
        //         easing: Easing.ease,
        //         useNativeDriver: true,
        //     }).start(() => {
        //         setCurrentStep(currentStep + 1);
        //         translateX.setValue(0); // Reset animation
        //     });
        // } else {
        //     // Navigate to Home or Main Screen after last step
        // }
    };

    const renderStep = () => {
        return Steps[currentStep].component()
    };

    return (
        <LinearGradient
            colors={[theme.colors.primary.lavender, theme.colors.primary.white]}
            style={styles.container}
            start={[0, 0]} // start of the gradient
            end={[1, 0]}
        >
            <SafeAreaView>
                <ThemedText type='title' style={styles.title} >Tell us about yourself</ThemedText>
                <ThemedText type='default' style={[{ padding: theme.spacing.md, paddingTop: 0 }]} >We'll use this to show you items you'll love!</ThemedText>
                <Animated.View style={[styles.stepContainer, { transform: [{ translateX }] }]}>
                    {renderStep()}
                    <LinearGradient
                        colors={[theme.colors.primary.pink, theme.colors.primary.purple]}
                        style={[styles.btnContainer]}
                    >
                        <Pressable style={[authnStyles.ctaActionContainer, styles.button]}
                            onPress={() => {
                                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
                            }} >
                            <ThemedText style={[authnStyles.ctaActionText]} >Continue</ThemedText>
                        </Pressable>
                    </LinearGradient>
                </Animated.View>
            </SafeAreaView>
        </LinearGradient>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        // alignItems: 'center',
        // padding:20,
        height: "100%",
        flexDirection: "column"
        // backgroundColor: '#fff',
    },
    stepContainer: {
        alignItems: 'center',
        // justifyContent: 'space-between',
        padding: 20,
        height: "100%",
        gap: theme.spacing.lg * 2,
        backgroundColor: theme.colors.primary.white,
        width: "100%",
        shadowColor: theme.colors.secondary.darkGray,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 5,
        elevation: 4,
        borderRadius: theme.spacing.xl * 2,
        position: "relative"

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
        paddingBottom: 0
    },
    button: {
        backgroundColor: "transparent"
    },
    btnContainer: {
        borderRadius: "8%",
        position: "absolute",
        bottom: 200
    }
});

export default Onboarding;
import { ThemedText } from '@/components';
import { GradientHeading } from '@/components/auth';
import GradientText from '@/components/GradientText';
import { responsiveFontSize } from '@/utils';
import MaskedView from '@react-native-masked-view/masked-view';
import { LinearGradient } from 'expo-linear-gradient';
import React, { useEffect, useRef } from 'react'
import { View, StyleSheet, Text, Animated } from 'react-native';
import { VirtualTryonCredits } from '../VirtualTryonCredits';


function SimpleHeader({ credits, title, subtitle }: { credits?: number | null, title: string, subtitle?: string }) {
    const slideAnim = useRef(new Animated.Value(-50)).current; // Initial position above the view

    useEffect(() => {
        // Reset animation to initial position
        slideAnim.setValue(-50);
        // Start animation
        Animated.timing(slideAnim, {
            toValue: 0,
            duration: 300,
            useNativeDriver: true, // Ensure native driver is used
        }).start();
    }, [title, subtitle, slideAnim]); // Re-run animation if title, subtitle, or slideAnim instance changes

    return (
        <View
            style={styles.container}>
            <View style={styles.spacer} />
            {typeof credits === "number" && (
                <VirtualTryonCredits
                    credits={credits}
                    id="virtual-tryon-credits-mobile"
                />
            )}
            <Animated.View style={[styles.animatedTitleContainer, { transform: [{ translateY: slideAnim }] }] }>
                <View style={styles.titleContentContainer}>
                    <GradientText style={styles.gradientText} gradientColors={['#8B5CF6', '#EC4899', '#3B82F6']} >{title}</GradientText>
                    {subtitle && (
                        <LinearGradient
                            colors={['#8b5cf6', '#ec4899']}
                            start={{ x: 0, y: 0 }}
                            end={{ x: 1, y: 0 }}
                            style={styles.betaTextContainer}
                        >
                            <Text style={styles.betaText}>{subtitle}</Text>
                        </LinearGradient>
                    )}
                </View>
            </Animated.View>
            <View style={styles.spacer} />
        </View>
    )
}

const styles = StyleSheet.create({
    container: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: 16,
        backgroundColor: 'white',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.1,
        shadowRadius: 2,
        elevation: 2,
        zIndex: 10,
    },
    spacer: {
        width: 40, // Equivalent to w-10
    },
    animatedTitleContainer: {
        flex: 1,
        alignItems: 'center', // Center content horizontally
        justifyContent: 'center', // Center content vertically
    },
    titleContentContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 8, // Equivalent to gap-2
    },
    gradientText: {
        fontSize: responsiveFontSize(20),
        fontFamily: 'default-semibold',
        lineHeight: responsiveFontSize(28),
    },
    betaTextContainer: {
        borderRadius: 9999,
        paddingHorizontal: responsiveFontSize(8),
        paddingVertical: responsiveFontSize(2),
    },
    betaText: {
        fontSize: responsiveFontSize(12),
        fontFamily: 'default-bold',
        color: 'white',
        lineHeight: responsiveFontSize(16),
    },
});

export default SimpleHeader;

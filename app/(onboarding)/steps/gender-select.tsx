import { ThemedText } from '@/components/ThemedText'
import theme from '@/styles/theme'
import { saveDetails, withHaptick } from '@/utils'
import React, { useEffect } from 'react'
import { Pressable, StyleSheet, View, Dimensions, Animated } from 'react-native'
import { useOnBoarding } from '../context'
import { User, UserRound } from 'lucide-react-native'
import { LinearGradient } from 'expo-linear-gradient'
import * as Haptics from 'expo-haptics'

const { width } = Dimensions.get('window');

const GenderSelect = ({ goToNextStep }: { goToNextStep: () => void }) => {
    const { payload, dispatch } = useOnBoarding()
    
    // Animation values
    const maleScale = React.useRef(new Animated.Value(1)).current;
    const femaleScale = React.useRef(new Animated.Value(1)).current;
    
    // Set initial animations based on current selection
    useEffect(() => {
        if (payload?.gender === "male") {
            Animated.spring(maleScale, {
                toValue: 1.05,
                friction: 8,
                tension: 40,
                useNativeDriver: true
            }).start();
            femaleScale.setValue(1);
        } else if (payload?.gender === "female") {
            Animated.spring(femaleScale, {
                toValue: 1.05,
                friction: 8,
                tension: 40,
                useNativeDriver: true
            }).start();
            maleScale.setValue(1);
        }
    }, [payload?.gender]);

    const getStyles = (key: string) => {
        if (payload?.gender === key) {
            return {
                bg: theme.colors.primary.purple,
                icon: theme.colors.primary.white,
                text: theme.colors.primary.white,
                borderColor: theme.colors.primary.purple,
                shadowColor: theme.colors.primary.purple,
            }
        }
        return {
            bg: theme.colors.primary.white,
            icon: theme.colors.secondary.black,
            text: 'rgba(75,85,99,1)',
            borderColor: 'rgba(229, 231, 235, 1)',
            shadowColor: 'rgba(0, 0, 0, 0.1)',
        }
    }
    
    const [mStyles, fStyles] = [getStyles("male"), getStyles("female")]
    
    const handleSelect = async (value: string) => {
        // Animate the selected card
        if (value === "male") {
            Animated.spring(maleScale, {
                toValue: 1.05,
                friction: 8,
                tension: 40,
                useNativeDriver: true
            }).start();
            Animated.spring(femaleScale, {
                toValue: 1,
                friction: 8,
                tension: 40,
                useNativeDriver: true
            }).start();
        } else {
            Animated.spring(femaleScale, {
                toValue: 1.05,
                friction: 8,
                tension: 40,
                useNativeDriver: true
            }).start();
            Animated.spring(maleScale, {
                toValue: 1,
                friction: 8,
                tension: 40,
                useNativeDriver: true
            }).start();
        }
        
        // Add medium haptic feedback
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
        
        dispatch({
            type: "SET_PAYLOAD",
            payload: { key: "gender", value }
        });
        
        await saveDetails("gender", value);
        
        // Short delay before proceeding to allow animation to be seen
        setTimeout(() => {
            goToNextStep();
        }, 150);
    }
    
    return (
        <View style={styles.flexContainer}>
            <Animated.View style={{ transform: [{ scale: maleScale }] }}>
                <Pressable 
                    onPress={() => {
                        withHaptick(handleSelect)("male")
                    }} 
                    style={[
                        styles.cardContainer, 
                        { 
                            backgroundColor: mStyles.bg,
                            borderColor: mStyles.borderColor,
                            shadowColor: mStyles.shadowColor,
                        }
                    ]}
                >
                    {payload?.gender === "male" && (
                        <LinearGradient
                            colors={['rgba(139, 92, 246, 0.1)', 'rgba(139, 92, 246, 0.05)']}
                            style={styles.selectedGlow}
                        />
                    )}
                    <View style={styles.iconContainer}>
                        <User color={mStyles.icon} size={32} />
                    </View>
                    <ThemedText 
                        type='default' 
                        style={[{
                            color: mStyles.text, 
                            fontSize: 18, 
                            lineHeight: 24, 
                            fontWeight: 600,
                            fontFamily: 'Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, Segoe UI, Roboto, Helvetica Neue, Arial, Noto Sans, sans-serif, Apple Color Emoji, Segoe UI Emoji, Segoe UI Symbol, Noto Color Emoji;',
                        }]} 
                    >
                        Male
                    </ThemedText>
                </Pressable>
            </Animated.View>
            
            <Animated.View style={{ transform: [{ scale: femaleScale }] }}>
                <Pressable 
                    onPress={() => withHaptick(handleSelect)("female")} 
                    style={[
                        styles.cardContainer, 
                        { 
                            backgroundColor: fStyles.bg,
                            borderColor: fStyles.borderColor,
                            shadowColor: fStyles.shadowColor,
                        }
                    ]}
                >
                    {payload?.gender === "female" && (
                        <LinearGradient
                            colors={['rgba(139, 92, 246, 0.1)', 'rgba(139, 92, 246, 0.05)']}
                            style={styles.selectedGlow}
                        />
                    )}
                    <View style={styles.iconContainer}>
                        <UserRound color={fStyles.icon} size={32} />
                    </View>
                    <ThemedText 
                        type='default' 
                        style={[{
                            color: fStyles.text, 
                            fontSize: 18, 
                            fontWeight: 600,
                            lineHeight: 24, 
                            fontFamily: 'Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, Segoe UI, Roboto, Helvetica Neue, Arial, Noto Sans, sans-serif, Apple Color Emoji, Segoe UI Emoji, Segoe UI Symbol, Noto Color Emoji;',
                        }]} 
                    >
                        Female
                    </ThemedText>
                </Pressable>
            </Animated.View>
        </View>
    )
}

const styles = StyleSheet.create({
    flexContainer: {
        display: "flex",
        flexDirection: "row",
        justifyContent: "center",
        gap: 20,
        padding: 16,
        width: '100%',
        marginTop: 20,
    },
    cardContainer: {
        padding: 20,
        justifyContent: "center",
        alignItems: "center",
        borderRadius: 16,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.2,
        shadowRadius: 8,
        elevation: 4,
        width: width * 0.28,
        height: width * 0.28,
        borderWidth: 1,
        overflow: 'hidden',
        position: 'relative',
    },
    iconContainer: {
        marginBottom: 12,
        width: 48,
        height: 48,
        borderRadius: 24,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: 'rgba(255, 255, 255, 0.2)',
    },
    selectedGlow: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        borderRadius: 16,
    }
});

export default GenderSelect

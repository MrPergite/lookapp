import React, { useRef } from 'react';
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    ImageBackground,
    ScrollView,
    SafeAreaView,
    Animated,
} from 'react-native';
import { useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { User, Sparkles, Shirt, Heart } from 'lucide-react-native';
import theme from '@/styles/theme';
import { GradientHeading } from '.';
import { color } from 'react-native-tailwindcss';
import { responsiveFontSize } from '@/utils';
import * as Haptics from 'expo-haptics';


interface PreLoginScreenProps {
    onCreateAccount?: () => void;
    onSignIn?: () => void;
}

const PreLoginScreen: React.FC<PreLoginScreenProps> = ({
    onCreateAccount,
    onSignIn,
}) => {
    const router = useRouter();
    
    // Animation values for button press effects
    const createAccountScale = useRef(new Animated.Value(1)).current;
    const signInScale = useRef(new Animated.Value(1)).current;

    const animateButtonPress = (buttonScale: Animated.Value, isDown: boolean) => {
        Animated.spring(buttonScale, {
            toValue: isDown ? 0.96 : 1,
            friction: 7,
            tension: 40,
            useNativeDriver: true
        }).start();
    };

    const handleCreateAccount = () => {
        // Add medium impact haptic feedback for primary action
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
        
        if (onCreateAccount) {
            onCreateAccount();
        } else {
            router.push('/(authn)/signup');
        }
    };

    const handleSignIn = () => {
        // Add light impact haptic feedback for secondary action
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        
        if (onSignIn) {
            onSignIn();
        } else {
            router.push('/(authn)/signin');
        }
    };
    
    // Function to handle feature item press with haptic feedback
    const handleFeaturePress = (featureType: string) => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        // You could add more functionality here in the future
        // such as showing a tooltip or more information about the feature
        console.log(`Feature pressed: ${featureType}`);
    };

    return (
        <LinearGradient
            colors={['#ffffff', '#f5f3ff', '#f0f9ff']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={{ flex: 1 }}
        >
            <SafeAreaView style={{ flex: 1 }}>
                <ScrollView keyboardShouldPersistTaps="handled" contentContainerStyle={styles.container}>
                    {/* Profile Icon with glow effect */}
                    <View style={styles.profileIconContainer}>
                        <View style={styles.iconGlow} />
                        <LinearGradient 
                            colors={['#f3e8ff', '#fce7f3']} 
                            style={styles.profileIconInner}
                            start={{ x: 0.1, y: 0.1 }}
                            end={{ x: 0.9, y: 0.9 }}
                        >
                            <User size={32} color={theme.colors.primary.purple} />
                        </LinearGradient>
                    </View>

                    {/* Heading */}
                    <GradientHeading text="Create Your Fashion Profile" />
                    
                    {/* Description */}
                    <Text style={styles.description}>
                        Create a Look AI account to unlock a personalized fashion experience tailored just for you
                    </Text>

                    {/* Features */}
                    <LinearGradient 
                        colors={['rgba(255, 255, 255, 0.9)', 'rgba(245, 243, 255, 0.9)']} 
                        style={styles.featuresContainer}
                    >
                        <TouchableOpacity 
                            style={styles.featureItem}
                            activeOpacity={0.7}
                            onPress={() => handleFeaturePress('personalized')}
                        >
                            <LinearGradient 
                                colors={['#f3e8ff', '#ede9fe']} 
                                style={styles.featureIconContainer}
                                start={{ x: 0.1, y: 0.1 }}
                                end={{ x: 0.9, y: 0.9 }}
                            >
                                <Sparkles size={24} color={theme.colors.primary.purple} />
                            </LinearGradient>
                            <View style={styles.featureTextContainer}>
                                <Text style={styles.featureTitle}>Personalized Results</Text>
                                <Text style={styles.featureDescription}>
                                    Get fashion recommendations tailored to your style
                                </Text>
                            </View>
                        </TouchableOpacity>

                        <LinearGradient
                            colors={['rgba(139, 92, 246, 0.05)', 'rgba(139, 92, 246, 0.15)', 'rgba(139, 92, 246, 0.05)']}
                            start={{ x: 0, y: 0 }}
                            end={{ x: 1, y: 0 }}
                            style={styles.divider}
                        />

                        <TouchableOpacity 
                            style={styles.featureItem}
                            activeOpacity={0.7}
                            onPress={() => handleFeaturePress('favorites')}
                        >
                            <LinearGradient 
                                colors={['#fce7f3', '#fbcfe8']} 
                                style={styles.featureIconContainer}
                                start={{ x: 0.1, y: 0.1 }}
                                end={{ x: 0.9, y: 0.9 }}
                            >
                                <Heart size={24} color={"rgba(219 39 119 / 1)"} />
                            </LinearGradient>
                            <View style={styles.featureTextContainer}>
                                <Text style={styles.featureTitle}>Save Favorite Items</Text>
                                <Text style={styles.featureDescription}>
                                    Build your collection by saving items you love
                                </Text>
                            </View>
                        </TouchableOpacity>

                        <LinearGradient
                            colors={['rgba(139, 92, 246, 0.05)', 'rgba(139, 92, 246, 0.15)', 'rgba(139, 92, 246, 0.05)']}
                            start={{ x: 0, y: 0 }}
                            end={{ x: 1, y: 0 }}
                            style={styles.divider}
                        />

                        <TouchableOpacity 
                            style={styles.featureItem}
                            activeOpacity={0.7}
                            onPress={() => handleFeaturePress('virtual-tryon')}
                        >
                            <LinearGradient 
                                colors={['#f3e8ff', '#f0f9ff']} 
                                style={styles.featureIconContainer}
                                start={{ x: 0.1, y: 0.1 }}
                                end={{ x: 0.9, y: 0.9 }}
                            >
                                <User size={24} color={theme.colors.primary.purple} />
                            </LinearGradient>
                            <View style={styles.featureTextContainer}>
                                <Text style={styles.featureTitle}>Virtual Try-On</Text>
                                <Text style={styles.featureDescription}>
                                    Visualize outfits on an avatar before you buy
                                </Text>
                            </View>
                        </TouchableOpacity>
                    </LinearGradient>

                    {/* Buttons */}
                    <Animated.View 
                        style={{ 
                            width: '100%', 
                            transform: [{ scale: createAccountScale }] 
                        }}
                    >
                        <TouchableOpacity
                            style={styles.createAccountButton}
                            onPress={handleCreateAccount}
                            onPressIn={() => animateButtonPress(createAccountScale, true)}
                            onPressOut={() => animateButtonPress(createAccountScale, false)}
                            activeOpacity={0.9}
                        >
                            <LinearGradient
                                colors={['#8B5CF6', '#EC4899', '#3B82F6']}
                                start={{ x: 0, y: 0 }}
                                end={{ x: 1, y: 0 }}
                                style={styles.gradient}
                            >
                                <Text style={styles.createAccountButtonText}>
                                    Create Free Account
                                </Text>
                            </LinearGradient>
                        </TouchableOpacity>
                    </Animated.View>

                    <Animated.View 
                        style={{ 
                            width: '100%', 
                            transform: [{ scale: signInScale }] 
                        }}
                    >
                        <TouchableOpacity 
                            style={styles.signInButton} 
                            onPress={handleSignIn}
                            onPressIn={() => animateButtonPress(signInScale, true)}
                            onPressOut={() => animateButtonPress(signInScale, false)}
                            activeOpacity={0.9}
                        >
                            <Text style={styles.signInButtonText}>Sign In</Text>
                        </TouchableOpacity>
                    </Animated.View>
                </ScrollView>
            </SafeAreaView>
        </LinearGradient>
    );
};

const styles = StyleSheet.create({
    container: {
        flexGrow: 1,
        paddingHorizontal: 24,
        paddingBottom: 40,
        paddingTop: 20,
        alignItems: 'center'
    },
    profileIconContainer: {
        width: 80,
        height: 80,
        borderRadius: 40,
        backgroundColor: 'rgba(255, 255, 255, 0.8)',
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 24,
        marginTop: 10,
        shadowColor: '#9333EA',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.15,
        shadowRadius: 12,
        elevation: 8,
        borderWidth: 1,
        borderColor: '#E9D5FF',
    },
    profileIconInner: {
        width: 64,
        height: 64,
        borderRadius: 32,
        justifyContent: 'center',
        alignItems: 'center',
    },
    description: {
        fontFamily: 'default-medium',
        marginBottom: 32,
        lineHeight: 24,
        textAlign: 'center',
        fontSize: responsiveFontSize(16),
        maxWidth: 320,
        alignSelf: 'center',
        color: 'rgba(75, 85, 99, 1)',
    },
    featuresContainer: {
        width: "100%",
        borderRadius: 20,
        padding: 24,
        marginBottom: 32,
        shadowColor: '#8B5CF6',
        shadowOffset: { width: 0, height: 6 },
        shadowOpacity: 0.1,
        shadowRadius: 12,
        elevation: 4,
        borderWidth: 1,
        borderColor: 'rgba(139, 92, 246, 0.15)',
    },
    featureItem: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 16,
    },
    divider: {
        height: 1,
        width: '100%',
    },
    featureIconContainer: {
        width: 56,
        height: 56,
        borderRadius: 28,
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 16,
        shadowColor: '#8B5CF6',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 2,
    },
    featureTextContainer: {
        flex: 1,
    },
    featureTitle: {
        fontSize: responsiveFontSize(16),
        fontFamily: 'default-semibold',
        color: '#1F2937',
        marginBottom: 4,
    },
    featureDescription: {
        fontSize: responsiveFontSize(14),
        fontFamily: 'default-regular',
        color: 'rgba(75, 85, 99, 1)',
    },
    createAccountButton: {
        width: '100%',
        height: 56,
        borderRadius: 16,
        overflow: 'hidden',
        marginBottom: 16,
        shadowColor: '#8B5CF6',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 10,
        elevation: 6,
        borderWidth: 1,
        borderColor: 'rgba(255, 255, 255, 0.2)',
    },
    gradient: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    createAccountButtonText: {
        fontSize: responsiveFontSize(16),
        fontFamily: 'default-semibold',
        color: '#FFFFFF',
        letterSpacing: 0.5,
    },
    signInButton: {
        width: '100%',
        height: 56,
        borderRadius: 16,
        borderWidth: 1,
        borderColor: 'rgba(139, 92, 246, 0.3)',
        backgroundColor: 'rgba(255, 255, 255, 0.8)',
        justifyContent: 'center',
        alignItems: 'center',
        shadowColor: '#8B5CF6',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 6,
        elevation: 3,
    },
    signInButtonText: {
        fontSize: responsiveFontSize(16),
        fontFamily: 'default-semibold',
        color: theme.colors.primary.purple,
    },
    iconGlow: {
        position: 'absolute',
        width: 100,
        height: 100,
        borderRadius: 50,
        backgroundColor: 'transparent',
        shadowColor: theme.colors.primary.purple,
        shadowOffset: { width: 0, height: 0 },
        shadowOpacity: 0.5,
        shadowRadius: 15,
        elevation: 10,
    },
});

export default PreLoginScreen; 
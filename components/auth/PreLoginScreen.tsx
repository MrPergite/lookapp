import React from 'react';
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    ImageBackground,
    ScrollView,
    SafeAreaView,
} from 'react-native';
import { useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { User, Sparkles, Shirt, Heart } from 'lucide-react-native';
import theme from '@/styles/theme';
import { GradientHeading } from '.';
import { color } from 'react-native-tailwindcss';
import { responsiveFontSize } from '@/utils';


interface PreLoginScreenProps {
    onCreateAccount?: () => void;
    onSignIn?: () => void;
}

const PreLoginScreen: React.FC<PreLoginScreenProps> = ({
    onCreateAccount,
    onSignIn,
}) => {
    const router = useRouter();

    const handleCreateAccount = () => {
        if (onCreateAccount) {
            onCreateAccount();
        } else {
            router.push('/(authn)/signup');
        }
    };

    const handleSignIn = () => {
        if (onSignIn) {
            onSignIn();
        } else {
            router.push('/(authn)/signin');
        }
    };

    return (
        <SafeAreaView style={{ flex: 1 }}>
            <ScrollView keyboardShouldPersistTaps="handled" contentContainerStyle={styles.container}>
                {/* Profile Icon */}
                <LinearGradient colors={['#f3e8ff', '#fce7f3']} style={styles.profileIconInner}>
                    <User size={24} color={theme.colors.primary.purple} />
                </LinearGradient>

                {/* Heading */}
                <GradientHeading additionalStyles={styles.heading} text="Create Your Fashion Profile" />
                {/* <Text style={styles.heading}>Create Your Fashion Profile</Text> */}

                {/* Description */}
                <Text style={styles.description}>
                    Create a Look AI account to unlock a personalized fashion experience tailored just for you
                </Text>

                {/* Features */}
                <View style={styles.featuresContainer}>
                    <View style={styles.featureItem}>
                        <View style={styles.featureIconContainer}>
                            <Sparkles size={20} color={theme.colors.primary.purple} />
                        </View>
                        <View style={styles.featureTextContainer}>
                            <Text style={styles.featureTitle}>Personalized Results</Text>
                            <Text style={styles.featureDescription}>
                                Get fashion recommendations tailored to your style
                            </Text>
                        </View>
                    </View>

                    <View style={styles.featureItem}>
                        <View style={[styles.featureIconContainer, { backgroundColor: 'rgba(252 231 243 / 1)' }]}>
                            <TouchableOpacity style={styles.heartIconContainer}>
                                <Heart size={20} color={"rgba(219 39 119 / 1)"} />
                            </TouchableOpacity>
                        </View>
                        <View style={styles.featureTextContainer}>
                            <Text style={styles.featureTitle}>Save Favorite Items</Text>
                            <Text style={styles.featureDescription}>
                                Build your collection by saving items you love
                            </Text>
                        </View>
                    </View>

                    <View style={styles.featureItem}>
                        <View style={styles.featureIconContainer}>
                            <User size={20} color={theme.colors.primary.purple} />
                        </View>
                        <View style={styles.featureTextContainer}>
                            <Text style={styles.featureTitle}>Virtual Try-On</Text>
                            <Text style={styles.featureDescription}>
                                Visualize outfits on an avatar before you buy
                            </Text>
                        </View>
                    </View>
                </View>

                {/* Buttons */}
                <TouchableOpacity
                    style={styles.createAccountButton}
                    onPress={handleCreateAccount}
                >
                    <LinearGradient
                        colors={['#9333EA', '#E11D48']}
                        start={{ x: 0, y: 0 }}
                        end={{ x: 1, y: 0 }}
                        style={styles.gradient}
                    >
                        <Text style={styles.createAccountButtonText}>
                            Create Free Account
                        </Text>
                    </LinearGradient>
                </TouchableOpacity>

                <TouchableOpacity style={styles.signInButton} onPress={handleSignIn}>
                    <Text style={styles.signInButtonText}>Sign In</Text>
                </TouchableOpacity>
            </ScrollView>
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        paddingHorizontal: 24,
        paddingBottom: 40,
        alignItems: 'center'
    },
    profileIconContainer: {
        width: 72,
        height: 72,
        borderRadius: 36,
        backgroundColor: 'rgba(147, 51, 234, 0.1)',
        justifyContent: 'center',
        alignItems: 'center',
        padding: 16,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.1,
        shadowRadius: 3,
        elevation: 2,
        borderWidth: 1,
        borderColor: '#E9D5FF',
    },
    profileIconInner: {
        width: 48,
        height: 48,
        borderRadius: 24,
        backgroundColor: 'rgba(147, 51, 234, 0.15)',
        justifyContent: 'center',
        alignItems: 'center',
        marginTop: 4,
    },
    heading: {
        fontSize: responsiveFontSize(20),
        fontFamily: 'default-bold',
        color: '#9333EA',
        textAlign: 'center',
        marginBottom: 16,
        marginTop: 10,
    },
    description: {
        fontFamily: 'default-regular',
        marginBottom: 20,
        lineHeight: 24,
        textAlign: 'center',
        fontSize: responsiveFontSize(14),
        maxWidth: 320,    // max-w-xs = 20rem
        alignSelf: 'center',
        color: 'rgba(75 85 99 / 1)',
    },
    featuresContainer: {
        width: "100%",
        backgroundColor: '#FFFFFF',
        borderRadius: 16,
        padding: responsiveFontSize(16),
        marginBottom: 20,
        gap: responsiveFontSize(14),
    },
    featureItem: {
        flexDirection: 'row',
        marginBottom: 0,
    },
    featureIconContainer: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: '#F3E8FF',
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 16
    },
    heartIconContainer: {
        width: 24,
        height: 24,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: 'rgba(252 231 243 / 1)',
    },
    heartIcon: {
        fontSize: 18,
        color: theme.colors.primary.purple,
        textAlign: 'center',
        lineHeight: 20,
    },
    featureTextContainer: {
        flex: 1,
    },
    featureTitle: {
        fontSize: responsiveFontSize(14),
        fontFamily: 'default-medium',
        color: color.gray900,
    },
    featureDescription: {
        fontSize: responsiveFontSize(12),
        fontFamily: 'default-regular',
        color: 'rgba(75 85 99 / 1)',
    },
    createAccountButton: {
        width: '100%',
        height: 40,
        borderRadius: 12,
        overflow: 'hidden',
        marginBottom: 12,
        boxShadow: '0 0 0 1px rgba(0, 0, 0, 0.05)'
    },
    gradient: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    createAccountButtonText: {
        fontSize: responsiveFontSize(14),
        fontFamily: 'default-semibold',
        color: '#FFFFFF',
    },
    signInButton: {
        width: '100%',
        height: 40,
        borderRadius: 12,
        borderWidth: 1,
        borderColor: '#E5E7EB',
        backgroundColor: '#FFFFFF',
        justifyContent: 'center',
        alignItems: 'center',
        boxShadow: '0 0 0 1px rgba(0, 0, 0, 0.05)'
    },
    signInButtonText: {
        fontSize: responsiveFontSize(14),
        fontFamily: 'default-semibold',
        color: theme.colors.primary.purple,
    },
});

export default PreLoginScreen; 
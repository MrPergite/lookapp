import React from 'react';
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    ImageBackground,
} from 'react-native';
import { useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { LogOut, Globe, Star, UserPlus, LucideUserPlus } from 'lucide-react-native';
import theme from '@/styles/theme';
import GradientText from '../GradientText';
import { useAuth } from '@clerk/clerk-expo';
import { GradientHeading } from '.';
import { responsiveFontSize } from '@/utils';
interface PostLoginScreenProps {
    userName: string;
    onRestartOnboarding?: () => void;
    onSignOut?: () => void;
    onInviteFriends?: () => void;
}

const PostLoginScreen: React.FC<PostLoginScreenProps> = ({
    userName = '',
    onRestartOnboarding,
    onSignOut,
    onInviteFriends,
}) => {
    const router = useRouter();
    const { signOut } = useAuth();

    const handleRestartOnboarding = () => {
        router.push('/(onboarding)');
    };

    const handleSignOut = async () => {
        await signOut();
        router.replace('/(tabs)');
    };

    const handleInviteFriends = () => {
        if (onInviteFriends) {
            onInviteFriends();
        } else {
            // Default action
            console.log('Invite friends');
        }
    };

    return (
        <View
            style={styles.container}>

            <GradientText style={styles.userName} gradientColors={['#8B5CF6', '#EC4899', '#3B82F6']}>{userName}</GradientText>

            {/* LookPass Card */}
            <View


                style={[styles.lookPassCard, { borderWidth: 1, borderColor: "#E9D5FF" }]}
            >
                
                    <View style={styles.lookPassContent}>
                        {/* Globe Icon */}
                        <View style={styles.globeContainer}>
                            <LinearGradient
                                colors={['rgba(147, 51, 234, 0.2)', 'rgba(147, 51, 234, 0.05)']}
                                style={styles.globeGradient}
                            >
                                <Globe size={100} color={theme.colors.primary.purple} strokeWidth={0.8} />
                            </LinearGradient>
                        </View>
                        <GradientHeading additionalStyles={{ fontSize: responsiveFontSize(20) }} text="LookPass" />
                        <Text style={styles.lookPassSubtitle}>Your personal fashion pass</Text>

                        {/* LookPass Description */}
                        <Text style={styles.lookPassDescription}>
                            Your LookPass contains everything Look AI has learned about your shopping preferences to personalize your experience.
                        </Text>
                    </View>
            
            </View>

            {/* Buttons */}
            <View style={styles.buttonsContainer}>
                <View style={styles.buttonRow}>
                    <TouchableOpacity
                        style={styles.actionButton}
                        onPress={handleRestartOnboarding}
                    >
                        <Text style={styles.actionButtonText}>Restart Onboarding</Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                        style={[styles.actionButton, styles.inviteButton]}
                        onPress={handleInviteFriends}
                        disabled={true}
                    >
                        <LinearGradient
                            colors={['#9333ea', '#ec4899']} // purple-600 → pink-600
                            start={{ x: 0, y: 0 }}
                            end={{ x: 1, y: 0 }}
                            style={styles.comingSoonBadge}>
                            <Text style={styles.comingSoonText}>Coming Soon</Text>
                        </LinearGradient>
                        <View style={[styles.inviteButtonContent, { opacity: 0.6 }]}>
                            <LucideUserPlus size={16} color="#9333EA" />
                            <Text style={styles.inviteButtonText}>Invite Friends</Text>
                        </View>
                    </TouchableOpacity>
                </View>

                <TouchableOpacity
                    style={styles.signOutButton}
                    onPress={handleSignOut}
                >
                    <LogOut size={18} color="#E11D48" />
                    <Text style={styles.signOutText}>Sign Out</Text>
                </TouchableOpacity>
            </View>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        paddingHorizontal: 24,
        paddingTop: 10,
        paddingBottom: 40,
        alignItems: 'center',
        height: '100%',
        backgroundColor: theme.colors.primary.white
    },
    userName: {
        fontSize: responsiveFontSize(20),
        fontFamily: 'default-bold',
        color: '#9333EA',
        textAlign: 'center',
        marginBottom: 24,
    },
    lookPassCard: {
        width: '100%',
        borderRadius: 16,
        padding: 20,
        marginBottom: 24,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 8,
        elevation: 3,
        borderWidth: 1.1,
        borderColor: "#E9D5FF",
    },
    lookPassContent: {
        alignItems: 'center',
        paddingVertical: 20,
    },
    globeContainer: {
        width: 200,
        height: 200,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 16,
    },
    globeGradient: {
        width: '100%',
        height: '100%',
        borderRadius: 100,
        justifyContent: 'center',
        alignItems: 'center',
    },
    lookPassSubtitle: {
        fontSize: responsiveFontSize(12),
        fontFamily: 'default-semibold',
        color: '#9333EA',
        marginBottom: 16,
        fontWeight: 500,
    },
    lookPassDescription: {
        fontSize: responsiveFontSize(12),
        fontFamily: 'default-regular',
        textAlign: 'center',
        lineHeight: 20,
        paddingHorizontal: 10,
        color: 'rgba(75 85 99 / 1)',
        width: "95%",
        fontWeight: 600,
    },
    buttonsContainer: {
        width: '100%',
    },
    buttonRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: 16,
    },
    actionButton: {
        flex: 1,
        height: 48,
        borderRadius: 12,
        borderWidth: 1,
        borderColor: '#E5E7EB',
        backgroundColor: '#FFFFFF',
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 8,
    },
    inviteButton: {
        marginRight: 0,
        marginLeft: 8,
        position: 'relative',
    },
    actionButtonText: {
        fontSize: responsiveFontSize(14),
        fontFamily: 'default-semibold',
        color: '#4B5563',
    },
    inviteButtonContent: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    inviteButtonText: {
        fontSize: responsiveFontSize(12),
        fontFamily: 'default-semibold',
        color: '#9333EA',
        marginLeft: 6,
    },
    comingSoonBadge: {
        position: 'absolute',
        top: -12,
        left: 0,
        backgroundColor: '#9333EA',
        borderRadius: 12,
        paddingHorizontal: 8,
        paddingVertical: 4,
    },
    comingSoonText: {
        fontSize: 10,
        fontFamily: 'default-semibold',
        color: '#FFFFFF',
    },
    signOutButton: {
        width: '100%',
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
        marginTop: 8,
        paddingVertical: 12,
    },
    signOutText: {
        fontSize: responsiveFontSize(14),
        fontFamily: 'default-medium',
        color: '#E11D48',
        marginLeft: 8,
    },
});

export default PostLoginScreen; 
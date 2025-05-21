import React, { useEffect, useState, useRef } from 'react';
import { View, Text, StyleSheet, FlatList, ActivityIndicator, TouchableOpacity, Dimensions, Animated, Easing } from 'react-native';
import { Image } from 'expo-image';
import { useUser } from '@clerk/clerk-expo';
import { useOnBoarding } from '../context';
import theme from '@/styles/theme';
import { ThemedText } from '@/components/ThemedText';
import { Check, Loader } from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient';

interface DisplayCustomAvatarsProps {
    onBack: () => void;
    onNext: () => void; // onNext might not be strictly needed if parent handles it via context update
}

const DisplayCustomAvatars: React.FC<DisplayCustomAvatarsProps> = ({ onBack, onNext }) => {
    const { user, isLoaded: isUserClerkLoaded } = useUser();
    const { dispatch, payload } = useOnBoarding();

    const customAvatars = user?.publicMetadata?.custom_avatar_urls as string[] || [];
    const avatarStatus =user?.publicMetadata?.avatar_creation_status as string || 'pending';

    const [selectedAvatarUrl, setSelectedAvatarUrl] = useState<string | null>(() => {
        if (payload.styleProfileState?.usingExisting && payload.styleProfileState.images?.length > 0) {
            return payload.styleProfileState.images[0];
        }
        return null;
    });

    // For testing the animation if context value is initially null
    const [mockStartTime] = useState(() => Date.now()); 
    const _avatarGenerationStartTime = payload.styleProfileState?.avatarGenerationStartTime || mockStartTime; 
    const _isProcessingNewAvatar = avatarStatus && avatarStatus !== 'ready' && payload.avatarPath === 'custom'
    // State for progress bar
    const [avatarCreationProgress, setAvatarCreationProgress] = useState(0);
    const animatedProgressWidth = useRef(new Animated.Value(0)).current;

    useEffect(() => {
        let progressInterval: NodeJS.Timeout | undefined = undefined;
        if (_isProcessingNewAvatar && typeof _avatarGenerationStartTime === 'number') {
            const calculateProgress = () => {
                const now = Date.now();
                const startTime = _avatarGenerationStartTime as number;
                const elapsedTime = now - startTime;
                const progress = Math.min((elapsedTime / (5 * 60 * 1000)) * 100, 100);                
                setAvatarCreationProgress(progress);
                if (progress >= 100) {
                    if (progressInterval) {
                        console.log('[ProgressCalc] Progress >= 100, clearing interval.');
                        clearInterval(progressInterval);
                    }
                }
            };
            calculateProgress();
            progressInterval = setInterval(calculateProgress, 1000);
        } else {
            setAvatarCreationProgress(0);
        }
        return () => {
            if (progressInterval) clearInterval(progressInterval);
        };
    }, [_isProcessingNewAvatar, _avatarGenerationStartTime]);

    useEffect(() => {
        Animated.timing(animatedProgressWidth, {
            toValue: avatarCreationProgress,
            duration: 300,
            useNativeDriver: false,
        }).start();
    }, [avatarCreationProgress, animatedProgressWidth]);

    useEffect(() => {
        if (!_isProcessingNewAvatar && customAvatars.length > 0) {
            if (selectedAvatarUrl) {
                dispatch({
                    type: 'SET_PAYLOAD',
                    payload: {
                        key: 'styleProfileState',
                        value: {
                            images: [selectedAvatarUrl], // We are only proceeding with one selected avatar
                            processingStatus: { 0: 'approved' },
                            rejectionReasons: {},
                            progressValue: 100,
                            avatarStatus: 'ready',
                            avatarGenerationStartTime: null,
                            isProcessing: false,
                            usingExisting: true
                        }
                    }
                });
            } else {
                // If no avatar is selected, mark the step as incomplete
                dispatch({
                    type: 'SET_PAYLOAD',
                    payload: { key: 'styleProfileState', value: null }
                });
            }
        }
    }, [dispatch, customAvatars, selectedAvatarUrl, _isProcessingNewAvatar]);

    const handleAvatarSelect = (avatarUrl: string) => {
        if (_isProcessingNewAvatar) return; // Don't allow selection if a new one is processing
        setSelectedAvatarUrl(avatarUrl);
    };

    const rotateAnim = useRef(new Animated.Value(0)).current;

    useEffect(() => {
        Animated.loop(
            Animated.timing(rotateAnim, {
                toValue: 1,
                duration: 1000,
                easing: Easing.linear,
                useNativeDriver: true,
            })
        ).start();
    }, []);

    const spin = rotateAnim.interpolate({
        inputRange: [0, 1],
        outputRange: ['0deg', '360deg'],
    });
    // Calculate item size for a 2-column grid
    const screenWidth = Dimensions.get('window').width;
    const containerPadding = theme.spacing.lg || 20;
    const itemMargin = theme.spacing.sm || 8; // For gap between items
    const numColumns = 2;
    // Total horizontal space taken by margins/gaps for numColumns
    const totalHorizontalSpacing = containerPadding * 2 + itemMargin * (numColumns - 1);
    const imageWidth = (screenWidth - totalHorizontalSpacing) / numColumns;
    const imageHeight = imageWidth * (4 / 3); // Aspect ratio 3:4 (height is 4/3 of width)

    if (_isProcessingNewAvatar) {
        return (
            <View style={styles.processingCardContainer}>
                <LinearGradient
                     colors={['#8B5CF6', '#EC4899', '#3B82F6']}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 0 }}
                    style={styles.creatingCard}
                >
                    <View style={styles.creatingRow}>
                        <Animated.View style={{ transform: [{ rotate: spin }] }}>
                            <Loader size={24} color="#d946ef" />
                        </Animated.View>
                        <Text style={styles.creatingText}>Creating your avatar in the background</Text>
                    </View>
                    <View style={styles.creatingProgressBarTrack}>
                        <Animated.View
                            style={[
                                styles.creatingProgressBarFill,
                                {
                                    width: animatedProgressWidth.interpolate({
                                        inputRange: [0, 100],
                                        outputRange: ['0%', '100%']
                                    })
                                }
                            ]}
                        />
                    </View>
             
                </LinearGradient>
            </View>
        );
    }

    if (!isUserClerkLoaded) {
        return (
            <View style={styles.centeredContent}>
                <ActivityIndicator size="large" color={theme.colors.primary.purple} />
                <ThemedText>Loading your information...</ThemedText>
            </View>
        );
    }

    //   if (customAvatars.length === 0) {
    //     return (
    //       <View style={styles.centeredContent}>
    //         <ThemedText style={styles.infoText}>No custom avatars found.</ThemedText>
    //         <ThemedText style={styles.infoTextNote}>
    //             It seems you chose to use a custom avatar, but none were found. 
    //             Please go back to create one, or choose a pre-made avatar.
    //         </ThemedText>
    //         {/* Optionally add a button to trigger onBack here */}
    //       </View>
    //     );
    //   }

    return (
        <View style={{ flex: 1, width: '100%' }}>
            <FlatList
                ListHeaderComponent={<>
                    {/* <ThemedText style={styles.headerText}>Your Existing Custom Avatars</ThemedText> */}
                    <ThemedText style={styles.subHeaderText}>
                        Select the avatar that best represents you
                    </ThemedText>
                </>}
                data={customAvatars}
                renderItem={({ item }) => (
                    <TouchableOpacity
                        style={[
                            styles.avatarItemContainer,
                            { width: imageWidth, height: imageHeight, marginHorizontal: itemMargin / 2 },
                            selectedAvatarUrl === item && styles.selectedAvatarItem
                        ]}
                        onPress={() => handleAvatarSelect(item)}
                        activeOpacity={0.8}
                    >
                        <Image
                            source={{ uri: item }}
                            style={styles.avatarImage}
                            contentFit="cover"
                            contentPosition={{ top: '0%', left: '50%' }} // Focus on top-center
                        />
                        {selectedAvatarUrl === item && (
                            <View style={styles.selectedCheckmarkContainer}>
                                <Check size={18} color="white" />
                            </View>
                        )}
                    </TouchableOpacity>
                )}
                keyExtractor={(item, index) => `avatar-${index}-${item}`}
                numColumns={numColumns}
                columnWrapperStyle={{ justifyContent: 'flex-start', gap: itemMargin, marginBottom: itemMargin }}
                // ListFooterComponent={<>
                //   <ThemedText style={styles.footerText}>
                //       Your avatars were created using AI based on your selfie and preferences
                //   </ThemedText>
                // </>}
                contentContainerStyle={styles.listContentContainer}
                showsVerticalScrollIndicator={false}
                style={{ flex: 1 }}
            />
        </View>
    );
};

const styles = StyleSheet.create({
    listContentContainer: {
        // paddingTop: theme.spacing.md, 
        // paddingBottom: theme.spacing.lg, 
        paddingLeft: theme.spacing.lg,
        // Removed width: '100%' and paddingHorizontal here, will be on the new outer View or FlatList itself
    },
    centeredContent: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        padding: theme.spacing.lg,
    },
    headerText: { // Kept for potential future use
        fontSize: 20,
        fontWeight: '600',
        textAlign: 'center',
        marginBottom: theme.spacing.xs,
        color: theme.colors.text,
    },
    subHeaderText: {
        fontSize: 14,
        textAlign: 'center',
        marginBottom: theme.spacing.lg, // Spacing after subtitle
        color: theme.colors.secondary.darkGray,
    },
    avatarItemContainer: {
        // width and height are set dynamically
        // marginHorizontal is set dynamically
        borderRadius: 16, // rounded-xl
        overflow: 'hidden',
        borderWidth: 2,
        borderColor: theme.colors.secondary.lightGray, // border-gray-200
        // Aspect ratio handled by dynamic height calculation
        backgroundColor: theme.colors.secondary.lightGray, // Fallback if image load fails
    },
    selectedAvatarItem: {
        borderColor: theme.colors.primary.purple, // border-purple-500
        // shadow-md equivalent for React Native:
        shadowColor: "#000",
        shadowOffset: {
            width: 0,
            height: 2,
        },
        shadowOpacity: 0.23,
        shadowRadius: 2.62,
        elevation: 4,
    },
    avatarImage: {
        width: '100%',
        height: '100%',
    },
    selectedCheckmarkContainer: {
        position: 'absolute',
        top: 8, // top-2 approx
        right: 8, // right-2 approx
        width: 24, // h-6 w-6
        height: 24,
        borderRadius: 12, // rounded-full
        backgroundColor: theme.colors.primary.purple, // bg-purple-500
        justifyContent: 'center',
        alignItems: 'center',
    },
    infoText: {
        textAlign: 'center',
        marginBottom: theme.spacing.xs,
        fontSize: 16,
    },
    infoTextNote: {
        textAlign: 'center',
        marginBottom: theme.spacing.md,
        fontSize: 13,
        color: theme.colors.secondary.darkGray,
        paddingHorizontal: theme.spacing.lg,
    },
    footerText: {
        fontSize: 11,
        textAlign: 'center',
        color: theme.colors.secondary.darkGray, // Changed from .gray to .darkGray
        fontStyle: 'italic',
        marginTop: theme.spacing.md, // mt-2
        marginBottom: theme.spacing.sm,
    },
    processingCardContainer: {
        flex: 1, // Make it take space if it's the only thing on screen
        justifyContent: 'center', // Center the card
        alignItems: 'center',
        padding: 16, // To give some margin around the card
        width: '100%',
    },
    creatingCard: {
        padding: 16,
        borderRadius: 16,
        shadowColor: '#000',
        shadowOpacity: 0.05,
        shadowOffset: { width: 0, height: 2 },
        shadowRadius: 4,
        elevation: 2,
        width: '100%', // Make card take full width within its padded container
        maxWidth: 500, // Optional: max width for larger screens
    },
    creatingRow: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 12,
    },
    creatingText: {
        marginLeft: 8,
        fontSize: 16,
        fontWeight: '500',
        color: '#a855f7',
    },
    creatingProgressBarTrack: {
        height: 8,
        backgroundColor: '#f3e8ff',
        borderRadius: 8,
        overflow: 'hidden',
    },
    creatingProgressBarFill: {
        height: '100%',
        backgroundColor: '#d946ef',
        // width is animated
    },
    creatingIconView: {
        // Style for the View wrapping Loader2 if needed for alignment/spacing
        // marginRight: 8, // If you want space before the text, similar to creatingText.marginLeft
        // Or adjust creatingRow to use justifyContent: 'center' if icon & text should be centered together
    },
});

export default DisplayCustomAvatars; 
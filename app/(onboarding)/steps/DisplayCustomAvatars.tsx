import React, { useEffect, useState, useRef } from 'react';
import { View, Text, StyleSheet, FlatList, ActivityIndicator, TouchableOpacity, Dimensions, Animated, Easing } from 'react-native';
import { Image } from 'expo-image';
import { useUser } from '@clerk/clerk-expo';
import { useOnBoarding } from '../context';
import theme from '@/styles/theme';
import { ThemedText } from '@/components/ThemedText';
import { Check, Loader } from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';
import MaskedView from '@react-native-masked-view/masked-view';
import { MotiView } from 'moti';

interface DisplayCustomAvatarsProps {
    onBack: () => void;
    onNext: () => void;
}

const { width, height } = Dimensions.get('window');

const DisplayCustomAvatars: React.FC<DisplayCustomAvatarsProps> = ({ onBack, onNext }) => {
    const { user, isLoaded: isUserClerkLoaded } = useUser();
    const { dispatch, payload } = useOnBoarding();

    const customAvatars = user?.publicMetadata?.custom_avatar_urls as string[] || [];
    const avatarStatus = user?.publicMetadata?.avatar_creation_status as string || 'pending';

    const [selectedAvatarUrl, setSelectedAvatarUrl] = useState<string | null>(() => {
        if (payload.styleProfileState?.usingExisting && payload.styleProfileState.images?.length > 0) {
            return payload.styleProfileState.images[0];
        }
        return null;
    });

    // Animation values
    const titleOpacity = useRef(new Animated.Value(0)).current;
    const titleTranslateY = useRef(new Animated.Value(-20)).current;
    const contentOpacity = useRef(new Animated.Value(0)).current;
    const contentTranslateY = useRef(new Animated.Value(30)).current;
    const avatarScales = useRef(customAvatars.map(() => new Animated.Value(0.9))).current;
    
    // For testing the animation if context value is initially null
    const [mockStartTime] = useState(() => Date.now()); 
    const _avatarGenerationStartTime = payload.styleProfileState?.avatarGenerationStartTime || mockStartTime; 
    const _isProcessingNewAvatar = avatarStatus && avatarStatus !== 'ready' && payload.avatarPath === 'custom';
    
    // State for progress bar
    const [avatarCreationProgress, setAvatarCreationProgress] = useState(0);
    const animatedProgressWidth = useRef(new Animated.Value(0)).current;

    // Add loading state for images
    const [loadingImages, setLoadingImages] = useState<Record<number, boolean>>({});

    const handleImageLoadStart = (index: number) => {
        setLoadingImages(prev => ({ ...prev, [index]: true }));
    };

    const handleImageLoadEnd = (index: number) => {
        setLoadingImages(prev => ({ ...prev, [index]: false }));
    };

    // Run entrance animations
    useEffect(() => {
        Animated.sequence([
            // Title animation
            Animated.parallel([
                Animated.timing(titleOpacity, {
                    toValue: 1,
                    duration: 600,
                    useNativeDriver: true,
                }),
                Animated.timing(titleTranslateY, {
                    toValue: 0,
                    duration: 600,
                    easing: Easing.out(Easing.ease),
                    useNativeDriver: true,
                }),
            ]),
            
            // Content animation (slight delay)
            Animated.parallel([
                Animated.timing(contentOpacity, {
                    toValue: 1,
                    duration: 400,
                    useNativeDriver: true,
                }),
                Animated.timing(contentTranslateY, {
                    toValue: 0,
                    duration: 400,
                    easing: Easing.out(Easing.ease),
                    useNativeDriver: true,
                }),
            ]),
            
            // Avatar cards animation (staggered)
            Animated.stagger(
                100,
                avatarScales.map(scale => 
                    Animated.spring(scale, {
                        toValue: 1,
                        friction: 8,
                        tension: 40,
                        useNativeDriver: true,
                    })
                )
            )
        ]).start();
    }, []);

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

    const handleAvatarSelect = (avatarUrl: string, index: number) => {
        if (_isProcessingNewAvatar) return; // Don't allow selection if a new one is processing
        
        // Provide haptic feedback
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
        
        // Animate the selected avatar
        Animated.sequence([
            Animated.timing(avatarScales[index], {
                toValue: 0.95,
                duration: 100,
                useNativeDriver: true,
            }),
            Animated.spring(avatarScales[index], {
                toValue: 1,
                friction: 3,
                tension: 40,
                useNativeDriver: true,
            })
        ]).start();
        
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
    const containerPadding = 16; // Reduced from theme.spacing.lg
    const itemMargin = 8; // Reduced from theme.spacing.sm
    const numColumns = 2;
    // Total horizontal space taken by margins/gaps for numColumns
    const totalHorizontalSpacing = containerPadding * 2 + itemMargin * (numColumns - 1);
    const imageWidth = Math.floor((screenWidth - totalHorizontalSpacing) / numColumns);
    const imageHeight = imageWidth * (4 / 3); // Aspect ratio 3:4 (height is 4/3 of width)

    // Background pattern elements
    const renderPatternElements = () => (
        <View style={styles.patternContainer}>
            {[...Array(15)].map((_, i) => (
                <View 
                    key={i} 
                    style={[
                        styles.patternItem, 
                        { 
                            left: Math.random() * width, 
                            top: Math.random() * height * 0.7,
                            opacity: 0.03 + (Math.random() * 0.05), // Between 0.03 and 0.08
                            transform: [{ rotate: `${Math.random() * 360}deg` }]
                        }
                    ]} 
                />
            ))}
        </View>
    );

    if (_isProcessingNewAvatar) {
        return (
            <View style={styles.pageContainer}>
                {renderPatternElements()}
                <LinearGradient
                    colors={['#ffffff', '#f5f3ff', '#f0f9ff']}
                    style={styles.gradientBackground}
                >
                    <View style={styles.processingCardContainer}>
                        <LinearGradient
                            colors={['#8B5CF6', '#EC4899', '#3B82F6']}
                            start={{ x: 0, y: 0 }}
                            end={{ x: 1, y: 0 }}
                            style={styles.creatingCard}
                        >
                            <View style={styles.creatingRow}>
                                <Animated.View style={{ transform: [{ rotate: spin }] }}>
                                    <Loader size={24} color="#ffffff" />
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
                </LinearGradient>
            </View>
        );
    }

    if (!isUserClerkLoaded) {
        return (
            <View style={styles.pageContainer}>
                {renderPatternElements()}
                <LinearGradient
                    colors={['#ffffff', '#f5f3ff', '#f0f9ff']}
                    style={styles.gradientBackground}
                >
                    <View style={styles.centeredContent}>
                        <ActivityIndicator size="large" color={theme.colors.primary.purple} />
                        <ThemedText>Loading your information...</ThemedText>
                    </View>
                </LinearGradient>
            </View>
        );
    }

    return (
        <View style={styles.pageContainer}>
            {renderPatternElements()}
            <LinearGradient
                colors={['#ffffff', '#f5f3ff', '#f0f9ff']}
                style={styles.gradientBackground}
            >
                <View style={styles.container}>
                    {/* Title with gradient text */}
                    <Animated.View
                        style={{
                            opacity: titleOpacity,
                            transform: [{ translateY: titleTranslateY }],
                            width: '100%',
                            alignItems: 'center',
                            marginBottom: 0, // Reduced from 5
                        }}
                    >
                        <MaskedView
                            style={styles.titleContainer}
                            maskElement={
                                <Text style={styles.titleHeading}>
                                    Create an avatar of you
                                </Text>
                            }
                        >
                            <LinearGradient
                                colors={['#8B5CF6', '#EC4899', '#3B82F6']}
                                start={{ x: 0, y: 0 }}
                                end={{ x: 1, y: 0 }}
                                style={{ height: 45 }}
                            />
                        </MaskedView>
                        
                      
                    </Animated.View>
                    
                    <Animated.View
                        style={{
                            opacity: contentOpacity,
                            transform: [{ translateY: contentTranslateY }],
                            width: '100%',
                            alignItems: 'center',
                            marginTop: 0, // Ensure no extra space
                        }}
                    >
                        <MaskedView
                            style={{ width: '100%', alignItems: 'center', marginTop: -15 }}
                            maskElement={
                                <Text style={styles.selectionText}>
                                    Select the avatar that best represents you
                                </Text>
                            }
                        >
                            <LinearGradient
                                colors={['#8B5CF6', '#EC4899', '#3B82F6']}
                                start={{ x: 0, y: 0 }}
                                end={{ x: 1, y: 0 }}
                                style={{ height: 30, width: '100%', marginBottom: 10 }}
                            />
                        </MaskedView>
                        
                        <FlatList
                            data={customAvatars}
                            renderItem={({ item, index }) => (
                                <Animated.View
                                    style={{
                                        transform: [{ scale: avatarScales[index] }]
                                    }}
                                >
                                    <TouchableOpacity
                                        style={[
                                            styles.avatarItemContainer,
                                            { width: imageWidth, height: imageHeight, margin: itemMargin / 2 },
                                            selectedAvatarUrl === item && styles.selectedAvatarItem
                                        ]}
                                        onPress={() => handleAvatarSelect(item, index)}
                                        activeOpacity={0.9}
                                    >
                                        <View style={styles.imageContainer}>
                                            {loadingImages[index] && (
                                                <View style={styles.imageLoadingContainer}>
                                                    <ActivityIndicator size="small" color={theme.colors.primary.purple} />
                                                </View>
                                            )}
                                            <Image
                                                source={{ uri: item }}
                                                style={styles.avatarImage}
                                                contentFit="cover"
                                                contentPosition={{ top: '0%', left: '50%' }}
                                                transition={300}
                                                onLoadStart={() => handleImageLoadStart(index)}
                                                onLoad={() => handleImageLoadEnd(index)}
                                            />
                                        </View>
                                        {selectedAvatarUrl === item && (
                                            <MotiView
                                                from={{ opacity: 0, scale: 0.5 }}
                                                animate={{ opacity: 1, scale: 1 }}
                                                transition={{
                                                    type: "timing",
                                                    duration: 300,
                                                }}
                                                style={styles.selectedCheckmarkContainer}
                                            >
                                                <Check size={18} color="white" strokeWidth={3} />
                                            </MotiView>
                                        )}
                                    </TouchableOpacity>
                                </Animated.View>
                            )}
                            keyExtractor={(item, index) => `avatar-${index}-${item}`}
                            numColumns={numColumns}
                            columnWrapperStyle={{ justifyContent: 'center', marginBottom: itemMargin }}
                            contentContainerStyle={styles.listContentContainer}
                            showsVerticalScrollIndicator={false}
                            style={{ width: '100%', marginBottom: 65 }}
                        />
                    </Animated.View>
                </View>
            </LinearGradient>
        </View>
    );
};

const styles = StyleSheet.create({
    pageContainer: {
        flex: 1,
        position: 'relative',
    },
    gradientBackground: {
        flex: 1,
        width: '100%',
    },
    patternContainer: {
        position: 'absolute',
        width: '100%',
        height: '100%',
        zIndex: 0,
    },
    patternItem: {
        position: 'absolute',
        width: 30,
        height: 30,
        borderRadius: 6,
        backgroundColor: '#8B5CF6',
    },
    container: {
        flex: 1,
        paddingHorizontal: 16, // Reduced from theme.spacing.lg
        paddingTop: 15,
        alignItems: 'center',
        width: '100%',
    },
    titleContainer: {
        marginBottom: 0, // Reduced from 10
        alignItems: 'center',
    },
    titleHeading: {
        fontSize: 28,
        fontWeight: '700',
        textAlign: 'center',
    },
    subtitle: {
        fontSize: 16,
        color: '#6B7280',
        textAlign: 'center',
        fontWeight: '500',
        marginTop: 12,
        lineHeight: 22,
    },
    selectionText: {
        fontSize: 16,
        color: '#4B5563',
        fontWeight: '600',
        textAlign: 'center',
        marginTop: 5, // Reduced from 10
        marginBottom: 10, // Reduced from 20
    },
    listContentContainer: {
        paddingBottom: 80, // Increased to ensure space at bottom
        alignItems: 'center',
        width: '100%',
    },
    centeredContent: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        padding: theme.spacing.lg,
    },
    avatarItemContainer: {
        borderRadius: 24, // Increased from 20
        overflow: 'hidden',
        borderWidth: 2,
        borderColor: 'rgba(233, 213, 255, 0.6)',
        backgroundColor: 'rgba(250, 250, 252, 0.8)',
        shadowColor: "#000",
        shadowOffset: {
            width: 0,
            height: 2,
        },
        shadowOpacity: 0.1,
        shadowRadius: 3,
        elevation: 3,
    },
    selectedAvatarItem: {
        borderColor: '#9333EA', // More vibrant purple
        borderWidth: 3,
        shadowColor: '#8B5CF6',
        shadowOffset: {
            width: 0,
            height: 6,
        },
        shadowOpacity: 0.35,
        shadowRadius: 8,
        elevation: 7,
    },
    imageContainer: {
        width: '100%',
        height: '100%',
        position: 'relative',
        justifyContent: 'center',
        alignItems: 'center',
    },
    imageLoadingContainer: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: 'rgba(250, 250, 252, 0.7)',
        zIndex: 1,
    },
    avatarImage: {
        width: '100%',
        height: '100%',
    },
    selectedCheckmarkContainer: {
        position: 'absolute',
        top: 12,
        right: 12,
        width: 32,
        height: 32,
        borderRadius: 16,
        backgroundColor: '#7C3AED', // Deeper purple for the check
        justifyContent: 'center',
        alignItems: 'center',
        shadowColor: 'rgba(0, 0, 0, 0.4)',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.3,
        shadowRadius: 3,
        elevation: 4,
        borderWidth: 1.5,
        borderColor: 'rgba(255, 255, 255, 0.9)',
    },
    processingCardContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        padding: 24,
        width: '100%',
    },
    creatingCard: {
        padding: 24,
        borderRadius: 20,
        shadowColor: '#8B5CF6',
        shadowOpacity: 0.15,
        shadowOffset: { width: 0, height: 4 },
        shadowRadius: 10,
        elevation: 4,
        width: '100%',
        maxWidth: 500,
        borderWidth: 1,
        borderColor: 'rgba(255, 255, 255, 0.2)',
    },
    creatingRow: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 16,
    },
    creatingText: {
        marginLeft: 12,
        fontSize: 16,
        fontWeight: '600',
        color: '#ffffff',
    },
    creatingProgressBarTrack: {
        height: 10,
        backgroundColor: 'rgba(255, 255, 255, 0.3)',
        borderRadius: 10,
        overflow: 'hidden',
    },
    creatingProgressBarFill: {
        height: '100%',
        backgroundColor: '#ffffff',
        borderRadius: 10,
    },
});

export default DisplayCustomAvatars; 
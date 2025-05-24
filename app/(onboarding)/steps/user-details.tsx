import React, { useState, useEffect, useRef } from 'react';
import {
    View,
    StyleSheet,
    Text,
    TouchableOpacity,
    Modal,
    Platform,
    KeyboardAvoidingView,
    ScrollView,
    TextInput,
    Pressable,
    Animated,
    Dimensions,
    Easing
} from 'react-native';
import { Picker } from '@react-native-picker/picker';
import TextBox from '@/components/text-box';
import theme from '@/styles/theme';
import { useOnBoarding, OnboardingPayload } from '../context';
import { useUserCountry } from '../queries';
import { ChevronDown, Loader2, Shirt, Footprints, MapPin } from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { MotiView } from 'moti';
import AvatarCreationProgressCard from './AvatarCreationProgressCard';
import { useUser } from '@clerk/clerk-expo';
import * as Haptics from 'expo-haptics';
import MaskedView from '@react-native-masked-view/masked-view';

const { width, height } = Dimensions.get('window');

function UserDetails() {
    const { payload, dispatch } = useOnBoarding();

    // Modal visibility states (these remain local since they're UI state, not data)
    const [isClothingSizePickerVisible, setClothingSizePickerVisible] = useState(false);
    const [isShoeSizePickerVisible, setIsShoeSizePickerVisible] = useState(false);
    const [isShoeSizeUnitPickerVisible, setShoeSizeUnitPickerVisible] = useState(false);
    const [isCountryPickerVisible, setCountryPickerVisible] = useState(false);

    // Reference for shoe size input
    const shoeSizeInputRef = useRef<TextInput>(null);
    const { user, isLoaded: isUserLoaded } = useUser();

    // Avatar Creation Progress State
    const [avatarGenerationProgress, setAvatarGenerationProgress] = useState(0);
    const [animatedProgressWidth] = useState(new Animated.Value(0));
    const spinAnim = useRef(new Animated.Value(0)).current;
    
    // Animation values for entrance effects
    const headerOpacity = useRef(new Animated.Value(0)).current;
    const headerTranslateY = useRef(new Animated.Value(-20)).current;
    const formOpacity = useRef(new Animated.Value(0)).current;
    const formTranslateY = useRef(new Animated.Value(30)).current;
    
    // Individual form field animations
    const fieldAnimations = {
        clothing: useRef(new Animated.Value(0)).current,
        shoe: useRef(new Animated.Value(0)).current,
        unit: useRef(new Animated.Value(0)).current,
        country: useRef(new Animated.Value(0)).current,
    };

    // Progress bar animation
    const progressBarWidth = useRef(new Animated.Value(0)).current;

    // Determine if avatar is being created
    const _currentAvatarStatus = payload.styleProfileState?.avatarStatus || user?.publicMetadata?.avatar_creation_status;
    const _avatarGenerationStartTime = payload.styleProfileState?.avatarGenerationStartTime
    const _isProcessingNewAvatar = payload.avatarPath === 'custom' && _currentAvatarStatus && _currentAvatarStatus !== 'ready'

    // Add new state for focus tracking
    const [focusedField, setFocusedField] = useState<string | null>(null);

    // Add a confirmationAnim for selection feedback
    const confirmationAnim = useRef(new Animated.Value(0)).current;

    useEffect(() => {
        let intervalId: NodeJS.Timeout | undefined = undefined;
        if (_isProcessingNewAvatar && _avatarGenerationStartTime) {
            const calculateProgress = () => {
                const elapsedTime = Date.now() - _avatarGenerationStartTime;
                // Assuming a 5-minute (300,000 ms) generation time, as in StyleProfile
                const progress = Math.min((elapsedTime / 300000) * 100, 100);
                setAvatarGenerationProgress(progress);
                if (progress >= 100) {
                    if (intervalId) clearInterval(intervalId);
                    // Optionally, dispatch an action or update local state if avatar should be 'ready' or 'needs-review'
                }
            };
            calculateProgress(); // Initial calculation
            intervalId = setInterval(calculateProgress, 1000); // Update every second
        } else {
            setAvatarGenerationProgress(0); // Reset if not creating or no start time
        }
        return () => {
            if (intervalId) clearInterval(intervalId);
        };
    }, [_isProcessingNewAvatar, _avatarGenerationStartTime]);

    useEffect(() => {
        Animated.timing(animatedProgressWidth, {
            toValue: avatarGenerationProgress,
            duration: 500, // Smooth animation
            useNativeDriver: false, // width animation not supported by native driver
        }).start();
    }, [avatarGenerationProgress]);
    
    useEffect(() => {
        if (_isProcessingNewAvatar) {
            Animated.loop(
                Animated.timing(spinAnim, {
                    toValue: 1,
                    duration: 1000,
                    useNativeDriver: true,
                })
            ).start();
        } else {
            spinAnim.setValue(0); // Reset animation
        }
    }, [_isProcessingNewAvatar, spinAnim]);

    // Run entrance animations on component mount
    useEffect(() => {
        // Update progress bar animation
        Animated.timing(progressBarWidth, {
            toValue: 67, // 67% complete as shown in the UI
            duration: 1000,
            useNativeDriver: false,
        }).start();
        
        // Sequence for staggered entrance animations
        Animated.sequence([
            // Header animation
            Animated.parallel([
                Animated.timing(headerOpacity, {
                    toValue: 1,
                    duration: 600,
                    useNativeDriver: true,
                }),
                Animated.timing(headerTranslateY, {
                    toValue: 0,
                    duration: 600,
                    easing: Easing.out(Easing.ease),
                    useNativeDriver: true,
                }),
            ]),
            
            // Form container animation
            Animated.parallel([
                Animated.timing(formOpacity, {
                    toValue: 1,
                    duration: 500,
                    useNativeDriver: true,
                }),
                Animated.timing(formTranslateY, {
                    toValue: 0,
                    duration: 500,
                    easing: Easing.out(Easing.ease),
                    useNativeDriver: true,
                }),
            ]),
        ]).start();
        
        // Staggered animation for form fields
        Animated.stagger(
            150,
            [
                Animated.spring(fieldAnimations.clothing, {
                    toValue: 1,
                    friction: 7,
                    tension: 40,
                    useNativeDriver: true,
                }),
                Animated.spring(fieldAnimations.shoe, {
                    toValue: 1,
                    friction: 7,
                    tension: 40,
                    useNativeDriver: true,
                }),
                Animated.spring(fieldAnimations.unit, {
                    toValue: 1,
                    friction: 7,
                    tension: 40,
                    useNativeDriver: true,
                }),
                Animated.spring(fieldAnimations.country, {
                    toValue: 1,
                    friction: 7,
                    tension: 40,
                    useNativeDriver: true,
                }),
            ]
        ).start();
    }, []);

    const spin = spinAnim.interpolate({
        inputRange: [0, 1],
        outputRange: ['0deg', '360deg'],
    });

    // Define options
    const clothingSizeOptions = [
        { label: 'XS', value: 'XS' },
        { label: 'S', value: 'S' },
        { label: 'M', value: 'M' },
        { label: 'L', value: 'L' },
        { label: 'XL', value: 'XL' },
        { label: 'XXL', value: 'XXL' },
    ];

    // Sample Shoe Size Options - A_MODIFY_USER: Adjust these as needed
    const shoeSizeOptions = [
        { label: '6', value: '6' },
        { label: '6.5', value: '6.5' },
        { label: '7', value: '7' },
        { label: '7.5', value: '7.5' },
        { label: '8', value: '8' },
        { label: '8.5', value: '8.5' },
        { label: '9', value: '9' },
        { label: '9.5', value: '9.5' },
        { label: '10', value: '10' },
        { label: '10.5', value: '10.5' },
        { label: '11', value: '11' },
        { label: '11.5', value: '11.5' },
        { label: '12', value: '12' },
    ];

    const shoeSizeUnitOptions = [
        { label: 'US', value: 'US' },
        { label: 'UK', value: 'UK' },
        { label: 'EU', value: 'EU' },
    ];

    const { userCountry, countries } = useUserCountry();

    // Initialize values from context or set to first option if null
    useEffect(() => {
        // Initialize clothing size if null
        if (payload.clothing_size === null) {
            dispatch({
                type: "SET_PAYLOAD",
                payload: { key: "clothing_size", value: clothingSizeOptions[0].value }
            });
        }

        // Initialize shoe size if null
        if (payload.shoe_size === null && shoeSizeOptions.length > 0) {
            dispatch({
                type: "SET_PAYLOAD",
                payload: { key: "shoe_size", value: shoeSizeOptions[0].value }
            });
        }

        // Initialize shoe size unit if null
        if (payload.shoe_unit === null) {
            dispatch({
                type: "SET_PAYLOAD",
                payload: { key: "shoe_unit", value: shoeSizeUnitOptions[0].value }
            });
        }

        // Initialize country if null
        if (payload.country === null && userCountry) {
            dispatch({
                type: "SET_PAYLOAD",
                payload: { key: "country", value: userCountry }
            });
        }
    }, [userCountry]);


    // Get values from context with default values
    const clothingSize = payload?.clothing_size || clothingSizeOptions[0].value;
    const shoeSize = payload?.shoe_size || '';
    const shoeSizeUnit = payload?.shoe_unit || shoeSizeUnitOptions[0].value;

    // Update context handlers
    const animateConfirmation = () => {
        confirmationAnim.setValue(0);
        Animated.timing(confirmationAnim, {
            toValue: 1,
            duration: 300,
            useNativeDriver: true,
            easing: Easing.out(Easing.ease)
        }).start();
    };

    const handleClothingSizeChange = (value: string) => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
        animateConfirmation();
        dispatch({
            type: "SET_PAYLOAD",
            payload: { key: "clothing_size", value }
        });
    };

    const handleShoeSizeChange = (value: string) => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        animateConfirmation();
        dispatch({
            type: "SET_PAYLOAD",
            payload: { key: "shoe_size", value }
        });
    };

    const handleShoeSizeUnitChange = (value: string) => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        animateConfirmation();
        dispatch({
            type: "SET_PAYLOAD",
            payload: { key: "shoe_unit", value }
        });
    };

    const handleCountryChange = (value: string) => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
        animateConfirmation();
        dispatch({
            type: "SET_PAYLOAD",
            payload: { key: "country", value }
        });
    };

    const handleShoeSizeSubmit = () => {
        shoeSizeInputRef.current?.blur();
    };

    // Add scale animation to pickers
    const pickerScale = useRef(new Animated.Value(1)).current;

    const handlePickerOpen = () => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
        Animated.spring(pickerScale, {
            toValue: 1.05,
            friction: 8,
            tension: 40,
            useNativeDriver: true,
        }).start();
    };

    const handlePickerClose = () => {
        Animated.spring(pickerScale, {
            toValue: 1,
            friction: 8,
            tension: 40,
            useNativeDriver: true,
        }).start();
    };
    
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

    const renderPicker = (
        value: string,
        onValueChange: (value: string) => void,
        items: Array<{ label: string; value: string }>,
        isVisible: boolean,
        setVisible: (visible: boolean) => void,
        placeholder: string,
        animValue: Animated.Value,
        fieldName: string
    ) => {
        const isFocused = focusedField === fieldName;
        
        if (Platform.OS === 'android') {
            return (
                <Animated.View style={{
                    transform: [{ scale: animValue }],
                    opacity: animValue,
                }}>
                    <TouchableOpacity
                        onPress={() => {
                            handlePickerOpen();
                            setVisible(true);
                            setFocusedField(fieldName);
                        }}
                        style={[
                            styles.input,
                            isFocused && styles.inputFocused
                        ]}
                        activeOpacity={0.8}
                    >
                        <Picker
                            selectedValue={value}
                            onValueChange={(itemValue) => {
                                onValueChange(itemValue);
                            }}
                            style={styles.picker}
                            dropdownIconColor={theme.colors.secondary.black}
                        >
                            {items.map((item) => (
                                <Picker.Item key={item.value} label={item.label} value={item.value} />
                            ))}
                        </Picker>
                    </TouchableOpacity>
                </Animated.View>
            );
        }

        return (
            <Animated.View style={{
                transform: [{ scale: animValue }],
                opacity: animValue,
                width: '100%',
            }}>
                <LinearGradient
                    colors={isFocused ? 
                        ['rgba(139, 92, 246, 0.25)', 'rgba(59, 130, 246, 0.15)', 'rgba(255, 255, 255, 0.1)'] : 
                        ['rgba(139, 92, 246, 0.1)', 'rgba(59, 130, 246, 0.05)', 'rgba(255, 255, 255, 0.1)']}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                    style={styles.inputGradientBorder}
                >
                    <Pressable
                        onPress={() => {
                            handlePickerOpen();
                            setVisible(true);
                            setFocusedField(fieldName);
                        }}
                        style={[
                            styles.pickerWrapper,
                            isFocused && styles.pickerWrapperFocused
                        ]}
                    >
                        <Animated.View
                            style={{
                                transform: [{ 
                                    scale: confirmationAnim.interpolate({
                                        inputRange: [0, 0.5, 1],
                                        outputRange: [1, 1.05, 1]
                                    })
                                }]
                            }}
                        >
                            <Text style={[
                                styles.pickerText,
                                value ? styles.pickerTextSelected : {}
                            ]}>
                                {value
                                    ? items.find(item => item.value === value)?.label || value
                                    : placeholder
                                }
                            </Text>
                        </Animated.View>
                        <MotiView
                            animate={{ rotate: isVisible ? '180deg' : '0deg' }}
                            transition={{ type: 'timing', duration: 300 }}
                        >
                            <ChevronDown size={20} color={isFocused ? '#8B5CF6' : theme.colors.secondary.black} />
                        </MotiView>
                    </Pressable>
                </LinearGradient>

                <Modal
                    animationType="slide"
                    transparent={true}
                    visible={isVisible}
                    onRequestClose={() => {
                        handlePickerClose();
                        setVisible(false);
                    }}
                >
                    <Pressable 
                        style={styles.modalOverlay}
                        onPress={() => {
                            handlePickerClose();
                            setVisible(false);
                        }}
                    >
                        <View style={styles.modalContainer}>
                            <Pressable style={styles.modalContent}>
                                <View style={styles.modalHeader}>
                                    <TouchableOpacity 
                                        onPress={() => {
                                            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                                            setVisible(false);
                                        }}
                                        style={styles.modalButton}
                                    >
                                        <Text style={styles.modalCancelText}>Cancel</Text>
                                    </TouchableOpacity>
                                    <TouchableOpacity
                                        onPress={() => {
                                            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
                                            setVisible(false);
                                        }}
                                        style={styles.modalButton}
                                    >
                                        <Text style={styles.modalDoneText}>Done</Text>
                                    </TouchableOpacity>
                                </View>
                                <Picker
                                    selectedValue={value}
                                    onValueChange={(itemValue) => {
                                        onValueChange(itemValue);
                                        // Haptic feedback on selection
                                        Haptics.selectionAsync();
                                    }}
                                    style={styles.modalPicker}
                                >
                                    {items.map((item) => (
                                        <Picker.Item key={item.value} label={item.label} value={item.value} />
                                    ))}
                                </Picker>
                            </Pressable>
                        </View>
                    </Pressable>
                </Modal>
            </Animated.View>
        );
    };

    return (
        <KeyboardAvoidingView
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
            style={styles.keyboardAvoidingView}
            keyboardVerticalOffset={Platform.OS === 'ios' ? 100 : 0}
        >
            {renderPatternElements()}
            
            <ScrollView
                style={styles.scrollView}
                keyboardShouldPersistTaps="handled"
                showsVerticalScrollIndicator={false}
            >
                <LinearGradient
                    colors={['#ffffff', '#f5f3ff', '#f0f9ff']}
                    style={styles.gradientBackground}
                >
                    <View style={styles.container}>
                        {/* Progress bar */}
                        <Animated.View 
                            style={[
                                styles.progressBarContainer,
                                {
                                    opacity: headerOpacity,
                                    transform: [{ translateY: headerTranslateY }]
                                }
                            ]}
                        >
                          
                        </Animated.View>
                        
                        {/* Heading with gradient text */}
                        <Animated.View 
                            style={[
                                styles.headerContainer,
                                {
                                    opacity: headerOpacity,
                                    transform: [{ translateY: headerTranslateY }]
                                }
                            ]}
                        >
                            <MaskedView
                                style={{ height: 45 }}
                                maskElement={
                                    <Text style={styles.title}>
                                        Tell us your sizes and location
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
                        
                        {!!_isProcessingNewAvatar && (
                            <MotiView
                                from={{ opacity: 0, scale: 0.9 }}
                                animate={{ opacity: 1, scale: 1 }}
                                transition={{ type: 'spring', damping: 15 }}
                                style={styles.progressCardWrapper}
                            >
                                <AvatarCreationProgressCard
                                    isProcessing={!!_isProcessingNewAvatar}
                                    progressStartTime={_avatarGenerationStartTime || null}
                                />
                            </MotiView>
                        )}

                        <Animated.View style={[
                            styles.formContainer,
                            {
                                opacity: formOpacity,
                                transform: [{ translateY: formTranslateY }]
                            }
                        ]}>
                            <View style={styles.card}>
                                <LinearGradient 
                                    colors={['rgba(255,255,255,0.8)', 'rgba(255,255,255,0.6)']}
                                    style={styles.cardInnerHighlight}
                                />
                                
                                <View style={styles.inputGroupContainer}>
                                    <View style={styles.inputContainer}>
                                        <View style={styles.labelContainer}>
                                            <Shirt size={16} color="#6366F1" style={styles.labelIcon} />
                                            <Text style={styles.label}>Clothing Size</Text>
                                            <View style={styles.requiredDot} />
                                        </View>
                                        {renderPicker(
                                            clothingSize,
                                            handleClothingSizeChange,
                                            clothingSizeOptions,
                                            isClothingSizePickerVisible,
                                            setClothingSizePickerVisible,
                                            'Select Size',
                                            fieldAnimations.clothing,
                                            'clothingSize'
                                        )}
                                    </View>
                                </View>
                                
                                <View style={[styles.inputGroupContainer, { marginTop: 10 }]}>
                                    <View style={styles.shoeSizeContainer}>
                                        <View style={[styles.inputContainer, { flex: 2 }]}>
                                            <View style={styles.labelContainer}>
                                                <Footprints size={16} color="#EC4899" style={styles.labelIcon} />
                                                <Text style={styles.label}>Shoe Size</Text>
                                                <View style={styles.requiredDot} />
                                            </View>
                                            {renderPicker(
                                                shoeSize,
                                                handleShoeSizeChange,
                                                shoeSizeOptions,
                                                isShoeSizePickerVisible,
                                                setIsShoeSizePickerVisible,
                                                'Select Shoe Size',
                                                fieldAnimations.shoe,
                                                'shoeSize'
                                            )}
                                        </View>
                                        <View style={[styles.inputContainer, { flex: 1, marginLeft: 10 }]}>
                                            <Text style={[styles.label, { marginBottom: 16 }]}>Unit</Text>
                                            {renderPicker(
                                                shoeSizeUnit,
                                                handleShoeSizeUnitChange,
                                                shoeSizeUnitOptions,
                                                isShoeSizeUnitPickerVisible,
                                                setShoeSizeUnitPickerVisible,
                                                'Select Unit',
                                                fieldAnimations.unit,
                                                'shoeSizeUnit'
                                            )}
                                        </View>
                                    </View>
                                </View>
                                
                                <View style={[styles.inputGroupContainer, { marginTop: 10 }]}>
                                    <View style={styles.inputContainer}>
                                        <View style={styles.labelContainer}>
                                            <MapPin size={16} color="#8B5CF6" style={styles.labelIcon} />
                                            <Text style={styles.label}>Country</Text>
                                            <View style={styles.requiredDot} />
                                        </View>
                                        {renderPicker(
                                            userCountry,
                                            handleCountryChange,
                                            countries,
                                            isCountryPickerVisible,
                                            setCountryPickerVisible,
                                            'Select Country',
                                            fieldAnimations.country,
                                            'country'
                                        )}
                                    </View>
                                </View>
                            </View>
                        </Animated.View>
                    </View>
                </LinearGradient>
            </ScrollView>
        </KeyboardAvoidingView>
    );
}

const styles = StyleSheet.create({
    keyboardAvoidingView: {
        flex: 1,
        width: '100%',
    },
    scrollView: {
        flex: 1,
        width: '100%',
    },
    gradientBackground: {
        flex: 1,
        width: '100%',
        height: '100%',
    },
    container: {
        flex: 1,
        padding: theme.spacing.lg,
        paddingTop: 0,
        paddingBottom: 10,
        width: '100%',
        position: 'relative',
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
    progressBarContainer: {
        marginBottom: 5,
        width: '100%',
        position: 'relative',
    },
    progressTrack: {
        height: 4,
        backgroundColor: 'rgba(139, 92, 246, 0.15)',
        borderRadius: 10,
        overflow: 'hidden',
        width: '100%',
    },
    progressFill: {
        height: '100%',
        borderRadius: 10,
    },
    headerContainer: {
        alignItems: 'center',
        marginBottom: 0,
    },
    title: {
        fontSize: 22,
        fontWeight: '700',
        textAlign: 'center',
        fontFamily: 'default-bold',
        paddingTop: 0,
        paddingBottom: 0,
    },
    subtitle: {
        fontSize: 14,
        color: '#6B7280',
        textAlign: 'center',
        fontWeight: '500',
        marginTop: 2,
        lineHeight: 18,
        maxWidth: '90%',
    },
    formContainer: {
        width: '100%',
        marginTop: 0,
    },
    card: {
        backgroundColor: 'rgba(255, 255, 255, 0.7)',
        borderRadius: 20,
        padding: 16,
        paddingTop: 14,
        marginTop: 5,
        shadowColor: "#8B5CF6",
        shadowOffset: {
            width: 0,
            height: 4,
        },
        shadowOpacity: 0.08,
        shadowRadius: 12,
        elevation: 4,
        borderWidth: 1,
        borderColor: 'rgba(139, 92, 246, 0.08)',
        position: 'relative',
        overflow: 'hidden',
    },
    cardInnerHighlight: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        height: 40,
        borderTopLeftRadius: 20,
        borderTopRightRadius: 20,
    },
    inputGroupContainer: {
        marginBottom: 12,
    },
    inputContainer: {
        marginBottom: 12,
    },
    labelContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 8,
    },
    label: {
        fontSize: 15,
        color: '#4B5563',
        fontFamily: 'default-semibold',
        fontWeight: '600',
        marginBottom: 12,
    },
    requiredDot: {
        width: 4,
        height: 4,
        borderRadius: 2,
        backgroundColor: '#EC4899',
        marginLeft: 6,
        opacity: 0.6,
    },
    inputGradientBorder: {
        borderRadius: 12,
        padding: 1.5,
        overflow: 'hidden',
    },
    input: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        borderRadius: 12,
        borderWidth: 1,
        borderColor: 'rgba(139, 92, 246, 0.2)',
        backgroundColor: 'white',
        width: '100%',
        padding: 13,
        shadowColor: "#8B5CF6",
        shadowOffset: {
            width: 0,
            height: 2,
        },
        shadowOpacity: 0.06,
        shadowRadius: 6,
        elevation: 2,
    },
    shoeSizeContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
    },
    pickerWrapper: {
        padding: 12,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        borderRadius: 12,
        backgroundColor: 'white',
        width: '100%',
        minHeight: 46,
        ...Platform.select({
            android: {
                elevation: 0,
            },
            ios: {
                shadowColor: '#8B5CF6',
                shadowOffset: { width: 0, height: 2 },
                shadowOpacity: 0.06,
                shadowRadius: 6,
            },
        }),
    },
    picker: {
        height: 50,
        width: '100%',
    },
    pickerText: {
        fontSize: 16,
        color: theme.colors.secondary.black,
    },
    modalOverlay: {
        flex: 1,
        justifyContent: 'flex-end',
        backgroundColor: 'rgba(0, 0, 0, 0.4)',
    },
    modalContainer: {
        flex: 1,
        justifyContent: 'flex-end',
        backgroundColor: 'transparent',
    },
    modalContent: {
        backgroundColor: 'white',
        borderTopLeftRadius: 24,
        borderTopRightRadius: 24,
        paddingBottom: 30,
        shadowColor: "#000",
        shadowOffset: {
            width: 0,
            height: -4,
        },
        shadowOpacity: 0.2,
        shadowRadius: 12,
        elevation: 20,
    },
    modalHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        padding: 16,
        borderBottomWidth: 1,
        borderBottomColor: 'rgba(0, 0, 0, 0.05)',
        paddingHorizontal: 20,
    },
    modalButton: {
        paddingVertical: 12,
        paddingHorizontal: 16,
        borderRadius: 8,
        minHeight: 44,
        minWidth: 70,
    },
    modalCancelText: {
        color: theme.colors.secondary.darkGray,
        fontSize: 16,
        fontWeight: '500',
    },
    modalDoneText: {
        color: theme.colors.primary.purple,
        fontSize: 16,
        fontWeight: '700',
    },
    modalPicker: {
        width: '100%',
    },
    progressCardWrapper: {
        marginBottom: theme.spacing.lg,
        width: '100%',
    },
    inputFocused: {
        borderColor: 'rgba(139, 92, 246, 0.4)',
        shadowColor: "#8B5CF6",
        shadowOffset: {
            width: 0,
            height: 2,
        },
        shadowOpacity: 0.15,
        shadowRadius: 8,
        elevation: 4,
    },
    pickerWrapperFocused: {
        backgroundColor: 'rgba(255, 255, 255, 0.95)',
    },
    pickerTextSelected: {
        color: '#4B5563',
        fontWeight: '600',
    },
    labelIcon: {
        marginRight: 8,
    },
});

export default UserDetails;

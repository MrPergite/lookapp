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
    Animated
} from 'react-native';
import { Picker } from '@react-native-picker/picker';
import TextBox from '@/components/text-box';
import theme from '@/styles/theme';
import { useOnBoarding, OnboardingPayload } from '../context';
import { useUserCountry } from '../queries';
import { ChevronDown, Loader2 } from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { MotiView } from 'moti';
import AvatarCreationProgressCard from './AvatarCreationProgressCard';
import { useUser } from '@clerk/clerk-expo';

function UserDetails() {
    const { payload, dispatch } = useOnBoarding();

    // Modal visibility states (these remain local since they're UI state, not data)
    const [isClothingSizePickerVisible, setClothingSizePickerVisible] = useState(false);
    const [isShoeSizeUnitPickerVisible, setShoeSizeUnitPickerVisible] = useState(false);
    const [isCountryPickerVisible, setCountryPickerVisible] = useState(false);

    // Reference for shoe size input
    const shoeSizeInputRef = useRef<TextInput>(null);
    const { user, isLoaded: isUserLoaded } = useUser();

    // Avatar Creation Progress State
    const [avatarGenerationProgress, setAvatarGenerationProgress] = useState(0);
    const [animatedProgressWidth] = useState(new Animated.Value(0));
    const spinAnim = useRef(new Animated.Value(0)).current;

    // Determine if avatar is being created
    const _currentAvatarStatus = payload.styleProfileState?.avatarStatus || user?.publicMetadata?.avatar_creation_status;
    const _avatarGenerationStartTime = payload.styleProfileState?.avatarGenerationStartTime
    const _isProcessingNewAvatar = payload.avatarPath === 'custom' && _currentAvatarStatus && _currentAvatarStatus !== 'ready'

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
            duration: 100, // Short duration for smooth updates
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
    const handleClothingSizeChange = (value: string) => {
        dispatch({
            type: "SET_PAYLOAD",
            payload: { key: "clothing_size", value }
        });
    };

    const handleShoeSizeChange = (value: string) => {
        dispatch({
            type: "SET_PAYLOAD",
            payload: { key: "shoe_size", value }
        });
    };

    const handleShoeSizeUnitChange = (value: string) => {
        dispatch({
            type: "SET_PAYLOAD",
            payload: { key: "shoe_unit", value }
        });
    };

    const handleCountryChange = (value: string) => {
        dispatch({
            type: "SET_PAYLOAD",
            payload: { key: "country", value }
        });
    };

    const handleShoeSizeSubmit = () => {
        shoeSizeInputRef.current?.blur();
    };

    const renderPicker = (
        value: string,
        onValueChange: (value: string) => void,
        items: Array<{ label: string; value: string }>,
        isVisible: boolean,
        setVisible: (visible: boolean) => void,
        placeholder: string
    ) => {
        if (Platform.OS === 'android') {
            return (
                <TouchableOpacity
                    onPress={() => setVisible(true)}
                    className='flex flex-row mt-2 h-12 items-center justify-between rounded-md border border-gray-200 px-3 py-2 text-sm w-full bg-white shadow-none'
                >
                    <Picker
                        selectedValue={value}
                        onValueChange={(itemValue) => {
                            onValueChange(itemValue);
                            setVisible(false);
                        }}
                        style={styles.picker}
                    >
                        {items.map((item) => (
                            <Picker.Item key={item.value} label={item.label} value={item.value} />
                        ))}
                    </Picker>
                </TouchableOpacity>
            );
        }

        return (
            <>
                <Pressable
                    onPress={() => setVisible(true)}
                    className='flex flex-row mt-2 h-12 items-center justify-between rounded-md border border-gray-200 px-3 py-2 text-sm w-full bg-white shadow-none'
                >
                    <Text style={styles.pickerText}>
                        {value
                            ? items.find(item => item.value === value)?.label || value
                            : placeholder
                        }
                    </Text>
                    <ChevronDown size={20} color={theme.colors.secondary.black} />
                </Pressable>
                <Modal
                    animationType="slide"
                    transparent={true}
                    visible={isVisible}
                    onRequestClose={() => setVisible(false)}
                >
                    <View style={styles.modalContainer}>
                        <View style={styles.modalContent}>
                            <View style={styles.modalHeader}>
                                <TouchableOpacity onPress={() => setVisible(false)}>
                                    <Text style={styles.modalCancelText}>Cancel</Text>
                                </TouchableOpacity>
                                <TouchableOpacity
                                    onPress={() => {
                                        setVisible(false);
                                    }}
                                >
                                    <Text style={styles.modalDoneText}>Done</Text>
                                </TouchableOpacity>
                            </View>
                            <Picker
                                selectedValue={value}
                                onValueChange={onValueChange}
                                style={styles.modalPicker}
                            >
                                {items.map((item) => (
                                    <Picker.Item key={item.value} label={item.label} value={item.value} />
                                ))}
                            </Picker>
                        </View>
                    </View>
                </Modal>
            </>
        );
    };

    return (
        <KeyboardAvoidingView
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
            style={styles.keyboardAvoidingView}
            keyboardVerticalOffset={Platform.OS === 'ios' ? 100 : 0}
        >
            <ScrollView
                style={styles.scrollView}
                keyboardShouldPersistTaps="handled"
                showsVerticalScrollIndicator={false}
                contentContainerStyle={{ flexGrow: 1 }}
            >
                <View style={styles.container}>
                    {!!_isProcessingNewAvatar && (
                        <View style={styles.progressCardWrapper}>
                            <AvatarCreationProgressCard
                                isProcessing={!!_isProcessingNewAvatar}
                                progressStartTime={_avatarGenerationStartTime || null}
                            />
                        </View>
                    )}

                    <View style={styles.inputContainer}>
                        <Text style={[styles.label]}>Clothing Size</Text>
                        {renderPicker(
                            clothingSize,
                            handleClothingSizeChange,
                            clothingSizeOptions,
                            isClothingSizePickerVisible,
                            setClothingSizePickerVisible,
                            'Select Size'
                        )}
                    </View>

                    <View className='gap-4' style={styles.shoeSizeContainer}>
                        <View style={[{ flex: 2 }]}>
                            <TextBox
                                labelStyle={styles.label}
                                style={[{
                                    borderColor: theme.colors.secondary.mediumLightGray,
                                    borderWidth: 1,
                                    borderRadius: 10,
                                    padding: theme.spacing.md,
                                    color: '#374151',
                                    fontFamily: 'default-semibold',
                                    fontWeight: '500'
                                }, styles.input]}
                                label="Shoe Size"
                                placeholderTextColor="#374151"
                                className='h-12'
                                value={shoeSize}
                                onChangeText={handleShoeSizeChange}
                                keyboardType="numeric"
                                error={null}
                                ref={shoeSizeInputRef}
                                returnKeyType="done"
                                onSubmitEditing={handleShoeSizeSubmit}
                                placeholder='Enter Shoe Size'
                            />
                        </View>
                        <View style={[styles.inputContainer, { flex: 1 }]}>
                            <Text style={styles.label}>Unit</Text>
                            {renderPicker(
                                shoeSizeUnit,
                                handleShoeSizeUnitChange,
                                shoeSizeUnitOptions,
                                isShoeSizeUnitPickerVisible,
                                setShoeSizeUnitPickerVisible,
                                'Select Unit'
                            )}
                        </View>
                    </View>

                    <View style={styles.inputContainer}>
                        <Text style={styles.label}>Country</Text>
                        {renderPicker(
                            userCountry,
                            handleCountryChange,
                            countries,
                            isCountryPickerVisible,
                            setCountryPickerVisible,
                            'Select Country'
                        )}
                    </View>
                </View>
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
    container: {
        flex: 1,
        padding: theme.spacing.lg,
        width: '100%',
    },
    inputContainer: {
        marginBottom: theme.spacing.lg,
    },
    input: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        borderRadius: 6,
        borderWidth: 1,
        borderColor: '#e5e7eb', // Tailwind's input border (gray-200)
        backgroundColor: 'white',
        width: '100%',
        padding: 13,

    },
    shoeSizeContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
    },
    pickerWrapper: {
        marginTop: 5,
        padding: 13,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        borderRadius: 6,
        borderColor: '#e5e7eb',
        backgroundColor: 'white',
        width: '100%',
        ...Platform.select({
            android: {
                elevation: 0,
            },
            ios: {
                shadowColor: 'transparent',
                shadowOffset: { width: 0, height: 0 },
                shadowOpacity: 0,
                shadowRadius: 0,
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
    label: {
        fontSize: 14,
        color: '#374151',
        fontFamily: 'default-semibold',
        fontWeight: '500',

    },
    modalContainer: {
        flex: 1,
        justifyContent: 'flex-end',
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
    },
    modalContent: {
        backgroundColor: 'white',
        borderTopLeftRadius: 20,
        borderTopRightRadius: 20,
        paddingBottom: 20,
    },
    modalHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        padding: 16,
        borderBottomWidth: 1,
        borderBottomColor: '#EEEEEE',
    },
    modalCancelText: {
        color: theme.colors.secondary.darkGray,
        fontSize: 16,
    },
    modalDoneText: {
        color: theme.colors.primary.purple,
        fontSize: 16,
        fontWeight: 'bold',
    },
    modalPicker: {
        width: '100%'
    },
    progressCardWrapper: {
        marginBottom: theme.spacing.lg,
        width: '100%',
    },
    progressOuterContainer: {
        marginTop: theme.spacing.xl, // mt-8 approx
        marginBottom: theme.spacing.md, // mb-4 approx
        borderRadius: 12, // rounded-lg
        overflow: 'hidden', // For gradient border radius
        borderWidth: 1,
        borderColor: 'rgba(255, 255, 255, 0.4)',
        // Pulse animation can be added via MotiView directly if needed
    },
    progressGradientBackground: {
        padding: theme.spacing.md, // p-4
        // backdrop-blur-sm is not directly translatable easily
    },
    progressHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8, // gap-2
        marginBottom: theme.spacing.sm, // mb-2
    },
    progressIconWrapper: {
        borderRadius: 999, // rounded-full
        padding: theme.spacing.xs, // p-1
        // shadow-sm can be added via elevation (Android) or shadow props (iOS)
        elevation: 2,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.18,
        shadowRadius: 1.00,
    },
    progressHeaderText: {
        fontSize: 14,
        fontWeight: '500',
        // For gradient text, would ideally use a GradientText component or specific handling
        color: theme.colors.primary.purple, // Fallback color
    },
    progressBarTrack: {
        height: 10, // h-2.5
        backgroundColor: 'rgba(255, 255, 255, 0.5)', // bg-white/50
        borderRadius: 999, // rounded-full
        overflow: 'hidden',
    },
    progressBarFillWrapper: {
        height: '100%',
        // width is animated
    },
    progressBarFill: {
        height: '100%',
        width: '100%',
        opacity: 0.9, // From original style example for the underline, adapting here
    }
});

export default UserDetails;

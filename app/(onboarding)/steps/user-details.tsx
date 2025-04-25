import React, { useState, useEffect } from 'react';
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
    Pressable
} from 'react-native';
import { Picker } from '@react-native-picker/picker';
import TextBox from '@/components/text-box';
import theme from '@/styles/theme';
import { useOnBoarding } from '../context';
import { useUserCountry } from '../queries';

function UserDetails() {
    const { payload, dispatch } = useOnBoarding() as any;

    // Modal visibility states (these remain local since they're UI state, not data)
    const [isClothingSizePickerVisible, setClothingSizePickerVisible] = useState(false);
    const [isShoeSizeUnitPickerVisible, setShoeSizeUnitPickerVisible] = useState(false);
    const [isCountryPickerVisible, setCountryPickerVisible] = useState(false);

    // Reference for shoe size input
    const shoeSizeInputRef = React.useRef<TextInput>(null);

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
                    style={styles.pickerWrapper}
                    onPress={() => setVisible(true)}
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
                    style={styles.pickerWrapper}
                    onPress={() => setVisible(true)}
                >
                    <Text style={styles.pickerText}>
                        {value
                            ? items.find(item => item.value === value)?.label || value
                            : placeholder
                        }
                    </Text>
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
            >
                <View style={styles.container}>
                    <View style={styles.inputContainer}>
                        <Text style={styles.label}>Clothing Size</Text>
                        {renderPicker(
                            clothingSize,
                            handleClothingSizeChange,
                            clothingSizeOptions,
                            isClothingSizePickerVisible,
                            setClothingSizePickerVisible,
                            'Select Size'
                        )}
                    </View>

                    <View style={styles.shoeSizeContainer}>
                        <View style={[styles.inputContainer, { flex: 2, marginRight: 10 }]}>
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
        alignItems: 'flex-start',
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
        // marginBottom: 5,
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
    }
});

export default UserDetails;

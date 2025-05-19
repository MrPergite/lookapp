import React, { useEffect, useRef, useState } from 'react';
import {
    View,
    Text,
    Image,
    StyleSheet,
    TouchableOpacity,
    TextInput,
    Pressable,
    Modal,
    ScrollView,
    Linking,
    GestureResponderEvent,
    Platform,
    KeyboardAvoidingView,
    Keyboard
} from 'react-native';
import { X, Send, ExternalLink } from 'lucide-react-native';
import theme from '@/styles/theme';
import { BlurView } from 'expo-blur';
import Animated, {
    FadeIn,
    FadeOut,
} from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';
import { responsiveFontSize } from '@/utils';

// Adjust the Product interface to match what we need
interface ProductCardProps {
    id: string;
    brand?: string;
    name: string;
    price?: string;
    image: string;
    product_info?: any;
    url?: string;
    description?: string;
}

interface ProductDetailCardProps {
    isVisible: boolean;
    onClose: () => void;
    product: ProductCardProps;
    onSendQuestion: (question: string, product: ProductCardProps) => void;
}

const ProductDetailCard: React.FC<ProductDetailCardProps> = ({
    isVisible,
    onClose,
    product,
    onSendQuestion
}) => {
    const [activeIndex, setActiveIndex] = useState(0);
    const [inputText, setInputText] = useState('');
    const inputRef = useRef<TextInput>(null);

    // Focus on text input when modal becomes visible
    useEffect(() => {
        if (isVisible) {
            // Use a small timeout to ensure the input is mounted
            const timer = setTimeout(() => {
                inputRef.current?.focus();
            }, 300); // Wait for modal animation to complete

            return () => clearTimeout(timer);
        }
    }, [isVisible]);

    if (!isVisible) return null;

    const handleDotPress = (index: number) => {
        setActiveIndex(index);
    };

    const handleBuyNow = () => {
        if (product.url) {
            Linking.openURL(product.url).catch((err) =>
                console.error('Error opening product link:', err));
        }
    };

    const handleSendQuestion = () => {
        // Add logic to handle the question
        onSendQuestion(inputText, product);
        // Clear input after sending
        setInputText('');
    };

    const handleOverlayPress = () => {
        onClose();
    };

    const handleModalPress = (e: GestureResponderEvent) => {
        // Prevent closing when clicking on the modal content
        e.stopPropagation();
    };

    return (
        <Modal transparent={true} animationType="fade" visible={isVisible}>
            <KeyboardAvoidingView
                behavior={Platform.OS === "ios" ? "padding" : "height"}
                style={{ flex: 1 }}
            >
                <TouchableOpacity
                    activeOpacity={1}
                    style={styles.overlay}
                    onPress={handleOverlayPress}
                >
                    <Animated.View
                        entering={FadeIn.duration(300)}
                        exiting={FadeOut.duration(300)}
                        style={styles.modalContainer}
                        onStartShouldSetResponder={() => true}
                        onTouchEnd={(e) => handleModalPress(e)}
                    >
                        <ScrollView keyboardShouldPersistTaps="handled" style={styles.scrollView} showsVerticalScrollIndicator={false}>
                            {/* Image section with overlay text */}
                            <View style={styles.imageContainer}>
                                <Image
                                    source={{ uri: product.image }}
                                    style={styles.productImage}
                                    resizeMode="cover"
                                />


                                {/* Gradient overlay and title */}
                                <LinearGradient
                                    colors={['transparent', 'rgba(0,0,0,0.7)']}
                                    style={styles.gradient}
                                >
                                    <Text className='text-xl font-bold mt-1 text-white'>{product.name}</Text>
                                    <Text className='text-sm mt-2 text-white'>Ask a follow-up question about this item:</Text>
                                </LinearGradient>
                            </View>

                            {/* Content section */}
                            <View style={styles.contentContainer}>
                                {/* Ask question section */}
                                <View style={styles.questionContainer}>
                                    <View style={styles.inputContainer}>
                                        <TextInput
                                            ref={inputRef}
                                            placeholder="e.g. Find me this but in blue..."
                                            placeholderTextColor="#6B7280"
                                            value={inputText}
                                            onChangeText={setInputText}
                                            onSubmitEditing={handleSendQuestion}
                                            className='flex h-12 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 flex-1'
                                        />
                                        <Pressable
                                            disabled={inputText.length === 0}
                                            onPress={handleSendQuestion}
                                            style={[styles.sendButton, { opacity: inputText.length === 0 ? 0.5 : 1 }]}
                                        >
                                            <Send onPress={handleSendQuestion} disabled={inputText.length === 0} size={20} color="white" />
                                        </Pressable>
                                    </View>
                                </View>
                            </View>
                        </ScrollView>
                    </Animated.View>
                </TouchableOpacity>
            </KeyboardAvoidingView>
        </Modal>
    );
};

const styles = StyleSheet.create({
    overlay: {
        flex: 1,
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    scrollView: {
        width: '100%',
    },
    modalContainer: {
        width: '90%',
        maxHeight: '80%',
        backgroundColor: theme.colors.primary.white,
        borderRadius: 24,
        overflow: 'hidden',
    },
    imageContainer: {
        width: '100%',
        height: 500, // Increased height to match screenshot
        position: 'relative',
    },
    productImage: {
        width: '100%',
        height: '100%',
    },
    closeButton: {
        position: 'absolute',
        top: 16,
        right: 16,
        zIndex: 10,
    },
    blurButton: {
        width: 40,
        height: 40,
        borderRadius: 20,
        justifyContent: 'center',
        alignItems: 'center',
        overflow: 'hidden',
        backgroundColor: 'rgba(0, 0, 0, 0.4)',
    },
    dotsContainer: {
        position: 'absolute',
        bottom: 90, // Moved up to make room for the title
        width: '100%',
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
        zIndex: 5,
    },
    dot: {
        width: 8,
        height: 8,
        borderRadius: 4,
        backgroundColor: 'rgba(255, 255, 255, 0.5)',
        marginHorizontal: 4,
    },
    activeDot: {
        backgroundColor: theme.colors.primary.white,
        width: 10,
        height: 10,
        borderRadius: 5,
    },
    gradient: {
        position: 'absolute',
        left: 0,
        right: 0,
        bottom: 0,
        height: 170, // Height of gradient overlay
        justifyContent: 'flex-end',
        paddingHorizontal: 20,
        paddingBottom: 20,
    },
    overlayBrand: {
        color: '#ffffff',
        fontSize: 14,
        textTransform: 'uppercase',
        fontFamily: 'default-medium',
    },
    overlayTitle: {
        color: '#ffffff',
        fontSize: 28,
        fontFamily: 'default-bold',
        marginVertical: 6,
    },
    overlayPrice: {
        color: '#ffffff',
        fontSize: 22,
        fontFamily: 'default-semibold',
        marginBottom: 10,
    },
    contentContainer: {
        padding: 20,
    },
    questionContainer: {
        marginTop: 4,
    },
    questionText: {
        fontFamily: 'default-medium',
        color: theme.colors.primary.white,
        marginBottom: 12,
        fontSize: 18,
    },
    inputContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 16,
        gap: responsiveFontSize(8),
    },
    input: {
        flex: 1,
        // height: 56,
        borderWidth: 1,
        borderColor: theme.colors.secondary.mediumLightGray,
        borderRadius: 12,
        paddingHorizontal: 16,
        fontFamily: 'default-regular',
        fontSize: responsiveFontSize(14),
        marginRight: 8,
    },
    sendButton: {
        width: 36,
        height: 36,
        backgroundColor: theme.colors.primary.purple,
        borderRadius: 6,
        justifyContent: 'center',
        alignItems: 'center',
    },
    disclaimer: {
        textAlign: 'center',
        fontSize: 14,
        color: theme.colors.secondary.darkGray,
        fontFamily: 'default-regular',
        marginBottom: 16,
        paddingHorizontal: 20,
    }
});

export default ProductDetailCard; 
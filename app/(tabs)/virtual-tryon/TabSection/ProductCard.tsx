import React, { useEffect, useRef, useState } from "react";
import { Loader2, ShoppingCart } from "lucide-react-native";
import { useAuth } from "@clerk/clerk-react";
import { Easing, Linking, StyleSheet, Text, TouchableOpacity, TouchableWithoutFeedback, View } from "react-native";
import { MotiView } from "moti";
import { responsiveFontSize } from "@/utils";
import { LinearGradient } from "expo-linear-gradient";
import { Image } from 'expo-image';

interface IProduct {
    id: number;
    title: string;
    img_url: string;
    resultImage: string;
    product_link: string;
}

interface IProductCardProps {
    product: IProduct;
    isSelected: boolean;
    onSelect: (product: IProduct) => void;
    isLoading: boolean;
    id: string;
    state: string;
    isDisabled: boolean;
}

const ProductCard = ({
    product,
    isSelected,
    onSelect,
    isLoading,
    id,
    state,
    isDisabled,
}: IProductCardProps) => {
    const [progress, setProgress] = useState(0);
    const [showBuyButton, setShowBuyButton] = useState(false);
    const { isSignedIn } = useAuth();

    // Hide buy button when product is selected
    useEffect(() => {
        if (isSelected) {
            setShowBuyButton(false);
        }
    }, [isSelected]);

    useEffect(() => {
        if (isLoading) {
            setProgress(0);
            const duration = isSignedIn ? 10000 : 2000; // 10 seconds for signed in, 2 seconds for logged out
            const interval = 100; // Update every 100ms
            const steps = duration / interval;
            const increment = 100 / steps;

            const timer = setInterval(() => {
                setProgress((prev) => {
                    if (prev >= 100) {
                        clearInterval(timer);
                        return 100;
                    }
                    return prev + increment;
                });
            }, interval);

            return () => clearInterval(timer);
        } else {
            setProgress(0);
        }
    }, [isLoading, isSignedIn]);

    // Combine disabled state for styling
    const isCardDisabled = isDisabled && !isSelected;

    return (
        <TouchableWithoutFeedback
            onPress={() => {
                onSelect(product);
                setShowBuyButton(false);
            }}
        >
            <View
                style={[
                    styles.productCard,
                    isSelected && styles.selectedStyle,
                    !isSelected && { backgroundColor: '#f3f4f6' },
                    { padding: responsiveFontSize(12) }
                ]}
                id={state === "logged-out" ? id : ""}
            >
                <View className="relative w-14 h-14 sm:w-20 sm:h-20">
                    <TouchableOpacity
                        activeOpacity={0.9}
                        onPress={(e) => {
                            e.stopPropagation();
                            if (!isLoading && !isCardDisabled && isSignedIn) {
                                setShowBuyButton(true);
                            }
                        }}
                    >
                        <Image
                            source={{ uri: product.img_url }}
                            style={{ width: '100%', height: '100%', borderRadius: 8 }}
                        />
                    </TouchableOpacity>
                    {isLoading && (
                        <MotiView
                            style={styles.loadingStyle}
                            from={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                        >
                            <MotiView
                                from={{ rotate: '0deg' }}
                                animate={{ rotate: '360deg' }}
                                transition={{
                                    loop: true,
                                    type: 'timing',
                                    duration: 1000,
                                    easing: Easing.linear,
                                }}
                            >
                                <Loader2 color="white" size={responsiveFontSize(24)} />
                            </MotiView>
                        </MotiView>
                    )}
                </View>
                <Text
                    numberOfLines={1}
                    style={styles.productTitle}
                    className="text-xs sm:text-sm text-center font-medium text-gray-700 dark:text-gray-200 mt-1 truncate w-full max-w-[200px] lg:max-w-[250px]]"
                >
                    {product.title}
                </Text>

                {showBuyButton && !isLoading && !isCardDisabled && isSignedIn && (
                    <View style={styles.buyButtonContainer}>
                        <LinearGradient
                            colors={['#a855f7', '#ec4899']}
                            start={{ x: 0, y: 0 }}
                            end={{ x: 1, y: 0 }}
                            style={styles.gradientOverlay}
                        >
                            <TouchableOpacity
                                onPress={(e) => {
                                    e.stopPropagation();
                                    if (product.product_link) {
                                        Linking.openURL(product.product_link);
                                    }
                                }}
                                style={styles.buyButton}
                            >
                                <ShoppingCart size={responsiveFontSize(16)} color="white" />
                                <Text style={styles.buyButtonText}>Buy</Text>
                            </TouchableOpacity>
                        </LinearGradient>
                    </View>
                )}
            </View>
        </TouchableWithoutFeedback>
    );
};

const styles = StyleSheet.create({
    selectedStyle: {
        flexShrink: 0,
        flexDirection: 'column',
        alignItems: 'center',
        backgroundColor: '#dbeafe',     // Tailwind's bg-blue-100
        borderRadius: 12,               // rounded-xl
        borderWidth: 2,                 // ring-2
        borderColor: '#3b82f6',         // ring-blue-500
        position: 'relative',
    },
    loadingStyle: {
        position: 'absolute',
        top: 0,
        right: 0,
        bottom: 0,
        left: 0,                      // inset-0
        backgroundColor: 'rgba(0, 0, 0, 0.5)', // bg-black/50
        borderRadius: 8,             // rounded-lg
        justifyContent: 'center',
        alignItems: 'center',
    },
    productTitle: {
        fontSize: responsiveFontSize(12),              // text-xs
        textAlign: 'center',       // text-center
        fontWeight: '500',         // font-medium
        color: '#374151',          // text-gray-700
        marginTop: 4,              // mt-1
        width: '100%',
    },
    productCard: {
        flexShrink: 0,
        flexDirection: 'column',
        alignItems: 'center',
        borderRadius: 12,         // rounded-xl
        position: 'relative',     // relative
    },
    gradientOverlay: {
        borderRadius: 999,
        paddingHorizontal: responsiveFontSize(12),
        paddingVertical: responsiveFontSize(6),
    },
    buyButtonContainer: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        justifyContent: 'center',
        alignItems: 'center',
        zIndex: 5,
    },
    buyButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 6,
    },
    buyButtonText: {
        color: 'white',
        fontWeight: 'bold',
        fontSize: responsiveFontSize(12),
    }
});

export default ProductCard;
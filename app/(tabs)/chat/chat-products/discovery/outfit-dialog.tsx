import React, { useState, useEffect, useRef } from 'react';
import {
    Modal,
    View,
    Text,
    ActivityIndicator,
    Pressable,
    StyleSheet,
    Dimensions,
    ScrollView,
    Linking,
    Animated,
    ViewStyle,
} from 'react-native';
import { Image } from 'expo-image';
import { LinearGradient } from "expo-linear-gradient";
import Feather from 'react-native-vector-icons/Feather';
import { useAuth, useClerk } from '@clerk/clerk-react';
// import usePostHog from '../common/hooks/postHog';
// import { useFetchWithRateLimit } from '../common/customFetch';
import { Easing } from 'react-native';
import { Product } from '../context';
import { AuthModal } from "@/components";
import { router } from 'expo-router';
import * as Haptics from 'expo-haptics';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

// ProductCard RN conversion
export const ProductCard: React.FC<{
    item: any;
    onAddToWishlist: (item: any) => void;
    isThisItemAdding: boolean;
    onRequestAuth: () => void;
    saveShoppingItemConfig: {
        savedProducts: Record<string, boolean>;
        savingProducts: Record<string, boolean>;
        saveSuccess: Record<string, boolean>;
        saveError: Record<string, boolean>;
        saveShoppingItem: ({ products, productId, fetchedProductInfo ,source}: { products: Product[], productId: string, fetchedProductInfo: boolean,source: string }) => void;
        isPending: boolean;
    };
    animationDelayIndex: number; // For staggered animation
    isLastItem: boolean; // For conditional styling (e.g., margin)
}> = ({ item, onAddToWishlist, isThisItemAdding, onRequestAuth, saveShoppingItemConfig, animationDelayIndex, isLastItem }) => {
    const cardAnimation = useRef(new Animated.Value(0)).current;
    const imageScale = useRef(new Animated.Value(1)).current;
    const wishlistButtonScale = useRef(new Animated.Value(1)).current;
    const buyNowButtonScale = useRef(new Animated.Value(1)).current;
    
    // Heart animation for wishlist
    const heartSize = useRef(new Animated.Value(1)).current;
    const heartOpacity = useRef(new Animated.Value(0)).current;
    
    const [isCardAnimationComplete, setIsCardAnimationComplete] = useState(false);
    const [, forceRenderProductCard] = useState(0);
    
    useEffect(() => {
        cardAnimation.setValue(0); 
        setIsCardAnimationComplete(false); 

        Animated.timing(cardAnimation, { 
            toValue: 1, 
            duration: 400, 
            delay: animationDelayIndex * 120, 
            useNativeDriver: true 
        }).start(() => {
            setIsCardAnimationComplete(true); 
            forceRenderProductCard(n => n + 1); 
        });
    }, [animationDelayIndex]);
    
    // Opacity is now handled by isCardAnimationComplete in cardStyle, so cardAnimation can focus on transform
    // useEffect for isCardAnimationComplete is implicitly handled by its use in cardStyle

    // Handle wishlist success animation
    useEffect(() => {
        if (saveShoppingItemConfig?.saveSuccess[item.product_id]) {
            Animated.sequence([
                // Heart grows and becomes visible
                Animated.parallel([
                    Animated.timing(heartSize, {
                        toValue: 1.5,
                        duration: 300,
                        useNativeDriver: true,
                    }),
                    Animated.timing(heartOpacity, {
                        toValue: 1,
                        duration: 300,
                        useNativeDriver: true,
                    }),
                ]),
                // Heart returns to normal size
                Animated.timing(heartSize, {
                    toValue: 1,
                    duration: 200,
                    useNativeDriver: true,
                }),
            ]).start();
        }
    }, [saveShoppingItemConfig?.saveSuccess, item.product_id]);

    const [imageLoaded, setImageLoaded] = useState(false);
    const [imageError, setImageError] = useState(false);
    const { isSignedIn } = useAuth();
    const { openSignUp } = useClerk();
    
    const isSaved = saveShoppingItemConfig?.savedProducts[item.product_id] || false;
    const isSaving = saveShoppingItemConfig?.savingProducts[item.product_id] || false;
    const isSuccess = saveShoppingItemConfig?.saveSuccess[item.product_id] || false;
    const isError = saveShoppingItemConfig?.saveError[item.product_id] || false;
    
    const [wishlistButtonText, setWishlistButtonText] = useState('Wishlist');
    const [wishlistIconName, setWishlistIconName] = useState<"heart" | "check">('heart');

    useEffect(() => {
        if (isSuccess) {
            setWishlistButtonText('Added!');
            setWishlistIconName('check');
            const timer = setTimeout(() => {
                setWishlistButtonText('Wishlisted');
                setWishlistIconName('heart'); // Revert to heart for wishlisted state
            }, 1500); // Show "Added!" for 1.5 seconds
            return () => clearTimeout(timer);
        } else if (isSaved) {
            setWishlistButtonText('Wishlisted');
            setWishlistIconName('heart');
        } else if (isSaving) {
            setWishlistButtonText('Adding...');
            setWishlistIconName('heart');
        } else {
            setWishlistButtonText('Wishlist');
            setWishlistIconName('heart');
        }
    }, [isSuccess, isSaved, isSaving]);
    
    // Handle image hover/focus effect
    const handleImagePressIn = () => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        Animated.spring(imageScale, {
            toValue: 1.05,
            friction: 7,
            tension: 40,
            useNativeDriver: true
        }).start();
    };
    
    const handleImagePressOut = () => {
        Animated.spring(imageScale, { toValue: 1, friction: 7, tension: 40, useNativeDriver: true }).start();
    };

    // Wishlist Button Press Handlers
    const handleWishlistPressIn = () => {
        Animated.spring(wishlistButtonScale, { toValue: 0.95, friction: 5, tension: 40, useNativeDriver: true }).start();
    };
    const handleWishlistPressOut = () => {
        Animated.spring(wishlistButtonScale, { toValue: 1, friction: 5, tension: 40, useNativeDriver: true }).start();
    };

    // Buy Now Button Press Handlers
    const handleBuyNowPressIn = () => {
        Animated.spring(buyNowButtonScale, { toValue: 0.95, friction: 5, tension: 40, useNativeDriver: true }).start();
    };
    const handleBuyNowPressOut = () => {
        Animated.spring(buyNowButtonScale, { toValue: 1, friction: 5, tension: 40, useNativeDriver: true }).start();
    };

    const handleAddToWishlistInternal = (item: any) => {
        if (!isSignedIn) {
            onRequestAuth();
            return;
        }
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
        const payload = {
            data: { product_id: item?.product_id, source: "discovery" },
            metadata: { title: item.name, product_link: item.link, img_url: item.image, product_price: item.price, brand: item.brand },
            info: { fetchedProductInfo: false },
        };
        saveShoppingItemConfig.saveShoppingItem({products: [item], productId: item.product_id, fetchedProductInfo: false, source: "discovery"});
    };

    const handleBuyNow = () => {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        Linking.openURL(item.link || '#');
    };
    
    const animatedCardEntryStyle: Animated.AnimatedProps<ViewStyle> = {
        opacity: cardAnimation,
        transform: [
            { translateY: cardAnimation.interpolate({ inputRange: [0, 1], outputRange: [50, 0] })},
            { scale: cardAnimation } 
        ],
        marginRight: isLastItem ? 0 : 12,
    };

    const finalCardStaticStyle: ViewStyle = {
        opacity: 1,
        transform: [{ translateY: 0 }, { scale: 1 }],
        marginRight: isLastItem ? 0 : 12,
    };

    const currentCardAnimatedStyle = isCardAnimationComplete ? finalCardStaticStyle : animatedCardEntryStyle;

    const imageContainerStyle = { transform: [{ scale: imageScale }] };
    const heartAnimationStyle = { opacity: heartOpacity };
    const heartScaleStyle = { transform: [{ scale: heartSize }] };
    
    // Create separate animation styles for each button
    const wishlistButtonAnimationStyle = {
        transform: [{ scale: wishlistButtonScale }]
    };
    const buyNowButtonAnimationStyle = {
        transform: [{ scale: buyNowButtonScale }]
    };

    return (
        <Animated.View style={[
            styles.productCard,
            currentCardAnimatedStyle
        ]}>
            <Pressable onPressIn={handleImagePressIn} onPressOut={handleImagePressOut}>
                <Animated.View style={[styles.productImageWrapper, imageContainerStyle]}>
                    {!imageLoaded && !imageError && (
                        <View style={styles.imagePlaceholder}>
                            <ActivityIndicator size="small" color="#E5E7EB" />
                        </View>
                    )}
                    <Image
                        source={{ uri: item.image || item.img_url }}
                        style={styles.productImage}
                        contentFit="cover"
                        onLoad={(event) => {
                            console.log('[ProductCard] Image onLoad triggered for:', item.image || item.img_url, 'Event Source:', event.source);
                            setImageLoaded(true);
                            setImageError(false);
                        }}
                        onError={(error) => {
                            console.error('[ProductCard] Image onError for:', item.image || item.img_url, 'Error:', error.error);
                            setImageError(true);
                            setImageLoaded(true);
                        }}
                        transition={300}
                    />
                    {(isSuccess || isSaved) && (
                        <View style={{
                            position: 'absolute', top: 0, left: 0, right: 0, bottom: 0,
                            justifyContent: 'center', alignItems: 'center', backgroundColor: 'rgba(0,0,0,0.3)'
                        }}>
                            <Animated.View style={[heartScaleStyle]}>
                                <Animated.View style={[heartAnimationStyle]}>
                                    <Feather name="heart" size={40} color="#ec4899" />
                                </Animated.View>
                            </Animated.View>
                        </View>
                    )}
                </Animated.View>
            </Pressable>
            <View style={styles.productInfo}>
                <Text style={styles.productPrice}>{item.price || '$0.00'}</Text>
                {item.brand && (
                    <Text style={styles.productBrand} numberOfLines={1}>{item.brand.toUpperCase()}</Text>
                )}
                <View style={styles.productButtons}>
                    <Pressable
                        onPress={() => handleAddToWishlistInternal(item)}
                        onPressIn={handleWishlistPressIn}
                        onPressOut={handleWishlistPressOut}
                        disabled={isSaving || isSaved || isSuccess}
                    >
                        <Animated.View style={[styles.wishlistBtnView, (isSaved || isSuccess) && styles.wishlistBtnViewSaved, wishlistButtonAnimationStyle]}>
                            <View style={styles.wishlistContent}>
                                <Feather name={wishlistIconName} size={14} color={isSaved || isSaving || isSuccess ? '#9334e9' : '#020817'} />
                                <Text style={[styles.wishlistText, (isSaved || isSuccess) && styles.wishlistTextSaved]}>
                                    {wishlistButtonText}
                                </Text>
                            </View>
                        </Animated.View>
                    </Pressable>
                    <Pressable
                        onPress={handleBuyNow}
                        onPressIn={handleBuyNowPressIn}
                        onPressOut={handleBuyNowPressOut}
                    >
                        <Animated.View style={[styles.buyBtnView, buyNowButtonAnimationStyle]}>
                            <LinearGradient
                                colors={['#8B5CF6', '#EC4899', '#3B82F6']}
                                start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
                                style={StyleSheet.absoluteFill}
                            />
                            <View style={styles.buyContent}>
                                <Feather name="external-link" size={14} color="#FFF" />
                                <Text style={styles.buyText}>Buy Now</Text>
                            </View>
                        </Animated.View>
                    </Pressable>
                </View>
            </View>
        </Animated.View>
    );
};

// OutfitDialog RN conversion
export const OutfitDialog = ({
    open,
    onClose,
    outfitImage,
    outfitName = 'Outfit',
    items = [],
    saveShoppingItemConfig
}: {
    open: boolean;
    onClose: () => void;
    outfitImage?: string;
    outfitName?: string;
    items?: any[];
    saveShoppingItemConfig: {
        savedProducts: Record<string, boolean>;
        savingProducts: Record<string, boolean>;
        saveSuccess: Record<string, boolean>;
        saveError: Record<string, boolean>;
        saveShoppingItem: (item: any) => void;
        isPending: boolean;
    }
}) => {
    // Remove image carousel variables and handlers
    const [imageLoaded, setImageLoaded] = useState(false);
    const [imageError, setImageError] = useState(false);
    const { isSignedIn } = useAuth();
    const { openSignUp } = useClerk();
    const [addingItemId, setAddingItemId] = useState<string | null>(null);
    const [showAuthModalInDialog, setShowAuthModalInDialog] = useState(false);
    
    // Animation values
    const dialogAnimation = useRef(new Animated.Value(0)).current;
    const fadeAnimation = useRef(new Animated.Value(0)).current;
    const imageAnimation = useRef(new Animated.Value(0)).current;
    const titleAnimation = useRef(new Animated.Value(0)).current; // For outfit title
    const itemsAnimation = useRef(new Animated.Value(0)).current;
    const itemsHeaderAnimation = useRef(new Animated.Value(0)).current; // For "Items in this outfit" header
    const closeButtonAnimation = useRef(new Animated.Value(0)).current; // For Close button entrance
    const closeButtonPressScale = useRef(new Animated.Value(1)).current; // For Close button press effect
    const imageDriftAnimation = useRef(new Animated.Value(0)).current; // For image drift
    const [isItemsAnimationComplete, setIsItemsAnimationComplete] = useState(false); // New state
    
    // Add shimmer animation for loading state
    const shimmerAnim = useRef(new Animated.Value(0)).current;
    const pulseAnim = useRef(new Animated.Value(1)).current;
    
    // Run animations when dialog opens
    useEffect(() => {
        if (open) {
            // Reset animations
            dialogAnimation.setValue(0);
            fadeAnimation.setValue(0);
            imageAnimation.setValue(0);
            titleAnimation.setValue(0);
            itemsAnimation.setValue(0);
            itemsHeaderAnimation.setValue(0);
            closeButtonAnimation.setValue(0);
            setIsItemsAnimationComplete(false); // Reset on open

            // Dialog entry animation sequence
            Animated.parallel([
                Animated.timing(fadeAnimation, { toValue: 1, duration: 300, useNativeDriver: true }),
                Animated.timing(dialogAnimation, { toValue: 1, duration: 400, useNativeDriver: true }),
                Animated.timing(closeButtonAnimation, { toValue: 1, duration: 300, delay: 200, useNativeDriver: true })
            ]).start();
            
            // Sequentially animate the content after dialog appears
            Animated.stagger(100, [ 
                Animated.timing(imageAnimation, { toValue: 1, duration: 400, useNativeDriver: true }),
                Animated.timing(titleAnimation, { toValue: 1, duration: 300, useNativeDriver: true }),
                Animated.parallel([
                    Animated.timing(itemsHeaderAnimation, { toValue: 1, duration: 300, useNativeDriver: true }),
                    Animated.timing(itemsAnimation, { toValue: 1, duration: 400, useNativeDriver: true }),
                ])
            ]).start(() => {
                setIsItemsAnimationComplete(true); // Set complete when this sequence finishes
            });
        }
    }, [open, dialogAnimation, fadeAnimation, imageAnimation, itemsAnimation, titleAnimation, itemsHeaderAnimation, closeButtonAnimation]);
    
    // Start shimmer animation loop
    useEffect(() => {
        if (!imageLoaded && outfitImage) {
            // Create shimmer effect
            Animated.loop(
                Animated.sequence([
                    Animated.timing(shimmerAnim, {
                        toValue: 1,
                        duration: 1000,
                        useNativeDriver: true,
                    }),
                    Animated.timing(shimmerAnim, {
                        toValue: 0,
                        duration: 1000,
                        useNativeDriver: true,
                    }),
                ])
            ).start();
            
            // Create pulse animation
            Animated.loop(
                Animated.sequence([
                    Animated.timing(pulseAnim, {
                        toValue: 1.05,
                        duration: 800,
                        useNativeDriver: true,
                    }),
                    Animated.timing(pulseAnim, {
                        toValue: 1,
                        duration: 800,
                        useNativeDriver: true,
                    }),
                ])
            ).start();
        }
        // Start image drift animation once image is loaded
        if (imageLoaded && outfitImage) {
            Animated.loop(
                Animated.sequence([
                    Animated.timing(imageDriftAnimation, {
                        toValue: 1, // Drift to one side
                        duration: 7000, // Slow drift
                        useNativeDriver: true,
                        easing: Easing.bezier(0.42, 0, 0.58, 1), // Ease in-out
                    }),
                    Animated.timing(imageDriftAnimation, {
                        toValue: -1, // Drift to the other side
                        duration: 7000,
                        useNativeDriver: true,
                        easing: Easing.bezier(0.42, 0, 0.58, 1),
                    }),
                    Animated.timing(imageDriftAnimation, {
                        toValue: 0, // Drift back to center
                        duration: 7000,
                        useNativeDriver: true,
                        easing: Easing.bezier(0.42, 0, 0.58, 1),
                    }),
                ])
            ).start();
        }
        // Cleanup: Stop animation on unmount or when image is no longer loaded
        return () => {
            imageDriftAnimation.stopAnimation();
        };
    }, [imageLoaded, outfitImage, shimmerAnim, pulseAnim, imageDriftAnimation]);
    
    // Shimmer gradient interpolation
    const shimmerTranslate = shimmerAnim.interpolate({
        inputRange: [0, 1],
        outputRange: [-SCREEN_WIDTH, SCREEN_WIDTH],
    });
    
    const loadingStyles = {
        transform: [{ scale: pulseAnim }]
    };
    
    // Handle close with animation
    const handleAnimatedClose = () => {
        // Trigger haptic feedback
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
        
        Animated.parallel([
            Animated.timing(fadeAnimation, {
                toValue: 0,
                duration: 250,
                useNativeDriver: true,
            }),
            Animated.timing(dialogAnimation, {
                toValue: 0,
                duration: 300,
                useNativeDriver: true,
            }),
        ]).start(() => {
            onClose();
        });
    };

    const handleCloseButtonPressIn = () => {
        Animated.spring(closeButtonPressScale, {
            toValue: 0.85,
            friction: 5,
            useNativeDriver: true,
        }).start();
    };

    const handleCloseButtonPressOut = () => {
        Animated.spring(closeButtonPressScale, {
            toValue: 1,
            friction: 5,
            useNativeDriver: true,
        }).start();
        // Call the animated close after the press out animation completes or immediately
        handleAnimatedClose(); 
    };

    const handleRequestAuth = () => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        setShowAuthModalInDialog(true);
    };

    // Limit to first 3 items or dummies
    const displayItems = (items.length ? items : []).slice(0, 3);
    const displayImage = outfitImage;
    
    // Transform styles for animations
    const overlayStyle = {
        opacity: fadeAnimation,
    };
    
    const dialogStyle = {
        opacity: dialogAnimation,
        transform: [
            { scale: dialogAnimation.interpolate({
                inputRange: [0, 1],
                outputRange: [0.9, 1]
            })},
        ],
    };
    
    const imageContainerStyle = {
        opacity: imageAnimation,
        transform: [
            { translateY: imageAnimation.interpolate({
                inputRange: [0, 1],
                outputRange: [-20, 0] // Slide down effect
            })},
        ],
    };
    
    const titleStyle = {
        opacity: titleAnimation,
        transform: [
            { translateY: titleAnimation.interpolate({
                inputRange: [0, 1],
                outputRange: [10, 0] // Slide up slightly
            })}
        ]
    };

    const itemsHeaderStyle = {
        opacity: itemsHeaderAnimation,
        transform: [
            { translateY: itemsHeaderAnimation.interpolate({
                inputRange: [0, 1],
                outputRange: [20, 0] // Slide up effect
            })}
        ]
    };

    const itemsSectionAnimatedStyle = {
        opacity: isItemsAnimationComplete ? 1 : itemsAnimation,
        transform: [
            { translateY: itemsAnimation.interpolate({
                inputRange: [0, 1],
                outputRange: [20, 0]
            })},
        ],
    };
    
    const closeButtonStyle = {
        opacity: closeButtonAnimation,
        transform: [
            { scale: closeButtonAnimation.interpolate({
                inputRange: [0, 1],
                outputRange: [0.7, 1]
            })},
            { scale: closeButtonPressScale }
        ]
    };

    return (
        <Modal visible={open} transparent animationType="none" onRequestClose={handleAnimatedClose}>
            <Animated.View style={[styles.modalOverlay, overlayStyle]}>
                <Animated.View style={[styles.dialogContainer, dialogStyle]}>
                    {/* Top section - Outfit Image */}
                    <Animated.View style={[styles.outfitImageSection, imageContainerStyle]}>
                        <View style={styles.imageFrame}>
                            {!imageLoaded && !imageError && displayImage && (
                                <View style={styles.loadingContainer}>
                                    <Animated.View style={loadingStyles}>
                                        <ActivityIndicator size="large" color="#8B5CF6" />
                                    </Animated.View>
                                    
                                    {/* Shimmer effect */}
                                    <Animated.View style={[
                                        StyleSheet.absoluteFill,
                                        {
                                            backgroundColor: 'transparent',
                                            overflow: 'hidden',
                                        }
                                    ]}>
                                        <Animated.View style={{
                                            width: '100%',
                                            height: '100%',
                                            position: 'absolute',
                                            backgroundColor: 'transparent',
                                            transform: [{ translateX: shimmerTranslate }],
                                        }}>
                                            <LinearGradient
                                                colors={['transparent', 'rgba(255,255,255,0.3)', 'transparent']}
                                                start={{ x: 0, y: 0.5 }}
                                                end={{ x: 1, y: 0.5 }}
                                                style={{ width: '100%', height: '100%' }}
                                            />
                                        </Animated.View>
                                    </Animated.View>
                                </View>
                            )}
                            
                            {(!displayImage || imageError) && (
                                <View style={styles.errorContainer}>
                                    <Feather name="image" size={48} color="#9CA3AF" />
                                    <Text style={styles.errorText}>Outfit image not available</Text>
                                </View>
                            )}
                            
                            {displayImage && (
                                <Pressable
                                    onPressIn={() => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)}
                                >
                                    <Animated.View
                                        style={{
                                            width: '100%', 
                                            height: '100%',
                                            transform: [
                                                {
                                                    translateX: imageDriftAnimation.interpolate({
                                                        inputRange: [-1, 1],
                                                        outputRange: [-SCREEN_WIDTH * 0.02, SCREEN_WIDTH * 0.02], 
                                                    }),
                                                },
                                            ],
                                        }}
                                    >
                                        <Image
                                            source={{ uri: displayImage }}
                                            style={{ width: '100%', height: '100%' }}
                                            contentFit="contain"
                                            onLoad={(event) => {
                                                console.log('[OutfitDialog] Image onLoad triggered for:', displayImage, 'Event Source:', event.source);
                                                setImageLoaded(true);
                                                setImageError(false);
                                            }}
                                            onError={(error) => {
                                                console.error('[OutfitDialog] Image onError for:', displayImage, 'Error:', error.error);
                                                setImageError(true);
                                                setImageLoaded(true);
                                            }}
                                            transition={300}
                                        />
                                    </Animated.View>
                                </Pressable>
                            )}
                        </View>
                        
                        {/* Overlay gradient for title */}
                        <LinearGradient
                            colors={['transparent', 'rgba(0,0,0,0.7)']}
                            style={styles.titleGradient}
                        >
                            <Animated.Text style={[styles.outfitTitle, titleStyle]}>{outfitName}</Animated.Text>
                        </LinearGradient>
                        
                        {/* Close button */}
                        <Animated.View style={[styles.closeButton, closeButtonStyle]}> 
                            <Pressable 
                                onPressIn={handleCloseButtonPressIn}
                                onPressOut={handleCloseButtonPressOut}
                                style={styles.closeButtonPressable} 
                            >
                                <Feather name="x" size={20} color="#FFF" />
                            </Pressable>
                        </Animated.View>
                    </Animated.View>
                    
                    {/* Bottom section - Items */}
                    <Animated.View style={[styles.itemsSection, itemsSectionAnimatedStyle]}>
                        {displayItems.length > 0 ? (
                            <>
                                <Animated.Text style={[styles.itemsHeader, itemsHeaderStyle]}>Items in this outfit</Animated.Text>
                                <ScrollView
                                    horizontal
                                    showsHorizontalScrollIndicator={false}
                                    contentContainerStyle={styles.itemsContainer}
                                    style={{ flexGrow: 1 }}
                                >
                                    {displayItems.map((item, index) => {
                                        const itemId = item.product_id || item.id || `item-${index}`;
                                        return (
                                            <ProductCard
                                                key={itemId}
                                                item={item}
                                                isThisItemAdding={addingItemId === itemId}
                                                onRequestAuth={handleRequestAuth}
                                                saveShoppingItemConfig={saveShoppingItemConfig}
                                                onAddToWishlist={() => {}}
                                                animationDelayIndex={index}
                                                isLastItem={index === displayItems.length - 1}
                                            />
                                        );
                                    })}
                                </ScrollView>
                            </>
                        ) : (
                            <View style={styles.emptyItemsContainer}>
                                <Feather name="info" size={24} color="#9CA3AF" />
                                <Text style={styles.emptyItemsText}>Outfit item details are not available.</Text>
                            </View>
                        )}
                    </Animated.View>
                </Animated.View>
            </Animated.View>
            
            {showAuthModalInDialog && (
                <AuthModal
                    isVisible={showAuthModalInDialog}
                    onClose={() => setShowAuthModalInDialog(false)}
                    onSignIn={() => {
                        setShowAuthModalInDialog(false);
                        onClose();
                        router.push("/(authn)/signin");
                    }}
                    onSignUp={() => {
                        setShowAuthModalInDialog(false);
                        onClose();
                        router.push("/(authn)/signup");
                    }}
                />
            )}
        </Modal>
    );
};

const styles = StyleSheet.create({
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.85)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    dialogContainer: {
        width: SCREEN_WIDTH,
        height: SCREEN_HEIGHT * 0.9,
        backgroundColor: 'transparent',
        borderRadius: 0,
        overflow: 'hidden',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 10 },
        shadowOpacity: 0.25,
        shadowRadius: 10,
        elevation: 5,
    },
    outfitImageSection: {
        width: '100%',
        position: 'relative',
        height: '60%',
        backgroundColor: 'rgba(0, 0, 0, 0.85)',
        borderBottomWidth: 0,
    },
    imageFrame: {
        width: '100%',
        height: '100%',
        position: 'relative',
        overflow: 'hidden',
        padding: 0,
        backgroundColor: 'transparent',
    },
    outfitImage: {
        width: '100%',
        height: '100%',
    },
    loadingContainer: {
        ...StyleSheet.absoluteFillObject,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: 'rgba(0,0,0,0.5)',
        zIndex: 5,
    },
    errorContainer: {
        ...StyleSheet.absoluteFillObject,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: 'rgba(26,26,26,0.9)',
        zIndex: 5,
    },
    errorText: {
        color: '#E5E7EB',
        marginTop: 10,
        fontSize: 16,
    },
    titleGradient: {
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        padding: 16,
        zIndex: 10,
    },
    outfitTitle: {
        color: '#FFF',
        fontSize: 20,
        fontWeight: '600',
        textShadowColor: 'rgba(0,0,0,0.5)',
        textShadowOffset: { width: 0, height: 1 },
        textShadowRadius: 4,
    },
    closeButton: {
        position: 'absolute',
        top: 16,
        right: 16,
        zIndex: 10,
    },
    closeButtonPressable: {
        padding: 8,
        backgroundColor: 'rgba(0,0,0,0.4)',
        borderRadius: 16,
    },
    itemsSection: {
        flex: 1,
        paddingVertical: 10,
        height: '40%',
        backgroundColor: '#FFFFFF',
        borderTopLeftRadius: 20,
        borderTopRightRadius: 20,
    },
    itemsContainer: {
        flexDirection: 'row',
        paddingHorizontal: 16,
        paddingBottom: 20,
    },
    itemsHeader: { 
        fontSize: 16, 
        fontWeight: '500', 
        marginBottom: 8, 
        color: '#374151',
        paddingHorizontal: 16,
        paddingTop: 10,
        paddingBottom: 5,
    },
    productCard: { 
        flexDirection: 'column', 
        marginBottom: 8, 
        width: SCREEN_WIDTH * 0.28, 
        paddingBottom: 10, 
        backgroundColor: '#F9F9F9',
        borderRadius: 10,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 }, 
        shadowOpacity: 0.1,
        shadowRadius: 4,   
        elevation: 3,       
        borderWidth: 1,
        borderColor: '#EDEDED',
    },
    productImageWrapper: { 
        width: '100%', 
        aspectRatio: 1, 
        borderTopLeftRadius: 10,
        borderTopRightRadius: 10,
        overflow: 'hidden', 
        backgroundColor: 'transparent',
    },
    productImage: { width: '100%', height: '100%' },
    imagePlaceholder: { ...StyleSheet.absoluteFillObject, justifyContent: 'center', alignItems: 'center', backgroundColor: 'rgba(229,231,235,0.5)' },
    imageError: { ...StyleSheet.absoluteFillObject, justifyContent: 'center', alignItems: 'center', backgroundColor: '#F3F4F6' },
    imageErrorText: { color: '#6B7280' },
    productInfo: { 
        marginTop: 8,
        backgroundColor: 'transparent',
        paddingHorizontal: 8,
        paddingBottom: 8,
    },
    productPrice: { 
        fontSize: 14, 
        fontWeight: '600', 
        color: '#7C3AED', 
        textAlign: 'center',
        marginBottom: 2,
    },
    productBrand: { 
        fontSize: 11,
        fontWeight: '500',
        color: '#6B7280',
        textAlign: 'center', 
        marginBottom: 6,
        paddingHorizontal: 4,
    },
    productButtons: { 
        flexDirection: 'column', 
        marginTop: 8,
        marginBottom: 10,
    },
    
    pressableContainerWishlist: {
        marginTop: 8,
    },
    wishlistBtnView: {
        borderColor: 'transparent', 
        borderRadius: 18,
        height: 32,
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 1,
        overflow: 'hidden',
        boxShadow: "rgba(0, 0, 0, 0.05) 0px 1px 2px",
    },
    wishlistBtnViewSaved: {
        backgroundColor: 'rgba(254,244,250,1)',
        color:'#9334e9',
        borderColor: 'transparent',
    },
    wishlistContent: {
        flexDirection: 'row',
        alignItems: 'center',
       
        boxShadow: "rgba(0, 0, 0, 0.05)"
    },
    wishlistText: { marginLeft: 6, fontSize: 12,  color:'#020817' },
    wishlistTextSaved: {
        color:'#9334e9'
    },

    pressableContainerBuy: {
        marginTop: 6,
    },
    buyBtnView: {
        borderRadius: 18,
        marginTop: 4,
        overflow: 'hidden',
        height: 32,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 5,
    },
    buyContent: {
        flexDirection: 'row',
        alignItems: 'center',
        zIndex: 1,
    },
    buyText: { marginLeft: 6, color: '#FFF', fontSize: 12,lineHeight: 16,fontWeight: '600' },
    emptyItemsContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        padding: 20,
    },
    emptyItemsText: {
        color: '#9CA3AF',
        fontSize: 16,
        fontWeight: '500',
        marginTop: 10,
    },
});

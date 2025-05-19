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
} from 'react-native';
import { Image } from 'expo-image';
import { LinearGradient } from "expo-linear-gradient";
import Feather from 'react-native-vector-icons/Feather';
import { useAuth, useClerk } from '@clerk/clerk-react';
// import usePostHog from '../common/hooks/postHog';
// import { useFetchWithRateLimit } from '../common/customFetch';
import { Animated } from 'react-native';
import { Product } from '../context';
import { AuthModal } from "@/components";
import { router } from 'expo-router';

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
    const anim = useRef(new Animated.Value(0)).current;

    useEffect(() => {
        Animated.timing(anim, { 
            toValue: 1, 
            duration: 300, 
            delay: animationDelayIndex * 100, 
            useNativeDriver: true 
        }).start();
    }, [anim, animationDelayIndex]);

    const animatedCardStyle = {
        opacity: anim,
        transform: [{ translateY: anim.interpolate({ inputRange: [0, 1], outputRange: [10, 0] }) }],
        marginRight: isLastItem ? 0 : 12, // Apply margin to all but the last card
    };

    const [imageLoaded, setImageLoaded] = useState(false);
    const [imageError, setImageError] = useState(false);
    const { isSignedIn } = useAuth();
    const { openSignUp } = useClerk();
    //   const { trackEvent } = usePostHog();
    const isSaved = saveShoppingItemConfig?.savedProducts[item.product_id] || false;

    const isSaving = saveShoppingItemConfig?.savingProducts[item.product_id] || false;
    const isSuccess =   saveShoppingItemConfig?.saveSuccess[item.product_id] || false;
    const isError =     saveShoppingItemConfig?.saveError[item.product_id] || false;
    console.log('isSaved', isSaved, isSaving, isSuccess, isError);
    const handleAddToWishlistInternal = (item: any) => {
        if (!isSignedIn) {
            onRequestAuth();
            return;
        }
        const payload = {
            data: { product_id: item?.product_id, source: "discovery" },
            metadata: { title: item.name, product_link:  item.link, img_url: item.image, product_price: item.price, brand: item.brand },
            info: { fetchedProductInfo:false },
          };
          console.log('payload2', item);
        saveShoppingItemConfig.saveShoppingItem({products: [item], productId: item.product_id, fetchedProductInfo: false,source: "discovery"});
        // trackEvent('Add_To_Wishlist', {
        //   button: 'Add to Wishlist',
        //   source: 'OutfitDialog',
        //   event: 'Click',
        // });
    };

    const handleBuyNow = () => {
        // trackEvent('Buy_Now', {
        //   button: 'Buy Now',
        //   source: 'OutfitDialog',
        //   event: 'Click',
        // });
        // In RN, use Linking
        Linking.openURL(item.link || '#');
    };

    return (
        <Animated.View style={[styles.productCard, animatedCardStyle]}>
            <View style={styles.productImageWrapper}>
                {!imageLoaded && !imageError && (
                    <View style={styles.imagePlaceholder}>
                        <ActivityIndicator size="small" color="#E5E7EB" />
                    </View>
                )}
               <Image
                        source={{ uri: item.image || item.img_url }}
                        style={styles.productImage}
                        contentFit="cover"
                        onLoad={() => setImageLoaded(true)}
                        onError={() => { setImageError(true); setImageLoaded(true); }}
                    />
            </View>
            <View style={styles.productInfo}>
                <Text style={styles.productPrice}>{item.price || '$0.00'}</Text>
                <View style={styles.productButtons}>
                    <Pressable
                        onPress={() => handleAddToWishlistInternal(item)}
                        disabled={ isSaving || isSaved || isSuccess}
                        style={({ pressed }) => [
                            styles.pressableContainerWishlist,
                            { transform: [{ scale: pressed ? 0.98 : 1 }] },
                        ]}
                    >
                        <View style={[styles.wishlistBtnView, (isSaved || isSuccess) && styles.wishlistBtnViewSaved]} >
                            <View style={styles.wishlistContent}>
                                <Feather name="heart" size={14} color={ isSaved || isSaving || isSuccess ? '#9334e9' : '#020817'} />
                                <Text style={[styles.wishlistText, (isSaved || isSuccess) && styles.wishlistTextSaved]}>
                                    {isSaved || isSuccess ? 'Wishlisted' : isSaving ? 'Adding...' : 'Wishlist'}
                                </Text>
                            </View>
                        </View>
                    </Pressable>

                    <Pressable
                        onPress={handleBuyNow}
                        style={({ pressed }) => [
                            styles.pressableContainerBuy,
                            { transform: [{ scale: pressed ? 0.98 : 1 }] },
                        ]}
                    >
                        <View style={styles.buyBtnView}>
                            <LinearGradient
                                colors={['rgb(147, 51, 234)', 'rgb(232, 121, 249)', 'rgb(96, 165, 250)']}
                                start={{ x: 0, y: 0 }}
                                end={{ x: 1, y: 0 }}
                                style={StyleSheet.absoluteFill}
                            />
                            <View style={styles.buyContent}>
                                <Feather name="external-link" size={14} color="#FFF" />
                                <Text style={styles.buyText}>Buy Now</Text>
                            </View>
                        </View>
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
    const [imageLoaded, setImageLoaded] = useState(false);
    const [imageError, setImageError] = useState(false);
    const { isSignedIn } = useAuth();
    const { openSignUp } = useClerk();
    // const { trackEvent } = usePostHog();
    //   const { fetchWithRateLimit } = useFetchWithRateLimit();
    const [addingItemId, setAddingItemId] = useState<string | null>(null);
    const [showAuthModalInDialog, setShowAuthModalInDialog] = useState(false);

    const handleRequestAuth = () => {
        setShowAuthModalInDialog(true);
    };

    const handleAddToWishlistApiCall = async (item: any) => {
        // try {
        //   const payload = { /* ...build payload...*/ };
        //   const resp = await fetchWithRateLimit('/api/users/shoppingListNew', { method: 'POST', body: JSON.stringify(payload) });
        //   if (resp.ok) {
        //     // trackEvent('handle_Save_Shopping_List_API', { button: 'Add to WishList', event: 'Click', state: 'API Success' });
        //     setSavedProducts(prev => ({ ...prev, [item.id]: true }));
        //   } else {
        //     // trackEvent('handle_Save_Shopping_List_API', { button: 'Add to WishList', event: 'Click', state: 'API Failure' });
        //   }
        // } catch {
        //   // trackEvent('handle_Save_Shopping_List_API', { button: 'Add to WishList', event: 'Click', state: 'API Failure' });
        // } finally {
        //   setAddingItemId(null);
        // }
    };

    // Limit to first 3 items or dummies
    const displayItems = (items.length ? items : []).slice(0, 3);
    const displayImage = outfitImage;

    return (
        <Modal visible={open} transparent animationType="fade" onRequestClose={onClose}>
            <View style={styles.modalOverlay}>
                <View style={styles.dialogContainer}>
                    <View style={styles.topRow}>
                        <View style={styles.imagePane}>
                           
                                <Image
                                    source={{ uri: displayImage }}
                                    style={styles.dialogImage}
                                    contentFit="cover"
                                    
                                    onLoad={() => setImageLoaded(true)}
                                    onError={() => { setImageError(true); setImageLoaded(true); }}
                                />
                            
                            <Pressable onPress={onClose} style={styles.closeBtn}>
                                <Feather name="x" size={20} color="#FFF" />
                            </Pressable>
                            <LinearGradient
                                colors={['transparent', 'rgba(0,0,0,0.7)']}
                                style={styles.dialogTitleOverlay}
                            >
                                <Text style={styles.dialogTitle}>{outfitName}</Text>
                            </LinearGradient>
                        </View>

                        <View style={styles.itemsPane}>
                            <Text style={styles.itemsHeader}>Items in this outfit</Text>
                            <ScrollView
                                horizontal
                                showsHorizontalScrollIndicator={false}
                                style={{ paddingHorizontal: 12 }}
                                contentContainerStyle={styles.itemsScrollViewContent}
                            >
                                {displayItems.map((it, idx) => {
                                    // Warn if primary identifiers are missing, for data quality awareness
                                    if (!it.product_id && !it.id) {
                                      console.warn(`OutfitDialog: Item at index ${idx} is missing both product_id and id. This might affect functionality relying on these IDs.`);
                                    }
                                    // Construct a key that is unique even if product_id/id are repeated or missing for different items in the list.
                                    const uniqueItemKey = `${it.product_id || it.id || 'no_id_provided'}-${idx}`;

                                    return (
                                        <ProductCard
                                            key={uniqueItemKey}
                                            item={it}
                                            isThisItemAdding={addingItemId === (it.product_id || it.id)}
                                            onRequestAuth={handleRequestAuth}
                                            saveShoppingItemConfig={saveShoppingItemConfig}
                                            onAddToWishlist={() => {}}
                                            animationDelayIndex={idx}
                                            isLastItem={idx === displayItems.length - 1}
                                        />
                                    );
                                })}
                            </ScrollView>
                        </View>
                    </View>
                </View>
            </View>
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
        backgroundColor: 'rgba(0,0,0,0.5)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    dialogContainer: {
        width: SCREEN_WIDTH * 1,
        maxHeight: SCREEN_HEIGHT * 1,
        height: SCREEN_HEIGHT *0.95,
        backgroundColor: '#FFF',
        borderRadius: 16,
        overflow: 'hidden',
    },
    topRow: { flexDirection: 'column', flex: 1 },
    imagePane: { width: '100%', position: 'relative', aspectRatio: 4/5 },
    dialogImage: { flex: 1, width: '100%', height: '100%' },
    centered: { position: 'absolute', top: '50%', left: '50%' },
    closeBtn: { position: 'absolute', top: 16, right: 16, padding: 8, backgroundColor: 'rgba(0,0,0,0.4)', borderRadius: 16 },
    dialogTitleOverlay: { position: 'absolute', bottom: 0, left: 0, right: 0, padding: 12 },
    dialogTitle: { color: '#FFF', fontSize: 18, fontWeight: '600' },
    itemsPane: { flex: 1, },
    itemsScrollViewContent: {
        flexDirection: 'row',
        paddingBottom: 12,
    },
    itemsHeader: { 
        fontSize: 16, 
        fontWeight: '500', 
        marginBottom: 12, 
        color: '#374151',
        padding: 12,
    },

    // ProductCard styles reused above
    productCard: { flexDirection: 'column', marginBottom: 12, width: SCREEN_WIDTH * 0.30 },
    productImageWrapper: { width: '100%', aspectRatio: 1, borderRadius: 8, overflow: 'hidden' },
    productImage: { width: '100%', height: '100%' },
    imagePlaceholder: { ...StyleSheet.absoluteFillObject, justifyContent: 'center', alignItems: 'center', backgroundColor: 'rgba(229,231,235,0.5)' },
    imageError: { ...StyleSheet.absoluteFillObject, justifyContent: 'center', alignItems: 'center', backgroundColor: '#F3F4F6' },
    imageErrorText: { color: '#6B7280' },
    productInfo: { marginTop: 8 },
    productPrice: { fontSize: 14, fontWeight: '600', color: '#7C3AED', textAlign: 'center' },
    productButtons: { flexDirection: 'column', marginTop: 8 },
    
    pressableContainerWishlist: {
        marginTop: 20,

    },
    wishlistBtnView: {
        borderColor: 'transparent', 
        borderRadius: 18,
        height: 36,
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 1,
        overflow: 'hidden',
        boxShadow: "rgba(0, 0, 0, 0.05) 0px 1px 2px",

    },
    wishlistBtnViewSaved: {
        backgroundColor: 'rgba(254,244,250,1)',
        color:'#9334e9',
        borderColor: 'transparent', // Slightly darker border for saved state
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
        marginTop: 10,
        // No specific layout other than what Pressable defaults to
    },
    buyBtnView: {
        borderRadius: 18,
        marginTop: 10,
        overflow: 'hidden',
        height: 36,
        justifyContent: 'center',
        alignItems: 'center',
        // backgroundColor: 'transparent' or not needed if gradient covers
    },
    buyContent: {
        flexDirection: 'row',
        alignItems: 'center',
        zIndex: 1,
    },
    buyText: { marginLeft: 6, color: '#FFF', fontSize: 12,lineHeight: 16,fontWeight: '600' },
});

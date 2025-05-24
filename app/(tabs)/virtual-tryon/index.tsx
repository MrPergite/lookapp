import React, { useEffect, useState, useCallback, useRef } from 'react'
import { Text, View, SafeAreaView, StyleSheet, TouchableOpacity, Dimensions } from 'react-native';
import { responsiveFontSize } from '@/utils';
import { AnimatePresence, MotiView, MotiText } from 'moti';
import { useAuth, useClerk, useUser } from '@clerk/clerk-expo';
import AvatarSection from './AvatarSection';
import Toast from 'react-native-toast-message';
import { Lock, Coins, X } from 'lucide-react-native';
import { ImageContextType, useImageContext } from '@/common/providers/image-search';
import { useFocusEffect, useRouter } from 'expo-router';
import { useApi } from '@/client-api';
import { AVATARS } from '@/constants';
import { useShoppingList } from './hooks/useShoppingList';
import { LinearGradient } from 'expo-linear-gradient';
import AvatarList from './AvatarList';
import useResetTab from './hooks/useResetTab';
import { Image } from 'expo-image';
import { AvatarStatus } from './AvatarStatusPill';
import CustomAvatarSelectionModal from './CustomAvatarSelectionModal';
import RecreateAvatarModal from './RecreateAvatarModal';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import * as Haptics from 'expo-haptics';

function VirtualTryOn({ route }: { route: any }) {
    const { avatar } = useImageContext() as ImageContextType;
    const { user } = useUser();
    const { isSignedIn } = useAuth();
    const { openSignIn, openSignUp } = useClerk();
    const { callProtectedEndpoint, callPublicEndpoint } = useApi();
    const router = useRouter();
    const [avatarStatusFromUser, setAvatarStatusFromUser] = useState<string>('pending');

    // State variables
    const [selectedProduct, setSelectedProduct] = useState(null);
    const [loadingShoppingProductId, setLoadingShoppingProductId] = useState(null);
    const [outfitName, setOutfitName] = useState("");
    const [showAvatarSelector, setShowAvatarSelector] = useState(false);
    const [savedOutfits, setSavedOutfits] = useState([]);
    const [credits, setCredits] = useState(null);
    const [refreshListTrigger, setRefreshListTrigger] = useState(0);
    const [vtryonImg, setVtryonImg] = useState(null);
    const [activeTab, setActiveTab] = useState('shopping-list');
    const [isFullscreen, setIsFullscreen] = useState(false);
    const [isExpanded, setIsExpanded] = useState(false);
    const [outfitToDelete, setOutfitToDelete] = useState(null);
    const [showModal, setShowModal] = useState(false);
    const [deleting, setIsDeleting] = useState(false);
    const [showAuthDialog, setShowAuthDialog] = useState(false);
    const [originalAvatar, setOriginalAvatar] = useState(null);
    const [topImageId, setTopImageId] = useState(null);
    const [bottomImageId, setBottomImageId] = useState(null);
    const [onePiece, setOnePiece] = useState(null);
    const [runTour, setRunTour] = useState(false);
    const [isFromSavedOutfit, setIsFromSavedOutfit] = useState(false);
    const [avatarStatus, setAvatarStatus] = useState('');
    const [customAvatars, setCustomAvatars] = useState([]);
    const [prefAvatar, setPrefAvatar] = useState({
        id: "AVA7",
        name: "",
        src: "",
    });
    const [isAvatarLoading, setIsAvatarLoading] = useState(false);
    const [isLoadingPrefAvatar, setIsLoadingPrefAvatar] = useState(true);
    const [fetchPrefAvatar, setFetchPrefAvatar] = useState(false);
    const [showCustomAvatarModal, setShowCustomAvatarModal] = useState(false);
    const [isSettingPrefAvatarFromModal, setIsSettingPrefAvatarFromModal] = useState(false);
    const [showRecreateAvatarModal, setShowRecreateAvatarModal] = useState(false);

    // Refs to prevent concurrent API calls
    const hasFetchedCredits = useRef(false);
    const hasFetchedOutfits = useRef(false);

    // Set initial avatar
    const [selectedAvatar, setSelectedAvatar] = useState(avatar);

    // New state for single-item discovery
    const [currentItemIndex, setCurrentItemIndex] = useState(0);
    const [discoveryItems, setDiscoveryItems] = useState([]);

    useFocusEffect(
        useCallback(() => {
            user?.reload(); // optional — triggers a refetch from Clerk backend
        }, [user])
    );

    useResetTab(() => {
        // Force Clerk to refresh user data
        setIsFullscreen(false);
        // setSelectedAvatar({ ...avatar });
        setSelectedProduct(null);
        setTopImageId(null);
        setBottomImageId(null);
        setOnePiece(null);
        setVtryonImg(null);
        setOutfitName("");
        setShowAvatarSelector(false);
        setShowModal(false);
        setOutfitToDelete(null);
        setIsExpanded(false);
        setIsAvatarLoading(false);
        setIsLoadingPrefAvatar(true);
        setOriginalAvatar(null);
        setIsFromSavedOutfit(false);
        setShowAuthDialog(false);
        setShowAvatarSelector(false);
        setShowModal(false);
        setOutfitToDelete(null);
        setIsExpanded(false);
        setActiveTab('shopping-list');
        setRefreshListTrigger(prev => prev + 1);
        setFetchPrefAvatar(!fetchPrefAvatar);
        hasFetchedCredits.current = false;
        hasFetchedOutfits.current = false;
    });

    // Fetch user's credits from the API
    useEffect(() => {
        const fetchCredits = async () => {
            if (hasFetchedCredits.current) return;
            hasFetchedCredits.current = true;

            try {
                const response = await callProtectedEndpoint(`vtonCredits`, {
                    method: "GET",
                });

                setCredits(response?.credits);
            } catch (error: any) {

                Toast.show({
                    type: 'error',
                    text1: error.message,
                    visibilityTime: 2000
                });
            } finally {
                hasFetchedCredits.current = false;
            }
        };

        if (isSignedIn) {
            fetchCredits();
        }
    }, [vtryonImg?.output_images?.[0], isSignedIn, refreshListTrigger]);

    // Fetch saved outfits
    const fetchOutfits = useCallback(async () => {
        if (hasFetchedOutfits.current) return;
        hasFetchedOutfits.current = true;

        try {
            const response = await callProtectedEndpoint(`vtonOutfits`, {
                method: "GET",
                data: {}
            });

            setSavedOutfits(response || []);
        } catch (error) {

            Toast.show({
                type: 'error',
                text1: error.message,
                visibilityTime: 2000
            });
        } finally {
            hasFetchedOutfits.current = false;
        }
    }, []);

    // Fetch outfits when signed in
    useEffect(() => {
        if (isSignedIn) {
            fetchOutfits();
        }
    }, [isSignedIn, fetchOutfits, refreshListTrigger]);

    // Set preferred avatar from user metadata
    useEffect(() => {
        if (user) {
            setIsLoadingPrefAvatar(true);
            const publicMetadata = user?.publicMetadata;
            const prefAvatar = publicMetadata?.pref_avatar_url;
            setAvatarStatusFromUser(publicMetadata?.avatar_creation_status as string || 'pending');
            console.log("publicMetadata : ", publicMetadata);
            setCustomAvatars(publicMetadata?.custom_avatar_urls || []);
            if (prefAvatar) {
                // Preload the preferred avatar image
                const avatarSelected = {
                    id: "AVA7",
                    name: user?.firstName,
                    src: prefAvatar,
                };

                const existingAvatar = AVATARS.find(avatar => avatar.src === prefAvatar);
                if (existingAvatar) {
                    avatarSelected.id = existingAvatar.id;
                }

                // Use setTimeout to ensure smooth transition
                setTimeout(() => {
                    setSelectedAvatar(avatarSelected);
                    setIsLoadingPrefAvatar(false);
                }, 200);
            } else {
                setTimeout(() => {
                    setSelectedAvatar(avatar);
                    setIsLoadingPrefAvatar(false);
                }, 200);
            }
        }
    }, [user, avatar, fetchPrefAvatar, refreshListTrigger]);

    // Save original avatar for reset
    useEffect(() => {
        if (selectedAvatar && !originalAvatar) {
            setOriginalAvatar(selectedAvatar);
        }
    }, [selectedAvatar, originalAvatar]);

    // Reset avatar to original state
    const handleResetAvatar = useCallback(() => {
        if (originalAvatar) {
            setVtryonImg(null);
            setSelectedProduct(null);
            setTopImageId(null);
            setBottomImageId(null);
            setOnePiece(null);

            Toast.show({
                type: 'success',
                text1: 'Avatar has been reset',
                visibilityTime: 2000
            });
        }
    }, [originalAvatar]);

    // Handle deleting an outfit
    const handleDeleteOutfit = useCallback((outfitId) => {
        setSavedOutfits((prev) => prev.filter((outfit) => outfit.id !== outfitId));
    }, []);

    // Try on a product
    const handleProductSelect = async (product, isWardrobe = false) => {
        setIsFromSavedOutfit(false);

        // Check if the product has a valid garment type
        if ((product.garment_type === "none") && isSignedIn) {
            Toast.show({
                type: 'info',
                text1: "This item is currently not supported for virtual try-on",
                visibilityTime: 2000
            });

            return;
        }

        setSelectedProduct(product);

        if (isSignedIn) {

            const apiPayload = {
                avatar_url: vtryonImg ? vtryonImg.output_images[0] : selectedAvatar.src,
                id: product.id,
                base_avatar_id: selectedAvatar.id,
                top_img_id: topImageId,
                bottom_img_id: bottomImageId,
                one_pieces_img_id: onePiece,
            };

            setIsAvatarLoading(true);

            try {
                const response = await callProtectedEndpoint('vtonTryon', {
                    method: "POST",
                    data: apiPayload,
                })

                console.log("response : ", response);

                if (response.status === "success") {
                    if (response?.output_images?.[0]) {
                        setVtryonImg(response);
                        setBottomImageId(response?.bottom_img_id);
                        setTopImageId(response?.top_img_id);
                        setOnePiece(response?.one_pieces_img_id);
                        setRefreshListTrigger(prev => prev + 1);
                    }
                } else {
                    Toast.show({
                        type: 'error',
                        text1: response?.data?.error?.message,
                        visibilityTime: 2000
                    });
                }
            } catch (error) {
                Toast.show({
                    type: 'error',
                    text1: error?.message,
                    visibilityTime: 2000
                });
            } finally {
                setIsAvatarLoading(false);
            }
        } else {
            // For non-signed in users, show loading and then demo image
            setIsAvatarLoading(true);
            setTimeout(() => {
                setSelectedAvatar((prev) => ({
                    ...prev,
                    src: product.resultImage,
                }));
                setIsAvatarLoading(false);
            }, 2000);
        }
    };

    // Select an avatar
    const handleAvatarSelect = (avatar, fromOutfit = false) => {
        if (fromOutfit) {
            setSelectedAvatar(avatar);
        } else {
            const newAvatar = {
                ...avatar,
                src: avatar.src,
            };
            setVtryonImg(null);
            setBottomImageId(null);
            setTopImageId(null);
            setOnePiece(null);
            setSelectedProduct(null);
            setSelectedAvatar(newAvatar);
            setOriginalAvatar(newAvatar);

        }
    };

    // Load an outfit
    const handleOutfitClick = (outfit) => {
        setIsFromSavedOutfit(true);
        const avatarData = {
            output_images: [outfit.vton_img_url],
        };
        setVtryonImg(avatarData);

    };

    // Delete an outfit
    const deleteOutfit = async () => {
        if (outfitToDelete) {
            setIsDeleting(true);
            try {
                const response = await callProtectedEndpoint(
                    `vtonOutfitsDelete`,
                    {
                        method: "DELETE",
                        data: {
                            id: outfitToDelete.id
                        }
                    }
                );

                if (response.status === 200) {
                    setOutfitToDelete(null);
                    setShowModal(false);
                    Toast.show({
                        type: 'success',
                        text1: response.message,
        visibilityTime: 2000
      });
                    fetchOutfits();
                }
            } catch (error) {

                Toast.show({
                    type: 'error',
                    text1: error.message,
                    visibilityTime: 2000
                });
            } finally {
                setOutfitToDelete(null);
                setIsDeleting(false);
            }
        }
    };

    // Show avatar selection dialog
    const showAvatarSelection = () => {
        if (!isSignedIn) {
            setShowAuthDialog(true);
            return;
        }
        setShowAvatarSelector(true);
    };

    // Get shopping list items
    const { items, isLoadingShoppingList } = useShoppingList(isSignedIn, refreshListTrigger);

    const getItems = () => {
        if (items && items.length) {
            return items;
        } else return [];
    };

    const handleTabChange = (tab: string) => {
        setActiveTab(tab);
        if (tab === 'my-outfits') {
            setIsExpanded(true);
        } else {
            setIsExpanded(false);
        }
    };

    const getAvatars = () => {
        if (!prefAvatar.src) return AVATARS;

        return AVATARS.some(avatar => avatar.src === prefAvatar.src)
            ? AVATARS
            : [prefAvatar, ...AVATARS];
    };

    const handleShowMyAvatars = () => { 
        if (customAvatars.length > 0) {
            setShowCustomAvatarModal(true);
        } else {
            Toast.show({ type: 'info', text1: 'No Custom Avatars', text2: 'You can create new ones during onboarding or from settings.', visibilityTime: 2000 });
        }
    };

    const handleSetPreferredAvatarFromModal = async (avatarUrl: string) => {
        if (!isSignedIn) {
            Toast.show({ type: 'error', text1: 'Please sign in to set a preferred avatar.', visibilityTime: 2000 });
            return;
        }
        setIsSettingPrefAvatarFromModal(true);
        try {
            await callProtectedEndpoint('setPreferredAvatarUrl', { 
                method: 'POST',
                data: { pref_avatar_url: avatarUrl },
            });
            await user?.reload(); 
            setSelectedAvatar({ 
                name: user?.firstName || 'My Avatar', 
                src: avatarUrl,
            });
            setPrefAvatar({ // Also update prefAvatar state if you use it directly for getAvatars
                id: selectedAvatar.id, // or a new ID if appropriate
                name: user?.firstName || 'My Avatar',
                src: avatarUrl,
            });
            Toast.show({ type: 'success', text1: 'Preferred avatar has been set!' });
            setShowCustomAvatarModal(false); 
        } catch (error: any) {
            console.error('Failed to set preferred avatar from modal:', error);
            Toast.show({ type: 'error', text1: 'Operation Failed', text2: error.message || 'Could not set preferred avatar.' , visibilityTime: 2000});
        } finally {
            setIsSettingPrefAvatarFromModal(false);
        }
    };

    const handleRecreateAvatar = () => { 
        console.log("Recreate Avatar clicked, opening modal.");
        setShowRecreateAvatarModal(true);
    };

    const handleRecreationSuccess = () => {
        console.log("Avatar recreation process initiated from modal.");
        setShowRecreateAvatarModal(false);
        // IMPORTANT: Here you need to trigger a refresh of user data / avatar status.
        // This might involve calling user.reload(), or re-fetching a specific status endpoint.
        // For now, we'll just log and close. The AvatarStatusPill should eventually update
        // once user.publicMetadata.avatar_creation_status changes to 'pending' or 'processing'.
        user?.reload(); // Attempt to reload user data to get new avatar_creation_status
        Toast.show({type: 'info', text1: 'Avatar recreation started!', text2: 'It might take a few minutes.', visibilityTime: 2000});
    };

    // Initialize with random outfit on first load
  useEffect(() => {
        if (items && items.length > 0 && !vtryonImg) {
            setDiscoveryItems(items);
            // Auto try-on first item for "instant magic"
            if (items[0] && selectedAvatar) {
                handleProductSelect(items[0], false);
            }
        }
    }, [items, selectedAvatar]);

    // Navigation functions with haptic feedback
    const goToNextItem = () => {
        if (currentItemIndex < discoveryItems.length - 1) {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            setCurrentItemIndex(currentItemIndex + 1);
        }
    };

    const goToPreviousItem = () => {
        if (currentItemIndex > 0) {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            setCurrentItemIndex(currentItemIndex - 1);
        }
    };

    // Enhanced try-on function with haptic feedback
    const handleTryOnItem = (item) => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
        handleProductSelect(item, false);
    };

    // Swipe gesture handler with haptic feedback
    const swipeGesture = Gesture.Pan()
        .onUpdate((event) => {
            // Provide subtle feedback when user starts swiping
            if (Math.abs(event.translationX) > 50) {
                Haptics.selectionAsync();
            }
        })
        .onEnd((event) => {
            if (event.translationX > 80) {
                goToPreviousItem();
            } else if (event.translationX < -80) {
                goToNextItem();
            }
        });

    // Get current item
    const currentItem = discoveryItems[currentItemIndex];

    return (
    <SafeAreaView style={styles.container}>
            <View style={styles.avatarTheatre}>
                {/* Avatar Hero Section - 70% of screen */}
                <View style={styles.avatarHeroSection}>
                    <AvatarSection
                        selectedAvatar={selectedAvatar}
                        onAvatarSelect={showAvatarSelection}
                        onSaveOutfit={() => setShowSaveOutfitDialog(true)}
                        setIsFullscreen={setIsFullscreen}
                        isExpanded={false}
                        avatarStatus={avatarStatusFromUser}
                        tryonImages={vtryonImg}
                        onResetAvatar={handleResetAvatar}
                        originalAvatar={originalAvatar}
                        isAvatarLoading={isAvatarLoading}
                        isLoadingPrefAvatar={isLoadingPrefAvatar}
                        isFromSavedOutfit={isFromSavedOutfit}
                        onShowMyAvatars={handleShowMyAvatars}
                        showCustomAvatarModal={showCustomAvatarModal}
                        onRecreateAvatar={handleRecreateAvatar}
                    />
                    
                    {/* Subtle hint text */}
                    {!vtryonImg && (
                        <MotiText
                            from={{ opacity: 0, translateY: 10 }}
                            animate={{ opacity: 0.6, translateY: 0 }}
                            style={styles.discoverHint}
                        >
                            Swipe to discover your style
                        </MotiText>
                    )}
                    </View>
                    
                {/* Discovery Section - 30% of screen */}
                <GestureDetector gesture={swipeGesture}>
                    <View style={styles.discoverySection}>
                        {currentItem && (
                            <View style={styles.currentItemContainer}>
                                {/* Previous item peek */}
                                {currentItemIndex > 0 && (
                                    <TouchableOpacity 
                                        style={styles.previousItemPeek}
                                        onPress={goToPreviousItem}
                                    >
                                        <Image
                                            source={{ uri: discoveryItems[currentItemIndex - 1]?.img_url }}
                                            style={styles.peekImage}
                                        />
                                    </TouchableOpacity>
                                )}

                                {/* Current item - main focus */}
                                <TouchableOpacity
            style={[
                                        styles.currentItem,
                                        selectedProduct?.id === currentItem.id && styles.selectedItem,
                                        isAvatarLoading && styles.loadingItem
                                    ]}
                                    onPress={() => handleTryOnItem(currentItem)}
                                    disabled={isAvatarLoading}
                            >
                <Image
                                        source={{ uri: currentItem.img_url }}
                                        style={styles.currentItemImage}
                  contentFit="cover"
                                    />
                                    
                                    {/* Try on indicator */}
                                    <MotiView
                                        from={{ opacity: 0, scale: 0.8 }}
                                        animate={{ opacity: 1, scale: 1 }}
                                        style={styles.tryOnButton}
                                    >
                                        <Text style={styles.tryOnText}>
                                            {selectedProduct?.id === currentItem.id ? '✓ Trying On' : '↑ Tap to Try On'}
                                        </Text>
                                    </MotiView>
                                    
                                    {/* Loading overlay */}
                {isAvatarLoading && (
                  <View style={styles.loadingOverlay}>
                                            <MotiView
                                                from={{ rotate: '0deg' }}
                                                animate={{ rotate: '360deg' }}
                                                transition={{ loop: true, duration: 1000 }}
                                            >
                                                <Text style={styles.loadingIcon}>✨</Text>
                                            </MotiView>
                            </View>
                )}
                                </TouchableOpacity>

                                {/* Next item peek */}
                                {currentItemIndex < discoveryItems.length - 1 && (
                                    <TouchableOpacity 
                                        style={styles.nextItemPeek}
                                        onPress={goToNextItem}
                                    >
                                        <Image
                                            source={{ uri: discoveryItems[currentItemIndex + 1]?.img_url }}
                                            style={styles.peekImage}
                                        />
                                    </TouchableOpacity>
                                )}
                            </View>
        )}

                        {/* Item details */}
                        {currentItem && (
                            <View style={styles.itemDetails}>
                                <Text style={styles.itemTitle} numberOfLines={1}>
                                    {currentItem.title}
                                </Text>
                                <Text style={styles.itemCounter}>
                                    {currentItemIndex + 1} of {discoveryItems.length}
                                </Text>
      </View>
                        )}
                    </View>
                </GestureDetector>
                </View>
      
            <AvatarList
                open={showAvatarSelector}
                onOpenChange={setShowAvatarSelector}
                avatars={avatarStatus === 'ready' && customAvatars.length > 0 ?
                    [...customAvatars.map((url, index) => ({
                        id: `AVA${7 + index}`,
                        name: user?.firstName + " " + user?.lastName || "You",
                    }))] :
                    getAvatars()}
                selectedAvatar={selectedAvatar}
                onAvatarSelect={handleAvatarSelect}
                hasCustomAvatars={customAvatars.length > 0}
                avatarStatus={avatarStatus}
                customAvatars={customAvatars}
            />

            <AnimatePresence>
                {isFullscreen && vtryonImg && (
                        <MotiView
                            from={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                        style={StyleSheet.absoluteFillObject}
                        className="z-50 bg-white"
                        >
                        <View style={[styles.fullscreenImageContainer]} className="relative w-full h-full bg-white rounded-3xl overflow-hidden">
                                <Image
                                style={{ width: "100%", height: "100%" }}
                                source={{
                                    uri: vtryonImg && vtryonImg.output_images && vtryonImg.output_images.length > 0
                                        ? vtryonImg.output_images[0]
                                        : selectedAvatar.src
                                }}
                                alt={selectedAvatar.name}
                                contentFit='cover'
                                contentPosition='top center'
                                />
                                <TouchableOpacity
                                className="absolute top-4 right-4 text-gray-800 hover:bg-white/20 rounded-full"
                                    onPress={() => setIsFullscreen(false)}
                                >
                                <X className="w-6 h-6" color="black" />
                                </TouchableOpacity>
                            </View>
                        </MotiView>
                    )}
                </AnimatePresence>

            {/* Render the CustomAvatarSelectionModal */}
            {isSignedIn && (
                <CustomAvatarSelectionModal
                    visible={showCustomAvatarModal}
                    onClose={() => setShowCustomAvatarModal(false)}
                    customAvatars={customAvatars} 
                    currentPreferredAvatarUrl={prefAvatar?.src}
                    onSelectAvatar={handleSetPreferredAvatarFromModal}
                    isSubmittingPreference={isSettingPrefAvatarFromModal}
                />
            )}

            {/* Render the RecreateAvatarModal */}
            {isSignedIn && (
                <RecreateAvatarModal
                    visible={showRecreateAvatarModal}
                    onClose={() => setShowRecreateAvatarModal(false)}
                    onRecreationSuccess={handleRecreationSuccess}
                />
            )}
    </SafeAreaView>
    )
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
    backgroundColor: '#FFFFFF',
  },
    avatarTheatre: {
        flex: 1,
        flexDirection: 'column',
    },
    avatarHeroSection: {
        flex: 0.7, // 70% of screen
        alignItems: 'center',
    justifyContent: 'center',
        backgroundColor: '#FAFAFA',
        paddingHorizontal: 20,
    },
    discoverHint: {
        position: 'absolute',
        bottom: 20,
        fontSize: 14,
        fontFamily: 'Inter-Regular',
        color: '#999999',
        textAlign: 'center',
    },
    discoverySection: {
        flex: 0.3, // 30% of screen
        backgroundColor: '#FFFFFF',
        paddingTop: 20,
        paddingBottom: 10,
    },
    currentItemContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingHorizontal: 20,
        height: 120,
    },
    previousItemPeek: {
        width: 60,
        height: 80,
        borderRadius: 8,
        overflow: 'hidden',
        opacity: 0.4,
        marginRight: 15,
    },
    nextItemPeek: {
        width: 60,
        height: 80,
        borderRadius: 8,
    overflow: 'hidden',
        opacity: 0.4,
        marginLeft: 15,
  },
    peekImage: {
        width: '100%',
        height: '100%',
    },
    currentItem: {
        width: 120,
        height: 100,
    borderRadius: 12,
    overflow: 'hidden',
        backgroundColor: '#FFFFFF',
        shadowColor: '#000',
    shadowOpacity: 0.08,
        shadowRadius: 12,
        shadowOffset: { width: 0, height: 4 },
        borderWidth: 1,
        borderColor: 'rgba(0, 0, 0, 0.06)',
    position: 'relative',
    },
    selectedItem: {
        borderColor: '#A855F7',
        borderWidth: 2,
        shadowOpacity: 0.15,
        transform: [{ scale: 1.05 }],
    },
    loadingItem: {
        opacity: 0.7,
    },
    currentItemImage: {
        width: '100%',
    height: '100%',
    },
    tryOnButton: {
        position: 'absolute',
        bottom: 0,
    left: 0,
        right: 0,
        backgroundColor: 'rgba(0, 0, 0, 0.8)',
        paddingVertical: 4,
        paddingHorizontal: 8,
    },
    tryOnText: {
    color: '#FFFFFF',
        fontSize: 11,
        fontFamily: 'Inter-Medium',
        textAlign: 'center',
    },
    loadingOverlay: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(255, 255, 255, 0.9)',
    alignItems: 'center',
    justifyContent: 'center',
  },
    loadingIcon: {
        fontSize: 24,
    },
    itemDetails: {
    paddingHorizontal: 20,
        paddingTop: 15,
    alignItems: 'center',
    },
    itemTitle: {
        fontSize: 16,
        fontFamily: 'Inter-Medium',
        color: '#1a1a1a',
        textAlign: 'center',
        marginBottom: 4,
    },
    itemCounter: {
        fontSize: 12,
        fontFamily: 'Inter-Regular',
        color: '#999999',
    },
    fullscreenImageContainer: {
        // width: Dimensions.get("window").width - 50,
        // height: Dimensions.get("window").height - 200,
    }
});

export default VirtualTryOn;

import React, { useEffect, useState, useCallback, useRef } from 'react'
import { Text, View, SafeAreaView, StyleSheet, TouchableOpacity, Dimensions } from 'react-native';
import SimpleHeader from './SimpleHeader';
import { responsiveFontSize } from '@/utils';
import { AnimatePresence, MotiView } from 'moti';
import { useAuth, useClerk, useUser } from '@clerk/clerk-expo';
import AvatarSection from './AvatarSection';
import TabSection from './TabSection';
import Toast from 'react-native-toast-message';
import { Lock, Coins, X } from 'lucide-react-native';
import { ImageContextType, useImageContext } from '@/common/providers/image-search';
import { useFocusEffect, useRouter } from 'expo-router';
import { useApi } from '@/client-api';
import { AVATARS } from '@/constants';
import { useShoppingList } from './hooks/useShoppingList';
import { LinearGradient } from 'expo-linear-gradient';
import SaveOutfitDialog from './SaveOutfitDialog';
import AvatarList from './AvatarList';
import useResetTab from './hooks/useResetTab';
import { Image } from 'expo-image';
import { AvatarStatus } from './AvatarStatusPill';
import CustomAvatarSelectionModal from './CustomAvatarSelectionModal';
import RecreateAvatarModal from './RecreateAvatarModal';

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
    const [showSaveOutfitDialog, setShowSaveOutfitDialog] = useState(false);
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
        setShowSaveOutfitDialog(false);
        setShowAvatarSelector(false);
        setShowModal(false);
        setOutfitToDelete(null);
        setIsExpanded(false);
        setIsAvatarLoading(false);
        setIsLoadingPrefAvatar(true);
        setOriginalAvatar(null);
        setIsFromSavedOutfit(false);
        setShowSaveOutfitDialog(false);
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
            });
        }
    }, [originalAvatar]);

    // Handle deleting an outfit
    const handleDeleteOutfit = useCallback((outfitId) => {
        setSavedOutfits((prev) => prev.filter((outfit) => outfit.id !== outfitId));
    }, []);

    // Save an outfit
    const handleSaveOutfit = async () => {
        if (!selectedAvatar) return;

        const newOutfit = {
            vton_img_url: vtryonImg?.output_images[0],
            outfit_name: outfitName,
            base_avatar_id: selectedAvatar.id,
            top_img_id: topImageId,
            bottom_img_id: bottomImageId,
            one_pieces_img_id: onePiece,
        };

        try {
            const response = await callProtectedEndpoint(`vtonOutfits`, {
                method: "POST",
                data: newOutfit,
            });

            console.log("response : ", response);

            if (response.status === 200) {
                Toast.show({
                    type: 'success',
                    text1: response?.message,
                });
                fetchOutfits();
                setShowSaveOutfitDialog(false);
            }
        } catch (error: any) {
            console.log("error : ", error);
            Toast.show({
                type: 'error',
                text1: error.message,
            });
        }
    };

    // Try on a product
    const handleProductSelect = async (product, isWardrobe = false) => {
        setIsFromSavedOutfit(false);

        // Check if the product has a valid garment type
        if ((product.garment_type === "none") && isSignedIn) {
            Toast.show({
                type: 'info',
                text1: "This item is currently not supported for virtual try-on",
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
                    });
                }
            } catch (error) {
                Toast.show({
                    type: 'error',
                    text1: error?.message,
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
                    });
                    fetchOutfits();
                }
            } catch (error) {

                Toast.show({
                    type: 'error',
                    text1: error.message,
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
            Toast.show({ type: 'info', text1: 'No Custom Avatars', text2: 'You can create new ones during onboarding or from settings.' });
        }
    };

    const handleSetPreferredAvatarFromModal = async (avatarUrl: string) => {
        if (!isSignedIn) {
            Toast.show({ type: 'error', text1: 'Please sign in to set a preferred avatar.' });
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
            Toast.show({ type: 'error', text1: 'Operation Failed', text2: error.message || 'Could not set preferred avatar.' });
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
        Toast.show({type: 'info', text1: 'Avatar recreation started!', text2: 'It might take a few minutes.'});
    };

    return (
        <SafeAreaView style={styles.areaContainer} className='w-full bg-white'>
            <View style={styles.container} className='flex flex-col h-full'>
                <SimpleHeader credits={credits} title="Virtual Try-On" subtitle="Beta" />
                <View className="flex-1 flex flex-col">
                    <View style={styles.imageContainer}>
                        <MotiView
                            animate={{
                                opacity: isExpanded ? 0.3 : 1,
                                scale: isExpanded ? 0.95 : 1
                            }}
                            transition={{ duration: 0.3 }}
                            className={`${!isSignedIn ? "relative" : ""}`}
                            style={{ height: "100%", width: "100%", top: 0 }}
                        >
                            <View style={{ height: "100%", position: "relative", top: 0 }}>
                                <AvatarSection
                                    selectedAvatar={selectedAvatar}
                                    onAvatarSelect={showAvatarSelection}
                                    onSaveOutfit={() => setShowSaveOutfitDialog(true)}
                                    setIsFullscreen={setIsFullscreen}
                                    isExpanded={isExpanded}
                                    credits={credits}
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
                            </View>
                        </MotiView>
                    </View>
                </View>
                <TabSection
                    isLoading={isLoadingShoppingList.shoppingListLoading}
                    activeTab={activeTab}
                    setActiveTab={handleTabChange}
                    handleTabChange={handleTabChange}
                    isExpanded={isExpanded}
                    products={getItems()}
                    selectedProduct={selectedProduct}
                    loadingShoppingProductId={loadingShoppingProductId}
                    savedOutfits={savedOutfits}
                    handleProductSelect={handleProductSelect}
                    handleOutfitClick={handleOutfitClick}
                    deleteOutfit={deleteOutfit}
                    setOutfitToDelete={setOutfitToDelete}
                    outfitToDelete={outfitToDelete}
                    deleting={deleting}
                    setShowModal={setShowModal}
                    showModal={showModal}
                    isAvatarLoading={isAvatarLoading}
                    setIsExpanded={setIsExpanded}
                    onDeleteOutfit={handleDeleteOutfit}
                />

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

                <SaveOutfitDialog
                    isOpen={showSaveOutfitDialog}
                    onClose={() => setShowSaveOutfitDialog(false)}
                    onSave={handleSaveOutfit}
                    setOutfitName={setOutfitName}
                    outfitName={outfitName}
                />
                {/* Save Outfit Dialog and Avatar Selector Dialog would be implemented similarly */}
                <AnimatePresence>
                    {isFullscreen && (
                        <MotiView
                            from={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            className="flex-1 w-full h-full absolute inset-0 z-50 bg-black/90 p-4 flex items-center justify-center"
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
                <RecreateAvatarModal 
                    visible={showRecreateAvatarModal}
                    onClose={() => setShowRecreateAvatarModal(false)}
                    onRecreationSuccess={handleRecreationSuccess}
                />
            </View>

        </SafeAreaView>
    )
}

const styles = StyleSheet.create({
    container: {
        width: '100%',
        height: '100%',
    },
    areaContainer: {
        flexDirection: 'column',
        flex: 1,
        width: '100%',
    },
    imageContainer: {
        height: '100%',
    },
    gradient: {
        position: 'absolute',
        left: 50,
        right: 0,
        bottom: 0,
        height: '100%',
        zIndex: 5,
        pointerEvents: 'none',
        width: '75%',
        alignSelf: 'center',
        top: 90,
    },
    modalOverlay: {
        backgroundColor: 'rgba(0,0,0,0.5)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    authDialog: {
        width: '85%',
        maxWidth: 425,
        backgroundColor: 'white',
        borderRadius: 16,
        padding: 24,
    },
    dialogHeader: {
        alignItems: 'center',
    },
    lockIconContainer: {
        backgroundColor: '#f3e8ff',
        width: 48,
        height: 48,
        borderRadius: 24,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 16,
    },
    dialogTitle: {
        fontSize: responsiveFontSize(20),
        fontFamily: 'default-semibold',
        color: '#333',
        marginBottom: 8,
        textAlign: 'center',
    },
    dialogSubtitle: {
        fontSize: responsiveFontSize(14),
        color: '#666',
        textAlign: 'center',
        marginBottom: 24,
    },
    buttonContainer: {
        gap: 12,
    },
    signUpButton: {
        backgroundColor: '#a855f7',
        paddingVertical: 14,
        borderRadius: 8,
        alignItems: 'center',
    },
    signInButton: {
        borderWidth: 1,
        borderColor: '#e5e7eb',
        paddingVertical: 14,
        borderRadius: 8,
        alignItems: 'center',
    },
    signUpButtonText: {
        color: 'white',
        fontSize: responsiveFontSize(16),
        fontFamily: 'default-semibold',
    },
    signInButtonText: {
        color: '#333',
        fontSize: responsiveFontSize(16),
        fontFamily: 'default-medium',
    },
    fullscreenImageContainer: {
        // width: Dimensions.get("window").width - 50,
        // height: Dimensions.get("window").height - 200,
    }
});

export default VirtualTryOn;

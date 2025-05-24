import React, { useRef, useState, useEffect, useCallback, useMemo } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  useColorScheme,
  TouchableWithoutFeedback,
  Keyboard,
  Dimensions,
  InteractionManager,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import theme from "@/styles/theme";
import Constants from "expo-constants";
import { useChatProducts, chatActions, ChatProductsProvider, Product } from "./context";
import Toast from "react-native-toast-message";
import ProductSearchResults from "./product-search-results";
import { QueryClient, QueryClientProvider, useMutation } from "@tanstack/react-query";
import { extractImageUrl, transformShoppingList } from "./util";
import { useApi } from "@/client-api";
import useAppTheme from "@/hooks/useTheme";
import { useNavigation } from "@react-navigation/native";
import { ArrowUp, Camera, Search, Mic, Image, Instagram, CircleArrowUp } from "lucide-react-native";
import ProductDetails from "@/components/ProductDetails";
import { useSaveShoppingList } from "./queries/save-shopping-list";
import { AuthModal } from "@/components";
import { router } from "expo-router";
import * as ImagePicker from 'expo-image-picker';
import ImagePreview from "@/components/image-preview";
import MessageInput, { MessageSendButton } from "@/app/components/MessageInput";
import { ImageLoader } from "@/components/SearchProgressSteps";
import ProductDetailCard from "@/components/ProductDetailCard";
import { useProdCardQueryMutation } from "./hooks/query";
import { getSavedDetails } from "@/utils";
import ImageUploadDialog from '@/app/components/ImageUploadDialog';
import Header from "./header";
import SearchInput from "./SearchInput";
import { getDiscoveryOutfits } from "./queries/getDiscoveryOutfits";
import DiscoveryHeader from "./discovery/discovery-header";
import DiscoverySection from "./discovery/discovery-section";
import { useAuth } from "@clerk/clerk-expo";
import * as Haptics from 'expo-haptics';
import ProductCarouselSection, { CategorySectionData, ProductItem } from '../../../components/ProductCarouselSection';

// Create a client
const queryClient = new QueryClient();

// Sample Data for ProductCarouselSection (Replace with actual data fetching)
;

const ChatScreenContent = () => {
  const {
    sessionId,
    chatHistory,
    products,
    isLoading,
    usedItems,
    personalization,
    inputType,
    error,
    dispatch,
    conversationGroups,
    activeConversationGroup
  } = useChatProducts();

  const navigation = useNavigation();

  useEffect(() => {
    if (navigation && navigation.isFocused()) {
      // @ts-ignore - Reinstating to bypass specific navigator type issue for now
      const unsubscribe = navigation.addListener('tabPress', e => {
        setSearchText("");
        setImageUris([]);
        setLatestAiMessage("");
        setShowLoginModal(false);
        setIsPartQueryLoading(false);
        setIsProductQueryLoading(false);
        setFetchProduct(null);
        dispatch(chatActions.reset());
      });
      return unsubscribe;
    }
  }, [navigation]);

  const [searchText, setSearchText] = useState("");
  const scrollViewRef = useRef<ScrollView>(null);
  const appTheme = useAppTheme();
  const [fetchProduct, setFetchProduct] = useState<Product | null>(null);
  const [followUpProduct, setFollowUpProduct] = useState<Product | null>(null);
  const { savedProducts, savingProducts, saveSuccess, saveError, saveShoppingItem, isPending } = useSaveShoppingList(() => setShowLoginModal(true))
  const [showLoginModal, setShowLoginModal] = useState(false);
  const { isAuthenticated, callPublicEndpoint, callProtectedEndpoint } = useApi();
  const [isPartQueryLoading, setIsPartQueryLoading] = useState(false);
  const [isProductQueryLoading, setIsProductQueryLoading] = useState(false);
  const [imageUris, setImageUris] = useState<string[]>([]);
  const [latestAiMessage, setLatestAiMessage] = useState<string>("");
  const [showImageUploadDialog, setShowImageUploadDialog] = useState(false);
  const [socialImages, setSocialImages] = useState<string[]>([]);
  const [promptChips, setPromptChips] = useState<string[]>([]);
  const hasFetchedUrl = useRef(false);
  const isFetchingRef = useRef(false);
  const { getToken, isLoaded, isSignedIn } = useAuth();

  const [discoveryOutfits, setDiscoveryOutfits] = useState<any[]>([]); 
  const [isDiscoveryOutfitsLoading, setIsDiscoveryOutfitsLoading] = useState(false);
  const [pageNumber, setPageNumber] = useState(0);
  const [pageSize, setPageSize] = useState(20);
  const [totalItems, setTotalItems] = useState(0);
  const [hasMore, setHasMore] = useState(true);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  
  const currentScrollY = useRef(0);
  let isMounted = true;
  const controller = new AbortController();

  useEffect(() => {
    const fetchPromptChips = async () => {
      const endpoint = isSignedIn ? 'getPromptChipsAuth' : 'getPromptChips';
      if (hasFetchedUrl.current) return;
      hasFetchedUrl.current = true;
      try {
        const response = await (isSignedIn
          ? callProtectedEndpoint(endpoint, { method: 'POST', data: {} })
          : callPublicEndpoint(endpoint, { method: 'POST', data: {} }));
        if (response && Array.isArray(response)) {
          const searchQueries = response.map((item: any) => item.search_query);
          setPromptChips(searchQueries);
        } else {
          setPromptChips([]); 
        }
      } catch (error) {
        console.error('Error fetching prompt chips:', error);
        setPromptChips([]); 
      } finally {
        hasFetchedUrl.current = false;
      }
    };
    fetchPromptChips();
  }, [isSignedIn]);
  
  useEffect(() => {
    const fetchInitialDiscoveryData = async () => {
      if (isFetchingRef.current) return;
      isFetchingRef.current = true;
      setIsDiscoveryOutfitsLoading(true);
      try {
        const userGender = await getSavedDetails('gender') || "female"; 
        const params = { pageNumber: 0, pageSize, gender: userGender };
        const data = await getDiscoveryOutfits(callPublicEndpoint, params);
        setDiscoveryOutfits(data.discoveryOutfits); 
        setTotalItems(data.totalItems); 
        setHasMore(data.discoveryOutfits.length < data.totalItems);
      } catch (error: any) {
        if (isMounted && error.name !== 'AbortError') {
          Toast.show({ type: "error", text1: "Header Data Error", text2: 'Failed to load initial data for header', visibilityTime: 2000});
        }
      } finally {
        setIsDiscoveryOutfitsLoading(false);
        isFetchingRef.current = false;
      }
    };
    fetchInitialDiscoveryData();
    return () => { isMounted = false; controller.abort(); };
  }, [pageSize]);
  
  const transformProducts = useCallback((apiProducts: any[]): Product[] => {
    if (!apiProducts || !Array.isArray(apiProducts)) return [];
    return apiProducts.map((item) => ({
      id: item.id || item.product_id || String(Math.random()),
      brand: item.brand || item.designer || "Unknown Brand",
      name: item.name || item.title || "Product",
      price: item.price || "$0.00",
      image: extractImageUrl(item),
      url: item.url || item.link || "",
      product_info: item
    }));
  }, []);

  const searchPartQuery = useCallback(async (data: any, retries = 1) => {
    try {
      const { ...payload } = { ...data, ...(sessionId ? { sessionId } : {}) };
      setIsPartQueryLoading(true);
      const response = isAuthenticated
        ? await callProtectedEndpoint('searchPart', { method: 'POST', data: { ...payload } })
        : await callPublicEndpoint('searchPartPublic', { method: 'POST', data: payload });
      return response.conversationResponse;
    } catch (error: any) {
      if (retries > 0 && (error.response?.status >= 500 || !error.response)) {
        await new Promise(resolve => setTimeout(resolve, 1000));
        return searchPartQuery(data, retries - 1);
      }
      throw error;
    } finally {
      setIsPartQueryLoading(false);
    }
  }, [isAuthenticated, callProtectedEndpoint, callPublicEndpoint, sessionId]);

  const handleProductSearch = useCallback(async (data: any, retries = 1) => {
    try {
      setIsProductQueryLoading(true);
      return isAuthenticated
        ? await callProtectedEndpoint('searchProductsAuth', { method: 'POST', data })
        : await callPublicEndpoint('searchProducts', { method: 'POST', data });
    } catch (error: any) {
      if (retries > 0 && (error.response?.status >= 500 || !error.response)) {
        await new Promise(resolve => setTimeout(resolve, 1000));
        return handleProductSearch(data, retries - 1);
      }
      throw error;
    } finally {
      setIsProductQueryLoading(false);
    }
  }, [isAuthenticated, callPublicEndpoint, callProtectedEndpoint]);

  const prodCardQueryMutation = useProdCardQueryMutation(
    (data: any) => {
      const transformedShoppingList = transformShoppingList(data.shopping_results);
      dispatch(chatActions.addProducts(transformedShoppingList, sessionId || "", data.aiResponse));
    },
    () => { /* onError handled by searchMutation or global error handler */ }
  );

  useEffect(() => {
    if (error) dispatch(chatActions.setError(null));
  }, [error, dispatch]);

  const searchMutation = useMutation({
    mutationFn: async (searchInput: { text: string, image?: string | null }) => {
      const userMessage = searchInput.text;
      const userImage = imageUris.length > 0 ? imageUris[0] : null;
      const payload = {
        chatHistory: [...chatHistory, { role: "user", text: userMessage, ...(userImage ? { image: userImage } : {}) }],
        usedItems, personalization, inputType: userImage ? "img+txt" : "text", ...(sessionId ? { sessionId } : {})
      };
      const aiGeneratedQuery = await searchPartQuery(payload);
      if (!aiGeneratedQuery || aiGeneratedQuery.includes("Sorry")) throw new Error("Failed to get search query from AI");
      setLatestAiMessage(aiGeneratedQuery);
      dispatch(chatActions.addAiMessage(aiGeneratedQuery));
      const updatedPayload = { ...payload, chatHistory: [...payload.chatHistory, { role: "ai", text: aiGeneratedQuery }] };
      return { aiResponse: aiGeneratedQuery, productResults: await handleProductSearch(updatedPayload) };
    },
    onMutate: () => dispatch(chatActions.setLoading(true)),
    onSuccess: (data) => {
      if (data.productResults?.shopping_results?.length) {
        const transformed = transformProducts(data.productResults.shopping_results);
        if (transformed.length) dispatch(chatActions.addProducts(transformed, data.productResults.sessionId, data.aiResponse));
      }
      setImageUris([]); setSearchText("");
    },
    onError: (e: any) => {
      dispatch(chatActions.addAiMessage("Sorry, I couldn't find products. Please try again."));
      dispatch(chatActions.setError(e.message || "Failed to search products"));
      Toast.show({ type: "error", text1: "Search Error", text2: e.message || "Failed to search", visibilityTime: 2000 });
      setImageUris([]); setSearchText("");
    },
    onSettled: () => dispatch(chatActions.setLoading(false)),
  });

  const handleSendMessage = async () => {
    if (!searchText.trim() || searchMutation.isPending) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    const userMessage = searchText.trim();
    const imageData = imageUris.length > 0 ? imageUris[0] : null;
    const currentInputType = imageData ? "img+txt" : "text";
    if (inputType !== currentInputType) dispatch(chatActions.setInputType(currentInputType));
    dispatch(imageData ? chatActions.addUserMessage(userMessage, imageData) : chatActions.addUserMessage(userMessage));
    InteractionManager.runAfterInteractions(() => scrollViewRef.current?.scrollToEnd({ animated: true }));
    searchMutation.mutate({ text: userMessage, image: imageData });
    Keyboard.dismiss();
  };

  const handleCarouselProductPress = (item: ProductItem) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    const productForDetails: Product = {
      id: item.id, name: item.name, image: item.imageUrl,
      brand: 'N/A', price: 'N/A', url: '', product_info: item, 
    };
    setFetchProduct(productForDetails); 
  };
  
  const handleProductPress = (product: Product) => { 
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setFetchProduct(product);
  };

  const ProductSearchResultsMemo = useCallback(ProductSearchResults, []);

  const handleImageUpload = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images, allowsEditing: true, aspect: [1, 1], quality: 0.5, base64: true,
    }).then((result) => {
      if (!result.canceled && result.assets?.[0]?.base64) {
        setImageUris([result.assets[0].base64]);
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      }
    });
  };

  const handleRemoveImage = (uri: string) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setImageUris(prev => prev.filter((imageUri) => imageUri !== uri));
  };

  const handleFollowUpPress = (product: Product) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setFollowUpProduct(product);
  };

  const handleProdCardQuery = async (question: string, product: any) => {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    setIsProductQueryLoading(true);
    dispatch(chatActions.addUserMessage(question, product?.image));
    dispatch(chatActions.addAiMessage("Your searched products"));
    prodCardQueryMutation.mutate({
      "product_title": followUpProduct?.name, "product_img_url": followUpProduct?.image, "query": question,
      "chat_history": [...chatHistory, { "role": "user", "text": question }],
      "gender": await getSavedDetails('gender') || "male"
    });
    setFollowUpProduct(null);
  };

  const handleImageSelected = async (index: number) => {
    try {
      const activeGrp = conversationGroups.find(c => c.id === activeConversationGroup);
      const imageUrl = activeGrp?.aiMessage[activeGrp.aiMessage.length - 1].social?.images[index].img_url;
      if (!imageUrl) return;
      dispatch(chatActions.setInputType("imgurl+txt"));
      setIsProductQueryLoading(true);
      const response = isAuthenticated
        ? await callProtectedEndpoint('findProducts', { method: 'POST', data: { img_url: imageUrl, personalization: false } })
        : await callPublicEndpoint('findProductsPublic', { method: 'POST', data: { img_url: imageUrl, personalization: false } });
      if (Array.isArray(response)) {
        dispatch(chatActions.addAiMessage("We found categories in your image:", "text", response));
        dispatch(chatActions.setProductsByCategory(response));
      } else {
        dispatch(chatActions.addAiMessage("Sorry, couldn't find products. Try another image."));
      }
    } catch (error) {
      dispatch(chatActions.addAiMessage("Error finding products from image."));
    } finally {
      setIsProductQueryLoading(false);
    }
  };
;
  const handleSocialUrlSubmit = async (url: string) => {
    try {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      dispatch(chatActions.addUserMessage(url));
      dispatch(chatActions.addAiMessage("Please select an image for fashion items:", "social"));
      dispatch(chatActions.setSocialImages([], true));
      setShowImageUploadDialog(false);
      const response = await callProtectedEndpoint('extractSocials', { method: 'POST', data: { url } });
      if (Array.isArray(response?.media) && response.media.length > 0) {
        dispatch(chatActions.setSocialImages(response.media, false));
      } else {
        Toast.show({ type: 'error', text1: 'Failed to extract social media links', visibilityTime: 2000 });
      }
    } catch (error) {
      console.error("Error extracting social media links:", error);
    }
  };
  
  const loadMoreItems = useCallback(async () => {
    if (isLoadingMore || !hasMore || isFetchingRef.current) return;
    isFetchingRef.current = true;
    setIsLoadingMore(true);
    const nextPage = pageNumber + 1;
    try {
      const userGender = await getSavedDetails('gender') || "female"; 
      const params = { pageNumber: nextPage, pageSize, gender: userGender };
      const nextPageData = await getDiscoveryOutfits(callPublicEndpoint, params);
   
      setDiscoveryOutfits(prev => [...prev, ...nextPageData.discoveryOutfits]);
      setPageNumber(nextPage);
      const newTotalFetched = discoveryOutfits.length + nextPageData.discoveryOutfits.length;
      setHasMore(newTotalFetched < nextPageData.totalItems);
    } catch (error) {
      Toast.show({ type: "error", text1: "Load More Error", text2: 'Failed to load more outfits', visibilityTime: 2000 });
    } finally {
      setIsLoadingMore(false);
      isFetchingRef.current = false;
    }
  }, [isLoadingMore, hasMore, pageNumber, pageSize, discoveryOutfits.length, totalItems]);

  const handleScroll = (event: { nativeEvent: { contentOffset: { y: number }, layoutMeasurement: { height: number }, contentSize: { height: number } } }) => {
    currentScrollY.current = event.nativeEvent.contentOffset.y;
  };

  // Simplified rendering logic for !conversationGroups.length case
  const renderInitialContent = () => (
    <ScrollView
      contentContainerStyle={[styles.initialContentScrollView, { backgroundColor: 'transparent' }]}
      keyboardShouldPersistTaps="handled"
      keyboardDismissMode="on-drag"
      onScroll={handleScroll}
      scrollEventThrottle={16}
    >
      <Header darkMode={false} />
      <View style={[styles.searchInputContainer, { backgroundColor: 'transparent' }]}>
        <SearchInput
          darkMode={false}
          inputMode={'text'}
          inputValue={searchText} 
          setInputValue={setSearchText} 
          setSearchText={setSearchText}
          onSearch={handleSendMessage}
          promptChips={promptChips}
          hasFetchedUrl={hasFetchedUrl.current}
          handleInstagramClick={() => setShowImageUploadDialog(true)}
        />
      </View>

      <DiscoveryHeader 
        darkMode={false} 
        discoveryOutfit={discoveryOutfits} 
      />
      
      {discoveryOutfits.length > 0  && (
        <View style={[styles.carouselWrapperView, { backgroundColor: 'transparent' }]}> 
            <ProductCarouselSection 
                categories={discoveryOutfits} 
                onProductPress={handleCarouselProductPress}
                darkMode={false}
                isLoading={isDiscoveryOutfitsLoading}
            />
        </View>
      )}
      
     
       
    </ScrollView>
  );

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : undefined}
      style={styles.keyboardAvoidingViewStyle}
      keyboardVerticalOffset={0}>
      <LinearGradient
        colors={['#ffffff', '#f5f3ff', '#f0f9ff']}
        start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
        style={styles.fullFlexContainer}
      >
        <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
          <SafeAreaView style={styles.safeArea}>
            <View style={styles.chatContainer}>
              {!conversationGroups.length ? renderInitialContent() : (
                <View style={styles.chatContentContainer}>
                  <ProductSearchResultsMemo
                    inputType={inputType as any}
                    latestAiMessage={latestAiMessage}
                    products={products}
                    chatHistory={chatHistory}
                    conversationGroups={conversationGroups}
                    isLoading={isLoading}
                    onProductPress={handleProductPress}
                    title="Search Results"
                    subtitle="Based on your search"
                    onBack={() => dispatch(chatActions.reset())}
                    isPartQueryLoading={isPartQueryLoading}
                    isProductQueryLoading={isProductQueryLoading}
                    setShowLoginModal={setShowLoginModal}
                    saveShoppingItemConfig={{
                      savedProducts, savingProducts, saveSuccess, saveError, saveShoppingItem, isPending
                    }}
                    onFollowUpPress={handleFollowUpPress}
                    followUpProduct={followUpProduct}
                    scrollViewRef={scrollViewRef}
                    showImageSelection={socialImages.length > 0}
                    imageSelectionUrls={socialImages}
                    onImageSelected={handleImageSelected}
                  />
                  <View style={styles.inputWrapper}>
                    <MessageInput
                      onSend={handleSendMessage}
                      onImageSelect={handleImageUpload}
                      placeholder="Type a message..."
                      disabled={isLoading}
                      renderImagePreview={() => <ImagePreview imageUris={imageUris} onRemoveImage={handleRemoveImage} />}
                      showImagePreview={imageUris.length > 0}
                      setSearchText={setSearchText}
                      searchText={searchText}
                    />
                  </View>
                </View>
              )}
              {fetchProduct &&
                <ProductDetails
                  fetchProduct={fetchProduct as Product} 
                  isVisible={true}
                  onClose={() => setFetchProduct(null)}
                  onAddToShoppingList={() => {
                    saveShoppingItem({
                      products: [fetchProduct as Product], 
                      productId: (fetchProduct as Product).id,
                      fetchedProductInfo: true
                    });
                  }}
                  isSaved={savedProducts[(fetchProduct as Product).id] || false}
                  isPending={isPending}
                />}
              {followUpProduct &&
                <ProductDetailCard
                  product={followUpProduct}
                  isVisible={true}
                  onClose={() => setFollowUpProduct(null)}
                  onSendQuestion={handleProdCardQuery}
                />
              }
              {showLoginModal && !fetchProduct && (
                <AuthModal
                  isVisible={showLoginModal}
                  onClose={() => setShowLoginModal(false)}
                  onSignIn={() => { setShowLoginModal(false); router.push("/(authn)/signin"); }}
                  onSignUp={() => { setShowLoginModal(false); router.push("/(authn)/signup"); }}
                />
              )}
            </View>
          </SafeAreaView>
        </TouchableWithoutFeedback>
      </LinearGradient>
      <ImageUploadDialog
        isVisible={showImageUploadDialog}
        onClose={() => setShowImageUploadDialog(false)}
        defaultTab="social"
        onSocialUrlSubmit={handleSocialUrlSubmit}
      />
    </KeyboardAvoidingView>
  );
};

// Wrap component with context provider and QueryClientProvider
const ChatScreen = () => {
  return (
    <QueryClientProvider client={queryClient}>
      <ChatProductsProvider>
        <ChatScreenContent />
      </ChatProductsProvider>
    </QueryClientProvider>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    height: '100%',
  },
  safeArea: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: theme.spacing.md,
  },
  chatContentContainer: {
    flex: 1,
    width: '100%',
    position: 'relative',
  },
  card: {
    backgroundColor: theme.colors.primary.white,
    borderRadius: theme.spacing.xl - 8,
    width: "100%",
    padding: theme.spacing.lg,
    shadowColor: theme.colors.secondary.black,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: theme.opacity.low,
    shadowRadius: 4,
    elevation: 3,
    borderBottomEndRadius: 0,
    borderBottomLeftRadius: 0,
    marginTop: theme.spacing.md,
    height: "100%",
    marginBottom: 30,
  },
  headerContainer: {
    alignItems: "center",
    marginBottom: theme.spacing.lg,
  },
  chatTitle: {
    fontSize: 24,
    fontWeight: "bold",
    textAlign: "center",
    marginBottom: theme.spacing.sm,
    marginTop: theme.spacing.xl,
    fontFamily: "default-semibold",
  },
  pinkText: {
    color: theme.colors.primary.pink,
  },
  purpleText: {
    color: theme.colors.primary.purple,
    marginTop: 0,
    marginBottom: 0,
  },
  underline: {
    position: "absolute",
    left: 0,
    bottom: -8,
    width: "100%",
    height: 2,
    backgroundColor: theme.colors.secondary.lightGray,
  },
  suggestionsContainer: {
    flexDirection: "row",
    marginTop: theme.spacing.lg,
    position: "relative",
    bottom: 0,
    zIndex: 9999999999999,
  },
  suggestionItem: {
    backgroundColor: theme.colors.secondary.veryLightGray,
    borderRadius: theme.spacing.xl - 12,
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.md - 4,
    marginRight: theme.spacing.sm + 2,
    maxWidth: 180,
  },
  suggestionText: {
    fontSize: 14,
    color: theme.colors.secondary.veryDarkGray,
    fontFamily: "default-regular",
  },
  searchContainer: {
    marginTop: theme.spacing.lg,
    gap: theme.spacing.md,
    flexDirection: "row",
    alignItems: "center",
  },
  searchInput: {
    flexDirection: "row",
    alignItems: "center",
    width: "100%",
    backgroundColor: '#fff',
    borderRadius: 20,
    paddingRight: 8,
    marginBottom: 12,
    position: "relative",
  },
  chatSearchContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: theme.spacing.lg,

  },
  disclaimerContainer: {
    alignItems: "center",
    marginTop: theme.spacing.sm,
  },
  billionHighlight: {
    position: "relative",
  },

  scrollView: {
  },
  chatContainer: {
    marginVertical: theme.spacing.md,
    width: '100%',
    flexDirection: 'column',
    alignItems: 'stretch',
    height: Dimensions.get('window').height - 200,
    flex: 1,
  },
  messageContainer: {
    padding: theme.spacing.md,
    borderRadius: theme.spacing.md,
    marginBottom: theme.spacing.sm,
    maxWidth: "80%",
  },
  userMessage: {
    backgroundColor: theme.colors.primary.lavender,
    alignSelf: "flex-end",
  },
  aiMessage: {
    backgroundColor: theme.colors.secondary.veryLightGray,
    alignSelf: "flex-start",
  },
  messageText: {
    fontSize: 16,
    color: theme.colors.secondary.veryDarkGray,
  },
  loadingContainer: {
    flexDirection: "row",
    alignItems: "center",
    padding: theme.spacing.md,
    alignSelf: "flex-start",
  },
  loadingText: {
    marginLeft: theme.spacing.sm,
    color: theme.colors.secondary.darkGray,
    fontSize: 14,
  },
  fullscreenContainer: {
    flex: 1,
    width: "100%",
    backgroundColor: "transparent",
    borderRadius: theme.spacing.xl - 8,
    position: "relative",
    zIndex: 100,
    borderBottomLeftRadius: 0,
    borderBottomRightRadius: 0,
  },
  chatFooter: {
    width: '100%',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#fff',
    borderTopWidth: 1,
    borderTopColor: '#e0e0e0',
    position: 'absolute',
    bottom: -10,
  },
  messageInput: {
    backgroundColor: '#fff',
    paddingHorizontal: 0,
    paddingVertical: 14,
    fontSize: 16,
    color: '#000',
    flex: 1,
    maxHeight: 120,
    paddingLeft: 0,
  },
  actionBar: {
    flexDirection: 'column',
    justifyContent: 'space-between',
    alignItems: 'center',
    width: '100%',
    flexWrap: 'wrap',
    gap: 8,
  },
  leftButtons: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    width: '100%',
  },
  plusButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#fff',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  plusButtonText: {
    fontSize: 18,
    color: '#000',
    fontWeight: '300',
  },
  actionButton: {
    marginRight: 8,
  },
  actionButtonPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 16,
    paddingHorizontal: 12,
    paddingVertical: 6,
    marginRight: 8,
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  actionButtonText: {
    marginLeft: 4,
    fontSize: 14,
    color: '#000',
  },
  disclaimerText: {
    textAlign: 'center',
    fontSize: 14,
    color: theme.colors.secondary.darkGray,
    marginBottom: 8,
  },
  keyboardAvoidingContainer: {
    width: "100%",
    flex: 1,
  },
  sendButtonContainer: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: theme.colors.secondary.black,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 4,
  },
  sendButton: {
    marginBottom: 8,
    marginLeft: 8,
    backgroundColor: "transparent"
  },
  inputWrapper: {
    width: '100%',
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    zIndex: 1000,
    paddingHorizontal: 4,
    backgroundColor: 'transparent',
    marginBottom: 10,
    boxShadow: '0 10px 15px -3px rgb(0 0 0 / .1), 0 4px 6px -4px rgb(0 0 0 / .1)'
  },
  initialContentScrollView: {
    flexGrow: 1,
  },
  searchInputContainer: {
    zIndex: 100,
    marginBottom: theme.spacing.md,
  },
  carouselWrapperView: {
    height: 'auto',
    marginVertical: theme.spacing.lg,
  },
  keyboardAvoidingViewStyle: {
    width: "100%",
    flex: 1,
  },
  fullFlexContainer: {
    flex: 1,
    height: '100%',
  },
});

export default ChatScreen;

// Export ChatScreenContent for testing purposes if needed
export { ChatScreenContent };


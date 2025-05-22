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
import DiscoverySection from "./discovery/discovery-section";
import { useAuth } from "@clerk/clerk-expo";
import * as Haptics from 'expo-haptics';

// Create a client
const queryClient = new QueryClient();

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
      // @ts-ignore - Type error with React Navigation event listener
      const unsubscribe = navigation.addListener('tabPress', e => {
        // Force refresh logic here
        // For example, you can reset some state or trigger data fetching
        setSearchText("");
        setImageUris([]);
        setLatestAiMessage("");
        setShowLoginModal(false);
        setIsPartQueryLoading(false);
        setIsProductQueryLoading(false);
        setImageUris([]);
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
  // Get API client from useApi hook
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

  const [isDiscoveryOutfitsLoading, setIsDiscoveryOutfitsLoading] = useState(false);
  const [discoveryOutfits, setDiscoveryOutfits] = useState<any[]>([]);
  const [pageNumber, setPageNumber] = useState(0);
  const [pageSize, setPageSize] = useState(20);
  const [totalItems, setTotalItems] = useState(0);
  const [hasMore, setHasMore] = useState(true);
  const [promptValue, setPromptValue] = useState<string>("");
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const currentScrollY = useRef(0);

  // Main API functions that handle both authenticated and public requests
  const searchPartQuery = useCallback(async (data: any, retries = 1) => {
    try {
      // Use client-api pattern instead of direct axios call
      const { ...payload } = { ...data, ...(sessionId ? { sessionId } : {}) };
      setIsPartQueryLoading(true);
      if (isAuthenticated) {
        const response = await callProtectedEndpoint('searchPart', {
          method: 'POST',
          data: { ...payload }
        });
        return response.conversationResponse;
      } else {
        const response = await callPublicEndpoint('searchPartPublic', {
          method: 'POST',
          data: payload
        });
        return response.conversationResponse;
      }
    } catch (error: any) {
      console.error("SearchPart API error:", error);

      // Implement retry logic
      if (retries > 0 && (error.response?.status >= 500 || !error.response)) {
        return new Promise(resolve => {
          setTimeout(() => {
            resolve(searchPartQuery(data, retries - 1));
          }, 1000); // Wait 1 second before retry
        });
      }

      throw error;
    }
    finally {
      setIsPartQueryLoading(false);
    }
  }, [isAuthenticated, callProtectedEndpoint, callPublicEndpoint]);

  // Handle product search based on authentication status
  const handleProductSearch = useCallback(async (data: any, retries = 1) => {
    try {
      setIsProductQueryLoading(true);
      if (isAuthenticated) {
        // Use protected endpoint if authenticated
        return await callProtectedEndpoint('searchProductsAuth', {
          method: 'POST',
          data
        });
      } else {
        // Use public endpoint if not authenticated
        return await callPublicEndpoint('searchProducts', {
          method: 'POST',
          data
        });
      }
    } catch (error: any) {
      console.error("Product search API error:", error);

      // Implement retry logic
      if (retries > 0 && (error.response?.status >= 500 || !error.response)) {
        return new Promise(resolve => {
          setTimeout(() => {
            resolve(handleProductSearch(data, retries - 1));
          }, 1000); // Wait 1 second before retry
        });
      }

      throw error;
    }
    finally {
      setIsProductQueryLoading(false);
    }
  }, [isAuthenticated, callPublicEndpoint, callProtectedEndpoint]);

  const prodCardQueryMutation = useProdCardQueryMutation(
    (data: any, variables: any) => {
      setIsProductQueryLoading(false);
      const shoppingList = data.shopping_results;
      const transformedShoppingList = transformShoppingList(shoppingList);
      dispatch(chatActions.addProducts(transformedShoppingList, sessionId || "", data.aiResponse));
    },
    (error: any, variables: any) => {
      setIsProductQueryLoading(false);
    }
  );
  // Reset error if it exists when component mounts
  useEffect(() => {
    if (error) {
      dispatch(chatActions.setError(null));
    }
  }, [error, dispatch]);
  let isMounted = true;
  const controller = new AbortController();
  useEffect(() => {
    const fetchPromptChips = async () => {
      // Determine endpoint based on authentication status
      // Assuming 'generatePromptChips' and 'generatePromptChipsPublic' are the correct endpoint names
      const endpoint = isAuthenticated ? 'getPromptChipsAuth' : 'getPromptChips';

      // Prevent concurrent API calls, assuming hasFetchedUrl is a useRef(false) defined in the component
      if (hasFetchedUrl.current) return;
      hasFetchedUrl.current = true;

      try {
        // Make the API call using existing helper functions
        // Assuming POST request as in the original context, with no body for prompt chips
        const response = await (isSignedIn
          ? callProtectedEndpoint(endpoint, { method: 'POST', data: {} })
          : callPublicEndpoint(endpoint, { method: 'POST', data: {} }));

        // Process the response
        // Assuming response is an array of objects like { search_query: "string" }
        // And setPromptChips is a state setter function defined in the component
        console.log("response", response)
        if (response && Array.isArray(response)) {
          const searchQueries = response.map((item: any) => item.search_query);
          setPromptChips(searchQueries);
        } else {
          console.warn('Failed to fetch prompt chips or unexpected response structure:', response);
          setPromptChips([]); // Set to empty array on failure or bad structure
        }
        // Analytics for success (e.g., trackEvent from original code) would be here if a similar mechanism exists
      } catch (error) {
        console.error('Error fetching prompt chips:', error);
        setPromptChips([]); // Set to empty array on error
        // Analytics for failure (e.g., trackEvent from original code) would be here if a similar mechanism exists
      } finally {
        // Reset flag whether successful or not
        hasFetchedUrl.current = false;
      }
    };

    fetchPromptChips();
  }, [isSignedIn]);
  useEffect(() => {
    const fetchDiscoveryOutfits = async () => {
      if (isFetchingRef.current) return;

      isFetchingRef.current = true;
      setIsDiscoveryOutfitsLoading(true);
      setDiscoveryOutfits([]);
      setPageNumber(0);

      try {
        const params = {
          pageNumber: 0,
          pageSize,
          gender: "male/female",
        };

        const data = await getDiscoveryOutfits(callPublicEndpoint, params);

        setDiscoveryOutfits(data.discoveryOutfits);
        setTotalItems(data.totalItems);
        setHasMore(data.discoveryOutfits.length < data.totalItems);

      } catch (error: any) {
        if (isMounted && error.name !== 'AbortError') {
          console.error('Error fetching initial discovery outfits:', error);
          Toast.show({
            type: "error",
            text1: "Search Error",
            text2: 'Failed to load your discovery outfits',
            visibilityTime: 2000  
          });
          setDiscoveryOutfits([]);
          setTotalItems(0);
          setHasMore(false);
        }
      } finally {

        setIsDiscoveryOutfitsLoading(false);

        isFetchingRef.current = false;
      }
    };

    fetchDiscoveryOutfits();

    return () => {
      isMounted = false;
      controller.abort();
    };
  }, [pageSize])

  // Transform products from API response to our Product format
  const transformProducts = useCallback((apiProducts: any[]): Product[] => {
    if (!apiProducts || !Array.isArray(apiProducts)) return [];


    return apiProducts.map((item, index) => {
      // Use our utility to get a properly formatted image URL
      const imageUrl = extractImageUrl(item);

      return {
        id: item.id || item.product_id || String(Math.random()),
        brand: item.brand || item.designer || "Unknown Brand",
        name: item.name || item.title || "Product",
        price: item.price || "$0.00",
        image: imageUrl,
        url: item.url || item.link || "",
        product_info: item
      };
    });
  }, []);


  // React Query mutation for product search
  const searchMutation = useMutation({
    mutationFn: async (searchInput: { text: string, image?: string | null }) => {
      const userMessage = searchInput.text;
      const userImage = imageUris.length > 0 ? imageUris[0] : null;


      // Create payload for both APIs
      const payload = {
        chatHistory: [
          ...chatHistory,
          {
            role: "user",
            text: userMessage,
            ...(userImage ? { image: userImage } : {})
          }
        ],
        usedItems,
        personalization,
        inputType: userImage ? "img+txt" : "text",
        ...(sessionId ? { sessionId } : {})
      };

      // Step 1: First call the searchPart API to get AI-generated search query
      const searchPartResponse = await searchPartQuery(payload);

      // Check if we got a valid search query response
      if (!searchPartResponse || searchPartResponse.includes("Sorry")) {
        throw new Error("Failed to get search query from AI");
      }

      // Add the AI response to chat history
      const aiGeneratedQuery = searchPartResponse;

      // Step 2: Call the product search API with the complete chat history
      const updatedPayload = {
        ...payload,
        chatHistory: [
          ...payload.chatHistory,
          { role: "ai", text: aiGeneratedQuery }
        ]
      };

      // Add AI message to chat
      setLatestAiMessage(aiGeneratedQuery);
      dispatch(chatActions.addAiMessage(aiGeneratedQuery));

      // Make the second API call to get products using the appropriate endpoint
      return {
        aiResponse: aiGeneratedQuery,
        productResults: await handleProductSearch(updatedPayload)
      };
    },
    onMutate: (searchInput) => {
      // Set loading state
      dispatch(chatActions.setLoading(true));
      
      // No need for scrolling here - the product-search-results component will handle it
    },
    onSuccess: (data) => {
      // Stop loading
      dispatch(chatActions.setLoading(false));
      setImageUris([]);
      
      // Add products if they exist
      if (data.productResults && data.productResults.shopping_results && data.productResults.shopping_results.length > 0) {
        const transformedProducts = transformProducts(data.productResults.shopping_results);

        if (transformedProducts.length > 0) {
          // Always use addProducts to append new products rather than replacing
          dispatch(chatActions.addProducts(transformedProducts, data.productResults.sessionId, data.aiResponse));
          
          // No need to handle scrolling here - let the product-search-results component handle it
        } else {
          console.warn("No products were transformed successfully");
        }
      } else {
        console.warn("No products returned from API");
      }

      // Clear search text
      setSearchText("");
    },
    onError: (error: any) => {
      console.error("Search mutation error:", error);

      // Stop loading
      dispatch(chatActions.setLoading(false));
      setImageUris([]);

      // Add error message to chat
      dispatch(
        chatActions.addAiMessage(
          "Sorry, I couldn't find any products matching your request. Please try again with a different search."
        )
      );

      // Set error
      dispatch(chatActions.setError(error.message || "Failed to search products"));

      // Show toast
      Toast.show({
        type: "error",
        text1: "Search Error",
        text2: error.message || "Failed to search products",
        visibilityTime: 2000
      });

      // Clear search text
      setSearchText("");
    },
  });

  // Function to handle sending a message
  const handleSendMessage = async () => {
    console.log("Handle Send Message", searchText);

    if (!searchText.trim() || searchMutation.isPending) return;

    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    
    const userMessage = searchText.trim();
    setSearchText(""); // Clear input

    // Check if there's an active image upload in progress
    const imageData = imageUris.length > 0 ? imageUris[0] : null;

    // Determine the input type based on whether an image is included
    const currentInputType = imageData ? "img+txt" : "text";

    // Update the input type in the context if needed
    if (inputType !== currentInputType) {
      dispatch(chatActions.setInputType(currentInputType));
    }

    // Track the current conversation position for scroll restoration
    const currentPosition = scrollViewRef.current ? 
      { y: currentScrollY.current } : 
      { y: 0 };
    
    console.log("Current scroll position before adding message:", currentPosition);
    
    // Add user message to chat history (with image if available)
    if (imageData) {
      dispatch(chatActions.addUserMessage(userMessage, imageData));
    } else {
      dispatch(chatActions.addUserMessage(userMessage));
    }

    // Make sure we scroll to the bottom immediately after adding the user message
    InteractionManager.runAfterInteractions(() => {
      if (scrollViewRef.current) {
        scrollViewRef.current.scrollToEnd({ animated: false });
        
        // Then scroll again with animation after a short delay
        setTimeout(() => {
          if (scrollViewRef.current) {
            scrollViewRef.current.scrollToEnd({ animated: true });
          }
        }, 100);
      }
    });

    // Execute the search mutation with both text and any image
    searchMutation.mutate({ text: userMessage, image: imageData });
    
    Keyboard.dismiss();
  };

  const handleProductPress = (product: Product) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setFetchProduct(product);
    // Implement product navigation/details view
  };
  const ProductSearchResultsMemo = useCallback(ProductSearchResults, [products, chatHistory, isLoading, latestAiMessage, conversationGroups]);

  const handleImageUpload = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.5,
      base64: true,
    }).then((result) => {
      if (!result.canceled) {
        if (result.assets[0].base64) {
          setImageUris([result.assets[0].base64]);
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        }
      }
    });
  };

  const handleRemoveImage = (uri: string) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setImageUris(imageUris.filter((imageUri) => imageUri !== uri));
  };

  const handleFollowUpPress = (product: Product) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setFollowUpProduct(product);
    // Implement follow up logic
  };

  const handleProdCardQuery = async (question: string, product: any) => {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    setIsProductQueryLoading(true);
    dispatch(chatActions.addUserMessage(question, product?.image))
    dispatch(chatActions.addAiMessage("Your searched products"))
    prodCardQueryMutation.mutate(
      {
        "product_title": followUpProduct?.name,
        "product_img_url": followUpProduct?.image,
        "query": question,
        "chat_history": [
          ...chatHistory,
          {
            "role": "user",
            "text": question
          }
        ],
        "gender": await getSavedDetails('gender') || "male"
      }
    );
    setFollowUpProduct(null);
  };

  const handleImageSelected = async (index: number) => {
    // Haptics.selectionAsync(); // Haptic feedback for selection
    try {
      const activeGrp = conversationGroups.find(c => c.id === activeConversationGroup);
      const imageUrl = activeGrp?.aiMessage[activeGrp.aiMessage.length - 1].social?.images[index].img_url;
      dispatch(chatActions.setInputType("imgurl+txt"));
      setIsProductQueryLoading(true);
      if (imageUrl) {
        let response;
        if (isAuthenticated) {
          response = await callProtectedEndpoint('findProducts', {
            method: 'POST',
            data: {
              img_url: imageUrl,
              personalization: false
            }
          });
        } else {
          response = await callPublicEndpoint('findProductsPublic', {
            method: 'POST',
            data: {
              img_url: imageUrl,
              personalization: false
            }
          });
        }
        console.log("response from findProducts", response);
        if (Array.isArray(response)) {
          dispatch(chatActions.addAiMessage("We found the following categories in your image:", "text", response))
          dispatch(chatActions.setProductsByCategory(response));
        } else {
          dispatch(chatActions.addAiMessage("Sorry, I couldn't find any products matching your request. Please try again with a different search."));
        }
      }
    } catch (error) {
      console.error("Error extracting social media links:", error);
      dispatch(chatActions.addAiMessage("Sorry, I couldn't find any products matching your request. Please try again with a different search."));
    } finally {
      setIsProductQueryLoading(false);
    }
  };

  const handleSocialUrlSubmit = async (url: string) => {
    try {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      dispatch(chatActions.addUserMessage(url));
      dispatch(chatActions.addAiMessage("Please select the image where you are looking for a fashion item", "social"));
      dispatch(chatActions.setSocialImages([], true));
      setShowImageUploadDialog(false);
      const response = await callProtectedEndpoint('extractSocials', {
        method: 'POST',
        data: {
          url: url
        }
      });
      console.log("response from extractSocials", response);
      if (Array.isArray(response.media) && response.media.length > 0) {
        dispatch(chatActions.setSocialImages(response.media, false));
      } else {
        Toast.show({
          type: 'error',
          text1: 'Failed to extract social media links',
          visibilityTime: 2000
        });
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
      const params = {
        pageNumber: nextPage,
        pageSize,
        gender: "male/female",
      };

      const nextPageData = await getDiscoveryOutfits(callPublicEndpoint, params)
      setDiscoveryOutfits(prevItems => [...prevItems, ...nextPageData.discoveryOutfits]);
      setPageNumber(nextPage);
      setHasMore(discoveryOutfits.length + nextPageData.discoveryOutfits.length < totalItems);

    } catch (error) {
      console.error('Error fetching more discovery outfits:', error);
      Toast.show({
        type: "error",
        text1: "Search Error",
        text2: 'Failed to load more discovery outfits',
        visibilityTime: 2000
      });
    } finally {
      setIsLoadingMore(false);
      isFetchingRef.current = false;
    }
  }, [isLoadingMore, hasMore, pageNumber, pageSize, discoveryOutfits.length, totalItems]);

  const handleScroll = (event: { nativeEvent: { contentOffset: { y: number } } }) => {
  currentScrollY.current = event.nativeEvent.contentOffset.y;
};

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : undefined}
      style={[{ flex: 1 }, styles.keyboardAvoidingContainer]}
      keyboardVerticalOffset={Platform.OS === "ios" ? 0 : 0}>
      <LinearGradient
        colors={['#FFFFFF', '#FFFFFF'] as const}
        start={{ x: 0.5, y: 0 }}
        end={{ x: 0.5, y: 1 }}
        style={[styles.container]}
      >
        <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
          <SafeAreaView style={styles.safeArea}>
            <View style={styles.chatContainer}>
              {!conversationGroups.length &&
                <ScrollView
                  contentContainerStyle={{ alignItems: 'stretch' }}
                  keyboardShouldPersistTaps="handled"
                  keyboardDismissMode="on-drag"
                  onScroll={handleScroll}
                  scrollEventThrottle={16}
                >
                  <Header darkMode={true} />
                  <View style={[styles.container, { zIndex: 100}]}>
                    <SearchInput
                      darkMode={true}
                      inputMode={'text'}
                      // setInputMode={setInputMode}
                      inputValue={searchText}
                      setInputValue={setPromptValue}
                      // onCameraClick={() => setIsUploadDialogOpen(true)}
                      setSearchText={setSearchText}
                      onSearch={handleSendMessage}
                      promptChips={promptChips}
                      hasFetchedUrl={hasFetchedUrl.current}
                      handleInstagramClick={() => setShowImageUploadDialog(true)}
                    />
                  </View>
                  
                  {/* Wrapper for DiscoverySection with new styling and conditional rendering */}
                    <DiscoverySection discoveryOutfits={discoveryOutfits} hasMore={hasMore} loadMoreItems={loadMoreItems} isLoadingMore={isLoadingMore} />
                </ScrollView>
              }

              {conversationGroups.length ? (
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
                      savedProducts,
                      savingProducts,
                      saveSuccess,
                      saveError,
                      saveShoppingItem,
                      isPending
                    }}
                    onFollowUpPress={handleFollowUpPress}
                    followUpProduct={followUpProduct}
                    scrollViewRef={scrollViewRef}
                    showImageSelection={socialImages.length > 0}
                    imageSelectionUrls={socialImages}
                    onImageSelected={handleImageSelected}
                  />
                  
                  <View style={[styles.inputWrapper, { backgroundColor: 'transparent' }]}>
                    <MessageInput
                      onSend={handleSendMessage}
                      onImageSelect={handleImageUpload}
                      placeholder="Type a message..."
                      disabled={isLoading}
                      renderImagePreview={() => (
                        <ImagePreview imageUris={imageUris} onRemoveImage={handleRemoveImage} />
                      )}
                      showImagePreview={imageUris.length > 0}
                      setSearchText={setSearchText}
                      searchText={searchText}
                    />
                  </View>
                </View>
              ) : (
                <></>
              )}

              {fetchProduct &&
                <ProductDetails
                  fetchProduct={fetchProduct}
                  isVisible={true}
                  onClose={() => setFetchProduct(null)}
                  onAddToShoppingList={() => {
                    saveShoppingItem({
                      products: [fetchProduct],
                      productId: fetchProduct.id,
                      fetchedProductInfo: true
                    });
                  }}
                  isSaved={savedProducts[fetchProduct.id] || false}
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
                  onSignIn={() => {
                    setShowLoginModal(false);
                    router.push("/(authn)/signin");
                  }}
                  onSignUp={() => {
                    setShowLoginModal(false);
                    router.push("/(authn)/signup");
                  }}
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
    // maxHeight: 100,
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
    // flexGrow: 1,
  },
  // Chat styles
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
  // Input styles
  chatFooter: {
    width: '100%',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#fff',
    borderTopWidth: 1,
    borderTopColor: '#e0e0e0',
    // borderRadius: 20,
    // borderBottomLeftRadius: 0,
    // borderBottomRightRadius: 0,
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
});

export default ChatScreen;

// Export ChatScreenContent for testing purposes if needed
export { ChatScreenContent };


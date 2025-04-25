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
    conversationGroups
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

      // Scroll to bottom
      setTimeout(() => {
        scrollViewRef.current?.scrollToEnd({ animated: true });
      }, 100);
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
        } else {
          console.warn("No products were transformed successfully");
        }
      } else {
        console.warn("No products returned from API");
      }

      // Clear search text
      setSearchText("");

      // Scroll to bottom
      setTimeout(() => {
        scrollViewRef.current?.scrollToEnd({ animated: true });
      }, 100);
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
      });

      // Clear search text
      setSearchText("");
    },
  });

  // Function to handle sending a message
  const handleSendMessage = async () => {
    if (!searchText.trim() || searchMutation.isPending) return;

    const userMessage = searchText.trim();
    setSearchText(""); // Clear input

    // Check if there's an active image upload in progress
    // This could be extended to handle actual image uploads
    const imageData = imageUris.length > 0 ? imageUris[0] : null; // Replace with actual image data if implementing image upload

    // Determine the input type based on whether an image is included
    const currentInputType = imageData ? "img+txt" : "text";

    // Update the input type in the context if needed
    if (inputType !== currentInputType) {
      dispatch(chatActions.setInputType(currentInputType));
    }

    // Add user message to chat history (with image if available)
    if (imageData) {
      dispatch(chatActions.addUserMessage(userMessage, imageData));
    } else {
      dispatch(chatActions.addUserMessage(userMessage));
    }

    // Execute the search mutation with both text and any image
    searchMutation.mutate({ text: userMessage, image: imageData });
    Keyboard.dismiss();
  };

  const handleProductPress = (product: Product) => {
    setFetchProduct(product);
    // Implement product navigation/details view
  };
  const ProductSearchResultsMemo = useCallback(ProductSearchResults, [products, chatHistory, isLoading, latestAiMessage,conversationGroups]);

  const handleImageUpload = () => {
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
        }
      }
    });
  };

  const handleRemoveImage = (uri: string) => {
    setImageUris(imageUris.filter((imageUri) => imageUri !== uri));
  };

  const handleFollowUpPress = (product: Product) => {
    setFollowUpProduct(product);
    // Implement follow up logic
  };

  const handleProdCardQuery = async (question: string, product: any) => {
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
  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      style={[{ flex: 1 }, styles.keyboardAvoidingContainer]}>
      <LinearGradient
        colors={["rgba(243, 234, 244, 1)", "rgba(237, 212, 240, 1)", "rgba(243, 234, 244, 1)"] as const
        }
        style={[styles.container]}
      >
        <TouchableWithoutFeedback onPress={Keyboard.dismiss}>

          <SafeAreaView style={styles.safeArea}>
            <View style={styles.chatContainer}>
              <View style={[styles.fullscreenContainer]}>
                {conversationGroups.length ? (
                  <ProductSearchResultsMemo
                    inputType={inputType}
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
                  />
                ) : (
                  <></>
                )}
              </View>
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
            {/* Input box at the bottom */}

            {chatHistory.length ?
              <View style={[{ position: 'absolute', bottom: -20, left: 0, right: 0, zIndex: 1000 }]}>
                <MessageInput
                  searchText={searchText}
                  setSearchText={setSearchText}
                  showImagePreview={imageUris.length > 0} renderImagePreview={() => (
                    <ImagePreview imageUris={imageUris} onRemoveImage={handleRemoveImage} />
                  )}
                  onSend={handleSendMessage}
                  onImageSelect={handleImageUpload}

                />
              </View>
              : <View style={styles.chatFooter}>
                {imageUris.length > 0 &&
                  <ImagePreview onRemoveImage={handleRemoveImage} imageUris={imageUris} />}
                <View style={styles.searchInput}>
                  <TextInput
                    style={styles.messageInput}
                    placeholder="Search for any fashion item..."
                    placeholderTextColor={theme.colors.secondary.mediumDarkGray}
                    value={searchText}
                    onChangeText={setSearchText}
                    multiline
                  />
                  <MessageSendButton searchText={searchText} disabled={searchText.trim().length === 0} onSend={handleSendMessage} onImageSelect={handleImageUpload} />
                </View>
                {/* <View style={styles.actionBar}>
                  <View style={styles.leftButtons}>
                    <TouchableOpacity onPress={handleImageUpload} style={styles.actionButtonPill}>
                      <Image size={16} color="#000" />
                      <Text className="text-sm text-red">Visual search</Text>
                    </TouchableOpacity>
                  </View>
                </View> */}
                <Text style={styles.disclaimerText}>
                  Look AI can make mistakes. shop at your own risk.
                </Text>
              </View>}
          </SafeAreaView>

        </TouchableWithoutFeedback>

      </LinearGradient>
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
  },
  safeArea: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: theme.spacing.md,
    // position: "relative",
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
    maxHeight: 100,
    position: "absolute",
    bottom: 0,
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
    flexGrow: 1,
  },
  // Chat styles
  chatContainer: {
    marginVertical: theme.spacing.md,
    width: '100%',
    flexDirection: 'column',
    alignItems: 'flex-end',
    height: Dimensions.get('window').height - 200,
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
    overflow: "hidden",
    // position: "relative",
    borderBottomLeftRadius: 0,
    borderBottomRightRadius: 0
  },
  // Input styles
  chatFooter: {
    width: '100%',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#fff',
    borderTopWidth: 1,
    borderTopColor: '#e0e0e0',
    borderRadius: 20,
    borderBottomLeftRadius: 0,
    borderBottomRightRadius: 0,
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
});

export default ChatScreen;

// Export ChatScreenContent for testing purposes if needed
export { ChatScreenContent };

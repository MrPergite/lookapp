import React, { useState, useRef, useEffect, useMemo, useReducer } from 'react';
import {
  View,
  Text,
  Image,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Dimensions,
  InteractionManager
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { ThumbsUp, ThumbsDown, Bookmark, User, UserIcon, Camera, ArrowUp, Search, Mic, LucideIcon, Check, X, Loader, LoaderCircle } from 'lucide-react-native';
import { ThemedText } from '@/components/ThemedText';
import theme from '@/styles/theme';
import { chatActions, ChatMessage, useChatProducts } from './context';
import useAppTheme from '@/hooks/useTheme';
import SearchProgressSteps, { ImageLoader } from '@/components/SearchProgressSteps';
import { usePostReactionMutation, useProtectedMutation } from './hooks/query';
import Animated, { useSharedValue, useAnimatedStyle, withTiming, withSequence, withDelay, Easing, withRepeat } from 'react-native-reanimated';
import TypewriterText from '@/components/TypewriterText';
const PRODUCTS_PER_GROUP = 4; // Max products to show per query group

interface Product {
  id: string;
  brand: string;
  name: string;
  price: string;
  image: string;
  url?: string;
  isSaved?: boolean;
  product_info: any;
}

interface ProductSearchResultsProps {
  products: Product[];
  title: string;
  subtitle: string;
  chatHistory: ChatMessage[];
  isLoading?: boolean;
  onProductPress?: (product: Product) => void;
  onSeeMorePress?: () => void;
  onBack: () => void;
  isPartQueryLoading?: boolean;
  isProductQueryLoading?: boolean;
  setShowLoginModal: (show: boolean) => void;
  saveShoppingItemConfig: {
    savedProducts: Record<string, boolean>;
    savingProducts: Record<string, boolean>;
    saveSuccess: Record<string, boolean>;
    saveError: Record<string, boolean>;
    saveShoppingItem: ({ products, productId, fetchedProductInfo }: { products: Product[], productId: string, fetchedProductInfo: boolean }) => void;
    isPending: boolean;
  }
  latestAiMessage: string;
}

interface ConversationGroup {
  userMessage: ChatMessage | null;
  aiMessage: ChatMessage | null;
  products: Product[];
  expanded: boolean;
}

const ProductSearchResults: React.FC<ProductSearchResultsProps> = ({
  products = [],
  title = "",
  subtitle = "",
  chatHistory = [],
  latestAiMessage = "",
  isLoading = false,
  onProductPress,
  onSeeMorePress,
  onBack,
  isPartQueryLoading,
  isProductQueryLoading,
  setShowLoginModal,
  saveShoppingItemConfig
}) => {
  const scrollViewRef = useRef<ScrollView | null>(null);
  const appTheme = useAppTheme();
  const [reactedProducts, setReactedProducts] = useState<Record<string, boolean>>({});
  const [, { mutate: postReaction }] = usePostReactionMutation(reactedProducts, (reaction: Record<string, boolean>) => {
    setReactedProducts({ ...reaction });
  });
  const { savedProducts, savingProducts, saveSuccess, saveError, saveShoppingItem } = saveShoppingItemConfig || {}
  const { dispatch } = useChatProducts();

  // Add state for managing loading sequence
  const [showTypewriter, setShowTypewriter] = useState(false);
  const [showProducts, setShowProducts] = useState(false);
  const [currentProducts, setCurrentProducts] = useState<Product[]>([]);
  const [currentChatHistory, setCurrentChatHistory] = useState<ChatMessage[]>([]);

  // Reset states when loading starts
  useEffect(() => {
    if (isPartQueryLoading) {
      setShowProducts(false);
      setCurrentProducts([]);
      setCurrentChatHistory(chatHistory);
    }

  }, [isPartQueryLoading, chatHistory]);


  useEffect(() => {
    if (latestAiMessage) {
      setShowTypewriter(true);
    }
  }, [latestAiMessage]);

  // Update states based on loading sequence
  useEffect(() => {
    if (!isPartQueryLoading && isProductQueryLoading) {
      // setShowTypewriter(true);
      setShowProducts(false);
    }
    else if (!isPartQueryLoading && !isProductQueryLoading) {
      setShowTypewriter(false);
      setShowProducts(true);
      setCurrentProducts(products);
    }
  }, [isPartQueryLoading, isProductQueryLoading, products]);

  // Group the chat history and products into conversation pairs
  const conversationGroups = useMemo(() => {
    const groups: ConversationGroup[] = [];

    // Skip if we don't have enough messages
    if (chatHistory.length < 2) {
      return groups;
    }

    // Process chat history in pairs of user/AI messages
    for (let i = 0; i < chatHistory.length; i += 2) {
      const userMessage = chatHistory[i]?.role === 'user' ? chatHistory[i] : null;
      const aiMessage = chatHistory[i + 1]?.role === 'assistant' || chatHistory[i + 1]?.role === 'ai'
        ? chatHistory[i + 1]
        : null;


      if (userMessage) {
        // Determine product slice for this conversation
        // In a real app, you'd need a proper way to associate products with conversations
        // For now, we'll divide the products evenly among the conversation groups

        // Each group starts with collapsed products
        groups.push({
          userMessage,
          aiMessage,
          products: [], // We'll distribute products later
          expanded: false
        });
      }
    }

    // Distribute products to each conversation group
    // For now, simply divide products evenly among the groups
    const productsPerGroup = 24;
    groups.forEach((group, index) => {
      const start = index * productsPerGroup;
      const end = Math.min(start + productsPerGroup, products.length);
      group.products = products.slice(start, end);
    });

    return groups;
  }, [chatHistory, products, reactedProducts]);

  // Scroll to bottom when new messages arrive
  useEffect(() => {
    if (scrollViewRef.current) {
      setTimeout(() => {
        scrollViewRef.current?.scrollToEnd({ animated: true });
      }, 300);
    }
  }, [chatHistory.length, products.length]);

  const toggleSave = (productId: string) => {


    // Call the API with the formatted payload
    saveShoppingItem({ products, productId, fetchedProductInfo: true });
  };

  const [productsToShowCount, setProductsToShowCount] = useState<Record<number, number>>({});

  const toggleGroupExpansion = (groupIndex: number) => {
    setProductsToShowCount(prev => {
      const currentCount = prev[groupIndex] || PRODUCTS_PER_GROUP;
      const newCount = currentCount + PRODUCTS_PER_GROUP;
      return {
        ...prev,
        [groupIndex]: newCount
      };
    });
  };

  const handleReaction = (product_info: any, like: boolean) => {
    console.log("productId", product_info);
    postReaction({
      like,
      product_info
    })
  }

  console.log("reactedProducts", reactedProducts);

  // Create a rotation animation for the loader
  const rotation = useSharedValue(0);

  // Set up the continuous rotation animation once
  useEffect(() => {
    // Create a continuous rotation animation
    rotation.value = withRepeat(
      withTiming(360, {
        duration: 1000,
        easing: Easing.linear
      }),
      -1, // Infinite repetitions
      false // Don't reverse
    );
  }, []);

  // Create the animated style for rotation
  const spinningStyle = useAnimatedStyle(() => {
    return {
      transform: [{ rotate: `${rotation.value}deg` }],
    };
  });

  const renderProduct = (item: Product, index: number) => {
    const isSaved = savedProducts[item.id] || false;
    const productId = item.product_info?.product_id || item.id;
    const isLiked = reactedProducts[productId] === true;
    const isDisliked = reactedProducts[productId] === false;

    const isSaving = savingProducts[item.id] || false;
    const isSuccess = saveSuccess[item.id] || false;
    const isError = saveError[item.id] || false;

    // Custom button styles for better visual feedback
    const likeButtonStyle = [
      styles.actionIconButton,
      isLiked ? { backgroundColor: theme.colors.primary.purple } : null
    ];

    const dislikeButtonStyle = [
      styles.actionIconButton,
      isDisliked ? { backgroundColor: theme.colors.primary.purple } : null
    ];

    // Render appropriate icon based on save state
    const renderSaveIcon = () => {
      if (isSaving) {
        return (
          <Animated.View style={spinningStyle}>
            <LoaderCircle size={22} color="#ffffff" strokeWidth={2} />
          </Animated.View>
        );
      } else if (isSuccess) {
        return <Check size={22} color="#ffffff" strokeWidth={2} />;
      } else if (isError) {
        return <X size={22} color="#ffffff" strokeWidth={2} />;
      } else {
        return (
          <Bookmark
            size={22}
            color="#ffffff"
            fill={isSaved ? theme.colors.primary.white : "none"}
            strokeWidth={2}
          />
        );
      }
    };

    // Determine bookmark button style based on state
    const bookmarkButtonStyle = [
      styles.bookmarkButton,
      isSaved ? styles.bookmarkButtonActive : null,
      isSuccess ? styles.successButton : null,
      isError ? styles.errorButton : null,
      isSaving ? styles.loadingButton : null
    ];

    return (
      <View key={`product-${item.id}-${index}`} style={styles.productItem}>
        <TouchableOpacity
          style={styles.productTouchable}
          activeOpacity={0.7}
          onPress={() => onProductPress && onProductPress(item)}
        >
          <View style={styles.imageWrapper}>
            {item.image ? (
              <Image
                source={{ uri: item.image }}
                style={styles.productImage}
                resizeMode="cover"
              />
            ) : (
              <View style={styles.imagePlaceholder}>
                <Ionicons name="image-outline" size={40} color="#a8a8a8" />
                <Text style={styles.placeholderText}>No image available</Text>
              </View>
            )}
            <LinearGradient
              colors={['transparent', 'rgba(0,0,0,0.3)', 'rgba(0,0,0,0.7)']}
              locations={[0, 0.6, 1]}
              style={styles.imageGradient}
            >
              <View style={styles.productLabel}>
                <Text style={[styles.productLabelText, { color: theme.colors.secondary.veryLightGray }]}>{item.brand}</Text>
                <Text style={styles.productLabelText} numberOfLines={1}>{item.name}</Text>
                <Text style={styles.productPriceLabel}>{item.price}</Text>
              </View>
            </LinearGradient>

            <View style={styles.actionOverlay}>
              <View style={styles.leftActions}>
                <TouchableOpacity onPress={() => handleReaction(item.product_info, true)} key={`${item.id}-like`} style={likeButtonStyle}>
                  <ThumbsUp data-testid={`like-${item.id}`} size={18} color="#fff" strokeWidth={2} />
                </TouchableOpacity>
                <TouchableOpacity onPress={() => handleReaction(item.product_info, false)} key={`${item.id}-dislike`} style={dislikeButtonStyle}>
                  <ThumbsDown data-testid={`dislike-${item.id}`} size={18} color="#fff" strokeWidth={2} />
                </TouchableOpacity>
              </View>
              <TouchableOpacity
                style={bookmarkButtonStyle}
                onPress={() => toggleSave(item.id)}
                disabled={isSaving}
              >
                {renderSaveIcon()}
              </TouchableOpacity>
            </View>
          </View>
        </TouchableOpacity>
      </View>
    );
  };

  const renderMessageAvatar = (message: ChatMessage, index: number) => {
    if (message.role === 'user') {
      return (
        <View
          style={styles.messageContainer}>
          <View style={[styles.userMessageContainer, { width: message.image ? '100%' : 'auto' }]}>
            <LinearGradient
              colors={["#a855f7", "#c084fc", "#ec4899"]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.userMessageGradient}
            >
              <Text style={styles.messageText}>{message.text}</Text>
              {message.image && (
                <Image
                  source={{ uri: `data:image/jpeg;base64,${message.image}` }}
                  style={styles.messageImage}
                  resizeMode="cover"
                />
              )}
            </LinearGradient>
          </View>

          <LinearGradient
            colors={['#f3e8ff', '#fce7f3']} // purple-100 to pink-100
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.userAvatarContainer}>
            <UserIcon size={28} color={appTheme.colors.primary.purple} style={styles.userAvatarBackground} />
          </LinearGradient>
        </View>
      )
    }
    return (
      <View style={styles.aiMessageContainer}>
        <Image source={require('@/assets/images/ai-message-avatar.png')} style={styles.avatarContainer} />
        <View style={styles.aiMessage}>
          <Text style={[styles.messageText, { color: theme.colors.secondary.black }]}>{message.text}</Text>
        </View>
      </View>
    )
  }

  const renderAIMessageWithTypewriter = () => {
    return (
      <View style={styles.aiMessageContainer}>
        <Image source={require('@/assets/images/ai-message-avatar.png')} style={styles.avatarContainer} />
        <View style={styles.aiMessage}>
          <TypewriterText
            text={latestAiMessage || "I'm searching for products that match your description..."}
            speed={30}
            onComplete={() => {
              if (isProductQueryLoading) {
                dispatch(chatActions.addAiMessage(latestAiMessage));
                setShowTypewriter(false);
              }
            }}
            onTextChange={() => {
              setTimeout(() => {
                scrollViewRef.current?.scrollToEnd({ animated: true });
              }, 100);
            }}
          />
        </View>
      </View>
    );
  };

  // Render a conversation group with its products
  const renderConversationGroup = (group: ConversationGroup, index: number) => {
    // Get the number of products to show for this group
    const currentShowCount = productsToShowCount[index] || PRODUCTS_PER_GROUP;

    // Calculate if there are more products to show
    const productsToShow = group.products.slice(0, currentShowCount);
    const hasMoreProducts = group.products.length > productsToShow.length;

    return (
      <View key={`group-${index}`} style={[styles.conversationGroup, { borderBottomColor: appTheme.colors.border }]}>
        {/* User message */}
        {group.userMessage && renderMessageAvatar(group.userMessage, index)}

        {/* AI response */}
        {group.aiMessage && renderMessageAvatar(group.aiMessage, index)}

        {/* Products for this conversation */}
        {group.aiMessage && productsToShow.length > 0 && !isProductQueryLoading && (
          <View style={styles.productSection}>
            <View style={styles.productGrid}>
              {productsToShow.map((item, pIndex) => (
                <View
                  key={`group-${index}-product-${item.id}`}
                  style={pIndex % 2 === 0 ? styles.productItemLeft : styles.productItemRight}
                >
                  {renderProduct(item, pIndex)}
                </View>
              ))}
            </View>

            {/* See More button - only show if there are more products to load */}
            {hasMoreProducts && (
              <TouchableOpacity
                style={styles.seeMoreButton}
                onPress={() => toggleGroupExpansion(index)}
              >
                <ThemedText style={styles.seeMoreText}>See More</ThemedText>
              </TouchableOpacity>
            )}
          </View>
        )}
      </View>
    );
  };

  // Main render method
  return (
    <View style={styles.mainContainer}>
      <View style={styles.container}>
        {/* If there are no conversation groups yet, show all chat history */}
        {conversationGroups.length === 0 ? (
          <ScrollView
            ref={scrollViewRef}
            contentContainerStyle={styles.contentContainer}
            showsVerticalScrollIndicator={false}
            style={styles.chatHistoryContainer}
          >
            {currentChatHistory.map((message, index) => (
              <View key={`message-${index}`} style={message.role === 'user' ? styles.messageContainer : styles.aiMessageContainer}>
                {message.role === 'assistant' || message.role === 'ai' ? renderMessageAvatar(message) : renderMessageAvatar(message)}
              </View>
            ))}
            {/* Loading sequence */}
            {
              isPartQueryLoading && (
                <View style={{ width: '100%', alignItems: 'center', justifyContent: 'center' }}>
                  <ImageLoader />
                </View>
              )
            }
            {showTypewriter && (
              <View style={{ width: '100%', alignItems: 'center', justifyContent: 'center' }}>
                {renderAIMessageWithTypewriter()}
              </View>
            )}
            {isProductQueryLoading && (
              <SearchProgressSteps
                isLoading={true}
                inputMode={"text"}
                steps={[
                  { title: "Analyzing the product" },
                  { title: "Searching fashion database" },
                ]}
              />
            )}

            {/* Product grid */}
            {showProducts && currentProducts.length > 0 && (
              <View style={styles.productSection}>
                <View style={styles.productGrid}>
                  {currentProducts.slice(0, productsToShowCount[-1] || PRODUCTS_PER_GROUP).map((item, index) => (
                    <View
                      key={`initial-${item.id}-${index}`}
                      style={index % 2 === 0 ? styles.productItemLeft : styles.productItemRight}
                    >
                      {renderProduct(item, index)}
                    </View>
                  ))}
                </View>

                {/* See More button */}
                {currentProducts.length > (productsToShowCount[-1] || PRODUCTS_PER_GROUP) && (
                  <TouchableOpacity
                    style={styles.seeMoreButton}
                    onPress={() => {
                      setProductsToShowCount(prev => ({
                        ...prev,
                        [-1]: (prev[-1] || PRODUCTS_PER_GROUP) + PRODUCTS_PER_GROUP
                      }));
                    }}
                  >
                    <ThemedText style={styles.seeMoreText}>See More</ThemedText>
                  </TouchableOpacity>
                )}
              </View>
            )}
          </ScrollView>
        ) : (
          /* Render conversation groups and their associated products */
          <ScrollView
            ref={scrollViewRef}
            contentContainerStyle={styles.contentContainer}
            showsVerticalScrollIndicator={false}
            style={styles.chatHistoryContainer}
          >
            {conversationGroups.map(renderConversationGroup)}

            {/* Loading sequence */}
            {
              isPartQueryLoading && (
                <View style={{ width: '100%', alignItems: 'center', justifyContent: 'center' }}>
                  <ImageLoader />
                </View>
              )
            }
            {showTypewriter && (
              <View style={{ width: '100%', alignItems: 'center', justifyContent: 'center' }}>
                {renderAIMessageWithTypewriter()}
              </View>
            )}
            {isProductQueryLoading && (
              <SearchProgressSteps
                isLoading={true}
                inputMode={"text"}
                steps={[
                  { title: "Analyzing the product" },
                  { title: "Searching fashion database" },
                ]}
              />
            )}
          </ScrollView>
        )}
      </View>
    </View>
  );
};

// Styles don't include colors - they're applied dynamically based on theme
const styles = StyleSheet.create({
  mainContainer: {
    flex: 1,
    backgroundColor: theme.colors.primary.lavender,
  },
  container: {
    flex: 1,
    backgroundColor: theme.colors.primary.lavender,
  },
  contentContainer: {
    paddingBottom: 20, // Reduced padding without input box
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    position: 'absolute',
    top: 0,
    zIndex: 1000,
  },
  backButton: {
    marginRight: 16,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
  },
  chatHistoryContainer: {
    padding: 16,
    margin: theme.spacing.md,
    borderWidth: 1,
    borderColor: theme.colors.border,
    opacity: 0.9,
    flex: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.4)', // white/40
    borderRadius: 24, // rounded-3xl = 1.5rem = 24px
    marginHorizontal: 24, // mx-6 = 1.5rem = 24px
    overflow: 'hidden',
    flexDirection: 'column',
    // Shadow for iOS
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 12,
    // Shadow for Android
    elevation: 5,
  },
  conversationGroup: {
    marginBottom: 24,
    borderBottomWidth: 0,
    paddingBottom: 16,
  },
  messageContainer: {
    marginBottom: 16,
    flexDirection: 'row',
    justifyContent: 'flex-end',
    alignItems: 'flex-start',
    width: '100%',
  },
  aiMessageContainer: {
    marginBottom: 16,
    flexDirection: 'row',
    alignItems: 'flex-start',
    width: '100%',
  },
  avatarContainer: {
    marginRight: 12,
    height: 36,
    width: 36,
    backgroundColor: theme.colors.primary.white,
    borderRadius: 18,
  },
  avatarGradient: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
  },
  avatarText: {
    color: theme.colors.primary.white,
    fontSize: 18,
    fontWeight: '600',
  },
  userAvatarContainer: {
    padding: 6,
    borderRadius: 20,
    marginLeft: 8,
  },
  userAvatarBackground: {
    width: 28,
    height: 28,
    // borderRadius: 18,
    // backgroundColor: theme.colors.primary.lavender,
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
  },
  userAvatarText: {
    color: theme.colors.secondary.darkGray,
    fontSize: 16,
    fontWeight: '500',
  },
  userMessageContainer: {
    maxWidth: '75%',
    borderRadius: 20,
    overflow: 'hidden',
    shadowColor: theme.colors.secondary.black,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.03,
    shadowRadius: 3,
    elevation: 1
  },
  userMessageGradient: {
    padding: 16,
    borderRadius: 20,
  },
  userMessage: {
    borderRadius: 20,
    padding: 16,
    backgroundColor: '#f0e6ff',
    maxWidth: '75%',
    shadowColor: theme.colors.secondary.black,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.03,
    shadowRadius: 3,
    elevation: 1,
  },
  aiMessage: {
    borderRadius: 20,
    padding: 16,
    backgroundColor: theme.colors.primary.white,
    maxWidth: '75%',
    flex: 1,
    shadowColor: theme.colors.secondary.black,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.03,
    shadowRadius: 3,
    elevation: 1,
  },
  messageText: {
    fontSize: 16,
    color: theme.colors.primary.white,
    lineHeight: 22,
  },
  messageImage: {
    width: '100%',
    height: 150,
    borderRadius: 8,
    marginTop: 8,
  },
  loadingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 20,
    backgroundColor: theme.colors.primary.white,
    maxWidth: '75%',
    flex: 1,
  },
  loadingText: {
    marginLeft: 8,
    fontSize: 16,
    color: theme.colors.secondary.darkGray,
  },
  productSection: {
    marginTop: 8,
    marginBottom: 16,
  },
  productGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginHorizontal: -4,
    justifyContent: 'space-between',
  },
  productItemLeft: {
    width: '48.5%',
    marginBottom: 16,
  },
  productItemRight: {
    width: '48.5%',
    marginBottom: 16,
  },
  productItem: {
    borderRadius: 16,
    overflow: 'hidden',
    backgroundColor: 'transparent',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  productTouchable: {
    width: '100%',
  },
  imageWrapper: {
    position: 'relative',
    width: '100%',
    height: 340,
  },
  productImage: {
    width: '100%',
    height: '100%',
  },
  imagePlaceholder: {
    width: '100%',
    height: '100%',
    backgroundColor: '#f2f2f2',
    justifyContent: 'center',
    alignItems: 'center',
  },
  placeholderText: {
    fontSize: 12,
    marginTop: 8,
    color: '#777777',
  },
  imageGradient: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 150,
    justifyContent: 'flex-end',
    paddingBottom: 60,
    paddingHorizontal: 16,
  },
  productLabel: {
    width: '100%',
  },
  productLabelText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#ffffff',
    marginBottom: 5,
    lineHeight: 24,
  },
  productPriceLabel: {
    fontSize: 20,
    fontWeight: '500',
    color: '#ffffff',
    lineHeight: 24,
  },
  actionOverlay: {
    position: 'absolute',
    bottom: 16,
    left: 16,
    right: 16,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    zIndex: 10,
  },
  leftActions: {
    flexDirection: 'row',
    gap: 8,
  },
  actionIconButton: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: 'transparent',
    justifyContent: 'center',
    alignItems: 'center',
  },
  bookmarkButton: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: theme.colors.primary.purple,
    justifyContent: 'center',
    alignItems: 'center',
  },
  bookmarkButtonActive: {
    backgroundColor: '#6b5cd1',
  },
  successButton: {
    backgroundColor: '#4CAF50', // Green
  },
  errorButton: {
    backgroundColor: '#F44336', // Red
  },
  loadingButton: {
    backgroundColor: '#6b5cd1',
  },
  productBottom: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 10,
    paddingRight: 12,
  },
  ratingContainer: {
    flexDirection: 'row',
    gap: 8,
  },
  ratingButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#6b5cd1',
    justifyContent: 'center',
    alignItems: 'center',
  },
  saveBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#f7f7f7',
    justifyContent: 'center',
    alignItems: 'center',
  },
  activeBtn: {
    backgroundColor: '#6b5cd1',
  },
  seeMoreButton: {
    alignItems: 'center',
    paddingVertical: 12,
    marginTop: 8,
    borderRadius: 8,
    backgroundColor: theme.colors.primary.white,
  },
  seeMoreText: {
    fontSize: 16,
    fontWeight: '600',
    color: theme.colors.secondary.veryDarkGray,
    fontFamily: 'default-semibold',
  },
});

export default ProductSearchResults; 
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
import { ThumbsUp, ThumbsDown, Bookmark, User, UserIcon, Camera, ArrowUp, Search, Mic, LucideIcon, Check, X, Loader, LoaderCircle, MessageSquare } from 'lucide-react-native';
import { ThemedText } from '@/components/ThemedText';
import theme from '@/styles/theme';
import { chatActions, ChatMessage, ConversationGroup, useChatProducts } from './context';
import useAppTheme from '@/hooks/useTheme';
import SearchProgressSteps, { ImageLoader } from '@/components/SearchProgressSteps';
import { usePostReactionMutation, useProtectedMutation } from './hooks/query';
import Animated, { useSharedValue, useAnimatedStyle, withTiming, withSequence, withDelay, Easing, withRepeat } from 'react-native-reanimated';
import TypewriterText from '@/components/TypewriterText';
import { BlurView } from 'expo-blur';
import { getImageSource } from './util';
import { MotiView } from 'moti';
import { responsiveFontSize } from '@/utils';
import { styles } from './styles';
const PRODUCTS_PER_GROUP = 4; // Max products to show per query group

const DEVICE_HEIGHT = Dimensions.get('window').height;


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
  onFollowUpPress: (product: Product) => void;
  latestAiMessage: string;
  followUpProduct: Product | null;
  scrollViewRef?: React.RefObject<ScrollView>;
  conversationGroups: ConversationGroup[];
  inputType: 'text' | 'img+txt' | 'imgurl+txt';
}



const ProductSearchResults: React.FC<ProductSearchResultsProps> = ({
  products = [],
  latestAiMessage = "",
  onProductPress,
  isPartQueryLoading,
  isProductQueryLoading,
  saveShoppingItemConfig,
  onFollowUpPress,
  followUpProduct,
  scrollViewRef,
  conversationGroups,
  inputType
}) => {
  // const isPartQueryLoading = true;
  // const isProductQueryLoading = true;
  // Use the passed scrollViewRef or create a local one if not provided
  const localScrollViewRef = useRef<ScrollView | null>(null);
  const effectiveScrollViewRef = scrollViewRef || localScrollViewRef;
  const targetRef = useRef(null);
  const appTheme = useAppTheme();
  const [reactedProducts, setReactedProducts] = useState<Record<string, boolean>>({});
  const [, { mutate: postReaction }] = usePostReactionMutation(reactedProducts, (reaction: Record<string, boolean>) => {
    setReactedProducts({ ...reaction });
  });
  const { savedProducts, savingProducts, saveSuccess, saveError, saveShoppingItem } = saveShoppingItemConfig || {}
  const { dispatch, activeConversationGroup } = useChatProducts();

  // Add state for managing loading sequence
  const [showTypewriter, setShowTypewriter] = useState(false);
  const [likeFillColor, setLikeFillColor] = useState<Record<string, string>>({});
  const [dislikeFillColor, setDislikeFillColor] = useState<Record<string, string>>({});

  const currentScrollY = useRef(0);

  const handleScroll = (event) => {
    currentScrollY.current = event.nativeEvent.contentOffset.y;
  };

  useEffect(() => {
    if (latestAiMessage) {
      setShowTypewriter(true);
    }
  }, [latestAiMessage]);



  // Update states based on loading sequence
  useEffect(() => {

    if (!isPartQueryLoading && !isProductQueryLoading) {
      setShowTypewriter(false);
    }
  }, [isPartQueryLoading, isProductQueryLoading, products]);


  const activeGroup = conversationGroups.find(group => group.id === activeConversationGroup);

  // Scroll to bottom when new messages arrive
  useEffect(() => {
    if (effectiveScrollViewRef.current) {
      setTimeout(() => {
        effectiveScrollViewRef.current?.scrollToEnd({ animated: true });
      }, 300);
    }
  }, [activeGroup?.products, isProductQueryLoading]);

  const toggleSave = (productId: string) => {


    // Call the API with the formatted payload
    saveShoppingItem({ products, productId, fetchedProductInfo: followUpProduct ? false : true });
  };


  const toggleGroupExpansion = (groupIndex: number) => {
    const conversationId = conversationGroups[groupIndex].id;
    if (activeConversationGroup) {
      dispatch(chatActions.getMoreProducts(conversationId));
    }
  };

  const handleReaction = (product_info: any, like: boolean) => {
    setLikeFillColor({ ...likeFillColor, [product_info.product_id]: like ? "#ffffff" : "transparent" })
    setDislikeFillColor({ ...dislikeFillColor, [product_info.product_id]: !like ? "#ffffff" : "transparent" })

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

  const customEasing = Easing.bezier(0.23, 1, 0.32, 1);

  const cardAnimatedStyle = useAnimatedStyle(() => {
    return {
      opacity: withTiming(1, {
        duration: 400,
        easing: customEasing,
      }),
    };
  });

  const renderProduct = (item: Product, index: number) => {
    const isSaved = savedProducts[item.id] || false;

    const isSaving = savingProducts[item.id] || false;
    const isSuccess = saveSuccess[item.id] || false;
    const isError = saveError[item.id] || false;

    // Render appropriate icon based on save state
    const renderSaveIcon = () => {
      if (isSaving) {
        return (
          <Animated.View style={spinningStyle}>
            <LoaderCircle size={14} color="#ffffff" strokeWidth={2} />
          </Animated.View>
        );
      } else if (isSuccess) {
        return <Check size={14} color="#ffffff" strokeWidth={2} />;
      } else if (isError) {
        return <X size={14} color="#ffffff" strokeWidth={2} />;
      } else {
        return (
          <Bookmark
            size={14}
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
      <MotiView
        layoutId={`product-${item.url}`}
        transition={{
          type: 'spring',
          duration: 0.4,
          ease: [0.23, 1, 0.32, 1],
        }}
        key={`product-${item.id}-${index}`} style={[styles.productItem]}>
        <TouchableOpacity
          style={styles.productTouchable}
          activeOpacity={0.7}
          onPress={() => onProductPress && onProductPress(item)}
        >
          <Animated.View style={[styles.imageWrapper]}>
            {item.image ? (
              <View style={styles.productImageWrapper}>
                <Image
                  source={{ uri: item.image }}
                  style={styles.productImage}
                  resizeMode="cover"
                />
                <LinearGradient
                  colors={['transparent', 'rgba(0,0,0,0.45)', 'rgba(0,0,0,0.55)']}
                  locations={[0, 0.45, 1]}
                  style={styles.imageGradient}
                >
                  <View style={styles.productLabel}>
                    <Text numberOfLines={1} style={styles.brandLabel}>{item.brand}</Text>
                    <Text numberOfLines={1} style={styles.nameLabel}>{item.name}</Text>
                    <Text numberOfLines={1} style={styles.priceLabel}>{item.price}</Text>
                  </View>
                </LinearGradient>
              </View>
            ) : (
              <View style={styles.imagePlaceholder}>
                <Ionicons name="image-outline" size={40} color="#a8a8a8" />
                <Text style={styles.placeholderText}>No image available</Text>
              </View>
            )}

            <View key={`${item.id}-actions`} style={styles.actionOverlay}>
              <View key={`${item.id}-actions-left`} style={styles.leftActions}>
                <ThumbsUp fill={likeFillColor[item.id] || "transparent"} onPress={() => handleReaction(item.product_info, true)}
                  key={`like-${item.url}`} data-testid={`like-${item.id}`} size={12} color="#fff" strokeWidth={2} />
                <ThumbsDown fill={dislikeFillColor[item.id] || "transparent"} onPress={() => handleReaction(item.product_info, false)} key={`dislike-${item.url}`} data-testid={`dislike-${item.id}`} size={12} color="#fff" strokeWidth={2} />
              </View>
              <TouchableOpacity
                style={bookmarkButtonStyle}
                onPress={() => toggleSave(item.id)}
                disabled={isSaving}
              >
                {renderSaveIcon()}
              </TouchableOpacity>
            </View>
          </Animated.View>
        </TouchableOpacity>
      </MotiView>
    );
  };

  // Add ref to track the height of the latest message
  const latestMessageHeight = useRef(0);

  // Scroll to position the latest user message at the top with space for the AI response
  const scrollToLatestUserMessage = () => {
    // Only attempt to scroll if we have a reference to the ScrollView
    if (effectiveScrollViewRef.current) {
      // Use a short delay to ensure the layout is complete
      InteractionManager.runAfterInteractions(() => {
        // Calculate position: current scroll position plus latest message height plus some extra padding for AI response
        const scrollPosition = currentScrollY.current + latestMessageHeight.current + 300; // Extra space for AI response
        effectiveScrollViewRef.current?.scrollTo({
          y: scrollPosition,
          animated: true
        });
      });
    }
  };

  // Watch for changes to conversation groups and scroll accordingly
  useEffect(() => {
    if (activeGroup && activeGroup.userMessage) {
      // When a new user message is added, scroll to position it
      scrollToLatestUserMessage();
    }
  }, [conversationGroups.length, activeGroup?.userMessage?.text]);

  // Scroll to bottom when loading completes or new products are added
  useEffect(() => {
    if (!isProductQueryLoading && !isPartQueryLoading && activeGroup && activeGroup?.products?.length > 0) {
      // After loading is complete and products are available, scroll to show them
      setTimeout(() => {
        effectiveScrollViewRef.current?.scrollToEnd({ animated: true });
      }, 300);
    }
  }, [isProductQueryLoading, isPartQueryLoading, activeGroup?.products?.length]);

  const renderMessageAvatar = (message: ChatMessage, index: number) => {
    if (message.role === 'user') {
      return (
        <View
          style={styles.messageContainer}
          onLayout={(event) => {
            // If this is the latest user message in the active group, save its height
            if (activeGroup?.userMessage?.text === message.text) {
              latestMessageHeight.current = event.nativeEvent.layout.height;
            }
          }}
        >
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
                  source={{ uri: getImageSource(message.image) }}
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
                setShowTypewriter(false);
              }
            }}
            onTextChange={() => {
              setTimeout(() => {
                effectiveScrollViewRef.current?.scrollToEnd({ animated: true });
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
    // Calculate if there are more products to show
    const productsToShow = group.uiProductsList;
    const hasMoreProducts = group.products.length > productsToShow.length;

    return (
      <View key={`group-${index}`} style={[styles.conversationGroup, { borderBottomColor: appTheme.colors.border }]}>
        {/* User message */}
        {group.userMessage && renderMessageAvatar(group.userMessage, index)}

        {showTypewriter && group.id === activeConversationGroup ?
          (
            <View style={{ width: '100%', alignItems: 'center', justifyContent: 'center' }}>
              {renderAIMessageWithTypewriter()}
            </View>
          )
          : group.aiMessage && renderMessageAvatar(group.aiMessage, index)}
        {/* AI response */}
        {/* {group.aiMessage && } */}

        {/* Products for this conversation */}
        {group.aiMessage && group.uiProductsList.length > 0 && (
          <View style={styles.productSection}>
            <View style={styles.productGrid}>
              {group.uiProductsList.map((item, pIndex) => (
                <View
                  key={`group-${index}-product-${item.id}`}
                  style={[pIndex % 2 === 0 ? styles.productItemLeft : styles.productItemRight, cardAnimatedStyle]}
                >
                  <TouchableOpacity onPress={() => onFollowUpPress(item)} style={styles.followUpActions}>
                    <MessageSquare size={22} color={theme.colors.primary.purple} strokeWidth={2} />
                  </TouchableOpacity>
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


  const conversationGroupsToRender = useMemo(() => {
    return conversationGroups
  }, [conversationGroups, activeConversationGroup]);

  console.log("conversationGroups in product search results",conversationGroupsToRender, conversationGroups,activeConversationGroup);


  // Main render method
  return (
    <View style={styles.mainContainer}>
      <View style={styles.container}>

        <View style={styles.chatHistoryContainer} >
          <ScrollView
            ref={effectiveScrollViewRef}
            contentContainerStyle={[
              styles.contentContainer,
              // Add extra padding at the bottom to ensure enough scroll space
              { paddingBottom: 100 }
            ]}
            showsVerticalScrollIndicator={false}
            onScroll={handleScroll}
            scrollEventThrottle={16} // Improve scroll performance
          >
            {conversationGroupsToRender.map(renderConversationGroup)}

            {/* Loading sequence */}
            {
              isPartQueryLoading && (
                <View style={{ width: '100%', alignItems: 'center', justifyContent: 'center', }}>
                  <ImageLoader size={60} />
                </View>
              )
            }

            {isProductQueryLoading && (
              <SearchProgressSteps
                isLoading={true}
                inputMode={inputType}
                steps={[
                  { title: "Analyzing the product" },
                  { title: "Searching fashion database" },
                ]}
              />
            )}
          </ScrollView>
        </View>

      </View>
    </View>
  );
};



export default ProductSearchResults; 
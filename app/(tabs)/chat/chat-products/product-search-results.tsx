import React, { useState, useRef, useEffect, useMemo, useReducer, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Dimensions,
  InteractionManager,
  Animated as RNAnimated
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
import Animated, { 
  useSharedValue, 
  useAnimatedStyle, 
  useAnimatedScrollHandler,
  withTiming, 
  withSequence, 
  withDelay, 
  Easing, 
  withRepeat, 
  interpolate,
  Extrapolate,
  withSpring
} from 'react-native-reanimated';
import TypewriterText from '@/components/TypewriterText';
import { BlurView } from 'expo-blur';
import { getImageSource } from './util';
import { MotiView } from 'moti';
import { responsiveFontSize } from '@/utils';
import { styles } from './styles';
import GradientText from '@/components/GradientText';
import { Image } from 'expo-image';
import ImageSelectionSection from './ImageSelectionSection';
import MediaViewer from './MediaViewer';
import Category from './Category';
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
  showImageSelection?: boolean;
  imageSelectionUrls?: string[];
  onImageSelected?: (index: number) => void;
  loadingSocialImages?: boolean;
}

// After the imports, add the interface for the AnimatedProductItem props
interface AnimatedProductItemProps {
  item: Product;
  index: number;
  groupIndex: number;
  scrollY: Animated.SharedValue<number>;
  savedProducts: Record<string, boolean>;
  savingProducts: Record<string, boolean>;
  saveSuccess: Record<string, boolean>;
  saveError: Record<string, boolean>;
  likeFillColor: Record<string, string>;
  dislikeFillColor: Record<string, string>;
  onProductPress?: (product: Product) => void;
  onFollowUpPress?: (product: Product) => void;
  toggleSave: (productId: string) => void;
  handleReaction: (product_info: any, like: boolean) => void;
}

// Create a separate component for product items to properly use hooks
const AnimatedProductItem = React.memo(({ 
  item, 
  index, 
  groupIndex, 
  scrollY, 
  savedProducts, 
  savingProducts, 
  saveSuccess, 
  saveError, 
  likeFillColor, 
  dislikeFillColor, 
  onProductPress, 
  onFollowUpPress,
  toggleSave,
  handleReaction
}: AnimatedProductItemProps) => {
  const isSaved = savedProducts[item.id] || false;
  const isSaving = savingProducts[item.id] || false;
  const isSuccess = saveSuccess[item.id] || false;
  const isError = saveError[item.id] || false;

  // Calculate delay based on index for staggered entrance
  const staggerDelay = index * 100; // 100ms delay between each card

  // Create a stable unique ID for this product
  const stableProductId = `${item.id || ''}-${item.image?.substring(item.image.length - 20) || ''}`;
  
  // These hooks are now at the top level of a component
  const productPosition = useRef(0);
  
  // Create animated styles for parallax effect
  const parallaxStyle = useAnimatedStyle(() => {
    // Create parallax effect - image moves slightly slower than scroll
    const parallaxOffset = interpolate(
      scrollY.value,
      [productPosition.current - 500, productPosition.current + 300],
      [-15, 15],  // Image will move 30px total as user scrolls
      Extrapolate.CLAMP
    );
    
    return {
      transform: [{ translateY: parallaxOffset }]
    };
  });
  
  // Animated style for fading in product details
  const detailsFadeStyle = useAnimatedStyle(() => {
    // Fade in details when product comes into view
    const opacity = interpolate(
      scrollY.value,
      [productPosition.current - 400, productPosition.current - 200],
      [0, 1],
      Extrapolate.CLAMP
    );
    
    // Slide up as they fade in
    const translateY = interpolate(
      scrollY.value,
      [productPosition.current - 400, productPosition.current - 200],
      [10, 0],
      Extrapolate.CLAMP
    );
    
    return {
      opacity,
      transform: [{ translateY }]
    };
  });

  // Add rotation animation for the loader
  const rotation = useSharedValue(0);
  
  // Set up a continuous rotation animation
  useEffect(() => {
    if (isSaving) {
      rotation.value = withRepeat(
        withTiming(360, {
          duration: 1000,
          easing: Easing.linear
        }),
        -1, // Infinite repetitions
        false // Don't reverse
      );
    } else {
      rotation.value = 0;
    }
  }, [isSaving, rotation]);
  
  // Create the spinning animation style
  const spinningStyle = useAnimatedStyle(() => {
    return {
      transform: [{ rotate: `${rotation.value}deg` }],
    };
  });

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

  // Add scale animation for bookmark button tap
  const bookmarkScale = useSharedValue(1);
  
  // Function to trigger bookmark animation
  const animateBookmark = () => {
    // Quick pulse down
    bookmarkScale.value = withSequence(
      withTiming(0.8, { duration: 100, easing: Easing.inOut(Easing.ease) }),
      // Bounce slightly larger than original
      withSpring(1.25, { 
        damping: 5, 
        stiffness: 200,
        mass: 0.5
      }),
      // Settle back to normal size
      withSpring(1, { 
        damping: 15, 
        stiffness: 150 
      })
    );
  };

  // Create the bookmark animation style
  const bookmarkAnimStyle = useAnimatedStyle(() => {
    return {
      transform: [
        { scale: bookmarkScale.value }
      ]
    };
  });

  return (
    <MotiView
      from={{
        opacity: 0,
        scale: 0.8,
        translateY: 20,
      }}
      animate={{
        opacity: 1,
        scale: 1,
        translateY: 0,
      }}
      transition={{
        type: 'timing',
        duration: 400,
        delay: staggerDelay,
        easing: Easing.bezier(0.25, 0.1, 0.25, 1),
      }}
      key={`product-${stableProductId}-${groupIndex}-${index}`} 
      style={[styles.productItem]}
      onLayout={(event) => {
        // Store this product's position for parallax calculations
        productPosition.current = event.nativeEvent.layout.y;
      }}
    >
      <TouchableOpacity
        style={styles.productTouchable}
        activeOpacity={0.7}
        onPress={() => onProductPress && onProductPress(item)}
      >
        <Animated.View style={[styles.imageWrapper]}>
          {item.image ? (
            <View className='border border-purple-100' style={styles.productImageWrapper}>
              <Animated.View style={parallaxStyle}>
                <Image
                  source={{ uri: item.image }}
                  style={[styles.productImage, { transform: [{ scale: 1.1 }] }]} // Slightly larger to hide parallax edges
                  contentFit="cover"
                  transition={100}
                  contentPosition={"center"}
                />
              </Animated.View>
              <LinearGradient
                colors={['transparent', 'rgba(0,0,0,0.45)', 'rgba(0,0,0,0.55)']}
                locations={[0, 0.45, 1]}
                style={styles.imageGradient}
              >
                <Animated.View 
                  style={[
                    { position: 'absolute', bottom: 0, left: 0, right: 0, padding: 8, height: 96 },
                    detailsFadeStyle
                  ]}
                >
                  <View className='flex-col gap-0.5'>
                    <Text numberOfLines={1}
                      className='text-[8px] uppercase tracking-wider opacity-9 truncate text-white'
                    >{item.brand}</Text>
                    <Text numberOfLines={1}
                      className='font-bold text-xs truncate text-white'
                    >{item.name}</Text>
                    <Text
                      className='font-semibold text-xs text-white'
                      numberOfLines={1}
                    >{item.price}</Text>
                  </View>
                </Animated.View>
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
              <View className='p-1 rounded-md transition-colors bg-white/10 backdrop-blur-sm hover:bg-white/20'>
                <ThumbsUp 
                  fill={likeFillColor[item.id] || "transparent"} 
                  onPress={() => handleReaction(item.product_info, true)}
                  key={`like-${item.url}`} 
                  data-testid={`like-${item.id}`} 
                  size={12} 
                  color="#fff" 
                  strokeWidth={2} 
                />
              </View>
              <View className='p-1 rounded-md transition-colors bg-white/10 backdrop-blur-sm hover:bg-white/20'>
                <ThumbsDown 
                  fill={dislikeFillColor[item.id] || "transparent"} 
                  onPress={() => handleReaction(item.product_info, false)} 
                  key={`dislike-${item.url}`} 
                  data-testid={`dislike-${item.id}`} 
                  size={12} 
                  color="#fff" 
                  strokeWidth={2} 
                />
              </View>
            </View>
            <TouchableOpacity
              onPress={() => {
                animateBookmark(); // Trigger animation
                toggleSave(item.id); // Call the original function
              }}
              disabled={isSaving}
              className='p-1 sm:p-1.5 rounded-full bg-purple-500/90 hover:bg-purple-600/90 transition-all duration-200 shadow-md'
            >
              <Animated.View style={bookmarkAnimStyle}>
                {renderSaveIcon()}
              </Animated.View>
            </TouchableOpacity>
          </View>
        </Animated.View>
      </TouchableOpacity>
    </MotiView>
  );
});

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
  inputType,
  showImageSelection = false,
  imageSelectionUrls = [],
  onImageSelected,
  loadingSocialImages = false,
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

  // Add a flag to prevent competing scroll effects
  const isManuallyScrolling = useRef(false);

  // Update scroll handling to prevent unwanted auto-scrolls
  const handleScroll = (event: { nativeEvent: { contentOffset: { y: number } } }) => {
    // Just track position, don't use it for auto-scrolling
    currentScrollY.current = event.nativeEvent.contentOffset.y;
    
    // If user is manually scrolling, disable auto-scroll temporarily
    if (!isManuallyScrolling.current) {
      isManuallyScrolling.current = true;
      // Reset after a short delay
      setTimeout(() => {
        isManuallyScrolling.current = false;
      }, 1500);
    }
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
    // No-op - we don't want to auto-scroll
  }, [activeGroup?.products, isProductQueryLoading]);

  const toggleSave = (productId: string) => {


    // Call the API with the formatted payload
    saveShoppingItem({ products, productId, fetchedProductInfo: followUpProduct ? false : true });
  };

  // Add a ref to track if we're loading more products from "See More"
  const loadingMoreFromSeeMore = useRef(false);

  // Add new refs to track the last visible product's key and position
  const lastVisibleProductKey = useRef<string | null>(null);
  const lastVisibleProductPosition = useRef<number>(0);

  // Update the toggleGroupExpansion function with a completely new approach
  const toggleGroupExpansion = (groupIndex: number) => {
    // First, directly save the current scroll position as our anchor
    lastVisibleProductPosition.current = currentScrollY.current;
    
    // Also save the last product key as a reference (even though we don't use DOM methods)
    if (conversationGroups[groupIndex].uiProductsList.length > 0) {
      const lastProduct = conversationGroups[groupIndex].uiProductsList[conversationGroups[groupIndex].uiProductsList.length - 1];
      lastVisibleProductKey.current = `group-${groupIndex}-product-${lastProduct.image}`;
    }
    
    // Dispatch the action to load more products
    const conversationId = conversationGroups[groupIndex].id;
    if (activeConversationGroup) {
      // Set a flag to indicate we're in a "See More" operation
      loadingMoreFromSeeMore.current = true;
      
      dispatch(chatActions.getMoreProducts(conversationId));
      
      // After a delay, reset the flag
      setTimeout(() => {
        loadingMoreFromSeeMore.current = false;
      }, 1000);
    }
  };

  // Add a useEffect to handle scroll restoration after new products are added
  useEffect(() => {
    // No-op - disable auto-scrolling
  }, [activeGroup?.products?.length]);

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

  // Add a shared value for scroll position to drive animations
  const scrollY = useSharedValue(0);
  
  // Simpler scroll handler that just updates our shared value
  const handleScrollForAnimation = (event: { nativeEvent: { contentOffset: { y: number } } }) => {
    // Update the shared value for animations
    scrollY.value = event.nativeEvent.contentOffset.y;
    // Also track position with the regular handler
    handleScroll(event);
  };

  // Simplified renderProduct function that uses the new component
  const renderProduct = (item: Product, index: number, groupIndex: number) => {
    return (
      <AnimatedProductItem
        item={item}
        index={index}
        groupIndex={groupIndex}
        scrollY={scrollY}
        savedProducts={savedProducts}
        savingProducts={savingProducts}
        saveSuccess={saveSuccess}
        saveError={saveError}
        likeFillColor={likeFillColor}
        dislikeFillColor={dislikeFillColor}
        onProductPress={onProductPress}
        onFollowUpPress={onFollowUpPress}
        toggleSave={toggleSave}
        handleReaction={handleReaction}
      />
    );
  };

  // Add ref to track the height of the latest message
  const latestMessageHeight = useRef(0);

  // Scroll to position the latest user message at the top with space for the AI response
  const scrollToLatestUserMessage = () => {
    // No-op - we don't want to auto-scroll
  };

  // Get the position from our stored map
  const productSectionPositions = useRef<{[groupId: string]: number}>({});

  // Add productSectionRefs declaration
  const productSectionRefs = useRef<{[groupId: string]: any}>({});

  // Update the handleProductSectionLayout function to prevent automatic scrolling after products render
  const handleProductSectionLayout = (event: { nativeEvent: { layout: { y: number } } }, groupId: string) => {
    const { y } = event.nativeEvent.layout;
    // Store the position of each conversation's product section
    productSectionPositions.current[groupId] = y;
    
    // IMPORTANT: Disable automatic scrolling after products are rendered
    // This was causing the view to jump back to the top
    // Users can scroll manually if needed
  };

  const conversationGroupsToRender = useMemo(() => {
    return conversationGroups
  }, [conversationGroups, activeConversationGroup]);

  console.log("conversationGroups in product search results", conversationGroupsToRender, conversationGroups, activeConversationGroup);

  // Update renderMessageAvatar to include bounce effects for user messages
  const renderMessageAvatar = (message: ChatMessage, index: number, groupId: string) => {
    if (message.role === 'user') {
      return (
        <MotiView
          from={{ opacity: 0, translateY: 20, scale: 0.9 }}
          animate={{ opacity: 1, translateY: 0, scale: 1 }}
          transition={{ 
            type: 'spring', 
            damping: 15,
            mass: 1,
            stiffness: 120 
          }}
          key={`message-${index}`}
          style={styles.messageContainer}
          onLayout={(event) => {
            if (activeGroup?.userMessage?.text === message.text) {
              latestMessageHeight.current = event.nativeEvent.layout.height;
            }
          }}
        >
          <MotiView
            from={{ opacity: 0, scale: 0.8, translateX: 20 }}
            animate={{ opacity: 1, scale: 1, translateX: 0 }}
            transition={{ 
              type: 'spring', 
              damping: 12,
              delay: 150,
              mass: 0.9,
              stiffness: 100
            }}
            style={[styles.userMessageContainer, { width: message.image ? '100%' : 'auto' }]}
          >
            <LinearGradient
              colors={['#9333EA', '#EC4899', '#3B82F6']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.userMessageGradient}
            >
              <Text className='text-sm leading-relaxed' style={styles.messageText}>{message.text}</Text>
              {message.image && (
                <MotiView
                  from={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 300, duration: 400 }}
                >
                  <Image
                    source={{ uri: getImageSource(message.image) }}
                    style={styles.messageImage}
                    contentFit="cover"
                    transition={100}
                  />
                </MotiView>
              )}
            </LinearGradient>
          </MotiView>

          <MotiView
            from={{ opacity: 0, rotate: '-20deg', scale: 0.8 }}
            animate={{ opacity: 1, rotate: '0deg', scale: 1 }}
            transition={{ 
              type: 'spring', 
              damping: 10,
              delay: 300,
              mass: 0.8
            }}
          >
            <LinearGradient
              colors={['#E9D5FF', '#FBCFE8']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.userAvatarContainer}
            >
              <UserIcon size={20} color={appTheme.colors.primary.purple} style={styles.userAvatarBackground} />
            </LinearGradient>
          </MotiView>
        </MotiView>
      );
    }
    
    // For AI messages - enhance with animations
    return (
      <MotiView
        from={{ opacity: 0, translateY: 15, scale: 0.95 }}
        animate={{ opacity: 1, translateY: 0, scale: 1 }}
        transition={{ 
          type: 'spring', 
          damping: 20,
          mass: 1.1,
          stiffness: 100
        }}
        style={styles.aiMessageContainer}
      >
        <MotiView
          from={{ opacity: 0, scale: 0.9, rotate: '10deg' }}
          animate={{ opacity: 1, scale: 1, rotate: '0deg' }}
          transition={{ 
            type: 'spring', 
            damping: 12,
            delay: 150
          }}
          className='h-12 rounded-full overflow-hidden flex items-center justify-center'
        >
          <Image source={require('@/assets/images/logo.png')} style={[styles.avatarContainer, { height: 56, marginRight: 0 }]} contentFit="cover" />
        </MotiView>
        
        <View className=''>
          {message.text.length > 0 && (
            <MotiView
              from={{ opacity: 0, translateX: -15 }}
              animate={{ opacity: 1, translateX: 0 }}
              transition={{ 
                type: 'spring', 
                damping: 15,
                delay: 250
              }}
              style={styles.aiMessage} 
              className='border border-purple-300'
            >
              <Text className='' style={{fontSize:12, lineHeight:20}}>{message.text}</Text>
            </MotiView>
          )}
          
          {message.messageType === 'social' && (
            <MotiView
              from={{ opacity: 0, scale: 0.95, translateY: 5 }}
              animate={{ opacity: 1, scale: 1, translateY: 0 }}
              transition={{ 
                type: 'spring', 
                damping: 15, 
                delay: 300 
              }}
              className='flex-row items-center justify-center max-w-80'
            >
              <MediaViewer post={{ images: message.social?.images || [] }} onImageClick={onImageSelected ? onImageSelected : () => {}} selectedImageIndex={0} hasFetchedUrl={!message.social?.fetchingMedia} />
            </MotiView>
          )}
          
          {message.categories && message.categories.length > 0 && (
            <MotiView
              from={{ opacity: 0, translateY: 10 }}
              animate={{ opacity: 1, translateY: 0 }}
              transition={{ 
                type: 'timing', 
                duration: 400, 
                delay: 300 
              }}
            >
              <ScrollView horizontal contentContainerClassName='flex-row gap-2'>
                {message.categories.map((category, catIndex) => (
                  <MotiView
                    key={`category-${category}`}
                    from={{ opacity: 0, scale: 0.9, translateX: -10 }}
                    animate={{ opacity: 1, scale: 1, translateX: 0 }}
                    transition={{ 
                      type: 'spring', 
                      damping: 10, 
                      delay: 350 + (catIndex * 100), 
                      stiffness: 100 
                    }}
                  >
                    <Category
                      name={category}
                      onPress={() => {
                        dispatch(chatActions.loadProductsByCategory(groupId, category));
                      }}
                    />
                  </MotiView>
                ))}
              </ScrollView>
            </MotiView>
          )}
        </View>
      </MotiView>
    );
  };

  // Enhance the typewriter animation
  const renderAIMessageWithTypewriter = () => {
    return (
      <MotiView
        from={{ opacity: 0, translateY: 15 }}
        animate={{ opacity: 1, translateY: 0 }}
        transition={{ 
          type: 'spring', 
          damping: 18, 
          stiffness: 120 
        }}
        style={styles.aiMessageContainer}
      >
        <MotiView
          from={{ opacity: 0, scale: 0.9, rotate: '10deg' }}
          animate={{ opacity: 1, scale: 1, rotate: '0deg' }}
          transition={{ 
            type: 'spring', 
            damping: 12,
            delay: 150
          }}
          className='h-12 rounded-full overflow-hidden flex items-center justify-center'
        >
          <Image source={require('@/assets/images/logo.png')} style={[styles.avatarContainer, { height: 56, marginRight: 0 }]} contentFit="cover" />
        </MotiView>
        
        <MotiView
          from={{ opacity: 0, translateX: -15 }}
          animate={{ opacity: 1, translateX: 0 }}
          transition={{ 
            type: 'spring', 
            damping: 15,
            delay: 250
          }}
          style={styles.aiMessage}
          className='border border-purple-300'
        >
          <MotiView
            from={{ opacity: 0.7 }}
            animate={{ opacity: [0.7, 1, 0.7] }}
            transition={{
              loop: true,
              repeatReverse: true,
              type: 'timing',
              duration: 1800,
              easing: Easing.inOut(Easing.ease)
            }}
          >
            <TypewriterText
              text={latestAiMessage || "I'm searching for products that match your description..."}
              speed={30}
              onComplete={() => {
                if (isProductQueryLoading) {
                  setShowTypewriter(false);
                }
              }}
              onTextChange={() => {
                // Do nothing - no scrolling during typewriting
              }}
            />
          </MotiView>
        </MotiView>
      </MotiView>
    );
  };

  // Add global effect for all conversation groups instead of inside the render function
  useEffect(() => {
    // This effect will run once for the component rather than for each conversation group
    // No scrolling or animations that depend on individual groups
  }, [conversationGroups]);

  // Modify the renderConversationGroup function to show all products at once
  const renderConversationGroup = (group: ConversationGroup, index: number) => {
    // Get all products for this group (instead of a limited subset)
    const allProducts = group.products; // Use all products instead of uiProductsList
    
    // Generate a unique, stable ID for this group
    const stableGroupId = `group-${group.id || index}`;
    
    // No hooks inside render functions - they must be at component level
    
    return (
      <View key={stableGroupId} style={[styles.conversationGroup, { borderBottomColor: appTheme.colors.border }]}>
        {/* User message */}
        {group.userMessage && (
          <View onLayout={() => {
            // When the user message renders, scroll to it
            if (group.id === activeConversationGroup) {
              scrollToLatestConversation();
            }
          }}>
            {renderMessageAvatar(group.userMessage, index, group.id)}
          </View>
        )}

        {showTypewriter && group.id === activeConversationGroup ?
          (
            <View style={styles.aiMessageContainer}>
              <View className='h-12 rounded-full overflow-hidden flex items-center justify-center '>
                <Image source={require('@/assets/images/logo.png')} style={[styles.avatarContainer, { height: 56, marginRight: 0 }]} contentFit="cover" />
              </View>
              <View style={styles.aiMessage} className='border border-purple-300'>
                <TypewriterText
                  text={latestAiMessage || "I'm searching for products that match your description..."}
                  speed={30}
                  onComplete={() => {
                    if (isProductQueryLoading) {
                      setShowTypewriter(false);
                    }
                  }}
                  onTextChange={() => {
                    // Do nothing - no scrolling during typewriting
                  }}
                />
              </View>
            </View>
          )
          : group.aiMessage.length > 0 && <>
            {group.aiMessage.map((message) => (
              renderMessageAvatar(message, index, group.id)
            ))}
          </>}

        {/* Products for this conversation - show all products */}
        {group.aiMessage && allProducts.length > 0 && (
          <View 
            style={styles.productSection}
            onLayout={(event) => handleProductSectionLayout(event, group.id)}
            ref={el => {
              // Store ref for this conversation's product section
              productSectionRefs.current[group.id] = el;
            }}
          >
            <MotiView
              from={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{
                type: 'timing',
                duration: 300,
              }}
              style={styles.productGrid}
            >
              {allProducts.map((item, pIndex) => {
                // Create a stable unique ID for this product
                const stableProductId = `${item.id || ''}-${item.image?.substring(item.image.length - 20) || ''}`;
                
                return (
                  <View
                    id={`product-${stableProductId}`}
                    key={`product-${stableProductId}-${group.id}-${pIndex}`}
                    style={[pIndex % 2 === 0 ? styles.productItemLeft : styles.productItemRight]}
                  >
                    <TouchableOpacity onPress={() => onFollowUpPress(item)}
                      className='absolute top-2 left-2 z-10 p-1.5 rounded-full bg-white/90 hover:bg-white transition-colors shadow-sm'
                    >
                      <MessageSquare size={22} color={theme.colors.primary.purple} strokeWidth={2} />
                    </TouchableOpacity>
                    {renderProduct(item, pIndex, index)}
                  </View>
                );
              })}
            </MotiView>
          </View>
        )}
      </View>
    );
  };

  // Add this ref to track loading indicator position
  const loadingIndicatorRef = useRef(null);

  // Make the scrollToLatestConversation function respect manual scrolling
  const scrollToLatestConversation = useCallback(() => {
    // Never auto-scroll after products are loaded
    if (isManuallyScrolling.current || isProductQueryLoading === false) return;
    
    if (!effectiveScrollViewRef.current || !activeGroup) return;
    
    const lastGroupIndex = conversationGroups.length - 1;
    if (lastGroupIndex < 0) return;
    
    // Only scroll for user messages, not product loading
    const userMessage = activeGroup?.userMessage;
    if (!userMessage) return;
    
    // Delay to ensure rendering is complete
    setTimeout(() => {
      if (effectiveScrollViewRef.current) {
        // Find the location to scroll to - either the last user message or product section
        const scrollTarget = productSectionPositions.current[activeGroup.id] || 0;
        
        // Scroll to that position with a small offset
        effectiveScrollViewRef.current.scrollTo({
          y: Math.max(0, scrollTarget - 80),
          animated: true
        });
      }
    }, 300);
  }, [conversationGroups.length, activeGroup, isProductQueryLoading]);

  // Disable all other auto-scroll triggers
  useEffect(() => {
    // Intentionally empty to disable auto-scrolling for AI responses
  }, [latestAiMessage]);

  useEffect(() => {
    // Intentionally empty to disable auto-scrolling for loading state
  }, [isPartQueryLoading, isProductQueryLoading, activeGroup]);

  useEffect(() => {
    // Intentionally empty to disable auto-scrolling for products
  }, [
    activeGroup?.id,
    activeGroup?.products, 
    isPartQueryLoading,
    isProductQueryLoading
  ]);

  // Remove the scroll-to-user-message effect, let the user control scrolling manually
  useEffect(() => {
    // Intentionally empty - disable auto-scrolling when user message is added
  }, [activeGroup?.userMessage, scrollToLatestConversation]);

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
              { paddingBottom: 200 } // Increased padding
            ]}
            showsVerticalScrollIndicator={false}
            onScroll={handleScrollForAnimation}
            scrollEventThrottle={16}
            keyboardDismissMode="on-drag"
            keyboardShouldPersistTaps="handled"
          >
            {conversationGroupsToRender.map(renderConversationGroup)}
            
            {/* Add more spacing at the bottom */}
            <View style={{ height: 80 }} />
            
            {/* Loading sequence - positioned at the end of scrollable content */}
            <View ref={loadingIndicatorRef} style={{ width: '100%', marginTop: 8, marginBottom: 20 }}>
              {isPartQueryLoading && (
                <View style={{ width: '100%', alignItems: 'center', justifyContent: 'center', paddingVertical: 10 }}>
                  <ImageLoader size={50} />
                </View>
              )}

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
            </View>
          </ScrollView>
        </View>

      </View>
    </View>
  );
};



export default ProductSearchResults; 
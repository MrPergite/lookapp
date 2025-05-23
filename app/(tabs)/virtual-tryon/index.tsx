import React, { useEffect, useState, useCallback, useRef } from 'react'
import { 
  Text, 
  View, 
  SafeAreaView, 
  StyleSheet, 
  TouchableOpacity, 
  Dimensions, 
  ActivityIndicator,
  ScrollView,
  Pressable
} from 'react-native';
import { AnimatePresence, MotiView } from 'moti';
import { useAuth, useClerk, useUser } from '@clerk/clerk-expo';
import Toast from 'react-native-toast-message';
import { X, ShoppingBag, Shirt, Heart, ChevronLeft, ChevronRight, Check, ArrowRight, ArrowLeft } from 'lucide-react-native';
import { ImageContextType, useImageContext } from '@/common/providers/image-search';
import { useFocusEffect, useRouter } from 'expo-router';
import { useApi } from '@/client-api';
import { AVATARS } from '@/constants';
import { useShoppingList } from './hooks/useShoppingList';
import { LinearGradient } from 'expo-linear-gradient';
import AvatarList from './AvatarList';
import useResetTab from './hooks/useResetTab';
import { Image } from 'expo-image';
import * as Haptics from 'expo-haptics';
import theme from '@/styles/theme';
import { responsiveFontSize } from '@/utils';
import { Animated } from 'react-native';
import { GestureHandlerRootView, PanGestureHandler } from 'react-native-gesture-handler';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

// Add the specific product image URLs
const PRODUCT_IMAGES = {
  TOP: "https://hebbkx1anhila5yf.public.blob.vercel-storage.com/image-JhiWG5pvd6Ws2zMc9rVeALJkWkwSiO.png",
  BOTTOM: "https://hebbkx1anhila5yf.public.blob.vercel-storage.com/image-Hrn02eOGiSwOk5fELYszRfPB53kmUk.png",
  DRESS: "https://hebbkx1anhila5yf.public.blob.vercel-storage.com/image-6Zj5BJd874y4HHb2UfzXquO5e5zKRO.png"
};

// Add a custom tooltip component
const SuccessTooltip = ({ visible, message, onHide }: { visible: boolean, message: string, onHide: () => void }) => {
  useEffect(() => {
    if (visible) {
      const timer = setTimeout(() => {
        onHide();
      }, 2000);
      
      return () => clearTimeout(timer);
    }
  }, [visible, onHide]);
  
  if (!visible) return null;
  
  return (
    <MotiView
      from={{ opacity: 0, translateY: 20 }}
      animate={{ opacity: 1, translateY: 0 }}
      exit={{ opacity: 0, translateY: -10 }}
      transition={{ 
        type: 'spring',
        damping: 15,
        mass: 0.8
      }}
      style={styles.tooltipContainer}
    >
      <View style={styles.tooltipWrapper}>
        <LinearGradient
          colors={['#A855F7', '#EC4899']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={styles.tooltipContent}
        >
          <Check size={16} color="#FFFFFF" style={{ marginRight: 8 }} />
          <Text style={styles.tooltipText}>{message}</Text>
        </LinearGradient>
      </View>
    </MotiView>
  );
};

// Avatar image from provided URL
const DEFAULT_AVATAR_URL = "https://hebbkx1anhila5yf.public.blob.vercel-storage.com/Adobe%20Express%20-%20file-V5XkXadZLwQnf9Rsh1cFxhUI18XM0s.png";

// Define category filters
const CATEGORY_FILTERS = [
  { key: 'tops', label: 'Tops' },
  { key: 'bottoms', label: 'Bottoms' },
  { key: 'dresses', label: 'Dresses' },
  { key: 'outerwear', label: 'Outerwear' },
  { key: 'footwear', label: 'Footwear' },
  { key: 'accessory', label: 'Accessories' },
];

// Navigation tabs
const NAVIGATION_TABS = [
  { key: 'favorites', label: 'Favorites' },
  { key: 'todays-look', label: "Today's Look" },
  { key: 'closet', label: 'Closet' },
];

// Add these type definitions at the top, after the import statements
interface WardrobeItem {
  id: string;
  name: string;
  brand: string;
  image: string;
  category: string;
  source: string;
}

interface ShoppingItem {
  id: string;
  title?: string;
  brand?: string;
  img_url?: string;
  garment_type?: string;
  // Other potential properties
}

// Add this interface for try-on image results
interface TryOnImage {
  output_images: string[];
}

// Enhanced category filter button with animated gradient underline
const CategoryButton = ({ filter, isActive, onPress }: { filter: { key: string; label: string }, isActive: boolean, onPress: () => void }) => {
  const indicatorOpacity = useRef(new Animated.Value(isActive ? 1 : 0)).current;
    useEffect(() => {
    Animated.timing(indicatorOpacity, {
      toValue: isActive ? 1 : 0,
      duration: 200,
      useNativeDriver: true,
    }).start();
  }, [isActive]);
  return (
    <TouchableOpacity
      activeOpacity={0.7}
      onPress={onPress}
      style={styles.categoryButton}
    >
      <Text style={[
        styles.categoryText,
        isActive && styles.activeCategoryText,
      ]}>
        {filter.label}
      </Text>
      <View style={styles.activeIndicator}>
        <Animated.View 
          style={[
            styles.gradientIndicatorContainer, 
            { opacity: indicatorOpacity }
          ]}
        >
          <LinearGradient
            colors={[theme.colors.primary.purple as string, '#ec4899', '#6366f1']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={styles.gradientIndicator}
          />
        </Animated.View>
      </View>
    </TouchableOpacity>
  );
};

// Pagination dots component
const PaginationDots = ({ total, current }: { total: number, current: number }) => {
  return (
    <View style={styles.paginationContainer}>
      {Array.from({ length: total }).map((_, index) => (
        <View
          key={index}
          style={[
            styles.paginationDot,
            index === current && styles.paginationDotActive
          ]}
        />
      ))}
    </View>
  );
};

// Update the PlaceholderItem component to include swipe indicators
const PlaceholderItem = ({ style, direction, type }: { style?: any, direction: 'left' | 'right', type: 'top' | 'bottom' }) => {
  const getImageUrl = () => {
    switch(type) {
      case 'top': return PRODUCT_IMAGES.TOP;
      case 'bottom': return PRODUCT_IMAGES.BOTTOM;
      default: return PRODUCT_IMAGES.TOP;
    }
  };

  return (
    <View style={[styles.placeholderItem, style]}>
      <View style={styles.placeholderImage}>
        <Image
          source={{ uri: getImageUrl() }}
          style={styles.placeholderImageContent}
          contentFit="cover"
        />
        
        {/* Swipe indicator - positioned in center without covering the image */}
        <MotiView
          from={{ opacity: 0.7 }}
          animate={{ opacity: 1 }}
          transition={{
            type: 'timing',
            duration: 1200,
            loop: true,
            repeatReverse: true
          }}
          style={styles.swipeIndicatorOverlay}
        >
          <MotiView
            from={{ translateX: direction === 'left' ? -3 : 3 }}
            animate={{ translateX: direction === 'left' ? 3 : -3 }}
            transition={{
              type: 'timing',
              duration: 1000,
              loop: true,
              repeatReverse: true
            }}
            style={styles.swipeIndicatorContainer}
          >
            <LinearGradient
              colors={['rgba(168, 85, 247, 0.95)', 'rgba(236, 72, 153, 0.95)']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.swipeIndicatorGradient}
            >
              {direction === 'left' ? (
                <ArrowRight size={16} color="#FFFFFF" />
              ) : (
                <ArrowLeft size={16} color="#FFFFFF" />
              )}
            </LinearGradient>
          </MotiView>
        </MotiView>
      </View>
    </View>
  );
};

// Pill toggle component (now for both sides)
const SourceToggle = ({ value, onChange }: { value: 'closet' | 'shopping', onChange: (v: 'closet' | 'shopping') => void }) => (
  <View style={styles.pillToggleContainer}>
    <TouchableOpacity
      style={[styles.pill, value === 'closet' && styles.pillActive]}
      onPress={() => onChange('closet')}
      activeOpacity={0.8}
    >
      {value === 'closet' ? (
        <LinearGradient
          colors={[theme.colors.primary.purple as string, '#EC4899']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={styles.pillGradient}
        >
          <Text style={[styles.pillText, styles.pillTextActive]}>Closet</Text>
        </LinearGradient>
      ) : (
        <Text style={styles.pillText}>Closet</Text>
      )}
    </TouchableOpacity>
    <TouchableOpacity
      style={[styles.pill, value === 'shopping' && styles.pillActive]}
      onPress={() => onChange('shopping')}
      activeOpacity={0.8}
    >
      {value === 'shopping' ? (
        <LinearGradient
          colors={[theme.colors.primary.purple as string, '#EC4899']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={styles.pillGradient}
        >
          <Text style={[styles.pillText, styles.pillTextActive]}>Shopping</Text>
        </LinearGradient>
      ) : (
        <Text style={styles.pillText}>Shopping</Text>
      )}
    </TouchableOpacity>
  </View>
);

function VirtualTryOn({ route }: { route: any }) {
    const { avatar } = useImageContext() as ImageContextType;
    const { user } = useUser();
    const { isSignedIn } = useAuth();
    const { openSignIn, openSignUp } = useClerk();
    const { callProtectedEndpoint, callPublicEndpoint } = useApi();
    const router = useRouter();

    // State variables
  const [activeTab, setActiveTab] = useState('todays-look');
  const [selectedProduct, setSelectedProduct] = useState<WardrobeItem | null>(null);
  const [activeCategory, setActiveCategory] = useState('tops');
  const [source, setSource] = useState<'closet' | 'shopping'>('closet');
  const [isAvatarLoading, setIsAvatarLoading] = useState(false);
  const [vtryonImg, setVtryonImg] = useState<TryOnImage | null>(null);
  const [savedOutfits, setSavedOutfits] = useState([]);
  const [showSaveOutfitDialog, setShowSaveOutfitDialog] = useState(false);
    const [outfitName, setOutfitName] = useState("");
    const [isFullscreen, setIsFullscreen] = useState(false);
  const [selectedAvatar, setSelectedAvatar] = useState({
    id: "DEFAULT",
    name: "Model",
    src: DEFAULT_AVATAR_URL
  });
  
  // Add states for item navigation
  const [currentCategoryItems, setCurrentCategoryItems] = useState<WardrobeItem[]>([]);
  const [currentItemIndex, setCurrentItemIndex] = useState(0);
  
  // Create a ref for pan gesture
  const panX = useRef(new Animated.Value(0)).current;

    // Refs to prevent concurrent API calls
    const hasFetchedCredits = useRef(false);
    const hasFetchedOutfits = useRef(false);

  // Get shopping list items
  const { items: shoppingItems, isLoadingShoppingList } = useShoppingList(isSignedIn, 0);
  
  // Mock wardrobe items - would be replaced with real API call
  const [wardrobeItems, setWardrobeItems] = useState([
    {
      id: 'w1',
      name: 'Classic White Tee',
      brand: 'Essentials',
      image: 'https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?q=80&w=300',
      category: 'tops',
      source: 'wardrobe'
    },
    {
      id: 'w2',
      name: 'Blue Jeans',
      brand: 'Denim Co',
      image: 'https://images.unsplash.com/photo-1541099649105-f69ad21f3246?q=80&w=300',
      category: 'bottoms',
      source: 'wardrobe'
    },
    {
      id: 'w3',
      name: 'Black Dress',
      brand: 'Chic',
      image: 'https://images.unsplash.com/photo-1595777457583-95e059d581b8?q=80&w=300',
      category: 'dresses',
      source: 'wardrobe'
    },
  ]);

  // Reset on tab focus
    useResetTab(() => {
    setActiveTab('todays-look');
        setSelectedProduct(null);
        setVtryonImg(null);
        setOutfitName("");
                setShowSaveOutfitDialog(false);
        setIsAvatarLoading(false);
        hasFetchedCredits.current = false;
        hasFetchedOutfits.current = false;
    });

  // Update the getFilteredItems function with proper types
  const getFilteredItems = useCallback((): WardrobeItem[] => {
    const wardrobeOrShopping = source === 'closet' ? 'wardrobe' : 'shopping';
    if (wardrobeOrShopping === 'wardrobe') {
      return wardrobeItems.filter(item => item.category === activeCategory);
                } else {
      return (shoppingItems || [])
        .filter((item: ShoppingItem) => {
          if (!item.garment_type) return false;
          const lowerCategory = item.garment_type.toLowerCase();
          return lowerCategory.includes(activeCategory);
        })
        .map((item: ShoppingItem) => ({
          id: item.id || '',
          name: item.title || 'Product',
          brand: item.brand || 'Unknown',
          image: item.img_url || '',
          category: item.garment_type || '',
          source: 'shopping'
        }));
    }
  }, [activeCategory, source, wardrobeItems, shoppingItems]);

  // Get filtered items based on category and update currentCategoryItems
    useEffect(() => {
    const items = getFilteredItems();
    setCurrentCategoryItems(items);
    setCurrentItemIndex(0);
  }, [activeCategory, source, getFilteredItems]);
  
  // Get previous and next items for display
  const prevItem = currentItemIndex > 0 ? currentCategoryItems[currentItemIndex - 1] : null;
  const currentItem = currentCategoryItems[currentItemIndex] || null;
  const nextItem = currentItemIndex < currentCategoryItems.length - 1 ? currentCategoryItems[currentItemIndex + 1] : null;

  // Update the handler functions with proper types
  const handleCategoryChange = (category: string) => {
    if (category === activeCategory) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setActiveCategory(category);
  };
  
  const handleTabChange = (tab: string) => {
    if (tab === activeTab) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setActiveTab(tab);
  };

  // Update the handleItemSelect function with proper types
  const handleItemSelect = async (item: WardrobeItem) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setSelectedProduct(item);
            setIsAvatarLoading(true);

    // Simulate API call with timeout
            setTimeout(() => {
                setIsAvatarLoading(false);
      // For now, just update the vtryonImg with the selected item's image
      // In a real implementation, this would be replaced with the API call result
      setVtryonImg({
        output_images: [selectedAvatar.src]
      });
                    Toast.show({
                        type: 'success',
        text1: 'Item applied to avatar',
        visibilityTime: 2000
      });
    }, 1000);
  };
  
  // Handle swipe gesture
  const handleGestureEvent = Animated.event(
    [{ nativeEvent: { translationX: panX } }],
    { useNativeDriver: true }
  );
  
  // Handle end of swipe gesture
  const handleSwipeEnd = (event: any) => {
    const { translationX } = event.nativeEvent;
    
    // Threshold for swipe to register
    const SWIPE_THRESHOLD = 100;
    
    if (translationX > SWIPE_THRESHOLD && currentItemIndex > 0) {
      // Swiped right - go to previous item
      setCurrentItemIndex(prev => prev - 1);
      handleItemSelect(currentCategoryItems[currentItemIndex - 1]);
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    } else if (translationX < -SWIPE_THRESHOLD && currentItemIndex < currentCategoryItems.length - 1) {
      // Swiped left - go to next item
      setCurrentItemIndex(prev => prev + 1);
      handleItemSelect(currentCategoryItems[currentItemIndex + 1]);
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    }
    
    // Reset pan gesture
    Animated.spring(panX, {
      toValue: 0,
      useNativeDriver: true,
      tension: 40,
      friction: 7
    }).start();
  };

  // Add state for the tooltip
  const [showTooltip, setShowTooltip] = useState(false);
  const [tooltipMessage, setTooltipMessage] = useState("");

  // Handle save outfit - modified to show tooltip instead of dialog
  const handleSaveOutfit = async () => {
    // Apply strong haptic feedback
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    
    // This would call the API to save the outfit
    // In a real implementation, you'd use a name provided earlier or generate one
    
    // Show tooltip
    setTooltipMessage("Outfit saved");
    setShowTooltip(true);
    };

  // Add fade animation state for both sides
  const [fade, setFade] = useState(1);

  // Animate fade when source changes
  useEffect(() => {
    setFade(0);
    setTimeout(() => setFade(1), 120);
  }, [source]);

    return (
    <SafeAreaView style={styles.container}>
      {/* Header with tabs */}
      <View style={styles.header}>
        <View style={styles.tabsContainer}>
          {NAVIGATION_TABS.map((tab) => (
                                <TouchableOpacity
              key={tab.key}
              style={[
                styles.tab,
                activeTab === tab.key && styles.activeTab
              ]}
              onPress={() => handleTabChange(tab.key)}
            >
              <Text style={[
                styles.tabText,
                activeTab === tab.key && styles.activeTabText
              ]}>{tab.label}</Text>
              {activeTab === tab.key && (
                <View style={styles.activeIndicator}>
                  <LinearGradient
                    colors={[theme.colors.primary.purple as string, '#ec4899', '#6366f1']}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 0 }}
                    style={styles.gradientIndicator}
                  />
                </View>
              )}
                                </TouchableOpacity>
          ))}
                        </View>
                    </View>
                    
      {/* Main content */}
      <GestureHandlerRootView style={styles.mainContainer}>
        {/* Left side placeholders */}
        <View style={styles.leftPlaceholders}>
          <Animated.View style={{ opacity: fade, width: '100%' }}>
            <PlaceholderItem style={styles.placeholderTop} direction="left" type="top" />
            <PlaceholderItem style={styles.placeholderBottom} direction="left" type="bottom" />
          </Animated.View>
        </View>

        {/* Center avatar */}
        <PanGestureHandler
          onGestureEvent={handleGestureEvent}
          onHandlerStateChange={handleSwipeEnd}
        >
          <Animated.View 
            style={[
              styles.avatarContainer,
              {transform: [{ translateX: panX }]}
            ]}
          >
            {/* Avatar display */}
            <TouchableOpacity
              activeOpacity={0.97}
              onPress={() => setIsFullscreen(true)}
              style={styles.avatarWrapper}
            >
                        <MotiView
                            animate={{
                  scale: isAvatarLoading ? 0.98 : 1,
                                }}
                                transition={{
                                    type: 'spring',
                                    damping: 15,
                                }}
                            >
                <Image
                  source={{ uri: vtryonImg?.output_images?.[0] || selectedAvatar.src }}
                  style={styles.avatarImage}
                  contentFit="cover"
                  transition={400}
                />
                {isAvatarLoading && (
                  <View style={styles.loadingOverlay}>
                    <ActivityIndicator size="large" color="#A855F7" />
                            </View>
                )}
                        </MotiView>
                                </TouchableOpacity>
          </Animated.View>
        </PanGestureHandler>

        {/* Right side placeholders */}
        <View style={styles.rightPlaceholders}>
          <Animated.View style={{ opacity: fade, width: '100%' }}>
            <PlaceholderItem style={styles.placeholderTop} direction="right" type="top" />
            <PlaceholderItem style={styles.placeholderBottom} direction="right" type="bottom" />
          </Animated.View>
                    </View>
                    
        {/* Pagination dots */}
        {currentCategoryItems.length > 0 && (
          <View style={styles.paginationWrapper}>
            <PaginationDots 
              total={currentCategoryItems.length} 
              current={currentItemIndex} 
                                />
                            </View>
        )}
      </GestureHandlerRootView>
      
      {/* Source toggle at the bottom, above Save Outfit */}
      <View style={styles.sourceToggleBottomWrapper}>
        <SourceToggle value={source} onChange={setSource} />
      </View>
      
      {/* Save outfit button */}
      <View style={styles.bottomContainer}>
        <TouchableOpacity
          style={styles.saveOutfitButton}
          onPress={handleSaveOutfit}
        >
          <LinearGradient
            colors={['#A855F7', '#EC4899']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={styles.saveOutfitGradient}
          >
            <Heart size={18} color="#FFFFFF" style={{ marginRight: 8 }} />
            <Text style={styles.saveOutfitText}>Save Outfit</Text>
          </LinearGradient>
        </TouchableOpacity>
                </View>
      
      {/* Success Tooltip */}
      <SuccessTooltip 
        visible={showTooltip} 
        message={tooltipMessage} 
        onHide={() => setShowTooltip(false)} 
      />
      
      {/* Fullscreen image modal */}
                <AnimatePresence>
                    {isFullscreen && (
                        <MotiView
                            from={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
            style={styles.fullscreenModal}
                        >
            <View style={styles.fullscreenImageContainer}>
                                <Image
                source={{ uri: vtryonImg?.output_images?.[0] || selectedAvatar.src }}
                style={styles.fullscreenImage}
                contentFit="cover"
                                />
                                <TouchableOpacity
                style={styles.closeButton}
                                    onPress={() => setIsFullscreen(false)}
                                >
                <X size={24} color="#FFFFFF" />
                                </TouchableOpacity>
                            </View>
                        </MotiView>
                    )}
                </AnimatePresence>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
    backgroundColor: '#FFFFFF',
  },
  header: {
    paddingTop: 12,
    paddingBottom: 4,
    paddingHorizontal: 16,
    marginBottom: 8,
  },
  tabsContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginBottom: 8,
  },
  tab: {
    marginHorizontal: 16,
    paddingBottom: 8,
    position: 'relative',
  },
  activeTab: {},
  tabText: {
    fontSize: responsiveFontSize(16),
    fontFamily: 'default-medium',
    color: '#9CA3AF',
  },
  activeTabText: {
    color: '#333333',
    fontFamily: 'default-semibold',
  },
  activeIndicator: {
        position: 'absolute',
        bottom: 0,
    left: 0,
    right: 0,
    height: 2,
    borderRadius: 1,
  },
  categoryScroll: {
    paddingHorizontal: 16,
    marginBottom: 16,
  },
  categoryScrollContent: {
    paddingVertical: 8,
  },
  categoryButton: {
    marginHorizontal: 8,
    paddingVertical: 8,
    paddingBottom: 12,
  },
  categoryText: {
    fontSize: responsiveFontSize(16),
    fontFamily: 'default-medium',
    color: '#9CA3AF',
  },
  activeCategoryText: {
    fontWeight: '600',
    color: theme.colors.primary.purple as string,
  },
  gradientIndicatorContainer: {
    flex: 1,
    borderRadius: 1.5,
    overflow: 'hidden',
  },
  gradientIndicator: {
        width: '100%',
        height: '100%',
    },
  mainContainer: {
        flex: 1,
    justifyContent: 'flex-start',
        alignItems: 'center',
    paddingTop: 20,
    flexDirection: 'row',
    position: 'relative',
  },
  avatarContainer: {
    width: '60%',
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarWrapper: {
    width: SCREEN_WIDTH * 0.6,
    height: SCREEN_HEIGHT * 0.65,
    borderRadius: 12,
    overflow: 'hidden',
    backgroundColor: '#FAFAFA',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 3,
    zIndex: 1,
  },
  avatarImage: {
    width: '100%',
    height: '100%',
  },
  loadingOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(255, 255, 255, 0.7)',
        alignItems: 'center',
    justifyContent: 'center',
  },
  leftPlaceholders: {
    width: '25%',
    height: '100%',
        justifyContent: 'center',
    alignItems: 'flex-end',
    position: 'relative',
    right: -20, // Overlap with avatar
  },
  rightPlaceholders: {
    width: '25%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'flex-start',
    position: 'relative',
    left: -20, // Overlap with avatar
  },
  placeholderItem: {
    width: SCREEN_WIDTH * 0.2,
    height: SCREEN_WIDTH * 0.3,
    borderRadius: 12,
    backgroundColor: '#FFFFFF',
    marginVertical: 25, // Increased margin for better spacing with just two items
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 2,
    overflow: 'hidden',
  },
  placeholderTop: {
    marginBottom: 30, // Increased for better separation
  },
  placeholderBottom: {
    marginTop: 30, // Increased for better separation
  },
  placeholderImage: {
        width: '100%',
    height: '100%',
        borderRadius: 8,
    overflow: 'hidden',
    backgroundColor: '#FFFFFF',
    position: 'relative',
    },
  placeholderImageContent: {
    width: '100%',
        height: '100%',
    },
  paginationWrapper: {
        position: 'absolute',
    bottom: 20,
    left: 0,
        right: 0,
  },
  paginationContainer: {
    flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
    marginTop: 16,
  },
  paginationDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#E5E7EB',
    marginHorizontal: 4,
  },
  paginationDotActive: {
    width: 24,
    backgroundColor: theme.colors.primary.purple as string,
  },
  bottomContainer: {
    paddingHorizontal: 24,
    paddingBottom: 24,
    width: '100%',
  },
  saveOutfitButton: {
    borderRadius: 30,
    overflow: 'hidden',
    width: SCREEN_WIDTH * 0.5,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    alignSelf: 'center',
  },
  saveOutfitGradient: {
    flexDirection: 'row',
        alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 30,
  },
  saveOutfitText: {
    color: '#FFFFFF',
        fontSize: responsiveFontSize(16),
        fontFamily: 'default-medium',
    },
  fullscreenModal: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.9)',
    zIndex: 1000,
    justifyContent: 'center',
    alignItems: 'center',
    },
    fullscreenImageContainer: {
    width: SCREEN_WIDTH * 0.9,
    height: SCREEN_HEIGHT * 0.8,
    position: 'relative',
  },
  fullscreenImage: {
    width: '100%',
    height: '100%',
    borderRadius: 12,
  },
  closeButton: {
        position: 'absolute',
    top: 16,
        right: 16,
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  tooltipContainer: {
    position: 'absolute',
    bottom: 90, // Position above the save button
    alignSelf: 'center',
    zIndex: 1000,
  },
  tooltipWrapper: {
    borderRadius: 30,
    overflow: 'hidden',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 10,
    elevation: 6,
  },
  tooltipContent: {
        flexDirection: 'row',
        alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 30,
  },
  tooltipText: {
    color: '#FFFFFF',
    fontSize: responsiveFontSize(15),
    fontFamily: 'default-semibold',
    letterSpacing: 0.3,
    },
  pillToggleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
    gap: 6,
  },
  pill: {
    borderRadius: 18,
    minWidth: 72,
    height: 32,
    marginHorizontal: 2,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F3F0FF',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    overflow: 'hidden',
    paddingHorizontal: 0,
    paddingVertical: 0,
  },
  pillActive: {
    borderWidth: 0,
    backgroundColor: 'transparent',
    padding: 0,
  },
  pillGradient: {
    borderRadius: 18,
    minWidth: 72,
    height: 32,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 0,
    paddingVertical: 0,
  },
  pillText: {
    color: theme.colors.primary.purple as string,
    fontSize: 14,
    fontFamily: 'default-medium',
    letterSpacing: 0.2,
  },
  pillTextActive: {
    color: '#fff',
    fontFamily: 'default-semibold',
  },
  sourceToggleBottomWrapper: {
    width: '100%',
    alignItems: 'center',
    marginBottom: 12,
    marginTop: 0,
  },
  swipeIndicatorOverlay: {
    position: 'absolute',
    top: '50%',
    left: '50%',
    transform: [{ translateX: -20 }, { translateY: -20 }],
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 10,
  },
  swipeIndicatorContainer: {
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
  },
  swipeIndicatorGradient: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
});

export default VirtualTryOn;

import React, { useState, useRef, useMemo, useCallback, useEffect } from 'react';
import { useShoppingList } from '@/app/(tabs)/virtual-tryon/hooks/useShoppingList';
import { useAuth } from '@clerk/clerk-react';
import { MessageCircle, ShoppingCart, ChevronUp, ChevronDown, Trash2, Bell, BarChart2, Tag, MessageSquare, User, Trash, Shirt, X, ExternalLink } from 'lucide-react-native';
import { useRouter } from 'expo-router';
import { TouchableOpacity, View, FlatList, ActivityIndicator, Pressable, Dimensions, Linking, ScrollView, Animated, Easing } from 'react-native';
import { Image } from 'expo-image';
import { Text } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { StyleSheet } from 'react-native';
import { responsiveFontSize } from '@/utils';
import { MotiView } from 'moti';
import GradientText from '@/components/GradientText';
import theme from '@/styles/theme';
import { AnimatePresence } from 'moti';
import * as Haptics from 'expo-haptics';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

// Product interface
interface Product {
  id: string;
  title: string;
  img_url: string;
  img_urls_list?: string[];
  brand?: string;
  product_price?: string;
  old_price?: string;
  description?: string;
  size?: string;
  rating?: string;
  review_count?: string;
  product_link?: string;
  category?: string;
  color?: string;
}


// Define category and sort filters
const CATEGORY_FILTERS = [
  { key: 'all', label: 'All Items' },
  { key: 'tops', label: 'Tops' },
  { key: 'bottoms', label: 'Bottoms' },
  { key: 'dresses', label: 'Dresses' },
  { key: 'outerwear', label: 'Outerwear' },
  { key: 'footwear', label: 'Footwear' },
  { key: 'accessory', label: 'Accessory' },

];

const SORT_FILTERS = [
  // { key: 'recent', label: 'Recently Added' },
  { key: 'price_low', label: 'Price: Low-High' },
  { key: 'price_high', label: 'Price: High-Low' }
];

export default function ShoppingList() {
  const { isSignedIn } = useAuth();
  const { items: originalItems, removeItem, isLoading, error, isLoadingShoppingList } = useShoppingList(isSignedIn);
  const router = useRouter();
  const [activeTab, setActiveTab] = useState('shopping-list');
  const [isGoToChatPressed, setIsGoToChatPressed] = useState(false);
  const [expandedItem, setExpandedItem] = useState<Product | null>(null);
  const [deletingItemId, setDeletingItemId] = useState<string | null>(null);
  
  // Calculate card width for animations
  const cardWidth = (SCREEN_WIDTH - 16 * 2 - 12) / 2; // (screenWidth - horizontal padding - gap) / 2 columns
  
  // Simplified state management
  const [displayLoading, setDisplayLoading] = useState(false);
  
  // Set display loading based on API loading state
  useEffect(() => {
    setDisplayLoading(isLoadingShoppingList.shoppingListLoading);
  }, [isLoadingShoppingList.shoppingListLoading]);
  
  // Add category and sort state
  const [activeCategory, setActiveCategory] = useState('all');
  const [activeSort, setActiveSort] = useState('price_low');
  
  // Refs for scroll behavior
  const categoryScrollRef = useRef<ScrollView>(null);
  const sortScrollRef = useRef<ScrollView>(null);

  // Handlers for category and sort changes with haptic feedback
  const handleCategoryChange = useCallback((category: string) => {
    if (category === activeCategory) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setActiveCategory(category);
  }, [activeCategory]);

  const handleSortChange = useCallback((sort: string) => {
    if (sort === activeSort) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setActiveSort(sort);
  }, [activeSort]);

  // Scroll behavior for categories
  useEffect(() => {
    try {
      const timer = setTimeout(() => {
        if (categoryScrollRef.current) {
          const index = CATEGORY_FILTERS.findIndex(f => f.key === activeCategory);
          if (index >= 0) {
            categoryScrollRef.current.scrollTo({
              x: Math.max(0, index * 90),
              animated: true
            });
          }
        }
      }, 100);
      return () => clearTimeout(timer);
    } catch (error) {
      console.log('Scroll error:', error);
    }
  }, [activeCategory]);

  // Scroll behavior for sort options
  useEffect(() => {
    try {
      const timer = setTimeout(() => {
        if (sortScrollRef.current) {
          const index = SORT_FILTERS.findIndex(f => f.key === activeSort);
          if (index >= 0) {
            sortScrollRef.current.scrollTo({
              x: Math.max(0, index * 90),
              animated: true
            });
          }
        }
      }, 100);
      return () => clearTimeout(timer);
    } catch (error) {
      console.log('Scroll error:', error);
    }
  }, [activeSort]);

  // Filter items based on activeCategory
  const filteredItems = useMemo(() => {
    if (activeCategory === 'all') return originalItems;
    
    return originalItems.filter(item => {
      // Match by category if it exists
      if (item.garment_type) {
        const lowerCategory = item.garment_type.toLowerCase();
        switch (activeCategory) {
          case 'tops':
            return lowerCategory.includes('tops') 
          case 'bottoms':
            return lowerCategory.includes('bottoms')
          case 'dresses':
            return lowerCategory.includes('dresses')
          case 'outerwear':
            return lowerCategory.includes('outerwear')
          case 'footwear':
            return lowerCategory.includes('footwear') 
          case 'accessory':
            return lowerCategory.includes('accessory')
          default:
            return false;
        }
      }
      // If no category, show in all
      return true;
    });
  }, [originalItems, activeCategory]);

  // Sort the filtered items based on activeSort
  const sortedItems = useMemo(() => {
    let sorted = [...filteredItems];
    
    switch (activeSort) {
      case 'price_low':
        return sorted.sort((a, b) => {
          const priceA = a.product_price ? parseFloat(a.product_price.replace(/[^0-9.]/g, "")) : 0;
          const priceB = b.product_price ? parseFloat(b.product_price.replace(/[^0-9.]/g, "")) : 0;
          return priceA - priceB;
        });
      case 'price_high':
        return sorted.sort((a, b) => {
          const priceA = a.product_price ? parseFloat(a.product_price.replace(/[^0-9.]/g, "")) : 0;
          const priceB = b.product_price ? parseFloat(b.product_price.replace(/[^0-9.]/g, "")) : 0;
          return priceB - priceA;
        });
      case 'recent':
      default:
        // Assuming items are already in recently added order from the API
        return sorted;
    }
  }, [filteredItems, activeSort]);

  const LoadingState = () => (
    <View style={styles.loadingCenter}>
      <ActivityIndicator size="large" color={theme.colors.primary.purple} />
    </View>
  );

  // Replace with ShimmerLoading component
  const ShimmerLoading = () => {
    // Calculate item width based on screen width (2 columns with gap and padding)
    const cardWidth = (SCREEN_WIDTH - 16 * 2 - 12) / 2; // (screenWidth - horizontal padding - gap) / 2 columns
    
    // Shimmer card component with animated gradient
    const ShimmerCard = ({ index }: { index: number }) => {
      const shimmerAnimation = useRef(new Animated.Value(0)).current;
      
      useEffect(() => {
        // Staggered start for more natural look
        const delay = index * 100;
        
        setTimeout(() => {
          Animated.loop(
            Animated.sequence([
              Animated.timing(shimmerAnimation, {
                toValue: 1,
                duration: 1200,
                useNativeDriver: true,
              }),
              Animated.timing(shimmerAnimation, {
                toValue: 0,
                duration: 1200,
                useNativeDriver: true,
              }),
            ])
          ).start();
        }, delay % 400); // Cycle delays to create wave effect
        
        return () => {
          shimmerAnimation.stopAnimation();
        };
      }, []);
      
      const translateX = shimmerAnimation.interpolate({
        inputRange: [0, 1],
        outputRange: [-cardWidth * 2, cardWidth * 2], // Move across the entire width
      });
      
      return (
        <View style={[styles.gridItem, { height: cardWidth * 1.4 }]}>
          <View style={[styles.cardContainer, { overflow: 'hidden', backgroundColor: '#E5E7EB', borderRadius: 12 }]}>
            {/* Single shimmer effect across the entire card */}
            <Animated.View
              style={{
                width: '300%',
                height: '100%',
                position: 'absolute',
                transform: [{ translateX }],
                left: '-100%',
                zIndex: 1
              }}
            >
              <LinearGradient
                colors={['#E5E7EB', '#F3F4F6', '#E5E7EB']}
                start={{ x: 0, y: 0.5 }}
                end={{ x: 1, y: 0.5 }}
                style={{ flex: 1 }}
              />
            </Animated.View>
          </View>
        </View>
      );
    };
    
    // Create an array of 6 shimmer cards
    const shimmerCards = Array(6).fill(0).map((_, index) => (
      <ShimmerCard key={`shimmer-${index}`} index={index} />
    ));
    
    return (
      <View style={{ flex: 1, paddingHorizontal: 16, paddingTop: 16 }}>
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 12 }}>
          {shimmerCards}
        </View>
      </View>
    );
  };

  if (error) {
    return (
      <View style={{flex: 1, backgroundColor: 'white', paddingTop: 50}}>
        <View style={{flex: 1, justifyContent: 'center', alignItems: 'center', padding: 16}}>
          <Text style={{fontSize: 18, color: 'red'}}>{error}</Text>
        </View>
      </View>
    );
  }

  // Add an effect to clear the deletingItemId when removal is complete
  useEffect(() => {
    if (isLoadingShoppingList.removeShoppingListLoading === false && deletingItemId) {
      // Reset the deleting state after a short delay to allow the UI to update
      const timer = setTimeout(() => {
        setDeletingItemId(null);
      }, 500);
      
      return () => clearTimeout(timer);
    }
  }, [isLoadingShoppingList.removeShoppingListLoading, deletingItemId]);

  const EmptyState = () => (
    <View style={styles.emptyContainer}>
      <View style={{alignItems: 'center', padding: 32}}>
        <View style={{backgroundColor: '#f5f3ff', padding: 24, borderRadius: 999, marginBottom: 20}}>
          <ShoppingCart size={64} color={theme.colors.primary.purple as string} />
        </View>
        <Text style={styles.emptyTitle}>Your shopping list is empty</Text>
        <Text style={styles.emptySubtitle}>
          Start a chat to discover and save items to your shopping list
        </Text>
        <TouchableOpacity
          onPress={() => {
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
            router.push("/chat");
          }}
          activeOpacity={0.9}
        >
          <LinearGradient
            colors={[theme.colors.primary.purple as string, '#ec4899', '#6366f1']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={styles.ctaButton}
          >
            <Text style={styles.ctaButtonText}>Go to Home Search</Text>
          </LinearGradient>
        </TouchableOpacity>
      </View>
    </View>
  );

  const EmptyFilterState = () => (
    <View style={styles.emptyContainer}>
      <View style={{alignItems: 'center', padding: 32}}>
        <View style={{backgroundColor: '#f5f3ff', padding: 24, borderRadius: 999, marginBottom: 20}}>
          <Tag size={64} color={theme.colors.primary.purple as string} />
        </View>
        <Text style={styles.emptyTitle}>No items in this category</Text>
        <Text style={styles.emptySubtitle}>
          Try selecting a different category or add more items to your shopping list
        </Text>
        <TouchableOpacity
          onPress={() => {
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
            handleCategoryChange('all');
          }}
          activeOpacity={0.9}
        >
          <LinearGradient
            colors={[theme.colors.primary.purple as string, '#ec4899', '#6366f1']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={styles.ctaButton}
          >
            <Text style={styles.ctaButtonText}>Show All Items</Text>
          </LinearGradient>
        </TouchableOpacity>
      </View>
    </View>
  );

  const handleCardPress = (item: Product) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setExpandedItem(item);
  };

  const handleCloseExpanded = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setExpandedItem(null);
  };

  const handleGoToWebsite = async (url: string | undefined) => {
    if (!url) return;
    
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    
    try {
      await Linking.openURL(url);
    } catch (error) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      console.error('Could not open URL:', error);
    }
  };

  const ShoppingItemCard = ({ item, index }: { item: Product, index: number }) => {
    // Animation values
    const scaleAnim = useRef(new Animated.Value(0.9)).current;
    const opacityAnim = useRef(new Animated.Value(0)).current;
    const translateYAnim = useRef(new Animated.Value(20)).current;
    const pressTranslateYAnim = useRef(new Animated.Value(0)).current; // For up/down movement on press
    
    // Delete animation
    const deleteScaleAnim = useRef(new Animated.Value(1)).current;
    const deleteRotateAnim = useRef(new Animated.Value(0)).current; // Add rotation for delete
    
    // Image animations
    const imageOpacityAnim = useRef(new Animated.Value(0)).current;
    const imageDriftAnim = useRef(new Animated.Value(0)).current;
    const [imageLoaded, setImageLoaded] = useState(true); // Start with true to show images immediately
    
    // Run entrance animation on mount
    useEffect(() => {
      const delay = 100 + (index * 50); // Staggered animation
      
      Animated.parallel([
        Animated.timing(scaleAnim, {
          toValue: 1,
          duration: 400,
          delay,
          useNativeDriver: true,
        }),
        Animated.timing(opacityAnim, {
          toValue: 1,
          duration: 400,
          delay,
          useNativeDriver: true,
        }),
        Animated.timing(translateYAnim, {
          toValue: 0,
          duration: 400,
          delay,
          useNativeDriver: true,
        }),
      ]).start();
      
      // Set image loaded to true immediately for now
      setImageLoaded(true);
      imageOpacityAnim.setValue(1);
    }, []);
    
    // Animate scale down when deleting
    useEffect(() => {
      if (deletingItemId === item.id) {
        Animated.parallel([
          Animated.timing(deleteScaleAnim, {
            toValue: 0,
            duration: 300,
            useNativeDriver: true,
          }),
          Animated.timing(deleteRotateAnim, {
            toValue: 1,
            duration: 300,
            useNativeDriver: true,
          })
        ]).start();
      } else {
        deleteScaleAnim.setValue(1);
        deleteRotateAnim.setValue(0);
      }
    }, [deletingItemId]);
    
    // Handle press animation with improved interaction
    const handlePressIn = () => {
      // Enhanced press effect with scale and translateY
      Animated.parallel([
        Animated.spring(scaleAnim, {
          toValue: 0.95,
          friction: 7,
          tension: 100,
          useNativeDriver: true,
        }),
        Animated.spring(pressTranslateYAnim, {
          toValue: 4, // Move down slightly
          friction: 7,
          tension: 100,
          useNativeDriver: true,
        })
      ]).start();
      
      // Trigger haptic feedback
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    };
    
    const handlePressOut = () => {
      // Return to original position and size
      Animated.parallel([
        Animated.spring(scaleAnim, {
          toValue: 1,
          friction: 7,
          tension: 100,
          useNativeDriver: true,
        }),
        Animated.spring(pressTranslateYAnim, {
          toValue: 0,
          friction: 7,
          tension: 100,
          useNativeDriver: true,
        })
      ]).start();
    };
    
    const handlePress = () => {
      // Call the original handler
      handleCardPress(item);
    };
    
    // Compute delete rotation transform
    const deleteRotateInterpolate = deleteRotateAnim.interpolate({
      inputRange: [0, 1],
      outputRange: ['0deg', '-10deg']
    });
    
    return (
      <Animated.View style={[
        styles.cardContainer,
        {
          opacity: opacityAnim,
          transform: [
            { scale: scaleAnim },
            { translateY: translateYAnim },
            { translateY: pressTranslateYAnim },
            { scale: deleteScaleAnim },
            { rotate: deleteRotateInterpolate }
          ],
        }
      ]}>
        <TouchableOpacity 
          activeOpacity={0.95}
          onPress={handlePress}
          onPressIn={handlePressIn}
          onPressOut={handlePressOut}
        >
          {item.img_url ? (
            <Image 
              source={{ uri: item.img_url }} 
              style={styles.cardImage} 
              contentFit="cover"
            />
          ) : (
            <View style={[styles.cardImage, styles.cardPlaceholder]}>
              <Shirt size={48} color={theme.colors.primary.purple as string} />
            </View>
          )}

          {/* Gradient overlay */}
          <LinearGradient
            colors={['transparent', 'rgba(0,0,0,0.6)']}
            style={styles.cardOverlay}
          >
            {/* Brand */}
            {item.brand && (
              <Text style={styles.cardBrand} numberOfLines={1}>
                {item.brand.toUpperCase()}
              </Text>
            )}

            {/* Name */}
            {item.title && (
              <Text style={styles.cardName} numberOfLines={1}>
                {item.title}
              </Text>
            )}

            {/* Price */}
            {item.product_price && (
              <Text style={styles.cardPrice}>{item.product_price}</Text>
            )}

            {/* Delete button */}
            <TouchableOpacity
              style={styles.deleteButton}
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
                setDeletingItemId(item.id);
                removeItem(item.id, item?.product_link || '');
              }}
              disabled={deletingItemId === item.id}
            >
              {deletingItemId === item.id ? (
                <ActivityIndicator size="small" color="#fff" />
              ) : (
                <LinearGradient
                  colors={[theme.colors.primary.purple as string, '#ec4899', '#6366f1']}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                  style={styles.deleteButtonGradient}
                >
                  <Trash size={16} color="#fff" />
                </LinearGradient>
              )}
            </TouchableOpacity>
          </LinearGradient>
        </TouchableOpacity>
      </Animated.View>
    );
  };

  // Add a ShimmerEffect component for image loading
  const ShimmerEffect = ({ width, height }: { width: number, height: number }) => {
    const shimmerAnimation = useRef(new Animated.Value(0)).current;
    
    useEffect(() => {
      Animated.loop(
        Animated.sequence([
          Animated.timing(shimmerAnimation, {
            toValue: 1,
            duration: 1200,
            useNativeDriver: true,
          }),
          Animated.timing(shimmerAnimation, {
            toValue: 0,
            duration: 1200,
            useNativeDriver: true,
          }),
        ])
      ).start();
      
      return () => {
        shimmerAnimation.stopAnimation();
      };
    }, []);
    
    const translateX = shimmerAnimation.interpolate({
      inputRange: [0, 1],
      outputRange: [-width * 2, width * 2],
    });
    
    return (
      <Animated.View
        style={{
          width: '300%',
          height: '100%',
          position: 'absolute',
          transform: [{ translateX }],
          left: '-100%',
        }}
      >
        <LinearGradient
          colors={['#E5E7EB', '#F3F4F6', '#E5E7EB']}
          start={{ x: 0, y: 0.5 }}
          end={{ x: 1, y: 0.5 }}
          style={{ flex: 1 }}
        />
      </Animated.View>
    );
  };

  const renderItem = ({ item, index }: { item: Product, index: number }) => (
    <View style={styles.gridItem}>
      <ShoppingItemCard item={item} index={index} />
    </View>
  );

  // Expanded product view component
  const ExpandedProductView = ({ item }: { item: Product }) => {
    const [currentImageIndex, setCurrentImageIndex] = useState(0);
    
    // Calculate discount with useMemo to avoid recalculation on every render
    const discount = useMemo(() => {
      if (item.old_price && item.product_price) {
        return Math.round(
          ((parseFloat(item.old_price.replace(/[^0-9.]/g, "")) - parseFloat(item.product_price.replace(/[^0-9.]/g, ""))) / 
          parseFloat(item.old_price.replace(/[^0-9.]/g, ""))) * 100
        );
      }
      return null;
    }, [item.old_price, item.product_price]);
    
    // Process image lists with useMemo
    const { images, hasMultipleImages } = useMemo(() => {
      const hasMultipleImages = item.img_urls_list && item.img_urls_list.length > 1;
      const images = hasMultipleImages 
        ? item.img_urls_list 
        : (item.img_url ? [item.img_url] : []);
      
      return { images, hasMultipleImages };
    }, [item.img_url, item.img_urls_list]);
    
    // Reset current image index when item changes
    useEffect(() => {
      setCurrentImageIndex(0);
    }, [item.id]);
    
    // Handle image navigation with useCallback
    const handleImageSwipe = useCallback((direction: 'next' | 'prev') => {
      if (!hasMultipleImages || !images || images.length <= 1) return;
      
      // Haptics.selectionAsync();
      
      setCurrentImageIndex(prevIndex => {
        if (direction === 'next') {
          return prevIndex === images.length - 1 ? 0 : prevIndex + 1;
        } else {
          return prevIndex === 0 ? images.length - 1 : prevIndex - 1;
        }
      });
    }, [hasMultipleImages, images]);
    
    return (
      <MotiView
        from={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.9 }}
        transition={{ type: 'timing', duration: 300 }}
        style={styles.expandedOverlay}
      >
        <View style={styles.expandedContainer}>
          <ScrollView style={styles.expandedScroll} showsVerticalScrollIndicator={false}>
            {/* Close button */}
            <Animated.View 
              style={styles.closeButton}
            >
              <TouchableOpacity onPress={handleCloseExpanded}>
                <X size={22} color="#fff" />
              </TouchableOpacity>
            </Animated.View>

            {/* Product image */}
            <View style={styles.expandedImageContainer}>
              {images && images.length > 0 ? (
                <View style={{ width: '100%', height: '100%' }}>
                  <Image 
                    source={{ uri: images[currentImageIndex] }} 
                    style={styles.expandedImage} 
                    contentFit="cover" 
                  />
                  
                  {/* Image navigation controls */}
                  {hasMultipleImages && (
                    <Animated.View 
                      style={styles.imageControls}
                    >
                      <TouchableOpacity 
                        style={styles.imageNavButton}
                        onPress={() => handleImageSwipe('prev')}
                      >
                        <Text style={styles.imageNavText}>{'◀'}</Text>
                      </TouchableOpacity>
                      
                      <View style={styles.imageDots}>
                        {images.map((_, index) => (
                          <Animated.View 
                            key={index} 
                            style={[
                              styles.imageDot, 
                              index === currentImageIndex && styles.activeDot
                            ]}
                          />
                        ))}
                      </View>
                      
                      <TouchableOpacity 
                        style={styles.imageNavButton}
                        onPress={() => handleImageSwipe('next')}
                      >
                        <Text style={styles.imageNavText}>{'▶'}</Text>
                      </TouchableOpacity>
                    </Animated.View>
                  )}
                </View>
              ) : (
                <View style={[styles.expandedImage, { backgroundColor: '#f5f3ff', alignItems: 'center', justifyContent: 'center' }]}>
                  <Shirt size={80} color={theme.colors.primary.purple as string} />
                </View>
              )}
            </View>

            {/* Product details */}
            <Animated.View 
              style={styles.expandedDetails}
            >
              {/* Brand */}
              {item.brand && (
                <Animated.Text 
                  style={styles.expandedBrand}
                >
                  {item.brand.toUpperCase()}
                </Animated.Text>
              )}
              
              {/* Title */}
              <Animated.Text 
                style={styles.expandedTitle}
              >
                {item.title}
              </Animated.Text>
              
              {/* Price information */}
              <Animated.View 
                style={styles.priceContainer}
              >
                <Text style={styles.expandedPrice}>
                  {item.product_price || ''}
                </Text>
                
                {item.old_price && (
                  <View style={styles.oldPriceContainer}>
                    <Text style={styles.oldPrice}>{item.old_price}</Text>
                    {discount && (
                      <View style={styles.discountBadge}>
                        <Text style={styles.discountText}>{discount}% OFF</Text>
                      </View>
                    )}
                  </View>
                )}
              </Animated.View>

              {item.description && (
                <View style={styles.descriptionContainer}>
                  <Text style={styles.descriptionTitle}>Description</Text>
                  <Text style={styles.descriptionText}>{item.description}</Text>
                </View>
              )}

              {/* Additional Details */}
              {(item.size || item.category || item.color) && (
                <View style={styles.additionalDetails}>
                  {item.size && (
                    <View style={styles.detailItem}>
                      <Text style={styles.detailLabel}>Size</Text>
                      <Text style={styles.detailValue}>{item.size}</Text>
                    </View>
                  )}
                  {item.category && (
                    <View style={styles.detailItem}>
                      <Text style={styles.detailLabel}>Category</Text>
                      <Text style={styles.detailValue}>{item.category}</Text>
                    </View>
                  )}
                  {item.color && (
                    <View style={styles.detailItem}>
                      <Text style={styles.detailLabel}>Color</Text>
                      <View style={styles.colorContainer}>
                        <View style={[styles.colorDot, { backgroundColor: item.color.toLowerCase() }]} />
                        <Text style={styles.detailValue}>{item.color}</Text>
                      </View>
                    </View>
                  )}
                </View>
              )}

              {/* Actions */}
              <View style={styles.expandedActions}>
                <Animated.View
                  style={styles.goToWebsiteButton}
                >
                  <TouchableOpacity 
                    onPress={() => handleGoToWebsite(item.product_link)}
                    activeOpacity={0.9}
                  >
                    <LinearGradient
                      colors={[theme.colors.primary.purple as string, '#ec4899', '#6366f1']}
                      start={{ x: 0, y: 0 }}
                      end={{ x: 1, y: 0 }}
                      style={styles.gradientButton}
                    >
                      <ExternalLink size={20} color="#fff" style={{ marginRight: 8 }} />
                      <Text style={styles.buttonText}>Go to Website</Text>
                    </LinearGradient>
                  </TouchableOpacity>
                </Animated.View>

                <Animated.View
                  style={styles.tryOnButton}
                >
                  <TouchableOpacity
                    onPress={() => {
                      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
                      handleCloseExpanded();
                      router.push("/virtual-tryon");
                    }}
                  >
                    <View style={styles.tryOnButtonInner}>
                      <User size={20} color={theme.colors.primary.purple as string} style={{ marginRight: 8 }} />
                      <Text style={styles.tryOnButtonText}>Try On</Text>
                    </View>
                  </TouchableOpacity>
                </Animated.View>
              </View>
            </Animated.View>
          </ScrollView>
        </View>
      </MotiView>
    );
  };

  return (
    <LinearGradient
      colors={['#ffffff', '#f5f3ff', '#f0f9ff']}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={{flex: 1, paddingTop: 50}}
    >
      {activeTab === 'shopping-list' ? (
        <View style={{ flex: 1 }}>          
          {/* Debug info */}
         
          
          {/* Category row */}
          {!displayLoading && originalItems.length > 0 && (
            <View style={styles.categoryHeaderContainer}>
              <ScrollView 
                ref={categoryScrollRef}
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.categoryContainer}
              >
                {CATEGORY_FILTERS.map((category) => {
                  const isActive = activeCategory === category.key;
                  
                  return (
                    <TouchableOpacity
                      key={category.key}
                      activeOpacity={0.7}
                      onPress={() => handleCategoryChange(category.key)}
                      style={styles.categoryButton}
                    >
                      <Text style={[
                        styles.categoryText,
                        isActive && styles.activeCategoryText,
                      ]}>
                        {category.label}
                      </Text>
                      
                      {isActive && (
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
                  );
                })}
              </ScrollView>
            </View>
          )}
          
          {/* Sort row - only show when there are items to sort */}
          {!displayLoading && sortedItems.length > 0 && (
            <View style={styles.sortHeaderContainer}>
              <ScrollView 
                ref={sortScrollRef}
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.sortContainer}
              >
                {SORT_FILTERS.map((sort) => {
                  const isActive = activeSort === sort.key;
                  
                  return (
                    <TouchableOpacity
                      key={sort.key}
                      activeOpacity={0.7}
                      onPress={() => handleSortChange(sort.key)}
                      style={styles.sortButton}
                    >
                      <Text style={[
                        styles.sortText,
                        isActive && styles.activeSortText,
                      ]}>
                        {sort.label}
                      </Text>
                      
                      {isActive && (
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
                  );
                })}
              </ScrollView>
            </View>
          )}

          {/* Show shimmer while loading */}
          {displayLoading && <ShimmerLoading />}

          {/* Empty state when no items */}
          {!displayLoading && originalItems.length === 0 && <EmptyState />}

          {/* Either show the filtered items list or the empty category message */}
          {!displayLoading && originalItems.length > 0 && (
            <>
              {sortedItems.length === 0 ? (
                <View style={{flex: 1, justifyContent: 'center', alignItems: 'center', padding: 20}}>
                  <View style={{backgroundColor: '#f5f3ff', padding: 24, borderRadius: 999, marginBottom: 20}}>
                    <Tag size={64} color={theme.colors.primary.purple as string} />
                  </View>
                  <Text style={styles.emptyTitle}>No items in this category</Text>
                  <Text style={styles.emptySubtitle}>
                    Try selecting a different category or add more items to your shopping list
                  </Text>
                </View>
              ) : (
                <FlatList
                  data={sortedItems}
                  renderItem={renderItem}
                  keyExtractor={(item) => item.id}
                  numColumns={2}
                  columnWrapperStyle={{ gap: 12, marginBottom: 12 }}
                  contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 120, paddingTop: 16 }}
                />
              )}
            </>
          )}
          
          {/* Animated expanded card overlay */}
          <AnimatePresence>
            {expandedItem && (
              <ExpandedProductView item={expandedItem} />
            )}
          </AnimatePresence>
        </View>
      ) : (
        // Other tab content (if needed)
        <View style={{flex: 1, justifyContent: 'center', alignItems: 'center', padding: 16}}>
          <Text style={{fontSize: 16, color: '#666'}}>Other content coming soon</Text>
        </View>
      )}
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  loadingCenter: { 
    flex: 1, 
    justifyContent: 'center', 
    alignItems: 'center' 
  },
  emptyContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 32,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: theme.colors.primary.purple as string,
    textAlign: 'center',
    marginBottom: 8,
  },
  emptySubtitle: {
    fontSize: 14,
    color: '#6B7280',
    textAlign: 'center',
    marginBottom: 20,
  },
  ctaButton: {
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 24,
  },
  ctaButtonText: { 
    color: '#fff', 
    fontWeight: '600',
    fontSize: 14,
  },
  gridItem: {
    width: '48%',
  },
  cardContainer: {
    flex: 1,
    borderRadius: 12,
    overflow: 'hidden',
    backgroundColor: '#f3f4f6',
    marginBottom: 12,
  },
  cardImage: {
    aspectRatio: 0.7,
    width: '100%',
    height: '100%',
  },
  cardPlaceholder: {
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#f5f3ff',
  },
  cardOverlay: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    padding: 8,
  },
  cardBrand: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 10,
    opacity: 0.8,
    textTransform: 'uppercase',
  },
  cardName: {
    color: '#fff',
    fontWeight: '700',
    fontSize: 14,
  },
  cardPrice: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '700',
    marginTop: 2,
  },
  deleteButton: {
    position: 'absolute',
    top: 8,
    right: 8,
    width: 32,
    height: 32,
    borderRadius: 16,
    overflow: 'hidden',
    alignItems: 'center',
    justifyContent: 'center',
  },
  deleteButtonGradient: {
    width: '100%',
    height: '100%',
    alignItems: 'center',
    justifyContent: 'center',
  },
  // Expanded view styles
  expandedOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1000,
  },
  expandedContainer: {
    width: SCREEN_WIDTH * 0.9,
    maxHeight: SCREEN_HEIGHT * 0.85,
    backgroundColor: 'white',
    borderRadius: 20,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.5,
    shadowRadius: 15,
    elevation: 10,
  },
  expandedScroll: {
    width: '100%',
  },
  closeButton: {
    position: 'absolute',
    top: 16,
    right: 16,
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 10,
  },
  expandedImageContainer: {
    width: '100%',
    height: SCREEN_WIDTH * 0.9, // Square aspect ratio
    backgroundColor: '#f3f4f6',
  },
  expandedImage: {
    width: '100%',
    height: '100%',
  },
  expandedDetails: {
    padding: 20,
  },
  expandedBrand: {
    fontSize: 14,
    fontWeight: '600',
    color: theme.colors.primary.purple as string,
    marginBottom: 4,
    textTransform: 'uppercase',
  },
  expandedTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#333',
    marginBottom: 12,
  },
  priceContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
  },
  expandedPrice: {
    fontSize: 22,
    fontWeight: '700',
    color: '#111',
    marginRight: 10,
  },
  oldPriceContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  oldPrice: {
    fontSize: 16,
    color: '#777',
    textDecorationLine: 'line-through',
    marginRight: 8,
  },
  discountBadge: {
    backgroundColor: '#FF4747',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
  },
  discountText: {
    color: 'white',
    fontSize: 12,
    fontWeight: '700',
  },
  descriptionContainer: {
    marginBottom: 20,
  },
  descriptionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8,
  },
  descriptionText: {
    fontSize: 14,
    lineHeight: 22,
    color: '#666',
  },
  additionalDetails: {
    backgroundColor: '#f9f9f9',
    borderRadius: 12,
    padding: 16,
    marginBottom: 20,
  },
  detailItem: {
    marginBottom: 12,
  },
  detailLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: '#555',
    marginBottom: 4,
  },
  detailValue: {
    fontSize: 15,
    color: '#333',
  },
  colorContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  colorDot: {
    width: 16,
    height: 16,
    borderRadius: 8,
    marginRight: 8,
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.1)',
  },
  expandedActions: {
    gap: 12,
  },
  goToWebsiteButton: {
    width: '100%',
  },
  gradientButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    height: 48,
    borderRadius: 12,
  },
  buttonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  tryOnButton: {
    width: '100%',
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 12,
  },
  tryOnButtonInner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    height: 48,
  },
  tryOnButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: theme.colors.primary.purple as string,
  },
  imageControls: {
    position: 'absolute',
    bottom: 16,
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
  },
  imageNavButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  imageNavText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
  imageDots: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  imageDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: 'rgba(255,255,255,0.5)',
    marginHorizontal: 4,
  },
  activeDot: {
    backgroundColor: 'white',
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  // Category row styles
  categoryHeaderContainer: {
    borderBottomWidth: 1,
    borderBottomColor: '#f1f1f1',
  },
  categoryContainer: {
    paddingVertical: 16,
    paddingHorizontal: 8,
  },
  categoryButton: {
    marginHorizontal: 12,
    paddingBottom: 6,
    position: 'relative',
  },
  categoryText: {
    fontSize: 16,
    fontWeight: '500',
    color: '#9CA3AF',
  },
  activeCategoryText: {
    color: theme.colors.primary.purple as string,
    fontWeight: '600',
  },
  
  // Sort row styles
  sortHeaderContainer: {
    borderBottomWidth: 1,
    borderBottomColor: '#f1f1f1',
    backgroundColor: '#FAFAFA',
  },
  sortContainer: {
    paddingVertical: 12,
    paddingHorizontal: 8,
  },
  sortButton: {
    marginHorizontal: 12,
    paddingBottom: 6,
    position: 'relative',
  },
  sortText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#9CA3AF',
  },
  activeSortText: {
    color: theme.colors.primary.purple as string,
    fontWeight: '600',
  },
  
  // Common indicator styles
  activeIndicator: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 3,
    borderRadius: 1.5,
    overflow: 'hidden',
  },
  gradientIndicator: {
    width: '100%',
    height: '100%',
  },
});
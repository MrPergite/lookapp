import React, { useState, useEffect, useRef } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Pressable, ScrollView, Dimensions, ActivityIndicator, FlatList } from 'react-native';
import { MotiScrollView, MotiText, MotiView, AnimatePresence } from 'moti';
import { responsiveFontSize } from '@/utils';
import { MessageCircle, ShoppingCart, Sparkles, X } from 'lucide-react-native';
import { router } from 'expo-router';
import { useAuth, useUser } from '@clerk/clerk-expo';
import GradientText from '@/components/GradientText';
import ProductCard from './ProductCard';
import { PRODUCTS } from '@/constants';
import DeleteOutfitDialog from '../DeleteOutfitDialog';
import { Image } from 'expo-image';
import { useApi } from '@/client-api';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';
import theme from '@/styles/theme';
import Animated, { 
  useSharedValue, 
  useAnimatedStyle, 
  withSpring, 
  withTiming, 
  Easing,
  runOnJS,
  interpolate,
  interpolateColor
} from 'react-native-reanimated';

interface TabSectionProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  handleTabChange: (tab: string) => void;
  isExpanded: boolean;
  products: any[];
  selectedProduct: any;
  loadingShoppingProductId: string;
  savedOutfits: any[];
  handleOutfitClick: (outfit: any) => void;
  handleProductSelect: (product: any) => void;
  onDeleteOutfit: (outfitId: string) => void;
  setOutfitToDelete: (outfitId: string) => void;
  deleteOutfit: (outfitId: string) => void;
  outfitToDelete: string;
  isLoading: boolean;
  deleting: boolean;
  setShowModal: (showModal: boolean) => void;
  showModal: boolean;
  isAvatarLoading: boolean;
  setIsExpanded: (isExpanded: boolean) => void;
}

const EmptyState = () => (
  <ScrollView style={{ marginBottom: 50 }}>
    <View className="flex flex-col items-center justify-center pt-8">
      <View className="text-center space-y-4 sm:space-y-6 max-w-[280px] sm:max-w-md mx-auto">
        <View
          style={styles.cartIconContainer}>
          <ShoppingCart
            style={styles.cartIcon}
            size={24} color="#8b5cf6"
          />
        </View>
        <View className="space-y-2">

          <GradientText gradientColors={['#9b87f5', '#7E69AB']} style={styles.emptyTitle}>Your shopping list is empty</GradientText>
          <Text
            style={styles.emptySubtitle}>
            Start a chat to discover and save items to your shopping list
          </Text>
        </View>
        <MotiView
          className="hidden sm:flex flex-col items-center space-y-2 pt-2"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
        >
          <TouchableOpacity
            onPress={() => router.replace("/(tabs)" as any)}
            className="bg-gradient-to-r from-[#9b87f5] to-[#7E69AB] text-white hover:from-[#8b77e5] hover:to-[#6E59A5] transition-all duration-300 rounded-full shadow-lg hover:shadow-xl dark:shadow-purple-500/20"
          >
            <MessageCircle className="w-4 h-4 sm:w-5 sm:h-5" />
          </TouchableOpacity>
          <MotiText
            className="text-xs sm:text-sm text-gray-600 dark:text-gray-400"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.2, duration: 0.3 }}
          >
            Go to chat
          </MotiText>
        </MotiView>
      </View>
    </View>
  </ScrollView>
);

const EmptyOutfits = () => (
  <MotiView
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ duration: 0.5 }}
    className="flex flex-col items-center justify-center py-12 px-4 text-center space-y-4"
  >
    <View style={styles.emptyOutfitsContainer} className="w-16 h-16 rounded-full bg-purple-100 dark:bg-purple-900/20 flex items-center justify-center mb-2">
      <Sparkles size={32} color="#9333ea" style={styles.emptyOutfitsIcon} className="w-8 h-8 text-purple-600 dark:text-purple-400" />
    </View>
    <Text className="text-lg font-semibold text-gray-900 dark:text-gray-100">
      No saved outfits yet
    </Text>
    <Text className="text-sm text-gray-500 dark:text-gray-400 max-w-[250px]">
      Try on different items and save your favorite combinations to see them
      here
    </Text>
  </MotiView>
);

function TabSection({ activeTab, setActiveTab,
  handleTabChange,
  isExpanded,
  products,
  selectedProduct,
  loadingShoppingProductId,
  savedOutfits,
  handleOutfitClick,
  handleProductSelect,
  onDeleteOutfit,
  setOutfitToDelete,
  deleteOutfit,
  outfitToDelete,
  isLoading,
  deleting,
  setShowModal,
  showModal,
  isAvatarLoading,
  setIsExpanded, }: TabSectionProps) {
  const { isSignedIn } = useAuth();
  const { user } = useUser();
  const { callProtectedEndpoint } = useApi();
  const [wardrobeItems, setWardrobeItems] = useState([]);
  const [isLoadingWardrobe, setIsLoadingWardrobe] = useState(false);
  const scrollViewRef = useRef<ScrollView>(null);
  
  // Animation values for tab indicator
  const tabIndicatorWidth = useSharedValue(0);
  const tabIndicatorPosition = useSharedValue(0);
  const tabContentOpacity = useSharedValue(1);
  const tabContentTranslateY = useSharedValue(0);
  
  // Previous tab for animation
  const [previousTab, setPreviousTab] = useState(activeTab);
  
  // References to measure tab button positions
  const tabRefs = {
    'shopping-list': useRef(null),
    'my-outfits': useRef(null),
    'my-wardrobe': useRef(null)
  };

  useEffect(() => {
    if (activeTab === 'my-wardrobe' && isSignedIn) {
      setIsLoadingWardrobe(true);
      callProtectedEndpoint('digitalWardrobeItems', {
        method: 'POST',
        data: {
          pagination: { page_size: 20, page_number: 0 },
          filter: { super_categories: null },
        },
      })
        .then((res) => setWardrobeItems(res?.items || []))
        .catch(() => setWardrobeItems([]))
        .finally(() => setIsLoadingWardrobe(false));
    }
  }, [activeTab, isSignedIn]);

  const isMyOutfitsExpanded = activeTab === "my-outfits" && isExpanded;

  const handleDeleteClick = (outfit) => {
    setOutfitToDelete(outfit);
    setShowModal(true);
  };

  const handleConfirmDelete = () => {
    deleteOutfit(outfitToDelete);
  };

  const handleProductCardClick = (product) => {
    if (!isAvatarLoading) {
      handleProductSelect(product);
    }
  };

  const { height: screenHeight } = Dimensions.get('window');

  // Animated tab transition for content
  const animateTabContentOut = () => {
    // Animate content out
    tabContentOpacity.value = withTiming(0, { 
      duration: 150,
      easing: Easing.bezier(0.2, 0, 0.15, 1)
    });
    tabContentTranslateY.value = withTiming(10, { 
      duration: 150,
      easing: Easing.bezier(0.2, 0, 0.15, 1)
    });
  };
  
  const animateTabContentIn = () => {
    // Animate content in
    tabContentOpacity.value = withTiming(1, { 
      duration: 250,
      easing: Easing.bezier(0.2, 0, 0.15, 1)
    });
    tabContentTranslateY.value = withTiming(0, { 
      duration: 250,
      easing: Easing.bezier(0.2, 0, 0.15, 1)
    });
  };

  // Handle tab change with haptic feedback and animations
  const handleTabPress = (tab: string) => {
    if (tab !== activeTab) {
      // Haptic feedback
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      
      // Store previous tab for animation
      setPreviousTab(activeTab);
      
      // Start exit animation for current content
      animateTabContentOut();
      
      // After a small delay, change the tab
      setTimeout(() => {
        setActiveTab(tab);
        
        // Start entrance animation for new content
        requestAnimationFrame(() => {
          animateTabContentIn();
        });
      }, 100);
    }
  };

  // Content animation style
  const contentAnimStyle = useAnimatedStyle(() => {
    return {
      opacity: tabContentOpacity.value,
      transform: [{ translateY: tabContentTranslateY.value }]
    };
  });

  // Scroll behavior for tabs
  useEffect(() => {
    try {
      const timer = setTimeout(() => {
        if (scrollViewRef.current) {
          let index = 0;
          if (activeTab === 'shopping-list') index = 0;
          else if (activeTab === 'my-outfits') index = 1;
          else if (activeTab === 'my-wardrobe') index = 2;
          
          scrollViewRef.current.scrollTo({
            x: Math.max(0, index * 100),
            animated: true
          });
        }
      }, 100);
      return () => clearTimeout(timer);
    } catch (error) {
      console.log('Scroll error:', error);
    }
  }, [activeTab]);
  
  // Update tab indicator animation
  useEffect(() => {
    const updateTabIndicator = () => {
      const currentTabRef = tabRefs[activeTab]?.current;
      if (currentTabRef) {
        currentTabRef.measure((x, y, width, height, pageX, pageY) => {
          // Animate the indicator to new position and width
          tabIndicatorWidth.value = withSpring(width, {
            damping: 15,
            stiffness: 180,
            mass: 1,
            overshootClamping: false
          });
          
          tabIndicatorPosition.value = withSpring(pageX, {
            damping: 15,
            stiffness: 180,
            mass: 1,
            overshootClamping: false
          });
        });
      }
    };
    
    // Small delay to ensure layout is ready
    const timer = setTimeout(updateTabIndicator, 50);
    return () => clearTimeout(timer);
  }, [activeTab]);
  
  // Tab indicator animation style
  const tabIndicatorStyle = useAnimatedStyle(() => {
    return {
      width: tabIndicatorWidth.value,
      transform: [{ translateX: tabIndicatorPosition.value }],
      position: 'absolute',
      height: 3,
      bottom: 0,
      left: 0,
      borderRadius: 1.5,
      overflow: 'hidden',
      zIndex: 10
    };
  });

  return (
    <>
      {isMyOutfitsExpanded && (
        <MotiView
          from={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-white z-40"
        />
      )}
      <MotiView
        className={`fixed top-16 bottom-0 left-0 right-0 bg-gray-50/95 rounded-t-3xl relative ${isMyOutfitsExpanded ? "z-50" : "z-10"}`}
        animate={{
          transform: [{ translateY: isMyOutfitsExpanded ? -100 : 0 }],
          height: isMyOutfitsExpanded ? screenHeight * 1 : screenHeight * 0.38,
        }}
        transition={{
          type: "spring",
          damping: 20,
          stiffness: 100
        }}
        style={{
          height: isMyOutfitsExpanded ? screenHeight : "auto",
          maxHeight: isMyOutfitsExpanded ? screenHeight : 220,
          paddingBottom: 0
        }}>
        <View style={styles.container}>
          {/* Updated tab container UI with animated indicators */}
          {isSignedIn ? (
            <View style={styles.categoryHeaderContainer}>
              {/* Floating animated indicator that moves between tabs */}
              <Animated.View style={tabIndicatorStyle}>
                <LinearGradient
                  colors={[theme.colors.primary.purple as string, '#ec4899', '#6366f1']}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                  style={styles.gradientIndicator}
                />
              </Animated.View>
              
              <ScrollView 
                ref={scrollViewRef}
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.categoryContainer}
              >
                <TouchableOpacity
                  ref={tabRefs['shopping-list']}
                  activeOpacity={0.6}
                  onPress={() => handleTabPress('shopping-list')}
                  style={styles.categoryButton}
                >
                  <MotiView
                    animate={{
                      scale: activeTab === 'shopping-list' ? 1 : 0.98,
                    }}
                    transition={{ type: 'timing', duration: 150 }}
                  >
                    <Text style={[
                      styles.categoryText,
                      activeTab === 'shopping-list' && styles.activeCategoryText,
                    ]}>
                      Shopping List
                    </Text>
                  </MotiView>
                </TouchableOpacity>

                <TouchableOpacity
                  ref={tabRefs['my-outfits']}
                  activeOpacity={0.6}
                  onPress={() => handleTabPress('my-outfits')}
                  style={styles.categoryButton}
                >
                  <MotiView
                    animate={{
                      scale: activeTab === 'my-outfits' ? 1 : 0.98,
                    }}
                    transition={{ type: 'timing', duration: 150 }}
                  >
                    <Text style={[
                      styles.categoryText,
                      activeTab === 'my-outfits' && styles.activeCategoryText,
                    ]}>
                      My Outfits
                    </Text>
                  </MotiView>
                </TouchableOpacity>
                
                <TouchableOpacity
                  ref={tabRefs['my-wardrobe']}
                  activeOpacity={0.6}
                  onPress={() => handleTabPress('my-wardrobe')}
                  style={styles.categoryButton}
                >
                  <MotiView
                    animate={{
                      scale: activeTab === 'my-wardrobe' ? 1 : 0.98,
                    }}
                    transition={{ type: 'timing', duration: 150 }}
                  >
                    <Text style={[
                      styles.categoryText,
                      activeTab === 'my-wardrobe' && styles.activeCategoryText,
                    ]}>
                      My Wardrobe
                    </Text>
                  </MotiView>
                </TouchableOpacity>
              </ScrollView>
            </View>
          ) : (
            <View style={styles.previewModeContainer}>
              <Text style={styles.previewModeText}>
                Preview Mode
              </Text>
              <View style={styles.previewModeIndicator}>
                <LinearGradient
                  colors={[theme.colors.primary.purple as string, '#ec4899', '#6366f1']}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                  style={styles.gradientIndicator}
                />
              </View>
            </View>
          )}

          {/* Animated content area */}
          <Animated.View style={contentAnimStyle}>
            {
              isSignedIn && (
                <>
                  {activeTab === "shopping-list" &&
                    <View>
                      <View className='mt-1 ring-offset-background focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:outline-none px-4 h-full' >
                        {isLoading ? (
                          <View className="px-4 pb-20 overflow-hidden">
                            <View className="overflow-x-auto p-2">
                              <View className="flex flex-row gap-3" style={{ width: "100%" }}>
                                {[1, 2, 3].map((i) => (
                                  <View
                                    key={i}
                                    className="w-[95px] h-[95px] bg-gray-200 dark:bg-gray-800/50 rounded-lg flex-shrink-0 animate-pulse"
                                  ></View>
                                ))}
                              </View>
                            </View>
                          </View>
                        ) : (

                          <View className="grid grid-cols-1 gap-4 pb-20 overflow-hidden">
                            {products.length === 0 ? (
                              <EmptyState />
                            ) : (
                              <View className="overflow-x-auto p-1">
                                <MotiScrollView contentContainerStyle={{ gap: 16 }} style={styles.productListContainer} horizontal className="flex flex-row gap-12 ">
                                  {products.map((product) => (
                                    <MotiView 
                                      key={product.id}
                                      from={{ opacity: 0, scale: 0.9 }}
                                      animate={{ opacity: 1, scale: 1 }}
                                      transition={{ 
                                        type: 'timing', 
                                        duration: 300,
                                        delay: 100 + (products.indexOf(product) * 50) // Staggered animation
                                      }}
                                    >
                                      <ProductCard
                                        id={product.id}
                                        state={product.state}
                                        product={product}
                                        isSelected={selectedProduct?.id === product.id}
                                        onSelect={() => handleProductSelect(product)}
                                        isLoading={loadingShoppingProductId === product.id}
                                        isDisabled={isAvatarLoading}
                                      />
                                    </MotiView>
                                  ))}
                                </MotiScrollView>
                              </View>
                            )}
                          </View>
                        )}
                      </View>
                    </View>}

                  {activeTab === "my-outfits" && <View
                    className="mt-6 focus-visible:outline-none px-4 h-[calc(100vh-210px)] overflow-y-auto pb-12"
                  >
                    {savedOutfits.length === 0 ? (
                      <EmptyOutfits />
                    ) : (
                      <View className="flex flex-row items-center justify-center flex-wrap gap-4 p-2">
                        {savedOutfits.map((outfit) => (
                          <Pressable
                            key={outfit.id}
                            onPress={() => {
                              handleOutfitClick(outfit);
                              handleTabChange("shopping-list");
                            }}>
                            <MotiView
                              key={outfit.id}
                              className="flex flex-col w-[160px]"
                              whileHover={{ scale: 1.02 }}
                              transition={{ duration: 0.2 }}
                            >
                              <View 
                                style={{
                                  borderRadius: 16,
                                  overflow: 'hidden',
                                  backgroundColor: 'white',
                                  shadowColor: '#000',
                                  shadowOffset: { width: 0, height: 2 },
                                  shadowOpacity: 0.1,
                                  shadowRadius: 8,
                                  elevation: 4,
                                  position: 'relative',
                                }}
                              >
                                <Image
                                  source={{ uri: outfit.vton_img_url }}
                                  alt={outfit.outfit_name}
                                  className="w-full aspect-[9/16] object-cover"
                                  contentFit="cover"
                                  contentPosition='top center'
                                  transition={100}
                                  style={{
                                    width: "100%",
                                    height: 240,
                                  }}
                                />
                                {/* Gradient overlay for text legibility */}
                                <LinearGradient
                                  colors={['transparent', 'rgba(0,0,0,0.7)']}
                                  start={{ x: 0, y: 0.7 }}
                                  end={{ x: 0, y: 1 }}
                                  style={{
                                    position: 'absolute',
                                    bottom: 0,
                                    left: 0,
                                    right: 0,
                                    height: 60,
                                    paddingHorizontal: 8,
                                    paddingBottom: 8,
                                    justifyContent: 'flex-end',
                                  }}
                                >
                                  <Text
                                    style={{
                                      color: 'white', 
                                      fontSize: 13,
                                      fontWeight: '600',
                                      textAlign: 'center'
                                    }}
                                    numberOfLines={1}
                                  >
                                    {outfit.outfit_name}
                                  </Text>
                                </LinearGradient>
                                <TouchableOpacity
                                  onPress={() => handleDeleteClick(outfit)}
                                  style={{
                                    position: 'absolute',
                                    top: 8,
                                    right: 8,
                                    backgroundColor: 'rgba(0,0,0,0.3)',
                                    borderRadius: 20,
                                    width: 24,
                                    height: 24,
                                    alignItems: 'center',
                                    justifyContent: 'center'
                                  }}
                                >
                                  <X color='white' size={16} />
                                </TouchableOpacity>
                              </View>
                            </MotiView>
                          </Pressable>
                        ))}
                      </View>
                    )}
                  </View>}

                  {activeTab === "my-wardrobe" && (
                    <View className="mt-4 focus-visible:outline-none px-4 h-[calc(100vh-200px)] overflow-y-auto pb-20 flex-1">
                      {isLoadingWardrobe ? (
                        <View className="flex-1 items-center justify-center"><ActivityIndicator size="large" color="#9333EA" /></View>
                      ) : wardrobeItems.length === 0 ? (
                        <Text className="text-lg text-gray-500 text-center mt-8">No wardrobe items found.</Text>
                      ) : (
                        <FlatList
                          data={wardrobeItems}
                          keyExtractor={item => item.id}
                          numColumns={2}
                          columnWrapperStyle={{ gap: 12, marginBottom: 12 }}
                          contentContainerStyle={{ paddingBottom: 40 }}
                          renderItem={({ item }) => (
                            <View style={{ flex: 1, margin: 4, backgroundColor: '#f3f4f6', borderRadius: 12, overflow: 'hidden' }}>
                              {item.product_img_url ? (
                                <Image source={{ uri: item.product_img_url }} style={{ aspectRatio: 0.7, width: '100%' }} resizeMode="cover" />
                              ) : (
                                <View style={{ aspectRatio: 0.7, width: '100%', alignItems: 'center', justifyContent: 'center', backgroundColor: '#f5f3ff' }}>
                                  <Text>No image</Text>
                                </View>
                              )}
                              <View style={{ padding: 8 }}>
                                <Text style={{ fontWeight: '700', fontSize: 14 }}>{item.name || 'Unnamed'}</Text>
                                <Text style={{ fontSize: 12, color: '#6B7280' }}>{item.brand}</Text>
                                <Text style={{ fontSize: 12, color: '#6B7280' }}>{item.category}</Text>
                              </View>
                            </View>
                          )}
                        />
                      )}
                    </View>
                  )}
                </>
              )
            }
          </Animated.View>
          
          {!isSignedIn && (
            <Animated.View style={contentAnimStyle}>
              <View className="w-full h-full flex flex-col">
                <View className="flex-1">
                  <View>
                    <View className="grid grid-cols-1 gap-4 pb-20 overflow-hidden">
                      {PRODUCTS.length === 0 ? (
                        <EmptyState />
                      ) : (
                        <View className="overflow-x-auto pl-1 pt-1 pb-2">
                          <MotiScrollView contentContainerStyle={{ gap: 16 }} style={styles.productListContainer} horizontal className="flex flex-row gap-12 ">
                            {PRODUCTS.map((product, index) => (
                              <MotiView 
                                key={product.id}
                                from={{ opacity: 0, scale: 0.9 }}
                                animate={{ opacity: 1, scale: 1 }}
                                transition={{ 
                                  type: 'timing', 
                                  duration: 300,
                                  delay: 100 + (index * 50) // Staggered animation
                                }}
                              >
                                <ProductCard
                                  product={product}
                                  isSelected={selectedProduct?.id === product.id}
                                  onSelect={() => handleProductCardClick(product)}
                                  isLoading={loadingShoppingProductId === product.id}
                                  isDisabled={isAvatarLoading}
                                />
                              </MotiView>
                            ))}
                          </MotiScrollView>
                        </View>
                      )}
                    </View>
                  </View>
                </View>
              </View>
            </Animated.View>
          )}
        </View>
      </MotiView>
      <DeleteOutfitDialog
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        onDelete={handleConfirmDelete}
        isDeleting={deleting}
      />
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'fixed',
    width: '100%',
    paddingBottom: 0,
    marginTop: 12,
  },
  categoryHeaderContainer: {
    borderBottomWidth: 1,
    borderBottomColor: '#f1f1f1',
    marginBottom: 2,
  },
  categoryContainer: {
    paddingVertical: 6,
    paddingHorizontal: 8,
  },
  categoryButton: {
    marginHorizontal: 12,
    paddingBottom: 2,
    position: 'relative',
  },
  categoryText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#9CA3AF',
  },
  activeCategoryText: {
    color: theme.colors.primary.purple as string,
    fontWeight: '600',
  },
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
  previewModeContainer: {
    paddingVertical: 6,
    paddingHorizontal: 20,
    alignItems: 'center',
    position: 'relative',
    marginBottom: 2,
  },
  previewModeText: {
    fontSize: 14,
    fontWeight: '600',
    color: theme.colors.primary.purple as string,
    paddingBottom: 2,
  },
  previewModeIndicator: {
    position: 'absolute',
    bottom: 0,
    left: 50,
    right: 50,
    height: 3,
    borderRadius: 1.5,
    overflow: 'hidden',
  },
  emptyStateContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: 40,
    paddingHorizontal: 24,
  },
  cartIconContainer: {
    width: 60,
    height: 60,
    borderRadius: 30,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 0,
    backgroundColor: '#f5f3ff', // Tailwind's purple-50
    padding: 16,                // p-4 (default)
    alignSelf: 'center',
  },
  emptyTitle: {
    fontSize: responsiveFontSize(20),
    fontFamily: 'default-semibold',
    color: '#333',
    marginBottom: 8,
    textAlign: 'center',
  },
  emptySubtitle: {
    fontSize: responsiveFontSize(16),
    color: '#6b7280',
    textAlign: 'center',
    lineHeight: responsiveFontSize(20),
  },
  cartIcon: {
    backgroundColor: '#f5f3ff', // Tailwind's bg-purple-50
    borderRadius: 9999,         // rounded-full
    justifyContent: 'center',
    alignItems: 'center',
    alignSelf: 'center',
  },
  emptyOutfitsContainer: {
    width: 56,                     // Reduced from 64
    height: 56,                    // Reduced from 64
    borderRadius: 9999,           // rounded-full
    backgroundColor: '#e9d5ff',   // Tailwind's purple-100
    justifyContent: 'center',     // items-center
    alignItems: 'center',         // justify-center
    marginBottom: 6,              // Reduced from 8
  },
  emptyOutfitsIcon: {

  },
  productListContainer: {
    gap: 16,                    // Reduced from 20
    width: '100%',
  },
});

export default TabSection; 

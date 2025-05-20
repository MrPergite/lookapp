import React, { useState, useRef } from 'react';
import { useShoppingList } from '@/app/(tabs)/virtual-tryon/hooks/useShoppingList';
import { useAuth } from '@clerk/clerk-react';
import { MessageCircle, ShoppingCart, ChevronUp, ChevronDown, Trash2, Bell, BarChart2, Tag, MessageSquare, User, Trash, Shirt, X, ExternalLink } from 'lucide-react-native';
import { useRouter } from 'expo-router';
import { TouchableOpacity, View, Image, FlatList, ActivityIndicator, Pressable, Dimensions, Linking, ScrollView } from 'react-native';
import { Text } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { StyleSheet } from 'react-native';
import { responsiveFontSize } from '@/utils';
import { MotiPressable, MotiView } from 'moti';
import GradientText from '@/components/GradientText';
import theme from '@/styles/theme';
import { AnimatePresence } from 'moti';

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

export default function ShoppingList() {
  const { isSignedIn } = useAuth();
  const { items, removeItem, isLoading, error, isLoadingShoppingList } = useShoppingList(isSignedIn);
  const router = useRouter();
  const [activeTab, setActiveTab] = useState('shopping-list');
  const [isGoToChatPressed, setIsGoToChatPressed] = useState(false);
  const [expandedItem, setExpandedItem] = useState<Product | null>(null);

  const LoadingState = () => (
    <View style={styles.loadingCenter}>
      <ActivityIndicator size="large" color={theme.colors.primary.purple} />
    </View>
  );

  if (error) {
    return (
      <View style={{flex: 1, backgroundColor: 'white', paddingTop: 50}}>
        <View style={{flex: 1, justifyContent: 'center', alignItems: 'center', padding: 16}}>
          <Text style={{fontSize: 18, color: 'red'}}>{error}</Text>
        </View>
      </View>
    );
  }

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
          onPress={() => router.push('/(tabs)/chat')}
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

  const handleCardPress = (item: Product) => {
    setExpandedItem(item);
  };

  const handleCloseExpanded = () => {
    setExpandedItem(null);
  };

  const handleGoToWebsite = async (url: string | undefined) => {
    if (!url) return;
    
    try {
      await Linking.openURL(url);
    } catch (error) {
      console.error('Could not open URL:', error);
    }
  };

  const ShoppingItemCard = ({ item }: { item: Product }) => {
    return (
      <TouchableOpacity 
        style={styles.cardContainer}
        activeOpacity={0.9}
        onPress={() => handleCardPress(item)}
      >
        {item.img_url ? (
          <Image source={{ uri: item.img_url }} style={styles.cardImage} resizeMode="cover" />
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
            onPress={() => removeItem(item.id, item?.product_link || '')}
            disabled={isLoadingShoppingList.removeShoppingListLoading}
          >
            {isLoadingShoppingList.removeShoppingListLoading ? (
              <ActivityIndicator size="small" color="#fff" />
            ) : (
              <Trash size={16} color="#fff" />
            )}
          </TouchableOpacity>
        </LinearGradient>
      </TouchableOpacity>
    );
  };

  const renderItem = ({ item }: { item: Product }) => (
    <View style={styles.gridItem}>
      <ShoppingItemCard item={item} />
    </View>
  );

  // Expanded product view component
  const ExpandedProductView = ({ item }: { item: Product }) => {
    const discount = item.old_price && item.product_price ? 
      Math.round(((parseFloat(item.old_price.replace(/[^0-9.]/g, "")) - parseFloat(item.product_price.replace(/[^0-9.]/g, ""))) / 
      parseFloat(item.old_price.replace(/[^0-9.]/g, ""))) * 100) : null;
    
    const [currentImageIndex, setCurrentImageIndex] = useState(0);
    const hasMultipleImages = item.img_urls_list && item.img_urls_list.length > 1;
    
    // Get images - use img_urls_list if available, otherwise fallback to single img_url
    const images = hasMultipleImages 
      ? item.img_urls_list 
      : (item.img_url ? [item.img_url] : []);
      
    const handleImageSwipe = (direction: 'next' | 'prev') => {
      if (!hasMultipleImages || images.length <= 1) return;
      
      if (direction === 'next') {
        setCurrentImageIndex(prevIndex => 
          prevIndex === images.length - 1 ? 0 : prevIndex + 1
        );
      } else {
        setCurrentImageIndex(prevIndex => 
          prevIndex === 0 ? images.length - 1 : prevIndex - 1
        );
      }
    };

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
            <TouchableOpacity 
              style={styles.closeButton}
              onPress={handleCloseExpanded}
            >
              <X size={22} color="#fff" />
            </TouchableOpacity>

            {/* Product image */}
            <View style={styles.expandedImageContainer}>
              {images.length > 0 ? (
                <View style={{ width: '100%', height: '100%' }}>
                  <Image 
                    source={{ uri: images[currentImageIndex] }} 
                    style={styles.expandedImage} 
                    resizeMode="cover" 
                  />
                  
                  {/* Image navigation controls */}
                  {hasMultipleImages && (
                    <View style={styles.imageControls}>
                      <TouchableOpacity 
                        style={styles.imageNavButton}
                        onPress={() => handleImageSwipe('prev')}
                      >
                        <Text style={styles.imageNavText}>{'◀'}</Text>
                      </TouchableOpacity>
                      
                      <View style={styles.imageDots}>
                        {images.map((_, index) => (
                          <View 
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
                    </View>
                  )}
                </View>
              ) : (
                <View style={[styles.expandedImage, { backgroundColor: '#f5f3ff', alignItems: 'center', justifyContent: 'center' }]}>
                  <Shirt size={80} color={theme.colors.primary.purple as string} />
                </View>
              )}
            </View>

            {/* Product details */}
            <View style={styles.expandedDetails}>
              {item.brand && (
                <Text style={styles.expandedBrand}>{item.brand.toUpperCase()}</Text>
              )}
              
              <Text style={styles.expandedTitle}>{item.title}</Text>
              
              <View style={styles.priceContainer}>
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
              </View>

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
                <TouchableOpacity 
                  style={styles.goToWebsiteButton}
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

                <TouchableOpacity
                  style={styles.tryOnButton}
                  onPress={() => {
                    handleCloseExpanded();
                    router.push('/(tabs)/virtual-tryon');
                  }}
                >
                  <View style={styles.tryOnButtonInner}>
                    <User size={20} color={theme.colors.primary.purple as string} style={{ marginRight: 8 }} />
                    <Text style={styles.tryOnButtonText}>Try On</Text>
                  </View>
                </TouchableOpacity>
              </View>
            </View>
          </ScrollView>
        </View>
      </MotiView>
    );
  };

  return (
    <View style={{flex: 1, backgroundColor: 'white', paddingTop: 50}}>
      {activeTab === 'shopping-list' ? (
        items.length === 0 && !isLoadingShoppingList.shoppingListLoading ? <EmptyState /> :
        isLoadingShoppingList.shoppingListLoading ? <LoadingState /> : (
          <View style={{ flex: 1 }}>
            <FlatList
              data={items}
              renderItem={renderItem}
              keyExtractor={(item) => item.id}
              numColumns={2}
              columnWrapperStyle={{ gap: 12, marginBottom: 12 }}
              contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 120 }}
            />
            
            {/* Animated expanded card overlay */}
            <AnimatePresence>
              {expandedItem && (
                <ExpandedProductView item={expandedItem} />
              )}
            </AnimatePresence>
          </View>
        )
      ) : (
        // Other tab content (if needed)
        <View style={{flex: 1, justifyContent: 'center', alignItems: 'center', padding: 16}}>
          <Text style={{fontSize: 16, color: '#666'}}>Other content coming soon</Text>
        </View>
      )}
    </View>
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
    backgroundColor: 'rgba(255, 71, 71, 0.8)',
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
    backgroundColor: 'rgba(0,0,0,0.7)',
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
});

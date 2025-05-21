import React, { useEffect, useState, useCallback, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  ActivityIndicator,
  TouchableOpacity,
  Image,
  SafeAreaView,
  ScrollView,
} from 'react-native';
import theme from '@/styles/theme';
import { Plus, Archive, Loader2, Search, Shirt, Camera, Tag } from 'lucide-react-native';
import { useUser } from '@clerk/clerk-expo';
import { useApi } from '@/client-api';
import Toast from 'react-native-toast-message';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import SimpleHeader from '../virtual-tryon/SimpleHeader';
import Animated from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';

interface WardrobeItem {
  id: string;
  brand: string;
  product_img_url: string;
  category: string;
  name?: string;
  price?: number;
  color?: string;
}

const PAGE_SIZE = 10;

const FILTERS = [
  { key: 'all', label: 'All' },
  { key: 'top', label: 'Tops' },
  { key: 'bottom', label: 'Bottoms' },
  { key: 'dress', label: 'Dresses' },
  { key: 'outerwear', label: 'Outerwear' },
  { key: 'footwear', label: 'Footwear' },
  { key: 'accessory', label: 'Accessory' },
];

const DigitalWardrobeScreen: React.FC = () => {
  const { isLoaded, user } = useUser();
  const isSignedIn = Boolean(user);
  const { callProtectedEndpoint } = useApi();

  const [items, setItems] = useState<WardrobeItem[]>([]);
  const [page, setPage] = useState(0);
  const [hasMore, setHasMore] = useState(true);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [activeFilter, setActiveFilter] = useState('all');

  const isFetchingRef = useRef(false);
  const scrollViewRef = useRef<ScrollView>(null);

  const fetchWardrobeItems = async (pageNumber: number, category: string) => {
    if (!isSignedIn) return { items: [], totalItems: 0 };

    const payload = {
      pagination: {
        page_size: PAGE_SIZE,
        page_number: pageNumber,
      },
      filter: {
        super_categories: category === 'all' ? null : [category],
      },
    };

    const response = await callProtectedEndpoint('digitalWardrobeItems', {
      method: 'POST',
      data: payload,
    });

    console.log('API Response:', response);

    return {
      items: response?.items ?? [],
      totalItems: response?.total_items ?? 0,
    };
  };

  useEffect(() => {
    if (!isLoaded) return;
    if (!isSignedIn) {
      setItems([]);
      setIsLoading(false);
      return;
    }

    let mounted = true;
    setIsLoading(true);
    setPage(0);
    setItems([]);
    setHasMore(true);

    fetchWardrobeItems(0, activeFilter)
      .then((data) => {
        if (!mounted) return;
      
        setItems(data.items);
        console.log('data.items', data.items.length, data);
        setHasMore((data.items?.length || 0) < (data.totalItems || 0));
      })
      .catch((err) => {
        console.error(err);
        Toast.show({ type: 'error', text1: 'Failed to load wardrobe' });
      })
      .finally(() => mounted && setIsLoading(false));

    return () => {
      mounted = false;
    };
  }, [activeFilter, isLoaded, isSignedIn]);

  const loadMore = useCallback(async () => {
    console.log('loadMore', isLoadingMore, hasMore, isSignedIn, isFetchingRef.current);
    if (isLoadingMore || !hasMore || !isSignedIn || isFetchingRef.current) return;
    isFetchingRef.current = true;
    setIsLoadingMore(true);
    const nextPage = page + 1;
    console.log('nextPage', nextPage);
    try {
      const data = await fetchWardrobeItems(nextPage, activeFilter);
      setItems((prev) => [...prev, ...data.items]);
      setPage(nextPage);
      setHasMore((items.length + data.items.length) < (data.totalItems || 0));
    } catch (err) {
      console.error(err);
      Toast.show({ type: 'error', text1: 'Failed to load more items' });
    } finally {
      setIsLoadingMore(false);
      isFetchingRef.current = false;
    }
  }, [isLoadingMore, hasMore, isSignedIn, page, activeFilter, items.length]);

  // Simple category change handler with haptic feedback
  const handleCategoryChange = useCallback((category: string) => {
    if (category === activeFilter) return;
    
    // Play haptic feedback
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setActiveFilter(category);
  }, [activeFilter]);

  // Basic scroll behavior effect
  useEffect(() => {
    try {
      const timer = setTimeout(() => {
        if (scrollViewRef.current) {
          const index = FILTERS.findIndex(f => f.key === activeFilter);
          if (index >= 0) {
            scrollViewRef.current.scrollTo({
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
  }, [activeFilter]);

  const WardrobeItemCard: React.FC<{ item: WardrobeItem }> = ({ item }) => {
    return (
      <View style={styles.cardContainer}>
        {item.product_img_url ? (
          <Image source={{ uri: item.product_img_url }} style={styles.cardImage}  resizeMode="cover"  />
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
          {item.brand && item.brand !== 'Unknown' && (
            <Text style={styles.cardBrand} numberOfLines={1}>
              {item.brand.toUpperCase()}
            </Text>
          )}

          {/* Name */}
          {item.name && (
            <Text style={styles.cardName} numberOfLines={1}>
              {item.name}
            </Text>
          )}

          {/* Price */}
          {item.price !== undefined && item.price !== null ? (
            <Text style={styles.cardPrice}>{item.price}</Text>
          ) : null}

          {/* Category & Color */}
          <View style={styles.cardMetaRow}>
            {item.category ? (
              <View style={styles.metaGroup}>
                <Tag size={12} color="#ffffffcc" />
                <Text style={styles.cardMetaText}>{item.category}</Text>
              </View>
            ) : null}

            {item.color ? (
              <View style={styles.metaGroup}>
                <View
                  style={[
                    styles.colorDot,
                    { backgroundColor: item.color.toLowerCase() },
                  ]}
                />
                <Text style={styles.cardMetaText}>{item.color}</Text>
              </View>
            ) : null}
          </View>
        </LinearGradient>
      </View>
    );
  };

  const renderItem = ({ item }: { item: WardrobeItem }) => (
    <View style={styles.gridItem}>
      <WardrobeItemCard item={item} />
    </View>
  );

  const ListFooter = () => {
    if (!isLoadingMore) return null;
    return (
      <View style={{ paddingVertical: 16 }}>
        <ActivityIndicator color={theme.colors.primary.purple} />
      </View>
    );
  };

  // Helper to generate contextual empty-state copy based on category
  const getCategoryEmptyCopy = (category: string) => {
    switch (category) {
      case 'top':
        return {
          title: 'No tops in your wardrobe yet',
          subtitle:
            'Add a few of your favorite shirts and blouses to see them here. Your virtual closet awaits!',
          btn: 'Add your first top',
        };
      case 'bottom':
        return {
          title: 'No bottoms yet',
          subtitle:
            'Start by adding jeans, pants or skirts you own to unlock smart outfit matches.',
          btn: 'Add a bottom',
        };
      case 'dress':
        return {
          title: 'No dresses here yet',
          subtitle:
            'Upload a few dresses you love to try on new looks and get outfit recommendations.',
          btn: 'Add a dress',
        };
      case 'outerwear':
        return {
          title: 'No outerwear added',
          subtitle:
            'Upload your jackets, coats or blazers for the perfect layer planning—rain or shine.',
          btn: 'Add outerwear',
        };
      case 'footwear':
        return {
          title: 'Your footwear rack is empty',
          subtitle: 'Include your footwears to get head-to-toe outfit matches!',
          btn: 'Add footwear',
        };
      case 'accessory':
        return {
          title: 'No accessories yet',
          subtitle:
            'Add some bags, hats, or jewelry to complete your digital wardrobe.',
          btn: 'Add accessories',
        };
      default:
        return {
          title: 'Your wardrobe is empty',
          subtitle:
            'Add items to your digital wardrobe to track your collection and get personalized outfit ideas.',
          btn: 'Add your first item',
        };
    }
  };

  const WardrobeEmptyState: React.FC<{ onAddItem: () => void; currentCategory: string }> = ({ onAddItem, currentCategory }) => {
    const { title, subtitle, btn } = getCategoryEmptyCopy(currentCategory);

    return (
      <View style={styles.emptyContainer}>
        {/* Icon inside a soft gradient circle */}
        <LinearGradient
          colors={[theme.colors.primary.purple as string + '20', '#fce7f3']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.iconCircle}
        >
          <Shirt size={64} color={theme.colors.primary.purple as string} />
        </LinearGradient>

        <Text style={styles.emptyTitle}>{title}</Text>
        <Text style={styles.emptySubtitle}>{subtitle}</Text>

        <TouchableOpacity activeOpacity={0.9} onPress={onAddItem}>
          <LinearGradient
            colors={[theme.colors.primary.purple as string, '#ec4899', '#6366f1']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={[styles.ctaButton, { flexDirection: 'row', alignItems: 'center' }]}
          >
            <Camera size={18} color="#fff" style={{ marginRight: 8 }} />
            <Text style={styles.ctaButtonText}>{btn}</Text>
          </LinearGradient>
        </TouchableOpacity>
      </View>
    );
  };

  // Empty state shown when the user is not authenticated
  const SignedOutEmptyState = () => (
    <View style={styles.emptyContainer}>
      <Archive size={80} color={theme.colors.primary.purple as string} />
      <Text style={styles.emptyTitle}>Your wardrobe is empty</Text>
      <Text style={styles.emptySubtitle}>
        Sign in or sign up to start building your digital wardrobe!
      </Text>

      <TouchableOpacity activeOpacity={0.9} onPress={() => router.push('/(authn)/signin' as any)}>
        <LinearGradient
          colors={[theme.colors.primary.purple as string, '#ec4899', '#6366f1']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={styles.ctaButton}
        >
          <Text style={styles.ctaButtonText}>Connect your wardrobe</Text>
        </LinearGradient>
      </TouchableOpacity>
    </View>
  );

  return (
    <View style={{flex: 1, backgroundColor: 'white', paddingTop: 50}}>
    <View style={styles.container}>
      {isSignedIn && (
          <View style={styles.categoryHeaderContainer}>
            <ScrollView 
              ref={scrollViewRef}
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.categoryContainer}
            >
          {FILTERS.map((f) => {
            const isActive = activeFilter === f.key;

            return (
              <TouchableOpacity
                key={f.key}
                    activeOpacity={0.7}
                    onPress={() => handleCategoryChange(f.key)}
                    style={styles.categoryButton}
                  >
                    <Text style={[
                      styles.categoryText,
                      isActive && styles.activeCategoryText,
                    ]}>
                      {f.label}
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

      {isLoading ? (
        <View style={styles.loadingCenter}>
          <ActivityIndicator size="large" color={theme.colors.primary.purple} />
        </View>
      ) : items.length === 0 ? (
        isSignedIn ? (
          <WardrobeEmptyState
            onAddItem={() => Toast.show({ text1: 'Add item coming soon' })}
            currentCategory={activeFilter === 'all' ? 'items' : activeFilter}
          />
        ) : (
          <SignedOutEmptyState />
        )
      ) : (
          // Remove complex animations from the content view
          <View style={{ flex: 1 }}>
        <FlatList
          data={items}
          renderItem={renderItem}
          keyExtractor={(item, index) => item?.id || `item-${index}`}
          numColumns={2}
          columnWrapperStyle={{ gap: 12, marginBottom: 12 }}
          contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 120 }}
          onEndReached={loadMore}
          onEndReachedThreshold={0.4}
          ListFooterComponent={ListFooter}
        />
          </View>
      )}

      {isSignedIn && (
        <TouchableOpacity
          style={styles.fab}
          onPress={() => Toast.show({ text1: 'Add item coming soon' })}
        >
          <Plus size={28} color="#fff" />
        </TouchableOpacity>
      )}
    </View>
    </View>
  );
};

export default DigitalWardrobeScreen;

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FFFFFF' },
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
  gridItem: {
    width: '48%',
  },
  itemImage: { width: '100%', aspectRatio: 1, borderRadius: 8, marginBottom: 4 },
  itemName: { fontSize: 12, color: '#374151' },
  emptyContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 32,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginTop: 12,
    color: theme.colors.primary.purple as string,
    textAlign: 'center',
  },
  emptySubtitle: {
    fontSize: 14,
    color: '#6B7280',
    textAlign: 'center',
    marginTop: 6,
  },
  loadingCenter: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  fab: {
    position: 'absolute',
    right: 24,
    bottom: 40,
    backgroundColor: theme.colors.primary.purple as string,
    height: 56,
    width: 56,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 4,
  },
  ctaButton: {
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 24,
    marginTop: 20,
  },
  ctaButtonText: { color: '#fff', fontWeight: '600' },
  iconCircle: {
    padding: 24,
    borderRadius: 999,
    marginBottom: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardContainer: {
    // width: '100%',
    // height: '100%',
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
  cardMetaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 4,
  },
  metaGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  cardMetaText: {
    color: '#ffffffcc',
    fontSize: 10,
    textTransform: 'capitalize',
  },
  colorDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    borderWidth: 1,
    borderColor: '#ffffff33',
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
});

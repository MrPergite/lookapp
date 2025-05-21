// DigitalWardrobeScreen.tsx

import React, { useEffect, useState, useCallback, useRef } from 'react';
import {
  Animated,
  View,
  Text,
  StyleSheet,
  FlatList,
  ActivityIndicator,
  TouchableOpacity,
  Image,
  SafeAreaView,
} from 'react-native';
import theme from '@/styles/theme';
import { Plus, Archive, Shirt, Camera, Tag, Search } from 'lucide-react-native';
import { useUser } from '@clerk/clerk-expo';
import { useApi } from '@/client-api';
import Toast from 'react-native-toast-message';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import SimpleHeader from '../virtual-tryon/SimpleHeader';
import { Skeleton } from '../shopping-list/components/Skeleton';

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
  { key: 'all', label: 'All Items' },
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
  const [filterLoading, setFilterLoading] = useState(false);
  const isFetchingRef = useRef(false);

  // Fetch items
  const fetchWardrobeItems = async (pageNumber: number, category: string) => {
    if (!isSignedIn) return { items: [], totalItems: 0 };
    const payload = {
      pagination: { page_size: PAGE_SIZE, page_number: pageNumber },
      filter: { super_categories: category === 'all' ? null : [category] },
    };
    const response = await callProtectedEndpoint('digitalWardrobeItems', {
      method: 'POST',
      data: payload,
    });
    return {
      items: response?.items ?? [],
      totalItems: response?.total_items ?? 0,
    };
  };

  // Initial & filter fetch
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
      .then(data => {
        if (!mounted) return;
        setItems(data.items);
        setHasMore(data.items.length < (data.totalItems || 0));
      })
      .catch(err => {
        console.error(err);
        Toast.show({ type: 'error', text1: 'Failed to load wardrobe', visibilityTime: 2000 });
      })
      .finally(() => mounted && setIsLoading(false));
    return () => { mounted = false; };
  }, [activeFilter, isLoaded, isSignedIn]);

  // Load more
  const loadMore = useCallback(async () => {
    if (isLoadingMore || !hasMore || !isSignedIn || isFetchingRef.current) return;
    isFetchingRef.current = true;
    setIsLoadingMore(true);
    const nextPage = page + 1;
    try {
      const data = await fetchWardrobeItems(nextPage, activeFilter);
      setItems(prev => [...prev, ...data.items]);
      setPage(nextPage);
      setHasMore(prev => prev + data.items.length < (data.totalItems || 0));
    } catch (err) {
      console.error(err);
      Toast.show({ type: 'error', text1: 'Failed to load more items', visibilityTime: 2000 });
    } finally {
      setIsLoadingMore(false);
      isFetchingRef.current = false;
    }
  }, [isLoadingMore, hasMore, isSignedIn, page, activeFilter]);

  // Handle filter change with loading effect
  const handleFilterChange = (filter: string) => {
    setFilterLoading(true);
    setActiveFilter(filter);
    // Add a short delay to simulate loading and show the shimmer effect
    setTimeout(() => {
      setFilterLoading(false);
    }, 600);
  };

  // Ripple effect for buttons
  const handleButtonPress = (callback: () => void) => {
    // Implement ripple effect logic here
    callback();
  };

  // Card hover effect
  const handleCardPressIn = (animationValue: Animated.Value) => {
    Animated.spring(animationValue, {
      toValue: 1.05,
      useNativeDriver: true,
    }).start();
  };

  const handleCardPressOut = (animationValue: Animated.Value) => {
    Animated.spring(animationValue, {
      toValue: 1,
      useNativeDriver: true,
    }).start();
  };

  // Gradient loading indicator
  const gradientSpinnerColors = ['#8B5CF6', '#EC4899', '#3B82F6'];

  // Text fade-in animation
  const textOpacity = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    Animated.timing(textOpacity, {
      toValue: 1,
      duration: 300,
      useNativeDriver: true,
    }).start();
  }, []);

  // Render skeleton loading UI
  const renderSkeleton = () => (
    <View style={{ paddingHorizontal: 16, paddingTop: 16, flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between' }}>
      {[...Array(8)].map((_, idx) => (
        <Skeleton
          key={idx}
          style={{ 
            width: '48%', 
            aspectRatio: 0.7, 
            borderRadius: 12, 
            marginBottom: 12,
            overflow: 'hidden'
          }}
          shimmerColors={['#f3f4f6', '#e5e7eb', '#f3f4f6']}
        >
          <View style={styles.skeletonContent}>
            <View style={styles.skeletonOverlay}>
              <Skeleton style={styles.skeletonBrand} shimmerColors={['rgba(255,255,255,0.1)', 'rgba(255,255,255,0.2)', 'rgba(255,255,255,0.1)']} />
              <Skeleton style={styles.skeletonName} shimmerColors={['rgba(255,255,255,0.1)', 'rgba(255,255,255,0.2)', 'rgba(255,255,255,0.1)']} />
              <Skeleton style={styles.skeletonPrice} shimmerColors={['rgba(255,255,255,0.1)', 'rgba(255,255,255,0.2)', 'rgba(255,255,255,0.1)']} />
              <View style={styles.skeletonMetaRow}>
                <Skeleton style={styles.skeletonTag} shimmerColors={['rgba(255,255,255,0.1)', 'rgba(255,255,255,0.2)', 'rgba(255,255,255,0.1)']} />
                <Skeleton style={styles.skeletonColor} shimmerColors={['rgba(255,255,255,0.1)', 'rgba(255,255,255,0.2)', 'rgba(255,255,255,0.1)']} />
              </View>
            </View>
          </View>
        </Skeleton>
      ))}
    </View>
  );

  // Animated card
  const WardrobeItemCard: React.FC<{ item: WardrobeItem; index: number }> = ({ item, index }) => {
    const opacity = useRef(new Animated.Value(0)).current;
    const translateY = useRef(new Animated.Value(20)).current;
    const scale = useRef(new Animated.Value(1)).current;

    useEffect(() => {
      Animated.sequence([
        Animated.delay(index * 100),
        Animated.parallel([
          Animated.timing(opacity, { toValue: 1, duration: 300, useNativeDriver: true }),
          Animated.timing(translateY, { toValue: 0, duration: 300, useNativeDriver: true }),
        ]),
      ]).start();
    }, [index, opacity, translateY]);

    return (
      <Animated.View style={[styles.cardContainer, { opacity, transform: [{ translateY }, { scale }] }]}>        
        <TouchableOpacity
          onPressIn={() => handleCardPressIn(scale)}
          onPressOut={() => handleCardPressOut(scale)}
        >
          {item.product_img_url ? (
            <Image source={{ uri: item.product_img_url }} style={styles.cardImage} resizeMode="cover" />
          ) : (
            <View style={[styles.cardImage, styles.cardPlaceholder]}>          
              <Shirt size={48} color={theme.colors.primary.purple as string} />
            </View>
          )}
          <LinearGradient
            colors={[ 'transparent', 'rgba(0,0,0,0.6)' ]}
            style={styles.cardOverlay}
          >
            {item.brand && item.brand !== 'Unknown' && (
              <Text style={styles.cardBrand} numberOfLines={1}>
                {item.brand.toUpperCase()}
              </Text>
            )}
            {item.name && (
              <Text style={styles.cardName} numberOfLines={1}>
                {item.name}
              </Text>
            )}
            {item.price != null && (
              <Text style={styles.cardPrice}>{item.price}</Text>
            )}
            <View style={styles.cardMetaRow}>
              {item.category && (
                <View style={styles.metaGroup}>
                  <Tag size={12} color="#ffffffcc" />
                  <Text style={styles.cardMetaText}>{item.category}</Text>
                </View>
              )}
              {item.color && (
                <View style={styles.metaGroup}>
                  <View style={[ styles.colorDot, { backgroundColor: item.color.toLowerCase() } ]} />
                  <Text style={styles.cardMetaText}>{item.color}</Text>
                </View>
              )}
            </View>
          </LinearGradient>
        </TouchableOpacity>
      </Animated.View>
    );
  };

  // Render item
  const renderItem = ({ item, index }: { item: WardrobeItem; index: number }) => (
    <View style={styles.gridItem}>
      <WardrobeItemCard item={item} index={index} />
    </View>
  );

  const ListFooter = () => (
    isLoadingMore
      ? <View style={{ paddingVertical: 16 }}><ActivityIndicator color={theme.colors.primary.purple} /></View>
      : null
  );

  // Empty states omitted

  return (
    <SafeAreaView style={styles.container}>
      {/* <SimpleHeader title="digital wardrobe" /> */}

      {/* Filter Bar */}
      {isSignedIn && (
        <View style={styles.filterBar}>
          {FILTERS.map(f => {
            const isActive = activeFilter === f.key;
            return (
              <TouchableOpacity
                key={f.key}
                activeOpacity={0.8}
                onPress={() => handleFilterChange(f.key)}
                style={[styles.chipTouchable]}
              >
                {isActive ? (
                  <LinearGradient
                    colors={['#8B5CF6', '#EC4899', '#3B82F6']}
                    start={{ x:0,y:0 }} end={{ x:1,y:0 }}
                    style={[styles.filterChip, styles.filterChipActive]}
                  >
                    {f.key !== 'all' && <Tag size={12} color="#fff" style={{ marginRight:4 }} />}                    
                    <Text style={styles.filterTextActive}>{f.label}</Text>
                  </LinearGradient>
                ) : (
                  <View style={styles.filterChipInactive}>
                    <Text style={styles.filterText}>{f.label}</Text>
                  </View>
                )}
              </TouchableOpacity>
            );
          })}
        </View>
      )}

      {/* Content */}
      {isLoading || filterLoading ? (
        renderSkeleton()
      ) : (
        <FlatList
          data={items}
          renderItem={renderItem}
          keyExtractor={(item,i) => item.id || `item-${i}`}
          numColumns={2}
          columnWrapperStyle={{ gap:12, marginBottom:12 }}
          contentContainerStyle={{ paddingHorizontal:16, paddingBottom:120 }}
          onEndReached={loadMore}
          onEndReachedThreshold={0.4}
          ListFooterComponent={ListFooter}
        />
      )}

      {/* FAB etc. */}
    </SafeAreaView>
  );
};

export default DigitalWardrobeScreen;

const styles = StyleSheet.create({
  container: { flex:1, backgroundColor:'#FFFFFF', paddingTop: 32 },
  filterBar: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'flex-start',
    paddingHorizontal: 12,
    paddingVertical: 50,
  },
  chipTouchable: {
    marginRight: 8,
    marginBottom: 8,
  },
  filterChip: {
    paddingTop: 6,
    paddingBottom: 6,
    paddingLeft: 8,
    paddingRight: 8,
    borderRadius: 999,
    alignItems: 'center',
    justifyContent: 'center',
    minWidth: 80,
    backgroundColor: '#fff',
    padding: 16,

    // iOS shadow
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },   // similar to md's y‐offset
    shadowOpacity: 0.1,                       // light opacity
    shadowRadius: 4,                          // blur radius

    // Android shadow
    elevation: 3,                             // roughly equivalent "depth"

  },
  filterChipInactive: {
    // paddingHorizontal: 24,
    paddingTop: 6,
    paddingBottom:6,
    paddingLeft: 8,
    paddingRight: 8,
    width: 80,
    borderRadius: 999,
    color:'rgb(255,255,255,1)',
    borderWidth: 1,
    borderColor: '#d1d5db',
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
  },
  filterChipActive: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    width: 80,
    borderRadius: 999,
    paddingTop: 8,
    paddingBottom: 8,
    paddingLeft: 6,
    paddingRight: 6,
    boxShadow:'0 4px 6px -1px rgba(0,0,0,0.1)), 0 2px 4px -2px rgba(0,0,0,0.1)',
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 4,
    elevation: 2,

  },
  filterText: { fontSize: 12, color: '#374151' },
  filterTextActive: { fontSize: 12, color: '#fff', fontWeight: '600' },
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
  loadingCenter: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  cardContainer: { flex:1, borderRadius:12, overflow:'hidden', backgroundColor:'#f3f4f6', marginBottom:12, shadowColor:'#000', shadowOffset:{width:0,height:4}, shadowOpacity:0.1, shadowRadius:6, elevation:4 },
  cardImage: { aspectRatio:0.7 },
  cardPlaceholder: { alignItems:'center',justifyContent:'center', backgroundColor:'#f5f3ff' },
  cardOverlay: { position:'absolute',bottom:0,left:0,right:0,padding:8 },
  cardBrand: { color:'#fff',fontWeight:'600',fontSize:10,opacity:0.8,textTransform:'uppercase' },
  cardName: { color:'#fff',fontWeight:'700',fontSize:14 },
  cardPrice: { color:'#fff',fontSize:16,fontWeight:'700',marginTop:2 },
  cardMetaRow: { flexDirection:'row',alignItems:'center',justifyContent:'space-between',marginTop:4 },
  metaGroup: { flexDirection:'row',alignItems:'center',gap:4 },
  cardMetaText: { color:'#ffffffcc',fontSize:10,textTransform:'capitalize' },
  colorDot: { width:8,height:8,borderRadius:4,borderWidth:1,borderColor:'#ffffff33' },
  skeletonContent: {
    flex: 1,
    position: 'relative',
  },
  skeletonOverlay: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    padding: 8,
    backgroundColor: 'rgba(0,0,0,0.3)',
  },
  skeletonBrand: {
    width: '40%',
    height: 8,
    borderRadius: 4,
    marginBottom: 6,
  },
  skeletonName: {
    width: '80%',
    height: 14,
    borderRadius: 4,
    marginBottom: 6,
  },
  skeletonPrice: {
    width: '30%',
    height: 16,
    borderRadius: 4,
    marginBottom: 6,
  },
  skeletonMetaRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 4,
  },
  skeletonTag: {
    width: '30%',
    height: 8,
    borderRadius: 4,
  },
  skeletonColor: {
    width: '25%',
    height: 8,
    borderRadius: 4,
  },
});
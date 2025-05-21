import React, { useState, useMemo, useEffect } from 'react';
import { View, Text, FlatList, TouchableOpacity, StyleSheet, useWindowDimensions } from 'react-native';
import MaskedView from '@react-native-masked-view/masked-view';
import { LinearGradient } from 'expo-linear-gradient';
import ListItem from './components/ListItem';
import { useShoppingList } from '../../(tabs)/virtual-tryon/hooks/useShoppingList';

import {Skeleton} from './components/Skeleton';
import ShoppingListFilterBar from './components/ShoppingListFilterBar';
import { ShoppingCart } from 'lucide-react-native';
import { useNavigation } from '@react-navigation/native';
import { useApi } from '@/client-api';
import SimpleHeader from '../virtual-tryon/SimpleHeader';

export default function ShoppingList() {
  const { isAuthenticated } = useApi();
  const { items, removeItem, isLoading, error } = useShoppingList(isAuthenticated);
  const navigation = useNavigation();
  const [deletingItemId, setDeletingItemId] = useState(null);
  const [activeFilter, setActiveFilter] = useState('all');
  const [filterLoading, setFilterLoading] = useState(false);
  const [dataFetched, setDataFetched] = useState(false);
  const [isMounted, setIsMounted] = useState(false);

  const windowWidth = useWindowDimensions().width;
  const horizontalPadding = windowWidth >= 768 ? 32 : windowWidth >= 640 ? 24 : 16;
  const gap = windowWidth >= 768 ? 24 : 16;
  const numColumns = 2;
  const itemWidth = (windowWidth - horizontalPadding * 2 - gap * (numColumns - 1)) / numColumns;

  const filteredItems = useMemo(() => {
    console.log("Filtering items:", items, "active filter:", activeFilter, "isLoading:", isLoading);
    if (!items) return null;
    if (activeFilter === 'all') return items;
    return items.filter((item: any) =>
      item.garment_type?.toLowerCase() === activeFilter.toLowerCase()
    );
  }, [items, activeFilter,isLoading]);

  const handleRemoveItem = async (itemId: any, productLink: string) => {
    // Set deleting state immediately
    setDeletingItemId(itemId);
    
    try {
      // Add a small delay before API call to ensure state update is reflected in UI
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // Call the actual remove function
      await removeItem(itemId, productLink);
      
      // Add a small delay after successful deletion to ensure loader is visible
      await new Promise(resolve => setTimeout(resolve, 1000));
    } catch (error) {
      console.error("Error removing item:", error);
      // Still add a small delay even on error
      await new Promise(resolve => setTimeout(resolve, 500));
    } finally {
      setDeletingItemId(null);
    }
  };

  const handleFilterChange = (filter: string) => {
    setFilterLoading(true);
    setActiveFilter(filter);
    // Add a short delay to simulate loading and show the shimmer effect
    setTimeout(() => {
      setFilterLoading(false);
    }, 600);
  };

  const renderSkeleton = () => (
    <View style={[styles.gridContainer, { paddingHorizontal: horizontalPadding }]}>  
      {[...Array(8)].map((_, idx) => (
        <Skeleton
          key={idx}
          style={{ 
            width: itemWidth, 
            aspectRatio: 4/5, 
            borderRadius: 12, 
            marginBottom: gap 
          }}
          shimmerColors={['#e5e7eb', '#f3f4f6', '#e5e7eb']}
        />
      ))}
    </View>
  );

  const renderEmptyState = (isFiltered: boolean) => (
    <View style={styles.emptyContainer}>
      <View style={styles.iconWrapper}>
        <ShoppingCart size={40} color="#9b87f5" />
      </View>
      <Text style={styles.emptyTitle}>
        {isFiltered ? 'No items match this filter' : 'Your wishlist is empty'}
      </Text>
      <Text style={styles.emptySubtitle}>
        {isFiltered
          ? 'Try selecting a different category.'
          : 'Start a chat to discover and save items to your wishlist'}
      </Text>
      {!isFiltered && (
        <TouchableOpacity style={[styles.ctaButton, { marginTop: 16 }]} onPress={() => navigation.navigate('Home' as never)}>
          <LinearGradient
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            colors={[ '#8b5cf6', '#ec4899', '#3b82f6' ]}
            style={styles.ctaGradient}
          >
            <Text style={styles.ctaText}>Go to Home Search</Text>
          </LinearGradient>
        </TouchableOpacity>
      )}
    </View>
  );

  useEffect(() => {
    if (!isLoading && items) {
      setDataFetched(true);
    }
  }, [isLoading, items]);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  if (error && !isLoading) {
    // Determine error message to display
    const errorMessage = 
      typeof error === 'string' ? error :
      error && typeof error === 'object' ? (error as {message?: string}).message || 'Unknown error' :
      'Please try again later.';
      
    return (
      <View style={styles.errorContainer}>
        <Text style={styles.errorTitle}>Error loading wishlist:</Text>
        <Text style={styles.errorSubtitle}>{errorMessage}</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.headerWrapper}>
        {/* <SimpleHeader title="wishlist" /> */}
      </View>
      <View style={{ flex: 1 }}>
        {isAuthenticated && (
          <ShoppingListFilterBar
            activeFilter={activeFilter}
            setActiveFilter={handleFilterChange}
          />
        )}
        
      
        {isLoading || filterLoading || filteredItems === null ? (
          renderSkeleton()
        ) : filteredItems.length === 0 ? (
          renderEmptyState(activeFilter !== 'all')
        ) : (
          <FlatList
            data={filteredItems}
            keyExtractor={(item: any) => item.id || item.product_link}
            numColumns={numColumns}
            columnWrapperStyle={{ justifyContent: 'space-between', marginBottom: gap }}
            contentContainerStyle={{ paddingHorizontal: horizontalPadding, paddingTop: 24, paddingBottom: 80 }}
            renderItem={({ item, index }) => (
              <View style={{ width: itemWidth }}>
                <ListItem
                  item={item}
                  onRemove={handleRemoveItem}
                  isDeleting={deletingItemId === (item as any).id}
                  index={index}
                />
              </View>
            )}
          />
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex:1, backgroundColor:'#FFFFFF', paddingTop: 12 },
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
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 6,
    // Android
    elevation: 4,

  },
  filterText: { fontSize: 12, color: '#374151' },
  filterTextActive: { fontSize: 12, color: '#fff', fontWeight: '600' },
  gridItem: {
    width: '48%',
  },
  headerWrapper: {
    alignItems: 'center',
    paddingVertical: 50,
  },
  wishlistText: {
    fontSize: 30,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  gridContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    paddingTop: 24,
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: '60%',
    paddingHorizontal: 16,
  },
  iconWrapper: {
    backgroundColor: '#f3e8ff',
    borderRadius: 100,
    padding: 24,
    marginBottom: 24,
  },
  emptyTitle: {
    fontSize: 24,
    fontWeight: '600',
    textAlign: 'center',
    marginBottom: 8,
    color: '#9b87f5',
  },
  emptySubtitle: {
    fontSize: 16,
    textAlign: 'center',
    color: '#6b7280',
    marginBottom: 16,
  },
  ctaButton: {
    borderRadius: 100,
    overflow: 'hidden',
      padding: 16,
  },
  ctaGradient: {
    paddingVertical: 16,
    paddingHorizontal: 32,
    alignItems: 'center',
    borderRadius: 100,
  },
  ctaText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#ffffff',
    textAlign: 'center',

  },
  errorContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 16,
  },
  errorTitle: {
    fontSize: 18,
    color: '#dc2626',
    marginBottom: 8,
  },
  errorSubtitle: {
    fontSize: 16,
    color: '#6b7280',
  },
});

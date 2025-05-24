import React from 'react';
import { View, Text, StyleSheet, FlatList, Image, TouchableOpacity, ActivityIndicator } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

interface Outfit {
  id: string;
  imageUrl: string;
  title: string;
  description?: string;
}

interface DiscoverySectionProps {
  outfits: Outfit[];
  isLoading: boolean;
  onEndReached?: () => void;
  onOutfitPress?: (outfit: Outfit) => void;
}

const DiscoverySection = ({ outfits, isLoading, onEndReached, onOutfitPress }: DiscoverySectionProps) => {
  const insets = useSafeAreaInsets();

  const renderOutfitCard = ({ item }: { item: Outfit }) => (
    <TouchableOpacity 
      style={styles.outfitCard}
      onPress={() => onOutfitPress?.(item)}
      activeOpacity={0.9}
    >
      <Image 
        source={{ uri: item.imageUrl }} 
        style={styles.outfitImage}
        resizeMode="cover"
      />
      <View style={styles.outfitInfo}>
        <Text style={styles.outfitTitle}>{item.title}</Text>
        {item.description && (
          <Text style={styles.outfitDescription}>{item.description}</Text>
        )}
      </View>
    </TouchableOpacity>
  );

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <Text style={styles.title}>Discover</Text>
      <FlatList
        data={outfits}
        renderItem={renderOutfitCard}
        keyExtractor={(item) => item.id}
        onEndReached={onEndReached}
        onEndReachedThreshold={0.5}
        contentContainerStyle={styles.listContent}
        ListFooterComponent={() => 
          isLoading ? (
            <ActivityIndicator size="large" color="#0000ff" style={styles.loader} />
          ) : null
        }
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    marginHorizontal: 16,
    marginVertical: 16,
  },
  listContent: {
    paddingBottom: 20,
  },
  outfitCard: {
    marginHorizontal: 16,
    marginVertical: 8,
    borderRadius: 16,
    backgroundColor: '#fff',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 5,
    overflow: 'hidden',
  },
  outfitImage: {
    width: '100%',
    height: 300,
    backgroundColor: '#f0f0f0',
  },
  outfitInfo: {
    padding: 16,
  },
  outfitTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 4,
  },
  outfitDescription: {
    fontSize: 14,
    color: '#666',
  },
  loader: {
    marginVertical: 20,
  },
});

export default DiscoverySection; 
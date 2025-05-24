import React, { useState, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  FlatList,
  Dimensions,
  ActivityIndicator,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { 
  TrendingUp, 
  Star, 
  Calendar, 
  Coffee, 
  Sparkles, 
  Monitor,
  ChevronRight,
  Heart
} from 'lucide-react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

interface Outfit {
  id: string;
  imageUrl: string;
  title: string;
  description?: string;
  price?: string;
  brand?: string;
}

interface CategoryData {
  id: string;
  title: string;
  subtitle: string;
  icon: React.ReactNode;
  color: string;
  outfits: Outfit[];
}

interface DiscoveryPageProps {
  outfits: Outfit[];
  isLoading: boolean;
  onEndReached?: () => void;
  onOutfitPress?: (outfit: Outfit) => void;
}

const { width: screenWidth } = Dimensions.get('window');
const cardWidth = screenWidth * 0.75;
const smallCardWidth = screenWidth * 0.45;

const DiscoveryPage = ({ outfits, isLoading, onEndReached, onOutfitPress }: DiscoveryPageProps) => {
  const insets = useSafeAreaInsets();
  const [likedItems, setLikedItems] = useState<Set<string>>(new Set());

  // Debug logging
  console.log('DiscoveryPage rendering with outfits:', outfits.length);
  console.log('DiscoveryPage isLoading:', isLoading);

  // Organize outfits into categories (for demo purposes, randomly distribute)
  const categories: CategoryData[] = [
    {
      id: 'micro-trends',
      title: 'Micro-Trend Radar',
      subtitle: 'Quirky styles going viral right now',
      icon: <TrendingUp size={24} color="#8B5CF6" />,
      color: '#8B5CF6',
      outfits: outfits.slice(0, 8),
    },
    {
      id: 'celebrity',
      title: 'Celebrity Style Watch',
      subtitle: 'Fits your favorite celebs just wore',
      icon: <Star size={24} color="#F59E0B" />,
      color: '#F59E0B',
      outfits: outfits.slice(8, 16),
    },
    {
      id: 'seasonal',
      title: 'Seasonal Staples',
      subtitle: 'Timely drops for the season ahead',
      icon: <Calendar size={24} color="#10B981" />,
      color: '#10B981',
      outfits: outfits.slice(16, 24),
    },
    {
      id: 'daily',
      title: 'Daily Drivers',
      subtitle: 'Everyday essentials on heavy rotation',
      icon: <Coffee size={24} color="#6B7280" />,
      color: '#6B7280',
      outfits: outfits.slice(24, 32),
    },
    {
      id: 'events',
      title: 'Event Dressing',
      subtitle: 'Looks that show up when it counts',
      icon: <Sparkles size={24} color="#EC4899" />,
      color: '#EC4899',
      outfits: outfits.slice(32, 40),
    },
    {
      id: 'screen-to-street',
      title: 'Screen to Street',
      subtitle: 'Outfits inspired by what you\'re watching',
      icon: <Monitor size={24} color="#3B82F6" />,
      color: '#3B82F6',
      outfits: outfits.slice(40, 48),
    },
  ];

  const toggleLike = (outfitId: string) => {
    setLikedItems(prev => {
      const newSet = new Set(prev);
      if (newSet.has(outfitId)) {
        newSet.delete(outfitId);
      } else {
        newSet.add(outfitId);
      }
      return newSet;
    });
  };

  const renderHeroCard = ({ item }: { item: Outfit }) => (
    <TouchableOpacity
      style={styles.heroCard}
      onPress={() => onOutfitPress?.(item)}
      activeOpacity={0.9}
    >
      <Image source={{ uri: item.imageUrl }} style={styles.heroImage} />
      <LinearGradient
        colors={['transparent', 'rgba(0,0,0,0.7)']}
        style={styles.heroGradient}
      >
        <View style={styles.heroContent}>
          <Text style={styles.heroTitle}>{item.title}</Text>
          {item.description && (
            <Text style={styles.heroSubtitle}>{item.description}</Text>
          )}
        </View>
        <TouchableOpacity
          style={styles.likeButton}
          onPress={() => toggleLike(item.id)}
        >
          <Heart
            size={20}
            color="#fff"
            fill={likedItems.has(item.id) ? "#fff" : "transparent"}
          />
        </TouchableOpacity>
      </LinearGradient>
    </TouchableOpacity>
  );

  const renderCategoryCard = ({ item }: { item: Outfit }) => (
    <TouchableOpacity
      style={styles.categoryCard}
      onPress={() => onOutfitPress?.(item)}
      activeOpacity={0.9}
    >
      <Image source={{ uri: item.imageUrl }} style={styles.categoryImage} />
      <View style={styles.categoryContent}>
        <Text style={styles.categoryTitle} numberOfLines={2}>
          {item.title}
        </Text>
        {item.brand && (
          <Text style={styles.categoryBrand}>{item.brand}</Text>
        )}
        {item.price && (
          <Text style={styles.categoryPrice}>{item.price}</Text>
        )}
      </View>
    </TouchableOpacity>
  );

  const renderCategorySection = (category: CategoryData) => {
    if (category.outfits.length === 0) return null;

    return (
      <View key={category.id} style={styles.categorySection}>
        <View style={styles.categoryHeader}>
          <View style={styles.categoryTitleContainer}>
            <View style={[styles.iconContainer, { backgroundColor: `${category.color}15` }]}>
              {category.icon}
            </View>
            <View style={styles.categoryTextContainer}>
              <Text style={styles.categoryMainTitle}>{category.title}</Text>
              <Text style={styles.categorySubtitle}>{category.subtitle}</Text>
            </View>
          </View>
          <TouchableOpacity style={styles.seeAllButton}>
            <Text style={[styles.seeAllText, { color: category.color }]}>See All</Text>
            <ChevronRight size={16} color={category.color} />
          </TouchableOpacity>
        </View>

        <FlatList
          data={category.outfits}
          renderItem={renderCategoryCard}
          keyExtractor={(item) => `${category.id}-${item.id}`}
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.categoryList}
          ItemSeparatorComponent={() => <View style={{ width: 12 }} />}
        />
      </View>
    );
  };

  if (isLoading && outfits.length === 0) {
    return (
      <View style={[styles.container, { paddingTop: insets.top }]}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#8B5CF6" />
          <Text style={styles.loadingText}>Discovering amazing outfits...</Text>
        </View>
      </View>
    );
  }

  return (
    <ScrollView 
      style={[styles.container, { paddingTop: insets.top }]}
      showsVerticalScrollIndicator={false}
      onScrollEndDrag={onEndReached}
    >
      {/* DEBUG: Test element to confirm DiscoveryPage is rendering */}
      <View style={{ backgroundColor: 'red', padding: 20, margin: 10 }}>
        <Text style={{ color: 'white', fontSize: 18, fontWeight: 'bold' }}>
          NEW DISCOVERY PAGE IS RENDERING! Outfits: {outfits.length}
        </Text>
      </View>

      {/* Header */}
      <LinearGradient
        colors={['#8B5CF6', '#7C3AED']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.header}
      >
        <Text style={styles.headerTitle}>Discover</Text>
        <Text style={styles.headerSubtitle}>Curated styles just for you</Text>
      </LinearGradient>

      {/* Hero Section */}
      {outfits.length > 0 && (
        <View style={styles.heroSection}>
          <Text style={styles.sectionTitle}>Trending Now</Text>
          <FlatList
            data={outfits.slice(0, 5)}
            renderItem={renderHeroCard}
            keyExtractor={(item) => `hero-${item.id}`}
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.heroList}
            ItemSeparatorComponent={() => <View style={{ width: 16 }} />}
          />
        </View>
      )}

      {/* Category Sections */}
      {categories.map(renderCategorySection)}

      {/* Loading More */}
      {isLoading && (
        <View style={styles.bottomLoading}>
          <ActivityIndicator size="small" color="#8B5CF6" />
          <Text style={styles.bottomLoadingText}>Loading more...</Text>
        </View>
      )}

      <View style={{ height: 100 }} />
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FAFAFA',
  },
  header: {
    paddingHorizontal: 20,
    paddingVertical: 32,
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
  },
  headerTitle: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 4,
  },
  headerSubtitle: {
    fontSize: 16,
    color: '#E5E7EB',
    opacity: 0.9,
  },
  heroSection: {
    marginTop: 24,
    marginBottom: 32,
  },
  sectionTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1F2937',
    marginHorizontal: 20,
    marginBottom: 16,
  },
  heroList: {
    paddingHorizontal: 20,
  },
  heroCard: {
    width: cardWidth,
    height: 400,
    borderRadius: 20,
    overflow: 'hidden',
    backgroundColor: '#fff',
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
  },
  heroImage: {
    width: '100%',
    height: '100%',
  },
  heroGradient: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: '50%',
    justifyContent: 'flex-end',
    padding: 20,
  },
  heroContent: {
    marginBottom: 8,
  },
  heroTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 4,
  },
  heroSubtitle: {
    fontSize: 16,
    color: '#E5E7EB',
  },
  likeButton: {
    position: 'absolute',
    top: 20,
    right: 20,
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(0,0,0,0.3)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  categorySection: {
    marginBottom: 32,
  },
  categoryHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginHorizontal: 20,
    marginBottom: 16,
  },
  categoryTitleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  iconContainer: {
    width: 48,
    height: 48,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  categoryTextContainer: {
    flex: 1,
  },
  categoryMainTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1F2937',
    marginBottom: 2,
  },
  categorySubtitle: {
    fontSize: 14,
    color: '#6B7280',
  },
  seeAllButton: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  seeAllText: {
    fontSize: 14,
    fontWeight: '600',
    marginRight: 4,
  },
  categoryList: {
    paddingHorizontal: 20,
  },
  categoryCard: {
    width: smallCardWidth,
    backgroundColor: '#fff',
    borderRadius: 16,
    overflow: 'hidden',
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
  },
  categoryImage: {
    width: '100%',
    height: 200,
    backgroundColor: '#F3F4F6',
  },
  categoryContent: {
    padding: 12,
  },
  categoryTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 4,
    lineHeight: 18,
  },
  categoryBrand: {
    fontSize: 12,
    color: '#6B7280',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 4,
  },
  categoryPrice: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#8B5CF6',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 60,
  },
  loadingText: {
    fontSize: 16,
    color: '#6B7280',
    marginTop: 12,
  },
  bottomLoading: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 20,
  },
  bottomLoadingText: {
    fontSize: 14,
    color: '#6B7280',
    marginLeft: 8,
  },
});

export default DiscoveryPage; 
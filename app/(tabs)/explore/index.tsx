import React, { useState, useEffect, useCallback } from 'react';
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
  SafeAreaView,
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
  Heart,
  Search,
  User
} from 'lucide-react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useApi } from "@/client-api";
import { getDiscoveryOutfits } from "./queries/getDiscoveryOutfits";
import Toast from "react-native-toast-message";

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
  gradient: string[];
  outfits: Outfit[];
}

const { width: screenWidth, height: screenHeight } = Dimensions.get('window');
const cardWidth = screenWidth * 0.43;
const heroCardWidth = screenWidth * 0.8;

const ExploreScreen = () => {
  const insets = useSafeAreaInsets();
  const { callPublicEndpoint } = useApi();
  const [likedItems, setLikedItems] = useState<Set<string>>(new Set());
  const [isLoading, setIsLoading] = useState(true);
  const [allOutfits, setAllOutfits] = useState<Outfit[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);

  // Define the categories with beautiful gradients
  const categories: CategoryData[] = [
    {
      id: 'micro-trends',
      title: 'Micro-Trend Radar',
      subtitle: 'Quirky styles going viral right now',
      icon: <TrendingUp size={20} color="#fff" />,
      gradient: ['#667eea', '#764ba2'],
      outfits: allOutfits.slice(0, 8),
    },
    {
      id: 'celebrity',
      title: 'Celebrity Style Watch', 
      subtitle: 'Fits your favorite celebs just wore',
      icon: <Star size={20} color="#fff" />,
      gradient: ['#f093fb', '#f5576c'],
      outfits: allOutfits.slice(8, 16),
    },
    {
      id: 'seasonal',
      title: 'Seasonal Staples',
      subtitle: 'Timely drops for the season ahead',
      icon: <Calendar size={20} color="#fff" />,
      gradient: ['#4facfe', '#00f2fe'],
      outfits: allOutfits.slice(16, 24),
    },
    {
      id: 'daily',
      title: 'Daily Drivers',
      subtitle: 'Everyday essentials on heavy rotation',
      icon: <Coffee size={20} color="#fff" />,
      gradient: ['#43e97b', '#38f9d7'],
      outfits: allOutfits.slice(24, 32),
    },
    {
      id: 'events',
      title: 'Event Dressing',
      subtitle: 'Looks that show up when it counts',
      icon: <Sparkles size={20} color="#fff" />,
      gradient: ['#fa709a', '#fee140'],
      outfits: allOutfits.slice(32, 40),
    },
    {
      id: 'screen-to-street',
      title: 'Screen to Street',
      subtitle: 'Outfits inspired by what you\'re watching',
      icon: <Monitor size={20} color="#fff" />,
      gradient: ['#a8edea', '#fed6e3'],
      outfits: allOutfits.slice(40, 48),
    },
  ];

  // Fetch outfits on component mount
  useEffect(() => {
    const fetchOutfits = async () => {
      try {
        setIsLoading(true);
        const params = {
          pageNumber: 0,
          pageSize: 50,
          gender: "male/female",
        };

        const data = await getDiscoveryOutfits(callPublicEndpoint, params);
        
        // Transform the data to match our interface
        const transformedOutfits = data.discoveryOutfits.map((outfit: any) => ({
          id: outfit.id || outfit.outfit_id || String(Math.random()),
          imageUrl: outfit.imageUrl || outfit.outfit_img_url || outfit.image_url || outfit.image || '',
          title: outfit.title || outfit.outfit_title || outfit.name || 'Stylish Outfit',
          description: outfit.description || outfit.outfit_description || '',
          price: outfit.price || `$${Math.floor(Math.random() * 500 + 50)}.00`,
          brand: outfit.brand || 'Designer Brand'
        }));

        setAllOutfits(transformedOutfits);
      } catch (error) {
        console.error('Error fetching outfits:', error);
        Toast.show({
          type: "error",
          text1: "Failed to load outfits",
          text2: "Please try again later",
          visibilityTime: 3000
        });
      } finally {
        setIsLoading(false);
      }
    };

    fetchOutfits();
  }, []);

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
    <TouchableOpacity style={styles.heroCard} activeOpacity={0.95}>
      <Image source={{ uri: item.imageUrl }} style={styles.heroImage} />
      <LinearGradient
        colors={['transparent', 'rgba(0,0,0,0.8)']}
        style={styles.heroOverlay}
      >
        <TouchableOpacity
          style={styles.heroLikeButton}
          onPress={() => toggleLike(item.id)}
        >
          <Heart
            size={18}
            color="#fff"
            fill={likedItems.has(item.id) ? "#fff" : "transparent"}
          />
        </TouchableOpacity>
        <View style={styles.heroContent}>
          <Text style={styles.heroTitle}>{item.title}</Text>
          <Text style={styles.heroPrice}>{item.price}</Text>
        </View>
      </LinearGradient>
    </TouchableOpacity>
  );

  const renderOutfitCard = ({ item }: { item: Outfit }) => (
    <TouchableOpacity style={styles.outfitCard} activeOpacity={0.9}>
      <Image source={{ uri: item.imageUrl }} style={styles.outfitImage} />
      <LinearGradient
        colors={['transparent', 'rgba(0,0,0,0.6)']}
        style={styles.outfitOverlay}
      >
        <TouchableOpacity
          style={styles.likeButton}
          onPress={() => toggleLike(item.id)}
        >
          <Heart
            size={14}
            color="#fff"
            fill={likedItems.has(item.id) ? "#fff" : "transparent"}
          />
        </TouchableOpacity>
      </LinearGradient>
      <View style={styles.outfitInfo}>
        <Text style={styles.outfitTitle} numberOfLines={1}>{item.title}</Text>
        <Text style={styles.outfitPrice}>{item.price}</Text>
      </View>
    </TouchableOpacity>
  );

  const renderCategoryHeader = (category: CategoryData) => (
    <View style={styles.categoryHeader}>
      <LinearGradient
        colors={category.gradient}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 0 }}
        style={styles.categoryIconContainer}
      >
        {category.icon}
      </LinearGradient>
      <View style={styles.categoryTextContainer}>
        <Text style={styles.categoryTitle}>{category.title}</Text>
        <Text style={styles.categorySubtitle}>{category.subtitle}</Text>
      </View>
      <TouchableOpacity style={styles.seeAllButton}>
        <Text style={styles.seeAllText}>See All</Text>
        <ChevronRight size={16} color="#8B5CF6" />
      </TouchableOpacity>
    </View>
  );

  if (isLoading) {
    return (
      <SafeAreaView style={[styles.container, { paddingTop: insets.top }]}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#8B5CF6" />
          <Text style={styles.loadingText}>Discovering amazing outfits...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.container, { paddingTop: insets.top }]}>
      <ScrollView 
        style={styles.scrollView}
        showsVerticalScrollIndicator={false}
        bounces={true}
      >
        {/* Header */}
        <LinearGradient
          colors={['#8B5CF6', '#7C3AED']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.header}
        >
          <View style={styles.headerContent}>
            <View>
              <Text style={styles.headerTitle}>Discover</Text>
              <Text style={styles.headerSubtitle}>Curated styles just for you</Text>
            </View>
            <TouchableOpacity style={styles.profileButton}>
              <User size={24} color="#fff" />
            </TouchableOpacity>
          </View>
        </LinearGradient>

        {/* Search Bar */}
        <View style={styles.searchContainer}>
          <View style={styles.searchBar}>
            <Search size={20} color="#666" />
            <Text style={styles.searchPlaceholder}>Search for any fashion item...</Text>
          </View>
        </View>

        {/* Hero Section - Trending Now */}
        {allOutfits.length > 0 && (
          <View style={styles.heroSection}>
            <Text style={styles.sectionTitle}>Trending Now</Text>
            <FlatList
              data={allOutfits.slice(0, 6)}
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
        {categories.map((category) => {
          if (category.outfits.length === 0) return null;
          
          return (
            <View key={category.id} style={styles.categorySection}>
              {renderCategoryHeader(category)}
              <FlatList
                data={category.outfits}
                renderItem={renderOutfitCard}
                keyExtractor={(item) => `${category.id}-${item.id}`}
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.categoryList}
                ItemSeparatorComponent={() => <View style={{ width: 12 }} />}
              />
            </View>
          );
        })}

        <View style={{ height: 100 }} />
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FAFAFA',
  },
  scrollView: {
    flex: 1,
  },
  header: {
    paddingHorizontal: 20,
    paddingVertical: 24,
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
  },
  headerContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 4,
  },
  headerSubtitle: {
    fontSize: 16,
    color: '#E5E7EB',
    opacity: 0.9,
  },
  profileButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(255,255,255,0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  searchContainer: {
    paddingHorizontal: 20,
    marginTop: 20,
    marginBottom: 24,
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 16,
    paddingHorizontal: 16,
    paddingVertical: 14,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  searchPlaceholder: {
    marginLeft: 12,
    fontSize: 16,
    color: '#666',
    flex: 1,
  },
  heroSection: {
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
    width: heroCardWidth,
    height: 280,
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
  heroOverlay: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: '60%',
    justifyContent: 'space-between',
    padding: 16,
  },
  heroLikeButton: {
    alignSelf: 'flex-end',
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(0,0,0,0.3)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  heroContent: {
    alignSelf: 'flex-start',
  },
  heroTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 4,
  },
  heroPrice: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
  },
  categorySection: {
    marginBottom: 32,
  },
  categoryHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: 20,
    marginBottom: 16,
  },
  categoryIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  categoryTextContainer: {
    flex: 1,
  },
  categoryTitle: {
    fontSize: 18,
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
    color: '#8B5CF6',
    marginRight: 4,
  },
  categoryList: {
    paddingHorizontal: 20,
  },
  outfitCard: {
    width: cardWidth,
    backgroundColor: '#fff',
    borderRadius: 16,
    overflow: 'hidden',
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
  },
  outfitImage: {
    width: '100%',
    height: 160,
    backgroundColor: '#F3F4F6',
  },
  outfitOverlay: {
    position: 'absolute',
    top: 0,
    right: 0,
    padding: 8,
  },
  likeButton: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: 'rgba(0,0,0,0.3)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  outfitInfo: {
    padding: 12,
  },
  outfitTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 4,
  },
  outfitPrice: {
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
});

export default ExploreScreen;


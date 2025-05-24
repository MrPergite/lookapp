import React, { useRef, useState, useEffect, useCallback } from 'react';
import { View, Text, FlatList, StyleSheet, Pressable, Dimensions, NativeScrollEvent, NativeSyntheticEvent, Animated, Easing } from 'react-native';
import { Image } from 'expo-image';
import { ChevronRight } from 'lucide-react-native';
import theme from '@/styles/theme'; // Assuming your theme file path
import { LinearGradient } from 'expo-linear-gradient';

const { width } = Dimensions.get('window');

// Generic Shimmer Component (inspired by your shopping list ShimmerEffect)
const CustomShimmerEffect: React.FC<{ width: number | string; height: number | string; borderRadius?: number, style?: any, darkMode?: boolean }> = 
  ({ width: shimmerWidth, height: shimmerHeight, borderRadius = 0, style, darkMode = false }) => {
  // const shimmerAnimation = useRef(new Animated.Value(0)).current; // Temporarily disable animation
  
  // useEffect(() => { /* ... animation logic ... */ }, [shimmerAnimation]);
  // const translateX = shimmerAnimation.interpolate(...);

  // const baseShimmerColor = darkMode ? theme.colors.secondary.mediumDarkGray || '#374151' : '#E5E7EB';
  // const highlightShimmerColor = darkMode ? theme.colors.secondary.darkGray || '#4B5563' : '#F3F4F6';

  // DEBUG: Use a very obvious solid background
  const debugBackgroundColor = 'orange';

  return (
    <View 
      style={[
        { 
          width: shimmerWidth, 
          height: shimmerHeight, 
          borderRadius, 
          backgroundColor: debugBackgroundColor, // Apply debug color
          // overflow: 'hidden' // Keep overflow hidden to see if content would have been clipped
        },
        style
      ]}
    >
      {/* Animation and gradient temporarily removed for debugging visibility */}
      {/* <Animated.View
        style={{
          width: '200%', 
          height: '100%',
          position: 'absolute',
          transform: [{ translateX }],
          left: '-50%', 
        }}
      >
        <LinearGradient
          colors={[baseShimmerColor, highlightShimmerColor, baseShimmerColor]}
          start={{ x: 0, y: 0.5 }}
          end={{ x: 1, y: 0.5 }}
          style={{ flex: 1 }}
        />
      </Animated.View> */}
      <Text style={{color: 'white', fontSize: 8, textAlign: 'center'}}>W:{typeof shimmerWidth === 'number' ? shimmerWidth.toFixed(0) : shimmerWidth} H:{typeof shimmerHeight === 'number' ? shimmerHeight.toFixed(0) : shimmerHeight}</Text>
    </View>
  );
};

export interface ProductItem {
  id: string;
  name: string;
  imageUrl: string;
  isLoading?: boolean; // Optional loading prop for individual items
  // Add other product properties if needed, e.g., price, brand
}

export interface CategorySectionData {
  id: string;
  title: string;
  subtitle?: string;
  products: ProductItem[];
  isLoading?: boolean; // Optional: if this specific category is loading its products
}
interface ProductCarouselSectionProps {
  categories: CategorySectionData[];
  onProductPress?: (product: ProductItem) => void;
  onMorePress?: (categoryId: string) => void;
  darkMode?: boolean;
  gradientBackgroundColors?: [string, string, ...string[]]; // Ensure at least two colors for gradient
  isLoading?: boolean; // isLoading for the entire section (e.g., categories are fetching)
}

const ITEM_WIDTH = width * 0.35; // Adjust for desired item size and spacing
const ITEM_SPACING = theme.spacing.md;

const ProductItemShimmer: React.FC<{ darkMode?: boolean }> = ({ darkMode }) => {
  return (
    <View style={styles.itemContainer}>
      <CustomShimmerEffect 
        width={ITEM_WIDTH} 
        height={ITEM_WIDTH * (1 / 0.75)} // Matches aspectRatio of imageWrapper
        borderRadius={10} 
        style={{ marginBottom: theme.spacing.sm }}
        darkMode={darkMode}
      />
      <CustomShimmerEffect 
        width={ITEM_WIDTH * 0.9} 
        height={12} 
        borderRadius={4} 
        style={{ marginBottom: theme.spacing.xs }}
        darkMode={darkMode}
      />
      <CustomShimmerEffect 
        width={ITEM_WIDTH * 0.6} 
        height={12} 
        borderRadius={4} 
        darkMode={darkMode}
      />
    </View>
  );
};

const ProductCarouselItem: React.FC<{ item: ProductItem; onPress?: (product: ProductItem) => void; darkMode?: boolean }> = ({ item, onPress, darkMode }) => {
  const showShimmer = item.isLoading || !item.imageUrl
  if (showShimmer) {
    return <ProductItemShimmer darkMode={darkMode} />;
  }
  return (
    <Pressable style={styles.itemContainer} onPress={() => onPress?.(item)}>
      <View style={styles.imageWrapper}>
        <Image source={{ uri: item.imageUrl }} style={styles.productImage} contentFit="cover"  />
      </View>
      <Text style={[styles.productName, darkMode && styles.productNameDark]} numberOfLines={2}>
        {item.name}
      </Text>
    </Pressable>
  );
};

// Shimmer Placeholder for a category section title area
const CategoryHeaderShimmer: React.FC<{ darkMode?: boolean }> = ({ darkMode }) => (
  <View style={[styles.categoryHeader, { marginBottom: theme.spacing.md + theme.spacing.sm }]}> 
    <View style={styles.categoryTitleContainer}>
      <CustomShimmerEffect 
        width={'60%'} 
        height={20} 
        borderRadius={4} 
        darkMode={darkMode}
       />
    </View>
  </View>
);

const CategorySection: React.FC<{ section: CategorySectionData; onProductPress?: (product: ProductItem) => void; onMorePress?: (categoryId: string) => void; darkMode?: boolean }> = ({ section, onProductPress, onMorePress, darkMode }) => {
  const flatListRef = useRef<FlatList<ProductItem>>(null);
  const [canScrollRight, setCanScrollRight] = useState(false);
  const [currentIndex, setCurrentIndex] = useState(0);
  
  const listLayoutWidth = useRef(0);
  const listContentWidth = useRef(0);
  const initialCheckDone = useRef(false); 

  // Updated gradient colors for the arrow button background
  const arrowButtonGradientColors = ['#8B5CF6', '#EC4899', '#3B82F6'] as const;

  const updateScrollability = useCallback(() => {
    if (listLayoutWidth.current > 0 && listContentWidth.current > 0) {
      const isActuallyScrollable = listContentWidth.current > listLayoutWidth.current + 5; 
      if (isActuallyScrollable !== canScrollRight) { 
        setCanScrollRight(isActuallyScrollable);
      }
      if (!initialCheckDone.current) {
        initialCheckDone.current = true;
      }
    }
  }, [canScrollRight]);

  useEffect(() => {
    initialCheckDone.current = false;
    listLayoutWidth.current = 0;
    listContentWidth.current = 0;
    setCanScrollRight(false); 
  }, [section.products]);

  const handleScroll = (event: NativeSyntheticEvent<NativeScrollEvent>) => {
    const { contentOffset, layoutMeasurement, contentSize } = event.nativeEvent;
    if (layoutMeasurement.width === 0 && contentSize.width === 0) return; 

    listLayoutWidth.current = layoutMeasurement.width;
    listContentWidth.current = contentSize.width;

    const newCurrentIndex = Math.round(contentOffset.x / (ITEM_WIDTH + ITEM_SPACING));
    setCurrentIndex(newCurrentIndex);

    const tolerance = 5; 
    const isAtEnd = contentOffset.x >= contentSize.width - layoutMeasurement.width - tolerance;
    const newCanScrollRight = !isAtEnd && contentSize.width > layoutMeasurement.width + tolerance;
    
    if (canScrollRight !== newCanScrollRight) {
        setCanScrollRight(newCanScrollRight);
    }
  };

  const scrollToNext = () => {
    if (flatListRef.current && listLayoutWidth.current > 0) {
      const numItemsToScroll = Math.max(1, Math.floor(listLayoutWidth.current / (ITEM_WIDTH + ITEM_SPACING)) -1) || 1;
      const nextIndex = Math.min(currentIndex + numItemsToScroll, section.products.length - 1);
      
      if (nextIndex > currentIndex || (nextIndex === section.products.length -1 && currentIndex !== nextIndex )) {
        flatListRef.current.scrollToIndex({ 
          index: nextIndex, 
          animated: true,
          viewPosition: 0 
        });
      }
    }
  };

  // If the specific category is loading its products
  if (section.isLoading) {
    return (
      <View style={styles.categoryContainer}>
        <CategoryHeaderShimmer darkMode={darkMode} />
        <FlatList
          data={[{}, {}, {}]} // Use objects or unique keys for shimmer items
          renderItem={() => <ProductItemShimmer darkMode={darkMode} />}
          keyExtractor={(item, index) => `shimmer-product-${section.id}-${index}`}
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.horizontalListContent}
        />
      </View>
    );
  }

  return (
    <View style={styles.categoryContainer}>
      <View style={styles.categoryHeader}>
        <View style={styles.categoryTitleContainer}>
          <Text style={[styles.categoryTitle, darkMode && styles.categoryTitleDarkCustomColor]}>
            {section.title}
          </Text>
        </View>
        {onMorePress && (
          <Pressable style={[styles.moreButton, darkMode && styles.moreButtonDark]} onPress={() => onMorePress(section.id)}>
            <Text style={[styles.moreButtonText, darkMode && styles.moreButtonTextDark]}>More</Text>
            <ChevronRight size={16} color={darkMode ? theme.colors.secondary.lightGray : theme.colors.secondary.darkGray} />
          </Pressable>
        )}
      </View>
      <View style={styles.horizontalListContainer}> 
        <FlatList
          ref={flatListRef}
          data={section.products}
          renderItem={({ item }) => <ProductCarouselItem item={item} onPress={onProductPress} darkMode={darkMode} />}
          keyExtractor={(item) => item.id}
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.horizontalListContent}
          decelerationRate="fast"
          onScroll={handleScroll}
          scrollEventThrottle={16}
          onLayout={(event) => {
            listLayoutWidth.current = event.nativeEvent.layout.width;
            if (!initialCheckDone.current) updateScrollability();
          }}
          onContentSizeChange={(contentW, contentH) => {
            listContentWidth.current = contentW;
            if (!initialCheckDone.current || listLayoutWidth.current > 0) updateScrollability();
          }}
        />
        {canScrollRight && (
            <Pressable 
              style={styles.circularScrollArrowButton} 
              onPress={scrollToNext}
            >
              <LinearGradient
                colors={arrowButtonGradientColors}
                start={{x: 0, y: 0}} 
                end={{x: 1, y: 1}}
                style={styles.scrollArrowGradientFill} 
              >
                <View> 
                  <ChevronRight size={20} color={theme.colors.primary.white} /> 
                </View>
              </LinearGradient>
            </Pressable>
        )}
      </View>
    </View>
  );
};

const separatorGradientColors = ['#8B5CF6', '#EC4899', '#3B82F6'] as const;

// Main section shimmer placeholder
const ProductCarouselSectionShimmer: React.FC<{ darkMode?: boolean, gradientBackgroundColors?: [string, string, ...string[]] }> = ({ darkMode, gradientBackgroundColors }) => {
  const shimmerCategoryCount = 2; // Number of shimmer categories to show
  const useGradientBg = gradientBackgroundColors && gradientBackgroundColors.length >= 2;
  const bgStyle = useGradientBg ? styles.containerTransparent : (darkMode ? styles.containerDark : styles.container);

  const content = (
    <View style={bgStyle}> 
      {Array.from({ length: shimmerCategoryCount }).map((_, index) => (
        <React.Fragment key={`shimmer-cat-outer-${index}`}>
          <View style={styles.categoryContainer}>
            <CategoryHeaderShimmer darkMode={darkMode} />
            <FlatList
              data={[{}, {}, {}]} // Use objects or unique keys for shimmer items
              renderItem={() => <ProductItemShimmer darkMode={darkMode} />}
              keyExtractor={(item, idx) => `shimmer-section-item-${index}-${idx}`}
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.horizontalListContent}
            />
          </View>
          {index < shimmerCategoryCount - 1 && (
             <LinearGradient colors={separatorGradientColors} start={{ x: 0, y: 0.5 }} end={{ x: 1, y: 0.5 }} style={styles.separatorGradient} />
          )}
        </React.Fragment>
      ))}
    </View>
  );

  if (useGradientBg) {
    return (
      <LinearGradient colors={gradientBackgroundColors!} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.gradientWrapper}>
        {content}
      </LinearGradient>
    );
  }
  return content;
};

const ProductCarouselSection: React.FC<ProductCarouselSectionProps> = ({ 
  categories, 
  onProductPress, 
  onMorePress, 
  darkMode = true, // Default to true, parent will override for light page gradient
  gradientBackgroundColors,
  isLoading //isLoading prop for the whole section
}) => {
 

  if (isLoading) {
    return <ProductCarouselSectionShimmer darkMode={false} gradientBackgroundColors={gradientBackgroundColors} />;
  }

  const useGradientBackground = gradientBackgroundColors && gradientBackgroundColors.length >= 2;
  const flatListBackgroundStyle = useGradientBackground 
    ? styles.containerTransparent 
    : (darkMode ? styles.containerDark : styles.container);

  const renderSeparator = () => (
    <LinearGradient
      colors={separatorGradientColors}
      start={{ x: 0, y: 0.5 }}
      end={{ x: 1, y: 0.5 }}
      style={styles.separatorGradient}
    />
  );

  const content = (
    <FlatList
      data={categories}
      renderItem={({ item }) => <CategorySection section={item} onProductPress={onProductPress} onMorePress={onMorePress} darkMode={darkMode} />}
      keyExtractor={(item) => item.id}
      style={flatListBackgroundStyle} 
      showsVerticalScrollIndicator={false}
    //   ItemSeparatorComponent={renderSeparator}
    />
  );

  if (useGradientBackground) {
    return (
      <LinearGradient
        colors={gradientBackgroundColors!} 
        start={{ x: 0, y: 0 }} 
        end={{ x: 1, y: 1 }}
        style={styles.gradientWrapper} 
      >
        {content}
      </LinearGradient>
    );
  }
  return content; 
};

const styles = StyleSheet.create({
  gradientWrapper: { // Used when ProductCarouselSection has its OWN gradient
    flex: 1, 
  },
  container: { // Fallback for non-gradient, light mode - should be transparent if page has gradient
    flex: 1,
    backgroundColor: 'transparent', // CHANGED: Was theme.colors.background
  },
  containerDark: { // Fallback for non-gradient, dark mode
    flex: 1, 
    backgroundColor: theme.colors.secondary.veryDarkGray, 
  },
  containerTransparent: { // Used when section has its own gradient OR when it should show page gradient
    flex: 1,
    backgroundColor: 'transparent', 
  },
  categoryContainer: {
    paddingVertical: theme.spacing.lg,
    // Removed backgroundColor from here so parent gradient can be visible
  },
  categoryHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: theme.spacing.lg,
    marginBottom: theme.spacing.md,
  },
  categoryTitleContainer: { // Added container for title and subtitle
    flex: 1, // Allow title container to take available space
    marginRight: theme.spacing.sm, // Add some margin if "More" button is present
  },
  categoryTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#9D4EDD', // Default light mode text color
  },
  categoryTitleDark: { // Original dark mode style (fallback if custom color not applied)
    color: theme.colors.primary.white, 
  },
  categoryTitleDarkCustomColor: { // New style for the specific purple color in dark mode
    color: '#9D4EDD', 
    fontSize: 20, // Ensure font size and weight are consistent
    fontWeight: 'bold',
  },
  categorySubtitle: {
    fontSize: 14,
    color: theme.colors.secondary.darkGray, 
    marginTop: 2,
  },
  categorySubtitleDark: {
    color: theme.colors.secondary.lightGray, 
  },
  moreButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: theme.spacing.sm -2,
    paddingHorizontal: theme.spacing.md -2,
    borderRadius: 10,
    backgroundColor: theme.colors.secondary.lightGray, 
  },
  moreButtonDark: {
    backgroundColor: theme.colors.secondary.mediumLightGray, 
  },
  moreButtonText: {
    fontSize: 14,
    color: theme.colors.secondary.darkGray,
    marginRight: theme.spacing.xs,
  },
  moreButtonTextDark: {
    color: theme.colors.primary.white,
  },
  horizontalListContainer: {
    position: 'relative',
    // Ensure the container itself doesn't clip the absolutely positioned button
    // overflow: 'visible', // Usually not needed if parent has enough space or for direct children
  },
  horizontalListContent: {
    paddingHorizontal: theme.spacing.lg,
    paddingVertical: theme.spacing.sm,
    // Ensure there's enough padding on the right so the last item doesn't get fully hidden by an overlaying arrow
    paddingRight: ITEM_WIDTH * 0.5, // Example: padding for half an item width for the arrow area
  },
  itemContainer: {
    width: ITEM_WIDTH,
    marginRight: ITEM_SPACING,
    borderRadius: 10,
    overflow: 'hidden',
  },
  imageWrapper: {
    width: '100%',
    aspectRatio: 0.75, 
    backgroundColor: theme.colors.secondary.mediumLightGray, 
    borderRadius: 10,
    overflow: 'hidden',
    marginBottom: theme.spacing.sm,
  },
  productImage: {
    width: '100%',
    height: '100%',
  },
  productName: {
    fontSize: 14,
    color: theme.colors.text, 
    textAlign: 'left',
    paddingHorizontal: theme.spacing.xs,
  },
  productNameDark: {
    color: theme.colors.primary.white, 
  },
  separator: {
    height: 1,
    marginHorizontal: theme.spacing.lg,
  },
  separatorDark: {
    // We might not need a specific dark style if the gradient is always the same
    // Or, if the gradient needs to change for dark mode, handle it in renderSeparator
  },
  separatorGradient: {
    height: 1,
    marginHorizontal: theme.spacing.lg,
  },
  circularScrollArrowButton: {
    position: 'absolute',
    right: 0, 
    top: '40%', 
    marginTop: -10, 
    width: 50,              
    height: 50,             
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 10,             
    elevation: 3,           
    shadowColor: '#000000',   
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.22,
    shadowRadius: 2.22,
    backgroundColor: 'transparent', 
  },
  scrollArrowGradientFill: {
    width: '100%',
    height: '100%',
    borderRadius: 25,       // Half of width/height (36/2) to make the gradient circular
    justifyContent: 'center',
    alignItems: 'center',
  },
  shimmerTextBase: { // Renamed from shimmerText for clarity, used by ProductItemShimmer
    height: 12, 
    width: '90%', 
    borderRadius: 4, 
    marginBottom: theme.spacing.xs,
    // backgroundColor is set by ShimmerPlaceholder or its shimmerColors
  },
  shimmerTitleText: {
    height: 20, 
    width: '60%', 
    borderRadius: 4,
    // marginBottom: theme.spacing.xs, // Already handled by CategoryHeaderShimmer's container
    // backgroundColor is set by ShimmerPlaceholder or its shimmerColors
  },
});

export default ProductCarouselSection; 
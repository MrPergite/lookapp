import { View, StyleSheet, Text } from 'react-native';
import DiscoveryHeader from './discovery-header';
import React from 'react';
import ProductCarouselSection, { CategorySectionData, ProductItem } from '../../../../components/ProductCarouselSection';
import theme from '@/styles/theme';

interface DiscoverySectionProps {
  // Props for ProductCarouselSection
  categories: CategorySectionData[];
  onProductPress?: (product: ProductItem) => void;
  onMoreCarouselPress?: (categoryId: string) => void; // Renamed to avoid confusion if section had its own "more"
  darkMode?: boolean;
  gradientBackgroundColors?: [string, string, ...string[]];

  // Props that might still be relevant for DiscoveryHeader or overall section visibility
  discoveryOutfitForHeader?: any[]; // If header still needs some outfit context, otherwise remove
  // isParentLoading?: boolean; // If carousel has its own loading state, this might not be needed directly here
}

export default function DiscoverySection({
  categories,
  onProductPress,
  onMoreCarouselPress,
  darkMode = false, // Default to light mode to match the parent screen's gradient
  gradientBackgroundColors,
  discoveryOutfitForHeader,
}: DiscoverySectionProps) {

  // The DiscoveryHeader might still be used for a general title like "Discover More"
  // or it might need to be adapted or removed depending on the new content.
  // If discoveryOutfitForHeader is not needed, remove it from props and here.

  return (
    <View style={{flex: 1}}> 
      {/* Ensure DiscoveryHeader is always rendered if this section is shown */}
      {/* <DiscoveryHeader 
        darkMode={darkMode} 
        discoveryOutfit={[1,2,3,4,5,6,7,8,9,10]} // Pass relevant data if header needs it
      /> */}
      
      {categories && categories.length > 0 ? (
        <ProductCarouselSection 
          categories={categories}
          onProductPress={onProductPress}
          onMorePress={onMoreCarouselPress} 
          darkMode={darkMode}
          // Pass gradient to carousel only if DiscoverySection itself doesn't have one, or if desired.
          // If DiscoverySection has a gradient background, carousel might not need its own.
          // For now, let's assume the carousel might want its own distinct background or inherit.
          // If the parent ScrollView in index.tsx provides the overall page gradient,
          // then both this DiscoverySection and the ProductCarouselSection might want transparent backgrounds
          // with their content styled for that gradient.
          // Let's assume the gradient is handled by the parent for now, and these are content blocks.
          gradientBackgroundColors={gradientBackgroundColors} // This will make ProductCarouselSection render its own gradient if colors are passed
        />
      ) : (
        <View style={styles.centeredMessageContainer}>
          <Text style={styles.centeredMessageText}>
            Explore trending styles and items.
          </Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  centeredMessageContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
    minHeight: 200, // Ensure it takes some space if no categories
  },
  centeredMessageText: {
    fontSize: 16,
    color: theme.colors.secondary.darkGray, // Adjust color as per your theme
    textAlign: 'center',
  }
});

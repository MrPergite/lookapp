import React from 'react';
import { View, SafeAreaView, StyleSheet, ScrollView } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import ProductSearchResults from './product-search-results';
import theme from '@/styles/theme';

// Sample product data
const SAMPLE_PRODUCTS = [
  {
    id: '1',
    brand: 'PURE COTTON',
    name: 'Pure Cotton Blouse',
    price: '₹615.00',
    image: 'https://images.unsplash.com/photo-1564257631407-4deb1f99d988?q=80&w=1974&auto=format&fit=crop&ixlib=rb-4.0.3',
  },
  {
    id: '2',
    brand: 'TRUEBROWNSS',
    name: 'Light Pink Velvet Blouse',
    price: '₹1,829.00',
    image: 'https://images.unsplash.com/photo-1620799140408-edc6dcb6d633?q=80&w=1972&auto=format&fit=crop&ixlib=rb-4.0.3',
  },
  {
    id: '3',
    brand: 'CHLOÉ',
    name: 'Chloé Pink Top',
    price: '₹36,216.56',
    image: 'https://images.unsplash.com/photo-1559720513-da8a66563eba?q=80&w=1973&auto=format&fit=crop&ixlib=rb-4.0.3',
  },
  {
    id: '4',
    brand: 'RI RITU KUMAR',
    name: 'Pastel Pink Blouse',
    price: '₹42,000.00',
    image: 'https://images.unsplash.com/photo-1589810635657-232948472d98?q=80&w=1780&auto=format&fit=crop&ixlib=rb-4.0.3',
  },
  {
    id: '5',
    brand: 'RENE',
    name: 'RENE Women Blouse',
    price: '₹710.00',
    image: 'https://images.unsplash.com/photo-1499939667766-4afceb292d05?q=80&w=1973&auto=format&fit=crop&ixlib=rb-4.0.3',
  },
  {
    id: '6',
    brand: 'ZARA',
    name: 'Bohemian Pastel Blouse',
    price: '₹1,999.00',
    image: 'https://images.unsplash.com/photo-1485462537746-965f33f7f6a7?q=80&w=1974&auto=format&fit=crop&ixlib=rb-4.0.3',
  },
];

const ProductResultsDemo = () => {
  const handleProductPress = (product: any) => {
    console.log('Product pressed:', product);
  };

  const handleSeeMorePress = () => {
    console.log('See more pressed');
  };

  return (
    <LinearGradient
      colors={[theme.colors.primary.lavender, theme.colors.primary.periwinkle]}
      style={styles.container}
    >
      <SafeAreaView style={styles.safeArea}>
        <ScrollView contentContainerStyle={styles.scrollView}>
          <View style={styles.contentContainer}>
            <ProductSearchResults
              products={SAMPLE_PRODUCTS}
              title="Looking for a women's trendy blouse with pastel colors"
              subtitle="I'm excited to help you find a trendy women's blouse in pastel colors, get ready to discover some amazing options. Your perfect blouse is just a click away, with styles that will make your wardrobe shine."
              onProductPress={handleProductPress}
              onSeeMorePress={handleSeeMorePress}
            />
          </View>
        </ScrollView>
      </SafeAreaView>
    </LinearGradient>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  safeArea: {
    flex: 1,
  },
  scrollView: {
    flexGrow: 1,
    padding: theme.spacing.md,
  },
  contentContainer: {
    flex: 1,
    borderRadius: theme.spacing.lg,
    overflow: 'hidden',
    backgroundColor: theme.colors.primary.white,
  },
});

export default ProductResultsDemo; 
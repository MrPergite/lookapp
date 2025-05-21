import React from 'react';
import { Text, StyleSheet } from 'react-native';
import { MotiView } from 'moti';
import ProductRating from './ProductRating';
import { LinearGradient } from 'expo-linear-gradient';
import MaskedView from '@react-native-masked-view/masked-view';
// import ProductRating from '../../ProductCard/components/ProductRating';

export default function ProductDetails({ description, size, rating, reviewCount }: { description: string, size: string, rating: number, reviewCount: number }) {
  const hasDetails = !!(description || size);

  return (
    <MotiView
      from={{ opacity: 0, translateY: 20 }}
      animate={{ opacity: 1, translateY: 0 }}
      transition={{ delay: 200 }}
      style={styles.container}
    >
      {hasDetails && (
        <MaskedView
        style={{ alignItems: 'center', justifyContent: 'center' }} 

          maskElement={<Text style={[styles.title, { color: 'black' }]}>Details</Text>}
        >
          <LinearGradient
            colors={['#8B5CF6', '#EC4899', '#3B82F6']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={[styles.gradientText, { height: 30, width: '100%'}]}
          />
        </MaskedView>
      )}

      {rating && reviewCount && (
        <ProductRating rating={rating} reviewCount={reviewCount} />
      )}

      {(description || size) && (
        <Text style={styles.description}>
          {description || ""}
          {size ? `\n• Size: ${size.toUpperCase()}` : ""}
        </Text>
      )}
    </MotiView>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#F3F4F6', // bg-gray-50
    borderRadius: 12,
    padding: 16,
  },
  gradientText: {
    // flex: 1,
    height: 30,
  },
  title: {
    fontSize: 18,          // text-lg
    fontWeight: 600,     // font-medium
    color: '#111827',      // text-gray-900
    marginBottom: 8,
  },
  description: {
    fontSize: 14,          // text-sm
    color: '#4B5563',      // text-gray-600
    lineHeight: 20,  
    marginTop: 10     // leading-relaxed
  },
});

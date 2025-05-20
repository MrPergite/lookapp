import React from 'react';
import { View, Text, TouchableOpacity, ActivityIndicator, StyleSheet } from 'react-native';
import { MotiView } from 'moti';
import { responsiveFontSize } from '@/utils';
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import theme from '@/styles/theme';

interface ProductCardProps {
  id?: string;
  product: any;
  state?: string;
  isSelected?: boolean;
  onSelect: () => void;
  isLoading?: boolean;
  isDisabled?: boolean;
}

const ProductCard = ({
  id,
  product,
  state,
  isSelected,
  onSelect,
  isLoading,
  isDisabled,
}: ProductCardProps) => {
  const isHorizontal = true;

  return (
    <MotiView
      animate={{ scale: isSelected ? 0.97 : 1 }}
      transition={{ type: 'timing', duration: 200 }}
    >
      <TouchableOpacity
        className={`flex flex-col rounded-xl border border-gray-200 overflow-hidden ${
          isHorizontal ? 'w-[120px]' : 'w-full'
        } ${isSelected ? 'ring-2 ring-purple-500' : ''}`}
        activeOpacity={0.9}
        onPress={onSelect}
        disabled={isLoading || isDisabled}
        style={[
          styles.cardContainer,
          isSelected && styles.selectedCard,
          { opacity: isDisabled && !isLoading ? 0.6 : 1 }
        ]}
      >
        <View className="relative" style={styles.imageContainer}>
          {isLoading ? (
            <View
              className="flex items-center justify-center h-full w-full bg-gray-50"
              style={styles.loadingContainer}
            >
              <ActivityIndicator color={theme.colors.primary.purple} />
            </View>
          ) : (
            <>
              <Image
                source={{ uri: product?.img_url || product?.local_img || product?.resultImage }}
                transition={400}
                contentFit="cover"
                style={styles.image}
              />
              
              {/* Gradient overlay for text */}
              <LinearGradient
                colors={['transparent', 'rgba(0,0,0,0.7)']}
                style={styles.gradientOverlay}
              >
                <Text style={styles.productTitle} numberOfLines={1}>
                  {product?.title || product?.name || 'Product Name'}
                </Text>
                
                {product?.brand && (
                  <Text style={styles.productBrand} numberOfLines={1}>
                    {product.brand}
                  </Text>
                )}
              </LinearGradient>
              
              {/* Selected indicator */}
              {isSelected && (
                <View style={styles.selectedIndicator}>
                  <LinearGradient
                    colors={[theme.colors.primary.purple as string, '#ec4899']}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 0 }}
                    style={styles.selectedGradient}
                  />
                </View>
              )}
            </>
          )}
        </View>
      </TouchableOpacity>
    </MotiView>
  );
};

const styles = StyleSheet.create({
  cardContainer: {
    borderRadius: 12,
    overflow: 'hidden',
    backgroundColor: '#ffffff',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  selectedCard: {
    borderColor: theme.colors.primary.purple,
    borderWidth: 2,
  },
  imageContainer: {
    width: 120,
    height: 160,
    position: 'relative',
  },
  image: {
    width: '100%',
    height: '100%',
  },
  loadingContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: '#f9fafb',
    alignItems: 'center',
    justifyContent: 'center',
  },
  gradientOverlay: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    padding: 10,
    paddingTop: 20,
  },
  productTitle: {
    color: '#ffffff',
    fontSize: responsiveFontSize(14),
    fontWeight: '600',
    marginBottom: 2,
  },
  productBrand: {
    color: 'rgba(255, 255, 255, 0.8)',
    fontSize: responsiveFontSize(12),
    fontWeight: '500',
  },
  selectedIndicator: {
    position: 'absolute',
    top: 0,
    left: 0,
    width: '100%',
    height: 4,
    overflow: 'hidden',
  },
  selectedGradient: {
    width: '100%',
    height: '100%',
  },
});

export default ProductCard;
import React, { useRef } from 'react';
import { View, Text, ScrollView, TouchableOpacity, Pressable, StyleSheet } from 'react-native';
import { Check } from 'lucide-react-native';
import { MotiView } from 'moti';
import { Image } from 'expo-image';
type VariantType = {
  product_id: string;
  thumbnail: string;
};

type ColorTileSelectorProps = {
  selectedVariant: string;
  onSelectVariant: (id: string) => void;
  variants: VariantType[];
  selectIndex: (index: number) => void;
};

const ColorTileSelector = ({ 
  selectedVariant, 
  onSelectVariant, 
  variants, 
  selectIndex 
}: ColorTileSelectorProps) => {
  const scrollRef = useRef<ScrollView>(null);

  console.log("variants", selectedVariant,variants);
  
  return (
    variants.length > 0 ? (
      <View className="space-y-2">
        <Text className="text-sm font-medium text-gray-700 dark:text-gray-300">Variants</Text>
        <ScrollView 
          ref={scrollRef}
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={{ gap: 8, paddingBottom: 8 }}
          className="flex-row -mx-1 px-1"
          snapToInterval={64 + 8} // Width of tile (64) + gap (8)
          decelerationRate="fast"
        >
          {variants.map((variant, index) => (
            <MotiView
              key={index}
              animate={{ 
                scale: selectedVariant === variant.product_id ? 1.05 : 1 
              }}
              transition={{ type: 'timing', duration: 200 }}
              className={`${selectedVariant === variant.product_id ? 'border-purple-500' : 'border-gray-200'}`}
            >
              <TouchableOpacity
                onPress={() => {
                  onSelectVariant(variant.product_id);
                  selectIndex(index + 1);
                }}
                style={[
                  styles.imageContainer,
                  selectedVariant === variant.product_id ? styles.selected : styles.unselected
                ]}
                activeOpacity={0.7}
              >
                <Image 
                  source={{ uri: variant.thumbnail }} 
                  style={{ width: "100%", height: "100%" }}
                  contentFit='cover'
                  transition={1000}
                  contentPosition={"center"}
                />
                {selectedVariant === variant.product_id && (
                  <View className="absolute inset-0 items-center justify-center bg-black/20">
                    <Check size={16} color="white" />
                  </View>
                )}
              </TouchableOpacity>
            </MotiView>
          ))}
        </ScrollView>
      </View>
    ) : null
  );
};

const styles = StyleSheet.create({
  imageContainer: {
    position: 'relative', // same as `relative`
    width: 64,            // w-16 -> 16 * 4 = 64px
    height: 64,           // h-16 -> 64px
    borderRadius: 12,     // rounded-lg -> roughly 12px
    overflow: 'hidden',
    borderWidth: 2,
  },
  selected: {
    borderColor: '#8B5CF6', // purple-500
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 1.41,
    elevation: 2, // Android shadow
  },
  unselected: {
    borderColor: '#E5E7EB', // gray-200
  },
});

export default ColorTileSelector; 
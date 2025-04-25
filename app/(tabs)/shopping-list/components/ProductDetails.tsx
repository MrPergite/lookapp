import React from 'react';
import { MotiView } from 'moti';
import { Text, View } from 'react-native';
import ProductRating from './ProductRating';

interface IProductDetails {
    description: string;
    size: string;
    rating: number;
    reviewCount: number;
}

const ProductDetails = ({ description, size, rating, reviewCount }: IProductDetails) => {
    return (
        <MotiView
            className="bg-gray-50 dark:bg-gray-800/50 rounded-xl p-5 backdrop-blur-sm"
            from={{ opacity: 0, transform: [{ translateY: 20 }] }}
            animate={{ opacity: 1, transform: [{ translateY: 0 }] }}
            transition={{ delay: 0.2 }}
        >
            {description || size ? <Text className="text-2xl font-semibold text-gray-900 mb-3">
                Details
            </Text> : <></>}

            <View className="flex-row items-center mb-5">
                {rating && reviewCount ?
                    <View className="flex-row items-center gap-4">
                        <ProductRating rating={rating} reviewCount={reviewCount} />
                        <Text className="text-lg">
                            {reviewCount > 20 ? "20+" : reviewCount} reviews
                        </Text>
                    </View>
                    : <></>
                }
            </View>

            {size ? <Text className="text-sm text-gray-600 leading-relaxed">
                {description || ""}
                {size ? `\n• Size: ${size.toUpperCase()}` : ""}
            </Text> : description ? <Text className="text-sm text-gray-600 dark:text-gray-300 leading-relaxed">
                {description}
            </Text> : <></>}
        </MotiView>
    );
};

export default ProductDetails;
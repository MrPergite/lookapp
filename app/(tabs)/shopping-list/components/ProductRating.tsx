import React from 'react';
import Star from '@/common/icons/Star';
import { View } from 'react-native';
import { Text } from 'react-native';
interface IProductRating {
    rating: number;
    reviewCount: number;
}

const ProductRating = ({ rating, reviewCount }: IProductRating) => {
    return (
        reviewCount && (
            <View className="flex items-center space-x-2 relative bottom-5">
                <View className="flex items-center space-x-0.5">
                    {[...Array(5)].map((_, index) => {
                        // Calculate full and fractional stars
                        const starValue = index + 1; // 1-indexed
                        let starFillPercentage = 0;
                        const isFull = starValue <= Math.floor(rating);
                        if (isFull) {
                            starFillPercentage = 100;
                        }
                        // Full star condition
                        const isHalf = starValue === Math.ceil(rating) && rating % 1 !== 0; // Half star condition
                        if (isHalf) {
                            starFillPercentage = 50;
                        }
                        const isEmpty = !isFull && !isHalf; // Empty star condition

                        // For fractional stars (e.g., 4.3, 4.7), calculate the fill percentage

                        if (rating % 1 !== 0 && starValue === Math.ceil(rating)) {
                            starFillPercentage = (rating % 1) * 100; // Percentage of the last star to fill
                        }

                        return (
                            <Star
                                key={index}
                                className={`w-4 h-4 ${isFull
                                        ? 'text-yellow-400 fill-yellow-400'
                                        : isEmpty
                                            ? 'text-gray-300'
                                            : 'text-yellow-400' // For fractional stars
                                    }`}
                                fillPercentage={starFillPercentage} // Pass the fill percentage to handle fractional fill
                            />
                        );
                    })}
                </View>
                <Text className="text-sm text-white">
                    {reviewCount > 20 ? "20+" : reviewCount} reviews
                </Text>
            </View>
        )
    );
};


export default ProductRating;
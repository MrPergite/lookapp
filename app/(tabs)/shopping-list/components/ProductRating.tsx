import Star from '@/common/icons/Star';
import React from 'react';
import { View } from 'react-native';

interface IProductRating {
    rating: number;
    reviewCount: number;
}

const ProductRating = ({ rating }: IProductRating) => {
    return (
        <View className="flex-row">
            {[...Array(5)].map((_, index) => {
                const starValue = index + 1; // 1-indexed
                const isFull = starValue <= Math.floor(rating);
                const isHalf = starValue === Math.ceil(rating) && rating % 1 !== 0;
                const isEmpty = !isFull && !isHalf;

                // Determine fill and stroke colors based on star type
                let fill = "transparent";
                let stroke = "#d1d5db"; // gray-300

                if (isFull) {
                    fill = "#FFDE00"; // bright yellow
                    stroke = "#FFDE00"; // bright yellow
                } else if (isHalf) {
                    fill = "#FFDE00"; // We'll set opacity to handle half-filled stars
                    stroke = "#FFDE00";
                } else {
                    fill = "transparent";
                    stroke = "#d1d5db"; // gray-300
                }

                return (
                    <Star
                        key={index}
                        size={24}
                        fillPercentage={isHalf ? 50 : isFull ? 100 : 0}
                    />
                );
            })}
        </View>
    );
};

export default ProductRating;
import React from 'react';
import { motion } from 'framer-motion';
import { MotiView } from 'moti';
import { Text } from 'react-native';

interface IProductDetails {
    description: string;
    size: string;
}

const ProductDetails = ({ description, size }: IProductDetails) => {
    return (
        <MotiView
            className="bg-gray-50 dark:bg-gray-800/50 rounded-xl p-4 backdrop-blur-sm"
            from={{ opacity: 0, transform: [{ translateY: 20 }] }}
            animate={{ opacity: 1, transform: [{ translateY: 0 }] }}
            transition={{ delay: 0.2 }}
        >
            {description || size ? <h4 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-2">
                Details
            </h4> : <></>}

            {size ? <Text className="text-sm text-gray-600 dark:text-gray-300 leading-relaxed">
                {description || ""}
                {size ? `\n• Size: ${size.toUpperCase()}` : ""}
            </Text> : description ? <Text className="text-sm text-gray-600 dark:text-gray-300 leading-relaxed">
                {description}
            </Text> : <></>}
        </MotiView>
    );
};

export default ProductDetails;
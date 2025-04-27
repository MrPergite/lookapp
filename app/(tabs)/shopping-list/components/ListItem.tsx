import React, { useState, useEffect } from "react";
import {
    Bell,
    BarChart3,
    Tag,
    MessageSquare,
    ChevronDown,
    Trash,
    ShoppingCart,
    User,
    Loader2,
    ChevronUp,
    BarChart2,
} from "lucide-react-native";
import FeatureDescriptionPopup from "./FeatureDescriptionPopup";
import ImageSlider from "./ImageSlider";
import { Linking, TouchableOpacity } from "react-native";
import { router } from "expo-router";
import { MotiView } from "moti";
import { LinearTransition } from "react-native-reanimated";
import { View } from "react-native";
import { Text } from "react-native";
import { MotiPressable } from "moti/interactions";
import { StyleSheet } from "react-native";
import { responsiveFontSize } from "@/utils";
import { LinearGradient } from "expo-linear-gradient";
import ProductDetails from "./ProductDetails";

interface IListItem {
    item: any;
    onRemove: (id: string, productLink: string) => void;
    isDeleting: boolean;
}

const ListItem = ({ item, onRemove, isDeleting }: IListItem) => {
    const [isExpanded, setIsExpanded] = useState(false);
    const [activeFeature, setActiveFeature] = useState<string | null>(null);

    const handleBuyNow = async () => {
        await Linking.openURL(item.product_link)
    };


    const closeFeaturePopup = () => {
        setActiveFeature(null);
    };

    const renderPrice = () => {
        if (item.old_price) {
            const originalPrice = parseFloat(item.old_price.replace(/[^0-9.]/g, ""));
            const discountedPrice = parseFloat(item.product_price.replace(/[^0-9.]/g, ""));
            const discountPercentage = (
                ((originalPrice - discountedPrice) / originalPrice) *
                100
            ).toFixed(0);

            return (
                <View className="flex flex-col items-start">
                    <View className="flex items-center gap-2">
                        {item?.product_price ?
                            <Text className="text-sm font-semibold text-white">
                                {item.product_price}
                            </Text> : <></>}
                        <Text className="text-[10px] text-white/70 line-through">
                            {item.old_price}
                        </Text>
                    </View>
                    <Text className="text-[8px] px-1.5 py-0.5 bg-red-500/90 rounded-full text-white mt-0.5">
                        {discountPercentage}% OFF
                    </Text>
                </View>
            );
        }

        return item?.product_price ? (
            <Text className="text-sm font-semibold text-white">{item.product_price}</Text>
        ) : null;
    };

    const handleTryNow = () => {
        router.push("/(tabs)/virtual-tryon");
    };


    return (
        <MotiView
            layout={LinearTransition}
            className="group relative bg-white dark:bg-gray-900/50 backdrop-blur-sm rounded-xl shadow-md overflow-hidden lg:hover:shadow-lg lg:transition-shadow border border-gray-200 dark:border-gray-800 z-10"
            from={{ opacity: 0, translateY: 20 }}
            animate={{ opacity: 1, translateY: 0 }}
            transition={{ duration: 0.3, delay: 0.1 }}
            key={item.id}
        >

            <View key={item.id} className="borde border-gray-200 rounded-xl overflow-hidden mb-4">
                <View>
                    {/* Product Image Container */}
                    <View style={{ width: '100%', aspectRatio: 1 / 1.3, position: 'relative' }}>
                        <ImageSlider
                            images={
                                item?.img_urls_list || [item?.img_url]
                            }
                            productTitle={item.title}
                        />

                        {/* Fixed overlay at the bottom with gradient */}
                        <LinearGradient
                            className="absolute inset-0"
                            colors={['rgba(0,0,0,0.6)', 'rgba(0,0,0,0.4)', 'transparent']}
                            start={{ x: 0.5, y: 1 }}
                            end={{ x: 0.5, y: 0 }}

                            style={{
                                position: 'absolute',
                                left: 0,
                                right: 0,
                                bottom: 0,
                                paddingHorizontal: 16,
                                paddingTop: 50,
                                paddingBottom: 16,
                                zIndex: 9999,
                                elevation: 10  // For Android
                            }}
                        >
                            <Text style={{
                                color: 'rgba(255,255,255,0.75)',
                                fontSize: 10,
                                textTransform: 'uppercase',
                                fontWeight: '600',
                                letterSpacing: 0.5,
                                marginBottom: 3
                            }}
                            >
                                {item?.brand}
                            </Text>
                            <Text style={{
                                color: 'white',
                                fontSize: 16,
                                fontWeight: '600',
                                marginBottom: 2
                            }}
                                numberOfLines={1}
                                ellipsizeMode="tail">
                                {item?.title}
                            </Text>
                            {renderPrice()}
                        </LinearGradient>

                        {/* Delete button */}
                        <TouchableOpacity
                            style={{
                                position: 'absolute',
                                top: 8,
                                right: 8,
                                width: 36,
                                height: 36,
                                borderRadius: 18,
                                backgroundColor: 'white',
                                alignItems: 'center',
                                justifyContent: 'center',
                                elevation: 4,
                                shadowColor: '#000',
                                shadowOffset: { width: 0, height: 2 },
                                shadowOpacity: 0.2,
                                shadowRadius: 3,
                                zIndex: 9999,
                            }}
                            onPress={() => onRemove(item.id, item?.product_link)}
                            disabled={isDeleting}
                        >
                            {isDeleting ? (
                                <View className="animate-spin">
                                    <Loader2 size={18} color="#FF4747" />
                                </View>
                            ) : (
                                <Trash size={18} color="#FF4747" />
                            )}
                        </TouchableOpacity>
                    </View>
                </View>
                <View style={styles.seperator} className="absolute inset-0 bg-white dark:bg-gray-900" />
                {/* Action Buttons */}
                <View key={item.id} className="p-2 flex justify-between items-center gap-1.5">
                    <View className='flex flex-row gap-1.5 flex-1 w-full' >
                        <MotiPressable
                            containerStyle={styles.actionButtonContainer}
                            onPress={handleBuyNow}
                        >
                            <LinearGradient
                                style={styles.buyButton}
                                colors={['#9b87f5', '#7E69AB']}
                                start={[0, 0]}
                                end={[1, 0]}
                            >
                                <ShoppingCart size={18} color="white" />
                                <Text className="text-white font-medium ml-1">Buy</Text>
                            </LinearGradient>
                        </MotiPressable>

                        <TouchableOpacity
                            onPress={handleTryNow}
                            className='flex-1 rounded-xl bg-purple-100 dark:bg-purple-900/20 text-[#7E69AB] font-medium shadow-lg hover:shadow-xl transition-all duration-300 flex items-center justify-center gap-1.5'
                            style={styles.secondaryButton}>
                            <User size={18} color="#7E69AB" />
                            <Text className="font-medium ml-1 text-[#7E69AB]">Try</Text>
                        </TouchableOpacity>

                        <TouchableOpacity
                            onPress={() => setIsExpanded(!isExpanded)}
                            className='flex-row gap-1.5 justify-center items-center px-2'
                            style={styles.actionButtonContainer}>
                            <View
                                style={styles.secondaryButton}
                            >
                                <Text className="text-[#7E69AB] font-medium">See more</Text>
                            </View>
                            {isExpanded ? <ChevronUp size={18} color="#000" className="ml-1" /> : <ChevronDown size={18} color="#000" className="ml-1" />}
                        </TouchableOpacity>

                    </View>
                </View>

                {/* Additional Options (Expanded View) */}
                {isExpanded && (
                    <View className="px-3 pb-3">
                        <ProductDetails
                            description={item.description}
                            size={item.size}
                            rating={item.rating}
                            reviewCount={item.review_count}
                        />
                    </View>
                )}
            </View>
            <FeatureDescriptionPopup
                isOpen={activeFeature !== null}
                onClose={closeFeaturePopup}
                title={
                    activeFeature === "priceAlert"
                        ? "Set Price Alert"
                        : activeFeature === "priceHistory"
                            ? "See Price History"
                            : activeFeature === "findDeals"
                                ? "Find Discount Codes"
                                : activeFeature === "reviews"
                                    ? "Summarize Reviews"
                                    : ""
                }
                description="Feature description coming soon..."
                icon={
                    activeFeature === "priceAlert"
                        ? Bell
                        : activeFeature === "priceHistory"
                            ? BarChart3
                            : activeFeature === "findDeals"
                                ? Tag
                                : activeFeature === "reviews"
                                    ? MessageSquare
                                    : null
                }
            />
        </MotiView>
    );
};

const styles = StyleSheet.create({
    buyButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingHorizontal: responsiveFontSize(12),
        paddingVertical: responsiveFontSize(8),
        borderRadius: 12,
        flex: 1,
        width: '100%',
    },
    shadow: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.2,
        shadowRadius: 6,
        elevation: 6,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        borderRadius: 16,
        gap: 6,
    },
    actionButtonContainer: {
        flex: 1,
        borderRadius: 12,
        overflow: 'hidden',
    },
    secondaryButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingHorizontal: responsiveFontSize(12),
        paddingVertical: responsiveFontSize(8),
        borderRadius: 12,
        backgroundColor: '#F3F0FE',
        position: 'relative',
        height: '100%',
        overflow: 'hidden',
    },
    seperator: {
        position: 'relative',
        top: 0,
        bottom: 0,
        left: 0,
        right: 0,
        backgroundColor: '#E5E7EB',
        height: 1
    }
});

export default ListItem;
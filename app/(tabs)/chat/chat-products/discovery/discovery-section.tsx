import { FlatList, ActivityIndicator, View, StyleSheet,Text } from 'react-native';
import DiscoveryHeader from './discovery-header';
import OutfitCard from './outfit-card';
import React from 'react';
export default function DiscoveryList({
    discoveryOutfits,
    hasMore,
    isLoadingMore,
    loadMoreItems,
}: {
    discoveryOutfits: any[];
    hasMore: boolean;
    isLoadingMore: boolean;
    loadMoreItems: () => void;
}) {
    console.log("discoveryOutfits",discoveryOutfits)
    return (
        <View>
            <DiscoveryHeader darkMode={false} discoveryOutfit={discoveryOutfits} />

        <FlatList
            data={discoveryOutfits}
            // keyExtractor={(item) => item.id}
            // key="discovery-flatlist-2cols"
            numColumns={2}
            columnWrapperStyle={styles.row}
            renderItem={({ item, index }) => (
              <View style={styles.cardWrapper}>
                <OutfitCard key={index}
                    darkMode={false}
                    comingSoon={false}
                    resultImage={item.outfit_img_url}
                    isMobile={false}
                    outfitItems={item.shopping_results.map((item: any) => ({
                        name: item.title,
                        image: item.img_url,
                        price: item.price,
                        brand: item.brand,
                        link: item.link,
                        product_id: item.product_id
                    }))}
                    outfitName={item.outfit_title}
                    outfitPrice={item.price} />
              </View>
            )}
            contentContainerStyle={styles.list}
            onEndReached={() => {
                if (hasMore && !isLoadingMore) {
                    loadMoreItems();
                }
            }}
            onEndReachedThreshold={0.5}
            ListFooterComponent={
                hasMore ? <ActivityIndicator style={styles.loader} /> : null
            }
        />
        {/* <Text>hello</Text> */}
        </View>
    );
}

const styles = StyleSheet.create({
    list: {
        padding: 16,
    },
    row: {
        justifyContent: 'space-between',
        marginBottom: 16,
    },
    cardWrapper: {
        width: '48%',
    },
    loader: {
        marginVertical: 20,
    },
});

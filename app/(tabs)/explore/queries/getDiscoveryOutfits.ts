import Toast from "react-native-toast-message";

export const getDiscoveryOutfits = async ( callPublicEndpoint: any, { pageNumber ,pageSize, gender }: { pageNumber: number, pageSize: number, gender: string }) => {
    try {
        const payload = {
            pagination: {
                page_size: pageSize,
                page_number: pageNumber,
            },
            gender: gender
        };

        // Use the passed fetch function
        const response = await callPublicEndpoint('getDiscoveryOutfits', { method: 'POST',data:payload });
console.log("response",response)


        return {
            discoveryOutfits: response.items || [],
            totalItems: response.total_items || 0,
        };

    } catch (error) {
        console.error('Error fetching discovery outfits:', error);
        Toast.show({
            type: "error",
            text1: "Search Error",
            text2: 'Failed to load your discovery outfits',
          });
        return { discoveryOutfits: [], totalItems: 0 };
    }
};
// Utility functions for handling product data

/**
 * Extracts and formats image URL from product data
 * Handles different field names and ensures URL format is correct
 */
export const extractImageUrl = (item: any): string => {
    // Try to extract from various common image URL field names
    let imageUrl = '';

    if (item.img_url) {
        imageUrl = item.img_url;
    } else if (item.image) {
        imageUrl = item.image;
    } else if (item.imageUrl) {
        imageUrl = item.imageUrl;
    } else if (item.thumbnail) {
        imageUrl = item.thumbnail;
    } else if (item.thumbnailUrl) {
        imageUrl = item.thumbnailUrl;
    }

    // Return empty string if no image URL found
    if (!imageUrl) {
        return '';
    }

    // Fix protocol if needed
    if (imageUrl.startsWith('//')) {
        // URL starts with //example.com format, add https:
        imageUrl = 'https:' + imageUrl;
    } else if (!imageUrl.startsWith('http://') && !imageUrl.startsWith('https://')) {
        // URL doesn't have protocol, add https://
        imageUrl = 'https://' + imageUrl;
    }

    return imageUrl;
};
interface Product {
    id: string;
    name: string;
    price: string;
    image: string;
    url?: string;
}
export const transformShoppingList = (shoppingList: any) => {
    return shoppingList.map((item: any) => {
        const product_info = {
            id: item.product_id,
            title: item.title,
            name: item.name || item.title,
            price: item.price,
            image: item.thumbnail,
            isSaved: item.isSaved,
            product_info: item.product_info,
            product_id: item.product_id,
            url: item.link,
            ...(item.brand && { brand: item.brand }),
        }
        return {
            ...product_info,
            product_info
        };
    });
};

export function getImageSource(src: string): string {
    const networkPattern = /^https?:\/\//i;
    console.log("src", src);
    if (networkPattern.test(src)) {
        console.log("Base64 image source:", src);
        return src;

    }
    return "data:image/jpeg;base64," + src;;
}

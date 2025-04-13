import { Product } from "../context";

export const getSaveToShoppingListPayload = ({ products, productId, fetchedProductInfo }: { products: Product[], productId: string, fetchedProductInfo: boolean }) => {
    const product = products.find(p => p.id === productId);

    if (!product) {
        console.error("Product not found for id:", productId);
        return;
    }

    console.log("Product:", product);

    // Format payload according to required structure
    const payload = {
        data: {
            product_id: productId,
            source: "chat"
        },
        metadata: {
            title: product.name,
            // You may need to determine this dynamically
            product_link: product.url || "",
            img_url: product.image,
            product_price: product.price,
            ...(product?.product_info?.isTopWear && { is_topwear: true }),
            ...(product?.brand && { brand: product.brand })
        },
        info: {
            fetchedProductInfo
        }
    };
    return payload;
}



const convertBlobToBase64 = (blob: Blob) => new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = reject;
    reader.onload = () => {
        resolve(reader.result);
    };
    reader.readAsDataURL(blob);
});

export const convertImageToBase64 = async (imageUri: string) => {
    const response = await fetch(imageUri);
    const blob = await response.blob();
    return await convertBlobToBase64(blob) as string;
}
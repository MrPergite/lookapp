import { useState } from "react";
import { useProtectedMutation } from "../hooks/query";
import { Toast } from "react-native-toast-message/lib/src/Toast";
import { getSaveToShoppingListPayload } from "../utils";
import { Product } from "../context";
import { ProductDetails, ProductDetailsResponse } from "../types";
export const useGetProductDetails = () => {
    const [productDetails, setProductDetails] = useState<ProductDetailsResponse["colors"][0] | null>(null);
    const [productItem, setProductItem] = useState<Product | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [isError, setError] = useState<boolean>(false);
    const { mutate: getProductDetails } = useProtectedMutation("getProductDetails", {
        onSuccess: (data: ProductDetailsResponse, payload: any) => {
            // Update local state for immediate UI feedback
            console.log("data", data, payload);
            setProductDetails({ ...data.colors[0], ...productItem });
            setIsLoading(false);
        },
        onError: (error, payload: any) => {
            console.error("Error saving to shopping list:", error);
            setIsLoading(false);
            setError(true);
            Toast.show({
                type: 'error',
                text1: 'Failed to load product details',
            });
        }
    });

    const getProductDetailsFromId = (product: Product) => {
        setIsLoading(true);
        setError(false);
        setProductItem({ ...product });
        getProductDetails({ product_id: product.id });
    }
    const closeProductDetails = () => {
        setProductDetails(null);
        setProductItem(null);
        setError(false);
    }
    

    return {
        getProductDetails,
        productDetails,
        getProductDetailsFromId,
        closeProductDetails,
        isLoading,
        isError
    } as const;
}
import { useState } from "react";
import { useProtectedMutation } from "../hooks/query";
import { Toast } from "react-native-toast-message/lib/src/Toast";
import { getSaveToShoppingListPayload } from "../utils";
import { Product, useChatProducts } from "../context";
import { useAuth } from "@clerk/clerk-expo";

export const useSaveShoppingList = (openLoginModal: () => void) => {
    const [savedProducts, setSavedProducts] = useState<Record<string, boolean>>({});
    const [savingProducts, setSavingProducts] = useState<Record<string, boolean>>({});
    const [saveSuccess, setSaveSuccess] = useState<Record<string, boolean>>({});
    const [saveError, setSaveError] = useState<Record<string, boolean>>({});
    const { isSignedIn } = useAuth();
    const { conversationGroups } = useChatProducts();
    const allProducts = conversationGroups.flatMap(group => group.products);
    const { mutate: saveToShoppingList, isPending } = useProtectedMutation("saveShoppingList", {
        onSuccess: (data, payload: any) => {
            // Update local state for immediate UI feedback

            // Show success animation
            if (payload?.data?.product_id) {
                const productId = payload.data.product_id;

                // Mark saving as complete
                setSavingProducts(prev => ({
                    ...prev,
                    [productId]: false
                }));

                // Show success state
                setSaveSuccess(prev => ({
                    ...prev,
                    [productId]: true
                }));

                // Update saved state
                setSavedProducts(prev => ({
                    ...prev,
                    [productId]: !prev[productId]
                }));
                console.log("payload.data", payload.metadata.title);
                Toast.show({
                    type: 'success',
                    text1: 'Added to shopping list',
                    text2: payload.metadata.title,
                });
            }
        },
        onError: (error, payload: any) => {
            console.error("Error saving to shopping list:", error);

            if (payload?.data?.product_id) {
                const productId = payload.data.product_id;

                // Mark saving as complete
                setSavingProducts(prev => ({
                    ...prev,
                    [productId]: false
                }));

                // Show error state
                setSaveError(prev => ({
                    ...prev,
                    [productId]: true
                }));

                // Reset error state after delay
                setTimeout(() => {
                    setSaveError(prev => ({
                        ...prev,
                        [productId]: false
                    }));
                }, 2000);
            }

            Toast.show({
                type: 'error',
                text1: 'Failed to add product',
            });
        }
    });
    const saveShoppingItem = ({ products, productId, fetchedProductInfo = true }: { products: Product[], productId: string, fetchedProductInfo: boolean }) => {
        console.log("saveShoppingItem", allProducts, productId, fetchedProductInfo)
        if (!isSignedIn) {
            openLoginModal();
            return;
        }
        // Set loading state
        setSavingProducts(prev => ({
            ...prev,
            [productId]: true
        }));

        // Reset any previous success/error states
        setSaveSuccess(prev => ({
            ...prev,
            [productId]: false
        }));

        setSaveError(prev => ({
            ...prev,
            [productId]: false
        }));
        saveToShoppingList(getSaveToShoppingListPayload({ products: allProducts, productId, fetchedProductInfo }));
    }
    return {
        savedProducts,
        savingProducts,
        saveSuccess,
        saveError,
        saveShoppingItem,
        isPending
    } as const;
}
import { useState, useEffect, useRef } from 'react';
import useShoppingAPI from './useShoppingAPI';
import Toast from 'react-native-toast-message';
import { useAuth } from '@clerk/clerk-react';

export const useShoppingList = (isSignedIn = false, refreshListTrigger = 0) => {
    const { getToken } = useAuth();
    const { fetch, mutate, isLoading: isLoadingShoppingList, error: errorShoppingList } = useShoppingAPI();
    const [items, setItems] = useState([]); // State to store shopping list items
    const [isLoading, setIsLoading] = useState(true); // Loading state
    const [error, setError] = useState(null); // Error state

    const hasFetched = useRef(false); // Flag to track whether data has been fetched already

    // Fetch shopping list when the user is signed in
    useEffect(() => {
        // If not signed in, skip fetching
        if (!isSignedIn) {
            setItems([]);
            setIsLoading(false);
            return;
        }

        const fetchList = async (showLoading = true) => {
            try {
                if (showLoading) {
                    setIsLoading(true);
                }

                const data = fetch.shoppingList;
                data.sort((a, b) => new Date(+b.id) - new Date(+a.id));

                setItems(data);

                if (showLoading) {
                    setIsLoading(false);
                }

                hasFetched.current = true; // Mark as fetched
            } catch (err) {

                setError(err.message || 'Error fetching shopping list');
                if (showLoading) setIsLoading(false);
            }
        };

        // Initial fetch with loading indicator
        if (!hasFetched.current) {
            fetchList(true);
        }
    }, [isSignedIn, fetch.shoppingList]); // Runs when `isSignedIn` or `getToken` changes

    // Handle background refresh when refreshListTrigger changes
    useEffect(() => {
        // Skip the initial render and only respond to changes
        if (refreshListTrigger > 0 && isSignedIn) {
            // Refresh without showing loading state
            const backgroundRefresh = async () => {
                try {
                    const token = await getToken();
                    if (!token) return;

                    if (!fetch.shoppingList) return;

                    const data = await fetch.shoppingList;
                    data.sort((a, b) => new Date(+b.id) - new Date(+a.id));
                    setItems(data);

                } catch (err) {

                    // Silent failure for background refresh - don't update error state
                    console.error("Background refresh failed:", err);
                }
            };

            backgroundRefresh();
        }
    }, [refreshListTrigger, isSignedIn, getToken]);

    // Function to add an item to the shopping list
    const addItem = async (item: any) => {
        try {
            const token = await getToken();
            const response = await addToShoppingList({ item }, token);
            if (response.message === 'Product added to shopping list') {
                setItems((prevItems) => [...prevItems, item]); // Update local state
                Toast.show({
                    type: 'success',
                    text1: 'Item added to Shopping List',
                });
            } else if (response.error === 'Product already exists in your Shopping List') {
                Toast.show({
                    type: 'error',
                    text1: 'Product already exists in shopping list',
                });
            } else {
                throw new Error(response.error || 'Failed to add item');
            }
        } catch (err: unknown) {
            Toast.show({
                type: 'error',
                text1: (err as Error).message || 'Error adding item to shopping list',
            });
        }
    };

    // Function to remove an item from the shopping list
    const removeItem = async (id: string, link: string) => {
        try {
            const token = await getToken();
            const response = await removeFromShoppingList(id, token);
            if (response.message === 'Product removed from shopping list') {
                // Update local state by removing the item
                setItems((prevItems) => prevItems.filter((item) => item.id !== id));

                // Retrieve savedProducts from localStorage (which is an object)
                const savedProducts = JSON.parse(localStorage.getItem('savedProducts')) || {};

                // Check if the link exists in savedProducts, then delete it
                if (savedProducts[link]) {
                    delete savedProducts[link]; // Remove the product from the savedProducts object
                }

                // Save the updated object back to localStorage
                localStorage.setItem('savedProducts', JSON.stringify(savedProducts));

                Toast.show({
                    type: 'success',
                    text1: 'Item removed from shopping list',
                });
            } else {
                throw new Error(response.error || 'Failed to remove item');
            }
        } catch (err: Error) {

            Toast.show({
                type: 'error',
                text1: err.message || 'Error removing item from shopping list',
            });
        }
    };

    // Check if an item is already in the shopping list
    const isInShoppingList = (itemId: string) => {
        return items.some((item) => item.id === itemId);
    };

    return {
        items,
        isLoading,
        error,
        addItem,
        removeItem,
        isInShoppingList,
        isLoadingShoppingList,
        errorShoppingList
    };
};
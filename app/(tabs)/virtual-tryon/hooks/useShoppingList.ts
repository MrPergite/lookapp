import { useState, useEffect, useRef, useCallback } from 'react';
import useShoppingAPI from './useShoppingAPI';
import Toast from 'react-native-toast-message';
import { useAuth } from '@clerk/clerk-react';
import { useFocusEffect } from 'expo-router';

export const useShoppingList = (isSignedIn = false, refreshListTrigger = 0) => {
    const { getToken } = useAuth();
    const { fetch, mutate, isLoading: isLoadingShoppingList, error: errorShoppingList, data, variables, refetch } = useShoppingAPI();
    const [items, setItems] = useState([]); // State to store shopping list items
    const [isLoading, setIsLoading] = useState(true); // Loading state
    const [error, setError] = useState<string | null>(null); // Error state


    useFocusEffect(
        useCallback(() => {
            if (!isSignedIn) {
                setIsLoading(false);
                return
            }
            setIsLoading(true);
            refetch.refetchShoppingList();
        }, [])
    );

    useEffect(() => {
        if (data.removeFromShoppingListData) {
            if (data?.removeFromShoppingListData?.status === 200) {
                // Update local state by removing the item
                setItems((prevItems) => prevItems.filter((item: any) => item.id !== variables.removeFromShoppingListVariables?.product_id));
                Toast.show({
                    type: 'success',
                    text1: 'Item removed from shopping list',
                });
            } else {
                throw new Error(data.removeFromShoppingListData.error || 'Failed to remove item');
            }
            setIsLoading(false);
        }
    }, [data.removeFromShoppingListData]);

    // Fetch shopping list when the user is signed in
    useEffect(() => {
        // If not signed in, skip fetching
        if (!isSignedIn) {
            setIsLoading(false);
            setItems([]);
            return;
        }

        const fetchList = async (showLoading = true) => {
            try {

                if (!fetch.shoppingList?.length) {
                    return;
                }

                const data = fetch.shoppingList;
                data.sort((a, b) => new Date(+b.id) - new Date(+a.id));

                setItems([...data]);


                // hasFetched.current = true; // Mark as fetched
            } catch (err: unknown) {

                setError((err as Error).message || 'Error fetching shopping list');
            }
        };

        // Initial fetch with loading indicator
        fetchList(true);
        setIsLoading(false);

    }, [isSignedIn, fetch.shoppingList]); // Runs when `isSignedIn` or `getToken` changes

    // Handle background refresh when refreshListTrigger changes
    useEffect(() => {
        // Skip the initial render and only respond to changes
        if (refreshListTrigger > 0 && isSignedIn) {
            // Refresh without showing loading state
            const backgroundRefresh = () => {
                refetch.refetchShoppingList();
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
            mutate.removeFromShoppingListMutation({ product_id: id });

        } catch (err: unknown) {
            Toast.show({
                type: 'error',
                text1: (err as Error).message || 'Error removing item from shopping list',
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
        isLoadingShoppingList: { ...isLoadingShoppingList, shoppingListLoading: isLoading || isLoadingShoppingList.shoppingListLoading },
        errorShoppingList
    };
};
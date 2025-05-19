import { useAuth } from '@clerk/clerk-expo';
import { useQuery, useMutation } from '@tanstack/react-query'
import axios from 'axios';
import React from 'react'
import Constants from 'expo-constants';
import { useApi } from '@/client-api';

const baseUrl = Constants.expoConfig?.extra?.origin || "http://localhost:8081";

function useShoppingAPI(setIsLoading: React.Dispatch<React.SetStateAction<boolean>>) {
    const { getToken, isSignedIn } = useAuth();
    const { callProtectedEndpoint } = useApi();
    const { data: shoppingList, error: shoppingListError, isLoading: shoppingListLoading, refetch: refetchShoppingList } = useQuery({
        queryKey: ['shoppingList'],
        queryFn: async () => {
            try {
                const token = await getToken();
                if (!token || !isSignedIn) return null;
                const response = await axios.get(`${baseUrl}/api/shoppingList/shoppingListNew`, {
                    headers: {
                        Authorization: `Bearer ${token}`
                    }
                });
                setIsLoading(false);
                return response.data;
            } catch (error) {
                console.error('Error fetching shopping list:', error);
                return null;
            }
        },
        refetchOnWindowFocus: true,
        enabled: false,
        networkMode: 'online',
        staleTime: 0,            // mark data as immediately stale
        refetchOnMount: true,    // refetch every time the component mounts
        refetchOnReconnect: true,
    })

    const addToShoppingList = async ({ product_id, metadata }: { product_id: string, metadata: any }) => {
        try {
            const token = await getToken();
            if (!token) return;
            const response = await axios.post(`${process.env.EXPO_PUBLIC_API_BASE_URL}/users/shoppingListNew`, {
                product_id: product_id,
                metadata: metadata
            }, {
                headers: {
                    Authorization: `Bearer ${token}`
                }
            });
            return response.data;
        } catch (error) {
            console.error('Error adding to shopping list:', error);
            throw error;
        }
    }

    const removeFromShoppingList = async ({ product_id }: { product_id: string }) => {
        try {
            const token = await getToken();
            if (!token) return;
            const response = await axios.delete(`${baseUrl}/api/shoppingList/shoppingListNew`, {
                headers: {
                    Authorization: `Bearer ${token}`
                },
                data: { product_id }
            })
            return response.data;
        } catch (error) {
            console.error('Error removing from shopping list:', error);
            throw error;
        }
    }

    const { mutateAsync: addToShoppingListMutation, isPending: addToShoppingListLoading, error: addToShoppingListError } = useMutation({
        mutationFn: (params: { product_id: string, metadata: any }) => addToShoppingList(params)
    })

    const { mutate: removeFromShoppingListMutation, isPending: removeShoppingListLoading, error: removeFromShoppingListError, data: removeFromShoppingListData, variables: removeFromShoppingListVariables, } = useMutation({
        mutationFn: (params: { product_id: string }) => removeFromShoppingList(params)
    })

    return {
        fetch: {
            shoppingList,
        },
        mutate: {
            addToShoppingListMutation,
            addToShoppingListLoading,
            removeFromShoppingListMutation,
            removeShoppingListLoading
        },
        isLoading: {
            addToShoppingListLoading,
            removeShoppingListLoading,
            shoppingListLoading
        },
        error: {
            shoppingListError,
            addToShoppingListError,
            removeFromShoppingListError
        },
        data: {
            removeFromShoppingListData
        },
        variables: {
            removeFromShoppingListVariables
        },
        refetch: {
            refetchShoppingList
        }
    } as const
}

export default useShoppingAPI

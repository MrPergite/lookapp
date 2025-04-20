import { useAuth } from '@clerk/clerk-expo';
import { useQuery, useMutation } from '@tanstack/react-query'
import axios from 'axios';
import React from 'react'
import Constants from 'expo-constants';

const baseUrl = Constants.expoConfig?.extra?.origin || "http://localhost:8081";
console.log("baseUrl in shopping api", baseUrl);

function useShoppingAPI() {
    const { getToken } = useAuth();
    const { data: shoppingList, error: shoppingListError, isLoading: shoppingListLoading, } = useQuery({
        queryKey: ['shoppingList'],
        queryFn: async () => {
            try {
                const token = await getToken();
                if (!token) return null;
                const response = await axios.get(`${baseUrl}/api/shoppingList/shoppingListNew`, {
                    headers: {
                        Authorization: `Bearer ${token}`
                    }
                });
                return response.data;
            } catch (error) {
                console.error('Error fetching shopping list:', error);
                return null;
            }
        },
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
            const response = await axios.delete(`${process.env.EXPO_PUBLIC_API_BASE_URL}/users/shoppingListNew/${product_id}`, {
                headers: {
                    Authorization: `Bearer ${token}`
                }
            });
            return response.data;
        } catch (error) {
            console.error('Error removing from shopping list:', error);
            throw error;
        }
    }

    const { mutateAsync: addToShoppingListMutation, isPending: addToShoppingListLoading, error: addToShoppingListError } = useMutation({
        mutationFn: (params: { product_id: string, metadata: any }) => addToShoppingList(params)
    })

    const { mutateAsync: removeFromShoppingListMutation, isPending: removeShoppingListLoading, error: removeFromShoppingListError } = useMutation({
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
        }
    } as const
}

export default useShoppingAPI

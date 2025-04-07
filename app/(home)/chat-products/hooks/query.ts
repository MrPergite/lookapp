import { useApi } from '@/client-api';
import { useMutation, useQueryClient } from '@tanstack/react-query'
import axios from 'axios'
import { useState } from 'react';
import Toast from 'react-native-toast-message';

// Hook for reaction mutation with fallback to public endpoint
export const usePostReactionMutation = (reactedProducts: Record<string, boolean>, setReaction: (reaction: Record<string, boolean>) => void) => {
    const queryClient = useQueryClient();
    const { callProtectedEndpoint, callPublicEndpoint, isAuthenticated } = useApi();

    return [null, useMutation({
        mutationFn: async ({ product_info, ...rest }: {
            like: boolean;
            product_info: any;
        }) => {

            try {
                // Try protected endpoint first
                if (isAuthenticated) {
                    return await callProtectedEndpoint('postReaction', {
                        method: 'POST',
                        data: {
                            ...rest,
                            product_info: JSON.stringify(product_info)
                        }
                    });
                }
                else {
                    return await callPublicEndpoint('postReaction', {
                        method: 'POST',
                        data: {
                            ...rest,
                            product_info: JSON.stringify(product_info)
                        }
                    });
                }
            } catch (error) {
                // If authentication fails, try public endpoint
                throw error;
            }
        },
        onSuccess: (data, { product_info, like }) => {
            // Invalidate relevant queries
            Toast.show({
                type: 'success',
                text1: 'Thank you for your feedback!',
            });
            queryClient.invalidateQueries({ queryKey: ['reactions'] });
            setReaction({ ...reactedProducts, [product_info.product_id]: like })
        },
        onError: (error) => {
            Toast.show({
                type: 'error',
                text1: 'Failed to submit product card reaction',
            });
        }
    })] as const;
};

// Generic hook for any protected API call with public fallback
export const useProtectedMutation = <TData, TVariables>(
    endpoint: string,
    options: {
        onSuccess?: (data: TData, variables: TVariables) => void;
        onError?: (error: Error, variables: TVariables) => void;
        invalidateQueries?: string[];
    } = {}
) => {
    const queryClient = useQueryClient();
    const { callProtectedEndpoint, callPublicEndpoint, isAuthenticated } = useApi();

    return useMutation<TData, Error, TVariables>({
        mutationFn: async (variables) => {
            try {
                // Try protected endpoint first
                if (isAuthenticated) {
                    return await callProtectedEndpoint(endpoint, {
                        method: 'POST',
                        data: variables
                    });
                }
                else {
                    return await callPublicEndpoint(endpoint, {
                        method: 'POST',
                        data: variables
                    });
                }
            } catch (error) {
                // If authentication fails, try public endpoint
                throw error;
            }
        },
        onSuccess: (data, variables) => {
            // Invalidate queries if specified
            if (options.invalidateQueries) {
                options.invalidateQueries.forEach(key => {
                    queryClient.invalidateQueries({ queryKey: [key] });
                });
            }
            
            // Call onSuccess callback if provided
            if (options.onSuccess) {
                options.onSuccess(data, variables);
            }
        },
        onError: (error, variables) => {
            if (options.onError) {
                options.onError(error, variables);
            }
        }
    });
};

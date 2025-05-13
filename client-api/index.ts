import axios, { AxiosRequestConfig, AxiosResponse, Method, InternalAxiosRequestConfig } from 'axios';
import * as SecureStore from 'expo-secure-store';
import { useAuth } from '@clerk/clerk-expo';
import { routes } from './routes';
import Constants from "expo-constants";
import AsyncStorage from '@react-native-async-storage/async-storage';

// Types for API configuration
interface Endpoint {
    [key: string]: string;
}

interface Endpoints {
    public: Endpoint;
    protected: Endpoint;
}

interface ApiConfigType {
    baseUrl: string;
    endpoints: Endpoints;
}

// Types for endpoint call options
interface EndpointCallOptions {
    method?: Method;
    data?: any;
    params?: any;
}

// API Configuration
const apiConfig: ApiConfigType = {
    // Base configuration
    baseUrl: Constants.expoConfig?.extra?.origin || "http://localhost:8081",

    // Endpoints configuration
    endpoints: {
        // Public endpoints that don't require authentication
        public: routes.public,

        // Protected endpoints that require authentication
        protected: routes.protected
    }
};

console.log({ apiConfig })


// Create axios instances for public and protected endpoints
const publicAxios = axios.create({
    baseURL: apiConfig.baseUrl,
    headers: {
        'Content-Type': 'application/json',
    }
});

const protectedAxios = axios.create({
    baseURL: apiConfig.baseUrl,
    // Don't automatically reject 4xx status codes as errors
    validateStatus: (status) => {
        // Consider all responses valid, except server errors (5xx)
        return status < 500;
    }
});

// Return type for useApi hook
interface ApiHook {
    isAuthenticated: boolean;
    callPublicEndpoint: <T = any>(endpointKey: string, options?: EndpointCallOptions) => Promise<T>;
    callProtectedEndpoint: <T = any>(endpointKey: string, options?: EndpointCallOptions) => Promise<T>;
}

// Hook to get authenticated API instance with Clerk
export function useApi(): ApiHook {
    const { getToken, isLoaded, isSignedIn } = useAuth();

    // Configure interceptor for protected requests
    protectedAxios.interceptors.request.use(
        async (config: InternalAxiosRequestConfig): Promise<InternalAxiosRequestConfig> => {
            if (isLoaded && isSignedIn) {
                try {
                    // Get token from Clerk
                    const token = await getToken();

                    if (token && config.headers) {
                        config.headers.Authorization = `Bearer ${token}`;
                    }
                    const fullUrl = `${config.baseURL || ''}${config.url}`;
                    console.log('👉 Full Axios Request:', JSON.stringify({
                        method: config.method,
                        url: fullUrl,
                        params: config.params,
                        data: config.data,
                        headers: config.headers,
                    }, null, 2));
                } catch (error) {
                    console.error('Error getting auth token:', error);
                }
            }
            return config;
        },
        (error: any) => {
            return Promise.reject(error);
        }
    );


    // Function to call public endpoints
    const callPublicEndpoint = async <T = any>(
        endpointKey: string,
        options: EndpointCallOptions = {}
    ): Promise<T> => {
        const { method = 'GET', data = null, params = null } = options;
        const endpoint = apiConfig.endpoints.public[endpointKey];

        if (!endpoint) {
            throw new Error(`Public endpoint "${endpointKey}" not found in config`);
        }

        try {
            const response: AxiosResponse<T> = await publicAxios({
                method,
                url: endpoint,
                data: method !== 'GET' ? data : null,
                params: method === 'GET' ? params : null
            });

            return response.data;
        } catch (error) {
            console.error(`Error calling ${endpointKey}:`, error);
            throw error;
        }
    };

    // Function to call protected endpoints
    const callProtectedEndpoint = async <T = any>(
        endpointKey: string,
        options: EndpointCallOptions = {}
    ): Promise<T> => {
        const { method = 'GET', data = {}, params = {} } = options;
        const endpoint = apiConfig.endpoints.protected[endpointKey];

        if (!endpoint) {
            throw new Error(`Protected endpoint "${endpointKey}" not found in config`);
        }

        if (!isLoaded || !isSignedIn) {
            throw new Error('User not authenticated');
        }

        let dynamicHeaders: AxiosRequestConfig['headers'];
        if (data instanceof FormData) {
            // Setting Content-Type to null for FormData allows Axios to automatically
            // set it to multipart/form-data with the correct boundary.
            // This overrides any default Content-Type set at the Axios instance level.
            dynamicHeaders = { 'Content-Type': 'multipart/form-data' };
            console.log("👉 Dynamic Headers:", dynamicHeaders);
        }
        // For non-FormData types, dynamicHeaders will be undefined.
        // In this case, the headers from the protectedAxios instance (defaulting to 'application/json')
        // or Axios's own defaults will apply.

        try {
            const response: AxiosResponse<T> = await protectedAxios({
                method,
                url: endpoint,
                ...(method !== "GET" && { data }), // Pass data if not a GET request
                params,
                headers: dynamicHeaders // Add the dynamicHeaders to the request config
            });
            
            console.log("API Response:", { 
                status: response.status, 
                statusText: response.statusText,
                data: response.data 
            });

            // Now both 2xx and 4xx responses come here
            return response.data;
        } catch (error: any) {
            // This will only be triggered for network errors, 
            // 5xx server errors, or other exceptions
            console.error(`API Error calling ${endpointKey}:`, error);
            
            // Detailed error logging
            if (error.response) {
                console.error('Error Response Details:', {
                    status: error.response.status,
                    statusText: error.response.statusText,
                    data: error.response.data,
                    headers: error.response.headers
                });
            } else if (error.request) {
                console.error('Error Request Details:', error.request);
            } else {
                console.error('Error Message:', error.message);
            }
            console.error('Error Config:', error.config);
            
            // If it's actually a 400 error that's being misinterpreted, return the data
            if (error.response && error.response.status === 400) {
                console.log('Detected 400 status in error response, returning data');
                return error.response.data as T;
            }
            
            throw error;
        }
    };

    return {
        isAuthenticated: isLoaded && isSignedIn,
        callPublicEndpoint,
        callProtectedEndpoint
    };
}

// Example usage with TypeScript
interface Product {
    id: string;
    name: string;
    price: number;
    description: string;
}

interface UserProfile {
    id: string;
    name: string;
    email: string;
    preferences: {
        theme: string;
        notifications: boolean;
    }
}

// Example component with type safety
export function ApiExample() {
    const { isAuthenticated, callPublicEndpoint, callProtectedEndpoint } = useApi();

    // Example function to fetch public data with types
    const fetchPublicData = async (): Promise<Product[] | null> => {
        try {
            const products = await callPublicEndpoint<Product[]>('getProducts');
            return products;
        } catch (error) {
            console.error('Failed to fetch public data:', error);
            return null;
        }
    };

    // Example function to fetch protected data with types
    const fetchUserProfile = async (): Promise<UserProfile | null> => {
        try {
            if (!isAuthenticated) {
                console.log('User is not authenticated');
                return null;
            }

            const profile = await callProtectedEndpoint<UserProfile>('getUserProfile');
            return profile;
        } catch (error) {
            console.error('Failed to fetch user profile:', error);
            return null;
        }
    };

    return {
        fetchPublicData,
        fetchUserProfile
    };
}
import axios, { AxiosRequestConfig, AxiosResponse, Method } from 'axios';
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

const getHeaders = async () => {
    const headerData = await AsyncStorage.getItem('user-header');

    if (!headerData) {
        const res = await fetch('https://ipapi.co/json/'); // Or ipinfo.io, ipregistry, etc.
        const geo = await res.json();
        await AsyncStorage.setItem('user-header', JSON.stringify(geo));
        return {
            'X-Country': geo.country,
            'X-Region': geo.city,
            'X-Forwarded-For': geo.ip,
        };
    }
    const geo = JSON.parse(headerData);
    console.log('geo', geo);


    const headers = {
        'X-Country': geo.country,
        'X-Region': geo.city,
        'X-Forwarded-For': geo.ip,
    };

    return headers;
}


// Create axios instances for public and protected endpoints
const publicAxios = axios.create({
    baseURL: apiConfig.baseUrl,
    headers: {
        'Content-Type': 'application/json',

    }
});

const protectedAxios = axios.create({
    baseURL: apiConfig.baseUrl,
    headers: {
        'Content-Type': 'application/json',
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
        async (config: AxiosRequestConfig): Promise<AxiosRequestConfig> => {
            if (isLoaded && isSignedIn) {
                try {
                    // Get token from Clerk
                    const token = await getToken();
                    const headers = await getHeaders();
                    console.log({ token })
                    if (token && config.headers) {
                        config.headers.Authorization = `Bearer ${token}`;
                        config.headers = { ...config.headers, ...headers };
                    }
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

    publicAxios.interceptors.request.use(
        async (config: AxiosRequestConfig): Promise<AxiosRequestConfig> => {
            const headers = await getHeaders();
            console.log({ headers })
            config.headers = { ...config.headers, ...headers };
            return config;
        }
    );

    console.log({ headers:publicAxios.defaults.headers })

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
        const { method = 'GET', data = null, params = null } = options;
        const endpoint = apiConfig.endpoints.protected[endpointKey];

        if (!endpoint) {
            throw new Error(`Protected endpoint "${endpointKey}" not found in config`);
        }

        if (!isLoaded || !isSignedIn) {
            throw new Error('User not authenticated');
        }

        try {
            const response: AxiosResponse<T> = await protectedAxios({
                method,
                url: endpoint,
                data: method !== 'GET' ? data : null,
                params: method === 'GET' ? params : null
            });

            return response.data;
        } catch (error: any) {
            // Handle specific error cases
            if (error.response) {
                // Server responded with a status code outside of 2xx range
                if (error.response.status === 401) {
                    console.error('Authentication error: Token may be expired');
                }
            }
            console.error(`Error calling ${endpointKey}:`, error);
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
            console.log('Products:', products);
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
            console.log('User profile:', profile);
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
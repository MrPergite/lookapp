import axios from 'axios';
import { applyHeaderStyles } from '../utils';

/**
 * Interface for product card query request
 */
interface ProductCardQueryRequest {
    product_img_url: string;
    product_title: string;
    chat_history: {
        role: 'user' | 'ai';
        text: string;
    }[];
    query: string;
}

/**
 * Authenticated API endpoint for product card queries
 * Requires a valid user session
 */
export async function POST(req: Request) {
    try {
        // Get auth token from request headers
        const authorization = req.headers.get('Authorization');

        if (!authorization || !authorization.startsWith('Bearer ')) {
            return Response.json(
                { error: 'Unauthorized. Please sign in.' },
                { status: 401 }
            );
        }

        // Parse request body
        const body = await req.json() as ProductCardQueryRequest;

        // Log the incoming request (for debugging)
        console.log('Authenticated Product Card Query:', {
            product: body.product_title,
            query: body.query,
            chatHistoryLength: body.chat_history?.length || 0
        });

        // Forward the request to the external API
        const response = await axios.post(`${process.env.EXPO_PUBLIC_API_BASE_URL}/users/prodCardQuery`, body, {
            method: 'POST',
            headers: {
                ...(await applyHeaderStyles(req)),
            },
        });

        console.log('Response from prodCardQuery:', response.data);

        // If the external API call fails
        if (response.status !== 200) {
            const errorData = response.data;
            return Response.json(
                { error: 'Error from external API', details: errorData },
                { status: response.status }
            );
        }

        // Return the response from the external API
        return Response.json(response.data);

    } catch (error) {
        console.error('Error in prodCardQuery API:', error);
        return Response.json(
            { error: 'Internal server error' },
            { status: 500 }
        );
    }
} 
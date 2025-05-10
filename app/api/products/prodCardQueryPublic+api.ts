import axios from 'axios';
import { applyHeaders } from '../utils';

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
        // Parse request body
        const body = await req.json() as ProductCardQueryRequest;

        // Log the incoming request (for debugging)
        console.log('Authenticated Product Card Query:', {
            product: body.product_title,
            query: body.query,
            chatHistoryLength: body.chat_history?.length || 0
        });

        // Forward the request to the external API
        const response = await axios.post(`${process.env.EXPO_PUBLIC_API_BASE_URL}/users/prodCardQueryPublic`,body, {
            method: 'POST',
            headers: {
                ...(await applyHeaders(req))
            },
        });

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
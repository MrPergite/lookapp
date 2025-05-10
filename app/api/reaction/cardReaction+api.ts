import { NextRequest } from 'next/server';
import axios from 'axios';
import { applyHeaders } from '../utils';
/**
 * GET handler for protected product card reaction API
 * Simply returns a test message, primarily used for health checks
 * Requires authentication token
 */
export async function GET(request: NextRequest) {
    // Check if the request has an authorization header
    const authHeader = request.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return Response.json(
            { error: 'Unauthorized: Missing or invalid token' },
            { status: 401 }
        );
    }

    return Response.json({ message: "Protected product card reaction API is up and running" });
}

/**
 * POST handler for protected product card reaction
 * Forwards the reaction to the external API with authentication
 * Used for logged-in users
 */
export async function POST(request: NextRequest) {
    try {
        // Check if the request has an authorization header
        const authHeader = request.headers.get('authorization');
        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            return Response.json(
                { error: 'Unauthorized: Missing or invalid token' },
                { status: 401 }
            );
        }

        // Extract the token
        const token = authHeader.split(' ')[1];

        // Parse the request body
        const body = await request.json();
        console.log("Request body in protected cardReaction+api:", body);
        console.log("Token:", token);
        console.log("body.product_info", typeof body);

        // Validate required fields
        if (body.like === undefined || !body.product_info) {
            return Response.json(
                { error: "Missing required fields" },
                { status: 400 }
            );
        }

        // Forward the request to the actual product card reaction API with the authorization header
        const response = await axios.post(
            `${process.env.EXPO_PUBLIC_API_BASE_URL}/users/productCardReaction`,
            body,
            {
                headers: {
                    'Authorization': `Bearer ${token}`,
                    ...(await applyHeaders(request))
                }
            }
        );
        console.log("response", response.data);

        // Return the success response
        return Response.json(
            { message: "Product card reaction submitted successfully" },
            { status: 200 }
        );

    } catch (error: any) {
        console.log('Protected product card reaction API error:', error.response.data);

        // Return appropriate error response
        return Response.json(
            { error: "Failed to submit product card reaction" },
            { status: 500 }
        );
    }
} 
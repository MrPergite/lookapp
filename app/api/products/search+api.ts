import { NextRequest } from 'next/server';
import axios from 'axios';
import { applyHeaders } from '../utils';
/**
 * GET handler for product search
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

  return Response.json({ message: "Protected product search API is up and running" });
}

/**
 * POST handler for product search
 * Forwards the request to the external API with authentication
 * Requires valid authorization token
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
    console.log("body in protected search+api", token);
    
    // Validate required fields
    if (!body.chatHistory || !Array.isArray(body.chatHistory)) {
      return Response.json(
        { error: 'Chat history is required and must be an array' },
        { status: 400 }
      );
    }
    
    // Forward the request to the actual product search API with the authorization header
    const response = await axios.post(
      `${process.env.EXPO_PUBLIC_API_BASE_URL}/users/search`, 
      body,
      {
        headers: {
          'Authorization': `Bearer ${token}`,
          ...(await applyHeaders(request))
        }
      }
    );
    
    // Return the response from the external API
    return Response.json(response.data);
    
  } catch (error: any) {
    console.error('Protected product search API error:', error);
    
    // Return appropriate error response
    return Response.json(
      { error: error.message || 'Failed to search for products' },
      { status: error.response?.status || 500 }
    );
  }
} 
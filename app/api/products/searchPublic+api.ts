import { NextRequest } from 'next/server';
import axios from 'axios';
import { applyHeaders } from '../utils';

/**
 * GET handler for product search
 * Simply returns a test message, primarily used for health checks
 */
export async function GET(request: NextRequest) {
  return Response.json({ message: "Product search API is up and running" });
}

/**
 * POST handler for product search
 * Forwards the request to the external API and returns the response
 */
export async function POST(request: NextRequest) {
  try {
    // Parse the request body
    const body = await request.json();
    console.log("body in search+api", body);
    
    // Validate required fields
    if (!body.chatHistory || !Array.isArray(body.chatHistory)) {
      return Response.json(
        { error: 'Chat history is required and must be an array' },
        { status: 400 }
      );
    }
    // Forward the request to the actual product search API
    const response = await axios.post(`${process.env.EXPO_PUBLIC_API_BASE_URL}/users/searchPublic`, body,{
      headers: {
        ...(await applyHeaders(request))
      }
    });
    
    // Return the response from the external API
    return Response.json(response.data);
    
  } catch (error: any) {
    console.error('Product search API error:', error);
    
    // Return appropriate error response
    return Response.json(
      { error: error.message || 'Failed to search for products' },
      { status: error.response?.status || 500 }
    );
  }
} 
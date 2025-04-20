import { NextRequest } from 'next/server';
import axios from 'axios';
import { applyHeaderStyles } from '../utils';
/**
 * GET handler for shopping list new API
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


  const response = await axios.get(`${process.env.EXPO_PUBLIC_API_BASE_URL}/users/shoppingListNew`, {
    headers: {
      ...(await applyHeaderStyles(request)),
    }
  });

  console.log("shopping list new", response.data);

  return Response.json(response.data);
}

/**
 * POST handler for adding items to shopping list
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
    console.log("Request body in shoppingListNew+api:", body);
    
    // Validate required fields
    if (!body.data || !body.metadata) {
      return Response.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    // Additional validation for required nested fields
    if (!body.data.product_id || !body.metadata.title || !body.metadata.img_url) {
      return Response.json(
        { error: "Missing required product information" },
        { status: 400 }
      );
    }
    
    // Forward the request to the actual shopping list API with the authorization header
    const response = await axios.post(
      `${process.env.EXPO_PUBLIC_API_BASE_URL}/users/shoppingListNew`, 
      body,
      {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
          ...(await applyHeaderStyles(request))
        }
      }
    );
    
    // Return success response
    return Response.json(
      { message: "Product card reaction submitted successfully" },
      { status: 200 }
    );
    
  } catch (error: any) {
    console.error('Shopping List New API error:', error);
    
    // Return appropriate error response
    return Response.json(
      { error: "Failed to submit product card reaction" },
      { status: error.response?.status || 500 }
    );
  }
} 
import { NextRequest } from 'next/server';
import axios from 'axios';
import { applyHeaderStyles } from '../utils';

/**
 * GET handler for product details API
 * Returns a health check message
 */
export async function GET(request: NextRequest) {
  return Response.json({ message: "Product details API is operational" });
}

/**
 * POST handler for product details API
 * Fetches detailed product information based on product_id
 * This endpoint doesn't require authentication
 */
export async function POST(request: NextRequest) {
  try {
    // Parse the request body
    const body = await request.json();
    console.log("Request body in get-product-details API:", body);
    
    // Validate required fields
    if (!body.product_id) {
      return Response.json(
        { error: "Missing required field: product_id" },
        { status: 400 }
      );
    }
    
    // Forward the request to the external API
    const response = await axios.post(
      `${process.env.EXPO_PUBLIC_API_BASE_URL}/users/productInfo`,
      { product_id: body.product_id },
      {
        headers: {
          'Content-Type': 'application/json',
          ...(await applyHeaderStyles(request))
        }
      }
    );
    
    // Return the response from the external API
    return Response.json(response.data);
    
  } catch (error: any) {
    console.error('Product details API error:', error.response || error);
    
    // If the external API returned an error, forward its status code and message
    if (error.response) {
      return Response.json(
        { 
          error: "Failed to fetch product details",
          details: error.response.data
        },
        { status: error.response.status || 500 }
      );
    }
    
    // Generic error response
    return Response.json(
      { error: "Failed to fetch product details" },
      { status: 500 }
    );
  }
} 
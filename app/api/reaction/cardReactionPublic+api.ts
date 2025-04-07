import { NextRequest } from 'next/server';
import axios from 'axios';

/**
 * GET handler for product card reaction public API
 * Simply returns a test message, primarily used for health checks
 */
export async function GET(request: NextRequest) {
  return Response.json({ message: "Product card reaction public API is up and running" });
}

/**
 * POST handler for public product card reaction
 * Forwards the reaction to the external API without requiring authentication
 * Used for logged-out users
 */
export async function POST(request: NextRequest) {
  try {
    // Parse the request body
    const body = await request.json();
    console.log("Request body in cardReactionPublic+api:", body);
    
    // Validate required fields
    if (body.like === undefined || !body.product_info) {
      return Response.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }
    
    // Forward the request to the actual product card reaction API
    const response = await axios.post(
      `${process.env.EXPO_PUBLIC_API_BASE_URL}/users/productCardReactionPublic`,
      body
    );
    
    // Return the success response
    return Response.json(
      { message: "Product card reaction submitted successfully" },
      { status: 200 }
    );
    
  } catch (error: any) {
    console.error('Product card reaction public API error:', error);
    
    // Return appropriate error response
    return Response.json(
      { error: "Failed to submit product card reaction" },
      { status: 500 }
    );
  }
} 
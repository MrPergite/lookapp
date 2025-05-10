import axios from 'axios';
import { applyHeaders } from '../utils';
/**
 * GET handler for searchPart API
 * Simply returns a test message, primarily used for health checks
 */
export async function GET(request: Request) {
  return Response.json({ message: "SearchPart API is up and running" });
}

/**
 * POST handler for searchPart API
 * Processes chat history to generate search queries for product search
 */
export async function POST(request: Request) {
  try {
    // Parse the request body
    const body = await request.json();

    console.log("body in searchPartPublic+api", body);

    // Validate required fields
    if (!body.chatHistory || !Array.isArray(body.chatHistory)) {
      return Response.json(
        { error: 'Chat history is required and must be an array' },
        { status: 400 }
      );
    }

    // Forward the request to the external searchPart API
    const response = await axios.post(`${process.env.EXPO_PUBLIC_API_BASE_URL}/users/searchPartPublic`, { ...body },{
      headers: {
        ...(await applyHeaders(request))
      }
    });

    // Return the response from the external API
    console.log("response in searchPartPublic+api", response.data);
    return Response.json(response.data);

  } catch (error: any) {
    console.error('SearchPart API error:', error.response.data);

    // Return appropriate error response
    return Response.json({ error: error.message || 'Failed to search for products' }, { status: error.response?.status || 500 });
  }
} 
import { NextRequest } from 'next/server';
import axios from 'axios';
import { applyHeaderStyles } from '../../utils';
/**
 * GET handler for retrieving user onboarding information
 */
export async function GET(request: NextRequest) {
  try {
    // Get the authorization header
    const authHeader = request.headers.get('authorization');
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return new Response(
        JSON.stringify({ success: false, message: 'Unauthorized' }),
        { status: 401, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Extract token
    const token = authHeader.substring(7);
    
    // Get user ID from token or header
    const userId = request.headers.get('x-user-id') || 'anonymous';

    // Make real API call to backend
    try {
      const backendUrl = process.env.EXPO_PUBLIC_API_BASE_URL || 'https://api.example.com';
      const response = await axios.get(
        `${backendUrl}/users/${userId}/onboarding`,
        {
          headers: {
            'Authorization': authHeader,
            ...(await applyHeaderStyles(request))
          }
        }
      );
      
      // Return the actual data from backend
      return new Response(
        JSON.stringify({ 
          success: true, 
          data: response.data
        }),
        { status: 200, headers: { 'Content-Type': 'application/json' } }
      );
    } catch (apiError: any) {
      // Handle specific API errors
      const status = apiError.response?.status || 500;
      const message = apiError.response?.data?.message || 'Failed to retrieve onboarding information';
      
      return new Response(
        JSON.stringify({ 
          success: false, 
          message
        }),
        { status, headers: { 'Content-Type': 'application/json' } }
      );
    }
    
  } catch (error) {
    console.error('Error in getOnboardingInfo API:', error);
    
    return new Response(
      JSON.stringify({ 
        success: false, 
        message: 'An error occurred while retrieving onboarding information',
        error: error instanceof Error ? error.message : 'Unknown error'
      }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
} 
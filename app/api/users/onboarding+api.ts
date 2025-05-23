import { NextRequest } from 'next/server';
import axios from 'axios';
import { applyHeaders } from '../utils';
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
        { status: 401, headers: { 'Content-Type': 'application/json', ...(await applyHeaders(request)) } }
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
        `${backendUrl}/users/getOnboardingInfo`,
        {
          headers: {
            'Authorization': authHeader,
            ...(await applyHeaders(request))
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

/**
 * POST handler for saving user onboarding information
 */
export async function POST(request: NextRequest) {
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

    // Parse the request body
    const body = await request.json();
    const { onboardingInfo } = body;


    // Validate presence of onboardingInfo
    if (!onboardingInfo) {
      return new Response(
        JSON.stringify({ 
          success: false, 
          message: 'Missing onboarding information in request body' 
        }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Validate gender is provided (mandatory)
    if (!onboardingInfo.gender) {
      return new Response(
        JSON.stringify({ 
          success: false, 
          message: 'Gender is required' 
        }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Validate other required fields
    const requiredFields = [
      { field: 'clothing_size', message: 'Clothing size is required' },
      { field: 'shoe_size', message: 'Shoe size is required' },
      { field: 'shoe_unit', message: 'Shoe unit is required' },
      { field: 'country', message: 'Country is required' },
      { field: 'pref_avatar_url', message: 'Avatar URL is required' }
    ];

    for (const { field, message } of requiredFields) {
      if (!onboardingInfo[field]) {
        return new Response(
          JSON.stringify({ success: false, message }),
          { status: 400, headers: { 'Content-Type': 'application/json' } }
        );
      }
    }

    // Make real API call to save data
    try {
      const backendUrl = process.env.EXPO_PUBLIC_API_BASE_URL || 'https://api.example.com';
      const response = await axios.post(
        `${backendUrl}/users/onboardingInfo`,
        {
          onboardingInfo
        },
        {
          headers: {
            ...(await applyHeaders(request))
          }
        }
      );

      // Return the response from the backend
      return new Response(
        JSON.stringify({ 
          success: true, 
          message: 'Onboarding information saved successfully',
          data: response.data
        }),
        { status: 200, headers: { 'Content-Type': 'application/json' } }
      );
    } catch (apiError: any) {
      // Handle specific API errors
      const status = apiError.response?.status || 500;
      const message = apiError.response?.data?.message || 'Failed to save onboarding information';
      
      return new Response(
        JSON.stringify({ 
          success: false, 
          message
        }),
        { status, headers: { 'Content-Type': 'application/json' } }
      );
    }
    
  } catch (error) {
    console.error('Error in onboardingInfo API:', error);
    
    return new Response(
      JSON.stringify({ 
        success: false, 
        message: 'An error occurred while saving onboarding information',
        error: error instanceof Error ? error.message : 'Unknown error'
      }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
} 
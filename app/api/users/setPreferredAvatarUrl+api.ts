import axios, { AxiosRequestConfig } from 'axios';
import { applyHeaderStyles } from '../utils'; // Assuming this utility correctly extracts/forwards headers
import { NextRequest, NextResponse } from 'next/server';
import https from 'https';

interface SetPreferredAvatarPayload {
  pref_avatar_url: string;
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json() as SetPreferredAvatarPayload;
    const { pref_avatar_url } = body;

    if (!pref_avatar_url || typeof pref_avatar_url !== 'string') {
      return NextResponse.json({ error: 'Missing or invalid pref_avatar_url' }, { status: 400 });
    }

    // Basic URL format validation
    try {
      new URL(pref_avatar_url);
    } catch (e) {
      return NextResponse.json({ error: 'Invalid URL format for pref_avatar_url' }, { status: 400 });
    }

    const agent = new https.Agent({  
      rejectUnauthorized: false // DANGER: Use only for trusted local dev servers or properly configured certs
    });

    // Prepare headers for Axios, similar to createPersonalizedAvatar+api.ts
    const forwardedHeaders = await applyHeaderStyles(req); // req is NextRequest here
    const axiosHeaders: Record<string, string> = {};

    // Convert Headers object (from NextRequest) to a plain object for Axios
    if (forwardedHeaders instanceof Headers) {
        forwardedHeaders.forEach((value: string, key: string) => {
          axiosHeaders[key] = value;
        });
    } else if (typeof forwardedHeaders === 'object' && forwardedHeaders !== null) {
        // If applyHeaderStyles returns a plain object already
        for (const key in forwardedHeaders) {
            if (Object.prototype.hasOwnProperty.call(forwardedHeaders, key)) {
                const value = (forwardedHeaders as Record<string, any>)[key];
                if (typeof value === 'string') {
                    axiosHeaders[key] = value;
                }
            }
        }
    }
    
    // Ensure Content-Type is set for the outgoing request to your backend
    axiosHeaders['Content-Type'] = 'application/json';

    const backendUrl = `${process.env.EXPO_PUBLIC_API_BASE_URL}/users/setPreferredAvatarUrl`;
    console.log(`Forwarding setPreferredAvatarUrl to: ${backendUrl}`);

    const response = await axios.post(backendUrl, 
      { pref_avatar_url }, // Payload for your backend
      {
        httpsAgent: agent,
        headers: axiosHeaders,
        // If your external backend expects 4xx to not throw, configure validateStatus here too
        // validateStatus: status => status < 500, 
      }
    );

    return NextResponse.json(response.data, { status: response.status });

  } catch (error: any) {
    console.error('[API_SET_PREFERRED_AVATAR_ERROR]', error);
    if (error.response) {
      // Forward the error response from the external backend if available
      return NextResponse.json(error.response.data, { status: error.response.status });
    }    
    return NextResponse.json({ error: error.message || 'An unexpected error occurred' }, { status: 500 });
  }
}

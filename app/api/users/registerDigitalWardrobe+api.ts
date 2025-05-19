import axios from 'axios';
import { applyHeaders } from '../utils';
import { NextRequest, NextResponse } from 'next/server';
import https from 'https';

interface RegisterDigitalWardrobePayload {
  userEmail: string;
}

export async function POST(req: NextRequest) {
  try {
    const body = (await req.json()) as RegisterDigitalWardrobePayload;
    const { userEmail } = body;

    if (!userEmail || typeof userEmail !== 'string') {
      return NextResponse.json({ error: 'Missing or invalid userEmail' }, { status: 400 });
    }

    // very naive email format check
    if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(userEmail)) {
      return NextResponse.json({ error: 'Invalid email format' }, { status: 400 });
    }

    const agent = new https.Agent({ rejectUnauthorized: false }); // dev certs

    // Forward headers
    const forwardedHeaders = await applyHeaders(req); // req is NextRequest here
    const axiosHeaders: Record<string, string> = {};

    // Convert Headers object (from NextRequest) to a plain object for Axios
    if (forwardedHeaders instanceof Headers) {
        forwardedHeaders.forEach((value: string, key: string) => {
          axiosHeaders[key] = value;
        });
    } else if (typeof forwardedHeaders === 'object' && forwardedHeaders !== null) {
        // If applyHeaders returns a plain object already
        for (const key in forwardedHeaders) {
            if (Object.prototype.hasOwnProperty.call(forwardedHeaders, key)) {
                const value = (forwardedHeaders as Record<string, any>)[key];
                if (typeof value === 'string') {
                    axiosHeaders[key] = value;
                }
            }
        }
    }
    axiosHeaders['Content-Type'] = 'application/json';

    const backendUrl = `${process.env.EXPO_PUBLIC_API_BASE_URL}/users/registerDigitalWardrobe`;
    console.log(`Forwarding registerDigitalWardrobe to: ${backendUrl}`);

    const response = await axios.post(
      backendUrl,
      { userEmail },
      {
        httpsAgent: agent,
        headers: axiosHeaders,
      }
    );

    return NextResponse.json(response.data, { status: response.status });
  } catch (error: any) {
    console.error('[API_REGISTER_DIGITAL_WARDROBE_ERROR]', error);
    if (error.response) {
      return NextResponse.json(error.response.data, { status: error.response.status });
    }
    return NextResponse.json(
      { error: error.message || 'An unexpected error occurred' },
      { status: 500 }
    );
  }
}

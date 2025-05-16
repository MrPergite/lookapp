import axios from 'axios';
import { applyHeaders } from '../utils';
import { NextRequest, NextResponse } from 'next/server';
import https from 'https';

// This route simply forwards the pagination / filter payload to the backend
// endpoint responsible for returning wardrobe items for the signed-in user.

export async function POST(req: NextRequest) {
  try {
    const payload = await req.json();

    const agent = new https.Agent({ rejectUnauthorized: false }); // dev ssl

    const forwardedHeaders = await applyHeaders(req);
    const axiosHeaders: Record<string, string> = {};
    if (forwardedHeaders instanceof Headers) {
      forwardedHeaders.forEach((v: any, k: any) => {
        axiosHeaders[k] = v as string;
      });
    } else if (typeof forwardedHeaders === 'object' && forwardedHeaders !== null) {
      Object.keys(forwardedHeaders).forEach((k) => {
        const val = (forwardedHeaders as Record<string, any>)[k];
        if (typeof val === 'string') axiosHeaders[k] = val;
      });
    }
    axiosHeaders['Content-Type'] = 'application/json';

    const backendUrl = `${process.env.EXPO_PUBLIC_API_BASE_URL}/users/digitalWardrobeItems`;
    console.log(`[Proxy] digitalWardrobeItems -> ${backendUrl}`);

    const response = await axios.post(backendUrl, payload, {
      httpsAgent: agent,
      headers: axiosHeaders,
});
    console.log('safeData1', response);

    const safeData = response.data ?? {};
    return NextResponse.json(safeData, { status: response.status });
  } catch (error: any) {
    console.error('[API_DIGITAL_WARDROBE_ITEMS_ERROR]', error);
    if (error.response) {
      return NextResponse.json(error.response.data, { status: error.response.status });
    }
    return NextResponse.json({ error: error.message || 'Unexpected error' }, { status: 500 });
  }
}

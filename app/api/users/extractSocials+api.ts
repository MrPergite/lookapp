
import axios from "axios";
import { applyHeaders } from "../utils";
import { NextResponse } from 'next/server';
import https from 'https';

interface ExtractSocialsPayload {
  url: string;
}

export async function POST(req: Request) {
    try {
        const { url } = await req.json() as ExtractSocialsPayload;

        if (!url || typeof url !== 'string') {
            return NextResponse.json({ error: 'URL is required and must be a string.' }, { status: 400 });
        }

        const agent = new https.Agent({  
          rejectUnauthorized: false // DANGER: Use only for trusted local dev servers
        });
        const response = await axios.post(`${process.env.EXPO_PUBLIC_API_BASE_URL}/users/extractSocials`, {
            url
        }, {
            httpsAgent: agent,
            headers: {
                ...(await applyHeaders(req)),
                'Content-Type': 'application/json',
            },
        });

        return NextResponse.json(response.data);
    } catch (error: any) {
        
        console.log("Error in extractSocials API: ", error);
        return NextResponse.json({ error: error.message || 'An unexpected error occurred' }, { status: 500 });
    }
}


import axios from "axios";
import { applyHeaders } from "../utils";
import { NextResponse } from 'next/server';
import https from 'https';

interface FindProductsPayload {
    img_url: string;
    personalization: boolean;
}

export async function POST(req: Request) {
    try {
        const { img_url, personalization } = await req.json() as FindProductsPayload;

        if (!img_url || typeof img_url !== 'string') {
            return NextResponse.json({ error: 'URL is required and must be a string.' }, { status: 400 });
        }

        const agent = new https.Agent({
            rejectUnauthorized: false // DANGER: Use only for trusted local dev servers
        });
        const response = await axios.post(`${process.env.EXPO_PUBLIC_API_BASE_URL}/users/findProducts`, {
            img_url,
            personalization
        }, {
            httpsAgent: agent,
            headers: {
                ...(await applyHeaders(req)),
                'Content-Type': 'application/json',
            },
        });

        if (response.status !== 200 || response.data.error) {
            return NextResponse.json({ error: response.data.error || 'Error from external API', status: response.status });
        }

        return NextResponse.json(response.data);
    } catch (error: any) {

        if (error.response) {
            console.log('Server Response:', error.response.data);
        }

        console.log("Error in findProducts API: ", error);
        return NextResponse.json({ error: error.response.data.error || 'An unexpected error occurred' }, { status: 500 });
    }
}

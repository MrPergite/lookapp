import axios from "axios";
import { applyHeaderStyles } from "../utils";
import { NextResponse } from 'next/server';
import https from 'https';

interface CreateAvatarPayload {
  images: string[];
  gender: string;
}

export async function POST(req: Request) {
    try {
        const { images, gender } = await req.json() as CreateAvatarPayload;

        if (!images || !Array.isArray(images) || images.length === 0) {
            return NextResponse.json({ error: 'Images are required and must be an array.' }, { status: 400 });
        }
        if (!gender || typeof gender !== 'string') {
            return NextResponse.json({ error: 'Gender is required and must be a string.' }, { status: 400 });
        }

        const agent = new https.Agent({  
          rejectUnauthorized: false // DANGER: Use only for trusted local dev servers
        });
console.log("process.env.EXPO_PUBLIC_API_BASE_URL", process.env.EXPO_PUBLIC_API_BASE_URL);
        const response = await axios.post(`${process.env.EXPO_PUBLIC_API_BASE_URL}/users/createPersonalizedAvatar`, {
            images,
            gender
        }, {
            httpsAgent: agent,
            headers: {
                ...(await applyHeaderStyles(req)),
                'Content-Type': 'application/json',
            },
        });

        return NextResponse.json(response.data);
    } catch (error: any) {
        
        console.log("Error in createPersonalizedAvatar API: ", error);
        return NextResponse.json({ error: error.message || 'An unexpected error occurred' }, { status: 500 });
    }
}

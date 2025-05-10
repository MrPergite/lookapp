import axios from "axios";
import { applyHeaders } from "../utils";
import { NextRequest } from "next/server";

export async function GET(req: NextRequest) {
    try {
        console.log("outfit env ", process.env.EXPO_PUBLIC_API_BASE_URL, process.env.EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY);
        const response = await axios.get(`${process.env.EXPO_PUBLIC_API_BASE_URL}/users/vton/outfits`, {
            headers: {
                ...(await applyHeaders(req)),
                'Content-Type': 'application/json',
            },
        });


        return Response.json(response.data);
    } catch (error: any) {
        console.log("error in outfits api : ", error);
        return Response.json({ error: error.message }, { status: 500 });
    }
}

export async function POST(req: NextRequest) {
    try {
        const {
            vton_img_url,
            outfit_name,
            base_avatar_id,
            top_img_id,
            bottom_img_id,
            one_pieces_img_id
        } = await req.json();
        const response = await axios.post(`${process.env.EXPO_PUBLIC_API_BASE_URL}/users/vton/outfits`,
            { outfit_name, vton_img_url, base_avatar_id, top_img_id, bottom_img_id, one_pieces_img_id },
            {
                headers: {
                    ...(await applyHeaders(req)),
                    'Content-Type': 'application/json',
                },
            });

        return Response.json({ ...response.data, status: response.status });
    } catch (error: any) {
        console.log("error in outfits api : ", error);
        return Response.json({ error: error.message }, { status: 500 });
    }
}

export async function DELETE(req: NextRequest) {
    try {
        const { id } = await req.json();
        const response = await axios.post(`${process.env.EXPO_PUBLIC_API_BASE_URL}/users/vton/outfits/delete?id=${id}`, null, {
            headers: {
                ...(await applyHeaders(req)),
            },
        });
        return Response.json({ ...response.data, status: response.status });
    } catch (error: any) {
        console.log("error in outfits api : ", error);
        return Response.json({ error: error.message }, { status: 500 });
    }
}
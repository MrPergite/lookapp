import axios from "axios";
import { applyHeaders } from "../utils";
import { NextRequest } from "next/server";
export async function POST(req: NextRequest) {
    try {
        const { avatar_url, id, base_avatar_id, top_img_id, bottom_img_id, one_pieces_img_id } = await req.json();

        const response = await axios.post(`${process.env.EXPO_PUBLIC_API_BASE_URL}/users/vton/tryon`, {
            avatar_url, id, base_avatar_id, top_img_id, bottom_img_id, one_pieces_img_id
        }, {
            headers: {
                ...(await applyHeaders(req)),
                'Content-Type': 'application/json',
            },
        });

        return Response.json(response.data);
    } catch (error: any) {
        console.log("error in tryon api : ", error);
        return Response.json({ error: error.message }, { status: 500 });
    }
}

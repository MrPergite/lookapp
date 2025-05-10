import axios from "axios";
import { applyHeaders } from "../utils";
import { NextRequest } from "next/server";

export async function GET(req: NextRequest) {
    try {
        console.log("process.env.EXPO_PUBLIC_API_BASE_URL", process.env.EXPO_PUBLIC_API_BASE_URL);
        const response = await axios.get(`${process.env.EXPO_PUBLIC_API_BASE_URL}/users/vton/credits`, {
            headers: {
                ...(await applyHeaders(req)),
            },
        });

        return Response.json(response.data);
    } catch (error: any) {
        console.log("error in credits api : ", error);
        return Response.json({ error: error.message }, { status: 500 });
    }
}
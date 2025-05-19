import axios from "axios";
import { applyHeaders } from '../utils';


export async function POST(request: Request) {
    try {
        const authHeader = request.headers.get('Authorization');
        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            return Response.json(
                { error: 'Unauthorized: Missing or invalid token' },
                { status: 401 }
            );
        }

        const userResponse = await axios.post(`${process.env.EXPO_PUBLIC_API_BASE_URL}/users/generatePromptChips`, {
            headers: await applyHeaders(request)
        })

        return Response.json(userResponse.data)

    } catch (error) {
        console.log("generatePromptChips error",error)
        return Response.json({ error: 'Failed to generate prompt chips' }, { status: 500 })
    }
}

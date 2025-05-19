import axios from "axios";
import { applyHeaders } from '../utils';


export async function POST(request: Request) {
    try {
    

        const userResponse = await axios.post(`${process.env.EXPO_PUBLIC_API_BASE_URL}/users/generatePromptChipsPublic`, {
            headers: await applyHeaders(request)
        })

        return Response.json(userResponse.data)

    } catch (error) {
        console.log("generatePromptChipsPublic error",error)
        return Response.json({ error: 'Failed to generate prompt chips' }, { status: 500 })
    }
}

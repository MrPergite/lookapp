import axios from "axios";
import { applyHeaders } from '../utils';


export async function GET(request: Request) {
    try {
        const authHeader = request.headers.get('Authorization');
        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            return Response.json(
                { error: 'Unauthorized: Missing or invalid token' },
                { status: 401 }
            );
        }

        const userResponse = await axios.get(`${process.env.EXPO_PUBLIC_API_BASE_URL}/users/getUserName`, {
            headers: await applyHeaders(request)
        })

        return Response.json(userResponse.data)

    } catch (error) {
        console.log("getUserName error",error)
        return Response.json({ error: 'Failed to fetch user name' }, { status: 500 })
    }
}

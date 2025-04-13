

export const applyHeaderStyles = async (request: Request) => {
    return {
        ...request.headers,
        'Authorization': request.headers.get('Authorization'),
        'X-Country': request.headers.get('x-vercel-ip-country'),
        'X-Region': request.headers.get('x-vercel-ip-city'),
        'X-Forwarded-For': request.headers.get('x-vercel-forwarded-for'),
    };
}
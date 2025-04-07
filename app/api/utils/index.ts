

export const applyHeaderStyles = async (request: Request) => {
    return {
        ...request.headers
    };
}
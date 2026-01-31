// HeyGen Voice Proxy
// This function proxies voice lists from HeyGen

export default async (req, context) => {
    // Only allow GET requests
    if (req.method !== 'GET') {
        return new Response(JSON.stringify({ error: 'Method not allowed' }), {
            status: 405,
            headers: { 'Content-Type': 'application/json' },
        });
    }

    // Get API key from request headers
    const apiKey = req.headers.get('X-Api-Key');
    if (!apiKey) {
        return new Response(JSON.stringify({ error: 'Missing API Key' }), {
            status: 401,
            headers: { 'Content-Type': 'application/json' },
        });
    }

    try {
        // Fetch voices from HeyGen
        const response = await fetch('https://api.heygen.com/v2/voices', {
            method: 'GET',
            headers: {
                'X-Api-Key': apiKey,
                'accept': 'application/json'
            }
        });

        const data = await response.json();

        return new Response(JSON.stringify(data), {
            status: response.status,
            headers: {
                'Content-Type': 'application/json',
                'Cache-Control': 'public, max-age=3600' // Cache for 1 hour
            },
        });
    } catch (error) {
        console.error('Voice proxy error:', error);
        return new Response(JSON.stringify({ error: 'Failed to fetch voices', message: error.message }), {
            status: 500,
            headers: { 'Content-Type': 'application/json' },
        });
    }
};

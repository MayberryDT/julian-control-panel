// HeyGen Photo Upload Proxy
// This function proxies photo uploads to HeyGen's API securely

export default async (req, context) => {
    // Only allow POST requests
    if (req.method !== 'POST') {
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
        // Get the file content from the request body
        const fileBuffer = await req.arrayBuffer();
        const contentType = req.headers.get('Content-Type') || 'application/octet-stream';

        // Upload to HeyGen
        const heygenResponse = await fetch('https://api.heygen.com/v2/photo/upload', {
            method: 'POST',
            headers: {
                'X-Api-Key': apiKey,
                'Content-Type': contentType,
            },
            body: fileBuffer,
        });

        const responseData = await heygenResponse.json();

        if (!heygenResponse.ok) {
            return new Response(JSON.stringify(responseData), {
                status: heygenResponse.status,
                headers: { 'Content-Type': 'application/json' },
            });
        }

        return new Response(JSON.stringify(responseData), {
            status: 200,
            headers: { 'Content-Type': 'application/json' },
        });
    } catch (error) {
        console.error('Upload proxy error:', error);
        return new Response(
            JSON.stringify({ error: 'Upload failed', message: error.message }),
            {
                status: 500,
                headers: { 'Content-Type': 'application/json' },
            }
        );
    }
};

export const config = {
    path: '/api/upload',
};

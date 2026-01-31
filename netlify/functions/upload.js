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
        // Get content type to determine how to parse the body
        const contentType = req.headers.get('Content-Type') || '';

        let fileBuffer;
        let fileContentType = 'application/octet-stream';

        if (contentType.includes('multipart/form-data')) {
            // Parse FormData
            const formData = await req.formData();
            const file = formData.get('file');

            if (!file) {
                return new Response(JSON.stringify({ error: 'No file provided in form data' }), {
                    status: 400,
                    headers: { 'Content-Type': 'application/json' },
                });
            }

            // Get file data
            fileBuffer = await file.arrayBuffer();
            fileContentType = file.type || 'application/octet-stream';
        } else {
            // Direct binary upload
            fileBuffer = await req.arrayBuffer();
            fileContentType = contentType || 'application/octet-stream';
        }

        if (!fileBuffer || fileBuffer.byteLength === 0) {
            return new Response(JSON.stringify({ error: 'Empty file' }), {
                status: 400,
                headers: { 'Content-Type': 'application/json' },
            });
        }

        console.log('Uploading file to HeyGen, size:', fileBuffer.byteLength, 'type:', fileContentType);

        // Upload to HeyGen
        const heygenResponse = await fetch('https://api.heygen.com/v2/photo/upload', {
            method: 'POST',
            headers: {
                'X-Api-Key': apiKey,
                'Content-Type': fileContentType,
            },
            body: fileBuffer,
        });

        const responseText = await heygenResponse.text();
        console.log('HeyGen response:', heygenResponse.status, responseText);

        let responseData;
        try {
            responseData = JSON.parse(responseText);
        } catch (e) {
            return new Response(JSON.stringify({
                error: 'Invalid response from HeyGen',
                details: responseText.substring(0, 200)
            }), {
                status: 502,
                headers: { 'Content-Type': 'application/json' },
            });
        }

        return new Response(JSON.stringify(responseData), {
            status: heygenResponse.status,
            headers: { 'Content-Type': 'application/json' },
        });
    } catch (error) {
        console.error('Upload proxy error:', error);
        return new Response(
            JSON.stringify({
                error: 'Upload failed',
                message: error.message,
                stack: error.stack
            }),
            {
                status: 500,
                headers: { 'Content-Type': 'application/json' },
            }
        );
    }
};

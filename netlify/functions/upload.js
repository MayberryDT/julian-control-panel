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
        let fileContentType;

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

            // Get file data as ArrayBuffer
            fileBuffer = await file.arrayBuffer();
            fileContentType = file.type;

            console.log('FormData upload - file.type:', file.type, 'file.name:', file.name);
        } else {
            // Direct binary upload
            fileBuffer = await req.arrayBuffer();
            fileContentType = contentType;
        }

        if (!fileBuffer || fileBuffer.byteLength === 0) {
            return new Response(JSON.stringify({ error: 'Empty file' }), {
                status: 400,
                headers: { 'Content-Type': 'application/json' },
            });
        }

        // Detect actual file type from magic bytes if MIME type is missing or generic
        const uint8 = new Uint8Array(fileBuffer);
        let detectedType = fileContentType;

        // Check magic bytes
        if (uint8[0] === 0x89 && uint8[1] === 0x50 && uint8[2] === 0x4E && uint8[3] === 0x47) {
            detectedType = 'image/png';
        } else if (uint8[0] === 0xFF && uint8[1] === 0xD8 && uint8[2] === 0xFF) {
            detectedType = 'image/jpeg';
        } else if (uint8[0] === 0x47 && uint8[1] === 0x49 && uint8[2] === 0x46) {
            detectedType = 'image/gif';
        } else if (uint8[0] === 0x52 && uint8[1] === 0x49 && uint8[2] === 0x46 && uint8[3] === 0x46) {
            detectedType = 'image/webp';
        }

        console.log('Original type:', fileContentType, 'Detected type:', detectedType, 'Size:', fileBuffer.byteLength);

        // Use detected type
        fileContentType = detectedType || 'image/jpeg';

        // Upload to HeyGen - CORRECT endpoint: upload.heygen.com/v1/asset
        const heygenResponse = await fetch('https://upload.heygen.com/v1/asset', {
            method: 'POST',
            headers: {
                'X-Api-Key': apiKey,
                'Content-Type': fileContentType,
            },
            body: fileBuffer,
        });

        const responseText = await heygenResponse.text();
        console.log('HeyGen response status:', heygenResponse.status);
        console.log('HeyGen response body:', responseText.substring(0, 500));

        let responseData;
        try {
            responseData = JSON.parse(responseText);
        } catch (e) {
            return new Response(JSON.stringify({
                error: 'Invalid response from HeyGen',
                details: responseText.substring(0, 500),
                status: heygenResponse.status
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
                message: error.message
            }),
            {
                status: 500,
                headers: { 'Content-Type': 'application/json' },
            }
        );
    }
};

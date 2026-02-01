# Julian Control Panel v2 (Secure Client)

A secure, client-side-only interface for generating HeyGen videos.

## Security Model (Zero-Knowledge)

This application has been refactored to ensure **Local Sovereignty**:

- **No Backend**: All API calls originate directly from your browser to `api.heygen.com`.
- **Key Storage**: Your API Key is stored only in browser memory (or encrypted in LocalStorage if "Remember Me" is enabled).
- **Transparency**: The bottom of the screen features a live "Transparency Log" showing exactly what network requests are being made in real-time.

## Usage

1. **Enter Key**: Paste your HeyGen API Key (Enterprise/Trial) into the gate.
2. **Verify**: Watch the Transparency Log confirm your key functionality.
3. **Generate**: Drag & drop your avatar photo and enter your script.

## Development

```bash
# Install dependencies
npm install

# Start local dev server
npm run dev
```

## Deployment (Netlify)

This project requires **Netlify Headers** for security hardening. The `netlify.toml` file includes a strict Content Security Policy (CSP) that blocks all connections except to HeyGen.

```toml
# CSP Example
Content-Security-Policy = "default-src 'self'; connect-src 'self' https://api.heygen.com ..."
```

# Julian Control Panel

A browser-based control panel for generating HeyGen avatar videos through a direct client-side workflow.

## Why It Exists

Julian began as an experiment in AI media production: how quickly can a small operator move from scripts and persona ideas to repeatable avatar-video generation without building a heavy backend first?

The project is useful as a proof point for Tyler's AI-tooling experience: working with API-driven media generation, designing a focused operator interface, and thinking through the privacy/security boundaries around third-party AI services.

## What It Shows

- Practical use of the HeyGen API and avatar-video workflows.
- Client-side interface design for an AI media operator.
- Drag-and-drop input flow for avatar/source assets.
- Transparent request logging so the user can see what the tool is doing.
- Security-minded handling of API keys without storing them on a server.

## Security Model

The app was designed around local sovereignty:

- No custom backend is required for the primary workflow.
- API calls originate from the browser to HeyGen.
- API keys are entered by the user and are not committed to the repo.
- Netlify headers / Content Security Policy are used for deployment hardening.

## Status

Portfolio / prototype artifact. It demonstrates AI media workflow design and API integration more than commercial traction.

## Development

```bash
npm install
npm run dev
```

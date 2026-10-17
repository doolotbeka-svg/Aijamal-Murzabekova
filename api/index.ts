import { createApiApp } from '../src/server/app.js';

// Vercel serverless entry: vercel.json rewrites every /api/* request here (server.ts is used only locally)
export default createApiApp();

// Local / container entry point. On Vercel the API runs from api/index.ts instead.
import 'dotenv/config';
import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import { createApiApp, adminPasswordConfigured } from './src/server/app.ts';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const port = Number(process.env.PORT) || 3000;

async function startServer() {
  const app = createApiApp();

  if (process.env.NODE_ENV !== 'production') {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const dist = path.resolve(__dirname, 'dist');
    app.use(express.static(dist, { index: false, maxAge: '7d' }));
    app.get('*', (_req, res) => {
      res.sendFile(path.join(dist, 'index.html'));
    });
  }

  if (!adminPasswordConfigured) {
    console.warn('⚠️  ADMIN_PASSWORD не задан — вход в админ-панель (/#admin) будет недоступен.');
  }

  app.listen(port, '0.0.0.0', () => {
    console.log(`Teacher Portfolio App listening at http://localhost:${port} (admin: /#admin)`);
  });
}

startServer();

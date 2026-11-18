import { defineConfig, Plugin } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';
import path from 'path';
import { handleSyncRequest } from './sync-server.js';

function syncBridgePlugin(): Plugin {
  return {
    name: 'sync-bridge-plugin',
    configureServer(server) {
      server.middlewares.use(async (req, res, next) => {
        if (req.url && req.url.startsWith('/api/')) {
          const port = server.config.server.port || 5173;
          const handled = await handleSyncRequest(req, res, port);
          if (handled) return;
        }
        next();
      });
    },
  };
}

export default defineConfig({
  plugins: [react(), tailwindcss(), syncBridgePlugin()],
  server: {
    host: true, // Listen on 0.0.0.0 so phone can connect over Wi-Fi
    port: 5173,
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
});

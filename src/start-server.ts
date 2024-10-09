#!/usr/bin/env node

import { serve } from '@hono/node-server';
import { createNodeWebSocket } from '@hono/node-ws';
import app from './index';
import { realTimeHandler } from './handlers/realtimeHandler';

// Extract the port number from the command line arguments
const defaultPort = 8787;
const args = process.argv.slice(2);
const portArg = args.find((arg) => arg.startsWith('--port='));
const port = portArg ? parseInt(portArg.split('=')[1]) : defaultPort;

const { injectWebSocket, upgradeWebSocket } = createNodeWebSocket({ app });

app.get('/v1/realtime', upgradeWebSocket(realTimeHandler));

const server = serve({
  fetch: app.fetch,
  port: port,
});

injectWebSocket(server);
console.log(`Your AI Gateway is now running on http://localhost:${port} 🚀`);

import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { StreamableHTTPServerTransport } from '@modelcontextprotocol/sdk/server/streamableHttp.js';
import { createMcpExpressApp } from '@modelcontextprotocol/sdk/server/express.js';
import type { Request, Response } from 'express';

import { GarminClient } from './client';
import {
  registerActivityTools,
  registerHealthTools,
  registerTrendTools,
  registerSleepTools,
  registerBodyTools,
  registerPerformanceTools,
  registerProfileTools,
  registerRangeTools,
  registerSnapshotTools,
  registerTrainingTools,
  registerWellnessTools,
  registerChallengeTools,
  registerWriteTools,
} from './tools';

const GARMIN_EMAIL = process.env.GARMIN_EMAIL;
const GARMIN_PASSWORD = process.env.GARMIN_PASSWORD;

if (!GARMIN_EMAIL || !GARMIN_PASSWORD) {
  console.error(
    'Error: GARMIN_EMAIL and GARMIN_PASSWORD environment variables are required.\n' +
      'Set them in your hosting provider.'
  );
  process.exit(1);
}

function buildServer() {
  const server = new McpServer({
    name: 'garmin-connect-mcp',
    version: '1.1.0',
  });

  const client = new GarminClient(GARMIN_EMAIL!, GARMIN_PASSWORD!);

  registerActivityTools(server, client);
  registerHealthTools(server, client);
  registerTrendTools(server, client);
  registerSleepTools(server, client);
  registerBodyTools(server, client);
  registerPerformanceTools(server, client);
  registerProfileTools(server, client);
  registerRangeTools(server, client);
  registerSnapshotTools(server, client);
  registerTrainingTools(server, client);
  registerWellnessTools(server, client);
  registerChallengeTools(server, client);
  registerWriteTools(server, client);

  return server;
}

async function main() {
  const app = createMcpExpressApp({ host: '0.0.0.0' });
  const PORT = Number(process.env.PORT ?? 3000);

  app.post('/mcp', async (req: Request, res: Response) => {
    const server = buildServer();

    try {
      const transport = new StreamableHTTPServerTransport({
        sessionIdGenerator: undefined,
      });

      await server.connect(transport);
      await transport.handleRequest(req, res, req.body);

      res.on('close', () => {
        transport.close();
        server.close();
      });
    } catch (err) {
      console.error('Error handling MCP request:', err);
      if (!res.headersSent) {
        res.status(500).json({
          jsonrpc: '2.0',
          error: { code: -32603, message: 'Internal server error' },
          id: null,
        });
      }
    }
  });

  app.get('/health', (_req: Request, res: Response) => {
    res.status(200).send('ok');
  });

  app.listen(PORT, (err?: unknown) => {
    if (err) {
      console.error('Failed to start server:', err);
      process.exit(1);
    }
    console.log(`Garmin Connect MCP (HTTP) listening on :${PORT}`);
    console.log(`MCP endpoint: http://localhost:${PORT}/mcp`);
  });
}

main().catch((e) => {
  console.error('Fatal error starting server:', e);
  process.exit(1);
});

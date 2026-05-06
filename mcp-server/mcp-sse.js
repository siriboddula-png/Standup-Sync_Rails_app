const { randomUUID } = require('node:crypto');
const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const { McpServer } = require('@modelcontextprotocol/sdk/server/mcp.js');
const { SSEServerTransport } = require('@modelcontextprotocol/sdk/server/sse.js');
const { StreamableHTTPServerTransport } = require('@modelcontextprotocol/sdk/server/streamableHttp.js');
const { isInitializeRequest } = require('@modelcontextprotocol/sdk/types.js');
const z = require('zod/v4');
const tools = require('./tools');

const app = express();
const PORT = process.env.PORT || 3001;
const RAILS_API_URL = process.env.RAILS_API_URL || 'http://localhost:3000/api';
const SESSION_TTL_MS = Number(process.env.SESSION_TTL_MS || 60 * 60 * 1000);

const transports = {};
const appSessions = new Map();

app.use(cors());
app.use(bodyParser.json());

function zodForProperty(property, required) {
  let schema;

  switch (property.type) {
    case 'boolean':
      schema = z.boolean();
      break;
    case 'integer':
      schema = z.number().int();
      break;
    case 'number':
      schema = z.number();
      break;
    case 'array':
      schema = z.array(z.any());
      break;
    case 'object':
      schema = z.record(z.string(), z.any());
      break;
    case 'string':
    default:
      schema = z.string();
      break;
  }

  if (property.description) {
    schema = schema.describe(property.description);
  }

  return required ? schema : schema.optional();
}

function inputSchemaToZodShape(inputSchema) {
  const requiredFields = new Set(inputSchema.required || []);

  return Object.entries(inputSchema.properties || {}).reduce((shape, [name, property]) => {
    shape[name] = zodForProperty(property, requiredFields.has(name));
    return shape;
  }, {});
}

function getAppSession(mcpSessionId) {
  if (!mcpSessionId) return null;

  const session = appSessions.get(mcpSessionId);
  if (!session) return null;

  if (session.expires_at <= Date.now()) {
    appSessions.delete(mcpSessionId);
    return null;
  }

  session.last_seen_at = Date.now();
  session.expires_at = Date.now() + SESSION_TTL_MS;
  return session;
}

function saveAppSession(mcpSessionId, sessionData) {
  appSessions.set(mcpSessionId, {
    ...sessionData,
    created_at: Date.now(),
    last_seen_at: Date.now(),
    expires_at: Date.now() + SESSION_TTL_MS
  });
}

function removeSession(sessionId) {
  if (transports[sessionId]) {
    delete transports[sessionId];
  }
  appSessions.delete(sessionId);
}

function createMcpServer() {
  const server = new McpServer({
    name: 'standup-sync',
    version: '1.0.0'
  }, {
    instructions: [
      'Use these tools for Standup Sync user and standup operations.',
      'Do not inspect Rails models, run Rails console, create Ruby scripts, or query the database directly for standup answers.',
      'All data access must go through the registered MCP tools, which call the Rails API configured by RAILS_API_URL.',
      'The user must login with the login tool before using authenticated tools.',
      'Default standup searches are scoped to the logged-in user; team-wide results are read-only and must be explicitly requested.'
    ].join(' ')
  });

  tools.forEach(tool => {
    server.registerTool(tool.name, {
      description: tool.description,
      inputSchema: inputSchemaToZodShape(tool.inputSchema)
    }, async (args, extra) => {
      const mcpSessionId = extra.sessionId;
      const appSession = getAppSession(mcpSessionId);

      if (tool.requiresAuth && !appSession) {
        return {
          isError: true,
          content: [{
            type: 'text',
            text: 'Please login first using the login tool. Your Standup Sync session is separate from your browser session.'
          }]
        };
      }

      try {
        const result = await tool.execute(args || {}, RAILS_API_URL, appSession);

        if (result.session_id) {
          saveAppSession(mcpSessionId, result.session_data);
        }

        if (result.logout && mcpSessionId) {
          appSessions.delete(mcpSessionId);
        }

        return {
          content: [{
            type: 'text',
            text: result.message || JSON.stringify(result.data, null, 2)
          }]
        };
      } catch (error) {
        return {
          isError: true,
          content: [{
            type: 'text',
            text: error.message
          }]
        };
      }
    });
  });

  return server;
}

app.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    message: 'Standup Sync MCP SSE server is running',
    rails_api: RAILS_API_URL,
    session_ttl_seconds: Math.round(SESSION_TTL_MS / 1000),
    transports: {
      sse: '/sse',
      streamable_http: '/mcp',
      messages: '/messages'
    },
    tools_count: tools.length
  });
});

function getPublicBaseUrl(req) {
  return process.env.MCP_PUBLIC_URL || `${req.protocol}://${req.get('host')}`;
}

async function handleSseConnection(req, res) {
  const transport = new SSEServerTransport(`${getPublicBaseUrl(req)}/messages`, res);
  transports[transport.sessionId] = transport;

  res.on('close', () => {
    removeSession(transport.sessionId);
  });

  await createMcpServer().connect(transport);
}

app.all('/mcp', async (req, res) => {
  try {
    const sessionId = req.headers['mcp-session-id'];
    let transport;

    if (sessionId && transports[sessionId] instanceof StreamableHTTPServerTransport) {
      transport = transports[sessionId];
    } else if (!sessionId && req.method === 'POST' && isInitializeRequest(req.body)) {
      transport = new StreamableHTTPServerTransport({
        sessionIdGenerator: () => randomUUID(),
        onsessioninitialized: initializedSessionId => {
          transports[initializedSessionId] = transport;
        }
      });

      transport.onclose = () => {
        if (transport.sessionId) {
          removeSession(transport.sessionId);
        }
      };

      await createMcpServer().connect(transport);
    } else {
      res.status(400).json({
        jsonrpc: '2.0',
        error: {
          code: -32000,
          message: 'Bad Request: No valid MCP session ID provided'
        },
        id: null
      });
      return;
    }

    await transport.handleRequest(req, res, req.body);
  } catch (error) {
    console.error('MCP streamable HTTP error:', error);
    if (!res.headersSent) {
      res.status(500).json({
        jsonrpc: '2.0',
        error: {
          code: -32603,
          message: 'Internal server error'
        },
        id: null
      });
    }
  }
});

app.get('/', handleSseConnection);
app.get('/sse', handleSseConnection);

app.post('/messages', async (req, res) => {
  const sessionId = req.query.sessionId;
  const transport = transports[sessionId];

  if (!(transport instanceof SSEServerTransport)) {
    res.status(400).send('No SSE transport found for sessionId');
    return;
  }

  await transport.handlePostMessage(req, res, req.body);
});

app.listen(PORT, () => {
  console.log('');
  console.log(' ========================================');
  console.log('  Standup Sync MCP SSE Server');
  console.log(' ========================================');
  console.log(` Server running on: http://localhost:${PORT}`);
  console.log(` SSE endpoint: http://localhost:${PORT}/sse`);
  console.log(` Streamable HTTP endpoint: http://localhost:${PORT}/mcp`);
  console.log(` Rails API: ${RAILS_API_URL}`);
  console.log(` Session TTL: ${Math.round(SESSION_TTL_MS / 1000)}s`);
  console.log(` Tools available: ${tools.length}`);
  console.log('');
});

process.on('SIGINT', async () => {
  for (const sessionId of Object.keys(transports)) {
    await transports[sessionId].close();
    removeSession(sessionId);
  }
  process.exit(0);
});

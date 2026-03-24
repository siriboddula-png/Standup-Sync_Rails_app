const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const tools = require('./tools');

const app = express();
const PORT = 3001;
const RAILS_API_URL = 'http://localhost:3000/api';

const sessions = new Map();

app.use(cors());
app.use(bodyParser.json());

app.use((req, res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.path}`);
  next();
});

app.get('/health', (req, res) => {
  res.json({ 
    status: 'ok', 
    message: 'MCP Server is running',
    rails_api: RAILS_API_URL,
    tools_count: tools.length
  });
});

app.get('/mcp/tools/list', (req, res) => {
  console.log('Tool discovery requested');
  res.json({
    tools: tools.map(tool => ({
      name: tool.name,
      description: tool.description,
      inputSchema: tool.inputSchema
    }))
  });
});

app.post('/mcp/tools/call', async (req, res) => {
  const { name, arguments: args, session_id } = req.body;
  
  console.log(`Tool call: ${name}`);
  console.log(`Arguments:`, JSON.stringify(args, null, 2));
  if (session_id) console.log(`Session ID:`, session_id);
  
  const tool = tools.find(t => t.name === name);
  
  if (!tool) {
    console.error(`Tool not found: ${name}`);
    return res.status(404).json({
      error: 'Tool not found',
      available_tools: tools.map(t => t.name)
    });
  }
  
  const session = session_id ? sessions.get(session_id) : null;
  
  if (tool.requiresAuth && !session) {
    return res.status(401).json({
      error: 'Authentication required',
      message: 'Please login first to use this tool',
      content: [{
        type: 'text',
        text: 'Please login first using the login tool. You need to be authenticated to perform this action.'
      }]
    });
  }
  
  try {
    const result = await tool.execute(args, RAILS_API_URL, session);
    
    if (result.session_id) {
      sessions.set(result.session_id, result.session_data);
      console.log(`Session created: ${result.session_id}`);
    }
    
    if (result.logout && session_id) {
      sessions.delete(session_id);
      console.log(`Session deleted: ${session_id}`);
    }
    
    console.log(`Tool executed successfully`);
    
    res.json({
      content: [
        {
          type: 'text',
          text: result.message || JSON.stringify(result.data, null, 2)
        }
      ],
      data: result.data,
      session_id: result.session_id,
      logged_out: result.logout || false
    });
  } catch (error) {
    console.error(`Tool execution failed:`, error.message);
    
    res.status(error.response?.status || 500).json({
      error: error.message,
      details: error.response?.data || null,
      content: [{
        type: 'text',
        text: error.message
      }]
    });
  }
});

app.listen(PORT, () => {
  console.log('');
  console.log(' ========================================');
  console.log('  MCP Server for Standup Sync');
  console.log(' ========================================');
  console.log(` Server running on: http://localhost:${PORT}`);
  console.log(` Rails API: ${RAILS_API_URL}`);
  console.log(` Tools available: ${tools.length}`);
  console.log('');
  console.log(' Endpoints:');
  console.log('   GET  /health              - Health check');
  console.log('   GET  /mcp/tools/list      - List all tools');
  console.log('');
  console.log(' Available Tools:');
  tools.forEach(tool => {
    const authBadge = tool.requiresAuth ? '[AUTH REQUIRED]' : '';
    console.log(`   - ${tool.name.padEnd(20)} ${authBadge} ${tool.description}`);
  });
  console.log('');
  console.log(' Ready to receive requests from Augment!');
  console.log('========================================');
});
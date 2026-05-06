require('dotenv').config();
const express = require('express');
const cors = require('cors');
const { createStandupAgent } = require('./mastra-config');

const app = express();
app.use(cors());
app.use(express.json());

const OPENAI_API_KEY = process.env.OPENAI_API_KEY;
const OPENAI_MODEL = process.env.OPENAI_MODEL || 'gpt-4o-mini';
const RAILS_API_URL = process.env.RAILS_API_URL || 'http://localhost:3000/api';

if (!OPENAI_API_KEY) {
  console.error('OPENAI_API_KEY is not set in .env file');
  process.exit(1);
}

// Store sessions and their corresponding agents
let sessions = {};
let agents = {};

// Helper function to format standup data for display
function formatStandupResponse(result) {
  if (!result.success) {
    return result.message || `Sorry, I encountered an error: ${result.error}`;
  }

  // Handle standups array
  if (result.standups && Array.isArray(result.standups)) {
    const standups = result.standups;

    if (standups.length === 0) {
      return result.message || 'No standups found.';
    }

    let response = `Found ${standups.length} standup(s):\n\n`;
    standups.slice(0, 10).forEach((standup, index) => {
      const userName = standup.user ? `${standup.user.first_name} ${standup.user.last_name}` : standup.name;
      response += `${index + 1}. ${standup.standup_date} - ${userName} (ID: ${standup.id})\n`;
      response += `   Done: ${standup.done}\n`;
      response += `   Doing: ${standup.doing}\n`;
      response += `   Blockers: ${standup.blockers || 'None'}\n\n`;
    });

    if (standups.length > 10) {
      response += `... and ${standups.length - 10} more standups.`;
    }

    return response.trim();
  }

  // Handle blockers array
  if (result.blockers && Array.isArray(result.blockers)) {
    const blockers = result.blockers;
    let response = `Found ${blockers.length} standup(s) with blockers:\n\n`;
    blockers.slice(0, 10).forEach((standup, index) => {
      const userName = standup.user ? `${standup.user.first_name} ${standup.user.last_name}` : standup.name;
      response += `${index + 1}. ${standup.standup_date} - ${userName}\n`;
      response += `   Blocker: ${standup.blockers}\n`;
      response += `   Doing: ${standup.doing}\n\n`;
    });
    return response.trim();
  }

  // Handle single standup
  if (result.standup) {
    const s = result.standup;
    return `${result.message}\n\nStandup Details:\n` +
           `Date: ${s.standup_date}\n` +
           `Done: ${s.done}\n` +
           `Doing: ${s.doing}\n` +
           `Blockers: ${s.blockers || 'None'}`;
  }

  return result.message || JSON.stringify(result, null, 2);
}

app.post('/api/chatbot/message', async (req, res) => {
  const { message, sessionId, user_id } = req.body;

  if (!message || !sessionId) {
    return res.status(400).json({ error: 'Message and sessionId are required' });
  }

  try {
    // Get session or use provided user_id
    const session = sessions[sessionId] || { user_id };

    if (!session || !session.user_id) {
      return res.json({
        reply: "Please login from the main dashboard to use the chatbot.",
        requiresAuth: true
      });
    }

    // Get or create agent for this session
    if (!agents[sessionId]) {
      console.log(`Creating new Mastra agent for session: ${sessionId}`);
      agents[sessionId] = createStandupAgent(session);
    }

    const agent = agents[sessionId];

    console.log(`Processing message: "${message}"`);

    // Use Mastra agent to generate response
    const result = await agent.generate(message, {
      resourceId: sessionId,
      apiKey: OPENAI_API_KEY,
    });

    console.log('Mastra agent result:', JSON.stringify(result, null, 2));

    // Extract the response text
    const agentResponse = result.text || result.content || 'I apologize, but I was unable to process your request.';

    // Check if any tools were called (for determining refresh)
    // Mastra structure: toolCalls array contains objects with { payload: { toolName: "..." } }
    const toolsCalled = result.toolCalls || [];
    const toolNames = toolsCalled.map(tc => tc.payload?.toolName || tc.toolName || tc.name).filter(Boolean);

    const writeOperations = ['createStandup', 'updateStandupByDate', 'deleteStandup', 'deleteStandupByDate', 'updateStandup'];
    const shouldRefresh = toolNames.some(name => writeOperations.includes(name));

    console.log('Sending response:', {
      toolsCalled: toolNames,
      shouldRefresh: shouldRefresh,
      responseLength: agentResponse.length
    });

    res.json({
      reply: agentResponse,
      data: result,
      requiresAuth: false,
      shouldRefresh: shouldRefresh,
      toolsCalled: toolNames
    });

  } catch (error) {
    console.error('Chatbot error:', error);
    res.status(500).json({
      reply: "Sorry, I encountered an error processing your request.",
      error: error.message
    });
  }
});

app.post('/api/chatbot/session', async (req, res) => {
  const { sessionId, user_id, email } = req.body;

  if (!sessionId || !user_id) {
    return res.status(400).json({ error: 'sessionId and user_id are required' });
  }

  sessions[sessionId] = {
    user_id,
    email
  };

  console.log('Session created:', sessions[sessionId]);

  res.json({
    success: true,
    message: 'Session created successfully'
  });
});

const PORT = process.env.PORT || 3002;
app.listen(PORT, async () => {
  console.log(`
╔═══════════════════════════════════════════════════════════╗
║      Standup Sync Chatbot Server with Mastra AI          ║
╚═══════════════════════════════════════════════════════════╝
  `);
  console.log(`Server running on: http://localhost:${PORT}`);
  console.log(`AI Framework: Mastra`);
  console.log(`Model: ${OPENAI_MODEL}`);
  console.log(`API Key configured: ${OPENAI_API_KEY ? 'Yes ✓' : 'No ✗'}`);
  console.log(`Rails API: ${RAILS_API_URL}`);
  console.log('');

  if (OPENAI_API_KEY) {
    console.log('Ready to process chatbot requests using Mastra + OpenAI');
  } else {
    console.error('OPENAI_API_KEY not set. Check your .env file.');
  }
});
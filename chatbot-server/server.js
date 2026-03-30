require('dotenv').config();
const express = require('express');
const axios = require('axios');
const cors = require('cors');
const tools = require('./chatbot-tools');

const app = express();
app.use(cors());
app.use(express.json());

const OPENAI_API_KEY = process.env.OPENAI_API_KEY;
const OPENAI_MODEL = process.env.OPENAI_MODEL || 'gpt-4o-mini';
const OPENAI_API_URL = process.env.OPENAI_API_URL || 'https://api.openai.com/v1';
const RAILS_API_URL = process.env.RAILS_API_URL || 'http://localhost:3000/api';

if (!OPENAI_API_KEY) {
  console.error('OPENAI_API_KEY is not set in .env file');
  process.exit(1);
}

let sessions = {};

// Build system prompt dynamically from tools
function buildSystemPrompt() {
  const today = new Date();
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);

  // Format dates
  const todayStr = today.toISOString().split('T')[0];
  const yesterdayStr = yesterday.toISOString().split('T')[0];
  const tomorrowStr = tomorrow.toISOString().split('T')[0];

  const toolDescriptions = tools.map(tool => {
    const params = Object.entries(tool.parameters)
      .map(([key, desc]) => `    ${key}: ${desc}`)
      .join('\n');
    return `- ${tool.name}: ${tool.description}\n  Parameters:\n${params}`;
  }).join('\n\n');

  return `You are a helpful standup assistant for Standup Sync, a team collaboration tool.

CONTEXT: Standup Sync is a Rails application where teams track their daily standups. Each standup has:
- done: What was completed
- doing: What is currently being worked on
- blockers: Any impediments or issues
- standup_date: The date of the standup
- user: The team member who created it

CURRENT DATE: ${todayStr}

You have access to the following tools to help users:

${toolDescriptions}

CRITICAL RULES - YOU MUST FOLLOW THESE EXACTLY:
1. Your response MUST be ONLY a single JSON object. Nothing else.
2. Format: {"function": "function_name", "parameters": {"param1": "value1"}}
3. NO explanations, NO code, NO markdown, NO extra text - ONLY the JSON object.
4. Choose the most appropriate function based on the user's intent.
5. If a parameter is optional and not mentioned, omit it from parameters.
6. Stay within Standup Sync context - only standup management operations.

EXAMPLES:

User: "Show standups for Sara"
Response: {"function": "search_standups", "parameters": {"user_name": "Sara", "days": 30}}

User: "Get insights for John"
Response: {"function": "get_user_insights", "parameters": {"user_name": "John"}}

User: "Show my standups"
Response: {"function": "get_my_standups", "parameters": {"days": 7}}

User: "Show all blockers"
Response: {"function": "get_blockers", "parameters": {}}

User: "Show standup with ID 341"
Response: {"function": "get_standup_by_id", "parameters": {"standup_id": 341}}

User: "Show standups for today"
Response: {"function": "find_standup_by_date", "parameters": {"date": "${todayStr}"}}

User: "Show my standup for yesterday"
Response: {"function": "find_standup_by_date", "parameters": {"date": "${yesterdayStr}"}}

User: "Find standups mentioning authentication"
Response: {"function": "find_standup_by_content", "parameters": {"keywords": "authentication"}}

User: "Search for standups about bug fixes"
Response: {"function": "find_standup_by_content", "parameters": {"keywords": "bug fix"}}

User: "Create a standup: done - Fixed bug, doing - Testing feature"
Response: {"function": "create_standup", "parameters": {"done": "Fixed bug", "doing": "Testing feature"}}

User: "Update standup 341 doing to Working on new feature"
Response: {"function": "update_standup", "parameters": {"standup_id": 341, "doing": "Working on new feature"}}

User: "Update my standup for today doing to Working on dashboard"
Response: {"function": "update_standup_by_date", "parameters": {"date": "${todayStr}", "doing": "Working on dashboard"}}

User: "Add a blocker to my standup created today"
Response: {"function": "update_standup_by_date", "parameters": {"date": "${todayStr}", "blockers": "user's blocker text"}}

User: "Update today's standup blockers to Database connection issues"
Response: {"function": "update_standup_by_date", "parameters": {"date": "${todayStr}", "blockers": "Database connection issues"}}

User: "Delete standup 338"
Response: {"function": "delete_standup", "parameters": {"standup_id": 338}}

User: "Delete my standup for yesterday"
Response: {"function": "delete_standup_by_date", "parameters": {"date": "${yesterdayStr}"}}

User: "Show my standups this week"
Response: {"function": "search_standups", "parameters": {"my_standups_only": true, "days": 7}}

IMPORTANT DATE HANDLING:
- "today" = current date (${todayStr})
- "yesterday" = current date - 1 day (${yesterdayStr})
- "tomorrow" = current date + 1 day (${tomorrowStr})
- "this week" = use search_standups with days: 7
- "last week" = use search_standups with appropriate date range
- ALWAYS convert relative dates to YYYY-MM-DD format using the CURRENT DATE above (${todayStr})
- Use find_standup_by_date when user mentions ONE specific date (e.g., "today", "March 20")
- Use search_standups when user mentions DATE RANGES (e.g., "this week", "last 3 days")
- Use find_standup_by_content when user wants to search by keywords/topics
- Use update_standup_by_date when user wants to update standup for a specific date (e.g., "today", "yesterday")
- When user says "add blocker to today's standup" or "update today's standup", ALWAYS use update_standup_by_date with date="${todayStr}"
- For "delete standups this week": First use search_standups with my_standups_only=true to show the list, then user can specify which to delete by ID or date`;
}

const SYSTEM_PROMPT = buildSystemPrompt();

async function callOpenAI(prompt, isIntentDetection = false) {
  try {
    console.log(`>>> Calling OpenAI API: ${OPENAI_API_URL}/chat/completions`);
    console.log(`>>> Using Model: ${OPENAI_MODEL}`);

    const options = isIntentDetection ? {
      temperature: 0.1,
      max_tokens: 100
    } : {
      temperature: 0.7,
      max_tokens: 500
    };

    const response = await axios.post(
      `${OPENAI_API_URL}/chat/completions`,
      {
        model: OPENAI_MODEL,
        messages: [
          { role: 'user', content: prompt }
        ],
        ...options
      },
      {
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${OPENAI_API_KEY}`
        }
      }
    );

    console.log(`<<< OpenAI API Response received successfully`);
    console.log(`<<< Tokens used: ${response.data.usage?.total_tokens || 'N/A'}`);

    return response.data.choices[0].message.content;
  } catch (error) {
    console.error('OpenAI API error:', error.response?.data || error.message);
    throw error;
  }
}

function parseOpenAIResponse(response) {
  try {
    const jsonMatch = response.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      return JSON.parse(jsonMatch[0]);
    }
    return null;
  } catch (error) {
    console.error('Failed to parse OpenAI response:', error);
    return null;
  }
}

async function formatResponseWithOpenAI(functionResult, originalQuery) {
  if (functionResult.message) {
    return functionResult.message;
  }

  const prompt = `You are a helpful standup assistant. Format the following data into a friendly, conversational response for the user.

User asked: "${originalQuery}"

Data received:
${JSON.stringify(functionResult, null, 2)}

Provide a clear, friendly response with key insights. Use bullet points where appropriate. Keep it concise but informative.`;

  try {
    const response = await callOpenAI(prompt);
    return response;
  } catch (error) {
    return formatFallbackResponse(functionResult);
  }
}

function formatFallbackResponse(data) {
  if (data.success === false) {
    return `Sorry, I couldn't retrieve that information. ${data.error || data.message || ''}`;
  }

  if (data.standups) {
    return `Found ${data.count} standup(s):\n\n${data.standups.slice(0, 5).map(s =>
      `Date: ${s.standup_date}\nUser: ${s.user?.first_name} ${s.user?.last_name}\nDone: ${s.done}\nDoing: ${s.doing}\nBlockers: ${s.blockers}`
    ).join('\n\n')}`;
  }

  if (data.total_standups !== undefined) {
    return `User Insights:\n- Total standups: ${data.total_standups}\n- Standups with blockers: ${data.standups_with_blockers}\n- Blocker rate: ${data.blocker_rate}%\n- Most recent: ${data.most_recent_date}`;
  }

  if (data.blockers) {
    return `Found ${data.total_blockers} blocker(s):\n\n${data.blockers.slice(0, 5).map(b =>
      `${b.date} - ${b.user}: ${b.blocker}`
    ).join('\n')}`;
  }

  return JSON.stringify(data, null, 2);
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

    const prompt = `${SYSTEM_PROMPT}\n\nUser query: ${message}\n\nJSON response:`;

    const openAIResponse = await callOpenAI(prompt, true);
    console.log('OpenAI response:', openAIResponse);

    const parsedFunction = parseOpenAIResponse(openAIResponse);

    if (parsedFunction && parsedFunction.function) {
      console.log(`Executing function: ${parsedFunction.function}`, parsedFunction.parameters);

      const functionResult = await executeFunction(
        parsedFunction.function,
        parsedFunction.parameters || {},
        session
      );

      console.log('Function result:', JSON.stringify(functionResult, null, 2));

      if (functionResult.success === false) {
        console.error('Function failed:', functionResult.error);
        res.json({
          reply: functionResult.message || 'Sorry, I encountered an error processing your request.',
          data: functionResult,
          requiresAuth: false
        });
        return;
      }

      const formattedReply = await formatResponseWithOpenAI(functionResult, message);

      const writeOperations = ['create_standup', 'update_standup', 'delete_standup', 'update_standup_by_date', 'delete_standup_by_date'];
      const shouldRefresh = writeOperations.includes(parsedFunction.function) && functionResult.success;

      console.log('Sending response:', {
        function: parsedFunction.function,
        success: functionResult.success,
        shouldRefresh: shouldRefresh,
        isWriteOp: writeOperations.includes(parsedFunction.function)
      });

      res.json({
        reply: formattedReply,
        data: functionResult,
        requiresAuth: false,
        shouldRefresh: shouldRefresh,
        operationType: parsedFunction.function
      });
    } else {
      const fallbackPrompt = `You are a helpful standup assistant. The user said: "${message}". Provide a friendly, helpful response.`;
      const fallbackResponse = await callOpenAI(fallbackPrompt);

      res.json({
        reply: fallbackResponse,
        data: null,
        requiresAuth: false
      });
    }
  } catch (error) {
    console.error('Chatbot error:', error);
    res.status(500).json({
      reply: "Sorry, I encountered an error processing your request.",
      error: error.message
    });
  }
});

async function executeFunction(functionName, args, session) {
  // Find the tool
  const tool = tools.find(t => t.name === functionName);

  if (!tool) {
    console.error(`Unknown function: ${functionName}`);
    return {
      success: false,
      message: `Unknown function: ${functionName}. Available functions: ${tools.map(t => t.name).join(', ')}`,
      error: 'Unknown function'
    };
  }

  try {
    const result = await tool.execute(args, session);
    return result;
  } catch (error) {
    console.error(`Function execution failed:`, error.message);
    return {
      success: false,
      message: `Failed to execute ${functionName}: ${error.message}`,
      error: error.message
    };
  }
}

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
  console.log(`Chatbot server running on http://localhost:${PORT}`);
  console.log(`OpenAI API URL: ${OPENAI_API_URL}`);
  console.log(`OpenAI Model: ${OPENAI_MODEL}`);
  console.log(`API Key configured: ${OPENAI_API_KEY ? 'Yes' : 'No'}`);

  if (OPENAI_API_KEY) {
    console.log('Ready to process chatbot requests using OpenAI');
  } else {
    console.error('OPENAI_API_KEY not set. Check your .env file.');
  }
});
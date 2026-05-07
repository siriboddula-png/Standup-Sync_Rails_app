const { Agent } = require('@mastra/core');
const { z } = require('zod');
const chatbotTools = require('./chatbot-tools');

function camelCaseToolName(name) {
  return name.replace(/_([a-z])/g, (_, letter) => letter.toUpperCase());
}

function parameterSpecToZod(spec) {
  const normalized = String(spec || '').toLowerCase();
  const description = String(spec || '').split(' - ').slice(1).join(' - ') || String(spec || '');
  const isRequired = normalized.includes('(required)');

  let schema;
  if (normalized.startsWith('number')) {
    schema = z.number();
  } else if (normalized.startsWith('boolean')) {
    schema = z.boolean();
  } else {
    schema = z.string();
  }

  const defaultMatch = normalized.match(/default:\s*([^)]+)/);
  if (defaultMatch) {
    const defaultValue = defaultMatch[1].trim();
    if (normalized.startsWith('number')) {
      schema = schema.default(Number(defaultValue));
    } else if (normalized.startsWith('boolean')) {
      schema = schema.default(defaultValue === 'true');
    } else {
      schema = schema.default(defaultValue);
    }
  }

  schema = schema.describe(description);
  return isRequired ? schema : schema.optional();
}

function parametersToZodObject(parameters = {}) {
  return z.object(
    Object.entries(parameters).reduce((shape, [name, spec]) => {
      shape[name] = parameterSpecToZod(spec);
      return shape;
    }, {})
  );
}

function createMastraTools(sessionData) {
  return Object.fromEntries(
    chatbotTools.map(tool => [
      camelCaseToolName(tool.name),
      {
        description: tool.description,
        parameters: parametersToZodObject(tool.parameters),
        execute: async (inputData) => tool.execute(inputData || {}, sessionData),
      }
    ])
  );
}

// Create Mastra agent with tools
function createStandupAgent(sessionData) {
  const agent = new Agent({
    id: 'standup-sync-assistant',
    name: 'StandupSyncAssistant',
    instructions: `You are a helpful standup assistant for Standup Sync, a team collaboration tool.

CONTEXT: Standup Sync is a Rails application where teams track their daily standups. Each standup has:
- done: What was completed
- doing: What is currently being worked on
- blockers: Any impediments or issues
- standup_date: The date of the standup
- user: The team member who created it

CURRENT DATE: ${new Date().toISOString().split('T')[0]}

You help users manage their standups by:
1. Searching and filtering standups by user, date, content, or ownership
2. Creating new standup entries
3. Updating existing standups
4. Deleting standups
5. Getting insights and statistics
6. Finding blockers

Tool routing rules:
- For "my standups", use getMyStandups.
- By default, do not apply a date window. Only pass days, start_date, end_date, or a specific date when the user explicitly asks for a date range.
- For "all my standups", "irrespective of date", "all time", or "no date filter", use getMyStandups without a days value.
- For "standups created by <person>", "standups for <person>", or "show <person>'s standups", use searchStandups with user_name set to that person's name. Do not use getMyStandups for another person's standups.
- For "all standups created by <person>" or no date filter for a person, use searchStandups with user_name set to that person's name and no days value.
- For "insights for <person>", use getUserInsights with user_name set to that person's name and no days value unless the user explicitly asks for a time window.
- For explicit standup IDs, use getStandupById, updateStandup, or deleteStandup as appropriate.
- Non-owned standups are read-only unless a tool explicitly allows the requested operation.

Always be friendly, concise, and helpful. When displaying data, prefer the tool's message if one is returned, and format standups clearly with dates, users, IDs, done, doing, and blockers.`,

    model: `openai/${process.env.OPENAI_MODEL || 'gpt-4o-mini'}`,
    tools: createMastraTools(sessionData),
  });

  return agent;
}

module.exports = {
  createStandupAgent,
  createMastraTools,
  parametersToZodObject,
};

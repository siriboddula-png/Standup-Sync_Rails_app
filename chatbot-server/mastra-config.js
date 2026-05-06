const { Agent, ModelConfig } = require('@mastra/core');
const { z } = require('zod');
const axios = require('axios');

const RAILS_API_URL = process.env.RAILS_API_URL || 'http://localhost:3000/api';

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
1. Searching and filtering standups (by user, date, content)
2. Creating new standup entries
3. Updating existing standups
4. Deleting standups
5. Getting insights and statistics
6. Finding blockers

Always be friendly, concise, and helpful. When displaying data, format it clearly with bullet points or numbered lists.`,

    model: `openai/${process.env.OPENAI_MODEL || 'gpt-4o-mini'}`,
    
    tools: {
      searchStandups: {
        description: 'Search and filter standups. Can search by user name, date range, or keywords.',
        parameters: z.object({
          user_name: z.string().optional().describe('User first name, last name, or username'),
          start_date: z.string().optional().describe('Start date in YYYY-MM-DD format'),
          end_date: z.string().optional().describe('End date in YYYY-MM-DD format'),
          search_query: z.string().optional().describe('Text to search in done, doing, or blockers'),
          days: z.number().optional().default(30).describe('Number of days to look back'),
          my_standups_only: z.boolean().optional().describe('Only show logged-in user\'s standups'),
        }),
        execute: async (inputData, context) => {
          const params = new URLSearchParams();
          params.append('authenticated_user_id', sessionData.user_id);

          if (inputData.my_standups_only === true) {
            params.append('user_id', sessionData.user_id);
          } else if (inputData.user_name) {
            params.append('search_name', inputData.user_name);
          }

          if (inputData.start_date && inputData.end_date) {
            params.append('start_date', inputData.start_date);
            params.append('end_date', inputData.end_date);
          } else {
            const days = inputData.days || 30;
            const endDate = new Date().toISOString().split('T')[0];
            const startDate = new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
            params.append('start_date', startDate);
            params.append('end_date', endDate);
          }

          if (inputData.search_query) {
            params.append('q', inputData.search_query);
          }

          try {
            const response = await axios.get(`${RAILS_API_URL}/v1/standups?${params.toString()}`);
            const standups = response.data;

            if (standups.length === 0) {
              return { success: true, message: 'No standups found matching your criteria.', data: [] };
            }

            return {
              success: true,
              standups: standups,
              count: standups.length,
              summary: `Found ${standups.length} standup(s)`,
            };
          } catch (error) {
            return { success: false, error: error.message };
          }
        },
      },

      findStandupByDate: {
        description: 'Find standups for a specific date. Use when user mentions a specific date like "today", "yesterday", etc.',
        parameters: z.object({
          date: z.string().describe('Date in YYYY-MM-DD format'),
          user_name: z.string().optional().describe('Filter by specific user name'),
        }),
        execute: async (inputData, context) => {
          const params = new URLSearchParams();
          params.append('authenticated_user_id', sessionData.user_id);
          params.append('start_date', inputData.date);
          params.append('end_date', inputData.date);

          if (inputData.user_name) {
            params.append('search_name', inputData.user_name);
          }

          try {
            const response = await axios.get(`${RAILS_API_URL}/v1/standups?${params.toString()}`);
            const standups = response.data;

            if (standups.length === 0) {
              return { success: true, message: `No standups found for ${data.date}.`, data: [] };
            }

            return {
              success: true,
              standups: standups,
              count: standups.length,
              date: data.date,
            };
          } catch (error) {
            return { success: false, error: error.message };
          }
        },
      },

      findStandupByContent: {
        description: 'Search for standups containing specific keywords in done, doing, or blockers fields.',
        parameters: z.object({
          keywords: z.string().describe('Keywords to search for in standup content'),
          user_name: z.string().optional().describe('Filter by specific user name'),
          days: z.number().optional().default(30).describe('Number of days to search back'),
        }),
        execute: async (inputData, context) => {
          const params = new URLSearchParams();
          params.append('authenticated_user_id', sessionData.user_id);
          params.append('q', inputData.keywords);

          if (inputData.user_name) {
            params.append('search_name', inputData.user_name);
          }

          const days = inputData.days || 30;
          const endDate = new Date().toISOString().split('T')[0];
          const startDate = new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
          params.append('start_date', startDate);
          params.append('end_date', endDate);

          try {
            const response = await axios.get(`${RAILS_API_URL}/v1/standups?${params.toString()}`);
            const standups = response.data;

            if (standups.length === 0) {
              return { success: true, message: `No standups found containing "${data.keywords}".`, data: [] };
            }

            return {
              success: true,
              standups: standups,
              count: standups.length,
              keywords: data.keywords,
            };
          } catch (error) {
            return { success: false, error: error.message };
          }
        },
      },

      createStandup: {
        description: 'Create a new standup entry for the logged-in user.',
        parameters: z.object({
          done: z.string().describe('What was completed'),
          doing: z.string().describe('What is currently being worked on'),
          blockers: z.string().optional().describe('Any blockers or impediments'),
          standup_date: z.string().optional().describe('Date in YYYY-MM-DD format, defaults to today'),
        }),
        execute: async (inputData, context) => {
          const standupDate = inputData.standup_date || new Date().toISOString().split('T')[0];

          try {
            const response = await axios.post(`${RAILS_API_URL}/v1/standups`, {
              user_id: sessionData.user_id,
              done: inputData.done,
              doing: inputData.doing,
              blockers: inputData.blockers || '',
              standup_date: standupDate,
            });

            const standup = response.data.standup || response.data;
            return {
              success: true,
              standup: standup,
              message: `Standup created successfully for ${standup.standup_date}!`,
            };
          } catch (error) {
            return { success: false, error: error.message };
          }
        },
      },

      updateStandupByDate: {
        description: 'Update a standup by finding it by date. Use when user wants to update their standup for a specific date.',
        parameters: z.object({
          date: z.string().describe('Date of the standup in YYYY-MM-DD format'),
          done: z.string().optional().describe('Updated done field'),
          doing: z.string().optional().describe('Updated doing field'),
          blockers: z.string().optional().describe('Updated blockers field'),
        }),
        execute: async (inputData, context) => {
          // First find the standup
          const params = new URLSearchParams();
          params.append('authenticated_user_id', sessionData.user_id);
          params.append('user_id', sessionData.user_id);
          params.append('start_date', inputData.date);
          params.append('end_date', inputData.date);

          try {
            const searchResponse = await axios.get(`${RAILS_API_URL}/v1/standups?${params.toString()}`);
            const standups = searchResponse.data;

            if (standups.length === 0) {
              return { success: false, message: `No standup found for ${inputData.date}.` };
            }

            if (standups.length > 1) {
              return { success: false, message: `Multiple standups found for ${inputData.date}.` };
            }

            const standup = standups[0];

            // Update it
            const updateData = { user_id: sessionData.user_id };
            if (inputData.done) updateData.done = inputData.done;
            if (inputData.doing) updateData.doing = inputData.doing;
            if (inputData.blockers !== undefined) updateData.blockers = inputData.blockers;

            const updateResponse = await axios.put(`${RAILS_API_URL}/v1/standups/${standup.id}`, updateData);
            const updatedStandup = updateResponse.data;

            return {
              success: true,
              standup: updatedStandup,
              message: `Standup updated successfully!`,
            };
          } catch (error) {
            return { success: false, error: error.message };
          }
        },
      },

      getMyStandups: {
        description: 'Get standups for the currently logged-in user.',
        parameters: z.object({
          days: z.number().optional().default(7).describe('Number of days to look back'),
        }),
        execute: async (inputData, context) => {
          const params = new URLSearchParams();
          params.append('authenticated_user_id', sessionData.user_id);
          params.append('user_id', sessionData.user_id);

          const days = inputData.days || 7;
          const endDate = new Date().toISOString().split('T')[0];
          const startDate = new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
          params.append('start_date', startDate);
          params.append('end_date', endDate);

          try {
            const response = await axios.get(`${RAILS_API_URL}/v1/standups?${params.toString()}`);
            const standups = response.data;

            if (standups.length === 0) {
              return { success: true, message: `You haven't created any standups in the last ${days} days.`, data: [] };
            }

            return {
              success: true,
              standups: standups,
              count: standups.length,
              days: days,
            };
          } catch (error) {
            return { success: false, error: error.message };
          }
        },
      },

      getBlockers: {
        description: 'Find all standups with blockers.',
        parameters: z.object({
          user_name: z.string().optional().describe('Filter blockers by user name'),
          days: z.number().optional().default(30).describe('Number of days to look back'),
        }),
        execute: async (inputData, context) => {
          const params = new URLSearchParams();
          params.append('authenticated_user_id', sessionData.user_id);

          if (inputData.user_name) {
            params.append('search_name', inputData.user_name);
          }

          const days = inputData.days || 30;
          const endDate = new Date().toISOString().split('T')[0];
          const startDate = new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
          params.append('start_date', startDate);
          params.append('end_date', endDate);

          try {
            const response = await axios.get(`${RAILS_API_URL}/v1/standups?${params.toString()}`);
            const allStandups = response.data;

            const withBlockers = allStandups.filter(s =>
              s.blockers &&
              s.blockers.toLowerCase() !== 'none' &&
              s.blockers.toLowerCase() !== 'nil' &&
              s.blockers !== '-' &&
              s.blockers.trim() !== ''
            );

            if (withBlockers.length === 0) {
              return { success: true, message: `No blockers found in the last ${days} days!`, data: [] };
            }

            return {
              success: true,
              blockers: withBlockers,
              count: withBlockers.length,
            };
          } catch (error) {
            return { success: false, error: error.message };
          }
        },
      },
    },
  });

  return agent;
}

module.exports = { createStandupAgent };

const axios = require('axios');

const RAILS_API_URL = process.env.RAILS_API_URL || 'http://localhost:3000/api';

function normalizeDays(value) {
  if (value === undefined || value === null || value === '') return null;

  const days = Number(value);
  return Number.isFinite(days) && days > 0 ? days : null;
}

function appendLookbackDateRange(params, days) {
  const endDate = new Date().toISOString().split('T')[0];
  const startDate = new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
  params.append('start_date', startDate);
  params.append('end_date', endDate);
}

function dateRangeLabel(days) {
  return days ? `in the last ${days} days` : 'across all dates';
}

const tools = [
  {
    name: 'search_standups',
    description: 'Search and filter standups in Standup Sync. Can search by user name, date range, or keywords. Shows all users\' standups by default.',
    parameters: {
      user_name: 'string (optional) - Search by user first name, last name, or username',
      start_date: 'string (optional) - Start date in YYYY-MM-DD format',
      end_date: 'string (optional) - End date in YYYY-MM-DD format',
      search_query: 'string (optional) - Text to search in done, doing, or blockers fields',
      days: 'number (optional) - Number of days to look back. If omitted, no date filter is applied',
      my_standups_only: 'boolean (optional) - If true, only show logged-in user\'s standups',
      all_time: 'boolean (optional) - If true, do not apply a date filter'
    },
    execute: async (args, session) => {
      const params = new URLSearchParams();
      params.append('authenticated_user_id', session.user_id);

      // Filter by user
      if (args.my_standups_only === true) {
        params.append('user_id', session.user_id);
      } else if (args.user_name) {
        params.append('search_name', args.user_name);
      }

      // Date range
      if (args.all_time === true) {
        // Intentionally skip date filters.
      } else if (args.start_date && args.end_date) {
        params.append('start_date', args.start_date);
        params.append('end_date', args.end_date);
      } else {
        const days = normalizeDays(args.days);
        if (days) appendLookbackDateRange(params, days);
      }

      // Search query
      if (args.search_query) {
        params.append('q', args.search_query);
      }

      try {
        const url = `${RAILS_API_URL}/v1/standups?${params.toString()}`;
        console.log('Searching standups:', url);
        
        const response = await axios.get(url);
        const standups = response.data;

        console.log(`Found ${standups.length} standups`);

        if (standups.length === 0) {
          return {
            success: true,
            message: 'No standups found matching your criteria.',
            data: []
          };
        }

        // Format standups for display
        let message = `Found ${standups.length} standup(s):\n\n`;
        standups.slice(0, 10).forEach((standup, index) => {
          const userName = standup.user ? `${standup.user.first_name} ${standup.user.last_name}` : standup.name;
          const isOwn = standup.user_id === session.user_id ? ' [YOUR STANDUP]' : '';
          message += `${index + 1}. ${standup.standup_date} (ID: ${standup.id})${isOwn}\n`;
          message += `   User: ${userName}\n`;
          message += `   Done: ${standup.done}\n`;
          message += `   Doing: ${standup.doing}\n`;
          message += `   Blockers: ${standup.blockers || 'None'}\n\n`;
        });

        if (standups.length > 10) {
          message += `... and ${standups.length - 10} more standups.`;
        }

        return {
          success: true,
          message: message.trim(),
          data: standups,
          count: standups.length
        };
      } catch (error) {
        console.error('Search failed:', error.message);
        return {
          success: false,
          message: 'Failed to search standups: ' + error.message,
          error: error.message
        };
      }
    }
  },

  {
    name: 'find_standup_by_date',
    description: 'Find standups for a specific date. Use this when user mentions a specific date like "today", "yesterday", "March 20", etc.',
    parameters: {
      date: 'string (required) - Date in YYYY-MM-DD format',
      user_name: 'string (optional) - Filter by specific user name'
    },
    execute: async (args, session) => {
      if (!args.date) {
        return {
          success: false,
          message: 'Date is required.',
          error: 'Missing date parameter'
        };
      }

      const params = new URLSearchParams();
      params.append('authenticated_user_id', session.user_id);
      params.append('start_date', args.date);
      params.append('end_date', args.date);

      if (args.user_name) {
        params.append('search_name', args.user_name);
      }

      try {
        const url = `${RAILS_API_URL}/v1/standups?${params.toString()}`;
        console.log('Finding standups by date:', url);

        const response = await axios.get(url);
        const standups = response.data;

        console.log(`Found ${standups.length} standups for ${args.date}`);

        if (standups.length === 0) {
          return {
            success: true,
            message: `No standups found for ${args.date}.`,
            data: []
          };
        }

        let message = `Found ${standups.length} standup(s) for ${args.date}:\n\n`;
        standups.forEach((standup, index) => {
          const userName = standup.user ? `${standup.user.first_name} ${standup.user.last_name}` : standup.name;
          const isOwn = standup.user_id === session.user_id ? ' [YOUR STANDUP]' : '';
          message += `${index + 1}. ${userName}${isOwn} (ID: ${standup.id})\n`;
          message += `   Done: ${standup.done}\n`;
          message += `   Doing: ${standup.doing}\n`;
          message += `   Blockers: ${standup.blockers || 'None'}\n\n`;
        });

        return {
          success: true,
          message: message.trim(),
          data: standups,
          count: standups.length
        };
      } catch (error) {
        console.error('Failed to find standups by date:', error.message);
        return {
          success: false,
          message: 'Failed to find standups: ' + error.message,
          error: error.message
        };
      }
    }
  },

  {
    name: 'find_standup_by_content',
    description: 'Search for standups containing specific keywords in done, doing, or blockers fields. Use this when user wants to find standups mentioning specific topics, tasks, or issues.',
    parameters: {
      keywords: 'string (required) - Keywords to search for in standup content',
      user_name: 'string (optional) - Filter by specific user name',
      days: 'number (optional) - Number of days to search back. If omitted, no date filter is applied'
    },
    execute: async (args, session) => {
      if (!args.keywords) {
        return {
          success: false,
          message: 'Keywords are required.',
          error: 'Missing keywords parameter'
        };
      }

      const params = new URLSearchParams();
      params.append('authenticated_user_id', session.user_id);
      params.append('q', args.keywords);

      if (args.user_name) {
        params.append('search_name', args.user_name);
      }

      const days = normalizeDays(args.days);
      if (days) appendLookbackDateRange(params, days);

      try {
        const url = `${RAILS_API_URL}/v1/standups?${params.toString()}`;
        console.log(' Searching standups by content:', url);

        const response = await axios.get(url);
        const standups = response.data;

        console.log(` Found ${standups.length} standups containing "${args.keywords}"`);

        if (standups.length === 0) {
          return {
            success: true,
            message: `No standups found containing "${args.keywords}" ${dateRangeLabel(days)}.`,
            data: []
          };
        }

        let message = `Found ${standups.length} standup(s) containing "${args.keywords}":\n\n`;
        standups.slice(0, 10).forEach((standup, index) => {
          const userName = standup.user ? `${standup.user.first_name} ${standup.user.last_name}` : standup.name;
          const isOwn = standup.user_id === session.user_id ? ' [YOUR STANDUP]' : '';
          message += `${index + 1}. ${standup.standup_date} - ${userName}${isOwn} (ID: ${standup.id})\n`;
          message += `   Done: ${standup.done}\n`;
          message += `   Doing: ${standup.doing}\n`;
          message += `   Blockers: ${standup.blockers || 'None'}\n\n`;
        });

        if (standups.length > 10) {
          message += `... and ${standups.length - 10} more standups.`;
        }

        return {
          success: true,
          message: message.trim(),
          data: standups,
          count: standups.length
        };
      } catch (error) {
        console.error(' Failed to search by content:', error.message);
        return {
          success: false,
          message: 'Failed to search standups: ' + error.message,
          error: error.message
        };
      }
    }
  },

  {
    name: 'update_standup_by_date',
    description: 'Update a standup by finding it by date and user. Use this when user wants to update their standup for a specific date without knowing the ID.',
    parameters: {
      date: 'string (required) - Date of the standup in YYYY-MM-DD format',
      done: 'string (optional) - Updated done field',
      doing: 'string (optional) - Updated doing field',
      blockers: 'string (optional) - Updated blockers field'
    },
    execute: async (args, session) => {
      if (!args.date) {
        return {
          success: false,
          message: 'Date is required.',
          error: 'Missing date parameter'
        };
      }

      if (!args.done && !args.doing && args.blockers === undefined) {
        return {
          success: false,
          message: 'At least one field (done, doing, or blockers) must be provided to update.',
          error: 'No update fields provided'
        };
      }

      // First, find the standup by date
      try {
        const params = new URLSearchParams();
        params.append('authenticated_user_id', session.user_id);
        params.append('user_id', session.user_id); // Only get user's own standups
        params.append('start_date', args.date);
        params.append('end_date', args.date);

        const searchUrl = `${RAILS_API_URL}/v1/standups?${params.toString()}`;
        console.log('Finding standup by date for update:', searchUrl);

        const searchResponse = await axios.get(searchUrl);
        const standups = searchResponse.data;

        if (standups.length === 0) {
          return {
            success: false,
            message: `No standup found for ${args.date}. You may need to create one first.`,
            error: 'Standup not found'
          };
        }

        if (standups.length > 1) {
          return {
            success: false,
            message: `Found ${standups.length} standups for ${args.date}. Please specify the standup ID to update.`,
            error: 'Multiple standups found'
          };
        }

        const standup = standups[0];
        console.log('Found standup to update:', standup.id);

        // Now update it
        const updateData = { user_id: session.user_id };
        if (args.done) updateData.done = args.done;
        if (args.doing) updateData.doing = args.doing;
        if (args.blockers !== undefined) updateData.blockers = args.blockers;

        const updateUrl = `${RAILS_API_URL}/v1/standups/${standup.id}`;
        console.log(' Updating standup:', updateUrl);

        const updateResponse = await axios.put(updateUrl, updateData);
        const updatedStandup = updateResponse.data;

        console.log(' Standup updated successfully:', updatedStandup.id);

        const message = `Standup ID: ${updatedStandup.id} updated successfully! Done: ${updatedStandup.done}, Doing: ${updatedStandup.doing}, Blockers: ${updatedStandup.blockers}. Last updated: ${updatedStandup.updated_at}`;

        return {
          success: true,
          message: message,
          data: updatedStandup
        };
      } catch (error) {
        console.error(' Failed to update standup by date:', error.response?.status, error.response?.data, error.message);
        return {
          success: false,
          message: 'Failed to update standup: ' + (error.response?.data?.error || error.response?.data?.errors || error.message),
          error: error.message
        };
      }
    }
  },

  {
    name: 'delete_standup_by_date',
    description: 'Delete a standup by finding it by date. Use this when user wants to delete their standup for a specific date without knowing the ID.',
    parameters: {
      date: 'string (required) - Date of the standup in YYYY-MM-DD format'
    },
    execute: async (args, session) => {
      if (!args.date) {
        return {
          success: false,
          message: 'Date is required.',
          error: 'Missing date parameter'
        };
      }

      // First, find the standup by date
      try {
        const params = new URLSearchParams();
        params.append('authenticated_user_id', session.user_id);
        params.append('user_id', session.user_id); // Only get user's own standups
        params.append('start_date', args.date);
        params.append('end_date', args.date);

        const searchUrl = `${RAILS_API_URL}/v1/standups?${params.toString()}`;
        console.log('Finding standup by date for deletion:', searchUrl);

        const searchResponse = await axios.get(searchUrl);
        const standups = searchResponse.data;

        if (standups.length === 0) {
          return {
            success: false,
            message: `No standup found for ${args.date}.`,
            error: 'Standup not found'
          };
        }

        if (standups.length > 1) {
          return {
            success: false,
            message: `Found ${standups.length} standups for ${args.date}. Please specify the standup ID to delete.`,
            error: 'Multiple standups found'
          };
        }

        const standup = standups[0];
        console.log('Found standup to delete:', standup.id);

        // Now delete it
        const deleteUrl = `${RAILS_API_URL}/v1/standups/${standup.id}?user_id=${session.user_id}`;
        console.log('Deleting standup:', deleteUrl);

        await axios.delete(deleteUrl);

        console.log('Standup deleted successfully:', standup.id);

        return {
          success: true,
          message: `Standup ID: ${standup.id} for ${args.date} has been deleted. The standup entry has been permanently removed from the database.`,
          data: { deleted_id: standup.id, date: args.date }
        };
      } catch (error) {
        console.error('Failed to delete standup by date:', error.response?.status, error.response?.data, error.message);
        if (error.response?.status === 404) {
          return {
            success: false,
            message: 'Standup not found or access denied',
            error: 'Standup not found'
          };
        }
        if (error.response?.status === 403) {
          return {
            success: false,
            message: 'Access denied: You can only delete your own standups',
            error: 'Access denied'
          };
        }
        return {
          success: false,
          message: 'Failed to delete standup: ' + (error.response?.data?.error || error.message),
          error: error.message
        };
      }
    }
  },

  {
    name: 'get_standup_by_id',
    description: 'Get details of a specific standup by its ID. Use this only when user explicitly provides a standup ID number.',
    parameters: {
      standup_id: 'number (required) - The ID of the standup to retrieve'
    },
    execute: async (args, session) => {
      const { standup_id } = args;
      
      if (!standup_id) {
        return {
          success: false,
          message: 'Standup ID is required',
          error: 'Missing standup_id parameter'
        };
      }

      try {
        // NOTE: Do NOT pass user_id - we want to view ANY standup (like MCP server)
        const url = `${RAILS_API_URL}/v1/standups/${standup_id}`;
        console.log('Fetching standup:', url);

        const response = await axios.get(url);
        const standup = response.data;

        console.log(' Standup found:', standup.id);

        const userName = standup.user ? `${standup.user.first_name} ${standup.user.last_name} (${standup.user.email})` : standup.name;
        const isOwn = standup.user_id === session.user_id ? ' [YOUR STANDUP]' : ' [READ-ONLY]';

        const message = `Standup ID: ${standup.id}${isOwn}\n` +
          `Date: ${standup.standup_date}\n` +
          `User: ${userName}\n` +
          `Done: ${standup.done}\n` +
          `Doing: ${standup.doing}\n` +
          `Blockers: ${standup.blockers || 'None'}\n` +
          `Created: ${standup.created_at}\n` +
          `Last Updated: ${standup.updated_at}`;

        return {
          success: true,
          message: message,
          data: standup
        };
      } catch (error) {
        console.error(' Failed to fetch standup:', error.message);

        if (error.response?.status === 404) {
          return {
            success: false,
            message: 'Standup not found or access denied',
            error: 'Standup not found'
          };
        }

        return {
          success: false,
          message: 'Failed to get standup: ' + error.message,
          error: error.message
        };
      }
    }
  },

  {
    name: 'get_my_standups',
    description: 'Get standups for the currently logged-in user in Standup Sync.',
    parameters: {
      days: 'number (optional) - Number of days to look back. If omitted, no date filter is applied',
      all_time: 'boolean (optional) - If true, return all standups for the logged-in user without a date filter'
    },
    execute: async (args, session) => {
      const params = new URLSearchParams();
      params.append('authenticated_user_id', session.user_id);
      params.append('user_id', session.user_id);

      const allTime = args.all_time === true;
      const days = allTime ? null : normalizeDays(args.days);

      if (days) appendLookbackDateRange(params, days);

      try {
        const url = `${RAILS_API_URL}/v1/standups?${params.toString()}`;
        console.log('Fetching my standups:', url);

        const response = await axios.get(url);
        const standups = response.data;

        console.log(`Found ${standups.length} of your standups`);

        if (standups.length === 0) {
          const rangeMessage = days ? `in the last ${days} days` : 'yet';
          return {
            success: true,
            message: `You haven't created any standups ${rangeMessage}.`,
            data: []
          };
        }

        const rangeMessage = dateRangeLabel(days);
        let message = `You have ${standups.length} standup(s) ${rangeMessage}:\n\n`;
        standups.forEach((standup, index) => {
          message += `${index + 1}. ${standup.standup_date} (ID: ${standup.id})\n`;
          message += `   Done: ${standup.done}\n`;
          message += `   Doing: ${standup.doing}\n`;
          message += `   Blockers: ${standup.blockers || 'None'}\n\n`;
        });

        return {
          success: true,
          message: message.trim(),
          data: standups,
          count: standups.length
        };
      } catch (error) {
        console.error('Failed to fetch your standups:', error.message);
        return {
          success: false,
          message: 'Failed to get your standups: ' + error.message,
          error: error.message
        };
      }
    }
  },

  {
    name: 'get_user_insights',
    description: 'Get statistics and insights for a specific user in Standup Sync.',
    parameters: {
      user_name: 'string (optional) - User name to get insights for. If not provided, shows insights for logged-in user',
      days: 'number (optional) - Number of days to analyze. If omitted, no date filter is applied'
    },
    execute: async (args, session) => {
      const params = new URLSearchParams();
      params.append('authenticated_user_id', session.user_id);

      if (args.user_name) {
        params.append('search_name', args.user_name);
      } else {
        params.append('user_id', session.user_id);
      }

      const days = normalizeDays(args.days);
      if (days) appendLookbackDateRange(params, days);

      try {
        const url = `${RAILS_API_URL}/v1/standups?${params.toString()}`;
        console.log(' Getting user insights:', url);

        const response = await axios.get(url);
        const standups = response.data;

        if (standups.length === 0) {
          const userName = args.user_name || 'You';
          return {
            success: true,
            message: `${userName} have no standups ${dateRangeLabel(days)}.`,
            data: { total: 0 }
          };
        }

        const user = standups[0].user || { first_name: args.user_name || 'You' };
        const userName = `${user.first_name} ${user.last_name || ''}`.trim();

        // Calculate insights
        const withBlockers = standups.filter(s =>
          s.blockers &&
          s.blockers.toLowerCase() !== 'none' &&
          s.blockers.toLowerCase() !== 'nil' &&
          s.blockers !== '-' &&
          s.blockers.trim() !== ''
        );

        const avgDoneLength = Math.round(standups.reduce((sum, s) => sum + s.done.length, 0) / standups.length);
        const avgDoingLength = Math.round(standups.reduce((sum, s) => sum + s.doing.length, 0) / standups.length);

        const message = `Insights for ${userName} (${dateRangeLabel(days)}):\n\n` +
          `Total Standups: ${standups.length}\n` +
          `Standups with Blockers: ${withBlockers.length}\n` +
          `Blocker Rate: ${Math.round((withBlockers.length / standups.length) * 100)}%\n` +
          `Average "Done" length: ${avgDoneLength} characters\n` +
          `Average "Doing" length: ${avgDoingLength} characters\n` +
          `Most Recent: ${standups[0].standup_date}`;

        return {
          success: true,
          message: message,
          data: {
            user: userName,
            total_standups: standups.length,
            standups_with_blockers: withBlockers.length,
            blocker_rate: Math.round((withBlockers.length / standups.length) * 100),
            avg_done_length: avgDoneLength,
            avg_doing_length: avgDoingLength,
            most_recent_date: standups[0].standup_date
          }
        };
      } catch (error) {
        console.error(' Failed to get insights:', error.message);
        return {
          success: false,
          message: 'Failed to get user insights: ' + error.message,
          error: error.message
        };
      }
    }
  },

  {
    name: 'get_blockers',
    description: 'Find all standups with blockers in Standup Sync.',
    parameters: {
      user_name: 'string (optional) - Filter blockers by user name',
      days: 'number (optional) - Number of days to look back. If omitted, no date filter is applied'
    },
    execute: async (args, session) => {
      const params = new URLSearchParams();
      params.append('authenticated_user_id', session.user_id);

      if (args.user_name) {
        params.append('search_name', args.user_name);
      }

      const days = normalizeDays(args.days);
      if (days) appendLookbackDateRange(params, days);

      try {
        const url = `${RAILS_API_URL}/v1/standups?${params.toString()}`;
        console.log(' Finding blockers:', url);

        const response = await axios.get(url);
        const allStandups = response.data;

        // Filter standups with actual blockers
        const withBlockers = allStandups.filter(s =>
          s.blockers &&
          s.blockers.toLowerCase() !== 'none' &&
          s.blockers.toLowerCase() !== 'nil' &&
          s.blockers !== '-' &&
          s.blockers.trim() !== ''
        );

        console.log(` Found ${withBlockers.length} standups with blockers`);

        if (withBlockers.length === 0) {
          return {
            success: true,
            message: `No blockers found ${dateRangeLabel(days)}!`,
            data: []
          };
        }

        let message = `Found ${withBlockers.length} standup(s) with blockers:\n\n`;
        withBlockers.forEach((standup, index) => {
          const userName = standup.user ? `${standup.user.first_name} ${standup.user.last_name}` : standup.name;
          message += `${index + 1}. ${standup.standup_date} - ${userName}\n`;
          message += `   Blocker: ${standup.blockers}\n`;
          message += `   Doing: ${standup.doing}\n\n`;
        });

        return {
          success: true,
          message: message.trim(),
          data: withBlockers,
          count: withBlockers.length
        };
      } catch (error) {
        console.error(' Failed to get blockers:', error.message);
        return {
          success: false,
          message: 'Failed to get blockers: ' + error.message,
          error: error.message
        };
      }
    }
  },

  {
    name: 'create_standup',
    description: 'Create a new standup entry in Standup Sync for the logged-in user.',
    parameters: {
      done: 'string (required) - What was completed (15-20 characters)',
      doing: 'string (required) - What is currently being worked on (15-20 characters)',
      blockers: 'string (optional) - Any blockers or impediments',
      standup_date: 'string (optional) - Date in YYYY-MM-DD format (defaults to today)'
    },
    execute: async (args, session) => {
      if (!args.done || args.done.trim().length === 0) {
        return {
          success: false,
          message: 'The "done" field is required and cannot be empty.',
          error: 'Missing done field'
        };
      }

      if (!args.doing || args.doing.trim().length === 0) {
        return {
          success: false,
          message: 'The "doing" field is required and cannot be empty.',
          error: 'Missing doing field'
        };
      }

      const standupDate = args.standup_date || new Date().toISOString().split('T')[0];

      try {
        const url = `${RAILS_API_URL}/v1/standups`;
        console.log(' Creating standup:', url);

        const response = await axios.post(url, {
          user_id: session.user_id,
          done: args.done,
          doing: args.doing,
          blockers: args.blockers || '',
          standup_date: standupDate
        });

        const standup = response.data.standup || response.data;

        console.log('Standup created:', standup.id);

        const message = `Standup created successfully! Standup ID: ${standup.id} for ${standup.standup_date}. Done: ${standup.done}, Doing: ${standup.doing}, Blockers: ${standup.blockers}`;

        return {
          success: true,
          message: message,
          data: standup
        };
      } catch (error) {
        console.error(' Failed to create standup:', error.message);
        return {
          success: false,
          message: 'Failed to create standup: ' + (error.response?.data?.error || error.message),
          error: error.message
        };
      }
    }
  },

  {
    name: 'update_standup',
    description: 'Update an existing standup entry in Standup Sync. You can only update your own standups.',
    parameters: {
      standup_id: 'number (required) - ID of the standup to update',
      done: 'string (optional) - Updated done field',
      doing: 'string (optional) - Updated doing field',
      blockers: 'string (optional) - Updated blockers field'
    },
    execute: async (args, session) => {
      if (!args.standup_id) {
        return {
          success: false,
          message: 'Standup ID is required.',
          error: 'Missing standup_id'
        };
      }

      if (!args.done && !args.doing && args.blockers === undefined) {
        return {
          success: false,
          message: 'At least one field (done, doing, or blockers) must be provided to update.',
          error: 'No fields to update'
        };
      }

      // First verify ownership (fetch without user_id to see ANY standup)
      try {
        const getUrl = `${RAILS_API_URL}/v1/standups/${args.standup_id}`;
        console.log('Verifying standup ownership for update:', getUrl);
        const getResponse = await axios.get(getUrl);
        const standup = getResponse.data;

        console.log('Standup details:', { id: standup.id, user_id: standup.user_id, session_user_id: session.user_id });

        if (standup.user_id !== session.user_id) {
          const userName = standup.user ? `${standup.user.first_name} ${standup.user.last_name}` : 'another user';
          console.log(' Access denied: standup belongs to user', standup.user_id, 'but session user is', session.user_id);
          return {
            success: false,
            message: `Access denied: You can only update your own standups. This standup belongs to ${userName}.`,
            error: 'Access denied'
          };
        }
      } catch (error) {
        console.error(' Error verifying ownership:', error.response?.status, error.message);
        if (error.message.includes('Access denied')) {
          throw error;
        }
        return {
          success: false,
          message: 'Standup not found or access denied',
          error: 'Standup not found'
        };
      }

      // Now update
      const updateData = { user_id: session.user_id };
      if (args.done) updateData.done = args.done;
      if (args.doing) updateData.doing = args.doing;
      if (args.blockers !== undefined) updateData.blockers = args.blockers;

      console.log('Update data:', updateData);

      try {
        const url = `${RAILS_API_URL}/v1/standups/${args.standup_id}`;
        console.log('Updating standup:', url);

        const response = await axios.put(url, updateData);
        const standup = response.data;

        console.log('Standup updated successfully:', standup.id);

        const message = `Standup ID: ${standup.id} updated successfully! Done: ${standup.done}, Doing: ${standup.doing}, Blockers: ${standup.blockers}. Last updated: ${standup.updated_at}`;

        return {
          success: true,
          message: message,
          data: standup
        };
      } catch (error) {
        console.error('Failed to update standup:', error.response?.status, error.response?.data, error.message);
        if (error.response?.status === 404) {
          return {
            success: false,
            message: 'Standup not found or access denied',
            error: 'Standup not found'
          };
        }
        if (error.response?.status === 403) {
          return {
            success: false,
            message: 'Access denied: You can only update your own standups',
            error: 'Access denied'
          };
        }
        return {
          success: false,
          message: 'Failed to update standup: ' + (error.response?.data?.error || error.response?.data?.errors || error.message),
          error: error.message
        };
      }
    }
  },

  {
    name: 'delete_standup',
    description: 'Delete a standup entry in Standup Sync. You can only delete your own standups. This is a destructive action.',
    parameters: {
      standup_id: 'number (required) - ID of the standup to delete'
    },
    execute: async (args, session) => {
      if (!args.standup_id) {
        return {
          success: false,
          message: 'Standup ID is required.',
          error: 'Missing standup_id'
        };
      }

      // First verify ownership (fetch without user_id to see ANY standup)
      try {
        const getUrl = `${RAILS_API_URL}/v1/standups/${args.standup_id}`;
        console.log('Verifying standup ownership:', getUrl);
        const getResponse = await axios.get(getUrl);
        const standup = getResponse.data;

        console.log('Standup details:', { id: standup.id, user_id: standup.user_id, session_user_id: session.user_id });

        if (standup.user_id !== session.user_id) {
          const userName = standup.user ? `${standup.user.first_name} ${standup.user.last_name}` : 'another user';
          console.log('Access denied: standup belongs to user', standup.user_id, 'but session user is', session.user_id);
          return {
            success: false,
            message: `Access denied: You can only delete your own standups. This standup belongs to ${userName}.`,
            error: 'Access denied'
          };
        }
      } catch (error) {
        console.error('Error verifying ownership:', error.response?.status, error.message);
        if (error.message.includes('Access denied')) {
          throw error;
        }
        return {
          success: false,
          message: 'Standup not found or access denied',
          error: 'Standup not found'
        };
      }

      // Now delete
      try {
        const url = `${RAILS_API_URL}/v1/standups/${args.standup_id}?user_id=${session.user_id}`;
        console.log(' Deleting standup:', url);

        const deleteResponse = await axios.delete(url);

        console.log(' Standup deleted successfully:', args.standup_id, 'Response:', deleteResponse.status);

        return {
          success: true,
          message: `Standup ID: ${args.standup_id} has been deleted. The standup entry has been permanently removed from the database.`,
          data: { deleted_id: args.standup_id }
        };
      } catch (error) {
        console.error(' Failed to delete standup:', error.response?.status, error.response?.data, error.message);
        if (error.response?.status === 404) {
          return {
            success: false,
            message: 'Standup not found or access denied',
            error: 'Standup not found'
          };
        }
        if (error.response?.status === 403) {
          return {
            success: false,
            message: 'Access denied: You can only delete your own standups',
            error: 'Access denied'
          };
        }
        return {
          success: false,
          message: 'Failed to delete standup: ' + (error.response?.data?.error || error.message),
          error: error.message
        };
      }
    }
  }
];

module.exports = tools;

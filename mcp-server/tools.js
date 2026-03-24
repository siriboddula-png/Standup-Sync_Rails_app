const axios = require('axios');
const crypto = require('crypto');

const tools = [
  {
    name: 'login',
    description: 'Login to Standup Sync with email and password',
    requiresAuth: false,
    inputSchema: {
      type: 'object',
      properties: {
        email: {
          type: 'string',
          description: 'User email address'
        },
        password: {
          type: 'string',
          description: 'User password'
        }
      },
      required: ['email', 'password']
    },
    execute: async (args, railsApiUrl) => {
      if (!args.email || !args.password) {
        throw new Error('Email and password are required');
      }

      if (!args.email.includes('@')) {
        throw new Error('Invalid email format');
      }

      if (args.password.length < 6) {
        throw new Error('Password must be at least 6 characters');
      }

      try {
        const response = await axios.post(`${railsApiUrl}/users/sign_in`, {
          email: args.email,
          password: args.password
        });

        const user = response.data.user || response.data;
        const session_id = crypto.randomBytes(16).toString('hex');

        return {
          message: `Login successful! Welcome back, ${user.first_name} ${user.last_name}! You are now logged in as ${user.email}`,
          data: {
            user_id: user.id,
            email: user.email,
            first_name: user.first_name,
            last_name: user.last_name,
            username: user.username
          },
          session_id: session_id,
          session_data: {
            user_id: user.id,
            email: user.email,
            first_name: user.first_name,
            last_name: user.last_name
          }
        };
      } catch (error) {
        if (error.response?.status === 401) {
          throw new Error('Invalid email or password');
        }
        throw new Error('Login failed: ' + (error.response?.data?.error || error.message));
      }
    }
  },

  {
    name: 'logout',
    description: 'Logout from Standup Sync and end the current session',
    requiresAuth: true,
    inputSchema: {
      type: 'object',
      properties: {},
      required: []
    },
    execute: async (args, railsApiUrl, session) => {
      return {
        message: `Logout successful! Goodbye, ${session.first_name}! You have been logged out from ${session.email}`,
        data: { 
          logged_out: true,
          was_logged_in_as: session.email
        },
        logout: true
      };
    }
  },

  {
    name: 'register_user',
    description: 'Register a new user in Standup Sync',
    requiresAuth: false,
    inputSchema: {
      type: 'object',
      properties: {
        email: {
          type: 'string',
          description: 'User email address'
        },
        password: {
          type: 'string',
          description: 'User password (minimum 6 characters)'
        },
        first_name: {
          type: 'string',
          description: 'User first name'
        },
        last_name: {
          type: 'string',
          description: 'User last name'
        },
        username: {
          type: 'string',
          description: 'Username (optional, will be generated from email if not provided)'
        }
      },
      required: ['email', 'password', 'first_name', 'last_name']
    },
    execute: async (args, railsApiUrl) => {
      if (!args.email || !args.password || !args.first_name || !args.last_name) {
        throw new Error('Email, password, first name, and last name are required');
      }

      if (!args.email.includes('@')) {
        throw new Error('Invalid email format');
      }

      if (args.password.length < 6) {
        throw new Error('Password must be at least 6 characters');
      }

      if (args.first_name.trim().length === 0) {
        throw new Error('First name cannot be empty');
      }

      if (args.last_name.trim().length === 0) {
        throw new Error('Last name cannot be empty');
      }

      const username = args.username || args.email.split('@')[0];

      try {
        const response = await axios.post(`${railsApiUrl}/users`, {
          email: args.email,
          password: args.password,
          password_confirmation: args.password,
          first_name: args.first_name,
          last_name: args.last_name,
          username: username
        });

        const userData = response.data.user || response.data;

        return {
          message: `User registered successfully! User ID: ${userData.id}, Email: ${userData.email}, Username: ${userData.username}, Name: ${args.first_name} ${args.last_name}`,
          data: userData
        };
      } catch (error) {
        if (error.response?.data?.errors) {
          const errors = error.response.data.errors;
          throw new Error('Registration failed: ' + JSON.stringify(errors));
        }
        throw new Error('Registration failed: ' + (error.response?.data?.error || error.message));
      }
    }
  },

  {
    name: 'create_standup',
    description: 'Create a new standup entry (requires login)',
    requiresAuth: true,
    inputSchema: {
      type: 'object',
      properties: {
        done: {
          type: 'string',
          description: 'What was completed'
        },
        doing: {
          type: 'string',
          description: 'What is currently being worked on'
        },
        blockers: {
          type: 'string',
          description: 'Any blockers or impediments'
        },
        standup_date: {
          type: 'string',
          description: 'Date of the standup (YYYY-MM-DD format). Defaults to today if not provided'
        }
      },
      required: ['done', 'doing']
    },
    execute: async (args, railsApiUrl, session) => {
      if (!args.done || args.done.trim().length === 0) {
        throw new Error('Done field is required and cannot be empty');
      }

      if (!args.doing || args.doing.trim().length === 0) {
        throw new Error('Doing field is required and cannot be empty');
      }

      const standupDate = args.standup_date || new Date().toISOString().split('T')[0];

      try {
        const response = await axios.post(`${railsApiUrl}/v1/standups`, {
          user_id: session.user_id,
          done: args.done,
          doing: args.doing,
          blockers: args.blockers || 'None',
          standup_date: standupDate
        });

        const standup = response.data.standup || response.data;

        return {
          message: `Standup created successfully! Standup ID: ${standup.id} for ${standup.standup_date}. Done: ${standup.done}, Doing: ${standup.doing}, Blockers: ${standup.blockers}`,
          data: standup
        };
      } catch (error) {
        throw new Error('Failed to create standup: ' + (error.response?.data?.error || error.message));
      }
    }
  },

  {
    name: 'search_standups',
    description: 'Search and filter standups (requires login). Can view all users\' standups or filter by specific user.',
    requiresAuth: true,
    inputSchema: {
      type: 'object',
      properties: {
        start_date: {
          type: 'string',
          description: 'Start date for search range (YYYY-MM-DD)'
        },
        end_date: {
          type: 'string',
          description: 'End date for search range (YYYY-MM-DD)'
        },
        search_query: {
          type: 'string',
          description: 'Text to search for in standup content'
        },
        user_id: {
          type: 'number',
          description: 'Filter standups by specific user ID (optional - if not provided, shows all users\' standups)'
        },
        search_name: {
          type: 'string',
          description: 'Search by user name, username, or email (optional)'
        },
        my_standups_only: {
          type: 'boolean',
          description: 'If true, only show standups for the logged-in user (default: false)'
        }
      },
      required: []
    },
    execute: async (args, railsApiUrl, session) => {
      const params = new URLSearchParams();
      params.append('authenticated_user_id', session.user_id);
      if (args.my_standups_only === true) {
        params.append('user_id', session.user_id);
      } else if (args.user_id) {
        params.append('user_id', args.user_id);
      }

      if (args.start_date) params.append('start_date', args.start_date);
      if (args.end_date) params.append('end_date', args.end_date);
      if (args.search_query) params.append('q', args.search_query);
      if (args.search_name) params.append('search_name', args.search_name);

      try {
        const response = await axios.get(`${railsApiUrl}/v1/standups?${params.toString()}`);
        const standups = response.data;

        if (standups.length === 0) {
          return {
            message: 'No standups found matching your criteria.',
            data: []
          };
        }

        let message = `Found ${standups.length} standup(s):\n`;
        standups.forEach((standup, index) => {
          const userName = standup.user ? `${standup.user.first_name} ${standup.user.last_name} (${standup.user.email})` : standup.name;
          const isOwnStandup = standup.user_id === session.user_id ? ' [YOUR STANDUP]' : ' [READ-ONLY]';
          message += `\n${index + 1}. ${standup.standup_date} (ID: ${standup.id})${isOwnStandup}\n`;
          message += `   User: ${userName}\n`;
          message += `   Done: ${standup.done}\n`;
          message += `   Doing: ${standup.doing}\n`;
          message += `   Blockers: ${standup.blockers || 'None'}`;
          if (index < standups.length - 1) message += '\n';
        });

        return {
          message: message,
          data: standups
        };
      } catch (error) {
        throw new Error('Failed to search standups: ' + (error.response?.data?.error || error.message));
      }
    }
  },

  {
    name: 'get_standup',
    description: 'Get details of a specific standup',
    requiresAuth: true,
    inputSchema: {
      type: 'object',
      properties: {
        standup_id: {
          type: 'number',
          description: 'ID of the standup to retrieve'
        }
      },
      required: ['standup_id']
    },
    execute: async (args, railsApiUrl, session) => {
      if (!args.standup_id) {
        throw new Error('Standup ID is required');
      }

      try {
        const response = await axios.get(`${railsApiUrl}/v1/standups/${args.standup_id}?user_id=${session.user_id}`);
        const standup = response.data;

        return {
          message: `Standup ID: ${standup.id} for ${standup.standup_date}. Done: ${standup.done}, Doing: ${standup.doing}, Blockers: ${standup.blockers}. Created: ${standup.created_at}, Last Updated: ${standup.updated_at}`,
          data: standup
        };
      } catch (error) {
        if (error.response?.status === 404) {
          throw new Error('Standup not found or access denied');
        }
        throw new Error('Failed to get standup: ' + (error.response?.data?.error || error.message));
      }
    }
  },

  {
    name: 'update_standup',
    description: 'Update an existing standup entry (requires login). You can only update your own standups.',
    requiresAuth: true,
    inputSchema: {
      type: 'object',
      properties: {
        standup_id: {
          type: 'number',
          description: 'ID of the standup to update'
        },
        done: {
          type: 'string',
          description: 'Updated done field'
        },
        doing: {
          type: 'string',
          description: 'Updated doing field'
        },
        blockers: {
          type: 'string',
          description: 'Updated blockers field'
        }
      },
      required: ['standup_id']
    },
    execute: async (args, railsApiUrl, session) => {
      if (!args.standup_id) {
        throw new Error('Standup ID is required');
      }

      if (!args.done && !args.doing && args.blockers === undefined) {
        throw new Error('At least one field (done, doing, or blockers) must be provided to update');
      }

      try {
        const getResponse = await axios.get(`${railsApiUrl}/v1/standups/${args.standup_id}`);
        const standup = getResponse.data;

        if (standup.user_id !== session.user_id) {
          throw new Error(`Access denied: You can only update your own standups. This standup belongs to ${standup.user?.first_name || 'another user'}.`);
        }
      } catch (error) {
        if (error.message.includes('Access denied')) {
          throw error;
        }
        throw new Error('Standup not found or access denied');
      }

      const updateData = { user_id: session.user_id };

      if (args.done) updateData.done = args.done;
      if (args.doing) updateData.doing = args.doing;
      if (args.blockers !== undefined) updateData.blockers = args.blockers;

      try {
        const response = await axios.put(`${railsApiUrl}/v1/standups/${args.standup_id}`, updateData);
        const standup = response.data;

        return {
          message: `Standup ID: ${standup.id} updated successfully! Done: ${standup.done}, Doing: ${standup.doing}, Blockers: ${standup.blockers}. Last updated: ${standup.updated_at}`,
          data: standup
        };
      } catch (error) {
        if (error.response?.status === 404) {
          throw new Error('Standup not found or access denied');
        }
        if (error.response?.status === 403) {
          throw new Error('Access denied: You can only update your own standups');
        }
        throw new Error('Failed to update standup: ' + (error.response?.data?.error || error.message));
      }
    }
  },

  {
    name: 'find_and_update_standup',
    description: 'Find a standup by searching and update it (requires login). Searches across all users but you can only update your own standups.',
    requiresAuth: true,
    inputSchema: {
      type: 'object',
      properties: {
        search_text: {
          type: 'string',
          description: 'Text to search for in done, doing, or blockers fields'
        },
        date: {
          type: 'string',
          description: 'Standup date (YYYY-MM-DD) to narrow down search'
        },
        new_done: {
          type: 'string',
          description: 'New value for done field'
        },
        new_doing: {
          type: 'string',
          description: 'New value for doing field'
        },
        new_blockers: {
          type: 'string',
          description: 'New value for blockers field'
        }
      },
      required: ['search_text']
    },
    execute: async (args, railsApiUrl, session) => {
      if (!args.search_text || args.search_text.trim().length === 0) {
        throw new Error('Search text is required to find the standup');
      }

      if (!args.new_done && !args.new_doing && args.new_blockers === undefined) {
        throw new Error('At least one field (new_done, new_doing, or new_blockers) must be provided to update');
      }

      try {
        const params = new URLSearchParams();
        params.append('authenticated_user_id', session.user_id);
        params.append('q', args.search_text);
        if (args.date) params.append('search_date', args.date);

        const searchResponse = await axios.get(`${railsApiUrl}/v1/standups?${params.toString()}`);
        const standups = searchResponse.data;

        if (standups.length === 0) {
          return {
            message: `No standups found matching "${args.search_text}". Please try a different search term or check the date.`,
            data: { found: false }
          };
        }

        if (standups.length > 1) {
          const standupList = standups.map((s, i) => {
            const userName = s.user ? `${s.user.first_name} ${s.user.last_name}` : s.name;
            const isOwn = s.user_id === session.user_id ? '[YOUR STANDUP]' : '[READ-ONLY]';
            return `${i + 1}. ID: ${s.id}, Date: ${s.standup_date} ${isOwn}\n   User: ${userName}\n   Done: ${s.done}\n   Doing: ${s.doing}\n   Blockers: ${s.blockers || 'None'}`;
          }).join('\n\n');

          return {
            message: `Found ${standups.length} standups matching "${args.search_text}". Please be more specific or provide the exact standup_id to update:\n\n${standupList}`,
            data: { found: true, count: standups.length, standups: standups }
          };
        }

        const standup = standups[0];

        // Check ownership before updating
        if (standup.user_id !== session.user_id) {
          const userName = standup.user ? `${standup.user.first_name} ${standup.user.last_name}` : 'another user';
          throw new Error(`Access denied: Found standup ID ${standup.id} but it belongs to ${userName}. You can only update your own standups.`);
        }

        const updateData = { user_id: session.user_id };

        if (args.new_done) updateData.done = args.new_done;
        if (args.new_doing) updateData.doing = args.new_doing;
        if (args.new_blockers !== undefined) updateData.blockers = args.new_blockers;

        const updateResponse = await axios.put(`${railsApiUrl}/v1/standups/${standup.id}`, updateData);
        const updatedStandup = updateResponse.data;

        return {
          message: `Found and updated standup ID: ${updatedStandup.id} for ${updatedStandup.standup_date}. Updated fields: Done: ${updatedStandup.done}, Doing: ${updatedStandup.doing}, Blockers: ${updatedStandup.blockers}`,
          data: updatedStandup
        };
      } catch (error) {
        throw new Error('Failed to find and update standup: ' + (error.response?.data?.error || error.message));
      }
    }
  },

  {
    name: 'delete_standup',
    description: 'Delete a standup entry (requires login, destructive action). You can only delete your own standups.',
    requiresAuth: true,
    inputSchema: {
      type: 'object',
      properties: {
        standup_id: {
          type: 'number',
          description: 'ID of the standup to delete'
        }
      },
      required: ['standup_id']
    },
    execute: async (args, railsApiUrl, session) => {
      if (!args.standup_id) {
        throw new Error('Standup ID is required');
      }

      // First, verify the standup belongs to the logged-in user
      try {
        const getResponse = await axios.get(`${railsApiUrl}/v1/standups/${args.standup_id}`);
        const standup = getResponse.data;

        if (standup.user_id !== session.user_id) {
          throw new Error(`Access denied: You can only delete your own standups. This standup belongs to ${standup.user?.first_name || 'another user'}.`);
        }
      } catch (error) {
        if (error.message.includes('Access denied')) {
          throw error;
        }
        throw new Error('Standup not found or access denied');
      }

      try {
        await axios.delete(`${railsApiUrl}/v1/standups/${args.standup_id}?user_id=${session.user_id}`);

        return {
          message: `Standup ID: ${args.standup_id} has been deleted. The standup entry has been permanently removed from the database.`,
          data: { deleted_id: args.standup_id }
        };
      } catch (error) {
        if (error.response?.status === 404) {
          throw new Error('Standup not found or access denied');
        }
        if (error.response?.status === 403) {
          throw new Error('Access denied: You can only delete your own standups');
        }
        throw new Error('Failed to delete standup: ' + (error.response?.data?.error || error.message));
      }
    }
  }
];

module.exports = tools;


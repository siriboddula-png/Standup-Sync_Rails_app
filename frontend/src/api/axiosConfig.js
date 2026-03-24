import axios from 'axios';

const API = axios.create({
  baseURL: 'http://localhost:3000/api',
  headers: { 'Content-Type': 'application/json' }
});

API.interceptors.request.use(
  (config) => {
    const user = JSON.parse(localStorage.getItem('user') || 'null');

    if (user && user.id) {
      if (config.method === 'get') {
        config.params = {
          ...config.params,
          authenticated_user_id: user.id
        };
      } else {
        if (config.data) {
          config.data = {
            ...config.data,
            authenticated_user_id: user.id
          };
        } else {
          config.data = { authenticated_user_id: user.id };
        }
      }
    }

    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

export default API;
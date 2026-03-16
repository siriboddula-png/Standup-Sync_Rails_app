import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import API from '../api/axiosConfig';
import Notification from './Notification';

const Login = ({ setToken }) => {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [errors, setErrors] = useState([]);

  const handleSubmit = async (e) => {
  e.preventDefault();
  try {
    const response = await API.post('/users/sign_in', {
      email: email,
      password: password
    });
    setToken(response.data); 
    setErrors([]);
  } catch (err) {
    console.error("Login Error:", err.response?.data);
    setErrors(["Login failed. Invalid email or password."]);
  }
};

  return (
    <div className="max-w-7xl mx-auto px-4 mt-12">
      <div className="flex justify-center">
        <div className="w-full max-w-md">
          <div className="bg-white shadow-sm rounded-lg border-2 border-grey">
            <div className="p-6">
              <div className="text-center mb-6">
                <h2 className="font-bold text-2xl">Welcome Back</h2>
                <p className="text-gray-600 text-sm mt-1">Log in to sync your daily updates</p>
              </div>

              <Notification errors={errors} />

              <form onSubmit={handleSubmit}>
                <div className="mb-4 text-left">
                  <label className="block font-bold text-sm mb-2">Email</label>
                  <input
                    type="email"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#0d6efd] focus:border-transparent"
                    placeholder="name@example.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                  />
                </div>
                <div className="mb-4 text-left">
                  <label className="block font-bold text-sm mb-2">Password</label>
                  <input
                    type="password"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#0d6efd] focus:border-transparent"
                    placeholder="Enter your password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                  />
                </div>
                <div className="mb-4">
                  <button
                    type="submit"
                    className="w-full bg-[#0d6efd] hover:bg-[#0b5ed7] text-white font-bold py-2 px-4 rounded-md transition-colors"
                  >
                    Log in
                  </button>
                </div>
              </form>

              <div className="text-center mt-6">
                <button
                  onClick={() => navigate('/register')}
                  className="w-full border border-[#0d6efd] text-[#0d6efd] hover:bg-[#0d6efd] hover:text-white font-bold py-2 px-4 rounded-md transition-colors"
                >
                  Create an account
                </button>
              </div>
              <div className="text-center mt-4">
                <button
                  className="text-[#0d6efd] hover:underline text-sm"
                  onClick={() => navigate('/forgot-password')}
                >
                  Forgot Password
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;
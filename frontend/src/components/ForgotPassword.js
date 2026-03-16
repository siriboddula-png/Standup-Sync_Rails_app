import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import API from '../api/axiosConfig';
import Notification from "./Notification"

const ForgotPassword = () => {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [message, setMessage] = useState('');
  const [error, setError] = useState([]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMessage('');
    setError([]);
    
    try {
      await API.post('/users/password', { user: { email } });
      setMessage('Check your email for reset instructions.');
    } catch (err) {
      setError([err.response?.data?.errors?.join(', ') || 'Something went wrong. Please try again.']);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 mt-12">
      <div className="flex justify-center">
        <div className="w-full max-w-md">
          <div className="bg-white shadow-sm rounded-lg border-2 border-grey">
            <div className="p-6 text-center">
              <h2 className="font-bold text-2xl mb-2">Forgot Password?</h2>
              <p className="text-gray-600 text-sm mb-6">Enter your email and we'll send you reset instructions.</p>

              <Notification message={message} type="success"/>
              <Notification errors={error}/>

              <form onSubmit={handleSubmit}>
                <div className="mb-6 text-left">
                  <label className="block font-bold text-sm mb-2">Email</label>
                  <input
                    type="email"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#0d6efd] focus:border-transparent"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="Enter your email address"
                    required
                    autoFocus
                  />
                </div>

                <div className="mb-4">
                  <button
                    type="submit"
                    className="w-full bg-[#0d6efd] hover:bg-[#0b5ed7] text-white font-bold py-2 px-4 rounded-md transition-colors"
                  >
                    Send Reset Instructions
                  </button>
                </div>
              </form>

              <div className="text-center mt-4">
                <hr className="opacity-10 my-1" />
                <button
                  className="text-[#0d6efd] hover:underline text-base"
                  onClick={() => navigate('/login')}
                >
                  Back to Login
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ForgotPassword;
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import API from '../api/axiosConfig';
import Notification from './Notification';

const Register = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    first_name: '',
    last_name: '',
    username: '',
    email: '',
    password: '',
    password_confirmation: ''
  });
  const [errors, setErrors] = useState([]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrors([]);

    try {
      await API.post('/users', formData);
      alert("Registration successful! Please log in.");
      navigate('/login');
    }
    catch (err) {
      if (err.response && err.response.data && err.response.data.errors) {
        const railsErrors = Object.entries(err.response.data.errors).map(
          ([field, msgs]) => `${field.replace('_', ' ')} ${msgs.join(', ')}`
        );
        setErrors(railsErrors);
      } else {
        setErrors(["Database connection failed. Please check Rails logs."]);
      }
    }
  };

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  return (
    <div className="max-w-7xl mx-auto px-4 mt-12">
      <div className="flex justify-center">
        <div className="w-full max-w-lg">
          <div className="bg-white shadow-sm rounded-lg border-2 border-grey p-6">
            <h2 className="font-bold text-2xl text-center mb-6">Create Account</h2>
            <p className="text-gray-600 text-sm text-center mb-6">Join the team and start syncing updates</p>
            <Notification errors={errors} />
            <form onSubmit={handleSubmit}>
              <div className="grid grid-cols-2 gap-4 mb-4">
                <div>
                  <label htmlFor="first_name" className="block font-bold text-sm mb-2">First Name</label>
                  <input
                    id="first_name"
                    name="first_name"
                    type="text"
                    placeholder="Enter first name"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#0d6efd] focus:border-transparent"
                    onChange={handleChange}
                    required
                  />
                </div>
                <div>
                  <label htmlFor="last_name" className="block font-bold text-sm mb-2">Last Name</label>
                  <input
                    id="last_name"
                    name="last_name"
                    type="text"
                    placeholder="Enter last name"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#0d6efd] focus:border-transparent"
                    onChange={handleChange}
                    required
                  />
                </div>
              </div>

              <div className="mb-4">
                <label htmlFor="username" className="block font-bold text-sm mb-2">Username</label>
                <input
                  id="username"
                  name="username"
                  type="text"
                  placeholder="Choose a unique username"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#0d6efd] focus:border-transparent"
                  onChange={handleChange}
                  required
                />
              </div>

              <div className="mb-4">
                <label htmlFor="email" className="block font-bold text-sm mb-2">Email Address</label>
                <input
                  id="email"
                  name="email"
                  type="email"
                  placeholder="name@example.com"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#0d6efd] focus:border-transparent"
                  onChange={handleChange}
                  required
                />
              </div>

              <div className="mb-4">
                <label htmlFor="password" className="font-bold text-sm mb-1">Password  </label>
                <span className="font-light text-sm text-gray-600 mb-2">(Minimum 6 characters)</span>
                <input
                  id="password"
                  name="password"
                  type="password"
                  placeholder="Create a password"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#0d6efd] focus:border-transparent"
                  onChange={handleChange}
                  required
                />
              </div>

              <div className="mb-6">
                <label htmlFor="password_confirmation" className="block font-bold text-sm mb-2">Confirm Password</label>
                <input
                  id="password_confirmation"
                  name="password_confirmation"
                  type="password"
                  placeholder="Re-enter password"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#0d6efd] focus:border-transparent"
                  onChange={handleChange}
                  required
                />
              </div>

              <button
                type="submit"
                className="w-full bg-[#0d6efd] hover:bg-[#0b5ed7] text-white font-bold py-2 px-4 rounded-md transition-colors"
              >
                Sign Up
              </button>
            </form>

            <div className="text-center mt-4">
              <hr className="opacity-10 my-1" />
              <button
                className="text-[#0d6efd] hover:underline text-base"
                onClick={() => navigate('/login')}
              >
                Already have an account? Log in
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Register;
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import API from '../../api/axiosConfig';
import { formatDate, hasBlocker } from '../../utils/standupHelpers';

const StandupViewPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [standup, setStandup] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchStandup = async () => {
      try {
        const response = await API.get(`/v1/standups/${id}`);
        console.log('Standup data:', response.data);
        setStandup(response.data);
      } catch (err) {
        console.error('Failed to fetch standup:', err);
        console.error('Error response:', err.response);
        const errorMessage = err.response?.data?.error || err.message || 'Failed to load standup';
        setError(`Error: ${errorMessage}. The standup may have been deleted or there may be a server issue.`);
      }
    };

    fetchStandup();
  }, [id]);

  if (error || !standup) {
    return (
      <div className="max-w-7xl mx-auto px-4 mt-4">
        <div className="bg-red-50 border border-red-200 text-red-800 px-4 py-3 rounded" role="alert">
          {error || 'Standup not found'}
        </div>
        <button onClick={() => navigate('/dashboard')} className="mt-3 bg-[#0d6efd] hover:bg-[#0b5ed7] text-white font-medium py-2 px-4 rounded">
          Back to Dashboard
        </button>
      </div>
    );
  }

  const userName = standup.user ? `${standup.user.first_name} ${standup.user.last_name}`
    : standup.name;

  const shareableUrl = `${window.location.origin}/dashboard/v1/${id}`;

  const copyToClipboard = () => {
    navigator.clipboard.writeText(shareableUrl);
    alert('Link copied to clipboard!');
  };

  return (
    <div className="max-w-7xl mx-auto px-4 mt-4">
      <div className="mb-4">
        <button
          onClick={() => navigate('/dashboard')}
          className="text-gray-600 hover:text-gray-800 no-underline block mb-2 p-0 border-0 bg-transparent"
        >
          ← Back to Team View
        </button>
        <h1 className="text-3xl font-bold mb-2">Standup Update</h1>
      </div>

      <div className="bg-white shadow-sm rounded-lg mb-4">
        <div className="p-6">
          <div className="flex justify-between items-start mb-4">
            <div>
              <h3 className="text-xl font-bold mb-1">{userName}</h3>
              <p className="text-gray-600 mb-0">
                {standup.standup_date ? formatDate(standup.standup_date) : 'No date'}
              </p>
            </div>
            <button
              onClick={copyToClipboard}
              className="border border-[#6c757d] hover:bg-[#6c757d] hover:text-white text-[#6c757d] font-medium py-1 px-3 rounded text-sm"
              title="Copy shareable link"
            >
              Copy Link
            </button>
          </div>

          <hr className="my-4 border-gray-200" />

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
            <div className="mb-3">
              <small className="uppercase font-bold text-gray-900 text-sm">Completed tasks</small>
              <p className="mb-0">{standup.done}</p>
            </div>
            <div className="mb-3">
              <small className="uppercase font-bold text-gray-900 text-sm">Tasks in progress</small>
              <p className="mb-0">{standup.doing}</p>
            </div>
          </div>

          {hasBlocker(standup.blockers) && (
            <div className="mt-3 p-3 rounded bg-red-50 text-red-700 border border-red-200">
              <h5 className="font-bold mb-2 flex items-center">
                <i className="bi bi-exclamation-triangle-fill mr-2"></i>
                BLOCKER
              </h5>
              <p className="mb-0">{standup.blockers}</p>
            </div>
          )}

          {!hasBlocker(standup.blockers) && standup.blockers && (
            <div className="mt-3">
              <small className="uppercase font-bold text-gray-900 text-sm">Blockers</small>
              <p className="text-gray-600 mb-0 mt-2">{standup.blockers}</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default StandupViewPage;


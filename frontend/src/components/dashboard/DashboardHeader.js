import React from 'react';
import { formatShortDate, countRecentBlockers } from '../../utils/standupHelpers';

const DashboardHeader = ({ view, user, standups, onViewChange, onLogout }) => {
  const recentBlockersCount = countRecentBlockers(standups);

  if (view === 'profile') {
    return (
      <div>
        <button
          onClick={() => onViewChange('team')}
          className="text-gray-600 hover:text-gray-800 no-underline block mb-2 p-0 border-0 bg-transparent"
        >
          ← Back to Team View
        </button>
        <h1 className="text-4xl font-bold mb-0">My Logs</h1>
        <p className="text-gray-600 mb-0">
          Viewing all updates for <strong>{user.email}</strong>
        </p>
      </div>
    );
  }

  if (view === 'new') {
    return (
      <div className="mt-3">
        <button
          onClick={() => onViewChange('team')}
          className="text-gray-600 hover:text-gray-800 no-underline block mb-2 p-0 border-0 bg-transparent"
        >
          ← Back to Team View
        </button>
      </div>
    );
  }

  return (
    <div>
      <h6 className="text-gray-600 uppercase font-bold text-xs mb-1">
        Standup Sync — {formatShortDate()}
      </h6>
      <h1 className="text-4xl font-bold text-gray-900 mb-2">Team Updates</h1>
      <div className="flex items-center gap-2">
        {recentBlockersCount > 0 ? (
          <span className="inline-flex items-center bg-[#dc3545] text-white rounded-full px-4 py-2 text-sm font-medium shadow-sm">
            
            {recentBlockersCount} Active Blockers(In last 7 days)
          </span>
        ) : (
          <span className="inline-flex items-center bg-[#198754] text-white rounded-full px-4 py-2 text-sm font-medium shadow-sm">
            <i className="bi bi-check-circle-fill mr-2"></i>
            All Clear (No Recent Blockers)
          </span>
        )}
      </div>
    </div>
  );
};

const HeaderActions = ({ onViewChange, onLogout }) => (
  <div className="flex gap-2 items-center">
    <button
      onClick={() => onViewChange('profile')}
      className="border border-[#212529] hover:bg-[#212529] hover:text-white text-[#212529] font-medium px-3 py-2 rounded shadow-sm transition-colors"
    >
      My Profile
    </button>
    <button
      onClick={() => onViewChange('new')}
      className="bg-[#0d6efd] hover:bg-[#0b5ed7] text-white font-medium px-4 py-2 rounded shadow-sm"
    >
      Post My Update
    </button>
    <button
      onClick={onLogout}
      className="text-[#dc3545] hover:text-[#bb2d3b] no-underline text-sm bg-transparent border-0 px-2"
    >
      Logout
    </button>
  </div>
);

const Header = ({ view, user, standups, onViewChange, onLogout }) => (
  <>
    <div className="flex justify-between items-start mb-2">
      <DashboardHeader
        view={view}
        user={user}
        standups={standups}
        onViewChange={onViewChange}
      />
      <HeaderActions onViewChange={onViewChange} onLogout={onLogout} />
    </div>
    {view !== 'new' && <hr className="my-4 border-gray-200 opacity-50" />}
  </>
);

export default Header;


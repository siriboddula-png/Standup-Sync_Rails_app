import React from 'react';
import { useNavigate } from 'react-router-dom';
import { hasBlocker, getUserName } from '../../utils/standupHelpers';

const StandupRow = ({ standup, currentUserId, onEdit, onDelete }) => {
  const navigate = useNavigate();
  const isOwner = Number(standup.user_id) === Number(currentUserId);

  return (
    <tr className="border-b border-gray-200 hover:bg-gray-50">
      <td className="pl-4 py-3">
        <div className="flex items-center gap-2">
          <img
            src={standup.user?.gravatar_url || `https://www.gravatar.com/avatar/?d=identicon&s=40`}
            className="rounded-full border border-gray-300"
            width="30"
            height="30"
            alt="avatar"
          />
          <span className="font-bold">{getUserName(standup)}</span>
        </div>
      </td>
      <td className="text-gray-600 text-sm py-3">
        <div className="break-words overflow-hidden" style={{ maxWidth: '100%' }}>
          {standup.done}
        </div>
      </td>
      <td className="text-gray-600 text-sm py-3">
        <div className="break-words overflow-hidden" style={{ maxWidth: '100%' }}>
          {standup.doing}
        </div>
      </td>
      <td className="align-middle">
        {hasBlocker(standup.blockers) ? (
          <div className="p-2 rounded bg-red-50 text-red-700 border border-red-200 text-sm break-words overflow-hidden">
            <strong>BLOCKER:</strong> {standup.blockers}
          </div>
        ) : (
          <span className="text-gray-400 text-sm">-</span>
        )}
      </td>
      <td className="text-center">
        <div className="inline-flex rounded-md shadow-sm" role="group">
          <button
            onClick={() => navigate(`/dashboard/v1/${standup.id}`)}
            className="px-3 py-1.5 text-sm font-medium text-[#198754] bg-white border border-[#198754] rounded-l-md hover:bg-[#198754] hover:text-white focus:z-10 focus:ring-2 focus:ring-[#198754]">
            View
          </button>
          {isOwner && (
            <>
              <button
                onClick={() => onEdit(standup)}
                className="px-3 py-1.5 text-sm font-medium text-[#0d6efd] bg-white border-t border-b border-[#0d6efd] hover:bg-[#0d6efd] hover:text-white focus:z-10 focus:ring-2 focus:ring-[#0d6efd]">
                Edit
              </button>
              <button
                onClick={() => onDelete(standup.id)}
                className="px-3 py-1.5 text-sm font-medium text-[#dc3545] bg-white border border-[#dc3545] rounded-r-md hover:bg-[#dc3545] hover:text-white focus:z-10 focus:ring-2 focus:ring-[#dc3545]">
                Delete
              </button>
            </>
          )}
        </div>
      </td>
    </tr>
  );
};

export default StandupRow;


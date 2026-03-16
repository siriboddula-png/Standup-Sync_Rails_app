import React from 'react';
import { useNavigate } from 'react-router-dom';
import { formatDate } from '../../utils/standupHelpers';

const ProfileView = ({ standups, onEdit, onDelete, onCreateNew}) => {
  const navigate = useNavigate();
  if (standups.length === 0) {
    return (
      <div className="text-center py-5 rounded border-2 border-dashed border-gray-300 bg-gray-50">
        <p className="text-gray-600 mb-3">No updates yet</p>
        <button className="bg-[#0d6efd] hover:bg-[#0b5ed7] text-white font-medium px-4 py-2 rounded shadow-sm" onClick={onCreateNew}>Post my first update</button>
      </div>
    );
  }

  return (
    <div className="space-y-4 shadow-sm">
      {standups.map((standup) => (
        <div key={standup.id} className="bg-white border border-gray-200 rounded-lg p-4">
          <div className="flex justify-between items-center mb-2">
            <h5 className="font-bold mb-0 text-lg">{formatDate(standup.standup_date)}</h5>
            <div className="inline-flex rounded-md shadow-sm" role="group">
              <button
                onClick={() => navigate(`/dashboard/v1/${standup.id}`)}
                className="px-3 py-1.5 text-sm font-medium text-[#198754] bg-white border border-[#198754] rounded-l-md hover:bg-[#198754] hover:text-white focus:z-10 focus:ring-2 focus:ring-[#198754]"
                title="View standup"
              >
                View
              </button>
              <button
                onClick={() => onEdit(standup)}
                className="px-3 py-1.5 text-sm font-medium text-[#0d6efd] bg-white border-t border-b border-[#0d6efd] hover:bg-[#0d6efd] hover:text-white focus:z-10 focus:ring-2 focus:ring-[#0d6efd]"
              >
                Edit
              </button>
              <button
                onClick={() => onDelete(standup.id)}
                className="px-3 py-1.5 text-sm font-medium text-[#dc3545] bg-white border border-[#dc3545] rounded-r-md hover:bg-[#dc3545] hover:text-white focus:z-10 focus:ring-2 focus:ring-[#dc3545]"
              >
                Delete
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-7">
            <div>
              <small className="uppercase font-bold text-gray-900 text-sm">Completed tasks</small>
              <p className="mt-1">{standup.done}</p>
            </div>
            <div>
              <small className="uppercase font-bold text-gray-900 text-sm">Tasks in progress</small>
              <p className="mt-1">{standup.doing}</p>
            </div>
          </div>

          {standup.blockers && (
            <div className="mt-3 p-2 bg-red-50 rounded border border-red-200">
              <small className="font-bold text-red-700">BLOCKER:</small> <span className="text-red-700">{standup.blockers}</span>
            </div>
          )}
        </div>
      ))}
    </div>
  );
};

export default ProfileView;


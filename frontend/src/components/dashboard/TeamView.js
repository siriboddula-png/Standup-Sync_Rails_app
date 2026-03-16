import React from 'react';
import { groupByDate, formatDate } from '../../utils/standupHelpers';
import StandupRow from './StandupRow';

const TeamView = ({ standups, currentUserId, onEdit, onDelete }) => {
  const groupedStandups = groupByDate(standups);

  if (Object.keys(groupedStandups).length === 0) {
    return (
      <div className="text-center py-5">
        <p className="text-gray-600">No updates found.</p>
      </div>
    );
  }

  return (
    <>
      {Object.entries(groupedStandups).map(([date, updates]) => (
        <div key={date} className="mb-8">
          <div className="flex items-center mb-3">
            <h4 className="font-bold text-lg mb-0 text-blue-600">
              {formatDate(date)}
            </h4>
            <hr className="flex-grow ml-2 border-gray-200 opacity-50" />
          </div>

          <div className="bg-white shadow-sm rounded-lg overflow-hidden">
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200" style={{tableLayout:'fixed',width:'100%'}}>
                <colgroup>
                  <col style={{ width: '12%' }} />
                  <col style={{ width: '22%' }} />
                  <col style={{ width: '25%' }} />
                  <col style={{ width: '18%' }} />
                  <col style={{ width: '15%' }} />
                </colgroup>
                <thead className="bg-gray-50">
                  <tr>
                    <th className="pl-4 py-3 text-left text-sm font-semibold text-gray-900 uppercase tracking-wider">Name</th>
                    <th className="py-3 text-left text-sm font-semibold text-gray-900 uppercase tracking-wider">Completed tasks</th>
                    <th className="py-3 text-left text-sm font-semibold text-gray-900 uppercase tracking-wider">Tasks in progress</th>
                    <th className="py-3 text-left text-sm font-semibold text-gray-900 uppercase tracking-wider">Blockers</th>
                    <th className="py-3 text-center text-sm font-semibold text-gray-900 uppercase tracking-wider">Actions</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {updates.map((standup) => (
                    <StandupRow
                      key={standup.id}
                      standup={standup}
                      currentUserId={currentUserId}
                      onEdit={onEdit}
                      onDelete={onDelete}
                    />
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      ))}
    </>
  );
};

export default TeamView;


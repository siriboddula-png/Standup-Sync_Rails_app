import React from 'react';

const StandupFormView = ({ formData, setFormData, onSubmit, onCancel, isEditing }) => {
  return (
    <div className="bg-white shadow rounded-lg mb-8 mt-8">
      <div className="bg-[#212529] text-white py-4 px-6 rounded-t-lg">
        <h2 className="font-bold mb-0 text-xl">{isEditing ? "Edit" : "New"} Standup Update</h2>
      </div>
      <form onSubmit={onSubmit} className="p-6">
        <div className="mb-6">
          <label className="block font-bold mb-2">
            Date <span className="font-normal text-gray-600 ml-1">Pick today or a past date to backfill</span>
          </label>
          <input
            type="date"
            className="w-full border border-gray-300 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
            value={formData.standup_date}
            onChange={e => setFormData({...formData, standup_date: e.target.value})}
            required
          />
        </div>

        <div className="mb-6">
          <label className="block font-bold mb-2">
            1. Accomplished tasks <span className="font-normal text-gray-600 ml-1">(Min 15 chars)</span>
          </label>
          <textarea
            className="w-full border border-gray-300 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
            rows="3"
            value={formData.done}
            onChange={e => setFormData({...formData, done: e.target.value})}
            required
          />
        </div>

        <div className="mb-6">
          <label className="block font-bold mb-2">
            2. Tasks in progress <span className="font-normal text-gray-600 ml-1">(Min 15 chars)</span>
          </label>
          <textarea
            className="w-full border border-gray-300 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
            rows="3"
            value={formData.doing}
            onChange={e => setFormData({...formData, doing: e.target.value})}
            required
          />
        </div>

        <div className="mb-6">
          <label className="block font-bold mb-2">
            3. Any Blockers? <span className="font-normal text-gray-600 ml-1">(Max 200 chars)</span>
          </label>
          <textarea
            className="w-full border border-gray-300 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
            rows="3"
            value={formData.blockers}
            onChange={e => setFormData({...formData, blockers: e.target.value})}
          />
        </div>

        <div className="bg-gray-50 p-4 rounded-b-lg flex gap-2 -mx-6 -mb-6 mt-6">
          <button type="submit" className="bg-[#212529] hover:bg-[#1c1f23] text-white font-medium px-6 py-2 rounded">Save Update</button>
          <button type="button" onClick={onCancel} className="border border-[#6c757d] hover:bg-[#6c757d] hover:text-white text-[#6c757d] font-medium px-4 py-2 rounded">
            Cancel
          </button>
        </div>
      </form>
    </div>
  );
};

export default StandupFormView;


import React from 'react';

const FilterBar = ({ 
  searchInputs, 
  setSearchInputs, 
  activeQuery, 
  onApplyNameFilter, 
  onApplyDateFilter, 
  onClearFilters, 
  onToggleSort 
}) => {
  const hasActiveFilters = activeQuery.search_name || activeQuery.search_date;

  return (
    <div className="bg-gray-50 shadow-sm rounded-lg mb-4">
      <div className="p-3 flex justify-between items-center">
        <div className="flex items-center gap-2">
          {/* Date Filter */}
          <input
            type="date"
            className="border border-gray-300 rounded px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            style={{ width: '180px' }}
            value={searchInputs.search_date}
            onChange={(e) => setSearchInputs({...searchInputs, search_date: e.target.value})}
          />
          <button
            className="bg-[#6c757d] hover:bg-[#5c636a] text-white font-medium px-3 py-1.5 rounded text-sm"
            onClick={onApplyDateFilter}
            style={{ width: '100px'}}
          >
            Filter Date
          </button>

          {/* Name Filter */}
          <input
            type="text"
            placeholder="Search name..."
            className="border border-gray-300 rounded px-3 py-1.5 text-sm ml-2 focus:outline-none focus:ring-2 focus:ring-[#0d6efd]"
            style={{width: '150px'}}
            value={searchInputs.search_name}
            onChange={(e) => setSearchInputs({...searchInputs, search_name: e.target.value})}
          />
          <button
            className="bg-[#6c757d] hover:bg-[#5c636a] text-white font-medium px-3 py-1.5 rounded text-sm"
            onClick={onApplyNameFilter}
          >
            Filter
          </button>

          {/* Clear Button */}
          {hasActiveFilters && (
            <button
              className="border border-[#6c757d] hover:bg-[#6c757d] hover:text-white text-[#6c757d] font-medium px-3 py-1.5 rounded text-sm ml-2"
              onClick={onClearFilters}
            >
              Clear
            </button>
          )}
        </div>

        {/* Sort Button */}
        <button
          className="border border-[#212529] hover:bg-[#212529] hover:text-white text-[#212529] font-medium px-3 py-1.5 rounded text-sm transition-colors"
          onClick={onToggleSort}
        >
          Sort By Date {activeQuery.sort === 'desc' ? '↓' : '↑'}
        </button>
      </div>
    </div>
  );
};

export default FilterBar;


import { FiSearch, FiArrowUp, FiArrowDown } from 'react-icons/fi';

export default function FilterSortBar({ 
  filters, 
  onFilterChange, 
  filterOptions,
  sortBy,
  sortOrder,
  onSortChange,
  sortOptions
}) {
  return (
    <div className="space-y-4 mb-6">
      {/* Search Bar */}
      {filterOptions.search && (
        <div className="relative">
          <FiSearch className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder={filterOptions.search.placeholder || 'Search...'}
            value={filters.search || ''}
            onChange={(e) => onFilterChange('search', e.target.value)}
            className="w-full pl-12 pr-4 py-3 rounded-xl bg-gray-800/50 border border-gray-700 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-brand/50 focus:border-transparent transition-all"
          />
        </div>
      )}

      {/* Filter Buttons */}
      <div className="flex gap-2 overflow-x-auto pb-2">
        {Object.entries(filterOptions).map(([key, config]) => {
          if (key === 'search' || !config.options) return null;
          
          return config.options.map(option => {
            const isActive = filters[key] === option.value;
            const count = option.count !== undefined ? ` (${option.count})` : '';
            
            return (
              <button
                key={`${key}-${option.value}`}
                onClick={() => onFilterChange(key, option.value)}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-all whitespace-nowrap ${
                  isActive
                    ? 'bg-brand text-white shadow-lg shadow-brand/30 scale-105'
                    : 'bg-gray-800/80 text-white border border-gray-600/50 hover:bg-gray-700/80 hover:border-brand/50'
                }`}
              >
                {option.label}{count}
              </button>
            );
          });
        })}
      </div>

      {/* Sort Options */}
      {sortOptions && sortOptions.length > 0 && (
        <div className="flex items-center gap-2 overflow-x-auto pb-2">
          <span className="text-sm font-medium text-gray-400 whitespace-nowrap">Sort by:</span>
          {sortOptions.map(option => (
            <button
              key={option.value}
              onClick={() => onSortChange(option.value)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-all whitespace-nowrap ${
                sortBy === option.value
                  ? 'bg-purple-600 text-white'
                  : 'bg-gray-800/80 text-white border border-gray-600/50 hover:bg-gray-700/80'
              }`}
            >
              {option.label}
            </button>
          ))}
          
          {/* Sort Order Toggle */}
          <button
            onClick={() => onSortChange(sortBy, sortOrder === 'asc' ? 'desc' : 'asc')}
            className="p-2 rounded-lg bg-gray-800/80 text-white border border-gray-600/50 hover:bg-gray-700/80 transition-all"
            title={sortOrder === 'asc' ? 'Ascending' : 'Descending'}
          >
            {sortOrder === 'asc' ? <FiArrowUp /> : <FiArrowDown />}
          </button>
        </div>
      )}
    </div>
  );
}

import React, { useState, useCallback } from 'react';

export default function GenericFilter({ entity, spec, onFilterChange }) {
  const [filters, setFilters] = useState({});

  const filterableFields = spec?.fields
    ? Object.entries(spec.fields)
        .filter(([_, field]) => field.filterable !== false && field.type !== 'ref')
        .map(([name, field]) => ({ name, ...field }))
    : [];

  const handleFilterChange = useCallback((fieldName, value) => {
    const newFilters = { ...filters, [fieldName]: value };
    if (!value || value === '') {
      delete newFilters[fieldName];
    }
    setFilters(newFilters);
    if (onFilterChange) {
      onFilterChange(newFilters);
    }
  }, [filters, onFilterChange]);

  const handleReset = useCallback(() => {
    setFilters({});
    if (onFilterChange) {
      onFilterChange({});
    }
  }, [onFilterChange]);

  if (!filterableFields.length) {
    return null;
  }

  return (
    <div className="generic-filter">
      <div className="filter-fields">
        {filterableFields.map((field) => (
          <div key={field.name} className="filter-field">
            <label htmlFor={`filter_${field.name}`}>
              {field.label || field.name}
            </label>
            {field.type === 'enum' ? (
              <select
                id={`filter_${field.name}`}
                value={filters[field.name] || ''}
                onChange={(e) => handleFilterChange(field.name, e.target.value)}
              >
                <option value="">All</option>
                {(spec?.options?.[field.name] || field.options || []).map((opt) => (
                  <option key={opt.value || opt} value={opt.value || opt}>
                    {opt.label || opt}
                  </option>
                ))}
              </select>
            ) : (
              <input
                id={`filter_${field.name}`}
                type="text"
                value={filters[field.name] || ''}
                onChange={(e) => handleFilterChange(field.name, e.target.value)}
                placeholder={`Filter by ${field.label || field.name}`}
              />
            )}
          </div>
        ))}
      </div>
      {Object.keys(filters).length > 0 && (
        <button onClick={handleReset} className="btn btn-secondary">
          Reset Filters
        </button>
      )}
    </div>
  );
}

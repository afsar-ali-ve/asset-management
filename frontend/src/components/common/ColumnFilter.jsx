import React from 'react';
import { COLUMN_FILTER_OPTIONS, columnFilterNeedsValue } from './columnFilterUtils';

const FilterIcon = () => (
    <svg className="h-3.5 w-3.5" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
      <path d="M2 3H14M4.5 7H11.5M6.5 11H9.5" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round"/>
    </svg>
);

const SearchIcon = () => (
    <svg className="h-3.5 w-3.5" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
      <path d="M7 12A5 5 0 1 0 7 2a5 5 0 0 0 0 10ZM10.5 10.5L14 14" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
    </svg>
);

const ColumnFilter = ({
    label,
    isOpen,
    isActive,
    draftFilter,
    popoverRef,
    onOpen,
    onDraftChange,
    onApply,
    onClear,
}) => {
    const valueDisabled = !columnFilterNeedsValue(draftFilter.operator);

    return (
      <div className="relative flex shrink-0 items-center">
        <button
          type="button"
          onClick={(event) => {
              event.stopPropagation();
              onOpen();
          }}
          className={`rounded p-1 transition hover:bg-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500 ${isActive ? 'bg-blue-50 text-blue-600 ring-1 ring-blue-200' : 'text-slate-500'}`}
          aria-label={`Filter ${label}`}
          aria-haspopup="dialog"
          aria-expanded={isOpen}
          title={`Filter ${label}`}
        >
          <FilterIcon />
        </button>

        {isOpen && (
          <div
            ref={popoverRef}
            className="absolute right-0 top-8 z-30 w-56 rounded-md border border-slate-300 bg-white p-3 text-slate-700 shadow-xl"
            role="dialog"
            aria-label={`${label} filter`}
          >
            <label className="sr-only" htmlFor={`column-filter-condition-${label}`}>
              Filter condition
            </label>
            <select
              id={`column-filter-condition-${label}`}
              value={draftFilter.operator}
              onChange={(event) => onDraftChange({ ...draftFilter, operator: event.target.value })}
              className="mb-2 w-full rounded border border-slate-300 bg-white px-2 py-2 text-sm font-normal normal-case tracking-normal text-slate-900 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              {COLUMN_FILTER_OPTIONS.map((option) => (
                <option key={option} value={option}>
                  {option}
                </option>
              ))}
            </select>

            <label className="sr-only" htmlFor={`column-filter-value-${label}`}>
              Filter value
            </label>
            <div className="relative">
              <span className="pointer-events-none absolute left-2 top-1/2 -translate-y-1/2 text-slate-400">
                <SearchIcon />
              </span>
              <input
                id={`column-filter-value-${label}`}
                value={draftFilter.value}
                onChange={(event) => onDraftChange({ ...draftFilter, value: event.target.value })}
                disabled={valueDisabled}
                placeholder={valueDisabled ? 'No value required' : 'Filter...'}
                className="w-full rounded border border-slate-300 bg-white py-2 pl-7 pr-2 text-sm font-normal normal-case tracking-normal text-slate-900 placeholder:text-slate-400 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-slate-100 disabled:text-slate-500"
              />
            </div>

            <div className="mt-4 flex justify-end gap-2">
              <button
                type="button"
                onClick={onClear}
                className="rounded border border-slate-300 bg-white px-3 py-2 text-sm font-normal normal-case tracking-normal text-slate-700 hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                Clear
              </button>
              <button
                type="button"
                onClick={onApply}
                className="rounded bg-blue-600 px-3 py-2 text-sm font-normal normal-case tracking-normal text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                Apply
              </button>
            </div>
          </div>
        )}
      </div>
    );
};

export default ColumnFilter;

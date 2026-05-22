import React, { useEffect, useRef, useState } from 'react';
const AssetToolbar = ({ selectedCount, showAddNew, selectedProductTypeName, onAddNew, onDeleteSelected, onClearFilters, columns = [], visibleColumns = [], onVisibleColumnsChange, }) => {
    const [columnsAnchorEl, setColumnsAnchorEl] = useState(null);
    const columnsMenuRef = useRef(null);
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (columnsMenuRef.current && !columnsMenuRef.current.contains(event.target)) {
                setColumnsAnchorEl(null);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);
    const handleColumnToggle = (field) => {
        if (!onVisibleColumnsChange) {
            return;
        }
        onVisibleColumnsChange((currentColumns) => currentColumns.includes(field)
            ? currentColumns.filter((value) => value !== field)
            : [...currentColumns, field]);
    };
    return (<div className="rounded-xl border border-slate-200 bg-white px-5 py-4 shadow-sm">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <div className="min-w-0 text-sm font-semibold text-slate-900">
          <span className="block truncate">{selectedProductTypeName || 'All Assets'}</span>
        </div>
        <div className="flex flex-wrap items-center gap-2 lg:flex-nowrap lg:justify-end">
          {showAddNew && (<button type="button" onClick={onAddNew} className="inline-flex h-9 shrink-0 items-center gap-2 rounded-md bg-blue-600 px-3.5 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500">
              <svg className="h-4 w-4" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
                <path d="M8 3V13M3 8H13" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/>
              </svg>
              Add new
            </button>)}
          <button type="button" onClick={onDeleteSelected} className="inline-flex h-9 shrink-0 items-center gap-2 rounded-md border border-slate-300 bg-white px-3.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-blue-500">
            <svg className="h-4 w-4" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
              <path d="M3 4H13M6 4V3H10V4M5 6V13H11V6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
            Delete{selectedCount > 0 ? ` (${selectedCount})` : ' (selected)'}
          </button>
        <button type="button" onClick={onClearFilters} className="inline-flex h-9 shrink-0 items-center rounded-md border border-slate-300 bg-white px-3.5 text-sm text-slate-700 transition hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-blue-500">
          Clear All Filters
        </button>
        <div className="relative">
          <button type="button" onClick={(event) => setColumnsAnchorEl(event.currentTarget)} className="inline-flex h-9 shrink-0 items-center rounded-md border border-slate-300 bg-white px-3.5 text-sm text-slate-700 transition hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-blue-500">
            &#9654; Select Columns
          </button>
          {columnsAnchorEl && (<div ref={columnsMenuRef} className="absolute right-0 z-10 mt-1 w-56 rounded-md border border-slate-300 bg-white p-2 shadow-lg">
              {columns.map((column) => (<label key={column.field} className="flex cursor-pointer items-center gap-2 rounded-sm px-2 py-1 hover:bg-slate-50">
                  <input type="checkbox" checked={visibleColumns.includes(column.field)} onChange={() => handleColumnToggle(column.field)} className="h-4 w-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500"/>
                  <span className="text-sm text-slate-700">{column.label}</span>
                </label>))}
            </div>)}
        </div>
        </div>
      </div>
    </div>);
};
export default AssetToolbar;

import React, { useEffect, useMemo, useState } from 'react';
import useResizableColumns from '../../../components/common/useResizableColumns';
import ColumnFilter from '../../../components/common/ColumnFilter';
import { DEFAULT_COLUMN_FILTER, columnFilterNeedsValue, valueMatchesColumnFilter, hasColumnFilters } from '../../../components/common/columnFilterUtils';
const defaultColumnWidths = {
    name: 240,
    product_type: 190,
    product: 220,
    assigned_user: 190,
    department: 180,
    asset_state: 180,
    location: 180,
};
export const assetColumns = [
    { field: 'name', label: 'Asset Name' },
    { field: 'product_type', label: 'Product Type' },
    { field: 'product', label: 'Product' },
    { field: 'assigned_user', label: 'User' },
    { field: 'department', label: 'Department' },
    { field: 'asset_state', label: 'Asset State' },
    { field: 'location', label: 'Location' },
];
const AssetTable = ({ assets, loading, error, selectedRows, onSelectedRowsChange, onView, onEdit, visibleColumns = assetColumns.map((column) => column.field), }) => {
    const [pageSize, setPageSize] = useState(10);
    const [currentPage, setCurrentPage] = useState(1);
    const [sortField, setSortField] = useState('name');
    const [sortDirection, setSortDirection] = useState('asc');
    const [filterMenuField, setFilterMenuField] = useState(null);
    const [columnFilters, setColumnFilters] = useState({});
    const [draftColumnFilter, setDraftColumnFilter] = useState(DEFAULT_COLUMN_FILTER);
    const { getColumnStyle, renderResizeHandle } = useResizableColumns(defaultColumnWidths);
    const filteredAssets = useMemo(() => {
        return assets.filter((asset) => assetColumns.every((column) => {
            const filter = columnFilters[column.field];
            return filter ? valueMatchesColumnFilter(asset[column.field], filter) : true;
        }));
    }, [assets, columnFilters]);
    const sortedAssets = useMemo(() => {
        return [...filteredAssets].sort((a, b) => {
            const aValue = (a[sortField] || '').toString().toLowerCase();
            const bValue = (b[sortField] || '').toString().toLowerCase();
            const result = aValue.localeCompare(bValue, undefined, { numeric: true, sensitivity: 'base' });
            return sortDirection === 'asc' ? result : -result;
        });
    }, [filteredAssets, sortDirection, sortField]);
    const totalPages = Math.max(1, Math.ceil(sortedAssets.length / pageSize));
    const startIndex = (currentPage - 1) * pageSize;
    const pageRows = useMemo(() => sortedAssets.slice(startIndex, startIndex + pageSize), [sortedAssets, startIndex, pageSize]);
    const allSelected = pageRows.length > 0 && pageRows.every((row) => selectedRows.includes(row.id));
    useEffect(() => {
        if (currentPage > totalPages) {
            setCurrentPage(totalPages);
        }
    }, [currentPage, totalPages]);
    const toggleRow = (id) => {
        if (selectedRows.includes(id)) {
            onSelectedRowsChange(selectedRows.filter((value) => value !== id));
        }
        else {
            onSelectedRowsChange([...selectedRows, id]);
        }
    };
    const toggleAll = () => {
        if (allSelected) {
            onSelectedRowsChange(selectedRows.filter((id) => !pageRows.some((row) => row.id === id)));
        }
        else {
            const next = Array.from(new Set([...selectedRows, ...pageRows.map((row) => row.id)]));
            onSelectedRowsChange(next);
        }
    };
    const handleSort = (field) => {
        if (sortField === field) {
            setSortDirection((currentDirection) => (currentDirection === 'asc' ? 'desc' : 'asc'));
        }
        else {
            setSortField(field);
            setSortDirection('asc');
        }
        setCurrentPage(1);
    };
    const openColumnFilter = (field) => {
        setDraftColumnFilter(columnFilters[field] ?? DEFAULT_COLUMN_FILTER);
        setFilterMenuField((currentField) => (currentField === field ? null : field));
    };
    const applyColumnFilter = (field) => {
        const needsValue = columnFilterNeedsValue(draftColumnFilter.operator);
        if (needsValue && !draftColumnFilter.value.trim()) {
            clearColumnFilter(field);
            return;
        }
        setColumnFilters((prev) => ({
            ...prev,
            [field]: {
                ...draftColumnFilter,
                value: needsValue ? draftColumnFilter.value : '',
            },
        }));
        setFilterMenuField(null);
        setCurrentPage(1);
    };
    const clearColumnFilter = (field) => {
        setColumnFilters((prev) => {
            const next = { ...prev };
            delete next[field];
            return next;
        });
        setDraftColumnFilter(DEFAULT_COLUMN_FILTER);
        setFilterMenuField(null);
        setCurrentPage(1);
    };
    const clearAllColumnFilters = () => {
        setColumnFilters({});
        setFilterMenuField(null);
        setDraftColumnFilter(DEFAULT_COLUMN_FILTER);
        setCurrentPage(1);
    };
    const renderSortIcon = (field) => (<span className={`ml-2 text-[10px] leading-none ${sortField === field ? 'text-blue-600' : 'text-slate-400'}`} aria-hidden="true">
      {sortField === field && sortDirection === 'desc' ? '\u25BC' : '\u25B2'}
    </span>);
    const renderColumnHeader = (field, label) => (<th className="relative px-4 py-4 text-left font-semibold uppercase tracking-[0.16em]" style={getColumnStyle(field)}>
      <div className="flex w-full items-center justify-between gap-2">
        <button type="button" onClick={() => handleSort(field)} className="flex min-w-0 flex-1 items-center justify-between gap-2 text-left" aria-label={`Sort by ${label}`}>
          <span className="truncate">{label}</span>
          {renderSortIcon(field)}
        </button>
        <ColumnFilter
          label={label}
          isOpen={filterMenuField === field}
          isActive={Boolean(columnFilters[field])}
          draftFilter={draftColumnFilter}
          onOpen={() => openColumnFilter(field)}
          onDraftChange={setDraftColumnFilter}
          onApply={() => applyColumnFilter(field)}
          onClear={() => clearColumnFilter(field)}
        />
      </div>
      {renderResizeHandle(field)}
    </th>);
    const colSpan = visibleColumns.length + 2;
    return (<div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
      {hasColumnFilters(columnFilters) && (
        <div className="flex justify-end border-b border-slate-200 px-5 py-3">
          <button type="button" onClick={clearAllColumnFilters} className="rounded-md border border-slate-300 bg-white px-3 py-2 text-sm text-slate-700 hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-blue-500">
            Clear All Filters
          </button>
        </div>
      )}
      <div className="overflow-x-auto">
        <table className="w-full min-w-[1200px] table-fixed divide-y divide-slate-200 text-sm">
          <thead className="bg-slate-50 text-slate-500">
            <tr>
              <th className="w-14 px-4 py-4 text-left">
                <input type="checkbox" checked={allSelected} onChange={toggleAll} className="h-4 w-4 rounded border-slate-300 text-blue-600"/>
              </th>
              <th className="w-14 px-2 py-4 text-center" aria-label="Edit action"></th>
              {assetColumns.filter((column) => visibleColumns.includes(column.field)).map((column) => renderColumnHeader(column.field, column.label))}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200 bg-white">
            {loading && (<tr>
                <td colSpan={colSpan} className="px-6 py-12 text-center text-sm text-slate-500">
                  Loading assets...
                </td>
              </tr>)}
            {!loading && error && (<tr>
                <td colSpan={colSpan} className="px-6 py-12 text-center text-sm text-red-600">
                  {error}
                </td>
              </tr>)}
            {!loading && !error && pageRows.map((row) => (<tr key={row.id} className="transition-colors duration-150 hover:bg-slate-50">
                <td className="px-4 py-4 text-left">
                  <input type="checkbox" checked={selectedRows.includes(row.id)} onChange={() => toggleRow(row.id)} className="h-4 w-4 rounded border-slate-300 text-blue-600"/>
                </td>
                <td className="px-2 py-4 text-center">
                  <button type="button" onClick={() => onEdit(row)} className="inline-flex h-8 w-8 cursor-pointer items-center justify-center rounded-md text-slate-500 transition hover:bg-blue-50 hover:text-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-1" aria-label={`Edit ${row.name || 'asset'}`} title="Edit asset">
                    <svg className="h-3.5 w-3.5" viewBox="0 0 18 18" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
                      <path d="M11.65 3.35L14.65 6.35" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round"/>
                      <path d="M4.2 10.8L10.95 4.05C11.78 3.22 13.12 3.22 13.95 4.05C14.78 4.88 14.78 6.22 13.95 7.05L7.2 13.8L3.5 14.5L4.2 10.8Z" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"/>
                      <path d="M10.55 4.45L13.55 7.45" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round"/>
                    </svg>
                  </button>
                </td>
                {visibleColumns.includes('name') && <td className="px-4 py-4 text-slate-900" style={getColumnStyle('name')}>
                  <button type="button" onClick={() => onView(row)} className="max-w-full cursor-pointer truncate text-left font-semibold text-blue-600 underline-offset-4 transition hover:text-blue-700 hover:underline focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2" title={row.name || 'View asset details'}>
                    {row.name || '-'}
                  </button>
                </td>}
                {visibleColumns.includes('product_type') && <td className="px-4 py-4 text-slate-900" style={getColumnStyle('product_type')}>{row.product_type || ''}</td>}
                {visibleColumns.includes('product') && <td className="px-4 py-4 text-slate-900" style={getColumnStyle('product')}>{row.product || ''}</td>}
                {visibleColumns.includes('assigned_user') && <td className="px-4 py-4 text-slate-900" style={getColumnStyle('assigned_user')}>{row.assigned_user || ''}</td>}
                {visibleColumns.includes('department') && <td className="px-4 py-4 text-slate-900" style={getColumnStyle('department')}>{row.department || ''}</td>}
                {visibleColumns.includes('asset_state') && <td className="px-4 py-4 text-slate-900" style={getColumnStyle('asset_state')}>{row.asset_state || ''}</td>}
                {visibleColumns.includes('location') && <td className="px-4 py-4 text-slate-900" style={getColumnStyle('location')}>{row.location || ''}</td>}
              </tr>))}
            {!loading && !error && pageRows.length === 0 && (<tr>
                <td colSpan={colSpan} className="px-6 py-12 text-center text-sm text-slate-500">
                  No assets found
                </td>
              </tr>)}
          </tbody>
        </table>
      </div>

      <div className="flex flex-col gap-4 border-t border-slate-200 px-5 py-4 text-sm text-slate-600 md:flex-row md:items-center md:justify-between">
        <div className="flex items-center gap-2">
          <span>Page Size:</span>
          <select value={pageSize} onChange={(event) => {
            setPageSize(Number(event.target.value));
            setCurrentPage(1);
        }} className="rounded-md border border-slate-300 bg-white px-3 py-1 text-sm text-slate-900 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500">
            <option value={10}>10</option>
            <option value={25}>25</option>
            <option value={50}>50</option>
          </select>
        </div>

        <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
          <span>
            {sortedAssets.length === 0 ? '0 to 0 of 0' : `${startIndex + 1} to ${Math.min(startIndex + pageSize, sortedAssets.length)} of ${sortedAssets.length}`}
          </span>
          <div className="flex items-center gap-2">
            <button type="button" onClick={() => setCurrentPage((page) => Math.max(1, page - 1))} disabled={currentPage === 1} className="rounded-md border border-slate-300 px-3 py-1 text-sm text-slate-700 hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed">
              &#8592;
            </button>
            <span className="text-sm text-slate-600">Page {currentPage} of {totalPages}</span>
            <button type="button" onClick={() => setCurrentPage((page) => Math.min(totalPages, page + 1))} disabled={currentPage === totalPages} className="rounded-md border border-slate-300 px-3 py-1 text-sm text-slate-700 hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed">
              &#8594;
            </button>
          </div>
        </div>
      </div>
    </div>);
};
export default AssetTable;

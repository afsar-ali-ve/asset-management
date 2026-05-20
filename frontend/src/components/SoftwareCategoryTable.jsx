import React, { useEffect, useMemo, useRef, useState } from 'react';
import SoftwareCategoryForm from './SoftwareCategoryForm';
import Modal from './Modal';
import DeleteConfirmModal from './common/DeleteConfirmModal';
import useResizableColumns from './useResizableColumns';
import { COLUMN_FILTER_OPTIONS, DEFAULT_COLUMN_FILTER, columnFilterNeedsValue, valueMatchesColumnFilter } from './common/columnFilterUtils';
import { getSoftwareCategories, deleteSoftwareCategory } from '../services/api';
const filterOptions = ['Active Software Categories', 'All Software Categories'];
const allColumns = [
    { field: 'display_name', label: 'Software Category' },
    { field: 'description', label: 'Description' },
    { field: 'active', label: 'Active' },
];
const defaultColumnWidths = {
    display_name: 260,
    description: 420,
    active: 160,
};
const getSoftwareCategoryColumnValue = (item, field) => {
    if (field === 'active') {
        return item.active ? 'Yes' : 'No';
    }
    return item[field] ?? '';
};
const SoftwareCategoryTable = () => {
    const [softwareCategories, setSoftwareCategories] = useState([]);
    const [open, setOpen] = useState(false);
    const [editing, setEditing] = useState(null);
    const [activeFilter, setActiveFilter] = useState(filterOptions[0]);
    const [actionAnchorEl, setActionAnchorEl] = useState(null);
    const [actionRow, setActionRow] = useState(null);
    const [columnsAnchorEl, setColumnsAnchorEl] = useState(null);
    const [visibleColumns, setVisibleColumns] = useState(allColumns.map((column) => column.field));
    const [filterMenuField, setFilterMenuField] = useState(null);
    const [columnFilters, setColumnFilters] = useState({});
    const [draftColumnFilter, setDraftColumnFilter] = useState(DEFAULT_COLUMN_FILTER);
    const [currentPage, setCurrentPage] = useState(1);
    const [pageSize, setPageSize] = useState(10);
    const [sortField, setSortField] = useState('display_name');
    const [sortDirection, setSortDirection] = useState('asc');
    const [loading, setLoading] = useState(false);
    const [saving, setSaving] = useState(false);
    const [deleteTarget, setDeleteTarget] = useState(null);
    const [deleteLoading, setDeleteLoading] = useState(false);
    const [deleteError, setDeleteError] = useState('');
    const actionMenuRef = useRef(null);
    const columnsMenuRef = useRef(null);
    const filterMenuRef = useRef(null);
    const { getColumnStyle, renderResizeHandle } = useResizableColumns(defaultColumnWidths);
    const fetchSoftwareCategories = async () => {
        setLoading(true);
        try {
            const response = await getSoftwareCategories();
            setSoftwareCategories(response.data);
        }
        catch (error) {
            console.error('Error fetching software categories:', error);
        }
        finally {
            setLoading(false);
        }
    };
    useEffect(() => {
        fetchSoftwareCategories();
    }, []);
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (actionMenuRef.current &&
                !actionMenuRef.current.contains(event.target) &&
                actionAnchorEl &&
                !actionAnchorEl.contains(event.target)) {
                setActionAnchorEl(null);
            }
            if (columnsMenuRef.current && !columnsMenuRef.current.contains(event.target)) {
                setColumnsAnchorEl(null);
            }
            if (filterMenuRef.current && !filterMenuRef.current.contains(event.target)) {
                setFilterMenuField(null);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, [actionAnchorEl]);
    const filteredSoftwareCategories = useMemo(() => {
        return softwareCategories.filter((item) => {
            const matchesActiveFilter = activeFilter === filterOptions[0] ? item.active : true;
            if (!matchesActiveFilter) {
                return false;
            }
            return allColumns.every((column) => {
                const filter = columnFilters[column.field];
                if (!filter) {
                    return true;
                }
                return valueMatchesColumnFilter(getSoftwareCategoryColumnValue(item, column.field), filter);
            });
        });
    }, [activeFilter, columnFilters, softwareCategories]);
    const sortedSoftwareCategories = useMemo(() => {
        return [...filteredSoftwareCategories].sort((a, b) => {
            const aValue = getSoftwareCategoryColumnValue(a, sortField);
            const bValue = getSoftwareCategoryColumnValue(b, sortField);
            const result = aValue.toString().localeCompare(bValue.toString(), undefined, { numeric: true, sensitivity: 'base' });
            return sortDirection === 'asc' ? result : -result;
        });
    }, [filteredSoftwareCategories, sortDirection, sortField]);
    const totalPages = Math.max(1, Math.ceil(sortedSoftwareCategories.length / pageSize));
    const startIndex = (currentPage - 1) * pageSize;
    const endIndex = startIndex + pageSize;
    const paginatedData = sortedSoftwareCategories.slice(startIndex, endIndex);
    useEffect(() => {
        if (currentPage > totalPages) {
            setCurrentPage(totalPages);
        }
    }, [currentPage, totalPages]);
    const handleOpen = (item = null) => {
        setEditing(item);
        setOpen(true);
    };
    const handleClose = () => {
        setOpen(false);
        setEditing(null);
    };
    const handleSave = async () => {
        setSaving(true);
        try {
            await fetchSoftwareCategories();
            handleClose();
        }
        finally {
            setSaving(false);
        }
    };
    const handleDelete = (id) => {
        const item = actionRow || softwareCategories.find((currentItem) => currentItem.id === id) || { id };
        setDeleteTarget(item);
        setDeleteError('');
        setActionAnchorEl(null);
    };
    const handleConfirmDelete = async () => {
        if (!deleteTarget) {
            return;
        }
        setDeleteLoading(true);
        setDeleteError('');
        try {
            await deleteSoftwareCategory(deleteTarget.id);
            await fetchSoftwareCategories();
            setDeleteTarget(null);
        }
        catch (error) {
            console.error('Error deleting software category:', error);
            setDeleteError('Unable to delete this software category. Please try again.');
        }
        finally {
            setDeleteLoading(false);
        }
    };
    const handleCancelDelete = () => {
        if (deleteLoading) {
            return;
        }
        setDeleteTarget(null);
        setDeleteError('');
    };
    const handleClearFilters = () => {
        setActiveFilter(filterOptions[0]);
        setColumnFilters({});
        setFilterMenuField(null);
        setDraftColumnFilter(DEFAULT_COLUMN_FILTER);
        setCurrentPage(1);
    };
    const handleOpenColumnFilter = (field) => {
        setDraftColumnFilter(columnFilters[field] ?? DEFAULT_COLUMN_FILTER);
        setFilterMenuField((currentField) => (currentField === field ? null : field));
    };
    const handleApplyColumnFilter = (field) => {
        const needsValue = columnFilterNeedsValue(draftColumnFilter.operator);
        if (needsValue && !draftColumnFilter.value.trim()) {
            handleResetColumnFilter(field);
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
    const handleResetColumnFilter = (field) => {
        setColumnFilters((prev) => {
            const next = { ...prev };
            delete next[field];
            return next;
        });
        setDraftColumnFilter(DEFAULT_COLUMN_FILTER);
        setFilterMenuField(null);
        setCurrentPage(1);
    };
    const handlePageChange = (page) => {
        if (page >= 1 && page <= totalPages) {
            setCurrentPage(page);
        }
    };
    const handlePageSizeChange = (e) => {
        setPageSize(parseInt(e.target.value, 10));
        setCurrentPage(1);
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
    const actionMenuStyle = actionAnchorEl
        ? {
            position: 'absolute',
            top: actionAnchorEl.getBoundingClientRect().bottom + window.scrollY + 8,
            left: actionAnchorEl.getBoundingClientRect().left + window.scrollX,
        }
        : undefined;
    const renderColumnHeader = (field, label) => {
        const hasFilter = Boolean(columnFilters[field]);
        const isValueDisabled = draftColumnFilter.operator === 'Blank' || draftColumnFilter.operator === 'Not blank';
        return (<th className="relative px-4 py-4 text-left text-xs font-semibold uppercase tracking-wider text-slate-500" style={getColumnStyle(field)}>
        <div className="flex items-center justify-between gap-2">
          <button type="button" onClick={() => handleSort(field)} className="inline-flex items-center gap-1 text-left">
            {label}
            <span className={`text-[10px] leading-none ${sortField === field ? 'text-blue-600' : 'text-slate-400'}`} aria-hidden="true">
              {sortField === field && sortDirection === 'desc' ? '\u25BC' : '\u25B2'}
            </span>
          </button>
          <button type="button" onClick={(event) => {
                event.stopPropagation();
                handleOpenColumnFilter(field);
            }} className={`rounded p-1 hover:bg-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500 ${hasFilter ? 'text-blue-600' : 'text-slate-500'}`} aria-label={`Filter ${label}`}>
            <svg className="h-3.5 w-3.5" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M2 3H14M4.5 7H11.5M6.5 11H9.5" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round"/>
            </svg>
          </button>
        </div>

        {filterMenuField === field && (<div ref={filterMenuRef} className="absolute right-2 top-11 z-20 w-48 rounded-md border border-slate-300 bg-white p-3 text-slate-700 shadow-xl">
            <select value={draftColumnFilter.operator} onChange={(event) => setDraftColumnFilter((prev) => ({
                    ...prev,
                    operator: event.target.value,
                }))} className="mb-2 w-full rounded border border-slate-300 bg-white px-2 py-2 text-sm font-normal normal-case tracking-normal text-slate-900 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500">
              {COLUMN_FILTER_OPTIONS.map((option) => (<option key={option} value={option}>
                  {option}
                </option>))}
            </select>
            <div className="relative">
              <span className="pointer-events-none absolute left-2 top-1/2 -translate-y-1/2 text-slate-400">
                <svg className="h-3.5 w-3.5" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M7 12A5 5 0 1 0 7 2a5 5 0 0 0 0 10ZM10.5 10.5L14 14" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
                </svg>
              </span>
              <input value={draftColumnFilter.value} onChange={(event) => setDraftColumnFilter((prev) => ({ ...prev, value: event.target.value }))} disabled={isValueDisabled} placeholder="Filter..." className="w-full rounded border border-slate-300 bg-white py-2 pl-7 pr-2 text-sm font-normal normal-case tracking-normal text-slate-900 placeholder:text-slate-400 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-slate-100"/>
            </div>
            <div className="mt-4 flex justify-end gap-2">
              <button type="button" onClick={() => handleApplyColumnFilter(field)} className="rounded border border-slate-300 bg-white px-3 py-2 text-sm font-normal normal-case tracking-normal text-slate-700 hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-blue-500">
                Apply
              </button>
              <button type="button" onClick={() => handleResetColumnFilter(field)} className="rounded border border-slate-300 bg-white px-3 py-2 text-sm font-normal normal-case tracking-normal text-slate-700 hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-blue-500">
                Reset
              </button>
            </div>
          </div>)}
        {renderResizeHandle(field)}
      </th>);
    };
    return (<div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm sm:p-6 space-y-5">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-4">
        <div className="flex flex-col md:flex-row md:items-center gap-3">
          <select value={activeFilter} onChange={(e) => {
            setActiveFilter(e.target.value);
            setCurrentPage(1);
        }} className="w-full md:w-64 rounded-md border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500">
            {filterOptions.map((option) => (<option key={option} value={option}>
                {option}
              </option>))}
          </select>

          <button onClick={() => handleOpen()} className="rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500" type="button">
            New Software Category
          </button>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button onClick={handleClearFilters} className="rounded-md border border-slate-300 bg-white px-4 py-2 text-sm text-slate-700 hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-blue-500" type="button">
            Clear All Filters
          </button>
          <div className="relative">
            <button onClick={(e) => setColumnsAnchorEl(e.currentTarget)} className="rounded-md border border-slate-300 bg-white px-4 py-2 text-sm text-slate-700 hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-blue-500" type="button">
              &#9654; Select Columns
            </button>
            {columnsAnchorEl && (<div ref={columnsMenuRef} className="absolute right-0 z-10 mt-1 w-56 rounded-md border border-slate-300 bg-white p-2 shadow-lg">
                {allColumns.map((column) => (<label key={column.field} className="flex cursor-pointer items-center gap-2 rounded-sm px-2 py-1 hover:bg-slate-50">
                    <input type="checkbox" checked={visibleColumns.includes(column.field)} onChange={() => {
                    setVisibleColumns((prev) => prev.includes(column.field)
                        ? prev.filter((value) => value !== column.field)
                        : [...prev, column.field]);
                }} className="h-4 w-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500"/>
                    <span className="text-sm text-slate-700">{column.label}</span>
                  </label>))}
              </div>)}
          </div>
        </div>
      </div>

      {loading && (<div className="flex items-center justify-center py-12">
          <span className="h-10 w-10 animate-spin rounded-full border-b-2 border-t-2 border-blue-600"></span>
        </div>)}

      <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white shadow-sm">
        <table className="w-full min-w-[700px] table-fixed divide-y divide-slate-200">
          <thead className="bg-slate-50">
            <tr>
              <th className="w-12 px-4 py-4 text-left text-xs font-semibold uppercase tracking-wider text-slate-500"></th>
              {visibleColumns.includes('display_name') && renderColumnHeader('display_name', 'Software Category')}
              {visibleColumns.includes('description') && renderColumnHeader('description', 'Description')}
              {visibleColumns.includes('active') && renderColumnHeader('active', 'Active')}
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-slate-200">
            {paginatedData.map((item) => (<tr key={item.id} className="hover:bg-slate-50 transition-colors duration-150">
                <td className="w-12 px-4 py-4 whitespace-nowrap text-sm text-slate-900">
                  <button onClick={(event) => {
                event.stopPropagation();
                setActionRow(item);
                setActionAnchorEl(event.currentTarget);
            }} className="text-slate-400 hover:text-slate-600" aria-label="Actions" type="button">
                    <svg width="16" height="16" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <rect y="4" width="20" height="2" rx="1" fill="currentColor"/>
                      <rect y="9" width="20" height="2" rx="1" fill="currentColor"/>
                      <rect y="14" width="20" height="2" rx="1" fill="currentColor"/>
                    </svg>
                  </button>
                </td>
                {visibleColumns.includes('display_name') && <td className="px-4 py-4 whitespace-nowrap text-sm text-slate-900" style={getColumnStyle('display_name')}>{item.display_name}</td>}
                {visibleColumns.includes('description') && <td className="px-4 py-4 whitespace-nowrap text-sm text-slate-900" style={getColumnStyle('description')}>{item.description}</td>}
                {visibleColumns.includes('active') && (<td className="px-4 py-4 whitespace-nowrap text-sm text-slate-900" style={getColumnStyle('active')}>{getSoftwareCategoryColumnValue(item, 'active')}</td>)}
              </tr>))}
            {paginatedData.length === 0 && (<tr>
                <td colSpan={visibleColumns.length + 1} className="px-6 py-8 text-center text-sm text-slate-500">
                  No software categories found
                </td>
              </tr>)}
          </tbody>
        </table>
      </div>

      {actionAnchorEl && (<div ref={actionMenuRef} className="fixed z-10 w-40 rounded-md border border-slate-200 bg-white shadow-lg" data-action-menu style={actionMenuStyle}>
          <button onClick={() => {
                if (actionRow)
                    handleOpen(actionRow);
                setActionAnchorEl(null);
            }} className="block w-full px-4 py-2 text-left text-sm text-slate-700 hover:bg-slate-100" type="button">
            Edit
          </button>
          <button onClick={() => {
                if (actionRow)
                    handleDelete(actionRow.id);
                setActionAnchorEl(null);
            }} className="block w-full px-4 py-2 text-left text-sm text-slate-700 hover:bg-slate-100" type="button">
            Delete
          </button>
        </div>)}

      <div className="mt-6 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div className="flex items-center gap-2 text-sm text-slate-700">
          <span>Page Size:</span>
          <select value={pageSize} onChange={handlePageSizeChange} className="rounded-md border border-slate-300 bg-white px-3 py-1 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500">
            <option value={10}>10</option>
            <option value={25}>25</option>
            <option value={50}>50</option>
          </select>
        </div>

        <div className="flex flex-wrap items-center gap-3 text-sm text-slate-600">
          <span>
            {sortedSoftwareCategories.length === 0 ? '0 to 0 of 0' : `${startIndex + 1} to ${Math.min(endIndex, sortedSoftwareCategories.length)} of ${sortedSoftwareCategories.length}`}
          </span>
          <div className="flex items-center gap-2">
            <button onClick={() => handlePageChange(currentPage - 1)} disabled={currentPage === 1} className="rounded-md border border-slate-300 px-3 py-1 text-sm text-slate-700 hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed" type="button">
              &#8592;
            </button>
            <span className="text-sm text-slate-600">Page {currentPage} of {totalPages === 0 ? 1 : totalPages}</span>
            <button onClick={() => handlePageChange(currentPage + 1)} disabled={currentPage === totalPages} className="rounded-md border border-slate-300 px-3 py-1 text-sm text-slate-700 hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed" type="button">
              &#8594;
            </button>
          </div>
        </div>
      </div>

      <Modal
        open={open}
        title={editing ? 'Edit Software Category' : 'Add Software Category'}
        description={editing ? 'Update software category details.' : 'Create a new software category.'}
        onClose={handleClose}
        maxWidth="max-w-3xl"
      >
        <SoftwareCategoryForm editing={editing} onSave={handleSave} onClose={handleClose} saving={saving}/>
      </Modal>
      <DeleteConfirmModal
        isOpen={Boolean(deleteTarget)}
        title="Delete Software Category"
        message={deleteError || 'Are you sure you want to delete this software category?'}
        itemName={deleteTarget?.display_name || deleteTarget?.id}
        onConfirm={handleConfirmDelete}
        onCancel={handleCancelDelete}
        isLoading={deleteLoading}
      />
    </div>);
};
export default SoftwareCategoryTable;

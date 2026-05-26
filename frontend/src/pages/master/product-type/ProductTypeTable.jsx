import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import ButtonIcon from '../../../components/common/ButtonIcon';
import ProductTypeForm from './ProductTypeForm';
import Modal from '../../../components/common/Modal';
import DeleteConfirmModal from '../../../components/common/DeleteConfirmModal';
import useResizableColumns from '../../../components/common/useResizableColumns';
import { COLUMN_FILTER_OPTIONS, DEFAULT_COLUMN_FILTER, columnFilterNeedsValue, valueMatchesColumnFilter } from '../../../components/common/columnFilterUtils';
import { getProductTypes, deleteProductType } from '../../../services/api';
const filterOptions = ['Active Product Types', 'All Product Types'];
const allColumns = [
    { field: 'display_name', label: 'Display Name' },
    { field: 'api_name', label: 'API Name' },
    { field: 'asset_type', label: 'Asset Type' },
    { field: 'asset_category_type', label: 'Asset Category' },
    { field: 'description', label: 'Description' },
];
const defaultColumnWidths = {
    display_name: 260,
    api_name: 220,
    asset_type: 180,
    asset_category_type: 220,
    description: 360,
};
const getProductTypeId = (value) => {
    if (!value) {
        return '';
    }
    if (typeof value === 'object' && value !== null && 'id' in value) {
        return String(value.id);
    }
    return String(value);
};
const ProductTypeTable = () => {
    const [productTypes, setProductTypes] = useState([]);
    const [open, setOpen] = useState(false);
    const [editing, setEditing] = useState(null);
    const [childParent, setChildParent] = useState(null);
    const [activeFilter, setActiveFilter] = useState(filterOptions[0]);
    const [actionAnchorEl, setActionAnchorEl] = useState(null);
    const [actionRow, setActionRow] = useState(null);
    const [columnsAnchorEl, setColumnsAnchorEl] = useState(null);
    const actionMenuRef = useRef(null);
    const columnsMenuRef = useRef(null);
    const filterMenuRef = useRef(null);
    const [visibleColumns, setVisibleColumns] = useState([
        'display_name',
        'api_name',
        'asset_type',
        'asset_category_type',
        'description',
    ]);
    const [filterMenuField, setFilterMenuField] = useState(null);
    const [columnFilters, setColumnFilters] = useState({});
    const [draftColumnFilter, setDraftColumnFilter] = useState(DEFAULT_COLUMN_FILTER);
    const [currentPage, setCurrentPage] = useState(1);
    const [pageSize, setPageSize] = useState(10);
    const [sortField, setSortField] = useState('display_name');
    const [sortDirection, setSortDirection] = useState('asc');
    const [expandedProductTypeIds, setExpandedProductTypeIds] = useState(new Set());
    const [loading, setLoading] = useState(false);
    const [saving, setSaving] = useState(false);
    const [deleteTarget, setDeleteTarget] = useState(null);
    const [deleteLoading, setDeleteLoading] = useState(false);
    const [deleteError, setDeleteError] = useState('');
    const { getColumnStyle, renderResizeHandle } = useResizableColumns(defaultColumnWidths);
    useEffect(() => {
        fetchProductTypes();
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
    }, [columnsAnchorEl, actionAnchorEl]);
    const fetchProductTypes = async () => {
        setLoading(true);
        try {
            const response = await getProductTypes();
            setProductTypes(response.data);
        }
        catch (error) {
            console.error('Error fetching product types:', error);
        }
        finally {
            setLoading(false);
        }
    };
    const handleOpen = (item = null) => {
        setEditing(item);
        setChildParent(null);
        setOpen(true);
    };
    const handleCreateChild = (parentItem) => {
        setEditing(null);
        setChildParent(parentItem);
        setOpen(true);
        setActionAnchorEl(null);
    };
    const handleClose = () => {
        setOpen(false);
        setEditing(null);
        setChildParent(null);
    };
    const handleSave = async () => {
        setSaving(true);
        await fetchProductTypes();
        setSaving(false);
        setOpen(false);
        setEditing(null);
        setChildParent(null);
    };
    const handleDelete = (id) => {
        const item = actionRow || productTypes.find((currentItem) => currentItem.id === id) || { id };
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
            await deleteProductType(deleteTarget.id);
            await fetchProductTypes();
            setDeleteTarget(null);
        }
        catch (error) {
            console.error('Error deleting product type:', error);
            setDeleteError('Unable to delete this product type. Please try again.');
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
        setVisibleColumns(allColumns.map((column) => column.field));
        setCurrentPage(1);
    };
    const toggleProductType = (id) => {
        setExpandedProductTypeIds((currentIds) => {
            const nextIds = new Set(currentIds);
            if (nextIds.has(id)) {
                nextIds.delete(id);
            }
            else {
                nextIds.add(id);
            }
            return nextIds;
        });
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
    const actionMenuStyle = actionAnchorEl
        ? {
            top: actionAnchorEl.getBoundingClientRect().bottom + window.scrollY,
            left: actionAnchorEl.getBoundingClientRect().left + window.scrollX,
        }
        : {};
    const getParentProductTypeDisplay = useCallback((item, visited = new Set()) => {
        if (!getProductTypeId(item.parent_product_type)) {
            return item.display_name;
        }
        const parentValue = item.parent_product_type;
        let parent = null;
        if (typeof parentValue === 'object' && parentValue !== null) {
            parent = parentValue;
        }
        else {
            parent = productTypes.find((pt) => {
                const parentId = pt.id?.toString();
                const parentDisplay = pt.display_name;
                const valueString = parentValue?.toString();
                return parentId === valueString || parentDisplay === parentValue;
            }) || null;
        }
        if (!parent) {
            return item.display_name;
        }
        const parentIdKey = parent.id?.toString() || parent.display_name;
        if (visited.has(parentIdKey)) {
            return `${parent.display_name} >> ${item.display_name}`;
        }
        visited.add(parentIdKey);
        const parentDisplay = getParentProductTypeDisplay(parent, visited);
        return `${parentDisplay} >> ${item.display_name}`;
    }, [productTypes]);
    const filteredProductTypes = useMemo(() => {
        return productTypes.filter((item) => allColumns.every((column) => {
            const filter = columnFilters[column.field];
            if (!filter)
                return true;
            const value = column.field === 'display_name'
                ? getParentProductTypeDisplay(item)
                : item[column.field] ?? '';
            return valueMatchesColumnFilter(value, filter);
        }));
    }, [columnFilters, getParentProductTypeDisplay, productTypes]);
    const productTypeTree = useMemo(() => {
        const nodeMap = new Map();
        const roots = [];
        filteredProductTypes.forEach((productType) => {
            nodeMap.set(String(productType.id), { ...productType, children: [] });
        });
        nodeMap.forEach((node) => {
            const parentId = getProductTypeId(node.parent_product_type);
            const parent = parentId ? nodeMap.get(parentId) : null;
            if (parent) {
                parent.children.push(node);
            }
            else {
                roots.push(node);
            }
        });
        const sortNodes = (nodes) => {
            nodes.sort((a, b) => {
                const aValue = sortField === 'display_name' ? a.display_name : a[sortField] ?? '';
                const bValue = sortField === 'display_name' ? b.display_name : b[sortField] ?? '';
                const result = aValue.toString().localeCompare(bValue.toString(), undefined, { numeric: true, sensitivity: 'base' });
                return sortDirection === 'asc' ? result : -result;
            });
            nodes.forEach((node) => sortNodes(node.children));
        };
        sortNodes(roots);
        return roots;
    }, [filteredProductTypes, sortDirection, sortField]);
    const visibleProductTypeRows = useMemo(() => {
        const rows = [];
        const addRows = (nodes, level = 0) => {
            nodes.forEach((node) => {
                rows.push({ ...node, level, hasChildren: node.children.length > 0 });
                if (node.children.length > 0 && expandedProductTypeIds.has(node.id)) {
                    addRows(node.children, level + 1);
                }
            });
        };
        addRows(productTypeTree);
        return rows;
    }, [expandedProductTypeIds, productTypeTree]);
    const expandableProductTypeIds = useMemo(() => {
        const ids = [];
        const collectIds = (nodes) => {
            nodes.forEach((node) => {
                if (node.children.length > 0) {
                    ids.push(node.id);
                    collectIds(node.children);
                }
            });
        };
        collectIds(productTypeTree);
        return ids;
    }, [productTypeTree]);
    const allTreeRowsExpanded = expandableProductTypeIds.length > 0 && expandableProductTypeIds.every((id) => expandedProductTypeIds.has(id));
    const handleToggleAllRows = () => {
        setExpandedProductTypeIds(allTreeRowsExpanded ? new Set() : new Set(expandableProductTypeIds));
        setCurrentPage(1);
    };
    const totalPages = Math.max(1, Math.ceil(visibleProductTypeRows.length / pageSize));
    const startIndex = (currentPage - 1) * pageSize;
    const endIndex = startIndex + pageSize;
    const paginatedData = visibleProductTypeRows.slice(startIndex, endIndex);
    useEffect(() => {
        if (currentPage > totalPages) {
            setCurrentPage(totalPages);
        }
    }, [currentPage, totalPages]);
    const handlePageChange = (page) => {
        if (page >= 1 && page <= totalPages) {
            setCurrentPage(page);
        }
    };
    const handlePageSizeChange = (e) => {
        setPageSize(parseInt(e.target.value));
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
            <select value={draftColumnFilter.operator} onChange={(event) => setDraftColumnFilter((prev) => ({ ...prev, operator: event.target.value }))} className="mb-2 w-full rounded border border-slate-300 bg-white px-2 py-2 text-sm font-normal normal-case tracking-normal text-slate-900 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500">
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
              <button type="button" onClick={() => handleApplyColumnFilter(field)} className="inline-flex items-center justify-center gap-1.5 rounded border border-slate-300 bg-white px-3 py-2 text-sm font-normal normal-case tracking-normal text-slate-700 hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-blue-500">
                <ButtonIcon type="apply" /> Apply
              </button>
              <button type="button" onClick={() => handleResetColumnFilter(field)} className="inline-flex items-center justify-center gap-1.5 rounded border border-slate-300 bg-white px-3 py-2 text-sm font-normal normal-case tracking-normal text-slate-700 hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-blue-500">
                <ButtonIcon type="reset" /> Reset
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

          <button onClick={() => handleOpen()} className="inline-flex items-center justify-center gap-2 rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500" type="button">
            <ButtonIcon type="add" /> New
          </button>
          <button onClick={handleToggleAllRows} disabled={expandableProductTypeIds.length === 0} className="inline-flex items-center justify-center gap-2 rounded-md border border-slate-300 bg-white px-4 py-2 text-sm text-slate-700 hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:cursor-not-allowed disabled:opacity-50" type="button">
            {allTreeRowsExpanded ? 'Collapse all' : 'Expand all'}
          </button>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button onClick={handleClearFilters} className="inline-flex items-center justify-center gap-2 rounded-md border border-slate-300 bg-white px-4 py-2 text-sm text-slate-700 hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-blue-500" type="button">
            <ButtonIcon type="clear" /> Clear All Filters
          </button>
          <div className="relative">
            <button onClick={(e) => setColumnsAnchorEl(e.currentTarget)} className="inline-flex items-center justify-center gap-2 rounded-md border border-slate-300 bg-white px-4 py-2 text-sm text-slate-700 hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-blue-500" type="button">
              <ButtonIcon type="columns" /> Select Columns
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
              {visibleColumns.includes('display_name') && (renderColumnHeader('display_name', 'Display Name'))}
              {visibleColumns.includes('api_name') && (renderColumnHeader('api_name', 'API Name'))}
              {visibleColumns.includes('asset_type') && (renderColumnHeader('asset_type', 'Asset Type'))}
              {visibleColumns.includes('asset_category_type') && (renderColumnHeader('asset_category_type', 'Asset Category'))}
              {visibleColumns.includes('description') && (renderColumnHeader('description', 'Description'))}
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-slate-200">
            {paginatedData.map((item) => (<tr key={item.id} className={`${item.hasChildren ? 'bg-white' : ''} hover:bg-slate-50 transition-colors duration-150`}>
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
                {visibleColumns.includes('display_name') && <td className="px-4 py-4 whitespace-nowrap text-sm text-slate-900" style={getColumnStyle('display_name')}>
                  <div className="flex min-w-0 items-center gap-2" style={{ paddingLeft: `${item.level * 22}px` }}>
                    {item.hasChildren ? (
                      <button
                        type="button"
                        onClick={(event) => {
                          event.stopPropagation();
                          toggleProductType(item.id);
                        }}
                        className="inline-flex h-5 w-5 shrink-0 items-center justify-center rounded-full border border-slate-300 text-slate-600 hover:border-blue-400 hover:text-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500"
                        aria-label={`${expandedProductTypeIds.has(item.id) ? 'Collapse' : 'Expand'} ${item.display_name}`}
                      >
                        <svg className={`h-3 w-3 transition-transform ${expandedProductTypeIds.has(item.id) ? 'rotate-90' : ''}`} viewBox="0 0 12 12" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
                          <path d="M4.5 2.5L8 6L4.5 9.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                        </svg>
                      </button>
                    ) : (
                      <span className="h-5 w-5 shrink-0"></span>
                    )}
                    <span className="inline-flex h-5 w-5 shrink-0 items-center justify-center rounded border border-sky-200 bg-sky-50 text-sky-500" aria-hidden="true">
                      <svg className="h-3.5 w-3.5" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <path d="M2.5 4.5h11v7h-11v-7Z" stroke="currentColor" strokeWidth="1.2"/>
                        <path d="M4 10l2.4-2.3 2 1.8 1.4-1.3L12 10" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round"/>
                      </svg>
                    </span>
                    <span className={`${item.hasChildren ? 'font-semibold' : 'font-medium'} truncate text-slate-900`}>{item.display_name}</span>
                  </div>
                </td>}
                {visibleColumns.includes('api_name') && <td className="px-4 py-4 whitespace-nowrap text-sm text-slate-900" style={getColumnStyle('api_name')}>{item.api_name}</td>}
                {visibleColumns.includes('asset_type') && <td className="px-4 py-4 whitespace-nowrap text-sm text-slate-900" style={getColumnStyle('asset_type')}>{item.asset_type}</td>}
                {visibleColumns.includes('asset_category_type') && <td className="px-4 py-4 whitespace-nowrap text-sm text-slate-900" style={getColumnStyle('asset_category_type')}>{item.asset_category_type}</td>}
                {visibleColumns.includes('description') && <td className="px-4 py-4 whitespace-nowrap text-sm text-slate-900" style={getColumnStyle('description')}>{item.description}</td>}
              </tr>))}
            {paginatedData.length === 0 && (<tr>
                <td colSpan={visibleColumns.length + 1} className="px-6 py-8 text-center text-sm text-slate-500">
                  No product types found
                </td>
              </tr>)}
          </tbody>
        </table>
      </div>

      {actionAnchorEl && (<div ref={actionMenuRef} className="fixed z-10 w-48 rounded-md border border-slate-200 bg-white py-1 shadow-lg" data-action-menu style={actionMenuStyle}>
          <button onClick={() => {
                if (actionRow)
                    handleOpen(actionRow);
                setActionAnchorEl(null);
            }} className="flex w-full items-center gap-2 px-4 py-2 text-left text-sm text-slate-700 hover:bg-slate-100">
            <ButtonIcon type="edit" /> Edit
          </button>
          <button onClick={() => {
                if (actionRow)
                    handleCreateChild(actionRow);
            }} className="block w-full px-4 py-2 text-left text-sm text-blue-600 hover:bg-blue-50">
            Create Child Product Type
          </button>
          <button onClick={() => {
                if (actionRow)
                    handleDelete(actionRow.id);
                setActionAnchorEl(null);
            }} className="flex w-full items-center gap-2 px-4 py-2 text-left text-sm text-slate-700 hover:bg-slate-100">
            <ButtonIcon type="delete" /> Delete
          </button>
        </div>)}

      <div className="mt-6 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div className="flex items-center gap-2 text-sm text-slate-700">
          <span>Page Size:</span>
          <select value={pageSize} onChange={handlePageSizeChange} className="inline-flex items-center justify-center gap-2 rounded-md border border-slate-300 bg-white px-3 py-1 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500">
            <option value={10}>10</option>
            <option value={25}>25</option>
            <option value={50}>50</option>
          </select>
        </div>

        <div className="flex flex-wrap items-center gap-3 text-sm text-slate-600">
          <span>
            {visibleProductTypeRows.length === 0 ? '0 to 0 of 0' : `${startIndex + 1} to ${Math.min(endIndex, visibleProductTypeRows.length)} of ${visibleProductTypeRows.length}`}
          </span>
          <div className="flex items-center gap-2">
            <button onClick={() => handlePageChange(currentPage - 1)} disabled={currentPage === 1} className="inline-flex items-center justify-center gap-2 rounded-md border border-slate-300 px-3 py-1 text-sm text-slate-700 hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed" type="button">
              <ButtonIcon type="previous" />
            </button>
            <span className="text-sm text-slate-600">Page {currentPage} of {totalPages === 0 ? 1 : totalPages}</span>
            <button onClick={() => handlePageChange(currentPage + 1)} disabled={currentPage === totalPages} className="inline-flex items-center justify-center gap-2 rounded-md border border-slate-300 px-3 py-1 text-sm text-slate-700 hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed" type="button">
              <ButtonIcon type="next" />
            </button>
          </div>
        </div>
      </div>
      <Modal
        open={open}
        title={childParent ? 'Create Child Product Type' : (editing ? 'Edit Product Type' : 'Add Product Type')}
        description={childParent ? `Create a child product type under ${childParent.display_name}.` : (editing ? 'Update product type details.' : 'Create a new product type.')}
        onClose={handleClose}
        maxWidth="max-w-4xl"
      >
        <ProductTypeForm
          editing={editing}
          onSave={handleSave}
          onClose={handleClose}
          productTypes={productTypes}
          saving={saving}
          parentProductTypeId={childParent?.id || ''}
          parentLocked={Boolean(childParent)}
        />
      </Modal>
      <DeleteConfirmModal
        isOpen={Boolean(deleteTarget)}
        title="Delete Product Type"
        message={deleteError || 'Are you sure you want to delete this product type?'}
        itemName={deleteTarget?.display_name || deleteTarget?.api_name || deleteTarget?.id}
        onConfirm={handleConfirmDelete}
        onCancel={handleCancelDelete}
        isLoading={deleteLoading}
      />
    </div>);
};
export default ProductTypeTable;

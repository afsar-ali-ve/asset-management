import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useLocation, useNavigate, useParams } from 'react-router-dom';
import Modal from '../../../components/common/Modal';
import ColumnFilter from '../../../components/common/ColumnFilter';
import { DEFAULT_COLUMN_FILTER, columnFilterNeedsValue, valueMatchesColumnFilter, hasColumnFilters } from '../../../components/common/columnFilterUtils';
import { assignAsset, getAsset, getAssetAssignmentHistory, getAssignableUsers, getDepartments } from '../../../services/api';
import { getStoredUser } from '../../users/auth/authStorage';

const assetTabs = ['Asset Detail', 'Relationships', 'Contracts', 'Financials', 'History'];

const valueOrDash = (value) => {
  if (value === null || value === undefined || value === '') {
    return '-';
  }
  return value;
};

const formatDate = (value) => {
  if (!value) {
    return '-';
  }
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return value;
  }
  return date.toLocaleDateString();
};

const formatTime = (value) => {
  if (!value) {
    return '-';
  }
  if (typeof value === 'string' && /^\d{2}:\d{2}/.test(value)) {
    return value.slice(0, 8);
  }
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return value;
  }
  return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
};

const DetailSection = ({ title, items }) => (
  <section className="space-y-3">
    <h2 className="text-sm font-semibold text-slate-900">{title}</h2>
    <div className="rounded-xl bg-slate-100/80 px-5 py-5">
      <dl className="grid gap-x-10 gap-y-4 sm:grid-cols-2">
        {items.map((item) => (
          <div key={item.label} className="grid grid-cols-[minmax(120px,180px)_1fr] items-start gap-3 text-xs sm:text-sm">
            <dt className="text-right font-medium text-slate-700">{item.label}</dt>
            <dd className="min-w-0 break-words text-slate-950">{valueOrDash(item.value)}</dd>
          </div>
        ))}
      </dl>
    </div>
  </section>
);

const SampleTable = ({ columns, rows, emptyMessage }) => {
  const [filterMenuField, setFilterMenuField] = useState(null);
  const [columnFilters, setColumnFilters] = useState({});
  const [draftColumnFilter, setDraftColumnFilter] = useState(DEFAULT_COLUMN_FILTER);

  const filteredRows = useMemo(() => rows.filter((row) => columns.every((column, index) => {
    const filter = columnFilters[column];
    return filter ? valueMatchesColumnFilter(row.values[index], filter) : true;
  })), [columnFilters, columns, rows]);

  const openColumnFilter = (column) => {
    setDraftColumnFilter(columnFilters[column] ?? DEFAULT_COLUMN_FILTER);
    setFilterMenuField((currentColumn) => (currentColumn === column ? null : column));
  };

  const applyColumnFilter = (column) => {
    const needsValue = columnFilterNeedsValue(draftColumnFilter.operator);
    if (needsValue && !draftColumnFilter.value.trim()) {
      clearColumnFilter(column);
      return;
    }
    setColumnFilters((current) => ({
      ...current,
      [column]: {
        ...draftColumnFilter,
        value: needsValue ? draftColumnFilter.value : '',
      },
    }));
    setFilterMenuField(null);
  };

  const clearColumnFilter = (column) => {
    setColumnFilters((current) => {
      const next = { ...current };
      delete next[column];
      return next;
    });
    setDraftColumnFilter(DEFAULT_COLUMN_FILTER);
    setFilterMenuField(null);
  };

  return (
    <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
      {hasColumnFilters(columnFilters) && (
        <div className="flex justify-end border-b border-slate-200 px-4 py-3">
          <button type="button" onClick={() => setColumnFilters({})} className="rounded-md border border-slate-300 bg-white px-3 py-2 text-sm text-slate-700 hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-blue-500">
            Clear All Filters
          </button>
        </div>
      )}
      <div className="overflow-x-auto">
        <table className="w-full min-w-[760px] table-fixed divide-y divide-slate-200">
          <thead className="bg-slate-50">
            <tr>
              {columns.map((column) => (
                <th key={column} className="relative px-4 py-4 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">
                  <div className="flex items-center justify-between gap-2">
                    <span>{column}</span>
                    <ColumnFilter
                      label={column}
                      isOpen={filterMenuField === column}
                      isActive={Boolean(columnFilters[column])}
                      draftFilter={draftColumnFilter}
                      onOpen={() => openColumnFilter(column)}
                      onDraftChange={setDraftColumnFilter}
                      onApply={() => applyColumnFilter(column)}
                      onClear={() => clearColumnFilter(column)}
                    />
                  </div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200 bg-white">
            {filteredRows.map((row) => (
              <tr key={row.id} className="transition-colors duration-150 hover:bg-slate-50">
                {row.values.map((value, index) => (
                  <td key={`${row.id}-${index}`} className="px-4 py-4 text-sm text-slate-900">
                    {valueOrDash(value)}
                  </td>
                ))}
              </tr>
            ))}
            {filteredRows.length === 0 && (
              <tr>
                <td colSpan={columns.length} className="px-6 py-10 text-center text-sm text-slate-500">
                  {emptyMessage}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

const SampleTabPage = ({ tab, asset }) => {
  const tabConfig = {
    Relationships: {
      title: 'Relationships',
      description: 'Sample relationship records associated with this asset.',
      columns: ['Relationship Type', 'Related Item', 'Direction', 'Status'],
      rows: [
        { id: 'rel-1', values: ['Used By', asset.assigned_user || 'Unassigned User', 'Outbound', 'Active'] },
        { id: 'rel-2', values: ['Located At', asset.location || 'Primary Location', 'Outbound', 'Active'] },
      ],
      emptyMessage: 'No relationships found',
    },
    Contracts: {
      title: 'Contracts',
      description: 'Sample contract and warranty information for this asset.',
      columns: ['Contract', 'Vendor', 'Start Date', 'End Date', 'Status'],
      rows: [
        { id: 'contract-1', values: ['Standard Warranty', asset.vendor || '-', formatDate(asset.acquisition_date), formatDate(asset.warranty_expiry_date), 'Active'] },
      ],
      emptyMessage: 'No contracts found',
    },
    Financials: {
      title: 'Financials',
      description: 'Sample financial summary for purchase and ownership tracking.',
      columns: ['Type', 'Amount', 'Date', 'Reference'],
      rows: [
        { id: 'financial-1', values: ['Purchase Cost', asset.purchase_cost || '-', formatDate(asset.acquisition_date), asset.asset_tag || asset.name] },
        { id: 'financial-2', values: ['Current Value', '-', '-', 'Not calculated'] },
      ],
      emptyMessage: 'No financial records found',
    },
  };
  const config = tabConfig[tab];

  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-sm font-semibold text-slate-900">{config.title}</h2>
        <p className="mt-1 text-sm text-slate-500">{config.description}</p>
      </div>
      <SampleTable columns={config.columns} rows={config.rows} emptyMessage={config.emptyMessage} />
    </div>
  );
};

const historyTabs = ['History', 'State History', 'Assign History'];

const getScanValue = (asset, fields) => {
  const value = fields.map((field) => asset?.[field]).find((fieldValue) => fieldValue !== null && fieldValue !== undefined && fieldValue !== '');
  return valueOrDash(value);
};

const HistoryTabPage = ({ assignmentHistory, historyLoading, historyError }) => {
  const [activeHistoryTab, setActiveHistoryTab] = useState(historyTabs[0]);
  const tableColumnsByTab = {
    History: ['S. No.', 'Date', 'Time', 'Operation', 'Description'],
    'State History': ['S. No.', 'Date', 'Time', 'State', 'Description'],
    'Assign History': ['S. No.', 'Assignment Period', 'Time', 'User', 'Department'],
  };
  const tableColumns = tableColumnsByTab[activeHistoryTab];
  const rowsByTab = {
    History: assignmentHistory.map((item, index) => [
      index,
      formatDate(item.assignment_date || item.created_at),
      formatTime(item.assignment_time || item.created_at),
      item.action_type || 'Assigned',
      item.description || `Asset assigned to ${item.assigned_to_name || '-'}`,
    ]),
    'State History': assignmentHistory.map((item, index) => [
      index,
      formatDate(item.assignment_date || item.created_at),
      formatTime(item.assignment_time || item.created_at),
      item.action_type || 'Assigned',
      item.description || `Asset assigned to ${item.assigned_to_name || '-'}`,
    ]),
    'Assign History': assignmentHistory.map((item, index) => [
      index,
      formatDate(item.assignment_date || item.created_at),
      formatTime(item.assignment_time || item.created_at),
      item.assigned_to_name || '-',
      item.assigned_to_department || '-',
    ]),
  };
  const tableRows = rowsByTab[activeHistoryTab] || [];

  return (
    <div className="px-3 pb-3 pt-2">
      <div className="border-b border-slate-200">
        <div className="flex flex-wrap gap-7">
          {historyTabs.map((tab) => (
            <button
              key={tab}
              type="button"
              onClick={() => setActiveHistoryTab(tab)}
              className={`border-b-2 px-1 pb-3 text-sm font-semibold ${
                activeHistoryTab === tab
                  ? 'border-purple-600 text-slate-950'
                  : 'border-transparent text-slate-700 hover:text-slate-950'
              }`}
            >
              {tab}
            </button>
          ))}
        </div>
      </div>

      <div className="mt-4 overflow-x-auto">
        <table className="w-full min-w-[760px] table-fixed border-collapse text-xs">
          <thead>
            <tr className="border border-slate-200 bg-slate-50 text-left text-[11px] font-semibold text-slate-600">
              {tableColumns.map((column) => (
                <th key={column} className="px-3 py-2">
                  {column}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {historyLoading && (
              <tr>
                <td colSpan={tableColumns.length} className="h-16 border-x border-b border-slate-200 px-3 py-4 text-center text-sm text-slate-500">
                  Loading history...
                </td>
              </tr>
            )}
            {!historyLoading && historyError && (
              <tr>
                <td colSpan={tableColumns.length} className="h-16 border-x border-b border-slate-200 px-3 py-4 text-center text-sm text-red-600">
                  {historyError}
                </td>
              </tr>
            )}
            {!historyLoading && !historyError && tableRows.map((row, rowIndex) => (
              <tr key={`${activeHistoryTab}-${rowIndex}`} className="border-x border-b border-slate-200 text-slate-900">
                {row.map((value, columnIndex) => (
                  <td key={`${activeHistoryTab}-${rowIndex}-${columnIndex}`} className="px-3 py-3 align-top">
                    {valueOrDash(value)}
                  </td>
                ))}
              </tr>
            ))}
            {!historyLoading && !historyError && tableRows.length === 0 && (
              <tr>
                <td colSpan={tableColumns.length} className="h-16 border-x border-b border-slate-200 px-3 py-4 text-center text-sm text-slate-400">
                  No {activeHistoryTab.toLowerCase()} records found
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

const HistorySidePanel = ({ asset, assignedUser }) => (
  <aside className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
    <div className="space-y-2 text-sm">
      <h2 className="text-base font-semibold text-slate-900">Last Scan Status:</h2>
      <p className="text-xs text-slate-700">
        Status: <span className="font-semibold text-slate-950">{getScanValue(asset, ['scan_status', 'last_scan_status'])}</span>
      </p>
      <p className="text-xs text-slate-700">
        Last Scan Time: <span className="font-semibold text-slate-950">{getScanValue(asset, ['last_scan_time', 'last_scanned_at', 'updated_at'])}</span>
      </p>
      <p className="text-xs text-slate-700">
        State: <span className="font-semibold text-slate-950">{valueOrDash(asset.asset_state)}</span>
      </p>
    </div>

    <div className="mt-5 rounded-xl border border-slate-200 bg-slate-100/70 p-4">
      <h3 className="text-sm font-semibold text-slate-900">Assigned to User</h3>
      <div className="mt-4 flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-slate-400 text-sm font-semibold text-white">
          {(assignedUser.name || asset.assigned_user || '').trim().charAt(0).toUpperCase()}
        </div>
        <div className="min-w-0">
          <div className="truncate text-sm font-medium text-slate-900">{valueOrDash(assignedUser.name || asset.assigned_user)}</div>
          {assignedUser.email && <div className="truncate text-xs text-slate-600">{assignedUser.email}</div>}
          {(assignedUser.department || asset.department) && (
            <div className="truncate text-xs font-medium text-slate-700">Department: {assignedUser.department || asset.department}</div>
          )}
        </div>
      </div>
    </div>

    <div className="mt-4 rounded-xl border border-slate-200 bg-slate-100/70 p-4">
      <h3 className="text-sm font-semibold text-slate-900">Associated Requests</h3>
      <div className="mt-4 space-y-2 text-xs text-slate-700">
        <p>
          Pending: <span className="font-semibold text-slate-950">{valueOrDash(asset.pending_requests)}</span>
        </p>
        <p>
          Completed: <span className="font-semibold text-slate-950">{valueOrDash(asset.completed_requests)}</span>
        </p>
        <p>
          Total: <span className="font-semibold text-slate-950">{valueOrDash(asset.total_requests)}</span>
        </p>
      </div>
    </div>
  </aside>
);

const AssignAssetForm = ({ users, usersLoading, usersError, departments, departmentsLoading, departmentsError, assigning, onAssign, onClose }) => {
  const [formData, setFormData] = useState({
    user: '',
    department: '',
  });
  const [searchTerm, setSearchTerm] = useState('');
  const selectedUser = users.find((user) => user.id === formData.user);
  const selectedDepartment = departments.find((department) => department.id === formData.department);
  const filteredUsers = users.filter((user) => {
    const value = `${user.full_name || ''} ${user.email || ''}`.toLowerCase();
    return value.includes(searchTerm.trim().toLowerCase());
  });
  const handleSubmit = (event) => {
    event.preventDefault();
    if (selectedUser && selectedDepartment) {
      onAssign(selectedUser, selectedDepartment);
    }
  };

  return (
    <form className="space-y-5" onSubmit={handleSubmit}>
      <div>
        <label htmlFor="assign_user_search" className="block text-sm font-medium text-slate-700">
          Search User
        </label>
        <input
          id="assign_user_search"
          type="search"
          value={searchTerm}
          onChange={(event) => setSearchTerm(event.target.value)}
          placeholder="Search by name or email..."
          className="mt-2 block w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 shadow-sm placeholder:text-slate-400 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
        />
      </div>

      <div>
        <label htmlFor="assign_user" className="block text-sm font-medium text-slate-700">
          User
        </label>
        <select
          id="assign_user"
          value={formData.user}
          onChange={(event) => setFormData((current) => ({ ...current, user: event.target.value }))}
          className="mt-2 block w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
          disabled={usersLoading || assigning}
        >
          <option value="">{usersLoading ? 'Loading users...' : '-- Select user --'}</option>
          {filteredUsers.map((user) => (
            <option key={user.id} value={user.id}>
              {user.full_name}{user.email ? ` | ${user.email}` : ''}
            </option>
          ))}
        </select>
        {usersError && <p className="mt-2 text-xs text-amber-600">{usersError}</p>}
        {!usersLoading && !usersError && users.length === 0 && <p className="mt-2 text-xs text-slate-500">No users found.</p>}
        {!usersLoading && users.length > 0 && filteredUsers.length === 0 && <p className="mt-2 text-xs text-slate-500">No users match your search.</p>}
        {selectedUser && (
          <div className="mt-3 flex items-center gap-3 rounded-lg border border-slate-200 bg-slate-50 p-3">
            {selectedUser.profile_image ? (
              <img src={selectedUser.profile_image} alt="" className="h-10 w-10 rounded-full object-cover" />
            ) : (
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-slate-700 text-sm font-semibold text-white">
                {(selectedUser.full_name || selectedUser.email || 'U').charAt(0).toUpperCase()}
              </div>
            )}
            <div className="min-w-0">
              <div className="truncate text-sm font-semibold text-slate-900">{selectedUser.full_name}</div>
              <div className="truncate text-xs text-slate-500">{selectedUser.email}</div>
            </div>
          </div>
        )}
      </div>

      <div>
        <label htmlFor="assign_department" className="block text-sm font-medium text-slate-700">
          Department
        </label>
        <select
          id="assign_department"
          value={formData.department}
          onChange={(event) => setFormData((current) => ({ ...current, department: event.target.value }))}
          className="mt-2 block w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20 disabled:bg-slate-100"
          disabled={departmentsLoading || assigning}
        >
          <option value="">{departmentsLoading ? 'Loading departments...' : '-- Select department --'}</option>
          {departments.map((department) => (
            <option key={department.id} value={department.id}>
              {department.name}
            </option>
          ))}
        </select>
        {departmentsError && <p className="mt-2 text-xs text-amber-600">{departmentsError}</p>}
        {!departmentsLoading && !departmentsError && departments.length === 0 && <p className="mt-2 text-xs text-slate-500">No departments found.</p>}
      </div>

      <div className="flex flex-col-reverse gap-3 border-t border-slate-200 pt-5 sm:flex-row sm:justify-end">
        <button type="button" onClick={onClose} className="rounded-md border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-blue-500">
          Close
        </button>
        <button type="submit" disabled={!selectedUser || !selectedDepartment || assigning} className="rounded-md bg-blue-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:cursor-not-allowed disabled:opacity-60">
          {assigning ? 'Assigning...' : 'Assign Asset'}
        </button>
      </div>
    </form>
  );
};

const AssetDetailsPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const [asset, setAsset] = useState(location.state?.asset || null);
  const [loading, setLoading] = useState(!location.state?.asset);
  const [error, setError] = useState('');
  const [activeTab, setActiveTab] = useState(assetTabs[0]);
  const [assignModalOpen, setAssignModalOpen] = useState(false);
  const [assignableUsers, setAssignableUsers] = useState([]);
  const [assignableUsersLoading, setAssignableUsersLoading] = useState(false);
  const [assignableUsersError, setAssignableUsersError] = useState('');
  const [departments, setDepartments] = useState([]);
  const [departmentsLoading, setDepartmentsLoading] = useState(false);
  const [departmentsError, setDepartmentsError] = useState('');
  const [assigningAsset, setAssigningAsset] = useState(false);
  const [assignmentMessage, setAssignmentMessage] = useState(null);
  const [assignmentHistory, setAssignmentHistory] = useState([]);
  const [assignmentHistoryLoading, setAssignmentHistoryLoading] = useState(false);
  const [assignmentHistoryError, setAssignmentHistoryError] = useState('');

  const loadAssignmentHistory = useCallback(async () => {
    if (!id) {
      return;
    }
    setAssignmentHistoryLoading(true);
    setAssignmentHistoryError('');
    try {
      const response = await getAssetAssignmentHistory(id);
      setAssignmentHistory(response.data?.history || []);
    } catch (historyError) {
      console.error('Error fetching assignment history:', historyError);
      setAssignmentHistory([]);
      setAssignmentHistoryError('Unable to load assignment history.');
    } finally {
      setAssignmentHistoryLoading(false);
    }
  }, [id]);

  useEffect(() => {
    let active = true;
    const fetchAsset = async () => {
      setLoading(!location.state?.asset);
      setError('');
      try {
        const response = await getAsset(id);
        if (active) {
          setAsset(response.data);
        }
      } catch (fetchError) {
        console.error('Error fetching asset:', fetchError);
        if (active) {
          setError('Unable to load asset details');
        }
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    };
    fetchAsset();
    return () => {
      active = false;
    };
  }, [id, location.state]);

  useEffect(() => {
    loadAssignmentHistory();
  }, [loadAssignmentHistory]);

  useEffect(() => {
    if (!assignModalOpen) {
      return;
    }

    let active = true;
    const loadAssignableUsers = async () => {
      setAssignableUsersLoading(true);
      setAssignableUsersError('');
      try {
        const response = await getAssignableUsers();
        const loggedInUser = getStoredUser();
        const databaseUsers = (response.data?.users || []).filter((user) => user.id !== loggedInUser?.id && user.email !== loggedInUser?.email);
        if (!active) {
          return;
        }
        if (databaseUsers.length > 0) {
          setAssignableUsers(databaseUsers);
        } else {
          setAssignableUsers([]);
        }
      } catch (fetchError) {
        console.error('Error fetching assignable users:', fetchError);
        if (active) {
          setAssignableUsers([]);
          setAssignableUsersError('Unable to load users. Please try again.');
        }
      } finally {
        if (active) {
          setAssignableUsersLoading(false);
        }
      }
    };

    loadAssignableUsers();
    return () => {
      active = false;
    };
  }, [assignModalOpen]);

  useEffect(() => {
    if (!assignModalOpen) {
      return;
    }

    let active = true;
    const loadDepartments = async () => {
      setDepartmentsLoading(true);
      setDepartmentsError('');
      try {
        const response = await getDepartments();
        if (active) {
          setDepartments(response.data || []);
        }
      } catch (fetchError) {
        console.error('Error fetching departments:', fetchError);
        if (active) {
          setDepartments([]);
          setDepartmentsError('Unable to load departments. Please try again.');
        }
      } finally {
        if (active) {
          setDepartmentsLoading(false);
        }
      }
    };

    loadDepartments();
    return () => {
      active = false;
    };
  }, [assignModalOpen]);

  const handleAssignAsset = async (user, department) => {
    if (!asset || !user || !department) {
      return;
    }

    setAssigningAsset(true);
    setAssignmentMessage(null);
    try {
      const response = await assignAsset(asset.id, {
        assigned_to_user_id: user.id,
        department_id: department.id,
      });
      setAsset(response.data.asset);
      setAssignmentHistory(response.data.history || []);
      setAssignmentMessage({ type: 'success', text: `Asset assigned to ${user.full_name}.` });
      setAssignModalOpen(false);
    } catch (assignError) {
      console.error('Error assigning asset:', assignError);
      setAssignmentMessage({ type: 'error', text: 'Unable to assign asset. Please try again.' });
    } finally {
      setAssigningAsset(false);
    }
  };

  const sections = asset
    ? [
        {
          title: 'Asset Detail',
          items: [
            { label: 'Name', value: asset.name },
            { label: 'Product', value: asset.product },
            { label: 'Asset Tag', value: asset.asset_tag },
            { label: 'Vendor', value: asset.vendor },
            { label: 'Serial Number', value: asset.serial_number },
            { label: 'Barcode', value: asset.barcode_qr_code },
            { label: 'Description', value: asset.description },
            { label: 'Product Type', value: asset.product_type },
          ],
        },
        {
          title: 'Asset State and Location',
          items: [
            { label: 'Asset State', value: asset.asset_state },
            { label: 'User', value: asset.assigned_user },
            { label: 'Department', value: asset.department },
            { label: 'Associated To', value: asset.associated_to },
            { label: 'Site', value: asset.site },
            { label: 'Location', value: asset.location },
            { label: 'State Comments', value: asset.state_comments },
          ],
        },
        {
          title: 'Purchase Details',
          items: [
            { label: 'Acquisition Date', value: formatDate(asset.acquisition_date) },
            { label: 'Purchase Cost', value: asset.purchase_cost },
            { label: 'Expiry Date', value: formatDate(asset.expiry_date) },
            { label: 'Warranty Expiry Date', value: formatDate(asset.warranty_expiry_date) },
          ],
        },
        {
          title: 'Asset Additional Fields Section',
          items: [
            { label: 'Impact details', value: asset.impact_details },
            { label: 'Asset Audited', value: asset.asset_audited },
            { label: 'Impact', value: asset.impact },
          ],
        },
        {
          title: 'Computer Details',
          items: [
            { label: 'Service Tag', value: asset.service_tag },
            { label: 'Bios Name', value: asset.bios_name },
            { label: 'Last Logged In User', value: asset.last_logged_in_user },
            { label: 'Bios Version', value: asset.bios_version },
            { label: 'Bios Date', value: formatDate(asset.bios_date) },
            { label: 'Bios Manufacturer', value: asset.bios_manufacturer },
            { label: 'SMBios Version', value: asset.smbios_version },
            { label: 'Total Memory', value: asset.total_memory },
            { label: 'Virtual Memory', value: asset.virtual_memory },
            { label: 'Domain', value: asset.domain },
            { label: 'Logical Processors', value: asset.logical_processors },
            { label: 'Total Slots', value: asset.total_slots },
            { label: 'Disk space', value: asset.disk_space },
            { label: 'Chassis Type', value: asset.chassis_type },
            { label: 'Logged On User', value: asset.logged_on_user },
          ],
        },
        {
          title: 'Agent Details',
          items: [
            { label: 'Agent Version', value: asset.agent_version },
            { label: 'Agent Installed Time', value: formatDate(asset.agent_installed_time) },
            { label: 'Last Contact Time', value: formatDate(asset.last_contact_time) },
            { label: 'Remote Office', value: asset.remote_office },
            { label: 'Last Boot Time', value: formatDate(asset.last_boot_time) },
          ],
        },
        {
          title: 'OS',
          items: [
            { label: 'Operating System', value: asset.operating_system },
            { label: 'OS Version', value: asset.os_version },
            { label: 'Service Pack', value: asset.service_pack },
            { label: 'Product ID', value: asset.product_id },
            { label: 'Build Number', value: asset.build_number },
            { label: 'System Type', value: asset.system_type },
            { label: 'License Type', value: asset.license_type },
            { label: 'License Status', value: asset.license_status },
            { label: 'System Drive', value: asset.system_drive },
          ],
        },
        {
          title: 'Virtual Host Details',
          items: [
            { label: 'VM Platform', value: asset.vm_platform },
            { label: 'Installed VMs', value: asset.installed_vms },
            { label: 'Allowed VMs', value: asset.allowed_vms },
          ],
        },
        {
          title: 'CI Type Additional Fields Section',
          items: [
            { label: 'Monitoring Protocol', value: asset.monitoring_protocol },
            { label: 'Serial Number', value: asset.serial_number },
            { label: 'Product Name', value: asset.product || asset.name },
            { label: 'CI Type', value: asset.ci_type || asset.product_type },
            { label: 'Type', value: asset.type },
            { label: 'DNS Name', value: asset.dns_name },
            { label: 'RAM size', value: asset.ram_size },
            { label: 'System Description', value: asset.system_description },
            { label: 'Vendor', value: asset.vendor },
            { label: 'Hard Disk Size', value: asset.hard_disk_size },
            { label: 'Uplink Dependency', value: asset.uplink_dependency },
            { label: 'No. of Interfaces', value: asset.number_of_interfaces },
          ],
        },
      ]
    : [];
  const latestAssignment = assignmentHistory[0] || null;
  const assignedUserForCard = {
    name: latestAssignment?.assigned_to_name || asset?.assigned_user || '',
    email: latestAssignment?.assigned_to_email || '',
    department: latestAssignment?.assigned_to_department || asset?.department || '',
  };
  const renderAssetTabs = () => (
    <div className="border-b border-slate-200">
      <div className="flex flex-wrap gap-5">
        {assetTabs.map((tab) => (
          <button
            key={tab}
            type="button"
            onClick={() => setActiveTab(tab)}
            className={`border-b-2 px-1 pb-3 text-sm font-medium ${
              activeTab === tab
                ? 'border-blue-600 text-blue-600'
                : 'border-transparent text-slate-500 hover:text-slate-700'
            }`}
          >
            {tab}
          </button>
        ))}
      </div>
    </div>
  );

  return (
    <div className="space-y-5">
      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div>
          <div className="text-sm text-slate-500">Assets &gt; Asset Details</div>
          <h1 className="mt-2 text-2xl font-semibold text-slate-900">{asset?.name || 'Asset Details'}</h1>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <button type="button" onClick={() => navigate(-1)} className="inline-flex items-center gap-2 rounded-md border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-700 shadow-sm hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-blue-500">
            &#8592; Back To List
          </button>
          <button type="button" onClick={() => setAssignModalOpen(true)} className="rounded-md bg-blue-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500">
            Assign Asset
          </button>
        </div>
      </div>

      {loading && (
        <div className="flex items-center justify-center rounded-xl border border-slate-200 bg-white py-16 shadow-sm">
          <span className="h-10 w-10 animate-spin rounded-full border-b-2 border-t-2 border-blue-600"></span>
        </div>
      )}

      {!loading && error && (
        <div className="rounded-xl border border-red-200 bg-red-50 px-5 py-4 text-sm text-red-700">{error}</div>
      )}

      {assignmentMessage && (
        <div className={`rounded-xl border px-5 py-4 text-sm ${
          assignmentMessage.type === 'success'
            ? 'border-emerald-200 bg-emerald-50 text-emerald-700'
            : 'border-red-200 bg-red-50 text-red-700'
        }`}>
          {assignmentMessage.text}
        </div>
      )}

      {!loading && !error && !asset && (
        <div className="rounded-xl border border-slate-200 bg-white px-6 py-12 text-center text-sm text-slate-500 shadow-sm">
          No asset details found
        </div>
      )}

      {!loading && !error && asset && (
        <>
          {activeTab === 'History' ? (
            <div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_28rem]">
              <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
                {renderAssetTabs()}
                <div className="mt-6">
                  <HistoryTabPage
                    assignmentHistory={assignmentHistory}
                    historyLoading={assignmentHistoryLoading}
                    historyError={assignmentHistoryError}
                  />
                </div>
              </div>
              <HistorySidePanel asset={asset} assignedUser={assignedUserForCard} />
            </div>
          ) : (
            <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
              {renderAssetTabs()}
              <div className="mt-6 space-y-6">
                {activeTab === 'Asset Detail'
                  ? sections.map((section) => (
                      <DetailSection key={section.title} title={section.title} items={section.items} />
                    ))
                  : <SampleTabPage tab={activeTab} asset={asset} />}
              </div>
            </div>
          )}

          <Modal
            open={assignModalOpen}
            title="Assign / Associate"
            onClose={() => setAssignModalOpen(false)}
            maxWidth="max-w-xl"
          >
            <AssignAssetForm
              users={assignableUsers}
              usersLoading={assignableUsersLoading}
              usersError={assignableUsersError}
              departments={departments}
              departmentsLoading={departmentsLoading}
              departmentsError={departmentsError}
              assigning={assigningAsset}
              onAssign={handleAssignAsset}
              onClose={() => setAssignModalOpen(false)}
            />
          </Modal>
        </>
      )}
    </div>
  );
};

export default AssetDetailsPage;

import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  createAdminUser,
  getAdminUsers,
  getRoles,
  updateAdminUser,
} from '../../../services/api';
import Modal from '../../../components/common/Modal';
import useResizableColumns from '../../../components/common/useResizableColumns';

const emptyForm = {
  fullName: '',
  email: '',
  password: '',
  confirmPassword: '',
  department: '',
  roleId: '',
  isActive: true,
};

const requiredMark = <span className="ml-1 text-red-500" aria-hidden="true">*</span>;
const inputClass = (hasError) =>
  `mt-2 block w-full rounded-md border bg-white px-3 py-2 text-sm text-slate-900 shadow-sm focus:outline-none focus:ring-2 ${
    hasError ? 'border-red-300 focus:border-red-500 focus:ring-red-500/20' : 'border-slate-300 focus:border-blue-500 focus:ring-blue-500/20'
  }`;

const ButtonIcon = ({ type, className = 'h-4 w-4' }) => {
  const iconProps = {
    className,
    viewBox: '0 0 20 20',
    fill: 'none',
    'aria-hidden': 'true',
  };

  const paths = {
    add: <path d="M10 4.25V15.75M4.25 10H15.75" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/>,
    save: <path d="M5 3.75H13.25L16.25 6.75V16.25H3.75V3.75H5ZM7 3.75V8.25H13V3.75M6.75 16.25V11.75H13.25V16.25" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>,
    close: <path d="M5.25 5.25L14.75 14.75M14.75 5.25L5.25 14.75" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/>,
    clear: <path d="M5.25 5.25L14.75 14.75M14.75 5.25L5.25 14.75M3.75 16.25H16.25" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round"/>,
    active: <path d="M16.25 6.25L8.75 13.75L5 10" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>,
    inactive: <path d="M5.25 5.25L14.75 14.75M14.75 5.25L5.25 14.75" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/>,
    previous: <path d="M12.5 5L7.5 10L12.5 15" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>,
    next: <path d="M7.5 5L12.5 10L7.5 15" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>,
  };

  return <svg {...iconProps}>{paths[type]}</svg>;
};

const formatDate = (value) => {
  if (!value) return '-';
  return new Intl.DateTimeFormat('en-US', { month: 'short', day: '2-digit', year: 'numeric' }).format(new Date(value));
};

const getRoleName = (roles, roleId) => roles.find((role) => role.id === roleId)?.role_name || '';
const isAdminRole = (user) => user?.role_name === 'Admin' || user?.role === 'Admin';
const isDefaultAdminEmail = (email) => (email || '').trim().toLowerCase() === 'admin@virtualemployee.com';
const userColumns = [
  { field: 'full_name', label: 'Full Name' },
  { field: 'email', label: 'Email' },
  { field: 'role_name', label: 'Role' },
  { field: 'department', label: 'Department' },
  { field: 'status', label: 'Status' },
  { field: 'created_at', label: 'Created Date' },
];
const defaultColumnWidths = {
  full_name: 220,
  email: 260,
  role_name: 150,
  department: 180,
  status: 140,
  created_at: 170,
};

const UserFormModal = ({ open, mode, user, roles, saving, serverError, onClose, onSave }) => {
  const [formData, setFormData] = useState(emptyForm);
  const [errors, setErrors] = useState({});
  const isViewMode = mode === 'view';
  const isEdit = mode === 'edit' || isViewMode;
  const isView = mode === 'view';
  const isLockedDefaultAdmin = isDefaultAdminEmail(user?.email);
  const isReadOnly = isLockedDefaultAdmin;

  useEffect(() => {
    if (!open) return;
    setErrors({});
    setFormData(user ? {
      fullName: user.full_name || '',
      email: user.email || '',
      password: '',
      confirmPassword: '',
      department: user.department || '',
      roleId: user.role_id || '',
      isActive: user.is_active !== false,
    } : {
      ...emptyForm,
      roleId: roles.find((role) => role.role_name === 'Basic')?.id || roles[0]?.id || '',
    });
  }, [open, roles, user]);

  const updateField = (field, value) => {
    setFormData((current) => ({ ...current, [field]: value }));
    setErrors((current) => ({ ...current, [field]: '' }));
  };

  const validate = () => {
    const nextErrors = {};
    if (!formData.fullName.trim()) nextErrors.fullName = 'Full name is required';
    if (!formData.email.trim()) nextErrors.email = 'Email is required';
    if (!formData.roleId) nextErrors.roleId = 'Role is required';
    if (!isEdit && !formData.password) nextErrors.password = 'Password is required';
    if (!isEdit && !formData.confirmPassword) nextErrors.confirmPassword = 'Confirm password is required';
    if (formData.password && formData.password.length < 6) nextErrors.password = 'Password must be at least 6 characters';
    if (formData.password || formData.confirmPassword) {
      if (formData.password !== formData.confirmPassword) nextErrors.confirmPassword = 'Passwords do not match';
    }
    setErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  };

  const handleSubmit = (event) => {
    event.preventDefault();
    if (isReadOnly) return;
    if (!validate()) return;
    onSave({
      full_name: formData.fullName.trim(),
      email: formData.email.trim(),
      department: formData.department.trim(),
      role_id: formData.roleId,
      status: formData.isActive ? 'Active' : 'Inactive',
      is_active: formData.isActive,
      ...(formData.password ? { password: formData.password } : {}),
    });
  };

  return (
    <Modal open={open} title={isView ? 'View Profile' : isEdit ? 'Edit User' : 'Add User'} description={isLockedDefaultAdmin ? 'Default admin profile cannot be modified.' : isView ? 'Review and update user account details.' : isEdit ? 'Update user access and account details.' : 'Create a new user account.'} onClose={saving ? undefined : onClose} maxWidth="max-w-2xl">
      <form onSubmit={handleSubmit} className="space-y-5">
        {serverError && <div className="rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-700">{serverError}</div>}
        {isLockedDefaultAdmin && <div className="rounded-md border border-amber-200 bg-amber-50 px-4 py-3 text-sm font-medium text-amber-800">Default admin profile cannot be modified.</div>}
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label htmlFor="user_full_name" className="block text-sm font-medium text-slate-700">Full Name{requiredMark}</label>
            <input id="user_full_name" value={formData.fullName} readOnly={isReadOnly} onChange={(event) => updateField('fullName', event.target.value)} className={inputClass(errors.fullName)} />
            {errors.fullName && <p className="mt-1 text-xs font-medium text-red-600">{errors.fullName}</p>}
          </div>
          <div>
            <label htmlFor="user_email" className="block text-sm font-medium text-slate-700">Email{requiredMark}</label>
            <input id="user_email" type="email" value={formData.email} readOnly={isReadOnly} onChange={(event) => updateField('email', event.target.value)} className={inputClass(errors.email)} />
            {errors.email && <p className="mt-1 text-xs font-medium text-red-600">{errors.email}</p>}
          </div>
          {(!isView || !isLockedDefaultAdmin) && (
            <>
              <div>
                <label htmlFor="user_password" className="block text-sm font-medium text-slate-700">Password{!isEdit && requiredMark}</label>
                <input id="user_password" type="password" value={formData.password} onChange={(event) => updateField('password', event.target.value)} placeholder={isEdit ? 'Leave blank to keep current password' : ''} className={inputClass(errors.password)} />
                {errors.password && <p className="mt-1 text-xs font-medium text-red-600">{errors.password}</p>}
              </div>
              <div>
                <label htmlFor="user_confirm_password" className="block text-sm font-medium text-slate-700">Confirm Password{!isEdit && requiredMark}</label>
                <input id="user_confirm_password" type="password" value={formData.confirmPassword} onChange={(event) => updateField('confirmPassword', event.target.value)} className={inputClass(errors.confirmPassword)} />
                {errors.confirmPassword && <p className="mt-1 text-xs font-medium text-red-600">{errors.confirmPassword}</p>}
              </div>
              {!isView && (
                <>
                  <div>
                    <label htmlFor="user_department" className="block text-sm font-medium text-slate-700">Department</label>
                    <input id="user_department" value={formData.department} onChange={(event) => updateField('department', event.target.value)} className={inputClass()} />
                  </div>
                  <div>
                    <label htmlFor="user_role" className="block text-sm font-medium text-slate-700">Role{requiredMark}</label>
                    <select id="user_role" value={formData.roleId} onChange={(event) => updateField('roleId', event.target.value)} className={inputClass(errors.roleId)}>
                      <option value="">Select role</option>
                      {roles.map((role) => <option key={role.id} value={role.id}>{role.role_name}</option>)}
                    </select>
                    {errors.roleId && <p className="mt-1 text-xs font-medium text-red-600">{errors.roleId}</p>}
                  </div>
                </>
              )}
            </>
          )}
        </div>
        <label className="flex items-center gap-3 rounded-md border border-slate-200 bg-slate-50 px-3 py-2 text-sm font-semibold text-slate-700">
          <input type="checkbox" checked={formData.isActive} disabled={isReadOnly} onChange={(event) => updateField('isActive', event.target.checked)} className="h-4 w-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500 disabled:cursor-not-allowed" />
          Active user
        </label>
        <div className="flex flex-col-reverse gap-3 border-t border-slate-200 pt-5 sm:flex-row sm:justify-end">
          <button type="button" onClick={onClose} disabled={saving} className="inline-flex items-center justify-center gap-2 rounded-md border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60">
            <ButtonIcon type="close" />
            {isReadOnly ? 'Close' : 'Cancel'}
          </button>
          {!isReadOnly && (
            <button type="submit" disabled={saving} className="inline-flex items-center justify-center gap-2 rounded-md bg-blue-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-70">
              {saving ? <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/40 border-t-white"></span> : <ButtonIcon type={isEdit ? 'save' : 'add'} />}
              {isEdit ? 'Save Changes' : 'Create User'}
            </button>
          )}
        </div>
      </form>
    </Modal>
  );
};

const ActionMenu = ({ user, open, onToggle, onViewProfile, onManageRole }) => (
  <div className="relative inline-flex">
    <button
      type="button"
      onClick={onToggle}
      className="inline-flex h-8 w-8 items-center justify-center rounded-md border border-slate-200 bg-white text-slate-500 shadow-sm transition hover:bg-slate-50 hover:text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
      aria-label={`Open actions for ${user.full_name}`}
      aria-haspopup="menu"
      aria-expanded={open}
    >
      <svg className="h-4 w-4" viewBox="0 0 20 20" fill="none" aria-hidden="true">
        <path d="M10 5.25H10.01M10 10H10.01M10 14.75H10.01" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round"/>
      </svg>
    </button>
    {open && (
      <div className="absolute right-0 top-10 z-30 w-44 overflow-hidden rounded-lg border border-slate-200 bg-white py-1 shadow-xl" role="menu">
        <button type="button" onClick={onViewProfile} className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm font-medium text-slate-700 transition hover:bg-slate-50" role="menuitem">
          <svg className="h-4 w-4 text-slate-400" viewBox="0 0 20 20" fill="none" aria-hidden="true">
            <path d="M2.75 10C3.91 6.65 6.57 4.75 10 4.75C13.43 4.75 16.09 6.65 17.25 10C16.09 13.35 13.43 15.25 10 15.25C6.57 15.25 3.91 13.35 2.75 10Z" stroke="currentColor" strokeWidth="1.5"/>
            <path d="M10 12.25C11.24 12.25 12.25 11.24 12.25 10C12.25 8.76 11.24 7.75 10 7.75C8.76 7.75 7.75 8.76 7.75 10C7.75 11.24 8.76 12.25 10 12.25Z" stroke="currentColor" strokeWidth="1.5"/>
          </svg>
          View Profile
        </button>
        <button type="button" onClick={onManageRole} className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm font-medium text-slate-700 transition hover:bg-slate-50" role="menuitem">
          <svg className="h-4 w-4 text-slate-400" viewBox="0 0 20 20" fill="none" aria-hidden="true">
            <path d="M10 2.75L16.25 5.25V9.25C16.25 13.27 13.69 16.83 10 18.1C6.31 16.83 3.75 13.27 3.75 9.25V5.25L10 2.75Z" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round"/>
            <path d="M7.75 10.25L9.25 11.75L12.75 8.25" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
          Manage Role
        </button>
      </div>
    )}
  </div>
);

const UserManagementPage = ({ currentUser }) => {
  const navigate = useNavigate();
  const [users, setUsers] = useState([]);
  const [roles, setRoles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [sortField, setSortField] = useState('full_name');
  const [sortDirection, setSortDirection] = useState('asc');
  const [modalMode, setModalMode] = useState(null);
  const [editingUser, setEditingUser] = useState(null);
  const [openActionMenuId, setOpenActionMenuId] = useState(null);
  const [formError, setFormError] = useState('');

  const isAdmin = isAdminRole(currentUser);
  const { getColumnStyle, renderResizeHandle } = useResizableColumns(defaultColumnWidths);

  const loadData = async () => {
    setLoading(true);
    setError('');
    try {
      const [usersResponse, rolesResponse] = await Promise.all([
        getAdminUsers(),
        getRoles(),
      ]);
      setUsers(usersResponse.data.users || []);
      setRoles(rolesResponse.data.roles || []);
    } catch (loadError) {
      setError(loadError.response?.data?.error || 'Unable to load user management data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isAdmin) {
      loadData();
    }
  }, [isAdmin]);

  const filteredUsers = useMemo(() => {
    const normalizedSearch = search.trim().toLowerCase();
    return users.filter((user) => {
      const matchesSearch = !normalizedSearch
        || user.full_name?.toLowerCase().includes(normalizedSearch)
        || user.email?.toLowerCase().includes(normalizedSearch)
        || user.department?.toLowerCase().includes(normalizedSearch);
      const matchesRole = !roleFilter || user.role_name === roleFilter;
      const matchesStatus = !statusFilter || user.status === statusFilter;
      return matchesSearch && matchesRole && matchesStatus;
    });
  }, [roleFilter, search, statusFilter, users]);

  const sortedUsers = useMemo(() => {
    return [...filteredUsers].sort((a, b) => {
      const aValue = (a[sortField] || '').toString().toLowerCase();
      const bValue = (b[sortField] || '').toString().toLowerCase();
      const result = aValue.localeCompare(bValue, undefined, { numeric: true, sensitivity: 'base' });
      return sortDirection === 'asc' ? result : -result;
    });
  }, [filteredUsers, sortDirection, sortField]);

  useEffect(() => {
    setCurrentPage(1);
  }, [pageSize, roleFilter, search, statusFilter]);

  useEffect(() => {
    if (!success && !error) return undefined;

    const timeoutId = window.setTimeout(() => {
      setSuccess('');
      setError('');
    }, 3500);

    return () => window.clearTimeout(timeoutId);
  }, [error, success]);

  const totalPages = Math.max(1, Math.ceil(sortedUsers.length / pageSize));
  const startIndex = (currentPage - 1) * pageSize;
  const endIndex = startIndex + pageSize;
  const paginatedUsers = sortedUsers.slice(startIndex, endIndex);

  useEffect(() => {
    if (currentPage > totalPages) {
      setCurrentPage(totalPages);
    }
  }, [currentPage, totalPages]);

  const handleSort = (field) => {
    if (sortField === field) {
      setSortDirection((currentDirection) => (currentDirection === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
    setCurrentPage(1);
  };

  const renderSortIcon = (field) => (
    <span className={`ml-2 text-[10px] leading-none ${sortField === field ? 'text-blue-600' : 'text-slate-400'}`} aria-hidden="true">
      {sortField === field && sortDirection === 'desc' ? '\u25BC' : '\u25B2'}
    </span>
  );

  const renderColumnHeader = (field, label) => (
    <th className="relative text-left font-semibold uppercase tracking-[0.16em]" style={getColumnStyle(field)}>
      <button type="button" onClick={() => handleSort(field)} className="flex w-full min-w-0 items-center justify-between gap-2 text-left" aria-label={`Sort by ${label}`}>
        <span className="truncate">{label}</span>
        {renderSortIcon(field)}
      </button>
      {renderResizeHandle(field)}
    </th>
  );

  if (!isAdmin) {
    return (
      <div className="rounded-lg border border-amber-200 bg-amber-50 px-5 py-4 text-sm font-medium text-amber-800">
        Access Denied. User Management is available only for Admin users.
      </div>
    );
  }

  const handleSaveUser = async (payload) => {
    setSaving(true);
    setFormError('');
    setSuccess('');
    try {
      const response = modalMode === 'edit'
        ? await updateAdminUser(editingUser.id, payload)
        : await createAdminUser(payload);
      setUsers((current) => modalMode === 'edit'
        ? current.map((item) => (item.id === response.data.user.id ? response.data.user : item))
        : [response.data.user, ...current]);
      setSuccess(response.data.message || 'User saved successfully');
      setModalMode(null);
      setEditingUser(null);
    } catch (saveError) {
      setFormError(saveError.response?.data?.error || 'Unable to save user');
    } finally {
      setSaving(false);
    }
  };

  const handleStatusToggle = async (user) => {
    await handleSaveQuick(user, { is_active: !user.is_active, status: user.is_active ? 'Inactive' : 'Active' });
  };

  const handleSaveQuick = async (user, patch) => {
    setSaving(true);
    setSuccess('');
    try {
      const response = await updateAdminUser(user.id, {
        full_name: user.full_name,
        email: user.email,
        department: user.department || '',
        role_id: user.role_id,
        status: patch.status ?? user.status,
        is_active: patch.is_active ?? user.is_active,
      });
      setUsers((current) => current.map((item) => (item.id === response.data.user.id ? response.data.user : item)));
      setSuccess(response.data.message || 'User updated successfully');
    } catch (saveError) {
      setError(saveError.response?.data?.error || 'Unable to update user');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-5">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-slate-900">User Management</h1>
          <p className="mt-1 text-sm text-slate-500">Manage users, roles, and account status.</p>
        </div>
        <button type="button" onClick={() => { setEditingUser(null); setFormError(''); setModalMode('add'); }} className="inline-flex items-center justify-center gap-2 rounded-md bg-blue-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-blue-700">
          <ButtonIcon type="add" />
          Add User
        </button>
      </div>

      {(error || success) && (
        <div className="fixed right-5 top-20 z-[60] w-[min(24rem,calc(100vw-2rem))]">
          <div className={`flex items-start gap-3 rounded-lg border px-4 py-3 text-sm font-medium shadow-xl ${error ? 'border-red-200 bg-red-50 text-red-700' : 'border-emerald-200 bg-emerald-50 text-emerald-700'}`}>
            <span className={`mt-0.5 inline-flex h-5 w-5 shrink-0 items-center justify-center rounded-full text-xs ${error ? 'bg-red-100 text-red-700' : 'bg-emerald-100 text-emerald-700'}`}>
              {error ? '!' : '✓'}
            </span>
            <span className="min-w-0 flex-1">{error || success}</span>
            <button type="button" onClick={() => { setError(''); setSuccess(''); }} className="rounded p-0.5 opacity-70 transition hover:opacity-100" aria-label="Dismiss notification">
              <svg className="h-4 w-4" viewBox="0 0 16 16" fill="none" aria-hidden="true">
                <path d="M4 4L12 12M12 4L4 12" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/>
              </svg>
            </button>
          </div>
        </div>
      )}

      <div className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
        <div className="grid gap-3 md:grid-cols-[1fr_180px_180px_auto]">
          <input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search users..." className="rounded-md border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20" />
          <select value={roleFilter} onChange={(event) => setRoleFilter(event.target.value)} className="rounded-md border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20">
            <option value="">All roles</option>
            {roles.map((role) => <option key={role.id} value={role.role_name}>{role.role_name}</option>)}
          </select>
          <select value={statusFilter} onChange={(event) => setStatusFilter(event.target.value)} className="rounded-md border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20">
            <option value="">All statuses</option>
            <option value="Active">Active</option>
            <option value="Inactive">Inactive</option>
          </select>
          <button type="button" onClick={() => { setSearch(''); setRoleFilter(''); setStatusFilter(''); }} className="inline-flex items-center justify-center gap-2 rounded-md border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50">
            <ButtonIcon type="clear" />
            Clear
          </button>
        </div>
      </div>

      <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[1180px] table-fixed text-sm">
            <thead className="bg-slate-50 text-slate-500">
              <tr>
                {userColumns.map((column) => renderColumnHeader(column.field, column.label))}
                <th className="w-28 text-left">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 bg-white">
              {loading ? (
                <tr><td colSpan="7" className="px-6 py-12 text-center text-sm text-slate-500">Loading users...</td></tr>
              ) : sortedUsers.length === 0 ? (
                <tr><td colSpan="7" className="px-6 py-12 text-center text-sm text-slate-500">No users found.</td></tr>
              ) : paginatedUsers.map((user) => (
                <tr key={user.id} className="transition-colors duration-150 hover:bg-slate-50">
                  <td className="truncate font-semibold text-slate-900" style={getColumnStyle('full_name')}>{user.full_name}</td>
                  <td className="truncate" style={getColumnStyle('email')}>{user.email}</td>
                  <td style={getColumnStyle('role_name')}><span className="rounded-full bg-blue-50 px-2 py-1 text-xs font-semibold text-blue-700">{user.role_name || getRoleName(roles, user.role_id) || '-'}</span></td>
                  <td className="truncate" style={getColumnStyle('department')}>{user.department || '-'}</td>
                  <td style={getColumnStyle('status')}>
                    <button type="button" onClick={() => handleStatusToggle(user)} disabled={saving || user.id === currentUser?.id} className={`inline-flex items-center gap-1.5 rounded-full px-2 py-1 text-xs font-semibold ${user.is_active ? 'bg-emerald-50 text-emerald-700' : 'bg-slate-100 text-slate-600'} disabled:cursor-not-allowed disabled:opacity-60`}>
                      <ButtonIcon type={user.is_active ? 'active' : 'inactive'} className="h-3.5 w-3.5" />
                      {user.is_active ? 'Active' : 'Inactive'}
                    </button>
                  </td>
                  <td style={getColumnStyle('created_at')}>{formatDate(user.created_at)}</td>
                  <td className="relative">
                    <ActionMenu
                      user={user}
                      open={openActionMenuId === user.id}
                      onToggle={() => setOpenActionMenuId((current) => (current === user.id ? null : user.id))}
                      onViewProfile={() => {
                        setEditingUser(user);
                        setFormError('');
                        setModalMode('view');
                        setOpenActionMenuId(null);
                      }}
                      onManageRole={() => {
                        setOpenActionMenuId(null);
                        navigate(`/users/manage-role/${user.id}`);
                      }}
                    />
                  </td>
                </tr>
              ))}
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
              {sortedUsers.length === 0 ? '0 to 0 of 0' : `${startIndex + 1} to ${Math.min(startIndex + pageSize, sortedUsers.length)} of ${sortedUsers.length}`}
            </span>
            <div className="flex items-center gap-2">
              <button type="button" onClick={() => setCurrentPage((page) => Math.max(1, page - 1))} disabled={currentPage === 1} className="inline-flex items-center justify-center rounded-md border border-slate-300 px-3 py-1 text-sm text-slate-700 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50" aria-label="Previous page">
                <ButtonIcon type="previous" />
              </button>
              <span className="text-sm text-slate-600">Page {currentPage} of {totalPages}</span>
              <button type="button" onClick={() => setCurrentPage((page) => Math.min(totalPages, page + 1))} disabled={currentPage === totalPages} className="inline-flex items-center justify-center rounded-md border border-slate-300 px-3 py-1 text-sm text-slate-700 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50" aria-label="Next page">
                <ButtonIcon type="next" />
              </button>
            </div>
          </div>
        </div>
      </div>

      <UserFormModal open={Boolean(modalMode)} mode={modalMode} user={editingUser} roles={roles} saving={saving} serverError={formError} onClose={() => { setModalMode(null); setEditingUser(null); }} onSave={handleSaveUser} />
    </div>
  );
};

export default UserManagementPage;

import React, { useEffect, useMemo, useState } from 'react';
import {
  createAdminUser,
  deleteAdminUser,
  getAdminUsers,
  getRoles,
  updateAdminUser,
  updateAdminUserRole,
} from '../../../services/api';
import Modal from '../../../components/common/Modal';
import DeleteConfirmModal from '../../../components/common/DeleteConfirmModal';
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

const formatDate = (value) => {
  if (!value) return '-';
  return new Intl.DateTimeFormat('en-US', { month: 'short', day: '2-digit', year: 'numeric' }).format(new Date(value));
};

const getRoleName = (roles, roleId) => roles.find((role) => role.id === roleId)?.role_name || '';
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
  const isEdit = mode === 'edit';

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
      roleId: roles.find((role) => role.role_name === 'Employee')?.id || roles[0]?.id || '',
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
    <Modal open={open} title={isEdit ? 'Edit User' : 'Add User'} description={isEdit ? 'Update user access and account details.' : 'Create a new user account.'} onClose={saving ? undefined : onClose} maxWidth="max-w-2xl">
      <form onSubmit={handleSubmit} className="space-y-5">
        {serverError && <div className="rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-700">{serverError}</div>}
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label htmlFor="user_full_name" className="block text-sm font-medium text-slate-700">Full Name{requiredMark}</label>
            <input id="user_full_name" value={formData.fullName} onChange={(event) => updateField('fullName', event.target.value)} className={inputClass(errors.fullName)} />
            {errors.fullName && <p className="mt-1 text-xs font-medium text-red-600">{errors.fullName}</p>}
          </div>
          <div>
            <label htmlFor="user_email" className="block text-sm font-medium text-slate-700">Email{requiredMark}</label>
            <input id="user_email" type="email" value={formData.email} onChange={(event) => updateField('email', event.target.value)} className={inputClass(errors.email)} />
            {errors.email && <p className="mt-1 text-xs font-medium text-red-600">{errors.email}</p>}
          </div>
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
        </div>
        <label className="flex items-center gap-3 rounded-md border border-slate-200 bg-slate-50 px-3 py-2 text-sm font-semibold text-slate-700">
          <input type="checkbox" checked={formData.isActive} onChange={(event) => updateField('isActive', event.target.checked)} className="h-4 w-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500" />
          Active user
        </label>
        <div className="flex flex-col-reverse gap-3 border-t border-slate-200 pt-5 sm:flex-row sm:justify-end">
          <button type="button" onClick={onClose} disabled={saving} className="rounded-md border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60">Cancel</button>
          <button type="submit" disabled={saving} className="inline-flex items-center justify-center rounded-md bg-blue-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-70">
            {saving && <span className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-white/40 border-t-white"></span>}
            {isEdit ? 'Save Changes' : 'Create User'}
          </button>
        </div>
      </form>
    </Modal>
  );
};

const RoleModal = ({ open, user, roles, saving, error, onClose, onSave }) => {
  const [roleId, setRoleId] = useState('');

  useEffect(() => {
    setRoleId(user?.role_id || '');
  }, [user]);

  return (
    <Modal open={open} title="Assign Role" description={user ? `Update role for ${user.full_name}.` : ''} onClose={saving ? undefined : onClose} maxWidth="max-w-md">
      <div className="space-y-5">
        {error && <div className="rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-700">{error}</div>}
        <div>
          <label htmlFor="assign_role" className="block text-sm font-medium text-slate-700">Role{requiredMark}</label>
          <select id="assign_role" value={roleId} onChange={(event) => setRoleId(event.target.value)} className={inputClass(!roleId)}>
            <option value="">Select role</option>
            {roles.map((role) => <option key={role.id} value={role.id}>{role.role_name}</option>)}
          </select>
        </div>
        <div className="flex flex-col-reverse gap-3 border-t border-slate-200 pt-5 sm:flex-row sm:justify-end">
          <button type="button" onClick={onClose} disabled={saving} className="rounded-md border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60">Cancel</button>
          <button type="button" onClick={() => roleId && onSave(roleId)} disabled={saving || !roleId} className="inline-flex items-center justify-center rounded-md bg-blue-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-70">
            {saving && <span className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-white/40 border-t-white"></span>}
            Update Role
          </button>
        </div>
      </div>
    </Modal>
  );
};

const UserDetailsModal = ({ open, user, onClose }) => {
  const details = [
    ['Full Name', user?.full_name],
    ['Email', user?.email],
    ['Role', user?.role_name],
    ['Department', user?.department || '-'],
    ['Status', user?.is_active ? 'Active' : 'Inactive'],
    ['Created Date', formatDate(user?.created_at)],
    ['Last Login', formatDate(user?.last_login)],
  ];

  return (
    <Modal open={open} title="User Details" description={user ? `View account details for ${user.full_name}.` : ''} onClose={onClose} maxWidth="max-w-lg">
      <div className="divide-y divide-slate-200 rounded-lg border border-slate-200">
        {details.map(([label, value]) => (
          <div key={label} className="grid grid-cols-[140px_1fr] gap-4 px-4 py-3 text-sm">
            <div className="font-semibold text-slate-500">{label}</div>
            <div className="min-w-0 break-words font-medium text-slate-900">{value || '-'}</div>
          </div>
        ))}
      </div>
      <div className="mt-5 flex justify-end border-t border-slate-200 pt-5">
        <button type="button" onClick={onClose} className="rounded-md border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50">
          Close
        </button>
      </div>
    </Modal>
  );
};

const UserManagementPage = ({ currentUser }) => {
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
  const [viewingUser, setViewingUser] = useState(null);
  const [editingUser, setEditingUser] = useState(null);
  const [roleUser, setRoleUser] = useState(null);
  const [deleteUser, setDeleteUser] = useState(null);
  const [formError, setFormError] = useState('');

  const isAdmin = isDefaultAdminEmail(currentUser?.email);
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
        Access Denied. User Management is available only for the admin account.
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

  const handleRoleSave = async (roleId) => {
    setSaving(true);
    setFormError('');
    setSuccess('');
    try {
      const response = await updateAdminUserRole(roleUser.id, { role_id: roleId });
      setUsers((current) => current.map((item) => (item.id === response.data.user.id ? response.data.user : item)));
      setSuccess(response.data.message || 'Role updated successfully');
      setRoleUser(null);
    } catch (saveError) {
      setFormError(saveError.response?.data?.error || 'Unable to update role');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    setSaving(true);
    setSuccess('');
    try {
      await deleteAdminUser(deleteUser.id);
      setUsers((current) => current.filter((item) => item.id !== deleteUser.id));
      setSuccess('User deleted successfully');
      setDeleteUser(null);
    } catch (deleteError) {
      setError(deleteError.response?.data?.error || 'Unable to delete user');
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
        <button type="button" onClick={() => { setEditingUser(null); setFormError(''); setModalMode('add'); }} className="rounded-md bg-blue-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-blue-700">
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
          <button type="button" onClick={() => { setSearch(''); setRoleFilter(''); setStatusFilter(''); }} className="rounded-md border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50">
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
                <th className="w-56 text-left">Actions</th>
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
                    <button type="button" onClick={() => handleStatusToggle(user)} disabled={saving || isDefaultAdminEmail(user.email)} className={`rounded-full px-2 py-1 text-xs font-semibold ${user.is_active ? 'bg-emerald-50 text-emerald-700' : 'bg-slate-100 text-slate-600'} disabled:cursor-not-allowed disabled:opacity-60`}>
                      {user.is_active ? 'Active' : 'Inactive'}
                    </button>
                  </td>
                  <td style={getColumnStyle('created_at')}>{formatDate(user.created_at)}</td>
                  <td>
                    <div className="flex flex-wrap items-center gap-2">
                      <button type="button" onClick={() => setViewingUser(user)} className="inline-flex h-8 w-8 items-center justify-center rounded-md text-slate-500 hover:bg-slate-100 hover:text-slate-800" aria-label={`View ${user.full_name}`} title="View user">
                        <svg className="h-4 w-4" viewBox="0 0 20 20" fill="none" aria-hidden="true">
                          <path d="M2.75 10C3.91 6.65 6.57 4.75 10 4.75C13.43 4.75 16.09 6.65 17.25 10C16.09 13.35 13.43 15.25 10 15.25C6.57 15.25 3.91 13.35 2.75 10Z" stroke="currentColor" strokeWidth="1.5"/>
                          <path d="M10 12.25C11.24 12.25 12.25 11.24 12.25 10C12.25 8.76 11.24 7.75 10 7.75C8.76 7.75 7.75 8.76 7.75 10C7.75 11.24 8.76 12.25 10 12.25Z" stroke="currentColor" strokeWidth="1.5"/>
                        </svg>
                      </button>
                      <button type="button" onClick={() => { setEditingUser(user); setFormError(''); setModalMode('edit'); }} className="inline-flex h-8 w-8 items-center justify-center rounded-md text-slate-500 hover:bg-blue-50 hover:text-blue-700" aria-label={`Edit ${user.full_name}`} title="Edit user">
                        <svg className="h-4 w-4" viewBox="0 0 20 20" fill="none" aria-hidden="true"><path d="M4 14.75V16H5.25L14.1 7.15L12.85 5.9L4 14.75Z" stroke="currentColor" strokeWidth="1.5"/><path d="M12.2 6.55L13.45 5.3C13.96 4.79 14.79 4.79 15.3 5.3C15.81 5.81 15.81 6.64 15.3 7.15L14.05 8.4" stroke="currentColor" strokeWidth="1.5"/></svg>
                      </button>
                      <button type="button" onClick={() => { setRoleUser(user); setFormError(''); }} disabled={isDefaultAdminEmail(user.email)} className="rounded-md border border-slate-300 bg-white px-2 py-1 text-xs font-semibold text-slate-700 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50">Role</button>
                      <button type="button" onClick={() => setDeleteUser(user)} disabled={user.id === currentUser?.id || isDefaultAdminEmail(user.email)} className="rounded-md border border-red-200 bg-white px-2 py-1 text-xs font-semibold text-red-600 hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-50">Delete</button>
                    </div>
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
              <button type="button" onClick={() => setCurrentPage((page) => Math.max(1, page - 1))} disabled={currentPage === 1} className="rounded-md border border-slate-300 px-3 py-1 text-sm text-slate-700 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50">
                &#8592;
              </button>
              <span className="text-sm text-slate-600">Page {currentPage} of {totalPages}</span>
              <button type="button" onClick={() => setCurrentPage((page) => Math.min(totalPages, page + 1))} disabled={currentPage === totalPages} className="rounded-md border border-slate-300 px-3 py-1 text-sm text-slate-700 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50">
                &#8594;
              </button>
            </div>
          </div>
        </div>
      </div>

      <UserFormModal open={Boolean(modalMode)} mode={modalMode} user={editingUser} roles={roles} saving={saving} serverError={formError} onClose={() => { setModalMode(null); setEditingUser(null); }} onSave={handleSaveUser} />
      <UserDetailsModal open={Boolean(viewingUser)} user={viewingUser} onClose={() => setViewingUser(null)} />
      <RoleModal open={Boolean(roleUser)} user={roleUser} roles={roles} saving={saving} error={formError} onClose={() => setRoleUser(null)} onSave={handleRoleSave} />
      <DeleteConfirmModal isOpen={Boolean(deleteUser)} title="Delete User" message="Are you sure you want to delete this user?" itemName={deleteUser?.full_name} onCancel={() => setDeleteUser(null)} onConfirm={handleDelete} isLoading={saving} />
    </div>
  );
};

export default UserManagementPage;

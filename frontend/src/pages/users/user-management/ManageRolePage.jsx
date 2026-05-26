import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { getAdminUsers, getRoles, updateAdminUserRole } from '../../../services/api';

const roleContent = {
  Admin: {
    title: 'Admin',
    description: 'Full administrative access for users, roles, assets, settings, and operational data.',
    icon: (
      <svg className="h-5 w-5" viewBox="0 0 20 20" fill="none" aria-hidden="true">
        <path d="M10 2.75L16.25 5.25V9.25C16.25 13.27 13.69 16.83 10 18.1C6.31 16.83 3.75 13.27 3.75 9.25V5.25L10 2.75Z" stroke="currentColor" strokeWidth="1.6" strokeLinejoin="round"/>
        <path d="M7.75 10.25L9.25 11.75L12.75 8.25" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"/>
      </svg>
    ),
  },
  Basic: {
    title: 'Basic',
    description: 'Standard access for day-to-day application usage without administrative permissions.',
    icon: (
      <svg className="h-5 w-5" viewBox="0 0 20 20" fill="none" aria-hidden="true">
        <path d="M10 10.25C12.07 10.25 13.75 8.57 13.75 6.5C13.75 4.43 12.07 2.75 10 2.75C7.93 2.75 6.25 4.43 6.25 6.5C6.25 8.57 7.93 10.25 10 10.25Z" stroke="currentColor" strokeWidth="1.6"/>
        <path d="M3.75 17.25C4.56 14.45 6.89 12.75 10 12.75C13.11 12.75 15.44 14.45 16.25 17.25" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round"/>
      </svg>
    ),
  },
};

const ManageRolePage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [roles, setRoles] = useState([]);
  const [selectedRoleId, setSelectedRoleId] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const roleOptions = useMemo(() => roles.filter((role) => ['Admin', 'Basic'].includes(role.role_name)), [roles]);

  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      setError('');
      try {
        const [usersResponse, rolesResponse] = await Promise.all([getAdminUsers(), getRoles()]);
        const users = usersResponse.data.users || [];
        const loadedRoles = rolesResponse.data.roles || [];
        const selectedUser = users.find((item) => item.id === id);

        if (!selectedUser) {
          setError('User not found');
          return;
        }

        setUser(selectedUser);
        setRoles(loadedRoles);

        const adminRole = loadedRoles.find((role) => role.role_name === 'Admin');
        const basicRole = loadedRoles.find((role) => role.role_name === 'Basic');
        const currentRole = ['Admin', 'Basic'].includes(selectedUser.role_name)
          ? loadedRoles.find((role) => role.id === selectedUser.role_id)
          : null;

        setSelectedRoleId(currentRole?.id || (selectedUser.role_name === 'Admin' ? adminRole?.id : basicRole?.id) || selectedUser.role_id || '');
      } catch (loadError) {
        setError(loadError.response?.data?.error || 'Unable to load role details');
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [id]);

  const handleSave = async () => {
    if (!selectedRoleId || !user) {
      setError('Please select a role');
      return;
    }

    setSaving(true);
    setError('');
    setSuccess('');
    try {
      const response = await updateAdminUserRole(user.id, { role_id: selectedRoleId });
      setUser(response.data.user);
      setSuccess(response.data.message || 'Role updated successfully');
    } catch (saveError) {
      setError(saveError.response?.data?.error || 'Unable to update role');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-5">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-slate-900">Manage User Role</h1>
          <p className="mt-1 text-sm text-slate-500">Select one role and update the user permissions.</p>
        </div>
        <button type="button" onClick={() => navigate('/user-management')} className="inline-flex items-center gap-2 rounded-md border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-700 shadow-sm hover:bg-slate-50">
          <svg className="h-4 w-4" viewBox="0 0 20 20" fill="none" aria-hidden="true">
            <path d="M12.5 5L7.5 10L12.5 15" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
          Back
        </button>
      </div>

      {(error || success) && (
        <div className={`rounded-lg border px-4 py-3 text-sm font-medium ${error ? 'border-red-200 bg-red-50 text-red-700' : 'border-emerald-200 bg-emerald-50 text-emerald-700'}`}>
          {error || success}
        </div>
      )}

      {loading ? (
        <div className="rounded-xl border border-slate-200 bg-white p-8 text-center text-sm text-slate-500 shadow-sm">Loading role details...</div>
      ) : user ? (
        <>
          <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex min-w-0 items-center gap-4">
                {user.profile_image ? (
                  <img src={user.profile_image} alt="" className="h-14 w-14 rounded-lg object-cover ring-1 ring-slate-200" />
                ) : (
                  <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-lg bg-slate-800 text-sm font-bold text-white">
                    {(user.full_name || 'U').split(' ').filter(Boolean).slice(0, 2).map((part) => part.charAt(0).toUpperCase()).join('')}
                  </div>
                )}
                <div className="min-w-0">
                  <div className="truncate text-lg font-semibold text-slate-950">{user.full_name}</div>
                  <div className="mt-1 truncate text-sm text-slate-500">{user.email}</div>
                </div>
              </div>
              <div className="rounded-lg border border-slate-200 bg-slate-50 px-4 py-3 text-sm">
                <div className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">Current Role</div>
                <div className="mt-1 font-semibold text-slate-950">{user.role_name || '-'}</div>
              </div>
            </div>
          </div>

          <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
            <div className="mb-4 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h2 className="text-base font-semibold text-slate-950">Available Roles</h2>
                <p className="mt-1 text-sm text-slate-500">Choose exactly one role for this user.</p>
              </div>
              <button type="button" onClick={handleSave} disabled={saving || !selectedRoleId} className="inline-flex items-center justify-center rounded-md bg-blue-600 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60">
                {saving && <span className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-white/40 border-t-white"></span>}
                Update Role
              </button>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              {roleOptions.map((role) => {
                const selected = selectedRoleId === role.id;
                const content = roleContent[role.role_name];

                return (
                  <button
                    key={role.id}
                    type="button"
                    onClick={() => setSelectedRoleId(role.id)}
                    className={`group flex min-h-36 flex-col rounded-xl border p-5 text-left transition ${
                      selected
                        ? 'border-blue-500 bg-blue-50 shadow-md ring-2 ring-blue-500/20'
                        : 'border-slate-200 bg-white shadow-sm hover:border-slate-300 hover:shadow-md'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-4">
                      <span className={`inline-flex h-10 w-10 items-center justify-center rounded-lg ${selected ? 'bg-blue-600 text-white' : 'bg-slate-100 text-slate-600 group-hover:bg-slate-200'}`}>
                        {content?.icon}
                      </span>
                      <span className={`flex h-5 w-5 items-center justify-center rounded border ${selected ? 'border-blue-600 bg-blue-600 text-white' : 'border-slate-300 bg-white text-transparent'}`}>
                        <svg className="h-3.5 w-3.5" viewBox="0 0 16 16" fill="none" aria-hidden="true">
                          <path d="M3.5 8.25L6.5 11.25L12.5 5.25" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                        </svg>
                      </span>
                    </div>
                    <div className="mt-4 text-base font-semibold text-slate-950">{content?.title || role.role_name}</div>
                    <p className="mt-2 text-sm leading-6 text-slate-500">{content?.description || role.description}</p>
                  </button>
                );
              })}
            </div>
          </div>
        </>
      ) : null}
    </div>
  );
};

export default ManageRolePage;

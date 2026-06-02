import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Modal from '../../components/common/Modal';
import ButtonIcon from '../../components/common/ButtonIcon';
import {
  assignTaskBoardUser,
  createTaskBoard,
  getTaskBoardMembers,
  getTaskBoards,
  removeTaskBoardMember,
  updateTaskBoard,
} from '../../services/api';
import { getStoredUser } from '../users/auth/authStorage';

const emptyBoardForm = {
  name: '',
  description: '',
  visibility: 'Private',
};

const emptyAssignForm = {
  email: '',
  role: 'Viewer',
};

const boardRoles = ['Viewer', 'Member', 'Admin'];
const visibilityOptions = ['Private', 'Public'];
const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const TaskManagementPage = () => {
  const navigate = useNavigate();
  const currentUser = getStoredUser();
  const isAdminUser = currentUser?.role_name === 'Admin' || currentUser?.role === 'Admin';
  const [boards, setBoards] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState('create');
  const [form, setForm] = useState(emptyBoardForm);
  const [selectedBoard, setSelectedBoard] = useState(null);
  const [assignModalOpen, setAssignModalOpen] = useState(false);
  const [assignForm, setAssignForm] = useState(emptyAssignForm);
  const [assignedUsers, setAssignedUsers] = useState([]);
  const [assignedUsersLoading, setAssignedUsersLoading] = useState(false);
  const [removingUserId, setRemovingUserId] = useState('');
  const [formError, setFormError] = useState('');

  const loadBoards = async () => {
    try {
      setLoading(true);
      setError('');
      const response = await getTaskBoards();
      setBoards(response.data.boards || []);
    } catch (err) {
      setError(err.response?.data?.error || 'Unable to load task boards');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadBoards();
  }, []);

  useEffect(() => {
    if (!notice) return undefined;
    const timer = window.setTimeout(() => setNotice(''), 3000);
    return () => window.clearTimeout(timer);
  }, [notice]);

  const closeModal = () => {
    if (saving) return;
    setModalOpen(false);
    setModalMode('create');
    setSelectedBoard(null);
    setForm(emptyBoardForm);
    setFormError('');
  };

  const openCreateModal = () => {
    setModalMode('create');
    setSelectedBoard(null);
    setForm(emptyBoardForm);
    setFormError('');
    setModalOpen(true);
  };

  const openEditModal = (event, board) => {
    event.stopPropagation();
    if (!isAdminUser) return;

    setModalMode('edit');
    setSelectedBoard(board);
    setForm({
      name: board.name || '',
      description: board.description || '',
      visibility: board.visibility || 'Private',
    });
    setFormError('');
    setModalOpen(true);
  };

  const openAssignModal = (event, board) => {
    event.stopPropagation();
    if (!isAdminUser) return;

    setSelectedBoard(board);
    setAssignForm(emptyAssignForm);
    setAssignedUsers([]);
    setFormError('');
    setAssignModalOpen(true);
    loadAssignedUsers(board.id);
  };

  const closeAssignModal = () => {
    if (saving) return;
    setAssignModalOpen(false);
    setSelectedBoard(null);
    setAssignForm(emptyAssignForm);
    setAssignedUsers([]);
    setAssignedUsersLoading(false);
    setRemovingUserId('');
    setFormError('');
  };

  const loadAssignedUsers = async (boardId) => {
    try {
      setAssignedUsersLoading(true);
      const response = await getTaskBoardMembers(boardId);
      setAssignedUsers(response.data.members || []);
    } catch (err) {
      setAssignedUsers([]);
      setFormError(err.response?.data?.error || 'Unable to load assigned users');
    } finally {
      setAssignedUsersLoading(false);
    }
  };

  const saveBoard = async (event) => {
    event.preventDefault();
    if (!form.name.trim()) {
      setFormError('Board name is required');
      return;
    }

    try {
      setSaving(true);
      setError('');
      setFormError('');
      if (modalMode === 'edit') {
        await updateTaskBoard(selectedBoard.id, form);
        setNotice('Board updated successfully');
      } else {
        await createTaskBoard(form);
        setNotice('Board created successfully');
      }
      setModalOpen(false);
      setModalMode('create');
      setSelectedBoard(null);
      setForm(emptyBoardForm);
      await loadBoards();
    } catch (err) {
      setFormError(err.response?.data?.error || (modalMode === 'edit' ? 'Unable to update board' : 'Unable to create board'));
    } finally {
      setSaving(false);
    }
  };

  const assignUser = async (event) => {
    event.preventDefault();
    const email = assignForm.email.trim();
    if (!emailRegex.test(email)) {
      setFormError('Enter a valid user email');
      return;
    }

    try {
      setSaving(true);
      setError('');
      setFormError('');
      const response = await assignTaskBoardUser(selectedBoard.id, {
        email,
        role: assignForm.role,
      });
      setNotice(response.data.message || 'Board assigned successfully');
      setAssignForm(emptyAssignForm);
      await loadAssignedUsers(selectedBoard.id);
      await loadBoards();
    } catch (err) {
      setFormError(err.response?.data?.error || 'Unable to assign board');
    } finally {
      setSaving(false);
    }
  };

  const removeAssignedUser = async (user) => {
    try {
      setRemovingUserId(user.user_id);
      setFormError('');
      const response = await removeTaskBoardMember(selectedBoard.id, user.user_id);
      setNotice(response.data.message || 'User removed from board');
      await loadAssignedUsers(selectedBoard.id);
      await loadBoards();
    } catch (err) {
      setFormError(err.response?.data?.error || 'Unable to remove assigned user');
    } finally {
      setRemovingUserId('');
    }
  };

  return (
    <div className="space-y-5">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-slate-950">Task Management</h1>
          <p className="mt-1 text-sm text-slate-500">Create boards and organize tasks into simple Kanban columns.</p>
        </div>
        <button
          type="button"
          onClick={openCreateModal}
          className="inline-flex items-center justify-center gap-2 rounded-md bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <ButtonIcon type="add" />
          New Board
        </button>
      </div>

      {notice && (
        <div className="rounded-md border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-medium text-emerald-700">
          {notice}
        </div>
      )}
      {error && (
        <div className="rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-700">
          {error}
        </div>
      )}

      {loading ? (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {[1, 2, 3].map((item) => (
            <div key={item} className="h-40 animate-pulse rounded-lg border border-slate-200 bg-white shadow-sm">
              <div className="space-y-3 p-5">
                <div className="h-5 w-1/2 rounded bg-slate-200"></div>
                <div className="h-4 w-full rounded bg-slate-100"></div>
                <div className="h-4 w-3/4 rounded bg-slate-100"></div>
              </div>
            </div>
          ))}
        </div>
      ) : boards.length === 0 ? (
        <div className="rounded-lg border border-dashed border-slate-300 bg-white px-6 py-12 text-center shadow-sm">
          <div className="text-base font-semibold text-slate-900">No task boards yet</div>
          <p className="mt-2 text-sm text-slate-500">Create a board to start tracking tasks.</p>
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {boards.map((board) => (
            <div
              key={board.id}
              onClick={() => navigate(`/tasks/boards/${board.id}`)}
              role="button"
              tabIndex={0}
              onKeyDown={(event) => {
                if (event.key === 'Enter' || event.key === ' ') {
                  navigate(`/tasks/boards/${board.id}`);
                }
              }}
              className="group cursor-pointer rounded-lg border border-slate-200 bg-white p-5 text-left shadow-sm transition hover:-translate-y-0.5 hover:border-blue-200 hover:shadow-md"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <h2 className="truncate text-base font-semibold text-slate-950">{board.name}</h2>
                  <p className="mt-2 line-clamp-2 min-h-[2.5rem] text-sm leading-5 text-slate-500">
                    {board.description || 'No description added.'}
                  </p>
                </div>
                <span className="rounded-full bg-blue-50 px-2.5 py-1 text-xs font-semibold text-blue-700">
                  {board.cards_count || 0} cards
                </span>
              </div>
              <div className="mt-4 flex flex-wrap items-center gap-2">
                <span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${board.visibility === 'Public' ? 'bg-emerald-50 text-emerald-700' : 'bg-slate-100 text-slate-600'}`}>
                  {board.visibility || 'Private'}
                </span>
                {isAdminUser && (
                  <div className="ml-auto flex items-center gap-2">
                    <button
                      type="button"
                      onClick={(event) => openEditModal(event, board)}
                      className="inline-flex items-center gap-1.5 rounded-md border border-slate-200 bg-white px-2.5 py-1.5 text-xs font-semibold text-slate-700 hover:border-blue-200 hover:text-blue-700"
                    >
                      <ButtonIcon type="edit" className="h-3.5 w-3.5" />
                      Edit
                    </button>
                    <button
                      type="button"
                      onClick={(event) => openAssignModal(event, board)}
                      className="inline-flex items-center gap-1.5 rounded-md border border-slate-200 bg-white px-2.5 py-1.5 text-xs font-semibold text-slate-700 hover:border-blue-200 hover:text-blue-700"
                    >
                      <ButtonIcon type="add" className="h-3.5 w-3.5" />
                      Assign
                    </button>
                  </div>
                )}
              </div>
              <div className="mt-5 flex items-center justify-between gap-3 text-xs text-slate-500">
                <span className="truncate">Owner: {board.created_by_name || 'Unassigned'}</span>
                <span className="shrink-0">{board.updated_at ? new Date(board.updated_at).toLocaleDateString() : ''}</span>
              </div>
            </div>
          ))}
        </div>
      )}

      <Modal open={modalOpen} title={modalMode === 'edit' ? 'Edit Board' : 'Create Board'} onClose={closeModal} maxWidth="max-w-xl">
        <form onSubmit={saveBoard} className="space-y-4">
          {formError && (
            <div className="rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-700">
              {formError}
            </div>
          )}
          <div>
            <label className="text-sm font-semibold text-slate-700">Board Name <span className="text-red-500">*</span></label>
            <input
              value={form.name}
              onChange={(event) => setForm((current) => ({ ...current, name: event.target.value }))}
              className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-100"
              placeholder="IT Operations"
            />
          </div>
          <div>
            <label className="text-sm font-semibold text-slate-700">Description</label>
            <textarea
              value={form.description}
              onChange={(event) => setForm((current) => ({ ...current, description: event.target.value }))}
              rows={3}
              className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-100"
              placeholder="What this board is used for"
            />
          </div>
          <div>
            <label className="text-sm font-semibold text-slate-700">Visibility</label>
            <select
              value={form.visibility}
              onChange={(event) => setForm((current) => ({ ...current, visibility: event.target.value }))}
              className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-100"
            >
              {visibilityOptions.map((visibility) => <option key={visibility} value={visibility}>{visibility}</option>)}
            </select>
          </div>
          <div className="flex justify-end gap-3 pt-2">
            <button type="button" onClick={closeModal} className="rounded-md border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50">
              Cancel
            </button>
            <button type="submit" disabled={saving} className="inline-flex items-center gap-2 rounded-md bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700 disabled:opacity-60">
              <ButtonIcon type="save" />
              {saving ? 'Saving...' : modalMode === 'edit' ? 'Save Changes' : 'Create Board'}
            </button>
          </div>
        </form>
      </Modal>

      <Modal open={assignModalOpen} title="Assign Board" onClose={closeAssignModal} maxWidth="max-w-lg">
        <form onSubmit={assignUser} className="space-y-4">
          {formError && (
            <div className="rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-700">
              {formError}
            </div>
          )}
          <div>
            <label className="text-sm font-semibold text-slate-700">User Email <span className="text-red-500">*</span></label>
            <input
              type="email"
              value={assignForm.email}
              onChange={(event) => setAssignForm((current) => ({ ...current, email: event.target.value }))}
              className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-100"
              placeholder="user@example.com"
            />
          </div>
          <div>
            <label className="text-sm font-semibold text-slate-700">Board Role</label>
            <select
              value={assignForm.role}
              onChange={(event) => setAssignForm((current) => ({ ...current, role: event.target.value }))}
              className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-100"
            >
              {boardRoles.map((role) => <option key={role} value={role}>{role}</option>)}
            </select>
          </div>
          <div className="rounded-md border border-slate-200 bg-slate-50">
            <div className="flex items-center justify-between border-b border-slate-200 px-4 py-3">
              <div className="text-sm font-semibold text-slate-800">Assigned Users</div>
              <div className="text-xs font-medium text-slate-500">{assignedUsers.length} users</div>
            </div>
            <div className="max-h-64 overflow-y-auto p-3">
              {assignedUsersLoading ? (
                <div className="space-y-2">
                  {[1, 2, 3].map((item) => (
                    <div key={item} className="h-14 animate-pulse rounded-md bg-white"></div>
                  ))}
                </div>
              ) : assignedUsers.length === 0 ? (
                <div className="rounded-md border border-dashed border-slate-300 bg-white px-4 py-6 text-center text-sm text-slate-500">
                  No users assigned yet.
                </div>
              ) : (
                <div className="space-y-2">
                  {assignedUsers.map((user) => (
                    <div key={user.user_id} className="flex items-center gap-3 rounded-md border border-slate-200 bg-white px-3 py-2">
                      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-blue-600 text-xs font-bold text-white">
                        {(user.full_name || user.email || 'U')
                          .split(' ')
                          .filter(Boolean)
                          .slice(0, 2)
                          .map((part) => part.charAt(0).toUpperCase())
                          .join('') || 'U'}
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="truncate text-sm font-semibold text-slate-900">{user.full_name || user.email}</span>
                          {user.is_owner && <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[11px] font-semibold text-slate-600">Owner</span>}
                          {!user.is_active && <span className="rounded-full bg-red-50 px-2 py-0.5 text-[11px] font-semibold text-red-700">Inactive</span>}
                        </div>
                        <div className="truncate text-xs text-slate-500">{user.email}</div>
                      </div>
                      <span className="rounded-full bg-blue-50 px-2 py-1 text-xs font-semibold text-blue-700">{user.role}</span>
                      <button
                        type="button"
                        onClick={() => removeAssignedUser(user)}
                        disabled={user.is_owner || Boolean(removingUserId)}
                        className="rounded-md border border-slate-200 px-2.5 py-1.5 text-xs font-semibold text-red-600 hover:border-red-200 hover:bg-red-50 disabled:cursor-not-allowed disabled:text-slate-400 disabled:hover:border-slate-200 disabled:hover:bg-white"
                      >
                        {removingUserId === user.user_id ? 'Removing...' : 'Remove'}
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
          <div className="flex justify-end gap-3 pt-2">
            <button type="button" onClick={closeAssignModal} className="rounded-md border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50">
              Cancel
            </button>
            <button type="submit" disabled={saving} className="inline-flex items-center gap-2 rounded-md bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700 disabled:opacity-60">
              <ButtonIcon type="save" />
              {saving ? 'Assigning...' : 'Assign User'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default TaskManagementPage;

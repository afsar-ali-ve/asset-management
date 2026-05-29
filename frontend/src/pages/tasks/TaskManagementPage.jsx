import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Modal from '../../components/common/Modal';
import ButtonIcon from '../../components/common/ButtonIcon';
import { createTaskBoard, getTaskBoards } from '../../services/api';

const emptyBoardForm = {
  name: '',
  description: '',
};

const TaskManagementPage = () => {
  const navigate = useNavigate();
  const [boards, setBoards] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [form, setForm] = useState(emptyBoardForm);

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
    setForm(emptyBoardForm);
  };

  const saveBoard = async (event) => {
    event.preventDefault();
    if (!form.name.trim()) {
      setError('Board name is required');
      return;
    }

    try {
      setSaving(true);
      setError('');
      await createTaskBoard(form);
      setNotice('Board created successfully');
      closeModal();
      await loadBoards();
    } catch (err) {
      setError(err.response?.data?.error || 'Unable to create board');
    } finally {
      setSaving(false);
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
          onClick={() => setModalOpen(true)}
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
            <button
              key={board.id}
              type="button"
              onClick={() => navigate(`/tasks/boards/${board.id}`)}
              className="group rounded-lg border border-slate-200 bg-white p-5 text-left shadow-sm transition hover:-translate-y-0.5 hover:border-blue-200 hover:shadow-md"
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
              <div className="mt-5 flex items-center justify-between text-xs text-slate-500">
                <span>Owner: {board.created_by_name || 'Unassigned'}</span>
                <span>{board.updated_at ? new Date(board.updated_at).toLocaleDateString() : ''}</span>
              </div>
            </button>
          ))}
        </div>
      )}

      <Modal open={modalOpen} title="Create Board" onClose={closeModal} maxWidth="max-w-xl">
        <form onSubmit={saveBoard} className="space-y-4">
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
          <div className="flex justify-end gap-3 pt-2">
            <button type="button" onClick={closeModal} className="rounded-md border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50">
              Cancel
            </button>
            <button type="submit" disabled={saving} className="inline-flex items-center gap-2 rounded-md bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700 disabled:opacity-60">
              <ButtonIcon type="save" />
              {saving ? 'Saving...' : 'Create Board'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default TaskManagementPage;

import React, { memo, useCallback, useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
  DndContext,
  PointerSensor,
  closestCorners,
  useDroppable,
  useSensor,
  useSensors,
} from '@dnd-kit/core';
import {
  SortableContext,
  arrayMove,
  useSortable,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import Modal from '../../components/common/Modal';
import ButtonIcon from '../../components/common/ButtonIcon';
import {
  createTaskCard,
  createTaskList,
  getAssignableUsers,
  getTaskBoardAccessStatus,
  getTaskBoardLists,
  getTaskBoards,
  moveTaskCard,
  requestTaskBoardAccess,
  reorderTaskCards,
} from '../../services/api';
import { getStoredUser } from '../users/auth/authStorage';

const priorityOptions = ['Low', 'Medium', 'High', 'Urgent'];

const emptyCardForm = {
  title: '',
  description: '',
  priority: 'Medium',
  due_date: '',
  assignee_id: '',
};

const getPriorityClass = (priority) => {
  if (priority === 'Urgent') return 'bg-red-50 text-red-700';
  if (priority === 'High') return 'bg-orange-50 text-orange-700';
  if (priority === 'Low') return 'bg-emerald-50 text-emerald-700';
  return 'bg-blue-50 text-blue-700';
};

const PrivateBoardAccessRequest = ({ user, requestStatus, saving, onRequest, error, notice }) => {
  const displayName = user?.full_name || 'User';
  const displayEmail = user?.email || '';
  const initials = getInitials(displayName);
  const isPending = requestStatus === 'Pending';
  const isRejected = requestStatus === 'Rejected';

  return (
    <div className="-mx-6 -my-6 flex min-h-[calc(100vh-4.5rem)] items-start justify-center bg-slate-100 px-4 py-12 sm:py-16">
      <div className="w-full max-w-[29rem] rounded-sm border border-slate-200 bg-white px-7 py-7 text-center shadow-[0_12px_28px_rgba(15,23,42,0.18)]">
        <div className="mx-auto flex h-24 w-32 items-center justify-center" aria-hidden="true">
          <svg className="h-24 w-32" viewBox="0 0 160 120" fill="none">
            <ellipse cx="79" cy="75" rx="48" ry="24" fill="#FBCFE8" />
            <path d="M76 18C87 30 99 33 115 28V57C115 78 99 88 76 99C53 88 37 78 37 57V28C52 33 65 30 76 18Z" fill="#C4B5FD" />
            <path d="M76 28C85 37 95 40 108 37V57C108 72 96 80 76 90C56 80 44 72 44 57V37C57 40 67 37 76 28Z" fill="#DDD6FE" />
            <rect x="22" y="57" width="44" height="20" rx="10" fill="#A78BFA" />
            <path d="M30 67H58" stroke="white" strokeWidth="3" strokeLinecap="round" strokeDasharray="1 7" />
            <rect x="26" y="32" width="16" height="20" rx="5" fill="#EC4899" />
            <path d="M30 32V28C30 24 33 21 37 21C41 21 44 24 44 28V32" stroke="#F9A8D4" strokeWidth="3" strokeLinecap="round" />
            <circle cx="77" cy="56" r="17" fill="#2563EB" />
            <circle cx="77" cy="56" r="10" fill="#1E293B" />
            <path d="M77 66L72 82H92L85 66H77Z" fill="#1E293B" />
            <circle cx="116" cy="50" r="14" stroke="#FB7185" strokeWidth="6" />
            <path d="M103 58L93 68" stroke="#FB7185" strokeWidth="6" strokeLinecap="round" />
          </svg>
        </div>
        <h1 className="mt-4 text-xl font-semibold text-slate-950">This board is private</h1>
        <p className="mx-auto mt-3 max-w-sm text-sm leading-5 text-slate-700">
          Send a request to this board's admins to get access. If you're approved to join, you'll receive an email.
        </p>

        <div className="mt-7 text-left">
          <div className="mb-2 text-xs text-slate-500">You are logged in as</div>
          <div className="flex items-center gap-3">
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-blue-600 text-xs font-bold text-white">
              {initials}
            </div>
            <div className="min-w-0">
              <div className="truncate text-sm font-semibold text-slate-900">{displayName}</div>
              <div className="truncate text-xs text-slate-600">{displayEmail}</div>
            </div>
            <button type="button" className="ml-auto text-xs font-semibold text-blue-600 hover:text-blue-700">
              Switch account
            </button>
          </div>
        </div>

        <p className="mt-6 text-left text-xs leading-5 text-slate-500">
          By requesting access, you agree to share your account information, including your email address, with the board admins.
        </p>

        {notice && <div className="mt-5 rounded-md border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-medium text-emerald-700">{notice}</div>}
        {error && <div className="mt-5 rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-700">{error}</div>}
        {isPending && <div className="mt-5 rounded-md border border-amber-200 bg-amber-50 px-4 py-3 text-sm font-medium text-amber-700">Request pending approval</div>}
        {isRejected && <div className="mt-5 rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-700">Your request was rejected</div>}

        <button
          type="button"
          onClick={onRequest}
          disabled={saving || isPending || isRejected}
          className="mt-5 inline-flex w-full items-center justify-center rounded-sm bg-blue-600 px-5 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:bg-slate-300"
        >
          {saving ? 'Sending...' : isPending ? 'Request sent' : 'Send request'}
        </button>
      </div>
    </div>
  );
};

const getInitials = (name = '') => {
  const initials = name
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part.charAt(0).toUpperCase())
    .join('');
  return initials || 'U';
};

const ListDropZone = ({ listId, isEmpty, children }) => {
  const { setNodeRef, isOver } = useDroppable({ id: listId });

  return (
    <div
      ref={setNodeRef}
      className={`min-h-[8rem] flex-1 space-y-3 rounded-md transition ${isOver ? 'bg-blue-50/80 ring-2 ring-blue-200' : ''}`}
    >
      {children}
      {isEmpty && (
        <div className="rounded-lg border border-dashed border-slate-300 bg-white/70 px-4 py-8 text-center text-sm text-slate-500">
          Drop cards here
        </div>
      )}
    </div>
  );
};

const SortableTaskCard = memo(({ card }) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: card.id });
  const assigneeName = card.assignee_name || 'Unassigned';

  return (
    <div
      ref={setNodeRef}
      style={{
        transform: CSS.Transform.toString(transform),
        transition,
      }}
      {...attributes}
      {...listeners}
      className={`cursor-grab rounded-lg border border-slate-200 bg-white p-3 shadow-sm transition hover:-translate-y-0.5 hover:border-blue-200 hover:shadow-md active:cursor-grabbing ${
        isDragging ? 'opacity-60 shadow-xl ring-2 ring-blue-200' : ''
      }`}
    >
      <h3 className="text-sm font-semibold leading-5 text-slate-950">{card.title}</h3>
      {card.description && <p className="mt-1 line-clamp-2 text-xs leading-5 text-slate-500">{card.description}</p>}
      <div className="mt-3 flex flex-wrap items-center gap-2">
        <span className={`rounded-full px-2 py-0.5 text-[11px] font-semibold ${getPriorityClass(card.priority)}`}>
          {card.priority || 'Medium'}
        </span>
        {card.due_date && (
          <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[11px] font-semibold text-slate-600">
            {new Date(card.due_date).toLocaleDateString()}
          </span>
        )}
      </div>
      <div className="mt-3 flex items-center justify-between gap-3">
        <span className="truncate text-xs font-medium text-slate-500">{assigneeName}</span>
        <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-slate-700 text-[11px] font-semibold text-white">
          {getInitials(assigneeName)}
        </span>
      </div>
    </div>
  );
});

const TaskBoardPage = () => {
  const { boardId } = useParams();
  const navigate = useNavigate();
  const currentUser = getStoredUser();
  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 6 } }));
  const [board, setBoard] = useState(null);
  const [lists, setLists] = useState([]);
  const [accessStatus, setAccessStatus] = useState(null);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [notice, setNotice] = useState('');
  const [error, setError] = useState('');
  const [listModalOpen, setListModalOpen] = useState(false);
  const [listTitle, setListTitle] = useState('');
  const [selectedList, setSelectedList] = useState(null);
  const [cardModalOpen, setCardModalOpen] = useState(false);
  const [cardForm, setCardForm] = useState(emptyCardForm);

  const loadBoard = useCallback(async () => {
    try {
      setLoading(true);
      setError('');
      const accessResponse = await getTaskBoardAccessStatus(boardId);
      setAccessStatus(accessResponse.data);
      if (!accessResponse.data.hasAccess) {
        setBoard(null);
        setLists([]);
        return;
      }
      const [boardsResponse, listsResponse] = await Promise.all([
        getTaskBoards(),
        getTaskBoardLists(boardId),
      ]);
      setBoard((boardsResponse.data.boards || []).find((item) => item.id === boardId) || null);
      setLists(listsResponse.data.lists || []);
    } catch (err) {
      setError(err.response?.data?.error || 'Unable to load board');
    } finally {
      setLoading(false);
    }
  }, [boardId]);

  const loadUsers = useCallback(async () => {
    try {
      const response = await getAssignableUsers();
      setUsers(response.data.users || []);
    } catch (err) {
      setUsers([]);
    }
  }, []);

  useEffect(() => {
    loadBoard();
    loadUsers();
  }, [loadBoard, loadUsers]);

  useEffect(() => {
    if (!notice) return undefined;
    const timer = window.setTimeout(() => setNotice(''), 3000);
    return () => window.clearTimeout(timer);
  }, [notice]);

  const saveList = async (event) => {
    event.preventDefault();
    if (!listTitle.trim()) {
      setError('List title is required');
      return;
    }

    try {
      setSaving(true);
      setError('');
      await createTaskList({ board_id: boardId, title: listTitle });
      setNotice('List created successfully');
      setListModalOpen(false);
      setListTitle('');
      await loadBoard();
    } catch (err) {
      setError(err.response?.data?.error || 'Unable to create list');
    } finally {
      setSaving(false);
    }
  };

  const openCreateCard = (list) => {
    setSelectedList(list);
    setCardForm(emptyCardForm);
    setCardModalOpen(true);
  };

  const saveCard = async (event) => {
    event.preventDefault();
    if (!cardForm.title.trim()) {
      setError('Task title is required');
      return;
    }

    try {
      setSaving(true);
      setError('');
      await createTaskCard({
        list_id: selectedList?.id,
        title: cardForm.title,
        description: cardForm.description,
        priority: cardForm.priority,
        due_date: cardForm.due_date || null,
        assignee_id: cardForm.assignee_id || null,
      });
      setNotice('Task created successfully');
      setCardModalOpen(false);
      setCardForm(emptyCardForm);
      await loadBoard();
    } catch (err) {
      setError(err.response?.data?.error || 'Unable to create task');
    } finally {
      setSaving(false);
    }
  };

  const sendAccessRequest = async () => {
    try {
      setSaving(true);
      setError('');
      const response = await requestTaskBoardAccess(boardId);
      setNotice(response.data.message || 'Access request sent successfully');
      setAccessStatus((current) => ({
        ...(current || { boardId, hasAccess: false }),
        requestStatus: response.data.requestStatus || 'Pending',
        request: response.data.request,
      }));
    } catch (err) {
      setError(err.response?.data?.error || 'Unable to send access request');
    } finally {
      setSaving(false);
    }
  };

  const findCardLocation = useCallback((cardId, sourceLists = lists) => {
    for (const list of sourceLists) {
      const cardIndex = (list.cards || []).findIndex((card) => card.id === cardId);
      if (cardIndex >= 0) {
        return { list, cardIndex };
      }
    }
    return null;
  }, [lists]);

  const handleDragEnd = async ({ active, over }) => {
    if (!over || active.id === over.id) return;

    const source = findCardLocation(active.id);
    if (!source) return;

    const targetCard = findCardLocation(over.id);
    const targetList = targetCard?.list || lists.find((list) => list.id === over.id);
    if (!targetList) return;

    const sourceListId = source.list.id;
    const destinationListId = targetList.id;
    const destinationIndex = targetCard ? targetCard.cardIndex : targetList.cards.length;
    const movingCard = source.list.cards[source.cardIndex];
    const previousLists = lists;

    const nextLists = lists.map((list) => {
      if (sourceListId === destinationListId && list.id === sourceListId) {
        return {
          ...list,
          cards: arrayMove(list.cards || [], source.cardIndex, destinationIndex),
        };
      }

      if (list.id === sourceListId) {
        return {
          ...list,
          cards: (list.cards || []).filter((card) => card.id !== active.id),
        };
      }

      if (list.id === destinationListId) {
        const nextCards = [...(list.cards || [])];
        nextCards.splice(destinationIndex, 0, { ...movingCard, list_id: destinationListId });
        return {
          ...list,
          cards: nextCards,
        };
      }

      return list;
    });

    setLists(nextLists);

    const sourceList = nextLists.find((list) => list.id === sourceListId);
    const destinationList = nextLists.find((list) => list.id === destinationListId);

    try {
      if (sourceListId === destinationListId) {
        await reorderTaskCards({
          listId: destinationListId,
          orderedIds: (destinationList?.cards || []).map((card) => card.id),
        });
      } else {
        await moveTaskCard(active.id, {
          cardId: active.id,
          sourceListId,
          destinationListId,
          newOrderIndex: destinationIndex,
          sourceOrderedIds: (sourceList?.cards || []).map((card) => card.id),
          destinationOrderedIds: (destinationList?.cards || []).map((card) => card.id),
        });
      }
      setNotice('Card order updated');
    } catch (err) {
      setLists(previousLists);
      setError(err.response?.data?.error || 'Unable to update card order');
    }
  };

  if (loading) {
    return (
      <div className="space-y-5">
        <div className="h-8 w-64 animate-pulse rounded bg-slate-200"></div>
        <div className="flex gap-4 overflow-hidden">
          {[1, 2, 3, 4].map((item) => (
            <div key={item} className="h-[30rem] w-80 shrink-0 animate-pulse rounded-lg bg-slate-200"></div>
          ))}
        </div>
      </div>
    );
  }

  if (accessStatus && !accessStatus.hasAccess) {
    return (
      <PrivateBoardAccessRequest
        user={currentUser}
        requestStatus={accessStatus.requestStatus}
        saving={saving}
        onRequest={sendAccessRequest}
        error={error}
        notice={notice}
      />
    );
  }

  return (
    <div className="space-y-5">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <button type="button" onClick={() => navigate('/tasks')} className="text-sm font-semibold text-blue-600 hover:text-blue-700">
            Back to boards
          </button>
          <h1 className="mt-2 text-2xl font-semibold text-slate-950">{board?.name || 'Task Board'}</h1>
          <p className="mt-1 text-sm text-slate-500">{board?.description || 'Manage tasks across simple Kanban columns.'}</p>
        </div>
        <button
          type="button"
          onClick={() => setListModalOpen(true)}
          className="inline-flex items-center justify-center gap-2 rounded-md bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-blue-700"
        >
          <ButtonIcon type="add" />
          Add List
        </button>
      </div>

      {notice && <div className="rounded-md border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-medium text-emerald-700">{notice}</div>}
      {error && <div className="rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-700">{error}</div>}

      <DndContext sensors={sensors} collisionDetection={closestCorners} onDragEnd={handleDragEnd}>
        <div className="task-board-scroll flex min-h-[calc(100vh-13rem)] gap-4 overflow-x-auto pb-4">
          {lists.map((list) => (
            <section key={list.id} className="flex max-h-[calc(100vh-13rem)] w-80 shrink-0 flex-col rounded-lg border border-slate-200 bg-slate-100/80 shadow-sm">
              <div className="border-b border-slate-200 px-4 py-3">
                <h2 className="text-sm font-semibold text-slate-950">{list.title}</h2>
                <p className="mt-0.5 text-xs text-slate-500">{list.cards?.length || 0} cards</p>
              </div>
              <div className="min-h-0 flex-1 overflow-y-auto p-3">
                <SortableContext items={(list.cards || []).map((card) => card.id)} strategy={verticalListSortingStrategy}>
                  <ListDropZone listId={list.id} isEmpty={(list.cards || []).length === 0}>
                    {(list.cards || []).map((card) => (
                      <SortableTaskCard key={card.id} card={card} />
                    ))}
                  </ListDropZone>
                </SortableContext>
              </div>
              <div className="border-t border-slate-200 p-3">
                <button
                  type="button"
                  onClick={() => openCreateCard(list)}
                  className="inline-flex w-full items-center justify-center gap-2 rounded-md border border-slate-200 bg-white px-3 py-2 text-sm font-semibold text-slate-700 shadow-sm hover:border-blue-200 hover:text-blue-700"
                >
                  <ButtonIcon type="add" />
                  Add Card
                </button>
              </div>
            </section>
          ))}
        </div>
      </DndContext>

      <Modal open={listModalOpen} title="Create List" onClose={() => setListModalOpen(false)} maxWidth="max-w-lg">
        <form onSubmit={saveList} className="space-y-4">
          <div>
            <label className="text-sm font-semibold text-slate-700">List Title <span className="text-red-500">*</span></label>
            <input
              value={listTitle}
              onChange={(event) => setListTitle(event.target.value)}
              className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-100"
              placeholder="Review"
            />
          </div>
          <div className="flex justify-end gap-3">
            <button type="button" onClick={() => setListModalOpen(false)} className="rounded-md border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50">
              Cancel
            </button>
            <button type="submit" disabled={saving} className="inline-flex items-center gap-2 rounded-md bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700 disabled:opacity-60">
              <ButtonIcon type="save" />
              {saving ? 'Saving...' : 'Create List'}
            </button>
          </div>
        </form>
      </Modal>

      <Modal open={cardModalOpen} title={`Add Card${selectedList ? ` to ${selectedList.title}` : ''}`} onClose={() => setCardModalOpen(false)} maxWidth="max-w-2xl">
        <form onSubmit={saveCard} className="space-y-4">
          <div>
            <label className="text-sm font-semibold text-slate-700">Title <span className="text-red-500">*</span></label>
            <input
              value={cardForm.title}
              onChange={(event) => setCardForm((current) => ({ ...current, title: event.target.value }))}
              className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-100"
              placeholder="Prepare onboarding laptop"
            />
          </div>
          <div>
            <label className="text-sm font-semibold text-slate-700">Description</label>
            <textarea
              value={cardForm.description}
              onChange={(event) => setCardForm((current) => ({ ...current, description: event.target.value }))}
              rows={3}
              className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-100"
              placeholder="Task details"
            />
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="text-sm font-semibold text-slate-700">Priority</label>
              <select
                value={cardForm.priority}
                onChange={(event) => setCardForm((current) => ({ ...current, priority: event.target.value }))}
                className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-100"
              >
                {priorityOptions.map((priority) => <option key={priority} value={priority}>{priority}</option>)}
              </select>
            </div>
            <div>
              <label className="text-sm font-semibold text-slate-700">Due Date</label>
              <input
                type="date"
                value={cardForm.due_date}
                onChange={(event) => setCardForm((current) => ({ ...current, due_date: event.target.value }))}
                className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-100"
              />
            </div>
          </div>
          <div>
            <label className="text-sm font-semibold text-slate-700">Assignee</label>
            <select
              value={cardForm.assignee_id}
              onChange={(event) => setCardForm((current) => ({ ...current, assignee_id: event.target.value }))}
              className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-100"
            >
              <option value="">Unassigned</option>
              {users.map((user) => (
                <option key={user.id} value={user.id}>{user.full_name || user.email}</option>
              ))}
            </select>
          </div>
          <div className="flex justify-end gap-3 pt-2">
            <button type="button" onClick={() => setCardModalOpen(false)} className="rounded-md border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50">
              Cancel
            </button>
            <button type="submit" disabled={saving} className="inline-flex items-center gap-2 rounded-md bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700 disabled:opacity-60">
              <ButtonIcon type="save" />
              {saving ? 'Saving...' : 'Create Card'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default TaskBoardPage;

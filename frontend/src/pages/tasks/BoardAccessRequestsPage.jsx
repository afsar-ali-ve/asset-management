import React, { useEffect, useState } from 'react';
import ButtonIcon from '../../components/common/ButtonIcon';
import {
  approveBoardAccessRequest,
  getBoardAccessRequests,
  rejectBoardAccessRequest,
} from '../../services/api';

const BoardAccessRequestsPage = () => {
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [savingId, setSavingId] = useState(null);
  const [notice, setNotice] = useState('');
  const [error, setError] = useState('');

  const loadRequests = async () => {
    try {
      setLoading(true);
      setError('');
      const response = await getBoardAccessRequests();
      setRequests(response.data.requests || []);
    } catch (err) {
      setError(err.response?.data?.error || 'Unable to load board access requests');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadRequests();
  }, []);

  useEffect(() => {
    if (!notice) return undefined;
    const timer = window.setTimeout(() => setNotice(''), 3000);
    return () => window.clearTimeout(timer);
  }, [notice]);

  const handleApprove = async (request) => {
    try {
      setSavingId(request.id);
      setError('');
      await approveBoardAccessRequest(request.id);
      setNotice('Board access request approved');
      await loadRequests();
    } catch (err) {
      setError(err.response?.data?.error || 'Unable to approve request');
    } finally {
      setSavingId(null);
    }
  };

  const handleReject = async (request) => {
    try {
      setSavingId(request.id);
      setError('');
      await rejectBoardAccessRequest(request.id);
      setNotice('Board access request rejected');
      await loadRequests();
    } catch (err) {
      setError(err.response?.data?.error || 'Unable to reject request');
    } finally {
      setSavingId(null);
    }
  };

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-2xl font-semibold text-slate-950">Board Access Requests</h1>
        <p className="mt-1 text-sm text-slate-500">Review pending requests for private task boards.</p>
      </div>

      {notice && <div className="rounded-md border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-medium text-emerald-700">{notice}</div>}
      {error && <div className="rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-700">{error}</div>}

      <div className="overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm">
        <div className="overflow-x-auto">
          <table className="min-w-full border-collapse text-sm">
            <thead>
              <tr className="bg-slate-50 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                <th className="border-b border-r border-slate-200 px-4 py-3">Board Name</th>
                <th className="border-b border-r border-slate-200 px-4 py-3">Requested By</th>
                <th className="border-b border-r border-slate-200 px-4 py-3">Email</th>
                <th className="border-b border-r border-slate-200 px-4 py-3">Requested Date</th>
                <th className="border-b border-r border-slate-200 px-4 py-3">Status</th>
                <th className="border-b border-slate-200 px-4 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan="6" className="px-4 py-10 text-center text-slate-500">Loading requests...</td>
                </tr>
              ) : requests.length === 0 ? (
                <tr>
                  <td colSpan="6" className="px-4 py-10 text-center text-slate-500">No pending board access requests.</td>
                </tr>
              ) : (
                requests.map((request) => (
                  <tr key={request.id} className="transition hover:bg-slate-50">
                    <td className="border-b border-r border-slate-200 px-4 py-3 font-semibold text-slate-900">{request.board_name}</td>
                    <td className="border-b border-r border-slate-200 px-4 py-3 text-slate-700">{request.requested_by_name}</td>
                    <td className="border-b border-r border-slate-200 px-4 py-3 text-slate-600">{request.requested_by_email}</td>
                    <td className="border-b border-r border-slate-200 px-4 py-3 text-slate-600">
                      {request.requested_at ? new Date(request.requested_at).toLocaleString() : '-'}
                    </td>
                    <td className="border-b border-r border-slate-200 px-4 py-3">
                      <span className="rounded-full bg-amber-50 px-2.5 py-1 text-xs font-semibold text-amber-700">{request.status}</span>
                    </td>
                    <td className="border-b border-slate-200 px-4 py-3">
                      <div className="flex justify-end gap-2">
                        <button
                          type="button"
                          onClick={() => handleApprove(request)}
                          disabled={savingId === request.id}
                          className="inline-flex items-center gap-1.5 rounded-md bg-emerald-600 px-3 py-1.5 text-xs font-semibold text-white transition hover:bg-emerald-700 disabled:opacity-60"
                        >
                          <ButtonIcon type="apply" />
                          Approve
                        </button>
                        <button
                          type="button"
                          onClick={() => handleReject(request)}
                          disabled={savingId === request.id}
                          className="inline-flex items-center gap-1.5 rounded-md border border-red-100 bg-white px-3 py-1.5 text-xs font-semibold text-red-600 transition hover:bg-red-50 disabled:opacity-60"
                        >
                          <ButtonIcon type="close" />
                          Reject
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default BoardAccessRequestsPage;

import React from 'react';

const SettingsPage = ({ onNavigate, isAdminUser = false }) => {
  return (
    <div className="max-w-4xl">
      <div className="rounded-[28px] border border-slate-200 bg-white p-8 shadow-sm">
        <div className="mb-6">
          <h1 className="mt-3 text-3xl font-semibold text-slate-900">Customization</h1>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <button
            type="button"
            onClick={() => onNavigate('/helpdesk')}
            className="rounded-3xl border border-slate-200 bg-slate-50 px-5 py-6 text-left transition hover:border-slate-300 hover:bg-white"
          >
            <div className="text-sm font-semibold text-slate-900">Helpdesk</div>
            <p className="mt-2 text-sm text-slate-500">
              Open helpdesk configuration and support workflows.
            </p>
          </button>

          {isAdminUser && (
            <button
              type="button"
              onClick={() => onNavigate('/settings/assets')}
              className="rounded-3xl border border-slate-200 bg-slate-50 px-5 py-6 text-left transition hover:border-slate-300 hover:bg-white"
            >
              <div className="text-sm font-semibold text-slate-900">Asset Management</div>
              <p className="mt-2 text-sm text-slate-500">Manage assets masters.</p>
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default SettingsPage;

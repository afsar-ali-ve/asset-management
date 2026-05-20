import React from 'react';

const AuthLayout = ({ title, subtitle, children }) => (
  <div className="min-h-screen bg-[#f5f6f8] px-4 py-10 text-slate-900">
    <div className="mx-auto flex min-h-[calc(100vh-5rem)] max-w-6xl items-center justify-center">
      <div className="grid w-full overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-xl lg:grid-cols-[0.9fr_1fr]">
        <div className="hidden bg-[#1f2a44] p-10 text-white lg:flex lg:flex-col lg:justify-between">
          <div>
            <div className="text-lg font-semibold tracking-wide">Asset Management</div>
            <h1 className="mt-12 text-3xl font-semibold leading-tight">Manage assets, products, vendors, and software in one workspace.</h1>
            <p className="mt-4 text-sm leading-6 text-slate-300">
              Sign in to continue to the dashboard and keep your asset operations organized.
            </p>
          </div>
          <div className="rounded-2xl bg-white/10 p-4 text-sm text-slate-200">
            Secure access for your internal asset management workflows.
          </div>
        </div>

        <div className="p-6 sm:p-10">
          <div className="mx-auto max-w-md">
            <div className="mb-8">
              <h2 className="text-2xl font-semibold text-slate-900">{title}</h2>
              <p className="mt-2 text-sm text-slate-500">{subtitle}</p>
            </div>
            {children}
          </div>
        </div>
      </div>
    </div>
  </div>
);

export default AuthLayout;

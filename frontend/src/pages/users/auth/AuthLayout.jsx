import React from 'react';

const AuthLayout = ({ title, subtitle, children, icon }) => (
  <div className="min-h-screen bg-[#f5f6f8] px-4 py-8 text-slate-900 sm:px-6 lg:px-8">
    <div className="mx-auto flex min-h-[calc(100vh-4rem)] max-w-6xl items-center justify-center">
      <div className="grid w-full overflow-hidden rounded-lg border border-slate-200 bg-white shadow-xl lg:grid-cols-[0.9fr_1fr]">
        <div className="hidden bg-[#1f2a44] p-10 text-white lg:flex lg:flex-col lg:justify-between">
          <div>
            <div className="inline-flex h-12 w-12 items-center justify-center rounded-md bg-white/10 text-white ring-1 ring-white/15">
              <svg className="h-6 w-6" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                <path d="M6.5 8.5V6.75C6.5 4.26 8.51 2.25 11 2.25H13C15.49 2.25 17.5 4.26 17.5 6.75V8.5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/>
                <path d="M5.75 8.5H18.25C19.35 8.5 20.25 9.4 20.25 10.5V18.75C20.25 19.85 19.35 20.75 18.25 20.75H5.75C4.65 20.75 3.75 19.85 3.75 18.75V10.5C3.75 9.4 4.65 8.5 5.75 8.5Z" stroke="currentColor" strokeWidth="1.8"/>
                <path d="M12 13V16" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/>
              </svg>
            </div>
            <div className="mt-6 text-lg font-semibold tracking-wide">Asset Management</div>
            <h1 className="mt-10 text-3xl font-semibold leading-tight">Secure access for your asset operations workspace.</h1>
            <p className="mt-4 text-sm leading-6 text-slate-300">
              Sign in to manage assets, vendors, products, and profile settings from one controlled dashboard.
            </p>
          </div>
          <div className="grid grid-cols-3 gap-3 rounded-lg bg-white/10 p-4 text-sm text-slate-200 ring-1 ring-white/10">
            <div>
              <div className="text-lg font-semibold text-white">30m</div>
              <div className="mt-1 text-xs text-slate-300">Session limit</div>
            </div>
            <div>
              <div className="text-lg font-semibold text-white">JWT</div>
              <div className="mt-1 text-xs text-slate-300">Protected API</div>
            </div>
            <div>
              <div className="text-lg font-semibold text-white">TLS</div>
              <div className="mt-1 text-xs text-slate-300">Data layer</div>
            </div>
          </div>
        </div>

        <div className="p-6 sm:p-8 lg:p-10">
          <div className="mx-auto max-w-md">
            <div className="mb-8 text-center sm:text-left">
              <div className="mx-auto mb-5 flex h-12 w-12 items-center justify-center rounded-md bg-blue-50 text-blue-700 sm:mx-0">
                {icon}
              </div>
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

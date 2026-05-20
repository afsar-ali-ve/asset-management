import React, { useEffect, useState } from 'react';
import AssetsPage from './components/AssetsPage';
import SettingsPage from './components/SettingsPage';
const sidebarItems = [
    { label: 'Dashboard', path: '/' },
    { label: 'Assets', path: '/assets' },
];
const normalizePath = (path) => {
    const cleaned = path.replace(/\\/g, '/').replace(/\/$/, '');
    if (cleaned === '' || cleaned === '/')
        return '/';
    if (cleaned === '/dashboard')
        return '/';
    return cleaned;
};
function App() {
    const [route, setRoute] = useState(() => normalizePath(window.location.pathname));
    useEffect(() => {
        const onPopState = () => setRoute(normalizePath(window.location.pathname));
        window.addEventListener('popstate', onPopState);
        return () => window.removeEventListener('popstate', onPopState);
    }, []);
    const navigate = (path) => {
        const nextPath = normalizePath(path);
        if (route !== nextPath) {
            window.history.pushState({}, '', nextPath);
            setRoute(nextPath);
        }
    };
    const activePath = route === '/assets' ? '/assets' : '/';
    const renderContent = () => {
        if (route === '/settings') {
            return <SettingsPage onNavigate={navigate}/>;
        }
        if (route === '/assets') {
            return <AssetsPage />;
        }
        if (route === '/helpdesk') {
            return (<div className="rounded-[28px] border border-slate-200 bg-white p-8 shadow-sm">
          <div className="text-sm uppercase tracking-[0.24em] text-slate-500">Helpdesk</div>
          <h1 className="mt-3 text-3xl font-semibold text-slate-900">Helpdesk</h1>
          <p className="mt-4 max-w-2xl text-sm text-slate-500">
            Access helpdesk configuration and support settings from this area.
          </p>
        </div>);
        }
        return (<div className="rounded-[28px] border border-slate-200 bg-white p-8 shadow-sm">
        <div className="text-sm uppercase tracking-[0.24em] text-slate-500">Dashboard</div>
        <h1 className="mt-3 text-3xl font-semibold text-slate-900">Welcome to Asset Management</h1>
        <p className="mt-4 max-w-2xl text-sm text-slate-500">
          Use the sidebar to switch between Dashboard and Assets, and click the settings icon to manage customization options.
        </p>
      </div>);
    };
    return (<div className="min-h-screen bg-[#f5f6f8] text-slate-900">
      <div className="fixed inset-y-0 left-0 w-72 border-r border-slate-700/40 bg-[#1f2a44] text-slate-100 shadow-xl">
        <div className="flex h-full flex-col">
          <div className="px-6 py-6 border-b border-slate-700/50">
            <div className="text-lg font-semibold tracking-wide">Asset Management</div>
            <p className="mt-2 text-sm text-slate-400">Modern enterprise UI</p>
          </div>
          <nav className="flex-1 space-y-2 px-3 py-5">
            {sidebarItems.map((item) => (<button key={item.label} onClick={() => navigate(item.path)} className={`flex w-full items-center gap-3 rounded-3xl px-4 py-4 text-left text-sm font-medium transition ${activePath === item.path
                ? 'bg-white text-slate-900 shadow-sm'
                : 'text-slate-300 hover:bg-white/10 hover:text-white'}`}>
                <span className="inline-flex h-11 w-11 items-center justify-center rounded-2xl bg-slate-700 text-slate-200">
                  {item.label.charAt(0)}
                </span>
                <span>{item.label}</span>
              </button>))}
          </nav>
          <div className="border-t border-slate-700/50 px-6 py-5">
            <div className="rounded-2xl bg-slate-800 p-4 text-sm text-slate-300">
              <div className="font-semibold text-white">Admin User</div>
              <p className="mt-1 text-slate-400">admin@example.com</p>
            </div>
          </div>
        </div>
      </div>

      <div className="ml-72 min-h-screen">
        <header className="sticky top-0 z-30 border-b border-slate-200/80 bg-white/95 backdrop-blur-md px-6 py-4 shadow-sm">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex flex-1 items-center gap-3">
              <div className="relative w-full max-w-md">
                <span className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-slate-400">🔍</span>
                <input type="text" placeholder="Search assets, settings..." className="w-full rounded-2xl border border-slate-200 bg-slate-50 py-3 pl-11 pr-4 text-sm text-slate-900 shadow-sm focus:border-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-200"/>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <button className="rounded-full border border-slate-200 bg-white p-3 text-slate-600 shadow-sm hover:bg-slate-50">
                ☀️
              </button>
              <button onClick={() => navigate('/settings')} className="rounded-full border border-slate-200 bg-white p-3 text-slate-600 shadow-sm hover:bg-slate-50" aria-label="Open settings">
                ⚙️
              </button>
              <button className="rounded-full border border-slate-200 bg-white p-3 text-slate-600 shadow-sm hover:bg-slate-50">
                🔔
              </button>
              <div className="flex items-center gap-3 rounded-2xl border border-slate-200 bg-white px-3 py-2 shadow-sm">
                <div className="h-9 w-9 rounded-full bg-blue-600 text-sm font-semibold text-white flex items-center justify-center">K</div>
                <div>
                  <div className="text-sm font-medium text-slate-900">Admin</div>
                  <div className="text-xs text-slate-500">Admin</div>
                </div>
              </div>
            </div>
          </div>
        </header>

        <main className="px-6 py-6">{renderContent()}</main>
      </div>
    </div>);
}
export default App;

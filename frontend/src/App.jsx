import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Navigate, Route, Routes, useLocation, useNavigate, useParams } from 'react-router-dom';
import AllAssetsPage from './components/AssetsPage';
import AssetDetailsPage from './components/AssetDetailsPage';
import ProductTypeTable from './components/ProductTypeTable';
import ProductTable from './components/ProductTable';
import VendorTable from './components/VendorTable';
import SoftwareTypeTable from './components/SoftwareTypeTable';
import SoftwareCategoryTable from './components/SoftwareCategoryTable';
import ManufacturerTable from './components/ManufacturerTable';
import SoftwareLicenseTypeTable from './components/SoftwareLicenseTypeTable';
import AssetStateTable from './components/AssetStateTable';
import SettingsPage from './components/SettingsPage';
import ProfilePage from './components/ProfilePage';
import Login from './components/auth/Login';
import Signup from './components/auth/Signup';
import ForgotPassword from './components/auth/ForgotPassword';
import { clearStoredAuth, getStoredToken, getStoredUser } from './components/auth/authStorage';
const sidebarItems = [
    { label: 'Dashboard', path: '/' },
    { label: 'Assets', path: '/assets' },
];
const THEME_STORAGE_KEY = 'asset_management_theme';
const notifications = [
    {
        id: 1,
        title: 'Asset scan completed',
        message: 'The latest asset scan finished successfully.',
        time: 'Today, 10:02 AM',
        unread: true,
    },
    {
        id: 2,
        title: 'License review due',
        message: 'Software license renewal review is pending.',
        time: 'Yesterday, 4:30 PM',
        unread: false,
    },
];
const normalizePath = (path) => {
    const cleaned = path.replace(/\\/g, '/').replace(/\/$/, '');
    if (cleaned === '' || cleaned === '/')
        return '/';
    if (cleaned === '/dashboard')
        return '/';
    return cleaned;
};
const assetTabs = [
    { label: 'Product Type', slug: 'product-type' },
    { label: 'Product', slug: 'product' },
    { label: 'Vendor', slug: 'vendor' },
    { label: 'Software Type', slug: 'software-type' },
    { label: 'Software Category', slug: 'software-category' },
    { label: 'Software License Type', slug: 'software-license-type' },
    { label: 'Asset State', slug: 'asset-state' },
    { label: 'Manufacturer', slug: 'manufacturer' },
];
const AssetCustomizationPage = ({ initialTab }) => {
    const routerNavigate = useNavigate();
    const [activeTab, setActiveTab] = useState(() => {
        const index = assetTabs.findIndex((tab) => tab.slug === initialTab);
        return index >= 0 ? index : 0;
    });
    useEffect(() => {
        const index = assetTabs.findIndex((tab) => tab.slug === initialTab);
        if (index >= 0) {
            setActiveTab(index);
        }
    }, [initialTab]);
    useEffect(() => {
        const slug = assetTabs[activeTab].slug;
        routerNavigate(activeTab === 0 ? '/settings/assets' : `/settings/assets/${slug}`, { replace: true });
    }, [activeTab, routerNavigate]);
    const renderTabContent = () => {
        switch (activeTab) {
            case 0:
                return <ProductTypeTable />;
            case 1:
                return <ProductTable />;
            case 2:
                return <VendorTable />;
            case 3:
                return <SoftwareTypeTable />;
            case 4:
                return <SoftwareCategoryTable />;
            case 5:
                return <SoftwareLicenseTypeTable />;
            case 6:
                return <AssetStateTable />;
            case 7:
                return <ManufacturerTable />;
            default:
                return (<div className="bg-white rounded-lg shadow-sm p-6 text-gray-700">
            <h2 className="text-lg font-semibold mb-2">{assetTabs[activeTab].label}</h2>
            <p className="text-sm text-gray-500">This section is not implemented yet.</p>
          </div>);
        }
    };
    return (<div className="space-y-5">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <h1 className="text-2xl font-semibold text-slate-900">Customization - Asset Management - {assetTabs[activeTab].label}</h1>
        <div className="text-sm text-slate-500">Home &gt; Customization - Asset Management - {assetTabs[activeTab].label}</div>
      </div>

      <div className="rounded-lg border border-slate-200 bg-white shadow-sm">
        <div className="px-4 py-3 border-b border-slate-200/80">
          <div className="flex flex-wrap items-center gap-3">
            {assetTabs.map((tab, index) => (<button key={tab.slug} onClick={() => setActiveTab(index)} className={`text-sm transition px-3 ${activeTab === index
                ? 'border-b-2 border-blue-600 pb-3 font-semibold text-slate-900'
                : 'border-b-2 border-transparent pb-3 text-slate-500 hover:text-slate-700'}`}>
                {tab.label}
              </button>))}
          </div>
        </div>

        <div className="px-4 py-4">{renderTabContent()}</div>
      </div>
    </div>);
};
const AssetCustomizationRoute = () => {
    const { tab } = useParams();
    return <AssetCustomizationPage initialTab={tab || 'product-type'}/>;
};
function App() {
    const location = useLocation();
    const routerNavigate = useNavigate();
    const [sidebarOpen, setSidebarOpen] = useState(true);
    const [profileMenuOpen, setProfileMenuOpen] = useState(false);
    const [notificationOpen, setNotificationOpen] = useState(false);
    const [theme, setTheme] = useState(() => localStorage.getItem(THEME_STORAGE_KEY) || 'light');
    const [, setAuthVersion] = useState(0);
    const profileMenuRef = useRef(null);
    const notificationRef = useRef(null);
    const token = getStoredToken();
    const user = getStoredUser();
    const isAuthenticated = Boolean(token);
    const isAuthRoute = ['/login', '/signup', '/forgot-password'].includes(normalizePath(location.pathname));
    const handleAuthChange = useCallback(() => setAuthVersion((version) => version + 1), []);
    const handleLogout = () => {
        clearStoredAuth();
        handleAuthChange();
        setProfileMenuOpen(false);
        setNotificationOpen(false);
        routerNavigate('/login', { replace: true });
    };
    const toggleTheme = () => {
        setTheme((currentTheme) => (currentTheme === 'dark' ? 'light' : 'dark'));
    };
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (profileMenuRef.current && !profileMenuRef.current.contains(event.target)) {
                setProfileMenuOpen(false);
            }
            if (notificationRef.current && !notificationRef.current.contains(event.target)) {
                setNotificationOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);
    useEffect(() => {
        localStorage.setItem(THEME_STORAGE_KEY, theme);
        document.documentElement.classList.toggle('theme-dark', theme === 'dark');
        document.documentElement.classList.toggle('theme-light', theme === 'light');
    }, [theme]);
    const navigate = (path) => {
        const nextPath = normalizePath(path);
        if (normalizePath(location.pathname) !== nextPath) {
            routerNavigate(nextPath);
        }
    };
    const route = normalizePath(location.pathname);
    const activePath = route.startsWith('/assets') ? '/assets' : route;
    const displayName = user?.full_name || 'User';
    const displayEmail = user?.email || '';
    const firstName = displayName.split(' ').filter(Boolean)[0] || displayName;
    const userInitials = displayName
        .split(' ')
        .filter(Boolean)
        .slice(0, 2)
        .map((part) => part.charAt(0).toUpperCase())
        .join('');
    const unreadCount = notifications.filter((notification) => notification.unread).length;
    const isDarkMode = theme === 'dark';
    const DashboardPage = () => (<div className="rounded-[28px] border border-slate-200 bg-white p-8 shadow-sm">
        <div className="text-sm uppercase tracking-[0.24em] text-slate-500">Dashboard</div>
        <h1 className="mt-3 text-3xl font-semibold text-slate-900">Welcome to the dashboard</h1>
      </div>);
    const HelpdeskPage = () => (<div className="rounded-[28px] border border-slate-200 bg-white p-8 shadow-sm">
          <div className="text-sm uppercase tracking-[0.24em] text-slate-500">Helpdesk</div>
          <h1 className="mt-3 text-3xl font-semibold text-slate-900">Helpdesk</h1>
          <p className="mt-4 max-w-2xl text-sm text-slate-500">
            Access helpdesk configuration and support settings from this area.
          </p>
        </div>);
    if (isAuthRoute) {
        return (<Routes>
          <Route path="/login" element={<Login onAuthChange={handleAuthChange}/>} />
          <Route path="/signup" element={<Signup />} />
          <Route path="/forgot-password" element={<ForgotPassword />} />
        </Routes>);
    }
    if (!isAuthenticated) {
        return <Navigate to="/login" replace state={{ from: location.pathname }}/>;
    }
    return (<div className={`app-shell min-h-screen bg-[#f5f6f8] text-slate-900 ${isDarkMode ? 'theme-dark' : 'theme-light'}`}>
      <div className={`fixed inset-y-0 left-0 z-40 w-72 border-r border-slate-700/40 bg-[#1f2a44] text-slate-100 shadow-xl transition-transform duration-200 ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}`}>
        <div className="flex h-full flex-col">
          <div className="px-6 py-6 border-b border-slate-700/50">
            <div className="text-lg font-semibold tracking-wide">Asset Management</div>
          </div>
          <nav className="flex-1 space-y-2 px-3 py-5">
            {sidebarItems.map((item) => {
            const isDisabled = false;
            return (<button key={item.label} type="button" onClick={() => !isDisabled && navigate(item.path)} className={`flex w-full items-center gap-3 rounded-3xl px-4 py-4 text-left text-sm font-medium transition ${isDisabled
                    ? 'cursor-not-allowed text-slate-500 bg-slate-700/30'
                    : activePath === item.path
                        ? 'bg-white text-slate-900 shadow-sm'
                        : 'text-slate-300 hover:bg-white/10 hover:text-white'}`}>
                  <span className="inline-flex h-11 w-11 items-center justify-center rounded-2xl bg-slate-700 text-slate-200">
                    {item.label.charAt(0)}
                  </span>
                  <span>{item.label}</span>
                </button>);
        })}
          </nav>
          <div className="border-t border-slate-700/50 px-6 py-5">
            <div className="rounded-2xl bg-slate-800 p-4 text-sm text-slate-300">
              <div className="font-semibold text-white">{displayName}</div>
              {displayEmail && <p className="mt-1 text-slate-400">{displayEmail}</p>}
            </div>
          </div>
        </div>
      </div>

      <div className={`min-h-screen transition-[margin] duration-200 ${sidebarOpen ? 'ml-72' : 'ml-0'}`}>
        <header className="sticky top-0 z-30 border-b border-slate-200/80 bg-white/95 backdrop-blur-md px-6 py-4 shadow-sm">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex flex-1 items-center gap-3">
              <button type="button" onClick={() => setSidebarOpen((isOpen) => !isOpen)} className="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-md border border-slate-200 bg-white text-slate-700 shadow-sm hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-blue-500" aria-label={sidebarOpen ? 'Hide navigation menu' : 'Show navigation menu'} aria-expanded={sidebarOpen}>
                <svg className="h-5 w-5" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
                  <path d="M4 6H16M4 10H16M4 14H16" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/>
                </svg>
              </button>
              <div className="relative w-full max-w-md">
                <span className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-slate-400">🔍</span>
                <input type="text" placeholder="Search assets, settings..." className="w-full rounded-2xl border border-slate-200 bg-slate-50 py-3 pl-11 pr-4 text-sm text-slate-900 shadow-sm focus:border-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-200"/>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={toggleTheme}
                className="rounded-full border border-slate-200 bg-white p-3 text-slate-600 shadow-sm transition hover:border-slate-300 hover:bg-slate-50 hover:shadow-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                aria-label={isDarkMode ? 'Switch to light mode' : 'Switch to dark mode'}
                title={isDarkMode ? 'Switch to light mode' : 'Switch to dark mode'}
              >
                {isDarkMode ? (
                  <svg className="h-5 w-5 text-amber-400" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
                    <path d="M12 4V2M12 22V20M4.93 4.93L3.52 3.52M20.48 20.48L19.07 19.07M4 12H2M22 12H20M4.93 19.07L3.52 20.48M20.48 3.52L19.07 4.93" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/>
                    <path d="M12 17.25C14.8995 17.25 17.25 14.8995 17.25 12C17.25 9.10051 14.8995 6.75 12 6.75C9.10051 6.75 6.75 9.10051 6.75 12C6.75 14.8995 9.10051 17.25 12 17.25Z" stroke="currentColor" strokeWidth="1.8"/>
                  </svg>
                ) : (
                  <svg className="h-5 w-5 text-slate-700" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
                    <path d="M20.25 14.75C18.93 16.08 17.09 16.9 15.06 16.9C10.89 16.9 7.5 13.51 7.5 9.34C7.5 7.31 8.32 5.47 9.65 4.15C6.2 5.02 3.65 8.14 3.65 11.86C3.65 16.25 7.21 19.81 11.6 19.81C15.32 19.81 18.44 17.26 19.31 13.81C19.02 14.15 20.25 14.75 20.25 14.75Z" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                )}
              </button>
              <button onClick={() => navigate('/settings')} className="rounded-full border border-slate-200 bg-white p-3 text-slate-600 shadow-sm transition hover:border-slate-300 hover:bg-slate-50 hover:shadow-md focus:outline-none focus:ring-2 focus:ring-blue-500" aria-label="Open settings">
                <svg className="h-5 w-5" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
                  <path d="M10 12.75C11.5188 12.75 12.75 11.5188 12.75 10C12.75 8.48122 11.5188 7.25 10 7.25C8.48122 7.25 7.25 8.48122 7.25 10C7.25 11.5188 8.48122 12.75 10 12.75Z" stroke="currentColor" strokeWidth="1.6"/>
                  <path d="M16.2 11.2C16.25 10.81 16.25 9.19 16.2 8.8L18 7.4L16.3 4.45L14.15 5.3C13.84 5.06 13.5 4.86 13.13 4.7L12.8 2.5H7.2L6.87 4.7C6.5 4.86 6.16 5.06 5.85 5.3L3.7 4.45L2 7.4L3.8 8.8C3.75 9.19 3.75 10.81 3.8 11.2L2 12.6L3.7 15.55L5.85 14.7C6.16 14.94 6.5 15.14 6.87 15.3L7.2 17.5H12.8L13.13 15.3C13.5 15.14 13.84 14.94 14.15 14.7L16.3 15.55L18 12.6L16.2 11.2Z" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </button>
              <div className="relative" ref={notificationRef}>
                <button
                  type="button"
                  onClick={() => setNotificationOpen((isOpen) => !isOpen)}
                  className="relative rounded-full border border-slate-200 bg-white p-3 text-slate-600 shadow-sm transition hover:border-slate-300 hover:bg-slate-50 hover:shadow-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  aria-label="Open notifications"
                  aria-haspopup="menu"
                  aria-expanded={notificationOpen}
                >
                  <svg className="h-5 w-5" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
                    <path d="M14.5 7.8C14.5 5.31 12.49 3.3 10 3.3C7.51 3.3 5.5 5.31 5.5 7.8V10.2C5.5 11.02 5.21 11.81 4.68 12.43L3.9 13.35C3.43 13.9 3.82 14.75 4.54 14.75H15.46C16.18 14.75 16.57 13.9 16.1 13.35L15.32 12.43C14.79 11.81 14.5 11.02 14.5 10.2V7.8Z" stroke="currentColor" strokeWidth="1.6" strokeLinejoin="round"/>
                    <path d="M8.25 16.25C8.61 17.13 9.25 17.7 10 17.7C10.75 17.7 11.39 17.13 11.75 16.25" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round"/>
                  </svg>
                  {unreadCount > 0 && (
                    <span className="absolute right-2 top-2 h-2.5 w-2.5 rounded-full border-2 border-white bg-orange-500"></span>
                  )}
                </button>
                <div
                  className={`absolute right-0 mt-3 w-[min(22rem,calc(100vw-2rem))] origin-top-right rounded-lg border border-slate-200 bg-white p-2 shadow-xl transition-all duration-200 ease-out ${
                    notificationOpen
                      ? 'visible translate-y-0 scale-100 opacity-100'
                      : 'invisible -translate-y-2 scale-95 opacity-0 pointer-events-none'
                  }`}
                  role="menu"
                >
                  <div className="flex items-center justify-between border-b border-slate-200 px-3 py-3">
                    <div>
                      <div className="text-sm font-semibold text-slate-900">Notifications</div>
                      <div className="mt-1 text-xs text-slate-500">{unreadCount} unread update{unreadCount === 1 ? '' : 's'}</div>
                    </div>
                    <span className="rounded-full bg-blue-50 px-2 py-1 text-xs font-semibold text-blue-700">
                      {notifications.length}
                    </span>
                  </div>
                  <div className="max-h-80 overflow-y-auto py-2">
                    {notifications.length === 0 ? (
                      <div className="px-4 py-8 text-center">
                        <div className="mx-auto flex h-10 w-10 items-center justify-center rounded-full bg-slate-100 text-slate-500">
                          <svg className="h-5 w-5" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
                            <path d="M14.5 7.8C14.5 5.31 12.49 3.3 10 3.3C7.51 3.3 5.5 5.31 5.5 7.8V10.2C5.5 11.02 5.21 11.81 4.68 12.43L3.9 13.35C3.43 13.9 3.82 14.75 4.54 14.75H15.46C16.18 14.75 16.57 13.9 16.1 13.35L15.32 12.43C14.79 11.81 14.5 11.02 14.5 10.2V7.8Z" stroke="currentColor" strokeWidth="1.6"/>
                          </svg>
                        </div>
                        <p className="mt-3 text-sm font-medium text-slate-700">No notifications yet</p>
                        <p className="mt-1 text-xs text-slate-500">New activity will appear here.</p>
                      </div>
                    ) : (
                      notifications.map((notification) => (
                        <div key={notification.id} className="flex gap-3 rounded-md px-3 py-3 transition hover:bg-slate-50" role="menuitem">
                          <span className={`mt-1 h-2.5 w-2.5 shrink-0 rounded-full ${notification.unread ? 'bg-blue-600' : 'bg-slate-300'}`}></span>
                          <div className="min-w-0 flex-1">
                            <div className="flex items-start justify-between gap-3">
                              <p className="text-sm font-semibold text-slate-900">{notification.title}</p>
                              <span className="shrink-0 text-[11px] text-slate-500">{notification.time}</span>
                            </div>
                            <p className="mt-1 text-sm text-slate-500">{notification.message}</p>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              </div>
              <div className="relative" ref={profileMenuRef}>
                <button
                  type="button"
                  onClick={() => setProfileMenuOpen((isOpen) => !isOpen)}
                  className="flex items-center gap-3 rounded-2xl border border-slate-200 bg-white px-3 py-2 shadow-sm transition hover:border-slate-300 hover:bg-slate-50 hover:shadow-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  aria-haspopup="menu"
                  aria-expanded={profileMenuOpen}
                >
                  {user?.profile_image ? (
                    <img src={user.profile_image} alt="" className="h-9 w-9 rounded-full object-cover" />
                  ) : (
                    <div className="flex h-9 w-9 items-center justify-center rounded-full bg-slate-700 text-sm font-semibold text-white">
                      {userInitials}
                    </div>
                  )}
                  <div className="hidden text-left sm:block">
                    <div className="text-sm font-medium text-slate-900">{firstName}</div>
                  </div>
                  <span className={`flex h-7 w-7 items-center justify-center rounded-full bg-slate-100 text-slate-500 transition duration-200 ${profileMenuOpen ? 'rotate-180 bg-blue-50 text-blue-600' : ''}`} aria-hidden="true">
                    <svg className="h-4 w-4" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <path d="M5 7.5L10 12.5L15 7.5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                  </span>
                </button>

                <div
                  className={`absolute right-0 mt-3 w-64 origin-top-right rounded-lg border border-slate-200 bg-white p-2 shadow-xl transition-all duration-200 ease-out ${
                    profileMenuOpen
                      ? 'visible translate-y-0 scale-100 opacity-100'
                      : 'invisible -translate-y-2 scale-95 opacity-0 pointer-events-none'
                  }`}
                  role="menu"
                >
                    <div className="border-b border-slate-200 px-3 py-3">
                      <div className="text-sm font-semibold text-slate-900">{displayName}</div>
                      {displayEmail && <div className="mt-1 text-xs text-slate-500">{displayEmail}</div>}
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        setProfileMenuOpen(false);
                        navigate('/profile');
                      }}
                      className="mt-2 flex w-full items-center gap-3 rounded-md px-3 py-3 text-left text-sm font-medium text-slate-700 transition hover:bg-blue-50 hover:text-blue-700"
                      role="menuitem"
                    >
                      <span className="flex h-8 w-8 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-500">
                        <svg className="h-4 w-4" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
                          <path d="M10 10C12.2091 10 14 8.20914 14 6C14 3.79086 12.2091 2 10 2C7.79086 2 6 3.79086 6 6C6 8.20914 7.79086 10 10 10Z" stroke="currentColor" strokeWidth="1.6"/>
                          <path d="M3.5 18C4.22064 14.9712 6.67494 13 10 13C13.3251 13 15.7794 14.9712 16.5 18" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round"/>
                        </svg>
                      </span>
                      Profile
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setProfileMenuOpen(false);
                        navigate('/settings');
                      }}
                      className="mt-1 flex w-full items-center gap-3 rounded-md px-3 py-3 text-left text-sm font-medium text-slate-700 transition hover:bg-blue-50 hover:text-blue-700"
                      role="menuitem"
                    >
                      <span className="flex h-8 w-8 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-500">
                        <svg className="h-4 w-4" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
                          <path d="M10 12.75C11.5188 12.75 12.75 11.5188 12.75 10C12.75 8.48122 11.5188 7.25 10 7.25C8.48122 7.25 7.25 8.48122 7.25 10C7.25 11.5188 8.48122 12.75 10 12.75Z" stroke="currentColor" strokeWidth="1.6"/>
                          <path d="M16.2 11.2C16.25 10.81 16.25 9.19 16.2 8.8L18 7.4L16.3 4.45L14.15 5.3C13.84 5.06 13.5 4.86 13.13 4.7L12.8 2.5H7.2L6.87 4.7C6.5 4.86 6.16 5.06 5.85 5.3L3.7 4.45L2 7.4L3.8 8.8C3.75 9.19 3.75 10.81 3.8 11.2L2 12.6L3.7 15.55L5.85 14.7C6.16 14.94 6.5 15.14 6.87 15.3L7.2 17.5H12.8L13.13 15.3C13.5 15.14 13.84 14.94 14.15 14.7L16.3 15.55L18 12.6L16.2 11.2Z" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round"/>
                        </svg>
                      </span>
                      Settings
                    </button>
                    <button
                      type="button"
                      onClick={handleLogout}
                      className="mt-1 flex w-full items-center gap-3 rounded-md px-3 py-3 text-left text-sm font-medium text-red-600 transition hover:bg-red-50"
                      role="menuitem"
                    >
                      <span className="flex h-8 w-8 items-center justify-center rounded-full border border-red-100 bg-white text-red-500">
                        <svg className="h-4 w-4" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
                          <path d="M8 3.5H5.5C4.67157 3.5 4 4.17157 4 5V15C4 15.8284 4.67157 16.5 5.5 16.5H8" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round"/>
                          <path d="M12.5 6.5L16 10L12.5 13.5" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"/>
                          <path d="M16 10H8" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round"/>
                        </svg>
                      </span>
                      Logout
                    </button>
                  </div>
              </div>
            </div>
          </div>
        </header>

        <main className="px-6 py-6">
          <Routes>
            <Route path="/" element={<DashboardPage />} />
            <Route path="/dashboard" element={<Navigate to="/" replace />} />
            <Route path="/settings" element={<SettingsPage onNavigate={navigate}/>} />
            <Route path="/settings/assets" element={<AssetCustomizationRoute />} />
            <Route path="/settings/assets/:tab" element={<AssetCustomizationRoute />} />
            <Route path="/assets" element={<AllAssetsPage />} />
            <Route path="/assets/:id" element={<AssetDetailsPage />} />
            <Route path="/profile" element={<ProfilePage onAuthChange={handleAuthChange}/>} />
            <Route path="/helpdesk" element={<HelpdeskPage />} />
            <Route path="*" element={<DashboardPage />} />
          </Routes>
        </main>
      </div>
    </div>);
}
export default App;

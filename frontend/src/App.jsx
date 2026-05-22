import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Navigate, Route, Routes, useLocation, useNavigate, useParams } from 'react-router-dom';
import AllAssetsPage from './pages/assets/asset-list/AssetsPage';
import AssetDetailsPage from './pages/assets/asset-details/AssetDetailsPage';
import ProductTypeTable from './pages/master/product-type/ProductTypeTable';
import ProductTable from './pages/master/product/ProductTable';
import VendorTable from './pages/master/vendor/VendorTable';
import SoftwareTypeTable from './pages/master/software-type/SoftwareTypeTable';
import SoftwareCategoryTable from './pages/master/software-category/SoftwareCategoryTable';
import ManufacturerTable from './pages/master/manufacturer/ManufacturerTable';
import SoftwareLicenseTypeTable from './pages/master/software-license-type/SoftwareLicenseTypeTable';
import AssetStateTable from './pages/master/asset-state/AssetStateTable';
import SettingsPage from './components/SettingsPage';
import ProfilePage from './pages/users/profile/ProfilePage';
import UserManagementPage from './pages/users/user-management/UserManagementPage';
import Dashboard from './components/dashboard/Dashboard';
import Login from './pages/users/auth/Login';
import Signup from './pages/users/auth/Signup';
import ForgotPassword from './pages/users/auth/ForgotPassword';
import ProtectedRoute from './pages/users/auth/ProtectedRoute';
import {
    getMillisecondsUntilExpiry,
    getStoredUser,
    getToken,
    isAuthenticated,
    isTokenExpired,
    logout,
} from './pages/users/auth/authStorage';
const NavIcon = ({ type }) => {
    const commonProps = {
        className: 'h-5 w-5',
        viewBox: '0 0 24 24',
        fill: 'none',
        xmlns: 'http://www.w3.org/2000/svg',
        'aria-hidden': 'true',
    };
    const icons = {
        dashboard: (<svg {...commonProps}>
            <path d="M4.75 11.25V5.75C4.75 5.2 5.2 4.75 5.75 4.75H10.25C10.8 4.75 11.25 5.2 11.25 5.75V11.25H4.75Z" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round"/>
            <path d="M12.75 19.25V13.75H19.25V18.25C19.25 18.8 18.8 19.25 18.25 19.25H12.75Z" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round"/>
            <path d="M4.75 18.25V12.75H11.25V19.25H5.75C5.2 19.25 4.75 18.8 4.75 18.25Z" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round"/>
            <path d="M12.75 11.25V4.75H18.25C18.8 4.75 19.25 5.2 19.25 5.75V11.25H12.75Z" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round"/>
        </svg>),
        assets: (<svg {...commonProps}>
            <path d="M4.75 8.25L12 4.25L19.25 8.25L12 12.25L4.75 8.25Z" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round"/>
            <path d="M4.75 12L12 16L19.25 12" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
            <path d="M4.75 15.75L12 19.75L19.25 15.75" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>),
        users: (<svg {...commonProps}>
            <path d="M9.5 11.5C11.43 11.5 13 9.93 13 8C13 6.07 11.43 4.5 9.5 4.5C7.57 4.5 6 6.07 6 8C6 9.93 7.57 11.5 9.5 11.5Z" stroke="currentColor" strokeWidth="1.8"/>
            <path d="M4.25 19C4.92 16.24 6.88 14.5 9.5 14.5C12.12 14.5 14.08 16.24 14.75 19" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/>
            <path d="M16 11.25C17.52 11.25 18.75 10.02 18.75 8.5C18.75 6.98 17.52 5.75 16 5.75" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/>
            <path d="M15.75 14.75C17.94 14.94 19.56 16.46 20.25 19" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/>
        </svg>),
    };
    return icons[type] || icons.dashboard;
};
const sidebarItems = [
    { label: 'Dashboard', path: '/dashboard', icon: 'dashboard' },
    { label: 'Assets', path: '/assets', icon: 'assets' },
];
const THEME_STORAGE_KEY = 'asset_management_theme';
const SIDEBAR_STORAGE_KEY = 'asset_management_sidebar_open';
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
    const [sidebarOpen, setSidebarOpen] = useState(() => localStorage.getItem(SIDEBAR_STORAGE_KEY) !== 'false');
    const [profileMenuOpen, setProfileMenuOpen] = useState(false);
    const [notificationOpen, setNotificationOpen] = useState(false);
    const [theme, setTheme] = useState(() => localStorage.getItem(THEME_STORAGE_KEY) || 'light');
    const [, setAuthVersion] = useState(0);
    const profileMenuRef = useRef(null);
    const notificationRef = useRef(null);
    const user = getStoredUser();
    const authenticated = isAuthenticated();
    const isAuthRoute = ['/login', '/signup', '/forgot-password'].includes(normalizePath(location.pathname));
    const handleAuthChange = useCallback(() => setAuthVersion((version) => version + 1), []);
    const handleLogout = () => {
        logout();
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
    useEffect(() => {
        localStorage.setItem(SIDEBAR_STORAGE_KEY, String(sidebarOpen));
    }, [sidebarOpen]);
    useEffect(() => {
        if (isAuthRoute || !authenticated) {
            return undefined;
        }

        if (isTokenExpired()) {
            logout({ sessionExpired: true });
            handleAuthChange();
            routerNavigate('/login', { replace: true });
            return undefined;
        }

        const timeoutId = window.setTimeout(() => {
            logout({ sessionExpired: true });
            handleAuthChange();
            routerNavigate('/login', { replace: true });
        }, getMillisecondsUntilExpiry());

        return () => window.clearTimeout(timeoutId);
    }, [authenticated, handleAuthChange, isAuthRoute, location.pathname, routerNavigate]);
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
    const isAdminUser = displayEmail === 'admin@virtualemployee.com';
    const visibleSidebarItems = isAdminUser
        ? [...sidebarItems, { label: 'User Management', path: '/user-management', icon: 'users' }]
        : sidebarItems;
    const firstName = displayName.split(' ').filter(Boolean)[0] || displayName;
    const userInitials = displayName
        .split(' ')
        .filter(Boolean)
        .slice(0, 2)
        .map((part) => part.charAt(0).toUpperCase())
        .join('');
    const unreadCount = notifications.filter((notification) => notification.unread).length;
    const isDarkMode = theme === 'dark';
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
    if (!authenticated) {
        if (isTokenExpired()) {
            logout({ sessionExpired: Boolean(getToken()) });
        }
        return <Navigate to="/login" replace state={{ from: location.pathname }}/>;
    }
    return (<ProtectedRoute>
    <div className={`app-shell min-h-screen bg-[#f5f6f8] text-slate-900 ${isDarkMode ? 'theme-dark' : 'theme-light'}`}>
      <div className={`fixed inset-y-0 left-0 z-40 border-r border-slate-800/70 bg-[#162033] text-slate-100 shadow-2xl transition-all duration-300 ease-out ${sidebarOpen ? 'w-64 translate-x-0' : 'w-20 translate-x-0'}`}>
        <div className="flex h-full min-h-0 flex-col">
          <div className="flex h-16 items-center gap-3 border-b border-white/10 px-4">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-blue-500 text-sm font-bold text-white shadow-lg shadow-blue-950/30">AM</div>
            <div className={`min-w-0 transition-all duration-200 ${sidebarOpen ? 'opacity-100' : 'w-0 overflow-hidden opacity-0'}`}>
              <div className="truncate text-sm font-semibold text-white">Asset Management</div>
              <div className="mt-0.5 truncate text-[11px] font-medium text-slate-400">Operations Console</div>
            </div>
          </div>
          <nav className="sidebar-scroll flex-1 space-y-1 overflow-y-auto px-3 py-4" aria-label="Primary navigation">
            {visibleSidebarItems.map((item) => {
            const isDisabled = false;
            const isActive = activePath === item.path;
            return (<button key={item.label} type="button" onClick={() => !isDisabled && navigate(item.path)} title={!sidebarOpen ? item.label : undefined} className={`group relative flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-left text-sm font-semibold transition-all duration-200 ${isDisabled
                    ? 'cursor-not-allowed text-slate-500 bg-slate-700/30'
                    : isActive
                        ? 'bg-white text-slate-950 shadow-sm'
                        : 'text-slate-300 hover:bg-white/10 hover:text-white'}`}>
                  {isActive && <span className="absolute left-0 top-1/2 h-6 w-1 -translate-y-1/2 rounded-r-full bg-blue-500"></span>}
                  <span className={`inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-md transition ${isActive ? 'bg-blue-50 text-blue-700' : 'bg-white/5 text-slate-300 group-hover:bg-white/10 group-hover:text-white'}`}>
                    <NavIcon type={item.icon} />
                  </span>
                  <span className={`min-w-0 truncate transition-all duration-200 ${sidebarOpen ? 'opacity-100' : 'w-0 overflow-hidden opacity-0'}`}>{item.label}</span>
                </button>);
        })}
          </nav>
          <div className="border-t border-white/10 p-3">
            <div className={`flex items-center gap-3 rounded-lg border border-white/10 bg-white/[0.04] p-3 text-sm text-slate-300 ${sidebarOpen ? '' : 'justify-center'}`}>
              {user?.profile_image ? (
                <img src={user.profile_image} alt="" className="h-9 w-9 shrink-0 rounded-md object-cover" />
              ) : (
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md bg-slate-700 text-xs font-semibold text-white">
                  {userInitials}
                </div>
              )}
              <div className={`min-w-0 transition-all duration-200 ${sidebarOpen ? 'opacity-100' : 'w-0 overflow-hidden opacity-0'}`}>
                <div className="truncate text-sm font-semibold text-white">{displayName}</div>
                {displayEmail && <p className="mt-0.5 truncate text-xs text-slate-400">{displayEmail}</p>}
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className={`min-h-screen transition-[margin] duration-300 ease-out ${sidebarOpen ? 'ml-64' : 'ml-20'}`}>
        <header className="sticky top-0 z-30 border-b border-slate-200/80 bg-white/95 backdrop-blur-md px-6 py-4 shadow-sm">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex flex-1 items-center gap-3">
              <button type="button" onClick={() => setSidebarOpen((isOpen) => !isOpen)} className="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-md border border-slate-200 bg-white text-slate-700 shadow-sm hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-blue-500" aria-label={sidebarOpen ? 'Hide navigation menu' : 'Show navigation menu'} aria-expanded={sidebarOpen}>
                <svg className="h-5 w-5" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
                  <path d="M4 6H16M4 10H16M4 14H16" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/>
                </svg>
              </button>
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
            <Route path="/" element={<Navigate to="/dashboard" replace />} />
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/settings" element={<SettingsPage onNavigate={navigate}/>} />
            <Route path="/settings/assets" element={<AssetCustomizationRoute />} />
            <Route path="/settings/assets/:tab" element={<AssetCustomizationRoute />} />
            <Route path="/assets" element={<AllAssetsPage />} />
            <Route path="/assets/:id" element={<AssetDetailsPage />} />
            <Route path="/profile" element={<ProfilePage onAuthChange={handleAuthChange}/>} />
            <Route path="/user-management" element={isAdminUser ? <UserManagementPage currentUser={user} /> : <Navigate to="/dashboard" replace />} />
            <Route path="/helpdesk" element={<HelpdeskPage />} />
            <Route path="*" element={<Navigate to="/dashboard" replace />} />
          </Routes>
        </main>
      </div>
    </div>
    </ProtectedRoute>);
}
export default App;

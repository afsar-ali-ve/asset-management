import React, { useState } from 'react';
import { Link, Navigate, useLocation, useNavigate } from 'react-router-dom';
import { login } from '../../../services/api';
import AuthLayout from './AuthLayout';
import { getSessionMessage, isAuthenticated, setStoredAuth } from './authStorage';

const LoginIcon = () => (
  <svg className="h-6 w-6" viewBox="0 0 24 24" fill="none" aria-hidden="true">
    <path d="M9.75 10.25V7.75C9.75 5.68 11.43 4 13.5 4C15.57 4 17.25 5.68 17.25 7.75V10.25" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/>
    <path d="M7 10.25H17C18.1 10.25 19 11.15 19 12.25V18C19 19.1 18.1 20 17 20H7C5.9 20 5 19.1 5 18V12.25C5 11.15 5.9 10.25 7 10.25Z" stroke="currentColor" strokeWidth="1.8"/>
    <path d="M12 14.25V16.25" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/>
  </svg>
);

const EyeIcon = ({ hidden }) => (
  <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" aria-hidden="true">
    {hidden ? (
      <>
        <path d="M3.75 3.75L20.25 20.25" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/>
        <path d="M9.88 9.88C9.34 10.42 9.12 11.22 9.32 11.96C9.52 12.7 10.1 13.28 10.84 13.48C11.58 13.68 12.38 13.46 12.92 12.92" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/>
        <path d="M6.7 6.96C4.72 8.22 3.35 10.04 2.75 12C4.12 16.48 7.58 19 12 19C13.65 19 15.17 18.65 16.5 17.98" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/>
        <path d="M19.18 15.74C20.12 14.76 20.83 13.51 21.25 12C19.88 7.52 16.42 5 12 5C11.3 5 10.62 5.06 9.98 5.19" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/>
      </>
    ) : (
      <>
        <path d="M2.75 12C4.12 7.52 7.58 5 12 5C16.42 5 19.88 7.52 21.25 12C19.88 16.48 16.42 19 12 19C7.58 19 4.12 16.48 2.75 12Z" stroke="currentColor" strokeWidth="1.8"/>
        <path d="M12 14.75C13.52 14.75 14.75 13.52 14.75 12C14.75 10.48 13.52 9.25 12 9.25C10.48 9.25 9.25 10.48 9.25 12C9.25 13.52 10.48 14.75 12 14.75Z" stroke="currentColor" strokeWidth="1.8"/>
      </>
    )}
  </svg>
);

const DEFAULT_CREDENTIALS = {
  email: 'admin@virtualemployee.com',
  password: 'pass@123',
};

const requiredMark = <span className="ml-1 text-red-500" aria-hidden="true">*</span>;
const fieldClass = (hasError, extraClasses = '') =>
  `block w-full rounded-md border bg-white py-3 text-sm text-slate-900 shadow-sm focus:outline-none focus:ring-2 ${hasError ? 'border-red-300 focus:border-red-500 focus:ring-red-500/20' : 'border-slate-300 focus:border-blue-500 focus:ring-blue-500/20'} ${extraClasses}`;

const Login = ({ onAuthChange }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const [formData, setFormData] = useState({ email: '', password: '' });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [fieldErrors, setFieldErrors] = useState({});
  const [showPassword, setShowPassword] = useState(false);
  const [sessionMessage] = useState(() => getSessionMessage());
  const successMessage = location.state?.message || sessionMessage;

  if (isAuthenticated()) {
    return <Navigate to="/dashboard" replace />;
  }

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError('');
    const nextFieldErrors = {};
    if (!formData.email.trim()) {
      nextFieldErrors.email = 'Email is required';
    }
    if (!formData.password) {
      nextFieldErrors.password = 'Password is required';
    }
    if (Object.keys(nextFieldErrors).length > 0) {
      setFieldErrors(nextFieldErrors);
      setError('Please complete the required fields.');
      return;
    }
    setFieldErrors({});
    setLoading(true);
    try {
      const response = await login(formData);
      setStoredAuth(response.data);
      onAuthChange?.();
      navigate('/dashboard', { replace: true });
    } catch (submitError) {
      setError(submitError.response?.data?.error || 'Unable to login');
    } finally {
      setLoading(false);
    }
  };

  const handleDefaultCredentials = () => {
    setFormData(DEFAULT_CREDENTIALS);
    setError('');
    setFieldErrors({});
  };

  return (
    <AuthLayout title="Welcome back" subtitle="Enter your credentials to access the dashboard." icon={<LoginIcon />}>
      <form onSubmit={handleSubmit} className="space-y-5">
        {error && <div className="rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-700">{error}</div>}
        {successMessage && <div className="rounded-md border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-medium text-emerald-700">{successMessage}</div>}
        <div>
          <label htmlFor="email" className="block text-sm font-medium text-slate-700">Email{requiredMark}</label>
          <div className="relative mt-2">
            <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">
              <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="M4.75 6.75H19.25V17.25H4.75V6.75Z" stroke="currentColor" strokeWidth="1.8"/><path d="M5.25 7.25L12 12.5L18.75 7.25" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/></svg>
            </span>
            <input id="email" type="email" autoComplete="email" aria-invalid={Boolean(fieldErrors.email)} aria-describedby={fieldErrors.email ? 'email-error' : undefined} value={formData.email} onChange={(event) => { setFormData((current) => ({ ...current, email: event.target.value })); setFieldErrors((current) => ({ ...current, email: '' })); }} className={fieldClass(fieldErrors.email, 'pl-11 pr-3')} />
          </div>
          {fieldErrors.email && <p id="email-error" className="mt-2 text-sm font-medium text-red-600">{fieldErrors.email}</p>}
        </div>
        <div>
          <label htmlFor="password" className="block text-sm font-medium text-slate-700">Password{requiredMark}</label>
          <div className="relative mt-2">
            <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">
              <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="M7.75 10V8.25C7.75 5.9 9.65 4 12 4C14.35 4 16.25 5.9 16.25 8.25V10" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/><path d="M6.75 10H17.25C18.35 10 19.25 10.9 19.25 12V18C19.25 19.1 18.35 20 17.25 20H6.75C5.65 20 4.75 19.1 4.75 18V12C4.75 10.9 5.65 10 6.75 10Z" stroke="currentColor" strokeWidth="1.8"/></svg>
            </span>
            <input id="password" type={showPassword ? 'text' : 'password'} autoComplete="current-password" aria-invalid={Boolean(fieldErrors.password)} aria-describedby={fieldErrors.password ? 'password-error' : undefined} value={formData.password} onChange={(event) => { setFormData((current) => ({ ...current, password: event.target.value })); setFieldErrors((current) => ({ ...current, password: '' })); }} className={fieldClass(fieldErrors.password, 'pl-11 pr-12')} />
            <button type="button" onClick={() => setShowPassword((value) => !value)} className="absolute right-3 top-1/2 -translate-y-1/2 rounded-md p-1 text-slate-500 hover:bg-slate-100 hover:text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500" aria-label={showPassword ? 'Hide password' : 'Show password'}>
              <EyeIcon hidden={showPassword} />
            </button>
          </div>
          {fieldErrors.password && <p id="password-error" className="mt-2 text-sm font-medium text-red-600">{fieldErrors.password}</p>}
        </div>
        <div className="flex items-center justify-end">
          <button type="button" onClick={handleDefaultCredentials} className="inline-flex items-center gap-1.5 text-sm font-semibold text-blue-600 underline-offset-4 transition hover:text-blue-700 hover:underline focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2">
            <svg className="h-4 w-4" viewBox="0 0 20 20" fill="none" aria-hidden="true">
              <path d="M5.75 9.25H14.25M5.75 12.25H11.25" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round"/>
              <path d="M4.75 3.75H15.25C16.08 3.75 16.75 4.42 16.75 5.25V14.75C16.75 15.58 16.08 16.25 15.25 16.25H4.75C3.92 16.25 3.25 15.58 3.25 14.75V5.25C3.25 4.42 3.92 3.75 4.75 3.75Z" stroke="currentColor" strokeWidth="1.6"/>
            </svg>
            Use Admin Credentials
          </button>
        </div>
        <button type="submit" disabled={loading} className="inline-flex min-h-12 w-full items-center justify-center rounded-md bg-blue-600 px-4 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:cursor-not-allowed disabled:opacity-70">
          {loading && <span className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-white/40 border-t-white"></span>}
          {loading ? 'Signing in...' : 'Sign in'}
        </button>
        <div className="flex flex-col gap-2 text-sm text-slate-600 sm:flex-row sm:items-center sm:justify-between">
          <Link to="/signup" className="font-medium text-blue-600 hover:text-blue-700">Create an account</Link>
          <Link to="/forgot-password" className="font-medium text-blue-600 hover:text-blue-700">Forgot password?</Link>
        </div>
      </form>
    </AuthLayout>
  );
};

export default Login;

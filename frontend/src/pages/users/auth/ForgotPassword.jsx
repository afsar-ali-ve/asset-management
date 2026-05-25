import React, { useState } from 'react';
import { Link, Navigate } from 'react-router-dom';
import { forgotPassword } from '../../../services/api';
import AuthLayout from './AuthLayout';
import { isAuthenticated } from './authStorage';

const ResetIcon = () => (
  <svg className="h-6 w-6" viewBox="0 0 24 24" fill="none" aria-hidden="true">
    <path d="M7.75 10V8.25C7.75 5.9 9.65 4 12 4C14.35 4 16.25 5.9 16.25 8.25V10" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/>
    <path d="M6.75 10H17.25C18.35 10 19.25 10.9 19.25 12V18C19.25 19.1 18.35 20 17.25 20H6.75C5.65 20 4.75 19.1 4.75 18V12C4.75 10.9 5.65 10 6.75 10Z" stroke="currentColor" strokeWidth="1.8"/>
    <path d="M9.75 15.25H14.25M12 13V17.5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/>
  </svg>
);

const requiredMark = <span className="ml-1 text-red-500" aria-hidden="true">*</span>;
const fieldClass = (hasError) =>
  `block w-full rounded-md border bg-white py-3 pl-11 pr-3 text-sm text-slate-900 shadow-sm focus:outline-none focus:ring-2 ${hasError ? 'border-red-300 focus:border-red-500 focus:ring-red-500/20' : 'border-slate-300 focus:border-blue-500 focus:ring-blue-500/20'}`;

const ForgotPassword = () => {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [fieldErrors, setFieldErrors] = useState({});
  const [success, setSuccess] = useState('');

  if (isAuthenticated()) {
    return <Navigate to="/dashboard" replace />;
  }

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError('');
    setSuccess('');
    const trimmedEmail = email.trim();
    if (!trimmedEmail) {
      setFieldErrors({ email: 'Email is required' });
      setError('Please complete the required fields.');
      return;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmedEmail)) {
      setFieldErrors({ email: 'Please enter a valid email address' });
      return;
    }
    setFieldErrors({});
    setLoading(true);
    try {
      const response = await forgotPassword({ email: trimmedEmail });
      setSuccess(response.data.message || 'If this email is registered, a password reset link has been sent.');
    } catch (submitError) {
      setError(submitError.response?.data?.error || 'Unable to process request');
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthLayout title="Reset access" subtitle="Enter your email and we will help you reset access." icon={<ResetIcon />}>
      <form onSubmit={handleSubmit} className="space-y-5">
        {error && <div className="rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-700">{error}</div>}
        {success && <div className="rounded-md border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-medium text-emerald-700">{success}</div>}
        <div>
          <label htmlFor="email" className="block text-sm font-medium text-slate-700">Email{requiredMark}</label>
          <div className="relative mt-2">
            <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">
              <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="M4.75 6.75H19.25V17.25H4.75V6.75Z" stroke="currentColor" strokeWidth="1.8"/><path d="M5.25 7.25L12 12.5L18.75 7.25" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/></svg>
            </span>
            <input id="email" type="email" autoComplete="email" aria-invalid={Boolean(fieldErrors.email)} aria-describedby={fieldErrors.email ? 'forgot-email-error' : undefined} value={email} onChange={(event) => { setEmail(event.target.value); setFieldErrors((current) => ({ ...current, email: '' })); }} className={fieldClass(fieldErrors.email)} />
          </div>
          {fieldErrors.email && <p id="forgot-email-error" className="mt-2 text-sm font-medium text-red-600">{fieldErrors.email}</p>}
        </div>
        <button type="submit" disabled={loading} className="inline-flex min-h-12 w-full items-center justify-center rounded-md bg-blue-600 px-4 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:cursor-not-allowed disabled:opacity-70">
          {loading && <span className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-white/40 border-t-white"></span>}
          {loading ? 'Sending reset link...' : 'Send reset link'}
        </button>
        <p className="text-sm text-slate-600">
          Remembered it? <Link to="/login" className="font-medium text-blue-600 hover:text-blue-700">Back to Login</Link>
        </p>
      </form>
    </AuthLayout>
  );
};

export default ForgotPassword;

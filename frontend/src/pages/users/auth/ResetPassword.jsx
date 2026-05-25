import React, { useEffect, useState } from 'react';
import { Link, Navigate, useLocation, useNavigate } from 'react-router-dom';
import { resetPassword } from '../../../services/api';
import AuthLayout from './AuthLayout';
import { isAuthenticated } from './authStorage';

const ResetIcon = () => (
  <svg className="h-6 w-6" viewBox="0 0 24 24" fill="none" aria-hidden="true">
    <path d="M7.75 10V8.25C7.75 5.9 9.65 4 12 4C14.35 4 16.25 5.9 16.25 8.25V10" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/>
    <path d="M6.75 10H17.25C18.35 10 19.25 10.9 19.25 12V18C19.25 19.1 18.35 20 17.25 20H6.75C5.65 20 4.75 19.1 4.75 18V12C4.75 10.9 5.65 10 6.75 10Z" stroke="currentColor" strokeWidth="1.8"/>
    <path d="M8.75 15.25L10.75 17.25L15.5 12.5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
);

const EyeIcon = ({ hidden }) => (
  <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" aria-hidden="true">
    {hidden ? (
      <>
        <path d="M3.75 3.75L20.25 20.25" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/>
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

const requiredMark = <span className="ml-1 text-red-500" aria-hidden="true">*</span>;
const fieldClass = (hasError) =>
  `block w-full rounded-md border bg-white py-3 pl-11 pr-12 text-sm text-slate-900 shadow-sm focus:outline-none focus:ring-2 ${hasError ? 'border-red-300 focus:border-red-500 focus:ring-red-500/20' : 'border-slate-300 focus:border-blue-500 focus:ring-blue-500/20'}`;

const ResetPassword = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const token = new URLSearchParams(location.search).get('token') || '';
  const [formData, setFormData] = useState({ password: '', confirmPassword: '' });
  const [fieldErrors, setFieldErrors] = useState({});
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  useEffect(() => {
    if (!success) {
      return undefined;
    }

    const timeoutId = window.setTimeout(() => {
      navigate('/login', { replace: true, state: { message: success } });
    }, 2500);

    return () => window.clearTimeout(timeoutId);
  }, [navigate, success]);

  if (isAuthenticated()) {
    return <Navigate to="/dashboard" replace />;
  }

  const updateField = (field, value) => {
    setFormData((current) => ({ ...current, [field]: value }));
    setFieldErrors((current) => ({ ...current, [field]: '' }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError('');
    setSuccess('');

    const nextErrors = {};
    if (!token) {
      nextErrors.token = 'Reset link is missing or invalid.';
    }
    if (!formData.password) {
      nextErrors.password = 'New password is required';
    } else if (formData.password.length < 6) {
      nextErrors.password = 'Password must be at least 6 characters';
    }
    if (!formData.confirmPassword) {
      nextErrors.confirmPassword = 'Confirm password is required';
    } else if (formData.password !== formData.confirmPassword) {
      nextErrors.confirmPassword = 'Passwords do not match';
    }

    if (Object.keys(nextErrors).length > 0) {
      setFieldErrors(nextErrors);
      setError(nextErrors.token || 'Please fix the highlighted fields.');
      return;
    }

    setLoading(true);
    try {
      const response = await resetPassword({ token, password: formData.password });
      setSuccess(response.data.message || 'Password reset successfully. Please login with your new password.');
      setFormData({ password: '', confirmPassword: '' });
    } catch (submitError) {
      setError(submitError.response?.data?.error || 'Unable to reset password');
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthLayout title="Create new password" subtitle="Enter a new password for your account." icon={<ResetIcon />}>
      <form onSubmit={handleSubmit} className="space-y-5">
        {error && <div className="rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-700">{error}</div>}
        {success && <div className="rounded-md border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-medium text-emerald-700">{success}</div>}

        <div>
          <label htmlFor="new-password" className="block text-sm font-medium text-slate-700">New Password{requiredMark}</label>
          <div className="relative mt-2">
            <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">
              <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="M7.75 10V8.25C7.75 5.9 9.65 4 12 4C14.35 4 16.25 5.9 16.25 8.25V10" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/><path d="M6.75 10H17.25C18.35 10 19.25 10.9 19.25 12V18C19.25 19.1 18.35 20 17.25 20H6.75C5.65 20 4.75 19.1 4.75 18V12C4.75 10.9 5.65 10 6.75 10Z" stroke="currentColor" strokeWidth="1.8"/></svg>
            </span>
            <input id="new-password" type={showPassword ? 'text' : 'password'} autoComplete="new-password" value={formData.password} aria-invalid={Boolean(fieldErrors.password)} aria-describedby={fieldErrors.password ? 'new-password-error' : undefined} onChange={(event) => updateField('password', event.target.value)} className={fieldClass(fieldErrors.password)} />
            <button type="button" onClick={() => setShowPassword((value) => !value)} className="absolute right-3 top-1/2 -translate-y-1/2 rounded-md p-1 text-slate-500 hover:bg-slate-100 hover:text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500" aria-label={showPassword ? 'Hide password' : 'Show password'}>
              <EyeIcon hidden={showPassword} />
            </button>
          </div>
          {fieldErrors.password && <p id="new-password-error" className="mt-2 text-sm font-medium text-red-600">{fieldErrors.password}</p>}
        </div>

        <div>
          <label htmlFor="confirm-password" className="block text-sm font-medium text-slate-700">Confirm Password{requiredMark}</label>
          <div className="relative mt-2">
            <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">
              <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="M7.75 10V8.25C7.75 5.9 9.65 4 12 4C14.35 4 16.25 5.9 16.25 8.25V10" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/><path d="M6.75 10H17.25C18.35 10 19.25 10.9 19.25 12V18C19.25 19.1 18.35 20 17.25 20H6.75C5.65 20 4.75 19.1 4.75 18V12C4.75 10.9 5.65 10 6.75 10Z" stroke="currentColor" strokeWidth="1.8"/></svg>
            </span>
            <input id="confirm-password" type={showConfirmPassword ? 'text' : 'password'} autoComplete="new-password" value={formData.confirmPassword} aria-invalid={Boolean(fieldErrors.confirmPassword)} aria-describedby={fieldErrors.confirmPassword ? 'confirm-password-error' : undefined} onChange={(event) => updateField('confirmPassword', event.target.value)} className={fieldClass(fieldErrors.confirmPassword)} />
            <button type="button" onClick={() => setShowConfirmPassword((value) => !value)} className="absolute right-3 top-1/2 -translate-y-1/2 rounded-md p-1 text-slate-500 hover:bg-slate-100 hover:text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500" aria-label={showConfirmPassword ? 'Hide password' : 'Show password'}>
              <EyeIcon hidden={showConfirmPassword} />
            </button>
          </div>
          {fieldErrors.confirmPassword && <p id="confirm-password-error" className="mt-2 text-sm font-medium text-red-600">{fieldErrors.confirmPassword}</p>}
        </div>

        <button type="submit" disabled={loading || Boolean(success)} className="inline-flex min-h-12 w-full items-center justify-center rounded-md bg-blue-600 px-4 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:cursor-not-allowed disabled:opacity-70">
          {loading && <span className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-white/40 border-t-white"></span>}
          {loading ? 'Resetting password...' : 'Reset password'}
        </button>

        <p className="text-sm text-slate-600">
          Rmembered it? <Link to="/login" className="font-medium text-blue-600 hover:text-blue-700">Back to Login</Link>
        </p>
      </form>
    </AuthLayout>
  );
};

export default ResetPassword;

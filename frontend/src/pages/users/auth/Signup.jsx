import React, { useState } from 'react';
import { Link, Navigate, useNavigate } from 'react-router-dom';
import { signup } from '../../../services/api';
import AuthLayout from './AuthLayout';
import { isAuthenticated } from './authStorage';

const emptyForm = { fullName: '', email: '', password: '', confirmPassword: '' };

const SignupIcon = () => (
  <svg className="h-6 w-6" viewBox="0 0 24 24" fill="none" aria-hidden="true">
    <path d="M12 12C14.21 12 16 10.21 16 8C16 5.79 14.21 4 12 4C9.79 4 8 5.79 8 8C8 10.21 9.79 12 12 12Z" stroke="currentColor" strokeWidth="1.8"/>
    <path d="M5 20C5.75 16.85 8.35 14.75 12 14.75C13.03 14.75 13.98 14.92 14.82 15.25" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/>
    <path d="M18 15.75V20.25M15.75 18H20.25" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/>
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
const fieldClass = (hasError, extraClasses = '') =>
  `block w-full rounded-md border bg-white py-3 text-sm text-slate-900 shadow-sm focus:outline-none focus:ring-2 ${hasError ? 'border-red-300 focus:border-red-500 focus:ring-red-500/20' : 'border-slate-300 focus:border-blue-500 focus:ring-blue-500/20'} ${extraClasses}`;

const Signup = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState(emptyForm);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [fieldErrors, setFieldErrors] = useState({});
  const [success, setSuccess] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  if (isAuthenticated()) {
    return <Navigate to="/dashboard" replace />;
  }

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError('');
    setSuccess('');
    const nextFieldErrors = {};
    if (!formData.fullName.trim()) {
      nextFieldErrors.fullName = 'Full name is required';
    }
    if (!formData.email.trim()) {
      nextFieldErrors.email = 'Email is required';
    }
    if (!formData.password) {
      nextFieldErrors.password = 'Password is required';
    }
    if (!formData.confirmPassword) {
      nextFieldErrors.confirmPassword = 'Confirm password is required';
    }
    if (Object.keys(nextFieldErrors).length > 0) {
      setFieldErrors(nextFieldErrors);
      setError('Please complete the required fields.');
      return;
    }
    if (formData.password !== formData.confirmPassword) {
      setFieldErrors({ confirmPassword: 'Passwords do not match' });
      setError('Passwords do not match');
      return;
    }
    setFieldErrors({});
    setLoading(true);
    try {
      await signup({
        full_name: formData.fullName,
        email: formData.email,
        password: formData.password,
      });
      setFormData(emptyForm);
      setFieldErrors({});
      setSuccess('Account created successfully');
      window.setTimeout(() => {
        navigate('/login', { replace: true, state: { message: 'Account created successfully' } });
      }, 900);
    } catch (submitError) {
      setError(submitError.response?.data?.error || 'Unable to create account');
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthLayout title="Create account" subtitle="Create your account to start managing assets." icon={<SignupIcon />}>
      <form onSubmit={handleSubmit} className="space-y-5">
        {error && <div className="rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-700">{error}</div>}
        {success && <div className="rounded-md border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-medium text-emerald-700">{success}</div>}
        <div>
          <label htmlFor="fullName" className="block text-sm font-medium text-slate-700">Full Name{requiredMark}</label>
          <input id="fullName" autoComplete="name" aria-invalid={Boolean(fieldErrors.fullName)} aria-describedby={fieldErrors.fullName ? 'fullName-error' : undefined} value={formData.fullName} onChange={(event) => { setFormData((current) => ({ ...current, fullName: event.target.value })); setFieldErrors((current) => ({ ...current, fullName: '' })); }} className={`mt-2 px-3 ${fieldClass(fieldErrors.fullName)}`} />
          {fieldErrors.fullName && <p id="fullName-error" className="mt-2 text-sm font-medium text-red-600">{fieldErrors.fullName}</p>}
        </div>
        <div>
          <label htmlFor="email" className="block text-sm font-medium text-slate-700">Email{requiredMark}</label>
          <input id="email" type="email" autoComplete="email" aria-invalid={Boolean(fieldErrors.email)} aria-describedby={fieldErrors.email ? 'signup-email-error' : undefined} value={formData.email} onChange={(event) => { setFormData((current) => ({ ...current, email: event.target.value })); setFieldErrors((current) => ({ ...current, email: '' })); }} className={`mt-2 px-3 ${fieldClass(fieldErrors.email)}`} />
          {fieldErrors.email && <p id="signup-email-error" className="mt-2 text-sm font-medium text-red-600">{fieldErrors.email}</p>}
        </div>
        <div>
          <label htmlFor="password" className="block text-sm font-medium text-slate-700">Password{requiredMark}</label>
          <div className="relative mt-2">
            <input id="password" type={showPassword ? 'text' : 'password'} autoComplete="new-password" aria-invalid={Boolean(fieldErrors.password)} aria-describedby={fieldErrors.password ? 'signup-password-error' : undefined} value={formData.password} onChange={(event) => { setFormData((current) => ({ ...current, password: event.target.value })); setFieldErrors((current) => ({ ...current, password: '' })); }} className={fieldClass(fieldErrors.password, 'pl-3 pr-12')} />
            <button type="button" onClick={() => setShowPassword((value) => !value)} className="absolute right-3 top-1/2 -translate-y-1/2 rounded-md p-1 text-slate-500 hover:bg-slate-100 hover:text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500" aria-label={showPassword ? 'Hide password' : 'Show password'}>
              <EyeIcon hidden={showPassword} />
            </button>
          </div>
          {fieldErrors.password && <p id="signup-password-error" className="mt-2 text-sm font-medium text-red-600">{fieldErrors.password}</p>}
        </div>
        <div>
          <label htmlFor="confirmPassword" className="block text-sm font-medium text-slate-700">Confirm Password{requiredMark}</label>
          <div className="relative mt-2">
            <input id="confirmPassword" type={showConfirmPassword ? 'text' : 'password'} autoComplete="new-password" aria-invalid={Boolean(fieldErrors.confirmPassword)} aria-describedby={fieldErrors.confirmPassword ? 'confirmPassword-error' : undefined} value={formData.confirmPassword} onChange={(event) => { setFormData((current) => ({ ...current, confirmPassword: event.target.value })); setFieldErrors((current) => ({ ...current, confirmPassword: '' })); }} className={fieldClass(fieldErrors.confirmPassword, 'pl-3 pr-12')} />
            <button type="button" onClick={() => setShowConfirmPassword((value) => !value)} className="absolute right-3 top-1/2 -translate-y-1/2 rounded-md p-1 text-slate-500 hover:bg-slate-100 hover:text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500" aria-label={showConfirmPassword ? 'Hide password' : 'Show password'}>
              <EyeIcon hidden={showConfirmPassword} />
            </button>
          </div>
          {fieldErrors.confirmPassword && <p id="confirmPassword-error" className="mt-2 text-sm font-medium text-red-600">{fieldErrors.confirmPassword}</p>}
        </div>
        <button type="submit" disabled={loading} className="inline-flex min-h-12 w-full items-center justify-center rounded-md bg-blue-600 px-4 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:cursor-not-allowed disabled:opacity-70">
          {loading && <span className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-white/40 border-t-white"></span>}
          {loading ? 'Creating account...' : 'Create account'}
        </button>
        <p className="text-sm text-slate-600">
          Already have an account? <Link to="/login" className="font-medium text-blue-600 hover:text-blue-700">Login</Link>
        </p>
      </form>
    </AuthLayout>
  );
};

export default Signup;

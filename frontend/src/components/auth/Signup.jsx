import React, { useState } from 'react';
import { Link, Navigate, useNavigate } from 'react-router-dom';
import { signup } from '../../services/api';
import AuthLayout from './AuthLayout';
import { getStoredToken } from './authStorage';

const emptyForm = { fullName: '', email: '', password: '', confirmPassword: '' };

const Signup = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState(emptyForm);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  if (getStoredToken()) {
    return <Navigate to="/" replace />;
  }

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError('');
    setSuccess('');
    if (!formData.fullName.trim() || !formData.email.trim() || !formData.password || !formData.confirmPassword) {
      setError('All fields are required');
      return;
    }
    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match');
      return;
    }
    setLoading(true);
    try {
      await signup({
        full_name: formData.fullName,
        email: formData.email,
        password: formData.password,
      });
      setFormData(emptyForm);
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
    <AuthLayout title="Signup" subtitle="Create your account to start managing assets.">
      <form onSubmit={handleSubmit} className="space-y-5">
        {error && <div className="rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>}
        {success && <div className="rounded-md border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">{success}</div>}
        <div>
          <label htmlFor="fullName" className="block text-sm font-medium text-slate-700">Full Name</label>
          <input id="fullName" value={formData.fullName} onChange={(event) => setFormData((current) => ({ ...current, fullName: event.target.value }))} className="mt-2 block w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20" />
        </div>
        <div>
          <label htmlFor="email" className="block text-sm font-medium text-slate-700">Email</label>
          <input id="email" type="email" value={formData.email} onChange={(event) => setFormData((current) => ({ ...current, email: event.target.value }))} className="mt-2 block w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20" />
        </div>
        <div>
          <label htmlFor="password" className="block text-sm font-medium text-slate-700">Password</label>
          <input id="password" type="password" value={formData.password} onChange={(event) => setFormData((current) => ({ ...current, password: event.target.value }))} className="mt-2 block w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20" />
        </div>
        <div>
          <label htmlFor="confirmPassword" className="block text-sm font-medium text-slate-700">Confirm Password</label>
          <input id="confirmPassword" type="password" value={formData.confirmPassword} onChange={(event) => setFormData((current) => ({ ...current, confirmPassword: event.target.value }))} className="mt-2 block w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20" />
        </div>
        <button type="submit" disabled={loading} className="inline-flex w-full items-center justify-center rounded-md bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:cursor-not-allowed disabled:opacity-70">
          {loading && <span className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-white/40 border-t-white"></span>}
          Signup
        </button>
        <p className="text-sm text-slate-600">
          Already have an account? <Link to="/login" className="font-medium text-blue-600 hover:text-blue-700">Login</Link>
        </p>
      </form>
    </AuthLayout>
  );
};

export default Signup;

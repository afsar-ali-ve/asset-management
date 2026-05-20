import React, { useState } from 'react';
import { Link, Navigate } from 'react-router-dom';
import { forgotPassword } from '../../services/api';
import AuthLayout from './AuthLayout';
import { getStoredToken } from './authStorage';

const ForgotPassword = () => {
  const [email, setEmail] = useState('');
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
    if (!email.trim()) {
      setError('Email is required');
      return;
    }
    setLoading(true);
    try {
      const response = await forgotPassword({ email });
      setSuccess(response.data.message || 'Password reset instructions will be sent if the account exists.');
    } catch (submitError) {
      setError(submitError.response?.data?.error || 'Unable to process request');
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthLayout title="Forgot Password" subtitle="Enter your email and we will help you reset access.">
      <form onSubmit={handleSubmit} className="space-y-5">
        {error && <div className="rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>}
        {success && <div className="rounded-md border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-700">{success}</div>}
        <div>
          <label htmlFor="email" className="block text-sm font-medium text-slate-700">Email</label>
          <input id="email" type="email" value={email} onChange={(event) => setEmail(event.target.value)} className="mt-2 block w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20" />
        </div>
        <button type="submit" disabled={loading} className="inline-flex w-full items-center justify-center rounded-md bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:cursor-not-allowed disabled:opacity-70">
          {loading && <span className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-white/40 border-t-white"></span>}
          Submit
        </button>
        <p className="text-sm text-slate-600">
          Remembered it? <Link to="/login" className="font-medium text-blue-600 hover:text-blue-700">Back to Login</Link>
        </p>
      </form>
    </AuthLayout>
  );
};

export default ForgotPassword;

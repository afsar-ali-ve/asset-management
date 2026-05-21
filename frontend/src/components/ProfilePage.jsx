import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { changePassword, getProfile, updateProfile } from '../services/api';
import { clearStoredAuth, getStoredToken, getStoredUser, setStoredUser } from './auth/authStorage';

const emptyPasswordForm = {
  currentPassword: '',
  newPassword: '',
  confirmPassword: '',
};

const profileTabs = [
  { id: 'details', label: 'Profile Details' },
  { id: 'password', label: 'Change Password' },
];

const normalizeUser = (user) => {
  if (!user) {
    return null;
  }

  return {
    id: user.id,
    full_name: user.full_name || user.fullName || '',
    email: user.email || '',
    profile_image: user.profile_image || user.profileImage || '',
    created_at: user.created_at || user.createdAt || '',
    updated_at: user.updated_at || user.updatedAt || '',
  };
};

const formatDate = (value) => {
  if (!value) {
    return '-';
  }

  return new Intl.DateTimeFormat('en', {
    month: 'short',
    day: '2-digit',
    year: 'numeric',
  }).format(new Date(value));
};

const ProfileAvatar = ({ imageUrl, initials, size = 'lg' }) => {
  const [imageFailed, setImageFailed] = useState(false);
  const sizeClass = size === 'xl' ? 'h-28 w-28 text-3xl' : 'h-24 w-24 text-2xl';

  useEffect(() => {
    setImageFailed(false);
  }, [imageUrl]);

  if (imageUrl && !imageFailed) {
    return (
      <img
        src={imageUrl}
        alt="User profile"
        onError={() => setImageFailed(true)}
        className={`${sizeClass} rounded-full object-cover ring-4 ring-white`}
      />
    );
  }

  return (
    <div className={`flex ${sizeClass} items-center justify-center rounded-full bg-slate-700 font-semibold text-white ring-4 ring-white`}>
      {initials || 'U'}
    </div>
  );
};

const ProfilePage = ({ onAuthChange }) => {
  const navigate = useNavigate();
  const [profile, setProfile] = useState(() => normalizeUser(getStoredUser()));
  const [profileForm, setProfileForm] = useState(() => {
    const storedUser = normalizeUser(getStoredUser());
    return {
      fullName: storedUser?.full_name || '',
      email: storedUser?.email || '',
      profileImage: storedUser?.profile_image || '',
    };
  });
  const [passwordForm, setPasswordForm] = useState(emptyPasswordForm);
  const [loading, setLoading] = useState(true);
  const [savingProfile, setSavingProfile] = useState(false);
  const [savingPassword, setSavingPassword] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [activeTab, setActiveTab] = useState('details');

  const initials = useMemo(() => {
    const name = profile?.full_name || profileForm.fullName || 'User';
    return name
      .split(' ')
      .filter(Boolean)
      .slice(0, 2)
      .map((part) => part.charAt(0).toUpperCase())
      .join('');
  }, [profile, profileForm.fullName]);

  const handleAuthFailure = useCallback((requestError) => {
    if ([401, 403].includes(requestError.response?.status)) {
      clearStoredAuth();
      onAuthChange?.();
      navigate('/login', { replace: true });
      return true;
    }
    return false;
  }, [navigate, onAuthChange]);

  const applyProfileUser = useCallback((user) => {
    const normalizedUser = normalizeUser(user);
    if (!normalizedUser) {
      return false;
    }

    setProfile(normalizedUser);
    setStoredUser(normalizedUser);
    setProfileForm({
      fullName: normalizedUser.full_name || '',
      email: normalizedUser.email || '',
      profileImage: normalizedUser.profile_image || '',
    });
    onAuthChange?.();
    return true;
  }, [onAuthChange]);

  useEffect(() => {
    let isMounted = true;

    const loadProfile = async () => {
      setLoading(true);
      setError('');

      if (!getStoredToken()) {
        clearStoredAuth();
        onAuthChange?.();
        navigate('/login', { replace: true });
        return;
      }

      try {
        const response = await getProfile();
        if (!isMounted) {
          return;
        }
        const user = response.data?.user || response.data?.profile || response.data;
        if (!applyProfileUser(user)) {
          setError('Unable to load profile data');
        }
      } catch (loadError) {
        if (!handleAuthFailure(loadError) && isMounted) {
          setError(loadError.response?.data?.error || 'Unable to load profile');
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    loadProfile();

    return () => {
      isMounted = false;
    };
  }, [applyProfileUser, handleAuthFailure, navigate, onAuthChange]);

  const resetProfileForm = () => {
    setProfileForm({
      fullName: profile?.full_name || '',
      email: profile?.email || '',
      profileImage: profile?.profile_image || '',
    });
    setError('');
    setSuccess('');
  };

  const handleProfileImageFile = (event) => {
    const file = event.target.files?.[0];
    if (!file) {
      return;
    }

    if (!file.type.startsWith('image/')) {
      setError('Please select a valid image file');
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      setProfileForm((current) => ({ ...current, profileImage: reader.result || '' }));
      setError('');
    };
    reader.onerror = () => setError('Unable to read selected image');
    reader.readAsDataURL(file);
    event.target.value = '';
  };

  const handleProfileSubmit = async (event) => {
    event.preventDefault();
    setError('');
    setSuccess('');

    if (!profileForm.fullName.trim() || !profileForm.email.trim()) {
      setError('Full name and email are required');
      return;
    }

    setSavingProfile(true);
    try {
      const response = await updateProfile({
        full_name: profileForm.fullName,
        email: profileForm.email,
        profile_image: profileForm.profileImage,
      });
      const updatedUser = response.data?.user || response.data?.profile || response.data;
      applyProfileUser(updatedUser);
      setSuccess(response.data.message || 'Profile updated successfully');
    } catch (saveError) {
      if (!handleAuthFailure(saveError)) {
        setError(saveError.response?.data?.error || 'Unable to update profile');
      }
    } finally {
      setSavingProfile(false);
    }
  };

  const handlePasswordSubmit = async (event) => {
    event.preventDefault();
    setError('');
    setSuccess('');

    if (!passwordForm.currentPassword || !passwordForm.newPassword || !passwordForm.confirmPassword) {
      setError('All password fields are required');
      return;
    }
    if (passwordForm.newPassword.length < 6) {
      setError('New password must be at least 6 characters');
      return;
    }
    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      setError('New passwords do not match');
      return;
    }

    setSavingPassword(true);
    try {
      const response = await changePassword({
        current_password: passwordForm.currentPassword,
        new_password: passwordForm.newPassword,
      });
      setPasswordForm(emptyPasswordForm);
      setSuccess(response.data.message || 'Password changed successfully');
    } catch (saveError) {
      if (!handleAuthFailure(saveError)) {
        setError(saveError.response?.data?.error || 'Unable to change password');
      }
    } finally {
      setSavingPassword(false);
    }
  };

  if (loading) {
    return (
      <div className="rounded-lg border border-slate-200 bg-white p-8 shadow-sm">
        <div className="h-5 w-40 animate-pulse rounded bg-slate-200"></div>
        <div className="mt-6 grid gap-4 md:grid-cols-2">
          <div className="h-44 animate-pulse rounded-lg bg-slate-100"></div>
          <div className="h-44 animate-pulse rounded-lg bg-slate-100"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-sm text-slate-500">Account</p>
          <h1 className="text-2xl font-semibold text-slate-900">Profile</h1>
        </div>
        <button
          type="button"
          onClick={() => navigate(-1)}
          className="inline-flex items-center justify-center rounded-md border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 shadow-sm hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          Back
        </button>
      </div>

      {(error || success) && (
        <div
          className={`rounded-md border px-4 py-3 text-sm ${
            error
              ? 'border-red-200 bg-red-50 text-red-700'
              : 'border-emerald-200 bg-emerald-50 text-emerald-700'
          }`}
        >
          {error || success}
        </div>
      )}

      <div className="rounded-lg border border-slate-200 bg-white shadow-sm">
        <div className="border-b border-slate-200 px-4 pt-4">
          <div className="flex flex-wrap items-center gap-3">
            {profileTabs.map((tab) => (
              <button
                key={tab.id}
                type="button"
                onClick={() => {
                  setActiveTab(tab.id);
                  setError('');
                  setSuccess('');
                }}
                className={`border-b-2 px-3 pb-3 text-sm font-semibold transition ${
                  activeTab === tab.id
                    ? 'border-blue-600 text-blue-700'
                    : 'border-transparent text-slate-500 hover:text-slate-800'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        {activeTab === 'details' && (
          <div className="grid gap-5 p-5 xl:grid-cols-[minmax(0,1fr)_360px]">
        <div className="rounded-lg border border-slate-200 bg-white shadow-sm">
          <div className="border-b border-slate-200 px-5 py-4">
            <h2 className="text-lg font-semibold text-slate-900">Profile Details</h2>
            <p className="mt-1 text-sm text-slate-500">Manage your name, email, and display image.</p>
          </div>

          <form onSubmit={handleProfileSubmit} className="space-y-5 p-5">
            <div className="grid gap-5 lg:grid-cols-[220px_minmax(0,1fr)]">
              <div className="flex flex-col items-center gap-4 rounded-lg border border-slate-200 bg-slate-50 p-5">
                <ProfileAvatar imageUrl={profileForm.profileImage} initials={initials} size="xl" />
                <div className="text-center">
                  <div className="text-sm font-semibold text-slate-900">{profile?.full_name || '-'}</div>
                  <div className="text-xs text-slate-500">{profile?.email || '-'}</div>
                </div>
                <div className="w-full space-y-2">
                  <label className="flex w-full cursor-pointer items-center justify-center rounded-md bg-blue-600 px-3 py-2 text-xs font-semibold text-white shadow-sm hover:bg-blue-700">
                    {profileForm.profileImage ? 'Change Image' : 'Upload Image'}
                    <input type="file" accept="image/*" onChange={handleProfileImageFile} className="sr-only" />
                  </label>
                  {profileForm.profileImage && (
                    <button
                      type="button"
                      onClick={() => setProfileForm((current) => ({ ...current, profileImage: '' }))}
                      className="w-full rounded-md border border-red-200 bg-white px-3 py-2 text-xs font-semibold text-red-600 shadow-sm hover:bg-red-50"
                    >
                      Remove
                    </button>
                  )}
                  <p className="text-center text-xs leading-5 text-slate-500">
                    JPG, PNG, or GIF. Your initials are shown when no image is set.
                  </p>
                </div>
              </div>

              <div className="rounded-lg border border-slate-200 bg-white p-5">
                <div className="mb-5">
                  <h3 className="text-base font-semibold text-slate-900">Basic Information</h3>
                  <p className="mt-1 text-sm text-slate-500">Update the details used across your account.</p>
                </div>
                <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label htmlFor="fullName" className="block text-sm font-medium text-slate-700">
                    Full Name
                  </label>
                  <input
                    id="fullName"
                    value={profileForm.fullName}
                    onChange={(event) =>
                      setProfileForm((current) => ({ ...current, fullName: event.target.value }))
                    }
                    className="mt-2 block w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                  />
                </div>
                <div>
                  <label htmlFor="email" className="block text-sm font-medium text-slate-700">
                    Email
                  </label>
                  <input
                    id="email"
                    type="email"
                    value={profileForm.email}
                    onChange={(event) =>
                      setProfileForm((current) => ({ ...current, email: event.target.value }))
                    }
                    className="mt-2 block w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                  />
                </div>
                </div>
                <div className="mt-5 grid gap-4 border-t border-slate-200 pt-5 sm:grid-cols-2">
                  <div>
                    <div className="text-xs font-semibold uppercase text-slate-500">Account Created</div>
                    <div className="mt-1 text-sm font-medium text-slate-900">{formatDate(profile?.created_at)}</div>
                  </div>
                  <div>
                    <div className="text-xs font-semibold uppercase text-slate-500">Last Updated</div>
                    <div className="mt-1 text-sm font-medium text-slate-900">{formatDate(profile?.updated_at)}</div>
                  </div>
                </div>
              </div>
              </div>

            <div className="flex flex-col-reverse gap-3 border-t border-slate-200 pt-5 sm:flex-row sm:justify-end">
              <button
                type="button"
                onClick={resetProfileForm}
                className="inline-flex justify-center rounded-md border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 shadow-sm hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={savingProfile}
                className="inline-flex justify-center rounded-md bg-blue-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:cursor-not-allowed disabled:opacity-70"
              >
                {savingProfile ? 'Saving...' : 'Save Changes'}
              </button>
            </div>
          </form>
        </div>

        <aside className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
          <h2 className="text-lg font-semibold text-slate-900">Account Info</h2>
          <div className="mt-5 flex justify-center">
            <ProfileAvatar imageUrl={profile?.profile_image} initials={initials} />
          </div>
          <dl className="mt-5 space-y-4 text-sm">
            <div>
              <dt className="text-slate-500">Full Name</dt>
              <dd className="mt-1 font-medium text-slate-900">{profile?.full_name || '-'}</dd>
            </div>
            <div>
              <dt className="text-slate-500">Email</dt>
              <dd className="mt-1 font-medium text-slate-900">{profile?.email || '-'}</dd>
            </div>
            <div>
              <dt className="text-slate-500">Account Created</dt>
              <dd className="mt-1 font-medium text-slate-900">{formatDate(profile?.created_at)}</dd>
            </div>
          </dl>
        </aside>
      </div>
        )}

        {activeTab === 'password' && (
          <div className="p-5">
      <div className="rounded-lg border border-slate-200 bg-white shadow-sm">
        <div className="border-b border-slate-200 px-5 py-4">
          <h2 className="text-lg font-semibold text-slate-900">Change Password</h2>
          <p className="mt-1 text-sm text-slate-500">Confirm your current password before setting a new one.</p>
        </div>
        <form onSubmit={handlePasswordSubmit} className="space-y-5 p-5">
          <div className="grid gap-4 md:grid-cols-3">
            <div>
              <label htmlFor="currentPassword" className="block text-sm font-medium text-slate-700">
                Current Password
              </label>
              <input
                id="currentPassword"
                type="password"
                value={passwordForm.currentPassword}
                onChange={(event) =>
                  setPasswordForm((current) => ({ ...current, currentPassword: event.target.value }))
                }
                className="mt-2 block w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
              />
            </div>
            <div>
              <label htmlFor="newPassword" className="block text-sm font-medium text-slate-700">
                New Password
              </label>
              <input
                id="newPassword"
                type="password"
                value={passwordForm.newPassword}
                onChange={(event) =>
                  setPasswordForm((current) => ({ ...current, newPassword: event.target.value }))
                }
                className="mt-2 block w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
              />
            </div>
            <div>
              <label htmlFor="confirmPassword" className="block text-sm font-medium text-slate-700">
                Confirm Password
              </label>
              <input
                id="confirmPassword"
                type="password"
                value={passwordForm.confirmPassword}
                onChange={(event) =>
                  setPasswordForm((current) => ({ ...current, confirmPassword: event.target.value }))
                }
                className="mt-2 block w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
              />
            </div>
          </div>

          <div className="flex flex-col-reverse gap-3 border-t border-slate-200 pt-5 sm:flex-row sm:justify-end">
            <button
              type="button"
              onClick={() => setPasswordForm(emptyPasswordForm)}
              className="inline-flex justify-center rounded-md border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 shadow-sm hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={savingPassword}
              className="inline-flex justify-center rounded-md bg-blue-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:cursor-not-allowed disabled:opacity-70"
            >
              {savingPassword ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
        </form>
      </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ProfilePage;

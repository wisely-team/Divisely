import React, { useState } from 'react';
import { User, Mail, Lock, CheckCircle, AlertCircle, X, Trash2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Card, Button, Input } from '../components/UIComponents';
import { useApp } from '../context/AppContext';
import { AVATAR_OPTIONS, getAvatarUrl, AvatarId } from '../utils/avatars';

export default function Settings() {
  const { currentUser, updateProfile, deleteAccount } = useApp();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<'profile' | 'account'>('profile');

  // Profile form state
  const [profileForm, setProfileForm] = useState({
    name: currentUser?.name || '',
    email: currentUser?.email || '',
  });

  // Avatar picker state
  const [selectedAvatar, setSelectedAvatar] = useState<AvatarId>(
    (currentUser?.avatar as AvatarId) || 'avatar-1'
  );
  const [showAvatarPicker, setShowAvatarPicker] = useState(false);

  // Profile update state
  const [profileLoading, setProfileLoading] = useState(false);
  const [profileError, setProfileError] = useState<string | null>(null);
  const [profileSuccess, setProfileSuccess] = useState(false);

  // Account form state
  const [passwordForm, setPasswordForm] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });

  // Password change state
  const [passwordLoading, setPasswordLoading] = useState(false);
  const [passwordError, setPasswordError] = useState<string | null>(null);
  const [passwordSuccess, setPasswordSuccess] = useState(false);

  // Delete account state
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deletePassword, setDeletePassword] = useState('');
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  const handleProfileSave = async () => {
    setProfileError(null);
    setProfileSuccess(false);

    // Validation
    if (!profileForm.name.trim()) {
      setProfileError('Username cannot be empty.');
      return;
    }

    if (profileForm.name.trim().length < 2) {
      setProfileError('Username must be at least 2 characters.');
      return;
    }

    setProfileLoading(true);

    try {
      await updateProfile({
        name: profileForm.name.trim(),
        avatar: selectedAvatar,
      });

      setProfileSuccess(true);
      // Clear success message after 5 seconds
      setTimeout(() => setProfileSuccess(false), 5000);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to update profile.';
      // Map backend error codes to user-friendly messages
      if (message === 'username_exists') {
        setProfileError('This username is already taken. Please choose another.');
      } else if (message === 'invalid_username') {
        setProfileError('Invalid username. Please use valid characters.');
      } else if (message === 'invalid_avatar') {
        setProfileError('Invalid avatar selection.');
      } else {
        setProfileError(message);
      }
    } finally {
      setProfileLoading(false);
    }
  };

  const handlePasswordChange = async () => {
    setPasswordError(null);
    setPasswordSuccess(false);

    // Validation
    if (!passwordForm.currentPassword) {
      setPasswordError('Please enter your current password.');
      return;
    }

    if (!passwordForm.newPassword) {
      setPasswordError('Please enter a new password.');
      return;
    }

    if (passwordForm.newPassword.length < 6) {
      setPasswordError('New password must be at least 6 characters.');
      return;
    }

    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      setPasswordError('New passwords do not match.');
      return;
    }

    setPasswordLoading(true);

    try {
      await updateProfile({
        currentPassword: passwordForm.currentPassword,
        newPassword: passwordForm.newPassword,
      });

      setPasswordSuccess(true);
      setPasswordForm({ currentPassword: '', newPassword: '', confirmPassword: '' });

      // Clear success message after 5 seconds
      setTimeout(() => setPasswordSuccess(false), 5000);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to change password.';
      // Map backend error codes to user-friendly messages
      if (message === 'invalid_current_password') {
        setPasswordError('Current password is incorrect.');
      } else if (message === 'invalid_new_password') {
        setPasswordError('New password is invalid. It must be at least 6 characters.');
      } else if (message === 'current_password_required') {
        setPasswordError('Current password is required.');
      } else {
        setPasswordError(message);
      }
    } finally {
      setPasswordLoading(false);
    }
  };

  const handleDeleteAccount = async () => {
    setDeleteError(null);

    if (!deletePassword) {
      setDeleteError('Please enter your password to confirm deletion.');
      return;
    }

    setDeleteLoading(true);

    try {
      await deleteAccount(deletePassword);
      // Redirect to login after successful deletion
      navigate('/login');
    } catch (err) {
      console.error('Delete account error:', err);
      const message = err instanceof Error ? err.message : 'Failed to delete account.';
      console.error('Error message:', message);
      // Map backend error codes to user-friendly messages
      if (message === 'invalid_password') {
        setDeleteError('Incorrect password. Please try again.');
      } else if (message === 'password_required') {
        setDeleteError('Password is required to delete your account.');
      } else {
        setDeleteError(message);
      }
    } finally {
      setDeleteLoading(false);
    }
  };

  const tabs = [
    { id: 'profile', label: 'Profile', icon: User },
    { id: 'account', label: 'Account', icon: Lock },
  ];

  return (
    <>
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold text-gray-900 mb-8">Settings</h1>

        {/* Tabs */}
        <div className="flex gap-2 mb-6 overflow-x-auto pb-2">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`flex items-center gap-2 px-4 py-2.5 rounded-lg font-medium transition-colors whitespace-nowrap ${activeTab === tab.id
                  ? 'bg-teal-600 text-white'
                  : 'bg-white text-gray-600 hover:bg-gray-50 border border-gray-200'
                  }`}
              >
                <Icon className="w-4 h-4" />
                {tab.label}
              </button>
            );
          })}
        </div>

        {/* Profile Tab */}
        {activeTab === 'profile' && (
          <Card className="p-6">
            <h2 className="text-xl font-bold text-gray-900 mb-6">Profile Information</h2>

            {/* Success Message */}
            {profileSuccess && (
              <div className="flex items-center gap-2 p-3 mb-4 bg-green-50 border border-green-200 rounded-lg text-green-700">
                <CheckCircle className="w-5 h-5 flex-shrink-0" />
                <span className="text-sm font-medium">Profile updated successfully!</span>
              </div>
            )}

            {/* Error Message */}
            {profileError && (
              <div className="flex items-center gap-2 p-3 mb-4 bg-red-50 border border-red-200 rounded-lg text-red-700">
                <AlertCircle className="w-5 h-5 flex-shrink-0" />
                <span className="text-sm font-medium">{profileError}</span>
              </div>
            )}

            <div className="flex items-center gap-6 mb-6 pb-6 border-b border-gray-100">
              <div className="relative">
                <img
                  src={getAvatarUrl(selectedAvatar)}
                  alt={currentUser?.name}
                  className="w-20 h-20 rounded-full border-4 border-white shadow-md bg-gray-100"
                />
              </div>
              <div>
                <h3 className="font-semibold text-gray-900">{currentUser?.name}</h3>
                <p className="text-sm text-gray-500">{currentUser?.email}</p>
                <Button
                  variant="ghost"
                  className="mt-2 text-sm"
                  onClick={() => setShowAvatarPicker(true)}
                  disabled={profileLoading}
                >
                  Change Avatar
                </Button>
              </div>
            </div>

            {/* Avatar Picker Modal */}
            {showAvatarPicker && (
              <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
                <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg mx-4 overflow-hidden">
                  <div className="flex items-center justify-between p-4 border-b border-gray-100">
                    <h3 className="text-lg font-bold text-gray-900">Choose Your Avatar</h3>
                    <button
                      onClick={() => setShowAvatarPicker(false)}
                      className="p-1 rounded-full hover:bg-gray-100 transition-colors"
                    >
                      <X className="w-5 h-5 text-gray-500" />
                    </button>
                  </div>
                  <div className="p-6">
                    <div className="grid grid-cols-4 gap-4">
                      {AVATAR_OPTIONS.map((avatar) => (
                        <button
                          key={avatar.id}
                          onClick={() => {
                            setSelectedAvatar(avatar.id);
                            setShowAvatarPicker(false);
                            setProfileError(null);
                          }}
                          className={`relative p-2 rounded-xl transition-all duration-200 hover:scale-105 ${selectedAvatar === avatar.id
                            ? 'ring-2 ring-teal-500 bg-teal-50 shadow-md'
                            : 'hover:bg-gray-50 hover:shadow-sm'
                            }`}
                        >
                          <img
                            src={avatar.url}
                            alt={avatar.label}
                            className="w-full aspect-square rounded-lg"
                          />
                          <span className="block text-xs text-center mt-1 text-gray-600 truncate">
                            {avatar.label}
                          </span>
                          {selectedAvatar === avatar.id && (
                            <div className="absolute -top-1 -right-1 w-5 h-5 bg-teal-500 rounded-full flex items-center justify-center">
                              <CheckCircle className="w-3 h-3 text-white" />
                            </div>
                          )}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            )}

            <div className="space-y-4">
              <Input
                label="Username"
                type="text"
                value={profileForm.name}
                onChange={(e) => {
                  setProfileForm({ ...profileForm, name: e.target.value });
                  setProfileError(null);
                }}
                placeholder="Your username"
                disabled={profileLoading}
              />

              <Input
                label="Email Address"
                type="email"
                value={profileForm.email}
                onChange={() => { }}
                placeholder="your.email@example.com"
                disabled
                className="bg-gray-100 cursor-not-allowed"
              />
              <p className="text-xs text-gray-500 -mt-2">Email address cannot be changed.</p>

              <div className="pt-4 flex gap-3">
                <Button onClick={handleProfileSave} disabled={profileLoading}>
                  {profileLoading ? 'Saving...' : 'Save Changes'}
                </Button>
                <Button
                  variant="secondary"
                  onClick={() => {
                    setProfileForm({
                      name: currentUser?.name || '',
                      email: currentUser?.email || '',
                    });
                    setSelectedAvatar((currentUser?.avatar as AvatarId) || 'avatar-1');
                    setProfileError(null);
                    setProfileSuccess(false);
                  }}
                  disabled={profileLoading}
                >
                  Reset
                </Button>
              </div>
            </div>
          </Card>
        )}

        {/* Account Tab */}
        {activeTab === 'account' && (
          <Card className="p-6">
            <h2 className="text-xl font-bold text-gray-900 mb-6">Change Password</h2>

            <div className="space-y-4">
              {/* Success Message */}
              {passwordSuccess && (
                <div className="flex items-center gap-2 p-3 bg-green-50 border border-green-200 rounded-lg text-green-700">
                  <CheckCircle className="w-5 h-5 flex-shrink-0" />
                  <span className="text-sm font-medium">Password updated successfully!</span>
                </div>
              )}

              {/* Error Message */}
              {passwordError && (
                <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700">
                  <AlertCircle className="w-5 h-5 flex-shrink-0" />
                  <span className="text-sm font-medium">{passwordError}</span>
                </div>
              )}

              <Input
                label="Current Password"
                type="password"
                value={passwordForm.currentPassword}
                onChange={(e) => {
                  setPasswordForm({ ...passwordForm, currentPassword: e.target.value });
                  setPasswordError(null);
                }}
                placeholder="Enter current password"
                disabled={passwordLoading}
              />

              <Input
                label="New Password"
                type="password"
                value={passwordForm.newPassword}
                onChange={(e) => {
                  setPasswordForm({ ...passwordForm, newPassword: e.target.value });
                  setPasswordError(null);
                }}
                placeholder="At least 6 characters"
                disabled={passwordLoading}
              />

              <Input
                label="Confirm New Password"
                type="password"
                value={passwordForm.confirmPassword}
                onChange={(e) => {
                  setPasswordForm({ ...passwordForm, confirmPassword: e.target.value });
                  setPasswordError(null);
                }}
                placeholder="Confirm new password"
                disabled={passwordLoading}
              />

              <div className="pt-4 flex gap-3">
                <Button onClick={handlePasswordChange} disabled={passwordLoading}>
                  {passwordLoading ? 'Updating...' : 'Update Password'}
                </Button>
                <Button
                  variant="secondary"
                  onClick={() => {
                    setPasswordForm({ currentPassword: '', newPassword: '', confirmPassword: '' });
                    setPasswordError(null);
                    setPasswordSuccess(false);
                  }}
                  disabled={passwordLoading}
                >
                  Cancel
                </Button>
              </div>
            </div>

            <div className="mt-8 pt-8 border-t border-gray-200">
              <h3 className="text-lg font-semibold text-red-600 mb-2 flex items-center gap-2">
                <Trash2 className="w-5 h-5" />
                Danger Zone
              </h3>
              <p className="text-sm text-gray-600 mb-4">
                Once you delete your account, there is no going back. All your data, groups, and expenses will be permanently removed.
              </p>
              <Button
                variant="danger"
                onClick={() => {
                  setShowDeleteModal(true);
                  setDeletePassword('');
                  setDeleteError(null);
                }}
              >
                Delete Account
              </Button>
            </div>

            {/* Delete Account Confirmation Modal */}
            {showDeleteModal && (
              <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
                <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md mx-4 overflow-hidden">
                  <div className="flex items-center justify-between p-4 border-b border-gray-100 bg-red-50">
                    <h3 className="text-lg font-bold text-red-600 flex items-center gap-2">
                      <Trash2 className="w-5 h-5" />
                      Delete Account
                    </h3>
                    <button
                      onClick={() => {
                        setShowDeleteModal(false);
                        setDeletePassword('');
                        setDeleteError(null);
                      }}
                      className="p-1 rounded-full hover:bg-red-100 transition-colors"
                      disabled={deleteLoading}
                    >
                      <X className="w-5 h-5 text-red-500" />
                    </button>
                  </div>
                  <div className="p-6">
                    <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
                      <p className="text-sm text-red-700 font-medium">
                        ⚠️ This action is irreversible!
                      </p>
                      <p className="text-sm text-red-600 mt-1">
                        All your groups, expenses, and account data will be permanently deleted.
                      </p>
                    </div>

                    {/* Error Message */}
                    {deleteError && (
                      <div className="flex items-center gap-2 p-3 mb-4 bg-red-50 border border-red-200 rounded-lg text-red-700">
                        <AlertCircle className="w-5 h-5 flex-shrink-0" />
                        <span className="text-sm font-medium">{deleteError}</span>
                      </div>
                    )}

                    <div className="space-y-4">
                      <Input
                        label="Enter your password to confirm"
                        type="password"
                        value={deletePassword}
                        onChange={(e) => {
                          setDeletePassword(e.target.value);
                          setDeleteError(null);
                        }}
                        placeholder="Your current password"
                        disabled={deleteLoading}
                      />

                      <div className="flex gap-3">
                        <Button
                          variant="danger"
                          onClick={handleDeleteAccount}
                          disabled={deleteLoading}
                          className="flex-1"
                        >
                          {deleteLoading ? 'Deleting...' : 'Delete My Account'}
                        </Button>
                        <Button
                          variant="secondary"
                          onClick={() => {
                            setShowDeleteModal(false);
                            setDeletePassword('');
                            setDeleteError(null);
                          }}
                          disabled={deleteLoading}
                        >
                          Cancel
                        </Button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </Card>
        )}
      </div>
    </>
  );
}

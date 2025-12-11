import React, { useState } from 'react';
import { User, Mail, Lock, Bell, Globe, Palette } from 'lucide-react';
import { Card, Button, Input } from '../components/UIComponents';
import { useApp } from '../context/AppContext';

export default function Settings() {
  const { currentUser } = useApp();
  const [activeTab, setActiveTab] = useState<'profile' | 'account' | 'notifications' | 'preferences'>('profile');

  // Profile form state
  const [profileForm, setProfileForm] = useState({
    name: currentUser?.name || '',
    email: currentUser?.email || '',
  });

  // Account form state
  const [passwordForm, setPasswordForm] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });

  // Notifications state
  const [notifications, setNotifications] = useState({
    emailExpenses: true,
    emailPayments: true,
    emailReminders: false,
    pushNotifications: true,
  });

  // Preferences state
  const [preferences, setPreferences] = useState({
    language: 'en',
    currency: 'USD',
    theme: 'light',
  });

  const handleProfileSave = () => {
    // TODO: Implement profile update API call
    console.log('Saving profile:', profileForm);
  };

  const handlePasswordChange = () => {
    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      alert('Passwords do not match!');
      return;
    }
    // TODO: Implement password change API call
    console.log('Changing password');
  };

  const handleNotificationsSave = () => {
    // TODO: Implement notifications update API call
    console.log('Saving notifications:', notifications);
  };

  const handlePreferencesSave = () => {
    // TODO: Implement preferences update API call
    console.log('Saving preferences:', preferences);
  };

  const tabs = [
    { id: 'profile', label: 'Profile', icon: User },
    { id: 'account', label: 'Account', icon: Lock },
    { id: 'notifications', label: 'Notifications', icon: Bell },
    { id: 'preferences', label: 'Preferences', icon: Globe },
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

            <div className="flex items-center gap-6 mb-6 pb-6 border-b border-gray-100">
              <img
                src={currentUser?.avatar}
                alt={currentUser?.name}
                className="w-20 h-20 rounded-full border-4 border-white shadow-md"
              />
              <div>
                <h3 className="font-semibold text-gray-900">{currentUser?.name}</h3>
                <p className="text-sm text-gray-500">{currentUser?.email}</p>
                <Button variant="ghost" className="mt-2 text-sm">
                  Change Avatar
                </Button>
              </div>
            </div>

            <div className="space-y-4">
              <Input
                label="Display Name"
                type="text"
                value={profileForm.name}
                onChange={(e) => setProfileForm({ ...profileForm, name: e.target.value })}
                placeholder="Your name"
              />

              <Input
                label="Email Address"
                type="email"
                value={profileForm.email}
                onChange={(e) => setProfileForm({ ...profileForm, email: e.target.value })}
                placeholder="your.email@example.com"
              />

              <div className="pt-4">
                <Button onClick={handleProfileSave}>
                  Save Changes
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
              <Input
                label="Current Password"
                type="password"
                value={passwordForm.currentPassword}
                onChange={(e) => setPasswordForm({ ...passwordForm, currentPassword: e.target.value })}
                placeholder="Enter current password"
              />

              <Input
                label="New Password"
                type="password"
                value={passwordForm.newPassword}
                onChange={(e) => setPasswordForm({ ...passwordForm, newPassword: e.target.value })}
                placeholder="Enter new password"
              />

              <Input
                label="Confirm New Password"
                type="password"
                value={passwordForm.confirmPassword}
                onChange={(e) => setPasswordForm({ ...passwordForm, confirmPassword: e.target.value })}
                placeholder="Confirm new password"
              />

              <div className="pt-4 flex gap-3">
                <Button onClick={handlePasswordChange}>
                  Update Password
                </Button>
                <Button
                  variant="secondary"
                  onClick={() => setPasswordForm({ currentPassword: '', newPassword: '', confirmPassword: '' })}
                >
                  Cancel
                </Button>
              </div>
            </div>

            <div className="mt-8 pt-8 border-t border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Danger Zone</h3>
              <p className="text-sm text-gray-600 mb-4">
                Once you delete your account, there is no going back. Please be certain.
              </p>
              <Button variant="danger">
                Delete Account
              </Button>
            </div>
          </Card>
        )}

        {/* Notifications Tab */}
        {activeTab === 'notifications' && (
          <Card className="p-6">
            <h2 className="text-xl font-bold text-gray-900 mb-6">Notification Preferences</h2>

            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-medium text-gray-900">Email - New Expenses</h3>
                  <p className="text-sm text-gray-500">Get notified when someone adds a new expense</p>
                </div>
                <label className="relative inline-block w-12 h-6">
                  <input
                    type="checkbox"
                    checked={notifications.emailExpenses}
                    onChange={(e) => setNotifications({ ...notifications, emailExpenses: e.target.checked })}
                    className="sr-only peer"
                  />
                  <div className="w-12 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-teal-500 rounded-full peer peer-checked:after:translate-x-6 peer-checked:bg-teal-600 after:content-[''] after:absolute after:top-0.5 after:left-0.5 after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all"></div>
                </label>
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-medium text-gray-900">Email - Payments</h3>
                  <p className="text-sm text-gray-500">Get notified when someone settles up</p>
                </div>
                <label className="relative inline-block w-12 h-6">
                  <input
                    type="checkbox"
                    checked={notifications.emailPayments}
                    onChange={(e) => setNotifications({ ...notifications, emailPayments: e.target.checked })}
                    className="sr-only peer"
                  />
                  <div className="w-12 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-teal-500 rounded-full peer peer-checked:after:translate-x-6 peer-checked:bg-teal-600 after:content-[''] after:absolute after:top-0.5 after:left-0.5 after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all"></div>
                </label>
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-medium text-gray-900">Email - Reminders</h3>
                  <p className="text-sm text-gray-500">Get weekly reminders about pending balances</p>
                </div>
                <label className="relative inline-block w-12 h-6">
                  <input
                    type="checkbox"
                    checked={notifications.emailReminders}
                    onChange={(e) => setNotifications({ ...notifications, emailReminders: e.target.checked })}
                    className="sr-only peer"
                  />
                  <div className="w-12 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-teal-500 rounded-full peer peer-checked:after:translate-x-6 peer-checked:bg-teal-600 after:content-[''] after:absolute after:top-0.5 after:left-0.5 after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all"></div>
                </label>
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-medium text-gray-900">Push Notifications</h3>
                  <p className="text-sm text-gray-500">Receive push notifications in your browser</p>
                </div>
                <label className="relative inline-block w-12 h-6">
                  <input
                    type="checkbox"
                    checked={notifications.pushNotifications}
                    onChange={(e) => setNotifications({ ...notifications, pushNotifications: e.target.checked })}
                    className="sr-only peer"
                  />
                  <div className="w-12 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-teal-500 rounded-full peer peer-checked:after:translate-x-6 peer-checked:bg-teal-600 after:content-[''] after:absolute after:top-0.5 after:left-0.5 after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all"></div>
                </label>
              </div>

              <div className="pt-4">
                <Button onClick={handleNotificationsSave}>
                  Save Preferences
                </Button>
              </div>
            </div>
          </Card>
        )}

        {/* Preferences Tab */}
        {activeTab === 'preferences' && (
          <Card className="p-6">
            <h2 className="text-xl font-bold text-gray-900 mb-6">App Preferences</h2>

            <div className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  <Globe className="w-4 h-4 inline mr-2" />
                  Language
                </label>
                <select
                  value={preferences.language}
                  onChange={(e) => setPreferences({ ...preferences, language: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-teal-500 outline-none transition-colors"
                >
                  <option value="en">English</option>
                  <option value="tr">Türkçe</option>
                  <option value="es">Español</option>
                  <option value="fr">Français</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  <Mail className="w-4 h-4 inline mr-2" />
                  Default Currency
                </label>
                <select
                  value={preferences.currency}
                  onChange={(e) => setPreferences({ ...preferences, currency: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-teal-500 outline-none transition-colors"
                >
                  <option value="USD">USD - US Dollar</option>
                  <option value="EUR">EUR - Euro</option>
                  <option value="GBP">GBP - British Pound</option>
                  <option value="TRY">TRY - Turkish Lira</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  <Palette className="w-4 h-4 inline mr-2" />
                  Theme
                </label>
                <div className="flex gap-3">
                  <button
                    onClick={() => setPreferences({ ...preferences, theme: 'light' })}
                    className={`flex-1 px-4 py-3 rounded-lg border-2 transition-all ${preferences.theme === 'light'
                        ? 'border-teal-600 bg-teal-50'
                        : 'border-gray-200 bg-white hover:border-gray-300'
                      }`}
                  >
                    <div className="text-center">
                      <div className="text-2xl mb-1">☀️</div>
                      <div className="text-sm font-medium">Light</div>
                    </div>
                  </button>
                  <button
                    onClick={() => setPreferences({ ...preferences, theme: 'dark' })}
                    className={`flex-1 px-4 py-3 rounded-lg border-2 transition-all ${preferences.theme === 'dark'
                        ? 'border-teal-600 bg-teal-50'
                        : 'border-gray-200 bg-white hover:border-gray-300'
                      }`}
                  >
                    <div className="text-center">
                      <div className="text-2xl mb-1">🌙</div>
                      <div className="text-sm font-medium">Dark</div>
                    </div>
                  </button>
                  <button
                    onClick={() => setPreferences({ ...preferences, theme: 'auto' })}
                    className={`flex-1 px-4 py-3 rounded-lg border-2 transition-all ${preferences.theme === 'auto'
                        ? 'border-teal-600 bg-teal-50'
                        : 'border-gray-200 bg-white hover:border-gray-300'
                      }`}
                  >
                    <div className="text-center">
                      <div className="text-2xl mb-1">🔄</div>
                      <div className="text-sm font-medium">Auto</div>
                    </div>
                  </button>
                </div>
              </div>

              <div className="pt-4">
                <Button onClick={handlePreferencesSave}>
                  Save Preferences
                </Button>
              </div>
            </div>
          </Card>
        )}
      </div>
    </>
  );
}

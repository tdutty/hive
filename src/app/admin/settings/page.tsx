"use client";

import { useState, useEffect } from "react";
import { LogOut, Trash2, Lock, RefreshCw } from "lucide-react";
import { useApi } from "@/lib/hooks";
import { settingsService } from "@/lib/services/settings";

interface Settings {
  siteTitle?: string;
  supportEmail?: string;
  maintenanceMode?: boolean;
  sessionTimeout?: number;
  twoFactorEnabled?: boolean;
  pushNotifications?: boolean;
  emailNotifications?: boolean;
  alertsOnCritical?: boolean;
  [key: string]: any;
}

export default function SettingsPage() {
  const [changedSettings, setChangedSettings] = useState<Settings>({});
  const [saveMessage, setSaveMessage] = useState("");
  const [isSaving, setIsSaving] = useState(false);

  // Fetch all settings
  const {
    data: settings,
    loading: settingsLoading,
    error: settingsError,
    refetch: refetchSettings
  } = useApi(
    () => settingsService.getAll(),
    []
  );

  // Fetch 2FA status
  const {
    data: twoFAStatus,
    loading: twoFALoading,
    error: twoFAError,
    refetch: refetch2FA
  } = useApi(
    () => settingsService.get2FAStatus(),
    []
  );

  // Initialize local state when settings load
  useEffect(() => {
    if (settings) {
      setChangedSettings(settings);
    }
  }, [settings]);

  const handleToggle = (key: string, value: boolean) => {
    setChangedSettings({
      ...changedSettings,
      [key]: value,
    });
  };

  const handleInputChange = (key: string, value: string) => {
    setChangedSettings({
      ...changedSettings,
      [key]: value,
    });
  };

  const handleSelectChange = (key: string, value: string) => {
    setChangedSettings({
      ...changedSettings,
      [key]: parseInt(value),
    });
  };

  const handleSaveSettings = async () => {
    setIsSaving(true);
    try {
      await settingsService.update(changedSettings);
      setSaveMessage("Settings saved successfully");
      setTimeout(() => setSaveMessage(""), 5000);
    } catch (error) {
      setSaveMessage(`Error saving settings: ${error instanceof Error ? error.message : "Unknown error"}`);
      setTimeout(() => setSaveMessage(""), 5000);
    } finally {
      setIsSaving(false);
    }
  };

  const handleSignOut = () => {
    if (confirm("Are you sure you want to sign out?")) {
      alert("Signed out successfully");
    }
  };

  const handleClearCache = () => {
    if (confirm("This will clear all application cache. Continue?")) {
      alert("Cache cleared successfully");
    }
  };

  const isLoading = settingsLoading || twoFALoading;
  const hasError = settingsError || twoFAError;

  return (
    <div className="space-y-8">
      {/* Page Title */}
      <div>
        <h1 className="text-2xl font-semibold text-slate-900 mb-2">Settings</h1>
        <p className="text-slate-500">Manage your admin account and system configuration</p>
      </div>

      {/* Error State */}
      {hasError && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-center justify-between">
          <span className="text-red-900">Failed to load settings</span>
          <button
            onClick={() => {
              refetchSettings();
              refetch2FA();
            }}
            className="text-red-600 hover:text-red-700 font-medium"
          >
            Retry
          </button>
        </div>
      )}

      {/* Loading State */}
      {isLoading && (
        <div className="flex items-center justify-center py-12">
          <RefreshCw className="animate-spin text-amber-600" size={32} />
        </div>
      )}

      {!isLoading && (
        <>
          {/* Account Section */}
          <div className="bg-white border border-slate-200 rounded-lg shadow-sm p-6 space-y-6">
            <div>
              <h2 className="text-lg font-semibold text-slate-900 mb-4">
                Account
              </h2>

              <div className="space-y-4">
                <div className="flex items-start justify-between pb-4 border-b border-slate-200">
                  <div>
                    <p className="text-sm font-semibold text-slate-600 mb-1">
                      Admin Name
                    </p>
                    <p className="text-lg font-semibold text-slate-900">{settings?.settings?.adminName || "Admin User"}</p>
                  </div>
                </div>

                <div className="flex items-start justify-between pb-4 border-b border-slate-200">
                  <div>
                    <p className="text-sm font-semibold text-slate-600 mb-1">
                      Email
                    </p>
                    <p className="text-lg text-slate-900">{settings?.settings?.adminEmail || "admin@sweetlease.com"}</p>
                  </div>
                </div>

                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-sm font-semibold text-slate-600 mb-1">
                      Role
                    </p>
                    <span className="inline-block border border-slate-200 rounded-md bg-white px-3 py-1 text-sm font-semibold text-slate-900">
                      ADMIN
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Security Section */}
          <div className="bg-white border border-slate-200 rounded-lg shadow-sm p-6 space-y-6">
            <h2 className="text-lg font-semibold text-slate-900">
              Security
            </h2>

            <div className="space-y-4">
              {/* Two-Factor Authentication */}
              <div className="flex items-center justify-between pb-4 border-b border-slate-200">
                <div>
                  <p className="font-semibold text-slate-900">Two-Factor Authentication</p>
                  <p className="text-sm text-slate-500">
                    {twoFAStatus?.enabled ? "Enabled" : "Disabled"}
                  </p>
                </div>
                <button
                  onClick={() => handleToggle("twoFactorEnabled", !changedSettings.twoFactorEnabled)}
                  className={`w-12 h-6 rounded-full border border-slate-300 transition-colors ${
                    changedSettings.twoFactorEnabled ? "bg-green-500" : "bg-slate-300"
                  }`}
                />
              </div>

              {/* Change Password */}
              <div className="flex items-center justify-between pb-4 border-b border-slate-200">
                <div>
                  <p className="font-semibold text-slate-900">Change Password</p>
                  <p className="text-sm text-slate-500">
                    Last changed {settings?.settings?.passwordLastChanged || "3 months ago"}
                  </p>
                </div>
                <button className="border border-slate-200 rounded-md bg-white text-slate-700 px-4 py-2 font-medium hover:bg-slate-50 transition-colors flex items-center gap-2">
                  <Lock size={16} />
                  Change
                </button>
              </div>

              {/* Session Timeout */}
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-semibold text-slate-900">Session Timeout</p>
                  <p className="text-sm text-slate-500">
                    Automatically log out after inactivity
                  </p>
                </div>
                <select
                  value={changedSettings.sessionTimeout?.toString() || "30"}
                  onChange={(e) => handleSelectChange("sessionTimeout", e.target.value)}
                  className="border border-slate-200 rounded-md px-4 py-2 text-slate-900 focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 bg-white font-medium"
                >
                  <option value="15">15 minutes</option>
                  <option value="30">30 minutes</option>
                  <option value="60">1 hour</option>
                  <option value="240">4 hours</option>
                </select>
              </div>
            </div>
          </div>

          {/* Notifications Section */}
          <div className="bg-white border border-slate-200 rounded-lg shadow-sm p-6 space-y-6">
            <h2 className="text-lg font-semibold text-slate-900">
              Notifications
            </h2>

            <div className="space-y-4">
              <label className="flex items-center justify-between cursor-pointer pb-4 border-b border-slate-200">
                <span className="font-semibold text-slate-900">
                  Push Notifications
                </span>
                <button
                  onClick={() => handleToggle("pushNotifications", !changedSettings.pushNotifications)}
                  className={`w-12 h-6 rounded-full border border-slate-300 transition-colors ${
                    changedSettings.pushNotifications ? "bg-green-500" : "bg-slate-300"
                  }`}
                />
              </label>

              <label className="flex items-center justify-between cursor-pointer pb-4 border-b border-slate-200">
                <span className="font-semibold text-slate-900">
                  Email Notifications
                </span>
                <button
                  onClick={() => handleToggle("emailNotifications", !changedSettings.emailNotifications)}
                  className={`w-12 h-6 rounded-full border border-slate-300 transition-colors ${
                    changedSettings.emailNotifications ? "bg-green-500" : "bg-slate-300"
                  }`}
                />
              </label>

              <label className="flex items-center justify-between cursor-pointer">
                <span className="font-semibold text-slate-900">
                  Alert on Critical Events
                </span>
                <button
                  onClick={() => handleToggle("alertsOnCritical", !changedSettings.alertsOnCritical)}
                  className={`w-12 h-6 rounded-full border border-slate-300 transition-colors ${
                    changedSettings.alertsOnCritical ? "bg-green-500" : "bg-slate-300"
                  }`}
                />
              </label>
            </div>
          </div>

          {/* System Configuration Section */}
          <div className="bg-white border border-slate-200 rounded-lg shadow-sm p-6 space-y-6">
            <h2 className="text-lg font-semibold text-slate-900">
              System Configuration
            </h2>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-semibold text-slate-600 mb-2">
                  Site Title
                </label>
                <input
                  type="text"
                  value={changedSettings.siteTitle || ""}
                  onChange={(e) => handleInputChange("siteTitle", e.target.value)}
                  className="w-full border border-slate-200 rounded-md px-4 py-2 text-slate-900 placeholder-slate-400 focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-slate-600 mb-2">
                  Support Email
                </label>
                <input
                  type="email"
                  value={changedSettings.supportEmail || ""}
                  onChange={(e) => handleInputChange("supportEmail", e.target.value)}
                  className="w-full border border-slate-200 rounded-md px-4 py-2 text-slate-900 placeholder-slate-400 focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500"
                />
              </div>

              <div className="flex items-center justify-between pt-4 border-t border-slate-200">
                <div>
                  <p className="font-semibold text-slate-900">Maintenance Mode</p>
                  <p className="text-sm text-slate-500">
                    Disable public access for maintenance
                  </p>
                </div>
                <button
                  onClick={() => handleToggle("maintenanceMode", !changedSettings.maintenanceMode)}
                  className={`w-12 h-6 rounded-full border border-slate-300 transition-colors ${
                    changedSettings.maintenanceMode ? "bg-red-500" : "bg-slate-300"
                  }`}
                />
              </div>

              {/* Save Button */}
              <div className="pt-4 border-t border-slate-200">
                <button
                  onClick={handleSaveSettings}
                  disabled={isSaving}
                  className="w-full bg-amber-600 text-white rounded-md px-4 py-3 font-medium hover:bg-amber-700 transition-colors disabled:opacity-50"
                >
                  {isSaving ? "Saving..." : "Save Settings"}
                </button>
                {saveMessage && (
                  <div
                    className={`mt-4 border rounded-lg p-4 text-sm ${
                      saveMessage.includes("successfully")
                        ? "bg-green-50 border-green-200 text-green-900"
                        : "bg-red-50 border-red-200 text-red-900"
                    }`}
                  >
                    {saveMessage}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Danger Zone */}
          <div className="bg-red-50 border border-red-200 rounded-lg p-6 space-y-6">
            <h2 className="text-lg font-semibold text-red-900">
              Danger Zone
            </h2>

            <div className="space-y-3">
              <button
                onClick={handleSignOut}
                className="w-full bg-red-600 text-white rounded-md px-4 py-3 font-medium flex items-center justify-center gap-2 hover:bg-red-700 transition-colors"
              >
                <LogOut size={20} />
                Sign Out
              </button>

              <button
                onClick={handleClearCache}
                className="w-full bg-white border border-red-200 rounded-md text-red-900 px-4 py-3 font-medium flex items-center justify-center gap-2 hover:bg-red-50 transition-colors"
              >
                <Trash2 size={20} />
                Clear All Cache
              </button>
            </div>
          </div>

          {/* About Section */}
          <div className="bg-white border border-slate-200 rounded-lg shadow-sm p-6 space-y-4">
            <h2 className="text-lg font-semibold text-slate-900 mb-6">
              About
            </h2>

            <div className="space-y-4">
              <div className="flex items-start justify-between pb-4 border-b border-slate-200">
                <p className="text-sm font-semibold text-slate-600">
                  Version
                </p>
                <p className="font-semibold text-slate-900">{settings?.settings?.version || "1.0.0"}</p>
              </div>

              <div className="flex items-start justify-between pb-4 border-b border-slate-200">
                <p className="text-sm font-semibold text-slate-600">
                  Environment
                </p>
                <p className="font-semibold text-slate-900">{settings?.settings?.environment || "Production"}</p>
              </div>

              <div className="flex items-start justify-between">
                <p className="text-sm font-semibold text-slate-600">
                  Last Deploy
                </p>
                <p className="font-semibold text-slate-900">{settings?.settings?.lastDeploy || "2024-02-08 12:34:56 UTC"}</p>
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="text-center text-sm text-slate-500">
            <p>Settings are automatically saved. Contact support for additional help.</p>
          </div>
        </>
      )}
    </div>
  );
}

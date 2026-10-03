"use client";

import { useState, useEffect } from "react";
import { LogOut, Lock } from "lucide-react";
import { signOut } from "next-auth/react";
import { useConfirm } from "@/components/ui/ConfirmDialog";
import { ErrorBanner, Spinner } from "@/components/ui/AsyncState";
import { Button, Card, CardHeader, CardBody, Badge, statusTone, PageHeader, Field, Input, Select } from "@/components/kit";
import { useApi } from "@/lib/hooks";
import { settingsService } from "@/lib/services/settings";
import { cn } from "@/lib/utils";

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

/** Accessible on/off switch. The kit has no switch yet, so this stays local to settings. */
function Toggle({ checked, onChange, label, danger }: { checked: boolean; onChange: (v: boolean) => void; label: string; danger?: boolean }) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={label}
      onClick={() => onChange(!checked)}
      className={cn(
        "relative inline-flex h-5 w-9 shrink-0 items-center rounded-full transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-500 focus-visible:ring-offset-1",
        checked ? (danger ? "bg-red-600" : "bg-amber-600") : "bg-slate-300"
      )}
    >
      <span className={cn("inline-block h-4 w-4 rounded-full bg-white transition-transform", checked ? "translate-x-4" : "translate-x-0.5")} aria-hidden />
    </button>
  );
}

function Row({ title, description, children, last }: { title: string; description?: string; children?: React.ReactNode; last?: boolean }) {
  return (
    <div className={cn("flex items-center justify-between gap-4 py-3", !last && "border-b border-slate-200")}>
      <div className="min-w-0">
        <p className="text-sm font-medium text-slate-900">{title}</p>
        {description && <p className="text-xs text-slate-500 mt-0.5">{description}</p>}
      </div>
      {children && <div className="shrink-0">{children}</div>}
    </div>
  );
}

export default function SettingsPage() {
  const { confirm, dialog } = useConfirm();
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
      // the API returns { success, settings }; edit the inner object only
      setChangedSettings(((settings as any).settings ?? {}) as Settings);
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

  const handleSignOut = async () => {
    if (!(await confirm({ title: "Sign out of Hive?", confirmLabel: "Sign out", danger: true }))) return;
    await signOut({ callbackUrl: "/login" });
  };

  // Listing source: ALN (licensed) vs. the old scraped import (Locust/Zillow). Saves immediately.
  const SCRAPED_KEY = "listings.scrapedImport";
  const scrapedOn = changedSettings[SCRAPED_KEY] === true || changedSettings[SCRAPED_KEY] === "true";
  const [sourceSaving, setSourceSaving] = useState(false);
  const setScrapedImport = async (on: boolean) => {
    if (on && !(await confirm({ title: "Turn scraped listing import back on?", message: "Signups and new searches will start Locust scraping again, scraped listings will be imported, and approval emails will resume.", confirmLabel: "Turn on", danger: true }))) return;
    setSourceSaving(true);
    try {
      await settingsService.update({ [SCRAPED_KEY]: on });
      setChangedSettings(prev => ({ ...prev, [SCRAPED_KEY]: on }));
      setSaveMessage(on ? "Scraped listing import is ON" : "Scraped listing import is OFF (ALN)");
    } catch (error) {
      setSaveMessage(`Error saving listing source: ${error instanceof Error ? error.message : "Unknown error"}`);
    } finally {
      setSourceSaving(false);
      setTimeout(() => setSaveMessage(""), 5000);
    }
  };

  // Automatic landlord outreach (demand-bundling emails to listing owners). Saves immediately.
  const LANDLORD_KEY = "outreach.landlordAuto";
  const landlordOn = changedSettings[LANDLORD_KEY] === true || changedSettings[LANDLORD_KEY] === "true";
  const setLandlordOutreach = async (on: boolean) => {
    if (on && !(await confirm({ title: "Turn automatic landlord outreach back on?", message: "When tenants pick listings, landlords will be emailed automatically again, and tenants will be told we're negotiating with offers in 2-3 business days.", confirmLabel: "Turn on", danger: true }))) return;
    setSourceSaving(true);
    try {
      await settingsService.update({ [LANDLORD_KEY]: on });
      setChangedSettings(prev => ({ ...prev, [LANDLORD_KEY]: on }));
      setSaveMessage(on ? "Automatic landlord outreach is ON" : "Automatic landlord outreach is OFF");
    } catch (error) {
      setSaveMessage(`Error saving landlord outreach: ${error instanceof Error ? error.message : "Unknown error"}`);
    } finally {
      setSourceSaving(false);
      setTimeout(() => setSaveMessage(""), 5000);
    }
  };

  const isLoading = settingsLoading || twoFALoading;
  const hasError = settingsError || twoFAError;

  return (
    <div className="max-w-3xl">
      {dialog}
      <PageHeader title="Settings" description="Manage your admin account and system configuration" />

      {/* Error State */}
      {hasError && (
        <ErrorBanner
          className="mb-5"
          message="Failed to load settings"
          onRetry={() => {
            refetchSettings();
            refetch2FA();
          }}
        />
      )}

      {/* Loading State */}
      {isLoading && <Spinner label="Loading settings" />}

      {!isLoading && (
        <div className="space-y-5">
          {/* Account Section */}
          <Card>
            <CardHeader title="Account" />
            <CardBody className="pt-1 pb-1">
              <Row title="Admin Name" description={settings?.settings?.adminName || "Admin User"} />
              <Row title="Email" description={settings?.settings?.adminEmail || "admin@sweetlease.com"} />
              <Row title="Role" last>
                <Badge tone={statusTone("ADMIN")}>ADMIN</Badge>
              </Row>
            </CardBody>
          </Card>

          {/* Security Section */}
          <Card>
            <CardHeader title="Security" />
            <CardBody className="pt-1 pb-1">
              <Row title="Two-Factor Authentication" description={twoFAStatus?.enabled ? "Enabled" : "Disabled"}>
                <Toggle label="Two-Factor Authentication" checked={!!changedSettings.twoFactorEnabled} onChange={(v) => handleToggle("twoFactorEnabled", v)} />
              </Row>
              <Row title="Change Password" description={`Last changed ${settings?.settings?.passwordLastChanged || "3 months ago"}`}>
                <Button size="sm" icon={<Lock size={14} />}>Change</Button>
              </Row>
              <Row title="Session Timeout" description="Automatically log out after inactivity" last>
                <Select
                  aria-label="Session timeout"
                  className="w-auto"
                  value={changedSettings.sessionTimeout?.toString() || "30"}
                  onChange={(e) => handleSelectChange("sessionTimeout", e.target.value)}
                >
                  <option value="15">15 minutes</option>
                  <option value="30">30 minutes</option>
                  <option value="60">1 hour</option>
                  <option value="240">4 hours</option>
                </Select>
              </Row>
            </CardBody>
          </Card>

          {/* Notifications Section */}
          <Card>
            <CardHeader title="Notifications" />
            <CardBody className="pt-1 pb-1">
              <Row title="Push Notifications">
                <Toggle label="Push Notifications" checked={!!changedSettings.pushNotifications} onChange={(v) => handleToggle("pushNotifications", v)} />
              </Row>
              <Row title="Email Notifications">
                <Toggle label="Email Notifications" checked={!!changedSettings.emailNotifications} onChange={(v) => handleToggle("emailNotifications", v)} />
              </Row>
              <Row title="Alert on Critical Events" last>
                <Toggle label="Alert on Critical Events" checked={!!changedSettings.alertsOnCritical} onChange={(v) => handleToggle("alertsOnCritical", v)} />
              </Row>
            </CardBody>
          </Card>

          {/* Listing Source */}
          <Card>
            <CardHeader title="Listings & Outreach" />
            <CardBody className="pt-1 pb-1">
              <Row title="Scraped listing import" description={scrapedOn ? "ON: signups and new searches run Locust scraping, and scraped listings are imported and sent for approval." : "OFF: listings come from ALN. No Locust searches, scraped imports, photo backfill or approval emails."}>
                <Toggle label="Scraped listing import" checked={scrapedOn} danger onChange={(v) => { if (!sourceSaving) setScrapedImport(v); }} />
              </Row>
              <Row title="Automatic landlord outreach" description={landlordOn ? "ON: when tenants pick listings, Locust emails those landlords automatically." : "OFF: no automatic emails to landlords. Onboarded PM partners still get tenant-interest notices."} last>
                <Toggle label="Automatic landlord outreach" checked={landlordOn} danger onChange={(v) => { if (!sourceSaving) setLandlordOutreach(v); }} />
              </Row>
            </CardBody>
          </Card>

          {/* System Configuration Section */}
          <Card>
            <CardHeader title="System Configuration" />
            <CardBody className="space-y-4">
              <Field label="Site Title">
                <Input
                  type="text"
                  value={changedSettings.siteTitle || ""}
                  onChange={(e) => handleInputChange("siteTitle", e.target.value)}
                />
              </Field>

              <Field label="Support Email">
                <Input
                  type="email"
                  value={changedSettings.supportEmail || ""}
                  onChange={(e) => handleInputChange("supportEmail", e.target.value)}
                />
              </Field>

              <div className="border-t border-slate-200">
                <Row title="Maintenance Mode" description="Disable public access for maintenance" last>
                  <Toggle label="Maintenance Mode" danger checked={!!changedSettings.maintenanceMode} onChange={(v) => handleToggle("maintenanceMode", v)} />
                </Row>
              </div>

              {/* Save Button */}
              <div className="pt-4 border-t border-slate-200 space-y-3">
                <Button variant="primary" className="w-full" onClick={handleSaveSettings} loading={isSaving}>
                  {isSaving ? "Saving..." : "Save Settings"}
                </Button>
                {saveMessage && (
                  saveMessage.includes("successfully") ? (
                    <div role="status" className="rounded-sm border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-800">{saveMessage}</div>
                  ) : (
                    <ErrorBanner message={saveMessage} />
                  )
                )}
              </div>
            </CardBody>
          </Card>

          {/* Danger Zone */}
          <Card className="border-red-200">
            <CardHeader title={<span className="text-red-900">Danger Zone</span>} />
            <CardBody>
              <Button variant="danger" className="w-full" icon={<LogOut size={14} />} onClick={handleSignOut}>
                Sign Out
              </Button>
            </CardBody>
          </Card>

          {/* About Section */}
          <Card>
            <CardHeader title="About" />
            <CardBody className="pt-1 pb-1">
              <dl>
                <div className="flex justify-between items-center gap-4 py-3 border-b border-slate-200">
                  <dt className="text-sm text-slate-600">Version</dt>
                  <dd className="text-sm font-medium text-slate-900 tabular">{settings?.settings?.version || "1.0.0"}</dd>
                </div>
                <div className="flex justify-between items-center gap-4 py-3 border-b border-slate-200">
                  <dt className="text-sm text-slate-600">Environment</dt>
                  <dd className="text-sm font-medium text-slate-900">{settings?.settings?.environment || "Production"}</dd>
                </div>
                <div className="flex justify-between items-center gap-4 py-3">
                  <dt className="text-sm text-slate-600">Last Deploy</dt>
                  <dd className="text-sm font-medium text-slate-900 tabular">{settings?.settings?.lastDeploy || "2024-02-08 12:34:56 UTC"}</dd>
                </div>
              </dl>
            </CardBody>
          </Card>

          {/* Footer */}
          <p className="text-center text-sm text-slate-500">Settings are automatically saved. Contact support for additional help.</p>
        </div>
      )}
    </div>
  );
}

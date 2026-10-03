"use client";

import { useState } from "react";
import { Users, UserCheck, Clock, CheckCircle, XCircle } from "lucide-react";
import { useApi } from "@/lib/hooks";
import { dashboardService } from "@/lib/services/dashboard";
import { usersService } from "@/lib/services/users";
import { Button, Card, CardHeader, CardBody, Badge, statusTone, StatTile, PageHeader, FilterChips, Table, THead, TH, TBody, TR, TD, Input } from "@/components/kit";
import { ErrorBanner, Spinner, EmptyState } from "@/components/ui/AsyncState";
import { formatDate } from "@/lib/utils";

type RoleFilter = "all" | "tenants" | "landlords" | "admins";
const ROLE_CHIPS: { key: RoleFilter; label: string }[] = [
  { key: "all", label: "All Users" },
  { key: "tenants", label: "Tenants" },
  { key: "landlords", label: "Landlords" },
  { key: "admins", label: "Admins" },
];

export default function UsersPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [roleFilter, setRoleFilter] = useState<RoleFilter>("all");
  const [selectedUser, setSelectedUser] = useState<any | null>(null);

  // Fetch dashboard metrics for user counts
  const { data: metricsData, loading: metricsLoading, error: metricsError, refetch: refetchMetrics } = useApi(() =>
    dashboardService.getMetrics()
  );

  // Fetch role changes for the table
  const { data: roleData, loading: roleLoading, error: roleError, refetch: refetchRoles } = useApi(() =>
    usersService.getRoleChanges({ limit: 50 })
  );

  // Fetch waitlist (actual users)
  const { data: waitlistData, loading: waitlistLoading, error: waitlistError, refetch: refetchWaitlist } = useApi(() =>
    usersService.getWaitlist({ limit: 100 })
  );

  const loading = metricsLoading || roleLoading || waitlistLoading;
  const error = metricsError || roleError || waitlistError;
  const retryAll = () => { refetchMetrics(); refetchRoles(); refetchWaitlist(); };

  if (loading) return <div><PageHeader title="User Management" /><Spinner /></div>;
  if (error) return <div><PageHeader title="User Management" /><ErrorBanner message={error} onRetry={retryAll} /></div>;

  // Extract metrics from dashboard
  const businessMetrics = metricsData?.businessMetrics || {};
  const totalUsers = businessMetrics.totalUsers || 0;
  const activeUsers24h = businessMetrics.activeUsers24h || 0;
  const completedOnboarding = businessMetrics.completedOnboarding || 0;
  const pendingVerification = businessMetrics.pendingVerification || 0;

  // Extract role changes for table
  const roleChanges = roleData?.roleChanges || [];

  // Extract waitlist entries as users
  const waitlistEntries = (waitlistData?.entries || []).map((e: any) => ({
    id: e.id,
    userName: e.name,
    userEmail: e.email,
    newRole: 'USER',
    status: e.status,
    organization: e.organization,
    createdAt: e.createdAt,
    source: 'waitlist',
  }));

  // Combine role changes and waitlist entries
  const allUsers = [...waitlistEntries, ...roleChanges.map((c: any) => ({ ...c, source: 'role_change' }))];

  // Filter based on search and role filter
  const filteredUsers = allUsers.filter((user: any) => {
    const matchesSearch =
      !searchQuery ||
      (user.userName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        user.userEmail?.toLowerCase().includes(searchQuery.toLowerCase())) || false;
    const matchesRole =
      roleFilter === "all" ||
      (roleFilter === "tenants" && user.newRole === "USER") ||
      (roleFilter === "landlords" && user.newRole === "LANDLORD") ||
      (roleFilter === "admins" && user.newRole === "ADMIN");
    return matchesSearch && matchesRole;
  });

  const openUser = (row: any) => {
    setSelectedUser(row);
    setTimeout(() => document.getElementById('user-detail')?.scrollIntoView({ behavior: 'smooth' }), 100);
  };

  const checklist = selectedUser ? [
    { label: "ID Verified", checked: selectedUser.verified },
    { label: "Background Check", checked: selectedUser.verified },
    { label: "Salary Verified", checked: selectedUser.verified && selectedUser.newRole === "USER" },
    { label: "Credit Verified", checked: selectedUser.verified && selectedUser.newRole === "USER" },
  ] : [];

  return (
    <div className="max-w-7xl">
      <PageHeader title="User Management" description="Manage and monitor user accounts and permissions" />

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-5">
        <StatTile label="Total Users" value={totalUsers} hint="All registered users" icon={<Users size={14} />} />
        <StatTile label="Active (24h)" value={activeUsers24h} hint="Activity is not tracked yet: this counts accounts created in the last 24h" icon={<UserCheck size={14} />} />
        <StatTile label="Completed Onboarding" value={completedOnboarding} hint={`${totalUsers > 0 ? Math.round((completedOnboarding / totalUsers) * 100) : 0}% verified`} icon={<CheckCircle size={14} />} />
        <StatTile label="Pending Verification" value={pendingVerification} hint="Awaiting documents" icon={<Clock size={14} />} />
      </div>

      <div className="flex flex-col sm:flex-row sm:items-center gap-3 mb-4">
        <Input
          type="search"
          aria-label="Search users"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Search by name or email..."
          className="sm:max-w-xs"
        />
        <FilterChips items={ROLE_CHIPS} value={roleFilter} onChange={setRoleFilter} />
      </div>

      <Card className="mb-5">
        <CardHeader title={`Users (${filteredUsers.length})`} />
        {filteredUsers.length === 0 ? (
          <EmptyState title="No users found matching your criteria" />
        ) : (
          <Table>
            <THead>
              <tr>
                <TH>Name</TH>
                <TH>Email</TH>
                <TH>Role</TH>
                <TH>Verified</TH>
                <TH>Created</TH>
                <TH>Last Updated</TH>
                <TH>Actions</TH>
              </tr>
            </THead>
            <TBody>
              {filteredUsers.map((u: any, i: number) => (
                <TR key={`${u.source}-${u.id ?? i}`} clickable selected={!!selectedUser && selectedUser.source === u.source && selectedUser.id === u.id} onClick={() => setSelectedUser(u)}>
                  <TD className="font-medium">{u.userName || "-"}</TD>
                  <TD muted>{u.userEmail || "-"}</TD>
                  <TD><Badge tone={statusTone(u.newRole)} dot>{u.newRole}</Badge></TD>
                  <TD>
                    {u.verified ? (
                      <CheckCircle size={16} className="text-emerald-600" aria-label="Verified" />
                    ) : (
                      <XCircle size={16} className="text-red-600" aria-label="Not verified" />
                    )}
                  </TD>
                  <TD muted className="tabular whitespace-nowrap">{formatDate(u.createdAt)}</TD>
                  <TD muted className="tabular whitespace-nowrap">{formatDate(u.changedAt)}</TD>
                  <TD>
                    <Button size="sm" onClick={(e) => { e.stopPropagation(); openUser(u); }}>View</Button>
                  </TD>
                </TR>
              ))}
            </TBody>
          </Table>
        )}
      </Card>

      {selectedUser && (
        <Card id="user-detail">
          <CardHeader
            title={selectedUser.userName}
            description={selectedUser.userEmail}
            actions={<Button size="sm" variant="ghost" onClick={() => setSelectedUser(null)}>Close</Button>}
          />
          <CardBody>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <h3 className="text-xs font-medium text-slate-500 uppercase tracking-wide mb-2">Summary</h3>
                <dl className="divide-y divide-slate-100">
                  <div className="flex justify-between items-center py-2 gap-4">
                    <dt className="text-sm text-slate-600">Old Role</dt>
                    <dd className="text-sm font-medium text-slate-900">{selectedUser.oldRole}</dd>
                  </div>
                  <div className="flex justify-between items-center py-2 gap-4">
                    <dt className="text-sm text-slate-600">New Role</dt>
                    <dd className="text-sm font-medium text-slate-900">{selectedUser.newRole}</dd>
                  </div>
                  <div className="flex justify-between items-center py-2 gap-4">
                    <dt className="text-sm text-slate-600">Changed At</dt>
                    <dd className="text-sm font-medium text-slate-900 tabular">{formatDate(selectedUser.changedAt)}</dd>
                  </div>
                </dl>
              </div>

              <div>
                <h3 className="text-xs font-medium text-slate-500 uppercase tracking-wide mb-2">Verification</h3>
                <ul className="space-y-2">
                  {checklist.map((item) => (
                    <li key={item.label} className="flex items-center gap-2.5">
                      <span className={`w-4 h-4 rounded-sm border flex items-center justify-center shrink-0 ${item.checked ? "bg-emerald-600 border-emerald-600" : "bg-slate-50 border-slate-300"}`} aria-hidden>
                        {item.checked && <CheckCircle size={12} className="text-white" />}
                      </span>
                      <span className="text-sm text-slate-700">{item.label}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>

            <div className="flex flex-wrap gap-2 mt-5 pt-4 border-t border-slate-200">
              <Button>Edit User</Button>
              <Button>Suspend Account</Button>
              <Button variant="danger">Delete User</Button>
            </div>
          </CardBody>
        </Card>
      )}
    </div>
  );
}

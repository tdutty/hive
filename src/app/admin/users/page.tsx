"use client";

import { useState } from "react";
import { Users, UserCheck, Clock, CheckCircle, XCircle } from "lucide-react";
import { useApi } from "@/lib/hooks";
import { dashboardService } from "@/lib/services/dashboard";
import { usersService } from "@/lib/services/users";
import { MetricCard } from "@/components/ui/MetricCard";
import { DataTable } from "@/components/ui/DataTable";
import { SearchInput } from "@/components/ui/SearchInput";
import { FilterBar } from "@/components/ui/FilterBar";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { formatDate } from "@/lib/utils";

export default function UsersPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [roleFilter, setRoleFilter] = useState("all");
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

  if (loading) {
    return (
      <div className="space-y-8">
        <div>
          <h1 className="text-2xl font-semibold text-slate-900">User Management</h1>
        </div>
        <div className="flex items-center justify-center py-20">
          <div className="w-8 h-8 border-2 border-amber-600 border-t-transparent rounded-full animate-spin" />
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="space-y-8">
        <div>
          <h1 className="text-2xl font-semibold text-slate-900">User Management</h1>
        </div>
        <div className="bg-red-50 border border-red-200 rounded-lg p-6 text-red-700">
          <p className="font-medium">Failed to load data</p>
          <p className="text-sm mt-1">{error}</p>
          <button
            onClick={() => { refetchMetrics(); refetchRoles(); refetchWaitlist(); }}
            className="mt-3 bg-red-600 text-white rounded-md px-4 py-2 text-sm font-medium hover:bg-red-700"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

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

  return (
    <div className="space-y-8">
      {/* Page Title */}
      <div>
        <h1 className="text-2xl font-semibold text-slate-900 mb-2">
          User Management
        </h1>
        <p className="text-slate-500">Manage and monitor user accounts and permissions</p>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-4 gap-6">
        <MetricCard
          title="Total Users"
          value={totalUsers.toString()}
          subtitle="All registered users"
          icon={Users}
        />
        <MetricCard
          title="Active (24h)"
          value={activeUsers24h.toString()}
          trend={12.3}
          icon={UserCheck}
        />
        <MetricCard
          title="Completed Onboarding"
          value={completedOnboarding.toString()}
          subtitle={`${totalUsers > 0 ? Math.round((completedOnboarding / totalUsers) * 100) : 0}% verified`}
          icon={CheckCircle}
        />
        <MetricCard
          title="Pending Verification"
          value={pendingVerification.toString()}
          subtitle="Awaiting documents"
          icon={Clock}
        />
      </div>

      {/* Search & Filters */}
      <div className="flex gap-6 items-end">
        <SearchInput
          value={searchQuery}
          onChange={setSearchQuery}
          placeholder="Search by name or email..."
        />
        <FilterBar
          filters={[
            { key: "all", label: "All Users" },
            { key: "tenants", label: "Tenants" },
            { key: "landlords", label: "Landlords" },
            { key: "admins", label: "Admins" },
          ]}
          selected={roleFilter}
          onChange={setRoleFilter}
        />
      </div>

      {/* Users Table */}
      <div>
        <h2 className="text-lg font-semibold text-slate-900 mb-4">
          Users ({filteredUsers.length})
        </h2>
        <DataTable
          columns={[
            { key: "userName", label: "Name" },
            { key: "userEmail", label: "Email" },
            {
              key: "newRole",
              label: "Role",
              render: (value) => (
                <StatusBadge status={value} size="sm" />
              ),
            },
            {
              key: "verified",
              label: "Verified",
              render: (value) =>
                value ? (
                  <CheckCircle size={18} className="text-green-600" />
                ) : (
                  <XCircle size={18} className="text-red-600" />
                ),
            },
            {
              key: "createdAt",
              label: "Created",
              render: (value) => formatDate(value),
            },
            {
              key: "changedAt",
              label: "Last Updated",
              render: (value) => formatDate(value),
            },
            {
              key: "userId",
              label: "Actions",
              render: (_value, row) => (
                <button
                  onClick={() => setSelectedUser(row)}
                  className="px-3 py-1 bg-amber-600 text-white text-sm font-medium rounded-md hover:bg-amber-700 transition-colors"
                >
                  View
                </button>
              ),
            },
          ]}
          data={filteredUsers}
          onRowClick={setSelectedUser}
          emptyMessage="No users found matching your criteria"
        />
      </div>

      {/* User Detail Section */}
      {selectedUser && (
        <div className="bg-white border border-slate-200 rounded-lg shadow-sm p-8">
          <div className="flex justify-between items-start mb-6">
            <div>
              <h2 className="text-2xl font-semibold text-slate-900 mb-2">
                {selectedUser.userName}
              </h2>
              <p className="text-slate-500">{selectedUser.userEmail}</p>
            </div>
            <button
              onClick={() => setSelectedUser(null)}
              className="px-4 py-2 border border-slate-200 bg-white text-slate-700 font-medium rounded-md hover:bg-slate-50 transition-colors"
            >
              Close
            </button>
          </div>

          <div className="grid grid-cols-2 gap-8 mb-8">
            {/* Summary Stats */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-slate-900 mb-4">
                Summary
              </h3>
              <div className="flex justify-between items-center py-3 border-b border-gray-300">
                <span className="text-slate-700">Old Role</span>
                <span className="text-2xl font-bold text-amber-600">
                  {selectedUser.oldRole}
                </span>
              </div>
              <div className="flex justify-between items-center py-3 border-b border-gray-300">
                <span className="text-slate-700">New Role</span>
                <span className="text-2xl font-bold text-amber-600">
                  {selectedUser.newRole}
                </span>
              </div>
              <div className="flex justify-between items-center py-3 border-b border-gray-300">
                <span className="text-slate-700">Changed At</span>
                <span className="text-lg font-bold text-amber-600">
                  {formatDate(selectedUser.changedAt)}
                </span>
              </div>
            </div>

            {/* Verification Checklist */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-slate-900 mb-4">
                Verification
              </h3>
              <div className="space-y-3">
                {[
                  { label: "ID Verified", checked: selectedUser.verified },
                  { label: "Background Check", checked: selectedUser.verified },
                  {
                    label: "Salary Verified",
                    checked:
                      selectedUser.verified &&
                      selectedUser.newRole === "USER",
                  },
                  {
                    label: "Credit Verified",
                    checked:
                      selectedUser.verified &&
                      selectedUser.newRole === "USER",
                  },
                ].map((item) => (
                  <div key={item.label} className="flex items-center gap-3">
                    <div
                      className={`w-5 h-5 border border-slate-200 rounded-md flex items-center justify-center ${
                        item.checked ? "bg-green-600" : "bg-slate-100"
                      }`}
                    >
                      {item.checked && (
                        <CheckCircle size={16} className="text-white" />
                      )}
                    </div>
                    <span className="text-slate-700">{item.label}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-4">
            <button className="px-6 py-3 border border-slate-200 bg-white text-slate-700 font-medium rounded-md hover:bg-slate-50 transition-colors">
              Edit User
            </button>
            <button className="px-6 py-3 border border-slate-200 bg-white text-slate-700 font-medium rounded-md hover:bg-slate-50 transition-colors">
              Suspend Account
            </button>
            <button className="px-6 py-3 bg-red-600 text-white font-medium rounded-md hover:bg-red-700 transition-colors">
              Delete User
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

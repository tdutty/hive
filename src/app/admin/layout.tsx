"use client";

import { usePathname, useRouter } from "next/navigation";
import Link from "next/link";
import { useSession, signOut } from "next-auth/react";
import { useEffect, useRef } from "react";
import {
  LayoutDashboard,
  Users,
  Building2,
  DollarSign,
  ScrollText,
  Flag,
  Activity,
  Zap,
  Briefcase,
  Shield,
  Globe,
  Settings,
  Bell,
  LogOut,
  Bug,
  CheckCircle,
  MessageSquare,
  GitBranch,
  MapPin,
  FileSignature,
  ClipboardList,
  Megaphone,
  X,
  CheckCheck,
  AlertTriangle,
  MapPinned,
  UserCheck,
  FileText,
  ShieldAlert,
} from "lucide-react";
import {
  useNotifications,
  NotificationProvider,
  Notification,
} from "@/providers/notification-provider";

interface NavItem {
  label: string;
  href: string;
  icon: React.ReactNode;
}

interface NavSection {
  title: string;
  items: NavItem[];
}

const navSections: NavSection[] = [
  {
    title: "Main",
    items: [
      {
        label: "Overview",
        href: "/admin",
        icon: <LayoutDashboard size={20} />,
      },
      { label: "Users", href: "/admin/users", icon: <Users size={20} /> },
      {
        label: "Listings",
        href: "/admin/listings",
        icon: <Building2 size={20} />,
      },
      {
        label: "Survey Respondents",
        href: "/admin/survey-respondents",
        icon: <ClipboardList size={20} />,
      },
      {
        label: "Listing Review",
        href: "/admin/listing-review",
        icon: <CheckCircle size={20} />,
      },
      {
        label: "Negotiations",
        href: "/admin/negotiations",
        icon: <MessageSquare size={20} />,
      },
      {
        label: "Tenant Pipeline",
        href: "/admin/tenant-pipeline",
        icon: <GitBranch size={20} />,
      },
      {
        label: "City Scans",
        href: "/admin/city-scans",
        icon: <MapPin size={20} />,
      },
      {
        label: "Signing Pipeline",
        href: "/admin/signing-pipeline",
        icon: <FileSignature size={20} />,
      },
      {
        label: "Portfolio Holders",
        href: "/admin/portfolio-holders",
        icon: <Briefcase size={20} />,
      },
      {
        label: "Campaigns",
        href: "/admin/campaigns",
        icon: <Megaphone size={20} />,
      },
      {
        label: "Financial",
        href: "/admin/financial",
        icon: <DollarSign size={20} />,
      },
    ],
  },
  {
    title: "System",
    items: [
      {
        label: "Audit Logs",
        href: "/admin/audit-logs",
        icon: <ScrollText size={20} />,
      },
      {
        label: "Feature Flags",
        href: "/admin/feature-flags",
        icon: <Flag size={20} />,
      },
      {
        label: "Monitoring",
        href: "/admin/monitoring",
        icon: <Activity size={20} />,
      },
      { label: "API Usage", href: "/admin/api-usage", icon: <Zap size={20} /> },
      {
        label: "Credit Status",
        href: "/admin/credit-status",
        icon: <DollarSign size={20} />,
      },
      {
        label: "Alerts",
        href: "/admin/alerts",
        icon: <Bell size={20} />,
      },
      { label: "Bugs", href: "/admin/bugs", icon: <Bug size={20} /> },
    ],
  },
  {
    title: "Business",
    items: [
      {
        label: "Partners",
        href: "/admin/partners",
        icon: <Briefcase size={20} />,
      },
      { label: "GDPR", href: "/admin/gdpr", icon: <Shield size={20} /> },
      { label: "Scraping", href: "/admin/scraping", icon: <Globe size={20} /> },
      {
        label: "Settings",
        href: "/admin/settings",
        icon: <Settings size={20} />,
      },
    ],
  },
];

function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const { data: session } = useSession();

  const isActive = (href: string) => {
    if (href === "/admin") {
      return pathname === "/admin";
    }
    return pathname.startsWith(href);
  };

  const handleSignOut = async () => {
    await signOut({ redirect: false });
    router.push("/login");
  };

  const userName = session?.user?.name || session?.user?.email || "Admin";
  const initials = userName
    .split(" ")
    .map((n: string) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);

  return (
    <aside className="fixed left-0 top-0 h-screen w-64 border-r border-[#2f2f42] bg-[#1e1e2d] text-white pt-6 overflow-y-auto">
      {/* Logo */}
      <div className="px-6 mb-12 flex items-center gap-3">
        <div className="w-8 h-8 flex items-center justify-center">
          <svg
            width="32"
            height="32"
            viewBox="0 0 32 32"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              d="M16 2L28 8V16V24L16 30L4 24V16V8L16 2Z"
              fill="#D97706"
              stroke="#D97706"
              strokeWidth="1.5"
              strokeLinejoin="miter"
            />
          </svg>
        </div>
        <span className="text-xl font-bold tracking-tight">HIVE</span>
      </div>

      {/* Navigation */}
      <nav className="space-y-8 px-3">
        {navSections.map((section) => (
          <div key={section.title}>
            <h3 className="text-xs font-semibold uppercase tracking-wider text-[#6b7280] px-3 mb-3">
              {section.title}
            </h3>
            <div className="space-y-1">
              {section.items.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`flex items-center gap-3 px-3 py-2 text-sm rounded-md transition-colors border-l-4 ${
                    isActive(item.href)
                      ? "border-l-amber-500 bg-[#32324a] text-white"
                      : "border-l-transparent text-[#a0a3b1] hover:bg-[#2a2a3e]"
                  }`}
                >
                  {item.icon}
                  <span>{item.label}</span>
                </Link>
              ))}
            </div>
          </div>
        ))}
      </nav>

      {/* User / Logout */}
      <div className="absolute bottom-6 left-3 right-3 border-t border-[#2f2f42] pt-4">
        <div className="flex items-center gap-3 px-3 mb-3">
          <div className="w-8 h-8 rounded-full bg-amber-600 text-white flex items-center justify-center font-bold text-xs flex-shrink-0">
            {initials}
          </div>
          <div className="min-w-0">
            <p className="text-sm font-medium text-white truncate">
              {session?.user?.name || "Admin"}
            </p>
            <p className="text-xs text-[#6b7280] truncate">
              {session?.user?.email || ""}
            </p>
          </div>
        </div>
        <button
          onClick={handleSignOut}
          className="flex items-center gap-2 px-3 py-2 text-sm text-[#a0a3b1] hover:text-white hover:bg-[#2a2a3e] rounded-md transition-colors w-full"
        >
          <LogOut size={16} />
          <span>Sign out</span>
        </button>
      </div>
    </aside>
  );
}

function notificationIcon(type: string) {
  switch (type) {
    case "NEW_CITY_NEEDS_LISTINGS":
      return <MapPinned size={16} className="text-amber-500" />;
    case "group_formed":
      return <UserCheck size={16} className="text-green-500" />;
    case "offer_received":
      return <FileText size={16} className="text-blue-500" />;
    case "suspicious_access":
      return <ShieldAlert size={16} className="text-red-500" />;
    case "health_check":
    case "error_rate":
      return <AlertTriangle size={16} className="text-orange-500" />;
    default:
      return <Bell size={16} className="text-gray-500" />;
  }
}

function notificationLabel(type: string): string {
  switch (type) {
    case "NEW_CITY_NEEDS_LISTINGS":
      return "New City Alert";
    case "group_formed":
      return "Group Formed";
    case "offer_received":
      return "Offer Received";
    case "suspicious_access":
      return "Security Alert";
    case "health_check":
      return "Health Check";
    case "error_rate":
      return "Error Alert";
    default:
      return "Notification";
  }
}

function timeAgo(dateStr: string): string {
  const now = Date.now();
  const then = new Date(dateStr).getTime();
  const diffMs = now - then;
  const diffMin = Math.floor(diffMs / 60000);
  if (diffMin < 1) return "just now";
  if (diffMin < 60) return `${diffMin}m ago`;
  const diffHr = Math.floor(diffMin / 60);
  if (diffHr < 24) return `${diffHr}h ago`;
  const diffDay = Math.floor(diffHr / 24);
  if (diffDay < 7) return `${diffDay}d ago`;
  return new Date(dateStr).toLocaleDateString();
}

function NotificationDropdown() {
  const { notifications, unreadCount, markAsRead, markAllRead, isOpen, setIsOpen } =
    useNotifications();
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close on outside click
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    }
    if (isOpen) {
      document.addEventListener("mousedown", handleClick);
      return () => document.removeEventListener("mousedown", handleClick);
    }
  }, [isOpen, setIsOpen]);

  return (
    <div className="relative" ref={dropdownRef}>
      {/* Bell Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-2 hover:bg-slate-100 rounded-lg transition-colors"
      >
        <Bell size={20} className="text-gray-700" />
        {unreadCount > 0 && (
          <span className="absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px] bg-red-600 text-white text-[10px] font-bold rounded-full flex items-center justify-center px-1">
            {unreadCount > 99 ? "99+" : unreadCount}
          </span>
        )}
      </button>

      {/* Dropdown Panel */}
      {isOpen && (
        <div className="absolute right-0 top-12 w-96 bg-white rounded-xl shadow-2xl border border-slate-200 z-50 overflow-hidden">
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3 border-b border-slate-100 bg-slate-50">
            <h3 className="text-sm font-semibold text-slate-900">
              Notifications
              {unreadCount > 0 && (
                <span className="ml-2 text-xs font-medium text-amber-600 bg-amber-50 px-2 py-0.5 rounded-full">
                  {unreadCount} new
                </span>
              )}
            </h3>
            <div className="flex items-center gap-2">
              {unreadCount > 0 && (
                <button
                  onClick={markAllRead}
                  className="text-xs text-slate-500 hover:text-slate-800 flex items-center gap-1"
                >
                  <CheckCheck size={14} />
                  Mark all read
                </button>
              )}
              <button
                onClick={() => setIsOpen(false)}
                className="p-1 hover:bg-slate-200 rounded"
              >
                <X size={14} className="text-slate-400" />
              </button>
            </div>
          </div>

          {/* Notification List */}
          <div className="max-h-[420px] overflow-y-auto">
            {notifications.length === 0 ? (
              <div className="px-4 py-10 text-center text-sm text-slate-400">
                No notifications yet
              </div>
            ) : (
              notifications.map((n: Notification) => (
                <button
                  key={n.id}
                  onClick={() => {
                    if (!n.read) markAsRead(n.id);
                    // Navigate to relevant page based on type
                    if (n.type === "NEW_CITY_NEEDS_LISTINGS") {
                      window.location.href = "/admin/listing-review";
                    } else if (n.type === "offer_received") {
                      window.location.href = "/admin/negotiations";
                    } else if (n.type === "group_formed") {
                      window.location.href = "/admin/tenant-pipeline";
                    }
                    setIsOpen(false);
                  }}
                  className={`w-full text-left px-4 py-3 flex gap-3 hover:bg-slate-50 transition-colors border-b border-slate-50 ${
                    !n.read ? "bg-amber-50/50" : ""
                  }`}
                >
                  <div className="mt-0.5 flex-shrink-0">
                    {notificationIcon(n.type)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2">
                      <span
                        className={`text-xs font-medium ${
                          !n.read ? "text-amber-700" : "text-slate-500"
                        }`}
                      >
                        {notificationLabel(n.type)}
                      </span>
                      <span className="text-[11px] text-slate-400 flex-shrink-0">
                        {timeAgo(n.createdAt)}
                      </span>
                    </div>
                    <p
                      className={`text-sm mt-0.5 truncate ${
                        !n.read ? "text-slate-900 font-medium" : "text-slate-600"
                      }`}
                    >
                      {n.title || n.message}
                    </p>
                    {n.title && (
                      <p className="text-xs text-slate-400 mt-0.5 truncate">
                        {n.message}
                      </p>
                    )}
                    {!n.read && (
                      <div className="w-2 h-2 bg-amber-500 rounded-full absolute right-4 top-1/2 -translate-y-1/2" />
                    )}
                  </div>
                </button>
              ))
            )}
          </div>

          {/* Footer */}
          {notifications.length > 0 && (
            <div className="border-t border-slate-100 px-4 py-2.5 bg-slate-50">
              <Link
                href="/admin/alerts"
                onClick={() => setIsOpen(false)}
                className="text-xs text-amber-600 hover:text-amber-700 font-medium"
              >
                View all alerts
              </Link>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function TopHeader() {
  const { data: session } = useSession();

  return (
    <header className="fixed top-0 left-64 right-0 h-16 border-b border-slate-200 bg-white flex items-center justify-between px-8 z-40">
      <div className="text-sm text-gray-600">
        <span className="font-semibold text-sm">Admin Dashboard</span>
      </div>

      <div className="flex items-center gap-6">
        <NotificationDropdown />

        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-amber-600 text-white flex items-center justify-center font-bold text-sm">
            {(session?.user?.name || "A")
              .split(" ")
              .map((n: string) => n[0])
              .join("")
              .toUpperCase()
              .slice(0, 2)}
          </div>
          <span className="text-sm font-medium text-gray-700">
            {session?.user?.name || "Admin"}
          </span>
        </div>
      </div>
    </header>
  );
}

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <NotificationProvider>
      <div className="min-h-screen bg-slate-50">
        <Sidebar />
        <TopHeader />
        <main className="ml-64 pt-16 p-8 min-h-screen">{children}</main>
      </div>
    </NotificationProvider>
  );
}

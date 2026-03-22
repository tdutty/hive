"use client";

import { usePathname, useRouter } from "next/navigation";
import Link from "next/link";
import { useSession, signOut } from "next-auth/react";
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
} from "lucide-react";

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

function TopHeader() {
  const { data: session } = useSession();

  return (
    <header className="fixed top-0 left-64 right-0 h-16 border-b border-slate-200 bg-white flex items-center justify-between px-8 z-40">
      <div className="text-sm text-gray-600">
        <span className="font-semibold text-sm">Admin Dashboard</span>
      </div>

      <div className="flex items-center gap-6">
        <button className="relative p-2 hover:bg-slate-50 transition-colors">
          <Bell size={20} className="text-gray-700" />
          <span className="absolute top-1 right-1 w-2 h-2 bg-red-600 rounded-full"></span>
        </button>

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
    <div className="min-h-screen bg-slate-50">
      <Sidebar />
      <TopHeader />
      <main className="ml-64 pt-16 p-8 min-h-screen">{children}</main>
    </div>
  );
}

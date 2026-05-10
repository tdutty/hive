"use client";

import { useState, useEffect, useCallback } from "react";
import {
  Share2,
  ExternalLink,
  Copy,
  Check,
  Clock,
  AlertCircle,
  CheckCircle2,
  Filter,
} from "lucide-react";

// --- Types ---

interface GroupData {
  name: string;
  url: string;
  city: string;
}

interface PostTracker {
  [groupUrl: string]: string; // ISO date string
}

type FilterTab = "all" | "due" | "never";

// --- Constants ---

const STORAGE_KEY = "social-post-tracker";
const REPOST_DAYS = 14;

const CITY_COLORS: Record<string, { bg: string; text: string }> = {
  Cleveland: { bg: "bg-blue-100", text: "text-blue-700" },
  Miami: { bg: "bg-pink-100", text: "text-pink-700" },
  Pittsburgh: { bg: "bg-yellow-100", text: "text-yellow-700" },
  Nashville: { bg: "bg-purple-100", text: "text-purple-700" },
  Boston: { bg: "bg-red-100", text: "text-red-700" },
  Houston: { bg: "bg-green-100", text: "text-green-700" },
  National: { bg: "bg-gray-100", text: "text-gray-700" },
};

const GROUPS: GroupData[] = [
  // Cleveland
  { name: "Cleveland Clinic Student Housing", url: "https://facebook.com/groups/CCStudentHousing/", city: "Cleveland" },
  { name: "Columbus Housing, Rooms, Apartments", url: "https://facebook.com/groups/809396252462237/", city: "Cleveland" },
  // Miami
  { name: "UM Housing & Roommates", url: "https://facebook.com/groups/433378197122432/", city: "Miami" },
  { name: "UM Off Campus Rooms", url: "https://facebook.com/groups/405298067655451/", city: "Miami" },
  // Pittsburgh
  { name: "Pitt & CMU Housing Subleases", url: "https://facebook.com/groups/PittSubleasesRoommates/", city: "Pittsburgh" },
  { name: "Pittsburgh Housing, Rooms, Apartments", url: "https://facebook.com/groups/214878512490890/", city: "Pittsburgh" },
  // Nashville
  { name: "Housing near Vanderbilt", url: "https://facebook.com/groups/1457647111194961/", city: "Nashville" },
  { name: "Vanderbilt Apartments and Housing", url: "https://facebook.com/groups/vanderbilt.apartments/", city: "Nashville" },
  { name: "Nashville Housing", url: "https://facebook.com/groups/963043180392901/", city: "Nashville" },
  // Boston
  { name: "MGH Housing, Rooms", url: "https://facebook.com/groups/massgeneralhospital/", city: "Boston" },
  { name: "Boston Housing", url: "https://facebook.com/groups/1566296393687929/", city: "Boston" },
  { name: "Boston Student Housing", url: "https://facebook.com/groups/352407375245793/", city: "Boston" },
  // Houston
  { name: "UTH Housing", url: "https://facebook.com/groups/262902437128663/", city: "Houston" },
  { name: "Houston Medical Center", url: "https://facebook.com/groups/233850040126034/", city: "Houston" },
  // National
  { name: "USMLE Residency Match", url: "https://facebook.com/groups/437428600378395/", city: "National" },
];

const CITY_HOSPITALS: Record<string, string> = {
  Cleveland: "Cleveland Clinic, University Hospitals, and MetroHealth",
  Miami: "Jackson Memorial, UM Health, and Baptist Health",
  Pittsburgh: "UPMC, Allegheny Health Network, and VA Pittsburgh",
  Nashville: "Vanderbilt University Medical Center, TriStar, and Saint Thomas",
  Boston: "Mass General, Brigham and Women's, Beth Israel, and Boston Medical Center",
  Houston: "UTHealth, MD Anderson, Memorial Hermann, and Houston Methodist",
};

function getCityPost(city: string): string {
  if (city === "National") {
    return `Hey everyone! Congrats on matching!

If you are relocating for residency and stressed about finding housing from out of state, check out SweetLease. We are a free service that negotiates rent on your behalf with property managers near your hospital.

We cover 12+ cities including Houston, Nashville, Columbus, Pittsburgh, Cleveland, Cincinnati, Boston, Miami, and more.

Residents typically save 10-35% below listed rent. We handle everything remotely - virtual tours, lease signing, the whole process.

sweetlease.io - completely free for residents.

Happy to answer questions!`;
  }

  const hospitals = CITY_HOSPITALS[city] || "major hospitals";

  return `Hey everyone! Congrats on matching to ${city}!

Finding housing from out of state is stressful, especially when you are on a tight timeline. I built a free service specifically for this.

SweetLease negotiates rent on your behalf with property managers near ${hospitals}. We typically save residents 10-35% below listed rent.

How it works:
- Tell us your budget, bedrooms, and move-in date
- We match you to properties within 15 min of the hospital
- We negotiate rent using group demand
- Virtual tours so you can decide before arriving
- Sign your lease remotely
- 100% free

We are already working with property managers in ${city} and have placed residents sight unseen.

Check us out at sweetlease.io

Happy to answer any questions!`;
}

function getStatus(lastPosted: string | undefined): { label: string; color: string; priority: number } {
  if (!lastPosted) {
    return { label: "Never posted", color: "red", priority: 0 };
  }
  const daysSince = Math.floor((Date.now() - new Date(lastPosted).getTime()) / (1000 * 60 * 60 * 24));
  if (daysSince >= REPOST_DAYS) {
    return { label: `Due for repost (${daysSince}d ago)`, color: "amber", priority: 1 };
  }
  return { label: `Recent (${daysSince}d ago)`, color: "green", priority: 2 };
}

// --- Components ---

function GroupCard({
  group,
  lastPosted,
  onMarkPosted,
}: {
  group: GroupData;
  lastPosted: string | undefined;
  onMarkPosted: (url: string) => void;
}) {
  const [copied, setCopied] = useState(false);
  const status = getStatus(lastPosted);
  const postText = getCityPost(group.city);
  const cityColor = CITY_COLORS[group.city] || { bg: "bg-gray-100", text: "text-gray-700" };

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(postText);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // fallback
      const textarea = document.createElement("textarea");
      textarea.value = postText;
      document.body.appendChild(textarea);
      textarea.select();
      document.execCommand("copy");
      document.body.removeChild(textarea);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const statusColors: Record<string, string> = {
    red: "bg-red-50 text-red-700 border-red-200",
    amber: "bg-amber-50 text-amber-700 border-amber-200",
    green: "bg-green-50 text-green-700 border-green-200",
  };

  const statusIcons: Record<string, React.ReactNode> = {
    red: <AlertCircle size={14} />,
    amber: <Clock size={14} />,
    green: <CheckCircle2 size={14} />,
  };

  return (
    <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
      <div className="flex flex-col lg:flex-row">
        {/* Left side */}
        <div className="lg:w-72 p-5 border-b lg:border-b-0 lg:border-r border-slate-100 flex flex-col gap-3">
          <div>
            <h3 className="font-semibold text-slate-900 text-sm leading-tight">{group.name}</h3>
            <span className={`inline-block mt-1.5 px-2 py-0.5 rounded-full text-xs font-medium ${cityColor.bg} ${cityColor.text}`}>
              {group.city}
            </span>
          </div>

          <a
            href={group.url}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 text-sm text-blue-600 hover:text-blue-700 font-medium"
          >
            <ExternalLink size={14} />
            Open Group
          </a>

          <div className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-medium border ${statusColors[status.color]}`}>
            {statusIcons[status.color]}
            {status.label}
          </div>

          {lastPosted && (
            <p className="text-xs text-slate-400">
              Last posted: {new Date(lastPosted).toLocaleDateString()}
            </p>
          )}
        </div>

        {/* Right side */}
        <div className="flex-1 p-5 flex flex-col gap-3">
          <pre className="text-sm text-slate-700 whitespace-pre-wrap font-sans bg-slate-50 rounded-lg p-4 border border-slate-100 max-h-64 overflow-y-auto leading-relaxed">
            {postText}
          </pre>

          <div className="flex items-center gap-2">
            <button
              onClick={handleCopy}
              className={`inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                copied
                  ? "bg-green-100 text-green-700 border border-green-200"
                  : "bg-slate-900 text-white hover:bg-slate-800"
              }`}
            >
              {copied ? <Check size={14} /> : <Copy size={14} />}
              {copied ? "Copied!" : "Copy Post"}
            </button>

            <button
              onClick={() => onMarkPosted(group.url)}
              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-sm font-medium border border-slate-200 text-slate-700 hover:bg-slate-50 transition-colors"
            >
              <CheckCircle2 size={14} />
              Mark as Posted
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// --- Page ---

export default function SocialOutreachPage() {
  const [tracker, setTracker] = useState<PostTracker>({});
  const [filter, setFilter] = useState<FilterTab>("all");

  // Load from localStorage
  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        setTracker(JSON.parse(stored));
      }
    } catch {
      // ignore
    }
  }, []);

  const saveTracker = useCallback((updated: PostTracker) => {
    setTracker(updated);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
  }, []);

  const handleMarkPosted = useCallback(
    (url: string) => {
      const updated = { ...tracker, [url]: new Date().toISOString() };
      saveTracker(updated);
    },
    [tracker, saveTracker]
  );

  // Filter and sort groups
  const filteredGroups = GROUPS.filter((g) => {
    const status = getStatus(tracker[g.url]);
    if (filter === "never") return status.color === "red";
    if (filter === "due") return status.color === "amber";
    return true;
  }).sort((a, b) => {
    const aPriority = getStatus(tracker[a.url]).priority;
    const bPriority = getStatus(tracker[b.url]).priority;
    return aPriority - bPriority;
  });

  // Stats
  const totalGroups = GROUPS.length;
  const neverPosted = GROUPS.filter((g) => !tracker[g.url]).length;
  const dueForRepost = GROUPS.filter((g) => {
    const s = getStatus(tracker[g.url]);
    return s.color === "amber";
  }).length;
  const postedThisWeek = GROUPS.filter((g) => {
    const last = tracker[g.url];
    if (!last) return false;
    const daysSince = (Date.now() - new Date(last).getTime()) / (1000 * 60 * 60 * 24);
    return daysSince <= 7;
  }).length;

  const tabs: { key: FilterTab; label: string; count: number }[] = [
    { key: "all", label: "All", count: totalGroups },
    { key: "due", label: "Due for Repost", count: dueForRepost },
    { key: "never", label: "Never Posted", count: neverPosted },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <div className="flex items-center gap-2 mb-1">
          <Share2 size={22} className="text-amber-600" />
          <h1 className="text-2xl font-bold text-slate-900">Social Outreach</h1>
        </div>
        <p className="text-sm text-slate-500">Copy and paste into Facebook groups</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-xl border border-slate-200 p-4">
          <p className="text-xs font-medium text-slate-500 uppercase tracking-wide">Groups</p>
          <p className="text-2xl font-bold text-slate-900 mt-1">{totalGroups}</p>
        </div>
        <div className="bg-white rounded-xl border border-slate-200 p-4">
          <p className="text-xs font-medium text-slate-500 uppercase tracking-wide">Posted This Week</p>
          <p className="text-2xl font-bold text-green-600 mt-1">{postedThisWeek}</p>
        </div>
        <div className="bg-white rounded-xl border border-slate-200 p-4">
          <p className="text-xs font-medium text-slate-500 uppercase tracking-wide">Due for Repost</p>
          <p className="text-2xl font-bold text-amber-600 mt-1">{dueForRepost}</p>
        </div>
        <div className="bg-white rounded-xl border border-slate-200 p-4">
          <p className="text-xs font-medium text-slate-500 uppercase tracking-wide">Never Posted</p>
          <p className="text-2xl font-bold text-red-600 mt-1">{neverPosted}</p>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="flex items-center gap-1 bg-slate-100 rounded-lg p-1 w-fit">
        {tabs.map((tab) => (
          <button
            key={tab.key}
            onClick={() => setFilter(tab.key)}
            className={`px-4 py-1.5 rounded-md text-sm font-medium transition-colors ${
              filter === tab.key
                ? "bg-white text-slate-900 shadow-sm"
                : "text-slate-500 hover:text-slate-700"
            }`}
          >
            {tab.label}
            <span className="ml-1.5 text-xs opacity-60">({tab.count})</span>
          </button>
        ))}
      </div>

      {/* Group Cards */}
      <div className="space-y-4">
        {filteredGroups.length === 0 ? (
          <div className="bg-white rounded-xl border border-slate-200 p-12 text-center">
            <Filter size={32} className="text-slate-300 mx-auto mb-3" />
            <p className="text-sm text-slate-500">No groups match this filter</p>
          </div>
        ) : (
          filteredGroups.map((group) => (
            <GroupCard
              key={group.url}
              group={group}
              lastPosted={tracker[group.url]}
              onMarkPosted={handleMarkPosted}
            />
          ))
        )}
      </div>
    </div>
  );
}

"use client";

import { useState, useEffect } from "react";
import {
  CheckCircle,
  XCircle,
  ChevronDown,
  ChevronUp,
  ChevronLeft,
  ChevronRight,
  Image as ImageIcon,
  ExternalLink,
} from "lucide-react";
import { useApi } from "@/lib/hooks";
import { api } from "@/lib/api";
import { MetricCard } from "@/components/ui/MetricCard";
import { formatCurrency, formatDate } from "@/lib/utils";

interface ListingAddress {
  street: string;
  city: string;
  state: string;
  zipCode: string;
}

interface ReviewListing {
  id: string;
  title: string;
  price: number;
  bedrooms: number;
  bathrooms: number;
  status: string;
  propertyType: string | null;
  createdAt: string;
  address: ListingAddress | null;
  primaryImage: string | null;
  qualityScore: number | null;
  daysOnMarket: number | null;
  ownerName: string | null;
  ownerEmail: string | null;
  zillowUrl: string | null;
  reviewedBy: string | null;
  reviewedAt: string | null;
  reviewNotes: string | null;
}

interface ReviewQueueResponse {
  listings: ReviewListing[];
  pagination: {
    page: number;
    limit: number;
    totalCount: number;
    totalPages: number;
    hasNextPage: boolean;
    hasPrevPage: boolean;
  };
  counts: {
    pending: number;
    approved: number;
    rejected: number;
  };
}

type TabStatus = "PENDING_REVIEW" | "APPROVED" | "REJECTED";

export default function ListingReviewPage() {
  const [activeTab, setActiveTab] = useState<TabStatus>("PENDING_REVIEW");
  const [page, setPage] = useState(1);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [bulkNotes, setBulkNotes] = useState("");
  const [notes, setNotes] = useState<Record<string, string>>({});
  const [actionLoading, setActionLoading] = useState<Record<string, boolean>>({});

  const {
    data,
    loading,
    error,
    refetch,
  } = useApi<ReviewQueueResponse>(
    () =>
      api.get<ReviewQueueResponse>("/api/admin/listings/review-queue", {
        status: activeTab,
        page,
        limit: 20,
      }),
    [activeTab, page]
  );

  useEffect(() => {
    setPage(1);
    setSelectedIds(new Set());
    setExpandedId(null);
  }, [activeTab]);

  const listings = data?.listings || [];
  const pagination = data?.pagination;
  const counts = data?.counts || { pending: 0, approved: 0, rejected: 0 };

  const reviewListing = async (id: string, action: "approve" | "reject") => {
    setActionLoading((prev) => ({ ...prev, [id]: true }));
    try {
      await api.post(`/api/admin/listings/${id}/review`, {
        action,
        notes: notes[id] || undefined,
      });
      setNotes((prev) => {
        const next = { ...prev };
        delete next[id];
        return next;
      });
      refetch();
    } catch (err: any) {
      alert(err?.data?.error || "Review failed");
    } finally {
      setActionLoading((prev) => ({ ...prev, [id]: false }));
    }
  };

  const bulkReview = async (action: "approve" | "reject") => {
    if (selectedIds.size === 0) return;
    const ids = Array.from(selectedIds);
    setActionLoading((prev) => {
      const next = { ...prev };
      ids.forEach((id) => (next[id] = true));
      return next;
    });
    try {
      await Promise.all(
        ids.map((id) =>
          api.post(`/api/admin/listings/${id}/review`, {
            action,
            notes: bulkNotes || undefined,
          })
        )
      );
      setSelectedIds(new Set());
      setBulkNotes("");
      refetch();
    } catch (err) {
      console.error("Bulk review failed:", err);
    } finally {
      setActionLoading({});
    }
  };

  const toggleSelect = (id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const toggleSelectAll = () => {
    if (selectedIds.size === listings.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(listings.map((l) => l.id)));
    }
  };

  const tabs: { key: TabStatus; label: string; count: number }[] = [
    { key: "PENDING_REVIEW", label: "Pending Review", count: counts.pending },
    { key: "APPROVED", label: "Approved", count: counts.approved },
    { key: "REJECTED", label: "Rejected", count: counts.rejected },
  ];

  if (loading) {
    return (
      <div className="space-y-8">
        <div>
          <h1 className="text-2xl font-semibold text-slate-900">Listing Review</h1>
          <p className="text-slate-500">Review and approve tenant-match listings</p>
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
          <h1 className="text-2xl font-semibold text-slate-900">Listing Review</h1>
        </div>
        <div className="bg-red-50 border border-red-200 rounded-lg p-6 text-red-700">
          <p className="font-medium">Failed to load review queue</p>
          <p className="text-sm mt-1">{error}</p>
          <button
            onClick={refetch}
            className="mt-3 bg-red-600 text-white rounded-md px-4 py-2 text-sm font-medium hover:bg-red-700"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-semibold text-slate-900 mb-2">
          Listing Review
        </h1>
        <p className="text-slate-500">
          Review and approve tenant-match listings before they appear to tenants
        </p>
      </div>

      {/* Metric Cards */}
      <div className="grid grid-cols-3 gap-6">
        <MetricCard
          title="Pending Review"
          value={counts.pending.toString()}
          icon={CheckCircle}
        />
        <MetricCard
          title="Approved"
          value={counts.approved.toString()}
          icon={CheckCircle}
        />
        <MetricCard
          title="Rejected"
          value={counts.rejected.toString()}
          icon={XCircle}
        />
      </div>

      {/* Tabs */}
      <div className="flex gap-2 border-b border-slate-200 pb-0">
        {tabs.map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={`px-4 py-2.5 text-sm font-medium transition-colors border-b-2 -mb-px ${
              activeTab === tab.key
                ? "border-amber-600 text-amber-700"
                : "border-transparent text-slate-500 hover:text-slate-700"
            }`}
          >
            {tab.label}
            <span
              className={`ml-2 px-2 py-0.5 rounded-full text-xs font-medium ${
                activeTab === tab.key
                  ? "bg-amber-100 text-amber-700"
                  : "bg-slate-100 text-slate-500"
              }`}
            >
              {tab.count}
            </span>
          </button>
        ))}
      </div>

      {/* Bulk actions */}
      {activeTab === "PENDING_REVIEW" && listings.length > 0 && (
        <div className="flex items-center gap-3 bg-white border border-slate-200 rounded-lg p-3">
          <button
            onClick={toggleSelectAll}
            className="px-3 py-1.5 text-sm font-medium text-slate-700 border border-slate-200 rounded-md hover:bg-slate-50"
          >
            {selectedIds.size === listings.length ? "Deselect All" : "Select All"}
          </button>
          {selectedIds.size > 0 && (
            <>
              <span className="text-sm text-slate-500">
                {selectedIds.size} selected
              </span>
              <input
                type="text"
                placeholder="Bulk notes (optional)"
                value={bulkNotes}
                onChange={(e) => setBulkNotes(e.target.value)}
                className="border border-slate-200 rounded-md px-3 py-1.5 text-sm w-64 focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500"
              />
              <button
                onClick={() => bulkReview("approve")}
                className="flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium text-white bg-green-600 rounded-md hover:bg-green-700"
              >
                <CheckCircle size={16} />
                Approve ({selectedIds.size})
              </button>
              <button
                onClick={() => bulkReview("reject")}
                className="flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium text-white bg-red-600 rounded-md hover:bg-red-700"
              >
                <XCircle size={16} />
                Reject ({selectedIds.size})
              </button>
            </>
          )}
        </div>
      )}

      {/* Listings */}
      {listings.length === 0 ? (
        <div className="bg-white border border-slate-200 rounded-lg p-12 text-center text-slate-500">
          No {activeTab === "PENDING_REVIEW" ? "pending" : activeTab.toLowerCase()} listings.
        </div>
      ) : (
        <div className="space-y-3">
          {listings.map((listing) => {
            const isExpanded = expandedId === listing.id;
            const isSelected = selectedIds.has(listing.id);
            const isLoading = actionLoading[listing.id];

            return (
              <div
                key={listing.id}
                className={`bg-white border rounded-lg transition-all ${
                  isSelected
                    ? "border-amber-400 ring-1 ring-amber-200"
                    : "border-slate-200"
                }`}
              >
                <div className="p-4 flex items-start gap-4">
                  {/* Checkbox */}
                  {activeTab === "PENDING_REVIEW" && (
                    <input
                      type="checkbox"
                      checked={isSelected}
                      onChange={() => toggleSelect(listing.id)}
                      className="mt-1 h-4 w-4 rounded border-slate-300 text-amber-600 focus:ring-amber-500"
                    />
                  )}

                  {/* Thumbnail */}
                  <div className="w-20 h-20 rounded-lg overflow-hidden bg-slate-100 flex-shrink-0">
                    {listing.primaryImage ? (
                      <img
                        src={listing.primaryImage}
                        alt={listing.title}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <ImageIcon size={24} className="text-slate-300" />
                      </div>
                    )}
                  </div>

                  {/* Details */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="font-semibold text-slate-900 text-sm truncate">
                        {listing.title}
                      </h3>
                      {listing.qualityScore !== null && (
                        <span className="px-2 py-0.5 text-xs font-medium bg-blue-50 text-blue-700 border border-blue-200 rounded-full">
                          Q: {listing.qualityScore}
                        </span>
                      )}
                      {listing.daysOnMarket !== null && (
                        <span className="px-2 py-0.5 text-xs font-medium bg-slate-50 text-slate-600 border border-slate-200 rounded-full">
                          {listing.daysOnMarket}d on market
                        </span>
                      )}
                    </div>
                    <p className="text-sm text-slate-500">
                      {listing.address
                        ? `${listing.address.street}, ${listing.address.city}, ${listing.address.state} ${listing.address.zipCode}`
                        : "No address"}
                    </p>
                    <div className="flex items-center gap-4 mt-1.5 text-sm">
                      <span className="font-semibold text-slate-900">
                        {formatCurrency(listing.price)}/mo
                      </span>
                      <span className="text-slate-500">
                        {listing.bedrooms} bed / {listing.bathrooms} bath
                      </span>
                      {listing.propertyType && (
                        <span className="text-slate-400">{listing.propertyType}</span>
                      )}
                    </div>

                    {/* Review info for approved/rejected */}
                    {listing.reviewedBy && (
                      <p className="text-xs text-slate-400 mt-1.5">
                        Reviewed by {listing.reviewedBy} on{" "}
                        {formatDate(listing.reviewedAt!)}
                        {listing.reviewNotes && (
                          <span className="italic"> — &ldquo;{listing.reviewNotes}&rdquo;</span>
                        )}
                      </p>
                    )}
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-2 flex-shrink-0">
                    <button
                      onClick={() => setExpandedId(isExpanded ? null : listing.id)}
                      className="p-2 text-slate-400 hover:text-slate-700 hover:bg-slate-50 rounded-md transition-colors"
                    >
                      {isExpanded ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
                    </button>

                    {activeTab === "PENDING_REVIEW" && (
                      <>
                        <button
                          disabled={isLoading}
                          onClick={() => reviewListing(listing.id, "approve")}
                          className="flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium text-white bg-green-600 rounded-md hover:bg-green-700 disabled:opacity-50 transition-colors"
                        >
                          {isLoading ? (
                            <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                          ) : (
                            <CheckCircle size={16} />
                          )}
                          Approve
                        </button>
                        <button
                          disabled={isLoading}
                          onClick={() => reviewListing(listing.id, "reject")}
                          className="flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium text-white bg-red-600 rounded-md hover:bg-red-700 disabled:opacity-50 transition-colors"
                        >
                          {isLoading ? (
                            <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                          ) : (
                            <XCircle size={16} />
                          )}
                          Reject
                        </button>
                      </>
                    )}
                  </div>
                </div>

                {/* Expanded detail */}
                {isExpanded && (
                  <div className="px-4 pb-4 pt-0">
                    <div className="border-t border-slate-100 pt-4">
                      <div className="grid grid-cols-2 gap-4 text-sm">
                        <div>
                          <span className="font-medium text-slate-500">Owner:</span>{" "}
                          <span className="text-slate-900">{listing.ownerName || "Unknown"}</span>
                        </div>
                        <div>
                          <span className="font-medium text-slate-500">Owner Email:</span>{" "}
                          <span className="text-slate-900">{listing.ownerEmail || "N/A"}</span>
                        </div>
                        <div>
                          <span className="font-medium text-slate-500">Created:</span>{" "}
                          <span className="text-slate-900">{formatDate(listing.createdAt)}</span>
                        </div>
                        <div>
                          <span className="font-medium text-slate-500">Zillow:</span>{" "}
                          {listing.zillowUrl ? (
                            <a
                              href={listing.zillowUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-amber-600 hover:underline inline-flex items-center gap-1"
                            >
                              View on Zillow
                              <ExternalLink size={12} />
                            </a>
                          ) : (
                            <span className="text-slate-400">N/A</span>
                          )}
                        </div>
                      </div>

                      {/* Notes input for pending */}
                      {activeTab === "PENDING_REVIEW" && (
                        <div className="mt-4">
                          <textarea
                            placeholder="Add review notes (optional)..."
                            value={notes[listing.id] || ""}
                            onChange={(e) =>
                              setNotes((prev) => ({
                                ...prev,
                                [listing.id]: e.target.value,
                              }))
                            }
                            className="w-full border border-slate-200 rounded-md px-3 py-2 text-sm resize-none h-16 focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500"
                          />
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Pagination */}
      {pagination && pagination.totalPages > 1 && (
        <div className="flex items-center justify-between">
          <span className="text-sm text-slate-500">
            Page {pagination.page} of {pagination.totalPages} ({pagination.totalCount} total)
          </span>
          <div className="flex gap-2">
            <button
              disabled={!pagination.hasPrevPage}
              onClick={() => setPage((p) => p - 1)}
              className="flex items-center gap-1 px-4 py-2 border border-slate-200 bg-white text-slate-700 font-medium rounded-md hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <ChevronLeft size={16} />
              Previous
            </button>
            <button
              disabled={!pagination.hasNextPage}
              onClick={() => setPage((p) => p + 1)}
              className="flex items-center gap-1 px-4 py-2 border border-slate-200 bg-white text-slate-700 font-medium rounded-md hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Next
              <ChevronRight size={16} />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

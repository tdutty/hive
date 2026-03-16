"use client";

import { useState, useEffect } from "react";
import { api } from "@/lib/api";

interface CounteredOffer {
  id: string;
  groupId: string;
  status: string;
  finalRentPerUnit: number;
  counterAmount: number | null;
  counteredAt: string | null;
  landlordName: string | null;
  landlordEmail: string | null;
  landlordPhone: string | null;
  propertyTitle: string | null;
  propertyAddress: { street?: string; city?: string; state?: string } | null;
  tenantCount: number;
  leaseTermMonths: number;
  depositAmount: number;
  createdAt: string;
}

export default function NegotiationsPage() {
  const [offers, setOffers] = useState<CounteredOffer[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [counterAmounts, setCounterAmounts] = useState<Record<string, number>>({});
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const fetchOffers = async () => {
    try {
      const data = await api.get<{ offers: CounteredOffer[] }>(
        "/api/admin/tenant-match/counter-response"
      );
      setOffers(data.offers);
      // Pre-fill counter amounts with midpoint between our offer and their counter
      const amounts: Record<string, number> = {};
      for (const o of data.offers) {
        if (o.counterAmount && o.finalRentPerUnit) {
          amounts[o.id] = Math.round((o.finalRentPerUnit + o.counterAmount) / 2);
        }
      }
      setCounterAmounts(amounts);
    } catch (err) {
      console.error("Failed to load negotiations:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOffers();
  }, []);

  const handleAction = async (
    offerId: string,
    action: "accept" | "counter" | "reject"
  ) => {
    setActionLoading(offerId);
    try {
      await api.post("/api/admin/tenant-match/counter-response", {
        offerId,
        action,
        newAmount: action === "counter" ? counterAmounts[offerId] : undefined,
      });
      await fetchOffers();
    } catch (err) {
      console.error("Action failed:", err);
    } finally {
      setActionLoading(null);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-gray-400">Loading negotiations...</div>
      </div>
    );
  }

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-white">Negotiations</h1>
        <p className="text-gray-400 mt-1">
          Landlord counter offers requiring your response
        </p>
      </div>

      {offers.length === 0 ? (
        <div className="bg-[#2a2a3d] border border-[#3a3a4d] rounded-lg p-12 text-center">
          <p className="text-gray-400 text-lg">No active counter offers</p>
          <p className="text-gray-500 text-sm mt-2">
            Counter offers from landlords will appear here for you to review
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {offers.map((offer) => {
            const isExpanded = expandedId === offer.id;
            const diff =
              offer.counterAmount && offer.finalRentPerUnit
                ? offer.counterAmount - offer.finalRentPerUnit
                : 0;
            const diffPct =
              offer.finalRentPerUnit > 0
                ? Math.round((diff / offer.finalRentPerUnit) * 100)
                : 0;

            return (
              <div
                key={offer.id}
                className="bg-[#2a2a3d] border border-[#3a3a4d] rounded-lg overflow-hidden"
              >
                {/* Header Row */}
                <div
                  className="p-6 cursor-pointer hover:bg-[#2e2e42] transition-colors"
                  onClick={() =>
                    setExpandedId(isExpanded ? null : offer.id)
                  }
                >
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3">
                        <h3 className="text-white font-semibold text-lg">
                          {offer.propertyTitle ||
                            offer.propertyAddress?.street ||
                            "Unknown Property"}
                        </h3>
                        <span className="px-2 py-0.5 bg-amber-500/20 text-amber-400 text-xs font-medium rounded">
                          COUNTERED
                        </span>
                      </div>
                      <p className="text-gray-400 text-sm mt-1">
                        {offer.landlordName || "Unknown Landlord"} &middot;{" "}
                        {offer.tenantCount} tenant(s) &middot;{" "}
                        {offer.leaseTermMonths}mo lease
                      </p>
                    </div>
                    <div className="text-right">
                      <div className="flex items-center gap-4">
                        <div>
                          <div className="text-gray-500 text-xs">Our Offer</div>
                          <div className="text-gray-300 font-medium">
                            ${offer.finalRentPerUnit.toLocaleString()}/mo
                          </div>
                        </div>
                        <div className="text-gray-500">&rarr;</div>
                        <div>
                          <div className="text-amber-400 text-xs">
                            Their Counter
                          </div>
                          <div className="text-amber-400 font-bold text-lg">
                            $
                            {(
                              offer.counterAmount || offer.finalRentPerUnit
                            ).toLocaleString()}
                            /mo
                          </div>
                        </div>
                      </div>
                      <div
                        className={`text-xs mt-1 ${diff > 0 ? "text-red-400" : "text-green-400"}`}
                      >
                        {diff > 0 ? "+" : ""}${diff.toLocaleString()}/mo ({diffPct > 0 ? "+" : ""}
                        {diffPct}%)
                      </div>
                    </div>
                  </div>
                </div>

                {/* Expanded Actions */}
                {isExpanded && (
                  <div className="border-t border-[#3a3a4d] p-6 bg-[#252538]">
                    <div className="grid grid-cols-3 gap-6 mb-6">
                      <div>
                        <div className="text-gray-500 text-xs uppercase tracking-wider">
                          Landlord
                        </div>
                        <div className="text-white mt-1">
                          {offer.landlordName}
                        </div>
                        <div className="text-gray-400 text-sm">
                          {offer.landlordEmail}
                        </div>
                        {offer.landlordPhone && (
                          <a href={`tel:${offer.landlordPhone}`} className="text-blue-400 hover:text-blue-300 text-sm mt-1 inline-block">
                            {offer.landlordPhone}
                          </a>
                        )}
                      </div>
                      <div>
                        <div className="text-gray-500 text-xs uppercase tracking-wider">
                          Annual Value
                        </div>
                        <div className="text-white mt-1">
                          $
                          {(
                            (offer.counterAmount || offer.finalRentPerUnit) *
                            12 *
                            offer.tenantCount
                          ).toLocaleString()}
                        </div>
                      </div>
                      <div>
                        <div className="text-gray-500 text-xs uppercase tracking-wider">
                          Countered
                        </div>
                        <div className="text-white mt-1">
                          {offer.counteredAt
                            ? new Date(offer.counteredAt).toLocaleDateString()
                            : "Unknown"}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-3">
                      {/* Accept Counter */}
                      <button
                        onClick={() => handleAction(offer.id, "accept")}
                        disabled={actionLoading === offer.id}
                        className="px-6 py-3 bg-green-600 hover:bg-green-700 text-white text-sm font-medium rounded transition-colors disabled:opacity-50"
                      >
                        Accept ${(offer.counterAmount || 0).toLocaleString()}
                        /mo
                      </button>

                      {/* Counter Back */}
                      <div className="flex items-center border border-[#3a3a4d] rounded overflow-hidden">
                        <span className="px-3 py-3 bg-[#1e1e2d] text-gray-500 text-sm border-r border-[#3a3a4d]">
                          $
                        </span>
                        <input
                          type="number"
                          value={counterAmounts[offer.id] || ""}
                          onChange={(e) =>
                            setCounterAmounts((prev) => ({
                              ...prev,
                              [offer.id]: Number(e.target.value),
                            }))
                          }
                          className="w-28 px-3 py-3 bg-[#1e1e2d] text-white text-sm focus:outline-none"
                          placeholder="Amount"
                        />
                        <button
                          onClick={() => handleAction(offer.id, "counter")}
                          disabled={
                            actionLoading === offer.id ||
                            !counterAmounts[offer.id]
                          }
                          className="px-4 py-3 bg-amber-600 hover:bg-amber-700 text-white text-sm font-medium transition-colors disabled:opacity-50"
                        >
                          Counter
                        </button>
                      </div>

                      {/* Walk Away */}
                      <button
                        onClick={() => handleAction(offer.id, "reject")}
                        disabled={actionLoading === offer.id}
                        className="px-6 py-3 text-gray-400 hover:text-red-400 text-sm font-medium transition-colors disabled:opacity-50"
                      >
                        Walk Away
                      </button>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

"use client";

import { useState, useEffect } from "react";
import { toast } from "sonner";
import { ArrowRight, ChevronDown, ChevronRight } from "lucide-react";
import { api } from "@/lib/api";
import { Button, Card, CardBody, Badge, statusTone, PageHeader, Input } from "@/components/kit";
import { ErrorBanner, Spinner, EmptyState } from "@/components/ui/AsyncState";
import { cn } from "@/lib/utils";

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
  const [confirmation, setConfirmation] = useState<{ offerId: string; message: string; type: 'success' | 'error' } | null>(null);
  const [error, setError] = useState<string | null>(null);

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
      setError(null);
    } catch (err: any) {
      setError(err?.message || "Failed to load negotiations");
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
      const messages: Record<string, string> = {
        accept: "Counter accepted - triggering lease generation",
        counter: `Counter-offer of $${counterAmounts[offerId]?.toLocaleString()}/mo sent to landlord`,
        reject: "Offer rejected - landlord notified",
      };
      setConfirmation({ offerId, message: messages[action], type: 'success' });
      setTimeout(() => setConfirmation(null), 5000);
      await fetchOffers();
    } catch (err: any) {
      const labels: Record<string, string> = {
        accept: "Failed to accept counter",
        counter: "Failed to send counter-offer",
        reject: "Failed to reject offer",
      };
      toast.error(labels[action], { description: err?.data?.error || err?.message });
    } finally {
      setActionLoading(null);
    }
  };

  if (loading) {
    return <div><PageHeader title="Negotiations" /><Spinner label="Loading negotiations" /></div>;
  }

  return (
    <div className="max-w-7xl">
      <PageHeader title="Negotiations" description="Landlord counter offers requiring your response" />

      {confirmation && (
        <Card className="mb-4" role="status">
          <CardBody className="flex items-center gap-3 py-3">
            <Badge tone={statusTone(confirmation.type === 'success' ? 'success' : 'error')} dot>
              {confirmation.type === 'success' ? 'Done' : 'Failed'}
            </Badge>
            <span className="text-sm text-slate-800">{confirmation.message}</span>
          </CardBody>
        </Card>
      )}

      {error ? (
        <ErrorBanner message={error} onRetry={fetchOffers} />
      ) : offers.length === 0 ? (
        <Card>
          <EmptyState title="No active counter offers" hint="Counter offers from landlords will appear here for you to review" />
        </Card>
      ) : (
        <div className="space-y-3">
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
            const busy = actionLoading === offer.id;

            return (
              <Card key={offer.id} className="overflow-hidden">
                {/* Header row */}
                <button
                  type="button"
                  aria-expanded={isExpanded}
                  onClick={() => setExpandedId(isExpanded ? null : offer.id)}
                  className="w-full text-left px-4 py-3 hover:bg-slate-50 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-amber-500"
                >
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                    <div className="flex items-start gap-2 min-w-0">
                      {isExpanded ? <ChevronDown size={16} className="text-slate-400 shrink-0 mt-1" aria-hidden /> : <ChevronRight size={16} className="text-slate-400 shrink-0 mt-1" aria-hidden />}
                      <div className="min-w-0">
                        <div className="flex flex-wrap items-center gap-2">
                          <h3 className="text-sm font-semibold text-slate-900 truncate">
                            {offer.propertyTitle || offer.propertyAddress?.street || "Unknown Property"}
                          </h3>
                          <Badge tone={statusTone(offer.status)} dot>Countered</Badge>
                        </div>
                        <p className="text-sm text-slate-500 mt-0.5">
                          {offer.landlordName || "Unknown Landlord"} &middot;{" "}
                          {offer.tenantCount} tenant(s) &middot;{" "}
                          {offer.leaseTermMonths}mo lease
                        </p>
                      </div>
                    </div>
                    <div className="sm:text-right shrink-0 pl-6 sm:pl-0">
                      <div className="flex items-center gap-3">
                        <div>
                          <div className="text-xs text-slate-500">Our Offer</div>
                          <div className="text-sm font-medium text-slate-700 tabular">
                            ${offer.finalRentPerUnit.toLocaleString()}/mo
                          </div>
                        </div>
                        <ArrowRight size={14} className="text-slate-400" aria-hidden />
                        <div>
                          <div className="text-xs text-slate-500">Their Counter</div>
                          <div className="text-md font-semibold text-slate-900 tabular">
                            ${(offer.counterAmount || offer.finalRentPerUnit).toLocaleString()}/mo
                          </div>
                        </div>
                      </div>
                      <div className={cn("text-xs font-medium tabular mt-1", diff > 0 ? "text-red-700" : "text-emerald-700")}>
                        {diff > 0 ? "+" : ""}${diff.toLocaleString()}/mo ({diffPct > 0 ? "+" : ""}{diffPct}%)
                      </div>
                    </div>
                  </div>
                </button>

                {/* Expanded actions */}
                {isExpanded && (
                  <CardBody className="border-t border-slate-200 bg-slate-50">
                    <dl className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-5">
                      <div>
                        <dt className="text-xs font-medium text-slate-500 uppercase tracking-wide">Landlord</dt>
                        <dd className="text-sm text-slate-900 mt-1">{offer.landlordName}</dd>
                        <dd className="text-sm text-slate-500 break-all">{offer.landlordEmail}</dd>
                        {offer.landlordPhone && (
                          <dd>
                            <a href={`tel:${offer.landlordPhone}`} className="text-sm text-sky-700 hover:underline mt-1 inline-block tabular">
                              {offer.landlordPhone}
                            </a>
                          </dd>
                        )}
                      </div>
                      <div>
                        <dt className="text-xs font-medium text-slate-500 uppercase tracking-wide">Annual Value</dt>
                        <dd className="text-sm text-slate-900 mt-1 tabular">
                          ${((offer.counterAmount || offer.finalRentPerUnit) * 12 * offer.tenantCount).toLocaleString()}
                        </dd>
                      </div>
                      <div>
                        <dt className="text-xs font-medium text-slate-500 uppercase tracking-wide">Countered</dt>
                        <dd className="text-sm text-slate-900 mt-1 tabular">
                          {offer.counteredAt ? new Date(offer.counteredAt).toLocaleDateString() : "Unknown"}
                        </dd>
                      </div>
                    </dl>

                    <div className="flex flex-wrap items-center gap-2">
                      {/* Accept counter: the one primary action */}
                      <Button
                        variant="primary"
                        onClick={() => handleAction(offer.id, "accept")}
                        disabled={busy}
                        loading={busy}
                      >
                        {busy ? "Processing" : `Accept $${(offer.counterAmount || 0).toLocaleString()}/mo`}
                      </Button>

                      {/* Counter back */}
                      <div className="flex items-center gap-1.5">
                        <span className="text-sm text-slate-500" aria-hidden>$</span>
                        <Input
                          type="number"
                          aria-label="Counter amount"
                          value={counterAmounts[offer.id] || ""}
                          onChange={(e) =>
                            setCounterAmounts((prev) => ({
                              ...prev,
                              [offer.id]: Number(e.target.value),
                            }))
                          }
                          className="w-28 tabular"
                          placeholder="Amount"
                        />
                        <Button
                          onClick={() => handleAction(offer.id, "counter")}
                          disabled={busy || !counterAmounts[offer.id]}
                        >
                          Counter
                        </Button>
                      </div>

                      {/* Walk away */}
                      <Button
                        variant="ghost"
                        onClick={() => handleAction(offer.id, "reject")}
                        disabled={busy}
                        className="hover:text-red-700"
                      >
                        {busy ? "Processing" : "Walk Away"}
                      </Button>
                    </div>
                  </CardBody>
                )}
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}

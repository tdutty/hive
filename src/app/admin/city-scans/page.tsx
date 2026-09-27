"use client";

import { Fragment, useState, useEffect } from "react";
import { toast } from "sonner";
import { api } from "@/lib/api";
import { Button, Card, CardHeader, CardBody, Badge, PageHeader, Table, THead, TH, TBody, TR, TD, Field, Input } from "@/components/kit";
import { ErrorBanner, Spinner, EmptyState } from "@/components/ui/AsyncState";
import { RefreshCw, Search, Phone, Mail, MapPin, ChevronDown, ChevronUp } from "lucide-react";

interface CityScore {
  id: number;
  city: string;
  state: string;
  total_listings: number;
  unique_buildings: number;
  portfolio_landlords: number;
  enriched_count: number;
  credits_used: number;
  status: string;
  completed_at: string;
}

interface PortfolioLandlord {
  id: number;
  city: string;
  state: string;
  owner_name: string | null;
  owner_email: string | null;
  owner_phone: string | null;
  owner_type: string | null;
  building_name: string | null;
  unit_count: number;
  portfolio_size: number;
  price_min: number | null;
  price_max: number | null;
  estimated_value: number | null;
  sample_address: string | null;
  listing_phone: string | null;
}

export default function CityScanPage() {
  const [scans, setScans] = useState<CityScore[]>([]);
  const [landlords, setLandlords] = useState<PortfolioLandlord[]>([]);
  const [selectedCity, setSelectedCity] = useState<{ city: string; state: string } | null>(null);
  const [loading, setLoading] = useState(true);
  const [scanning, setScanning] = useState(false);
  const [scanCity, setScanCity] = useState("");
  const [scanState, setScanState] = useState("");
  const [expandedId, setExpandedId] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);

  const fetchScans = async () => {
    setLoading(true);
    try {
      const data = await api.get<{ scans: CityScore[] }>("/api/admin/city-scans");
      setScans(data.scans || []);
      setError(null);
    } catch (err: any) {
      setError(err?.message || "Failed to load scans");
    } finally {
      setLoading(false);
    }
  };

  const fetchLandlords = async (city: string, state: string) => {
    try {
      const data = await api.get<{ landlords: PortfolioLandlord[] }>(
        "/api/admin/city-scans",
        { city, state }
      );
      setLandlords(data.landlords || []);
      setSelectedCity({ city, state });
    } catch (err: any) {
      toast.error(`Failed to load landlords for ${city}, ${state}`, { description: err?.message });
    }
  };

  const triggerScan = async () => {
    if (!scanCity.trim() || !scanState.trim()) return;
    setScanning(true);
    try {
      await api.post("/api/admin/city-scans", {
        city: scanCity.trim(),
        state: scanState.trim(),
        bedroomsMin: 1,
      });
      setScanCity("");
      setScanState("");
      fetchScans();
    } catch (err: any) {
      toast.error("Scan failed", { description: err?.data?.error || err?.message });
    } finally {
      setScanning(false);
    }
  };

  useEffect(() => {
    fetchScans();
  }, []);

  const bestPhone = (l: PortfolioLandlord) => l.owner_phone || l.listing_phone;
  const formatPhone = (p: string) => {
    const d = p.replace(/\D/g, "");
    if (d.length === 10) return `(${d.slice(0, 3)}) ${d.slice(3, 6)}-${d.slice(6)}`;
    return p;
  };

  return (
    <div className="max-w-7xl">
      <PageHeader
        title="City Scans"
        description="Scan rental markets to find portfolio landlords"
        actions={<Button icon={<RefreshCw size={14} />} onClick={fetchScans}>Refresh</Button>}
      />

      {/* Scan New City */}
      <Card className="mb-5">
        <CardHeader title="Scan a new market" />
        <CardBody>
          <div className="flex flex-col sm:flex-row sm:items-end gap-3">
            <Field label="City" className="flex-1">
              <Input value={scanCity} onChange={(e) => setScanCity(e.target.value)} placeholder="Tucson" />
            </Field>
            <Field label="State" className="sm:w-24">
              <Input value={scanState} onChange={(e) => setScanState(e.target.value)} placeholder="AZ" />
            </Field>
            <Button
              variant="primary"
              icon={<Search size={14} />}
              loading={scanning}
              onClick={triggerScan}
              disabled={!scanCity.trim() || !scanState.trim()}
            >
              {scanning ? "Scanning" : "Scan market"}
            </Button>
          </div>
        </CardBody>
      </Card>

      {/* Scanned Cities */}
      {loading ? (
        <Spinner label="Loading scans" />
      ) : error ? (
        <ErrorBanner message={error} onRetry={fetchScans} />
      ) : scans.length === 0 ? (
        <Card><EmptyState title="No cities scanned yet" hint="Use the form above to scan a market." /></Card>
      ) : (
        <div className="mb-5">
          <h2 className="text-sm font-semibold text-slate-900 mb-3">Scanned markets</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {scans.map((scan) => {
              const selected = selectedCity?.city === scan.city && selectedCity?.state === scan.state;
              return (
                <button
                  key={scan.id}
                  onClick={() => fetchLandlords(scan.city, scan.state)}
                  aria-pressed={selected}
                  className={`bg-white border rounded-lg p-4 text-left transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-500 ${
                    selected ? "border-amber-500 bg-amber-50/40" : "border-slate-200 hover:border-slate-400"
                  }`}
                >
                  <div className="flex items-center gap-2 mb-3">
                    <MapPin size={14} className="text-amber-600" aria-hidden />
                    <h3 className="text-sm font-semibold text-slate-900">{scan.city}, {scan.state}</h3>
                  </div>
                  <dl className="grid grid-cols-2 gap-2">
                    <div>
                      <dt className="text-xs text-slate-500">Listings</dt>
                      <dd className="text-sm font-semibold text-slate-900 tabular">{scan.total_listings?.toLocaleString()}</dd>
                    </div>
                    <div>
                      <dt className="text-xs text-slate-500">Buildings</dt>
                      <dd className="text-sm font-semibold text-slate-900 tabular">{scan.unique_buildings}</dd>
                    </div>
                    <div>
                      <dt className="text-xs text-slate-500">Portfolios</dt>
                      <dd className="text-sm font-semibold text-slate-900 tabular">{scan.portfolio_landlords}</dd>
                    </div>
                    <div>
                      <dt className="text-xs text-slate-500">Enriched</dt>
                      <dd className="text-sm font-semibold text-slate-900 tabular">{scan.enriched_count}</dd>
                    </div>
                  </dl>
                  <p className="mt-3 text-xs text-slate-500 tabular">
                    Scanned {scan.completed_at ? new Date(scan.completed_at).toLocaleDateString() : "in progress"}
                    {" · "}{scan.credits_used} credits
                  </p>
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Portfolio Landlords Table */}
      {selectedCity && (
        <Card>
          <CardHeader
            title={<span className="inline-flex items-center gap-2">Portfolio landlords: {selectedCity.city}, {selectedCity.state} <Badge tone="accent">{landlords.length}</Badge></span>}
          />
          {landlords.length === 0 ? (
            <EmptyState title="No portfolio landlords found" hint="This market has no enriched portfolio owners yet." />
          ) : (
            <Table>
              <THead>
                <tr>
                  <TH>Building / Owner</TH>
                  <TH numeric>Portfolio</TH>
                  <TH numeric>Units</TH>
                  <TH>Contact</TH>
                  <TH numeric>Price range</TH>
                  <TH className="w-10"><span className="sr-only">Details</span></TH>
                </tr>
              </THead>
              <TBody>
                {landlords.map((l) => {
                  const phone = bestPhone(l);
                  const isExpanded = expandedId === l.id;
                  return (
                    <Fragment key={l.id}>
                      <TR clickable selected={isExpanded} onClick={() => setExpandedId(isExpanded ? null : l.id)}>
                        <TD>
                          <div className="font-medium text-slate-900">{l.building_name || "Individual Property"}</div>
                          <div className="text-xs text-slate-500 mt-0.5">
                            {l.owner_name && l.owner_name !== l.building_name ? l.owner_name : l.sample_address || "-"}
                          </div>
                        </TD>
                        <TD numeric>
                          <span className={`font-semibold ${l.portfolio_size >= 100 ? "text-amber-700" : l.portfolio_size >= 10 ? "text-amber-600" : "text-slate-700"}`}>
                            {l.portfolio_size > 0 ? l.portfolio_size.toLocaleString() : "-"}
                          </span>
                        </TD>
                        <TD numeric muted>{l.unit_count}</TD>
                        <TD>
                          <div className="flex items-center gap-3">
                            {phone ? (
                              <a
                                href={`tel:${phone}`}
                                onClick={(e) => e.stopPropagation()}
                                className="inline-flex items-center gap-1 text-sky-700 hover:text-sky-900 font-medium tabular"
                              >
                                <Phone size={12} aria-hidden />
                                {formatPhone(phone)}
                              </a>
                            ) : (
                              <span className="text-slate-400 text-xs">No phone</span>
                            )}
                            {l.owner_email && (
                              <a
                                href={`mailto:${l.owner_email}`}
                                onClick={(e) => e.stopPropagation()}
                                aria-label={`Email ${l.owner_email}`}
                                className="text-slate-400 hover:text-slate-600"
                              >
                                <Mail size={12} aria-hidden />
                              </a>
                            )}
                          </div>
                        </TD>
                        <TD numeric muted>
                          {l.price_min
                            ? `$${l.price_min.toLocaleString()}${l.price_max && l.price_max !== l.price_min ? ` - $${l.price_max.toLocaleString()}` : ""}`
                            : "-"}
                        </TD>
                        <TD>
                          {isExpanded ? (
                            <ChevronUp size={14} className="text-slate-400" aria-hidden />
                          ) : (
                            <ChevronDown size={14} className="text-slate-400" aria-hidden />
                          )}
                        </TD>
                      </TR>
                      {isExpanded && (
                        <tr className="bg-slate-50">
                          <td colSpan={6} className="px-3 py-4">
                            <dl className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                              <div>
                                <dt className="text-xs font-medium text-slate-500 uppercase tracking-wide">Owner</dt>
                                <dd className="text-slate-900 mt-1">{l.owner_name || "Unknown"}</dd>
                                <dd className="text-xs text-slate-500">{l.owner_type || "-"}</dd>
                              </div>
                              <div>
                                <dt className="text-xs font-medium text-slate-500 uppercase tracking-wide">Email</dt>
                                <dd className="mt-1 break-all">
                                  {l.owner_email ? (
                                    <a href={`mailto:${l.owner_email}`} className="text-sky-700 hover:underline">{l.owner_email}</a>
                                  ) : (
                                    <span className="text-slate-400">Not found</span>
                                  )}
                                </dd>
                              </div>
                              <div>
                                <dt className="text-xs font-medium text-slate-500 uppercase tracking-wide">Phone</dt>
                                <dd className="mt-1 tabular">
                                  {l.owner_phone && (
                                    <div>
                                      <a href={`tel:${l.owner_phone}`} className="text-sky-700 hover:underline">{formatPhone(l.owner_phone)}</a>
                                      <span className="text-xs text-slate-500 ml-1">(owner)</span>
                                    </div>
                                  )}
                                  {l.listing_phone && l.listing_phone !== l.owner_phone && (
                                    <div>
                                      <a href={`tel:${l.listing_phone}`} className="text-sky-700 hover:underline">{formatPhone(l.listing_phone)}</a>
                                      <span className="text-xs text-slate-500 ml-1">(listing)</span>
                                    </div>
                                  )}
                                  {!l.owner_phone && !l.listing_phone && <span className="text-slate-400">Not found</span>}
                                </dd>
                              </div>
                              <div>
                                <dt className="text-xs font-medium text-slate-500 uppercase tracking-wide">Address</dt>
                                <dd className="text-xs text-slate-600 mt-1">{l.sample_address || "-"}</dd>
                                {l.estimated_value && (
                                  <dd className="text-xs text-slate-500 mt-1 tabular">Est. value: ${l.estimated_value.toLocaleString()}</dd>
                                )}
                              </div>
                            </dl>
                          </td>
                        </tr>
                      )}
                    </Fragment>
                  );
                })}
              </TBody>
            </Table>
          )}
        </Card>
      )}
    </div>
  );
}

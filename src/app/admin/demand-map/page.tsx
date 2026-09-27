"use client";

import { useState, useEffect } from "react";
import { sweetleaseApi } from "@/lib/api";
import { RefreshCw, Users, Home, Phone, Mail, ChevronDown, ChevronUp } from "lucide-react";
import { Button, Card, Badge, statusTone, PageHeader, Table, THead, TH, TBody, TR, TD } from "@/components/kit";
import { Spinner, EmptyState } from "@/components/ui/AsyncState";

interface Tenant {
  name: string;
  email: string;
  city: string;
  state: string;
  budgetMax: number;
  bedrooms: number;
  moveInDate: string;
  status: string;
  selectionsCount: number;
}

interface HighPainLandlord {
  ownerName: string;
  ownerEmail: string;
  ownerPhone: string;
  address: string;
  city: string;
  price: number;
  daysOnMarket: number;
  unitCount: number;
  totalRent: number;
}

interface CityData {
  city: string;
  state: string;
  tenants: Tenant[];
  totalListings: number;
  approvedListings: number;
  highPainLandlords: HighPainLandlord[];
}

const humanize = (s: string) => s.replace(/_/g, " ");

export default function DemandMapPage() {
  const [data, setData] = useState<CityData[]>([]);
  const [loading, setLoading] = useState(true);
  const [expanded, setExpanded] = useState<string | null>(null);

  const fetchData = async () => {
    try {
      const result = await sweetleaseApi.get<{ cities: CityData[] }>("/api/admin/demand-map");
      setData(result.cities || []);
    } catch {
      console.error("Failed to fetch demand map");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  return (
    <div className="max-w-7xl">
      <PageHeader
        title="Demand Map"
        description="Active tenants by city with high-pain landlord call targets"
        actions={<Button icon={<RefreshCw size={14} />} onClick={fetchData}>Refresh</Button>}
      />

      {loading ? (
        <Spinner label="Loading demand map" />
      ) : data.length === 0 ? (
        <Card><EmptyState title="No active demand" hint="Cities appear here once tenants are searching." /></Card>
      ) : (
        <div className="space-y-3">
          {data.map((city) => {
            const isOpen = expanded === city.city;
            const statusCounts = city.tenants.reduce<Record<string, number>>((acc, t) => {
              acc[t.status] = (acc[t.status] || 0) + 1;
              return acc;
            }, {});
            return (
              <Card key={city.city} className="overflow-hidden">
                {/* City Header */}
                <button
                  type="button"
                  aria-expanded={isOpen}
                  className="w-full px-4 py-3 text-left hover:bg-slate-50 transition-colors flex flex-wrap items-center justify-between gap-3 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-amber-500"
                  onClick={() => setExpanded(isOpen ? null : city.city)}
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-10 h-10 shrink-0 bg-amber-600 rounded-lg flex items-center justify-center text-white font-semibold text-sm tabular">
                      {city.tenants.length}
                    </div>
                    <div className="min-w-0">
                      <div className="text-sm font-semibold text-slate-900">{city.city}, {city.state}</div>
                      <div className="text-xs text-slate-500 flex flex-wrap items-center gap-3 tabular">
                        <span className="inline-flex items-center gap-1"><Users size={12} aria-hidden /> {city.tenants.length} tenant{city.tenants.length !== 1 ? "s" : ""}</span>
                        <span className="inline-flex items-center gap-1"><Home size={12} aria-hidden /> {city.approvedListings} listings</span>
                        <span className="inline-flex items-center gap-1"><Phone size={12} aria-hidden /> {city.highPainLandlords.length} call targets</span>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 flex-wrap">
                    {Object.entries(statusCounts).map(([s, n]) => (
                      <Badge key={s} tone={statusTone(s)} dot>{humanize(s)} <span className="tabular">{n}</span></Badge>
                    ))}
                    {isOpen ? <ChevronUp size={14} className="text-slate-400" aria-hidden /> : <ChevronDown size={14} className="text-slate-400" aria-hidden />}
                  </div>
                </button>

                {/* Expanded */}
                {isOpen && (
                  <div className="border-t border-slate-200">
                    {/* Tenants */}
                    <div className="px-4 pt-3 pb-1">
                      <h3 className="text-xs font-medium uppercase tracking-wide text-slate-500">Active tenants</h3>
                    </div>
                    <Table>
                      <THead>
                        <tr>
                          <TH>Tenant</TH>
                          <TH numeric>Budget</TH>
                          <TH numeric>Beds</TH>
                          <TH>Move-in</TH>
                          <TH>Status</TH>
                        </tr>
                      </THead>
                      <TBody>
                        {city.tenants.map((t, i) => (
                          <TR key={i}>
                            <TD>
                              <div className="font-medium text-slate-900">{t.name}</div>
                              <div className="text-xs text-slate-500 break-all">{t.email}</div>
                            </TD>
                            <TD numeric>${t.budgetMax.toLocaleString()}</TD>
                            <TD numeric muted>{t.bedrooms}BR</TD>
                            <TD muted className="tabular whitespace-nowrap">{t.moveInDate}</TD>
                            <TD><Badge tone={statusTone(t.status)} dot>{humanize(t.status)}</Badge></TD>
                          </TR>
                        ))}
                      </TBody>
                    </Table>

                    {/* High Pain Landlords */}
                    {city.highPainLandlords.length > 0 && (
                      <div className="border-t border-slate-200">
                        <div className="px-4 pt-3 pb-1">
                          <h3 className="text-xs font-medium uppercase tracking-wide text-slate-500 inline-flex items-center gap-1.5">
                            <Phone size={12} className="text-amber-600" aria-hidden />
                            Cold call targets (high DOM + portfolio)
                          </h3>
                        </div>
                        <Table>
                          <THead>
                            <tr>
                              <TH>Owner</TH>
                              <TH numeric>Rent</TH>
                              <TH numeric>Units</TH>
                              <TH numeric>DOM</TH>
                              <TH>Contact</TH>
                            </tr>
                          </THead>
                          <TBody>
                            {city.highPainLandlords.map((l, i) => (
                              <TR key={i}>
                                <TD>
                                  <div className="font-medium text-slate-900">{l.ownerName}</div>
                                  <div className="text-xs text-slate-500">{l.address}</div>
                                </TD>
                                <TD numeric muted>${l.price.toLocaleString()}/mo</TD>
                                <TD numeric className={l.unitCount > 1 ? "font-medium" : "text-slate-500"}>{l.unitCount > 1 ? `${l.unitCount} units` : "-"}</TD>
                                <TD numeric className={l.daysOnMarket > 0 ? "font-medium" : "text-slate-500"}>{l.daysOnMarket > 0 ? `${l.daysOnMarket}d` : "-"}</TD>
                                <TD>
                                  <div className="flex items-center gap-3">
                                    {l.ownerPhone ? (
                                      <a href={`tel:${l.ownerPhone}`} className="inline-flex items-center gap-1 text-sky-700 hover:text-sky-900 font-medium tabular whitespace-nowrap">
                                        <Phone size={12} aria-hidden />
                                        {l.ownerPhone.replace(/(\d{3})(\d{3})(\d{4})/, "($1) $2-$3")}
                                      </a>
                                    ) : (
                                      <span className="text-xs text-slate-400">No phone</span>
                                    )}
                                    {l.ownerEmail && (
                                      <a href={`mailto:${l.ownerEmail}`} aria-label={`Email ${l.ownerEmail}`} className="text-slate-400 hover:text-slate-600">
                                        <Mail size={12} aria-hidden />
                                      </a>
                                    )}
                                  </div>
                                </TD>
                              </TR>
                            ))}
                          </TBody>
                        </Table>
                      </div>
                    )}
                  </div>
                )}
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}

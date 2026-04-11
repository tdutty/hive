"use client";

import { useState, useEffect } from "react";
import { api } from "@/lib/api";
import { RefreshCw, MapPin, Users, Home, DollarSign, Calendar, Phone, Mail } from "lucide-react";

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

export default function DemandMapPage() {
  const [data, setData] = useState<CityData[]>([]);
  const [loading, setLoading] = useState(true);
  const [expanded, setExpanded] = useState<string | null>(null);

  const fetchData = async () => {
    try {
      const result = await api.get<{ cities: CityData[] }>("/api/admin/demand-map");
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

  const STATUS_COLORS: Record<string, string> = {
    matched: "bg-blue-500",
    outreach: "bg-purple-500",
    selections_confirmed: "bg-emerald-500",
    negotiating: "bg-amber-500",
    searching: "bg-gray-400",
    leased: "bg-green-600",
  };

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-3">
            <MapPin size={24} className="text-amber-500" />
            Demand Map
          </h1>
          <p className="text-sm text-slate-400 mt-1">
            Active tenants by city with high-pain landlord call targets
          </p>
        </div>
        <button
          onClick={fetchData}
          className="flex items-center gap-2 px-3 py-2 bg-[#2a2a3e] text-slate-400 hover:text-white rounded-lg text-sm transition"
        >
          <RefreshCw size={14} />
          Refresh
        </button>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-12">
          <RefreshCw className="animate-spin text-slate-500" size={20} />
        </div>
      ) : data.length === 0 ? (
        <div className="text-center text-slate-500 py-12">No active demand</div>
      ) : (
        <div className="space-y-4">
          {data.map((city) => (
            <div key={city.city} className="bg-[#1e1e2d] border border-[#2f2f42] rounded-xl overflow-hidden">
              {/* City Header */}
              <div
                className="px-6 py-4 cursor-pointer hover:bg-[#252538] transition flex items-center justify-between"
                onClick={() => setExpanded(expanded === city.city ? null : city.city)}
              >
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-[#EA580C] rounded-lg flex items-center justify-center text-white font-bold text-lg">
                    {city.tenants.length}
                  </div>
                  <div>
                    <div className="text-white font-semibold text-lg">{city.city}, {city.state}</div>
                    <div className="text-xs text-slate-400 flex items-center gap-3">
                      <span className="flex items-center gap-1"><Users size={10} /> {city.tenants.length} tenant{city.tenants.length !== 1 ? 's' : ''}</span>
                      <span className="flex items-center gap-1"><Home size={10} /> {city.approvedListings} listings</span>
                      <span className="flex items-center gap-1"><Phone size={10} /> {city.highPainLandlords.length} call targets</span>
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {city.tenants.map((t, i) => (
                    <div
                      key={i}
                      className={`w-2.5 h-2.5 rounded-full ${STATUS_COLORS[t.status] || "bg-gray-400"}`}
                      title={`${t.name} - ${t.status}`}
                    />
                  ))}
                </div>
              </div>

              {/* Expanded */}
              {expanded === city.city && (
                <div className="border-t border-[#2f2f42]">
                  {/* Tenants */}
                  <div className="px-6 py-4">
                    <div className="text-[10px] uppercase tracking-wider text-slate-500 mb-3 font-medium">Active Tenants</div>
                    <div className="space-y-2">
                      {city.tenants.map((t, i) => (
                        <div key={i} className="flex items-center justify-between py-2 px-3 bg-[#252538] rounded-lg">
                          <div className="flex items-center gap-3">
                            <div className={`w-2 h-2 rounded-full ${STATUS_COLORS[t.status] || "bg-gray-400"}`} />
                            <div>
                              <span className="text-sm font-medium text-white">{t.name}</span>
                              <span className="text-xs text-slate-500 ml-2">{t.email}</span>
                            </div>
                          </div>
                          <div className="flex items-center gap-4 text-xs text-slate-400">
                            <span className="flex items-center gap-1"><DollarSign size={10} />${t.budgetMax.toLocaleString()}</span>
                            <span>{t.bedrooms}BR</span>
                            <span className="flex items-center gap-1"><Calendar size={10} />{t.moveInDate}</span>
                            <span className={`px-2 py-0.5 rounded text-[10px] font-medium uppercase ${
                              t.status === 'outreach' ? 'bg-purple-900 text-purple-300' :
                              t.status === 'selections_confirmed' ? 'bg-emerald-900 text-emerald-300' :
                              t.status === 'matched' ? 'bg-blue-900 text-blue-300' :
                              'bg-slate-700 text-slate-300'
                            }`}>
                              {t.status}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* High Pain Landlords */}
                  {city.highPainLandlords.length > 0 && (
                    <div className="px-6 py-4 border-t border-[#2f2f42]">
                      <div className="text-[10px] uppercase tracking-wider text-slate-500 mb-3 font-medium flex items-center gap-2">
                        <Phone size={10} className="text-amber-500" />
                        Cold Call Targets (High DOM + Portfolio)
                      </div>
                      <div className="space-y-2">
                        {city.highPainLandlords.map((l, i) => (
                          <div key={i} className="flex items-center justify-between py-2.5 px-3 bg-[#252538] rounded-lg border border-[#2f2f42] hover:border-amber-500/30 transition">
                            <div className="flex items-center gap-3">
                              <div className="w-8 h-8 bg-amber-600/20 text-amber-500 flex items-center justify-center rounded text-[10px] font-bold">
                                {l.daysOnMarket > 0 ? l.daysOnMarket + 'd' : l.unitCount + 'u'}
                              </div>
                              <div>
                                <div className="text-sm font-medium text-white">{l.ownerName}</div>
                                <div className="text-xs text-slate-500">{l.address}</div>
                              </div>
                            </div>
                            <div className="flex items-center gap-4 text-xs">
                              <span className="text-slate-400">${l.price.toLocaleString()}/mo</span>
                              {l.unitCount > 1 && (
                                <span className="text-amber-400 font-medium">{l.unitCount} units</span>
                              )}
                              {l.daysOnMarket > 0 && (
                                <span className="text-red-400 font-medium">{l.daysOnMarket} DOM</span>
                              )}
                              {l.ownerPhone && (
                                <a href={`tel:${l.ownerPhone}`} className="flex items-center gap-1 text-emerald-400 hover:text-emerald-300">
                                  <Phone size={10} />
                                  {l.ownerPhone.replace(/(\d{3})(\d{3})(\d{4})/, '($1) $2-$3')}
                                </a>
                              )}
                              {l.ownerEmail && (
                                <a href={`mailto:${l.ownerEmail}`} className="text-blue-400 hover:text-blue-300">
                                  <Mail size={10} />
                                </a>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

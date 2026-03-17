"use client";

import { useState, useEffect } from "react";
import { api } from "@/lib/api";
import { RefreshCw, Search, Phone, Mail, Building2, MapPin, ChevronDown, ChevronUp } from "lucide-react";

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

  const fetchScans = async () => {
    setLoading(true);
    try {
      const data = await api.get<{ scans: CityScore[] }>("/api/admin/city-scans");
      setScans(data.scans || []);
    } catch {
      console.error("Failed to load scans");
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
    } catch {
      console.error("Failed to load landlords");
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
    } catch (err) {
      console.error("Scan failed:", err);
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
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-slate-900 mb-2">
            City Scans
          </h1>
          <p className="text-slate-500">
            Scan rental markets to find portfolio landlords
          </p>
        </div>
        <button
          onClick={fetchScans}
          className="flex items-center gap-2 px-4 py-2 border border-slate-200 rounded-lg text-sm text-slate-600 hover:bg-slate-50"
        >
          <RefreshCw size={14} />
          Refresh
        </button>
      </div>

      {/* Scan New City */}
      <div className="bg-white border border-slate-200 rounded-lg shadow-sm p-6">
        <h2 className="text-sm font-semibold text-slate-700 uppercase tracking-wider mb-4">
          Scan a New Market
        </h2>
        <div className="flex items-end gap-3">
          <div className="flex-1">
            <label className="block text-xs text-slate-500 mb-1">City</label>
            <input
              value={scanCity}
              onChange={(e) => setScanCity(e.target.value)}
              placeholder="Tucson"
              className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500"
            />
          </div>
          <div className="w-24">
            <label className="block text-xs text-slate-500 mb-1">State</label>
            <input
              value={scanState}
              onChange={(e) => setScanState(e.target.value)}
              placeholder="AZ"
              className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500"
            />
          </div>
          <button
            onClick={triggerScan}
            disabled={scanning || !scanCity.trim() || !scanState.trim()}
            className="flex items-center gap-2 px-6 py-2 bg-amber-600 text-white rounded-lg text-sm font-medium hover:bg-amber-700 disabled:opacity-50"
          >
            {scanning ? (
              <>
                <RefreshCw size={14} className="animate-spin" />
                Scanning...
              </>
            ) : (
              <>
                <Search size={14} />
                Scan Market
              </>
            )}
          </button>
        </div>
      </div>

      {/* Scanned Cities */}
      {loading ? (
        <div className="flex items-center justify-center py-12">
          <RefreshCw className="animate-spin text-amber-600" size={32} />
        </div>
      ) : scans.length === 0 ? (
        <div className="bg-white border border-slate-200 rounded-lg p-12 text-center text-slate-500">
          No cities scanned yet. Use the form above to scan a market.
        </div>
      ) : (
        <div className="space-y-4">
          <h2 className="text-sm font-semibold text-slate-700 uppercase tracking-wider">
            Scanned Markets
          </h2>
          <div className="grid grid-cols-3 gap-4">
            {scans.map((scan) => (
              <button
                key={scan.id}
                onClick={() => fetchLandlords(scan.city, scan.state)}
                className={`bg-white border rounded-lg shadow-sm p-5 text-left hover:border-amber-300 transition-colors ${
                  selectedCity?.city === scan.city && selectedCity?.state === scan.state
                    ? "border-amber-500 ring-2 ring-amber-500/20"
                    : "border-slate-200"
                }`}
              >
                <div className="flex items-center gap-2 mb-3">
                  <MapPin size={16} className="text-amber-600" />
                  <h3 className="font-semibold text-slate-900">
                    {scan.city}, {scan.state}
                  </h3>
                </div>
                <div className="grid grid-cols-2 gap-2 text-sm">
                  <div>
                    <div className="text-slate-400 text-xs">Listings</div>
                    <div className="font-semibold text-slate-900">
                      {scan.total_listings?.toLocaleString()}
                    </div>
                  </div>
                  <div>
                    <div className="text-slate-400 text-xs">Buildings</div>
                    <div className="font-semibold text-slate-900">
                      {scan.unique_buildings}
                    </div>
                  </div>
                  <div>
                    <div className="text-slate-400 text-xs">Portfolios</div>
                    <div className="font-semibold text-amber-600">
                      {scan.portfolio_landlords}
                    </div>
                  </div>
                  <div>
                    <div className="text-slate-400 text-xs">Enriched</div>
                    <div className="font-semibold text-green-600">
                      {scan.enriched_count}
                    </div>
                  </div>
                </div>
                <div className="mt-3 text-xs text-slate-400">
                  Scanned{" "}
                  {scan.completed_at
                    ? new Date(scan.completed_at).toLocaleDateString()
                    : "in progress"}
                  {" · "}{scan.credits_used} credits
                </div>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Portfolio Landlords Table */}
      {selectedCity && (
        <div>
          <h2 className="text-sm font-semibold text-slate-700 uppercase tracking-wider mb-4">
            Portfolio Landlords — {selectedCity.city}, {selectedCity.state}
            <span className="ml-2 text-amber-600 font-normal">
              ({landlords.length})
            </span>
          </h2>
          <div className="bg-white border border-slate-200 rounded-lg shadow-sm overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50">
                  <th className="text-left font-semibold text-slate-600 px-5 py-3">
                    Building / Owner
                  </th>
                  <th className="text-right font-semibold text-slate-600 px-5 py-3">
                    Portfolio
                  </th>
                  <th className="text-right font-semibold text-slate-600 px-5 py-3">
                    Units
                  </th>
                  <th className="text-left font-semibold text-slate-600 px-5 py-3">
                    Contact
                  </th>
                  <th className="text-right font-semibold text-slate-600 px-5 py-3">
                    Price Range
                  </th>
                  <th className="w-10" />
                </tr>
              </thead>
              <tbody>
                {landlords.map((l) => {
                  const phone = bestPhone(l);
                  const isExpanded = expandedId === l.id;
                  return (
                    <>
                      <tr
                        key={l.id}
                        className="border-b border-slate-100 hover:bg-slate-50 cursor-pointer"
                        onClick={() =>
                          setExpandedId(isExpanded ? null : l.id)
                        }
                      >
                        <td className="px-5 py-3">
                          <div className="font-medium text-slate-900">
                            {l.building_name || "Individual Property"}
                          </div>
                          <div className="text-xs text-slate-400 mt-0.5">
                            {l.owner_name && l.owner_name !== l.building_name
                              ? l.owner_name
                              : l.sample_address || "—"}
                          </div>
                        </td>
                        <td className="px-5 py-3 text-right">
                          <span
                            className={`font-bold ${
                              l.portfolio_size >= 100
                                ? "text-amber-600"
                                : l.portfolio_size >= 10
                                  ? "text-amber-500"
                                  : "text-slate-600"
                            }`}
                          >
                            {l.portfolio_size > 0
                              ? l.portfolio_size.toLocaleString()
                              : "—"}
                          </span>
                        </td>
                        <td className="px-5 py-3 text-right text-slate-600">
                          {l.unit_count}
                        </td>
                        <td className="px-5 py-3">
                          <div className="flex items-center gap-3">
                            {phone ? (
                              <a
                                href={`tel:${phone}`}
                                onClick={(e) => e.stopPropagation()}
                                className="flex items-center gap-1 text-blue-600 hover:text-blue-700 font-medium"
                              >
                                <Phone size={12} />
                                {formatPhone(phone)}
                              </a>
                            ) : (
                              <span className="text-slate-300 text-xs">
                                No phone
                              </span>
                            )}
                            {l.owner_email && (
                              <a
                                href={`mailto:${l.owner_email}`}
                                onClick={(e) => e.stopPropagation()}
                                className="text-slate-400 hover:text-slate-600"
                              >
                                <Mail size={12} />
                              </a>
                            )}
                          </div>
                        </td>
                        <td className="px-5 py-3 text-right text-slate-600">
                          {l.price_min
                            ? `$${l.price_min.toLocaleString()}${l.price_max && l.price_max !== l.price_min ? ` - $${l.price_max.toLocaleString()}` : ""}`
                            : "—"}
                        </td>
                        <td className="px-3 py-3">
                          {isExpanded ? (
                            <ChevronUp size={14} className="text-slate-400" />
                          ) : (
                            <ChevronDown
                              size={14}
                              className="text-slate-400"
                            />
                          )}
                        </td>
                      </tr>
                      {isExpanded && (
                        <tr key={`${l.id}-detail`} className="border-b border-slate-100 bg-slate-50">
                          <td colSpan={6} className="px-5 py-4">
                            <div className="grid grid-cols-4 gap-4 text-sm">
                              <div>
                                <div className="text-xs text-slate-400 uppercase tracking-wider">
                                  Owner
                                </div>
                                <div className="text-slate-900 mt-1">
                                  {l.owner_name || "Unknown"}
                                </div>
                                <div className="text-xs text-slate-400">
                                  {l.owner_type || "—"}
                                </div>
                              </div>
                              <div>
                                <div className="text-xs text-slate-400 uppercase tracking-wider">
                                  Email
                                </div>
                                <div className="mt-1">
                                  {l.owner_email ? (
                                    <a
                                      href={`mailto:${l.owner_email}`}
                                      className="text-blue-600 hover:underline"
                                    >
                                      {l.owner_email}
                                    </a>
                                  ) : (
                                    <span className="text-slate-300">
                                      Not found
                                    </span>
                                  )}
                                </div>
                              </div>
                              <div>
                                <div className="text-xs text-slate-400 uppercase tracking-wider">
                                  Phone
                                </div>
                                <div className="mt-1">
                                  {l.owner_phone && (
                                    <div>
                                      <a
                                        href={`tel:${l.owner_phone}`}
                                        className="text-blue-600 hover:underline"
                                      >
                                        {formatPhone(l.owner_phone)}
                                      </a>
                                      <span className="text-xs text-slate-400 ml-1">
                                        (owner)
                                      </span>
                                    </div>
                                  )}
                                  {l.listing_phone && l.listing_phone !== l.owner_phone && (
                                    <div>
                                      <a
                                        href={`tel:${l.listing_phone}`}
                                        className="text-blue-600 hover:underline"
                                      >
                                        {formatPhone(l.listing_phone)}
                                      </a>
                                      <span className="text-xs text-slate-400 ml-1">
                                        (listing)
                                      </span>
                                    </div>
                                  )}
                                  {!l.owner_phone && !l.listing_phone && (
                                    <span className="text-slate-300">
                                      Not found
                                    </span>
                                  )}
                                </div>
                              </div>
                              <div>
                                <div className="text-xs text-slate-400 uppercase tracking-wider">
                                  Address
                                </div>
                                <div className="text-slate-600 mt-1 text-xs">
                                  {l.sample_address || "—"}
                                </div>
                                {l.estimated_value && (
                                  <div className="text-xs text-slate-400 mt-1">
                                    Est. value: $
                                    {l.estimated_value.toLocaleString()}
                                  </div>
                                )}
                              </div>
                            </div>
                          </td>
                        </tr>
                      )}
                    </>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}

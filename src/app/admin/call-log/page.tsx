"use client";

import { useState, useEffect } from "react";
import { sweetleaseApi } from "@/lib/api";
import { RefreshCw, Phone, PhoneIncoming, PhoneOutgoing, Clock, ChevronDown, ChevronRight } from "lucide-react";

interface Call {
  call_id: string;
  from_number: string;
  to_number: string;
  direction: string;
  call_status: string;
  start_timestamp: number;
  end_timestamp: number;
  duration: number;
  disconnection_reason: string;
  transcript: string;
  recording_url: string;
  outcome: string;
  timeline: string;
  keyTopics: string;
  objections: string;
}

const OUTCOME_COLORS: Record<string, string> = {
  interested: "bg-emerald-100 text-emerald-700",
  needs_followup: "bg-blue-100 text-blue-700",
  objection: "bg-amber-100 text-amber-700",
  not_interested: "bg-red-100 text-red-700",
  no_show: "bg-gray-100 text-gray-500",
  technical_issue: "bg-gray-100 text-gray-500",
};

export default function CallLogPage() {
  const [calls, setCalls] = useState<Call[]>([]);
  const [loading, setLoading] = useState(true);
  const [expanded, setExpanded] = useState<string | null>(null);

  const fetchCalls = async () => {
    try {
      const data = await sweetleaseApi.get<{ calls: Call[] }>("/api/admin/retell-calls");
      setCalls(data.calls || []);
    } catch {
      console.error("Failed to fetch calls");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCalls();
  }, []);

  const formatDuration = (seconds: number) => {
    if (!seconds || seconds <= 0) return "0s";
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return m > 0 ? `${m}m ${s}s` : `${s}s`;
  };

  const formatDate = (ts: number) => {
    if (!ts) return "";
    return new Date(ts).toLocaleString([], {
      month: "short", day: "numeric", hour: "numeric", minute: "2-digit",
    });
  };

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-3">
            <Phone size={24} className="text-amber-500" />
            Call Log
          </h1>
          <p className="text-sm text-slate-400 mt-1">
            Retell AI phone conversations with landlords
          </p>
        </div>
        <button
          onClick={fetchCalls}
          className="flex items-center gap-2 px-3 py-2 bg-[#2a2a3e] text-slate-400 hover:text-white rounded-lg text-sm transition"
        >
          <RefreshCw size={14} />
          Refresh
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-4 gap-4 mb-6">
        {[
          { label: "Total Calls", value: calls.length, color: "text-white" },
          { label: "Interested", value: calls.filter(c => c.outcome === "interested").length, color: "text-emerald-400" },
          { label: "Follow-up", value: calls.filter(c => c.outcome === "needs_followup").length, color: "text-blue-400" },
          { label: "Not Interested", value: calls.filter(c => c.outcome === "not_interested").length, color: "text-red-400" },
        ].map(s => (
          <div key={s.label} className="bg-[#1e1e2d] border border-[#2f2f42] rounded-xl p-4 text-center">
            <div className={`text-2xl font-semibold ${s.color}`}>{s.value}</div>
            <div className="text-[10px] uppercase tracking-wider text-slate-500 mt-1">{s.label}</div>
          </div>
        ))}
      </div>

      {/* Call List */}
      <div className="bg-[#1e1e2d] border border-[#2f2f42] rounded-xl overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <RefreshCw className="animate-spin text-slate-500" size={20} />
          </div>
        ) : calls.length === 0 ? (
          <div className="p-8 text-center text-slate-500 text-sm">
            No calls yet. When landlords call (838) 262-2706, conversations will appear here with transcripts and AI analysis.
          </div>
        ) : (
          <div>
            {/* Header */}
            <div className="grid grid-cols-12 gap-4 px-6 py-3 border-b border-[#2f2f42] text-[10px] uppercase tracking-wider text-slate-500 font-medium">
              <div className="col-span-1">Type</div>
              <div className="col-span-2">Caller</div>
              <div className="col-span-2">Date</div>
              <div className="col-span-1">Duration</div>
              <div className="col-span-2">Outcome</div>
              <div className="col-span-2">Key Topics</div>
              <div className="col-span-2">Status</div>
            </div>

            {calls.map((call) => (
              <div key={call.call_id}>
                <div
                  className="grid grid-cols-12 gap-4 px-6 py-3 hover:bg-[#252538] cursor-pointer transition border-b border-[#2f2f42]/50"
                  onClick={() => setExpanded(expanded === call.call_id ? null : call.call_id)}
                >
                  <div className="col-span-1 flex items-center">
                    {call.direction === "inbound" ? (
                      <PhoneIncoming size={14} className="text-emerald-400" />
                    ) : (
                      <PhoneOutgoing size={14} className="text-blue-400" />
                    )}
                  </div>
                  <div className="col-span-2 text-sm text-white truncate">
                    {call.from_number || "Unknown"}
                  </div>
                  <div className="col-span-2 text-xs text-slate-400">
                    {formatDate(call.start_timestamp)}
                  </div>
                  <div className="col-span-1 text-xs text-slate-400 flex items-center gap-1">
                    <Clock size={10} />
                    {formatDuration(call.duration)}
                  </div>
                  <div className="col-span-2">
                    {call.outcome && (
                      <span className={`text-[10px] px-2 py-0.5 rounded font-medium uppercase tracking-wider ${OUTCOME_COLORS[call.outcome] || "bg-gray-100 text-gray-500"}`}>
                        {call.outcome.replace("_", " ")}
                      </span>
                    )}
                  </div>
                  <div className="col-span-2 text-xs text-slate-400 truncate">
                    {call.keyTopics || "-"}
                  </div>
                  <div className="col-span-2 flex items-center justify-between">
                    <span className={`text-[10px] px-2 py-0.5 rounded font-medium ${
                      call.call_status === "ended" ? "bg-slate-700 text-slate-300" :
                      call.call_status === "ongoing" ? "bg-emerald-900 text-emerald-300" :
                      "bg-slate-800 text-slate-400"
                    }`}>
                      {call.call_status}
                    </span>
                    {expanded === call.call_id ? <ChevronDown size={14} className="text-slate-500" /> : <ChevronRight size={14} className="text-slate-500" />}
                  </div>
                </div>

                {/* Expanded Details */}
                {expanded === call.call_id && (
                  <div className="px-6 py-4 bg-[#161622] border-b border-[#2f2f42]">
                    <div className="grid grid-cols-2 gap-6">
                      {/* Left - Details */}
                      <div className="space-y-3">
                        <div>
                          <div className="text-[10px] uppercase tracking-wider text-slate-500 mb-1 font-medium">Call Details</div>
                          <div className="text-xs text-slate-300 space-y-1">
                            <div>From: {call.from_number}</div>
                            <div>To: {call.to_number}</div>
                            <div>Duration: {formatDuration(call.duration)}</div>
                            <div>Disconnect: {call.disconnection_reason || "normal"}</div>
                          </div>
                        </div>
                        {call.outcome && (
                          <div>
                            <div className="text-[10px] uppercase tracking-wider text-slate-500 mb-1 font-medium">AI Analysis</div>
                            <div className="text-xs text-slate-300 space-y-1">
                              <div>Outcome: <span className="font-medium text-white">{call.outcome}</span></div>
                              {call.timeline && <div>Timeline: {call.timeline}</div>}
                              {call.objections && <div>Objections: {call.objections}</div>}
                            </div>
                          </div>
                        )}
                        {call.recording_url && (
                          <div>
                            <div className="text-[10px] uppercase tracking-wider text-slate-500 mb-1 font-medium">Recording</div>
                            <audio controls className="w-full h-8" src={call.recording_url} />
                          </div>
                        )}
                      </div>

                      {/* Right - Transcript */}
                      <div>
                        <div className="text-[10px] uppercase tracking-wider text-slate-500 mb-1 font-medium">Transcript</div>
                        <div className="bg-[#1e1e2d] rounded-lg p-3 max-h-64 overflow-y-auto text-xs text-slate-300 whitespace-pre-wrap leading-relaxed">
                          {call.transcript || "No transcript available"}
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

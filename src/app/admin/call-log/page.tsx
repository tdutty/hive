"use client";

import { Fragment, useState, useEffect } from "react";
import { sweetleaseApi } from "@/lib/api";
import { RefreshCw, PhoneIncoming, PhoneOutgoing, Clock, ChevronDown, ChevronRight, Phone } from "lucide-react";
import { Button, Card, CardHeader, Badge, StatTile, PageHeader, Table, THead, TH, TBody, TR, TD } from "@/components/kit";
import type { BadgeProps } from "@/components/kit/Badge";
import { Spinner, EmptyState } from "@/components/ui/AsyncState";

type BadgeTone = NonNullable<BadgeProps["tone"]>;

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

const OUTCOME_TONE: Record<string, BadgeTone> = {
  interested: "success",
  needs_followup: "info",
  objection: "warning",
  not_interested: "danger",
  no_show: "neutral",
  technical_issue: "neutral",
};

const statusToneFor = (status: string): BadgeTone =>
  status === "ongoing" ? "success" : "neutral";

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
    <div className="max-w-7xl">
      <PageHeader
        title="Call Log"
        description="Retell AI phone conversations with landlords"
        actions={
          <Button variant="primary" icon={<RefreshCw size={14} />} onClick={fetchCalls}>
            Refresh
          </Button>
        }
      />

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-5">
        <StatTile label="Total Calls" value={calls.length} icon={<Phone size={14} />} />
        <StatTile label="Interested" value={calls.filter(c => c.outcome === "interested").length} />
        <StatTile label="Follow-up" value={calls.filter(c => c.outcome === "needs_followup").length} />
        <StatTile label="Not Interested" value={calls.filter(c => c.outcome === "not_interested").length} />
      </div>

      <Card>
        <CardHeader title={`Calls (${calls.length})`} />
        {loading ? (
          <Spinner label="Loading calls" />
        ) : calls.length === 0 ? (
          <EmptyState
            title="No calls yet"
            hint="When landlords call (838) 262-2706, conversations will appear here with transcripts and AI analysis."
            icon={<Phone size={28} className="mx-auto" aria-hidden />}
          />
        ) : (
          <Table>
            <THead>
              <tr>
                <TH>Type</TH>
                <TH>Caller</TH>
                <TH>Date</TH>
                <TH numeric>Duration</TH>
                <TH>Outcome</TH>
                <TH>Key Topics</TH>
                <TH>Status</TH>
                <TH aria-label="Expand" />
              </tr>
            </THead>
            <TBody>
              {calls.map((call) => {
                const isOpen = expanded === call.call_id;
                return (
                  <Fragment key={call.call_id}>
                    <TR
                      clickable
                      selected={isOpen}
                      onClick={() => setExpanded(isOpen ? null : call.call_id)}
                    >
                      <TD>
                        {call.direction === "inbound" ? (
                          <PhoneIncoming size={14} className="text-emerald-600" aria-label="Inbound" />
                        ) : (
                          <PhoneOutgoing size={14} className="text-sky-600" aria-label="Outbound" />
                        )}
                      </TD>
                      <TD className="font-medium tabular whitespace-nowrap">{call.from_number || "Unknown"}</TD>
                      <TD muted className="tabular whitespace-nowrap">{formatDate(call.start_timestamp)}</TD>
                      <TD numeric muted>
                        <span className="inline-flex items-center gap-1">
                          <Clock size={12} aria-hidden />
                          {formatDuration(call.duration)}
                        </span>
                      </TD>
                      <TD>
                        {call.outcome && (
                          <Badge tone={OUTCOME_TONE[call.outcome] || "neutral"} dot>
                            {call.outcome.replace("_", " ")}
                          </Badge>
                        )}
                      </TD>
                      <TD muted className="max-w-[16rem] truncate">{call.keyTopics || "-"}</TD>
                      <TD><Badge tone={statusToneFor(call.call_status)}>{call.call_status}</Badge></TD>
                      <TD className="w-8">
                        {isOpen ? <ChevronDown size={14} className="text-slate-500" aria-hidden /> : <ChevronRight size={14} className="text-slate-500" aria-hidden />}
                      </TD>
                    </TR>

                    {isOpen && (
                      <tr className="bg-slate-50">
                        <td colSpan={8} className="px-4 py-4">
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="space-y-4">
                              <div>
                                <p className="text-xs font-medium text-slate-500 uppercase tracking-wide mb-1">Call Details</p>
                                <div className="text-sm text-slate-700 space-y-1">
                                  <div>From: <span className="tabular">{call.from_number}</span></div>
                                  <div>To: <span className="tabular">{call.to_number}</span></div>
                                  <div>Duration: {formatDuration(call.duration)}</div>
                                  <div>Disconnect: {call.disconnection_reason || "normal"}</div>
                                </div>
                              </div>
                              {call.outcome && (
                                <div>
                                  <p className="text-xs font-medium text-slate-500 uppercase tracking-wide mb-1">AI Analysis</p>
                                  <div className="text-sm text-slate-700 space-y-1">
                                    <div>Outcome: <span className="font-medium text-slate-900">{call.outcome}</span></div>
                                    {call.timeline && <div>Timeline: {call.timeline}</div>}
                                    {call.objections && <div>Objections: {call.objections}</div>}
                                  </div>
                                </div>
                              )}
                              {call.recording_url && (
                                <div>
                                  <p className="text-xs font-medium text-slate-500 uppercase tracking-wide mb-1">Recording</p>
                                  <audio controls className="w-full h-8" src={call.recording_url} />
                                </div>
                              )}
                            </div>

                            <div>
                              <p className="text-xs font-medium text-slate-500 uppercase tracking-wide mb-1">Transcript</p>
                              <div className="bg-white border border-slate-200 rounded-lg p-3 max-h-64 overflow-y-auto text-sm text-slate-700 whitespace-pre-wrap leading-relaxed">
                                {call.transcript || "No transcript available"}
                              </div>
                            </div>
                          </div>
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
    </div>
  );
}

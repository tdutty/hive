"use client";

import { useState, useEffect } from "react";
import { sweetleaseApi } from "@/lib/api";
import { Button, Card, Badge, statusTone, PageHeader, FilterChips, type Chip, Table, THead, TH, TBody, TR, TD } from "@/components/kit";
import { ErrorBanner, Spinner, EmptyState } from "@/components/ui/AsyncState";
import { toast } from "sonner";
import { RefreshCw, CheckCheck } from "lucide-react";

// --- Types ---

interface Commitment {
  id: string;
  contactId: string;
  contactName: string;
  description: string;
  owner: "US" | "THEM";
  dueDate: string | null;
  status: "OPEN" | "FULFILLED" | "MISSED" | "OVERDUE";
  createdAt: string;
}

interface CommitmentsResponse {
  commitments: Commitment[];
  total: number;
}

type FilterKey = "ALL" | "OPEN" | "OVERDUE" | "FULFILLED" | "MISSED";

// --- Helpers ---

function isOverdue(c: Commitment): boolean {
  if (c.status === "FULFILLED" || c.status === "MISSED") return false;
  if (!c.dueDate) return false;
  return new Date(c.dueDate) < new Date();
}

/** Overdue is derived (open past its due date), so it is not in the shared status map; everything else goes through statusTone. */
function statusBadge(status: Commitment["status"], overdue: boolean) {
  if (overdue || status === "OVERDUE") return <Badge tone="danger" dot>Overdue</Badge>;
  return <Badge tone={statusTone(status)} dot>{status}</Badge>;
}

// --- Component ---

export default function CommitmentsPage() {
  const [commitments, setCommitments] = useState<Commitment[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState<FilterKey>("ALL");
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  const fetchCommitments = async () => {
    try {
      const params: Record<string, string> = {};
      if (filter !== "ALL") {
        params.status = filter;
      }
      const data = await sweetleaseApi.get<CommitmentsResponse>(
        "/api/admin/concierge/commitments",
        params
      );
      setCommitments(data.commitments);
      setTotal(data.total);
      setError(null);
    } catch (err: any) {
      setError(err?.message || "Failed to load commitments");
    } finally {
      setLoading(false);
    }
  };

  const handleMarkStatus = async (id: string, newStatus: "FULFILLED" | "MISSED") => {
    setActionLoading(id);
    try {
      await sweetleaseApi.patch(`/api/admin/concierge/commitments/${id}`, {
        status: newStatus,
      });
      await fetchCommitments();
      toast.success(`Commitment marked as ${newStatus.toLowerCase()}.`);
    } catch (err: any) {
      toast.error("Failed to update commitment", { description: err?.message });
    } finally {
      setActionLoading(null);
    }
  };

  useEffect(() => {
    setLoading(true);
    fetchCommitments();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filter]);

  const filters: Chip<FilterKey>[] = [
    { key: "ALL", label: "All" },
    { key: "OPEN", label: "Open" },
    { key: "OVERDUE", label: "Overdue" },
    { key: "FULFILLED", label: "Fulfilled" },
    { key: "MISSED", label: "Missed" },
  ];

  const reload = () => { setLoading(true); fetchCommitments(); };

  return (
    <div>
      <PageHeader
        title={
          <span className="inline-flex items-center gap-2">
            Commitments
            {total > 0 && <Badge tone="neutral">{total}</Badge>}
          </span>
        }
        description="Track promises made to and by contacts"
        actions={
          <Button variant="secondary" onClick={reload} loading={loading} icon={<RefreshCw size={14} aria-hidden />}>
            Refresh
          </Button>
        }
      />

      <FilterChips items={filters} value={filter} onChange={setFilter} className="mb-4" />

      <Card className="overflow-hidden">
        {loading ? (
          <Spinner />
        ) : error ? (
          <div className="p-4">
            <ErrorBanner message={error} onRetry={reload} />
          </div>
        ) : commitments.length === 0 ? (
          <EmptyState
            title="No commitments found"
            hint="Nothing matches this filter."
            icon={<CheckCheck size={28} className="mx-auto" aria-hidden />}
          />
        ) : (
          <Table>
            <THead>
              <tr>
                <TH>Contact</TH>
                <TH>Description</TH>
                <TH>Owner</TH>
                <TH>Due Date</TH>
                <TH>Status</TH>
                <TH>Action</TH>
              </tr>
            </THead>
            <TBody>
              {commitments.map((c) => {
                const overdue = isOverdue(c);
                const isTerminal = c.status === "FULFILLED" || c.status === "MISSED";
                return (
                  <TR key={c.id} className="hover:bg-slate-50">
                    <TD className="font-medium text-slate-900">
                      <a
                        href={`/admin/concierge/contacts/${c.contactId}`}
                        className="hover:text-amber-700 transition-colors"
                      >
                        {c.contactName}
                      </a>
                    </TD>
                    <TD muted className="max-w-xs truncate">
                      {c.description}
                    </TD>
                    <TD>
                      <Badge tone={c.owner === "US" ? "warning" : "info"}>
                        {c.owner === "US" ? "Us" : "Them"}
                      </Badge>
                    </TD>
                    <TD muted className={overdue ? "font-medium" : undefined}>
                      {c.dueDate
                        ? new Date(c.dueDate).toLocaleDateString([], {
                            month: "short",
                            day: "numeric",
                            year: "numeric",
                          })
                        : "-"}
                    </TD>
                    <TD>{statusBadge(c.status, overdue)}</TD>
                    <TD>
                      {!isTerminal && (
                        <div className="flex items-center gap-1.5">
                          <Button
                            variant="secondary"
                            size="sm"
                            onClick={() => handleMarkStatus(c.id, "FULFILLED")}
                            loading={actionLoading === c.id}
                          >
                            Fulfilled
                          </Button>
                          <Button
                            variant="dangerOutline"
                            size="sm"
                            onClick={() => handleMarkStatus(c.id, "MISSED")}
                            disabled={actionLoading === c.id}
                          >
                            Missed
                          </Button>
                        </div>
                      )}
                    </TD>
                  </TR>
                );
              })}
            </TBody>
          </Table>
        )}
      </Card>
    </div>
  );
}

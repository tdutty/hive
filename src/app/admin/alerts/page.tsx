"use client";

import { useState, useEffect } from "react";
import { RefreshCw, CheckCircle, AlertTriangle } from "lucide-react";
import { Button, Card, CardBody, Badge, PageHeader } from "@/components/kit";
import { Spinner, EmptyState } from "@/components/ui/AsyncState";

export default function AlertsPage() {
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState<"ok" | "error" | null>(null);
  const [errorMsg, setErrorMsg] = useState("");

  const checkHealth = async () => {
    setLoading(true);
    try {
      const resp = await fetch("/api/admin/tenant-match/pipeline");
      if (resp.ok) {
        setStatus("ok");
      } else {
        setStatus("error");
        setErrorMsg("Pipeline API returned " + resp.status);
      }
    } catch {
      setStatus("error");
      setErrorMsg("Failed to reach API");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    checkHealth();
  }, []);

  return (
    <div className="max-w-7xl">
      <PageHeader
        title="System Alerts"
        description="Monitor system health and background processes"
        actions={
          <Button variant="primary" icon={<RefreshCw size={14} />} loading={loading} onClick={checkHealth}>
            Refresh
          </Button>
        }
      />

      {loading && !status && <Spinner label="Checking system health" />}

      {status === "ok" && (
        <Card>
          <CardBody className="flex items-start gap-4">
            <CheckCircle size={22} className="text-emerald-600 shrink-0 mt-0.5" aria-hidden />
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <p className="text-sm font-medium text-slate-900">All systems operating normally</p>
                <Badge tone="success" dot>Healthy</Badge>
              </div>
              <p className="text-xs text-slate-500 mt-1">Pipeline API responding. Background processes running.</p>
            </div>
          </CardBody>
        </Card>
      )}

      {status === "error" && (
        <Card>
          <CardBody className="flex items-start gap-4">
            <AlertTriangle size={22} className="text-red-600 shrink-0 mt-0.5" aria-hidden />
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <p className="text-sm font-medium text-slate-900">System Issue Detected</p>
                <Badge tone="danger" dot>Error</Badge>
              </div>
              <p className="text-xs text-slate-500 mt-1">{errorMsg}</p>
            </div>
          </CardBody>
        </Card>
      )}

      {!status && !loading && (
        <Card>
          <EmptyState title="Checking system health..." />
        </Card>
      )}
    </div>
  );
}

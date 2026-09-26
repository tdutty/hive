"use client";

import { FileText } from "lucide-react";
import { IntelScanPage } from "@/components/admin/IntelScanPage";

export default function TitleMonitorPage() {
  return (
    <IntelScanPage
      icon={FileText}
      title="Title Company Monitor"
      description="Monitors title company transactions to identify new property acquisitions and ownership changes."
      endpoint="/api/admin/intelligence/title-monitor"
      body={{ action: "targets", limit: 50 }}
      resultKeys={["targets", "acquisitions", "results", "data"]}
      runningLabel="Scanning title transfer records..."
      emptyHint="Click Run Scan to find acquisition targets."
    />
  );
}

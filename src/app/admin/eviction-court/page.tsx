"use client";

import { Scale } from "lucide-react";
import { IntelScanPage } from "@/components/admin/IntelScanPage";

export default function EvictionCourtPage() {
  return (
    <IntelScanPage
      icon={Scale}
      title="Eviction Court Scraper"
      description="Monitors eviction court filings to identify landlords with problem tenants who may want pre-screened replacements."
      endpoint="/api/admin/intelligence/eviction-court"
      body={{ action: "targets", limit: 50 }}
      resultKeys={["targets", "landlords", "results", "data"]}
      runningLabel="Scanning eviction filings..."
      emptyHint="Click Run Scan to find landlords with recent filings."
    />
  );
}

"use client";

import { Search } from "lucide-react";
import { IntelScanPage } from "@/components/admin/IntelScanPage";

export default function BiggerpocketsPage() {
  return (
    <IntelScanPage
      icon={Search}
      title="BiggerPockets Engine"
      description="Scrapes landlord forums, investment discussions, and property listings from BiggerPockets to identify active landlord investors."
      endpoint="/api/admin/intelligence/biggerpockets"
      body={{ action: "alerts" }}
      resultKeys={["alerts", "queries", "results", "data"]}
      runningLabel="Scanning BiggerPockets..."
      emptyHint="Click Run Scan to pull the latest landlord alerts."
    />
  );
}

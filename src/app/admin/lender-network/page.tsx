"use client";

import { Building } from "lucide-react";
import { IntelScanPage } from "@/components/admin/IntelScanPage";

export default function LenderNetworkPage() {
  return (
    <IntelScanPage
      icon={Building}
      title="Lender Network Intelligence"
      description="Tracks mortgage and lending activity to identify landlords with new investment properties."
      endpoint="/api/admin/intelligence/lender-network"
      body={{ action: "targets", limit: 50 }}
      resultKeys={["targets", "borrowers", "results", "data"]}
      runningLabel="Scanning lending activity..."
      emptyHint="Click Run Scan to find new investment borrowers."
    />
  );
}

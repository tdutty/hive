"use client";

import { Briefcase } from "lucide-react";
import { IntelScanPage } from "@/components/admin/IntelScanPage";

export default function PortfolioIntelPage() {
  return (
    <IntelScanPage
      icon={Briefcase}
      title="Portfolio Intelligence"
      description="Identifies and tracks portfolio landlords with multiple properties across markets."
      endpoint="/api/admin/intelligence/portfolio-intel"
      body={{}}
      resultKeys={["portfolios", "holders", "results", "data"]}
      runningLabel="Building portfolio view..."
      emptyHint="Click Run Scan to identify portfolio landlords."
    />
  );
}

"use client";

import { MessageCircle } from "lucide-react";
import { IntelScanPage } from "@/components/admin/IntelScanPage";

export default function InterceptPage() {
  return (
    <IntelScanPage
      icon={MessageCircle}
      title="Intercept Messages"
      description="Monitors and intercepts relevant communications for outreach timing."
      endpoint="/api/admin/intelligence/intercept"
      body={{ limit: 50 }}
      resultKeys={["targets", "messages", "results", "data"]}
      runningLabel="Scanning communications..."
      emptyHint="Click Run Scan to fetch intercepted messages."
    />
  );
}

"use client";

import { Eye } from "lucide-react";
import { IntelScanPage } from "@/components/admin/IntelScanPage";

export default function ListingMonitorPage() {
  return (
    <IntelScanPage
      icon={Eye}
      title="Listing Monitor"
      description="Tracks price changes, DOM updates, and status changes on rental listings across platforms."
      endpoint="/api/admin/intelligence/listing-monitor"
      body={{
        cities: ["Houston", "Nashville", "Columbus", "Pittsburgh", "Cleveland", "Cincinnati", "New York"],
      }}
      resultKeys={["listings", "results", "data"]}
      runningLabel="Checking listings for changes..."
      emptyHint="Click Run Scan to check listings for changes."
    />
  );
}

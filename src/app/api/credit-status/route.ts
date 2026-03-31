import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

const HASDATA_API_KEY = process.env.HASDATA_API_KEY || "";
const ANTHROPIC_API_KEY = process.env.ANTHROPIC_API_KEY || "";

export async function GET() {
  const results: Record<string, any> = {};

  // HasData
  try {
    const res = await fetch("https://api.hasdata.com/user/me/usage", {
      headers: { "x-api-key": HASDATA_API_KEY },
    });
    if (res.ok) {
      const data = await res.json();
      const credits = data.data?.availableCredits ?? null;
      results.hasdata = {
        credits,
        total: data.data?.totalCredits,
        status: credits === null ? "error" : credits <= 0 ? "depleted" : credits <= 100 ? "critical" : credits <= 500 ? "low" : "ok",
        lastChecked: new Date().toISOString(),
      };
    } else {
      results.hasdata = { credits: null, status: "error", lastChecked: new Date().toISOString(), error: `HTTP ${res.status}` };
    }
  } catch (err: any) {
    results.hasdata = { credits: null, status: "error", lastChecked: new Date().toISOString(), error: err.message };
  }

  // Anthropic — test if key works
  try {
    const res = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "x-api-key": ANTHROPIC_API_KEY,
        "anthropic-version": "2023-06-01",
        "content-type": "application/json",
      },
      body: JSON.stringify({
        model: "claude-3-haiku-20240307",
        max_tokens: 1,
        messages: [{ role: "user", content: "hi" }],
      }),
    });
    if (res.status === 402 || res.status === 403) {
      results.anthropic = { credits: 0, status: "depleted", lastChecked: new Date().toISOString() };
    } else if (res.ok) {
      results.anthropic = { credits: null, status: "ok", lastChecked: new Date().toISOString() };
    } else {
      results.anthropic = { credits: null, status: "error", lastChecked: new Date().toISOString(), error: `HTTP ${res.status}` };
    }
  } catch (err: any) {
    results.anthropic = { credits: null, status: "error", lastChecked: new Date().toISOString(), error: err.message };
  }

  // Scrapeak, BatchData, Apollo — no polling endpoints, use cached/unknown
  results.scrapeak = { credits: null, status: "unknown", lastChecked: "" };
  results.batchdata = { credits: null, status: "unknown", lastChecked: "" };
  results.apollo = { credits: null, status: "unknown", lastChecked: "" };

  return NextResponse.json(results);
}

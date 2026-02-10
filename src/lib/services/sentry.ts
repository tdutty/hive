export interface SentryIssue {
  id: string;
  shortId: string;
  title: string;
  culprit: string;
  level: "fatal" | "error" | "warning" | "info" | "debug";
  status: "unresolved" | "resolved" | "ignored";
  isUnhandled: boolean;
  firstSeen: string;
  lastSeen: string;
  count: string;
  userCount: number;
  permalink: string;
  metadata: {
    type?: string;
    value?: string;
    filename?: string;
    function?: string;
  };
  project: {
    id: string;
    name: string;
    slug: string;
  };
  statusDetails: Record<string, unknown>;
  assignedTo: { name: string; email: string } | null;
  platform: string;
  type: string;
  hasSeen: boolean;
  isBookmarked: boolean;
}

async function fetchSentry<T>(
  path: string,
  params?: Record<string, string | number | undefined>
): Promise<T> {
  const searchParams = new URLSearchParams();
  if (params) {
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined) {
        searchParams.set(key, String(value));
      }
    });
  }

  const qs = searchParams.toString();
  const url = `/api/sentry/${path}${qs ? `?${qs}` : ""}`;
  const res = await fetch(url);

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Sentry API error ${res.status}: ${text}`);
  }

  return res.json();
}

export const sentryService = {
  getUnresolvedIssues(cursor?: string) {
    return fetchSentry<SentryIssue[]>("issues", {
      query: "is:unresolved",
      sort: "date",
      limit: 25,
      cursor: cursor || undefined,
    });
  },

  getAllIssues(query?: string, cursor?: string) {
    return fetchSentry<SentryIssue[]>("issues", {
      query: query || undefined,
      sort: "date",
      limit: 25,
      cursor: cursor || undefined,
    });
  },

  getIssuesByLevel(level: string, cursor?: string) {
    return fetchSentry<SentryIssue[]>("issues", {
      query: `level:${level} is:unresolved`,
      sort: "date",
      limit: 25,
      cursor: cursor || undefined,
    });
  },

  getIssue(issueId: string) {
    return fetchSentry<SentryIssue>(`issues/${issueId}`);
  },

  getIssueEvents(issueId: string) {
    return fetchSentry<unknown[]>(`issues/${issueId}/events`, { limit: 10 });
  },
};

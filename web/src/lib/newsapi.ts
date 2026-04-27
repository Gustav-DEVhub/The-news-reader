export type Category =
  | "tech"
  | "general"
  | "science"
  | "sports"
  | "business"
  | "health"
  | "entertainment"
  | "politics"
  | "food"
  | "travel";

export type NewsArticle = {
  uuid?: string;
  title: string;
  description?: string | null;
  snippet?: string | null;
  url: string;
  image_url?: string | null;
  published_at?: string | null;
  source?: string | null;
  categories?: string[];
  language?: string;
};

export type NewsApiResponse = {
  data: NewsArticle[];
  meta: {
    found: number;
    returned: number;
    limit: number;
    page: number;
  };
};

export type FetchParams =
  | { page: number; category: Category; search?: ""; language?: string }
  | { page: number; search: string; category?: Category; language?: string };

export type ApiErrorKind = "rate_limit" | "auth" | "timeout_or_server" | "unknown";

export type ApiError = {
  kind: ApiErrorKind;
  message: string;
  status?: number;
};

export const LIMIT = 3;
export const DEFAULT_CATEGORY: Category = "tech";

export function buildProxyUrl(params: FetchParams): string {
  const url = new URL("/api/news/all", window.location.origin);
  url.searchParams.set("page", String(params.page));
  if (params.language) url.searchParams.set("language", params.language);

  const searchRaw = "search" in params ? (params.search ?? "") : "";
  const hasSearch = searchRaw.trim().length > 0;
  if (hasSearch) {
    url.searchParams.set("search", searchRaw.trim());
  } else {
    const category = "category" in params ? params.category : DEFAULT_CATEGORY;
    url.searchParams.set("categories", category || DEFAULT_CATEGORY);
  }

  return url.toString();
}

function mapError(status: number | undefined, fallback: string): ApiError {
  if (status === 429) {
    return { kind: "rate_limit", status, message: "Daily request limit reached…" };
  }
  if (status === 401 || status === 403) {
    return { kind: "auth", status, message: "TheNewsApi authentication failed…" };
  }
  if (status === 500 || status === 504) {
    return { kind: "timeout_or_server", status, message: "Something went wrong. Please try again." };
  }
  return { kind: "unknown", status, message: fallback };
}

export async function fetchAllNews(params: FetchParams, signal?: AbortSignal): Promise<NewsApiResponse> {
  const url = buildProxyUrl(params);

  // Debug: log proxy URL (no token in browser)
  // eslint-disable-next-line no-console
  console.log("[client] proxy url:", url);

  const res = await fetch(url, { method: "GET", signal });
  if (!res.ok) {
    const mapped = mapError(res.status, "Something went wrong. Please try again.");
    const err = new Error(mapped.message);
    (err as unknown as { status?: number; kind?: ApiErrorKind }).status = mapped.status;
    (err as unknown as { status?: number; kind?: ApiErrorKind }).kind = mapped.kind;
    throw err;
  }
  return (await res.json()) as NewsApiResponse;
}


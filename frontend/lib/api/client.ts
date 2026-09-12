/**
 * Server-side HTTP client for the Phase 3 FastAPI backend.
 *
 * Phase 3.5 keeps transport concerns in one place. Route components and
 * domain query functions should only think in procurement concepts; they do
 * not build URLs, parse error envelopes, or manage request timeouts.
 */

export interface ApiErrorBody {
  code: string;
  message: string;
}

export class ApiClientError extends Error {
  readonly status: number;
  readonly code: string;
  readonly url: string;

  constructor(status: number, body: ApiErrorBody, url: string) {
    super(body.message);
    this.name = "ApiClientError";
    this.status = status;
    this.code = body.code;
    this.url = url;
  }
}

const DEFAULT_BASE_URL = "http://localhost:8000/api/v1";
const DEFAULT_TIMEOUT_MS = 10_000;

function normalizeBaseUrl(raw: string | undefined): string {
  const value = (raw?.trim() || DEFAULT_BASE_URL).replace(/\/+$/, "");

  if (!/^https?:\/\//i.test(value)) {
    throw new Error("NEXT_PUBLIC_API_BASE_URL must be an absolute http(s) URL");
  }

  return value;
}

export function getApiBaseUrl(): string {
  return normalizeBaseUrl(process.env.NEXT_PUBLIC_API_BASE_URL);
}

function createTimeoutSignal(timeoutMs: number): {
  signal: AbortSignal;
  cleanup: () => void;
} {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);

  return {
    signal: controller.signal,
    cleanup: () => clearTimeout(timer),
  };
}

async function parseErrorBody(response: Response): Promise<ApiErrorBody> {
  try {
    const payload: unknown = await response.json();

    if (
      typeof payload === "object" &&
      payload !== null &&
      "code" in payload &&
      "message" in payload &&
      typeof payload.code === "string" &&
      typeof payload.message === "string"
    ) {
      return {
        code: payload.code,
        message: payload.message,
      };
    }
  } catch {
    // The backend contract is the preferred path; the fallback keeps the
    // client predictable if a proxy/load-balancer returns non-JSON content.
  }

  return {
    code: `http_${response.status}`,
    message: response.statusText || "The procurement API request failed.",
  };
}

/**
 * GET JSON from the Phase 3 API.
 *
 * Reads deliberately use `no-store`: this prototype is a procurement
 * workspace and stale server-rendered values are more dangerous than a
 * slightly slower read. Phase 6 can introduce explicit cache/revalidation
 * semantics once the mutation model exists.
 */
export async function apiGet<T>(path: string, init?: RequestInit): Promise<T> {
  const normalizedPath = path.replace(/^\/+/, "");
  const url = `${getApiBaseUrl()}/${normalizedPath}`;
  const timeout = createTimeoutSignal(DEFAULT_TIMEOUT_MS);

  try {
    const response = await fetch(url, {
      ...init,
      method: "GET",
      cache: "no-store",
      headers: {
        Accept: "application/json",
        ...(init?.headers ?? {}),
      },
      signal: init?.signal ?? timeout.signal,
    });

    if (!response.ok) {
      throw new ApiClientError(response.status, await parseErrorBody(response), url);
    }

    return (await response.json()) as T;
  } catch (error) {
    if (error instanceof ApiClientError) {
      throw error;
    }

    if (error instanceof DOMException && error.name === "AbortError") {
      throw new ApiClientError(
        504,
        {
          code: "api_timeout",
          message: "The procurement API did not respond in time. Please retry.",
        },
        url,
      );
    }

    if (error instanceof TypeError) {
      throw new ApiClientError(
        503,
        {
          code: "api_unreachable",
          message: "The procurement API is unavailable. Check the backend service and retry.",
        },
        url,
      );
    }

    throw error;
  } finally {
    timeout.cleanup();
  }
}

export function isApiNotFound(error: unknown): error is ApiClientError {
  return error instanceof ApiClientError && error.status === 404;
}

import { axiosClient } from "@/shared/api/axiosClient";
import { useAuthStore } from "@/features/authentication/stores/auth.store";

export type MonitoringRange = "1h" | "24h" | "7d" | "30d";
export type HealthState = "healthy" | "warning" | "down" | "unavailable";

export type TrendPoint = {
  label: string;
  requests: number;
  successful: number;
  failed: number;
  responseMs: number;
};

export type ServiceHealth = {
  name: string;
  status: "healthy" | "warning" | "down";
  responseMs: number | null;
};

export type MonitoringSnapshot = {
  status: "healthy" | "warning" | "down";
  uptimeSeconds: number;
  historyAvailableSeconds: number;
  apiAverageMs: number | null;
  apiP95Ms: number | null;
  apiPreviousAverageMs: number | null;
  requestCount: number;
  slowRequests: number;
  errorRatePercent: number | null;
  activeUsersNow: number;
  activeUsersToday: number;
  requestStatusPercent: { success: number; clientError: number; serverError: number };
  resources: {
    cpuPercent: number | null;
    memoryRssMb: number;
    heapUsedMb: number;
    heapTotalMb: number;
    databaseConnections: number;
    databaseIdleConnections: number;
    databaseWaitingConnections: number;
    databaseConnectionLimit: number;
  };
  services: ServiceHealth[];
  database: {
    status: "healthy" | "down";
    probeMs: number | null;
    activeConnections: number;
    idleConnections: number;
    waitingConnections: number;
    connectionLimit: number;
  };
  traffic: TrendPoint[];
};

export type MonitoringResult =
  | { available: true; source: "api"; snapshot: MonitoringSnapshot }
  | { available: false; source: "unavailable" };

type MonitoringResponse = {
  sampledAt: string;
  historyAvailableSeconds: number;
  status: "healthy" | "degraded";
  process: {
    uptimeSeconds: number;
    cpuPercent: number | null;
    rssBytes: number;
    heapUsedBytes: number;
    heapTotalBytes: number;
  };
  api: {
    requestCount: number;
    avgMs: number | null;
    p95Ms: number | null;
    previousAvgMs: number | null;
    errorRatePercent: number | null;
    slowRequests: number;
    activeUsersNow: number;
    activeUsersToday: number;
    statusDistribution: { success: number; clientError: number; serverError: number };
  };
  database: {
    status: "healthy" | "down";
    probeMs: number | null;
    totalConnections: number;
    idleConnections: number;
    waitingConnections: number;
    maxConnections: number;
  };
  traffic: TrendPoint[];
};

function normalizeMonitoring(payload: MonitoringResponse | null | undefined): MonitoringResult {
  if (!payload || !payload.process || !payload.api || !payload.database || !Array.isArray(payload.traffic)) {
    return { available: false, source: "unavailable" };
  }
    const status: MonitoringSnapshot["status"] = payload.database.status === "down"
      ? "down"
      : payload.status === "degraded" ? "warning" : "healthy";
    const snapshot: MonitoringSnapshot = {
      status,
      uptimeSeconds: payload.process.uptimeSeconds,
      historyAvailableSeconds: payload.historyAvailableSeconds,
      apiAverageMs: payload.api.avgMs,
      apiP95Ms: payload.api.p95Ms,
      apiPreviousAverageMs: payload.api.previousAvgMs,
      requestCount: payload.api.requestCount,
      slowRequests: payload.api.slowRequests,
      errorRatePercent: payload.api.errorRatePercent,
      activeUsersNow: payload.api.activeUsersNow,
      activeUsersToday: payload.api.activeUsersToday,
      requestStatusPercent: payload.api.statusDistribution,
      resources: {
        cpuPercent: payload.process.cpuPercent,
        memoryRssMb: payload.process.rssBytes / 1_048_576,
        heapUsedMb: payload.process.heapUsedBytes / 1_048_576,
        heapTotalMb: payload.process.heapTotalBytes / 1_048_576,
        databaseConnections: payload.database.totalConnections,
        databaseIdleConnections: payload.database.idleConnections,
        databaseWaitingConnections: payload.database.waitingConnections,
        databaseConnectionLimit: payload.database.maxConnections,
      },
      services: [
        { name: "Backend API", status: payload.status === "degraded" ? "warning" : "healthy", responseMs: payload.api.avgMs },
        { name: "PostgreSQL", status: payload.database.status, responseMs: payload.database.probeMs },
      ],
      database: {
        status: payload.database.status,
        probeMs: payload.database.probeMs,
        activeConnections: payload.database.totalConnections,
        idleConnections: payload.database.idleConnections,
        waitingConnections: payload.database.waitingConnections,
        connectionLimit: payload.database.maxConnections,
      },
      traffic: payload.traffic,
    };
  return { available: true, source: "api", snapshot };
}

export async function loadMonitoring(range: MonitoringRange): Promise<MonitoringResult> {
  try {
    const response = await axiosClient.get<{ success: boolean; data: MonitoringResponse }>(
      "/api/v1/admin/monitoring",
      { params: { range }, timeout: 10_000 },
    );
    return normalizeMonitoring(response.data?.data);
  } catch {
    return { available: false, source: "unavailable" };
  }
}

export function subscribeMonitoring(
  range: MonitoringRange,
  onSnapshot: (result: MonitoringResult) => void,
  onConnection: (state: "connecting" | "live" | "reconnecting") => void,
) {
  let stopped = false;
  let controller: AbortController | null = null;
  const apiBase = (process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000").replace(/\/api\/v1\/?$/, "");
  const wait = (ms: number) => new Promise<void>((resolve) => window.setTimeout(resolve, ms));

  const connect = async () => {
    let retryDelay = 1_000;
    let hasConnected = false;
    while (!stopped) {
      onConnection(hasConnected ? "reconnecting" : "connecting");
      const initial = await loadMonitoring(range);
      if (stopped) break;
      if (initial.available) onSnapshot(initial);
      const token = useAuthStore.getState().accessToken;
      if (!token) {
        onSnapshot({ available: false, source: "unavailable" });
        onConnection("reconnecting");
        await wait(retryDelay);
        retryDelay = Math.min(retryDelay * 2, 10_000);
        continue;
      }

      controller = new AbortController();
      try {
        const url = new URL("/api/v1/admin/monitoring/stream", apiBase);
        url.searchParams.set("range", range);
        const response = await fetch(url, {
          headers: { Authorization: `Bearer ${token}`, Accept: "text/event-stream" },
          cache: "no-store",
          signal: controller.signal,
        });
        if (!response.ok || !response.body) throw new Error(`Monitoring stream failed (${response.status})`);

        onConnection("live");
        hasConnected = true;
        retryDelay = 1_000;
        const reader = response.body.getReader();
        const decoder = new TextDecoder();
        let buffer = "";
        while (!stopped) {
          const { done, value } = await reader.read();
          if (done) break;
          buffer += decoder.decode(value, { stream: true });
          const frames = buffer.split(/\r?\n\r?\n/);
          buffer = frames.pop() ?? "";
          for (const frame of frames) {
            const data = frame.split(/\r?\n/).filter((line) => line.startsWith("data:")).map((line) => line.slice(5).trim()).join("\n");
            if (!data) continue;
            try {
              const event = JSON.parse(data) as { success?: boolean; data?: MonitoringResponse };
              const result = normalizeMonitoring(event.data);
              if (event.success && result.available) onSnapshot(result);
            } catch {
              // Ignore an incomplete or malformed event and continue reading the stream.
            }
          }
        }
        await reader.cancel().catch(() => undefined);
      } catch {
        if (stopped) break;
      }

      controller = null;
      if (!stopped) {
        onConnection("reconnecting");
        await wait(retryDelay);
        retryDelay = Math.min(retryDelay * 2, 10_000);
      }
    }
  };

  void connect();
  return () => {
    stopped = true;
    controller?.abort();
  };
}

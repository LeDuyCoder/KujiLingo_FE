"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import {
  Activity, ArrowUpRight, Award, BookOpen, CircleAlert, Clock3,
  Cpu, Database, HardDrive, Languages, Package, RefreshCw,
  Server, ShieldCheck, Users, UserRoundCheck, Waves,
} from "lucide-react";
import { axiosClient } from "@/shared/api/axiosClient";
import { useLanguage } from "@/shared/i18n/language";
import { OverviewLineChart, RequestDonut } from "./OverviewCharts";
import {
  loadMonitoring,
  subscribeMonitoring,
  type HealthState,
  type MonitoringRange,
  type MonitoringSnapshot,
  type ServiceHealth,
} from "./monitoring-data";

type ApiPayload = { data?: unknown; meta?: { total?: number | string } };
type AdminEvent = { id: string; admin_name?: string | null; action: string; entity_id?: string | null; created_at: string };
type MetricValue = { totalUsers: number | null; courses: number | null; library: number | null };
type MonitoringState = { snapshot: MonitoringSnapshot | null; source: "api" | "unavailable"; loading: boolean };

const ranges: { id: MonitoringRange; labelKey: string }[] = [
  { id: "1h", labelKey: "admin.overview.range.1h" },
  { id: "24h", labelKey: "admin.overview.range.24h" },
  { id: "7d", labelKey: "admin.overview.range.7d" },
  { id: "30d", labelKey: "admin.overview.range.30d" },
];

const shortcuts = [
  { href: "/admin/users", titleKey: "admin.overview.shortcut.users", descriptionKey: "admin.overview.shortcut.usersDescription", icon: Users },
  { href: "/admin/content", titleKey: "admin.overview.shortcut.content", descriptionKey: "admin.overview.shortcut.contentDescription", icon: BookOpen },
  { href: "/admin/library", titleKey: "admin.overview.shortcut.library", descriptionKey: "admin.overview.shortcut.libraryDescription", icon: Languages },
  { href: "/admin/achievements", titleKey: "admin.overview.shortcut.achievements", descriptionKey: "admin.overview.shortcut.achievementsDescription", icon: Award },
  { href: "/admin/shop", titleKey: "admin.overview.shortcut.shop", descriptionKey: "admin.overview.shortcut.shopDescription", icon: Package },
  { href: "/admin/audit", titleKey: "admin.overview.shortcut.audit", descriptionKey: "admin.overview.shortcut.auditDescription", icon: Activity },
];

function totalFrom(payload: ApiPayload | null): number | null {
  const value = payload?.meta?.total;
  if (value === undefined || value === null || value === "") return null;
  const total = Number(value);
  return Number.isFinite(total) && total >= 0 ? total : null;
}

function formatDate(value: string, locale: string, t: (key: string) => string) {
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? t("admin.overview.invalidTime") : date.toLocaleString(locale, { dateStyle: "medium", timeStyle: "short" });
}

function formatDuration(seconds: number, t: (key: string) => string) {
  const days = Math.floor(seconds / 86_400);
  const hours = Math.floor((seconds % 86_400) / 3_600);
  const minutes = Math.floor((seconds % 3_600) / 60);
  return days ? `${days} ${t("admin.overview.day")} ${hours} ${t("admin.overview.hour")}` : hours ? `${hours} ${t("admin.overview.hour")} ${minutes} ${t("admin.overview.minute")}` : `${minutes} ${t("admin.overview.minute")}`;
}

function stateAppearance(status: HealthState, t: (key: string) => string) {
  switch (status) {
    case "healthy": return { label: t("admin.overview.health.healthy"), className: "text-emerald-700", color: "#16a34a" };
    case "warning": return { label: t("admin.overview.health.warning"), className: "text-amber-700", color: "#d97706" };
    case "down": return { label: t("admin.overview.health.down"), className: "text-rose-700", color: "#e11d48" };
    default: return { label: t("admin.overview.health.unavailable"), className: "text-zinc-600", color: "#71717a" };
  }
}

function CompactMetric({ label, value, note, icon: Icon, color = "text-zinc-600", loading }: { label: string; value: string; note: string; icon: typeof Users; color?: string; loading: boolean }) {
  return (
    <article className="min-w-0 rounded-2xl bg-white p-4 shadow-sm sm:p-5">
      <div className="flex items-center gap-2 text-xs font-semibold text-zinc-600 sm:text-sm"><Icon size={16} className={`shrink-0 ${color}`}/><span className="truncate">{label}</span></div>
      {loading ? <div aria-hidden="true" className="mt-3 h-7 w-20 animate-pulse rounded bg-zinc-100"/> : <p className="mt-2 truncate text-2xl font-black tracking-tight tabular-nums text-zinc-950">{value}</p>}
      <p className="mt-1 truncate text-xs text-zinc-600">{note}</p>
    </article>
  );
}

function ResourceBar({ label, displayValue, percent, icon: Icon }: { label: string; displayValue: string; percent: number | null; icon: typeof Cpu }) {
  const tone = percent === null ? "#d4d4d8" : percent > 85 ? "#e11d48" : percent >= 70 ? "#d97706" : "#16a34a";
  return (
    <div className="rounded-xl bg-zinc-50 p-4">
      <div className="flex items-center justify-between gap-3">
        <span className="inline-flex items-center gap-2 text-sm font-semibold text-zinc-700"><Icon size={16} className="text-zinc-500"/>{label}</span>
        <span className="text-sm font-bold tabular-nums text-zinc-900">{displayValue}</span>
      </div>
      {percent !== null && <div className="mt-3 h-2 overflow-hidden rounded-full bg-zinc-200" role="progressbar" aria-label={label} aria-valuemin={0} aria-valuemax={100} aria-valuenow={percent}>
        <div className="h-full rounded-full transition-[width] duration-500 ease-out" style={{ width: `${Math.max(0, Math.min(100, percent))}%`, backgroundColor: tone }}/>
      </div>}
    </div>
  );
}

function ServiceRow({ service }: { service: ServiceHealth }) {
  const { language, t } = useLanguage();
  const appearance = stateAppearance(service.status, t);
  return (
    <tr className="border-t border-zinc-100 first:border-0">
      <th scope="row" className="py-3 pr-3 text-left text-sm font-semibold text-zinc-800">{service.name}</th>
      <td className={`py-3 pr-3 text-xs font-semibold ${appearance.className}`}><span className="inline-flex items-center gap-2"><span className="h-2 w-2 rounded-full" style={{ backgroundColor: appearance.color }}/>{appearance.label}</span></td>
      <td className="whitespace-nowrap py-3 text-right text-xs tabular-nums text-zinc-700">{service.responseMs === null ? "\u2014" : `${service.responseMs.toLocaleString(language === "vi" ? "vi-VN" : "en-US")} ms`}</td>
    </tr>
  );
}

function PanelUnavailable({ children }: { children?: string }) {
  const { t } = useLanguage();
  return <div className="flex min-h-40 items-center justify-center rounded-xl bg-zinc-50 px-5 py-8 text-center text-sm text-zinc-600">{children ?? t("admin.overview.monitoringUnavailable")}</div>;
}

export default function AdminOverviewDashboard() {
  const { language, t } = useLanguage();
  const locale = language === "vi" ? "vi-VN" : "en-US";
  const [range, setRange] = useState<MonitoringRange>("24h");
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [updatedAt, setUpdatedAt] = useState<string | null>(null);
  const [streamState, setStreamState] = useState<"connecting" | "live" | "reconnecting">("connecting");
  const [monitoring, setMonitoring] = useState<MonitoringState>({ snapshot: null, source: "unavailable", loading: true });
  const [application, setApplication] = useState<MetricValue>({ totalUsers: null, courses: null, library: null });
  const [adminActivity, setAdminActivity] = useState<AdminEvent[] | null>(null);

  const loadDashboard = useCallback(async (selectedRange: MonitoringRange) => {
    setLoading(true);
    setRefreshing(true);
    setMonitoring((current) => ({ ...current, loading: true }));
    const results = await Promise.allSettled([
      loadMonitoring(selectedRange),
      axiosClient.get("/api/v1/admin/users", { params: { page: 1, limit: 1 } }),
      axiosClient.get("/api/v1/courses", { params: { page: 1, limit: 1 } }),
      axiosClient.get("/api/v1/vocabularies", { params: { page: 1, limit: 1 } }),
      axiosClient.get("/api/v1/grammar", { params: { page: 1, limit: 1 } }),
      axiosClient.get("/api/v1/kanji", { params: { page: 1, limit: 1 } }),
      axiosClient.get("/api/v1/admin/audit-logs", { params: { page: 1, limit: 5 } }),
    ]);
    const monitoringResult = results[0];
    if (monitoringResult.status === "fulfilled") {
      const result = monitoringResult.value;
      setMonitoring({ snapshot: result.available ? result.snapshot : null, source: result.source, loading: false });
    } else {
      setMonitoring({ snapshot: null, source: "unavailable", loading: false });
    }

    const payloadAt = (index: number): ApiPayload | null => {
      const result = results[index];
      return result?.status === "fulfilled" && "data" in result.value ? result.value.data as ApiPayload : null;
    };
    const userCount = totalFrom(payloadAt(1));
    const courseCount = totalFrom(payloadAt(2));
    const libraryCounts = [totalFrom(payloadAt(3)), totalFrom(payloadAt(4)), totalFrom(payloadAt(5))];
    setApplication({
      totalUsers: userCount,
      courses: courseCount,
      library: libraryCounts.every((value): value is number => value !== null) ? libraryCounts.reduce<number>((sum, value) => sum + value, 0) : null,
    });
    const activityPayload = payloadAt(6);
    setAdminActivity(Array.isArray(activityPayload?.data) ? activityPayload.data as AdminEvent[] : null);
    setUpdatedAt(new Date().toISOString());
    setLoading(false);
    setRefreshing(false);
  }, []);

  useEffect(() => {
    const timer = window.setTimeout(() => void loadDashboard(range), 0);
    return () => window.clearTimeout(timer);
  }, [loadDashboard, range]);

  useEffect(() => {
    return subscribeMonitoring(range, (result) => {
      setMonitoring({ snapshot: result.available ? result.snapshot : null, source: result.source, loading: false });
      if (result.available) setUpdatedAt(new Date().toISOString());
    }, setStreamState);
  }, [range]);

  const snapshot = monitoring.snapshot;
  const systemState: HealthState = snapshot ? snapshot.status : "unavailable";
  const systemAppearance = stateAppearance(systemState, t);
  const responseTrend = snapshot?.apiPreviousAverageMs !== null && snapshot?.apiPreviousAverageMs !== undefined && snapshot.apiAverageMs !== null
    ? Math.round((snapshot.apiPreviousAverageMs - snapshot.apiAverageMs) / Math.max(1, snapshot.apiPreviousAverageMs) * 100)
    : null;
  const periodLabel = t(ranges.find((item) => item.id === range)?.labelKey ?? "admin.overview.range.24h");
  const applicationMetrics = [
    { label: t("admin.overview.totalUsers"), value: application.totalUsers, icon: Users },
    { label: t("admin.overview.usersToday"), value: snapshot?.activeUsersToday ?? null, icon: UserRoundCheck },
    { label: t("admin.overview.totalCourses"), value: application.courses, icon: BookOpen },
    { label: t("admin.overview.libraryItems"), value: application.library, icon: Languages },
  ];
  const resourceMetrics = snapshot ? [
    { label: t("admin.overview.cpuProcess"), displayValue: snapshot.resources.cpuPercent === null ? t("admin.overview.measuring") : `${snapshot.resources.cpuPercent}%`, percent: snapshot.resources.cpuPercent, icon: Cpu },
    { label: t("admin.overview.heapMemory"), displayValue: `${snapshot.resources.heapUsedMb.toFixed(1)} / ${snapshot.resources.heapTotalMb.toFixed(1)} MB`, percent: snapshot.resources.heapTotalMb ? snapshot.resources.heapUsedMb / snapshot.resources.heapTotalMb * 100 : null, icon: Server },
    { label: t("admin.overview.rssProcess"), displayValue: `${snapshot.resources.memoryRssMb.toFixed(1)} MB`, percent: null, icon: HardDrive },
    { label: t("admin.overview.dbConnections"), displayValue: `${snapshot.resources.databaseConnections} / ${snapshot.resources.databaseConnectionLimit}`, percent: snapshot.resources.databaseConnectionLimit ? snapshot.resources.databaseConnections / snapshot.resources.databaseConnectionLimit * 100 : null, icon: Database },
  ] : [t("admin.overview.cpuProcess"), t("admin.overview.heapMemory"), t("admin.overview.rssProcess"), t("admin.overview.dbConnections")].map((label, index) => ({ label, displayValue: "—", percent: null, icon: [Cpu, Server, HardDrive, Database][index] }));

  return (
    <div className="space-y-5 sm:space-y-6">
      <header className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-2xl font-black tracking-tight text-zinc-950 sm:text-3xl">{t("admin.overview.title")}</h1>
          <p className="mt-1.5 text-sm text-zinc-600">{t("admin.overview.description")}</p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <span role="status" className={`inline-flex h-9 items-center gap-2 rounded-full px-3 text-xs font-semibold ${streamState === "live" ? "bg-emerald-50 text-emerald-800" : "bg-zinc-100 text-zinc-700"}`}>
            <span aria-hidden="true" className={`h-2 w-2 rounded-full ${streamState === "live" ? "bg-emerald-600" : "bg-zinc-500"}`}/>
            {streamState === "live" ? t("admin.overview.live") : streamState === "connecting" ? t("admin.overview.connecting") : t("admin.overview.reconnecting")}
          </span>
          {updatedAt && <p className="mr-1 text-xs text-zinc-600">{t("admin.overview.updated")} {new Date(updatedAt).toLocaleTimeString(locale, { hour: "2-digit", minute: "2-digit", second: "2-digit" })}</p>}
          <label className="sr-only" htmlFor="overview-range">{t("admin.overview.timeRange")}</label>
          <select id="overview-range" value={range} onChange={(event) => setRange(event.target.value as MonitoringRange)} className="h-10 rounded-xl border border-zinc-200 bg-white px-3 text-sm font-semibold text-zinc-700 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-[#b7152b]">
            {ranges.map((item) => <option key={item.id} value={item.id}>{t(item.labelKey)}</option>)}
          </select>
          <button type="button" onClick={() => void loadDashboard(range)} disabled={refreshing} className="inline-flex h-10 items-center gap-2 rounded-xl bg-[#b7152b] px-3.5 text-sm font-bold text-white transition-colors hover:bg-[#9f1226] disabled:opacity-60">
            <RefreshCw size={15} className={refreshing ? "animate-spin" : ""}/><span>{t("admin.overview.refresh")}</span>
          </button>
        </div>
      </header>

      {monitoring.source === "unavailable" && !monitoring.loading && <p role="status" className="rounded-xl bg-zinc-100 px-4 py-2.5 text-xs text-zinc-700">{t("admin.overview.telemetryError")}</p>}

      <section aria-label={t("admin.overview.systemHealth")} className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-5">
        <article className="rounded-2xl bg-white p-4 shadow-sm sm:p-5">
          <p className="text-xs font-semibold text-zinc-600">{t("admin.overview.systemStatus")}</p>
          <div className={`mt-2 flex items-center gap-2 text-lg font-black ${systemAppearance.className}`}><span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: systemAppearance.color }}/>{monitoring.loading ? t("admin.overview.checking") : systemAppearance.label}</div>
          <p className="mt-1 text-xs text-zinc-600">{monitoring.loading ? t("admin.overview.checkingServices") : snapshot?.status === "healthy" ? t("admin.overview.allHealthy") : snapshot?.status === "warning" ? t("admin.overview.someWarning") : snapshot?.status === "down" ? t("admin.overview.someDown") : t("admin.overview.noMonitoring")}</p>
        </article>
        <CompactMetric label={t("admin.overview.instanceUptime")} value={snapshot ? formatDuration(snapshot.uptimeSeconds, t) : "—"} note={t("admin.overview.sinceRestart")} icon={Clock3} color="text-emerald-700" loading={monitoring.loading}/>
        <CompactMetric label={t("admin.overview.averageResponse")} value={!snapshot || snapshot.apiAverageMs === null ? "—" : `${snapshot.apiAverageMs} ms`} note={responseTrend === null ? t("admin.overview.recentAverage") : `${responseTrend >= 0 ? "↓" : "↑"} ${Math.abs(responseTrend)}% ${t("admin.overview.vsPrevious")}`} icon={Waves} color="text-blue-700" loading={monitoring.loading}/>
        <CompactMetric label={t("admin.overview.errorRate")} value={!snapshot || snapshot.errorRatePercent === null ? "—" : `${snapshot.errorRatePercent}%`} note={!snapshot || snapshot.errorRatePercent === null ? t("admin.overview.noRecentRequests") : snapshot.errorRatePercent < 1 ? t("admin.overview.withinNormal") : t("admin.overview.needsReview")} icon={CircleAlert} color={snapshot?.errorRatePercent !== null && snapshot?.errorRatePercent !== undefined && snapshot.errorRatePercent >= 1 ? "text-rose-700" : "text-emerald-700"} loading={monitoring.loading}/>
        <CompactMetric label={t("admin.overview.activeUsers")} value={snapshot ? snapshot.activeUsersNow.toLocaleString(locale) : "—"} note={t("admin.overview.inUse")} icon={Users} color="text-[#b7152b]" loading={monitoring.loading}/>
      </section>

      <div className="grid gap-4 xl:grid-cols-3">
        <section aria-labelledby="traffic-title" className="rounded-2xl bg-white p-4 shadow-sm sm:p-5 xl:col-span-2">
          <div className="mb-4 flex items-start justify-between gap-3">
            <div><h2 id="traffic-title" className="text-base font-extrabold text-zinc-950">{t("admin.overview.systemTraffic")}</h2><p className="mt-1 text-xs text-zinc-600">{t("admin.overview.requestsIn")} {periodLabel}</p></div>
            <Activity size={17} className="mt-0.5 text-[#b7152b]" aria-hidden="true"/>
          </div>
          {monitoring.loading ? <div className="h-56 animate-pulse rounded-xl bg-zinc-50" aria-label={t("admin.overview.loadingTraffic")}/> : snapshot && snapshot.traffic.length ? <OverviewLineChart description={`${t("admin.overview.trafficChart")} ${periodLabel}`} labels={snapshot.traffic.map((point) => point.label)} series={[{ label: t("admin.overview.apiRequests"), color: "#b7152b", values: snapshot.traffic.map((point) => point.requests) }, { label: t("admin.overview.successful"), color: "#16a34a", values: snapshot.traffic.map((point) => point.successful) }, { label: t("admin.overview.failed"), color: "#e11d48", values: snapshot.traffic.map((point) => point.failed) } ]}/> : <PanelUnavailable>{snapshot ? t("admin.overview.noRequestsPeriod") : undefined}</PanelUnavailable>}
        </section>

        <section aria-labelledby="request-distribution-title" className="rounded-2xl bg-white p-4 shadow-sm sm:p-5">
          <div className="mb-4"><h2 id="request-distribution-title" className="text-base font-extrabold text-zinc-950">{t("admin.overview.requestDistribution")}</h2><p className="mt-1 text-xs text-zinc-600">{t("admin.overview.byResponseCode")}</p></div>
          {monitoring.loading ? <div className="mx-auto h-36 w-36 animate-pulse rounded-full bg-zinc-100" aria-label={t("admin.overview.loadingDistribution")}/> : snapshot && snapshot.apiAverageMs !== null ? <RequestDonut values={snapshot.requestStatusPercent}/> : <PanelUnavailable>{snapshot ? t("admin.overview.noRequestsStats") : undefined}</PanelUnavailable>}
        </section>
      </div>

      <section aria-labelledby="resources-title" className="rounded-2xl bg-white p-4 shadow-sm sm:p-5">
        <div className="mb-4 flex items-baseline justify-between gap-3"><div><h2 id="resources-title" className="text-base font-extrabold text-zinc-950">{t("admin.overview.systemResources")}</h2><p className="mt-1 text-xs text-zinc-600">{t("admin.overview.refreshEveryTwoSeconds")}</p></div><span className="text-[11px] text-zinc-600">{t("admin.overview.resourceThresholds")}</span></div>
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">{resourceMetrics.map((item) => <ResourceBar key={item.label} {...item}/>)}</div>
      </section>

      <div className="grid gap-4 xl:grid-cols-2">
        <section aria-labelledby="services-title" className="rounded-2xl bg-white p-4 shadow-sm sm:p-5">
          <div className="mb-3 flex items-start justify-between gap-3"><div><h2 id="services-title" className="text-base font-extrabold text-zinc-950">{t("admin.overview.servicesStatus")}</h2><p className="mt-1 text-xs text-zinc-600">{t("admin.overview.responseAndUptime")}</p></div><ShieldCheck size={17} className="text-zinc-500" aria-hidden="true"/></div>
          {monitoring.loading ? <div className="space-y-4 py-2">{[0,1,2,3].map((key) => <div key={key} className="h-8 animate-pulse rounded bg-zinc-50"/>)}</div> : snapshot ? (
            <div><table className="w-full table-fixed text-left"><colgroup><col className="w-[42%]"/><col className="w-[30%]"/><col className="w-[28%]"/></colgroup><thead><tr className="text-[10px] font-semibold text-zinc-600 sm:text-[11px]"><th scope="col" className="pb-2">{t("admin.overview.service")}</th><th scope="col" className="pb-2">{t("admin.overview.status")}</th><th scope="col" className="pb-2 text-right">{t("admin.overview.responseShort")}</th></tr></thead><tbody>{snapshot.services.map((service) => <ServiceRow key={service.name} service={service}/>)}</tbody></table></div>
          ) : <PanelUnavailable/>}
        </section>

        <section aria-labelledby="api-performance-title" className="rounded-2xl bg-white p-4 shadow-sm sm:p-5">
          <div className="mb-4"><h2 id="api-performance-title" className="text-base font-extrabold text-zinc-950">{t("admin.overview.apiPerformance")}</h2><p className="mt-1 text-xs text-zinc-600">{t("admin.overview.responseByRange")}</p></div>
          {monitoring.loading ? <div className="h-36 animate-pulse rounded-xl bg-zinc-50" aria-label={t("admin.overview.loadingApi")}/> : snapshot && snapshot.traffic.length ? <OverviewLineChart description={`${t("admin.overview.apiResponseChart")} ${periodLabel}`} labels={snapshot.traffic.map((point) => point.label)} series={[{ label: t("admin.overview.responseTime"), color: "#2563eb", unit: " ms", values: snapshot.traffic.map((point) => point.responseMs) }]}/> : <PanelUnavailable>{snapshot ? "Chưa có request để vẽ biểu đồ." : undefined}</PanelUnavailable>}
          <div className="mt-3 grid grid-cols-3 divide-x divide-zinc-100 rounded-xl bg-zinc-50 py-3 text-center">
            <div><p className="text-[10px] text-zinc-600">{t("admin.overview.averageResponse")}</p><p className="mt-1 text-sm font-extrabold tabular-nums text-zinc-900">{snapshot?.apiAverageMs === null || !snapshot ? "—" : `${snapshot.apiAverageMs} ms`}</p></div>
            <div><p className="text-[10px] text-zinc-600">P95</p><p className="mt-1 text-sm font-extrabold tabular-nums text-zinc-900">{snapshot?.apiP95Ms === null || !snapshot ? "—" : `${snapshot.apiP95Ms} ms`}</p></div>
            <div><p className="text-[10px] text-zinc-600">{t("admin.overview.slowRequests")}</p><p className="mt-1 text-sm font-extrabold tabular-nums text-zinc-900">{snapshot ? snapshot.slowRequests.toLocaleString(locale) : "—"}</p></div>
          </div>
        </section>
      </div>

      <div className="grid gap-4 xl:grid-cols-2">
        <section aria-labelledby="database-title" className="rounded-2xl bg-white p-4 shadow-sm sm:p-5">
          <div className="mb-4 flex items-start justify-between gap-3"><div><h2 id="database-title" className="text-base font-extrabold text-zinc-950">{t("admin.overview.database")}</h2><p className="mt-1 text-xs text-zinc-600">{t("admin.overview.databaseHealth")}</p></div><Database size={17} className="text-zinc-500" aria-hidden="true"/></div>
          {monitoring.loading ? <div className="h-32 animate-pulse rounded-xl bg-zinc-50" aria-label={t("admin.overview.databaseData")}/> : snapshot ? (
            <dl className="grid grid-cols-2 gap-2 sm:grid-cols-4">
              {[
                [t("admin.overview.healthCheck"), snapshot.database.probeMs === null ? t("admin.overview.noConnection") : `${snapshot.database.probeMs} ms`],
                [t("admin.overview.openConnections"), `${snapshot.database.activeConnections} / ${snapshot.database.connectionLimit}`],
                [t("admin.overview.idleConnections"), String(snapshot.database.idleConnections)],
                [t("admin.overview.waitingConnections"), String(snapshot.database.waitingConnections)],
              ].map(([label, value]) => <div key={label} className="rounded-lg bg-zinc-50 px-3 py-3"><dt className="text-[10px] text-zinc-600">{label}</dt><dd className="mt-1 text-sm font-extrabold tabular-nums text-zinc-900">{value}</dd></div>)}
            </dl>
          ) : <PanelUnavailable/>}
        </section>

        <section aria-labelledby="application-title" className="rounded-2xl bg-white p-4 shadow-sm sm:p-5">
          <div className="mb-4"><h2 id="application-title" className="text-base font-extrabold text-zinc-950">{t("admin.overview.applicationActivity")}</h2><p className="mt-1 text-xs text-zinc-600">{t("admin.overview.kujilingoMetrics")}</p></div>
          <div className="grid grid-cols-2 gap-2">
            {applicationMetrics.map(({ label, value, icon: Icon }) => <div key={label} className="rounded-xl bg-zinc-50 p-3 sm:p-4"><p className="flex items-center gap-2 text-xs font-semibold text-zinc-600"><Icon size={14} className="text-[#b7152b]"/>{label}</p><p className="mt-2 text-xl font-black tabular-nums text-zinc-950">{loading && value === null ? "…" : value === null ? "—" : value.toLocaleString(locale)}</p></div>)}
          </div>
        </section>
      </div>

      <div className="grid gap-4 xl:grid-cols-2">
        <section aria-labelledby="telemetry-window-title" className="rounded-2xl bg-white p-4 shadow-sm sm:p-5">
          <div className="mb-4 flex items-start justify-between gap-3"><div><h2 id="telemetry-window-title" className="text-base font-extrabold text-zinc-950">{t("admin.overview.telemetryWindow")}</h2><p className="mt-1 text-xs text-zinc-600">{t("admin.overview.backendMetrics")}</p></div><Activity size={17} className="text-zinc-500" aria-hidden="true"/></div>
          {monitoring.loading ? <div className="h-24 animate-pulse rounded-xl bg-zinc-50" aria-label={t("admin.overview.loadingTelemetry")}/> : snapshot ? <div className="grid grid-cols-2 gap-2"><div className="rounded-xl bg-zinc-50 p-3"><p className="text-xs text-zinc-600">{t("admin.overview.requestsFiveMinutes")}</p><p className="mt-1 text-lg font-extrabold tabular-nums text-zinc-950">{snapshot.requestCount.toLocaleString(locale)}</p></div><div className="rounded-xl bg-zinc-50 p-3"><p className="text-xs text-zinc-600">{t("admin.overview.instanceHistory")}</p><p className="mt-1 text-lg font-extrabold text-zinc-950">{formatDuration(snapshot.historyAvailableSeconds, t)}</p></div></div> : <PanelUnavailable/>}
        </section>

        <section aria-labelledby="admin-activity-title" className="rounded-2xl bg-white p-4 shadow-sm sm:p-5">
          <div className="mb-4 flex items-start justify-between gap-3"><div><h2 id="admin-activity-title" className="text-base font-extrabold text-zinc-950">{t("admin.overview.adminActivity")}</h2><p className="mt-1 text-xs text-zinc-600">{t("admin.overview.recentChanges")}</p></div><ShieldCheck size={17} className="text-zinc-500" aria-hidden="true"/></div>
          {loading && adminActivity === null ? <div className="space-y-3">{[0,1,2].map((key) => <div key={key} className="h-12 animate-pulse rounded-xl bg-zinc-50"/>)}</div> : adminActivity === null ? <PanelUnavailable>{t("admin.overview.auditLoadError")}</PanelUnavailable> : adminActivity.length === 0 ? <PanelUnavailable>{t("admin.overview.noAdminActivity")}</PanelUnavailable> : (
            <ol className="divide-y divide-zinc-100">
              {adminActivity.slice(0, 5).map((entry) => <li key={entry.id} className="flex min-w-0 items-start gap-3 py-3 first:pt-1 last:pb-1"><span className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-red-50 text-[#b7152b]"><ShieldCheck size={15}/></span><div className="min-w-0 flex-1"><p className="truncate text-sm font-semibold text-zinc-900">{entry.admin_name || t("admin.overview.admin")}<span className="font-normal text-zinc-600"> · </span><span className="font-mono text-xs font-medium text-zinc-700">{entry.action}</span></p><p className="mt-1 text-xs text-zinc-600">{formatDate(entry.created_at, locale, t)}</p></div></li>)}
            </ol>
          )}
          <Link href="/admin/audit" className="mt-2 inline-flex min-h-9 items-center gap-1 text-sm font-bold text-[#b7152b] hover:text-[#8f1022]">{t("admin.overview.viewAudit")}<ArrowUpRight size={15}/></Link>
        </section>
      </div>

      <section aria-labelledby="admin-areas-title">
        <div className="mb-3 flex items-baseline justify-between gap-3"><h2 id="admin-areas-title" className="text-base font-extrabold text-zinc-950">{t("admin.overview.managementAreas")}</h2><span className="text-xs text-zinc-600">{t("admin.overview.quickAccess")}</span></div>
        <nav aria-label={t("admin.overview.managementAreas")} className="grid overflow-hidden rounded-2xl bg-white shadow-sm sm:grid-cols-2 xl:grid-cols-3">
          {shortcuts.map(({ href, titleKey, descriptionKey, icon: Icon }) => <Link key={href} href={href} className="group flex min-h-[76px] items-center gap-3 border-b border-zinc-100 px-4 py-3 transition-colors hover:bg-red-50/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-[#b7152b] sm:px-5"><span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-red-50 text-[#b7152b]"><Icon size={17}/></span><span className="min-w-0 flex-1"><span className="block truncate text-sm font-bold text-zinc-900">{t(titleKey)}</span><span className="mt-1 block truncate text-xs text-zinc-600">{t(descriptionKey)}</span></span><ArrowUpRight size={15} className="shrink-0 text-zinc-500 transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5 group-hover:text-[#b7152b]"/></Link>)}
        </nav>
      </section>
    </div>
  );
}


"use client";

import { useLanguage } from "@/shared/i18n/language";

type LineSeries = { label: string; color: string; values: number[]; unit?: string };

export function OverviewLineChart({ labels, series, description }: { labels: string[]; series: LineSeries[]; description: string }) {
  const { language, t } = useLanguage();
  const locale = language === "vi" ? "vi-VN" : "en-US";
  const width = 720;
  const height = 232;
  const margin = { top: 12, right: 36, bottom: 30, left: 42 };
  const plotWidth = width - margin.left - margin.right;
  const plotHeight = height - margin.top - margin.bottom;
  const maxValue = Math.max(1, ...series.flatMap((item) => item.values));
  const x = (index: number) => margin.left + (labels.length <= 1 ? 0 : index * plotWidth / (labels.length - 1));
  const y = (value: number) => margin.top + plotHeight - value / maxValue * plotHeight;
  const labelStep = Math.max(1, Math.ceil(labels.length / 8));

  return (
    <div className="min-w-0">
      <ul className="mb-3 flex flex-wrap gap-x-5 gap-y-2" aria-label={t("admin.overview.chartLegend")}>
        {series.map((item) => <li key={item.label} className="inline-flex items-center gap-2 text-xs text-zinc-600"><span className="h-2 w-2 rounded-full" style={{ backgroundColor: item.color }}/>{item.label}</li>)}
      </ul>
      <svg className="block h-auto w-full overflow-visible" viewBox={`0 0 ${width} ${height}`} role="img" aria-label={description}>
        <title>{description}</title>
        {[0, 1, 2, 3].map((tick) => {
          const yPos = margin.top + plotHeight * tick / 3;
          const tickValue = Math.round(maxValue * (3 - tick) / 3);
          return <g key={tick}><line x1={margin.left} y1={yPos} x2={width - margin.right} y2={yPos} stroke="#e4e4e7" strokeDasharray={tick === 3 ? undefined : "3 5"}/><text x={margin.left - 8} y={yPos + 4} textAnchor="end" fill="#71717a" fontSize="10">{tickValue.toLocaleString(locale)}</text></g>;
        })}
        {series.map((item) => {
          const path = item.values.map((value, index) => `${index === 0 ? "M" : "L"}${x(index)},${y(value)}`).join(" ");
          return <g key={item.label}>
            <path d={path} fill="none" stroke={item.color} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" vectorEffect="non-scaling-stroke"/>
            {item.values.map((value, index) => {
              const label = `${labels[index]} · ${item.label}: ${value.toLocaleString(locale)}${item.unit ?? ""}`;
              return <circle key={`${item.label}-${labels[index]}`} cx={x(index)} cy={y(value)} r="3" fill="white" stroke={item.color} strokeWidth="2" vectorEffect="non-scaling-stroke" tabIndex={0} aria-label={label}><title>{label}</title></circle>;
            })}
          </g>;
        })}
        {labels.map((label, index) => index % labelStep === 0 || index === labels.length - 1 ? <text key={`${label}-${index}`} x={x(index)} y={height - 7} textAnchor="middle" fill="#71717a" fontSize="10">{label}</text> : null)}
      </svg>
    </div>
  );
}

export function RequestDonut({ values }: { values: { success: number; clientError: number; serverError: number } }) {
  const { t } = useLanguage();
  const radius = 43;
  const circumference = 2 * Math.PI * radius;
  const valuesList = [
    { label: "2xx", description: t("admin.overview.successfulRequests"), percent: values.success, color: "#16a34a" },
    { label: "4xx", description: t("admin.overview.clientErrors"), percent: values.clientError, color: "#d97706" },
    { label: "5xx", description: t("admin.overview.serverErrors"), percent: values.serverError, color: "#e11d48" },
  ];
  let offset = 0;

  return (
    <div className="flex flex-col items-center gap-5 sm:flex-row sm:justify-center sm:gap-7 xl:flex-col xl:gap-4 2xl:flex-row 2xl:gap-7">
      <svg viewBox="0 0 120 120" className="h-36 w-36 shrink-0" role="img" aria-label={t("admin.overview.requestSuccessRate").replace("{percent}", String(values.success))}>
        <title>{t("admin.overview.requestStatusDistribution")}</title>
        <circle cx="60" cy="60" r={radius} fill="none" stroke="#f4f4f5" strokeWidth="12"/>
        {valuesList.map((item) => {
          const dash = Math.max(0, item.percent) / 100 * circumference;
          const circle = <circle key={item.label} cx="60" cy="60" r={radius} fill="none" stroke={item.color} strokeWidth="12" strokeDasharray={`${dash} ${circumference - dash}`} strokeDashoffset={-offset} transform="rotate(-90 60 60)" strokeLinecap="butt" vectorEffect="non-scaling-stroke"><title>{`${item.label} ${item.description}: ${item.percent}%`}</title></circle>;
          offset += dash;
          return circle;
        })}
        <text x="60" y="57" textAnchor="middle" fill="#18181b" fontSize="19" fontWeight="700">{values.success}%</text>
        <text x="60" y="73" textAnchor="middle" fill="#71717a" fontSize="9">{t("admin.overview.successfulShort")}</text>
      </svg>
      <ul className="w-full space-y-3 sm:w-auto xl:w-full 2xl:w-auto">
        {valuesList.map((item) => <li key={item.label} className="flex items-center justify-between gap-4 text-xs"><span className="inline-flex items-center gap-2 text-zinc-600"><span className="h-2 w-2 rounded-full" style={{ backgroundColor: item.color }}/>{item.label} {item.description}</span><strong className="tabular-nums text-zinc-900">{item.percent}%</strong></li>)}
      </ul>
    </div>
  );
}

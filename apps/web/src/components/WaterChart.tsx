import { useEffect, useMemo, useRef, useState } from "react";
import type { ComponentProps } from "react";
import type { TimeseriesPoint } from "@agentic-insights/shared";
import { Bar, BarChart, CartesianGrid, Cell, Rectangle, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { formatLitres, formatNumber } from "../lib/format";

interface WaterChartProps {
  points: TimeseriesPoint[];
}

interface ChartDatum {
  key: string;
  label: string;
  central: number;
  low: number;
  high: number;
  tokens: number;
  excludedTokens: number;
  unestimatedTokens: number;
}

interface TooltipContentProps {
  active?: boolean;
  payload?: Array<{ payload: ChartDatum }>;
}

interface ChartBarShapeProps extends ComponentProps<typeof Rectangle> {
  payload?: ChartDatum;
}

const MAX_VISIBLE_LABELS = 5;
const MIN_CHART_HEIGHT = 280;

function toChartData(points: TimeseriesPoint[]): ChartDatum[] {
  return points.map((point) => ({
    key: point.key,
    label: point.label,
    central: point.waterLitres.central,
    low: point.waterLitres.low,
    high: point.waterLitres.high,
    tokens: point.tokens,
    excludedTokens: point.excludedTokens,
    unestimatedTokens: point.unestimatedTokens
  }));
}

function getXAxisInterval(pointCount: number): number {
  if (pointCount <= MAX_VISIBLE_LABELS) {
    return 0;
  }

  return Math.ceil(pointCount / MAX_VISIBLE_LABELS) - 1;
}

function formatAxisLitres(value: number): string {
  if (value === 0) {
    return "0";
  }

  if (Math.abs(value) < 1) {
    return `${Math.round(value * 1000)}mL`;
  }

  if (Math.abs(value) < 10) {
    return `${value.toFixed(1)}L`;
  }

  return `${Math.round(value)}L`;
}

function ChartTooltipContent({ active, payload }: TooltipContentProps) {
  const point = active ? payload?.[0]?.payload : undefined;

  if (!point) {
    return null;
  }

  return (
    <div
      data-testid="water-chart-tooltip"
      className="w-[180px] rounded-lg border border-slate-800/70 bg-slate-950/95 px-3 py-2.5 text-white shadow-2xl backdrop-blur"
    >
      <p className="text-xs font-medium text-slate-400">{point.label}</p>
      <p className="mt-1 text-lg font-bold tracking-[-0.03em]">{formatLitres(point.central)}</p>
      <p className="mt-0.5 text-xs text-slate-400">
        Between {formatLitres(point.low)} and {formatLitres(point.high)}
      </p>
      <p className="mt-1 text-xs text-slate-400">{formatNumber(point.tokens)} tokens</p>
    </div>
  );
}

function ChartBarShape({ payload, ...shapeProps }: ChartBarShapeProps) {
  return <Rectangle {...shapeProps} data-testid={payload ? `water-bar-${payload.key}` : undefined} />;
}

export function WaterChart({ points }: WaterChartProps) {
  const chartData = useMemo(() => toChartData(points), [points]);
  const xAxisInterval = useMemo(() => getXAxisInterval(chartData.length), [chartData.length]);
  const chartRef = useRef<HTMLDivElement>(null);
  const [chartSize, setChartSize] = useState({ width: 0, height: MIN_CHART_HEIGHT });

  useEffect(() => {
    const element = chartRef.current;
    if (!element) {
      return;
    }

    const updateSize = () => {
      const nextWidth = Math.max(element.clientWidth, 0);
      const nextHeight = Math.max(element.clientHeight, MIN_CHART_HEIGHT);
      setChartSize((current) => {
        if (current.width === nextWidth && current.height === nextHeight) {
          return current;
        }

        return {
          width: nextWidth,
          height: nextHeight
        };
      });
    };

    updateSize();

    if (typeof window.ResizeObserver === "function") {
      const observer = new window.ResizeObserver(() => {
        updateSize();
      });
      observer.observe(element);

      return () => {
        observer.disconnect();
      };
    }

    window.addEventListener("resize", updateSize);

    return () => {
      window.removeEventListener("resize", updateSize);
    };
  }, []);

  if (chartData.length === 0) {
    return (
      <div className="mt-6 rounded-xl border border-dashed border-slate-200 px-4 py-10 text-center text-sm text-ink-secondary">
        No water estimate available for this time range.
      </div>
    );
  }

  return (
    <div className="mt-6">
      <div
        ref={chartRef}
        data-testid="water-chart"
        className="min-w-0 h-72 overflow-hidden rounded-2xl border border-slate-200/80 bg-[linear-gradient(180deg,rgba(240,249,255,0.95),rgba(248,250,252,0.88))] px-3 pb-2 pt-4 sm:h-80 sm:px-4"
      >
        {chartSize.width > 0 ? (
          <ResponsiveContainer width={chartSize.width} height={chartSize.height}>
            <BarChart
              data={chartData}
              margin={{ top: 8, right: 8, bottom: 12, left: 0 }}
              barCategoryGap={chartData.length > 12 ? "24%" : "32%"}
            >
              <defs>
                <linearGradient id="water-bar-fill" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#0EA5E9" />
                  <stop offset="100%" stopColor="#38BDF8" />
                </linearGradient>
              </defs>

              <CartesianGrid vertical={false} stroke="#DDEAF5" strokeDasharray="3 6" />

              <XAxis
                dataKey="label"
                axisLine={false}
                tickLine={false}
                interval={xAxisInterval}
                minTickGap={24}
                tick={{ fill: "#64748B", fontSize: 12, fontWeight: 500 }}
                dy={10}
              />

              <YAxis
                axisLine={false}
                tickLine={false}
                width={52}
                tick={{ fill: "#94A3B8", fontSize: 11 }}
                tickFormatter={formatAxisLitres}
              />

              <Tooltip
                cursor={{ fill: "rgba(14, 165, 233, 0.08)" }}
                content={<ChartTooltipContent />}
                wrapperStyle={{ outline: "none" }}
              />

              <Bar
                dataKey="central"
                radius={[12, 12, 4, 4]}
                fill="url(#water-bar-fill)"
                activeBar={{ fill: "#0284C7", stroke: "#E0F2FE", strokeWidth: 1.25 }}
                background={{ fill: "rgba(186, 230, 253, 0.28)" }}
                minPointSize={chartData.length > 1 ? 3 : 6}
                shape={<ChartBarShape />}
              >
                {chartData.map((point) => (
                  <Cell key={point.key} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        ) : null}
      </div>
    </div>
  );
}

import React, { useId } from "react";
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ReferenceLine,
} from "recharts";
import { TrendingUp, LineChart as ChartIcon, CheckCircle2, Award } from "lucide-react";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";

export interface ExamAccuracyPoint {
  examName: string;
  date?: string;
  accuracy: number; // 0 - 100
  questionsCount?: number;
  target?: number;
}

export interface AccuracyEvolutionChartProps {
  data?: ExamAccuracyPoint[];
  title?: string;
  description?: string;
}

const defaultExamData: ExamAccuracyPoint[] = [];

interface CustomTooltipProps {
  active?: boolean;
  payload?: Array<{ value: number; payload: ExamAccuracyPoint }>;
  label?: string;
}

function CustomTooltip({ active, payload }: CustomTooltipProps) {
  if (active && payload && payload.length) {
    const item = payload[0]?.payload;
    if (!item) return null;
    const isAboveTarget = item.accuracy >= (item.target ?? 75);

    return (
      <div className="bg-surface-container-high/95 backdrop-blur-md border border-outline-variant rounded-xl p-3 shadow-xl min-w-[170px] text-xs">
        <div className="flex items-center justify-between gap-2 border-b border-border/40 pb-1.5 mb-2">
          <span className="font-bold text-on-surface text-sm">{item.examName}</span>
          {item.date && (
            <span className="font-label-code text-on-surface-variant text-[11px]">{item.date}</span>
          )}
        </div>
        <div className="flex flex-col gap-1">
          <div className="flex items-center justify-between">
            <span className="text-on-surface-variant">Taxa de Acerto:</span>
            <span className="font-bold text-primary font-display-hero text-sm">
              {item.accuracy}%
            </span>
          </div>
          {item.questionsCount && (
            <div className="flex items-center justify-between text-on-surface-variant text-[11px]">
              <span>Volume:</span>
              <span>{item.questionsCount} questões</span>
            </div>
          )}
          <div className="flex items-center justify-between text-[11px] pt-1">
            <span>Nota de Corte:</span>
            <span className="text-tertiary font-medium">{item.target ?? 75}%</span>
          </div>
          <div
            className={`mt-1.5 px-2 py-0.5 rounded-full text-[10px] font-label-caps font-bold text-center flex items-center justify-center gap-1 ${
              isAboveTarget
                ? "bg-secondary/15 text-secondary border border-secondary/20"
                : "bg-tertiary/15 text-tertiary border border-tertiary/20"
            }`}
          >
            {isAboveTarget ? (
              <>
                <CheckCircle2 className="w-3 h-3" aria-hidden="true" />
                <span>Acima do Corte (+{(item.accuracy - (item.target ?? 75)).toFixed(0)}%)</span>
              </>
            ) : (
              <span>{(item.target ?? 75) - item.accuracy}% para a meta</span>
            )}
          </div>
        </div>
      </div>
    );
  }
  return null;
}

export function AccuracyEvolutionChart({
  data = defaultExamData,
  title = "Evolução nos Simulados",
  description = "Acompanhamento da taxa de acerto por simulado cronometrado oficial",
}: AccuracyEvolutionChartProps) {
  const gradientId = useId();
  const latestPoint = data[data.length - 1];
  const firstPoint = data[0];
  const totalGrowth = latestPoint && firstPoint ? latestPoint.accuracy - firstPoint.accuracy : 0;

  return (
    <Card className="bg-surface-container-low border border-outline-variant/40 hover:border-outline-variant/70 transition-all rounded-2xl shadow-md p-6 flex flex-col justify-between">
      <CardHeader className="p-0 pb-5">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="flex flex-col gap-1">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-primary/10 border border-primary/20 flex items-center justify-center text-primary">
                <ChartIcon className="w-4 h-4" aria-hidden="true" />
              </div>
              <CardTitle className="font-headline-md text-headline-sm font-bold text-on-surface tracking-tight">
                {title}
              </CardTitle>
            </div>
            <CardDescription className="text-xs text-on-surface-variant font-body-sm">
              {description}
            </CardDescription>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-secondary/10 border border-secondary/20 text-secondary text-xs font-label-caps font-bold">
              <TrendingUp className="w-3.5 h-3.5" aria-hidden="true" />
              <span>{totalGrowth > 0 ? `+${totalGrowth}` : totalGrowth}% evolução</span>
            </div>
            <div className="flex items-center gap-1 px-3 py-1 rounded-full bg-surface-container-high text-on-surface text-xs font-label-code">
              <Award className="w-3.5 h-3.5 text-tertiary" aria-hidden="true" />
              <span>
                Último: <strong className="text-secondary">{latestPoint?.accuracy ?? 0}%</strong>
              </span>
            </div>
          </div>
        </div>
      </CardHeader>

      <CardContent className="p-0">
        <div className="w-full h-64 sm:h-72 mt-2">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={data} margin={{ top: 10, right: 10, left: -18, bottom: 0 }}>
              <defs>
                <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#adc6ff" stopOpacity={0.45} />
                  <stop offset="95%" stopColor="#adc6ff" stopOpacity={0.0} />
                </linearGradient>
              </defs>

              <CartesianGrid
                stroke="#283646"
                strokeDasharray="3 3"
                vertical={false}
                opacity={0.6}
              />

              <XAxis
                dataKey="examName"
                tickLine={false}
                axisLine={{ stroke: "#424754", strokeWidth: 1 }}
                tick={{ fill: "#8c909f", fontSize: 11 }}
                dy={8}
              />

              <YAxis
                domain={[40, 100]}
                ticks={[40, 60, 75, 90, 100]}
                tickLine={false}
                axisLine={false}
                tick={{ fill: "#8c909f", fontSize: 11 }}
                tickFormatter={(val) => `${val}%`}
              />

              <Tooltip content={<CustomTooltip />} />

              <ReferenceLine
                y={75}
                stroke="#ffb95f"
                strokeDasharray="4 4"
                strokeWidth={1.5}
                label={{
                  value: "Corte (75%)",
                  fill: "#ffb95f",
                  position: "insideTopRight",
                  fontSize: 10,
                  fontWeight: 600,
                }}
              />

              <Area
                type="monotone"
                dataKey="accuracy"
                stroke="#adc6ff"
                strokeWidth={3}
                fillOpacity={1}
                fill={`url(#${gradientId})`}
                dot={{
                  r: 4,
                  fill: "#061423",
                  stroke: "#adc6ff",
                  strokeWidth: 2,
                }}
                activeDot={{
                  r: 6,
                  fill: "#4edea3",
                  stroke: "#ffffff",
                  strokeWidth: 2,
                }}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        <div className="flex flex-wrap items-center justify-between gap-2 pt-4 mt-3 border-t border-border/40 text-xs font-label-code text-on-surface-variant">
          <div className="flex items-center gap-2">
            <span className="inline-block w-2.5 h-2.5 rounded-full bg-primary" />
            <span>Desempenho Real</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="inline-block w-3 h-0.5 bg-tertiary" />
            <span className="text-tertiary">Nota de Corte Alvo (75%)</span>
          </div>
          <div className="text-[11px] text-outline">
            Baseado em {data.length} simulados oficiais cronometrados
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

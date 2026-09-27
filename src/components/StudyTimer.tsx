import { useEffect, useMemo, useRef, useState } from "react";
import { Coffee, Pause, Play, RotateCcw, Save, Timer } from "lucide-react";
import { cn } from "@/lib/utils";

type Mode = { id: string; label: string; minutes: number | null; icon: typeof Timer };

const MODES: Mode[] = [
  { id: "foco25", label: "Foco 25min", minutes: 25, icon: Timer },
  { id: "foco50", label: "Foco 50min", minutes: 50, icon: Timer },
  { id: "pausa5", label: "Pausa 5min", minutes: 5, icon: Coffee },
  { id: "livre", label: "Cronômetro livre", minutes: null, icon: Play },
];

function clock(totalSeconds: number) {
  const s = Math.max(0, Math.round(totalSeconds));
  const m = Math.floor(s / 60);
  const sec = s % 60;
  return `${String(m).padStart(2, "0")}:${String(sec).padStart(2, "0")}`;
}

export function StudyTimer({
  disciplines,
  onSave,
  saving = false,
}: {
  disciplines: string[];
  onSave: (values: { discipline: string; minutes: number }) => void;
  saving?: boolean;
}) {
  const [modeId, setModeId] = useState("foco25");
  const [running, setRunning] = useState(false);
  const [elapsed, setElapsed] = useState(0);
  const [discipline, setDiscipline] = useState("");
  const [done, setDone] = useState(false);
  const beeped = useRef(false);
  const startTimeRef = useRef<number | null>(null);
  const accumulatedRef = useRef(0);

  const mode = useMemo(() => MODES.find((m) => m.id === modeId) ?? MODES[0]!, [modeId]);
  const target = mode.minutes === null ? null : mode.minutes * 60;

  useEffect(() => {
    if (!running) {
      if (startTimeRef.current !== null) {
        accumulatedRef.current += (Date.now() - startTimeRef.current) / 1000;
        startTimeRef.current = null;
      }
      return;
    }
    startTimeRef.current = Date.now();
    const id = window.setInterval(() => {
      const now = Date.now();
      const total = accumulatedRef.current + (now - startTimeRef.current!) / 1000;
      setElapsed(Math.floor(total));
    }, 250);
    return () => window.clearInterval(id);
  }, [running]);

  useEffect(() => {
    if (target !== null && elapsed >= target && !beeped.current) {
      beeped.current = true;
      setRunning(false);
      setDone(true);
    }
  }, [elapsed, target]);

  useEffect(() => {
    setElapsed(0);
    setRunning(false);
    setDone(false);
    beeped.current = false;
    accumulatedRef.current = 0;
    startTimeRef.current = null;
  }, [modeId]);

  useEffect(() => {
    if (!discipline && disciplines.length > 0) setDiscipline(disciplines[0]!);
  }, [disciplines, discipline]);

  const remaining = target === null ? elapsed : Math.max(0, target - elapsed);
  const pct = target === null ? (elapsed % 3600) / 3600 : Math.min(1, elapsed / target);
  const radius = 54;
  const circumference = 2 * Math.PI * radius;
  const minutesStudied = Math.max(1, Math.round(elapsed / 60));

  return (
    <div className="panel overflow-hidden">
      <div className="bg-navy-gradient px-4 py-4 text-navy-foreground">
        <div className="mb-3 flex items-center justify-between">
          <p className="flex items-center gap-2 text-sm font-bold">
            <Timer className="h-4 w-4" /> cronômetro de estudo
          </p>
          <span className="rounded-full bg-navy-foreground/15 px-2 py-0.5 text-[10px] font-semibold">
            {mode.label}
          </span>
        </div>

        <div className="flex items-center gap-4">
          <div className="relative flex-shrink-0">
            <svg width="128" height="128" viewBox="0 0 128 128" className="-rotate-90">
              <circle
                cx="64"
                cy="64"
                r={radius}
                fill="none"
                strokeWidth="8"
                className="stroke-navy-foreground/15"
              />
              <circle
                cx="64"
                cy="64"
                r={radius}
                fill="none"
                strokeWidth="8"
                strokeLinecap="round"
                stroke="var(--gold)"
                strokeDasharray={circumference}
                strokeDashoffset={circumference * (1 - pct)}
                style={{ transition: "stroke-dashoffset 0.9s linear" }}
              />
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <span
                className={cn(
                  "font-mono text-2xl font-bold tabular-nums",
                  running && "animate-soft-pulse",
                )}
              >
                {clock(remaining)}
              </span>
              <span className="text-[10px] text-navy-muted">
                {target === null ? "decorrido" : "restante"}
              </span>
            </div>
          </div>

          <div className="flex-1 space-y-2">
            <div className="flex gap-2">
              <button
                onClick={() => setRunning((v) => !v)}
                className="flex flex-1 items-center justify-center gap-1.5 rounded-lg bg-navy-foreground py-2 text-xs font-bold text-navy transition-transform hover:scale-[1.03]"
              >
                {running ? <Pause className="h-3.5 w-3.5" /> : <Play className="h-3.5 w-3.5" />}
                {running ? "pausar" : elapsed > 0 ? "continuar" : "iniciar"}
              </button>
              <button
                onClick={() => {
                  setElapsed(0);
                  setRunning(false);
                  setDone(false);
                  beeped.current = false;
                  accumulatedRef.current = 0;
                  startTimeRef.current = null;
                }}
                className="rounded-lg border border-navy-foreground/25 px-2.5 py-2 text-navy-muted transition-colors hover:bg-navy-foreground/10"
                aria-label="reiniciar"
              >
                <RotateCcw className="h-3.5 w-3.5" />
              </button>
            </div>
            <p className="text-[11px] text-navy-muted">
              {done
                ? "ciclo concluído! registre sua sessão abaixo."
                : `${elapsed === 0 ? 0 : minutesStudied} min de estudo neste ciclo`}
            </p>
          </div>
        </div>
      </div>

      <div className="space-y-2 p-3">
        <div className="no-scrollbar flex gap-1.5 overflow-x-auto">
          {MODES.map((m) => (
            <button
              key={m.id}
              onClick={() => setModeId(m.id)}
              className={cn(
                "flex-shrink-0 rounded-full border px-3 py-1 text-[11px] font-semibold transition-colors",
                modeId === m.id
                  ? "border-primary bg-primary text-primary-foreground"
                  : "border-border text-muted-foreground hover:border-primary/60",
              )}
            >
              {m.label}
            </button>
          ))}
        </div>

        <div className="flex gap-2">
          <select
            value={discipline}
            onChange={(event) => setDiscipline(event.target.value)}
            className="min-w-0 flex-1 rounded-lg border border-border bg-card px-2 py-1.5 text-xs"
          >
            {disciplines.map((d) => (
              <option key={d} value={d}>
                {d}
              </option>
            ))}
          </select>
          <button
            disabled={elapsed < 30 || saving || !discipline}
            onClick={() => {
              onSave({ discipline, minutes: minutesStudied });
              setElapsed(0);
              setRunning(false);
              setDone(false);
              beeped.current = false;
              accumulatedRef.current = 0;
              startTimeRef.current = null;
            }}
            className="flex items-center gap-1.5 rounded-lg bg-success px-3 py-1.5 text-xs font-bold text-success-foreground transition-opacity disabled:opacity-40"
          >
            <Save className="h-3.5 w-3.5" />
            registrar
          </button>
        </div>
      </div>
    </div>
  );
}

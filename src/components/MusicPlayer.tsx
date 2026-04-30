import { useState, useRef, useEffect, useContext } from "react";
import { TaskContext } from "@/providers/tasksProvider";
import { Task } from "@/types";
import { Music, Play, Pause, Volume2, X, Loader2 } from "lucide-react";

const BASE = "http://localhost:8000";

function computeSummary(tasks: Task[]) {
  const now = new Date();
  const in24h = new Date(now.getTime() + 24 * 60 * 60 * 1000);

  const overdue_tasks = tasks.filter((t) => t.status === "overdue").length;
  const due_soon = tasks.filter((t) => {
    if (t.status === "completed" || t.status === "overdue") return false;
    const due = new Date(t.due_date);
    return due >= now && due <= in24h;
  }).length;
  const high_priority = tasks.filter(
    (t) => t.priority === "high" && t.status !== "completed"
  ).length;

  return { total_tasks: tasks.length, overdue_tasks, due_soon, high_priority };
}

function computeStress(summary: ReturnType<typeof computeSummary>) {
  const score =
    summary.overdue_tasks * 3 +
    summary.due_soon * 2 +
    summary.high_priority * 1;
  if (score < 4) return "low";
  if (score < 8) return "medium";
  return "high";
}

const stressConfig: Record<string, { color: string; bg: string; border: string; label: string; genre: string }> = {
  low:    { color: "#7dc653", bg: "rgba(58,109,17,0.2)",  border: "rgba(125,198,83,0.25)", label: "low",    genre: "ambient sounds" },
  medium: { color: "#f0a94a", bg: "rgba(133,79,11,0.2)",  border: "rgba(239,159,39,0.25)", label: "medium", genre: "dream pop / trip-hop" },
  high:   { color: "#e57373", bg: "rgba(163,45,45,0.2)",  border: "rgba(240,149,149,0.25)",label: "high",   genre: "classical orchestra" },
};

const waveHeights = [14,22,34,26,18,30,38,28,14,28,34,22,18,32,38,26,14,28,34,20,30,36,24,16,30,38,22,14,26,34];

function fmt(s: number) {
  if (!s || isNaN(s)) return "--:--";
  return `${Math.floor(s / 60)}:${Math.floor(s % 60).toString().padStart(2, "0")}`;
}

export default function MusicPlayer() {
  const ctx = useContext(TaskContext);
  const tasks = ctx?.tasks ?? [];

  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [music, setMusic] = useState<string | null>(null);
  const [stress, setStress] = useState<string>("");
  const [error, setError] = useState("");
  const [playing, setPlaying] = useState(false);
  const [progress, setProgress] = useState(0);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(0.8);

  const audioRef = useRef<HTMLAudioElement>(null);

  useEffect(() => {
    const a = audioRef.current;
    if (!a) return;
    a.volume = volume;
    const onTime = () => {
      setCurrentTime(a.currentTime);
      setProgress(a.duration ? (a.currentTime / a.duration) * 100 : 0);
    };
    const onDur = () => setDuration(a.duration);
    const onEnd = () => { setPlaying(false); setProgress(100); };
    a.addEventListener("timeupdate", onTime);
    a.addEventListener("loadedmetadata", onDur);
    a.addEventListener("ended", onEnd);
    return () => {
      a.removeEventListener("timeupdate", onTime);
      a.removeEventListener("loadedmetadata", onDur);
      a.removeEventListener("ended", onEnd);
    };
  }, [music]);

  const togglePlay = () => {
    const a = audioRef.current;
    if (!a) return;
    if (a.paused) {
      a.play().then(() => setPlaying(true)).catch(() => {});
    } else {
      a.pause();
      setPlaying(false);
    }
  };

  const seek = (e: React.MouseEvent<HTMLDivElement>) => {
    const a = audioRef.current;
    if (!a || !a.duration) return;
    const rect = e.currentTarget.getBoundingClientRect();
    a.currentTime = ((e.clientX - rect.left) / rect.width) * a.duration;
  };

  const handleGenerate = async () => {
    setLoading(true);
    setError("");
    setMusic(null);
    setPlaying(false);
    setProgress(0);

    const summary = computeSummary(tasks);
    const detectedStress = computeStress(summary);
    setStress(detectedStress);

    try {
      const res = await fetch(`${BASE}/generate-music`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(summary),
      });
      const data = await res.json();

      if (data.error) {
        setError(typeof data.error === "object" ? JSON.stringify(data.error) : data.error);
        setLoading(false);
        return;
      }

      if (data.music_url) {
        setMusic(data.music_url);
        setTimeout(() => {
          const a = audioRef.current;
          if (a) {
            a.load();
            a.play().then(() => setPlaying(true)).catch(() => {});
          }
        }, 300);
      } else {
        setError("No music URL returned");
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      setError("Backend error: " + msg);
    }

    setLoading(false);
  };

  const summary = computeSummary(tasks);
  const previewStress = computeStress(summary);
  const cfg = stressConfig[stress] ?? stressConfig[previewStress];

  return (
    <>
      {/* ── Bottom Bar ── */}
      <div
        style={{
          position: "fixed",
          bottom: 0,
          left: 0,
          right: 0,
          height: open ? "auto" : 52,
          background: "#111111",
          borderTop: "1px solid rgba(255,255,255,0.07)",
          zIndex: 50,
          fontFamily: "monospace",
          transition: "height 0.25s ease",
          overflow: "hidden",
        }}
      >
        {/* ── Collapsed bar ── */}
        <div
          style={{
            height: 52,
            display: "flex",
            alignItems: "center",
            paddingLeft: 16,
            paddingRight: 16,
            gap: 12,
          }}
        >
          {/* Left: icon + label */}
          <div style={{ display: "flex", alignItems: "center", gap: 8, minWidth: 160 }}>
            <Music size={14} color={music ? cfg.color : "rgba(255,255,255,0.35)"} />
            <span style={{ fontSize: 12, color: music ? cfg.color : "rgba(255,255,255,0.4)" }}>
              {loading ? "generating..." : music ? `focus music · ${cfg.label} stress` : "Pravah"}
            </span>
            {stress && !loading && (
              <span style={{ fontSize: 10, color: "rgba(255,255,255,0.3)", marginLeft: 2 }}>
                · {cfg.genre}
              </span>
            )}
          </div>

          {/* Center: mini progress (only when music loaded) */}
          {music && (
            <div style={{ flex: 1, display: "flex", alignItems: "center", gap: 10 }}>
              <button
                onClick={togglePlay}
                style={{ background: "none", border: "none", cursor: "pointer", color: "#fff", display: "flex", padding: 0 }}
              >
                {playing ? <Pause size={14} /> : <Play size={14} />}
              </button>

              <div
                onClick={seek}
                style={{ flex: 1, height: 2, background: "rgba(255,255,255,0.1)", borderRadius: 1, cursor: "pointer" }}
              >
                <div style={{ height: "100%", width: progress.toFixed(1) + "%", background: cfg.color, borderRadius: 1, transition: "width 0.5s linear" }} />
              </div>

              <span style={{ fontSize: 10, color: "rgba(255,255,255,0.3)", whiteSpace: "nowrap" }}>
                {fmt(currentTime)} / {fmt(duration)}
              </span>
            </div>
          )}

          {/* Right: actions */}
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginLeft: "auto" }}>
            {/* Task summary pills */}
            {summary.overdue_tasks > 0 && (
              <span style={{ fontSize: 10, padding: "2px 7px", borderRadius: 10, background: "rgba(163,45,45,0.2)", color: "#e57373", border: "0.5px solid rgba(240,149,149,0.2)" }}>
                {summary.overdue_tasks} overdue
              </span>
            )}
            {summary.due_soon > 0 && (
              <span style={{ fontSize: 10, padding: "2px 7px", borderRadius: 10, background: "rgba(133,79,11,0.2)", color: "#f0a94a", border: "0.5px solid rgba(239,159,39,0.2)" }}>
                {summary.due_soon} due soon
              </span>
            )}
            {summary.high_priority > 0 && (
              <span style={{ fontSize: 10, padding: "2px 7px", borderRadius: 10, background: "rgba(255,255,255,0.05)", color: "rgba(255,255,255,0.45)", border: "0.5px solid rgba(255,255,255,0.1)" }}>
                {summary.high_priority} priority
              </span>
            )}

            <button
              onClick={handleGenerate}
              disabled={loading}
              style={{
                padding: "5px 12px",
                borderRadius: 8,
                border: "0.5px solid rgba(255,255,255,0.15)",
                background: loading ? "rgba(255,255,255,0.05)" : "rgba(255,255,255,0.1)",
                color: loading ? "rgba(255,255,255,0.3)" : "#fff",
                fontSize: 11,
                cursor: loading ? "not-allowed" : "pointer",
                display: "flex",
                alignItems: "center",
                gap: 6,
              }}
            >
              {loading ? <Loader2 size={11} className="animate-spin" /> : <Music size={11} />}
              {loading ? "generating..." : music ? "regenerate" : "generate music"}
            </button>

            {music && (
              <button
                onClick={() => setOpen((o) => !o)}
                style={{ background: "none", border: "none", cursor: "pointer", color: "rgba(255,255,255,0.4)", display: "flex", padding: 4 }}
              >
                {open ? <X size={13} /> : <Volume2 size={13} />}
              </button>
            )}
          </div>
        </div>

        {/* ── Expanded panel ── */}
        {open && music && (
          <div style={{ padding: "0 16px 16px", borderTop: "0.5px solid rgba(255,255,255,0.06)" }}>
            {/* Waveform */}
            <div style={{ display: "flex", alignItems: "center", gap: 2, height: 44, marginBottom: 10, marginTop: 10, overflow: "hidden" }}>
              {waveHeights.map((h, i) => {
                const isActive = i / waveHeights.length < progress / 100;
                return (
                  <div
                    key={i}
                    style={{
                      flex: 1,
                      height: h + "px",
                      borderRadius: 2,
                      background: isActive ? cfg.color : "rgba(255,255,255,0.12)",
                      transition: "background 0.3s",
                    }}
                  />
                );
              })}
            </div>

            {/* Controls row */}
            <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
              <button
                onClick={togglePlay}
                style={{
                  width: 34, height: 34, borderRadius: "50%",
                  border: "0.5px solid rgba(255,255,255,0.15)",
                  background: "rgba(255,255,255,0.08)",
                  color: "#fff", cursor: "pointer",
                  display: "flex", alignItems: "center", justifyContent: "center",
                  flexShrink: 0,
                }}
              >
                {playing ? <Pause size={14} /> : <Play size={14} />}
              </button>

              <div style={{ flex: 1 }}>
                <div
                  onClick={seek}
                  style={{ width: "100%", height: 3, background: "rgba(255,255,255,0.1)", borderRadius: 2, cursor: "pointer", marginBottom: 5 }}
                >
                  <div style={{ height: "100%", width: progress.toFixed(1) + "%", background: cfg.color, borderRadius: 2, transition: "width 0.5s linear" }} />
                </div>
                <div style={{ display: "flex", justifyContent: "space-between", fontSize: 10, color: "rgba(255,255,255,0.3)" }}>
                  <span>{fmt(currentTime)}</span>
                  <span>{fmt(duration)}</span>
                </div>
              </div>

              <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                <Volume2 size={11} color="rgba(255,255,255,0.3)" />
                <input
                  type="range" min={0} max={1} step={0.05} value={volume}
                  onChange={e => {
                    const v = parseFloat(e.target.value);
                    setVolume(v);
                    if (audioRef.current) audioRef.current.volume = v;
                  }}
                  style={{ width: 70, accentColor: cfg.color }}
                />
              </div>
            </div>

            {error && (
              <div style={{ marginTop: 10, fontSize: 11, color: "#e57373", background: "rgba(163,45,45,0.1)", borderRadius: 6, padding: "6px 10px", wordBreak: "break-word" }}>
                ⚠ {error}
              </div>
            )}
          </div>
        )}
      </div>

      <audio ref={audioRef} src={music ?? ""} preload="none" />
    </>
  );
}
import { Check, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";

function formatDuration(totalSeconds: number) {
  const m = Math.floor(totalSeconds / 60);
  const s = totalSeconds % 60;
  return `${m}:${String(s).padStart(2, "0")}`;
}

export function VoiceRecorderBar({
  seconds,
  levels,
  onStop,
  onCancel,
}: {
  seconds: number;
  levels: number[];
  onStop: () => void;
  onCancel: () => void;
}) {
  return (
    <div className="flex items-center gap-3 rounded-lg border bg-muted/40 px-3 py-2">
      <span className="flex size-2 shrink-0 animate-pulse rounded-full bg-destructive" />
      <span className="w-10 shrink-0 text-xs tabular-nums text-muted-foreground">
        {formatDuration(seconds)}
      </span>
      <div className="flex h-8 flex-1 items-center gap-0.5 overflow-hidden">
        {levels.map((level, i) => (
          <span
            key={i}
            className="w-1 shrink-0 rounded-full bg-primary/70"
            style={{ height: `${level}px` }}
          />
        ))}
      </div>
      <Button
        type="button"
        variant="outline"
        size="icon"
        onClick={onCancel}
        aria-label="Cancel recording"
      >
        <Trash2 className="size-4" />
      </Button>
      <Button type="button" size="icon" onClick={onStop} aria-label="Send voice message">
        <Check className="size-4" />
      </Button>
    </div>
  );
}

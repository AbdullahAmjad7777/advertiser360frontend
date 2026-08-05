import { MapPinOff } from "lucide-react";
import { Button } from "@/components/ui/button";

export function LocationRestrictedScreen({
  message,
  onDismiss,
  onRetry,
  isRetrying,
}: {
  message: string;
  onDismiss: () => void;
  onRetry: () => void;
  isRetrying: boolean;
}) {
  return (
    <main className="flex min-h-svh flex-col items-center justify-center gap-5 bg-background p-6 text-center">
      <span className="flex size-14 items-center justify-center rounded-2xl bg-destructive/10 text-destructive">
        <MapPinOff className="size-7" />
      </span>
      <div className="flex flex-col gap-1.5">
        <h1 className="text-xl font-semibold tracking-tight">Access restricted</h1>
        <p className="max-w-sm text-sm text-muted-foreground">{message}</p>
      </div>
      <div className="flex gap-3">
        <Button onClick={onRetry} disabled={isRetrying} size="lg">
          {isRetrying ? "Checking location…" : "Retry location"}
        </Button>
        <Button variant="outline" onClick={onDismiss} disabled={isRetrying} size="lg">
          Back to login
        </Button>
      </div>
    </main>
  );
}

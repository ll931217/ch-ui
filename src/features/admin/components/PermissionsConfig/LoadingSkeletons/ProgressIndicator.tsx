import { Progress } from "@/components/ui/progress";

interface ProgressIndicatorProps {
  /** Current step (1-based) */
  current: number;
  /** Total steps */
  total: number;
  /** Optional message describing current operation */
  message?: string;
}

/**
 * Progress indicator for multi-statement SQL execution
 * Shows granular progress with current/total and optional message
 */
export function ProgressIndicator({ current, total, message }: ProgressIndicatorProps) {
  const percentage = total > 0 ? Math.round((current / total) * 100) : 0;

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between text-sm">
        <span className="text-muted-foreground">
          {current} of {total}
        </span>
        <span className="font-medium">{percentage}%</span>
      </div>

      <Progress
        value={percentage}
        className="h-2"
        aria-label={`Execution progress: ${percentage}%`}
        aria-valuenow={percentage}
        aria-valuemin={0}
        aria-valuemax={100}
      />

      {message && (
        <p className="text-sm text-muted-foreground mt-1">{message}</p>
      )}
    </div>
  );
}

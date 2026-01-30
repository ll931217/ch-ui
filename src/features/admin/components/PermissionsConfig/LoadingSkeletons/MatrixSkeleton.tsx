import { Skeleton } from "@/components/ui/skeleton";
import { Card } from "@/components/ui/card";

/**
 * Skeleton loader for permissions matrix
 * Mimics the structure of the actual permissions matrix
 */
export function MatrixSkeleton() {
  return (
    <Card className="p-6" data-testid="matrix-skeleton">
      <div className="space-y-4">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <Skeleton className="h-6 w-48" />
          <Skeleton className="h-10 w-32" />
        </div>

        {/* Matrix grid */}
        <div className="space-y-3">
          {Array.from({ length: 5 }, (_, rowIndex) => (
            <div key={rowIndex} className="flex items-center gap-4">
              {/* Row label */}
              <Skeleton className="h-4 w-32" />

              {/* Cells */}
              <div className="flex gap-2 flex-1">
                {Array.from({ length: 6 }, (_, colIndex) => (
                  <Skeleton key={colIndex} className="h-6 w-6 rounded" />
                ))}
              </div>
            </div>
          ))}
        </div>

        {/* Footer actions */}
        <div className="flex justify-end gap-2 mt-6 pt-4 border-t">
          <Skeleton className="h-10 w-24" />
          <Skeleton className="h-10 w-24" />
        </div>
      </div>
    </Card>
  );
}

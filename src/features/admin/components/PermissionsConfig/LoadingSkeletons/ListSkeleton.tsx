import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";

interface ListSkeletonProps {
  /** Number of skeleton rows to render */
  rows?: number;
  /** Number of columns */
  columns?: number;
}

/**
 * Skeleton loader for user/role/quota lists
 * Prevents layout shift during data fetching
 */
export function ListSkeleton({ rows = 3, columns = 4 }: ListSkeletonProps) {
  return (
    <Table>
      <TableHeader>
        <TableRow>
          {Array.from({ length: columns }, (_, i) => (
            <TableHead key={i}>
              <Skeleton className="h-4 w-24" />
            </TableHead>
          ))}
        </TableRow>
      </TableHeader>
      <TableBody>
        {Array.from({ length: rows }, (_, rowIndex) => (
          <TableRow key={rowIndex} data-testid="skeleton-row">
            {Array.from({ length: columns }, (_, colIndex) => (
              <TableCell key={colIndex}>
                <Skeleton
                  className="h-4"
                  style={{
                    width: colIndex === 0 ? "120px" : colIndex === 1 ? "80px" : "60px",
                  }}
                />
              </TableCell>
            ))}
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}

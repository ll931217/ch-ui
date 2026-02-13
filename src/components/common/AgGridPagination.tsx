import { useState, useEffect, useRef } from "react";
import { GridApi } from "ag-grid-community";
import {
  ChevronsLeft,
  ChevronLeft,
  ChevronRight,
  ChevronsRight,
  Clock,
  Database,
  FileText,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface Statistics {
  elapsed: number;
  rows_read: number;
  bytes_read: number;
}

interface AgGridPaginationProps {
  api: GridApi | null;
  pageSize: number;
  onPageSizeChange: (size: number) => void;
  statistics?: Statistics | null;
}

export function AgGridPagination({
  api,
  pageSize,
  onPageSizeChange,
  statistics,
}: AgGridPaginationProps) {
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalRows, setTotalRows] = useState(0);
  const [inputValue, setInputValue] = useState("1");
  const inputRef = useRef<HTMLInputElement>(null);
  const wheelDebounceRef = useRef<NodeJS.Timeout | null>(null);
  const pendingPageRef = useRef<number>(1);

  // Format bytes for display
  const formatBytes = (bytes: number): string => {
    if (bytes === 0) return "0 Bytes";

    const k = 1024;
    const sizes = ["Bytes", "KB", "MB", "GB", "TB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));

    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
  };

  // Format time for display
  const formatTime = (seconds: number): string => {
    if (seconds < 0.001) {
      return `${(seconds * 1000000).toFixed(2)} μs`;
    } else if (seconds < 1) {
      return `${(seconds * 1000).toFixed(2)} ms`;
    } else {
      return `${seconds.toFixed(2)} s`;
    }
  };

  useEffect(() => {
    if (!api) return;

    const updatePaginationInfo = () => {
      const page = api.paginationGetCurrentPage() + 1; // Convert from 0-indexed to 1-indexed
      const total = api.paginationGetTotalPages();
      const rows = api.paginationGetRowCount();
      setCurrentPage(page);
      setTotalPages(total);
      setTotalRows(rows);
      setInputValue(String(page));
      pendingPageRef.current = page; // Sync pending page with actual page
    };

    updatePaginationInfo();

    const listener = () => updatePaginationInfo();
    api.addEventListener("paginationChanged", listener);

    return () => {
      api.removeEventListener("paginationChanged", listener);
    };
  }, [api]);

  // Cleanup debounce timeout on unmount
  useEffect(() => {
    return () => {
      if (wheelDebounceRef.current) {
        clearTimeout(wheelDebounceRef.current);
      }
    };
  }, []);

  const goToPage = (page: number) => {
    if (!api) return;

    // Clamp to valid range (1 to totalPages)
    const validPage = Math.max(1, Math.min(page, totalPages));

    // Convert to 0-indexed for AgGrid API
    api.paginationGoToPage(validPage - 1);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;

    // Allow only numbers
    if (value === "" || /^\d+$/.test(value)) {
      setInputValue(value);
    }
  };

  const handleInputKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      const page = parseInt(inputValue, 10);
      if (!isNaN(page)) {
        goToPage(page);
      } else {
        // Reset to current page on invalid input
        setInputValue(String(currentPage));
      }
      inputRef.current?.blur();
    } else if (e.key === "Escape") {
      // Reset to current page
      setInputValue(String(currentPage));
      inputRef.current?.blur();
    }
  };

  const handleInputBlur = () => {
    const page = parseInt(inputValue, 10);
    if (!isNaN(page)) {
      goToPage(page);
    } else {
      // Reset to current page on invalid input
      setInputValue(String(currentPage));
    }
  };

  const handleWheel = (e: React.WheelEvent<HTMLInputElement>) => {
    e.preventDefault();

    // Clear existing timeout
    if (wheelDebounceRef.current) {
      clearTimeout(wheelDebounceRef.current);
    }

    // Calculate new target page
    let targetPage = pendingPageRef.current;
    if (e.deltaY < 0) {
      // Scroll up → next page
      targetPage = Math.min(targetPage + 1, totalPages);
    } else if (e.deltaY > 0) {
      // Scroll down → previous page
      targetPage = Math.max(targetPage - 1, 1);
    }

    // Update pending page and visual feedback
    pendingPageRef.current = targetPage;
    setInputValue(String(targetPage));

    // Debounce the actual page change (150ms delay)
    wheelDebounceRef.current = setTimeout(() => {
      goToPage(targetPage);
      wheelDebounceRef.current = null;
    }, 150);
  };

  const handlePageSizeChange = (value: string) => {
    if (!api) return;
    const newSize = parseInt(value, 10);
    onPageSizeChange(newSize);
  };

  // Calculate row range display (e.g., "1 - 100 of 8200")
  const getRowRangeDisplay = () => {
    if (totalRows === 0) return "0 - 0 of 0";

    const startRow = (currentPage - 1) * pageSize + 1;
    const endRow = Math.min(currentPage * pageSize, totalRows);

    return `${startRow} - ${endRow} of ${totalRows}`;
  };

  return (
    <div className="flex items-center justify-between border-t bg-background px-2 py-1">
      {/* Left side: Statistics */}
      <div className="flex items-center gap-3 sm:gap-4">
        {statistics ? (
          <>
            <div className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors">
              <Clock className="h-3.5 w-3.5 flex-shrink-0" />
              <span className="hidden sm:inline">
                {formatTime(statistics.elapsed)}
              </span>
              <span className="sm:hidden font-mono">
                {formatTime(statistics.elapsed)}
              </span>
            </div>
            <div className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors">
              <FileText className="h-3.5 w-3.5 flex-shrink-0" />
              <span className="hidden sm:inline">
                {statistics.rows_read.toLocaleString()} rows
              </span>
              <span className="sm:hidden font-mono">
                {statistics.rows_read.toLocaleString()}
              </span>
            </div>
            <div className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors">
              <Database className="h-3.5 w-3.5 flex-shrink-0" />
              <span className="font-mono">
                {formatBytes(statistics.bytes_read)}
              </span>
            </div>
          </>
        ) : (
          <div className="text-xs text-muted-foreground">
            No statistics available
          </div>
        )}
      </div>

      {/* Right side: Pagination Controls (only when multiple pages) */}
      {totalPages > 1 && (
        <div className="flex items-center gap-1">
          {/* Page Size Selector */}
          <div className="flex items-center gap-1">
            <span className="text-xs whitespace-nowrap">Page Size:</span>
            <Select
              value={String(pageSize)}
              onValueChange={handlePageSizeChange}
            >
              <SelectTrigger className="h-6 w-16 text-xs">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="10">10</SelectItem>
                <SelectItem value="25">25</SelectItem>
                <SelectItem value="50">50</SelectItem>
                <SelectItem value="100">100</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Row Range Display */}
          <span className="text-xs text-muted-foreground mx-2 whitespace-nowrap">
            {getRowRangeDisplay()}
          </span>

          {/* Navigation Buttons */}
          <Button
            variant="outline"
            size="sm"
            onClick={() => goToPage(1)}
            disabled={currentPage === 1}
            title="First page"
            className="h-6 w-6 p-0"
          >
            <ChevronsLeft className="h-3 w-3" />
          </Button>

          <Button
            variant="outline"
            size="sm"
            onClick={() => goToPage(currentPage - 1)}
            disabled={currentPage === 1}
            title="Previous page"
            className="h-6 w-6 p-0"
          >
            <ChevronLeft className="h-3 w-3" />
          </Button>

          {/* Page Input */}
          <div className="flex items-center gap-1">
            <span className="text-xs">Page</span>
            <Input
              ref={inputRef}
              type="text"
              value={inputValue}
              onChange={handleInputChange}
              onKeyDown={handleInputKeyDown}
              onBlur={handleInputBlur}
              onWheel={handleWheel}
              className="h-6 w-12 text-center text-xs"
              aria-label="Current page"
            />
            <span className="text-xs">of {totalPages}</span>
          </div>

          <Button
            variant="outline"
            size="sm"
            onClick={() => goToPage(currentPage + 1)}
            disabled={currentPage === totalPages}
            title="Next page"
            className="h-6 w-6 p-0"
          >
            <ChevronRight className="h-3 w-3" />
          </Button>

          <Button
            variant="outline"
            size="sm"
            onClick={() => goToPage(totalPages)}
            disabled={currentPage === totalPages}
            title="Last page"
            className="h-6 w-6 p-0"
          >
            <ChevronsRight className="h-3 w-3" />
          </Button>
        </div>
      )}
    </div>
  );
}

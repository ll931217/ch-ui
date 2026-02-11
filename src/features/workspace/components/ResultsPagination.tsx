import { useState, useEffect, useRef } from "react";
import { GridApi } from "ag-grid-community";
import { ChevronLeft, ChevronRight, Clock, Database, FileText } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

interface Statistics {
  elapsed: number;
  rows_read: number;
  bytes_read: number;
}

interface ResultsPaginationProps {
  statistics: Statistics | null;
  gridRef: React.RefObject<{ api: GridApi }>;
}

export function ResultsPagination({ statistics, gridRef }: ResultsPaginationProps) {
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [inputValue, setInputValue] = useState("1");
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const api = gridRef.current?.api;
    if (!api) return;

    const updatePaginationInfo = () => {
      const page = api.paginationGetCurrentPage() + 1;
      const total = api.paginationGetTotalPages();
      setCurrentPage(page);
      setTotalPages(total);
      setInputValue(String(page));
    };

    updatePaginationInfo();

    const listener = () => updatePaginationInfo();
    api.addEventListener("paginationChanged", listener);

    return () => {
      api.removeEventListener("paginationChanged", listener);
    };
  }, [gridRef]);

  const goToPage = (page: number) => {
    const api = gridRef.current?.api;
    if (!api) return;

    const validPage = Math.max(1, Math.min(page, totalPages));
    api.paginationGoToPage(validPage - 1);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
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
        setInputValue(String(currentPage));
      }
      inputRef.current?.blur();
    } else if (e.key === "Escape") {
      setInputValue(String(currentPage));
      inputRef.current?.blur();
    }
  };

  const handleInputBlur = () => {
    const page = parseInt(inputValue, 10);
    if (!isNaN(page)) {
      goToPage(page);
    } else {
      setInputValue(String(currentPage));
    }
  };

  const formatBytes = (bytes: number): string => {
    if (bytes === 0) return "0 Bytes";

    const k = 1024;
    const sizes = ["Bytes", "KB", "MB", "GB", "TB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));

    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
  };

  const formatTime = (seconds: number): string => {
    if (seconds < 0.001) {
      return `${(seconds * 1000000).toFixed(2)} μs`;
    } else if (seconds < 1) {
      return `${(seconds * 1000).toFixed(2)} ms`;
    } else {
      return `${seconds.toFixed(2)} s`;
    }
  };

  return (
    <div className="flex items-center justify-between border-t bg-background px-4 py-1.5">
      {/* Left side: Statistics */}
      <div className="flex items-center gap-3 sm:gap-4">
        {statistics ? (
          <>
            <div className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors">
              <Clock className="h-3.5 w-3.5 flex-shrink-0" />
              <span className="hidden sm:inline">{formatTime(statistics.elapsed)}</span>
              <span className="sm:hidden font-mono">{formatTime(statistics.elapsed)}</span>
            </div>
            <div className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors">
              <FileText className="h-3.5 w-3.5 flex-shrink-0" />
              <span className="hidden sm:inline">{statistics.rows_read.toLocaleString()} rows</span>
              <span className="sm:hidden font-mono">{statistics.rows_read.toLocaleString()}</span>
            </div>
            <div className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors">
              <Database className="h-3.5 w-3.5 flex-shrink-0" />
              <span className="font-mono">{formatBytes(statistics.bytes_read)}</span>
            </div>
          </>
        ) : (
          <div className="text-xs text-muted-foreground">No statistics available</div>
        )}
      </div>

      {/* Right side: Pagination Controls */}
      {totalPages > 1 && (
        <div className="flex items-center gap-1">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => goToPage(currentPage - 1)}
            disabled={currentPage === 1}
            title="Previous page (Alt+Left)"
            className="h-6 w-6 p-0 hover:bg-accent"
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>

          <div className="flex items-center gap-1 text-xs text-muted-foreground">
            <span className="hidden sm:inline">Page</span>
            <Input
              ref={inputRef}
              type="text"
              value={inputValue}
              onChange={handleInputChange}
              onKeyDown={handleInputKeyDown}
              onBlur={handleInputBlur}
              className="h-6 w-10 sm:w-12 text-center text-xs font-mono border-input focus-visible:ring-1"
              aria-label="Current page"
            />
            <span>of {totalPages}</span>
          </div>

          <Button
            variant="ghost"
            size="sm"
            onClick={() => goToPage(currentPage + 1)}
            disabled={currentPage === totalPages}
            title="Next page (Alt+Right)"
            className="h-6 w-6 p-0 hover:bg-accent"
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      )}
    </div>
  );
}

import { useEffect, useRef, useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuCheckboxItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  DropdownMenuLabel,
} from "@/components/ui/dropdown-menu";
import { Search, Settings, X } from "lucide-react";
import { type SearchOptions } from "./hooks/useSearchFilter";

interface EnhancedSearchProps {
  value: string;
  onChange: (value: string) => void;
  options: SearchOptions;
  onOptionsChange: (options: SearchOptions) => void;
  placeholder?: string;
  disabled?: boolean;
  showQuickFilters?: boolean;
  authTypes?: string[];
  layer: string;
}

export default function EnhancedSearch({
  value,
  onChange,
  options,
  onOptionsChange,
  placeholder = "Search...",
  disabled = false,
  showQuickFilters = false,
  authTypes = [],
  layer,
}: EnhancedSearchProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [showClearButton, setShowClearButton] = useState(false);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Ctrl+F or Cmd+F to focus search
      if ((e.ctrlKey || e.metaKey) && e.key === "f") {
        e.preventDefault();
        inputRef.current?.focus();
      }

      // Escape to clear search (when input is focused)
      if (e.key === "Escape" && document.activeElement === inputRef.current) {
        e.preventDefault();
        onChange("");
        inputRef.current?.blur();
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [onChange]);

  // Show/hide clear button based on input value
  useEffect(() => {
    setShowClearButton(value.length > 0);
  }, [value]);

  const handleClear = () => {
    onChange("");
    inputRef.current?.focus();
  };

  const toggleOption = <K extends keyof SearchOptions>(key: K) => {
    onOptionsChange({
      ...options,
      [key]: !options[key],
    });
  };

  const setQuickFilter = (filter: SearchOptions["quickFilter"]) => {
    onOptionsChange({
      ...options,
      quickFilter: filter,
    });
  };

  const setAuthType = (authType: string | undefined) => {
    onOptionsChange({
      ...options,
      authType,
    });
  };

  const activeFilters: string[] = [];
  if (options.fuzzy) activeFilters.push("Fuzzy");
  if (options.regex) activeFilters.push("Regex");
  if (options.quickFilter && options.quickFilter !== "all") {
    activeFilters.push(
      options.quickFilter === "has_grants" ? "Has Grants" : "No Grants"
    );
  }
  if (options.authType) activeFilters.push(`Auth: ${options.authType}`);

  return (
    <div className="space-y-2">
      <div className="relative flex items-center gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            ref={inputRef}
            placeholder={placeholder}
            value={value}
            onChange={(e) => onChange(e.target.value)}
            className="pl-10 pr-10"
            disabled={disabled}
            aria-label="Search input"
            data-testid="enhanced-search-input"
          />
          {showClearButton && (
            <Button
              variant="ghost"
              size="sm"
              className="absolute right-1 top-1/2 transform -translate-y-1/2 h-7 w-7 p-0"
              onClick={handleClear}
              aria-label="Clear search"
            >
              <X className="w-3 h-3" />
            </Button>
          )}
        </div>

        {/* Search options dropdown */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="outline"
              size="sm"
              className="gap-2"
              disabled={disabled}
              aria-label="Search options"
            >
              <Settings className="w-4 h-4" />
              {activeFilters.length > 0 && (
                <Badge variant="secondary" className="ml-1">
                  {activeFilters.length}
                </Badge>
              )}
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56">
            <DropdownMenuLabel>Search Options</DropdownMenuLabel>
            <DropdownMenuSeparator />

            <DropdownMenuCheckboxItem
              checked={options.fuzzy || false}
              onCheckedChange={() => toggleOption("fuzzy")}
            >
              Fuzzy Search
              <span className="ml-auto text-xs text-muted-foreground">
                Typo-tolerant
              </span>
            </DropdownMenuCheckboxItem>

            <DropdownMenuCheckboxItem
              checked={options.regex || false}
              onCheckedChange={() => toggleOption("regex")}
            >
              Regex Search
              <span className="ml-auto text-xs text-muted-foreground">
                Pattern matching
              </span>
            </DropdownMenuCheckboxItem>

            <DropdownMenuCheckboxItem
              checked={options.caseSensitive || false}
              onCheckedChange={() => toggleOption("caseSensitive")}
            >
              Case Sensitive
            </DropdownMenuCheckboxItem>

            {showQuickFilters && (
              <>
                <DropdownMenuSeparator />
                <DropdownMenuLabel>Quick Filters</DropdownMenuLabel>

                <DropdownMenuCheckboxItem
                  checked={options.quickFilter === "has_grants"}
                  onCheckedChange={() =>
                    setQuickFilter(
                      options.quickFilter === "has_grants" ? undefined : "has_grants"
                    )
                  }
                >
                  Has Grants
                </DropdownMenuCheckboxItem>

                <DropdownMenuCheckboxItem
                  checked={options.quickFilter === "no_grants"}
                  onCheckedChange={() =>
                    setQuickFilter(
                      options.quickFilter === "no_grants" ? undefined : "no_grants"
                    )
                  }
                >
                  No Grants
                </DropdownMenuCheckboxItem>
              </>
            )}

            {authTypes.length > 0 && (
              <>
                <DropdownMenuSeparator />
                <DropdownMenuLabel>Authentication Type</DropdownMenuLabel>

                <DropdownMenuCheckboxItem
                  checked={!options.authType}
                  onCheckedChange={() => setAuthType(undefined)}
                >
                  All
                </DropdownMenuCheckboxItem>

                {authTypes.map((type) => (
                  <DropdownMenuCheckboxItem
                    key={type}
                    checked={options.authType === type}
                    onCheckedChange={() =>
                      setAuthType(options.authType === type ? undefined : type)
                    }
                  >
                    {type}
                  </DropdownMenuCheckboxItem>
                ))}
              </>
            )}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {/* Active filters display */}
      {activeFilters.length > 0 && (
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-xs text-muted-foreground">Active filters:</span>
          {activeFilters.map((filter) => (
            <Badge key={filter} variant="secondary" className="text-xs">
              {filter}
            </Badge>
          ))}
        </div>
      )}

      {/* Keyboard shortcut hint */}
      <div className="text-xs text-muted-foreground">
        Press{" "}
        <kbd className="px-1 py-0.5 bg-muted border rounded text-xs">Ctrl</kbd> +{" "}
        <kbd className="px-1 py-0.5 bg-muted border rounded text-xs">F</kbd> to focus
        search
      </div>
    </div>
  );
}

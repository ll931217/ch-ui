import { useState, useCallback, useEffect, useMemo } from "react";

export type QuickFilter = "has_grants" | "no_grants" | "all";

export interface SearchOptions {
  fuzzy?: boolean;
  regex?: boolean;
  quickFilter?: QuickFilter;
  authType?: string;
  searchFields?: string[];
  caseSensitive?: boolean;
}

interface FuzzyMatch {
  score: number;
  item: any;
}

/**
 * Advanced search and filter hook with fuzzy matching, regex support, and preferences
 */
export function useSearchFilter() {
  const [searchTerm, setSearchTermState] = useState("");
  const [options, setOptionsState] = useState<SearchOptions>({
    fuzzy: false,
    regex: false,
    caseSensitive: false,
  });

  /**
   * Calculate fuzzy match score using simple character matching
   * Lower score = better match
   */
  const calculateFuzzyScore = useCallback((search: string, target: string): number => {
    const searchLower = search.toLowerCase();
    const targetLower = target.toLowerCase();

    // Exact match gets best score
    if (targetLower === searchLower) return 0;

    // Starts with search term gets high priority
    if (targetLower.startsWith(searchLower)) return 1;

    // Contains search term
    if (targetLower.includes(searchLower)) {
      return 2 + (targetLower.indexOf(searchLower) / targetLower.length);
    }

    // Fuzzy matching: check if all characters exist in order
    let targetIndex = 0;
    let matchCount = 0;
    let gaps = 0;

    for (let i = 0; i < searchLower.length; i++) {
      const char = searchLower[i];
      const foundIndex = targetLower.indexOf(char, targetIndex);

      if (foundIndex === -1) {
        // Character not found, this is a mismatch
        return Infinity;
      }

      matchCount++;
      gaps += foundIndex - targetIndex;
      targetIndex = foundIndex + 1;
    }

    // Score based on match percentage and gaps
    const matchPercentage = matchCount / searchLower.length;
    const gapPenalty = gaps / targetLower.length;

    return 10 + gapPenalty + (1 - matchPercentage) * 5;
  }, []);

  /**
   * Filter items based on search term and options
   */
  const filterItems = useCallback(
    <T extends Record<string, any>>(
      items: T[],
      search: string,
      filterOptions: SearchOptions = {}
    ): T[] => {
      const mergedOptions = { ...options, ...filterOptions };
      let filtered = items;

      // Apply quick filters first
      if (mergedOptions.quickFilter === "has_grants") {
        filtered = filtered.filter((item) => item.grants && item.grants.length > 0);
      } else if (mergedOptions.quickFilter === "no_grants") {
        filtered = filtered.filter((item) => !item.grants || item.grants.length === 0);
      }

      // Apply auth type filter
      if (mergedOptions.authType) {
        filtered = filtered.filter((item) => item.auth_type === mergedOptions.authType);
      }

      // Apply search term
      if (!search) return filtered;

      const searchFields = mergedOptions.searchFields || ["name"];

      // Regex search
      if (mergedOptions.regex) {
        try {
          const flags = mergedOptions.caseSensitive ? "" : "i";
          const regex = new RegExp(search, flags);

          return filtered.filter((item) =>
            searchFields.some((field) => {
              const value = item[field];
              return value && regex.test(String(value));
            })
          );
        } catch (error) {
          // Invalid regex, fall back to literal search
          console.warn("Invalid regex pattern, falling back to literal search:", error);
        }
      }

      // Fuzzy search
      if (mergedOptions.fuzzy) {
        const matches: FuzzyMatch[] = filtered
          .map((item) => {
            const scores = searchFields.map((field) => {
              const value = item[field];
              if (!value) return Infinity;
              return calculateFuzzyScore(search, String(value));
            });

            // Use best score across all fields
            const bestScore = Math.min(...scores);
            return { score: bestScore, item };
          })
          .filter((match) => match.score < Infinity);

        // Sort by score (lower = better)
        matches.sort((a, b) => a.score - b.score);

        return matches.map((m) => m.item);
      }

      // Standard substring search
      const searchLower = mergedOptions.caseSensitive ? search : search.toLowerCase();

      return filtered.filter((item) =>
        searchFields.some((field) => {
          const value = item[field];
          if (!value) return false;
          const valueStr = mergedOptions.caseSensitive ? String(value) : String(value).toLowerCase();
          return valueStr.includes(searchLower);
        })
      );
    },
    [options, calculateFuzzyScore]
  );

  /**
   * Save search term with optional layer context
   */
  const setSearchTerm = useCallback((term: string, layer?: string) => {
    setSearchTermState(term);

    if (layer) {
      try {
        localStorage.setItem(`search-pref-${layer}`, term);
      } catch (error) {
        console.warn("Failed to save search preference:", error);
      }
    }
  }, []);

  /**
   * Save search options with optional layer context
   */
  const setOptions = useCallback((newOptions: SearchOptions, layer?: string) => {
    setOptionsState(newOptions);

    if (layer) {
      try {
        localStorage.setItem(`search-options-${layer}`, JSON.stringify(newOptions));
      } catch (error) {
        console.warn("Failed to save search options:", error);
      }
    }
  }, []);

  /**
   * Load saved preferences for a specific layer
   */
  const loadPreferences = useCallback((layer: string) => {
    try {
      const savedTerm = localStorage.getItem(`search-pref-${layer}`);
      if (savedTerm) {
        setSearchTermState(savedTerm);
      }

      const savedOptions = localStorage.getItem(`search-options-${layer}`);
      if (savedOptions) {
        setOptionsState(JSON.parse(savedOptions));
      }
    } catch (error) {
      console.warn("Failed to load search preferences:", error);
    }
  }, []);

  /**
   * Clear all preferences for a specific layer
   */
  const clearPreferences = useCallback((layer: string) => {
    try {
      localStorage.removeItem(`search-pref-${layer}`);
      localStorage.removeItem(`search-options-${layer}`);
      setSearchTermState("");
      setOptionsState({ fuzzy: false, regex: false, caseSensitive: false });
    } catch (error) {
      console.warn("Failed to clear preferences:", error);
    }
  }, []);

  /**
   * Debounced search value for performance
   */
  const useDebouncedSearch = (value: string, delay: number = 300): string => {
    const [debouncedValue, setDebouncedValue] = useState(value);

    useEffect(() => {
      const handler = setTimeout(() => {
        setDebouncedValue(value);
      }, delay);

      return () => {
        clearTimeout(handler);
      };
    }, [value, delay]);

    return debouncedValue;
  };

  return {
    searchTerm,
    setSearchTerm,
    options,
    setOptions,
    filterItems,
    loadPreferences,
    clearPreferences,
    useDebouncedSearch,
  };
}

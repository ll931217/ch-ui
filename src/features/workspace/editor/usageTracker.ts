/**
 * SQL Autocomplete Usage Tracker
 *
 * Tracks usage frequency of autocomplete suggestions to provide
 * intelligent sorting based on user behavior.
 */

import type * as monaco from 'monaco-editor';

export type SuggestionCategory = 'database' | 'table' | 'column' | 'function' | 'keyword' | 'operator';

interface UsageEntry {
  count: number;
  lastUsed: number;
  category: SuggestionCategory;
}

interface UsageData {
  version: number;
  lastUpdated: number;
  items: Record<string, UsageEntry>;
}

interface PendingSuggestion {
  label: string;
  key: string;
  category: SuggestionCategory;
  range: monaco.IRange;
  timestamp: number;
}

const STORAGE_VERSION = 1;
const MATCH_WINDOW_MS = 1000;

/**
 * Tracks autocomplete suggestion usage per connection
 */
export class AutocompleteUsageTracker {
  private connectionId: string;
  private usageData: UsageData;
  private pendingSuggestions: PendingSuggestion[] = [];

  constructor(connectionId: string) {
    this.connectionId = connectionId;
    this.usageData = this.loadUsageData();
  }

  /**
   * Switch to a different connection context
   */
  setConnection(connectionId: string): void {
    if (this.connectionId !== connectionId) {
      this.connectionId = connectionId;
      this.usageData = this.loadUsageData();
      this.pendingSuggestions = [];
    }
  }

  /**
   * Load usage data from localStorage for current connection
   */
  private loadUsageData(): UsageData {
    try {
      const key = this.getStorageKey();
      const stored = localStorage.getItem(key);

      if (stored) {
        const data = JSON.parse(stored) as UsageData;

        // Validate version
        if (data.version === STORAGE_VERSION) {
          return data;
        }
      }
    } catch (error) {
      console.warn('Failed to load autocomplete usage data:', error);
    }

    // Return fresh data if loading fails or version mismatch
    return {
      version: STORAGE_VERSION,
      lastUpdated: Date.now(),
      items: {},
    };
  }

  /**
   * Save usage data to localStorage
   */
  private saveUsageData(): void {
    try {
      const key = this.getStorageKey();
      this.usageData.lastUpdated = Date.now();
      localStorage.setItem(key, JSON.stringify(this.usageData));
    } catch (error) {
      console.warn('Failed to save autocomplete usage data:', error);
    }
  }

  /**
   * Get localStorage key for current connection
   */
  private getStorageKey(): string {
    return `sql-autocomplete-usage:${this.connectionId}`;
  }

  /**
   * Record suggestions that were just shown to the user
   */
  recordPendingSuggestions(
    suggestions: Array<{ label: string; category: SuggestionCategory }>,
    wordRange: monaco.IRange
  ): void {
    const timestamp = Date.now();

    // Clear old pending suggestions (older than match window)
    this.pendingSuggestions = this.pendingSuggestions.filter(
      (s) => timestamp - s.timestamp < MATCH_WINDOW_MS
    );

    // Add new pending suggestions
    for (const suggestion of suggestions) {
      const key = this.getSuggestionKey(suggestion.label, suggestion.category);
      this.pendingSuggestions.push({
        label: suggestion.label,
        key,
        category: suggestion.category,
        range: wordRange,
        timestamp,
      });
    }
  }

  /**
   * Check if a content change matches an accepted suggestion
   */
  checkForAcceptedSuggestion(
    changeEvent: monaco.editor.IModelContentChangedEvent,
    model: monaco.editor.ITextModel | null
  ): void {
    if (!model || changeEvent.changes.length === 0) {
      return;
    }

    const now = Date.now();
    const change = changeEvent.changes[0]; // Focus on first change

    // Look for matching pending suggestion
    for (const pending of this.pendingSuggestions) {
      // Check if change is within match window
      if (now - pending.timestamp > MATCH_WINDOW_MS) {
        continue;
      }

      // Check if change position matches expected range
      const rangeMatches =
        change.range.startLineNumber === pending.range.startLineNumber &&
        change.range.startColumn >= pending.range.startColumn &&
        change.range.endColumn <= pending.range.endColumn + pending.label.length;

      // Check if inserted text matches suggestion label
      const textMatches = change.text.includes(pending.label);

      if (rangeMatches && textMatches) {
        this.recordUsage(pending.key, pending.category);

        // Remove matched suggestion to avoid double-counting
        this.pendingSuggestions = this.pendingSuggestions.filter(
          (s) => s.key !== pending.key
        );

        break;
      }
    }
  }

  /**
   * Record usage of a suggestion
   */
  recordUsage(key: string, category: SuggestionCategory): void {
    const existing = this.usageData.items[key];

    if (existing) {
      existing.count++;
      existing.lastUsed = Date.now();
    } else {
      this.usageData.items[key] = {
        count: 1,
        lastUsed: Date.now(),
        category,
      };
    }

    this.saveUsageData();
  }

  /**
   * Get usage count for a suggestion
   */
  getUsageCount(key: string): number {
    return this.usageData.items[key]?.count ?? 0;
  }

  /**
   * Generate sortText for a suggestion based on usage
   */
  getSortText(label: string, category: SuggestionCategory): string {
    const key = this.getSuggestionKey(label, category);
    const usageCount = this.getUsageCount(key);

    // Base priority by category (lower = higher priority)
    const basePriority: Record<SuggestionCategory, number> = {
      column: 10,
      table: 20,
      database: 25,
      function: 30,
      keyword: 40,
      operator: 50,
    };

    // Usage boost: max 9 levels based on log2(count)
    // More usage = lower priority number = appears first
    const usageBoost = Math.min(9, Math.floor(Math.log2(usageCount + 1)));
    const priority = Math.max(1, basePriority[category] - usageBoost);

    // Format: "{priority}-{label}" (e.g., "10-user_id", "05-count")
    return `${priority.toString().padStart(2, '0')}-${label.toLowerCase()}`;
  }

  /**
   * Generate unique key for a suggestion
   */
  private getSuggestionKey(label: string, category: SuggestionCategory): string {
    return `${category}:${label}`;
  }

  /**
   * Clear all usage data for current connection (for debugging/testing)
   */
  clearUsageData(): void {
    this.usageData = {
      version: STORAGE_VERSION,
      lastUpdated: Date.now(),
      items: {},
    };
    this.saveUsageData();
  }

  /**
   * Get statistics about current usage data (for debugging)
   */
  getStats(): { totalItems: number; totalUsage: number; byCategory: Record<string, number> } {
    const items = Object.values(this.usageData.items);
    const totalUsage = items.reduce((sum, item) => sum + item.count, 0);
    const byCategory: Record<string, number> = {};

    for (const item of items) {
      byCategory[item.category] = (byCategory[item.category] || 0) + 1;
    }

    return {
      totalItems: items.length,
      totalUsage,
      byCategory,
    };
  }
}

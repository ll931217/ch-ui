/**
 * Query Parser Utility
 *
 * Parses SQL content into individual queries separated by semicolons,
 * handling edge cases like strings and comments.
 */

export interface ParsedQuery {
  text: string;
  startLine: number;
  startColumn: number;
  endLine: number;
  endColumn: number;
}

/**
 * Parse SQL content into individual queries separated by semicolons.
 * Handles:
 * - Semicolons inside single-quoted strings ('hello; world')
 * - Semicolons inside double-quoted identifiers ("col;name")
 * - Semicolons in single-line comments (-- comment; here)
 * - Semicolons in multi-line comments (/* comment; here *\/)
 * - Empty statements (consecutive semicolons)
 * - Trailing whitespace/newlines
 */
export function parseQueries(content: string): ParsedQuery[] {
  const queries: ParsedQuery[] = [];

  if (!content.trim()) {
    return queries;
  }

  const lines = content.split('\n');
  let currentQuery = '';
  let queryStartLine = 1;
  let queryStartColumn = 1;

  let inSingleQuote = false;
  let inDoubleQuote = false;
  let inSingleLineComment = false;
  let inMultiLineComment = false;

  let currentLine = 1;
  let currentColumn = 1;

  for (let i = 0; i < content.length; i++) {
    const char = content[i];
    const nextChar = content[i + 1];
    const prevChar = content[i - 1];

    // Track line and column
    if (char === '\n') {
      currentLine++;
      currentColumn = 1;
      inSingleLineComment = false;
      currentQuery += char;
      continue;
    }

    // Handle comment detection
    if (!inSingleQuote && !inDoubleQuote && !inMultiLineComment) {
      // Single-line comment start
      if (char === '-' && nextChar === '-') {
        inSingleLineComment = true;
        currentQuery += char;
        currentColumn++;
        continue;
      }
      // Multi-line comment start
      if (char === '/' && nextChar === '*') {
        inMultiLineComment = true;
        currentQuery += char;
        currentColumn++;
        continue;
      }
    }

    // Handle multi-line comment end
    if (inMultiLineComment && char === '*' && nextChar === '/') {
      currentQuery += char;
      currentColumn++;
      continue;
    }
    if (inMultiLineComment && prevChar === '*' && char === '/') {
      inMultiLineComment = false;
      currentQuery += char;
      currentColumn++;
      continue;
    }

    // Skip processing if in comment
    if (inSingleLineComment || inMultiLineComment) {
      currentQuery += char;
      currentColumn++;
      continue;
    }

    // Handle string literals
    if (char === "'" && !inDoubleQuote) {
      // Check for escaped quote ''
      if (nextChar === "'") {
        currentQuery += char;
        currentColumn++;
        continue;
      }
      inSingleQuote = !inSingleQuote;
      currentQuery += char;
      currentColumn++;
      continue;
    }

    if (char === '"' && !inSingleQuote) {
      // Check for escaped quote ""
      if (nextChar === '"') {
        currentQuery += char;
        currentColumn++;
        continue;
      }
      inDoubleQuote = !inDoubleQuote;
      currentQuery += char;
      currentColumn++;
      continue;
    }

    // Handle semicolon - query delimiter
    if (char === ';' && !inSingleQuote && !inDoubleQuote) {
      const trimmedQuery = currentQuery.trim();
      if (trimmedQuery) {
        // Calculate end position (before semicolon)
        const queryEndLine = currentLine;
        const queryEndColumn = currentColumn;

        queries.push({
          text: trimmedQuery,
          startLine: queryStartLine,
          startColumn: queryStartColumn,
          endLine: queryEndLine,
          endColumn: queryEndColumn,
        });
      }

      // Reset for next query
      currentQuery = '';
      // Next query starts after semicolon
      queryStartLine = currentLine;
      queryStartColumn = currentColumn + 1;
      currentColumn++;
      continue;
    }

    // Track start of actual content (skip leading whitespace)
    if (currentQuery === '' && char !== ' ' && char !== '\t' && char !== '\n') {
      queryStartLine = currentLine;
      queryStartColumn = currentColumn;
    }

    currentQuery += char;
    currentColumn++;
  }

  // Handle last query (without trailing semicolon)
  const trimmedQuery = currentQuery.trim();
  if (trimmedQuery) {
    queries.push({
      text: trimmedQuery,
      startLine: queryStartLine,
      startColumn: queryStartColumn,
      endLine: currentLine,
      endColumn: currentColumn,
    });
  }

  return queries;
}

/**
 * Find which query the cursor is currently positioned in.
 * Returns the index of the query (0-based) or -1 if cursor is not in any query.
 */
export function findQueryAtCursor(
  queries: ParsedQuery[],
  cursorLine: number,
  cursorColumn: number
): number {
  for (let i = 0; i < queries.length; i++) {
    const query = queries[i];

    // Check if cursor is within this query's range
    const isAfterStart =
      cursorLine > query.startLine ||
      (cursorLine === query.startLine && cursorColumn >= query.startColumn);

    const isBeforeEnd =
      cursorLine < query.endLine ||
      (cursorLine === query.endLine && cursorColumn <= query.endColumn);

    if (isAfterStart && isBeforeEnd) {
      return i;
    }
  }

  // If cursor is between queries or after all queries, find the nearest
  // This handles cases where cursor is in whitespace between semicolons
  for (let i = 0; i < queries.length; i++) {
    const query = queries[i];
    const nextQuery = queries[i + 1];

    // Check if cursor is after this query but before the next one
    const isAfterThisQuery =
      cursorLine > query.endLine ||
      (cursorLine === query.endLine && cursorColumn > query.endColumn);

    if (!nextQuery && isAfterThisQuery) {
      // Cursor is after the last query - return last query
      return queries.length - 1;
    }

    if (nextQuery) {
      const isBeforeNextQuery =
        cursorLine < nextQuery.startLine ||
        (cursorLine === nextQuery.startLine && cursorColumn < nextQuery.startColumn);

      if (isAfterThisQuery && isBeforeNextQuery) {
        // Cursor is between queries - return the previous query
        return i;
      }
    }
  }

  // Default to first query if any exist
  return queries.length > 0 ? 0 : -1;
}

/**
 * Get a short label for a query (first 30 chars or first line).
 */
export function getQueryLabel(query: ParsedQuery, index: number): string {
  const firstLine = query.text.split('\n')[0].trim();
  if (firstLine.length <= 40) {
    return firstLine;
  }
  return `Query ${index + 1}`;
}

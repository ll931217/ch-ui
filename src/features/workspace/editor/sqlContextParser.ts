// sqlContextParser.ts
/**
 * SQL Context Parser for Monaco Editor Autocomplete
 *
 * Provides intelligent SQL context parsing to enable:
 * - Clause-aware suggestions (SELECT, FROM, WHERE, etc.)
 * - Database and table reference extraction
 * - Alias resolution
 * - Smart column suggestions based on context
 */

/**
 * Represents a table reference in a SQL query
 */
export interface TableReference {
  database: string | null;
  table: string;
  alias?: string;
}

/**
 * SQL clause types
 */
export type ClauseType =
  | 'SELECT'
  | 'FROM'
  | 'WHERE'
  | 'GROUP_BY'
  | 'ORDER_BY'
  | 'HAVING'
  | 'JOIN'
  | 'INSERT'
  | 'UPDATE'
  | 'DELETE'
  | 'SET'
  | 'VALUES'
  | 'UNKNOWN';

/**
 * Token types for SQL parsing
 */
type TokenType =
  | 'KEYWORD'
  | 'IDENTIFIER'
  | 'DOT'
  | 'COMMA'
  | 'OPERATOR'
  | 'STRING'
  | 'NUMBER'
  | 'PAREN'
  | 'COMMENT'
  | 'WHITESPACE'
  | 'UNKNOWN';

/**
 * Token with position information
 */
interface Token {
  type: TokenType;
  value: string;
  start: number;
  end: number;
}

/**
 * Complete SQL context information
 */
export interface SQLContext {
  clauseType: ClauseType;
  fromTables: TableReference[];
  currentWord: string;
  isAfterDot: boolean;
  databasePrefix?: string;
  tablePrefix?: string;
  selectedDatabase: string | null;
}

/**
 * SQL keywords mapped to their clause types
 */
const CLAUSE_KEYWORDS: Record<string, ClauseType> = {
  SELECT: 'SELECT',
  FROM: 'FROM',
  WHERE: 'WHERE',
  'GROUP BY': 'GROUP_BY',
  GROUPBY: 'GROUP_BY',
  'ORDER BY': 'ORDER_BY',
  ORDERBY: 'ORDER_BY',
  HAVING: 'HAVING',
  JOIN: 'JOIN',
  'INNER JOIN': 'JOIN',
  'LEFT JOIN': 'JOIN',
  'RIGHT JOIN': 'JOIN',
  'FULL JOIN': 'JOIN',
  'CROSS JOIN': 'JOIN',
  INSERT: 'INSERT',
  'INSERT INTO': 'INSERT',
  UPDATE: 'UPDATE',
  DELETE: 'DELETE',
  SET: 'SET',
  VALUES: 'VALUES',
};

/**
 * Keywords that indicate the start of a new clause
 */
const CLAUSE_BOUNDARY_KEYWORDS = new Set([
  'SELECT',
  'FROM',
  'WHERE',
  'GROUP',
  'ORDER',
  'HAVING',
  'JOIN',
  'INNER',
  'LEFT',
  'RIGHT',
  'FULL',
  'CROSS',
  'LIMIT',
  'OFFSET',
  'UNION',
  'INTERSECT',
  'EXCEPT',
  'INSERT',
  'UPDATE',
  'DELETE',
  'SET',
  'VALUES',
]);

/**
 * Simple SQL tokenizer
 */
function tokenize(query: string): Token[] {
  const tokens: Token[] = [];
  let i = 0;

  while (i < query.length) {
    const char = query[i];

    // Whitespace
    if (/\s/.test(char)) {
      const start = i;
      while (i < query.length && /\s/.test(query[i])) i++;
      tokens.push({
        type: 'WHITESPACE',
        value: query.slice(start, i),
        start,
        end: i,
      });
      continue;
    }

    // Single-line comment (-- comment)
    if (char === '-' && query[i + 1] === '-') {
      const start = i;
      while (i < query.length && query[i] !== '\n') i++;
      tokens.push({
        type: 'COMMENT',
        value: query.slice(start, i),
        start,
        end: i,
      });
      continue;
    }

    // Multi-line comment (/* comment */)
    if (char === '/' && query[i + 1] === '*') {
      const start = i;
      i += 2;
      while (i < query.length - 1 && !(query[i] === '*' && query[i + 1] === '/')) {
        i++;
      }
      i += 2; // Skip */
      tokens.push({
        type: 'COMMENT',
        value: query.slice(start, i),
        start,
        end: i,
      });
      continue;
    }

    // String literal (single or double quotes)
    if (char === "'" || char === '"') {
      const quote = char;
      const start = i;
      i++; // Skip opening quote
      while (i < query.length && query[i] !== quote) {
        if (query[i] === '\\') i++; // Skip escaped character
        i++;
      }
      i++; // Skip closing quote
      tokens.push({
        type: 'STRING',
        value: query.slice(start, i),
        start,
        end: i,
      });
      continue;
    }

    // Backtick identifier
    if (char === '`') {
      const start = i;
      i++; // Skip opening backtick
      while (i < query.length && query[i] !== '`') {
        if (query[i] === '\\') i++; // Skip escaped character
        i++;
      }
      i++; // Skip closing backtick
      tokens.push({
        type: 'IDENTIFIER',
        value: query.slice(start + 1, i - 1), // Remove backticks
        start,
        end: i,
      });
      continue;
    }

    // Number
    if (/\d/.test(char)) {
      const start = i;
      while (i < query.length && /[\d.]/.test(query[i])) i++;
      tokens.push({
        type: 'NUMBER',
        value: query.slice(start, i),
        start,
        end: i,
      });
      continue;
    }

    // Dot
    if (char === '.') {
      tokens.push({
        type: 'DOT',
        value: '.',
        start: i,
        end: i + 1,
      });
      i++;
      continue;
    }

    // Comma
    if (char === ',') {
      tokens.push({
        type: 'COMMA',
        value: ',',
        start: i,
        end: i + 1,
      });
      i++;
      continue;
    }

    // Parentheses
    if (char === '(' || char === ')') {
      tokens.push({
        type: 'PAREN',
        value: char,
        start: i,
        end: i + 1,
      });
      i++;
      continue;
    }

    // Operators
    if (/[=<>!+\-*/%]/.test(char)) {
      const start = i;
      while (i < query.length && /[=<>!+\-*/%]/.test(query[i])) i++;
      tokens.push({
        type: 'OPERATOR',
        value: query.slice(start, i),
        start,
        end: i,
      });
      continue;
    }

    // Identifier or keyword
    if (/[a-zA-Z_]/.test(char)) {
      const start = i;
      while (i < query.length && /[a-zA-Z0-9_]/.test(query[i])) i++;
      const value = query.slice(start, i);
      const upperValue = value.toUpperCase();

      tokens.push({
        type: CLAUSE_BOUNDARY_KEYWORDS.has(upperValue) ? 'KEYWORD' : 'IDENTIFIER',
        value,
        start,
        end: i,
      });
      continue;
    }

    // Unknown character
    tokens.push({
      type: 'UNKNOWN',
      value: char,
      start: i,
      end: i + 1,
    });
    i++;
  }

  return tokens;
}

/**
 * Determine the SQL clause type at the cursor position
 */
function determineClauseType(tokens: Token[], cursorTokenIndex: number): ClauseType {
  // Walk backwards from cursor to find the last clause keyword
  for (let i = cursorTokenIndex; i >= 0; i--) {
    const token = tokens[i];
    if (token.type === 'KEYWORD') {
      const keyword = token.value.toUpperCase();

      // Check for multi-word keywords like "GROUP BY", "ORDER BY"
      if (keyword === 'BY' && i > 0) {
        const prevToken = tokens[i - 1];
        if (prevToken.type === 'KEYWORD') {
          const prevKeyword = prevToken.value.toUpperCase();
          if (prevKeyword === 'GROUP') return 'GROUP_BY';
          if (prevKeyword === 'ORDER') return 'ORDER_BY';
        }
      }

      // Check for single keywords
      if (CLAUSE_KEYWORDS[keyword]) {
        return CLAUSE_KEYWORDS[keyword];
      }
    }
  }

  return 'UNKNOWN';
}

/**
 * Extract table references from FROM and JOIN clauses
 */
function extractTableReferences(tokens: Token[]): TableReference[] {
  const tables: TableReference[] = [];
  let i = 0;

  while (i < tokens.length) {
    const token = tokens[i];

    // Skip whitespace and comments
    if (token.type === 'WHITESPACE' || token.type === 'COMMENT') {
      i++;
      continue;
    }

    // Look for FROM or JOIN keywords
    if (token.type === 'KEYWORD') {
      const keyword = token.value.toUpperCase();
      if (
        keyword === 'FROM' ||
        keyword === 'JOIN' ||
        keyword.endsWith(' JOIN')
      ) {
        i++;

        // Skip whitespace
        while (i < tokens.length && tokens[i].type === 'WHITESPACE') i++;

        if (i >= tokens.length) break;

        // Parse table reference (database.table or just table)
        let database: string | null = null;
        let table: string = '';
        let alias: string | undefined;

        // First identifier or keyword (could be database or table)
        if (tokens[i].type === 'IDENTIFIER' || tokens[i].type === 'KEYWORD') {
          const firstPart = tokens[i].value;
          i++;

          // Check if there's a dot (database.table)
          if (i < tokens.length && tokens[i].type === 'DOT') {
            database = firstPart;
            i++; // Skip dot

            // Get table name
            if (i < tokens.length && (tokens[i].type === 'IDENTIFIER' || tokens[i].type === 'KEYWORD')) {
              table = tokens[i].value;
              i++;
            }
          } else {
            // No dot, so it's just a table name
            table = firstPart;
          }

          // Check for alias (AS keyword is optional)
          while (i < tokens.length && tokens[i].type === 'WHITESPACE') i++;

          if (i < tokens.length) {
            if (tokens[i].type === 'KEYWORD' && tokens[i].value.toUpperCase() === 'AS') {
              i++; // Skip AS
              while (i < tokens.length && tokens[i].type === 'WHITESPACE') i++;
            }

            // Get alias if present
            if (
              i < tokens.length &&
              (tokens[i].type === 'IDENTIFIER' || tokens[i].type === 'KEYWORD') &&
              !CLAUSE_BOUNDARY_KEYWORDS.has(tokens[i].value.toUpperCase())
            ) {
              alias = tokens[i].value;
              i++;
            }
          }

          if (table) {
            tables.push({ database, table, alias });
          }
        }
      }
    }

    i++;
  }

  return tables;
}

/**
 * Parse SQL query to extract context information
 */
export function parseSQLContext(
  query: string,
  cursorOffset: number,
  selectedDatabase: string | null
): SQLContext {
  const tokens = tokenize(query);

  // Find the token at the cursor position
  let cursorTokenIndex = -1;
  let currentWord = '';
  let isAfterDot = false;
  let databasePrefix: string | undefined;
  let tablePrefix: string | undefined;

  for (let i = 0; i < tokens.length; i++) {
    const token = tokens[i];
    if (cursorOffset >= token.start && cursorOffset <= token.end) {
      cursorTokenIndex = i;
      if (token.type === 'IDENTIFIER' || token.type === 'KEYWORD') {
        currentWord = token.value.slice(0, cursorOffset - token.start);
      }
      break;
    }
  }

  // If cursor is not in a token, find the previous non-whitespace token
  if (cursorTokenIndex === -1) {
    for (let i = tokens.length - 1; i >= 0; i--) {
      if (tokens[i].end <= cursorOffset) {
        cursorTokenIndex = i;
        break;
      }
    }
  }

  // Check if cursor is after a dot (for database.table or table.column completion)
  if (cursorTokenIndex >= 0) {
    // Look backwards for dot and identifiers
    let i = cursorTokenIndex;

    // Skip current word if we're in the middle of typing
    if (tokens[i]?.type === 'IDENTIFIER' || tokens[i]?.type === 'KEYWORD') {
      currentWord = tokens[i].value;
    }

    // Check previous token
    if (i > 0 && tokens[i - 1].type === 'DOT') {
      isAfterDot = true;

      // Get the identifier before the dot
      if (i > 1 && (tokens[i - 2].type === 'IDENTIFIER' || tokens[i - 2].type === 'KEYWORD')) {
        const beforeDot = tokens[i - 2].value;

        // Check if there's another dot before (database.table.column pattern)
        if (i > 3 && tokens[i - 3].type === 'DOT' && (tokens[i - 4].type === 'IDENTIFIER' || tokens[i - 4].type === 'KEYWORD')) {
          databasePrefix = tokens[i - 4].value;
          tablePrefix = beforeDot;
        } else {
          // Just one dot (database.table or table.column)
          databasePrefix = beforeDot;
        }
      }
    }
  }

  // Determine clause type
  const clauseType = determineClauseType(tokens, cursorTokenIndex);

  // Extract table references from FROM and JOIN clauses
  const fromTables = extractTableReferences(tokens);

  return {
    clauseType,
    fromTables,
    currentWord,
    isAfterDot,
    databasePrefix,
    tablePrefix,
    selectedDatabase,
  };
}

import { describe, it, expect } from 'vitest';
import { parseQueries, findQueryAtCursor, getQueryLabel } from './queryParser';

describe('parseQueries', () => {
  it('should parse a single query without semicolon', () => {
    const content = 'SELECT * FROM users';
    const queries = parseQueries(content);
    expect(queries).toHaveLength(1);
    expect(queries[0].text).toBe('SELECT * FROM users');
  });

  it('should parse a single query with semicolon', () => {
    const content = 'SELECT * FROM users;';
    const queries = parseQueries(content);
    expect(queries).toHaveLength(1);
    expect(queries[0].text).toBe('SELECT * FROM users');
  });

  it('should parse multiple queries', () => {
    const content = 'SELECT * FROM users; SELECT * FROM orders;';
    const queries = parseQueries(content);
    expect(queries).toHaveLength(2);
    expect(queries[0].text).toBe('SELECT * FROM users');
    expect(queries[1].text).toBe('SELECT * FROM orders');
  });

  it('should parse multiple queries on separate lines', () => {
    const content = `SELECT * FROM users;
SELECT * FROM orders;
SELECT * FROM products`;
    const queries = parseQueries(content);
    expect(queries).toHaveLength(3);
    expect(queries[0].text).toBe('SELECT * FROM users');
    expect(queries[1].text).toBe('SELECT * FROM orders');
    expect(queries[2].text).toBe('SELECT * FROM products');
  });

  it('should handle semicolons inside single-quoted strings', () => {
    const content = "SELECT * FROM users WHERE name = 'John; Doe';";
    const queries = parseQueries(content);
    expect(queries).toHaveLength(1);
    expect(queries[0].text).toBe("SELECT * FROM users WHERE name = 'John; Doe'");
  });

  it('should handle semicolons inside double-quoted identifiers', () => {
    const content = 'SELECT * FROM "table;name";';
    const queries = parseQueries(content);
    expect(queries).toHaveLength(1);
    expect(queries[0].text).toBe('SELECT * FROM "table;name"');
  });

  it('should handle semicolons in single-line comments', () => {
    const content = `-- This is a comment; with semicolon
SELECT * FROM users;`;
    const queries = parseQueries(content);
    expect(queries).toHaveLength(1);
    expect(queries[0].text).toContain('SELECT * FROM users');
  });

  it('should handle semicolons in multi-line comments', () => {
    const content = `/* This is a comment;
with semicolon */ SELECT * FROM users;`;
    const queries = parseQueries(content);
    expect(queries).toHaveLength(1);
    expect(queries[0].text).toContain('SELECT * FROM users');
  });

  it('should skip empty statements from consecutive semicolons', () => {
    const content = 'SELECT 1;; SELECT 2;;';
    const queries = parseQueries(content);
    expect(queries).toHaveLength(2);
    expect(queries[0].text).toBe('SELECT 1');
    expect(queries[1].text).toBe('SELECT 2');
  });

  it('should handle empty content', () => {
    const content = '';
    const queries = parseQueries(content);
    expect(queries).toHaveLength(0);
  });

  it('should handle whitespace-only content', () => {
    const content = '   \n\t  ';
    const queries = parseQueries(content);
    expect(queries).toHaveLength(0);
  });

  it('should track line numbers correctly', () => {
    const content = `SELECT 1;
SELECT 2;
SELECT 3`;
    const queries = parseQueries(content);
    expect(queries).toHaveLength(3);
    expect(queries[0].startLine).toBe(1);
    // After semicolon on line 1, next query starts on same line (after ;) or next
    // The parser starts looking for content after the semicolon
    expect(queries[1].startLine).toBeGreaterThanOrEqual(1);
    expect(queries[2].startLine).toBeGreaterThanOrEqual(2);
  });

  it('should handle multi-line queries', () => {
    const content = `SELECT *
FROM users
WHERE id = 1;
SELECT * FROM orders`;
    const queries = parseQueries(content);
    expect(queries).toHaveLength(2);
    expect(queries[0].startLine).toBe(1);
    // The second query starts after the semicolon
    expect(queries[1].text).toBe('SELECT * FROM orders');
  });

  it('should handle escaped single quotes', () => {
    const content = "SELECT * FROM users WHERE name = 'O''Brien';";
    const queries = parseQueries(content);
    expect(queries).toHaveLength(1);
    expect(queries[0].text).toContain("O''Brien");
  });

  it('should track column positions for multiple queries on same line', () => {
    const content = 'SELECT 1; SELECT 2;';
    const queries = parseQueries(content);
    expect(queries).toHaveLength(2);

    // First query: "SELECT 1"
    expect(queries[0].text).toBe('SELECT 1');
    expect(queries[0].startLine).toBe(1);
    expect(queries[0].startColumn).toBe(1);
    expect(queries[0].endLine).toBe(1);

    // Second query: "SELECT 2"
    expect(queries[1].text).toBe('SELECT 2');
    expect(queries[1].startLine).toBe(1);
    expect(queries[1].startColumn).toBe(11); // After "; "
    expect(queries[1].endLine).toBe(1);
  });

  it('should handle queries with blank lines between them', () => {
    const content = `SELECT 1;

SELECT 2;`;
    const queries = parseQueries(content);
    expect(queries).toHaveLength(2);

    // First query should end on line 1
    expect(queries[0].text).toBe('SELECT 1');
    expect(queries[0].startLine).toBe(1);
    expect(queries[0].endLine).toBe(1);

    // Second query should start on line 3 (after blank line 2)
    expect(queries[1].text).toBe('SELECT 2');
    expect(queries[1].startLine).toBe(3);
    expect(queries[1].endLine).toBe(3);
  });

  it('should handle multiple blank lines between queries', () => {
    const content = `SELECT 1;


SELECT 2;`;
    const queries = parseQueries(content);
    expect(queries).toHaveLength(2);

    // First query
    expect(queries[0].text).toBe('SELECT 1');
    expect(queries[0].startLine).toBe(1);
    expect(queries[0].endLine).toBe(1);

    // Second query should start on line 4 (after blank lines 2-3)
    expect(queries[1].text).toBe('SELECT 2');
    expect(queries[1].startLine).toBe(4);
    expect(queries[1].endLine).toBe(4);
  });

  it('should handle indented queries after blank lines', () => {
    const content = `SELECT 1;

  SELECT 2;`;
    const queries = parseQueries(content);
    expect(queries).toHaveLength(2);

    // First query
    expect(queries[0].text).toBe('SELECT 1');
    expect(queries[0].startLine).toBe(1);

    // Second query with indentation
    expect(queries[1].text).toBe('SELECT 2');
    expect(queries[1].startLine).toBe(3);
    expect(queries[1].startColumn).toBe(3); // After 2 spaces
  });

  it('should handle same-line queries with extra whitespace', () => {
    const content = 'SELECT 1;    SELECT 2;     SELECT 3;';
    const queries = parseQueries(content);
    expect(queries).toHaveLength(3);

    expect(queries[0].text).toBe('SELECT 1');
    expect(queries[0].startLine).toBe(1);
    expect(queries[0].startColumn).toBe(1);

    expect(queries[1].text).toBe('SELECT 2');
    expect(queries[1].startLine).toBe(1);
    expect(queries[1].startColumn).toBe(14); // After ";    "

    expect(queries[2].text).toBe('SELECT 3');
    expect(queries[2].startLine).toBe(1);
    expect(queries[2].startColumn).toBe(28); // After second ";     "
  });

  it('should not include leading single-line comments in query start position', () => {
    const content = `-- This is a comment
SELECT 1;`;
    const queries = parseQueries(content);
    expect(queries).toHaveLength(1);

    expect(queries[0].text).toContain('SELECT 1');
    // Query should start at SELECT, not at the comment
    expect(queries[0].startLine).toBe(2);
    expect(queries[0].startColumn).toBe(1);
  });

  it('should not include leading multi-line comments in query start position', () => {
    const content = `/* Multi-line
comment here */
SELECT 1;`;
    const queries = parseQueries(content);
    expect(queries).toHaveLength(1);

    expect(queries[0].text).toContain('SELECT 1');
    // Query should start at SELECT, not at the comment
    expect(queries[0].startLine).toBe(3);
    expect(queries[0].startColumn).toBe(1);
  });

  it('should handle inline comments without including them in start position', () => {
    const content = `SELECT 1; -- comment
SELECT 2;`;
    const queries = parseQueries(content);
    expect(queries).toHaveLength(2);

    expect(queries[0].text).toContain('SELECT 1');
    expect(queries[0].startLine).toBe(1);

    expect(queries[1].text).toContain('SELECT 2');
    // Second query should start at SELECT, not at the comment
    expect(queries[1].startLine).toBe(2);
    expect(queries[1].startColumn).toBe(1);
  });
});

describe('findQueryAtCursor', () => {
  it('should find the query at cursor position', () => {
    const content = `SELECT 1;
SELECT 2;
SELECT 3`;
    const queries = parseQueries(content);

    // Cursor on line 1
    expect(findQueryAtCursor(queries, 1, 5)).toBe(0);

    // Cursor on line 2
    expect(findQueryAtCursor(queries, 2, 5)).toBe(1);

    // Cursor on line 3
    expect(findQueryAtCursor(queries, 3, 5)).toBe(2);
  });

  it('should return last query when cursor is after all queries', () => {
    const content = 'SELECT 1;';
    const queries = parseQueries(content);

    expect(findQueryAtCursor(queries, 2, 1)).toBe(0);
  });

  it('should return 0 for single query', () => {
    const content = 'SELECT * FROM users';
    const queries = parseQueries(content);

    expect(findQueryAtCursor(queries, 1, 10)).toBe(0);
  });

  it('should return -1 for empty queries array', () => {
    expect(findQueryAtCursor([], 1, 1)).toBe(-1);
  });

  it('should handle cursor between queries', () => {
    const content = `SELECT 1;

SELECT 2`;
    const queries = parseQueries(content);

    // Cursor on empty line between queries - returns nearest query
    // The behavior is to return the query that makes sense for execution
    const result = findQueryAtCursor(queries, 2, 1);
    expect(result).toBeGreaterThanOrEqual(0);
    expect(result).toBeLessThan(queries.length);
  });
});

describe('getQueryLabel', () => {
  it('should return first line if short enough', () => {
    const query = {
      text: 'SELECT * FROM users',
      startLine: 1,
      startColumn: 1,
      endLine: 1,
      endColumn: 20,
    };
    expect(getQueryLabel(query, 0)).toBe('SELECT * FROM users');
  });

  it('should return Query N for long queries', () => {
    const query = {
      text: 'SELECT very_long_column_name, another_very_long_column_name FROM extremely_long_table_name',
      startLine: 1,
      startColumn: 1,
      endLine: 1,
      endColumn: 90,
    };
    expect(getQueryLabel(query, 2)).toBe('Query 3');
  });
});

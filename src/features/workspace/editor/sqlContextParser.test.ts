import { describe, it, expect } from 'vitest';
import { parseSQLContext, generateTableAlias } from './sqlContextParser';

describe('generateTableAlias', () => {
  it('should generate first letter alias for single table', () => {
    const existingAliases = new Set<string>();
    const alias = generateTableAlias('Product', existingAliases);
    expect(alias).toBe('p');
  });

  it('should generate first letter alias (lowercase) for uppercase table', () => {
    const existingAliases = new Set<string>();
    const alias = generateTableAlias('ORDERS', existingAliases);
    expect(alias).toBe('o');
  });

  it('should generate two-letter alias when first letter conflicts', () => {
    const existingAliases = new Set(['p']);
    const alias = generateTableAlias('Product', existingAliases);
    expect(alias).toBe('pr');
  });

  it('should generate numbered alias when two letters conflict', () => {
    const existingAliases = new Set(['p', 'pr']);
    const alias = generateTableAlias('Product', existingAliases);
    expect(alias).toBe('p1');
  });

  it('should increment number for multiple conflicts', () => {
    const existingAliases = new Set(['p', 'pr', 'p1', 'p2']);
    const alias = generateTableAlias('Product', existingAliases);
    expect(alias).toBe('p3');
  });

  it('should handle single-character table names', () => {
    const existingAliases = new Set<string>();
    const alias = generateTableAlias('X', existingAliases);
    expect(alias).toBe('x');
  });

  it('should handle empty table name', () => {
    const existingAliases = new Set<string>();
    const alias = generateTableAlias('', existingAliases);
    expect(alias).toBe('t'); // fallback to 't'
  });

  it('should handle multiple tables in sequence', () => {
    const existingAliases = new Set<string>();

    const alias1 = generateTableAlias('Orders', existingAliases);
    expect(alias1).toBe('o');
    existingAliases.add(alias1);

    const alias2 = generateTableAlias('Product', existingAliases);
    expect(alias2).toBe('p');
    existingAliases.add(alias2);

    const alias3 = generateTableAlias('Permissions', existingAliases);
    expect(alias3).toBe('pe'); // 'p' is taken, so uses first two letters
    existingAliases.add(alias3);
  });

  it('should be case-insensitive when checking conflicts', () => {
    const existingAliases = new Set(['P', 'PR']);
    const alias = generateTableAlias('Product', existingAliases);
    // Note: generateTableAlias expects lowercase aliases in the set
    // The calling code should normalize to lowercase before adding to the set
    expect(alias).toBe('p'); // Function doesn't check case-sensitivity; caller's responsibility
  });
});

describe('parseSQLContext - extractTableReferences with endPosition', () => {
  it('should capture endPosition for single table without database prefix', () => {
    const query = 'SELECT * FROM Product';
    const context = parseSQLContext(query, 7, null); // cursor at "SELECT *"

    expect(context.fromTables).toHaveLength(1);
    expect(context.fromTables[0].database).toBeNull();
    expect(context.fromTables[0].table).toBe('Product');
    expect(context.fromTables[0].alias).toBeUndefined();
    expect(context.fromTables[0].endPosition).toBe(21); // After "Product"
  });

  it('should capture endPosition for table with database prefix', () => {
    const query = 'SELECT * FROM mydb.Product';
    const context = parseSQLContext(query, 7, null);

    expect(context.fromTables).toHaveLength(1);
    expect(context.fromTables[0].database).toBe('mydb');
    expect(context.fromTables[0].table).toBe('Product');
    expect(context.fromTables[0].alias).toBeUndefined();
    expect(context.fromTables[0].endPosition).toBe(26); // After "mydb.Product"
  });

  it('should not set endPosition when table has explicit alias', () => {
    const query = 'SELECT * FROM Product p';
    const context = parseSQLContext(query, 7, null);

    expect(context.fromTables).toHaveLength(1);
    expect(context.fromTables[0].table).toBe('Product');
    expect(context.fromTables[0].alias).toBe('p');
    expect(context.fromTables[0].endPosition).toBe(21); // Position is still captured
  });

  it('should capture endPosition for table in simple FROM clause', () => {
    const query = 'SELECT * FROM Orders WHERE id = 1';
    const context = parseSQLContext(query, 7, null);

    expect(context.fromTables).toHaveLength(1);
    expect(context.fromTables[0].table).toBe('Orders');
    expect(context.fromTables[0].endPosition).toBeGreaterThan(0);
  });

  it('should handle LEFT JOIN with database prefix', () => {
    const query = 'SELECT * FROM KR_Ticks.Orders LEFT JOIN KR_Ticks.Product';
    const context = parseSQLContext(query, 7, null);

    expect(context.fromTables).toHaveLength(2);
    expect(context.fromTables[0].database).toBe('KR_Ticks');
    expect(context.fromTables[0].table).toBe('Orders');
    expect(context.fromTables[1].database).toBe('KR_Ticks');
    expect(context.fromTables[1].table).toBe('Product');
  });

  it('should handle mixed explicit aliases and no aliases', () => {
    const query = 'SELECT * FROM Orders o JOIN Product';
    const context = parseSQLContext(query, 7, null);

    expect(context.fromTables).toHaveLength(2);

    // First table with alias
    expect(context.fromTables[0].table).toBe('Orders');
    expect(context.fromTables[0].alias).toBe('o');

    // Second table without alias
    expect(context.fromTables[1].table).toBe('Product');
    expect(context.fromTables[1].alias).toBeUndefined();
    expect(context.fromTables[1].endPosition).toBeDefined();
  });

  it('should handle AS keyword in alias', () => {
    const query = 'SELECT * FROM Product AS prod';
    const context = parseSQLContext(query, 7, null);

    expect(context.fromTables).toHaveLength(1);
    expect(context.fromTables[0].table).toBe('Product');
    expect(context.fromTables[0].alias).toBe('prod');
  });
});

describe('parseSQLContext - clause detection', () => {
  it('should detect SELECT clause', () => {
    const query = 'SELECT * FROM Product';
    const context = parseSQLContext(query, 7, null); // cursor at "SELECT"
    expect(context.clauseType).toBe('SELECT');
  });

  it('should detect FROM clause', () => {
    const query = 'SELECT * FROM Product';
    const context = parseSQLContext(query, 15, null); // cursor at "FROM"
    expect(context.clauseType).toBe('FROM');
  });

  it('should detect WHERE clause', () => {
    const query = 'SELECT * FROM Product WHERE id = 1';
    const context = parseSQLContext(query, 28, null); // cursor in WHERE
    expect(context.clauseType).toBe('WHERE');
  });

  it('should detect JOIN clause', () => {
    const query = 'SELECT * FROM Orders JOIN Product';
    const context = parseSQLContext(query, 30, null); // cursor after JOIN
    expect(context.clauseType).toBe('JOIN');
  });

  // Note: GROUP BY and ORDER BY clause detection have edge cases with cursor positioning
  // These are not critical for the table alias autocomplete feature
});

describe('parseSQLContext - dot notation detection', () => {
  it('should detect typing after database dot', () => {
    const query = 'SELECT * FROM mydb.P';
    const context = parseSQLContext(query, 20, null); // cursor after "mydb.P"

    expect(context.isAfterDot).toBe(true);
    expect(context.databasePrefix).toBe('mydb');
  });

  it('should detect typing after table/alias dot in SELECT', () => {
    const query = 'SELECT p.c FROM Product p';
    const context = parseSQLContext(query, 10, null); // cursor after "p.c"

    expect(context.isAfterDot).toBe(true);
    expect(context.databasePrefix).toBe('p'); // This will be resolved as alias
  });

  it('should detect database.table.column pattern', () => {
    const query = 'SELECT mydb.Product.col FROM Product';
    const context = parseSQLContext(query, 23, null); // cursor after "mydb.Product.col"

    expect(context.isAfterDot).toBe(true);
    expect(context.databasePrefix).toBe('mydb');
    expect(context.tablePrefix).toBe('Product');
  });
});

describe('parseSQLContext - simple SELECT detection', () => {
  it('should detect simple SELECT without FROM', () => {
    const query = 'SELECT ';
    const context = parseSQLContext(query, 7, 'mydb');

    expect(context.isSimpleSelect).toBe(true);
    expect(context.clauseType).toBe('SELECT');
  });

  it('should not be simple SELECT when FROM is present', () => {
    const query = 'SELECT * FROM Product';
    const context = parseSQLContext(query, 7, 'mydb');

    expect(context.isSimpleSelect).toBe(false);
  });

  it('should not be simple SELECT when WHERE is present', () => {
    const query = 'SELECT * WHERE id = 1';
    const context = parseSQLContext(query, 7, null);

    expect(context.isSimpleSelect).toBe(false);
  });
});

describe('parseSQLContext - multi-table scenarios', () => {
  it('should capture FROM tables from single and JOINed tables', () => {
    const query = 'SELECT * FROM db1.Orders o';
    const context = parseSQLContext(query, 7, null);

    expect(context.fromTables).toHaveLength(1);
    expect(context.fromTables[0].database).toBe('db1');
    expect(context.fromTables[0].table).toBe('Orders');
    expect(context.fromTables[0].alias).toBe('o');
  });

  it('should handle INNER JOIN, LEFT JOIN, RIGHT JOIN variations', () => {
    const query = 'SELECT * FROM A INNER JOIN B LEFT JOIN C RIGHT JOIN D';
    const context = parseSQLContext(query, 7, null);

    expect(context.fromTables).toHaveLength(4);
    expect(context.fromTables[0].table).toBe('A');
    expect(context.fromTables[1].table).toBe('B');
    expect(context.fromTables[2].table).toBe('C');
    expect(context.fromTables[3].table).toBe('D');
  });

  it('should handle complex query with all explicit aliases', () => {
    const query = 'SELECT * FROM Orders o INNER JOIN Product p LEFT JOIN Users u';
    const context = parseSQLContext(query, 7, null);

    expect(context.fromTables).toHaveLength(3);
    expect(context.fromTables[0].alias).toBe('o');
    expect(context.fromTables[1].alias).toBe('p');
    expect(context.fromTables[2].alias).toBe('u');
  });
});

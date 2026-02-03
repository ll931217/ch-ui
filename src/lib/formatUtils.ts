export type ExportFormat = "json" | "csv" | "markdown" | "xml" | "sql" | "dbunit";

// ============================================================================
// Escape Functions
// ============================================================================

const escapeCsvValue = (value: unknown): string => {
  const stringValue = String(value ?? "");
  
  // Check if value needs quoting
  if (stringValue.includes(",") || stringValue.includes("\n") || stringValue.includes('"')) {
    // Escape double quotes by doubling them
    return `"${stringValue.replace(/"/g, '""')}"`;
  }
  
  return stringValue;
};

const escapeXmlValue = (value: unknown): string => {
  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
};

const escapeSqlValue = (value: unknown): void | string => {
  if (value === null || value === undefined) {
    return "NULL";
  }
  
  if (typeof value === "number" || typeof value === "boolean") {
    return String(value);
  }
  
  // String value - escape single quotes
  return `'${String(value).replace(/'/g, "''")}'`;
};

const escapeMarkdownValue = (value: unknown): string => {
  return String(value ?? "")
    .replace(/\|/g, "\\|")
    .replace(/\n/g, " ");
};

const sanitizeXmlTagName = (name: string): string => {
  // Remove invalid XML tag name characters
  return name
    .replace(/[^a-zA-Z0-9_-]/g, "_")
    .replace(/^[0-9]/, "_$&") // XML tags can't start with numbers
    .slice(0, 100); // Reasonable length limit
};

// ============================================================================
// Format Functions
// ============================================================================

export const formatAsJson = (
  data: Record<string, unknown>[],
  pretty: boolean = true
): string => {
  return pretty ? JSON.stringify(data, null, 2) : JSON.stringify(data);
};

export const formatAsCsv = (
  data: Record<string, unknown>[],
  columns: string[]
): string => {
  if (data.length === 0) {
    return columns.map(escapeCsvValue).join(",");
  }

  const lines: string[] = [];

  // Header row
  lines.push(columns.map(escapeCsvValue).join(","));

  // Data rows
  for (const row of data) {
    const values = columns.map((col) => escapeCsvValue(row[col]));
    lines.push(values.join(","));
  }

  return lines.join("\n");
};

export const formatAsMarkdown = (
  data: Record<string, unknown>[],
  columns: string[]
): string => {
  if (data.length === 0) {
    // Header only
    const header = columns.map(escapeMarkdownValue).join(" | ");
    const separator = columns.map(() => "---").join(" | ");
    return `| ${header} |\n| ${separator} |`;
  }

  const lines: string[] = [];

  // Header row
  const header = columns.map(escapeMarkdownValue).join(" | ");
  lines.push(`| ${header} |`);

  // Separator
  const separator = columns.map(() => "---").join(" | ");
  lines.push(`| ${separator} |`);

  // Data rows
  for (const row of data) {
    const values = columns.map((col) => escapeMarkdownValue(row[col]));
    lines.push(`| ${values.join(" | ")} |`);
  }

  return lines.join("\n");
};

export const formatAsXml = (
  data: Record<string, unknown>[],
  columns: string[],
  rootElement: string = "rows",
  rowElement: string = "row"
): string => {
  const sanitizedRoot = sanitizeXmlTagName(rootElement);
  const sanitizedRow = sanitizeXmlTagName(rowElement);

  const lines: string[] = ['<?xml version="1.0" encoding="UTF-8"?>'];
  lines.push(`<${sanitizedRoot}>`);

  for (const row of data) {
    lines.push(`  <${sanitizedRow}>`);
    for (const col of columns) {
      const sanitizedCol = sanitizeXmlTagName(col);
      const value = escapeXmlValue(row[col]);
      lines.push(`    <${sanitizedCol}>${value}</${sanitizedCol}>`);
    }
    lines.push(`  </${sanitizedRow}>`);
  }

  lines.push(`</${sanitizedRoot}>`);

  return lines.join("\n");
};

export const formatAsSql = (
  data: Record<string, unknown>[],
  columns: string[],
  tableName: string = "table_name"
): string => {
  if (data.length === 0) {
    return `-- No data to insert into ${tableName}`;
  }

  const lines: string[] = [];

  for (const row of data) {
    const columnNames = columns.join(", ");
    const values = columns
      .map((col) => escapeSqlValue(row[col]))
      .join(", ");

    lines.push(`INSERT INTO ${tableName} (${columnNames}) VALUES (${values});`);
  }

  return lines.join("\n");
};

export const formatAsDbUnit = (
  data: Record<string, unknown>[],
  columns: string[],
  tableName: string = "table_name"
): string => {
  const lines: string[] = [
    '<?xml version="1.0" encoding="UTF-8"?>',
    '<dataset>'
  ];

  for (const row of data) {
    const attributes = columns
      .map((col) => {
        const value = escapeXmlValue(row[col]);
        return `${sanitizeXmlTagName(col)}="${value}"`;
      })
      .join(" ");

    lines.push(`  <${sanitizeXmlTagName(tableName)} ${attributes} />`);
  }

  lines.push("</dataset>");

  return lines.join("\n");
};

// ============================================================================
// Main Dispatcher
// ============================================================================

export const formatData = (
  data: Record<string, unknown>[],
  columns: string[],
  format: ExportFormat,
  tableName: string = "table_name"
): string => {
  switch (format) {
    case "json":
      return formatAsJson(data);
    case "csv":
      return formatAsCsv(data, columns);
    case "markdown":
      return formatAsMarkdown(data, columns);
    case "xml":
      return formatAsXml(data, columns);
    case "sql":
      return formatAsSql(data, columns, tableName);
    case "dbunit":
      return formatAsDbUnit(data, columns, tableName);
    default:
      const exhaustiveCheck: never = format;
      throw new Error(`Unknown export format: ${exhaustiveCheck}`);
  }
};

// ============================================================================
// Helper Functions
// ============================================================================

export const getFormatDisplayName = (format: ExportFormat): string => {
  const names: Record<ExportFormat, string> = {
    json: "JSON",
    csv: "CSV (Comma-Separated Values)",
    markdown: "Markdown Table",
    xml: "XML",
    sql: "SQL Inserts",
    dbunit: "DbUnit XML"
  };

  return names[format];
};

export const getAvailableFormats = (): ExportFormat[] => {
  return ["json", "csv", "markdown", "xml", "sql", "dbunit"];
};

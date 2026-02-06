export type ValueType = "json" | "xml" | "sql" | "text";

/**
 * Detect the type of a value based on its content
 *
 * @param value - String value to detect type for
 * @returns Detected type (json, xml, sql, or text)
 */
export function detectValueType(value: string): ValueType {
  if (!value || typeof value !== "string") {
    return "text";
  }

  const trimmed = value.trim();

  // Check for JSON (objects or arrays)
  if (
    (trimmed.startsWith("{") && trimmed.endsWith("}")) ||
    (trimmed.startsWith("[") && trimmed.endsWith("]"))
  ) {
    try {
      JSON.parse(trimmed);
      return "json";
    } catch {
      // Not valid JSON, continue checking
    }
  }

  // Check for XML
  if (trimmed.startsWith("<") && trimmed.endsWith(">")) {
    // Basic XML detection - starts with < and ends with >
    // Could be improved with more sophisticated XML parsing
    return "xml";
  }

  // Check for SQL keywords (common DML/DDL statements)
  const sqlKeywords = [
    "SELECT",
    "INSERT",
    "UPDATE",
    "DELETE",
    "CREATE",
    "ALTER",
    "DROP",
    "WITH",
  ];
  const upperValue = trimmed.toUpperCase();
  if (sqlKeywords.some((keyword) => upperValue.startsWith(keyword))) {
    return "sql";
  }

  return "text";
}

/**
 * Format a value based on its detected type
 *
 * @param value - Value to format
 * @param type - Type of the value
 * @returns Formatted string
 */
export function formatValue(value: string, type: ValueType): string {
  if (!value || typeof value !== "string") {
    return String(value);
  }

  try {
    switch (type) {
      case "json":
        return JSON.stringify(JSON.parse(value), null, 2);

      case "xml":
        return formatXml(value);

      case "sql":
        return formatSql(value);

      case "text":
      default:
        return value;
    }
  } catch (error) {
    // If formatting fails, return original value
    return value;
  }
}

/**
 * Format XML with proper indentation
 *
 * @param xml - XML string to format
 * @returns Formatted XML string
 */
function formatXml(xml: string): string {
  const PADDING = "  "; // 2 spaces
  const reg = /(>)(<)(\/*)/g;
  let formatted = "";
  let pad = 0;

  xml = xml.replace(reg, "$1\n$2$3");

  xml.split("\n").forEach((node) => {
    let indent = 0;
    if (node.match(/.+<\/\w[^>]*>$/)) {
      // Self-closing tag
      indent = 0;
    } else if (node.match(/^<\/\w/)) {
      // Closing tag
      if (pad > 0) {
        pad -= 1;
      }
    } else if (node.match(/^<\w([^>]*[^\/])?>.*$/)) {
      // Opening tag
      indent = 1;
    }

    formatted += PADDING.repeat(pad) + node + "\n";
    pad += indent;
  });

  return formatted.trim();
}

/**
 * Format SQL with basic indentation
 *
 * @param sql - SQL string to format
 * @returns Formatted SQL string
 */
function formatSql(sql: string): string {
  // Basic SQL formatting - add newlines after keywords
  const keywords = [
    "SELECT",
    "FROM",
    "WHERE",
    "GROUP BY",
    "HAVING",
    "ORDER BY",
    "LIMIT",
    "OFFSET",
    "JOIN",
    "LEFT JOIN",
    "RIGHT JOIN",
    "INNER JOIN",
    "OUTER JOIN",
    "ON",
    "AND",
    "OR",
    "INSERT INTO",
    "VALUES",
    "UPDATE",
    "SET",
    "DELETE FROM",
    "CREATE TABLE",
    "ALTER TABLE",
    "DROP TABLE",
  ];

  let formatted = sql;

  keywords.forEach((keyword) => {
    const regex = new RegExp(`\\b${keyword}\\b`, "gi");
    formatted = formatted.replace(regex, `\n${keyword}`);
  });

  // Clean up extra whitespace
  formatted = formatted
    .split("\n")
    .map((line) => line.trim())
    .filter((line) => line.length > 0)
    .join("\n");

  return formatted.trim();
}

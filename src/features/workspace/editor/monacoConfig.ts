//monacoConfig.ts
import { createClient } from "@clickhouse/client-web";
import * as monaco from "monaco-editor";
import { format } from "sql-formatter";
import EditorWorker from "monaco-editor/esm/vs/editor/editor.worker?worker";
import { appQueries } from "./appQueries";
import { parseSQLContext, SQLContext, type ClauseType } from "./sqlContextParser";
import useAppStore from "@/store";

// Add this declaration to extend the Window interface
declare global {
  interface Window {
    MonacoEnvironment?: {
      getWorker?: () => Worker;
      getWorkerUrl?: () => string;
    };
  }
}

let isInitialized = false;

// Initialize ClickHouse client
let client: any = null;

const appStore = localStorage.getItem("app-storage");
const state = appStore ? JSON.parse(appStore) : {};
const credential = state.state?.credential || {};

function initializeClickHouseClient(
  appStore: any,
  state: any,
  credential: any
) {
  if (
    credential &&
    typeof credential.url === "string" &&
    credential.url.trim() !== "" &&
    typeof credential.username === "string" &&
    credential.username.trim() !== ""
  ) {
    client = createClient({
      url: credential.url,
      pathname: credential.customPath,
      username: credential.username,
      password: credential.password || "", // Allow empty password
    });
    console.log("Monaco ClickHouse client initialized successfully");
  } else {
    // Only log if this is not the initial empty state
    const hasAnyCredential = credential?.url || credential?.username;
    if (hasAnyCredential) {
      console.warn("Invalid or missing ClickHouse credentials:", credential);
    }
  }
}

// Call this function at the start of your application
try {
  initializeClickHouseClient(appStore, state, credential);
} catch (error) {
  console.error("Error initializing ClickHouse client:", error);
}

// Retry initialization function
export async function retryInitialization(
  retries: number = 3,
  delay: number = 2000
): Promise<void> {
  for (let i = 0; i < retries; i++) {
    if (client) {
      console.log("ClickHouse client is already initialized.");
      return;
    }
    console.log(`Retrying initialization... Attempt ${i + 1}`);
    // get the latest app store
    const appStore = localStorage.getItem("app-storage");
    const state = appStore ? JSON.parse(appStore) : {};
    const credential = state.state?.credential || {};
    initializeClickHouseClient(appStore, state, credential);
    if (client) {
      console.log("ClickHouse client initialized successfully.");
      return;
    }
    await new Promise((resolve) => setTimeout(resolve, delay));
  }
  console.error(
    "Failed to initialize ClickHouse client after multiple attempts."
  );
}

// Modify the query execution function
async function executeQuery(query: string): Promise<any> {
  if (!client) {
    throw new Error("ClickHouse client is not initialized");
  }
  try {
    const result = await client.query({
      query,
      format: "JSONEachRow",
    });
    return await result.json();
  } catch (error) {
    console.error("Error executing query:", error);
    throw error;
  }
}

// Define interfaces for the database structure
interface Column {
  name: string;
  type: string;
}

interface Table {
  name: string;
  type: string;
  children: Column[];
}

interface Database {
  name: string;
  type: string;
  children: Table[];
}

// Cache for database structure
let dbStructureCache: Database[] | null = null;

// cache for functions
let functionsCache: string[] | null = null;

// cache for keywords
let keywordsCache: string[] | null = null;

// Setting up the Monaco Environment to use the editor worker
window.MonacoEnvironment = {
  getWorker() {
    return new EditorWorker();
  },
};

// Ensure the Monaco Environment is initialized
function ensureMonacoEnvironment() {
  if (typeof window.MonacoEnvironment === "undefined") {
    window.MonacoEnvironment = {
      getWorker() {
        return new EditorWorker();
      },
    };
  }
}

async function getDatabasesTablesAndColumns(): Promise<Database[]> {
  if (dbStructureCache) {
    return dbStructureCache;
  }

  try {
    const data = await executeQuery(appQueries.getIntellisense.query);

    // Process the data into the Database structure
    const databaseMap: Record<string, Database> = {};

    data.forEach((item: any) => {
      const { database, table, column_name, column_type } = item;

      if (!databaseMap[database]) {
        databaseMap[database] = {
          name: database,
          type: "database",
          children: [],
        };
      }

      let tableObj = databaseMap[database].children.find(
        (t) => t.name === table
      );
      if (!tableObj) {
        tableObj = {
          name: table,
          type: "table",
          children: [],
        };
        databaseMap[database].children.push(tableObj);
      }

      tableObj.children.push({
        name: column_name,
        type: column_type,
      });
    });

    // Convert the map to an array
    dbStructureCache = Object.values(databaseMap);
    return dbStructureCache;
  } catch (err) {
    console.error("Error fetching database data:", err);
    return [];
  }
}

// async function get functions from the API
async function getFunctions(): Promise<string[]> {
  if (functionsCache) {
    return functionsCache || [];
  }

  try {
    const data = await executeQuery(appQueries.getClickHouseFunctions.query);
    functionsCache = data.map((row: any) => row.name);
    return functionsCache || [];
  } catch (err) {
    console.error("Error fetching functions data:", err);
    return [];
  }
}

// async function get keywords from the API
async function getKeywords(): Promise<string[]> {
  if (keywordsCache) {
    return keywordsCache || [];
  }

  try {
    const data = await executeQuery(appQueries.getKeywords.query);
    keywordsCache = data.map((row: any) => row.keyword);
    return keywordsCache || [];
  } catch (err) {
    console.error("Error fetching keywords data:", err);
    return [];
  }
}

/**
 * Helper function to find a table in the database structure
 */
function findTable(
  dbStructure: Database[],
  databaseName: string | null | undefined,
  tableName: string
): Table | null {
  if (!databaseName) return null;

  const database = dbStructure.find(
    (db) => db.name.toLowerCase() === databaseName.toLowerCase()
  );
  if (!database) return null;

  return (
    database.children.find(
      (table) => table.name.toLowerCase() === tableName.toLowerCase()
    ) || null
  );
}

/**
 * Get column suggestions based on FROM tables or selected database
 */
function getColumnSuggestions(
  context: SQLContext,
  dbStructure: Database[],
  range: monaco.IRange
): monaco.languages.CompletionItem[] {
  const columns: monaco.languages.CompletionItem[] = [];

  if (context.fromTables.length > 0) {
    // FROM clause present - show columns from referenced tables only
    for (const tableRef of context.fromTables) {
      const db = tableRef.database || context.selectedDatabase;
      const table = findTable(dbStructure, db, tableRef.table);

      if (table && db) {
        table.children.forEach((col) => {
          const label = tableRef.alias
            ? `${tableRef.alias}.${col.name}`
            : col.name;
          const detail = `${col.type} - ${db}.${tableRef.table}`;

          columns.push({
            label,
            kind: monaco.languages.CompletionItemKind.Field,
            insertText: col.name,
            detail,
            range,
          });
        });
      }
    }
  } else if (context.selectedDatabase) {
    // No FROM clause but database selected - show ALL columns from ALL tables
    const database = dbStructure.find(
      (db) =>
        db.name.toLowerCase() === context.selectedDatabase?.toLowerCase()
    );

    if (database) {
      for (const table of database.children) {
        table.children.forEach((col) => {
          columns.push({
            label: col.name,
            kind: monaco.languages.CompletionItemKind.Field,
            insertText: col.name,
            detail: `${col.type} - ${database.name}.${table.name}`,
            range,
          });
        });
      }
    }
  }

  return columns;
}

/**
 * Get table suggestions for a specific database
 */
function getTableSuggestions(
  databaseName: string,
  dbStructure: Database[],
  range: monaco.IRange
): monaco.languages.CompletionItem[] {
  const database = dbStructure.find(
    (db) => db.name.toLowerCase() === databaseName.toLowerCase()
  );

  if (!database) return [];

  return database.children.map((table) => ({
    label: table.name,
    kind: monaco.languages.CompletionItemKind.Struct,
    insertText: table.name,
    detail: `Table in ${database.name}`,
    range,
  }));
}

/**
 * Get database suggestions
 */
function getDatabaseSuggestions(
  dbStructure: Database[],
  range: monaco.IRange
): monaco.languages.CompletionItem[] {
  return dbStructure.map((database) => ({
    label: database.name,
    kind: monaco.languages.CompletionItemKind.Module,
    insertText: database.name,
    detail: 'Database',
    range,
  }));
}

/**
 * Get context-aware suggestions based on SQL clause type
 */
function getSuggestionsForContext(
  context: SQLContext,
  dbStructure: Database[],
  range: monaco.IRange,
  keywords: string[],
  functions: string[]
): monaco.languages.CompletionItem[] {
  const suggestions: monaco.languages.CompletionItem[] = [];

  switch (context.clauseType) {
    case 'SELECT':
    case 'WHERE':
    case 'GROUP_BY':
    case 'ORDER_BY':
    case 'HAVING': {
      // Show columns from tables or selected database
      const columnSuggestions = getColumnSuggestions(
        context,
        dbStructure,
        range
      );
      suggestions.push(...columnSuggestions);

      // Also show functions in SELECT clause
      if (context.clauseType === 'SELECT') {
        suggestions.push(
          {
            label: '*',
            kind: monaco.languages.CompletionItemKind.Keyword,
            insertText: '*',
            detail: 'All columns',
            range,
          },
          ...functions.map((func) => ({
            label: func,
            kind: monaco.languages.CompletionItemKind.Function,
            insertText: `${func}()`,
            range,
          }))
        );
      }

      // Show operators in WHERE/HAVING
      if (context.clauseType === 'WHERE' || context.clauseType === 'HAVING') {
        const operators = ['AND', 'OR', 'NOT', 'IN', 'LIKE', 'BETWEEN'];
        suggestions.push(
          ...operators.map((op) => ({
            label: op,
            kind: monaco.languages.CompletionItemKind.Operator,
            insertText: op,
            range,
          }))
        );
      }

      // Show ASC/DESC in ORDER BY
      if (context.clauseType === 'ORDER_BY') {
        suggestions.push(
          {
            label: 'ASC',
            kind: monaco.languages.CompletionItemKind.Keyword,
            insertText: 'ASC',
            range,
          },
          {
            label: 'DESC',
            kind: monaco.languages.CompletionItemKind.Keyword,
            insertText: 'DESC',
            range,
          }
        );
      }

      break;
    }

    case 'FROM':
    case 'JOIN': {
      if (context.isAfterDot && context.databasePrefix) {
        // After dot: show tables from the specified database
        suggestions.push(
          ...getTableSuggestions(context.databasePrefix, dbStructure, range)
        );
      } else {
        // No dot or before dot: show databases and tables
        suggestions.push(...getDatabaseSuggestions(dbStructure, range));

        // Also show tables from selected database if any
        if (context.selectedDatabase) {
          suggestions.push(
            ...getTableSuggestions(
              context.selectedDatabase,
              dbStructure,
              range
            )
          );
        }
      }
      break;
    }

    case 'INSERT':
    case 'UPDATE':
    case 'DELETE': {
      // Show databases and tables
      suggestions.push(...getDatabaseSuggestions(dbStructure, range));

      if (context.selectedDatabase) {
        suggestions.push(
          ...getTableSuggestions(context.selectedDatabase, dbStructure, range)
        );
      }
      break;
    }

    default: {
      // For unknown contexts, show everything
      suggestions.push(...getDatabaseSuggestions(dbStructure, range));

      if (context.selectedDatabase) {
        suggestions.push(
          ...getTableSuggestions(context.selectedDatabase, dbStructure, range)
        );
      }
      break;
    }
  }

  return suggestions;
}

// Initialize Monaco editor with ClickHouse SQL language features
export const initializeMonacoGlobally = async () => {
  if (isInitialized) return;

  ensureMonacoEnvironment();

  // Register the SQL language
  monaco.languages.register({ id: "sql" });

  // Set language configuration for SQL
  monaco.languages.setLanguageConfiguration("sql", {
    brackets: [
      ["(", ")"],
      ["[", "]"],
    ],
    autoClosingPairs: [
      { open: "(", close: ")" },
      { open: "[", close: "]" },
      { open: '"', close: '"' },
      { open: "'", close: "'" },
    ],
  });

  // Set monarch tokens provider for SQL syntax highlighting
  monaco.languages.setMonarchTokensProvider("sql", {
    keywords: [
      "SELECT",
      "FROM",
      "WHERE",
      "ORDER BY",
      "GROUP BY",
      "LIMIT",
      "JOIN",
      "INSERT",
      "UPDATE",
      "DELETE",
      "CREATE",
      "ALTER",
      "DROP",
      "TABLE",
      "INDEX",
      "VIEW",
      "TRIGGER",
      "PROCEDURE",
      "FUNCTION",
      "DATABASE",
    ],
    operators: [
      "=",
      ">",
      "<",
      "<=",
      ">=",
      "<>",
      "!=",
      "AND",
      "OR",
      "NOT",
      "LIKE",
      "IN",
      "BETWEEN",
    ],
    tokenizer: {
      root: [
        [
          /[a-zA-Z_]\w*/,
          { cases: { "@keywords": "keyword", "@default": "identifier" } },
        ],
        [/[<>!=]=?/, "operator"],
        [/[0-9]+/, "number"],
        [/"/, { token: "string.quote", bracket: "@open", next: "@string" }],
        [/'/, { token: "string.quote", bracket: "@open", next: "@string2" }],
        [/--.*$/, "comment"],
      ],
      string: [
        [/[^"]+/, "string"],
        [/"/, { token: "string.quote", bracket: "@close", next: "@pop" }],
      ],
      string2: [
        [/[^']+/, "string"],
        [/'/, { token: "string.quote", bracket: "@close", next: "@pop" }],
      ],
      comment: [
        [/[^-]+/, "comment"],
        [/--/, "comment"],
      ],
    },
  });

  // Register completion item provider for SQL
  monaco.languages.registerCompletionItemProvider("sql", {
    provideCompletionItems: async (model, position, context, token) => {
      try {
        // Early exit if cancelled
        if (token.isCancellationRequested) {
          return { suggestions: [] };
        }

        const word = model.getWordUntilPosition(position);
        const range = {
          startLineNumber: position.lineNumber,
          endLineNumber: position.lineNumber,
          startColumn: word.startColumn,
          endColumn: word.endColumn,
        };

        // Get selected database from app store
        const selectedDatabase = useAppStore.getState().selectedDatabase;

        // Parse SQL context using the new context-aware parser
        const cursorOffset = model.getOffsetAt(position);
        const sqlContext = parseSQLContext(
          model.getValue(),
          cursorOffset,
          selectedDatabase
        );

        // Fetch database structure, functions, and keywords
        const dbStructure = await getDatabasesTablesAndColumns();
        const clickHouseFunctionsArray = await getFunctions();
        const clickHouseKeywordsArray = await getKeywords();

        // Check cancellation after async calls
        if (token.isCancellationRequested) {
          return { suggestions: [] };
        }

        // Get context-aware suggestions
        const contextSuggestions = getSuggestionsForContext(
          sqlContext,
          dbStructure,
          range,
          clickHouseKeywordsArray,
          clickHouseFunctionsArray
        );

        // Add SQL keyword suggestions
        const keywordSuggestions = clickHouseKeywordsArray.map((keyword) => ({
          label: keyword,
          kind: monaco.languages.CompletionItemKind.Keyword,
          insertText: keyword,
          range: range,
        }));

        // Combine all suggestions
        const allSuggestions = [
          ...contextSuggestions,
          ...keywordSuggestions,
        ];

        // Remove duplicates based on label
        const uniqueSuggestions = Array.from(
          new Map(allSuggestions.map((s) => [s.label, s])).values()
        );

        return {
          suggestions: uniqueSuggestions,
        };
      } catch (error) {
        // Silently return empty on disposal/cancellation
        console.error('Monaco completion error:', error);
        return { suggestions: [] };
      }
    },
  });

  // Use sql formatter for formatting SQL code using import { format } from "sql-formatter";
  monaco.languages.registerDocumentFormattingEditProvider("sql", {
    provideDocumentFormattingEdits: (model) => {
      const formatted = format(model.getValue(), { language: "sql" });
      return [
        {
          range: model.getFullModelRange(),
          text: formatted,
        },
      ];
    },
  });

  isInitialized = true;
};

// Create a Monaco Editor instance
export const createMonacoEditor = (
  container: HTMLElement,
  theme: string
): monaco.editor.IStandaloneCodeEditor => {
  const editor = monaco.editor.create(container, {
    language: "sql",
    theme: theme || "vs-dark",
    automaticLayout: true,
    tabSize: 2,
    minimap: { enabled: false },
    padding: { top: 10 },
    suggestOnTriggerCharacters: true,
    quickSuggestions: true,
    wordBasedSuggestions: "off",
  });

  return editor;
};

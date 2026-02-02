/**
 * Centralized ClickHouse constants for autocomplete suggestions
 */

/**
 * ClickHouse table engines categorized by type
 */
export const CLICKHOUSE_ENGINES = {
  mergeTree: [
    'MergeTree',
    'ReplacingMergeTree',
    'SummingMergeTree',
    'AggregatingMergeTree',
    'CollapsingMergeTree',
    'VersionedCollapsingMergeTree',
    'GraphiteMergeTree',
  ],
  replicated: [
    'ReplicatedMergeTree',
    'ReplicatedReplacingMergeTree',
    'ReplicatedSummingMergeTree',
    'ReplicatedAggregatingMergeTree',
    'ReplicatedCollapsingMergeTree',
    'ReplicatedVersionedCollapsingMergeTree',
    'ReplicatedGraphiteMergeTree',
  ],
  log: ['Log', 'StripeLog', 'TinyLog'],
  special: ['Memory', 'Buffer', 'Null', 'Set', 'Join', 'Dictionary', 'Merge', 'Distributed'],
  integration: [
    'Kafka',
    'RabbitMQ',
    'MySQL',
    'PostgreSQL',
    'MongoDB',
    'Redis',
    'S3',
    'URL',
    'File',
    'HDFS',
    'JDBC',
    'ODBC',
  ],
};

/**
 * DDL keywords for CREATE TABLE context
 */
export const DDL_TABLE_KEYWORDS = [
  'IF NOT EXISTS',
  'ON CLUSTER',
  'ENGINE',
  'ORDER BY',
  'PARTITION BY',
  'PRIMARY KEY',
  'SAMPLE BY',
  'TTL',
  'SETTINGS',
  'COMMENT',
];

/**
 * DDL keywords for CREATE VIEW/MATERIALIZED VIEW
 */
export const DDL_VIEW_KEYWORDS = [
  'IF NOT EXISTS',
  'ON CLUSTER',
  'TO',
  'ENGINE',
  'POPULATE',
  'AS',
];

/**
 * ClickHouse data types
 */
export const CLICKHOUSE_TYPES = [
  // Integer types
  'UInt8',
  'UInt16',
  'UInt32',
  'UInt64',
  'UInt128',
  'UInt256',
  'Int8',
  'Int16',
  'Int32',
  'Int64',
  'Int128',
  'Int256',

  // Float types
  'Float32',
  'Float64',

  // Decimal types
  'Decimal',
  'Decimal32',
  'Decimal64',
  'Decimal128',
  'Decimal256',

  // String types
  'String',
  'FixedString',

  // Date/Time types
  'Date',
  'Date32',
  'DateTime',
  'DateTime64',

  // Boolean
  'Bool',

  // UUID
  'UUID',

  // IPv4/IPv6
  'IPv4',
  'IPv6',

  // Complex types
  'Array',
  'Tuple',
  'Map',
  'Nested',

  // Special wrappers
  'Nullable',
  'LowCardinality',
  'Enum',
  'Enum8',
  'Enum16',
];

/**
 * DDL object types
 */
export const DDL_OBJECTS = [
  'TABLE',
  'VIEW',
  'MATERIALIZED VIEW',
  'DATABASE',
  'DICTIONARY',
  'USER',
  'ROLE',
  'QUOTA',
  'SETTINGS PROFILE',
  'ROW POLICY',
];

/**
 * Get all engines as a flat array
 */
export function getAllEngines(): string[] {
  return Object.values(CLICKHOUSE_ENGINES).flat();
}

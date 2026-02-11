/**
 * Formats elapsed time in seconds to a human-readable string with 2 decimal places.
 * @param seconds - The elapsed time in seconds
 * @returns Formatted string (e.g., "2.34s")
 */
export function formatElapsedTime(seconds: number): string {
  if (!Number.isFinite(seconds) || seconds < 0) {
    return '0.00s';
  }
  return `${seconds.toFixed(2)}s`;
}

/**
 * Formats row count to a human-readable string with appropriate suffix.
 * @param count - The number of rows
 * @returns Formatted string (e.g., "1.2K rows", "1 row")
 */
export function formatRowCount(count: number): string {
  if (!Number.isFinite(count) || count < 0) {
    return '0 rows';
  }

  const absCount = Math.floor(count);

  if (absCount === 1) {
    return '1 row';
  }

  if (absCount < 1000) {
    return `${absCount} rows`;
  }

  const units = [
    { value: 1e12, suffix: 'T' },
    { value: 1e9, suffix: 'B' },
    { value: 1e6, suffix: 'M' },
    { value: 1e3, suffix: 'K' }
  ];

  for (const { value, suffix } of units) {
    if (absCount >= value) {
      const formatted = (absCount / value).toFixed(1);
      return `${formatted}${suffix} rows`;
    }
  }

  return `${absCount} rows`;
}

/**
 * Formats bytes to a human-readable string with appropriate suffix.
 * @param bytes - The number of bytes
 * @returns Formatted string (e.g., "512KB", "1.5MB")
 */
export function formatBytes(bytes: number): string {
  if (!Number.isFinite(bytes) || bytes < 0) {
    return '0B';
  }

  const absBytes = Math.floor(bytes);

  if (absBytes < 1024) {
    return `${absBytes}B`;
  }

  const units = [
    { value: 1024 ** 5, suffix: 'PB' },
    { value: 1024 ** 4, suffix: 'TB' },
    { value: 1024 ** 3, suffix: 'GB' },
    { value: 1024 ** 2, suffix: 'MB' },
    { value: 1024, suffix: 'KB' }
  ];

  for (const { value, suffix } of units) {
    if (absBytes >= value) {
      const formatted = (absBytes / value).toFixed(1);
      return `${formatted}${suffix}`;
    }
  }

  return `${absBytes}B`;
}

import { formatElapsedTime, formatRowCount, formatBytes } from './statistics';

describe('formatElapsedTime', () => {
  it('formats seconds with 2 decimal places', () => {
    expect(formatElapsedTime(2.3456)).toBe('2.35s');
    expect(formatElapsedTime(0.1234)).toBe('0.12s');
    expect(formatElapsedTime(10.999)).toBe('11.00s');
  });

  it('handles zero', () => {
    expect(formatElapsedTime(0)).toBe('0.00s');
  });

  it('handles very small numbers', () => {
    expect(formatElapsedTime(0.001)).toBe('0.00s');
    expect(formatElapsedTime(0.009)).toBe('0.01s');
  });

  it('handles large numbers', () => {
    expect(formatElapsedTime(60.5)).toBe('60.50s');
    expect(formatElapsedTime(123.456)).toBe('123.46s');
    expect(formatElapsedTime(9999.99)).toBe('9999.99s');
  });

  it('handles negative numbers as zero', () => {
    expect(formatElapsedTime(-1)).toBe('0.00s');
    expect(formatElapsedTime(-100.5)).toBe('0.00s');
  });

  it('handles edge cases', () => {
    expect(formatElapsedTime(NaN)).toBe('0.00s');
    expect(formatElapsedTime(Infinity)).toBe('0.00s');
    expect(formatElapsedTime(-Infinity)).toBe('0.00s');
  });
});

describe('formatRowCount', () => {
  it('formats small numbers without abbreviation', () => {
    expect(formatRowCount(0)).toBe('0 rows');
    expect(formatRowCount(1)).toBe('1 row');
    expect(formatRowCount(999)).toBe('999 rows');
  });

  it('formats thousands with K suffix', () => {
    expect(formatRowCount(1000)).toBe('1.0K rows');
    expect(formatRowCount(1234)).toBe('1.2K rows');
    expect(formatRowCount(9999)).toBe('10.0K rows');
    expect(formatRowCount(99999)).toBe('100.0K rows');
  });

  it('formats millions with M suffix', () => {
    expect(formatRowCount(1000000)).toBe('1.0M rows');
    expect(formatRowCount(1234567)).toBe('1.2M rows');
    expect(formatRowCount(9999999)).toBe('10.0M rows');
    expect(formatRowCount(99999999)).toBe('100.0M rows');
  });

  it('formats billions with B suffix', () => {
    expect(formatRowCount(1000000000)).toBe('1.0B rows');
    expect(formatRowCount(1234567890)).toBe('1.2B rows');
    expect(formatRowCount(9999999999)).toBe('10.0B rows');
  });

  it('formats trillions with T suffix', () => {
    expect(formatRowCount(1000000000000)).toBe('1.0T rows');
    expect(formatRowCount(1234567890123)).toBe('1.2T rows');
  });

  it('handles negative numbers as zero', () => {
    expect(formatRowCount(-1)).toBe('0 rows');
    expect(formatRowCount(-1000)).toBe('0 rows');
  });

  it('handles edge cases', () => {
    expect(formatRowCount(NaN)).toBe('0 rows');
    expect(formatRowCount(Infinity)).toBe('0 rows');
    expect(formatRowCount(-Infinity)).toBe('0 rows');
  });

  it('uses singular form for 1 row', () => {
    expect(formatRowCount(1)).toBe('1 row');
    expect(formatRowCount(1.4)).toBe('1 row');
  });

  it('handles decimal values smaller than 1000', () => {
    expect(formatRowCount(100.5)).toBe('100 rows');
    expect(formatRowCount(500.9)).toBe('500 rows');
  });

  it('handles decimal values at unit boundaries', () => {
    expect(formatRowCount(999.9)).toBe('999 rows');
    expect(formatRowCount(1000.1)).toBe('1.0K rows');
  });

  it('handles decimal values in larger units', () => {
    expect(formatRowCount(1000000.5)).toBe('1.0M rows');
    expect(formatRowCount(1000000000.5)).toBe('1.0B rows');
    expect(formatRowCount(1000000000000.5)).toBe('1.0T rows');
  });
});

describe('formatBytes', () => {
  it('formats bytes without suffix for small numbers', () => {
    expect(formatBytes(0)).toBe('0B');
    expect(formatBytes(1)).toBe('1B');
    expect(formatBytes(999)).toBe('999B');
  });

  it('formats kilobytes with KB suffix', () => {
    expect(formatBytes(1024)).toBe('1.0KB');
    expect(formatBytes(1536)).toBe('1.5KB');
    expect(formatBytes(10240)).toBe('10.0KB');
    expect(formatBytes(102400)).toBe('100.0KB');
  });

  it('formats megabytes with MB suffix', () => {
    expect(formatBytes(1048576)).toBe('1.0MB');
    expect(formatBytes(1572864)).toBe('1.5MB');
    expect(formatBytes(10485760)).toBe('10.0MB');
    expect(formatBytes(104857600)).toBe('100.0MB');
  });

  it('formats gigabytes with GB suffix', () => {
    expect(formatBytes(1073741824)).toBe('1.0GB');
    expect(formatBytes(1610612736)).toBe('1.5GB');
    expect(formatBytes(10737418240)).toBe('10.0GB');
  });

  it('formats terabytes with TB suffix', () => {
    expect(formatBytes(1099511627776)).toBe('1.0TB');
    expect(formatBytes(1649267441664)).toBe('1.5TB');
  });

  it('formats petabytes with PB suffix', () => {
    expect(formatBytes(1125899906842624)).toBe('1.0PB');
  });

  it('handles negative numbers as zero', () => {
    expect(formatBytes(-1)).toBe('0B');
    expect(formatBytes(-1024)).toBe('0B');
  });

  it('handles edge cases', () => {
    expect(formatBytes(NaN)).toBe('0B');
    expect(formatBytes(Infinity)).toBe('0B');
    expect(formatBytes(-Infinity)).toBe('0B');
  });

  it('rounds to 1 decimal place', () => {
    expect(formatBytes(1536)).toBe('1.5KB');
    expect(formatBytes(1638)).toBe('1.6KB');
    expect(formatBytes(1740)).toBe('1.7KB');
  });

  it('handles decimal byte values less than 1024', () => {
    expect(formatBytes(500.5)).toBe('500B');
    expect(formatBytes(1023.9)).toBe('1023B');
  });

  it('handles decimal byte values at unit boundaries', () => {
    expect(formatBytes(1023.5)).toBe('1023B');
    expect(formatBytes(1024.1)).toBe('1.0KB');
  });

  it('handles very large file sizes', () => {
    expect(formatBytes(1024 ** 5)).toBe('1.0PB');
    expect(formatBytes(1024 ** 5 * 1.5)).toBe('1.5PB');
  });
});

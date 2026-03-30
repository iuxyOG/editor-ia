import { describe, it, expect } from 'vitest';
import { formatTime, formatFileSize, formatDuration } from '@/utils/format';

describe('formatTime', () => {
  it('formats 0 seconds', () => {
    expect(formatTime(0)).toBe('00:00');
  });

  it('formats seconds only', () => {
    expect(formatTime(45)).toBe('00:45');
  });

  it('formats minutes and seconds', () => {
    expect(formatTime(125)).toBe('02:05');
  });

  it('formats exact minutes', () => {
    expect(formatTime(60)).toBe('01:00');
  });

  it('handles decimal seconds', () => {
    expect(formatTime(90.7)).toBe('01:30');
  });
});

describe('formatFileSize', () => {
  it('formats bytes', () => {
    expect(formatFileSize(500)).toBe('500 B');
  });

  it('formats kilobytes', () => {
    expect(formatFileSize(1024)).toBe('1.0 KB');
  });

  it('formats megabytes', () => {
    expect(formatFileSize(5 * 1024 * 1024)).toBe('5.0 MB');
  });

  it('formats gigabytes', () => {
    expect(formatFileSize(2 * 1024 * 1024 * 1024)).toBe('2.0 GB');
  });
});

describe('formatDuration', () => {
  it('formats seconds only', () => {
    expect(formatDuration(30)).toBe('30s');
  });

  it('formats minutes and seconds', () => {
    expect(formatDuration(150)).toBe('2m 30s');
  });

  it('formats zero', () => {
    expect(formatDuration(0)).toBe('0s');
  });
});

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { getTodayDateStr } from '../src/lib/utils';

describe('getTodayDateStr', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('returns the correct date string for New York (UTC-5)', () => {
    // 2024-03-01 02:00:00 UTC is 2024-02-29 21:00:00 EST (Leap year)
    const date = new Date('2024-03-01T02:00:00Z');
    vi.setSystemTime(date);
    
    expect(getTodayDateStr('America/New_York')).toBe('2024-02-29');
  });

  it('returns the correct date string for Tokyo (UTC+9)', () => {
    // 2024-02-28 21:00:00 UTC is 2024-02-29 06:00:00 JST
    const date = new Date('2024-02-28T21:00:00Z');
    vi.setSystemTime(date);
    
    expect(getTodayDateStr('Asia/Tokyo')).toBe('2024-02-29');
  });

  it('handles crossing midnight correctly', () => {
    // 2024-12-31 23:30:00 UTC
    const date = new Date('2024-12-31T23:30:00Z');
    vi.setSystemTime(date);
    
    // London is UTC (or UTC+1 in summer, but Dec 31 is GMT)
    expect(getTodayDateStr('Europe/London')).toBe('2024-12-31');
    
    // Tokyo is UTC+9, so it should be Jan 1st
    expect(getTodayDateStr('Asia/Tokyo')).toBe('2025-01-01');
    
    // New York is UTC-5, so it should be Dec 31st
    expect(getTodayDateStr('America/New_York')).toBe('2024-12-31');
  });

  it('returns the correct date string for UTC', () => {
    const date = new Date('2024-05-15T12:00:00Z');
    vi.setSystemTime(date);
    
    expect(getTodayDateStr('UTC')).toBe('2024-05-15');
  });
});

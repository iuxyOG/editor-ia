import { describe, it, expect } from 'vitest';
import { generateMockTranscription, generateMockAnalysis } from '@/lib/mockData';

describe('generateMockTranscription', () => {
  it('generates transcription with correct duration', () => {
    const result = generateMockTranscription(120);
    expect(result.duration).toBe(120);
    expect(result.language).toBe('pt');
  });

  it('generates segments and words', () => {
    const result = generateMockTranscription(60);
    expect(result.segments.length).toBeGreaterThan(0);
    expect(result.words.length).toBeGreaterThan(0);
    expect(result.text.length).toBeGreaterThan(0);
  });

  it('segments cover the full duration', () => {
    const duration = 180;
    const result = generateMockTranscription(duration);
    const lastSeg = result.segments[result.segments.length - 1];
    expect(lastSeg.end).toBeCloseTo(duration, 0);
  });

  it('words have valid timestamps', () => {
    const result = generateMockTranscription(60);
    for (const word of result.words) {
      expect(word.start).toBeLessThanOrEqual(word.end);
      expect(word.text.length).toBeGreaterThan(0);
    }
  });
});

describe('generateMockAnalysis', () => {
  it('generates segments for duration', () => {
    const result = generateMockAnalysis(180);
    expect(result.segments.length).toBeGreaterThanOrEqual(3);
  });

  it('generates illustrations', () => {
    const result = generateMockAnalysis(180);
    expect(result.illustrations.length).toBeGreaterThan(0);
  });

  it('generates highlights', () => {
    const result = generateMockAnalysis(180);
    expect(result.highlights.length).toBeGreaterThan(0);
  });

  it('segments have valid structure', () => {
    const result = generateMockAnalysis(120);
    for (const seg of result.segments) {
      expect(seg.id).toBeTruthy();
      expect(seg.title).toBeTruthy();
      expect(seg.start).toBeLessThan(seg.end);
      expect(seg.status).toBe('completed');
    }
  });

  it('illustrations reference valid segments', () => {
    const result = generateMockAnalysis(180);
    const segIds = new Set(result.segments.map((s) => s.id));
    for (const ill of result.illustrations) {
      expect(segIds.has(ill.segmentId)).toBe(true);
    }
  });
});

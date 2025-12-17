
import {
  formatNumber,
  formatWeight,
  formatMacros,
  formatPercentage,
  formatSetNotation,
  truncateText,
} from '../formatting';

describe('Formatting Utilities', () => {
  describe('formatNumber', () => {
    it('formats integer numbers without commas for small numbers', () => {
      expect(formatNumber(100)).toBe('100');
    });

    it('formats large numbers with commas', () => {
      expect(formatNumber(1000)).toBe('1,000');
      expect(formatNumber(1000000)).toBe('1,000,000');
    });

    it('formats decimal numbers with specified precision', () => {
      expect(formatNumber(100.5, 1)).toBe('100.5');
      expect(formatNumber(100.123, 2)).toBe('100.12');
    });

    it('handles zero', () => {
      expect(formatNumber(0)).toBe('0');
    });

    it('handles negative numbers', () => {
      expect(formatNumber(-1000)).toBe('-1,000');
    });

    it('default decimals is 0', () => {
      expect(formatNumber(100.999)).toBe('101');
    });
  });

  describe('formatWeight', () => {
    it('formats weight with kg unit', () => {
      expect(formatWeight(75, 'kg')).toBe('75.0 kg');
    });

    it('formats weight with lb unit', () => {
      expect(formatWeight(165, 'lb')).toBe('165.0 lb');
    });

    it('formats decimal weights to one decimal place', () => {
      expect(formatWeight(75.5, 'kg')).toBe('75.5 kg');
    });

    it('handles zero weight', () => {
      expect(formatWeight(0, 'kg')).toBe('0.0 kg');
    });

    it('rounds to one decimal place', () => {
      expect(formatWeight(75.456, 'kg')).toBe('75.5 kg');
    });
  });

  describe('formatMacros', () => {
    it('formats macros with protein, carbs, and fat', () => {
      expect(formatMacros(150, 200, 50)).toBe('P: 150g | C: 200g | F: 50g');
    });

    it('handles zero values', () => {
      expect(formatMacros(0, 0, 0)).toBe('P: 0g | C: 0g | F: 0g');
    });

    it('handles decimal values', () => {
      expect(formatMacros(150.5, 200.3, 50.8)).toBe('P: 150.5g | C: 200.3g | F: 50.8g');
    });
  });

  describe('formatPercentage', () => {
    it('formats percentage as integer', () => {
      expect(formatPercentage(75.6)).toBe('76%');
    });

    it('handles zero', () => {
      expect(formatPercentage(0)).toBe('0%');
    });

    it('rounds to nearest integer', () => {
      expect(formatPercentage(45.4)).toBe('45%');
      expect(formatPercentage(45.5)).toBe('46%');
    });
  });

  describe('formatSetNotation', () => {
    it('formats sets and reps', () => {
      expect(formatSetNotation(3, 10)).toBe('3x10');
    });

    it('handles string reps', () => {
      expect(formatSetNotation(3, 'failure')).toBe('3xfailure');
    });

    it('handles single set', () => {
      expect(formatSetNotation(1, 15)).toBe('1x15');
    });
  });

  describe('truncateText', () => {
    it('returns text as is if shorter than max length', () => {
      expect(truncateText('Hello', 10)).toBe('Hello');
    });

    it('truncates text longer than max length', () => {
      expect(truncateText('Hello World', 8)).toBe('Hello...');
    });

    it('handles exact length', () => {
      expect(truncateText('Hello', 5)).toBe('Hello');
    });

    it('truncates with ellipsis', () => {
      expect(truncateText('This is a very long text', 10)).toBe('This is...');
    });
  });
});

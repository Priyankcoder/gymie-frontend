
import {
  formatDate,
  getTodayString,
  getGreeting,
  formatTime,
  isToday,
  formatRelativeDate,
} from '../date';

describe('Date Utilities', () => {
  describe('formatDate', () => {
    it('formats date correctly', () => {
      const date = new Date('2025-12-18');
      const result = formatDate(date);
      expect(result).toMatch(/Dec|December/);
      expect(result).toContain('18');
    });

    it('handles invalid dates', () => {
      const invalidDate = new Date('invalid');
      expect(() => formatDate(invalidDate)).not.toThrow();
    });
  });

  describe('getTodayString', () => {
    it('returns ISO date string', () => {
      const result = getTodayString();
      expect(result).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    });

    it('returns current date', () => {
      const today = new Date();
      const expected = today.toISOString().split('T')[0];
      expect(getTodayString()).toBe(expected);
    });
  });

  describe('getGreeting', () => {
    beforeEach(() => {
      jest.clearAllMocks();
    });

    it('returns Good Morning before noon', () => {
      jest.spyOn(Date.prototype, 'getHours').mockReturnValue(10);
      expect(getGreeting()).toBe('Good Morning');
    });

    it('returns Good Afternoon between noon and 6pm', () => {
      jest.spyOn(Date.prototype, 'getHours').mockReturnValue(14);
      expect(getGreeting()).toBe('Good Afternoon');
    });

    it('returns Good Evening after 6pm', () => {
      jest.spyOn(Date.prototype, 'getHours').mockReturnValue(19);
      expect(getGreeting()).toBe('Good Evening');
    });

    it('returns Good Morning at midnight', () => {
      jest.spyOn(Date.prototype, 'getHours').mockReturnValue(0);
      expect(getGreeting()).toBe('Good Morning');
    });

    it('returns Good Afternoon at exactly noon', () => {
      jest.spyOn(Date.prototype, 'getHours').mockReturnValue(12);
      expect(getGreeting()).toBe('Good Afternoon');
    });

    it('returns Good Evening at exactly 6pm', () => {
      jest.spyOn(Date.prototype, 'getHours').mockReturnValue(18);
      expect(getGreeting()).toBe('Good Evening');
    });
  });

  describe('formatTime', () => {
    it('formats zero milliseconds', () => {
      expect(formatTime(0)).toBe('00:00.00');
    });

    it('formats seconds correctly', () => {
      expect(formatTime(1500)).toBe('00:01.50');
    });

    it('formats minutes correctly', () => {
      expect(formatTime(61500)).toBe('01:01.50');
    });

    it('formats hours correctly', () => {
      expect(formatTime(3661500)).toBe('61:01.50');
    });

    it('pads single digits', () => {
      expect(formatTime(5000)).toBe('00:05.00');
    });
  });

  describe('isToday', () => {
    it('returns true for today', () => {
      const today = new Date().toISOString().split('T')[0];
      expect(isToday(today)).toBe(true);
    });

    it('returns false for yesterday', () => {
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);
      const yesterdayStr = yesterday.toISOString().split('T')[0];
      expect(isToday(yesterdayStr)).toBe(false);
    });

    it('returns false for tomorrow', () => {
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      const tomorrowStr = tomorrow.toISOString().split('T')[0];
      expect(isToday(tomorrowStr)).toBe(false);
    });

    it('returns false for old dates', () => {
      expect(isToday('2020-01-01')).toBe(false);
    });
  });

  describe('formatRelativeDate', () => {
    it('returns "Today" for current date', () => {
      const today = getTodayString();
      expect(formatRelativeDate(today)).toBe('Today');
    });

    it('returns "Yesterday" for previous day', () => {
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);
      const yesterdayStr = yesterday.toISOString().split('T')[0];
      expect(formatRelativeDate(yesterdayStr)).toBe('Yesterday');
    });

    it('returns formatted date for older dates', () => {
      const oldDate = '2025-01-15';
      const result = formatRelativeDate(oldDate);
      expect(result).not.toBe('Today');
      expect(result).not.toBe('Yesterday');
      expect(result.length).toBeGreaterThan(0);
    });
  });
});

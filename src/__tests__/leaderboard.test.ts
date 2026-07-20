import { describe, it, expect } from 'vitest';

// Local scoring simulation matching updated app/actions/leaderboard.ts
function calculateAttendanceScore(presentDays: number): number {
  const presentRate = Math.min(presentDays / 22, 1);
  return Math.round(presentRate * 50 * 10) / 10;
}

function calculatePunctualityScore(earlyCount: number, lateInCount: number, lateOutCount: number): number {
  const points = (earlyCount * 2) - (lateInCount * 2) + (lateOutCount * 3);
  return Math.max(0, Math.min(points, 50));
}

describe('Simplified Leaderboard Performance Scoring Engine', () => {
  describe('Attendance Score (Max 50 pts)', () => {
    it('should award full 50 points for 22 or more present days', () => {
      expect(calculateAttendanceScore(22)).toBe(50);
      expect(calculateAttendanceScore(25)).toBe(50);
    });

    it('should scale down points proportionally for fewer workdays present', () => {
      expect(calculateAttendanceScore(11)).toBe(25);
      expect(calculateAttendanceScore(0)).toBe(0);
    });
  });

  describe('Punctuality & Overtime Score (Max 50 pts, Min 0 pts)', () => {
    it('should award +2 points for early arrivals', () => {
      expect(calculatePunctualityScore(5, 0, 0)).toBe(10);
    });

    it('should deduct -2 points for late check-ins', () => {
      expect(calculatePunctualityScore(5, 2, 0)).toBe(6);
    });

    it('should award +3 points for late check-outs (overtime)', () => {
      expect(calculatePunctualityScore(0, 0, 4)).toBe(12);
      expect(calculatePunctualityScore(5, 1, 3)).toBe(17); // (5*2) - (1*2) + (3*3) = 10 - 2 + 9 = 17
    });

    it('should cap score between 0 and 50 points', () => {
      expect(calculatePunctualityScore(0, 5, 0)).toBe(0); // floor capped at 0
      expect(calculatePunctualityScore(30, 0, 10)).toBe(50); // ceiling capped at 50
    });
  });

  describe('Total Performance Score Calculation', () => {
    it('should aggregate Attendance and Punctuality correctly (Max 100)', () => {
      const att = calculateAttendanceScore(22); // 50
      const punc = calculatePunctualityScore(5, 1, 3); // 17
      const total = att + punc;
      expect(total).toBe(67);
    });
  });
});

/**
 * Utility functions for expense calculations
 */

import { Split } from '../types';

/**
 * Calculate equal splits with proper penny allocation
 * Distributes remaining pennies one by one to avoid rounding errors
 */
export const calculateEqualSplit = (total: number, participantCount: number): number[] => {
  if (participantCount === 0) return [];

  // Work in cents to avoid float issues
  const totalCents = Math.round(total * 100);
  const baseShareCents = Math.floor(totalCents / participantCount);
  let remainderCents = totalCents % participantCount;

  const shares: number[] = [];
  for (let i = 0; i < participantCount; i++) {
    let myShareCents = baseShareCents;
    // Distribute remainder penny by penny
    if (remainderCents > 0) {
      myShareCents += 1;
      remainderCents--;
    }
    shares.push(myShareCents / 100);
  }

  return shares;
};

/**
 * Validate that custom split amounts sum up to the total
 * Allows 1 cent drift due to potential float entry
 */
export const validateCustomSplit = (splits: Split[], total: number): boolean => {
  const sum = splits.reduce((acc, split) => acc + split.amount, 0);
  return Math.abs(sum - total) <= 0.01;
};

/**
 * Calculate the remaining amount for custom splits
 */
export const calculateRemaining = (currentSum: number, total: number): number => {
  return total - currentSum;
};

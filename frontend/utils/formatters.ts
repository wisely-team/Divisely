/**
 * Utility functions for formatting data
 */

/**
 * Format a number as currency (USD)
 */
export const formatCurrency = (amount: number): string => {
  return `$${amount.toFixed(2)}`;
};

/**
 * Format a date string to a readable format
 */
export const formatDate = (dateString: string): string => {
  const date = new Date(dateString);
  return date.toLocaleDateString();
};

/**
 * Get initials from a name
 */
export const getInitials = (name: string): string => {
  return name
    .split(' ')
    .map(n => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);
};

/**
 * Get first name from full name
 */
export const getFirstName = (name: string): string => {
  return name.split(' ')[0];
};

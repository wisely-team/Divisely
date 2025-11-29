/**
 * Application constants
 */

// Chart colors for category pie chart
export const CHART_COLORS = ['#8b5cf6', '#ec4899', '#f59e0b', '#10b981', '#6366f1'];

// Expense categories
export const EXPENSE_CATEGORIES = [
  'Food',
  'Transport',
  'Accommodation',
  'Entertainment',
  'Shopping',
  'Other'
] as const;

// Interactive graph settings
export const GRAPH_CONFIG = {
  width: 500,
  height: 350,
  nodeRadius: 120,
  minZoom: 0.5,
  maxZoom: 3,
  zoomSpeed: 0.001
};

export interface User {
  id: string;
  name: string;
  username?: string;
  email: string;
  avatar?: string;
}

export interface GroupMember {
  userId: string;
  username: string;
  displayName: string;
  email?: string;
}

export interface Group {
  id: string;
  name: string;
  description?: string;
  ownerId: string; // ID of the user who owns/created the group
  members: string[]; // Array of User IDs
  currency: string;
  created_at: string;
}

export interface Split {
  userId: string;
  amount: number;
}

export interface Expense {
  id: string;
  groupId: string;
  payerId: string;
  description: string;
  amount: number;
  date: string;
  createdAt?: string;
  splits: Split[];
  splitType: 'EQUAL' | 'CUSTOM' | 'PERCENTAGE';
  myShare?: number;
  isBorrow?: boolean;
}

export interface Balance {
  from: string; // User ID who owes
  to: string;   // User ID who is owed
  amount: number;
}

export interface Settlement {
  id: string;
  groupId: string;
  fromUserId: string;
  toUserId: string;
  amount: number;
  description?: string;
  note?: string;
  settledAt?: string;
  createdAt?: string;
}
// For sidebar quick group list
export interface GroupSummary {
  id: string;
  name: string;
  memberCount?: number; // Number of members in the group
  unreadCount?: number; // Number of new expenses/activities
  lastActivity?: string;
}

// For sidebar balance widget
export interface UserBalance {
  totalOwed: number; // Total amount others owe to you
  totalDebt: number; // Total amount you owe to others
  netBalance: number; // totalOwed - totalDebt
}

// For the UI context
export interface AppState {
  currentUser: User | null;
  users: User[];
  groups: Group[];
  expenses: Expense[];
  settlements?: Settlement[];
}

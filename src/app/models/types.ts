export interface User {
  id: string;
  name: string;
  email: string;
  role: string;
}

export interface WorkItem {
  id: string;
  title: string;
  description: string;
  isRelevant: boolean;
  dueDate: string; // Formato YYYY-MM-DD
  assignedUserId: string | null;
  status: 'Pending' | 'Assigned' | 'Completed';
}

export interface AssignmentLog {
  id: string;
  timestamp: Date;
  workItemId: string;
  workItemTitle: string;
  assignedUserId: string | null;
  assignedUserName: string | null;
  ruleApplied: string;
  details: string;
}

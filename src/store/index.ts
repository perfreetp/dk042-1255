import { create } from 'zustand';
import type {
  CheckTask,
  DataField,
  DataStandard,
  Issue,
  RectificationTask,
  StandardCategory,
  RectificationStatus,
} from '@/types';
import {
  mockCheckTasks,
  mockDataFields,
  mockDataStandards,
  mockIssues,
  mockRectificationTasks,
  mockStandardCategories,
} from '@/data/mockData';

interface AppState {
  checkTasks: CheckTask[];
  dataFields: DataField[];
  dataStandards: DataStandard[];
  issues: Issue[];
  rectificationTasks: RectificationTask[];
  standardCategories: StandardCategory[];
  currentTaskId: string;
  selectedIssueIds: string[];
  setCurrentTaskId: (taskId: string) => void;
  toggleIssueSelection: (issueId: string) => void;
  clearIssueSelection: () => void;
  markIssueFalsePositive: (issueId: string) => void;
  batchMarkFalsePositive: (issueIds: string[]) => void;
  confirmFieldMatch: (fieldId: string, confirmed: boolean) => void;
  updateRectificationStatus: (rectId: string, status: RectificationStatus) => void;
  createRectificationTask: (
    issueId: string,
    assignee: string,
    deadline: string,
    priority: 'high' | 'medium' | 'low',
  ) => void;
}

export const useAppStore = create<AppState>((set) => ({
  checkTasks: mockCheckTasks,
  dataFields: mockDataFields,
  dataStandards: mockDataStandards,
  issues: mockIssues,
  rectificationTasks: mockRectificationTasks,
  standardCategories: mockStandardCategories,
  currentTaskId: mockCheckTasks[0]?.id ?? '',
  selectedIssueIds: [],

  setCurrentTaskId: (taskId) => set({ currentTaskId: taskId }),

  toggleIssueSelection: (issueId) =>
    set((state) => ({
      selectedIssueIds: state.selectedIssueIds.includes(issueId)
        ? state.selectedIssueIds.filter((id) => id !== issueId)
        : [...state.selectedIssueIds, issueId],
    })),

  clearIssueSelection: () => set({ selectedIssueIds: [] }),

  markIssueFalsePositive: (issueId) =>
    set((state) => ({
      issues: state.issues.map((issue) =>
        issue.id === issueId ? { ...issue, status: 'falsepositive' } : issue,
      ),
    })),

  batchMarkFalsePositive: (issueIds) =>
    set((state) => ({
      issues: state.issues.map((issue) =>
        issueIds.includes(issue.id) ? { ...issue, status: 'falsepositive' } : issue,
      ),
      selectedIssueIds: [],
    })),

  confirmFieldMatch: (fieldId, confirmed) =>
    set((state) => ({
      dataFields: state.dataFields.map((field) =>
        field.id === fieldId
          ? { ...field, matchStatus: confirmed ? 'confirmed' : 'rejected' }
          : field,
      ),
    })),

  updateRectificationStatus: (rectId, status) =>
    set((state) => ({
      rectificationTasks: state.rectificationTasks.map((task) =>
        task.id === rectId ? { ...task, status } : task,
      ),
    })),

  createRectificationTask: (issueId, assignee, deadline, priority) =>
    set((state) => {
      const issue = state.issues.find((i) => i.id === issueId);
      const newTask: RectificationTask = {
        id: `rect-${Date.now()}`,
        issueId,
        issueDescription: issue?.description ?? '',
        assignee,
        assigneeAvatar: assignee.slice(0, 2).toUpperCase(),
        deadline,
        status: 'pending',
        createdAt: new Date().toISOString().split('T')[0],
        priority,
        fieldName: issue?.fieldName,
      };
      const updatedIssues = state.issues.map((i) =>
        i.id === issueId ? { ...i, status: 'rectifying' as const } : i,
      );
      return {
        rectificationTasks: [...state.rectificationTasks, newTask],
        issues: updatedIssues,
      };
    }),
}));

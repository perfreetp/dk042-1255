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

  confirmFieldMatch: (fieldId: string, confirmed: boolean, standardId?: string) => void;

  submitRectification: (rectId: string, result: string) => void;
  approveRectification: (rectId: string) => void;
  rejectRectification: (rectId: string) => void;
  updateRectificationStatus: (rectId: string, status: RectificationStatus) => void;
  createRectificationTask: (
    issueId: string,
    assignee: string,
    deadline: string,
    priority: 'high' | 'medium' | 'low',
  ) => void;

  addCheckTask: (task: Omit<CheckTask, 'id' | 'createdAt' | 'progress' | 'issueCount'> & { id?: string }) => string;
}

export const useAppStore = create<AppState>((set, get) => ({
  checkTasks: mockCheckTasks,
  dataFields: mockDataFields,
  dataStandards: mockDataStandards,
  issues: mockIssues,
  rectificationTasks: mockRectificationTasks,
  standardCategories: mockStandardCategories,
  currentTaskId: mockCheckTasks[1]?.id ?? mockCheckTasks[0]?.id ?? '',
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

  confirmFieldMatch: (fieldId, confirmed, standardId) =>
    set((state) => ({
      dataFields: state.dataFields.map((field) => {
        if (field.id !== fieldId) return field;
        const updates: Partial<DataField> = {
          matchStatus: confirmed ? 'confirmed' : 'rejected',
        };
        if (confirmed && standardId) {
          updates.matchedStandardId = standardId;
          const std = state.dataStandards.find((s) => s.id === standardId);
          if (std) {
            const fn = field.fieldName.toLowerCase();
            const sn = std.standardFieldName.toLowerCase();
            let score = 0;
            if (fn === sn) score = 100;
            else if (fn.includes(sn) || sn.includes(fn)) score = 90;
            else {
              const fw = fn.split(/[_\s]/);
              const sw = sn.split(/[_\s]/);
              const mc = fw.filter((w) => sw.includes(w)).length;
              score = Math.round((mc / Math.max(fw.length, sw.length)) * 100);
            }
            if (field.description && std.description) {
              if (field.description.includes(std.standardName)) score = Math.min(100, score + 10);
            }
            updates.matchScore = Math.min(100, Math.max(30, score));
          }
        }
        return { ...field, ...updates };
      }),
    })),

  submitRectification: (rectId, result) => {
    const today = new Date().toISOString().split('T')[0];
    set((state) => ({
      rectificationTasks: state.rectificationTasks.map((task) =>
        task.id === rectId
          ? { ...task, status: 'submitted' as const, result, submittedAt: today }
          : task,
      ),
    }));
  },

  approveRectification: (rectId) => {
    const state = get();
    const rect = state.rectificationTasks.find((t) => t.id === rectId);
    const today = new Date().toISOString().split('T')[0];
    set((s) => ({
      rectificationTasks: s.rectificationTasks.map((task) =>
        task.id === rectId
          ? { ...task, status: 'approved' as const, submittedAt: task.submittedAt || today }
          : task,
      ),
      issues: s.issues.map((issue) =>
        issue.id === rect?.issueId ? { ...issue, status: 'resolved' as const } : issue,
      ),
    }));
  },

  rejectRectification: (rectId) => {
    const state = get();
    const rect = state.rectificationTasks.find((t) => t.id === rectId);
    set((s) => ({
      rectificationTasks: s.rectificationTasks.map((task) =>
        task.id === rectId ? { ...task, status: 'rejected' as const } : task,
      ),
      issues: s.issues.map((issue) =>
        issue.id === rect?.issueId ? { ...issue, status: 'rectifying' as const } : issue,
      ),
    }));
  },

  updateRectificationStatus: (rectId, status) =>
    set((state) => ({
      rectificationTasks: state.rectificationTasks.map((task) => {
        if (task.id !== rectId) return task;
        const extra: Partial<RectificationTask> = {};
        if (status === 'in_progress' && task.status === 'pending') {
          // 从 pending 开始处理，不额外加字段
        }
        return { ...task, status, ...extra };
      }),
      issues:
        status === 'in_progress'
          ? state.issues.map((issue) => {
              const rect = state.rectificationTasks.find((t) => t.id === rectId);
              return issue.id === rect?.issueId && issue.status === 'open'
                ? { ...issue, status: 'rectifying' as const }
                : issue;
            })
          : state.issues,
    })),

  createRectificationTask: (issueId, assignee, deadline, priority) =>
    set((state) => {
      const issue = state.issues.find((i) => i.id === issueId);
      const newTask: RectificationTask = {
        id: `rect-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
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

  addCheckTask: (task) => {
    const newId = `task-${Date.now()}`;
    const newTask: CheckTask = {
      id: newId,
      name: task.name,
      projectName: task.projectName,
      status: task.status ?? 'pending',
      createdAt: new Date().toISOString().split('T')[0],
      progress: 0,
      totalFields: task.totalFields ?? 0,
      issueCount: 0,
      standardCategories: task.standardCategories ?? [],
      description: task.description,
    };
    set((state) => ({
      checkTasks: [newTask, ...state.checkTasks],
      currentTaskId: newId,
    }));
    return newId;
  },
}));

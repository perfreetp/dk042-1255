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

const randomFieldNames = [
  'cust_name', 'cust_id', 'order_no', 'order_amount', 'order_status',
  'product_name', 'product_id', 'unit_price', 'quantity', 'discount_amount',
  'create_time', 'update_time', 'creator', 'updater', 'is_deleted',
  'mobile', 'email', 'address', 'gender', 'birthday',
  'pay_type', 'pay_amount', 'pay_time', 'refund_amount', 'refund_time',
  'category_id', 'category_name', 'brand_id', 'brand_name', 'stock_qty',
  'user_id', 'user_name', 'nick_name', 'avatar_url', 'user_level',
  'dept_id', 'dept_name', 'emp_id', 'emp_name', 'position',
  'account_no', 'account_name', 'balance', 'credit_limit', 'currency',
  'log_id', 'op_type', 'op_time', 'op_user', 'ip_address',
];

const randomTableNames = [
  't_customer', 't_order', 't_order_detail', 't_product', 't_category',
  't_user', 't_department', 't_employee', 't_payment', 't_refund',
  't_account', 't_stock', 't_brand', 't_log', 't_address',
];

const randomFieldTypes = [
  'varchar(32)', 'varchar(64)', 'varchar(100)', 'varchar(200)', 'varchar(500)',
  'int', 'bigint', 'decimal(18,2)', 'decimal(10,2)',
  'datetime', 'date', 'timestamp',
  'tinyint', 'char(1)', 'char(10)',
  'text', 'longtext',
];

const randomSampleValues = [
  '张三', '1001', 'ORD20260615001', '99.99', '1',
  '2026-06-15 10:30:00', 'admin', '13800138000', 'test@example.com',
  '北京市朝阳区', 'MALE', '1990-01-01', 'ALIPAY', '500.00',
  '电子产品', '苹果', '100', 'VIP', '技术部',
  '经理', '622202xxxx', '10000.00', 'CNY', 'login',
];

function generateMockFields(
  taskId: string,
  count: number,
  standardCategories: string[],
  dataStandards: DataStandard[],
  existingFields: DataField[],
): DataField[] {
  const fields: DataField[] = [];
  const startIndex = existingFields.length + 1;

  const preferredStandards = standardCategories.length > 0
    ? dataStandards.filter((s) => standardCategories.includes(s.category))
    : dataStandards;
  const otherStandards = standardCategories.length > 0
    ? dataStandards.filter((s) => !standardCategories.includes(s.category))
    : [];

  for (let i = 0; i < count; i++) {
    const idx = startIndex + i;
    const usePreferred = preferredStandards.length > 0 && Math.random() > 0.2;
    const standardsPool = usePreferred ? preferredStandards : otherStandards.length > 0 ? otherStandards : dataStandards;
    const matchedStandard = standardsPool.length > 0
      ? standardsPool[Math.floor(Math.random() * standardsPool.length)]
      : undefined;

    const fieldName = randomFieldNames[Math.floor(Math.random() * randomFieldNames.length)]
      + (Math.random() > 0.7 ? `_${i}` : '');
    const fieldType = randomFieldTypes[Math.floor(Math.random() * randomFieldTypes.length)];
    const tableName = randomTableNames[Math.floor(Math.random() * randomTableNames.length)];
    const sampleValue = randomSampleValues[Math.floor(Math.random() * randomSampleValues.length)];
    const matchScore = Math.floor(Math.random() * 40) + 60;

    let description = matchedStandard?.description ?? '';
    if (!description) {
      description = `${fieldName}字段`;
    }

    fields.push({
      id: `field-${idx.toString().padStart(3, '0')}`,
      taskId,
      fieldName,
      fieldType,
      description,
      matchedStandardId: matchedStandard?.id,
      matchScore,
      matchStatus: 'pending',
      tableName,
      sampleValue,
    });
  }

  return fields;
}

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
    const state = get();
    const newId = `task-${Date.now()}`;
    const fieldCount = Math.max(task.totalFields ?? 0, 10);
    const standardCategories = task.standardCategories ?? [];
    const newTask: CheckTask = {
      id: newId,
      name: task.name,
      projectName: task.projectName,
      status: task.status ?? 'pending',
      createdAt: new Date().toISOString().split('T')[0],
      progress: 0,
      totalFields: fieldCount,
      issueCount: 0,
      standardCategories,
      description: task.description,
    };
    const mockFields = generateMockFields(newId, fieldCount, standardCategories, state.dataStandards, state.dataFields);
    set((s) => ({
      checkTasks: [newTask, ...s.checkTasks],
      dataFields: [...s.dataFields, ...mockFields],
      currentTaskId: newId,
    }));
    return newId;
  },
}));

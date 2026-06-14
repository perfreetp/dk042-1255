import { useState, useMemo } from 'react';
import {
  Clock,
  PlayCircle,
  Eye,
  Check,
  X,
  User,
  Calendar,
  Flag,
  Send,
  MoreHorizontal,
  AlertCircle,
  Plus,
  XCircle,
  CheckCircle2,
  ArrowRight,
} from 'lucide-react';
import { useAppStore } from '@/store';
import type { RectificationTask, RectificationStatus } from '@/types';

const ASSIGNEES = ['李明', '王芳', '张伟', '赵强'];

const STATUS_CONFIG: Record<
  RectificationStatus,
  { label: string; color: string; bgColor: string; borderColor: string }
> = {
  pending: {
    label: '待处理',
    color: 'text-amber-700',
    bgColor: 'bg-amber-50',
    borderColor: 'border-amber-200',
  },
  in_progress: {
    label: '进行中',
    color: 'text-blue-700',
    bgColor: 'bg-blue-50',
    borderColor: 'border-blue-200',
  },
  submitted: {
    label: '待审核',
    color: 'text-purple-700',
    bgColor: 'bg-purple-50',
    borderColor: 'border-purple-200',
  },
  approved: {
    label: '已通过',
    color: 'text-green-700',
    bgColor: 'bg-green-50',
    borderColor: 'border-green-200',
  },
  rejected: {
    label: '已驳回',
    color: 'text-red-700',
    bgColor: 'bg-red-50',
    borderColor: 'border-red-200',
  },
};

const PRIORITY_CONFIG = {
  high: { label: '高', color: 'text-red-600', bgColor: 'bg-red-50', borderColor: 'border-red-200' },
  medium: { label: '中', color: 'text-yellow-600', bgColor: 'bg-yellow-50', borderColor: 'border-yellow-200' },
  low: { label: '低', color: 'text-blue-600', bgColor: 'bg-blue-50', borderColor: 'border-blue-200' },
};

const COLUMN_CONFIG = [
  {
    key: 'pending',
    title: '待处理',
    statuses: ['pending'] as RectificationStatus[],
    icon: Clock,
    accent: 'from-amber-500',
    bgAccent: 'bg-amber-500',
    borderAccent: 'border-amber-200',
    bgLight: 'bg-amber-50',
  },
  {
    key: 'in_progress',
    title: '进行中',
    statuses: ['in_progress'] as RectificationStatus[],
    icon: PlayCircle,
    accent: 'from-blue-500',
    bgAccent: 'bg-blue-500',
    borderAccent: 'border-blue-200',
    bgLight: 'bg-blue-50',
  },
  {
    key: 'submitted',
    title: '待审核',
    statuses: ['submitted'] as RectificationStatus[],
    icon: Send,
    accent: 'from-purple-500',
    bgAccent: 'bg-purple-500',
    borderAccent: 'border-purple-200',
    bgLight: 'bg-purple-50',
  },
  {
    key: 'completed',
    title: '已完成',
    statuses: ['approved', 'rejected'] as RectificationStatus[],
    icon: CheckCircle2,
    accent: 'from-green-500',
    bgAccent: 'bg-green-500',
    borderAccent: 'border-green-200',
    bgLight: 'bg-green-50',
  },
];

function isOverdue(deadline: string): boolean {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const deadlineDate = new Date(deadline);
  deadlineDate.setHours(0, 0, 0, 0);
  return deadlineDate < today;
}

function formatDate(dateStr: string): string {
  const date = new Date(dateStr);
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
}

function StatCard({
  title,
  count,
  icon: Icon,
  color,
  bgColor,
}: {
  title: string;
  count: number;
  icon: React.ComponentType<{ className?: string }>;
  color: string;
  bgColor: string;
}) {
  return (
    <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm hover:shadow-md transition-shadow duration-200">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm text-gray-500 font-medium">{title}</p>
          <p className="text-3xl font-bold text-gray-800 mt-2">{count}</p>
        </div>
        <div className={`w-12 h-12 rounded-xl ${bgColor} flex items-center justify-center`}>
          <Icon className={`w-6 h-6 ${color}`} />
        </div>
      </div>
    </div>
  );
}

function PriorityBadge({ priority }: { priority: 'high' | 'medium' | 'low' }) {
  const config = PRIORITY_CONFIG[priority];
  return (
    <span
      className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-medium ${config.color} ${config.bgColor} ${config.borderColor} border`}
    >
      <Flag className="w-3 h-3" />
      {config.label}
    </span>
  );
}

function StatusBadge({ status }: { status: RectificationStatus }) {
  const config = STATUS_CONFIG[status];
  return (
    <span
      className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${config.color} ${config.bgColor} ${config.borderColor} border`}
    >
      {config.label}
    </span>
  );
}

function TaskCard({
  task,
  onViewDetail,
  onStart,
}: {
  task: RectificationTask;
  onViewDetail: (task: RectificationTask) => void;
  onStart: (task: RectificationTask) => void;
}) {
  const overdue = isOverdue(task.deadline) && task.status !== 'approved';

  return (
    <div
      className="bg-white rounded-lg border border-gray-200 p-4 shadow-sm hover:shadow-lg hover:-translate-y-0.5 transition-all duration-200 cursor-pointer group"
      onClick={() => onViewDetail(task)}
    >
      <div className="flex items-start justify-between mb-3">
        <PriorityBadge priority={task.priority} />
        <button
          onClick={(e) => {
            e.stopPropagation();
          }}
          className="p-1 rounded hover:bg-gray-100 opacity-0 group-hover:opacity-100 transition-opacity"
        >
          <MoreHorizontal className="w-4 h-4 text-gray-400" />
        </button>
      </div>

      {task.fieldName && (
        <h4 className="font-semibold text-gray-800 text-sm mb-1.5">{task.fieldName}</h4>
      )}
      <p className="text-xs line-clamp-2 mb-3 text-gray-600">
        {task.issueDescription}
      </p>

      <div className="flex items-center gap-2 mb-3">
        <div className="flex items-center gap-1.5">
          <div className="w-6 h-6 rounded-full bg-primary-100 flex items-center justify-center">
            <span className="text-[10px] font-medium text-primary-700">
              {task.assigneeAvatar || task.assignee.slice(0, 1)}
            </span>
          </div>
          <span className="text-xs text-gray-600">{task.assignee}</span>
        </div>
      </div>

      <div className={`flex items-center gap-1.5 text-xs ${overdue ? 'text-red-600' : 'text-gray-500'} mb-3`}>
        {overdue ? (
          <AlertCircle className="w-3.5 h-3.5" />
        ) : (
          <Calendar className="w-3.5 h-3.5" />
        )}
        <span className={overdue ? 'font-medium' : ''}>{formatDate(task.deadline)}</span>
        {overdue && <span className="font-medium">(已过期)</span>}
      </div>

      <div className="flex items-center justify-between">
        <StatusBadge status={task.status} />
        <div className="flex items-center gap-1.5">
          {task.status === 'pending' && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                onStart(task);
              }}
              className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-medium text-white bg-primary-600 rounded hover:bg-primary-700 transition-colors"
            >
              <PlayCircle className="w-3 h-3" />
              开始处理
            </button>
          )}
          <button
            onClick={(e) => {
              e.stopPropagation();
              onViewDetail(task);
            }}
            className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-medium text-primary-600 bg-primary-50 rounded hover:bg-primary-100 transition-colors"
          >
            <Eye className="w-3 h-3" />
            详情
          </button>
        </div>
      </div>
    </div>
  );
}

function Timeline({ task }: { task: RectificationTask }) {
  const events = useMemo(() => {
    const result: Array<{ status: RectificationStatus; label: string; time: string; icon: typeof Clock }> = [
      {
        status: 'pending',
        label: '创建整改任务',
        time: task.createdAt,
        icon: Clock,
      },
    ];
    if (task.status !== 'pending') {
      result.push({
        status: 'in_progress',
        label: '开始处理',
        time: task.createdAt,
        icon: PlayCircle,
      });
    }
    if (['submitted', 'approved', 'rejected'].includes(task.status)) {
      result.push({
        status: 'submitted',
        label: '提交整改',
        time: task.submittedAt || task.createdAt,
        icon: Send,
      });
    }
    if (task.status === 'approved' || task.status === 'rejected') {
      result.push({
        status: task.status,
        label: task.status === 'approved' ? '审核通过' : '审核驳回',
        time: task.submittedAt || task.createdAt,
        icon: task.status === 'approved' ? CheckCircle2 : XCircle,
      });
    }
    return result;
  }, [task]);

  return (
    <div className="relative">
      {events.map((event, index) => {
        const isLast = index === events.length - 1;
        const Icon = event.icon;
        return (
          <div key={index} className="relative flex gap-3">
            <div className="relative flex flex-col items-center">
              <div
                className={`w-8 h-8 rounded-full flex items-center justify-center z-10 ${
                  event.status === task.status
                    ? 'bg-primary-100 border-2 border-primary-600'
                    : 'bg-gray-100 border-2 border-gray-300'
                }`}
              >
                <Icon
                  className={`w-4 h-4 ${
                    event.status === task.status ? 'text-primary-600' : 'text-gray-400'
                  }`}
                />
              </div>
              {!isLast && <div className="w-0.5 h-10 bg-gray-200 mt-1" />}
            </div>
            <div className="pb-6 flex-1">
              <p
                className={`text-sm font-medium ${
                  event.status === task.status ? 'text-gray-800' : 'text-gray-500'
                }`}
              >
                {event.label}
              </p>
              <p className="text-xs text-gray-400 mt-0.5">{formatDate(event.time)}</p>
            </div>
          </div>
        );
      })}
    </div>
  );
}

function TaskDetailModal({
  task,
  onClose,
  onStatusChange,
}: {
  task: RectificationTask;
  onClose: () => void;
  onStatusChange: (taskId: string, status: RectificationStatus) => void;
}) {
  const [showResultInput, setShowResultInput] = useState(false);
  const [resultText, setResultText] = useState('');
  const issue = useAppStore((s) => s.issues.find((i) => i.id === task.issueId));
  const overdue = isOverdue(task.deadline) && task.status !== 'approved';

  const handleSubmit = () => {
    if (task.status === 'in_progress') {
      if (!resultText.trim()) {
        setShowResultInput(true);
        return;
      }
      onStatusChange(task.id, 'submitted');
      onClose();
    }
  };

  const handleApprove = () => {
    onStatusChange(task.id, 'approved');
    onClose();
  };

  const handleReject = () => {
    onStatusChange(task.id, 'rejected');
    onClose();
  };

  const handleStart = () => {
    onStatusChange(task.id, 'in_progress');
    onClose();
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center"
      onClick={onClose}
      style={{
        backgroundColor: 'rgba(15, 39, 63, 0.5)',
        animation: 'fadeIn 0.2s ease-out',
      }}
    >
      <div
        className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-hidden"
        onClick={(e) => e.stopPropagation()}
        style={{ animation: 'scaleIn 0.25s ease-out' }}
      >
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-primary-100 flex items-center justify-center">
              <Flag className="w-5 h-5 text-primary-600" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-gray-800">
                {task.fieldName || '整改任务详情'}
              </h3>
              <p className="text-sm text-gray-500">任务编号：{task.id}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-lg hover:bg-gray-100 flex items-center justify-center transition-colors"
          >
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        <div className="p-6 overflow-y-auto max-h-[calc(90vh-180px)]">
          <div className="grid grid-cols-2 gap-4 mb-6">
            <div>
              <p className="text-xs text-gray-500 mb-1">状态</p>
              <StatusBadge status={task.status} />
            </div>
            <div>
              <p className="text-xs text-gray-500 mb-1">优先级</p>
              <PriorityBadge priority={task.priority} />
            </div>
            <div>
              <p className="text-xs text-gray-500 mb-1">负责人</p>
              <div className="flex items-center gap-2">
                <div className="w-6 h-6 rounded-full bg-primary-100 flex items-center justify-center">
                  <span className="text-xs font-medium text-primary-700">
                    {task.assigneeAvatar || task.assignee.slice(0, 1)}
                  </span>
                </div>
                <span className="text-sm font-medium text-gray-700">{task.assignee}</span>
              </div>
            </div>
            <div>
              <p className="text-xs text-gray-500 mb-1">截止日期</p>
              <div className={`flex items-center gap-1.5 text-sm ${overdue ? 'text-red-600 font-medium' : 'text-gray-700'}`}>
                {overdue ? <AlertCircle className="w-4 h-4" /> : <Calendar className="w-4 h-4" />}
                {formatDate(task.deadline)}
                {overdue && ' (已过期)'}
              </div>
            </div>
          </div>

          {issue && (
            <div className="mb-6">
              <h4 className="text-sm font-semibold text-gray-800 mb-2">问题描述</h4>
              <div className="bg-gray-50 rounded-lg p-4 text-sm text-gray-700 leading-relaxed">
                {task.issueDescription}
              </div>
            </div>
          )}

          {issue && (
            <div className="mb-6">
              <h4 className="text-sm font-semibold text-gray-800 mb-2">整改建议</h4>
              <div className="bg-primary-50 rounded-lg p-4 text-sm text-primary-800 leading-relaxed">
                {issue.suggestion}
              </div>
            </div>
          )}

          {task.result && (
            <div className="mb-6">
              <h4 className="text-sm font-semibold text-gray-800 mb-2">整改结果</h4>
              <div className="bg-green-50 rounded-lg p-4 text-sm text-gray-700 leading-relaxed">
                {task.result}
              </div>
            </div>
          )}

          {task.status === 'in_progress' && showResultInput && (
            <div className="mb-6">
              <h4 className="text-sm font-semibold text-gray-800 mb-2">整改结果</h4>
              <textarea
                className="w-full h-24 px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent resize-none"
                placeholder="请输入整改结果描述..."
                value={resultText}
                onChange={(e) => setResultText(e.target.value)}
              />
            </div>
          )}

          <div>
            <h4 className="text-sm font-semibold text-gray-800 mb-3">状态流转</h4>
            <div className="bg-gray-50 rounded-lg p-4">
              <Timeline task={task} />
            </div>
          </div>
        </div>

        <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-gray-200">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
          >
            关闭
          </button>
          {task.status === 'pending' && (
            <button
              onClick={handleStart}
              className="px-4 py-2 text-sm font-medium text-white bg-primary-600 rounded-lg hover:bg-primary-700 transition-colors inline-flex items-center gap-1.5"
            >
              <PlayCircle className="w-4 h-4" />
              开始处理
            </button>
          )}
          {task.status === 'in_progress' && (
            <button
              onClick={handleSubmit}
              className="px-4 py-2 text-sm font-medium text-white bg-primary-600 rounded-lg hover:bg-primary-700 transition-colors inline-flex items-center gap-1.5"
            >
              <Send className="w-4 h-4" />
              提交整改
            </button>
          )}
          {task.status === 'submitted' && (
            <>
              <button
                onClick={handleReject}
                className="px-4 py-2 text-sm font-medium text-red-600 bg-red-50 border border-red-200 rounded-lg hover:bg-red-100 transition-colors inline-flex items-center gap-1.5"
              >
                <XCircle className="w-4 h-4" />
                驳回
              </button>
              <button
                onClick={handleApprove}
                className="px-4 py-2 text-sm font-medium text-white bg-green-600 rounded-lg hover:bg-green-700 transition-colors inline-flex items-center gap-1.5"
              >
                <CheckCircle2 className="w-4 h-4" />
                通过
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

function AssignModal({
  onClose,
  onAssign,
}: {
  onClose: () => void;
  onAssign: (
    issueIds: string[],
    assignee: string,
    deadline: string,
    priority: 'high' | 'medium' | 'low'
  ) => void;
}) {
  const issues = useAppStore((s) => s.issues.filter((i) => i.status === 'open'));
  const [selectedIssueIds, setSelectedIssueIds] = useState<string[]>([]);
  const [assignee, setAssignee] = useState(ASSIGNEES[0]);
  const [deadline, setDeadline] = useState('');
  const [priority, setPriority] = useState<'high' | 'medium' | 'low'>('medium');

  const handleToggleIssue = (issueId: string) => {
    setSelectedIssueIds((prev) =>
      prev.includes(issueId) ? prev.filter((id) => id !== issueId) : [...prev, issueId]
    );
  };

  const handleSelectAll = () => {
    if (selectedIssueIds.length === issues.length) {
      setSelectedIssueIds([]);
    } else {
      setSelectedIssueIds(issues.map((i) => i.id));
    }
  };

  const handleConfirm = () => {
    if (selectedIssueIds.length > 0 && assignee && deadline) {
      onAssign(selectedIssueIds, assignee, deadline, priority);
      onClose();
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center"
      onClick={onClose}
      style={{
        backgroundColor: 'rgba(15, 39, 63, 0.5)',
        animation: 'fadeIn 0.2s ease-out',
      }}
    >
      <div
        className="bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-hidden"
        onClick={(e) => e.stopPropagation()}
        style={{ animation: 'scaleIn 0.25s ease-out' }}
      >
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-primary-100 flex items-center justify-center">
              <Send className="w-5 h-5 text-primary-600" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-gray-800">派发整改任务</h3>
              <p className="text-sm text-gray-500">选择问题并指派负责人</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-lg hover:bg-gray-100 flex items-center justify-center transition-colors"
          >
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        <div className="p-6 overflow-y-auto max-h-[calc(90vh-180px)]">
          <div className="mb-5">
            <div className="flex items-center justify-between mb-2">
              <label className="text-sm font-medium text-gray-700">选择问题（可多选）</label>
              <button
                onClick={handleSelectAll}
                className="text-xs text-primary-600 hover:text-primary-700"
              >
                {selectedIssueIds.length === issues.length ? '取消全选' : '全选'}
              </button>
            </div>
            <div className="border border-gray-200 rounded-lg max-h-48 overflow-y-auto">
              {issues.length === 0 ? (
                <div className="p-4 text-center text-sm text-gray-400">暂无可派发的问题</div>
              ) : (
                issues.map((issue) => (
                  <label
                    key={issue.id}
                    className="flex items-start gap-3 p-3 border-b border-gray-100 last:border-b-0 hover:bg-gray-50 cursor-pointer transition-colors"
                  >
                    <input
                      type="checkbox"
                      checked={selectedIssueIds.includes(issue.id)}
                      onChange={() => handleToggleIssue(issue.id)}
                      className="mt-0.5 w-4 h-4 rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                    />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-medium text-sm text-gray-800">
                          {issue.fieldName}
                        </span>
                        <PriorityBadge priority={issue.severity} />
                      </div>
                      <p className="text-xs text-gray-500 truncate">{issue.description}</p>
                    </div>
                  </label>
                ))
              )}
            </div>
            {selectedIssueIds.length > 0 && (
              <p className="text-xs text-gray-500 mt-2">已选择 {selectedIssueIds.length} 个问题</p>
            )}
          </div>

          <div className="mb-5">
            <label className="block text-sm font-medium text-gray-700 mb-2">负责人</label>
            <div className="relative">
              <select
                value={assignee}
                onChange={(e) => setAssignee(e.target.value)}
                className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent appearance-none bg-white pr-10"
              >
                {ASSIGNEES.map((name) => (
                  <option key={name} value={name}>
                    {name}
                  </option>
                ))}
              </select>
              <User className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">截止日期</label>
              <div className="relative">
                <input
                  type="date"
                  value={deadline}
                  onChange={(e) => setDeadline(e.target.value)}
                  className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">优先级</label>
              <div className="grid grid-cols-3 gap-2">
                {(['high', 'medium', 'low'] as const).map((p) => (
                  <button
                    key={p}
                    onClick={() => setPriority(p)}
                    className={`py-2 text-xs font-medium rounded-lg border transition-colors ${
                      priority === p
                        ? `${PRIORITY_CONFIG[p].color} ${PRIORITY_CONFIG[p].bgColor} ${PRIORITY_CONFIG[p].borderColor}`
                        : 'text-gray-500 bg-white border-gray-200 hover:bg-gray-50'
                    }`}
                  >
                    {PRIORITY_CONFIG[p].label}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>

        <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-gray-200">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
          >
            取消
          </button>
          <button
            onClick={handleConfirm}
            disabled={selectedIssueIds.length === 0 || !assignee || !deadline}
            className="px-4 py-2 text-sm font-medium text-white bg-primary-600 rounded-lg hover:bg-primary-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed inline-flex items-center gap-1.5"
          >
            <Check className="w-4 h-4" />
            确认派发
          </button>
        </div>
      </div>
    </div>
  );
}

export default function Rectification() {
  const { rectificationTasks, updateRectificationStatus, createRectificationTask } = useAppStore();
  const [selectedTask, setSelectedTask] = useState<RectificationTask | null>(null);
  const [showAssignModal, setShowAssignModal] = useState(false);

  const stats = useMemo(() => {
    return {
      pending: rectificationTasks.filter((t) => t.status === 'pending').length,
      in_progress: rectificationTasks.filter((t) => t.status === 'in_progress').length,
      submitted: rectificationTasks.filter((t) => t.status === 'submitted').length,
      completed: rectificationTasks.filter(
        (t) => t.status === 'approved' || t.status === 'rejected'
      ).length,
    };
  }, [rectificationTasks]);

  const getColumnTasks = (statuses: RectificationStatus[]) => {
    return rectificationTasks.filter((t) => statuses.includes(t.status));
  };

  const handleStatusChange = (taskId: string, status: RectificationStatus) => {
    updateRectificationStatus(taskId, status);
  };

  const handleAssign = (
    issueIds: string[],
    assignee: string,
    deadline: string,
    priority: 'high' | 'medium' | 'low'
  ) => {
    issueIds.forEach((issueId) => {
      createRectificationTask(issueId, assignee, deadline, priority);
    });
  };

  const handleStart = (task: RectificationTask) => {
    updateRectificationStatus(task.id, 'in_progress');
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">整改跟踪</h1>
          <p className="text-gray-500 mt-1">跟踪问题整改进度和完成情况</p>
        </div>
        <button
          onClick={() => setShowAssignModal(true)}
          className="inline-flex items-center gap-2 px-4 py-2.5 text-sm font-medium text-white bg-primary-600 rounded-lg hover:bg-primary-700 transition-colors shadow-sm"
        >
          <Plus className="w-4 h-4" />
          派发整改
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="待处理"
          count={stats.pending}
          icon={Clock}
          color="text-amber-600"
          bgColor="bg-amber-50"
        />
        <StatCard
          title="进行中"
          count={stats.in_progress}
          icon={PlayCircle}
          color="text-blue-600"
          bgColor="bg-blue-50"
        />
        <StatCard
          title="待审核"
          count={stats.submitted}
          icon={Send}
          color="text-purple-600"
          bgColor="bg-purple-50"
        />
        <StatCard
          title="已完成"
          count={stats.completed}
          icon={CheckCircle2}
          color="text-green-600"
          bgColor="bg-green-50"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
        {COLUMN_CONFIG.map((column) => {
          const Icon = column.icon;
          const tasks = getColumnTasks(column.statuses);
          const iconColorClass = column.bgAccent.replace('bg-', 'text-');
          return (
            <div
              key={column.key}
              className="flex flex-col bg-gray-50 rounded-xl border border-gray-200 overflow-hidden"
              style={{ maxHeight: 'calc(100vh - 360px)', minHeight: '500px' }}
            >
              <div className="flex items-center justify-between px-4 py-3 bg-white border-b border-gray-200">
                <div className="flex items-center gap-2">
                  <div className={`w-8 h-8 rounded-lg ${column.bgLight} flex items-center justify-center`}>
                    <Icon className={`w-4 h-4 ${iconColorClass}`} />
                  </div>
                  <span className="font-semibold text-gray-700 text-sm">{column.title}</span>
                </div>
                <span className="px-2 py-0.5 text-xs font-medium text-gray-500 bg-gray-100 rounded-full">
                  {tasks.length}
                </span>
              </div>
              <div className="flex-1 overflow-y-auto p-3 space-y-3 scrollbar-thin">
                {tasks.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-12 text-gray-400">
                    <div className="w-12 h-12 rounded-full bg-gray-100 flex items-center justify-center mb-2">
                      <ArrowRight className="w-6 h-6 opacity-50" />
                    </div>
                    <p className="text-xs">拖拽任务到此列</p>
                  </div>
                ) : (
                  tasks.map((task) => (
                    <TaskCard
                      key={task.id}
                      task={task}
                      onViewDetail={setSelectedTask}
                      onStart={handleStart}
                    />
                  ))
                )}
              </div>
            </div>
          );
        })}
      </div>

      {selectedTask && (
        <TaskDetailModal
          task={selectedTask}
          onClose={() => setSelectedTask(null)}
          onStatusChange={handleStatusChange}
        />
      )}

      {showAssignModal && (
        <AssignModal onClose={() => setShowAssignModal(false)} onAssign={handleAssign} />
      )}
    </div>
  );
}

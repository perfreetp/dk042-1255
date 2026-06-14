import { useState, useMemo } from 'react';
import {
  CheckSquare,
  FolderOpen,
  AlertCircle,
  Play,
  Plus,
  Search,
  Filter,
  ChevronRight,
  Upload,
  CheckCircle2,
  Clock,
  Database,
  X,
  ChevronDown,
  FileText,
  ArrowRight,
} from 'lucide-react';
import { useAppStore } from '@/store';
import type { CheckTask, StandardCategory } from '@/types';
import { cn } from '@/lib/utils';

type StatusFilter = 'all' | CheckTask['status'];

const statusConfig: Record<CheckTask['status'], { label: string; className: string }> = {
  pending: { label: '待开始', className: 'bg-gray-100 text-gray-600 border-gray-200' },
  running: { label: '进行中', className: 'bg-blue-50 text-blue-600 border-blue-200' },
  completed: { label: '已完成', className: 'bg-green-50 text-green-600 border-green-200' },
  archived: { label: '已归档', className: 'bg-gray-100 text-gray-500 border-gray-200' },
};

const stepLabels = ['基本信息', '选择标准', '上传文件', '确认创建'];

interface NewTaskForm {
  name: string;
  projectName: string;
  description: string;
  selectedStandards: string[];
  files: File[];
}

const collectCategoryNames = (ids: string[], cats: StandardCategory[]): string[] => {
  const names = new Set<string>();
  const traverse = (list: StandardCategory[]) => {
    for (const cat of list) {
      if (ids.includes(cat.id)) {
        names.add(cat.name);
      }
      if (cat.children && cat.children.length > 0) {
        traverse(cat.children);
      }
    }
  };
  traverse(cats);
  return Array.from(names);
};

export default function Tasks() {
  const { checkTasks, standardCategories, addCheckTask } = useAppStore();

  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(new Set());
  const [form, setForm] = useState<NewTaskForm>({
    name: '',
    projectName: '',
    description: '',
    selectedStandards: [],
    files: [],
  });
  const [isDragging, setIsDragging] = useState(false);

  const stats = useMemo(() => {
    const total = checkTasks.length;
    const running = checkTasks.filter((t) => t.status === 'running').length;
    const completed = checkTasks.filter((t) => t.status === 'completed').length;
    const issues = checkTasks.reduce((sum, t) => sum + t.issueCount, 0);
    return { total, running, completed, issues };
  }, [checkTasks]);

  const filteredTasks = useMemo(() => {
    return checkTasks.filter((task) => {
      const matchesSearch =
        task.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        task.projectName.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesStatus = statusFilter === 'all' || task.status === statusFilter;
      return matchesSearch && matchesStatus;
    });
  }, [checkTasks, searchQuery, statusFilter]);

  const toggleCategory = (id: string) => {
    setExpandedCategories((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  const toggleStandard = (id: string) => {
    setForm((prev) => ({
      ...prev,
      selectedStandards: prev.selectedStandards.includes(id)
        ? prev.selectedStandards.filter((s) => s !== id)
        : [...prev.selectedStandards, id],
    }));
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const droppedFiles = Array.from(e.dataTransfer.files);
    setForm((prev) => ({
      ...prev,
      files: [...prev.files, ...droppedFiles],
    }));
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const selectedFiles = Array.from(e.target.files);
      setForm((prev) => ({
        ...prev,
        files: [...prev.files, ...selectedFiles],
      }));
    }
  };

  const removeFile = (index: number) => {
    setForm((prev) => ({
      ...prev,
      files: prev.files.filter((_, i) => i !== index),
    }));
  };

  const openModal = () => {
    setIsModalOpen(true);
    setCurrentStep(0);
    setForm({
      name: '',
      projectName: '',
      description: '',
      selectedStandards: [],
      files: [],
    });
    setExpandedCategories(new Set());
  };

  const closeModal = () => {
    setIsModalOpen(false);
  };

  const nextStep = () => {
    if (currentStep < stepLabels.length - 1) {
      setCurrentStep(currentStep + 1);
    }
  };

  const prevStep = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleCreate = () => {
    const categoryNames = collectCategoryNames(form.selectedStandards, standardCategories);
    const baseFields = form.files.length * 10 + Math.floor(Math.random() * 30);
    const totalFields = Math.max(20, baseFields);

    addCheckTask({
      name: form.name,
      projectName: form.projectName,
      description: form.description,
      standardCategories: categoryNames,
      status: 'pending',
      totalFields,
    });

    setIsModalOpen(false);
  };

  const canProceed = useMemo(() => {
    if (currentStep === 0) {
      return form.name.trim() && form.projectName.trim();
    }
    if (currentStep === 1) {
      return form.selectedStandards.length > 0;
    }
    return true;
  }, [currentStep, form]);

  return (
    <div className="min-w-[1280px] space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-800">检查任务</h1>
        <p className="text-gray-500 mt-1">管理和执行数据标准检查任务</p>
      </div>

      <div className="grid grid-cols-4 gap-5">
        <StatCard
          icon={<CheckSquare className="w-6 h-6" />}
          label="任务总数"
          value={stats.total}
          bgColor="bg-primary-700"
          iconBg="bg-primary-600"
        />
        <StatCard
          icon={<Play className="w-6 h-6" />}
          label="进行中"
          value={stats.running}
          bgColor="bg-blue-500"
          iconBg="bg-blue-400"
        />
        <StatCard
          icon={<CheckCircle2 className="w-6 h-6" />}
          label="已完成"
          value={stats.completed}
          bgColor="bg-emerald-500"
          iconBg="bg-emerald-400"
        />
        <StatCard
          icon={<AlertCircle className="w-6 h-6" />}
          label="问题总数"
          value={stats.issues}
          bgColor="bg-amber-500"
          iconBg="bg-amber-400"
        />
      </div>

      <div className="bg-white rounded-xl border border-gray-200 p-4 shadow-sm">
        <div className="flex items-center gap-4">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="搜索任务名称或项目名..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 bg-gray-50 border border-gray-200 rounded-lg text-sm text-gray-700 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all"
            />
          </div>
          <div className="relative">
            <Filter className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as StatusFilter)}
              className="pl-10 pr-8 py-2.5 bg-gray-50 border border-gray-200 rounded-lg text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all appearance-none cursor-pointer min-w-[140px]"
            >
              <option value="all">全部状态</option>
              <option value="pending">待开始</option>
              <option value="running">进行中</option>
              <option value="completed">已完成</option>
              <option value="archived">已归档</option>
            </select>
            <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
          </div>
          <div className="flex-1" />
          <button
            onClick={openModal}
            className="inline-flex items-center gap-2 px-5 py-2.5 bg-primary-700 hover:bg-primary-800 text-white text-sm font-medium rounded-lg shadow-sm hover:shadow-md transition-all duration-200"
          >
            <Plus className="w-4 h-4" />
            新建任务
          </button>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-5">
        {filteredTasks.map((task) => (
          <TaskCard key={task.id} task={task} />
        ))}
      </div>

      {filteredTasks.length === 0 && (
        <div className="bg-white rounded-xl border border-gray-200 p-12 text-center">
          <FileText className="w-12 h-12 text-gray-300 mx-auto mb-4" />
          <p className="text-gray-500">没有找到匹配的任务</p>
        </div>
      )}

      {isModalOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm"
          style={{ animation: 'fadeIn 0.2s ease-out' }}
        >
          <div
            className="bg-white rounded-2xl shadow-2xl w-[720px] max-h-[85vh] overflow-hidden flex flex-col"
            style={{ animation: 'scaleIn 0.25s ease-out' }}
          >
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
              <h2 className="text-lg font-semibold text-gray-800">新建检查任务</h2>
              <button
                onClick={closeModal}
                className="p-1.5 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="px-6 pt-6">
              <div className="flex items-center">
                {stepLabels.map((label, index) => (
                  <div key={label} className="flex items-center">
                    <div className="flex items-center gap-2">
                      <div
                        className={cn(
                          'w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium transition-all',
                          index < currentStep
                            ? 'bg-primary-700 text-white'
                            : index === currentStep
                            ? 'bg-primary-700 text-white ring-4 ring-primary-100'
                            : 'bg-gray-100 text-gray-400'
                        )}
                      >
                        {index < currentStep ? (
                          <CheckCircle2 className="w-5 h-5" />
                        ) : (
                          index + 1
                        )}
                      </div>
                      <span
                        className={cn(
                          'text-sm font-medium',
                          index <= currentStep ? 'text-gray-800' : 'text-gray-400'
                        )}
                      >
                        {label}
                      </span>
                    </div>
                    {index < stepLabels.length - 1 && (
                      <div
                        className={cn(
                          'w-10 h-0.5 mx-3 transition-colors',
                          index < currentStep ? 'bg-primary-700' : 'bg-gray-200'
                        )}
                      />
                    )}
                  </div>
                ))}
              </div>
            </div>

            <div className="flex-1 overflow-y-auto px-6 py-6">
              {currentStep === 0 && (
                <div className="space-y-5" style={{ animation: 'fadeIn 0.2s ease-out' }}>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">
                      任务名称 <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      value={form.name}
                      onChange={(e) => setForm({ ...form, name: e.target.value })}
                      placeholder="请输入任务名称"
                      className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-lg text-sm text-gray-700 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">
                      关联项目 <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      value={form.projectName}
                      onChange={(e) => setForm({ ...form, projectName: e.target.value })}
                      placeholder="请输入所属项目名称"
                      className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-lg text-sm text-gray-700 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">任务描述</label>
                    <textarea
                      value={form.description}
                      onChange={(e) => setForm({ ...form, description: e.target.value })}
                      placeholder="请输入任务描述（可选）"
                      rows={4}
                      className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-lg text-sm text-gray-700 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all resize-none"
                    />
                  </div>
                </div>
              )}

              {currentStep === 1 && (
                <div style={{ animation: 'fadeIn 0.2s ease-out' }}>
                  <p className="text-sm text-gray-500 mb-4">选择本次检查适用的数据标准</p>
                  <div className="border border-gray-200 rounded-lg overflow-hidden">
                    <div className="max-h-[360px] overflow-y-auto">
                      {standardCategories.map((category) => (
                        <StandardTreeItem
                          key={category.id}
                          category={category}
                          level={0}
                          expandedCategories={expandedCategories}
                          selectedStandards={form.selectedStandards}
                          onToggleCategory={toggleCategory}
                          onToggleStandard={toggleStandard}
                        />
                      ))}
                    </div>
                  </div>
                  {form.selectedStandards.length > 0 && (
                    <p className="mt-3 text-sm text-gray-500">
                      已选择 <span className="text-primary-700 font-medium">{form.selectedStandards.length}</span> 项标准
                    </p>
                  )}
                </div>
              )}

              {currentStep === 2 && (
                <div className="space-y-4" style={{ animation: 'fadeIn 0.2s ease-out' }}>
                  <p className="text-sm text-gray-500">上传需要检查的数据表结构文件（支持 SQL、CSV、Excel 等格式）</p>
                  <div
                    onDragOver={handleDragOver}
                    onDragLeave={handleDragLeave}
                    onDrop={handleDrop}
                    onClick={() => document.getElementById('file-input')?.click()}
                    className={cn(
                      'border-2 border-dashed rounded-xl p-10 text-center cursor-pointer transition-all',
                      isDragging
                        ? 'border-primary-500 bg-primary-50'
                        : 'border-gray-300 hover:border-primary-400 hover:bg-gray-50'
                    )}
                  >
                    <input
                      id="file-input"
                      type="file"
                      multiple
                      onChange={handleFileSelect}
                      className="hidden"
                    />
                    <Upload
                      className={cn(
                        'w-10 h-10 mx-auto mb-3 transition-colors',
                        isDragging ? 'text-primary-600' : 'text-gray-400'
                      )}
                    />
                    <p className="text-sm font-medium text-gray-700 mb-1">
                      {isDragging ? '释放以添加文件' : '拖拽文件到此处，或点击选择'}
                    </p>
                    <p className="text-xs text-gray-400">支持 .sql, .csv, .xlsx, .xls, .json 格式</p>
                  </div>
                  {form.files.length > 0 && (
                    <div className="space-y-2">
                      {form.files.map((file, index) => (
                        <div
                          key={index}
                          className="flex items-center justify-between px-4 py-3 bg-gray-50 border border-gray-200 rounded-lg"
                        >
                          <div className="flex items-center gap-3">
                            <FileText className="w-5 h-5 text-primary-600" />
                            <div>
                              <p className="text-sm font-medium text-gray-700">{file.name}</p>
                              <p className="text-xs text-gray-400">{(file.size / 1024).toFixed(1)} KB</p>
                            </div>
                          </div>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              removeFile(index);
                            }}
                            className="p-1 rounded text-gray-400 hover:text-red-500 hover:bg-red-50 transition-colors"
                          >
                            <X className="w-4 h-4" />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {currentStep === 3 && (
                <div className="space-y-5" style={{ animation: 'fadeIn 0.2s ease-out' }}>
                  <p className="text-sm text-gray-500">请确认以下任务信息：</p>
                  <div className="bg-gray-50 rounded-xl p-5 space-y-4">
                    <ConfirmRow label="任务名称" value={form.name || '-'} />
                    <ConfirmRow label="关联项目" value={form.projectName || '-'} />
                    <ConfirmRow
                      label="任务描述"
                      value={form.description || '无描述'}
                    />
                    <ConfirmRow
                      label="适用标准"
                      value={`${form.selectedStandards.length} 项标准`}
                    />
                    <ConfirmRow
                      label="上传文件"
                      value={`${form.files.length} 个文件`}
                    />
                  </div>
                  <div className="flex items-start gap-2 p-4 bg-primary-50 border border-primary-200 rounded-lg">
                    <CheckCircle2 className="w-5 h-5 text-primary-600 mt-0.5 flex-shrink-0" />
                    <p className="text-sm text-primary-800">
                      创建后任务将进入待开始状态，您可以随时开始执行检查。
                    </p>
                  </div>
                </div>
              )}
            </div>

            <div className="flex items-center justify-between px-6 py-4 border-t border-gray-100 bg-gray-50">
              <button
                onClick={currentStep === 0 ? closeModal : prevStep}
                className="px-5 py-2.5 text-sm font-medium text-gray-600 hover:text-gray-800 hover:bg-gray-200 rounded-lg transition-colors"
              >
                {currentStep === 0 ? '取消' : '上一步'}
              </button>
              {currentStep < stepLabels.length - 1 ? (
                <button
                  onClick={nextStep}
                  disabled={!canProceed}
                  className={cn(
                    'inline-flex items-center gap-2 px-5 py-2.5 text-sm font-medium rounded-lg transition-all',
                    canProceed
                      ? 'bg-primary-700 hover:bg-primary-800 text-white shadow-sm hover:shadow-md'
                      : 'bg-gray-200 text-gray-400 cursor-not-allowed'
                  )}
                >
                  下一步
                  <ArrowRight className="w-4 h-4" />
                </button>
              ) : (
                <button
                  onClick={handleCreate}
                  className="inline-flex items-center gap-2 px-5 py-2.5 bg-primary-700 hover:bg-primary-800 text-white text-sm font-medium rounded-lg shadow-sm hover:shadow-md transition-all"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  创建任务
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function StatCard({
  icon,
  label,
  value,
  bgColor,
  iconBg,
}: {
  icon: React.ReactNode;
  label: string;
  value: number;
  bgColor: string;
  iconBg: string;
}) {
  return (
    <div className="bg-white rounded-xl border border-gray-200 shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all duration-200 overflow-hidden">
      <div className="flex items-center p-5">
        <div
          className={cn(
            'w-12 h-12 rounded-xl flex items-center justify-center text-white shadow-inner',
            bgColor
          )}
        >
          <div className={cn('w-10 h-10 rounded-lg flex items-center justify-center', iconBg)}>
            {icon}
          </div>
        </div>
        <div className="ml-4 flex-1">
          <p className="text-sm text-gray-500">{label}</p>
          <p className="text-2xl font-bold text-gray-800 mt-0.5">{value}</p>
        </div>
      </div>
      <div className={cn('h-1 w-full', bgColor)} style={{ opacity: 0.85 }} />
    </div>
  );
}

function TaskCard({ task }: { task: CheckTask }) {
  const status = statusConfig[task.status];

  return (
    <div className="bg-white rounded-xl border border-gray-200 shadow-sm hover:shadow-lg hover:-translate-y-1 transition-all duration-300 overflow-hidden">
      <div className="p-5">
        <div className="flex items-start justify-between mb-3">
          <div className="flex-1 min-w-0">
            <h3 className="text-base font-semibold text-gray-800 truncate">{task.name}</h3>
            <div className="flex items-center gap-1.5 mt-1.5 text-gray-500">
              <FolderOpen className="w-3.5 h-3.5" />
              <span className="text-xs truncate">{task.projectName}</span>
            </div>
          </div>
          <span
            className={cn(
              'inline-flex items-center px-2.5 py-1 rounded-md text-xs font-medium border flex-shrink-0 ml-3',
              status.className
            )}
          >
            {status.label}
          </span>
        </div>

        <div className="mb-4">
          <div className="flex items-center justify-between mb-1.5">
            <span className="text-xs text-gray-500">检查进度</span>
            <span className="text-xs font-semibold text-gray-700">{task.progress}%</span>
          </div>
          <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
            <div
              className="h-full rounded-full transition-all duration-500"
              style={{
                width: `${task.progress}%`,
                background:
                  task.status === 'completed'
                    ? 'linear-gradient(90deg, #10b981, #059669)'
                    : task.status === 'running'
                    ? 'linear-gradient(90deg, #3b82f6, #1e3a5f)'
                    : '#d1d5db',
              }}
            />
          </div>
        </div>

        <div className="grid grid-cols-3 gap-3 mb-4">
          <div className="text-center p-2.5 bg-gray-50 rounded-lg">
            <Database className="w-4 h-4 text-gray-400 mx-auto mb-1" />
            <p className="text-sm font-semibold text-gray-800">{task.totalFields}</p>
            <p className="text-[10px] text-gray-500">字段总数</p>
          </div>
          <div className="text-center p-2.5 bg-gray-50 rounded-lg">
            <AlertCircle className="w-4 h-4 text-amber-500 mx-auto mb-1" />
            <p className="text-sm font-semibold text-gray-800">{task.issueCount}</p>
            <p className="text-[10px] text-gray-500">问题数</p>
          </div>
          <div className="text-center p-2.5 bg-gray-50 rounded-lg">
            <Clock className="w-4 h-4 text-gray-400 mx-auto mb-1" />
            <p className="text-sm font-semibold text-gray-800">{task.createdAt.slice(5)}</p>
            <p className="text-[10px] text-gray-500">检查时间</p>
          </div>
        </div>

        <div className="flex flex-wrap gap-1.5 mb-4">
          {task.standardCategories.map((cat) => (
            <span
              key={cat}
              className="inline-flex items-center px-2 py-0.5 rounded-md bg-primary-50 text-primary-700 text-[11px] font-medium border border-primary-100"
            >
              {cat}
            </span>
          ))}
        </div>
      </div>

      <div className="flex items-center border-t border-gray-100 bg-gray-50/50">
        <button className="flex-1 flex items-center justify-center gap-1.5 py-3 text-sm font-medium text-gray-600 hover:text-primary-700 hover:bg-gray-100 transition-colors border-r border-gray-100">
          <FileText className="w-4 h-4" />
          查看详情
        </button>
        <button
          className={cn(
            'flex-1 flex items-center justify-center gap-1.5 py-3 text-sm font-medium transition-colors',
            task.status === 'completed' || task.status === 'archived'
              ? 'text-gray-400 cursor-not-allowed'
              : 'text-primary-700 hover:text-primary-800 hover:bg-primary-50'
          )}
          disabled={task.status === 'completed' || task.status === 'archived'}
        >
          <Play className="w-4 h-4" />
          {task.status === 'running' ? '继续检查' : '开始检查'}
        </button>
      </div>
    </div>
  );
}

function StandardTreeItem({
  category,
  level,
  expandedCategories,
  selectedStandards,
  onToggleCategory,
  onToggleStandard,
}: {
  category: StandardCategory;
  level: number;
  expandedCategories: Set<string>;
  selectedStandards: string[];
  onToggleCategory: (id: string) => void;
  onToggleStandard: (id: string) => void;
}) {
  const hasChildren = category.children && category.children.length > 0;
  const isExpanded = expandedCategories.has(category.id);
  const isSelected = selectedStandards.includes(category.id);
  const allChildrenSelected =
    hasChildren &&
    category.children!.every((child) => selectedStandards.includes(child.id));
  const someChildrenSelected =
    hasChildren &&
    category.children!.some((child) => selectedStandards.includes(child.id)) &&
    !allChildrenSelected;

  return (
    <div>
      <div
        className="flex items-center gap-2 px-4 py-2.5 hover:bg-gray-50 transition-colors cursor-pointer"
        style={{ paddingLeft: `${16 + level * 20}px` }}
      >
        {hasChildren ? (
          <button
            onClick={() => onToggleCategory(category.id)}
            className="p-0.5 rounded text-gray-400 hover:text-gray-600 transition-colors"
          >
            <ChevronRight
              className={cn(
                'w-4 h-4 transition-transform',
                isExpanded && 'rotate-90'
              )}
            />
          </button>
        ) : (
          <span className="w-5" />
        )}
        <label className="flex items-center gap-2.5 cursor-pointer flex-1">
          <div
            className={cn(
              'w-4 h-4 rounded border flex items-center justify-center transition-all',
              isSelected || allChildrenSelected
                ? 'bg-primary-700 border-primary-700'
                : someChildrenSelected
                ? 'bg-primary-700 border-primary-700'
                : 'border-gray-300 hover:border-primary-400'
            )}
            onClick={(e) => {
              e.preventDefault();
              if (hasChildren) {
                category.children!.forEach((child) => {
                  if (!selectedStandards.includes(child.id)) {
                    onToggleStandard(child.id);
                  }
                });
                if (allChildrenSelected) {
                  category.children!.forEach((child) => {
                    onToggleStandard(child.id);
                  });
                }
              } else {
                onToggleStandard(category.id);
              }
            }}
          >
            {(isSelected || allChildrenSelected) && (
              <CheckCircle2 className="w-3 h-3 text-white" />
            )}
            {someChildrenSelected && (
              <div className="w-2 h-0.5 bg-white rounded" />
            )}
          </div>
          <span className="text-sm text-gray-700">{category.name}</span>
        </label>
      </div>
      {hasChildren && isExpanded && (
        <div>
          {category.children!.map((child) => (
            <StandardTreeItem
              key={child.id}
              category={child}
              level={level + 1}
              expandedCategories={expandedCategories}
              selectedStandards={selectedStandards}
              onToggleCategory={onToggleCategory}
              onToggleStandard={onToggleStandard}
            />
          ))}
        </div>
      )}
    </div>
  );
}

function ConfirmRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-start">
      <span className="text-sm text-gray-500 w-24 flex-shrink-0">{label}</span>
      <span className="text-sm font-medium text-gray-800">{value}</span>
    </div>
  );
}

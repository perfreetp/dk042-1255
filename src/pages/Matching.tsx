import { useState, useMemo, useRef, useCallback, useEffect } from 'react';
import {
  Search,
  Upload,
  Check,
  X,
  ChevronDown,
  ChevronRight,
  FileSpreadsheet,
  Trash2,
  RefreshCw,
} from 'lucide-react';
import { useAppStore } from '@/store';
import type { DataField, StandardCategory } from '@/types';
import { clsx } from 'clsx';

interface UploadedFile {
  id: string;
  name: string;
  size: string;
}

type SortOrder = 'asc' | 'desc' | null;
type StatusFilter = 'all' | 'pending' | 'confirmed' | 'rejected';

function TreeNode({
  category,
  level = 0,
  expandedIds,
  selectedIds,
  onToggleExpand,
  onToggleSelect,
}: {
  category: StandardCategory;
  level?: number;
  expandedIds: Set<string>;
  selectedIds: Set<string>;
  onToggleExpand: (id: string) => void;
  onToggleSelect: (id: string) => void;
}) {
  const hasChildren = category.children && category.children.length > 0;
  const isExpanded = expandedIds.has(category.id);
  const isSelected = selectedIds.has(category.id);

  const handleCheckboxChange = (e: React.MouseEvent) => {
    e.stopPropagation();
    onToggleSelect(category.id);
  };

  const handleToggle = () => {
    if (hasChildren) {
      onToggleExpand(category.id);
    }
  };

  return (
    <div>
      <div
        className={clsx(
          'flex items-center gap-2 py-2 px-2 rounded-md hover:bg-primary-50 cursor-pointer transition-colors duration-200',
          isSelected && 'bg-primary-100',
        )}
        style={{ paddingLeft: `${level * 16 + 8}px` }}
        onClick={handleToggle}
      >
        {hasChildren ? (
          <span className="text-gray-500 transition-transform duration-200">
            {isExpanded ? (
              <ChevronDown className="w-4 h-4" />
            ) : (
              <ChevronRight className="w-4 h-4" />
            )}
          </span>
        ) : (
          <span className="w-4 h-4" />
        )}
        <label className="flex items-center gap-2 flex-1 cursor-pointer">
          <input
            type="checkbox"
            checked={isSelected}
            onChange={() => {}}
            onClick={handleCheckboxChange}
            className="w-4 h-4 rounded border-gray-300 text-primary-700 focus:ring-primary-500 cursor-pointer"
          />
          <span className={clsx('text-sm', isSelected ? 'text-primary-800 font-medium' : 'text-gray-700')}>
            {category.name}
          </span>
        </label>
      </div>
      {hasChildren && (
        <div
          className={clsx(
            'overflow-hidden transition-all duration-300 ease-in-out',
            isExpanded ? 'max-h-[1000px] opacity-100' : 'max-h-0 opacity-0',
          )}
        >
          {category.children!.map((child) => (
            <TreeNode
              key={child.id}
              category={child}
              level={level + 1}
              expandedIds={expandedIds}
              selectedIds={selectedIds}
              onToggleExpand={onToggleExpand}
              onToggleSelect={onToggleSelect}
            />
          ))}
        </div>
      )}
    </div>
  );
}

function MatchScoreBar({ score }: { score: number }) {
  const getColor = () => {
    if (score >= 90) return 'from-green-400 to-green-600';
    if (score >= 70) return 'from-yellow-400 to-yellow-600';
    return 'from-red-400 to-red-600';
  };

  const getTextColor = () => {
    if (score >= 90) return 'text-green-700';
    if (score >= 70) return 'text-yellow-700';
    return 'text-red-700';
  };

  return (
    <div className="flex items-center gap-2">
      <div className="flex-1 h-2 bg-gray-100 rounded-full overflow-hidden min-w-[60px]">
        <div
          className={clsx('h-full rounded-full bg-gradient-to-r transition-all duration-500', getColor())}
          style={{ width: `${score}%` }}
        />
      </div>
      <span className={clsx('text-sm font-semibold min-w-[36px]', getTextColor())}>
        {score}%
      </span>
    </div>
  );
}

function StatusBadge({ status }: { status: DataField['matchStatus'] }) {
  const config = {
    pending: {
      label: '待确认',
      className: 'bg-gray-100 text-gray-700 border-gray-300',
      animate: true,
    },
    confirmed: {
      label: '已确认',
      className: 'bg-green-100 text-green-700 border-green-300',
      animate: false,
    },
    rejected: {
      label: '已拒绝',
      className: 'bg-red-100 text-red-700 border-red-300',
      animate: false,
    },
  };

  const cfg = config[status];

  return (
    <span
      className={clsx(
        'inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium border',
        cfg.className,
        cfg.animate && 'animate-pulse',
      )}
    >
      {cfg.label}
    </span>
  );
}

export default function Matching() {
  const {
    dataFields,
    dataStandards,
    standardCategories,
    confirmFieldMatch,
    currentTaskId,
    checkTasks,
    setCurrentTaskId,
  } = useAppStore();

  const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set(['cat-2', 'cat-3']));
  const [selectedCategoryIds, setSelectedCategoryIds] = useState<Set<string>>(new Set());
  const [uploadedFiles, setUploadedFiles] = useState<UploadedFile[]>([]);
  const [isDragOver, setIsDragOver] = useState(false);
  const [sortOrder, setSortOrder] = useState<SortOrder>('desc');
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');
  const [selectedFieldId, setSelectedFieldId] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const currentTask = useMemo(() => {
    return checkTasks.find((t) => t.id === currentTaskId) ?? null;
  }, [checkTasks, currentTaskId]);

  const taskFields = useMemo(() => {
    return dataFields.filter((f) => f.taskId === currentTaskId);
  }, [dataFields, currentTaskId]);

  const selectedCategoryLeafNames = useMemo(() => {
    const leafNames = new Set<string>();
    const collectLeafNames = (cats: StandardCategory[]) => {
      for (const cat of cats) {
        if (selectedCategoryIds.has(cat.id)) {
          const getLeaves = (c: StandardCategory): string[] => {
            if (!c.children || c.children.length === 0) {
              return [c.name];
            }
            return c.children.flatMap(getLeaves);
          };
          getLeaves(cat).forEach((name) => leafNames.add(name));
        }
        if (cat.children) {
          collectLeafNames(cat.children);
        }
      }
    };
    collectLeafNames(standardCategories);
    return leafNames;
  }, [selectedCategoryIds, standardCategories]);

  const hasCategoryFilter = selectedCategoryLeafNames.size > 0;

  const filteredAndSortedFields = useMemo(() => {
    let fields = [...taskFields];

    if (statusFilter !== 'all') {
      fields = fields.filter((f) => f.matchStatus === statusFilter);
    }

    if (searchTerm.trim()) {
      const term = searchTerm.toLowerCase();
      fields = fields.filter(
        (f) =>
          f.fieldName.toLowerCase().includes(term) ||
          f.description.toLowerCase().includes(term) ||
          (f.tableName && f.tableName.toLowerCase().includes(term)),
      );
    }

    if (sortOrder) {
      fields.sort((a, b) => {
        const diff = a.matchScore - b.matchScore;
        return sortOrder === 'asc' ? diff : -diff;
      });
    }

    return fields;
  }, [taskFields, statusFilter, sortOrder, searchTerm]);

  const fieldsWithCategoryInfo = useMemo(() => {
    return filteredAndSortedFields.map((field) => {
      let matchedCategory: string | undefined;
      let categoryOutOfRange = false;
      if (field.matchedStandardId) {
        const std = dataStandards.find((s) => s.id === field.matchedStandardId);
        if (std) {
          matchedCategory = std.category;
          if (hasCategoryFilter && !selectedCategoryLeafNames.has(std.category)) {
            categoryOutOfRange = true;
          }
        }
      }
      return { field, matchedCategory, categoryOutOfRange };
    });
  }, [filteredAndSortedFields, dataStandards, hasCategoryFilter, selectedCategoryLeafNames]);

  const selectedField = useMemo(() => {
    return dataFields.find((f) => f.id === selectedFieldId) ?? null;
  }, [dataFields, selectedFieldId]);

  const candidateStandards = useMemo(() => {
    if (!selectedField) return [];
    let standards = [...dataStandards];
    if (hasCategoryFilter) {
      standards = standards.filter((std) => selectedCategoryLeafNames.has(std.category));
    }
    return standards
      .map((std) => {
        let score = 0;
        const fieldName = selectedField.fieldName.toLowerCase();
        const stdFieldName = std.standardFieldName.toLowerCase();

        if (fieldName === stdFieldName) score = 100;
        else if (fieldName.includes(stdFieldName) || stdFieldName.includes(fieldName)) score = 90;
        else {
          const fieldWords = fieldName.split(/[_\s]/);
          const stdWords = stdFieldName.split(/[_\s]/);
          const matchCount = fieldWords.filter((w) => stdWords.includes(w)).length;
          score = Math.round((matchCount / Math.max(fieldWords.length, stdWords.length)) * 100);
        }

        if (selectedField.description && std.description) {
          const descMatch = selectedField.description.includes(std.standardName);
          if (descMatch) score = Math.min(100, score + 10);
        }

        return { standard: std, score: Math.min(100, Math.max(30, score)) };
      })
      .sort((a, b) => b.score - a.score)
      .slice(0, 5);
  }, [selectedField, dataStandards, hasCategoryFilter, selectedCategoryLeafNames]);

  const matchedStandard = useMemo(() => {
    if (!selectedField?.matchedStandardId) return null;
    return dataStandards.find((s) => s.id === selectedField.matchedStandardId) ?? null;
  }, [selectedField, dataStandards]);

  const matchedStandardOutOfRange = useMemo(() => {
    if (!matchedStandard || !hasCategoryFilter) return false;
    return !selectedCategoryLeafNames.has(matchedStandard.category);
  }, [matchedStandard, hasCategoryFilter, selectedCategoryLeafNames]);

  useEffect(() => {
    if (taskFields.length === 0 && checkTasks.length > 0) {
      const taskWithFields = checkTasks.find(
        (task) => dataFields.filter((f) => f.taskId === task.id).length > 0,
      );
      if (taskWithFields && taskWithFields.id !== currentTaskId) {
        setCurrentTaskId(taskWithFields.id);
      }
    }
  }, [taskFields.length, checkTasks, dataFields, currentTaskId, setCurrentTaskId]);

  useEffect(() => {
    if (selectedFieldId === null && taskFields.length > 0) {
      setSelectedFieldId(taskFields[0].id);
    }
  }, [selectedFieldId, taskFields]);

  const handleTaskChange = (taskId: string) => {
    setCurrentTaskId(taskId);
    const newTaskFields = dataFields.filter((f) => f.taskId === taskId);
    if (newTaskFields.length > 0) {
      setSelectedFieldId(newTaskFields[0].id);
    } else {
      setSelectedFieldId(null);
    }
  };

  const handleToggleExpand = useCallback((id: string) => {
    setExpandedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  }, []);

  const handleToggleSelect = useCallback((id: string) => {
    const findCategory = (cats: StandardCategory[], targetId: string): StandardCategory | null => {
      for (const cat of cats) {
        if (cat.id === targetId) return cat;
        if (cat.children) {
          const found = findCategory(cat.children, targetId);
          if (found) return found;
        }
      }
      return null;
    };

    const category = findCategory(standardCategories, id);
    if (!category) return;

    const getAllChildIds = (cat: StandardCategory): string[] => {
      let ids: string[] = [cat.id];
      if (cat.children) {
        cat.children.forEach((child) => {
          ids = ids.concat(getAllChildIds(child));
        });
      }
      return ids;
    };

    const affectedIds = getAllChildIds(category);

    setSelectedCategoryIds((prev) => {
      const next = new Set(prev);
      const isSelected = next.has(id);
      if (isSelected) {
        affectedIds.forEach((iid) => next.delete(iid));
      } else {
        affectedIds.forEach((iid) => next.add(iid));
      }
      return next;
    });
  }, [standardCategories]);

  const handleFileSelect = (files: FileList | null) => {
    if (!files) return;
    const newFiles: UploadedFile[] = Array.from(files).map((file) => ({
      id: `file-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`,
      name: file.name,
      size: file.size < 1024 ? `${file.size} B` : file.size < 1024 * 1024 ? `${(file.size / 1024).toFixed(1)} KB` : `${(file.size / (1024 * 1024)).toFixed(2)} MB`,
    }));
    setUploadedFiles((prev) => [...prev, ...newFiles]);
  };

  const handleRemoveFile = (id: string) => {
    setUploadedFiles((prev) => prev.filter((f) => f.id !== id));
  };

  const handleSortToggle = () => {
    setSortOrder((prev) => (prev === 'desc' ? 'asc' : prev === 'asc' ? null : 'desc'));
  };

  const handleConfirmAll = () => {
    filteredAndSortedFields.forEach((field) => {
      if (field.matchStatus === 'pending') {
        confirmFieldMatch(field.id, true);
      }
    });
  };

  const handleExport = () => {
    alert('批量导出功能：已准备好导出匹配结果报告');
  };

  const stats = useMemo(() => {
    const total = taskFields.length;
    const confirmed = taskFields.filter((f) => f.matchStatus === 'confirmed').length;
    const pending = taskFields.filter((f) => f.matchStatus === 'pending').length;
    const rejected = taskFields.filter((f) => f.matchStatus === 'rejected').length;
    return { total, confirmed, pending, rejected };
  }, [taskFields]);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-bold text-gray-800">字段匹配</h1>
              {currentTask && (
                <span className="text-sm px-3 py-1 bg-primary-100 text-primary-800 rounded-full font-medium">
                  {currentTask.name}
                </span>
              )}
            </div>
            <p className="text-gray-500 mt-1">将数据字段与标准数据元进行智能匹配与映射</p>
          </div>
          <div className="flex items-center gap-2">
            <label className="text-sm text-gray-600">任务：</label>
            <select
              value={currentTaskId}
              onChange={(e) => handleTaskChange(e.target.value)}
              className="px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 bg-white min-w-[200px]"
            >
              {checkTasks.map((task) => (
                <option key={task.id} value={task.id}>
                  {task.name}
                </option>
              ))}
            </select>
          </div>
        </div>
        <div className="flex items-center gap-4 text-sm">
          <div className="flex items-center gap-2 px-3 py-1.5 bg-gray-100 rounded-lg">
            <span className="text-gray-500">总计</span>
            <span className="font-semibold text-gray-800">{stats.total}</span>
          </div>
          <div className="flex items-center gap-2 px-3 py-1.5 bg-green-50 rounded-lg">
            <span className="text-green-600">已确认</span>
            <span className="font-semibold text-green-700">{stats.confirmed}</span>
          </div>
          <div className="flex items-center gap-2 px-3 py-1.5 bg-gray-100 rounded-lg">
            <span className="text-gray-600">待确认</span>
            <span className="font-semibold text-gray-800">{stats.pending}</span>
          </div>
          <div className="flex items-center gap-2 px-3 py-1.5 bg-red-50 rounded-lg">
            <span className="text-red-600">已拒绝</span>
            <span className="font-semibold text-red-700">{stats.rejected}</span>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden" style={{ height: 'calc(100vh - 220px)', minHeight: '600px' }}>
        <div className="flex h-full">
          <div className="w-[18%] min-w-[200px] border-r border-gray-200 flex flex-col bg-gray-50/50">
            <div className="px-4 py-3 border-b border-gray-200 bg-white">
              <h2 className="font-semibold text-gray-800 text-sm">标准范围</h2>
              <p className="text-xs text-gray-500 mt-0.5">选择参与匹配的数据标准域</p>
            </div>
            <div className="flex-1 overflow-y-auto p-2 space-y-0.5">
              {standardCategories.map((category) => (
                <TreeNode
                  key={category.id}
                  category={category}
                  expandedIds={expandedIds}
                  selectedIds={selectedCategoryIds}
                  onToggleExpand={handleToggleExpand}
                  onToggleSelect={handleToggleSelect}
                />
              ))}
            </div>
            <div className="px-4 py-3 border-t border-gray-200 bg-white">
              <p className="text-xs text-gray-500">
                已选择 <span className="font-semibold text-primary-700">{selectedCategoryIds.size}</span> 个分类
              </p>
            </div>
          </div>

          <div className="w-[52%] flex flex-col border-r border-gray-200">
            <div className="px-4 py-3 border-b border-gray-200 bg-gradient-to-r from-gray-50 to-white">
              <h2 className="font-semibold text-gray-800 text-sm">数据字段</h2>
              <p className="text-xs text-gray-500 mt-0.5">上传数据文件，查看智能匹配结果</p>
            </div>

            <div className="px-4 py-3 border-b border-gray-200">
              <div
                className={clsx(
                  'relative border-2 border-dashed rounded-xl p-5 text-center transition-all duration-300',
                  isDragOver
                    ? 'border-primary-500 bg-primary-50'
                    : 'border-gray-300 bg-gray-50/50 hover:border-primary-300 hover:bg-primary-50/30',
                )}
                onDragOver={(e) => {
                  e.preventDefault();
                  setIsDragOver(true);
                }}
                onDragLeave={() => setIsDragOver(false)}
                onDrop={(e) => {
                  e.preventDefault();
                  setIsDragOver(false);
                  handleFileSelect(e.dataTransfer.files);
                }}
              >
                <div className="flex flex-col items-center gap-2">
                  <div className={clsx(
                    'w-12 h-12 rounded-full flex items-center justify-center transition-colors',
                    isDragOver ? 'bg-primary-100 text-primary-600' : 'bg-primary-50 text-primary-500',
                  )}>
                    <Upload className="w-6 h-6" />
                  </div>
                  <div className="text-sm">
                    <span className="text-gray-600">拖拽文件到此处，或</span>
                    <button
                      onClick={() => fileInputRef.current?.click()}
                      className="ml-1.5 text-primary-600 font-medium hover:text-primary-800 hover:underline"
                    >
                      选择文件
                    </button>
                  </div>
                  <p className="text-xs text-gray-400">支持 .xlsx, .csv, .sql, .json 格式</p>
                  <input
                    ref={fileInputRef}
                    type="file"
                    multiple
                    accept=".xlsx,.csv,.sql,.json"
                    className="hidden"
                    onChange={(e) => handleFileSelect(e.target.files)}
                  />
                </div>
              </div>

              {uploadedFiles.length > 0 && (
                <div className="mt-3 space-y-2">
                  {uploadedFiles.map((file) => (
                    <div
                      key={file.id}
                      className="flex items-center justify-between px-3 py-2 bg-white border border-gray-200 rounded-lg hover:border-primary-300 transition-colors"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg bg-green-50 flex items-center justify-center text-green-600">
                          <FileSpreadsheet className="w-4 h-4" />
                        </div>
                        <div>
                          <p className="text-sm font-medium text-gray-800">{file.name}</p>
                          <p className="text-xs text-gray-500">{file.size}</p>
                        </div>
                      </div>
                      <button
                        onClick={() => handleRemoveFile(file.id)}
                        className="p-1.5 rounded-lg text-gray-400 hover:text-red-600 hover:bg-red-50 transition-colors"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="px-4 py-3 border-b border-gray-200 flex items-center justify-between gap-4 bg-white">
              <div className="flex items-center gap-3 flex-1">
                <div className="relative flex-1 max-w-xs">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input
                    type="text"
                    placeholder="搜索字段名、描述、表名..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full pl-9 pr-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 transition-all"
                  />
                </div>
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value as StatusFilter)}
                  className="px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 bg-white"
                >
                  <option value="all">全部状态</option>
                  <option value="pending">待确认</option>
                  <option value="confirmed">已确认</option>
                  <option value="rejected">已拒绝</option>
                </select>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={handleConfirmAll}
                  className="inline-flex items-center gap-1.5 px-3 py-2 text-sm font-medium text-white bg-green-600 rounded-lg hover:bg-green-700 transition-colors shadow-sm"
                >
                  <Check className="w-4 h-4" />
                  全部确认
                </button>
                <button
                  onClick={handleExport}
                  className="inline-flex items-center gap-1.5 px-3 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 hover:border-gray-300 transition-colors"
                >
                  <FileSpreadsheet className="w-4 h-4" />
                  批量导出
                </button>
              </div>
            </div>

            <div className="flex-1 overflow-auto">
              <table className="w-full">
                <thead className="bg-gray-50 sticky top-0 z-10">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">字段名</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">字段类型</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">所属表</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">描述</th>
                    <th
                      className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider cursor-pointer select-none hover:text-primary-700"
                      onClick={handleSortToggle}
                    >
                      <div className="flex items-center gap-1">
                        匹配度
                        <RefreshCw className={clsx(
                          'w-3 h-3 transition-transform',
                          sortOrder === 'asc' && 'rotate-180',
                          sortOrder === null && 'opacity-30',
                        )} />
                      </div>
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">状态</th>
                    <th className="px-4 py-3 text-center text-xs font-semibold text-gray-600 uppercase tracking-wider">操作</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {fieldsWithCategoryInfo.map(({ field, categoryOutOfRange }, idx) => (
                    <tr
                      key={field.id}
                      className={clsx(
                        'cursor-pointer transition-colors duration-150',
                        idx % 2 === 0 ? 'bg-white' : 'bg-gray-50/30',
                        selectedFieldId === field.id ? 'bg-primary-50 hover:bg-primary-50' : 'hover:bg-primary-50/50',
                        categoryOutOfRange && 'bg-amber-50/50',
                      )}
                      onClick={() => setSelectedFieldId(field.id)}
                    >
                      <td className="px-4 py-3">
                        <div className="flex flex-col">
                          <span className="text-sm font-mono text-primary-800 font-medium">{field.fieldName}</span>
                          {categoryOutOfRange && (
                            <span className="text-xs text-amber-600 mt-0.5">⚠ 匹配标准不在所选范围内</span>
                          )}
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <span className="text-xs px-2 py-1 bg-gray-100 text-gray-700 rounded font-mono">
                          {field.fieldType}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <span className="text-sm text-gray-600 font-mono">{field.tableName}</span>
                      </td>
                      <td className="px-4 py-3">
                        <span className="text-sm text-gray-600 line-clamp-1">{field.description}</span>
                      </td>
                      <td className="px-4 py-3 w-[140px]">
                        <MatchScoreBar score={field.matchScore} />
                      </td>
                      <td className="px-4 py-3">
                        <StatusBadge status={field.matchStatus} />
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center justify-center gap-1" onClick={(e) => e.stopPropagation()}>
                          {field.matchStatus !== 'confirmed' && (
                            <button
                              onClick={() => confirmFieldMatch(field.id, true)}
                              className="p-1.5 rounded-lg text-green-600 hover:bg-green-100 transition-colors"
                              title="确认匹配"
                            >
                              <Check className="w-4 h-4" />
                            </button>
                          )}
                          {field.matchStatus !== 'rejected' && (
                            <button
                              onClick={() => confirmFieldMatch(field.id, false)}
                              className="p-1.5 rounded-lg text-red-600 hover:bg-red-100 transition-colors"
                              title="拒绝匹配"
                            >
                              <X className="w-4 h-4" />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {fieldsWithCategoryInfo.length === 0 && (
                <div className="py-16 text-center">
                  <div className="w-16 h-16 mx-auto rounded-full bg-gray-100 flex items-center justify-center text-gray-400 mb-4">
                    <Search className="w-8 h-8" />
                  </div>
                  <p className="text-gray-500 text-sm">未找到匹配的字段</p>
                </div>
              )}
            </div>
          </div>

          <div className="w-[30%] flex flex-col bg-gray-50/30">
            <div className="px-4 py-3 border-b border-gray-200 bg-white">
              <h2 className="font-semibold text-gray-800 text-sm">匹配详情</h2>
              <p className="text-xs text-gray-500 mt-0.5">查看字段信息并选择最佳匹配标准</p>
            </div>

            <div className="flex-1 overflow-y-auto">
              {selectedField ? (
                <div className="p-4 space-y-5">
                  <div className="bg-white rounded-xl border border-gray-200 p-4">
                    <div className="flex items-center justify-between mb-3">
                      <h3 className="font-semibold text-gray-800 text-sm">当前字段</h3>
                      <StatusBadge status={selectedField.matchStatus} />
                    </div>
                    <div className="space-y-3">
                      <div>
                        <p className="text-xs text-gray-500 mb-1">字段名</p>
                        <p className="text-sm font-mono font-semibold text-primary-800 bg-primary-50 px-2.5 py-1.5 rounded-lg inline-block">
                          {selectedField.fieldName}
                        </p>
                      </div>
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <p className="text-xs text-gray-500 mb-1">字段类型</p>
                          <p className="text-sm font-mono text-gray-800">{selectedField.fieldType}</p>
                        </div>
                        <div>
                          <p className="text-xs text-gray-500 mb-1">所属表</p>
                          <p className="text-sm font-mono text-gray-800">{selectedField.tableName}</p>
                        </div>
                      </div>
                      <div>
                        <p className="text-xs text-gray-500 mb-1">描述</p>
                        <p className="text-sm text-gray-700">{selectedField.description}</p>
                      </div>
                      {selectedField.sampleValue && (
                        <div>
                          <p className="text-xs text-gray-500 mb-1">示例值</p>
                          <p className="text-sm text-gray-700 bg-gray-50 px-2.5 py-1.5 rounded-lg font-mono">
                            {selectedField.sampleValue}
                          </p>
                        </div>
                      )}
                      <div>
                        <p className="text-xs text-gray-500 mb-1.5">最佳匹配度</p>
                        <MatchScoreBar score={selectedField.matchScore} />
                      </div>
                    </div>
                  </div>

                  {matchedStandard && (
                    <div
                      className={clsx(
                        'rounded-xl border p-4',
                        matchedStandardOutOfRange
                          ? 'bg-amber-50 border-amber-200'
                          : 'bg-green-50 border-green-200',
                      )}
                    >
                      <div className="flex items-center gap-2 mb-3">
                        <div
                          className={clsx(
                            'w-6 h-6 rounded-full flex items-center justify-center text-white',
                            matchedStandardOutOfRange ? 'bg-amber-500' : 'bg-green-500',
                          )}
                        >
                          {matchedStandardOutOfRange ? (
                            <span className="text-xs">!</span>
                          ) : (
                            <Check className="w-4 h-4" />
                          )}
                        </div>
                        <h3
                          className={clsx(
                            'font-semibold text-sm',
                            matchedStandardOutOfRange ? 'text-amber-800' : 'text-green-800',
                          )}
                        >
                          {matchedStandardOutOfRange ? '已关联标准（不在所选范围）' : '已关联标准'}
                        </h3>
                      </div>
                      <div className="space-y-2">
                        <div className="flex justify-between">
                          <span
                            className={clsx(
                              'text-xs',
                              matchedStandardOutOfRange ? 'text-amber-700' : 'text-green-700',
                            )}
                          >
                            标准字段名
                          </span>
                          <span
                            className={clsx(
                              'text-sm font-mono font-medium',
                              matchedStandardOutOfRange ? 'text-amber-800' : 'text-green-800',
                            )}
                          >
                            {matchedStandard.standardFieldName}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span
                            className={clsx(
                              'text-xs',
                              matchedStandardOutOfRange ? 'text-amber-700' : 'text-green-700',
                            )}
                          >
                            标准名称
                          </span>
                          <span
                            className={clsx(
                              'text-sm font-medium',
                              matchedStandardOutOfRange ? 'text-amber-800' : 'text-green-800',
                            )}
                          >
                            {matchedStandard.standardName}
                          </span>
                        </div>
                      </div>
                    </div>
                  )}

                  <div className="bg-white rounded-xl border border-gray-200 p-4">
                    <h3 className="font-semibold text-gray-800 text-sm mb-3">疑似匹配标准项</h3>
                    <div className="space-y-2">
                      {candidateStandards.length > 0 ? (
                        candidateStandards.map(({ standard, score }) => (
                          <div
                            key={standard.id}
                            className={clsx(
                              'p-3 rounded-lg border-2 cursor-pointer transition-all duration-200',
                              selectedField.matchedStandardId === standard.id
                                ? 'border-primary-500 bg-primary-50'
                                : 'border-gray-100 hover:border-primary-300 hover:bg-primary-50/50',
                            )}
                            onClick={() => {
                              if (selectedField.matchedStandardId !== standard.id) {
                                confirmFieldMatch(selectedField.id, true, standard.id);
                              }
                            }}
                          >
                          <div className="flex items-start justify-between gap-3">
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2 mb-1">
                                <p className="text-sm font-mono font-semibold text-primary-800 truncate">
                                  {standard.standardFieldName}
                                </p>
                                {selectedField.matchedStandardId === standard.id && (
                                  <span className="text-xs px-1.5 py-0.5 bg-primary-600 text-white rounded">已选</span>
                                )}
                              </div>
                              <p className="text-xs text-gray-500 mb-1">{standard.standardName} · {standard.category}</p>
                              <p className="text-xs text-gray-400 font-mono">{standard.standardType}</p>
                            </div>
                            <div className="text-right min-w-[60px]">
                              <MatchScoreBar score={score} />
                            </div>
                          </div>
                        </div>
                      ))
                    ) : (
                      <div className="py-8 text-center">
                        <p className="text-sm text-gray-500">所选范围内暂无匹配的标准项</p>
                      </div>
                    )}
                    </div>
                  </div>

                  {candidateStandards[0] && (
                    <div className="bg-white rounded-xl border border-gray-200 p-4">
                      <h3 className="font-semibold text-gray-800 text-sm mb-3">标准详情</h3>
                      <div className="space-y-3">
                        <div>
                          <p className="text-xs text-gray-500 mb-1">命名规则</p>
                          <p className="text-sm text-gray-700 bg-gray-50 px-3 py-2 rounded-lg">
                            {candidateStandards[0].standard.namingRule}
                          </p>
                        </div>
                        <div>
                          <p className="text-xs text-gray-500 mb-1">取值范围</p>
                          <p className="text-sm text-gray-700 bg-gray-50 px-3 py-2 rounded-lg">
                            {candidateStandards[0].standard.valueRange}
                          </p>
                        </div>
                        <div>
                          <p className="text-xs text-gray-500 mb-1">标准描述</p>
                          <p className="text-sm text-gray-700">{candidateStandards[0].standard.description}</p>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center h-full p-8 text-center">
                  <div className="w-20 h-20 rounded-full bg-gray-100 flex items-center justify-center text-gray-400 mb-4">
                    <Search className="w-10 h-10" />
                  </div>
                  <p className="text-gray-600 font-medium">未选择字段</p>
                  <p className="text-gray-400 text-sm mt-1">请从左侧列表选择一个字段查看详情</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

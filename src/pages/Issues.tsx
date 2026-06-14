import { useState, useMemo } from 'react';
import {
  AlertTriangle,
  AlertCircle,
  Info,
  CheckCircle,
  XCircle,
  Search,
  Filter,
  Send,
  Lightbulb,
  Eye,
  X,
  ChevronRight,
} from 'lucide-react';
import { useAppStore } from '@/store';
import type { Issue, IssueType, IssueSeverity, IssueStatus } from '@/types';

type TabType = 'all' | IssueType;
type SeverityFilter = 'all' | IssueSeverity;
type StatusFilter = 'all' | IssueStatus;

const ISSUE_TYPE_LABELS: Record<IssueType, string> = {
  naming: '命名规范',
  datatype: '数据类型',
  valuerange: '取值范围',
  other: '其他',
};

const ISSUE_TYPE_COLORS: Record<IssueType, string> = {
  naming: 'bg-blue-100 text-blue-700 border-blue-200',
  datatype: 'bg-purple-100 text-purple-700 border-purple-200',
  valuerange: 'bg-orange-100 text-orange-700 border-orange-200',
  other: 'bg-gray-100 text-gray-700 border-gray-200',
};

const ISSUE_STATUS_LABELS: Record<IssueStatus, string> = {
  open: '未处理',
  rectifying: '整改中',
  resolved: '已解决',
  falsepositive: '误报',
};

const ISSUE_STATUS_COLORS: Record<IssueStatus, string> = {
  open: 'bg-red-100 text-red-700 border-red-200',
  rectifying: 'bg-yellow-100 text-yellow-700 border-yellow-200',
  resolved: 'bg-green-100 text-green-700 border-green-200',
  falsepositive: 'bg-gray-100 text-gray-600 border-gray-200',
};

const SEVERITY_SIZES: Record<IssueSeverity, string> = {
  high: 'w-3 h-3',
  medium: 'w-2.5 h-2.5',
  low: 'w-2 h-2',
};

const SEVERITY_COLORS: Record<IssueSeverity, string> = {
  high: 'bg-red-500',
  medium: 'bg-yellow-500',
  low: 'bg-blue-500',
};

const SEVERITY_LABELS: Record<IssueSeverity, string> = {
  high: '高',
  medium: '中',
  low: '低',
};

export default function Issues() {
  const {
    issues,
    selectedIssueIds,
    toggleIssueSelection,
    clearIssueSelection,
    markIssueFalsePositive,
    batchMarkFalsePositive,
  } = useAppStore();

  const [activeTab, setActiveTab] = useState<TabType>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [severityFilter, setSeverityFilter] = useState<SeverityFilter>('all');
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');
  const [detailIssue, setDetailIssue] = useState<Issue | null>(null);
  const [drawerVisible, setDrawerVisible] = useState(false);

  const stats = useMemo(() => {
    const total = issues.length;
    const high = issues.filter((i) => i.severity === 'high').length;
    const rectifying = issues.filter((i) => i.status === 'rectifying').length;
    const resolved = issues.filter((i) => i.status === 'resolved').length;
    return { total, high, rectifying, resolved };
  }, [issues]);

  const tabCounts = useMemo(() => {
    return {
      all: issues.length,
      naming: issues.filter((i) => i.type === 'naming').length,
      datatype: issues.filter((i) => i.type === 'datatype').length,
      valuerange: issues.filter((i) => i.type === 'valuerange').length,
      other: issues.filter((i) => i.type === 'other').length,
    };
  }, [issues]);

  const filteredIssues = useMemo(() => {
    return issues.filter((issue) => {
      if (activeTab !== 'all' && issue.type !== activeTab) return false;
      if (severityFilter !== 'all' && issue.severity !== severityFilter) return false;
      if (statusFilter !== 'all' && issue.status !== statusFilter) return false;
      if (searchQuery) {
        const q = searchQuery.toLowerCase();
        if (
          !issue.fieldName.toLowerCase().includes(q) &&
          !issue.description.toLowerCase().includes(q)
        ) {
          return false;
        }
      }
      return true;
    });
  }, [issues, activeTab, severityFilter, statusFilter, searchQuery]);

  const allSelected =
    filteredIssues.length > 0 && filteredIssues.every((i) => selectedIssueIds.includes(i.id));
  const someSelected = filteredIssues.some((i) => selectedIssueIds.includes(i.id));

  const handleToggleAll = () => {
    if (allSelected) {
      filteredIssues.forEach((i) => {
        if (selectedIssueIds.includes(i.id)) {
          toggleIssueSelection(i.id);
        }
      });
    } else {
      filteredIssues.forEach((i) => {
        if (!selectedIssueIds.includes(i.id)) {
          toggleIssueSelection(i.id);
        }
      });
    }
  };

  const openDetail = (issue: Issue) => {
    setDetailIssue(issue);
    setDrawerVisible(true);
  };

  const closeDetail = () => {
    setDrawerVisible(false);
    setTimeout(() => setDetailIssue(null), 300);
  };

  const handleMarkFalsePositive = (issueId: string) => {
    markIssueFalsePositive(issueId);
  };

  const handleBatchMarkFalsePositive = () => {
    batchMarkFalsePositive(selectedIssueIds);
  };

  const tabs: { key: TabType; label: string }[] = [
    { key: 'all', label: '全部问题' },
    { key: 'naming', label: '命名规范' },
    { key: 'datatype', label: '数据类型' },
    { key: 'valuerange', label: '取值范围' },
    { key: 'other', label: '其他' },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-800">问题清单</h1>
        <p className="text-gray-500 mt-1">查看和跟踪检查发现的数据质量问题</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-sm text-gray-500 font-medium">问题总数</p>
              <p className="text-3xl font-bold text-gray-800 mt-2">{stats.total}</p>
              <div className="flex items-center mt-2 text-sm">
                <span className="text-green-600 flex items-center font-medium">
                  <ChevronRight className="w-4 h-4 -rotate-90" />
                  12.5%
                </span>
                <span className="text-gray-400 ml-1.5">较上周</span>
              </div>
            </div>
            <div className="w-11 h-11 rounded-xl bg-blue-50 flex items-center justify-center">
              <AlertCircle className="w-6 h-6 text-blue-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-sm text-gray-500 font-medium">高风险</p>
              <p className="text-3xl font-bold text-gray-800 mt-2">{stats.high}</p>
              <div className="flex items-center mt-2 text-sm">
                <span className="text-red-600 flex items-center font-medium">
                  <ChevronRight className="w-4 h-4 rotate-90" />
                  8.3%
                </span>
                <span className="text-gray-400 ml-1.5">较上周</span>
              </div>
            </div>
            <div className="w-11 h-11 rounded-xl bg-red-50 flex items-center justify-center">
              <AlertTriangle className="w-6 h-6 text-red-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-sm text-gray-500 font-medium">整改中</p>
              <p className="text-3xl font-bold text-gray-800 mt-2">{stats.rectifying}</p>
              <div className="flex items-center mt-2 text-sm">
                <span className="text-green-600 flex items-center font-medium">
                  <ChevronRight className="w-4 h-4 -rotate-90" />
                  25.0%
                </span>
                <span className="text-gray-400 ml-1.5">较上周</span>
              </div>
            </div>
            <div className="w-11 h-11 rounded-xl bg-yellow-50 flex items-center justify-center">
              <Info className="w-6 h-6 text-yellow-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-sm text-gray-500 font-medium">已解决</p>
              <p className="text-3xl font-bold text-gray-800 mt-2">{stats.resolved}</p>
              <div className="flex items-center mt-2 text-sm">
                <span className="text-green-600 flex items-center font-medium">
                  <ChevronRight className="w-4 h-4 -rotate-90" />
                  18.2%
                </span>
                <span className="text-gray-400 ml-1.5">较上周</span>
              </div>
            </div>
            <div className="w-11 h-11 rounded-xl bg-green-50 flex items-center justify-center">
              <CheckCircle className="w-6 h-6 text-green-600" />
            </div>
          </div>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        {tabs.map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={`inline-flex items-center px-4 py-2 rounded-full text-sm font-medium transition-all duration-200 ${
              activeTab === tab.key
                ? 'bg-blue-600 text-white shadow-sm'
                : 'bg-white text-gray-600 border border-gray-200 hover:border-gray-300 hover:bg-gray-50'
            }`}
          >
            {tab.label}
            <span
              className={`ml-2 inline-flex items-center justify-center min-w-5 h-5 px-1.5 rounded-full text-xs font-semibold ${
                activeTab === tab.key ? 'bg-blue-500 text-white' : 'bg-gray-100 text-gray-600'
              }`}
            >
              {tabCounts[tab.key]}
            </span>
          </button>
        ))}
      </div>

      <div className="bg-white rounded-xl border border-gray-200 shadow-sm">
        <div className="p-4 border-b border-gray-200">
          <div className="flex flex-wrap items-center gap-3">
            <div className="relative flex-1 min-w-[240px]">
              <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="搜索字段名或描述..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-4 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-gray-50"
              />
            </div>

            <div className="flex items-center gap-2">
              <Filter className="w-4 h-4 text-gray-400" />
              <select
                value={severityFilter}
                onChange={(e) => setSeverityFilter(e.target.value as SeverityFilter)}
                className="text-sm border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-gray-50"
              >
                <option value="all">全部严重程度</option>
                <option value="high">高</option>
                <option value="medium">中</option>
                <option value="low">低</option>
              </select>
            </div>

            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as StatusFilter)}
              className="text-sm border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-gray-50"
            >
              <option value="all">全部状态</option>
              <option value="open">未处理</option>
              <option value="rectifying">整改中</option>
              <option value="resolved">已解决</option>
              <option value="falsepositive">误报</option>
            </select>

            <div className="h-6 w-px bg-gray-200" />

            <button
              onClick={handleBatchMarkFalsePositive}
              disabled={selectedIssueIds.length === 0}
              className="inline-flex items-center gap-1.5 px-3 py-2 text-sm font-medium text-gray-600 border border-gray-200 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              <XCircle className="w-4 h-4" />
              标记误报
            </button>

            <button
              disabled={selectedIssueIds.length === 0}
              className="inline-flex items-center gap-1.5 px-3 py-2 text-sm font-medium text-gray-600 border border-gray-200 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              <Send className="w-4 h-4" />
              派发整改
            </button>

            <button
              disabled={selectedIssueIds.length === 0}
              className="inline-flex items-center gap-1.5 px-3 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              <Lightbulb className="w-4 h-4" />
              生成建议
            </button>

            {selectedIssueIds.length > 0 && (
              <div className="flex items-center gap-2 ml-auto">
                <span className="text-sm text-gray-500">
                  已选择 <span className="font-semibold text-gray-700">{selectedIssueIds.length}</span> 项
                </span>
                <button
                  onClick={clearIssueSelection}
                  className="text-sm text-blue-600 hover:text-blue-700 font-medium"
                >
                  清除
                </button>
              </div>
            )}
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-200">
                <th className="px-4 py-3 text-left w-10">
                  <input
                    type="checkbox"
                    checked={allSelected}
                    ref={(el) => {
                      if (el) el.indeterminate = !allSelected && someSelected;
                    }}
                    onChange={handleToggleAll}
                    className="w-4 h-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  />
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider w-12">
                  级别
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                  字段名
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                  问题类型
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                  所属表
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                  描述
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                  状态
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                  创建时间
                </th>
                <th className="px-4 py-3 text-right text-xs font-semibold text-gray-500 uppercase tracking-wider">
                  操作
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filteredIssues.map((issue) => (
                <tr
                  key={issue.id}
                  className={`hover:bg-gray-50 transition-colors ${
                    selectedIssueIds.includes(issue.id) ? 'bg-blue-50/50' : ''
                  }`}
                >
                  <td className="px-4 py-3">
                    <input
                      type="checkbox"
                      checked={selectedIssueIds.includes(issue.id)}
                      onChange={() => toggleIssueSelection(issue.id)}
                      className="w-4 h-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                    />
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center">
                      <span
                        className={`inline-block rounded-full ${SEVERITY_SIZES[issue.severity]} ${SEVERITY_COLORS[issue.severity]}`}
                        title={SEVERITY_LABELS[issue.severity]}
                      />
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <span className="text-sm font-medium text-gray-900 font-mono">
                      {issue.fieldName}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${ISSUE_TYPE_COLORS[issue.type]}`}
                    >
                      {ISSUE_TYPE_LABELS[issue.type]}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <span className="text-sm text-gray-600 font-mono">{issue.tableName}</span>
                  </td>
                  <td className="px-4 py-3 max-w-xs">
                    <p className="text-sm text-gray-600 truncate">{issue.description}</p>
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${ISSUE_STATUS_COLORS[issue.status]}`}
                    >
                      {ISSUE_STATUS_LABELS[issue.status]}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <span className="text-sm text-gray-500">{issue.createdAt}</span>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center justify-end gap-1">
                      <button
                        onClick={() => openDetail(issue)}
                        className="p-1.5 text-gray-500 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                        title="查看详情"
                      >
                        <Eye className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleMarkFalsePositive(issue.id)}
                        className="p-1.5 text-gray-500 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                        title="标记误报"
                        disabled={issue.status === 'falsepositive'}
                      >
                        <XCircle className="w-4 h-4" />
                      </button>
                      <button
                        className="p-1.5 text-gray-500 hover:text-orange-600 hover:bg-orange-50 rounded-lg transition-colors"
                        title="派发整改"
                      >
                        <Send className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {filteredIssues.length === 0 && (
                <tr>
                  <td colSpan={9} className="px-4 py-16 text-center">
                    <div className="flex flex-col items-center">
                      <div className="w-16 h-16 rounded-full bg-gray-100 flex items-center justify-center mb-4">
                        <Search className="w-8 h-8 text-gray-400" />
                      </div>
                      <p className="text-gray-500 text-sm">暂无符合条件的问题</p>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {detailIssue && (
        <>
          <div
            className={`fixed inset-0 bg-black transition-opacity duration-300 z-40 ${
              drawerVisible ? 'bg-opacity-40 opacity-100' : 'bg-opacity-0 opacity-0 pointer-events-none'
            }`}
            onClick={closeDetail}
          />
          <div
            className={`fixed top-0 right-0 h-full w-full max-w-xl bg-white shadow-2xl z-50 transform transition-transform duration-300 ease-out ${
              drawerVisible ? 'translate-x-0' : 'translate-x-full'
            }`}
          >
            <div className="h-full flex flex-col">
              <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
                <div>
                  <h2 className="text-lg font-semibold text-gray-800">问题详情</h2>
                  <p className="text-sm text-gray-500 mt-0.5">
                    {detailIssue.fieldName}
                  </p>
                </div>
                <button
                  onClick={closeDetail}
                  className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="flex-1 overflow-y-auto px-6 py-5 space-y-6">
                <div>
                  <h3 className="text-sm font-semibold text-gray-700 mb-3">基本信息</h3>
                  <div className="bg-gray-50 rounded-xl p-4 space-y-3">
                    <div className="flex items-start justify-between">
                      <span className="text-sm text-gray-500">字段名</span>
                      <span className="text-sm font-mono font-medium text-gray-800">
                        {detailIssue.fieldName}
                      </span>
                    </div>
                    <div className="flex items-start justify-between">
                      <span className="text-sm text-gray-500">所属表</span>
                      <span className="text-sm font-mono text-gray-800">{detailIssue.tableName}</span>
                    </div>
                    <div className="flex items-start justify-between">
                      <span className="text-sm text-gray-500">问题类型</span>
                      <span
                        className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${ISSUE_TYPE_COLORS[detailIssue.type]}`}
                      >
                        {ISSUE_TYPE_LABELS[detailIssue.type]}
                      </span>
                    </div>
                    <div className="flex items-start justify-between">
                      <span className="text-sm text-gray-500">严重程度</span>
                      <div className="flex items-center gap-1.5">
                        <span
                          className={`inline-block rounded-full ${SEVERITY_SIZES[detailIssue.severity]} ${SEVERITY_COLORS[detailIssue.severity]}`}
                        />
                        <span className="text-sm font-medium text-gray-800">
                          {SEVERITY_LABELS[detailIssue.severity]}
                        </span>
                      </div>
                    </div>
                    <div className="flex items-start justify-between">
                      <span className="text-sm text-gray-500">状态</span>
                      <span
                        className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${ISSUE_STATUS_COLORS[detailIssue.status]}`}
                      >
                        {ISSUE_STATUS_LABELS[detailIssue.status]}
                      </span>
                    </div>
                    <div className="flex items-start justify-between">
                      <span className="text-sm text-gray-500">创建时间</span>
                      <span className="text-sm text-gray-800">{detailIssue.createdAt}</span>
                    </div>
                    {detailIssue.standardName && (
                      <div className="flex items-start justify-between">
                        <span className="text-sm text-gray-500">关联标准</span>
                        <span className="text-sm font-medium text-gray-800">
                          {detailIssue.standardName}
                        </span>
                      </div>
                    )}
                  </div>
                </div>

                <div>
                  <h3 className="text-sm font-semibold text-gray-700 mb-3">问题描述</h3>
                  <div className="bg-red-50 border border-red-100 rounded-xl p-4">
                    <div className="flex items-start gap-3">
                      <AlertTriangle className="w-5 h-5 text-red-500 mt-0.5 flex-shrink-0" />
                      <p className="text-sm text-red-700 leading-relaxed">
                        {detailIssue.description}
                      </p>
                    </div>
                  </div>
                </div>

                <div>
                  <h3 className="text-sm font-semibold text-gray-700 mb-3">标准对比</h3>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="bg-red-50 border border-red-100 rounded-xl p-4">
                      <div className="flex items-center gap-1.5 mb-2">
                        <XCircle className="w-4 h-4 text-red-500" />
                        <span className="text-xs font-semibold text-red-700 uppercase">当前值</span>
                      </div>
                      <p className="text-sm text-red-800 font-mono break-all">
                        {detailIssue.fieldName}
                      </p>
                      <p className="text-xs text-red-600 mt-2">
                        类型: {detailIssue.type === 'naming' ? '命名不规范' : detailIssue.type === 'datatype' ? '数据类型不符' : detailIssue.type === 'valuerange' ? '取值范围违规' : '其他问题'}
                      </p>
                    </div>
                    <div className="bg-green-50 border border-green-100 rounded-xl p-4">
                      <div className="flex items-center gap-1.5 mb-2">
                        <CheckCircle className="w-4 h-4 text-green-500" />
                        <span className="text-xs font-semibold text-green-700 uppercase">标准值</span>
                      </div>
                      <p className="text-sm text-green-800 font-mono break-all">
                        {detailIssue.standardName ?? '参考数据标准规范'}
                      </p>
                      <p className="text-xs text-green-600 mt-2">
                        符合数据标准定义
                      </p>
                    </div>
                  </div>
                </div>

                <div>
                  <h3 className="text-sm font-semibold text-gray-700 mb-3">整改建议</h3>
                  <div className="bg-blue-50 border border-blue-100 rounded-xl p-4">
                    <div className="flex items-start gap-3">
                      <Lightbulb className="w-5 h-5 text-blue-500 mt-0.5 flex-shrink-0" />
                      <p className="text-sm text-blue-700 leading-relaxed">
                        {detailIssue.suggestion}
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-3 px-6 py-4 border-t border-gray-200 bg-gray-50">
                <button className="flex-1 inline-flex items-center justify-center gap-1.5 px-4 py-2.5 text-sm font-medium text-gray-700 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">
                  <Lightbulb className="w-4 h-4" />
                  生成整改建议
                </button>
                <button className="flex-1 inline-flex items-center justify-center gap-1.5 px-4 py-2.5 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors">
                  <Send className="w-4 h-4" />
                  派发整改任务
                </button>
                <button
                  onClick={() => {
                    handleMarkFalsePositive(detailIssue.id);
                    closeDetail();
                  }}
                  disabled={detailIssue.status === 'falsepositive'}
                  className="flex-1 inline-flex items-center justify-center gap-1.5 px-4 py-2.5 text-sm font-medium text-gray-700 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  <XCircle className="w-4 h-4" />
                  标记误报
                </button>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}

import { useState, useMemo } from 'react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
  Cell,
  PieChart,
  Pie,
  Legend,
} from 'recharts';
import {
  TrendingUp,
  TrendingDown,
  Download,
  Calendar,
  FileSpreadsheet,
  FileText,
  File,
  Trophy,
  Medal,
  Award,
  BarChart3,
  PieChart as PieChartIcon,
  Target,
  X,
  Check,
} from 'lucide-react';
import { useAppStore } from '@/store';
import type { Issue, IssueType, IssueSeverity, IssueStatus } from '@/types';

type TimeRange = '7d' | '30d' | 'quarter' | 'year' | 'custom';

const PIE_COLORS = ['#2d79c1', '#3b82f6', '#60a5fa', '#93c5fd'];
const BAR_COLORS = ['#1e3a5f', '#2d79c1', '#3b82f6', '#60a5fa', '#93c5fd'];

const ISSUE_TYPE_LABELS: Record<IssueType, string> = {
  naming: '命名规范',
  datatype: '数据类型',
  valuerange: '取值范围',
  other: '其他',
};

const SEVERITY_LABELS: Record<IssueSeverity, string> = {
  high: '严重',
  medium: '中等',
  low: '轻微',
};

const STATUS_LABELS: Record<IssueStatus, string> = {
  open: '待处理',
  rectifying: '整改中',
  resolved: '已解决',
  falsepositive: '误报',
};

interface ExportRow {
  taskName: string;
  projectName: string;
  fieldName: string;
  tableName: string;
  issueType: string;
  severity: string;
  description: string;
  suggestion: string;
  standardName: string;
  status: string;
  createdAt: string;
}

function formatDateForFilename(date: Date = new Date()): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}${m}${d}`;
}

function downloadBlob(content: BlobPart, filename: string, mimeType: string): void {
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

function escapeHtml(value: string): string {
  const div = document.createElement('div');
  div.textContent = value ?? '';
  return div.innerHTML;
}

function escapeCsv(value: string): string {
  const v = value ?? '';
  if (v.includes(',') || v.includes('"') || v.includes('\n') || v.includes('\r')) {
    return `"${v.replace(/"/g, '""')}"`;
  }
  return v;
}

function CircularProgress({
  percentage,
  size = 140,
  strokeWidth = 12,
}: {
  percentage: number;
  size?: number;
  strokeWidth?: number;
}) {
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (percentage / 100) * circumference;

  return (
    <svg width={size} height={size} className="-rotate-90">
      <defs>
        <linearGradient id="circleGradient" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#2d79c1" />
          <stop offset="100%" stopColor="#60a5fa" />
        </linearGradient>
      </defs>
      <circle
        cx={size / 2}
        cy={size / 2}
        r={radius}
        fill="none"
        stroke="#e5e7eb"
        strokeWidth={strokeWidth}
      />
      <circle
        cx={size / 2}
        cy={size / 2}
        r={radius}
        fill="none"
        stroke="url(#circleGradient)"
        strokeWidth={strokeWidth}
        strokeDasharray={circumference}
        strokeDashoffset={offset}
        strokeLinecap="round"
        style={{ transition: 'stroke-dashoffset 0.8s ease' }}
      />
    </svg>
  );
}

function ProgressBar({ value, showLabel = false }: { value: number; showLabel?: boolean }) {
  return (
    <div className="w-full">
      <div className="h-3 bg-gray-100 rounded-full overflow-hidden">
        <div
          className="h-full rounded-full bg-gradient-to-r from-primary-500 to-primary-300 transition-all duration-700"
          style={{ width: `${value}%` }}
        />
      </div>
      {showLabel && (
        <div className="mt-1 text-xs text-gray-500 text-right">{value.toFixed(1)}%</div>
      )}
    </div>
  );
}

function getMedalIcon(rank: number) {
  if (rank === 1) return <Trophy className="w-5 h-5 text-yellow-500" />;
  if (rank === 2) return <Medal className="w-5 h-5 text-gray-400" />;
  if (rank === 3) return <Award className="w-5 h-5 text-amber-600" />;
  return <span className="w-5 h-5 inline-flex items-center justify-center text-gray-400 font-semibold text-sm">{rank}</span>;
}

export default function Analytics() {
  const {
    checkTasks,
    issues,
    rectificationTasks,
    currentTaskId,
    dataFields,
    dataStandards,
  } = useAppStore();
  const [timeRange, setTimeRange] = useState<TimeRange>('30d');
  const [customStartDate, setCustomStartDate] = useState('');
  const [customEndDate, setCustomEndDate] = useState('');
  const [showExportModal, setShowExportModal] = useState(false);
  const [exportScope, setExportScope] = useState<'all' | 'current'>('all');
  const [exportFormat, setExportFormat] = useState<'excel' | 'csv' | 'pdf'>('excel');
  const [isExporting, setIsExporting] = useState(false);

  const totalFields = 446;
  const totalIssues = 46;
  const complianceRate = 78.5;
  const rectificationRate = 73.9;
  const fieldsYoY = 12.5;
  const issuesYoY = -8.3;

  const trendData = useMemo(() => {
    const data = [];
    const today = new Date();
    for (let i = 29; i >= 0; i--) {
      const d = new Date(today);
      d.setDate(d.getDate() - i);
      const month = d.getMonth() + 1;
      const day = d.getDate();
      const base = 70 + Math.sin((29 - i) / 5) * 8;
      const variation = Math.random() * 6 - 3;
      data.push({
        date: `${month}/${day}`,
        rate: Math.min(95, Math.max(60, base + variation)),
      });
    }
    return data;
  }, []);

  const violationData = useMemo(() => [
    { category: '客户域', count: 12 },
    { category: '订单域', count: 18 },
    { category: '交易域', count: 8 },
    { category: '产品域', count: 5 },
    { category: '基础公共', count: 3 },
  ], []);

  const issueTypeData = useMemo(() => {
    const counts: Record<IssueType, number> = {
      naming: 0,
      datatype: 0,
      valuerange: 0,
      other: 0,
    };
    issues.forEach((issue) => {
      counts[issue.type] = (counts[issue.type] || 0) + 1;
    });
    return Object.entries(counts).map(([type, value]) => ({
      name: ISSUE_TYPE_LABELS[type as IssueType],
      value,
    }));
  }, [issues]);

  const projectRanking = useMemo(() => {
    const projectMap = new Map<
      string,
      { projectName: string; totalFields: number; issueCount: number }
    >();
    checkTasks.forEach((task) => {
      const existing = projectMap.get(task.projectName);
      if (existing) {
        existing.totalFields += task.totalFields;
        existing.issueCount += task.issueCount;
      } else {
        projectMap.set(task.projectName, {
          projectName: task.projectName,
          totalFields: task.totalFields,
          issueCount: task.issueCount,
        });
      }
    });
    const list = Array.from(projectMap.values()).map((p) => ({
      ...p,
      complianceRate:
        p.totalFields === 0 ? 0 : ((p.totalFields - p.issueCount) / p.totalFields) * 100,
    }));
    list.sort((a, b) => b.complianceRate - a.complianceRate);
    return list;
  }, [checkTasks]);

  const handleExport = () => {
    setIsExporting(true);

    const dateStr = formatDateForFilename();

    const filteredIssues: Issue[] = exportScope === 'all'
      ? [...issues]
      : issues.filter((issue) => issue.taskId === currentTaskId);

    const taskMap = new Map(checkTasks.map((t) => [t.id, t]));
    const fieldMap = new Map(dataFields.map((f) => [f.id, f]));

    const rows: ExportRow[] = filteredIssues.map((issue) => {
      const task = taskMap.get(issue.taskId);
      const field = fieldMap.get(issue.fieldId);
      return {
        taskName: task?.name ?? '-',
        projectName: task?.projectName ?? '-',
        fieldName: issue.fieldName ?? '-',
        tableName: issue.tableName ?? field?.tableName ?? '-',
        issueType: ISSUE_TYPE_LABELS[issue.type] ?? issue.type,
        severity: SEVERITY_LABELS[issue.severity] ?? issue.severity,
        description: issue.description ?? '-',
        suggestion: issue.suggestion ?? '-',
        standardName: issue.standardName ?? '-',
        status: STATUS_LABELS[issue.status] ?? issue.status,
        createdAt: issue.createdAt ?? '-',
      };
    });

    const headers = [
      '检查任务',
      '所属项目',
      '字段名',
      '所属表',
      '问题类型',
      '严重程度',
      '问题描述',
      '整改建议',
      '对应标准',
      '状态',
      '创建时间',
    ];

    if (exportFormat === 'excel') {
      let html =
        '<html xmlns:o="urn:schemas-microsoft-com:office:office" ' +
        'xmlns:x="urn:schemas-microsoft-com:office:excel" ' +
        'xmlns="http://www.w3.org/TR/REC-html40">' +
        '<head><meta charset="UTF-8"/>' +
        '<!--[if gte mso 9]><xml><x:ExcelWorkbook><x:ExcelWorksheets><x:ExcelWorksheet>' +
        '<x:Name>检查明细</x:Name><x:WorksheetOptions><x:DisplayGridlines/></x:WorksheetOptions>' +
        '</x:ExcelWorksheet></x:ExcelWorksheets></x:ExcelWorkbook></xml><![endif]-->' +
        '<style>' +
        'table { border-collapse: collapse; }' +
        'th, td { border: 1px solid #999; padding: 6px 10px; font-size: 12px; }' +
        'th { background-color: #2d79c1; color: #fff; font-weight: bold; }' +
        'tr:nth-child(even) td { background-color: #f5f9ff; }' +
        '</style></head><body>' +
        '<h2 style="color:#1e3a5f;">数据标准检查明细</h2>' +
        `<p style="color:#666;">导出时间：${new Date().toLocaleString()}　导出范围：${exportScope === 'all' ? '全部数据' : '当前项目'}　共 ${rows.length} 条记录</p>` +
        '<table><thead><tr>';
      headers.forEach((h) => {
        html += `<th>${escapeHtml(h)}</th>`;
      });
      html += '</tr></thead><tbody>';
      rows.forEach((row) => {
        html += '<tr>';
        html += `<td>${escapeHtml(row.taskName)}</td>`;
        html += `<td>${escapeHtml(row.projectName)}</td>`;
        html += `<td>${escapeHtml(row.fieldName)}</td>`;
        html += `<td>${escapeHtml(row.tableName)}</td>`;
        html += `<td>${escapeHtml(row.issueType)}</td>`;
        html += `<td>${escapeHtml(row.severity)}</td>`;
        html += `<td>${escapeHtml(row.description)}</td>`;
        html += `<td>${escapeHtml(row.suggestion)}</td>`;
        html += `<td>${escapeHtml(row.standardName)}</td>`;
        html += `<td>${escapeHtml(row.status)}</td>`;
        html += `<td>${escapeHtml(row.createdAt)}</td>`;
        html += '</tr>';
      });
      html += '</tbody></table></body></html>';
      downloadBlob(html, `数据标准检查明细_${dateStr}.xls`, 'application/vnd.ms-excel');
    } else if (exportFormat === 'csv') {
      const csvLines: string[] = [];
      csvLines.push(headers.map(escapeCsv).join(','));
      rows.forEach((row) => {
        const line = [
          row.taskName,
          row.projectName,
          row.fieldName,
          row.tableName,
          row.issueType,
          row.severity,
          row.description,
          row.suggestion,
          row.standardName,
          row.status,
          row.createdAt,
        ].map(escapeCsv).join(',');
        csvLines.push(line);
      });
      const csvContent = '\uFEFF' + csvLines.join('\r\n');
      downloadBlob(csvContent, `数据标准检查明细_${dateStr}.csv`, 'text/csv;charset=utf-8');
    } else {
      let html =
        '<!DOCTYPE html>' +
        '<html lang="zh-CN"><head><meta charset="UTF-8"/>' +
        '<title>数据标准检查明细</title>' +
        '<style>' +
        '* { box-sizing: border-box; margin: 0; padding: 0; }' +
        'body { font-family: "Microsoft YaHei", Arial, sans-serif; padding: 40px; color: #333; background: #fff; }' +
        '.header { margin-bottom: 30px; border-bottom: 2px solid #2d79c1; padding-bottom: 20px; }' +
        '.header h1 { color: #1e3a5f; font-size: 24px; margin-bottom: 10px; }' +
        '.header .meta { color: #666; font-size: 14px; line-height: 1.8; }' +
        '.summary { display: flex; gap: 20px; margin-bottom: 30px; }' +
        '.summary-card { flex: 1; padding: 16px 20px; background: #f5f9ff; border-radius: 8px; border-left: 4px solid #2d79c1; }' +
        '.summary-card .label { color: #666; font-size: 13px; margin-bottom: 6px; }' +
        '.summary-card .value { color: #1e3a5f; font-size: 22px; font-weight: bold; }' +
        'table { width: 100%; border-collapse: collapse; margin-top: 10px; }' +
        'th, td { border: 1px solid #d0d7de; padding: 10px 12px; font-size: 13px; text-align: left; vertical-align: top; }' +
        'th { background: linear-gradient(135deg, #1e3a5f, #2d79c1); color: #fff; font-weight: 600; }' +
        'tbody tr:nth-child(even) { background: #f8fafc; }' +
        'tbody tr:hover { background: #eef6ff; }' +
        '.severity-high { color: #dc2626; font-weight: 600; }' +
        '.severity-medium { color: #d97706; font-weight: 600; }' +
        '.severity-low { color: #16a34a; font-weight: 600; }' +
        '.status-open { color: #dc2626; }' +
        '.status-rectifying { color: #d97706; }' +
        '.status-resolved { color: #16a34a; }' +
        '.status-falsepositive { color: #6b7280; }' +
        '.tip { margin-top: 30px; padding: 14px 18px; background: #fffbeb; border: 1px solid #fde68a; border-radius: 8px; color: #92400e; font-size: 13px; }' +
        '.tip strong { color: #78350f; }' +
        'footer { margin-top: 40px; padding-top: 20px; border-top: 1px solid #e5e7eb; color: #9ca3af; font-size: 12px; text-align: center; }' +
        '@media print { body { padding: 20px; } .no-print { display: none; } }' +
        '</style></head><body>' +
        '<div class="no-print" style="margin-bottom:20px;">' +
        '<button onclick="window.print()" style="padding:10px 20px;background:#2d79c1;color:#fff;border:none;border-radius:6px;cursor:pointer;font-size:14px;">🖨️ 打印 / 导出为 PDF</button>' +
        '</div>' +
        '<div class="header">' +
        '<h1>📋 数据标准检查明细报告</h1>' +
        '<div class="meta">' +
        `<div>导出时间：${new Date().toLocaleString()}</div>` +
        `<div>导出范围：${exportScope === 'all' ? '全部任务数据' : '当前选中任务'}</div>` +
        '</div></div>' +
        '<div class="summary">' +
        `<div class="summary-card"><div class="label">问题总数</div><div class="value">${rows.length}</div></div>` +
        `<div class="summary-card"><div class="label">严重问题</div><div class="value" style="color:#dc2626;">${rows.filter((r) => r.severity === '严重').length}</div></div>` +
        `<div class="summary-card"><div class="label">已解决</div><div class="value" style="color:#16a34a;">${rows.filter((r) => r.status === '已解决').length}</div></div>` +
        `<div class="summary-card"><div class="label">待处理</div><div class="value" style="color:#d97706;">${rows.filter((r) => r.status === '待处理').length}</div></div>` +
        '</div>' +
        '<h3 style="color:#1e3a5f;margin-bottom:12px;">详细检查结果</h3>' +
        '<table><thead><tr>';
      headers.forEach((h) => {
        html += `<th>${escapeHtml(h)}</th>`;
      });
      html += '</tr></thead><tbody>';
      rows.forEach((row) => {
        const sevClass =
          row.severity === '严重' ? 'severity-high' :
          row.severity === '中等' ? 'severity-medium' : 'severity-low';
        const staClass =
          row.status === '待处理' ? 'status-open' :
          row.status === '整改中' ? 'status-rectifying' :
          row.status === '已解决' ? 'status-resolved' : 'status-falsepositive';
        html += '<tr>';
        html += `<td>${escapeHtml(row.taskName)}</td>`;
        html += `<td>${escapeHtml(row.projectName)}</td>`;
        html += `<td><code style="background:#f1f5f9;padding:2px 6px;border-radius:4px;">${escapeHtml(row.fieldName)}</code></td>`;
        html += `<td>${escapeHtml(row.tableName)}</td>`;
        html += `<td>${escapeHtml(row.issueType)}</td>`;
        html += `<td class="${sevClass}">${escapeHtml(row.severity)}</td>`;
        html += `<td>${escapeHtml(row.description)}</td>`;
        html += `<td>${escapeHtml(row.suggestion)}</td>`;
        html += `<td>${escapeHtml(row.standardName)}</td>`;
        html += `<td class="${staClass}">${escapeHtml(row.status)}</td>`;
        html += `<td>${escapeHtml(row.createdAt)}</td>`;
        html += '</tr>';
      });
      html += '</tbody></table>' +
        '<div class="tip">' +
        '<strong>💡 提示：</strong>请点击上方"打印 / 导出为 PDF"按钮，在打印对话框中选择"另存为 PDF"，即可生成 PDF 格式文件。' +
        '</div>' +
        `<footer>数据标准管理平台 · 自动生成于 ${new Date().toLocaleString()} · 共 ${rows.length} 条记录</footer>` +
        '</body></html>';
      downloadBlob(html, `数据标准检查明细_${dateStr}.html`, 'text/html;charset=utf-8');
    }

    setTimeout(() => {
      setIsExporting(false);
      setShowExportModal(false);
    }, 1000);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">统计分析</h1>
          <p className="text-gray-500 mt-1">数据质量统计分析和可视化报表</p>
        </div>
        <button
          onClick={() => setShowExportModal(true)}
          className="inline-flex items-center gap-2 px-4 py-2.5 bg-primary-700 text-white rounded-lg hover:bg-primary-800 transition-colors font-medium shadow-sm"
        >
          <Download className="w-4 h-4" />
          导出检查明细
        </button>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 p-5">
        <div className="flex flex-wrap items-center gap-3">
          <span className="text-sm font-medium text-gray-600 flex items-center gap-1.5">
            <Calendar className="w-4 h-4" />
            时间范围：
          </span>
          {[
            { key: '7d' as const, label: '最近7天' },
            { key: '30d' as const, label: '最近30天' },
            { key: 'quarter' as const, label: '本季度' },
            { key: 'year' as const, label: '本年' },
            { key: 'custom' as const, label: '自定义' },
          ].map((item) => (
            <button
              key={item.key}
              onClick={() => setTimeRange(item.key)}
              className={`px-3.5 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                timeRange === item.key
                  ? 'bg-primary-700 text-white'
                  : 'bg-gray-50 text-gray-600 hover:bg-gray-100 border border-gray-200'
              }`}
            >
              {item.label}
            </button>
          ))}
          {timeRange === 'custom' && (
            <div className="flex items-center gap-2 ml-2">
              <input
                type="date"
                value={customStartDate}
                onChange={(e) => setCustomStartDate(e.target.value)}
                className="px-3 py-1.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/30 focus:border-primary-500"
              />
              <span className="text-gray-400">至</span>
              <input
                type="date"
                value={customEndDate}
                onChange={(e) => setCustomEndDate(e.target.value)}
                className="px-3 py-1.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/30 focus:border-primary-500"
              />
            </div>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-5">
        <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm hover:shadow-md transition-shadow">
          <div className="flex items-start justify-between mb-4">
            <div>
              <p className="text-sm text-gray-500 font-medium">项目达标率</p>
              <div className="mt-2 flex items-baseline gap-1">
                <span
                  className="text-4xl font-extrabold bg-clip-text text-transparent bg-gradient-to-r from-primary-700 to-primary-400"
                  style={{ backgroundImage: 'linear-gradient(135deg, #1e3a5f, #60a5fa)' }}
                >
                  {complianceRate}
                </span>
                <span className="text-xl font-bold text-gray-700">%</span>
              </div>
            </div>
            <div className="p-2.5 bg-primary-50 rounded-xl">
              <Target className="w-5 h-5 text-primary-700" />
            </div>
          </div>
          <div className="flex justify-center">
            <div className="relative">
              <CircularProgress percentage={complianceRate} />
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="text-center">
                  <p className="text-2xl font-bold text-primary-700">{complianceRate}%</p>
                  <p className="text-xs text-gray-400 mt-0.5">达标率</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm hover:shadow-md transition-shadow">
          <div className="flex items-start justify-between mb-4">
            <div>
              <p className="text-sm text-gray-500 font-medium">检查字段总数</p>
              <div className="mt-2 flex items-baseline gap-1">
                <span
                  className="text-4xl font-extrabold bg-clip-text text-transparent bg-gradient-to-r from-primary-700 to-primary-400"
                  style={{ backgroundImage: 'linear-gradient(135deg, #1e3a5f, #60a5fa)' }}
                >
                  {totalFields}
                </span>
                <span className="text-base font-medium text-gray-500 ml-1">个</span>
              </div>
            </div>
            <div className="p-2.5 bg-green-50 rounded-xl">
              <BarChart3 className="w-5 h-5 text-green-600" />
            </div>
          </div>
          <div className="mt-4 pt-4 border-t border-gray-100">
            <div className="flex items-center gap-2">
              <div className="flex items-center gap-1 px-2 py-0.5 bg-green-50 rounded-md">
                <TrendingUp className="w-3.5 h-3.5 text-green-600" />
                <span className="text-xs font-semibold text-green-600">+{fieldsYoY}%</span>
              </div>
              <span className="text-xs text-gray-500">较上期同比</span>
            </div>
            <div className="mt-4">
              <ProgressBar value={85} />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm hover:shadow-md transition-shadow">
          <div className="flex items-start justify-between mb-4">
            <div>
              <p className="text-sm text-gray-500 font-medium">发现问题数</p>
              <div className="mt-2 flex items-baseline gap-1">
                <span
                  className="text-4xl font-extrabold bg-clip-text text-transparent bg-gradient-to-r from-primary-700 to-primary-400"
                  style={{ backgroundImage: 'linear-gradient(135deg, #1e3a5f, #60a5fa)' }}
                >
                  {totalIssues}
                </span>
                <span className="text-base font-medium text-gray-500 ml-1">个</span>
              </div>
            </div>
            <div className="p-2.5 bg-red-50 rounded-xl">
              <PieChartIcon className="w-5 h-5 text-red-500" />
            </div>
          </div>
          <div className="mt-4 pt-4 border-t border-gray-100">
            <div className="flex items-center gap-2">
              <div className="flex items-center gap-1 px-2 py-0.5 bg-green-50 rounded-md">
                <TrendingDown className="w-3.5 h-3.5 text-green-600" />
                <span className="text-xs font-semibold text-green-600">{issuesYoY}%</span>
              </div>
              <span className="text-xs text-gray-500">较上期同比</span>
            </div>
            <div className="mt-4">
              <ProgressBar value={38} />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm hover:shadow-md transition-shadow">
          <div className="flex items-start justify-between mb-4">
            <div>
              <p className="text-sm text-gray-500 font-medium">整改完成率</p>
              <div className="mt-2 flex items-baseline gap-1">
                <span
                  className="text-4xl font-extrabold bg-clip-text text-transparent bg-gradient-to-r from-primary-700 to-primary-400"
                  style={{ backgroundImage: 'linear-gradient(135deg, #1e3a5f, #60a5fa)' }}
                >
                  {rectificationRate}
                </span>
                <span className="text-xl font-bold text-gray-700">%</span>
              </div>
            </div>
            <div className="p-2.5 bg-primary-50 rounded-xl">
              <Check className="w-5 h-5 text-primary-700" />
            </div>
          </div>
          <div className="mt-4 pt-4 border-t border-gray-100">
            <p className="text-xs text-gray-500 mb-2">当前进度</p>
            <ProgressBar value={rectificationRate} showLabel />
            <div className="mt-3 flex items-center justify-between text-xs text-gray-500">
              <span>
                已完成：
                {rectificationTasks.filter((t) => t.status === 'approved').length} 项
              </span>
              <span>
                共 {rectificationTasks.length} 项
              </span>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-5">
        <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
          <div className="mb-5">
            <h2 className="text-lg font-bold text-gray-800">达标率趋势</h2>
            <p className="text-sm text-gray-500 mt-0.5">最近30天项目达标率变化趋势</p>
          </div>
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={trendData} margin={{ top: 10, right: 20, left: 0, bottom: 0 }}>
                <defs>
                  <linearGradient id="lineGradient" x1="0" y1="0" x2="1" y2="0">
                    <stop offset="0%" stopColor="#1e3a5f" />
                    <stop offset="100%" stopColor="#60a5fa" />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                <XAxis
                  dataKey="date"
                  tick={{ fontSize: 12, fill: '#94a3b8' }}
                  tickLine={false}
                  axisLine={{ stroke: '#e5e7eb' }}
                  interval={4}
                />
                <YAxis
                  tick={{ fontSize: 12, fill: '#94a3b8' }}
                  tickLine={false}
                  axisLine={false}
                  domain={[50, 100]}
                  tickFormatter={(v) => `${v}%`}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#fff',
                    border: '1px solid #e5e7eb',
                    borderRadius: '8px',
                    boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
                  }}
                  formatter={(value: number) => [`${value.toFixed(1)}%`, '达标率']}
                  labelStyle={{ color: '#64748b', fontWeight: 500 }}
                />
                <Line
                  type="monotone"
                  dataKey="rate"
                  stroke="url(#lineGradient)"
                  strokeWidth={3}
                  dot={{ r: 4, fill: '#fff', stroke: '#2d79c1', strokeWidth: 2 }}
                  activeDot={{ r: 6, fill: '#1e3a5f', stroke: '#fff', strokeWidth: 2 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
          <div className="mb-5">
            <h2 className="text-lg font-bold text-gray-800">违规分布统计</h2>
            <p className="text-sm text-gray-500 mt-0.5">按标准类别统计违规数量</p>
          </div>
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={violationData} margin={{ top: 10, right: 20, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                <XAxis
                  dataKey="category"
                  tick={{ fontSize: 12, fill: '#94a3b8' }}
                  tickLine={false}
                  axisLine={{ stroke: '#e5e7eb' }}
                />
                <YAxis
                  tick={{ fontSize: 12, fill: '#94a3b8' }}
                  tickLine={false}
                  axisLine={false}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#fff',
                    border: '1px solid #e5e7eb',
                    borderRadius: '8px',
                    boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
                  }}
                  formatter={(value: number) => [value, '违规数']}
                  labelStyle={{ color: '#64748b', fontWeight: 500 }}
                  cursor={{ fill: 'rgba(45, 121, 193, 0.08)' }}
                />
                <Bar dataKey="count" radius={[6, 6, 0, 0]} maxBarSize={48}>
                  {violationData.map((_, index) => (
                    <Cell key={`cell-${index}`} fill={BAR_COLORS[index % BAR_COLORS.length]} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-5">
        <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
          <div className="mb-5">
            <h2 className="text-lg font-bold text-gray-800">问题类型分布</h2>
            <p className="text-sm text-gray-500 mt-0.5">各类数据质量问题占比统计</p>
          </div>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={issueTypeData}
                  cx="50%"
                  cy="45%"
                  innerRadius={55}
                  outerRadius={95}
                  paddingAngle={3}
                  dataKey="value"
                  label={({ name, percent }) =>
                    `${name} ${(percent * 100).toFixed(0)}%`
                  }
                  labelLine={{ stroke: '#cbd5e1', strokeWidth: 1 }}
                >
                  {issueTypeData.map((_, index) => (
                    <Cell key={`cell-${index}`} fill={PIE_COLORS[index % PIE_COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#fff',
                    border: '1px solid #e5e7eb',
                    borderRadius: '8px',
                    boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
                  }}
                  formatter={(value: number) => [value, '问题数']}
                />
                <Legend
                  verticalAlign="bottom"
                  iconType="circle"
                  iconSize={8}
                  wrapperStyle={{ paddingTop: 16, fontSize: 13 }}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
          <div className="mb-5">
            <h2 className="text-lg font-bold text-gray-800">项目达标排名</h2>
            <p className="text-sm text-gray-500 mt-0.5">按项目达标率降序排列</p>
          </div>
          <div className="overflow-x-auto -mx-2">
            <table className="w-full">
              <thead>
                <tr className="text-left text-xs font-semibold text-gray-500 uppercase tracking-wider border-b border-gray-100">
                  <th className="px-2 py-3 w-12">排名</th>
                  <th className="px-2 py-3">项目名称</th>
                  <th className="px-2 py-3 text-center">字段数</th>
                  <th className="px-2 py-3 text-center">问题数</th>
                  <th className="px-2 py-3 min-w-[140px]">达标率</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {projectRanking.map((project, index) => (
                  <tr
                    key={project.projectName}
                    className="hover:bg-gray-50/60 transition-colors"
                  >
                    <td className="px-2 py-3.5">
                      <div className="flex items-center justify-center w-7 h-7">
                        {getMedalIcon(index + 1)}
                      </div>
                    </td>
                    <td className="px-2 py-3.5">
                      <span className="text-sm font-medium text-gray-800">
                        {project.projectName}
                      </span>
                    </td>
                    <td className="px-2 py-3.5 text-center">
                      <span className="text-sm text-gray-600">{project.totalFields}</span>
                    </td>
                    <td className="px-2 py-3.5 text-center">
                      <span
                        className={`text-sm font-medium ${
                          project.issueCount > 10
                            ? 'text-red-500'
                            : project.issueCount > 5
                              ? 'text-amber-500'
                              : 'text-green-600'
                        }`}
                      >
                        {project.issueCount}
                      </span>
                    </td>
                    <td className="px-2 py-3.5">
                      <div className="flex items-center gap-3">
                        <div className="flex-1">
                          <ProgressBar value={project.complianceRate} />
                        </div>
                        <span className="text-sm font-semibold text-gray-700 w-14 text-right">
                          {project.complianceRate.toFixed(1)}%
                        </span>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {showExportModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          style={{
            animation: 'fadeIn 0.2s ease-out',
            backgroundColor: 'rgba(15, 39, 63, 0.5)',
          }}
          onClick={() => !isExporting && setShowExportModal(false)}
        >
          <div
            className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden"
            style={{ animation: 'scaleIn 0.25s ease-out' }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
              <h3 className="text-lg font-bold text-gray-800">导出检查明细</h3>
              <button
                onClick={() => !isExporting && setShowExportModal(false)}
                className="p-1.5 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                disabled={isExporting}
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="px-6 py-5 space-y-5">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2.5">
                  导出范围
                </label>
                <div className="grid grid-cols-2 gap-2.5">
                  {[
                    { key: 'all' as const, label: '全部数据' },
                    { key: 'current' as const, label: '当前项目' },
                  ].map((item) => (
                    <button
                      key={item.key}
                      onClick={() => setExportScope(item.key)}
                      className={`px-4 py-3 rounded-xl border-2 text-sm font-medium transition-all ${
                        exportScope === item.key
                          ? 'border-primary-500 bg-primary-50 text-primary-700'
                          : 'border-gray-200 text-gray-600 hover:border-gray-300 hover:bg-gray-50'
                      }`}
                    >
                      {item.label}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2.5">
                  导出格式
                </label>
                <div className="grid grid-cols-3 gap-2.5">
                  {[
                    { key: 'excel' as const, label: 'Excel', icon: FileSpreadsheet, color: 'text-green-600' },
                    { key: 'csv' as const, label: 'CSV', icon: FileText, color: 'text-blue-600' },
                    { key: 'pdf' as const, label: 'PDF', icon: File, color: 'text-red-500' },
                  ].map((item) => (
                    <button
                      key={item.key}
                      onClick={() => setExportFormat(item.key)}
                      className={`flex flex-col items-center gap-1.5 px-3 py-3.5 rounded-xl border-2 text-sm font-medium transition-all ${
                        exportFormat === item.key
                          ? 'border-primary-500 bg-primary-50 text-primary-700'
                          : 'border-gray-200 text-gray-600 hover:border-gray-300 hover:bg-gray-50'
                      }`}
                    >
                      <item.icon className={`w-5 h-5 ${item.color}`} />
                      {item.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <div className="flex gap-3 px-6 py-4 bg-gray-50 border-t border-gray-100">
              <button
                onClick={() => setShowExportModal(false)}
                disabled={isExporting}
                className="flex-1 px-4 py-2.5 text-sm font-medium text-gray-600 bg-white border border-gray-200 rounded-xl hover:bg-gray-100 transition-colors disabled:opacity-50"
              >
                取消
              </button>
              <button
                onClick={handleExport}
                disabled={isExporting}
                className="flex-1 inline-flex items-center justify-center gap-2 px-4 py-2.5 text-sm font-medium text-white bg-primary-700 rounded-xl hover:bg-primary-800 transition-colors shadow-sm disabled:opacity-70"
              >
                {isExporting ? (
                  <>
                    <svg
                      className="animate-spin w-4 h-4"
                      viewBox="0 0 24 24"
                      fill="none"
                    >
                      <circle
                        cx="12"
                        cy="12"
                        r="10"
                        stroke="currentColor"
                        strokeWidth="3"
                        className="opacity-25"
                      />
                      <path
                        fill="currentColor"
                        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
                        className="opacity-75"
                      />
                    </svg>
                    导出中...
                  </>
                ) : (
                  <>
                    <Download className="w-4 h-4" />
                    确认导出
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

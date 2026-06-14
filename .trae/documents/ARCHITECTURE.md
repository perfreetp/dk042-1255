## 1. 架构设计

```mermaid
graph TD
    subgraph "前端展示层"
        A["React SPA"] --> B["页面组件"]
        A --> C["状态管理 (Zustand)"]
        A --> D["UI 组件库"]
        D --> D1["图表 (Recharts)"]
        D --> D2["图标 (Lucide React)"]
    end
    subgraph "数据层"
        E["Mock 数据层"] --> F["TypeScript 类型定义"]
        F --> E
    end
    B --> C
    C --> E
```

## 2. 技术描述

- **前端框架**: React@18 + TypeScript + Vite
- **样式方案**: TailwindCSS@3
- **状态管理**: Zustand
- **路由管理**: React Router DOM
- **图表库**: Recharts
- **图标库**: Lucide React
- **初始化工具**: vite-init
- **后端**: 无后端，使用 Mock 数据模拟
- **数据持久化**: 浏览器 localStorage（可选）

## 3. 路由定义

| 路由 | 页面 | 用途 |
|------|------|------|
| `/` | 检查任务 | 检查任务列表与管理首页 |
| `/tasks` | 检查任务 | 任务列表、新建任务、任务详情 |
| `/matching` | 字段匹配 | 字段上传、标准选择、匹配确认 |
| `/issues` | 问题清单 | 问题列表、分类筛选、整改建议 |
| `/rectification` | 整改跟踪 | 任务派发、进度跟踪、结果审核 |
| `/analytics` | 统计分析 | 达标率、违规分布、明细导出 |

## 4. 数据模型

### 4.1 数据模型定义

```mermaid
erDiagram
    CHECK_TASK {
        string id "任务ID"
        string name "任务名称"
        string projectName "关联项目"
        string status "状态"
        date createdAt "创建时间"
        number progress "检查进度"
        number totalFields "字段总数"
        number issueCount "问题数"
    }
    DATA_FIELD {
        string id "字段ID"
        string taskId "关联任务ID"
        string fieldName "字段名称"
        string fieldType "字段类型"
        string description "字段描述"
        string matchedStandardId "匹配标准ID"
        number matchScore "匹配度"
        string matchStatus "匹配状态"
    }
    DATA_STANDARD {
        string id "标准ID"
        string standardName "标准名称"
        string category "标准类别"
        string standardFieldName "标准字段名"
        string standardType "标准类型"
        string valueRange "取值范围"
        string namingRule "命名规则"
    }
    ISSUE {
        string id "问题ID"
        string taskId "关联任务ID"
        string fieldId "关联字段ID"
        string type "问题类型"
        string severity "严重程度"
        string description "问题描述"
        string suggestion "整改建议"
        string status "问题状态"
        boolean isFalsePositive "是否误报"
    }
    RECTIFICATION_TASK {
        string id "整改ID"
        string issueId "关联问题ID"
        string assignee "负责人"
        date deadline "截止日期"
        string status "整改状态"
        string result "整改结果"
        date submittedAt "提交时间"
    }
    CHECK_TASK ||--o{ DATA_FIELD : "包含"
    DATA_FIELD }o--|| DATA_STANDARD : "匹配"
    DATA_FIELD ||--o{ ISSUE : "产生"
    ISSUE ||--o| RECTIFICATION_TASK : "关联"
```

### 4.2 类型定义

```typescript
interface CheckTask {
  id: string;
  name: string;
  projectName: string;
  status: 'pending' | 'running' | 'completed' | 'archived';
  createdAt: string;
  progress: number;
  totalFields: number;
  issueCount: number;
  standardCategories: string[];
}

interface DataField {
  id: string;
  taskId: string;
  fieldName: string;
  fieldType: string;
  description: string;
  matchedStandardId?: string;
  matchScore: number;
  matchStatus: 'pending' | 'confirmed' | 'rejected';
  tableName?: string;
}

interface DataStandard {
  id: string;
  standardName: string;
  category: string;
  standardFieldName: string;
  standardType: string;
  valueRange: string;
  namingRule: string;
  description: string;
}

type IssueType = 'naming' | 'datatype' | 'valuerange' | 'other';
type IssueSeverity = 'high' | 'medium' | 'low';
type IssueStatus = 'open' | 'rectifying' | 'resolved' | 'falsepositive';

interface Issue {
  id: string;
  taskId: string;
  fieldId: string;
  fieldName: string;
  type: IssueType;
  severity: IssueSeverity;
  description: string;
  suggestion: string;
  status: IssueStatus;
  standardName?: string;
  createdAt: string;
}

type RectificationStatus = 'pending' | 'in_progress' | 'submitted' | 'approved' | 'rejected';

interface RectificationTask {
  id: string;
  issueId: string;
  issueDescription: string;
  assignee: string;
  assigneeAvatar?: string;
  deadline: string;
  status: RectificationStatus;
  result?: string;
  submittedAt?: string;
  createdAt: string;
  priority: 'high' | 'medium' | 'low';
}
```

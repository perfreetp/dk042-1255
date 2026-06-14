export interface CheckTask {
  id: string;
  name: string;
  projectName: string;
  status: 'pending' | 'running' | 'completed' | 'archived';
  createdAt: string;
  progress: number;
  totalFields: number;
  issueCount: number;
  standardCategories: string[];
  description?: string;
}

export interface DataField {
  id: string;
  taskId: string;
  fieldName: string;
  fieldType: string;
  description: string;
  matchedStandardId?: string;
  matchScore: number;
  matchStatus: 'pending' | 'confirmed' | 'rejected';
  tableName?: string;
  sampleValue?: string;
}

export interface DataStandard {
  id: string;
  standardName: string;
  category: string;
  standardFieldName: string;
  standardType: string;
  valueRange: string;
  namingRule: string;
  description: string;
}

export type IssueType = 'naming' | 'datatype' | 'valuerange' | 'other';
export type IssueSeverity = 'high' | 'medium' | 'low';
export type IssueStatus = 'open' | 'rectifying' | 'resolved' | 'falsepositive';

export interface Issue {
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
  tableName?: string;
}

export type RectificationStatus = 'pending' | 'in_progress' | 'submitted' | 'approved' | 'rejected';

export interface RectificationTask {
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
  fieldName?: string;
}

export type StandardCategory = {
  id: string;
  name: string;
  children?: StandardCategory[];
};

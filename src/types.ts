export interface ModifiedFileInfo {
  path: string;
  status: 'added' | 'modified';
  feature: string;
  summary: string;
}

export interface RepoSummary {
  sourceRepo: string;
  baseCommit: string;
  modifiedFiles: ModifiedFileInfo[];
}

export interface RepoTreeItem {
  name: string;
  path: string;
  type: 'file' | 'dir';
  size?: number;
  status?: string;
}

export interface RepoFilePayload {
  path: string;
  binary: boolean;
  content: string;
  diff: string;
}

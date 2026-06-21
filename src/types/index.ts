// 时间范围类型
export type TimeRange = '24h' | '7d' | 'all';

// 访问状态枚举
export type VisitStatus = 'viewed' | 'previewed' | 'downloaded' | 'unvisited';

// 成员信息
export interface Member {
  id: string;
  name: string;
  avatar: string;
  role: 'leader' | 'member';
  group: string;
  visitStatus: VisitStatus;
  lastVisitTime?: string;
  visitCount: number;
  previewCount: number;
  downloadCount: number;
}

// 文件信息
export interface FileItem {
  id: string;
  name: string;
  type: 'doc' | 'pdf' | 'ppt' | 'excel' | 'image' | 'folder' | 'other';
  size: string;
  updateTime: string;
  folderId?: string;
  path?: string;
  totalMembers: number;
  viewedCount: number;
  previewedCount: number;
  downloadedCount: number;
  unvisitedCount: number;
}

// 文件夹信息
export interface FolderItem {
  id: string;
  name: string;
  fileCount: number;
  updateTime: string;
  cloudDrive: string;
}

// 访问日志
export interface VisitLog {
  id: string;
  memberId: string;
  memberName: string;
  memberAvatar: string;
  action: 'view' | 'preview' | 'download';
  time: string;
  duration?: number;
}

// 提醒记录
export interface ReminderRecord {
  id: string;
  fileId: string;
  fileName: string;
  createTime: string;
  targetMembers: {
    id: string;
    name: string;
    avatar: string;
    hasVisitedAfter: boolean;
    visitTime?: string;
  }[];
  message: string;
  status: 'pending' | 'completed' | 'partial';
}

// 状态统计
export interface StatusStats {
  total: number;
  viewed: number;
  previewed: number;
  downloaded: number;
  unvisited: number;
}

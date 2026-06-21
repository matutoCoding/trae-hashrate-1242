import type { FileItem, FolderItem, VisitLog } from '@/types';

export const mockFolders: FolderItem[] = [
  {
    id: 'f1',
    name: '课题组共享资料',
    fileCount: 24,
    updateTime: '2026-06-22 10:30:00',
    cloudDrive: '百度网盘'
  },
  {
    id: 'f2',
    name: '社团活动文件',
    fileCount: 18,
    updateTime: '2026-06-21 16:00:00',
    cloudDrive: '腾讯微云'
  },
  {
    id: 'f3',
    name: '工作室项目文档',
    fileCount: 32,
    updateTime: '2026-06-20 14:20:00',
    cloudDrive: '阿里云盘'
  }
];

export const mockFiles: FileItem[] = [
  {
    id: 'file1',
    name: '2026暑期科研项目策划案.docx',
    type: 'doc',
    size: '2.4 MB',
    updateTime: '2026-06-22 10:30:00',
    folderId: 'f1',
    totalMembers: 8,
    viewedCount: 3,
    previewedCount: 2,
    downloadedCount: 1,
    unvisitedCount: 2
  },
  {
    id: 'file2',
    name: '组会汇报PPT模板.pptx',
    type: 'ppt',
    size: '5.8 MB',
    updateTime: '2026-06-21 14:00:00',
    folderId: 'f1',
    totalMembers: 8,
    viewedCount: 5,
    previewedCount: 1,
    downloadedCount: 3,
    unvisitedCount: 1
  },
  {
    id: 'file3',
    name: '课程论文参考文献.pdf',
    type: 'pdf',
    size: '8.2 MB',
    updateTime: '2026-06-20 09:15:00',
    folderId: 'f1',
    totalMembers: 8,
    viewedCount: 4,
    previewedCount: 2,
    downloadedCount: 2,
    unvisitedCount: 0
  },
  {
    id: 'file4',
    name: '实验数据汇总表.xlsx',
    type: 'excel',
    size: '1.2 MB',
    updateTime: '2026-06-19 16:30:00',
    folderId: 'f1',
    totalMembers: 8,
    viewedCount: 6,
    previewedCount: 0,
    downloadedCount: 4,
    unvisitedCount: 2
  },
  {
    id: 'file5',
    name: '社团招新活动策划.docx',
    type: 'doc',
    size: '1.8 MB',
    updateTime: '2026-06-21 16:00:00',
    folderId: 'f2',
    totalMembers: 12,
    viewedCount: 8,
    previewedCount: 2,
    downloadedCount: 3,
    unvisitedCount: 2
  },
  {
    id: 'file6',
    name: '比赛报名表.xlsx',
    type: 'excel',
    size: '560 KB',
    updateTime: '2026-06-22 08:00:00',
    folderId: 'f2',
    totalMembers: 12,
    viewedCount: 5,
    previewedCount: 1,
    downloadedCount: 1,
    unvisitedCount: 6
  },
  {
    id: 'file7',
    name: '项目需求文档v2.0.pdf',
    type: 'pdf',
    size: '3.5 MB',
    updateTime: '2026-06-20 14:20:00',
    folderId: 'f3',
    totalMembers: 6,
    viewedCount: 6,
    previewedCount: 2,
    downloadedCount: 5,
    unvisitedCount: 0
  },
  {
    id: 'file8',
    name: 'UI设计稿.png',
    type: 'image',
    size: '4.2 MB',
    updateTime: '2026-06-21 11:00:00',
    folderId: 'f3',
    totalMembers: 6,
    viewedCount: 4,
    previewedCount: 3,
    downloadedCount: 2,
    unvisitedCount: 1
  }
];

export const mockVisitLogs: VisitLog[] = [
  {
    id: 'log1',
    memberId: '1',
    memberName: '张明',
    memberAvatar: 'https://picsum.photos/id/64/200/200',
    action: 'view',
    time: '2026-06-21 14:30:00',
    duration: 300
  },
  {
    id: 'log2',
    memberId: '1',
    memberName: '张明',
    memberAvatar: 'https://picsum.photos/id/64/200/200',
    action: 'download',
    time: '2026-06-21 14:35:00'
  },
  {
    id: 'log3',
    memberId: '2',
    memberName: '李华',
    memberAvatar: 'https://picsum.photos/id/91/200/200',
    action: 'view',
    time: '2026-06-21 16:20:00',
    duration: 180
  },
  {
    id: 'log4',
    memberId: '3',
    memberName: '王芳',
    memberAvatar: 'https://picsum.photos/id/177/200/200',
    action: 'preview',
    time: '2026-06-20 10:15:00',
    duration: 60
  },
  {
    id: 'log5',
    memberId: '4',
    memberName: '赵强',
    memberAvatar: 'https://picsum.photos/id/338/200/200',
    action: 'download',
    time: '2026-06-21 09:00:00'
  },
  {
    id: 'log6',
    memberId: '7',
    memberName: '孙婷',
    memberAvatar: 'https://picsum.photos/id/1027/200/200',
    action: 'view',
    time: '2026-06-22 08:30:00',
    duration: 420
  }
];

export const getFilesByFolderId = (folderId: string): FileItem[] => {
  return mockFiles.filter(f => f.folderId === folderId);
};

export const getFileById = (id: string): FileItem | undefined => {
  return mockFiles.find(f => f.id === id);
};

export const getVisitLogsByFileId = (fileId: string): VisitLog[] => {
  return mockVisitLogs;
};

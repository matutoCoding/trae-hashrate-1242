import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { FileItem, Member, VisitLog, ReminderRecord, VisitStatus, TimeRange } from '@/types';
import { mockFiles, mockFolders } from '@/data/files';
import { mockMembers } from '@/data/members';
import { mockReminders } from '@/data/reminders';
import { isTimeInRange, getMemberStatusInRange, getDaysSinceLastVisit } from '@/utils';

// 按文件存储的成员状态
interface FileMemberStatus {
  memberId: string;
  visitStatus: VisitStatus;
  lastVisitTime?: string;
  visitCount: number;
  previewCount: number;
  downloadCount: number;
}

// 按文件存储的访问日志
interface FileVisitLogs {
  [fileId: string]: VisitLog[];
}

// 按文件存储的成员状态
interface FileMembersStatus {
  [fileId: string]: FileMemberStatus[];
}

interface AppState {
  // 基础数据
  files: FileItem[];
  folders: typeof mockFolders;
  allMembers: Member[];

  // 按文件存储的成员状态
  fileMembersStatus: FileMembersStatus;

  // 按文件存储的访问日志
  fileVisitLogs: FileVisitLogs;

  // 提醒记录
  reminders: ReminderRecord[];

  // 当前选中的文件
  currentFileId: string | null;

  // Actions
  setCurrentFile: (fileId: string | null) => void;
  getFileById: (fileId: string) => FileItem | undefined;
  getMembersByFileId: (fileId: string) => (Member & FileMemberStatus)[];
  getVisitLogsByFileId: (fileId: string) => VisitLog[];
  getVisitLogsByFileAndMember: (fileId: string, memberId: string) => VisitLog[];
  addReminder: (reminder: Omit<ReminderRecord, 'id' | 'createTime'>) => void;
  markMemberVisitedAfterReminder: (reminderId: string, memberId: string, visitTime: string) => void;

  // 按时间范围筛选的方法
  getVisitLogsByFileIdAndTimeRange: (fileId: string, timeRange: TimeRange) => VisitLog[];
  getMembersByFileIdAndTimeRange: (fileId: string, timeRange: TimeRange) => (Member & FileMemberStatus & { daysSinceLastVisit: number; lastVisitTimeInRange?: string })[];
  getMembersForReminder: (fileId: string, options?: { includeUnvisited?: boolean; includeNotVisitedForDays?: number; timeRange?: TimeRange }) => (Member & FileMemberStatus & { daysSinceLastVisit: number })[];
  getReminderById: (reminderId: string) => ReminderRecord | undefined;
}

// 初始化每个文件的成员状态
const initFileMembersStatus = (): FileMembersStatus => {
  const statusMap: FileMembersStatus = {};

  mockFiles.forEach(file => {
    // 为每个文件生成独立的成员状态，略有不同
    const seed = file.id.charCodeAt(file.id.length - 1);
    // 是否全员已查看（不允许有未访问成员）
    const allMustBeViewed = file.unvisitedCount === 0;

    statusMap[file.id] = mockMembers.map((member, index) => {
      // 根据文件和成员生成不同的状态
      const pseudoRandom = (seed * (index + 1) * 7) % 100;

      let visitStatus: VisitStatus;
      let visitCount = 0;
      let previewCount = 0;
      let downloadCount = 0;
      let lastVisitTime: string | undefined;

      // 调整随机值，确保全员已查看的文件没有 unvisited
      let adjustedRandom = pseudoRandom;
      if (allMustBeViewed && adjustedRandom >= 80) {
        adjustedRandom = adjustedRandom % 80;
      }

      // 参考文献数据，但为每个文件生成不同的分布
      if (adjustedRandom < 40) {
        visitStatus = 'viewed';
        visitCount = Math.floor(adjustedRandom / 10) + 1;
        previewCount = Math.floor(adjustedRandom / 15);
        downloadCount = Math.floor(adjustedRandom / 30);
        const daysAgo = (adjustedRandom % 3) + 1;
        const hoursAgo = (adjustedRandom * 3) % 24;
        lastVisitTime = `2026-06-${22 - daysAgo} ${String(hoursAgo).padStart(2, '0')}:${String((adjustedRandom * 5) % 60).padStart(2, '0')}:00`;
      } else if (adjustedRandom < 65) {
        visitStatus = 'previewed';
        previewCount = Math.floor((adjustedRandom - 40) / 8) + 1;
        visitCount = 0;
        downloadCount = 0;
        const daysAgo = ((adjustedRandom - 40) % 2) + 1;
        const hoursAgo = (adjustedRandom * 4) % 24;
        lastVisitTime = `2026-06-${22 - daysAgo} ${String(hoursAgo).padStart(2, '0')}:${String((adjustedRandom * 7) % 60).padStart(2, '0')}:00`;
      } else if (adjustedRandom < 80) {
        visitStatus = 'downloaded';
        downloadCount = 1;
        visitCount = 0;
        previewCount = 0;
        const daysAgo = ((adjustedRandom - 65) % 2) + 1;
        const hoursAgo = (adjustedRandom * 2) % 24;
        lastVisitTime = `2026-06-${22 - daysAgo} ${String(hoursAgo).padStart(2, '0')}:${String((adjustedRandom * 3) % 60).padStart(2, '0')}:00`;
      } else {
        visitStatus = 'unvisited';
        lastVisitTime = undefined;
      }

      return {
        memberId: member.id,
        visitStatus,
        lastVisitTime,
        visitCount,
        previewCount,
        downloadCount
      };
    });
  });

  return statusMap;
};

// 初始化每个文件的访问日志
const initFileVisitLogs = (): FileVisitLogs => {
  const logsMap: FileVisitLogs = {};

  mockFiles.forEach(file => {
    const seed = file.id.charCodeAt(file.id.length - 1);
    const logs: VisitLog[] = [];
    let logId = 0;

    const fileMemberStatus = initFileMembersStatus()[file.id];

    fileMemberStatus.forEach(status => {
      const member = mockMembers.find(m => m.id === status.memberId);
      if (!member) return;

      const memberPseudoRandom = (seed * (parseInt(status.memberId) + 1) * 7) % 100;

      // 生成查看记录
      for (let i = 0; i < status.visitCount; i++) {
        const daysAgo = (memberPseudoRandom + i * 5) % 3;
        const hoursAgo = (memberPseudoRandom * 3 + i * 4) % 24;
        const minutesAgo = (memberPseudoRandom * 7 + i * 11) % 60;
        const duration = (memberPseudoRandom + i * 60) % 300 + 60;

        logs.push({
          id: `${file.id}-log-${logId++}`,
          memberId: status.memberId,
          memberName: member.name,
          memberAvatar: member.avatar,
          action: 'view',
          time: `2026-06-${22 - daysAgo} ${String(hoursAgo).padStart(2, '0')}:${String(minutesAgo).padStart(2, '0')}:00`,
          duration
        });
      }

      // 生成预览记录
      for (let i = 0; i < status.previewCount; i++) {
        const daysAgo = (memberPseudoRandom + i * 3) % 3;
        const hoursAgo = (memberPseudoRandom * 2 + i * 5) % 24;
        const minutesAgo = (memberPseudoRandom * 5 + i * 7) % 60;
        const duration = (memberPseudoRandom + i * 30) % 120 + 30;

        logs.push({
          id: `${file.id}-log-${logId++}`,
          memberId: status.memberId,
          memberName: member.name,
          memberAvatar: member.avatar,
          action: 'preview',
          time: `2026-06-${22 - daysAgo} ${String(hoursAgo).padStart(2, '0')}:${String(minutesAgo).padStart(2, '0')}:00`,
          duration
        });
      }

      // 生成下载记录
      for (let i = 0; i < status.downloadCount; i++) {
        const daysAgo = (memberPseudoRandom + i * 4) % 3;
        const hoursAgo = (memberPseudoRandom * 4 + i * 6) % 24;
        const minutesAgo = (memberPseudoRandom * 6 + i * 9) % 60;

        logs.push({
          id: `${file.id}-log-${logId++}`,
          memberId: status.memberId,
          memberName: member.name,
          memberAvatar: member.avatar,
          action: 'download',
          time: `2026-06-${22 - daysAgo} ${String(hoursAgo).padStart(2, '0')}:${String(minutesAgo).padStart(2, '0')}:00`
        });
      }
    });

    // 按时间倒序排列
    logs.sort((a, b) => new Date(b.time).getTime() - new Date(a.time).getTime());
    logsMap[file.id] = logs;
  });

  return logsMap;
};

// 初始化文件的统计数据
const initFilesWithStats = (): FileItem[] => {
  const memberStatusMap = initFileMembersStatus();

  return mockFiles.map(file => {
    const memberStatuses = memberStatusMap[file.id] || [];

    const viewedCount = memberStatuses.filter(s => s.visitStatus === 'viewed').length;
    const previewedCount = memberStatuses.filter(s => s.visitStatus === 'previewed').length;
    const downloadedCount = memberStatuses.filter(s => s.visitStatus === 'downloaded').length;
    const unvisitedCount = memberStatuses.filter(s => s.visitStatus === 'unvisited').length;

    return {
      ...file,
      totalMembers: mockMembers.length,
      viewedCount,
      previewedCount,
      downloadedCount,
      unvisitedCount
    };
  });
};

export const useAppStore = create<AppState>()(
  persist(
    (set, get) => ({
      files: initFilesWithStats(),
      folders: mockFolders,
      allMembers: mockMembers,
      fileMembersStatus: initFileMembersStatus(),
      fileVisitLogs: initFileVisitLogs(),
      reminders: mockReminders,
      currentFileId: null,

      setCurrentFile: (fileId) => set({ currentFileId: fileId }),

      getFileById: (fileId) => {
        return get().files.find(f => f.id === fileId);
      },

      getMembersByFileId: (fileId) => {
        const state = get();
        const memberStatuses = state.fileMembersStatus[fileId] || [];
        return memberStatuses
          .map(status => {
            const member = state.allMembers.find(m => m.id === status.memberId);
            if (!member) return null;
            return {
              ...member,
              ...status
            };
          })
          .filter(Boolean) as (Member & FileMemberStatus)[];
      },

      getVisitLogsByFileId: (fileId) => {
        return get().fileVisitLogs[fileId] || [];
      },

      getVisitLogsByFileAndMember: (fileId, memberId) => {
        const logs = get().fileVisitLogs[fileId] || [];
        return logs.filter(log => log.memberId === memberId);
      },

      addReminder: (reminder) => {
        const newReminder: ReminderRecord = {
          ...reminder,
          id: `r${Date.now()}`,
          createTime: new Date().toISOString().replace('T', ' ').slice(0, 19)
        };
        set(state => ({
          reminders: [newReminder, ...state.reminders]
        }));
      },

      markMemberVisitedAfterReminder: (reminderId, memberId, visitTime) => {
        set(state => ({
          reminders: state.reminders.map(r => {
            if (r.id !== reminderId) return r;
            return {
              ...r,
              targetMembers: r.targetMembers.map(m =>
                m.id === memberId
                  ? { ...m, hasVisitedAfter: true, visitTime }
                  : m
              ),
              status: r.targetMembers.every(m => m.id === memberId || m.hasVisitedAfter)
                ? 'completed'
                : 'partial'
            };
          })
        }));
      },

      // 按时间范围筛选访问日志
      getVisitLogsByFileIdAndTimeRange: (fileId, timeRange) => {
        const logs = get().fileVisitLogs[fileId] || [];
        if (timeRange === 'all') return logs;
        return logs.filter(log => isTimeInRange(log.time, timeRange));
      },

      // 按时间范围获取成员状态（根据范围内的日志重新计算状态）
      getMembersByFileIdAndTimeRange: (fileId, timeRange) => {
        const state = get();
        const allLogs = state.fileVisitLogs[fileId] || [];
        const memberStatuses = state.fileMembersStatus[fileId] || [];

        return memberStatuses
          .map(status => {
            const member = state.allMembers.find(m => m.id === status.memberId);
            if (!member) return null;

            const memberLogsInRange = allLogs.filter(
              log => log.memberId === status.memberId && isTimeInRange(log.time, timeRange)
            );

            const statusInRange = getMemberStatusInRange(status, memberLogsInRange);

            const daysSinceLastVisit = getDaysSinceLastVisit(status.lastVisitTime);

            let lastVisitTimeInRange: string | undefined;
            if (timeRange !== 'all' && memberLogsInRange.length > 0) {
              const sorted = [...memberLogsInRange].sort(
                (a, b) => new Date(b.time).getTime() - new Date(a.time).getTime()
              );
              lastVisitTimeInRange = sorted[0].time;
            }

            return {
              ...member,
              ...status,
              ...statusInRange,
              lastVisitTime: status.lastVisitTime,
              lastVisitTimeInRange,
              daysSinceLastVisit
            };
          })
          .filter(Boolean) as (Member & FileMemberStatus & { daysSinceLastVisit: number; lastVisitTimeInRange?: string })[];
      },

      // 获取提醒对象（支持未访问和超过N天未访问双维度筛选，支持按时间范围）
      getMembersForReminder: (fileId, options = {}) => {
        const { includeUnvisited = true, includeNotVisitedForDays, timeRange } = options;
        const state = get();

        let memberStatuses = state.fileMembersStatus[fileId] || [];
        let allLogs = state.fileVisitLogs[fileId] || [];

        if (timeRange && timeRange !== 'all') {
          allLogs = allLogs.filter(log => isTimeInRange(log.time, timeRange));

          memberStatuses = memberStatuses.map(status => {
            const memberLogsInRange = allLogs.filter(
              log => log.memberId === status.memberId
            );
            const statusInRange = getMemberStatusInRange(status, memberLogsInRange);
            let rangeLastVisit: string | undefined;
            if (memberLogsInRange.length > 0) {
              const sorted = [...memberLogsInRange].sort(
                (a, b) => new Date(b.time).getTime() - new Date(a.time).getTime()
              );
              rangeLastVisit = sorted[0].time;
            }
            return {
              ...status,
              ...statusInRange,
              lastVisitTime: rangeLastVisit || undefined
            };
          });
        }

        return memberStatuses
          .map(status => {
            const member = state.allMembers.find(m => m.id === status.memberId);
            if (!member) return null;

            const daysSinceLastVisit = getDaysSinceLastVisit(status.lastVisitTime);

            let shouldInclude = false;

            if (includeUnvisited && status.visitStatus === 'unvisited') {
              shouldInclude = true;
            }

            if (includeNotVisitedForDays !== undefined && status.visitStatus !== 'unvisited') {
              if (daysSinceLastVisit >= includeNotVisitedForDays) {
                shouldInclude = true;
              }
            }

            if (!shouldInclude) return null;

            return {
              ...member,
              ...status,
              daysSinceLastVisit
            };
          })
          .filter(Boolean) as (Member & FileMemberStatus & { daysSinceLastVisit: number })[];
      },

      // 根据ID获取提醒详情
      getReminderById: (reminderId) => {
        return get().reminders.find(r => r.id === reminderId);
      }
    }),
    {
      name: 'team-file-log-storage',
      partialize: (state) => ({
        reminders: state.reminders,
        fileMembersStatus: state.fileMembersStatus,
        fileVisitLogs: state.fileVisitLogs
      }),
      merge: (persisted, current) => {
        const saved = persisted as Partial<AppState>;
        if (!saved) return current;

        const freshStatus = initFileMembersStatus();
        const freshLogs = initFileVisitLogs();

        const correctedStatus: FileMembersStatus = {};
        const correctedLogs: FileVisitLogs = {};

        const allFileIds = new Set([
          ...Object.keys(freshStatus),
          ...(saved.fileMembersStatus ? Object.keys(saved.fileMembersStatus) : [])
        ]);

        allFileIds.forEach(fileId => {
          const freshFileStatus = freshStatus[fileId];
          const savedFileStatus = saved.fileMembersStatus?.[fileId];

          if (freshFileStatus) {
            const freshUnvisited = freshFileStatus.filter(s => s.visitStatus === 'unvisited').length;
            if (savedFileStatus) {
              const savedUnvisited = savedFileStatus.filter(s => s.visitStatus === 'unvisited').length;
              if (freshUnvisited === 0 && savedUnvisited > 0) {
                correctedStatus[fileId] = freshFileStatus;
                correctedLogs[fileId] = freshLogs[fileId] || [];
              } else {
                correctedStatus[fileId] = savedFileStatus;
                correctedLogs[fileId] = saved.fileVisitLogs?.[fileId] || freshLogs[fileId] || [];
              }
            } else {
              correctedStatus[fileId] = freshFileStatus;
              correctedLogs[fileId] = freshLogs[fileId] || [];
            }
          } else if (savedFileStatus) {
            correctedStatus[fileId] = savedFileStatus;
            correctedLogs[fileId] = saved.fileVisitLogs?.[fileId] || [];
          }
        });

        return {
          ...current,
          reminders: saved.reminders || current.reminders,
          fileMembersStatus: { ...current.fileMembersStatus, ...correctedStatus },
          fileVisitLogs: { ...current.fileVisitLogs, ...correctedLogs }
        };
      }
    }
  )
);
